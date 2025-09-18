// ==UserScript==
// @name         SCHLIEßEN & ZUGEWIESEN kombiniert (Alt+5 / Alt+6)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Füllt Felder aus: Alt+5 = Zugewiesen an, Alt+6 = Status Abgeschlossen
// @author       Kanataza
// @match        aHR0cHM6Ly9ldTEuZWFtLmh4Z25zbWFydGNsb3VkLmNvbS8=
// @icon         https://media.licdn.com/dms/image/D4E03AQGYEWJAKzMoHg/profile-displayphoto-shrink_800_800/0/1675186919356?e=2147483647&v=beta&t=yD0lwHTC78Y0eFQGGpl173y2Rhv9LmZgCe6LKvLYFvI
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    document.addEventListener('keydown', function (e) {
        if (e.altKey && e.key === '5') {
            e.preventDefault();
            fillAssigned();
        } else if (e.altKey && e.key === '6') {
            e.preventDefault();
            fillClosed();
        }
    });

    function fillAssigned() {
        const fieldnameInput = document.querySelector('input[name="fieldname"]');
        if (fieldnameInput) {
            const current = fieldnameInput.value;
            if (current === "--Select Field--") {
                fieldnameInput.value = "Assigned To";
            } else if (current === "--Feld auswählen--") {
                fieldnameInput.value = "Zugewiesen an";
            }
            fieldnameInput.dispatchEvent(new Event('input', { bubbles: true }));
            simulateTab(fieldnameInput);
        }

        const filtervalueInput = document.querySelector('input[name="filtervalue"]');
        if (filtervalueInput) {
            const savedLogin = localStorage.getItem('filtervalueLogin');
            if (savedLogin) {
                filtervalueInput.value = savedLogin;
                filtervalueInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                const login = prompt("Bitte geben Sie den Login ein:");
                if (login) {
                    localStorage.setItem('filtervalueLogin', login);
                    filtervalueInput.value = login;
                    filtervalueInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }
    }

    function fillClosed() {
        const fieldnameInput = document.querySelector('input[name="fieldname"]');
        if (fieldnameInput) {
            fieldnameInput.value = "Status";
            fieldnameInput.dispatchEvent(new Event('input', { bubbles: true }));
            simulateTab(fieldnameInput);
        }

        const filtervalueInput = document.querySelector('input[name="filtervalue"]');
        if (filtervalueInput) {
            setTimeout(() => {
                filtervalueInput.value = "Abgeschlossen";
                filtervalueInput.dispatchEvent(new Event('input', { bubbles: true }));
            }, 100);
        }
    }

    function simulateTab(element) {
        const tabEvent = new KeyboardEvent('keydown', {
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
