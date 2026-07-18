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
    // ─────────────────────────────────────────────
    // SECTION 8: Teilesuche ALT+5 — 1:1 APM Master
    // ─────────────────────────────────────────────

    // Shared storage with Partnumbers script
    const TS_KEY = 'partcodeMap_v3';

    function tsLoad() {
        try { return JSON.parse(localStorage.getItem(TS_KEY)) || []; } catch(e) { return []; }
    }
    function tsSave(m) {
        try { localStorage.setItem(TS_KEY, JSON.stringify(m)); } catch(e) {} }

    function tsGetSession() {
        // 1. URL params (works in loadmain iframes)
        try { const p = new URLSearchParams(window.location.search), e = p.get('eamid'), t = p.get('tenant'); if (e) return {eamid:e,tenant:t||'AMAZONRMEEU_PRD'}; } catch(_){}
        // 2. iframe[src*=eamid] check (COMMON page hat EAM iframes)
        try { const top = window !== window.top ? window.top : window, f = top.document.querySelector('iframe[src*="eamid="]'); if (f) { const p2 = new URL(f.src).searchParams, e = p2.get('eamid'); if (e) return {eamid:e,tenant:p2.get('tenant')||'AMAZONRMEEU_PRD'}; } } catch(_){}
        // 3. EAM.SessionStorage (zuverlässigste Methode auf COMMON page)
        try { for (const w of [window, unsafeWindow, window.top]) { const ss = w?.EAM?.SessionStorage; if (ss?.eamid) return {eamid:ss.eamid,tenant:ss.tenant||'AMAZONRMEEU_PRD'}; } } catch(_){}
        // 4. APMApi partsCatalog getImageUrl (hat eamid in URL)
        try { const cat = (unsafeWindow||window).APMApi?.get?.('partsCatalog'); if (cat?.getImageUrl) { const url = cat.getImageUrl('x')||''; const m = url.match(/eamid=([^&]+)/); if (m?.[1]) return {eamid:m[1],tenant:'AMAZONRMEEU_PRD'}; } } catch(_){}
        // 5. gAppData initparams (EAM setzt das nach SAML-Redirect)
        try { const g = (unsafeWindow||window).top?.gAppData?.initparams; if (g?.eamid) return {eamid:g.eamid,tenant:g.tenant||'AMAZONRMEEU_PRD'}; } catch(_){}
        return null;
    }

    // GM fetch wrapper — wie APM Master: bypasses TM-Sandbox CORS mit GM_xmlhttpRequest
    function tsGmFetch(url, params) {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest === 'undefined') {
                // fallback auf normales fetch (z.B. wenn @grant fehlt)
                fetch(url, {method:'POST',credentials:'include',headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'},body:new URLSearchParams(params).toString()})
                    .then(r => r.text()).then(resolve).catch(reject);
                return;
            }
            GM_xmlhttpRequest({
                method: 'POST', url,
                headers: {'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'},
                data: new URLSearchParams(params).toString(),
                withCredentials: true,
                onload:    r => resolve(r.responseText),
                onerror:   () => reject(new Error('GM_xhr error')),
                ontimeout: () => reject(new Error('GM_xhr timeout')),
                timeout:   15000
            });
        });
    }

    async function tsSearch(partcode, description, mfr, dataspyId) {
        const pq = (partcode||'').trim(), dq = (description||'').trim(), mq = (mfr||'').trim();
        if (!pq && !dq && !mq) return [];

        // Primär: APMApi.searchCatalog — kein CORS, kein Session-Gebastel
        try {
            const cat = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window)?.APMApi?.get?.('partsCatalog');
            if (cat?.searchCatalog) {
                const res = await cat.searchCatalog(
                    {partcode: pq, description: dq, mfr: mq},
                    {limit: 50, dataspyId: dataspyId || '101496'}
                );
                return (res.records || []).map(row => ({
                    part:     row.partcode    || '',
                    desc:     row.description || '',
                    uom:      row.uom         || '',
                    bestand:  '',
                    lager:    '',
                    lagerort: '',
                    pic:      row.profilepicture || '',
                })).filter(r => r.part);
            }
        } catch(e) { console.warn('[Teilesuche] searchCatalog:', e.message); }

        // Fallback: direkte SSPART.xmlhttp (wenn APMApi fehlt)
        const s = tsGetSession();
        if (!s) { console.warn('[Teilesuche] Session nicht gefunden'); return []; }
        const params = {
            GRID_NAME:'SSPART', USER_FUNCTION_NAME:'SSPART', SYSTEM_FUNCTION_NAME:'SSPART',
            CURRENT_TAB_NAME:'LST', COMPONENT_INFO_TYPE:'DATA_ONLY', FORCE_REQUERY:'YES', MAX_ROWS:'50',
            DATASPY_ID: dataspyId || '101496', GRID_ID:'80', eamid: s.eamid, tenant: s.tenant,
        };
        let seq = 1;
        if (pq) { params[`MADDON_FILTER_ALIAS_NAME_${seq}`]='partcode'; params[`MADDON_FILTER_OPERATOR_${seq}`]='CONTAINS'; params[`MADDON_FILTER_VALUE_${seq}`]=pq; params[`MADDON_FILTER_SEQNUM_${seq}`]=String(seq); params[`MADDON_FILTER_JOINER_${seq}`]='AND'; params[`MADDON_LPAREN_${seq}`]='false'; params[`MADDON_RPAREN_${seq}`]='false'; seq++; }
        if (dq) { params[`MADDON_FILTER_ALIAS_NAME_${seq}`]='description'; params[`MADDON_FILTER_OPERATOR_${seq}`]='CONTAINS'; params[`MADDON_FILTER_VALUE_${seq}`]=dq; params[`MADDON_FILTER_SEQNUM_${seq}`]=String(seq); params[`MADDON_FILTER_JOINER_${seq}`]='AND'; params[`MADDON_LPAREN_${seq}`]='false'; params[`MADDON_RPAREN_${seq}`]='false'; seq++; }
        try {
            const text = await tsGmFetch('https://eu1.eam.hxgnsmartcloud.com/web/base/SSPART.xmlhttp', params);
            const json = JSON.parse(text);
            const rows = json?.pageData?.grid?.GRIDRESULT?.GRID?.DATA || [];
            const seen = new Set();
            return rows.filter(row => { const p=row.partcode||''; if(!p||seen.has(p)) return false; seen.add(p); return true; })
                .map(row => ({
                    part: row.partcode||'', desc: row.description||row.partdescription||'',
                    uom: row.uom||'', bestand: row.qty||row.balance||'',
                    lager: row.numberOfStores||'', lagerort: row.bin||row.storelocation||'',
                    pic: row.profilepicture||'',
                })).filter(r => r.part);
        } catch(e) { console.warn('[Teilesuche]', e.message); return []; }
    }

    // SVG icons
    const TS_SVG_CARET  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:14px;height:14px;display:block;pointer-events:none"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
    const TS_SVG_CLOSE  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:14px;height:14px;display:block;pointer-events:none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    const TS_SVG_COPY   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:13px;height:13px;display:block;pointer-events:none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    const TS_SVG_PLUS   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:13px;height:13px;display:block;pointer-events:none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
    const TS_SVG_CHECK  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:13px;height:13px;display:block;pointer-events:none"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const TS_SVG_REMOVE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:13px;height:13px;display:block;pointer-events:none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>`;

    // Fallback CSS for when APM Master isn't loaded (uses same var names with hardcoded fallbacks)
    function tsInjectFallbackCSS() {
        if (document.getElementById('apmgod-ts-fallback')) return;
        // Only inject if APM Master's CSS is missing
        if (getComputedStyle(document.documentElement).getPropertyValue('--apm-surface-0').trim()) return;
        const s = document.createElement('style');
        s.id = 'apmgod-ts-fallback';
        s.textContent = ':root{--apm-surface-0:#1e2738;--apm-surface-inset:#151b27;--apm-surface-sunken:#0f1621;--apm-surface-raised:#252f42;--apm-border:#2a3447;--apm-text-primary:#c8d4e8;--apm-text-bright:#e2e8f0;--apm-text-muted:#64748b;--apm-text-disabled:#475569;--apm-text-secondary:#94a3b8;--apm-accent:#3b82f6;--apm-accent-hover:#2563eb;--apm-danger:#ef4444;--apm-overlay-light:rgba(255,255,255,.05);--apm-control-bg:rgba(255,255,255,.08);--apm-font-mono:monospace;--apm-text-xs:11px;--apm-text-sm:12px;--apm-text-base:13px;--apm-text-md:13px;--apm-text-lg:15px;--apm-radius-sm:4px;--apm-radius:6px;--apm-radius-lg:8px;--apm-shadow:0 4px 16px rgba(0,0,0,.4);--apm-field-bg:#0f1621;--apm-field-border:#2a3447;--apm-field-text:#c8d4e8;--apm-input-focus:rgba(59,130,246,.25);--apm-input-bg:#0f1621;}';
        document.head.appendChild(s);
    }

    function tsEl(tag, cls, style) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (style) e.style.cssText = style;
        return e;
    }

    function tsActionBtn(icon, title, extraCls) {
        const b = tsEl('button', `apm-btn apm-btn--neutral${extraCls?' '+extraCls:''}`,
            'display:inline-flex;align-items:center;justify-content:center;width:28px;height:26px;padding:0;cursor:pointer;border-radius:var(--apm-radius-sm,4px);border:1px solid var(--apm-border,#2a3447);background:transparent;color:var(--apm-text-secondary,#94a3b8);transition:color .12s,border-color .12s,background .12s;');
        b.innerHTML = icon;
        b.title = title;
        b.addEventListener('mouseenter', () => { b.style.color='var(--apm-text-primary,#e2e8f0)'; b.style.background='var(--apm-control-bg,rgba(255,255,255,.08))'; });
        b.addEventListener('mouseleave', () => { b.style.color='var(--apm-text-secondary,#94a3b8)'; b.style.background='transparent'; });
        return b;
    }

    // Build one data row (display:contents — cells are direct grid children)
    function tsMakeRow(grid, cells8, isHovered) {
        const row = tsEl('div', 'apm-pb-row');
        cells8.forEach(c => row.appendChild(c));
        row.addEventListener('mouseenter', () => row.classList.add('is-hovered'));
        row.addEventListener('mouseleave', () => row.classList.remove('is-hovered'));
        grid.appendChild(row);
        return row;
    }

    function tsCell(extraCls) {
        return tsEl('div', `apm-pb-cell apm-pb-cell-${extraCls}`);
    }

    function tsImgCell(r) {
        const c = tsCell('image');
        if (r.pic) {
            const img = tsEl('img', 'apm-pb-row-img is-clickable');
            img.src = `https://eu1.eam.hxgnsmartcloud.com/web/base/VIEWUDOC?documentcode=${encodeURIComponent(r.pic)}&keepcontenttype=true&eamid=${r.eamid}&tenant=AMAZONRMEEU_PRD`;
            img.alt = '';
            img.title = 'Zum Vergrößern klicken';
            img.addEventListener('click', () => {
                const overlay = tsEl('div', '', 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:2000001;display:flex;align-items:center;justify-content:center;cursor:zoom-out;');
                const big = tsEl('img', '', 'max-width:90vw;max-height:90vh;object-fit:contain;border-radius:8px;');
                big.src = img.src;
                overlay.appendChild(big);
                overlay.onclick = () => overlay.remove();
                document.body.appendChild(overlay);
            });
            c.appendChild(img);
        } else {
            const ph = tsEl('div', 'apm-pb-img-placeholder');
            ph.textContent = '—';
            c.appendChild(ph);
        }
        return c;
    }

    function tsPartCell(part, eamid) {
        const c = tsCell('part');
        c.dataset.apmTip = part;
        const link = tsEl('a', 'apm-ps-part-link');
        link.href = `https://eu1.eam.hxgnsmartcloud.com/web/base/logindisp?tenant=AMAZONRMEEU_PRD&SYSTEM_FUNCTION_NAME=SSPART&USER_FUNCTION_NAME=SSPART&DRILLBACK=YES&partcode=${encodeURIComponent(part)}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.title = `${part} in neuem Tab öffnen`;
        link.textContent = part;
        const copyIcon = tsEl('span', 'apm-copy-icon', 'margin-left:6px;cursor:pointer;opacity:.5;flex-shrink:0;display:inline-flex;align-items:center;');
        copyIcon.innerHTML = TS_SVG_COPY;
        copyIcon.title = 'APN kopieren';
        copyIcon.addEventListener('mouseenter', () => copyIcon.style.opacity = '1');
        copyIcon.addEventListener('mouseleave', () => copyIcon.style.opacity = '.5');
        copyIcon.onclick = (e) => { e.preventDefault(); navigator.clipboard.writeText(part); tsToast(`📋 ${part} kopiert`); };
        c.appendChild(link);
        c.appendChild(copyIcon);
        return c;
    }

    function tsDescCell(part, desc) {
        const c = tsCell('desc');
        c.dataset.apn = part;
        const span = tsEl('span', 'apm-ps-desc-text');
        span.textContent = desc;
        span.title = desc;
        const copyIcon = tsEl('span', 'apm-copy-icon apm-copy-title-icon', 'margin-left:4px;cursor:pointer;opacity:.5;flex-shrink:0;display:inline-flex;align-items:center;');
        copyIcon.innerHTML = TS_SVG_COPY;
        copyIcon.title = 'APN + Beschreibung kopieren';
        copyIcon.addEventListener('mouseenter', () => copyIcon.style.opacity = '1');
        copyIcon.addEventListener('mouseleave', () => copyIcon.style.opacity = '.5');
        copyIcon.onclick = () => { navigator.clipboard.writeText(`${part} – ${desc}`); tsToast(`📋 ${part} + Beschreibung kopiert`); };
        c.appendChild(span);
        c.appendChild(copyIcon);
        return c;
    }

    function tsRebuildGrid(searchResults) {
        const body = document.getElementById('apmgod-ts-body');
        if (!body) return;
        body.innerHTML = '';

        const grid = tsEl('div', 'apm-pb-grid');
        grid.id = 'apmgod-ts-grid';
        grid.style.gridTemplateColumns = '52px minmax(110px, 1fr) minmax(180px, 2.2fr) 58px 64px 56px minmax(76px, 1fr) 210px';

        // ── Column header row ──
        const hdrRow = tsEl('div', 'apm-pb-row apm-pb-row-header');
        [['image','Bild'],['part','Teil'],['desc','Beschreibung'],['instock','Bestand'],['stores','Lager'],['uom','UOM'],['location','Lagerort'],['actions','Aktionen']].forEach(([col, label]) => {
            const th = tsEl('div', `apm-pb-col-header apm-pb-cell-${col}`);
            th.dataset.col = col;
            const lbl = tsEl('div', 'apm-pb-col-label');
            lbl.textContent = label;
            th.appendChild(lbl);
            hdrRow.appendChild(th);
        });
        grid.appendChild(hdrRow);

        // ── Search results ──
        if (Array.isArray(searchResults)) {
            const secLbl = tsEl('div', 'apm-pb-section-label');
            secLbl.textContent = searchResults.length > 0 ? `Suchergebnisse (${searchResults.length})` : '';
            if (searchResults.length === 0) {
                secLbl.className = 'apm-pb-empty';
                const dsEl = document.getElementById('apmgod-ts-dataspy');
                const dsLabel = dsEl?.selectedOptions?.[0]?.textContent || 'Parts';
                const site = document.getElementById('apmgod-ts-site')?.value || 'FRA7';
                secLbl.textContent = `Keine Treffer — ${dsLabel} · ${site}`;
            }
            grid.appendChild(secLbl);

            if (searchResults.length > 0) {
                const saved = tsLoad();
                searchResults.forEach(r => {
                    const isSaved = saved.some(e => e.part === r.part);
                    const row = tsEl('div', 'apm-pb-row');
                    row.dataset.part = r.part;
                    if (isSaved) row.style.opacity = '.55';
                    row.addEventListener('mouseenter', () => row.classList.add('is-hovered'));
                    row.addEventListener('mouseleave', () => row.classList.remove('is-hovered'));

                    // instock cell
                    const instock = tsCell('instock'); instock.textContent = r.bestand || '—';
                    // stores cell
                    const stores = tsCell('stores'); stores.textContent = r.lager || '—';
                    if (r.lager) stores.title = `${r.lager} Lager`;
                    // uom cell
                    const uom = tsCell('uom'); uom.textContent = r.uom;
                    // location cell
                    const loc = tsCell('location');
                    const locSpan = tsEl('span', 'apm-ps-loc-text'); locSpan.textContent = r.lagerort || '—';
                    if (r.lagerort) {
                        const locCopy = tsEl('span', 'apm-copy-icon', 'margin-left:6px;cursor:pointer;opacity:.5;flex-shrink:0;display:inline-flex;align-items:center;');
                        locCopy.innerHTML = TS_SVG_COPY;
                        locCopy.title = 'Lagerort kopieren';
                        locCopy.addEventListener('mouseenter', () => locCopy.style.opacity = '1');
                        locCopy.addEventListener('mouseleave', () => locCopy.style.opacity = '.5');
                        locCopy.onclick = () => { navigator.clipboard.writeText(`APN: ${r.part}\nBeschreibung: ${r.desc}\nMenge: ${r.bestand}\nLagerort: ${r.lagerort}`); tsToast('📋 Details kopiert'); };
                        loc.appendChild(locSpan); loc.appendChild(locCopy);
                    } else { loc.appendChild(locSpan); }

                    // actions cell
                    const act = tsCell('actions');
                    const addBtn = tsActionBtn(TS_SVG_PLUS, 'Zu gespeicherten Teilen hinzufügen');
                    const ckBtn  = tsActionBtn(TS_SVG_CHECK, 'Bereits gespeichert');
                    const rmBtn  = tsActionBtn(TS_SVG_REMOVE, 'Entfernen');
                    rmBtn.addEventListener('mouseenter', () => { rmBtn.style.color='var(--apm-danger,#ef4444)'; });
                    rmBtn.addEventListener('mouseleave', () => { rmBtn.style.color='var(--apm-text-secondary,#94a3b8)'; rmBtn.style.background='transparent'; });

                    if (isSaved) {
                        act.appendChild(ckBtn); act.appendChild(rmBtn);
                        rmBtn.onclick = () => {
                            const cur = tsLoad(); const idx = cur.findIndex(e => e.part === r.part);
                            if (idx >= 0) { cur.splice(idx, 1); tsSave(cur); }
                            row.style.opacity = '1'; ckBtn.remove(); rmBtn.remove(); act.appendChild(addBtn);
                            tsRebuildGrid(searchResults);
                            tsToast(`🗑️ "${r.part}" entfernt`);
                        };
                    } else {
                        act.appendChild(addBtn);
                        addBtn.onclick = () => {
                            const alias = (prompt(`Alias für "${r.part}":\n(leer = Partnummer als Key)`, r.part.toLowerCase()) ?? '').trim();
                            const key = alias || r.part.toLowerCase();
                            const cur = tsLoad();
                            if (!cur.some(e => e.part === r.part)) { cur.push({key, part:r.part, desc:r.desc, uom:r.uom}); tsSave(cur); }
                            row.style.opacity = '.55'; addBtn.remove(); act.appendChild(ckBtn); act.appendChild(rmBtn);
                            rmBtn.onclick = () => {
                                const cur2 = tsLoad(); const idx = cur2.findIndex(e => e.part === r.part);
                                if (idx >= 0) { cur2.splice(idx, 1); tsSave(cur2); }
                                row.style.opacity = '1'; ckBtn.remove(); rmBtn.remove(); act.appendChild(addBtn);
                                tsRebuildGrid(searchResults);
                                tsToast(`🗑️ "${r.part}" entfernt`);
                            };
                            tsRebuildGrid(searchResults);
                            tsToast(`✅ "${r.part}" gespeichert als "${key}"`);
                        };
                    }

                    [tsImgCell(r), tsPartCell(r.part, r.eamid), tsDescCell(r.part, r.desc), instock, stores, uom, loc, act].forEach(c => row.appendChild(c));
                    grid.appendChild(row);
                });
            }
        }

        // ── Gespeicherte Teile ──
        const saved = tsLoad();
        const secSaved = tsEl('div', 'apm-pb-section-label');
        secSaved.textContent = 'Gespeicherte Teile';
        grid.appendChild(secSaved);

        if (saved.length === 0) {
            const empty = tsEl('div', 'apm-pb-empty');
            empty.textContent = 'Keine gespeicherten Teile';
            grid.appendChild(empty);
        } else {
            // Group by first letter of key
            const groups = {};
            saved.forEach(e => { const g = (e.key||e.part||'?')[0].toUpperCase(); (groups[g] = groups[g]||[]).push(e); });

            Object.keys(groups).sort().forEach(gname => {
                // Group header (grid-column: 1/-1)
                const ghdr = tsEl('div', 'apm-pb-group-header');
                const gleft = tsEl('span', 'apm-pb-group-left');
                const gcaret = tsEl('span', 'apm-pb-group-caret'); gcaret.innerHTML = TS_SVG_CARET;
                gleft.appendChild(gcaret);
                const gcenter = tsEl('span', 'apm-pb-group-center');
                const gname_el = tsEl('span', 'apm-pb-group-name'); gname_el.textContent = gname;
                gcenter.appendChild(gname_el);
                const gtools = tsEl('div', 'apm-pb-group-tools');
                ghdr.appendChild(gleft); ghdr.appendChild(gcenter); ghdr.appendChild(gtools);

                // Collapse toggle
                let collapsed = false;
                const rowEls = [];
                ghdr.addEventListener('click', () => {
                    collapsed = !collapsed;
                    gcaret.style.transform = collapsed ? 'rotate(-90deg)' : '';
                    rowEls.forEach(r => r.classList.toggle('is-hidden', collapsed));
                });
                grid.appendChild(ghdr);

                // Rows
                groups[gname].forEach(entry => {
                    const row = tsEl('div', 'apm-pb-row');
                    row.dataset.apn = entry.part; row.dataset.section = 'fav';
                    row.addEventListener('mouseenter', () => row.classList.add('is-hovered'));
                    row.addEventListener('mouseleave', () => row.classList.remove('is-hovered'));
                    rowEls.push(row);

                    // Empty image cell (saved parts usually have no live image)
                    const imgC = tsCell('image');
                    imgC.innerHTML = '<div class="apm-pb-img-placeholder" style="width:40px;height:40px;border-radius:var(--apm-radius-sm,4px);background:var(--apm-surface-sunken,#0f1621);display:flex;align-items:center;justify-content:center;color:var(--apm-text-disabled,#475569);font-size:11px;">—</div>';

                    // Desc & location empty for saved (no live data)
                    const instock = tsCell('instock'); instock.textContent = '—';
                    const stores  = tsCell('stores');  stores.textContent  = '—';
                    const uom     = tsCell('uom');     uom.textContent     = entry.uom || '—';
                    const loc     = tsCell('location');
                    const locSpan = tsEl('span', 'apm-ps-loc-text', 'color:var(--apm-text-disabled,#475569);font-style:italic;');
                    locSpan.textContent = '—';
                    loc.appendChild(locSpan);

                    // Actions
                    const act = tsCell('actions');
                    const cpBtn = tsActionBtn(TS_SVG_COPY,   'Partnummer kopieren');
                    const rmBtn = tsActionBtn(TS_SVG_REMOVE, 'Entfernen');
                    rmBtn.addEventListener('mouseenter', () => rmBtn.style.color = 'var(--apm-danger,#ef4444)');
                    rmBtn.addEventListener('mouseleave', () => { rmBtn.style.color = 'var(--apm-text-secondary,#94a3b8)'; rmBtn.style.background = 'transparent'; });
                    cpBtn.onclick = () => { navigator.clipboard.writeText(entry.part); tsToast(`📋 ${entry.part} kopiert`); };
                    rmBtn.onclick = () => {
                        const cur = tsLoad(); const idx = cur.findIndex(e => e.part === entry.part && e.key === entry.key);
                        if (idx >= 0) { cur.splice(idx, 1); tsSave(cur); }
                        row.classList.add('is-hidden');
                        tsToast(`🗑️ "${entry.part}" entfernt`);
                        tsRebuildGrid(searchResults);
                    };
                    act.appendChild(cpBtn); act.appendChild(rmBtn);

                    [imgC, tsPartCell(entry.part, null), tsDescCell(entry.part, entry.desc||entry.key), instock, stores, uom, loc, act].forEach(c => row.appendChild(c));
                    grid.appendChild(row);
                });
            });
        }

        body.appendChild(grid);
    }

    // Lazy stock enrichment — lädt Bestand+Lagerort nach Render
    async function tsEnrichStock(results, gridEl) {
        try {
            const cat = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window)?.APMApi?.get?.('partsCatalog');
            if (!cat?.fetchPartStock) return;
            for (const r of results) {
                try {
                    const s = await cat.fetchPartStock(r.part, {site: 'FRA7'});
                    const row = gridEl?.querySelector('[data-part="' + r.part + '"]');
                    if (!row || !s) continue;
                    const qty    = s?.summary?.totalQty;
                    const bin    = s?.summary?.primaryBin || s?.bins?.[0]?.bin || '';
                    const stores = s?.summary?.storeCount;
                    const cell_b = row.querySelector('.apm-pb-cell-instock');
                    const cell_s = row.querySelector('.apm-pb-cell-stores');
                    const cell_l = row.querySelector('.apm-ps-loc-text');
                    if (cell_b && qty != null) cell_b.textContent = qty === 0 ? '0' : String(qty);
                    if (cell_s && stores != null) cell_s.textContent = String(stores);
                    if (cell_l && bin) cell_l.textContent = bin;
                } catch(_) {}
            }
        } catch(_) {}
    }

    function showTeilesuche() {
        if (document.getElementById('apmgod-teile-panel')) return;
        tsInjectFallbackCSS();

        const popup = document.createElement('div');
        popup.id = 'apmgod-teile-panel';
        // Reuse APM Master's CSS classes exactly
        popup.className = 'apm-pb-popup apm-ps-popup apm-ui-panel';
        popup.setAttribute('role', 'dialog');
        popup.setAttribute('aria-label', 'Teilesuche');
        popup.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);display:flex;visibility:visible;z-index:10001;';

        popup.innerHTML = `
            <div class="apm-pb-header">
                <span class="apm-pb-title">Teilesuche</span>
                <div class="apm-pb-header-actions">
                    <select class="apm-pb-dataspy-select apm-pb-site-select" id="apmgod-ts-site" title="Standort">
                        <option value="">Alle Standorte</option>
                        <option value="FRA7" selected>FRA7</option>
                    </select>
                    <label class="apm-pb-dataspy-label" style="font-size:var(--apm-text-sm,12px);color:var(--apm-text-muted,#64748b);white-space:nowrap;">Bereich:</label>
                    <select id="apmgod-ts-dataspy" class="apm-pb-dataspy-select" title="Katalogbereich">
                        <option value="82">All Parts</option>
                        <option value="100455">Parts in Service</option>
                        <option value="82" selected>All Parts</option>
                    </select>
                    <button type="button" class="apm-pb-close" id="apmgod-ts-pin" title="Panel andocken (Floating / Oben / Unten)" style="margin-right:2px;font-size:14px;">📌</button>
                    <button type="button" class="apm-pb-close" id="apmgod-ts-close" title="Schließen">×</button>
                </div>
            </div>
            <div class="apm-pb-header-search">
                <div class="apm-pb-header-search-label">Filialkatalog durchsuchen:</div>
                <div class="apm-pb-search-group" style="display:flex;gap:6px;">
                    <input id="apmgod-ts-part" type="search" placeholder="Teile-Nr." class="apm-pb-search apm-pb-search-multi">
                    <input id="apmgod-ts-desc" type="search" placeholder="Beschreibung" class="apm-pb-search apm-pb-search-multi">
                    <input id="apmgod-ts-mfr"  type="search" placeholder="Hersteller-Teile-Nr." class="apm-pb-search apm-pb-search-multi">
                    <button id="apmgod-ts-clear" type="button" class="apm-pb-search-clear is-hidden">✕ Löschen</button>
                </div>
            </div>
            <div class="apm-pb-body" id="apmgod-ts-body"></div>
        `;
        document.body.appendChild(popup);

        // Restore position
        try {
            const pos = JSON.parse(localStorage.getItem('apmgod-teile-pos') || 'null');
            if (pos) { popup.style.left = pos.left; popup.style.top = pos.top; popup.style.transform = 'none'; }
        } catch(e) {}

        // Draggable on header
        const hdr = popup.querySelector('.apm-pb-header');
        let drag = false, ox = 0, oy = 0;
        hdr.addEventListener('mousedown', e => {
            if (e.target.closest('.apm-pb-close, select, button')) return;
            drag = true; const r = popup.getBoundingClientRect();
            ox = e.clientX - r.left; oy = e.clientY - r.top;
            popup.style.transform = 'none';
        });
        document.addEventListener('mousemove', e => { if (!drag) return; popup.style.left = (e.clientX-ox)+'px'; popup.style.top = (e.clientY-oy)+'px'; });
        document.addEventListener('mouseup', () => {
            if (drag) { const r = popup.getBoundingClientRect(); localStorage.setItem('apmgod-teile-pos', JSON.stringify({left:r.left+'px',top:r.top+'px'})); }
            drag = false;
        });

        // Close
        popup.querySelector('#apmgod-ts-close').onclick = () => popup.remove();

        // Anchor cycling: floating → top → bottom
        const TS_ANCHOR_KEY = 'apmgod-teile-anchor';
        const pinBtn = popup.querySelector('#apmgod-ts-pin');
        const anchors = ['floating','top','bottom'];
        const pinIcons = {'floating':'📌','top':'⬆️','bottom':'⬇️'};
        const pinTitles = {'floating':'Floating (ziehbar)','top':'Oben angedockt','bottom':'Unten angedockt'};

        function applyAnchor(mode) {
            localStorage.setItem(TS_ANCHOR_KEY, mode);
            pinBtn.textContent = pinIcons[mode];
            pinBtn.title = pinTitles[mode];
            popup.style.transition = 'top .2s, bottom .2s';
            if (mode === 'top') {
                popup.style.position = 'fixed';
                popup.style.top = '0px';
                popup.style.bottom = '';
                popup.style.left = '0px';
                popup.style.right = '0px';
                popup.style.transform = 'none';
                popup.style.width = '100%';
                popup.style.maxWidth = '100%';
                popup.style.borderRadius = '0 0 6px 6px';
            } else if (mode === 'bottom') {
                popup.style.position = 'fixed';
                popup.style.bottom = '0px';
                popup.style.top = '';
                popup.style.left = '0px';
                popup.style.right = '0px';
                popup.style.transform = 'none';
                popup.style.width = '100%';
                popup.style.maxWidth = '100%';
                popup.style.borderRadius = '6px 6px 0 0';
            } else {
                // restore floating
                popup.style.width = '';
                popup.style.maxWidth = '';
                popup.style.borderRadius = '';
                popup.style.bottom = '';
                popup.style.right = '';
                try {
                    const pos = JSON.parse(localStorage.getItem('apmgod-teile-pos') || 'null');
                    if (pos) { popup.style.left = pos.left; popup.style.top = pos.top; popup.style.transform = 'none'; }
                    else { popup.style.left = '50%'; popup.style.top = '60px'; popup.style.transform = 'translateX(-50%)'; }
                } catch(_) { popup.style.left = '50%'; popup.style.top = '60px'; popup.style.transform = 'translateX(-50%)'; }
            }
        }

        // Restore saved anchor
        const savedAnchor = localStorage.getItem(TS_ANCHOR_KEY) || 'floating';
        applyAnchor(savedAnchor);

        pinBtn.onclick = () => {
            const cur = localStorage.getItem(TS_ANCHOR_KEY) || 'floating';
            const next = anchors[(anchors.indexOf(cur) + 1) % anchors.length];
            applyAnchor(next);
        };

        // Disable drag when anchored
        hdr.addEventListener('mousedown', e => {
            if (e.target.closest('.apm-pb-close, select, button')) return;
            if ((localStorage.getItem(TS_ANCHOR_KEY) || 'floating') !== 'floating') return;
        }, true);

        // Search inputs
        const pInp = popup.querySelector('#apmgod-ts-part');
        const dInp = popup.querySelector('#apmgod-ts-desc');
        const mInp = popup.querySelector('#apmgod-ts-mfr');
        const clrBtn = popup.querySelector('#apmgod-ts-clear');
        let searchTimer;

        const updateClear = () => {
            const hasVal = pInp.value || dInp.value || mInp.value;
            clrBtn.classList.toggle('is-hidden', !hasVal);
        };
        clrBtn.onclick = () => { pInp.value = ''; dInp.value = ''; mInp.value = ''; updateClear(); tsRebuildGrid(); };

        [pInp, dInp, mInp].forEach(inp => {
            inp.addEventListener('input', () => {
                updateClear();
                clearTimeout(searchTimer);
                if (pInp.value.trim() || dInp.value.trim()) searchTimer = setTimeout(doSearch, 350);
            });
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') { clearTimeout(searchTimer); doSearch(); } });
        });

        async function doSearch() {
            const pq = pInp.value.trim(), dq = dInp.value.trim();
            if (!pq && !dq) return;
            const body = document.getElementById('apmgod-ts-body');
            if (body) body.innerHTML = '<div style="padding:16px 14px;color:var(--apm-text-muted,#64748b);font-size:var(--apm-text-sm,12px);font-style:italic;">⏳ Suche läuft…</div>';
            const dataspyId = popup.querySelector('#apmgod-ts-dataspy')?.value || '101496';
            const mq = mInp.value.trim();
            const results = await tsSearch(pq, dq, mq, dataspyId);
            tsRebuildGrid(results);
            // lazy stock enrichment nach dem render
            const grid = document.getElementById('apmgod-ts-grid');
            if (grid && results.length) tsEnrichStock(results, grid);
        }

        // Initial render (saved parts only)
        tsRebuildGrid();
        setTimeout(() => pInp.focus(), 80);
    }

    // ALT+5 toggle
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === '5') {
            e.preventDefault();
            const ex = document.getElementById('apmgod-teile-panel');
            if (ex) ex.remove(); else showTeilesuche();
        }
    });

    // Inject trigger button (fixed, top-right area)
    (function() {
        if (document.getElementById('apmgod-teile-trigger')) return;
        const btn = document.createElement('button');
        btn.id = 'apmgod-teile-trigger';
        btn.className = 'apm-btn apm-btn--neutral';
        btn.style.cssText = 'position:fixed;top:8px;right:160px;z-index:9997;height:28px;padding:0 12px;font-size:var(--apm-text-sm,12px);font-weight:600;cursor:pointer;border-radius:var(--apm-radius-sm,4px);border:1px solid var(--apm-border,#2a3447);background:var(--apm-surface-inset,#151b27);color:var(--apm-text-primary,#c8d4e8);display:flex;align-items:center;gap:6px;transition:all .15s;';
        btn.innerHTML = `${TS_SVG_COPY} Teilesuche`;
        btn.title = 'Teilesuche öffnen (ALT+5)';
        btn.onmouseover = () => { btn.style.borderColor='var(--apm-accent,#3b82f6)'; btn.style.color='var(--apm-accent,#3b82f6)'; };
        btn.onmouseout  = () => { btn.style.borderColor='var(--apm-border,#2a3447)'; btn.style.color='var(--apm-text-primary,#c8d4e8)'; };
        btn.onclick = () => { const ex = document.getElementById('apmgod-teile-panel'); if (ex) ex.remove(); else showTeilesuche(); };
        document.body.appendChild(btn);
    })();


})();