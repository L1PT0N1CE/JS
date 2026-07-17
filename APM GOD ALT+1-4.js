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

    // Shared localStorage key with Partnumbers script (partcodeMap_v3)
    const TS_KEY = 'partcodeMap_v3';

    function tsLoadMap() {
        try { const s = localStorage.getItem(TS_KEY); if (s) return JSON.parse(s); } catch(e) {}
        return [];
    }
    function tsSaveMap(m) {
        try { localStorage.setItem(TS_KEY, JSON.stringify(m)); return true; } catch(e) { return false; }
    }

    function tsGetSession() {
        try {
            const p = new URLSearchParams(window.location.search), e = p.get('eamid'), t = p.get('tenant');
            if (e) return { eamid: e, tenant: t || 'AMAZONRMEEU_PRD' };
        } catch(_) {}
        try {
            const win = window !== window.top ? window.top : window;
            const f = win.document.querySelector('iframe[src*="eamid="]');
            if (f) { const p2 = new URL(f.src).searchParams; const e = p2.get('eamid'); if (e) return { eamid: e, tenant: p2.get('tenant') || 'AMAZONRMEEU_PRD' }; }
        } catch(_) {}
        try {
            const cat = window.APMApi?.get?.('partsCatalog');
            if (cat?.getImageUrl) { const url = cat.getImageUrl('x') || ''; const m = url.match(/eamid=([^&]+)/); if (m?.[1]) return { eamid: m[1], tenant: 'AMAZONRMEEU_PRD' }; }
        } catch(_) {}
        return null;
    }

    async function tsSearch(partcode, description) {
        const s = tsGetSession();
        if (!s) { console.warn('[Teilesuche] Session nicht gefunden'); return []; }
        const pq = (partcode || '').trim(), dq = (description || '').trim();
        if (!pq && !dq) return [];
        const params = {
            GRID_NAME: 'SSPART', USER_FUNCTION_NAME: 'SSPART', SYSTEM_FUNCTION_NAME: 'SSPART',
            CURRENT_TAB_NAME: 'LST', COMPONENT_INFO_TYPE: 'DATA_ONLY',
            FORCE_REQUERY: 'YES', MAX_ROWS: '50',
            DATASPY_ID: '101496', GRID_ID: '80',
            eamid: s.eamid, tenant: s.tenant,
        };
        let seq = 1;
        if (pq) { params[`MADDON_FILTER_ALIAS_NAME_${seq}`]='partcode'; params[`MADDON_FILTER_OPERATOR_${seq}`]='CONTAINS'; params[`MADDON_FILTER_VALUE_${seq}`]=pq; params[`MADDON_FILTER_SEQNUM_${seq}`]=String(seq); params[`MADDON_FILTER_JOINER_${seq}`]='AND'; params[`MADDON_LPAREN_${seq}`]='false'; params[`MADDON_RPAREN_${seq}`]='false'; seq++; }
        if (dq) { params[`MADDON_FILTER_ALIAS_NAME_${seq}`]='description'; params[`MADDON_FILTER_OPERATOR_${seq}`]='CONTAINS'; params[`MADDON_FILTER_VALUE_${seq}`]=dq; params[`MADDON_FILTER_SEQNUM_${seq}`]=String(seq); params[`MADDON_FILTER_JOINER_${seq}`]='AND'; params[`MADDON_LPAREN_${seq}`]='false'; params[`MADDON_RPAREN_${seq}`]='false'; seq++; }
        try {
            const r = await fetch('https://eu1.eam.hxgnsmartcloud.com/web/base/SSPART.xmlhttp', {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
                body: new URLSearchParams(params).toString()
            });
            const json = JSON.parse(await r.text());
            if (json?.pageData?.messages?.some(m => m.type === 'error')) { console.warn('[Teilesuche] EAM Error:', json.pageData.messages[0]?.msg); return []; }
            const rows = json?.pageData?.grid?.GRIDRESULT?.GRID?.DATA || [];
            const seen = new Set();
            return rows.filter(row => { const p = row.partcode || ''; if (!p || seen.has(p)) return false; seen.add(p); return true; }).map(row => ({
                part:     row.partcode         || '',
                desc:     row.description      || row.partdescription || '',
                uom:      row.uom              || '',
                bestand:  row.qty              || row.balance         || row.stockbalance || row.quantity || '',
                lager:    row.storeroom        || row.store           || '',
                lagerort: row.bin              || row.storelocation   || row.location     || '',
                pic:      row.profilepicture   || '',
                eamid:    s.eamid,
            })).filter(r => r.part);
        } catch(e) { console.warn('[Teilesuche]', e.message); return []; }
    }

    function tsMk(tag, style) { const e = document.createElement(tag); if (style) e.style.cssText = style; return e; }

    function tsToast(msg) {
        const t = tsMk('div', 'position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:#1a2a3a;border:1px solid #2a4060;color:#c0d8f8;padding:10px 22px;border-radius:6px;font-size:13px;z-index:2000000;box-shadow:0 4px 12px rgba(0,0,0,.5);white-space:nowrap;pointer-events:none;');
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 2000);
    }

    function tsRenderSaved(container) {
        const map = tsLoadMap();
        container.innerHTML = '';
        if (!map.length) {
            const emp = tsMk('div', 'padding:20px;text-align:center;color:#475569;font-size:12px;font-style:italic;');
            emp.textContent = 'Keine gespeicherten Teile';
            container.appendChild(emp);
            return;
        }
        // Group by first letter of key (like APM Master's AR group)
        const groups = {};
        map.forEach(e => {
            const g = (e.key || e.part || '?')[0].toUpperCase();
            if (!groups[g]) groups[g] = [];
            groups[g].push(e);
        });
        Object.keys(groups).sort().forEach(g => {
            const ghdr = tsMk('div', 'padding:4px 14px;background:#0f1621;color:#3b82f6;font-size:11px;font-weight:700;letter-spacing:.6px;cursor:pointer;user-select:none;');
            ghdr.textContent = g;
            container.appendChild(ghdr);
            groups[g].forEach(entry => {
                const row = tsMk('div', 'display:grid;grid-template-columns:80px 1fr 80px 48px 80px;padding:7px 14px;border-bottom:1px solid #1e2a3a;align-items:center;font-size:12px;gap:8px;transition:background .1s;');
                row.addEventListener('mouseenter', () => row.style.background = '#1e2a3c');
                row.addEventListener('mouseleave', () => row.style.background = '');

                const pCell = tsMk('span', 'color:#60a5fa;font-weight:700;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;');
                pCell.textContent = entry.part;
                pCell.title = 'Klicken zum Kopieren';
                pCell.onclick = () => { navigator.clipboard.writeText(entry.part); tsToast(`📋 ${entry.part} kopiert`); };

                const dCell = tsMk('span', 'color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;');
                dCell.textContent = entry.desc || entry.key;

                const kCell = tsMk('span', 'color:#475569;font-size:11px;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;');
                kCell.textContent = entry.key;

                const uCell = tsMk('span', 'color:#475569;font-size:11px;');
                uCell.textContent = entry.uom || '';

                const actions = tsMk('div', 'display:flex;gap:4px;align-items:center;justify-content:flex-end;');

                // Copy button
                const cpBtn = tsMk('button', 'width:26px;height:26px;background:#1d4ed8;border:none;border-radius:4px;color:white;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;');
                cpBtn.textContent = '📋'; cpBtn.title = 'Kopieren';
                cpBtn.onclick = () => { navigator.clipboard.writeText(entry.part); tsToast(`📋 ${entry.part} kopiert`); };

                // Delete button
                const dlBtn = tsMk('button', 'width:26px;height:26px;background:#7f1d1d;border:1px solid #ef4444;border-radius:4px;color:#fca5a5;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;');
                dlBtn.textContent = '×'; dlBtn.title = 'Entfernen';
                dlBtn.onclick = () => {
                    const cur = tsLoadMap();
                    const idx = cur.findIndex(e => e.part === entry.part && e.key === entry.key);
                    if (idx >= 0) { cur.splice(idx, 1); tsSaveMap(cur); }
                    row.remove();
                    tsToast(`🗑️ "${entry.part}" entfernt`);
                };

                actions.appendChild(cpBtn);
                actions.appendChild(dlBtn);
                [pCell, dCell, kCell, uCell, actions].forEach(c => row.appendChild(c));
                container.appendChild(row);
            });
        });
    }

    function showTeilesuche() {
        if (document.getElementById('apmgod-teile-panel')) return;

        // Inject styles
        if (!document.getElementById('apmgod-teile-styles')) {
            const s = document.createElement('style');
            s.id = 'apmgod-teile-styles';
            s.textContent = '#apmgod-teile-panel *{box-sizing:border-box} #apmgod-teile-panel ::-webkit-scrollbar{width:5px} #apmgod-teile-panel ::-webkit-scrollbar-track{background:#0f1621} #apmgod-teile-panel ::-webkit-scrollbar-thumb{background:#2a3447;border-radius:3px}';
            document.head.appendChild(s);
        }

        const panel = tsMk('div', 'position:fixed;top:60px;left:50%;transform:translateX(-50%);width:820px;max-height:85vh;background:#1a2332;border:1px solid #2a3447;border-radius:8px;z-index:99998;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-size:13px;color:#c8d4e8;box-shadow:0 12px 48px rgba(0,0,0,.7);display:flex;flex-direction:column;user-select:none;');
        panel.id = 'apmgod-teile-panel';

        // ── Header ──
        const hdr = tsMk('div', 'background:#151b27;border-bottom:1px solid #2a3447;border-radius:8px 8px 0 0;padding:10px 14px;display:flex;align-items:center;gap:10px;cursor:move;flex-shrink:0;');
        const htitle = tsMk('span', 'font-size:14px;font-weight:700;color:#e2e8f0;flex:1;letter-spacing:.5px;');
        htitle.textContent = 'Teilesuche';
        const hclose = tsMk('button', 'background:none;border:none;color:#64748b;cursor:pointer;font-size:20px;padding:0 2px;line-height:1;transition:color .15s;');
        hclose.textContent = '×';
        hclose.onmouseover = () => hclose.style.color = '#ef4444';
        hclose.onmouseout  = () => hclose.style.color = '#64748b';
        hclose.onclick = () => panel.remove();
        hdr.appendChild(htitle); hdr.appendChild(hclose);

        // ── Search bar ──
        const searchBar = tsMk('div', 'padding:10px 14px;background:#151b27;border-bottom:1px solid #2a3447;display:flex;gap:8px;align-items:center;flex-shrink:0;');
        function mkInp(ph, w) {
            const i = tsMk('input', `height:32px;padding:0 10px;background:#0f1621;border:1px solid #2a3447;border-radius:5px;color:#c8d4e8;font-size:12px;font-family:monospace;outline:none;${w ? 'width:' + w + ';flex-shrink:0;' : 'flex:1;'}`);
            i.placeholder = ph;
            i.addEventListener('focus',  () => i.style.borderColor = '#3b82f6');
            i.addEventListener('blur',   () => i.style.borderColor = '#2a3447');
            return i;
        }
        const pInp  = mkInp('Teile-Nr.', '180px');
        const dInp  = mkInp('Beschreibung');
        const mInp  = mkInp('Hersteller-Teile-Nr.', '180px');
        const goBtn = tsMk('button', 'height:32px;padding:0 16px;background:#1d4ed8;border:none;border-radius:5px;color:#fff;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:background .15s;');
        goBtn.textContent = '🔍 Suchen';
        goBtn.onmouseover = () => goBtn.style.background = '#1e40af';
        goBtn.onmouseout  = () => goBtn.style.background = '#1d4ed8';
        [pInp, dInp, mInp, goBtn].forEach(e => searchBar.appendChild(e));

        // ── Status ──
        const status = tsMk('div', 'padding:5px 14px;color:#475569;font-size:11px;font-style:italic;background:#151b27;border-bottom:1px solid #2a3447;flex-shrink:0;min-height:24px;');
        status.textContent = 'Teile-Nr. und/oder Beschreibung eingeben → Enter oder Suchen';

        // ── Col headers ──
        const colHdr = tsMk('div', 'display:grid;grid-template-columns:48px 90px 1fr 70px 48px 110px 80px;padding:5px 14px;background:#0f1621;border-bottom:1px solid #2a3447;font-size:10px;font-weight:700;color:#475569;letter-spacing:.6px;text-transform:uppercase;flex-shrink:0;gap:8px;');
        ['BILD','TEIL','BESCHREIBUNG','BESTAND','UOM','LAGERORT','AKTIONEN'].forEach(h => {
            const c = tsMk('span'); c.textContent = h; colHdr.appendChild(c);
        });

        // ── Results area ──
        const results = tsMk('div', 'overflow-y:auto;flex:1;background:#1a2332;min-height:80px;');

        // ── Saved divider ──
        const savedHdr = tsMk('div', 'padding:6px 14px;background:#0f1621;border-top:1px solid #2a3447;border-bottom:1px solid #2a3447;font-size:11px;font-weight:700;color:#475569;letter-spacing:.6px;flex-shrink:0;display:flex;align-items:center;gap:8px;');
        savedHdr.innerHTML = '<span style="flex:1;text-align:center;letter-spacing:.8px;">— GESPEICHERTE TEILE —</span>';

        // ── Saved col headers ──
        const savedColHdr = tsMk('div', 'display:grid;grid-template-columns:80px 1fr 80px 48px 80px;padding:5px 14px;background:#0f1621;border-bottom:1px solid #2a3447;font-size:10px;font-weight:700;color:#475569;letter-spacing:.6px;text-transform:uppercase;flex-shrink:0;gap:8px;');
        ['TEIL','BESCHREIBUNG','ALIAS','UOM','AKTIONEN'].forEach(h => {
            const c = tsMk('span'); c.textContent = h; savedColHdr.appendChild(c);
        });

        // ── Saved list ──
        const savedList = tsMk('div', 'overflow-y:auto;max-height:180px;background:#151b27;border-radius:0 0 8px 8px;flex-shrink:0;');
        tsRenderSaved(savedList);

        panel.appendChild(hdr);
        panel.appendChild(searchBar);
        panel.appendChild(status);
        panel.appendChild(colHdr);
        panel.appendChild(results);
        panel.appendChild(savedHdr);
        panel.appendChild(savedColHdr);
        panel.appendChild(savedList);
        document.body.appendChild(panel);

        // Restore position
        const savedPos = localStorage.getItem('apmgod-teile-pos');
        if (savedPos) {
            try {
                const pos = JSON.parse(savedPos);
                panel.style.left = pos.left; panel.style.top = pos.top; panel.style.transform = 'none';
            } catch(e) {}
        }

        // Draggable
        let dragging = false, ox = 0, oy = 0;
        hdr.addEventListener('mousedown', e => {
            if (e.target === hclose) return;
            dragging = true;
            const r = panel.getBoundingClientRect();
            ox = e.clientX - r.left; oy = e.clientY - r.top;
        });
        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            panel.style.left = (e.clientX - ox) + 'px'; panel.style.top = (e.clientY - oy) + 'px'; panel.style.transform = 'none';
        });
        document.addEventListener('mouseup', () => {
            if (dragging) {
                const r = panel.getBoundingClientRect();
                localStorage.setItem('apmgod-teile-pos', JSON.stringify({ left: r.left + 'px', top: r.top + 'px' }));
            }
            dragging = false;
        });

        // Search logic
        async function doSearch() {
            const pq = pInp.value.trim(), dq = dInp.value.trim();
            if (!pq && !dq) return;
            status.style.color = '#3b82f6';
            status.textContent = '⏳ Suche läuft…';
            results.innerHTML = '';
            const data = await tsSearch(pq, dq);
            if (!data.length) { status.style.color = '#ef4444'; status.textContent = 'Keine Treffer in EAM (Parts in my Stores · FRA7)'; return; }
            status.style.color = '#22c55e';
            status.textContent = `${data.length} Treffer`;

            const map = tsLoadMap();
            data.forEach(r => {
                const isSaved = map.some(e => e.part === r.part);
                const row = tsMk('div', `display:grid;grid-template-columns:48px 90px 1fr 70px 48px 110px 80px;padding:7px 14px;border-bottom:1px solid #1e2a3a;align-items:center;font-size:12px;gap:8px;transition:background .1s;${isSaved ? 'opacity:.55;' : ''}`);
                row.addEventListener('mouseenter', () => row.style.background = '#1e2a3c');
                row.addEventListener('mouseleave', () => row.style.background = '');

                // BILD
                const imgCell = tsMk('div', 'width:40px;height:40px;display:flex;align-items:center;justify-content:center;');
                if (r.pic) {
                    const img = tsMk('img', 'width:38px;height:38px;object-fit:contain;border-radius:3px;border:1px solid #2a3447;cursor:zoom-in;transition:transform .15s;');
                    img.src = `https://eu1.eam.hxgnsmartcloud.com/web/base/VIEWUDOC?documentcode=${encodeURIComponent(r.pic)}&keepcontenttype=true&eamid=${r.eamid}`;
                    img.onerror = () => { imgCell.textContent = '—'; imgCell.style.cssText += 'color:#475569;font-size:11px;'; };
                    img.addEventListener('mouseenter', () => img.style.transform = 'scale(4) translateX(12px)');
                    img.addEventListener('mouseleave', () => img.style.transform = '');
                    imgCell.appendChild(img);
                } else {
                    imgCell.innerHTML = '<span style="color:#334;font-size:11px;">—</span>';
                }

                // TEIL
                const partCell = tsMk('span', 'color:#60a5fa;font-weight:700;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;');
                partCell.textContent = r.part;
                partCell.title = 'Klicken zum Kopieren';
                partCell.onclick = () => { navigator.clipboard.writeText(r.part); tsToast(`📋 ${r.part} kopiert`); };

                // BESCHREIBUNG
                const descCell = tsMk('span', 'color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;');
                descCell.textContent = r.desc;

                // BESTAND
                const bestandCell = tsMk('span', 'color:#e2e8f0;font-weight:600;font-family:monospace;');
                bestandCell.textContent = r.bestand || '—';

                // UOM
                const uomCell = tsMk('span', 'color:#475569;font-size:11px;');
                uomCell.textContent = r.uom;

                // LAGERORT
                const lortCell = tsMk('span', 'color:#94a3b8;font-family:monospace;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;');
                lortCell.textContent = r.lagerort || r.lager || '—';

                // AKTIONEN
                const actCell = tsMk('div', 'display:flex;gap:4px;align-items:center;');

                // Copy
                const cpBtn = tsMk('button', 'width:26px;height:26px;background:#1d4ed8;border:none;border-radius:4px;color:white;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;transition:background .15s;');
                cpBtn.textContent = '📋'; cpBtn.title = 'Partnummer kopieren';
                cpBtn.onclick = () => { navigator.clipboard.writeText(r.part); tsToast(`📋 ${r.part} kopiert`); };

                // Save / Saved toggle
                if (isSaved) {
                    const ckBtn = tsMk('button', 'width:26px;height:26px;background:#1a2030;border:1px solid #2a3040;border-radius:4px;color:#22c55e;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:default;');
                    ckBtn.textContent = '✓'; ckBtn.title = 'Bereits gespeichert';
                    const rmBtn = tsMk('button', 'width:26px;height:26px;background:#7f1d1d;border:1px solid #ef4444;border-radius:4px;color:#fca5a5;font-size:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;');
                    rmBtn.textContent = '−'; rmBtn.title = 'Entfernen';
                    rmBtn.onclick = () => {
                        const cur = tsLoadMap();
                        const idx = cur.findIndex(e => e.part === r.part);
                        if (idx >= 0) { cur.splice(idx, 1); tsSaveMap(cur); }
                        row.style.opacity = '1';
                        ckBtn.remove(); rmBtn.remove();
                        actCell.appendChild(addBtn2());
                        tsRenderSaved(savedList);
                        tsToast(`🗑️ "${r.part}" entfernt`);
                    };
                    actCell.appendChild(cpBtn); actCell.appendChild(ckBtn); actCell.appendChild(rmBtn);
                } else {
                    actCell.appendChild(cpBtn);
                    actCell.appendChild(addBtn2());
                }

                function addBtn2() {
                    const ab = tsMk('button', 'width:26px;height:26px;background:#15803d;border:1px solid #22c55e;border-radius:4px;color:white;font-size:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s;');
                    ab.textContent = '+'; ab.title = 'Speichern';
                    ab.onmouseover = () => ab.style.background = '#16a34a';
                    ab.onmouseout  = () => ab.style.background = '#15803d';
                    ab.onclick = () => {
                        const alias = (prompt(`Alias für "${r.part}":\n(leer = Partnummer als Key)`, r.part.toLowerCase()) ?? '').trim();
                        const key = alias || r.part.toLowerCase();
                        const cur = tsLoadMap();
                        if (!cur.some(e => e.part === r.part)) { cur.push({ key, part: r.part, desc: r.desc, uom: r.uom }); tsSaveMap(cur); }
                        row.style.opacity = '.55';
                        ab.remove();
                        const ck = tsMk('button', 'width:26px;height:26px;background:#1a2030;border:1px solid #2a3040;border-radius:4px;color:#22c55e;font-size:12px;display:flex;align-items:center;justify-content:center;cursor:default;');
                        ck.textContent = '✓';
                        const rm = tsMk('button', 'width:26px;height:26px;background:#7f1d1d;border:1px solid #ef4444;border-radius:4px;color:#fca5a5;font-size:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;');
                        rm.textContent = '−'; rm.title = 'Entfernen';
                        rm.onclick = () => {
                            const cur2 = tsLoadMap();
                            const idx = cur2.findIndex(e => e.part === r.part);
                            if (idx >= 0) { cur2.splice(idx, 1); tsSaveMap(cur2); }
                            row.style.opacity = '1'; ck.remove(); rm.remove(); actCell.appendChild(addBtn2());
                            tsRenderSaved(savedList);
                            tsToast(`🗑️ "${r.part}" entfernt`);
                        };
                        actCell.appendChild(ck); actCell.appendChild(rm);
                        tsRenderSaved(savedList);
                        tsToast(`✅ "${r.part}" gespeichert als "${key}"`);
                    };
                    return ab;
                }

                [imgCell, partCell, descCell, bestandCell, uomCell, lortCell, actCell].forEach(c => row.appendChild(c));
                results.appendChild(row);
            });
        }

        goBtn.onclick = doSearch;
        [pInp, dInp, mInp].forEach(i => i.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); }));
        setTimeout(() => pInp.focus(), 80);
    }

    // ALT+5 — Teilesuche öffnen/schließen
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === '5') {
            e.preventDefault();
            const existing = document.getElementById('apmgod-teile-panel');
            if (existing) existing.remove();
            else showTeilesuche();
        }
    });

    // Inject Teilesuche trigger button in EAM top bar
    (function injectTeileBtn() {
        const observer = new MutationObserver(() => {
            if (document.getElementById('apmgod-teile-trigger')) return;
            const toolbar = document.querySelector('.x-toolbar-default, .x-toolfooter, [class*="toolbar"]');
            if (!toolbar) return;
            const btn = document.createElement('button');
            btn.id = 'apmgod-teile-trigger';
            btn.textContent = '🔍 Teilesuche';
            btn.style.cssText = 'position:fixed;top:10px;right:180px;z-index:9997;background:#1d4ed8;border:none;border-radius:5px;color:#fff;padding:5px 12px;font-size:12px;font-weight:600;cursor:pointer;transition:background .15s;';
            btn.onmouseover = () => btn.style.background = '#1e40af';
            btn.onmouseout  = () => btn.style.background = '#1d4ed8';
            btn.onclick = () => {
                const ex = document.getElementById('apmgod-teile-panel');
                if (ex) ex.remove(); else showTeilesuche();
            };
            document.body.appendChild(btn);
            observer.disconnect();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    })();

})();
