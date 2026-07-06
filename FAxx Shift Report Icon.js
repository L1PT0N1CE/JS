(function () {
    'use strict';

    // Nur im Top-Level-Fenster ausführen (nicht in EAM-iframes)
    if (window !== window.top) return;

    // Singleton — verhindert doppelten Start bei URL-Redirect oder Script-Re-Injektion
    if (window._fa73FloatInit) return;
    window._fa73FloatInit = true;

    const SHIFT_DESC  = 'FRA7 Schicht 3';
    const STORE_LIST  = 'EAM.store.operation.casemanagement.cscase_lst_lst';
    const STORE_LABOR = 'EAM.store.operation.casemanagement.cscase_xsd_xsd';
    const SR_SETTINGS = 'sr-shift-settings-v2';
    const CACHE_KEY   = 'fa73_float_cache_v1';
    const STATE_KEY   = 'fa73_float_state_v1';
    const REFRESH_MS  = 5 * 60 * 1000;

    const EAM_ORDER = [
        'hsshimen','klikevi','ussaxel','jsonsta','rmalogor','shalsami',
        'kanataza','kedama','lugejaso','schmidqd','halkenhc','schudack',
        'sprinoli','ionelvic','ivelik','daldalci',
    ];

    let _loading = false;
    let _lastRefresh = 0;

    // ─── State ────────────────────────────────────────────────────────────────
    function getState() {
        try { return JSON.parse(localStorage.getItem(STATE_KEY) || '{}'); } catch(e) { return {}; }
    }
    function saveState(o) {
        try { localStorage.setItem(STATE_KEY, JSON.stringify(o)); } catch(e) {}
    }

    // ─── Cache ────────────────────────────────────────────────────────────────
    function getCached() {
        try {
            const o = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
            if (!o || o.date !== new Date().toDateString()) return null;
            if (o.ts && Date.now() - o.ts > 30 * 60 * 1000) return null;
            return o.rows;
        } catch(e) { return null; }
    }
    function saveCache(rows) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ date: new Date().toDateString(), ts: Date.now(), rows })); } catch(e) {}
    }

    // ─── Login-Map ────────────────────────────────────────────────────────────
    function getShiftLoginMap() {
        const map = {};
        try {
            const s = JSON.parse(localStorage.getItem(SR_SETTINGS) || 'null');
            if (!s) return map;
            for (const k of Object.keys(s)) {
                const sh = s[k];
                if (sh?.name?.includes(SHIFT_DESC)) {
                    (sh.entries || []).forEach(e => { map[e.login] = { hl: e.highlight || false }; });
                    break;
                }
            }
        } catch(e) {}
        return map;
    }

    // ─── Daten laden (identisch v4.4) ─────────────────────────────────────────
    function loadShiftData() {
        return new Promise((resolve, reject) => {
            let done = false, wrapDiv = null;
            const timer = setTimeout(() => { if (!done) { done = true; reject('timeout'); } }, 45000);
            function finish(r) {
                if (done) return; done = true;
                clearTimeout(timer);
                try { if (wrapDiv) wrapDiv.style.display = 'none'; } catch(e) {}
                r instanceof Error ? reject(r.message) : resolve(r);
            }
            let extTries = 0;
            const waitExt = setInterval(() => {
                if (++extTries > 30) { clearInterval(waitExt); finish(new Error('Ext timeout')); return; }
                if (typeof Ext === 'undefined' || !Ext.ComponentQuery) return;
                clearInterval(waitExt);
                const comp = Ext.ComponentQuery.query('uxtabiframe').find(c => c.src?.includes('CSCASE'));
                if (!comp) { finish(new Error('CSCASE nicht gefunden')); return; }
                comp.hidden = false;
                if (!comp.rendered) {
                    wrapDiv = document.createElement('div');
                    wrapDiv.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;overflow:hidden;';
                    document.body.appendChild(wrapDiv);
                    comp.render(wrapDiv);
                }
                let iframeTries = 0;
                const waitIframe = setInterval(() => {
                    if (++iframeTries > 40) { clearInterval(waitIframe); finish(new Error('iframe timeout')); return; }
                    const iframeEl = document.getElementById(comp.id + '-iframeEl') || document.querySelector('iframe');
                    const iExt = iframeEl?.contentWindow?.Ext;
                    if (!iExt?.StoreManager) return;
                    clearInterval(waitIframe);
                    waitForList(iExt);
                }, 500);
            }, 500);

            function waitForList(iExt) {
                let tries = 0;
                const poll = setInterval(() => {
                    if (++tries > 80) { clearInterval(poll); finish(new Error('Liste timeout')); return; }
                    const ls = iExt.StoreManager.lookup(STORE_LIST);
                    if (!ls || ls.getCount() === 0) return;
                    clearInterval(poll); selectAndLoad(iExt, ls);
                }, 500);
            }

            function selectAndLoad(iExt, listStore) {
                let idx = 0;
                for (let i = 0; i < listStore.getCount(); i++) {
                    const d = listStore.data.items[i].data;
                    if ((d.casedescription || '').includes(SHIFT_DESC) || d.shift === 'FA73') { idx = i; break; }
                }
                for (const g of iExt.ComponentQuery.query('gridpanel')) {
                    try {
                        const gs = g.getStore?.();
                        if (gs && (gs.storeId || gs.id || '').includes('cscase_lst')) {
                            g.getSelectionModel().select(idx, false, false); break;
                        }
                    } catch(e) {}
                }
                const oldLs = iExt.StoreManager.lookup(STORE_LABOR);
                if (oldLs) try { oldLs.removeAll(); } catch(e) {}
                setTimeout(() => {
                    try {
                        for (const tp of iExt.ComponentQuery.query('uxtabpanel')) {
                            const items = tp.items?.items || [];
                            const lt = items.find(t => t.title === 'Labor');
                            if (lt) {
                                const rt = items.find(t => t.title === 'Record View');
                                try { if (rt) tp.setActiveTab(rt); } catch(e) {}
                                setTimeout(() => { try { tp.setActiveTab(lt); } catch(e) {} }, 300);
                                break;
                            }
                        }
                    } catch(e) {}
                    waitForLabor(iExt);
                }, 1200);
            }

            function waitForLabor(iExt) {
                let resolved = false;
                function getGridLogins() {
                    try {
                        for (const g of iExt.ComponentQuery.query('gridpanel')) {
                            const gst = g.getStore && g.getStore();
                            if (!gst || (gst.storeId || gst.id || '') !== STORE_LABOR) continue;
                            const view = g.getView && g.getView();
                            if (!view || !view.el || !view.el.dom) continue;
                            const rows = view.el.dom.querySelectorAll('.x-grid-row');
                            const result = Array.from(rows).map(r => {
                                const c = r.querySelector('.x-grid-cell-inner');
                                return c ? c.textContent.trim().toLowerCase() : '';
                            }).filter(Boolean);
                            if (result.length > 0) return result;
                        }
                    } catch(e) {}
                    try {
                        const iframeEl = document.querySelector('iframe[id*="uxtabiframe"]');
                        if (iframeEl?.contentDocument) {
                            const rows = iframeEl.contentDocument.querySelectorAll('.x-grid-row');
                            if (rows.length > 0) {
                                const result = Array.from(rows).map(r => {
                                    const c = r.querySelector('.x-grid-cell-inner');
                                    return c ? c.textContent.trim().toLowerCase() : '';
                                }).filter(v => v && v.length >= 4 && v.length <= 15 && !/\s|[^a-z0-9]/.test(v));
                                if (result.length > 0) return result;
                            }
                        }
                    } catch(e) {}
                    return [];
                }
                function process(ls) {
                    if (resolved) return; resolved = true;
                    const lm = getShiftLoginMap();
                    const gridLogins = getGridLogins();
                    finish((ls.getRange ? ls.getRange() : (ls.data&&ls.data.items||[])).map((item, i) => {
                        const d = item.data;
                        const login = d.xsd_shp_person || d.xsd_person || d.xsd_employee || gridLogins[i] || EAM_ORDER[i] || '';
                        const info = lm[login] || {};
                        return {
                            person: login, hl: info.hl || false, trade: d.xsd_csm_trade || '',
                            booked: d.xsd_booked_labor_shift || '', billable: d.xsd_hours_billable_n || '',
                            nonbill: d.xsd_hours_nonbillable || '', avail: d.xsd_hours_avail || '',
                            status: d.xsd_exc_comment || ''
                        };
                    }));
                }
                iExt.StoreManager.on('add', function onAdd(mgr, store) {
                    if ((store.storeId || store.id) === STORE_LABOR) {
                        iExt.StoreManager.un('add', onAdd);
                        store.on('load', () => setTimeout(() => process(store), 500), null, { single: true });
                    }
                });
                let tries = 0;
                const poll = setInterval(() => {
                    if (++tries > 50) { clearInterval(poll); if (!resolved) finish(new Error('Labor timeout')); return; }
                    const ls = iExt.StoreManager.lookup(STORE_LABOR);
                    if (!ls || ls.getCount() === 0) return;
                    clearInterval(poll); setTimeout(() => process(ls), 500);
                }, 400);
            }
        });
    }

    // ─── Refresh ──────────────────────────────────────────────────────────────
    function triggerRefresh() {
        _loading = true; _lastRefresh = Date.now();
        setStatus('loading');
        loadShiftData()
            .then(rows => { saveCache(rows); renderTable(rows); setStatus('ok'); })
            .catch(e => { console.warn('[FA73-Float]', e); setStatus('error'); })
            .finally(() => { _loading = false; });
    }

    // ─── UI ───────────────────────────────────────────────────────────────────
    let floatEl = null;

    function buildUI() {
        if (document.getElementById('fa73-float-root')) return;

        const st = getState();
        const open = st.open !== false; // default offen
        const x = st.x ?? null;
        const y = st.y ?? null;

        const root = document.createElement('div');
        root.id = 'fa73-float-root';
        root.style.cssText = `
            position: fixed;
            z-index: 999999;
            font-family: Arial, sans-serif;
            font-size: 11px;
            user-select: none;
            ${x !== null ? `left:${x}px;top:${y}px;` : 'right:18px;bottom:18px;'}
        `;

        // Mini-Button (immer sichtbar)
        const fab = document.createElement('div');
        fab.id = 'fa73-fab';
        fab.style.cssText = `
            background: #232f3e;
            color: #fff;
            padding: 6px 12px;
            border-radius: 20px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            transition: background 0.15s;
            white-space: nowrap;
        `;
        fab.innerHTML = 'FA73 <span id="fa73-status-dot" style="width:8px;height:8px;border-radius:50%;background:#aaa;display:inline-block;"></span>';
        fab.title = 'FA73 Shift Report öffnen';

        // Panel
        const panel = document.createElement('div');
        panel.id = 'fa73-float-panel';
        floatEl = panel;
        panel.style.cssText = `
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.35);
            width: 620px;
            max-height: 500px;
            display: ${open ? 'flex' : 'none'};
            flex-direction: column;
            overflow: hidden;
            margin-bottom: 8px;
        `;

        // Header (drag handle)
        const header = document.createElement('div');
        header.style.cssText = `
            background: #232f3e;
            color: #fff;
            padding: 7px 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: move;
            flex-shrink: 0;
        `;
        header.innerHTML = `
            <span style="font-weight:bold;font-size:12px;">FA73 Shift Report</span>
            <span style="display:flex;align-items:center;gap:8px;font-size:11px;color:#aaa;">
                <span id="fa73-float-time"></span>
                <span id="fa73-float-refresh" title="Refresh" style="color:#ff9900;cursor:pointer;font-size:16px;line-height:1;">&#8635;</span>
                <span id="fa73-float-close" title="Minimieren" style="color:#aaa;cursor:pointer;font-size:14px;line-height:1;">&#8722;</span>
            </span>
        `;

        // Body
        const body = document.createElement('div');
        body.id = 'fa73-float-body';
        body.style.cssText = 'overflow-y:auto;flex:1;';
        body.innerHTML = '<div style="padding:16px;text-align:center;color:#999;">Lade FA73...</div>';

        panel.appendChild(header);
        panel.appendChild(body);
        root.appendChild(panel);
        root.appendChild(fab);
        document.body.appendChild(root);

        // ── Drag ──────────────────────────────────────────────────────────────
        let dragging = false, dragged = false, dragOffX = 0, dragOffY = 0;

        function startDrag(e) {
            dragging = true; dragged = false;
            const rect = root.getBoundingClientRect();
            dragOffX = e.clientX - rect.left;
            dragOffY = e.clientY - rect.top;
            e.preventDefault();
        }

        header.addEventListener('mousedown', e => {
            if (e.target.id === 'fa73-float-refresh' || e.target.id === 'fa73-float-close') return;
            startDrag(e);
        });

        // FAB ist auch Drag-Handle wenn Panel geschlossen
        fab.addEventListener('mousedown', e => { startDrag(e); });

        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            const nx = Math.max(0, Math.min(window.innerWidth - root.offsetWidth, e.clientX - dragOffX));
            const ny = Math.max(0, Math.min(window.innerHeight - root.offsetHeight, e.clientY - dragOffY));
            root.style.left = nx + 'px';
            root.style.top  = ny + 'px';
            root.style.right = 'auto';
            root.style.bottom = 'auto';
            dragged = true;
        });
        document.addEventListener('mouseup', () => {
            if (!dragging) return;
            dragging = false;
            const rect = root.getBoundingClientRect();
            const s = getState();
            s.x = Math.round(rect.left); s.y = Math.round(rect.top);
            saveState(s);
        });

        // ── Toggle ────────────────────────────────────────────────────────────────────
        fab.addEventListener('click', () => {
            if (dragged) { dragged = false; return; } // Drag, kein Toggle
            const nowOpen = panel.style.display !== 'none';
            panel.style.display = nowOpen ? 'none' : 'flex';
            const s = getState(); s.open = !nowOpen; saveState(s);
            if (!nowOpen && !_loading && !getCached()) triggerRefresh();
        });

        // ── Refresh Button ────────────────────────────────────────────────────
        document.getElementById('fa73-float-refresh').addEventListener('click', e => {
            e.stopPropagation();
            _loading = false;
            triggerRefresh();
        });

        // ── Close/Minimize ────────────────────────────────────────────────────
        document.getElementById('fa73-float-close').addEventListener('click', e => {
            e.stopPropagation();
            panel.style.display = 'none';
            const s = getState(); s.open = false; saveState(s);
        });
    }

    function setStatus(state) {
        const dot = document.getElementById('fa73-status-dot');
        const time = document.getElementById('fa73-float-time');
        if (dot) dot.style.background = state === 'ok' ? '#4caf50' : state === 'loading' ? '#ff9900' : '#f44336';
        if (time && state !== 'loading') {
            const now = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            time.textContent = now;
        }
    }

    function renderTable(rows) {
        const body = document.getElementById('fa73-float-body');
        if (!body) return;
        if (!rows || !rows.length) {
            body.innerHTML = '<div style="padding:12px;text-align:center;color:#999;">Keine Daten</div>';
            return;
        }
        const lm = getShiftLoginMap();
        let tB = 0, tBl = 0;
        let html = `<table style="width:100%;border-collapse:collapse;font-size:11px;">
            <thead><tr style="background:#f0f0f0;border-bottom:2px solid #ddd;position:sticky;top:0;">
                <th style="padding:4px 6px;text-align:left;">Login</th>
                <th style="padding:4px 6px;text-align:left;">Trade</th>
                <th style="padding:4px 6px;text-align:center;">Ges.</th>
                <th style="padding:4px 6px;text-align:center;">Bill.</th>
                <th style="padding:4px 6px;text-align:center;">N-Bill.</th>
                <th style="padding:4px 6px;text-align:center;">Verf.</th>
                <th style="padding:4px 6px;text-align:center;">Status</th>
            </tr></thead><tbody>`;

        rows.forEach(row => {
            const b  = parseFloat((row.booked   || '0').replace(',', '.')) || 0;
            const bl = parseFloat((row.billable || '0').replace(',', '.')) || 0;
            tB += b; tBl += bl;
            const hl = row.hl || !!(lm[row.person]?.hl);
            const bg = row.status === 'AW' ? '#ffcdd2'
                     : b === 0             ? '#ffebee'
                     : bl > b              ? '#fff9c4'
                     : bl < b              ? '#bbdefb'
                     : bl === b && b > 0   ? '#c8e6c9' : '#fff';
            const nc = hl ? 'color:#d32f2f;font-weight:bold;' : '';
            const st = row.status === 'AW' ? '<span style="background:#c00;color:#fff;padding:0 3px;border-radius:2px;font-weight:bold;">AW</span>'
                     : row.status === 'U'  ? '<span style="background:#e65100;color:#fff;padding:0 3px;border-radius:2px;font-weight:bold;">U</span>'
                     : row.status          ? `<span style="background:#eee;padding:0 3px;border-radius:2px;">${row.status}</span>` : '';
            html += `<tr style="background:${bg};border-bottom:1px solid #f0f0f0;">
                <td style="padding:3px 6px;${nc}">${hl ? '★ ' : ''}${row.person || '—'}</td>
                <td style="padding:3px 6px;color:#666;">${row.trade}</td>
                <td style="padding:3px 6px;text-align:center;font-weight:bold;">${row.booked  || '—'}</td>
                <td style="padding:3px 6px;text-align:center;">${row.billable || '—'}</td>
                <td style="padding:3px 6px;text-align:center;">${row.nonbill  || '—'}</td>
                <td style="padding:3px 6px;text-align:center;">${row.avail    || '—'}</td>
                <td style="padding:3px 6px;text-align:center;">${st}</td>
            </tr>`;
        });
        html += `</tbody><tfoot><tr style="background:#e8eef4;border-top:2px solid #aaa;font-weight:bold;">
            <td colspan="2" style="padding:4px 6px;color:#555;">∑ ${rows.length}</td>
            <td style="padding:4px 6px;text-align:center;">${tB.toFixed(1).replace('.', ',')}</td>
            <td style="padding:4px 6px;text-align:center;">${tBl.toFixed(1).replace('.', ',')}</td>
            <td colspan="3"></td>
        </tr></tfoot></table>`;
        body.innerHTML = html;
    }

    // ─── Auto-Refresh Loop ────────────────────────────────────────────────────
    function init() {
        buildUI();
        const cached = getCached();
        if (cached) { renderTable(cached); setStatus('ok'); }
        if (!_loading) triggerRefresh();

        setInterval(() => {
            if (!_loading && Date.now() - _lastRefresh > REFRESH_MS) triggerRefresh();
        }, 60000); // check every minute
    }

    // Warten bis DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500);
    }

})();
