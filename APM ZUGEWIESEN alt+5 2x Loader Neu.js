// ==UserScript==
// @name         APM ZUGEWIESEN alt+5 2x Loader Neu
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Füllt Felder aus
// @author       You
// @match        https://eu1.eam.hxgnsmartcloud.com/*
// @icon         https://media.licdn.com/dms/image/D4E03AQGYEWJAKzMoHg/profile-displayphoto-shrink_800_800/0/1675186919356?e=2147483647&v=beta&t=yD2lwHTC78Y0eFQGGpl173y2Rhv9LmZgCe6LKvLYFvI
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === '5') {
            e.preventDefault();
            fillFields();
        }
    });

    function fillFields() {
        var fieldnameInput = document.querySelector('input[name="fieldname"]');

        // Überprüfen, ob das Feld existiert
        if (fieldnameInput) {
            // Den aktuellen Wert des Input-Felds abrufen
            var currentValue = fieldnameInput.value;

            // Überprüfen, was aktuell im Feld steht
            if (currentValue === "--Select Field--") {
                fieldnameInput.value = "Assigned To"; // Auf Englisch setzen
            } else if (currentValue === "--Feld auswählen--") {
                fieldnameInput.value = "Zugewiesen an"; // Auf Deutsch setzen
            }

            // Event auslösen, um Änderungen zu erkennen
            fieldnameInput.dispatchEvent(new Event('input', { bubbles: true }));
            simulateTab(fieldnameInput);
        }

        // Finde das Feld 'filtervalue'
        var filtervalueInput = document.querySelector('input[name="filtervalue"]');
        if (filtervalueInput) {
            // Wenn der Wert bereits gespeichert ist, setze ihn ein
            var savedLogin = localStorage.getItem('filtervalueLogin');
            if (savedLogin) {
                filtervalueInput.value = savedLogin;
                filtervalueInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                // Popup-Fenster für den Login anzeigen
                var login = prompt("Bitte geben Sie den Login ein:");
                if (login) {
                    localStorage.setItem('filtervalueLogin', login);
                    filtervalueInput.value = login;
                    filtervalueInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }
    }

    function simulateTab(element) {
        var tabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            keyCode: 9,
            code: 'Tab',
            which: 9,
            shiftKey: false,
            bubbles: true
        });
        element.dispatchEvent(tabEvent);
    }
})();
