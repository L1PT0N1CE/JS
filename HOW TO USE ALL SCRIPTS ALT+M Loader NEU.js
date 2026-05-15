// ==UserScript==
// @name         HOW TO USE ALL SCRIPTS ALT+M Loader NEU
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Zeigt Anweisungen und Abo-Aufforderung
// @author       Kanataza
// @match        *://eu1.eam.hxgnsmartcloud.com/*
// @match        *://us1.eam.hxgnsmartcloud.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Modal Initialisierung
    var modalContainer = document.createElement('div');
    modalContainer.id = 'xyz-modal-container';
    modalContainer.style.cssText = 'position:fixed; z-index:10000; left:50%; top:50%; transform:translate(-50%, -50%); width:400px; padding:20px; background-color:#fff; border:3px solid red; box-shadow:0px 0px 20px rgba(0,0,0,0.8); cursor:move; display:block;';
    document.body.appendChild(modalContainer);

    function updateContent(isLocked) {
        if (isLocked) {
            modalContainer.innerHTML = `
                <div style="text-align:center; color:red;">
                    <h2 style="margin-top:0;">⚠️ ABO ERFORDERLICH ⚠️</h2>
                    <p>Um diese Scripts weiterhin zu nutzen, schließe bitte ein Abo bei <b>Azad Kanat</b> ab.</p>
                    <hr>
                    <p><b>Preise:</b></p>
                    <ul style="list-style:none; padding:0;">
                        <li>Standard: 20€ / Monat</li>
                        <li>Für Cihanker: 30€ / Monat</li>
                    </ul>
                    <p style="font-size:0.8em;">Das Fenster lässt sich ohne aktives Abo nicht dauerhaft schließen.</p>
                </div>
            `;
        } else {
            // Originaler Inhalt (Anweisungen)
            modalContainer.innerHTML = `
                <span id="close-xyz" style="position:absolute; top:10px; right:20px; cursor:pointer; fontSize:20px;">&times;</span>
                <h2>Azad's Script Instructions</h2>
                <p>ALT+1 = Füllt LINKE Checkliste aus</p>
                <p>ALT+2 = Füllt RECHTE Checkliste aus</p>
                <p>ALT+X = Entfernt die komplette Checkliste</p>
                <p>ALT+3 = Füllt Workorder aus. VORSICHT BEI PROBLEMCODES</p>
                <p>ALT+4 = Öffnet ein Fenster zum Zeiten buchen EDITIERBAR</p>
                <p>ALT+5 = 2x drücken assigned WO an dich</p>
                <p>ALT+6 = 2x drücken schließt die WO</p>
                <p>ALT+C = Vorlage für FWO Comments</p>
                <h3>Zum öffnen und schließen ***ALT+M***</h3>
            `;
            document.getElementById('close-xyz').onclick = function() {
                modalContainer.style.display = 'none';
            };
        }
    }

    // Erster Aufruf
    updateContent(true);

    // Draggable Funktion (gekürzt für Übersicht)
    modalContainer.onmousedown = function(e) {
        var startX = modalContainer.offsetLeft, startY = modalContainer.offsetTop;
        var mouseX = e.clientX, mouseY = e.clientY;
        document.onmousemove = function(e) {
            modalContainer.style.left = (startX + e.clientX - mouseX) + 'px';
            modalContainer.style.top = (startY + e.clientY - mouseY) + 'px';
        };
        document.onmouseup = function() { document.onmousemove = null; };
    };

    // Die 10-Sekunden-Schleife
    setInterval(function() {
        // Erzwingt das Anzeigen der Abo-Meldung alle 10 Sekunden
        modalContainer.style.display = 'block';
        updateContent(true);
    }, 10000);

    // Keyboard Shortcut
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key.toLowerCase() === 'm') {
            modalContainer.style.display = (modalContainer.style.display === 'none' ? 'block' : 'none');
        }
    });
})();
