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
        title = title.toLowerCase();

        if (/\bracklight\b|\bracklights\b|\brack lights\b|\branklights\b|\brack\b/.test(title))
            return 'We restarted the Racklight/Rack. The Station is operational again.\nBest regards.';
        if (/\blifter\b/.test(title))
            return 'We restarted the lifter. The Station is operational again.\nBest regards.';
        if (/\baether\b|\bno comms\b/.test(title))
            return 'Aether on Floor2 is still not Activ in FRA7 yet because of Missing KNX Connection.\nBest regards.';
        if (/\bdestacker\b|\bdestucker\b|\bdesticker\b|\bdestaker\b|\bdastaker\b|\bdestecker\b|\bdesteker\b|\bdasticker\b/.test(title))
            return 'We restarted the Stacker. The Station is operational again.\nBest regards.';
        if (/\bfiducial\b/.test(title))
            return 'We replaced the Fiducial. The Floor is operational again.\nBest regards.';
        if (/\bids\b/.test(title))
            return 'We restarted the IDS. The Station is operational again.\nBest regards.';
        if (/\boutbound\b|\bconvey(or|er)\b|\bhigh control\b/.test(title))
            return 'We removed the Jam. The Conveyor is operational again.\nBest regards.';
        if (/\bpod\b|\bbin\b|\bdirty\b|\bbinreinigung\b/.test(title))
            return 'We cleaned the POD. The POD is operational again.\nBest regards.';
        if (/\bbildschirm\b|\bscreen\b|\baufgehängt\b|\bsystemerror\b|\bsystem error\b|\bsystemfehler\b|\brestart\b|\bfaulted station\b|\beingefroren\b|\bfrozen\b|\bneugestartet\b|\bstation is faulted\b|\bstation hängt\b|\bneustart\b|\breboot\b|\babmelden\b|\banmelden\b|\bverbindung\b|\bmonitor\b|\bcomputer\b|\breset\b/.test(title))
            return 'We restarted the System. The Station is operational again.\nBest regards.';
        if (/\bcognex\b/.test(title))
            return 'We fixed the Scanner. The Station is operational again.\nBest regards.';
        if (/\bcharger\b/.test(title))
            return 'We fixed the Charger. The Charger is operational again.\nBest regards.';
        if (/\bliquid\b|\bausgelaufen\b|\bspill\b/.test(title))
            return 'We cleaned the Area/Floor. The Area/Floor is operational again.\nBest regards.';
        if (/\bfido\b|\balarm\b/.test(title))
            return 'We fixed the Fido. The Station is operational again.\nBest regards.';
        if (/\bestop\b|\be-stop\b|\bfloor stopped\b/.test(title))
            return 'We removed the E-Stop. The Floor is operational again.\nBest regards.';
        if (/\blow confidence\b/.test(title))
            return 'We checked, cleaned and aligned the Cameras. The Stations are operational again.\nBest regards.';
        if (/\bbeamer\b|\bmagenta\b|\bprojector\b/.test(title))
            return 'We fixed the Projector. The Station is operational again.\nBest regards.';
        if (/\bdepal\b/.test(title))
            return 'We fixed the Jam/Crash on the Depal. The Depaletizer is operational again.\nBest regards.';
        if (/\bladder\b/.test(title))
            return 'We fixed Ladder. The Ladder is operational again.\nBest regards.';
        if (/\bdrive\b|\bdu\b/.test(title))
            return 'We fixed the Drive. The Drive operational again.\nBest regards.';

        return 'The Station, Drive, Charger, Floor, Pod, Conveyance, Area, is operational again.\nBest regards.';
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

})();
