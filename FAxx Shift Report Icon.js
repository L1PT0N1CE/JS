(function () {
    'use strict';

    if (window !== window.top) return;
    if (window._fa73FloatInit) return;
    window._fa73FloatInit = true;

    // ── Konstanten ──────────────────────────────────────────────────────────
    const SHIFT_DESC  = 'FRA7 Schicht 3';
    const STORE_LIST  = 'EAM.store.operation.casemanagement.cscase_lst_lst';
    const STORE_LABOR = 'EAM.store.operation.casemanagement.cscase_xsd_xsd';
    const CACHE_KEY   = 'fa73_v2_cache';
    const STATE_KEY   = 'fa73_v2_state';
    const STARS_KEY   = 'fa73_v2_stars';
    const CACHE_TTL   = 30 * 60 * 1000; // 30min
    const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5min — nur wenn Panel offen

    // ── SG3 Team (hardcoded) ─────────────────────────────────────────────────
    const SG3 = [
        { login: 'hsshimen', role: 'ASSOC', star: true  },
        { login: 'ionelvic', role: 'ASSOC', star: false },
        { login: 'ivelik',   role: 'ASSOC', star: false },
        { login: 'daldalci', role: 'TECH',  star: false },
        { login: 'halkenhc', role: 'TECH',  star: false },
        { login: 'jsonsta',  role: 'TECH',  star: false },
        { login: 'kanataza', role: 'TECH',  star: true  },
        { login: 'kedama',   role: 'TECH',  star: false },
        { login: 'klikevi',  role: 'TECH',  star: false },
        { login: 'lugejaso', role: 'TECH',  star: false },
        { login: 'rmalogor', role: 'TECH',  star: true  },
        { login: 'schmidqd', role: 'TECH',  star: false },
        { login: 'schudack', role: 'TECH',  star: false },
        { login: 'shalsami', role: 'TECH',  star: false },
        { login: 'sprinoli', role: 'TECH',  star: false },
        { login: 'ussaxel',  role: 'TECH',  star: false },
    ];

    // EAM-Zeilenreihenfolge im Labor-Grid (Fallback wenn Login-Feld leer)
    const EAM_ORDER = [
        'hsshimen', 'ionelvic', 'ivelik',
        'daldalci', 'halkenhc', 'jsonsta', 'kanataza', 'kedama', 'klikevi',
        'lugejaso', 'rmalogor', 'schmidqd', 'schudack', 'shalsami', 'sprinoli', 'ussaxel',
    ];

    const SG3_MAP = Object.fromEntries(SG3.map(e => [e.login, e]));

    // ── State / Cache / Stars ─────────────────────────────────────────────────
    let _loading = false, _lastRefresh = 0, _lastRows = null;

    const ls = {
        get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch(e) { return null; } },
        set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {} }
    };

    function getState()    { return ls.get(STATE_KEY) || {}; }
    function saveState(o)  { ls.set(STATE_KEY, o); }

    function getStars() {
        const a = ls.get(STARS_KEY);
        return new Set(Array.isArray(a) ? a : SG3.filter(e => e.star).map(e => e.login));
    }
    function saveStars(s) { ls.set(STARS_KEY, [...s]); }

    function getShiftDate() {
        const d = new Date();
        if (d.getHours() < 7) d.setDate(d.getDate() - 1);
        return d.toDateString();
    }

    function getCached() {
        const o = ls.get(CACHE_KEY);
        if (!o || o.date !== getShiftDate()) return null;
        if (Date.now() - o.ts > CACHE_TTL) return null;
        return o.rows;
    }
    function saveCache(rows) {
        ls.set(CACHE_KEY, { date: getShiftDate(), ts: Date.now(), rows });
    }

    // ── EAM Daten laden ────────────────────────────────────────────────────────
    function loadShiftData() {
        return new Promise((resolve, reject) => {
            let done = false, wrapDiv = null;
            const timer = setTimeout(() => finish(new Error('Timeout')), 45000);

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
                    const iframeEl = document.getElementById(comp.id + '-iframeEl');
                    if (!iframeEl) return;
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
                    clearInterval(poll);
                    selectAndLoad(iExt, ls);
                }, 500);
            }

            function selectAndLoad(iExt, listStore) {
                const shiftDateStr = getShiftDate();
                let bestIdx = -1;
                for (let i = 0; i < listStore.getCount(); i++) {
                    const rec = listStore.getAt ? listStore.getAt(i) : listStore.data?.items?.[i];
                    if (!rec) continue;
                    const d = rec.data;
                    if (!((d.casedescription || '').includes(SHIFT_DESC) || d.shift === 'FA73')) continue;
                    if (bestIdx === -1) bestIdx = i;
                    if (d.eventstartdate && new Date(d.eventstartdate).toDateString() === shiftDateStr) { bestIdx = i; break; }
                }
                const idx = bestIdx !== -1 ? bestIdx : 0;

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
                            if (!lt) continue;
                            const rt = items.find(t => t.title === 'Record View');
                            try { if (rt) tp.setActiveTab(rt); } catch(e) {}
                            setTimeout(() => { try { tp.setActiveTab(lt); } catch(e) {} }, 300);
                            break;
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
                            const gst = g.getStore?.();
                            if (!gst || (gst.storeId || gst.id || '') !== STORE_LABOR) continue;
                            const view = g.getView?.();
                            if (!view?.el?.dom) continue;
                            const rows = view.el.dom.querySelectorAll('.x-grid-row');
                            const result = [...rows].map(r => r.querySelector('.x-grid-cell-inner')?.textContent?.trim()?.toLowerCase() || '').filter(Boolean);
                            if (result.length) return result;
                        }
                    } catch(e) {}
                    return [];
                }

                function process(store) {
                    if (resolved) return; resolved = true;
                    const gridLogins = getGridLogins();
                    const items = store.getRange ? store.getRange() : (store.data?.items || []);
                    const rows = items.map((item, i) => {
                        const d = item.data;
                        const login = d.xsd_shp_person || d.xsd_person || d.xsd_employee || gridLogins[i] || EAM_ORDER[i] || '';
                        const booked = d.xsd_booked_labor_shift
                            || (d.xsd_hours_billable_n || d.xsd_hours_billable_o
                                ? String(parseFloat(d.xsd_hours_billable_n || 0) + parseFloat(d.xsd_hours_billable_o || 0) || '')
                                : '');
                        return {
                            login,
                            trade:   d.xsd_csm_trade || '',
                            booked,
                            billable: d.xsd_hours_billable_n || '',
                            nonbill:  d.xsd_hours_nonbillable || d.xsd_hours_billable_o || '',
                            avail:    d.xsd_hours_avail || '',
                            status:   d.xsd_exc_comment || '',
                        };
                    });
                    finish(rows);
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
                    const store = iExt.StoreManager.lookup(STORE_LABOR);
                    if (!store || store.getCount() === 0) return;
                    clearInterval(poll);
                    setTimeout(() => process(store), 500);
                }, 400);
            }
        });
    }

    // ── Refresh ────────────────────────────────────────────────────────────────
    function triggerRefresh() {
        if (_loading) return;
        _loading = true;
        _lastRefresh = Date.now();
        setDot('loading');
        loadShiftData()
            .then(rows => { saveCache(rows); renderTable(rows); setDot('ok'); })
            .catch(e  => { console.warn('[FA73v2]', e); setDot('error'); })
            .finally(() => { _loading = false; });
    }

    // ── UI ─────────────────────────────────────────────────────────────────────
    function buildUI() {
        if (document.getElementById('fa73v2-root')) return;

        const st = getState();
        const open = st.open !== false;

        const root = document.createElement('div');
        root.id = 'fa73v2-root';
        Object.assign(root.style, {
            position: 'fixed', zIndex: '999999',
            fontFamily: 'Arial,sans-serif', fontSize: '11px',
            userSelect: 'none',
            ...(st.x != null ? { left: st.x + 'px', top: st.y + 'px' } : { right: '18px', bottom: '18px' })
        });

        // Panel
        const panel = document.createElement('div');
        panel.id = 'fa73v2-panel';
        const savedW = st.width  ?? 560;
        const savedH = st.height ?? 520;
        Object.assign(panel.style, {
            background: '#1a2332', borderRadius: '8px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            width: savedW + 'px', height: savedH + 'px',
            minWidth: '300px', minHeight: '120px', maxHeight: '90vh',
            display: open ? 'flex' : 'none',
            flexDirection: 'column', overflow: 'hidden',
            marginBottom: '8px', border: '1px solid #2d3f55',
            position: 'relative',
        });

        // Corner resize grip — oben rechts
        const grip = document.createElement('div');
        grip.id = 'fa73v2-grip';
        Object.assign(grip.style, {
            position: 'absolute', top: '0', right: '0',
            width: '18px', height: '18px',
            cursor: 'nesw-resize', zIndex: '10',
            borderRadius: '0 8px 0 0',
        });
        // Kleine Striche wie echtes Resize-Symbol
        // kein visuelles symbol — nur cursor ändert sich beim hovern
        panel.appendChild(grip);

        // Header
        const hdr = document.createElement('div');
        hdr.id = 'fa73v2-header';
        Object.assign(hdr.style, {
            background: '#0f1923', color: '#e8edf2',
            padding: '8px 12px', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
            cursor: 'move', flexShrink: '0',
            borderBottom: '1px solid #2d3f55'
        });
        hdr.innerHTML = `
            <span style="font-weight:bold;font-size:12px;letter-spacing:.5px;">FA73 Shift Report</span>
            <span style="display:flex;align-items:center;gap:10px;font-size:11px;color:#7a9ab8;">
                <span id="fa73v2-time"></span>
                <span id="fa73v2-btn-refresh" title="Refresh" style="color:#ff9900;cursor:pointer;font-size:17px;line-height:1;transition:transform .3s;">⟳</span>
                <span id="fa73v2-btn-close" title="Minimieren" style="color:#7a9ab8;cursor:pointer;font-size:16px;line-height:1;">−</span>
            </span>`;

        // Body
        const body = document.createElement('div');
        body.id = 'fa73v2-body';
        Object.assign(body.style, { overflowY: 'auto', flex: '1' });
        body.innerHTML = `<div style="padding:20px;text-align:center;color:#4a6a88;">Klick ⟳ zum Laden</div>`;

        panel.appendChild(hdr);
        panel.appendChild(body);

        // FAB
        const fab = document.createElement('div');
        fab.id = 'fa73v2-fab';
        Object.assign(fab.style, {
            background: '#0f1923', color: '#e8edf2',
            padding: '6px 14px', borderRadius: '20px',
            cursor: 'pointer', fontSize: '12px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', gap: '7px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
            border: '1px solid #2d3f55', whiteSpace: 'nowrap'
        });
        fab.innerHTML = `FA73 <span id="fa73v2-dot" style="width:8px;height:8px;border-radius:50%;background:#4a6a88;display:inline-block;"></span>`;

        root.appendChild(panel);
        root.appendChild(fab);
        document.body.appendChild(root);

        // Star click
        body.addEventListener('click', e => {
            const btn = e.target.closest('.fa73v2-star');
            if (!btn) return;
            e.stopPropagation();
            const s = getStars();
            const login = btn.dataset.login;
            s.has(login) ? s.delete(login) : s.add(login);
            saveStars(s);
            if (_lastRows) renderTable(_lastRows);
        });

        // Drag
        let dragging = false, dragged = false, ox = 0, oy = 0;
        function startDrag(e) {
            dragging = true; dragged = false;
            const r = root.getBoundingClientRect();
            ox = e.clientX - r.left; oy = e.clientY - r.top;
            e.preventDefault();
        }
        hdr.addEventListener('mousedown', e => {
            if (['fa73v2-btn-refresh','fa73v2-btn-close'].includes(e.target.id)) return;
            startDrag(e);
        });
        fab.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            dragged = true;
            root.style.left   = Math.max(0, Math.min(window.innerWidth  - root.offsetWidth,  e.clientX - ox)) + 'px';
            root.style.top    = Math.max(0, Math.min(window.innerHeight - root.offsetHeight, e.clientY - oy)) + 'px';
            root.style.right  = 'auto';
            root.style.bottom = 'auto';
        });
        document.addEventListener('mouseup', () => {
            if (!dragging) return; dragging = false;
            const r = root.getBoundingClientRect();
            const s = getState(); s.x = Math.round(r.left); s.y = Math.round(r.top); saveState(s);
        });

        // Diagonal-Resize (oben rechts)
        let _resizing = false, _rsX = 0, _rsY = 0, _rsW = 0, _rsH = 0, _rsTop = 0;
        grip.addEventListener('mousedown', e => {
            e.preventDefault(); e.stopPropagation();
            _resizing = true;
            _rsX = e.clientX; _rsY = e.clientY;
            _rsW = panel.offsetWidth; _rsH = panel.offsetHeight;
            _rsTop = root.getBoundingClientRect().top;
            document.body.style.cursor = 'nesw-resize';
        });
        document.addEventListener('mousemove', e => {
            if (!_resizing) return;
            const dx = e.clientX - _rsX;
            const dy = e.clientY - _rsY; // positiv = runter, negativ = hoch
            const newW = Math.max(300, _rsW + dx);
            const newH = Math.max(120, _rsH - dy); // hoch = größer
            panel.style.width  = newW + 'px';
            panel.style.height = newH + 'px';
            // Top mitbewegen → bottom-edge bleibt, panel wächst nach oben
            root.style.top    = Math.max(0, _rsTop + dy) + 'px';
            root.style.bottom = 'auto';
        });
        document.addEventListener('mouseup', () => {
            if (!_resizing) return; _resizing = false;
            document.body.style.cursor = '';
            const r = root.getBoundingClientRect();
            const s = getState();
            s.width  = Math.round(panel.offsetWidth);
            s.height = Math.round(panel.offsetHeight);
            s.x = Math.round(r.left);
            s.y = Math.round(r.top);
            saveState(s);
        });


        // FAB click — öffnen/schließen, nur laden wenn kein Cache
        fab.addEventListener('click', () => {
            if (dragged) { dragged = false; return; }
            const isOpen = panel.style.display !== 'none';
            panel.style.display = isOpen ? 'none' : 'flex';
            const s = getState(); s.open = !isOpen; saveState(s);
            if (!isOpen && !_loading && !getCached()) triggerRefresh();
        });

        document.getElementById('fa73v2-btn-refresh').addEventListener('click', e => {
            e.stopPropagation();
            _loading = false;
            triggerRefresh();
        });
        document.getElementById('fa73v2-btn-close').addEventListener('click', e => {
            e.stopPropagation();
            panel.style.display = 'none';
            const s = getState(); s.open = false; saveState(s);
        });
    }

    function setDot(state) {
        const dot  = document.getElementById('fa73v2-dot');
        const time = document.getElementById('fa73v2-time');
        if (dot) dot.style.background =
            state === 'ok' ? '#4caf50' : state === 'loading' ? '#ff9900' : '#f44336';
        if (time && state !== 'loading')
            time.textContent = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }

    function renderTable(rows) {
        _lastRows = rows;
        const body = document.getElementById('fa73v2-body');
        if (!body) return;
        if (!rows?.length) {
            body.innerHTML = '<div style="padding:16px;text-align:center;color:#4a6a88;">Keine Daten</div>';
            return;
        }
        const stars = getStars();
        let tB = 0, tBl = 0;

        const rowsHtml = rows.map(row => {
            const b  = parseFloat((row.booked   || '0').replace(',', '.')) || 0;
            const bl = parseFloat((row.billable || '0').replace(',', '.')) || 0;
            tB += b; tBl += bl;

            const isStar = stars.has(row.login);
            const info   = SG3_MAP[row.login] || {};

            // Zeilenfarbe
            const bg =
                row.status && row.status !== 'URLAUB' && row.status !== 'U' ? '#3d1a1a' :
                row.status === 'URLAUB' || row.status === 'U'               ? '#2a1f0f' :
                b === 0 && !row.status                                       ? '#2a1a1a' :
                bl > 0 && bl === b                                           ? '#0f2a18' :
                bl > 0 && bl < b                                             ? '#0f1f2a' : '#1a2332';

            const nameStyle = isStar ? 'color:#4fc3f7;font-weight:bold;' : 'color:#c8d8e8;';
            const tradeStyle = info.role === 'ASSOC' ? 'color:#90caf9;' : 'color:#7a9ab8;';

            const statusBadge = row.status
                ? `<span style="background:${row.status==='AW'?'#c62828':row.status==='URLAUB'||row.status==='U'?'#e65100':'#37474f'};color:#fff;padding:1px 5px;border-radius:3px;font-size:10px;font-weight:bold;">${row.status}</span>`
                : '';

            return `<tr style="background:${bg};border-bottom:1px solid #243040;">
                <td style="padding:4px 8px;${nameStyle}">
                    <span class="fa73v2-star" data-login="${row.login}"
                        style="cursor:pointer;color:${isStar?'#4fc3f7':'#2d3f55'};margin-right:4px;font-size:13px;">★</span>${row.login || '—'}
                </td>
                <td style="padding:4px 6px;font-size:10px;${tradeStyle}">${row.trade}</td>
                <td style="padding:4px 6px;text-align:center;font-weight:bold;color:#e8edf2;">${row.booked  || '—'}</td>
                <td style="padding:4px 6px;text-align:center;color:#b0c8e0;">${row.billable || '—'}</td>
                <td style="padding:4px 6px;text-align:center;color:#b0c8e0;">${row.nonbill  || '—'}</td>
                <td style="padding:4px 6px;text-align:center;color:#7a9ab8;">${row.avail    || '—'}</td>
                <td style="padding:4px 6px;text-align:center;">${statusBadge}</td>
            </tr>`;
        }).join('');

        document.getElementById('fa73v2-body').innerHTML = `
            <table style="width:100%;border-collapse:collapse;font-size:11px;">
                <thead><tr style="background:#0a1420;border-bottom:2px solid #2d3f55;position:sticky;top:0;">
                    <th style="padding:5px 8px;text-align:left;color:#7a9ab8;font-weight:600;">Login</th>
                    <th style="padding:5px 6px;text-align:left;color:#7a9ab8;font-weight:600;">Trade</th>
                    <th style="padding:5px 6px;text-align:center;color:#7a9ab8;font-weight:600;">Ges.</th>
                    <th style="padding:5px 6px;text-align:center;color:#7a9ab8;font-weight:600;">Bill.</th>
                    <th style="padding:5px 6px;text-align:center;color:#7a9ab8;font-weight:600;">N-Bill.</th>
                    <th style="padding:5px 6px;text-align:center;color:#7a9ab8;font-weight:600;">Verf.</th>
                    <th style="padding:5px 6px;text-align:center;color:#7a9ab8;font-weight:600;">Status</th>
                </tr></thead>
                <tbody>${rowsHtml}</tbody>
                <tfoot><tr style="background:#0a1420;border-top:2px solid #2d3f55;">
                    <td colspan="2" style="padding:5px 8px;color:#4a6a88;font-weight:bold;">∑ ${rows.length}</td>
                    <td style="padding:5px 6px;text-align:center;color:#e8edf2;font-weight:bold;">${tB.toFixed(1).replace('.',',')}</td>
                    <td style="padding:5px 6px;text-align:center;color:#b0c8e0;font-weight:bold;">${tBl.toFixed(1).replace('.',',')}</td>
                    <td colspan="3"></td>
                </tr></tfoot>
            </table>`;
    }

    // ── Init ───────────────────────────────────────────────────────────────────
    function init() {
        buildUI();

        // Cache zeigen — KEIN Auto-Refresh beim Start
        const cached = getCached();
        if (cached) { renderTable(cached); setDot('ok'); }

        // Auto-Refresh: nur wenn Panel sichtbar + Cache abgelaufen
        setInterval(() => {
            const panel = document.getElementById('fa73v2-panel');
            if (panel?.style.display !== 'none' && !_loading && Date.now() - _lastRefresh > AUTO_REFRESH_MS)
                triggerRefresh();
        }, 60000);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else setTimeout(init, 500);

})();
