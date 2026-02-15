// ==UserScript==
// @name         APM Labor & CopyWO Link
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Kombi
// @author       kanataza
// @match        https://eu1.eam.hxgnsmartcloud.com/web/*
// @icon         https://media.licdn.com/dms/image/v2/D4E03AQEkSQG-ayth3g/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1730057709648?e=2147483647&v=beta&t=C7VGPq9vEfeuAcJa6aO7eBLN8GDKcR5c70l1ABnA3DU
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

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

    function openEditModal(type, defaultText) {
        const username = localStorage.getItem('apmUsername');
        if (!username) {
            alert('Kein Login in localStorage gefunden! Bitte zuerst das Login-Script ausführen.');
            return;
        }

        const overlay = document.createElement("div");
        overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:100000;";
        overlay.addEventListener("keydown", e => e.stopPropagation());

        const box = document.createElement("div");
        box.style = "background:white; padding:20px; border-radius:8px; min-width:280px; text-align:center; box-shadow:0 0 12px rgba(0,0,0,0.35);";

        const title = document.createElement("h3");
        title.innerText = `Buchung: ${type} (${username})`;
        title.style.marginBottom = "15px";

        const inputTime = document.createElement("input");
        inputTime.type = "text"; inputTime.value = "0,5"; inputTime.style = "width:120px; padding:6px; margin:5px;";

        const inputText = document.createElement("input");
        inputText.type = "text"; inputText.value = defaultText; inputText.style = "width:200px; padding:6px; margin:5px;";

        const okBtn = document.createElement("button");
        okBtn.innerText = "OK"; okBtn.style = "padding:6px 12px; margin-top:12px; cursor:pointer;";
        okBtn.onclick = () => { document.body.removeChild(overlay); fillFields(type, inputTime.value, inputText.value); };

        box.append(title, "Zeit (Komma):", document.createElement("br"), inputTime, document.createElement("br"), "Beschreibung:", document.createElement("br"), inputText, document.createElement("br"), okBtn);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    function openMainModal() {
        const modal = document.createElement("div");
        modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:99999;";
        
        const box = document.createElement("div");
        box.style = "background:white; padding:20px; border-radius:8px; text-align:center; min-width:250px;";

        const createBtn = (label, type, text) => {
            const b = document.createElement("button");
            b.innerText = label; b.style = "margin:5px; padding:6px 12px; cursor:pointer;";
            b.onclick = () => { document.body.removeChild(modal); openEditModal(type, text); };
            return b;
        };

        box.append(
            createBtn("Start-MET", "MET", "Startmeeting"),
            createBtn("RSP-MET", "MET", "RSP & RME MEETING"),
            createBtn("ADM", "ADM", "MAILS"),
            createBtn("T", "T", "Learn ATOZ")
        );
        modal.appendChild(box);
        document.body.appendChild(modal);
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
                cBtn.style = "margin-right:6px; padding:1px -50px; cursor:pointer; font-size:10px; background:#ff9900; border:1px solid #a88734; border-radius:3px; vertical-align:middle;";
                
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

