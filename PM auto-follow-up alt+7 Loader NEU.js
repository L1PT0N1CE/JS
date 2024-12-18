// ==UserScript==
// @name         APM auto-follow-up alt+7 Loader NEU
// @version      0.3
// @description  Ausfüllen bei FWO Erstellung
// @author       KANATAZA
// @match        https://eu1.eam.hxgnsmartcloud.com/*
// @icon         https://media.licdn.com/dms/image/D4E03AQGYEWJAKzMoHg/profile-displayphoto-shrink_800_800/0/1675186919356?e=2147483647&v=beta&t=yD2lwHTC78Y0eFQGGpl173y2Rhv9LmZgCe6LKvLYFvI
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Globale Fehlerbehandlung, um Fehlermeldungen zu unterdrücken
    window.onerror = function(message, source, lineno, colno, error) {
        // Unterdrücke nur spezifische Fehler wie "Cannot read properties of null"
        if (message.includes("Cannot read properties of null")) {
            return true;  // Fehler ignorieren und keine Fehlermeldung anzeigen
        }
        // Andere Fehler können normal behandelt werden (optional)
        return false;  // Standard-Fehlerbehandlung durchführen
    };

    const triggerKey = 'Alt+7';

    // Standardfelder für die Autofill-Funktion
    const fields = {
        trade: 'TECH',
        description: 'FOLLOW UP',
        workordertype: 'Work from PM',
        priority: '5',
        esthrs: '2',
        pplreq: '2'
    };

    // Funktion, um den Benutzernamen abzurufen oder abzufragen
    function getUsername() {
        const usernameKey = 'apmUsername'; // Gemeinsamer Key für beide Skripte
        let assignedTo = localStorage.getItem(usernameKey);

        if (!assignedTo) {
            assignedTo = prompt('Bitte geben Sie Ihren Benutzernamen ein:');
            if (assignedTo) {
                localStorage.setItem(usernameKey, assignedTo);
            } else {
                alert('Benutzername ist erforderlich. Das Skript wird nicht funktionieren.');
                return null; // Skript nicht fortsetzen, wenn kein Benutzername eingegeben wird
            }
        }

        return assignedTo;
    }

    // Funktion zum Fokussieren des nächsten Eingabeelements
    function focusNextElement(currentElement) {
        const formElements = Array.from(document.querySelectorAll('input, select, textarea'));
        const currentIndex = formElements.indexOf(currentElement);
        if (currentIndex > -1 && currentIndex < formElements.length - 1) {
            const nextElement = formElements[currentIndex + 1];
            nextElement.focus();
        }
    }

    // Funktion zum Ausfüllen der Felder
    function fillFields() {
        const assignedTo = getUsername(); // Benutzernamen abrufen

        if (assignedTo === null) {
            return; // Abbrechen, wenn kein Benutzername bereitgestellt wurde
        }

        fields.assignedto = assignedTo; // Den Benutzernamen in die Felder einfügen

        const tradeField = document.querySelector('input[name="trade"]');
        if (tradeField) {
            tradeField.value = fields.trade;
            tradeField.focus();

            setTimeout(() => {
                focusNextElement(tradeField);

                setTimeout(() => {
                    const inputs = document.querySelectorAll('input');
                    inputs.forEach(input => {
                        const fieldName = input.name;
                        if (fields.hasOwnProperty(fieldName) && fieldName !== 'trade') {
                            input.value = fields[fieldName];
                        }
                    });
                }, 100);
            }, 100);
        }
    }

    // Event-Listener für die Tastenkombination Alt+7
    document.addEventListener('keydown', (event) => {
        if (event.altKey && event.keyCode === 55) { // 55 ist der Keycode für "7"
            fillFields();
        }
    });
})();
