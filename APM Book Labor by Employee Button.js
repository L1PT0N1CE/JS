// ==UserScript==
// @name         APM Book Labor by Employee Button
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Button + Modal + Editable Time/Text + real left-click simulation (MET / ADM / T) – liest Login aus localStorage
// @icon         https://media.licdn.com/dms/image/v2/D4E03AQEkSQG-ayth3g/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1730057709648?e=2147483647&v=beta&t=C7VGPq9vEfeuAcJa6aO7eBLN8GDKcR5c70l1ABnA3DU
// @author       kanataza
// @match        aHR0cHM6Ly9ldTEuZWFtLmh4Z25zbWFydGNsb3VkLmNvbS8=
// @grant        none
// ==/UserScript==

(function () {
    "use strict";

    /* ---------- Hilfsfunktionen ---------- */
    function getCurrentDate() {
        const m = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const d = new Date();
        return `${String(d.getDate()).padStart(2, "0")}-${m[d.getMonth()]}-${d.getFullYear()}`;
    }

    /* ---------- Modal für Zeit & Text ---------- */
    function openEditModal(type, defaultText) {
        const username = localStorage.getItem('apmUsername'); // von anderem Script
        if (!username) {
            alert('Kein Login in localStorage gefunden! Bitte zuerst das andere Script laufen lassen.');
            return;
        }

        const overlay = document.createElement("div");
        overlay.style = `
            position: fixed; top:0; left:0; width:100%; height:100%;
            background: rgba(0,0,0,0.45); display:flex;
            align-items:center; justify-content:center; z-index:100000;
        `;
        overlay.addEventListener("keydown", e => e.stopPropagation());

        const box = document.createElement("div");
        box.style = `
            background:white; padding:20px; border-radius:8px;
            min-width:280px; text-align:center;
            box-shadow:0 0 12px rgba(0,0,0,0.35);
        `;

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

        const okBtn = document.createElement("button");
        okBtn.type = "button";
        okBtn.innerText = "OK";
        okBtn.style = "padding:6px 12px; margin-top:12px; cursor:pointer;";

        okBtn.onclick = () => {
            document.body.removeChild(overlay);
            fillFields(type, inputTime.value, inputText.value);
        };

        box.appendChild(title);
        box.appendChild(document.createTextNode("Zeit (Komma):"));
        box.appendChild(document.createElement("br"));
        box.appendChild(inputTime);
        box.appendChild(document.createElement("br"));
        box.appendChild(document.createTextNode("Beschreibung:"));
        box.appendChild(document.createElement("br"));
        box.appendChild(inputText);
        box.appendChild(document.createElement("br"));
        box.appendChild(okBtn);

        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    /* ---------- FELDER FÜLLEN – mit echtem Linksklick ---------- */
    function fillFields(type, hrs, text) {
        const f1 = document.querySelector('input[name="octype"]');
        const f2 = document.querySelector('input[name="hrswork"]');
        const f3 = document.querySelector('input[name="boodescription"]');
        const f4 = document.querySelector('input[name="datework"]');

        function setField(el, val) {
            if (!el) return;
            el.focus();
            const clickEvt = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: 0,
                buttons: 1
            });
            el.dispatchEvent(clickEvt);

            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype, 'value'
            ).set;
            nativeInputValueSetter.call(el, val);

            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }

        setField(f1, type);
        setField(f4, getCurrentDate());
        setField(f2, hrs);
        setTimeout(() => setField(f3, text), 200);
    }

    /* ---------- Haupt-Button-Modal ---------- */
    function openMainModal() {
        const modal = document.createElement("div");
        modal.style = `
            position:fixed; top:0; left:0; width:100%; height:100%;
            background:rgba(0,0,0,0.45); display:flex;
            align-items:center; justify-content:center; z-index:99999;
        `;

        const box = document.createElement("div");
        box.style = `
            background:white; padding:20px; border-radius:8px;
            text-align:center; min-width:250px;
        `;

        const b1 = document.createElement("button");
        b1.type = "button";
        b1.innerText = "Start-MET";
        b1.style = "margin:5px; padding:6px 12px;";
        b1.onclick = () => { document.body.removeChild(modal); openEditModal("MET", "Startmeeting"); };

        const b2 = document.createElement("button");
        b2.type = "button";
        b2.innerText = "RSP-MET";
        b2.style = "margin:5px; padding:6px 12px;";
        b2.onclick = () => { document.body.removeChild(modal); openEditModal("MET", "RSP & RME MEETING"); };

        const b3 = document.createElement("button");
        b3.type = "button";
        b3.innerText = "ADM";
        b3.style = "margin:5px; padding:6px 12px;";
        b3.onclick = () => { document.body.removeChild(modal); openEditModal("ADM", "MAILS"); };

        const b4 = document.createElement("button");
        b4.type = "button";
        b4.innerText = "T";
        b4.style = "margin:5px; padding:6px 12px;";
        b4.onclick = () => { document.body.removeChild(modal); openEditModal("T", "Learn ATOZ"); };

        box.appendChild(b1);
        box.appendChild(b2);
        box.appendChild(b3);
        box.appendChild(b4);
        modal.appendChild(box);
        document.body.appendChild(modal);
    }

    /* ---------- Hauptbutton einbauen ---------- */
    function addMainButton() {
        if (document.getElementById("kanataza-book-btn")) return;
        const target = document.querySelector('input[name="workorderdesc"]');
        if (!target) return;

        const btn = document.createElement("button");
        btn.id = "kanataza-book-btn";
        btn.type = "button";
        btn.innerText = "Book LABOR";
        btn.style.marginLeft = "10px";
        btn.style.padding = "6px 12px";
        btn.onclick = openMainModal;

        target.insertAdjacentElement("afterend", btn);
    }

    const obs = new MutationObserver(addMainButton);
    obs.observe(document.body, { childList: true, subtree: true });
    addMainButton();

})();


