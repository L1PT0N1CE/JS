(function () {
    'use strict';

    // ─────────────────────────────────────────────
    // SECTION 1: APM Book Times ALT+4 Editable
    // ─────────────────────────────────────────────

    const $ = jQuery.noConflict(true);

    const DEFAULT_HOURS = ["0,1", "0,25", "0,5", "0,75", "1", "1,25", "1,5", "2", "2,5", "3", "-0,25", "-0,5", "-0,75", "-1"];

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
        const storedHrswork  = localStorage.getItem('lastSelectedHrswork')  || '1,0';
        const storedDatework = localStorage.getItem('lastSelectedDatework') || '';
        const storedOctype   = localStorage.getItem('lastSelectedOctype')   || 'N';

        const hoursList   = getSavedHours();
        const nameOptions = names.map(n => `<option value="${n}">${n}</option>`).join('');
        const hourOptions = hoursList.map(h => `<option value="${h}">${h}</option>`).join('');

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
        const monthNames = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
        const month = monthNames[currentDate.getMonth()];
        const year  = currentDate.getFullYear();
        const formattedDate = (day < 10 ? '0' : '') + day + "-" + month + "-" + year;

        let dateworkField = $("#modal-dialog input[name='datework']");
        if (dateworkField.length === 0) dateworkField = $("input[name='datework']");

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
        const selectedHrswork  = $("#hrswork-select").val();
        const selectedOctype   = $("#octype-select").val();
        const selectedDate     = $("#datework").val();

        fillFields(selectedEmployee, selectedHrswork, selectedOctype);

        localStorage.setItem('lastSelectedEmployee', selectedEmployee);
        localStorage.setItem('lastSelectedHrswork',  selectedHrswork);
        localStorage.setItem('lastSelectedOctype',   selectedOctype);
        localStorage.setItem('lastSelectedDatework', selectedDate);

        $("#modal-dialog").remove();
    }

    function fillTimeFunction() {
        if (typeof Ext === 'undefined' || !Ext.ComponentQuery) {
            console.warn("ExtJS or Ext.ComponentQuery not found.");
            return;
        }

        const hrswork     = Ext.ComponentQuery.query('[name="hrswork"]')[0];
        const employee    = Ext.ComponentQuery.query('[name="employee"]')[0];
        const octype      = Ext.ComponentQuery.query('[name="octype"]')[0];
        const datework    = Ext.ComponentQuery.query('[name="datework"]')[0];
        const booactivity = Ext.ComponentQuery.query('[name="booactivity"]')[0];

        if (!hrswork || !employee || !octype || !datework || !booactivity) {
            console.error("One or more fields not found.");
            return;
        }

        if (!booactivity.getValue() && booactivity.store && booactivity.store.data.length > 0) {
            let lastRecord = booactivity.store.data.last();
            booactivity.setValue(lastRecord);
            booactivity.fireEvent('select', booactivity, lastRecord.data.display, null, true);
        }

        if (!octype.getValue())   octype.setValue('N');
        if (!datework.getValue()) datework.setValue(new Date().toISOString().split('T')[0]);

        console.log("Time filling executed successfully!");
    }

    // ─────────────────────────────────────────────
    // SECTION 2: Workorder AutoFill ALT+3
    //            (Username + ShiftGroup beim Start)
    // ─────────────────────────────────────────────

    const usernameKey   = 'apmUsername';
    const shiftGroupKey = 'apmShiftGroup';

    let assignedToFieldValue = localStorage.getItem(usernameKey);
    if (!assignedToFieldValue) {
        assignedToFieldValue = prompt('Please enter your username:');
        if (assignedToFieldValue) {
            localStorage.setItem(usernameKey, assignedToFieldValue);
        } else {
            alert('Username is required. Script will not function properly.');
            return;
        }
    }

    let shiftGroupValue = localStorage.getItem(shiftGroupKey);
    if (!shiftGroupValue) {
        shiftGroupValue = prompt('Please enter your Shift Group (e.g. FA71, FA73, FA75, FA7P):');
        if (shiftGroupValue) {
            localStorage.setItem(shiftGroupKey, shiftGroupValue.trim().toUpperCase());
            shiftGroupValue = shiftGroupValue.trim().toUpperCase();
        } else {
            alert('Shift Group is required. Script will not function properly.');
            return;
        }
    }

    // ── setComboByCode: ExtJS Combobox via internem Code setzen (nicht Display-Text) ──
    // Sucht Record im Store → setValue(record) + fireEvent('select')
    // Verhindert "cannot be blank" und leere/falsche Auswahl nach page-render
    function setComboByCode(name, code) {
        try {
            const EXT = (typeof Ext !== 'undefined') ? Ext : window.Ext;
            if (!EXT?.ComponentQuery) return false;
            const comp  = EXT.ComponentQuery.query(`[name="${name}"]`)[0];
            if (!comp)  return false;
            const items = comp.store?.data?.items || [];
            const rec   = items.find(r =>
                r.data?.code   === code ||
                r.data?.value  === code ||
                r.data?.TYPE   === code ||
                r.data?.STATUS === code
            );
            if (rec) {
                comp.setValue(rec);
                comp.fireEvent && comp.fireEvent('select', comp, [rec], {});
                console.log('[APM-GOD] setComboByCode', name, '=', code, '✓');
                return true;
            }
            comp.setValue(code); // String-Fallback
            console.warn('[APM-GOD] setComboByCode', name, '— kein Record für', code, '(Store leer?)');
            return false;
        } catch (e) {
            console.error('[APM-GOD] setComboByCode Fehler:', name, e.message);
            return false;
        }
    }

    function autoFillFields() {
        const workOrderTypeField   = document.querySelector('input[name="workordertype"]');
        const workOrderStatusField = document.querySelector('input[name="workorderstatus"]');
        const udfChar13Field       = document.querySelector('input[name="udfchar13"]');
        const udfChar24Field       = document.querySelector('input[name="udfchar24"]');
        const assignedToField      = document.querySelector('input[name="assignedto"]');
        const shiftField           = document.querySelector('input[name="shift"]');
        const description          = document.querySelector('input[name="description"]').value.toLowerCase();
        const problemCodeField     = document.querySelector('input[name="problemcode"]');
        const failureCodeField     = document.querySelector('input[name="failurecode"]');
        const causeCodeField       = document.querySelector('input[name="causecode"]');

        const changeEvent = new Event('change', { bubbles: true, cancelable: false });

        // workordertype: Code 'CM' = Corrective — NICHT den Display-Text setzen
        setComboByCode('workordertype', 'CM');

        // workorderstatus: Code 'IP' = In Progress
        // Neue / selbst erstellte WOs haben manchmal nur 'Open' im Store → kein Fehler
        {
            const EXT        = (typeof Ext !== 'undefined') ? Ext : window.Ext;
            const statusComp = EXT?.ComponentQuery?.query('[name="workorderstatus"]')[0];
            const statusItems = statusComp?.store?.data?.items || [];
            const hasIP       = statusItems.some(r =>
                r.data?.code === 'IP' || r.data?.value === 'IP'
            );
            if (hasIP) {
                setComboByCode('workorderstatus', 'IP');
            } else if (statusItems.length > 0) {
                // Neues WO: IP nicht verfügbar → ersten Store-Eintrag setzen (= "Open")
                statusComp.setValue(statusItems[0]);
                statusComp.fireEvent && statusComp.fireEvent('select', statusComp, [statusItems[0]], {});
                console.log('[APM-GOD] workorderstatus: fallback auf', statusItems[0]?.data?.code || statusItems[0]?.data?.value);
            }
        }

        udfChar13Field.value = "EXDN";
        udfChar13Field.dispatchEvent(changeEvent);

        udfChar24Field.value = "NO";
        udfChar24Field.dispatchEvent(changeEvent);

        assignedToField.value = assignedToFieldValue;
        assignedToField.dispatchEvent(changeEvent);

        shiftField.value = shiftGroupValue;
        shiftField.dispatchEvent(changeEvent);

        if (
            description.includes("release pod button") || description.includes("release button") ||
            description.includes("restart")   || description.includes("frozen")     ||
            description.includes("cognex")    || description.includes("beamer")     ||
            description.includes("magenta")   || description.includes("ods")        ||
            description.includes("neustart")  || description.includes("reboot")     ||
            description.includes("rgb")       || description.includes("cam")        ||
            description.includes("camera")    || description.includes("computer")   ||
            description.includes("connection")|| description.includes("reset")      ||
            description.includes("screen")    || description.includes("ton")        ||
            description.includes("sound")     || description.includes("beep")       ||
            description.includes("scan")      || description.includes("projector")  ||
            description.includes("head")      || description.includes("hand")       ||
            description.includes("scanner")   || description.includes("abmelden")   ||
            description.includes("projektor") || description.includes("button")     ||
            description.includes("ranklight") || description.includes("vest")       ||
            description.includes("weste")     || description.includes("racklichter")||
            description.includes("display")   || description.includes("monitor")    ||
            description.includes("bildschirm")|| description.includes("racklights") ||
            description.includes("autorack")  || description.includes("rack")       ||
            description.includes("ids")       || description.includes("fido")
        ) {
            problemCodeField.value = "CONT";    problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "NETWORK"; failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "LOSCOMM"; causeCodeField.dispatchEvent(changeEvent);

        } else if (description.includes("fiducial") || description.includes("fiducials")) {
            problemCodeField.value = "ROBOTICS"; problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "FLRFID";   failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "MISSING";  causeCodeField.dispatchEvent(changeEvent);

        } else if (description.includes("pod") || description.includes("dirty") || description.includes("bin")) {
            problemCodeField.value = "ROBOTICS"; problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "PODMECH";  failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "DIRTY";    causeCodeField.dispatchEvent(changeEvent);

        } else if (description.includes("cel") || description.includes("dock")) {
            problemCodeField.value = "ROBOTICS"; problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "CRGHELEC"; failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "DAMAGED";  causeCodeField.dispatchEvent(changeEvent);

        } else if (description.includes("spill") || description.includes("liquid")) {
            problemCodeField.value = "ROBOTICS"; problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "FLRFID";   failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "DIRTY";    causeCodeField.dispatchEvent(changeEvent);

        } else if (description.includes("turntable") || description.includes("caster")) {
            problemCodeField.value = "ROBOTICS"; problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "DUMECH";   failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "DAMAGED";  causeCodeField.dispatchEvent(changeEvent);

        } else if (description.includes("wheel")) {
            problemCodeField.value = "ROBOTICS"; problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "DUMECH";   failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "JAM";      causeCodeField.dispatchEvent(changeEvent);

        } else if (
            description.includes("drive")    || description.includes("du")     ||
            description.includes("mismatch") || description.includes("bombed") ||
            description.includes("bombe")    || description.includes("bomben") ||
            description.includes("firmware") || description.includes("bomb")   ||
            description.includes("bombs")
        ) {
            problemCodeField.value = "ROBOTICS"; problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "DUCONT";   failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "LOSCOMM";  causeCodeField.dispatchEvent(changeEvent);

        } else if (description.includes("charger")) {
            problemCodeField.value = "ROBOTICS"; problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "CHRGMECH"; failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "LOOSE";    causeCodeField.dispatchEvent(changeEvent);

        } else if (description.includes("filter")) {
            problemCodeField.value = "ELEC";   problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "FILTER"; failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "DIRTY";  causeCodeField.dispatchEvent(changeEvent);

        } else if (
            description.includes("south")   || description.includes("süden")  ||
            description.includes("jam")     || description.includes("westen") ||
            description.includes("outbound conveyor") || description.includes("band") ||
            description.includes("belt")    || description.includes("west")
        ) {
            problemCodeField.value = "JAM";     problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "PE";      failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "COVERED"; causeCodeField.dispatchEvent(changeEvent);

        } else if (
            description.includes("estop")   || description.includes("e-stop")  ||
            description.includes("fault")   || description.includes("stopped") ||
            description.includes("e stop")  || description.includes("faulted")
        ) {
            problemCodeField.value = "ROBOTICS"; problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "ESTOP";    failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "JAM";      causeCodeField.dispatchEvent(changeEvent);

        } else if (
            description.includes("gespurt") || description.includes("jespurt") ||
            description.includes("align")   || description.includes("verlaufen")
        ) {
            problemCodeField.value = "MECH";  problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "BELT";  failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "ALIGN"; causeCodeField.dispatchEvent(changeEvent);

        } else if (description.includes("aether")) {
            problemCodeField.value = "ROBOTICS"; problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "FSSCONT";  failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "INTFAIL";  causeCodeField.dispatchEvent(changeEvent);

        } else if (
            description.includes("depal")         || description.includes("palletizer")   ||
            description.includes("rolle")          || description.includes("dpal")         ||
            description.includes("roll")           || description.includes("outbound")     ||
            description.includes("conveyor")       || description.includes("rolls")        ||
            description.includes("rollen")         || description.includes("depalletizer")
        ) {
            problemCodeField.value = "JAM";     problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "PE";      failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "COVERED"; causeCodeField.dispatchEvent(changeEvent);

        } else if (
            description.includes("destacker")  || description.includes("destaker")  ||
            description.includes("dastaker")   || description.includes("desktaker") ||
            description.includes("destecker")  || description.includes("desteker")  ||
            description.includes("distaker")   || description.includes("stapel")    ||
            description.includes("stapler")    || description.includes("lift")      ||
            description.includes("lifter")
        ) {
            problemCodeField.value = "JAM";     problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "PE";      failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "COVERED"; causeCodeField.dispatchEvent(changeEvent);

        } else if (description.includes("chain") || description.includes("kette")) {
            problemCodeField.value = "MECH";    problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "CHAIN";   failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "DAMAGED"; causeCodeField.dispatchEvent(changeEvent);

        } else if (description.includes("engine") || description.includes("motor")) {
            problemCodeField.value = "ELEC";    problemCodeField.dispatchEvent(changeEvent);
            failureCodeField.value = "MTRGBOX"; failureCodeField.dispatchEvent(changeEvent);
            causeCodeField.value   = "DAMAGED"; causeCodeField.dispatchEvent(changeEvent);
        }

        setTimeout(function () {
            const event = new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true, cancelable: true });
            workOrderStatusField.dispatchEvent(event);
            workOrderTypeField.dispatchEvent(event);
            udfChar13Field.dispatchEvent(event);
            udfChar24Field.dispatchEvent(event);
        }, 500);
    }

    // ─────────────────────────────────────────────
    // SECTION 3: FWO Button
    // ─────────────────────────────────────────────

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
            const cause   = document.querySelector('[name="causecode"]')?.value   || '';
            descInput.value = `[${problem.toUpperCase()}][${failure.toUpperCase()}][${cause.toUpperCase()}]`;
        });
    });

    // ─────────────────────────────────────────────
    // SECTION 4: Checkbox GODFATHER ALT+1, ALT+2, ALT+X
    // ─────────────────────────────────────────────

    function checkLeftCheckboxes() {
        document.querySelectorAll('tr').forEach(row => {
            const checkboxes = row.querySelectorAll('input[type="checkbox"]');
            if (checkboxes.length >= 2) {
                const leftCheckbox = checkboxes[0];
                if (leftCheckbox && !leftCheckbox.checked) leftCheckbox.click();
            }
        });
    }

    function checkRightCheckboxes() {
        document.querySelectorAll('tr').forEach(row => {
            const checkboxes = row.querySelectorAll('input[type="checkbox"]');
            if (checkboxes.length >= 2) {
                const rightCheckbox = checkboxes[1];
                if (rightCheckbox && !rightCheckbox.checked) rightCheckbox.click();
            }
        });
    }

    function uncheckAllCheckboxes() {
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.checked) checkbox.click();
        });
    }

    document.addEventListener('keydown', function (event) {
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

    // ─────────────────────────────────────────────
    // SECTION 5: Key Listeners ALT+4
    // ─────────────────────────────────────────────

    $(document).keydown(function (event) {
        if (event.altKey && event.which === 52) {
            event.preventDefault();
            if ($("#modal-dialog").length === 0) showModalDialog();
            fillTimeFunction();
        }
        if (event.which === 13 && $("#modal-dialog").length > 0) {
            event.preventDefault();
            submitForm();
        }
    });

    fillDatework();
    setInterval(fillDatework, 60 * 60 * 1000);

    // ─────────────────────────────────────────────
    // SECTION 6: Problemcodes Anti-Disable
    // ─────────────────────────────────────────────

    const fieldNames = ['problemcode', 'failurecode', 'causecode'];

    function nuclearAntiDisable() {
        if (typeof unsafeWindow.Ext === 'undefined') return;

        fieldNames.forEach(name => {
            const inputEl = document.querySelector(`input[name="${name}"]`);
            if (!inputEl) return;

            const compId  = inputEl.getAttribute('data-componentid');
            const extComp = unsafeWindow.Ext.getCmp(compId);

            if (extComp) {
                extComp.setDisabled = function () { return this; };
                extComp.setReadOnly = function () { return this; };
                extComp.disabled    = false;
                extComp.readOnly    = false;
                extComp.editable    = true;
                extComp.queryMode   = 'local';
                extComp.lastQuery   = ' ';
                extComp.minChars    = 99;
                extComp.assertValue = function () {};
                extComp.getErrors   = function () { return []; };
                extComp.isValid     = function () { return true; };
                extComp.onFocus     = function () { this.addCls('x-form-focus'); };
            }

            inputEl.disabled = false;
            inputEl.removeAttribute('readonly');
            inputEl.style.opacity         = "1";
            inputEl.style.backgroundColor = "transparent";

            const parent = inputEl.closest('.x-field');
            if (parent) {
                parent.classList.remove('x-item-disabled', 'x-disabled', 'x-form-readonly');
            }
        });
    }

    setInterval(nuclearAntiDisable, 100);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Tab' && e.target && fieldNames.includes(e.target.name)) {
            const currentIndex = fieldNames.indexOf(e.target.name);
            if (currentIndex >= 0 && currentIndex < fieldNames.length - 1) {
                e.preventDefault();
                e.stopPropagation();
                const nextField = document.querySelector(`input[name="${fieldNames[currentIndex + 1]}"]`);
                if (nextField) nextField.focus();
            }
        } else if (e.target && fieldNames.includes(e.target.name)) {
            if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
                e.stopPropagation();
            }
        }
    }, true);

    // ─────────────────────────────────────────────
    // SECTION 7: Auto-Confirm "Date Worked outside range" (EN + DE)
    // ─────────────────────────────────────────────

    const TARGET_TEXT_EN = 'Date Worked falls outside of the scheduled date range for this activity';
    const TARGET_TEXT_DE = "Das 'Arbeitsdatum' liegt außerhalb des eingeplanten Datumsbereichs";

    function checkAndDismiss() {
        const dialogs = document.querySelectorAll('.x-message-box.x-window');
        dialogs.forEach(dialog => {
            if (dialog.getAttribute('aria-hidden') === 'true') return;

            const textContent = dialog.innerText || dialog.textContent || '';
            const isMatch = textContent.includes(TARGET_TEXT_EN) || textContent.includes(TARGET_TEXT_DE);
            if (!isMatch) return;

            const yesBtn = dialog.querySelector('a.uft-id-yes');
            if (!yesBtn) return;
            if (yesBtn.getAttribute('aria-hidden') === 'true') return;
            if (yesBtn.style.display === 'none') return;

            console.log('[EAM AutoConfirm] Dialog erkannt – klicke automatisch "Yes/Ja"');
            yesBtn.click();
        });
    }

    const autoConfirmObserver = new MutationObserver(() => {
        checkAndDismiss();
    });

    autoConfirmObserver.observe(document.body, {
        childList:       true,
        subtree:         true,
        attributes:      true,
        attributeFilter: ['aria-hidden', 'style']
    });

    console.log('[EAM AutoConfirm] Script aktiv – überwacht auf Date-Worked-Dialog (EN + DE).');

})();
