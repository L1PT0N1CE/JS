// ==UserScript==
// @name         APM SCHLIEßEN alt+6 2x Loader NEU EN
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Füllt felder aus
// @author       You
// @match        https://eu1.eam.hxgnsmartcloud.com/*
// @icon         https://media.licdn.com/dms/image/D4E03AQGYEWJAKzMoHg/profile-displayphoto-shrink_800_800/0/1675186919356?e=2147483647&v=beta&t=yD2lwHTC78Y0eFQGGpl173y2Rhv9LmZgCe6LKvLYFvI
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === '6') {
            e.preventDefault();
            fillFields();
        }
    });

    function fillFields() {
        var fieldnameInput = document.querySelector('input[name="fieldname"]');
        if (fieldnameInput) {
            fieldnameInput.value = "Status";
            fieldnameInput.dispatchEvent(new Event('input', { bubbles: true }));
            simulateTab(fieldnameInput);
        }

        var filtervalueInput = document.querySelector('input[name="filtervalue"]');
        if (filtervalueInput) {
            setTimeout(function() {
                filtervalueInput.value = "Completed";
                filtervalueInput.dispatchEvent(new Event('input', { bubbles: true }));
            }, 100); // Ein kurzer Timeout, um sicherzustellen, dass das Feld "fieldname" den Fokus verlassen hat
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
