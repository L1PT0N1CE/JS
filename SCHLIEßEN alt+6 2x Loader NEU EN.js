// ==UserScript==
// @name         APM Assign & Close Alt+5/6 EN
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  FIlls out the Workorder with assign or closing
// @author       Kanataza
// @match        https://eu1.eam.hxgnsmartcloud.com/*
// @icon           https://media.licdn.com/dms/image/v2/D4E03AQEkSQG-ayth3g/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1730057709648?e=2147483647&v=beta&t=C7VGPq9vEfeuAcJa6aO7eBLN8GDKcR5c70l1ABnA3DU
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    document.addEventListener('keydown', function (e) {
        if (e.altKey && (e.key === '5' || e.key === '6')) {
            e.preventDefault();
            if (e.key === '5') fillAssigned();
            if (e.key === '6') fillStatus();
        }
    });

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

    function fillStatus() {
        const fieldnameInput = document.querySelector('input[name="fieldname"]');
        if (fieldnameInput) {
            fieldnameInput.value = "Status";
            fieldnameInput.dispatchEvent(new Event('input', { bubbles: true }));
            simulateTab(fieldnameInput);
        }

        const filtervalueInput = document.querySelector('input[name="filtervalue"]');
        if (filtervalueInput) {
            setTimeout(() => {
                filtervalueInput.value = "Completed";
                filtervalueInput.dispatchEvent(new Event('input', { bubbles: true }));
            }, 100);
        }
    }

    function fillAssigned() {
        const fieldnameInput = document.querySelector('input[name="fieldname"]');
        if (fieldnameInput) {
            const currentValue = fieldnameInput.value;
            if (currentValue === "--Select Field--") {
                fieldnameInput.value = "Assigned To";
            } else if (currentValue === "--Feld auswählen--") {
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
})();
