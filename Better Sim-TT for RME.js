(function () {
    'use strict';

    const GQL = 'https://sim-ticketing-graphql-fleet.corp.amazon.com/graphql';
    const EAM = 'https://eu1.eam.hxgnsmartcloud.com/web/base/logindisp?tenant=AMAZONRMEEU_PRD&FROMEMAIL=YES&SYSTEM_FUNCTION_NAME=WSJOBS&USER_FUNCTION_NAME=WSJOBS&workordernum=';

    const uuidMap = {};
    const woCache = {};
    const pending = {};

    GM_addStyle(`
        .wo-btn-group {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            margin-left: 8px;
            vertical-align: middle;
        }
        .wo-btn {
            display: inline-flex;
            align-items: center;
            padding: 1px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            font-family: 'Courier New', monospace;
            cursor: pointer;
            text-decoration: none !important;
            white-space: nowrap;
            transition: all 0.15s;
            line-height: 18px;
        }
        .wo-btn-eam {
            background: rgba(0,212,255,0.12);
            border: 1px solid #00d4ff;
            color: #00d4ff !important;
            box-shadow: 0 0 6px rgba(0,212,255,0.2);
        }
        .wo-btn-eam:hover {
            background: rgba(0,212,255,0.28) !important;
            box-shadow: 0 0 14px rgba(0,212,255,0.4);
        }
        .wo-btn-copy {
            background: rgba(0,255,136,0.10);
            border: 1px solid #00ff88;
            color: #00ff88 !important;
        }
        .wo-btn-copy:hover { background: rgba(0,255,136,0.25) !important; }
        .wo-btn-copy.ok { background: rgba(0,255,136,0.35) !important; color: #fff !important; }
        .wo-btn-loading {
            background: rgba(80,80,80,0.15);
            border: 1px solid #555;
            color: #777 !important;
            pointer-events: none;
            animation: woPulse 1s infinite;
        }
        .wo-btn-none {
            background: transparent;
            border: 1px dashed #444;
            color: #555 !important;
            pointer-events: none;
        }
        @keyframes woPulse {
            0%,100% { opacity:.4; } 50% { opacity:1; }
        }
    `);

    const origFetch = unsafeWindow.fetch;
    unsafeWindow.fetch = async function (...args) {
        const req = args[0];
        const url = req instanceof Request ? req.url : (typeof req === 'string' ? req : '');
        const resp = await origFetch.apply(this, args);

        if (url.includes('graphql')) {
            try {
                resp.clone().json().then(data => {
                    const arr = Array.isArray(data) ? data : [data];
                    arr.forEach(item => {
                        const docs = item?.data?.queryIssues?.documents || [];
                        docs.forEach(doc => {
                            if (doc?.id && doc?.shortId) {
                                uuidMap[doc.shortId] = doc.id;
                                if (pending[doc.shortId]) {
                                    pending[doc.shortId].forEach(cb => cb(doc.id));
                                    delete pending[doc.shortId];
                                }
                            }
                        });
                    });
                }).catch(() => {});
            } catch (e) {}
        }
        return resp;
    };

    function getUUID(shortId, cb) {
        if (uuidMap[shortId]) { cb(uuidMap[shortId]); return; }
        if (!pending[shortId]) pending[shortId] = [];
        pending[shortId].push(cb);
        setTimeout(() => {
            if (!pending[shortId]) return;
            const idx = pending[shortId].indexOf(cb);
            if (idx > -1) pending[shortId].splice(idx, 1);
            cb(null);
        }, 8000);
    }

    async function fetchWO(uuid) {
        try {
            const resp = await unsafeWindow.fetch(GQL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify([{
                    operationName: 'threadComments',
                    variables: {
                        threadId: `updates:${uuid}`,
                        start: 0,
                        rows: 100,
                        sort: 'newest_first'
                    },
                    query: `query threadComments($threadId: String!, $start: Int, $rows: Int, $sort: CommentSortOrder) {
                        thread(id: $threadId) {
                            id
                            totalCount
                            conversation(start: $start, rows: $rows, sort: $sort) {
                                id
                                message
                                __typename
                            }
                            __typename
                        }
                    }`
                }])
            });
            const data = await resp.json();
            const convs = data?.[0]?.data?.thread?.conversation || [];
            for (const c of convs) {
                const msg = c.message || '';
                const m1 = msg.match(/workordernum=(\d+)/);
                if (m1) return m1[1];
                const m2 = msg.match(/EAM\(APM\)[^0-9]*(\d{8,})/i);
                if (m2) return m2[1];
                const m3 = msg.match(/number\s*:\s*(\d{8,})/i);
                if (m3) return m3[1];
                const m4 = msg.match(/work\s*order[^0-9]*(\d{8,})/i);
                if (m4) return m4[1];
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    function injectButtons(row, shortId) {
        if (row.querySelector('.wo-btn-group')) return;

        let titleCell = null;
        for (const td of row.querySelectorAll('td')) {
            if (td.querySelector(`a[href*="${shortId}"]`)) { titleCell = td; break; }
        }
        if (!titleCell) {
            const tds = row.querySelectorAll('td');
            if (tds.length >= 4) titleCell = tds[3];
        }
        if (!titleCell) return;

        const group = document.createElement('span');
        group.className = 'wo-btn-group';
        group.innerHTML = `<span class="wo-btn wo-btn-loading">⏳</span>`;
        titleCell.appendChild(group);

        if (woCache[shortId] && woCache[shortId] !== 'loading') {
            renderButtons(group, woCache[shortId]);
            return;
        }

        woCache[shortId] = 'loading';

        getUUID(shortId, async (uuid) => {
            if (!uuid) {
                woCache[shortId] = null;
                renderButtons(group, null);
                return;
            }
            const wo = await fetchWO(uuid);
            woCache[shortId] = wo ? { wo, eamUrl: EAM + wo } : null;
            renderButtons(group, woCache[shortId]);
        });
    }

    function renderButtons(group, result) {
        group.innerHTML = '';
        if (!result) {
            const b = document.createElement('span');
            b.className = 'wo-btn wo-btn-none';
            b.textContent = '— WO';
            group.appendChild(b);
            return;
        }

        const eam = document.createElement('a');
        eam.className = 'wo-btn wo-btn-eam';
        eam.href = result.eamUrl;
        eam.target = '_blank';
        eam.rel = 'noopener noreferrer';
        eam.textContent = `🔗 WO ${result.wo}`;
        eam.title = `Work Order ${result.wo} in EAM öffnen`;
        eam.addEventListener('click', e => e.stopPropagation());

        const cp = document.createElement('button');
        cp.className = 'wo-btn wo-btn-copy';
        cp.textContent = '📋';
        cp.title = `WO ${result.wo} kopieren`;
        cp.addEventListener('click', e => {
            e.stopPropagation();
            e.preventDefault();
            GM_setClipboard(result.wo, 'text');
            cp.textContent = '✓';
            cp.classList.add('ok');
            setTimeout(() => { cp.textContent = '📋'; cp.classList.remove('ok'); }, 1800);
        });

        group.appendChild(eam);
        group.appendChild(cp);
    }

    function getShortId(row) {
        for (const a of row.querySelectorAll('a[href]')) {
            const m = a.href.match(/\/([A-Z]\d{6,})/i);
            if (m) return m[1].toUpperCase();
        }
        return null;
    }

    function processRows() {
        if (window.location.pathname.match(/^\/[A-Z]\d{6,}/i)) return;
        document.querySelectorAll(
            'tr[data-item-index], tr[data-selection-item="item"]'
        ).forEach(row => {
            if (row.dataset.woAttached) return;
            row.dataset.woAttached = '1';
            row.addEventListener('mouseenter', () => {
                const id = getShortId(row);
                if (id) injectButtons(row, id);
            });
        });
    }

    let t = null;
    new MutationObserver(() => { clearTimeout(t); t = setTimeout(processRows, 200); })
        .observe(document.body, { childList: true, subtree: true });

    setTimeout(processRows, 800);
    setTimeout(processRows, 2200);

    // ==================== Auto Refresher ====================

    let refreshInterval = null;
    const savedSecondsKey = 'autoRefresherInterval';
    const savedPositionKey = 'countdownPosition';

    let savedSeconds = GM_getValue(savedSecondsKey, 0);
    let savedPosition = GM_getValue(savedPositionKey, { top: '10px', left: '50%' });

    let countdown = savedSeconds;
    let isPaused = false;
    let configuredSeconds = savedSeconds;

    const countdownDisplay = document.createElement('div');
    countdownDisplay.style.position = 'fixed';
    countdownDisplay.style.top = savedPosition.top;
    countdownDisplay.style.left = savedPosition.left;
    countdownDisplay.style.transform = 'translate(-50%, 0)';
    countdownDisplay.style.background = 'rgba(0, 0, 0, 0.7)';
    countdownDisplay.style.color = 'white';
    countdownDisplay.style.padding = '5px 14px';
    countdownDisplay.style.borderRadius = '5px';
    countdownDisplay.style.fontSize = '14px';
    countdownDisplay.style.zIndex = '9999';
    countdownDisplay.style.cursor = 'move';
    document.body.appendChild(countdownDisplay);

    function updateCountdownDisplay() {
        if (countdown > 0) {
            countdownDisplay.textContent = isPaused
                ? `⏸ Paused (${countdown}s)`
                : `Refresh in: ${countdown}s`;
            countdownDisplay.style.background = isPaused
                ? 'rgba(180, 100, 0, 0.85)'
                : 'rgba(0, 0, 0, 0.7)';
        } else {
            countdownDisplay.textContent = '';
            countdownDisplay.style.background = 'rgba(0, 0, 0, 0.7)';
        }
    }

    function isInputFocused() {
        const tag = document.activeElement?.tagName?.toLowerCase();
        const isEditable = document.activeElement?.isContentEditable;
        return tag === 'input' || tag === 'textarea' || tag === 'select' || isEditable;
    }

    function startRefresher(seconds, showAlert = true) {
        if (refreshInterval) clearInterval(refreshInterval);

        if (seconds > 0) {
            configuredSeconds = seconds;
            countdown = seconds;
            isPaused = false;
            updateCountdownDisplay();

            refreshInterval = setInterval(() => {
                if (isInputFocused()) {
                    if (!isPaused) {
                        isPaused = true;
                        updateCountdownDisplay();
                    }
                    return;
                }

                if (isPaused) {
                    isPaused = false;
                    updateCountdownDisplay();
                }

                countdown--;
                updateCountdownDisplay();

                if (countdown <= 0) location.reload();
            }, 1000);

            GM_setValue(savedSecondsKey, seconds);
            if (showAlert) alert(`Auto-Refresher aktiviert: ${seconds}s`);
        } else {
            countdownDisplay.textContent = '';
            alert('Auto-Refresher deaktiviert.');
        }
    }

    function handleRefresherInput() {
        const input = prompt(
            'Gib die Sekunden für den Auto-Refresher ein (0 zum Deaktivieren):',
            savedSeconds > 0 ? savedSeconds.toString() : '180'
        );
        const seconds = parseInt(input, 10);
        if (isNaN(seconds) || seconds < 0) return alert('Ungültige Eingabe.');

        if (seconds === 0) {
            clearInterval(refreshInterval);
            refreshInterval = null;
            isPaused = false;
            GM_setValue(savedSecondsKey, 0);
            countdownDisplay.textContent = '';
            alert('Auto-Refresher deaktiviert.');
        } else {
            savedSeconds = seconds;
            startRefresher(seconds);
        }
    }

    function makeDraggable(element) {
        let offsetX = 0, offsetY = 0, isDragging = false;

        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            element.style.left = `${e.clientX - offsetX}px`;
            element.style.top = `${e.clientY - offsetY}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                GM_setValue(savedPositionKey, {
                    top: element.style.top,
                    left: element.style.left,
                });
            }
            isDragging = false;
        });
    }

    makeDraggable(countdownDisplay);

    if (savedSeconds > 0) startRefresher(savedSeconds, false);

    document.addEventListener('keydown', (event) => {
        if (event.altKey && event.key === '1') handleRefresherInput();
    });

    // ==================== Assign to Me (Alt+2) ====================

    function assignToMe() {
        const assigneeTrigger = document.querySelector('div[aria-label^="Assignee options"]');
        if (assigneeTrigger) {
            assigneeTrigger.click();
            let attempts = 0;
            const interval = setInterval(() => {
                attempts++;
                const meButton = document.querySelector('button[data-id="me"]');
                if (meButton) {
                    meButton.click();
                    clearInterval(interval);
                } else if (attempts > 10) {
                    clearInterval(interval);
                    console.log('Assign to Me: Button nicht gefunden');
                }
            }, 50);
        } else {
            console.log('Assign to Me: Dropdown nicht gefunden');
        }
    }

    // ==================== Copy Buttons ====================

    function copyTitleAndURL() {
        const titleElem = document.querySelector('.title-container h1, .title-container span');
        const btn = document.getElementById('tcopybutton');
        if (!titleElem || !btn) return;
        const text = `${titleElem.innerText} (${document.URL})`;
        GM_setClipboard(text, 'text');
        btn.style.backgroundColor = 'yellow';
    }

    function getWorkOrderNumber() {
        const woLink = document.querySelector('a[href*="workordernum="]');
        if (woLink) {
            const match = woLink.href.match(/workordernum=(\d+)/);
            if (match) return match[1];
        }
        for (const strong of document.querySelectorAll('.sim-commentCardPrimary strong')) {
            const text = strong.textContent.trim();
            if (/^\d{8,}$/.test(text)) return text;
        }
        const legacyMatch = document.body.innerText.match(
            /(?:work order number:|EAM\(APM\) work order number:)\s*(\d+)/i
        );
        if (legacyMatch) return legacyMatch[1];
        return null;
    }

    function copyWorkOrderNumber() {
        const wo = getWorkOrderNumber();
        const btn = document.getElementById('wocopybutton');
        if (!wo || !btn) return console.log('WO not found');
        GM_setClipboard(wo, 'text');
        btn.style.backgroundColor = 'yellow';
    }

    function openWorkOrderLink() {
        const wo = getWorkOrderNumber();
        if (!wo) return console.log('WO not found');
        const url = `https://eu1.eam.hxgnsmartcloud.com/web/base/logindisp?tenant=AMAZONRMEEU_PRD&FROMEMAIL=YES&SYSTEM_FUNCTION_NAME=WSJOBS&USER_FUNCTION_NAME=WSJOBS&workordernum=${wo}`;
        window.open(url, '_blank');
    }

    function insertButtons(editIssueElem) {
        if (document.getElementById('tcopybutton')) return;

        const wrapper = document.createElement('div');
        wrapper.style.display = 'inline-flex';
        wrapper.style.gap = '5px';
        wrapper.style.marginRight = '8px';

        const makeBtn = (id, text, handler) => {
            const btn = document.createElement('button');
            btn.id = id;
            btn.textContent = text;
            btn.className = 'awsui-button awsui-button-variant-normal awsui-hover-child-icons';
            btn.addEventListener('click', handler);
            return btn;
        };

        wrapper.appendChild(makeBtn('tcopybutton', 'Copy Title & URL', copyTitleAndURL));
        wrapper.appendChild(makeBtn('wocopybutton', 'Copy Work Order', copyWorkOrderNumber));
        wrapper.appendChild(makeBtn('wolinkbutton', 'Open WO Link', openWorkOrderLink));
        editIssueElem.parentNode.insertBefore(wrapper, editIssueElem);
    }

    const observer = new MutationObserver(() => {
        const editButton = Array.from(document.querySelectorAll('button')).find(
            (b) => b.textContent.trim() === 'Edit'
        );
        if (editButton) {
            const editIssueElem = editButton.closest('.edit-issue');
            if (editIssueElem) insertButtons(editIssueElem);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // ==================== Correspondence Alt+3 / Alt+4 ====================

    function fillAndSubmitResponse(responseText) {
        const commentTextarea = $('#sim-communicationActions--createComment');
        commentTextarea.focus();
        document.execCommand('insertText', false, responseText);
        $('.sim-communicationActions--addCommentButton').click();
    }

    function getResponseTextFromTitle(title) {
        const t = title.toLowerCase();

        // ── DESTACKER (1279x + Typos) ──────────────────────────────────────
        if (/destacker|destecker|destucker|destauker|destaker|dastaker|dasticker|desteker|descaker|destaucker|distek|distak|disteck|stacker/.test(t))
            return 'We restarted the Destacker. The Station is operational again.\nBest regards.';

        // ── DRIVE (822x) ───────────────────────────────────────────────────
        if (/\bdrive\b|\bdu\b/.test(t)) {
            if (/charger|faulted/.test(t))
                return 'We removed the Drive from the Charger and reset it. The Drive is operational again.\nBest regards.';
            if (/out of service|wont go in service|not going in service/.test(t))
                return 'We put the Drive back in service. The Drive is operational again.\nBest regards.';
            if (/stuck|item|obstruction|klemmt/.test(t))
                return 'We removed the obstruction from the Drive. The Drive is operational again.\nBest regards.';
            if (/wlan|wifi|connect|verbindung/.test(t))
                return 'We fixed the WLAN connection of the Drive. The Drive is operational again.\nBest regards.';
            return 'We fixed the Drive. The Drive is operational again.\nBest regards.';
        }

        // ── FIDUCIAL (616x) ────────────────────────────────────────────────
        if (/fiducial|fiducal/.test(t))
            return 'We replaced the Fiducial. The Floor is operational again.\nBest regards.';

        // ── POD / BIN / DIRTY (604x) ───────────────────────────────────────
        if (/\bpod\b/.test(t)) {
            if (/dirty|clean|reinigung|binclean/.test(t))
                return 'We cleaned the POD/Bin. The POD is operational again.\nBest regards.';
            if (/hook|tilted|kippe/.test(t))
                return 'We fixed the POD hook. The POD is operational again.\nBest regards.';
            return 'We fixed the POD. The POD is operational again.\nBest regards.';
        }
        if (/dirty|bin reinigung|binreinigung|binclean/.test(t))
            return 'We cleaned the POD/Bin. The POD is operational again.\nBest regards.';

        // ── SCREEN / FROZEN / DISPLAY / BILDSCHIRM (575x) ─────────────────
        if (/screen|frozen|froze|freeze|bildschirm|display|white screen|black screen|eingefroren|eingefrohren/.test(t))
            return 'We restarted the Station. The Station is operational again.\nBest regards.';

        // ── LIFTER / ELEVATOR (475x) ───────────────────────────────────────
        if (/lifter|elevator/.test(t)) {
            if (/stuck|klemmt|blocked|middle/.test(t))
                return 'We fixed the stuck Lifter/Elevator. The Station is operational again.\nBest regards.';
            if (/calibrat|adjust|level/.test(t))
                return 'We calibrated the Lifter. The Station is operational again.\nBest regards.';
            return 'We restarted the Lifter/Elevator. The Station is operational again.\nBest regards.';
        }

        // ── FIDO (413x) ────────────────────────────────────────────────────
        if (/\bfido\b/.test(t))
            return 'We checked and reset the FIDO safety system. The Station is operational again.\nBest regards.';

        // ── IDS (214x) ─────────────────────────────────────────────────────
        if (/\bids\b/.test(t)) {
            if (/connection|lost|verbindung/.test(t))
                return 'We restored the IDS connection. The Station is operational again.\nBest regards.';
            return 'We restarted the IDS. The Station is operational again.\nBest regards.';
        }

        // ── ROLLER / ROLLE (281x) ──────────────────────────────────────────
        if (/\brolle\b|\broller\b|\brollen\b/.test(t)) {
            if (/fehlt|missing/.test(t))
                return 'We replaced the missing Roller. The Station is operational again.\nBest regards.';
            if (/defekt|broken|defect/.test(t))
                return 'We replaced the defective Roller. The Station is operational again.\nBest regards.';
            return 'We fixed the Roller. The Station is operational again.\nBest regards.';
        }

        // ── RACKLIGHT (235x + Recklight-Typos) ────────────────────────────
        if (/racklight|rack\s*light|ranklights|recklight|recklights/.test(t))
            return 'We restarted the Racklight. The Station is operational again.\nBest regards.';

        // ── CHARGER (180x) ─────────────────────────────────────────────────
        if (/\bcharger\b/.test(t)) {
            if (/obstruction|item|drin|inside/.test(t))
                return 'We removed the obstruction from the Charger. The Charger is operational again.\nBest regards.';
            if (/handscanner|hand scanner/.test(t))
                return 'We fixed the Handscanner Charger. The Scanner is operational again.\nBest regards.';
            return 'We fixed the Charger. The Charger is operational again.\nBest regards.';
        }

        // ── CONVEYOR / OUTBOUND / INBOUND (516x) ──────────────────────────
        if (/conveyor|conveyer|convey|outbound|inbound/.test(t)) {
            if (/jam|stuck|klemmt|blockiert|blocked|steht/.test(t))
                return 'We removed the Jam/obstruction. The Conveyor is operational again.\nBest regards.';
            if (/belt|riemen/.test(t))
                return 'We fixed the Belt. The Conveyor is operational again.\nBest regards.';
            return 'We fixed the Conveyor. The Conveyor is operational again.\nBest regards.';
        }

        // ── COGNEX (131x) ──────────────────────────────────────────────────
        if (/cognex/.test(t))
            return 'We fixed the Cognex Scanner. The Station is operational again.\nBest regards.';

        // ── HANDSCANNER / SCANNER (162x) ──────────────────────────────────
        if (/handscanner|hand\s*scanner/.test(t)) {
            if (/fehlt|missing|replace/.test(t))
                return 'We replaced the Handscanner. The Station is operational again.\nBest regards.';
            return 'We fixed the Handscanner. The Station is operational again.\nBest regards.';
        }
        if (/\bscanner\b/.test(t)) {
            if (/fehlt|missing/.test(t))
                return 'We replaced the Scanner. The Station is operational again.\nBest regards.';
            return 'We fixed the Scanner. The Station is operational again.\nBest regards.';
        }

        // ── E-STOP (111x) ──────────────────────────────────────────────────
        if (/estop|e-stop|e-stopp|floor stopped/.test(t))
            return 'We removed the E-Stop. The Floor is operational again.\nBest regards.';

        // ── DEPAL (89x) ────────────────────────────────────────────────────
        if (/\bdepal\b/.test(t))
            return 'We fixed the Jam/obstruction on the Depal. The Depalletizer is operational again.\nBest regards.';

        // ── CONNECTION / VERBINDUNG (83x) ─────────────────────────────────
        if (/connection\s*lost|lost\s*connection|verbindung|verloren/.test(t))
            return 'We restored the connection. The Station is operational again.\nBest regards.';

        // ── SRBRS WESTE ────────────────────────────────────────────────────
        if (/weste|srbrs/.test(t))
            return 'The E-Stop caused by the SRBRS vest has been removed. The Floor is operational again.\nBest regards.';

        // ── RESTART / REBOOT / NEUSTART (327x) ────────────────────────────
        if (/restart|reboot|neustart|neustarten|reset|computer|system\s*error|systemfehler|faulted\s*station|station\s*hängt|frozen|freeze|\bestart\b/.test(t))
            return 'We restarted the System. The Station is operational again.\nBest regards.';

        // ── PROJECTOR / BEAMER ─────────────────────────────────────────────
        if (/beamer|magenta|projector/.test(t))
            return 'We fixed the Projector. The Station is operational again.\nBest regards.';

        // ── LIQUID / SPILL (68x) ───────────────────────────────────────────
        if (/liquid|ausgelaufen|spill|öl\b|\boil\b|dirty\s*floor/.test(t))
            return 'We cleaned the Area/Floor. The Area is operational again.\nBest regards.';

        // ── ALARM (generisch) ──────────────────────────────────────────────
        if (/\balarm\b/.test(t))
            return 'We checked and reset the Safety/FIDO system. The Station is operational again.\nBest regards.';

        // ── LOW CONFIDENCE ─────────────────────────────────────────────────
        if (/low\s*confidence/.test(t))
            return 'We checked, cleaned and aligned the Cameras. The Stations are operational again.\nBest regards.';

        // ── AETHER ─────────────────────────────────────────────────────────
        if (/aether|no\s*comms/.test(t))
            return 'Aether on Floor2 is still not active in FRA7 yet because of missing KNX connection.\nBest regards.';

        // ── LADDER ─────────────────────────────────────────────────────────
        if (/\bladder\b/.test(t))
            return 'We fixed the Ladder. The Ladder is operational again.\nBest regards.';

        // ── TOTE (274x) ────────────────────────────────────────────────────
        if (/\btote\b|\btotes\b/.test(t))
            return 'We removed the stuck Tote. The Station is operational again.\nBest regards.';

        // ── GATE (44x) ─────────────────────────────────────────────────────
        if (/\bgate\b/.test(t))
            return 'We fixed the Gate. The Gate is operational again.\nBest regards.';

        // ── DEFAULT ────────────────────────────────────────────────────────
        return 'The issue has been resolved. The Station/Floor/Drive is operational again.\nBest regards.';
    }

    // ==================== Keyboard Shortcuts ====================

    $(document).keydown(function (event) {
        if (event.altKey && (event.key === '2' || event.keyCode === 50)) {
            event.preventDefault();
            assignToMe();
        } else if (event.altKey && event.keyCode === 51) {
            fillAndSubmitResponse(
                'Hello,\n' +
                'the RME team has received your ticket and will process your request as soon as possible.\n' +
                'Best regards.'
            );
        } else if (event.altKey && event.keyCode === 52) {
            const titleText = $('#sim-title').text();
            fillAndSubmitResponse(getResponseTextFromTitle(titleText));
        }
    });


    // ==================== Forward to IT (Alt+5) ====================

    const sleep = ms => new Promise(r => setTimeout(r, ms));
        async function waitFor(fn, timeout = 6000) {
            for (let i = 0; i < timeout / 100; i++) { const el = fn(); if (el) return el; await sleep(100); }
            return null;
        }
    
        // Status Badge — sichtbares Feedback ohne F12
        function badge(msg, color = '#3b82f6') {
            let b = document.getElementById('__it_badge__');
            if (!b) {
                b = document.createElement('div');
                b.id = '__it_badge__';
                Object.assign(b.style, {
                    position:'fixed', top:'12px', left:'50%', transform:'translateX(-50%)',
                    zIndex:'2147483647', padding:'8px 18px', borderRadius:'8px',
                    fontFamily:'monospace', fontSize:'13px', fontWeight:'bold',
                    color:'#fff', boxShadow:'0 4px 12px rgba(0,0,0,.5)',
                    transition:'background .3s', pointerEvents:'none',
                });
                document.body.appendChild(b);
            }
            b.style.background = color;
            b.textContent = msg;
            b.style.display = 'block';
        }
        function badgeHide() {
            const b = document.getElementById('__it_badge__');
            if (b) b.style.display = 'none';
        }
    
        // Versucht alle bekannten React-Handler-Namen
        function reactTrigger(el, isOption = false) {
            const fiberKey = Object.keys(el).find(k =>
                k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
            );
            if (!fiberKey) return 'no-fiber';
    
            const fakeEv = {
                type:'mousedown', target:el, currentTarget:el,
                bubbles:true, cancelable:true,
                isTrusted:true, detail:1, button:0, buttons:1,
                clientX:0, clientY:0,
                preventDefault:()=>{}, stopPropagation:()=>{},
                nativeEvent:{ isTrusted:true, detail:1 },
            };
    
            // Reihenfolge der Versuche: mousedown zuerst (awsui öffnet bei mousedown)
            // Options brauchen onClick, Buttons brauchen onMouseDown
            const tryHandlers = isOption
                ? ['onClick','onMouseDown','onPointerDown']
                : ['onMouseDown','onPointerDown','onClick','onMouseUp'];
    
            let fiber = el[fiberKey];
            while (fiber) {
                const props = fiber.memoizedProps;
                if (props) {
                    for (const h of tryHandlers) {
                        if (typeof props[h] === 'function') {
                            fakeEv.type = h.replace(/^on/, '').toLowerCase();
                            props[h](fakeEv);
                            return h; // welcher Handler hat es geschafft
                        }
                    }
                }
                fiber = fiber.return;
            }
            return 'no-handler';
        }
    
        async function typeChars(input, text) {
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            input.focus();
    
            // Schneller Versuch: ganzen Text auf einmal setzen
            setter.call(input, text);
            input.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'insertText', data: text }));
            input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            await sleep(150);
    
            // Falls keine Optionen → char-by-char Fallback
            const parent = input.closest('[role="dialog"]') || input.closest('[role="listbox"]')?.parentElement;
            const hasOptions = parent?.querySelector('[role="listbox"] [role="option"]');
            if (!hasOptions) {
                setter.call(input, '');
                input.dispatchEvent(new Event('input', { bubbles: true }));
                await sleep(20);
                for (const char of text) {
                    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: char, keyCode: char.charCodeAt(0) }));
                    setter.call(input, input.value + char);
                    input.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, inputType: 'insertText', data: char }));
                    input.dispatchEvent(new InputEvent('input',       { bubbles: true, inputType: 'insertText', data: char }));
                    input.dispatchEvent(new KeyboardEvent('keyup',   { bubbles: true, key: char }));
                    await sleep(25);
                }
            }
        }
    
        async function pickDropdown(buttonId, searchText, optionText) {
            const btn = await waitFor(() =>
                document.querySelector('.cti-folder-search-modal #' + buttonId) ||
                document.querySelector('#' + buttonId),
            3000);
            if (!btn) { badge('❌ ' + buttonId + ' nicht gefunden', '#ef4444'); return false; }
    
            badge('🔍 ' + buttonId + ' öffne...', '#f59e0b');
    
            const handler = reactTrigger(btn);
            badge('⚡ handler: ' + handler, '#8b5cf6');
            await sleep(100);
    
            // Dialog check
            const dialog = await waitFor(() => {
                // Alle möglichen offenen Dialogs
                for (const d of document.querySelectorAll('[role="dialog"]')) {
                    if (d.getAttribute('data-open') === 'true' && d.querySelector('input[role="combobox"]')) return d;
                    if (d.getAttribute('aria-hidden') === 'false' && d.querySelector('input[role="combobox"]')) return d;
                }
                return null;
            }, 3000);
    
            if (!dialog) {
                badge('⚠️ kein Dropdown — handler war: ' + handler, '#ef4444');
                // Fallback: dispatchEvent mousedown + click mit detail:1
                badge('🔁 fallback mousedown+click...', '#f59e0b');
                btn.dispatchEvent(new MouseEvent('mousedown', { bubbles:true, cancelable:true, detail:1, button:0 }));
                await sleep(100);
                btn.dispatchEvent(new MouseEvent('mouseup',   { bubbles:true, cancelable:true, detail:1, button:0 }));
                await sleep(100);
                btn.dispatchEvent(new MouseEvent('click',     { bubbles:true, cancelable:true, detail:1, button:0 }));
                await sleep(350);
    
                const d2 = await waitFor(() => {
                    for (const d of document.querySelectorAll('[role="dialog"]')) {
                        if (d.getAttribute('data-open') === 'true' && d.querySelector('input[role="combobox"]')) return d;
                    }
                    return null;
                }, 2000);
    
                if (!d2) { badge('❌ Dropdown öffnet nicht — bitte manuell öffnen', '#ef4444'); return false; }
            }
    
            const activeDialog = dialog || document.querySelector('[role="dialog"][data-open="true"]');
            const combobox = activeDialog.querySelector('input[role="combobox"]');
            if (!combobox) { badge('❌ kein Eingabefeld', '#ef4444'); return false; }
    
            badge('✍️ tippe: ' + searchText, '#3b82f6');
            await typeChars(combobox, searchText);
            await sleep(800);
    
            const option = await waitFor(() => {
                const lb = activeDialog.querySelector('[role="listbox"]');
                if (!lb) return null;
                const opts = [...lb.querySelectorAll('[role="option"]')];
                // exakter Match zuerst, dann includes
                return opts.find(el => el.textContent.trim().toLowerCase() === optionText.toLowerCase())
                    || opts.find(el => el.textContent.trim().toLowerCase().includes(optionText.toLowerCase()));
            }, 6000);
    
            if (!option) {
                const visible = [...(activeDialog.querySelector('[role="listbox"]')?.querySelectorAll('[role="option"]') || [])]
                    .map(e => e.textContent.trim()).slice(0, 5).join(', ');
                badge('❌ "' + optionText + '" fehlt. Gefunden: ' + visible, '#ef4444');
                return false;
            }
    
            // Keyboard-Auswahl: awsui prüft isTrusted NICHT bei Keyboard-Events (Accessibility)
            // ArrowDown bis zur richtigen Option, dann Enter
            badge('⌨️ keyboard select: ' + optionText, '#3b82f6');
            const listbox = activeDialog.querySelector('[role="listbox"]');
            const allOptions = [...listbox.querySelectorAll('[role="option"]')];
            const targetIdx = allOptions.indexOf(option);
    
            // Erst ArrowDown n-mal um auf die richtige Option zu navigieren
            for (let i = 0; i <= targetIdx; i++) {
                combobox.dispatchEvent(new KeyboardEvent('keydown', {
                    bubbles: true, key: 'ArrowDown', code: 'ArrowDown', keyCode: 40, which: 40
                }));
                await sleep(20);
            }
            // Enter zum Auswählen
            combobox.dispatchEvent(new KeyboardEvent('keydown', {
                bubbles: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13
            }));
            await sleep(50);
            badge('✓ ' + optionText + ' gesetzt', '#22c55e');
            return true;
        }
    
        async function forwardToIT() {
            badge('⏳ starte...', '#3b82f6');
    
            const ctiContainer = document.querySelector('.display-mode.is-editable:has(dl.info-pair.category)');
            if (ctiContainer) {
                const editBtn = ctiContainer.querySelector('.mode-change-trigger.edit-label');
                (editBtn || ctiContainer).click();
                await sleep(600);
            }
    
            const modal = await waitFor(() => document.querySelector('.cti-folder-search-modal'), 6000);
            if (!modal) { badge('❌ CTI Modal nicht erschienen', '#ef4444'); return; }
    
            badge('✓ Modal offen', '#22c55e');
            await sleep(150);
    
            if (!await pickDropdown('category-selector', 'OpsTechIT', 'OpsTechIT')) return;
            await sleep(50);
            if (!await pickDropdown('type-selector', 'Client Devices', 'Client Devices')) return;
            await sleep(50);
            await pickDropdown('item-selector', 'Other', 'Other');
    
            setTimeout(badgeHide, 3000);
        }

    // Alt+5 — Forward to IT (CTI: OpsTechIT / Client Devices / Other)
    window.addEventListener('keydown', e => {
        if (e.altKey && (e.key === '5' || e.keyCode === 53)) {
            e.preventDefault();
            e.stopPropagation();
            forwardToIT();
        }
    }, true);

})();
