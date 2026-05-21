(function () {
    "use strict";

    const LS_KEY = 'apmUsername';

    /* ================= USERNAME HANDLING ================= */
    function getUsername() {
        return localStorage.getItem(LS_KEY) || null;
    }

    function askForUsername(onSuccess) {
        const overlay = createOverlay();
        overlay.style.zIndex = "999999";

        const box = document.createElement("div");
        box.style = "position:relative; background:white; padding:24px 24px 20px; border-radius:8px; min-width:300px; text-align:center; box-shadow:0 0 16px rgba(0,0,0,0.4);";

        const title = document.createElement("h3");
        title.innerText = "APM Script - Login";
        title.style = "margin:0 0 6px 0; font-size:15px;";

        const sub = document.createElement("p");
        sub.innerText = "Bitte deinen EAM-Benutzernamen eingeben:";
        sub.style = "margin:0 0 14px 0; font-size:12px; color:#555;";

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "z.B. KANATAZA";
        input.style = "width:200px; padding:7px 10px; font-size:14px; border:1px solid #ccc; border-radius:4px; text-transform:uppercase;";

        // Versuche bekannten Wert aus anderen LS-Keys zu prefüllen
        const knownLogins = ['login', 'lastSelectedEmployee', 'filtervalueLogin'];
        for (const key of knownLogins) {
            const val = localStorage.getItem(key);
            if (val && val.length > 2 && val.length < 20) {
                input.value = val.toUpperCase();
                break;
            }
        }

        input.addEventListener("input", () => {
            input.value = input.value.toUpperCase();
        });

        const okBtn = document.createElement("button");
        okBtn.innerText = "Speichern & Weiter";
        okBtn.style = "margin-top:14px; padding:7px 16px; cursor:pointer; background:#ff9900; border:1px solid #a88734; border-radius:4px; font-weight:bold;";
        okBtn.onclick = () => {
            const val = input.value.trim();
            if (!val) { input.style.border = "1px solid red"; return; }
            localStorage.setItem(LS_KEY, val);
            document.body.removeChild(overlay);
            if (onSuccess) onSuccess(val);
        };

        input.addEventListener("keydown", e => {
            if (e.key === "Enter") okBtn.click();
        });

        box.append(title, sub, input, document.createElement("br"), okBtn);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        setTimeout(() => input.focus(), 100);
    }

    function ensureUsername(callback) {
        const existing = getUsername();
        if (existing) {
            callback(existing);
        } else {
            askForUsername(callback);
        }
    }

    /* ================= HILFSFUNKTIONEN ================= */
    function getCurrentDate() {
        const m = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const d = new Date();
        return `${String(d.getDate()).padStart(2, "0")}-${m[d.getMonth()]}-${d.getFullYear()}`;
    }

    function setField(el, val) {
        if (!el) return;
        el.focus();
        const clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, buttons: 1 });
        el.dispatchEvent(clickEvt);

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(el, val);

        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /* ================= LABOR BUCHUNG LOGIK ================= */
    function fillFields(type, hrs, text) {
        const f1 = document.querySelector('input[name="octype"]');
        const f2 = document.querySelector('input[name="hrswork"]');
        const f3 = document.querySelector('input[name="boodescription"]');
        const f4 = document.querySelector('input[name="datework"]');

        setField(f1, type);
        setField(f4, getCurrentDate());
        setField(f2, hrs);
        setTimeout(() => setField(f3, text), 200);
    }

    /* ================= MODAL HELPER ================= */
    function createCloseButton(onClose) {
        const xBtn = document.createElement("button");
        xBtn.innerText = "✕";
        xBtn.style = `
            position: absolute;
            top: 8px;
            right: 10px;
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #555;
            line-height: 1;
            padding: 0;
        `;
        xBtn.title = "Schließen";
        xBtn.onclick = onClose;
        return xBtn;
    }

    function createOverlay() {
        const overlay = document.createElement("div");
        overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:100000;";
        overlay.addEventListener("keydown", e => e.stopPropagation());
        return overlay;
    }

    /* ================= EDIT MODAL ================= */
    function openEditModal(type, defaultText) {
        ensureUsername(username => {
            const overlay = createOverlay();

            const box = document.createElement("div");
            box.style = "position:relative; background:white; padding:20px; border-radius:8px; min-width:280px; text-align:center; box-shadow:0 0 12px rgba(0,0,0,0.35);";

            const closeOverlay = () => document.body.removeChild(overlay);
            box.appendChild(createCloseButton(closeOverlay));

            const title = document.createElement("h3");
            title.innerText = `Buchung: ${type} (${username})`;
            title.style.marginBottom = "15px";

            const inputTime = document.createElement("input");
            inputTime.type = "text";
            inputTime.value = "0,5";
            inputTime.style = "width:120px; padding:6px; margin:5px;";

            const inputText = document.createElement("input");
            inputText.type = "text";
            inputText.value = defaultText;
            inputText.style = "width:200px; padding:6px; margin:5px;";

            // Datum-Anzeige (read-only, wird automatisch gesetzt)
            const dateInfo = document.createElement("p");
            dateInfo.innerText = `Datum: ${getCurrentDate()}`;
            dateInfo.style = "font-size:11px; color:#888; margin:6px 0 0 0;";

            const okBtn = document.createElement("button");
            okBtn.innerText = "OK";
            okBtn.style = "padding:6px 12px; margin-top:12px; cursor:pointer;";
            okBtn.onclick = () => {
                closeOverlay();
                fillFields(type, inputTime.value, inputText.value);
            };

            box.append(
                title,
                "Zeit (Komma):", document.createElement("br"),
                inputTime, document.createElement("br"),
                "Beschreibung:", document.createElement("br"),
                inputText, document.createElement("br"),
                dateInfo,
                okBtn
            );

            overlay.appendChild(box);
            document.body.appendChild(overlay);
        });
    }

    /* ================= MAIN MODAL ================= */
    function openMainModal() {
        ensureUsername(() => {
            const overlay = createOverlay();
            overlay.style.zIndex = "99999";

            const box = document.createElement("div");
            box.style = "position:relative; background:white; padding:20px 20px 16px; border-radius:8px; text-align:center; min-width:250px; box-shadow:0 0 12px rgba(0,0,0,0.35);";

            const closeOverlay = () => document.body.removeChild(overlay);
            box.appendChild(createCloseButton(closeOverlay));

            const title = document.createElement("p");
            title.innerText = "Buchungstyp wählen:";
            title.style = "margin: 8px 0 12px; font-weight:bold;";

            // Username anzeigen + Reset-Link
            const userInfo = document.createElement("p");
            const currentUser = getUsername();
            userInfo.style = "font-size:11px; color:#888; margin:0 0 10px 0;";
            userInfo.innerHTML = `Eingeloggt als: <strong>${currentUser}</strong> `;

            const changeLink = document.createElement("a");
            changeLink.href = "#";
            changeLink.innerText = "ändern";
            changeLink.style = "font-size:11px; color:#ff9900;";
            changeLink.onclick = (e) => {
                e.preventDefault();
                closeOverlay();
                localStorage.removeItem(LS_KEY);
                askForUsername(() => openMainModal());
            };
            userInfo.appendChild(changeLink);

            const createBtn = (label, type, text) => {
                const b = document.createElement("button");
                b.innerText = label;
                b.style = "margin:5px; padding:6px 12px; cursor:pointer;";
                b.onclick = () => { closeOverlay(); openEditModal(type, text); };
                return b;
            };

            box.append(
                title,
                userInfo,
                createBtn("Start-MET", "MET", "Startmeeting"),
                createBtn("RSP-MET", "MET", "RSP & RME MEETING"),
                createBtn("ADM", "ADM", "MAILS"),
                createBtn("T", "T", "Learn ATOZ")
            );

            overlay.appendChild(box);
            document.body.appendChild(overlay);
        });
    }

    /* ================= UI BUTTON INJEKTION ================= */
    function injectUI() {
        // 1. Labor Buchungs Button
        if (!document.getElementById("kanataza-book-btn")) {
            const target = document.querySelector('input[name="workorderdesc"]');
            if (target) {
                const btn = document.createElement("button");
                btn.id = "kanataza-book-btn";
                btn.type = "button";
                btn.innerText = "Book LABOR";
                btn.style = "margin-left:10px; padding:6px 12px; cursor:pointer;";
                btn.onclick = openMainModal;
                target.insertAdjacentElement("afterend", btn);
            }
        }

        // 2. Copy WO Link Button
        const woInput = document.querySelector('input[name="workordernum"]');
        if (woInput && !document.getElementById('tm-copy-wo-btn')) {
            const labels = Array.from(document.querySelectorAll('label, div, span'));
            const woLabel = labels.find(el => {
                const text = el.textContent.trim();
                return text === 'Work Order:' || text === '* Work Order:' || text === '*Work Order:';
            });

            if (woLabel) {
                const cBtn = document.createElement('button');
                cBtn.id = 'tm-copy-wo-btn';
                cBtn.innerText = '📋 Copy';
                cBtn.style = "margin-right:10px; padding:1px 4px; cursor:pointer; font-size:10px; background:#ff9900; border:1px solid #a88734; border-radius:3px; vertical-align:middle;";

                cBtn.onclick = (e) => {
                    e.preventDefault(); e.stopPropagation();
                    const fullLink = `https://eu1.eam.hxgnsmartcloud.com/web/base/logindisp?tenant=AMAZONRMEEU_PRD&FROMEMAIL=YES&SYSTEM_FUNCTION_NAME=WSJOBS&USER_FUNCTION_NAME=WSJOBS&workordernum=${woInput.value}`;
                    navigator.clipboard.writeText(fullLink).then(() => {
                        cBtn.innerText = '✅ Copied';
                        setTimeout(() => { cBtn.innerText = '📋 Copy'; }, 2000);
                    });
                };
                woLabel.prepend(cBtn);
                woLabel.style.display = 'inline-flex';
                woLabel.style.alignItems = 'center';
            }
        }
    }

    // Observer für dynamisches Laden der APM Tabs/Forms
    const observer = new MutationObserver(injectUI);
    observer.observe(document.body, { childList: true, subtree: true });
    injectUI();
})();
