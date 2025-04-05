// ==UserScript==
// @name         Workorder detect autofill alt+3 NEU
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Autofills fields in the work order form based on description keywords.
// @author       kanataza
// @match        aHR0cHM6Ly9ldTEuZWFtLmh4Z25zbWFydGNsb3VkLmNvbS8=
// @icon         https://media.licdn.com/dms/image/D4E03AQGYEWJAKzMoHg/profile-displayphoto-shrink_800_800/0/1675186919356?e=2147483647&v=beta&t=yD2lwHTC78Y0eFQGGpl173y2Rhv9LmZgCe6LKvLYFvI
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const usernameKey = 'apmUsername';
    let assignedToFieldValue = localStorage.getItem(usernameKey);

    // Prompt for username if not already set
    if (!assignedToFieldValue) {
        assignedToFieldValue = prompt('Please enter your username:');
        if (assignedToFieldValue) {
            localStorage.setItem(usernameKey, assignedToFieldValue);
        } else {
            alert('Username is required. Script will not function properly.');
            return; // Exit the script if no username is provided
        }
    }

    document.addEventListener('keydown', function(event) {
        if(event.altKey && event.keyCode === 51) { // Alt+3
            autoFillFields();
        }
    });

    function autoFillFields() {
        const workOrderTypeField = document.querySelector('input[name="workordertype"]');
        const workOrderStatusField = document.querySelector('input[name="workorderstatus"]');
        const udfChar13Field = document.querySelector('input[name="udfchar13"]');
        const udfChar24Field = document.querySelector('input[name="udfchar24"]');
        const assignedToField = document.querySelector('input[name="assignedto"]');
        const shiftField = document.querySelector('input[name="shift"]');
        const description = document.querySelector('input[name="description"]').value.toLowerCase();
        const problemCodeField = document.querySelector('input[name="problemcode"]');
        const failureCodeField = document.querySelector('input[name="failurecode"]');
        const causeCodeField = document.querySelector('input[name="causecode"]');

        const changeEvent = new Event('change', {
            bubbles: true,
            cancelable: false
        });

        workOrderTypeField.value = "Corrective";
        workOrderTypeField.dispatchEvent(changeEvent);

        // Only fill workOrderStatusField if it is not already "In Progress"
        if (workOrderStatusField.value !== "In Progress") {
            workOrderStatusField.value = "In Progress";
            workOrderStatusField.dispatchEvent(changeEvent);
        }

        udfChar13Field.value = "EXDN";
        udfChar13Field.dispatchEvent(changeEvent);
        udfChar24Field.value = "NO";
        udfChar24Field.dispatchEvent(changeEvent);
        assignedToField.value = assignedToFieldValue; // Use the saved username
        assignedToField.dispatchEvent(changeEvent);
        shiftField.value = "FA73";
        shiftField.dispatchEvent(changeEvent);

        // Decision logic for problem, failure, and cause codes based on description
        if(description.includes("release pod button") || description.includes("release button") || description.includes("neustart") || description.includes("reboot") || description.includes("restart") || description.includes("rgb") || description.includes("cam") || description.includes("camera") || description.includes("computer") || description.includes("neustart") || description.includes("connection") || description.includes("reset") || description.includes("restart") || description.includes("screen") || description.includes("ton") || description.includes("sound") || description.includes("beep") || description.includes("scan") || description.includes("projector") || description.includes("cognex") || description.includes("head") || description.includes("hand") || description.includes("scanner") || description.includes("abmelden") || description.includes("projektor") || description.includes("button") || description.includes("vest") || description.includes("weste") || description.includes("racklichter") || description.includes("display") || description.includes("monitor") || description.includes("bildschirm") || description.includes("racklights") || description.includes("screen") || description.includes("autorack") || description.includes("rack") || description.includes("ids") || description.includes("fido") || description.includes("screen")) {
            problemCodeField.value = "CONT";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "NETWORK";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "LOSCOMM";
            causeCodeField.dispatchEvent(changeEvent);
        } else if(description.includes("fiducial") || description.includes("fiducials")) {
            problemCodeField.value = "ROBOTICS";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "FLRFID";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "MISSING";
            causeCodeField.dispatchEvent(changeEvent);
        } else if(description.includes("pod") || description.includes("dirty") || description.includes("bin")) {
            problemCodeField.value = "ROBOTICS";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "PODMECH";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "DIRTY";
            causeCodeField.dispatchEvent(changeEvent);
        } else if(description.includes("CEL") || description.includes("dock")) {
            problemCodeField.value = "ROBOTICS";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "CRGHELEC";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "DAMAGED";
            causeCodeField.dispatchEvent(changeEvent);  
        } else if(description.includes("drive") || description.includes("du") || description.includes("mismatch") || description.includes("restart") || description.includes("ausloggen") || description.includes("frozen") || description.includes("cognex") || description.includes("beamer") || description.includes("magenta") || description.includes("ODS") || description.includes("bombed") || description.includes("bombe") || description.includes("bomben") || description.includes("firmware") || description.includes("bomb") || description.includes("bombs") || description.includes("wheel")) {
            problemCodeField.value = "ROBOTICS";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "DUCONT";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "LOSCOMM";
            causeCodeField.dispatchEvent(changeEvent);
        } else if(description.includes("charger")) {
            problemCodeField.value = "ROBOTICS";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "CHRGMECH";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "LOOSE";
            causeCodeField.dispatchEvent(changeEvent);
        } else if(description.includes("south") || description.includes("süden") || description.includes("jam") || description.includes("westen") || description.includes("outbound conveyor") || description.includes("Band") || description.includes("belt") || description.includes("west")) {
            problemCodeField.value = "JAM";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "PE";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "COVERED";
            causeCodeField.dispatchEvent(changeEvent);    
        } else if(description.includes("estop") || description.includes("e-stop") || description.includes("fault") || description.includes("faulted")) {
            problemCodeField.value = "ROBOTICS";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "ESTOP";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "JAM";
            causeCodeField.dispatchEvent(changeEvent);
        } else if(description.includes("gespurt") || description.includes("jespurt") || description.includes("align") || description.includes("verlaufen")) {
            problemCodeField.value = "MECH";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "BELT";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "ALIGN";
            causeCodeField.dispatchEvent(changeEvent);
        } else if(description.includes("depal") || description.includes("palletizer") || description.includes("rolle") || description.includes("dpal") || description.includes("roll") || description.includes("outbound") || description.includes("conveyor") || description.includes("rolls") || description.includes("rollen") || description.includes("depalletizer")) {
            problemCodeField.value = "JAM";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "PE";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "COVERED";
            causeCodeField.dispatchEvent(changeEvent);
        } else if(description.includes("destacker") || description.includes("destaker") || description.includes("desktaker") || description.includes("destecker") || description.includes("distaker") || description.includes("stapel") || description.includes("stapler") || description.includes("lift") || description.includes("lifter")) {
            problemCodeField.value = "JAM";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "PE";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "COVERED";
            causeCodeField.dispatchEvent(changeEvent);
        } else if(description.includes("chain") || description.includes("kette")) {
            problemCodeField.value = "MECH";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "CHAIN";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "DAMAGED";
            causeCodeField.dispatchEvent(changeEvent);
        } else if(description.includes("engine") || description.includes("motor")) {
            problemCodeField.value = "ELEC";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "MTRGBOX";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "DAMAGED";
            causeCodeField.dispatchEvent(changeEvent);
        }

        // Simulate Enter key press after a delay
        setTimeout(function() {
            const event = new KeyboardEvent('keydown', {
                key: 'Enter',
                keyCode: 13,
                bubbles: true,
                cancelable: true
            });
            workOrderStatusField.dispatchEvent(event);
            workOrderTypeField.dispatchEvent(event);
            udfChar13Field.dispatchEvent(event);
            udfChar24Field.dispatchEvent(event);
        }, 500); // 0.5 seconds delay
    }

    // Call autofill function
    autoFillFields();

    // Event listener for Alt+3
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === '3') {
            autoFillFields();
        }
    });
})();
