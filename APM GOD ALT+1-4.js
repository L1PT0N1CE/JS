// ==UserScript==
// @name          APM GOD ALT1-4 DE&EN
// @namespace     https://phonetool.amazon.com/users/kanataza
// @version       1.2
// @description   All what you need honey
// @author        kanataza
// @match         https://eu1.eam.hxgnsmartcloud.com/*
// @match         https://us1.eam.hxgnsmartcloud.com/*
// @icon          https://media.licdn.com/dms/image/v2/D4E03AQEkSQG-ayth3g/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1730057709648?e=2147483647&v=beta&t=C7VGPq9vEfeuAcJa6aO7eBLN8GDKcR5c70l1ABnA3DU
// @require       https://code.jquery.com/jquery-3.6.0.min.js
// @require       https://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// @grant         GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // APM Book Times ALT+4 Editable
    const $ = jQuery.noConflict(true);

    const DEFAULT_HOURS = ["0,1", "0,25", "0,5", "0,75", "1", "1,25", "1,5", "2", "2,5", "3"];

    function getSavedNames() {
        const data = localStorage.getItem("customNames");
        return data ? JSON.parse(data) : null;
    }

    function getSavedHours() {
        const data = localStorage.getItem("customHours");
        return data ? JSON.parse(data) : DEFAULT_HOURS;
    }

    function saveNames(namesArray) {
        localStorage.setItem("customNames", JSON.stringify(namesArray));
    }

    function saveHours(hoursArray) {
        localStorage.setItem("customHours", JSON.stringify(hoursArray));
    }

    function showEditModal() {
        const currentNames = getSavedNames() || [];
        const currentHours = getSavedHours();

        const editModal = `
            <div id="edit-modal" style="position:fixed; top:20%; left:20%; width:60%; background:white; border:1px solid black; padding:20px; z-index:10000;">
                <h3>Edit Names and Hours</h3>
                <label>Names/Logins (separated by slash '/'):</label><br>
                <textarea id="edit-names" style="width:100%; height:60px;">${currentNames.join(" / ")}</textarea><br><br>
                <label>Hours of Work (separated by slash '/', decimals with comma or dot):</label><br>
                <textarea id="edit-hours" style="width:100%; height:40px;">${currentHours.join(" / ")}</textarea><br><br>
                <button id="save-edit">Save</button>
                <button id="cancel-edit">Cancel</button>
            </div>
        `;
        $("body").append(editModal);

        $("#save-edit").click(() => {
            const names = $("#edit-names").val().split("/").map(s => s.trim()).filter(Boolean);
            const hours = $("#edit-hours").val().split("/").map(s => s.trim()).filter(Boolean);
            saveNames(names);
            saveHours(hours);
            $("#edit-modal").remove();
            alert("Saved! Press ALT+4 to reload.");
        });

        $("#cancel-edit").click(() => {
            $("#edit-modal").remove();
        });
    }

    function showModalDialog() {
        const names = getSavedNames();
        if (!names || names.length === 0) {
            alert("Please configure names.");
            showEditModal();
            return;
        }

        const storedEmployee = localStorage.getItem('lastSelectedEmployee') || names[0];
        const storedHrswork = localStorage.getItem('lastSelectedHrswork') || '1,0';
        const storedDatework = localStorage.getItem('lastSelectedDatework') || '';
        const storedOctype = localStorage.getItem('lastSelectedOctype') || 'N';
        const hoursList = getSavedHours();

        let nameOptions = names.map(n => `<option value="${n}">${n}</option>`).join('');
        let hourOptions = hoursList.map(h => `<option value="${h}">${h}</option>`).join('');

        const modalContent = `
            <div id="modal-dialog" style="position: fixed; top: 50%; left: 20%; background-color: white; padding: 20px; border: 1px solid black; z-index: 9999;">
                <h2>Select Options</h2>
                <label for="employee-select">Employee:</label>
                <select id="employee-select">${nameOptions}</select><br><br>

                <label for="hrswork-select">Hours of Work:</label>
                <select id="hrswork-select">${hourOptions}</select><br><br>

                <label for="datework">Date of Work:</label>
                <input type="text" id="datework" name="datework" class="uxdate" style="width: 150px;"><br><br>

                <label for="octype-select">Hour Type:</label>
                <select id="octype-select">
                    <option value="N">Normal</option>
                    <option value="O">Overtime</option>
                </select><br><br>

                <button id="submit-button">Submit</button>
                <button id="edit-button">Edit Names & Hours</button>
                <button id="close-button">Close</button>
            </div>
        `;

        $("body").append(modalContent);
        $("#modal-dialog").draggable();

        $('#employee-select').val(names.includes(storedEmployee) ? storedEmployee : names[0]);
        $('#hrswork-select').val(hoursList.includes(storedHrswork) ? storedHrswork : hoursList[0]);
        $('#datework').val(storedDatework);
        $('#octype-select').val(storedOctype);

        if (storedDatework === '') {
            fillDatework();
        }

        $("#submit-button").click(() => submitForm());
        $("#close-button").click(() => $("#modal-dialog").remove());
        $("#edit-button").click(() => {
            $("#modal-dialog").remove();
            showEditModal();
        });
    }

    function fillDatework() {
        const currentDate = new Date();
        const day = currentDate.getDate();
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const month = monthNames[currentDate.getMonth()];
        const year = currentDate.getFullYear();
        const formattedDate = (day < 10 ? '0' : '') + day + "-" + month + "-" + year;

        let dateworkField = $("#modal-dialog input[name='datework']");
        if (dateworkField.length === 0) {
            dateworkField = $("input[name='datework']");
        }

        if (dateworkField.length > 0) {
            dateworkField.val(formattedDate);
            dateworkField.trigger('change');
        }
    }

    function fillFields(selectedEmployee, selectedHrswork, selectedOctype) {
        $("input[name='employee']").val(selectedEmployee);
        $("input[name='hrswork']").val(selectedHrswork);
        $("input[name='octype']").val(selectedOctype);
    }

    function submitForm() {
        const selectedEmployee = $("#employee-select").val();
        const selectedHrswork = $("#hrswork-select").val();
        const selectedOctype = $("#octype-select").val();
        const selectedDate = $("#datework").val();

        fillFields(selectedEmployee, selectedHrswork, selectedOctype);

        localStorage.setItem('lastSelectedEmployee', selectedEmployee);
        localStorage.setItem('lastSelectedHrswork', selectedHrswork);
        localStorage.setItem('lastSelectedOctype', selectedOctype);
        localStorage.setItem('lastSelectedDatework', selectedDate);

        $("#modal-dialog").remove();
    }

    function fillTimeFunction() {
        if (typeof Ext === 'undefined' || !Ext.ComponentQuery) {
            console.warn("ExtJS or Ext.ComponentQuery not found. Automatic filling may be limited.");
            return;
        }

        const hrswork = Ext.ComponentQuery.query('[name="hrswork"]')[0];
        const employee = Ext.ComponentQuery.query('[name="employee"]')[0];
        const octype = Ext.ComponentQuery.query('[name="octype"]')[0];
        const datework = Ext.ComponentQuery.query('[name="datework"]')[0];
        const booactivity = Ext.ComponentQuery.query('[name="booactivity"]')[0];

        if (!hrswork || !employee || !octype || !datework || !booactivity) {
            console.error("One or more fields (hrswork, employee, octype, datework, booactivity) were not found.");
            return;
        }

        if (!booactivity.getValue() && booactivity.store && booactivity.store.data.length > 0) {
            let lastRecord = booactivity.store.data.last();
            booactivity.setValue(lastRecord);
            booactivity.fireEvent('select', booactivity, lastRecord.data.display, null, true);
        }

        if (!octype.getValue()) {
            octype.setValue('N');
        }
        if (!datework.getValue()) {
            datework.setValue(new Date().toISOString().split('T')[0]);
        }

        console.log("Time filling executed successfully!");
    }

    // Workorder detect autofill alt+3 NEU
    const usernameKey = 'apmUsername';
    let assignedToFieldValue = localStorage.getItem(usernameKey);

    if (!assignedToFieldValue) {
        assignedToFieldValue = prompt('Please enter your username:');
        if (assignedToFieldValue) {
            localStorage.setItem(usernameKey, assignedToFieldValue);
        } else {
            alert('Username is required. Script will not function properly.');
            return; // Exit the script if no username is provided
        }
    }

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
        if (description.includes("release pod button") || description.includes("release button") || description.includes("restart") ||description.includes("frozen") || description.includes("cognex") || description.includes("beamer") || description.includes("magenta") || description.includes("ODS") || description.includes("neustart") || description.includes("reboot") || description.includes("restart") || description.includes("rgb") || description.includes("cam") || description.includes("camera") || description.includes("computer") || description.includes("neustart") || description.includes("connection") || description.includes("reset") || description.includes("restart") || description.includes("screen") || description.includes("ton") || description.includes("sound") || description.includes("beep") || description.includes("scan") || description.includes("projector") || description.includes("cognex") || description.includes("head") || description.includes("hand") || description.includes("scanner") || description.includes("abmelden") || description.includes("projektor") || description.includes("button") || description.includes("vest") || description.includes("weste") || description.includes("racklichter") || description.includes("display") || description.includes("monitor") || description.includes("bildschirm") || description.includes("racklights") || description.includes("screen") || description.includes("autorack") || description.includes("rack") || description.includes("ids") || description.includes("fido") || description.includes("screen")) {
            problemCodeField.value = "CONT";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "NETWORK";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "LOSCOMM";
            causeCodeField.dispatchEvent(changeEvent);
        } else if (description.includes("fiducial") || description.includes("fiducials")) {
            problemCodeField.value = "ROBOTICS";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "FLRFID";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "MISSING";
            causeCodeField.dispatchEvent(changeEvent);
        } else if (description.includes("pod") || description.includes("dirty") || description.includes("bin")) {
            problemCodeField.value = "ROBOTICS";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "PODMECH";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "DIRTY";
            causeCodeField.dispatchEvent(changeEvent);
        } else if (description.includes("CEL") || description.includes("dock")) {
            problemCodeField.value = "ROBOTICS";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "CRGHELEC";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "DAMAGED";
            causeCodeField.dispatchEvent(changeEvent);
        } else if (description.includes("spill") || description.includes("liquid")) {
            problemCodeField.value = "ROBOTICS";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "FLRFID";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "DIRTY";
            causeCodeField.dispatchEvent(changeEvent);
        } else if (description.includes("turntable") || description.includes("wheel") || description.includes("caster")) {
            problemCodeField.value = "ROBOTICS";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "DUMECH";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "DAMAGED";
            causeCodeField.dispatchEvent(changeEvent);
        } else if (description.includes("drive") || description.includes("du") || description.includes("mismatch") || description.includes("bombed") || description.includes("bombe") || description.includes("bomben") || description.includes("firmware") || description.includes("bomb") || description.includes("bombs") || description.includes("wheel")) {
            problemCodeField.value = "ROBOTICS";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "DUCONT";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "LOSCOMM";
            causeCodeField.dispatchEvent(changeEvent);
        } else if (description.includes("charger")) {
            problemCodeField.value = "ROBOTICS";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "CHRGMECH";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "LOOSE";
            causeCodeField.dispatchEvent(changeEvent);
        } else if (description.includes("south") || description.includes("süden") || description.includes("jam") || description.includes("westen") || description.includes("outbound conveyor") || description.includes("Band") || description.includes("belt") || description.includes("west")) {
            problemCodeField.value = "JAM";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "PE";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "COVERED";
            causeCodeField.dispatchEvent(changeEvent);
        } else if (description.includes("estop") || description.includes("e-stop") || description.includes("fault") || description.includes("stopped") || description.includes("e stop") || description.includes("faulted")) {
            problemCodeField.value = "ROBOTICS";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "ESTOP";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "JAM";
            causeCodeField.dispatchEvent(changeEvent);
        } else if (description.includes("gespurt") || description.includes("jespurt") || description.includes("align") || description.includes("verlaufen")) {
            problemCodeField.value = "MECH";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "BELT";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "ALIGN";
            causeCodeField.dispatchEvent(changeEvent);
        } else if (description.includes("aether")) {
            problemCodeField.value = "ROBOTICS";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "FSSCONT";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "INTFAIL";
            causeCodeField.dispatchEvent(changeEvent);
        } else if (description.includes("depal") || description.includes("palletizer") || description.includes("rolle") || description.includes("dpal") || description.includes("roll") || description.includes("outbound") || description.includes("conveyor") || description.includes("rolls") || description.includes("rollen") || description.includes("depalletizer")) {
            problemCodeField.value = "JAM";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "PE";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "COVERED";
            causeCodeField.dispatchEvent(changeEvent);
        } else if (description.includes("destacker") || description.includes("destaker") || description.includes("desktaker") || description.includes("destecker") || description.includes("desteker") || description.includes("distaker") || description.includes("stapel") || description.includes("stapler") || description.includes("lift") || description.includes("lifter")) {
            problemCodeField.value = "JAM";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "PE";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "COVERED";
            causeCodeField.dispatchEvent(changeEvent);
        } else if (description.includes("chain") || description.includes("kette")) {
            problemCodeField.value = "MECH";
            problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "CHAIN";
            failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value = "DAMAGED";
            causeCodeField.dispatchEvent(changeEvent);
        } else if (description.includes("engine") || description.includes("motor")) {
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

    // FWO Button
    const waitForElement = (selector, callback) => {
        const observer = new MutationObserver(() => {
            const el = document.querySelector(selector);
            if (el) {
                observer.disconnect();
                callback(el);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };

    waitForElement('[name="description"]', (descInput) => {
        const button = document.createElement('button');
        button.textContent = 'FWO';
        button.style.marginLeft = '10px';
        button.type = 'button';

        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        descInput.parentNode.insertBefore(wrapper, descInput);
        wrapper.appendChild(descInput);
        wrapper.appendChild(button);

        button.addEventListener('click', () => {
            const problem = document.querySelector('[name="problemcode"]')?.value || '';
            const failure = document.querySelector('[name="failurecode"]')?.value || '';
            const cause = document.querySelector('[name="causecode"]')?.value || '';
            descInput.value = `[${problem.toUpperCase()}][${failure.toUpperCase()}][${cause.toUpperCase()}]`;
        });
    });

    // Checkbox GODFATHER ALT+1 ALT+2 ALT+x
    function checkLeftCheckboxes() {
        document.querySelectorAll('tr').forEach(row => {
            const checkboxes = row.querySelectorAll('input[type="checkbox"]');
            if (checkboxes.length >= 2) {
                const leftCheckbox = checkboxes[0]; // Linke Checkbox
                if (leftCheckbox && !leftCheckbox.checked) {
                    leftCheckbox.click();
                }
            }
        });
    }

    function checkRightCheckboxes() {
        document.querySelectorAll('tr').forEach(row => {
            const checkboxes = row.querySelectorAll('input[type="checkbox"]');
            if (checkboxes.length >= 2) {
                const rightCheckbox = checkboxes[1]; // Rechte Checkbox
                if (rightCheckbox && !rightCheckbox.checked) {
                    rightCheckbox.click();
                }
            }
        });
    }

    function uncheckAllCheckboxes() {
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.click();
            }
        });
    }

    document.addEventListener('keydown', function(event) {
        if (event.altKey && event.key === '1') {
            checkLeftCheckboxes();
        } else if (event.altKey && event.key === '2') {
            checkRightCheckboxes();
        } else if (event.altKey && event.key.toLowerCase() === 'x') {
            uncheckAllCheckboxes();
        } else if (event.altKey && event.key === '3') {
            autoFillFields();
        }
    });

    // Key event listeners for APM Book Times ALT+4 Editable
    $(document).keydown(function(event) {
        if (event.altKey && event.which === 52) {
            event.preventDefault();
            if ($("#modal-dialog").length === 0) {
                showModalDialog();
            }
            fillTimeFunction();
        }
        if (event.which === 13 && $("#modal-dialog").length > 0) {
            event.preventDefault();
            submitForm();
        }
    });

    fillDatework();
    setInterval(fillDatework, 60 * 60 * 1000);
})();