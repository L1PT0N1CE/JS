(function () {
    'use strict';

    // ─────────────────────────────────────────────
    // SECTION 1: APM Book Times ALT+4 — Schnellbuchung
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

    function getFormattedToday() {
        const d = new Date();
        const day = String(d.getDate()).padStart(2, '0');
        const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
        return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
    }

    // Panel state
    let agSelectedHours  = null;
    let agSelectedOctype = localStorage.getItem('lastSelectedOctype') || 'N';

    const PANEL_CSS = `
        #apmgod-panel{position:fixed;top:80px;right:20px;width:340px;background:#1a2332;border:1px solid #2a3447;border-radius:8px;z-index:99999;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#c8d4e8;box-shadow:0 8px 32px rgba(0,0,0,.5);user-select:none}
        #apmgod-panel *{box-sizing:border-box}
        .ag-header{background:#151b27;border-bottom:1px solid #2a3447;border-radius:8px 8px 0 0;padding:10px 14px;display:flex;align-items:center;gap:8px;cursor:move}
        .ag-header-title{font-size:14px;font-weight:700;color:#e2e8f0;flex:1;letter-spacing:.5px}
        .ag-username-badge{background:#2a3447;border:1px solid #3b82f6;color:#93c5fd;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;letter-spacing:.5px}
        .ag-close{background:none;border:none;color:#64748b;cursor:pointer;font-size:20px;padding:0 2px;line-height:1;transition:color .15s}
        .ag-close:hover{color:#ef4444}
        .ag-body{padding:12px 14px}
        .ag-stats{background:#151b27;border:1px solid #2a3447;border-radius:6px;padding:6px 10px;font-size:12px;color:#94a3b8;margin-bottom:10px;text-align:center}
        .ag-stats span{color:#60a5fa;font-weight:600}
        .ag-date-row{display:flex;align-items:center;gap:8px;margin-bottom:10px}
        .ag-date-label{color:#64748b;font-size:12px;white-space:nowrap}
        .ag-date-input{background:#0f1621;border:1px solid #2a3447;border-radius:5px;color:#c8d4e8;padding:5px 8px;font-size:12px;flex:1;font-family:monospace}
        .ag-date-input:focus{outline:none;border-color:#3b82f6}
        .ag-hint{color:#475569;font-size:11px;margin-bottom:8px;font-style:italic}
        .ag-presets{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:10px}
        .ag-preset-btn{background:#0f1621;border:1px solid #2a3447;border-radius:5px;color:#94a3b8;padding:5px 8px;cursor:pointer;font-size:12px;min-width:38px;text-align:center;transition:all .15s}
        .ag-preset-btn:hover{border-color:#3b82f6;color:#93c5fd}
        .ag-preset-btn.selected{background:#1d4ed8;border-color:#3b82f6;color:#fff}
        .ag-preset-btn.negative{border-color:#7f1d1d;color:#fca5a5}
        .ag-preset-btn.negative:hover{border-color:#ef4444}
        .ag-preset-btn.negative.selected{background:#7f1d1d;border-color:#ef4444;color:#fff}
        .ag-edit-btn{background:none;border:1px dashed #2a3447;border-radius:5px;color:#475569;padding:5px 8px;cursor:pointer;font-size:13px;transition:all .15s}
        .ag-edit-btn:hover{color:#94a3b8;border-color:#475569}
        .ag-custom-row{display:flex;align-items:center;gap:8px;margin-bottom:10px}
        .ag-custom-input{flex:1;background:#0f1621;border:1px solid #2a3447;border-radius:5px;color:#c8d4e8;padding:6px 10px;font-size:12px}
        .ag-custom-input:focus{outline:none;border-color:#3b82f6}
        .ag-abzug-label{display:flex;align-items:center;gap:4px;color:#94a3b8;font-size:12px;cursor:pointer;white-space:nowrap}
        .ag-abzug-label input{cursor:pointer}
        .ag-toggle-row{display:flex;gap:6px;margin-bottom:12px}
        .ag-toggle-btn{flex:1;background:#0f1621;border:1px solid #2a3447;border-radius:5px;color:#64748b;padding:7px;cursor:pointer;font-size:12px;font-weight:600;text-align:center;transition:all .15s}
        .ag-toggle-btn.active-normal{background:#1d4ed8;border-color:#3b82f6;color:#fff}
        .ag-toggle-btn.active-overtime{background:#9a3412;border-color:#f97316;color:#fff}
        .ag-employee-row{margin-bottom:12px}
        .ag-employee-select{width:100%;background:#0f1621;border:1px solid #2a3447;border-radius:5px;color:#c8d4e8;padding:6px 10px;font-size:12px}
        .ag-employee-select:focus{outline:none;border-color:#3b82f6}
        .ag-submit-btn{width:100%;background:#16a34a;border:none;border-radius:6px;color:#fff;padding:10px;font-size:14px;font-weight:700;cursor:pointer;letter-spacing:.5px;transition:background .15s}
        .ag-submit-btn:hover{background:#15803d}
        .ag-submit-btn:active{background:#166534}
    `;

    function injectPanelStyles() {
        if (document.getElementById('apmgod-styles')) return;
        const s = document.createElement('style');
        s.id = 'apmgod-styles';
        s.textContent = PANEL_CSS;
        document.head.appendChild(s);
    }

    function getEamStats() {
        try {
            const _ExtQ = (typeof unsafeWindow !== 'undefined' ? unsafeWindow.Ext : null) || (typeof Ext !== 'undefined' ? Ext : null);
        if (_ExtQ && _ExtQ.ComponentQuery) {
                const comps = Ext.ComponentQuery.query('[name="hrswork"]');
                if (comps && comps.length > 0) {
                    const val = comps[comps.length - 1].getValue();
                    return { booked: val ? String(val).replace('.', ',') : '0,0' };
                }
            }
        } catch (e) {}
        return { booked: '0,0' };
    }

    function showEditModal() {
        if (document.getElementById('apmgod-edit')) return;
        const currentNames = getSavedNames() || [];
        const currentHours = getSavedHours();

        const el = document.createElement('div');
        el.id = 'apmgod-edit';
        el.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);width:420px;background:#1a2332;border:1px solid #2a3447;border-radius:8px;padding:20px;z-index:100001;color:#c8d4e8;font-family:-apple-system,sans-serif;font-size:13px;box-shadow:0 8px 32px rgba(0,0,0,.6)';
        el.innerHTML = `
            <h3 style="margin:0 0 14px;color:#e2e8f0;font-size:15px">Namen &amp; Stunden bearbeiten</h3>
            <label style="color:#94a3b8;font-size:12px">Namen / Logins (getrennt durch '/'):</label>
            <textarea id="apmgod-edit-names" style="width:100%;height:60px;margin:6px 0 12px;background:#0f1621;border:1px solid #2a3447;border-radius:5px;color:#c8d4e8;padding:8px;font-size:12px;resize:none">${currentNames.join(' / ')}</textarea>
            <label style="color:#94a3b8;font-size:12px">Stunden (getrennt durch '/', Komma oder Punkt):</label>
            <textarea id="apmgod-edit-hours" style="width:100%;height:40px;margin:6px 0 14px;background:#0f1621;border:1px solid #2a3447;border-radius:5px;color:#c8d4e8;padding:8px;font-size:12px;resize:none">${currentHours.join(' / ')}</textarea>
            <div style="display:flex;gap:8px">
                <button id="apmgod-edit-save" style="flex:1;background:#16a34a;border:none;border-radius:5px;color:#fff;padding:8px;cursor:pointer;font-weight:600">Speichern</button>
                <button id="apmgod-edit-cancel" style="flex:1;background:#2a3447;border:none;border-radius:5px;color:#c8d4e8;padding:8px;cursor:pointer">Abbrechen</button>
            </div>
        `;
        document.body.appendChild(el);

        document.getElementById('apmgod-edit-save').onclick = () => {
            const names = document.getElementById('apmgod-edit-names').value.split('/').map(s => s.trim()).filter(Boolean);
            const hours = document.getElementById('apmgod-edit-hours').value.split('/').map(s => s.trim()).filter(Boolean);
            saveNames(names);
            saveHours(hours);
            el.remove();
            const panel = document.getElementById('apmgod-panel');
            if (panel) { panel.remove(); showModalDialog(); }
        };
        document.getElementById('apmgod-edit-cancel').onclick = () => el.remove();
    }

    function fillDatework() {
        const formattedDate = getFormattedToday();
        const dateInput = document.getElementById('apmgod-date-input');
        if (dateInput && !dateInput.value) dateInput.value = formattedDate;
    }

    function fillFields(selectedEmployee, selectedHrswork, selectedOctype) {
        $("input[name='employee']").val(selectedEmployee);
        $("input[name='hrswork']").val(selectedHrswork);
        $("input[name='octype']").val(selectedOctype);
    }

    function getSelectedHours() {
        const ci    = document.getElementById('apmgod-custom-input');
        const abzug = document.getElementById('apmgod-abzug');
        if (ci && ci.value.trim()) {
            let val = ci.value.trim();
            if (abzug && abzug.checked && !val.startsWith('-')) val = '-' + val;
            return val;
        }
        return agSelectedHours;
    }

    function clickEamBookButton() {
        // EAM toolbar save/book is the green save icon — uft-id-save is the standard EAM save action
        // Try all known uft-id patterns for this button
        const uftCandidates = ['save', 'book', 'booklabor', 'add', 'accept'];
        for (const id of uftCandidates) {
            const el = document.querySelector(`a.uft-id-${id}`);
            if (el && el.offsetParent !== null && !el.closest('.x-item-disabled')) {
                el.click();
                console.log('[APM-GOD] Book via uft-id-' + id);
                return true;
            }
        }

        // ExtJS: find the first enabled toolbar button (save icon has no text, just icon class)
        // unsafeWindow.Ext because TM sandbox hides Ext from plain window
        const _Ext = (typeof unsafeWindow !== 'undefined' ? unsafeWindow.Ext : null) || (typeof Ext !== 'undefined' ? Ext : null);
        if (_Ext && _Ext.ComponentQuery) {
            const toolbars = _Ext.ComponentQuery.query('toolbar');
            for (const tb of toolbars) {
                if (!tb.isVisible || !tb.isVisible()) continue;
                const btns = tb.query('button');
                for (const btn of btns) {
                    const icon  = (btn.iconCls  || '').toLowerCase();
                    const iid   = (btn.itemId   || '').toLowerCase();
                    const tt    = (btn.tooltip  || '').toLowerCase();
                    const txt   = (btn.text     || '').toLowerCase();
                    if ((icon + iid + tt + txt).match(/save|book|accept|add/) && !btn.isDisabled()) {
                        btn.el ? btn.el.dom.click() : btn.fireEvent('click', btn);
                        console.log('[APM-GOD] Book via ExtJS btn', btn.itemId || btn.iconCls);
                        return true;
                    }
                }
            }
        }

        console.warn('[APM-GOD] EAM Book-Button nicht gefunden — alle a[class*=uft-id]:');
        document.querySelectorAll('a[class*="uft-id"]').forEach(a => console.log(a.className));
        return false;
    }

    function submitForm() {
        const panel = document.getElementById('apmgod-panel');
        if (!panel) return;

        const employeeEl = document.getElementById('apmgod-employee');
        const dateInput  = document.getElementById('apmgod-date-input');
        const names      = getSavedNames() || [''];

        const selectedEmployee = employeeEl ? employeeEl.value : names[0];
        const selectedHrswork  = getSelectedHours() || '1';
        const selectedDate     = dateInput ? dateInput.value : getFormattedToday();

        fillFields(selectedEmployee, selectedHrswork, agSelectedOctype);

        localStorage.setItem('lastSelectedEmployee', selectedEmployee);
        localStorage.setItem('lastSelectedHrswork',  selectedHrswork);
        localStorage.setItem('lastSelectedOctype',   agSelectedOctype);
        localStorage.setItem('lastSelectedDatework', selectedDate);

        const eamDate = document.querySelector("input[name='datework']");
        if (eamDate) {
            eamDate.value = selectedDate;
            eamDate.dispatchEvent(new Event('change', { bubbles: true }));
        }

        panel.remove();

        // Give EAM 150ms to register field values, then click Book
        setTimeout(clickEamBookButton, 150);
    }

    function showModalDialog() {
        if (document.getElementById('apmgod-panel')) return;

        const names = getSavedNames();
        if (!names || names.length === 0) {
            showEditModal();
            return;
        }

        injectPanelStyles();

        const storedEmployee = localStorage.getItem('lastSelectedEmployee') || names[0];
        const storedDate     = localStorage.getItem('lastSelectedDatework') || getFormattedToday();
        agSelectedOctype     = localStorage.getItem('lastSelectedOctype')   || 'N';
        agSelectedHours      = localStorage.getItem('lastSelectedHrswork')  || '1';

        const hoursList = getSavedHours();
        const username  = (localStorage.getItem('apmUsername') || 'USER').toUpperCase();
        const stats     = getEamStats();

        const nameOptions = names.map(n =>
            `<option value="${n}"${n === storedEmployee ? ' selected' : ''}>${n.toUpperCase()}</option>`
        ).join('');

        const presetBtns = hoursList.map(h => {
            const isNeg = h.startsWith('-');
            const isSel = h === agSelectedHours;
            let cls = 'ag-preset-btn' + (isNeg ? ' negative' : '') + (isSel ? ' selected' : '');
            return `<button class="${cls}" data-hours="${h}">${h}</button>`;
        }).join('');

        const panel = document.createElement('div');
        panel.id = 'apmgod-panel';
        panel.innerHTML = `
            <div class="ag-header">
                <span class="ag-header-title">Schnellbuchung</span>
                <span class="ag-username-badge">${username}</span>
                <button class="ag-close" title="Schließen">×</button>
            </div>
            <div class="ag-body">
                <div class="ag-stats">
                    Gebucht: <span class="ag-stats-booked">${stats.booked}h</span>
                </div>
                <div class="ag-date-row">
                    <span class="ag-date-label">Datum</span>
                    <input class="ag-date-input" id="apmgod-date-input" type="text" value="${storedDate}" placeholder="17-JUL-2026">
                </div>
                <div class="ag-hint">Doppelklick auf Preset → sofort buchen</div>
                <div class="ag-presets">
                    ${presetBtns}
                    <button class="ag-edit-btn" id="apmgod-edit-presets" title="Bearbeiten">✏️</button>
                </div>
                <div class="ag-custom-row">
                    <input class="ag-custom-input" id="apmgod-custom-input" type="text" placeholder="Stunden…">
                    <label class="ag-abzug-label"><input type="checkbox" id="apmgod-abzug"> Abzug (-)</label>
                </div>
                <div class="ag-toggle-row">
                    <button class="ag-toggle-btn" data-octype="N" id="ag-btn-normal">Normal</button>
                    <button class="ag-toggle-btn" data-octype="O" id="ag-btn-overtime">Überstunden</button>
                </div>
                ${names.length > 1
                    ? '<div class="ag-employee-row"><select class="ag-employee-select" id="apmgod-employee">' + nameOptions + '</select></div>'
                    : '<input type="hidden" id="apmgod-employee" value="' + names[0] + '">'
                }
                <button class="ag-submit-btn" id="apmgod-submit">Arbeit buchen</button>
            </div>
        `;
        document.body.appendChild(panel);

        // Restore saved panel position (remember last drag position)
        const savedPos = localStorage.getItem('apmgod-panel-pos');
        if (savedPos) {
            try {
                const pos = JSON.parse(savedPos);
                panel.style.left  = pos.left;
                panel.style.top   = pos.top;
                panel.style.right = 'auto';
            } catch (e) {}
        }

        // Apply correct initial octype toggle state
        const btnNormal   = panel.querySelector('#ag-btn-normal');
        const btnOvertime = panel.querySelector('#ag-btn-overtime');
        btnNormal.className   = 'ag-toggle-btn' + (agSelectedOctype === 'N' ? ' active-normal'   : '');
        btnOvertime.className = 'ag-toggle-btn' + (agSelectedOctype === 'O' ? ' active-overtime' : '');

        // Draggable
        const header = panel.querySelector('.ag-header');
        let dragging = false, ox = 0, oy = 0;
        header.addEventListener('mousedown', e => {
            if (e.target.classList.contains('ag-close')) return;
            dragging = true;
            const r = panel.getBoundingClientRect();
            ox = e.clientX - r.left;
            oy = e.clientY - r.top;
        });
        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            panel.style.left  = (e.clientX - ox) + 'px';
            panel.style.top   = (e.clientY - oy) + 'px';
            panel.style.right = 'auto';
        });
        document.addEventListener('mouseup', () => {
            if (dragging) {
                const r = panel.getBoundingClientRect();
                localStorage.setItem('apmgod-panel-pos', JSON.stringify({
                    left: r.left + 'px',
                    top:  r.top  + 'px'
                }));
            }
            dragging = false;
        });

        // Enter key anywhere while panel is open = submit (capture phase so EAM can't block it)
        const agEnterHandler = e => {
            if ((e.key === 'Enter' || e.which === 13) && document.getElementById('apmgod-panel')) {
                e.preventDefault();
                e.stopPropagation();
                submitForm();
            }
        };
        document.addEventListener('keydown', agEnterHandler, true);

        // Close
        panel.querySelector('.ag-close').onclick = () => {
            document.removeEventListener('keydown', agEnterHandler, true);
            panel.remove();
        };

        // Preset buttons: click = select, dblclick = select + book
        panel.querySelectorAll('.ag-preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                agSelectedHours = btn.dataset.hours;
                const ci = document.getElementById('apmgod-custom-input');
                if (ci) ci.value = '';
                panel.querySelectorAll('.ag-preset-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
            btn.addEventListener('dblclick', () => {
                agSelectedHours = btn.dataset.hours;
                submitForm();
            });
        });

        // Edit presets
        panel.querySelector('#apmgod-edit-presets').onclick = () => showEditModal();

        // Octype toggle
        panel.querySelectorAll('.ag-toggle-btn').forEach(btn => {
            btn.onclick = () => {
                agSelectedOctype = btn.dataset.octype;
                localStorage.setItem('lastSelectedOctype', agSelectedOctype);
                panel.querySelector('#ag-btn-normal').className   = 'ag-toggle-btn' + (agSelectedOctype === 'N' ? ' active-normal'   : '');
                panel.querySelector('#ag-btn-overtime').className = 'ag-toggle-btn' + (agSelectedOctype === 'O' ? ' active-overtime' : '');
            };
        });

        // Submit
        panel.querySelector('#apmgod-submit').onclick = () => submitForm();
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

    document.addEventListener('keydown', function (event) {
        if (event.altKey && event.key === '4') {
            event.preventDefault();
            if (!document.getElementById('apmgod-panel')) showModalDialog();
            fillTimeFunction();
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

    // ─────────────────────────────────────────────
    // SECTION 8: Teilesuche ALT+5
    // ─────────────────────────────────────────────

    const TS_KEY = 'partcodeMap_v3';
    function tsLoad() { try { return JSON.parse(localStorage.getItem(TS_KEY)) || []; } catch(e) { return []; } }
    function tsSave(m) { try { localStorage.setItem(TS_KEY, JSON.stringify(m)); } catch(e) {} }

    // SVG icons (inline)
    const I_COPY   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;display:block;pointer-events:none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`;
    const I_PLUS   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;display:block;pointer-events:none"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    const I_CHECK  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;display:block;pointer-events:none"><polyline points="20 6 9 17 4 12"/></svg>`;
    const I_TRASH  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;display:block;pointer-events:none"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`;

    // Colors (dark theme, standalone — kein APM Master nötig)
    const C = {
        bg0:     '#151c2a', bg1: '#1a2235', bg2: '#202b40', bg3: '#252f42',
        border:  '#2a3447', borderHover: '#3b4d6b',
        text:    '#c8d4e8', muted: '#64748b', dim: '#475569',
        accent:  '#3b82f6', accentHover: '#2563eb',
        danger:  '#ef4444', green: '#22c55e',
        shadow:  '0 8px 32px rgba(0,0,0,.6)',
    };

    function tsStyle(el, props) { Object.assign(el.style, props); return el; }
    function tsEl(tag, props) {
        const el = document.createElement(tag);
        if (props) Object.assign(el.style, props);
        return el;
    }

    function tsToast(msg) {
        const t = tsEl('div', {position:'fixed',bottom:'24px',left:'50%',transform:'translateX(-50%)',
            background:C.bg1,border:`1px solid ${C.border}`,color:C.text,padding:'8px 18px',
            borderRadius:'6px',fontSize:'13px',zIndex:'2000001',boxShadow:C.shadow,
            whiteSpace:'nowrap',pointerEvents:'none',fontFamily:'inherit'});
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => { t.style.transition='opacity .3s'; t.style.opacity='0'; setTimeout(() => t.remove(), 320); }, 2000);
    }

    function tsActionBtn(icon, title) {
        const b = tsEl('button', {background:'transparent',border:'none',cursor:'pointer',
            color:C.muted,padding:'3px',borderRadius:'4px',display:'flex',alignItems:'center',
            transition:'color .15s',flexShrink:'0'});
        b.type = 'button'; b.title = title; b.innerHTML = icon;
        b.addEventListener('mouseenter', () => b.style.color = C.text);
        b.addEventListener('mouseleave', () => b.style.color = C.muted);
        return b;
    }

    // APMApi shortcut
    function tsAPM() {
        try { return (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).APMApi?.get?.('partsCatalog'); } catch(_) { return null; }
    }

    function tsGetSession() {
        try { const p = new URLSearchParams(window.location.search), e = p.get('eamid'), t = p.get('tenant'); if (e) return {eamid:e,tenant:t||'AMAZONRMEEU_PRD'}; } catch(_){}
        try { const f = (window !== window.top ? window.top : window).document.querySelector('iframe[src*="eamid="]'); if (f) { const p2 = new URL(f.src).searchParams, e = p2.get('eamid'); if (e) return {eamid:e,tenant:p2.get('tenant')||'AMAZONRMEEU_PRD'}; } } catch(_){}
        try { for (const w of [window, unsafeWindow, window.top]) { const ss = w?.EAM?.SessionStorage; if (ss?.eamid) return {eamid:ss.eamid,tenant:ss.tenant||'AMAZONRMEEU_PRD'}; } } catch(_){}
        try { const cat = (unsafeWindow||window).APMApi?.get?.('partsCatalog'); if (cat?.getImageUrl) { const url = cat.getImageUrl('x')||''; const m = url.match(/eamid=([^&]+)/); if (m?.[1]) return {eamid:m[1],tenant:'AMAZONRMEEU_PRD'}; } } catch(_){}
        try { const g = (unsafeWindow||window).top?.gAppData?.initparams; if (g?.eamid) return {eamid:g.eamid,tenant:g.tenant||'AMAZONRMEEU_PRD'}; } catch(_){}
        return null;
    }

    function tsGmFetch(url, params) {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest === 'undefined') {
                fetch(url, {method:'POST',credentials:'include',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'},body:new URLSearchParams(params).toString()})
                    .then(r => r.text()).then(resolve).catch(reject);
                return;
            }
            GM_xmlhttpRequest({method:'POST',url,headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'},
                data:new URLSearchParams(params).toString(),withCredentials:true,
                onload:r=>resolve(r.responseText),onerror:()=>reject(new Error('GM_xhr')),
                ontimeout:()=>reject(new Error('timeout')),timeout:15000});
        });
    }

    async function tsSearch(partcode, description, mfr, dataspyId) {
        const pq=(partcode||'').trim(), dq=(description||'').trim(), mq=(mfr||'').trim();
        if (!pq && !dq && !mq) return [];
        // Primär: APMApi (kein CORS, kein Session-Problem)
        try {
            const cat = tsAPM();
            if (cat?.searchCatalog) {
                const res = await cat.searchCatalog({partcode:pq,description:dq,mfr:mq},{limit:50,dataspyId:dataspyId||'101496'});
                return (res.records||[]).map(r=>({part:r.partcode||'',desc:r.description||'',uom:r.uom||'',pic:r.profilepicture||'',bestand:'',lager:'',lagerort:''})).filter(r=>r.part);
            }
        } catch(e) { console.warn('[TS] APMApi:', e.message); }
        // Fallback: SSPART.xmlhttp
        const s = tsGetSession();
        if (!s) { console.warn('[TS] keine session'); return []; }
        const params = {GRID_NAME:'SSPART',USER_FUNCTION_NAME:'SSPART',SYSTEM_FUNCTION_NAME:'SSPART',
            CURRENT_TAB_NAME:'LST',COMPONENT_INFO_TYPE:'DATA_ONLY',FORCE_REQUERY:'YES',MAX_ROWS:'50',
            DATASPY_ID:dataspyId||'101496',GRID_ID:'80',eamid:s.eamid,tenant:s.tenant};
        let seq=1;
        if(pq){params[`MADDON_FILTER_ALIAS_NAME_${seq}`]='partcode';params[`MADDON_FILTER_OPERATOR_${seq}`]='CONTAINS';params[`MADDON_FILTER_VALUE_${seq}`]=pq;params[`MADDON_FILTER_SEQNUM_${seq}`]=String(seq);params[`MADDON_FILTER_JOINER_${seq}`]='AND';params[`MADDON_LPAREN_${seq}`]='false';params[`MADDON_RPAREN_${seq}`]='false';seq++;}
        if(dq){params[`MADDON_FILTER_ALIAS_NAME_${seq}`]='description';params[`MADDON_FILTER_OPERATOR_${seq}`]='CONTAINS';params[`MADDON_FILTER_VALUE_${seq}`]=dq;params[`MADDON_FILTER_SEQNUM_${seq}`]=String(seq);params[`MADDON_FILTER_JOINER_${seq}`]='AND';params[`MADDON_LPAREN_${seq}`]='false';params[`MADDON_RPAREN_${seq}`]='false';seq++;}
        try {
            const text = await tsGmFetch('https://eu1.eam.hxgnsmartcloud.com/web/base/SSPART.xmlhttp', params);
            const json = JSON.parse(text);
            const rows = json?.pageData?.grid?.GRIDRESULT?.GRID?.DATA||[];
            const seen = new Set();
            return rows.filter(r=>{const p=r.partcode||'';if(!p||seen.has(p))return false;seen.add(p);return true;})
                .map(r=>({part:r.partcode||'',desc:r.description||r.partdescription||'',uom:r.uom||'',
                    bestand:r.qty||r.balance||'',lager:r.numberOfStores||'',lagerort:r.bin||r.storelocation||'',pic:r.profilepicture||''})).filter(r=>r.part);
        } catch(e) { console.warn('[TS]', e.message); return []; }
    }

    async function tsEnrichStock(results, gridEl) {
        try {
            const cat = tsAPM();
            if (!cat?.fetchPartStock) return;
            for (const r of results) {
                try {
                    const s = await cat.fetchPartStock(r.part, {site:'FRA7'});
                    const row = gridEl?.querySelector(`[data-part="${r.part}"]`);
                    if (!row || !s) continue;
                    const qty=s?.summary?.totalQty, bin=s?.summary?.primaryBin||s?.bins?.[0]?.bin||'', stores=s?.summary?.storeCount;
                    const cb=row.querySelector('.ts-cell-bestand'), cs=row.querySelector('.ts-cell-lager'), cl=row.querySelector('.ts-cell-lagerort');
                    if(cb&&qty!=null)cb.textContent=String(qty);
                    if(cs&&stores!=null)cs.textContent=String(stores);
                    if(cl&&bin)cl.textContent=bin;
                } catch(_){}
            }
        } catch(_){}
    }

    function tsBuildGrid(results, saved) {
        const wrap = tsEl('div', {flex:'1',overflowY:'auto',overflowX:'auto'});

        if (results === null) {
            // initial state — keine suche
            const intro = tsEl('div', {padding:'32px 20px',color:C.muted,fontSize:'13px',textAlign:'center'});
            intro.textContent = 'Teile-Nr. oder Beschreibung eingeben…';
            wrap.appendChild(intro);
        } else if (results.length === 0) {
            const empty = tsEl('div', {padding:'32px 20px',color:C.muted,fontSize:'13px',textAlign:'center'});
            empty.textContent = 'Keine Treffer';
            wrap.appendChild(empty);
        } else {
            // Grid
            const cols = '44px minmax(100px,0.8fr) minmax(200px,2fr) 60px 52px 52px minmax(80px,1fr) 80px';
            const grid = tsEl('div', {display:'grid',gridTemplateColumns:cols,width:'100%',minWidth:'700px'});

            // Header row
            const hdr = tsEl('div', {display:'contents'});
            for (const [lbl,cls] of [['Bild',''],['Teil',''],['Beschreibung',''],['Bestand','ts-cell-bestand'],['Lager',''],['UOM',''],['Lagerort',''],['','']] ) {
                const th = tsEl('div', {padding:'6px 8px',fontSize:'11px',color:C.muted,borderBottom:`1px solid ${C.border}`,fontWeight:'600',letterSpacing:'.04em',textTransform:'uppercase',position:'sticky',top:'0',background:C.bg1,zIndex:'1'});
                th.textContent = lbl;
                grid.appendChild(th);
            }

            for (const r of results) {
                const isSaved = saved.some(e => e.part === r.part);
                const row = tsEl('div', {display:'contents'});
                row.dataset = {};

                const cells = [];
                const mkCell = (cls='') => {
                    const c = tsEl('div', {padding:'7px 8px',fontSize:'12px',color:C.text,borderBottom:`1px solid rgba(42,52,71,.6)`,display:'flex',alignItems:'center',background:isSaved?'rgba(59,130,246,.04)':'transparent'});
                    if(cls) c.className = cls;
                    cells.push(c);
                    return c;
                };

                // Image
                const imgC = mkCell();
                if (r.pic) {
                    const img = document.createElement('img');
                    img.style.cssText = 'width:36px;height:36px;object-fit:contain;border-radius:4px;background:#0f1621;';
                    img.onerror = () => { img.style.display='none'; };
                    const s = tsGetSession();
                    img.src = s ? `https://eu1.eam.hxgnsmartcloud.com/web/base/VIEWUDOC?documentcode=${encodeURIComponent(r.pic)}&keepcontenttype=true&eamid=${s.eamid}&tenant=AMAZONRMEEU_PRD` : '';
                    imgC.appendChild(img);
                }

                // Part number
                const partC = mkCell();
                const link = document.createElement('a');
                link.href = `https://eu1.eam.hxgnsmartcloud.com/web/base/logindisp?tenant=AMAZONRMEEU_PRD&SYSTEM_FUNCTION_NAME=SSPART&USER_FUNCTION_NAME=SSPART&DRILLBACK=YES&partcode=${encodeURIComponent(r.part)}`;
                link.target = '_blank';
                link.textContent = r.part;
                link.style.cssText = `color:${C.accent};text-decoration:none;font-family:monospace;font-size:12px;font-weight:600;`;
                link.addEventListener('mouseenter', ()=>link.style.textDecoration='underline');
                link.addEventListener('mouseleave', ()=>link.style.textDecoration='none');
                const cpPart = tsActionBtn(I_COPY, 'Kopieren');
                cpPart.style.marginLeft = '4px';
                cpPart.onclick = () => { navigator.clipboard.writeText(r.part); tsToast(`📋 ${r.part} kopiert`); };
                partC.appendChild(link); partC.appendChild(cpPart);

                // Desc
                const descC = mkCell();
                descC.textContent = r.desc;
                descC.style.color = C.muted;

                // Bestand / Lager / UOM / Lagerort
                const bestandC = mkCell('ts-cell-bestand'); bestandC.textContent = r.bestand || '…';
                bestandC.style.color = C.muted; bestandC.style.justifyContent = 'center';
                const lagerC = mkCell('ts-cell-lager'); lagerC.textContent = r.lager || '…';
                lagerC.style.color = C.muted; lagerC.style.justifyContent = 'center';
                const uomC = mkCell(); uomC.textContent = r.uom || '—';
                uomC.style.color = C.dim; uomC.style.justifyContent = 'center';
                const lagerortC = mkCell('ts-cell-lagerort'); lagerortC.textContent = r.lagerort || '…';
                lagerortC.style.color = C.muted;

                // Actions
                const actC = mkCell();
                actC.style.gap = '2px';
                const addBtn = tsActionBtn(I_PLUS, 'Speichern');
                const ckBtn  = tsActionBtn(I_CHECK, 'Gespeichert');
                ckBtn.style.color = C.green;
                const rmBtn  = tsActionBtn(I_TRASH, 'Entfernen');
                rmBtn.addEventListener('mouseenter', ()=>rmBtn.style.color=C.danger);
                rmBtn.addEventListener('mouseleave', ()=>rmBtn.style.color=C.muted);

                if (isSaved) {
                    actC.appendChild(ckBtn);
                    actC.appendChild(rmBtn);
                    rmBtn.onclick = () => {
                        const cur=tsLoad(), idx=cur.findIndex(e=>e.part===r.part);
                        if(idx>=0){cur.splice(idx,1);tsSave(cur);}
                        tsToast(`🗑️ "${r.part}" entfernt`);
                        rebuildBody();
                    };
                } else {
                    actC.appendChild(addBtn);
                    addBtn.onclick = () => {
                        const cur=tsLoad();
                        if(!cur.find(e=>e.part===r.part)) { cur.push({part:r.part,desc:r.desc,uom:r.uom,key:r.desc}); tsSave(cur); }
                        tsToast(`✅ "${r.part}" gespeichert`);
                        addBtn.replaceWith(ckBtn);
                    };
                }

                // Assemble row — set data-part on all cells
                for (const c of cells) { c.dataset.part = r.part; }
                // dummy container for data-part lookup
                const rowWrap = tsEl('div', {display:'contents'});
                rowWrap.dataset.part = r.part;
                cells.forEach(c => grid.appendChild(c));
            }
            wrap.appendChild(grid);
        }

        // Gespeicherte Teile section
        const savedList = tsLoad();
        if (savedList.length > 0) {
            const sep = tsEl('div', {margin:'0 12px',borderTop:`1px solid ${C.border}`,paddingTop:'10px',paddingBottom:'4px'});
            const secLbl = tsEl('div', {padding:'4px 8px 8px',fontSize:'11px',color:C.muted,fontWeight:'600',letterSpacing:'.05em',textTransform:'uppercase'});
            secLbl.textContent = `Gespeicherte Teile (${savedList.length})`;
            sep.appendChild(secLbl);
            for (const entry of savedList) {
                const row = tsEl('div', {display:'flex',alignItems:'center',gap:'8px',padding:'5px 8px',borderRadius:'4px',cursor:'default'});
                row.addEventListener('mouseenter', ()=>row.style.background=C.bg2);
                row.addEventListener('mouseleave', ()=>row.style.background='transparent');
                const num = tsEl('span', {fontFamily:'monospace',fontSize:'12px',color:C.accent,fontWeight:'600',flexShrink:'0'});
                num.textContent = entry.part;
                const dsc = tsEl('span', {fontSize:'12px',color:C.muted,flex:'1',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'});
                dsc.textContent = entry.desc || entry.key || '';
                const cp = tsActionBtn(I_COPY, 'Kopieren');
                cp.onclick = () => { navigator.clipboard.writeText(entry.part); tsToast(`📋 ${entry.part} kopiert`); };
                const rm = tsActionBtn(I_TRASH, 'Entfernen');
                rm.addEventListener('mouseenter', ()=>rm.style.color=C.danger);
                rm.addEventListener('mouseleave', ()=>rm.style.color=C.muted);
                rm.onclick = () => {
                    const cur=tsLoad(), idx=cur.findIndex(e=>e.part===entry.part);
                    if(idx>=0){cur.splice(idx,1);tsSave(cur);}
                    row.remove();
                    tsToast(`🗑️ "${entry.part}" entfernt`);
                };
                row.appendChild(num); row.appendChild(dsc); row.appendChild(cp); row.appendChild(rm);
                sep.appendChild(row);
            }
            wrap.appendChild(sep);
        }

        return wrap;
    }

    let _currentResults = null;
    let _currentBody = null;

    function rebuildBody() {
        if (!_currentBody) return;
        _currentBody.innerHTML = '';
        const saved = tsLoad();
        _currentBody.appendChild(tsBuildGrid(_currentResults, saved));
    }

    function showTeilesuche() {
        const existing = document.getElementById('apmgod-ts');
        if (existing) { existing.remove(); return; }

        // Outer popup
        const popup = tsEl('div', {
            position:'fixed', top:'52px', left:'50%', transform:'translateX(-50%)',
            width:'860px', maxWidth:'calc(100vw - 40px)',
            background:C.bg0, border:`1px solid ${C.border}`,
            borderRadius:'8px', boxShadow:C.shadow,
            zIndex:'100001', display:'flex', flexDirection:'column',
            maxHeight:'calc(100vh - 80px)', fontFamily:'Arial,sans-serif',
            overflow:'hidden',
        });
        popup.id = 'apmgod-ts';

        // Restore position
        try {
            const pos = JSON.parse(localStorage.getItem('apmgod-ts-pos')||'null');
            if (pos) { popup.style.left=pos.left; popup.style.top=pos.top; popup.style.transform='none'; }
        } catch(_) {}

        // ── Header ──
        const hdr = tsEl('div', {
            display:'flex', alignItems:'center', gap:'8px', padding:'10px 14px',
            borderBottom:`1px solid ${C.border}`, flexShrink:'0',
            background:C.bg1, cursor:'grab', userSelect:'none',
            borderRadius:'8px 8px 0 0',
        });
        const title = tsEl('span', {fontSize:'13px',fontWeight:'700',color:C.text,flexShrink:'0'});
        title.textContent = 'Teilesuche';

        // site selector
        const site = document.createElement('select');
        tsStyle(site, {background:C.bg2,border:`1px solid ${C.border}`,color:C.text,borderRadius:'4px',padding:'3px 6px',fontSize:'12px',cursor:'pointer'});
        site.innerHTML = '<option value="FRA7" selected>FRA7</option>';

        // dataspy selector
        const dsSel = document.createElement('select');
        tsStyle(dsSel, {background:C.bg2,border:`1px solid ${C.border}`,color:C.text,borderRadius:'4px',padding:'3px 6px',fontSize:'12px',cursor:'pointer'});
        dsSel.innerHTML = '<option value="82" selected>All Parts</option><option value="100455">Parts in Service</option><option value="101496">Parts in my Stores</option>';

        // search inputs
        function mkInput(ph) {
            const inp = document.createElement('input');
            inp.type = 'search'; inp.placeholder = ph;
            tsStyle(inp, {flex:'1',minWidth:'80px',background:C.bg2,border:`1px solid ${C.border}`,color:C.text,
                borderRadius:'4px',padding:'4px 8px',fontSize:'12px',outline:'none'});
            inp.addEventListener('focus', ()=>inp.style.borderColor=C.accent);
            inp.addEventListener('blur',  ()=>inp.style.borderColor=C.border);
            return inp;
        }
        const inpPart = mkInput('Teile-Nr.');
        const inpDesc = mkInput('Beschreibung');
        const inpMfr  = mkInput('Hersteller-Nr.');

        // close button
        const closeBtn = tsEl('button', {background:'transparent',border:'none',cursor:'pointer',
            color:C.muted,fontSize:'18px',lineHeight:'1',padding:'0 2px',flexShrink:'0'});
        closeBtn.type = 'button'; closeBtn.title = 'Schließen'; closeBtn.textContent = '×';
        closeBtn.addEventListener('mouseenter', ()=>closeBtn.style.color=C.text);
        closeBtn.addEventListener('mouseleave', ()=>closeBtn.style.color=C.muted);
        closeBtn.onclick = () => popup.remove();

        hdr.appendChild(title);
        hdr.appendChild(tsEl('span', {flex:'1'}));
        hdr.appendChild(site);
        hdr.appendChild(dsSel);
        hdr.appendChild(inpPart);
        hdr.appendChild(inpDesc);
        hdr.appendChild(inpMfr);
        hdr.appendChild(closeBtn);

        // ── Body ──
        const body = tsEl('div', {flex:'1',overflowY:'auto',minHeight:'120px'});
        _currentBody = body;
        _currentResults = null;
        body.appendChild(tsBuildGrid(null, tsLoad()));

        popup.appendChild(hdr);
        popup.appendChild(body);
        document.body.appendChild(popup);

        // Draggable
        let drag=false, ox=0, oy=0;
        hdr.addEventListener('mousedown', e => {
            if (e.target.closest('select,input,button')) return;
            drag=true; hdr.style.cursor='grabbing';
            const r=popup.getBoundingClientRect(); ox=e.clientX-r.left; oy=e.clientY-r.top;
            popup.style.transform='none';
        });
        document.addEventListener('mousemove', e => {
            if (!drag) return;
            popup.style.left=(e.clientX-ox)+'px'; popup.style.top=(e.clientY-oy)+'px';
        });
        document.addEventListener('mouseup', () => {
            if (drag) {
                hdr.style.cursor='grab';
                const r=popup.getBoundingClientRect();
                localStorage.setItem('apmgod-ts-pos', JSON.stringify({left:r.left+'px',top:r.top+'px'}));
            }
            drag=false;
        });

        // Search logic
        let timer;
        function doSearch() {
            const pq=inpPart.value.trim(), dq=inpDesc.value.trim(), mq=inpMfr.value.trim();
            if (!pq&&!dq&&!mq) return;
            body.innerHTML = '';
            const loading = tsEl('div', {padding:'32px',color:C.muted,fontSize:'13px',textAlign:'center'});
            loading.textContent = 'Suche läuft…';
            body.appendChild(loading);
            tsSearch(pq, dq, mq, dsSel.value).then(results => {
                _currentResults = results;
                body.innerHTML = '';
                body.appendChild(tsBuildGrid(results, tsLoad()));
                // lazy stock enrichment
                const grid = body.querySelector('[data-part]')?.parentElement;
                if (results.length) tsEnrichStock(results, body);
            });
        }

        [inpPart, inpDesc, inpMfr].forEach(inp => {
            inp.addEventListener('input', () => { clearTimeout(timer); if(inp.value.trim()) timer=setTimeout(doSearch,350); });
            inp.addEventListener('keydown', e => { if(e.key==='Enter'){clearTimeout(timer);doSearch();} });
        });

        setTimeout(() => inpDesc.focus(), 50);
    }

    // ALT+5 toggle
    document.addEventListener('keydown', e => {
        if (e.altKey && e.key==='5') { e.preventDefault(); showTeilesuche(); }
    });

    // Trigger button (fixed, oben rechts)
    (function() {
        if (document.getElementById('apmgod-ts-btn')) return;
        const btn = tsEl('button', {
            position:'fixed', top:'6px', right:'155px', zIndex:'99999',
            height:'28px', padding:'0 12px', fontSize:'12px', fontWeight:'600',
            cursor:'pointer', borderRadius:'4px', fontFamily:'Arial,sans-serif',
            border:`1px solid ${C.border}`, background:C.bg1, color:C.text,
            display:'flex', alignItems:'center', gap:'6px', transition:'all .15s',
        });
        btn.id = 'apmgod-ts-btn';
        btn.type = 'button';
        btn.title = 'Teilesuche (ALT+5)';
        btn.innerHTML = I_COPY + ' Teilesuche';
        btn.addEventListener('mouseenter', ()=>{btn.style.borderColor=C.accent;btn.style.color=C.accent;});
        btn.addEventListener('mouseleave', ()=>{btn.style.borderColor=C.border;btn.style.color=C.text;});
        btn.onclick = showTeilesuche;
        document.body.appendChild(btn);
    })();

})();