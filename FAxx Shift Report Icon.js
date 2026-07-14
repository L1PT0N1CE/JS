(function () {
    'use strict';

    const SHIFT_DESC  = 'FRA7 Schicht 3';
    const PANEL_ID    = 'aki-fa73-panel';
    const REFRESH_MS  = 5 * 60 * 1000;
    const STORE_LIST  = 'EAM.store.operation.casemanagement.cscase_lst_lst';
    const STORE_LABOR = 'EAM.store.operation.casemanagement.cscase_xsd_xsd';
    const SR_SETTINGS = 'sr-shift-settings-v2';
    const CACHE_KEY   = 'fa73_panel_cache_v2';
    const CUSTOM_KEY  = 'fa73_custom_v1';

    // EAM_ORDER nur als letzter Fallback (Store-Reihenfolge ändert sich täglich)
    const EAM_ORDER = [
        'hsshimen','klikevi','ussaxel','jsonsta','rmalogor','shalsami',
        'kanataza','kedama','lugejaso','schmidqd','halkenhc','schudack',
        'sprinoli','ionelvic','ivelik','daldalci',
    ];

    let _loading = false;
    let _lastRefresh = 0;

    // ─── Custom Settings (★ + Reihenfolge) ────────────────────────────────────
    function getCustom()   { try { return JSON.parse(localStorage.getItem(CUSTOM_KEY)||'{}'); } catch(e){ return {}; } }
    function saveCustom(o) { try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(o)); } catch(e){} }
    function getStarred()  { return new Set(getCustom().starred || []); }
    function getOrder()    { return getCustom().order || []; }

    function toggleStar(login) {
        const c = getCustom();
        const s = new Set(c.starred || []);
        s.has(login) ? s.delete(login) : s.add(login);
        c.starred = [...s];
        saveCustom(c);
    }

    function moveRow(login, dir) {
        const c = getCustom();
        let order = c.order || [];
        if (!order.length) {
            const cached = getCached();
            order = cached ? cached.map(r => r.person).filter(Boolean) : [...EAM_ORDER];
        }
        const idx = order.indexOf(login);
        if (idx === -1) { c.order = order; saveCustom(c); return; }
        const target = idx + dir;
        if (target < 0 || target >= order.length) { c.order = order; saveCustom(c); return; }
        [order[idx], order[target]] = [order[target], order[idx]];
        c.order = order;
        saveCustom(c);
    }

    function applyCustomOrder(rows) {
        const order = getOrder();
        if (!order.length) return rows;
        const map = {};
        rows.forEach(r => { if (r.person) map[r.person] = r; });
        const sorted = order.map(l => map[l]).filter(Boolean);
        rows.forEach(r => { if (r.person && !order.includes(r.person)) sorted.push(r); });
        return sorted;
    }

    // ─── Cache ────────────────────────────────────────────────────────────────
    function getCached() {
        try {
            const o = JSON.parse(localStorage.getItem(CACHE_KEY)||'null');
            if (!o || o.date !== new Date().toDateString()) return null;
            if (o.ts && Date.now() - o.ts > 30*60*1000) return null;
            return o.rows;
        } catch(e){ return null; }
    }
    function saveCache(rows) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({date:new Date().toDateString(),ts:Date.now(),rows})); } catch(e){}
    }

    // ─── KPI-Body finden ──────────────────────────────────────────────────────
    function getKpiBody() {
        return document.querySelector('[id*="bsstrt_kpis"][id$="-body"]');
    }
    function isStartCenter() {
        return !!getKpiBody();
    }

    // ─── Haupt-Loop ───────────────────────────────────────────────────────────
    setInterval(() => {
        if (!isStartCenter()) {
            if (_loading) _loading = false;
            const old = document.getElementById(PANEL_ID);
            if (old) old.remove();
            return;
        }
        const panel = document.getElementById(PANEL_ID);
        if (!panel) {
            injectPanel(getCached() || null);
            if (!_loading) triggerRefresh();
            return;
        }
        const kb = getKpiBody();
        if (kb && !kb.contains(panel)) { panel.remove(); return; }
        if (!_loading && Date.now() - _lastRefresh > REFRESH_MS) triggerRefresh();
    }, 1000);

    function triggerRefresh() {
        _loading = true; _lastRefresh = Date.now();
        loadShiftData()
            .then(rows => { saveCache(rows); injectPanel(rows); })
            .catch(e => console.warn('[FA73]', e))
            .finally(() => { _loading = false; });
    }

    // ─── Login-Map ────────────────────────────────────────────────────────────
    function getShiftLoginMap() {
        const map = {};
        try {
            const s = JSON.parse(localStorage.getItem(SR_SETTINGS)||'null');
            if (!s) return map;
            for (const k of Object.keys(s)) {
                const sh = s[k];
                if (sh?.name?.includes(SHIFT_DESC)) {
                    (sh.entries||[]).forEach(e => { map[e.login] = {hl:e.highlight||false,role:e.role||''}; });
                    break;
                }
            }
        } catch(e){}
        return map;
    }

    // ─── Daten laden ──────────────────────────────────────────────────────────
    function loadShiftData() {
        return new Promise((resolve, reject) => {
            let done = false, wrapDiv = null;
            const timer = setTimeout(() => { if (!done){done=true;reject('timeout');} }, 45000);
            function finish(r) {
                if (done) return; done = true;
                clearTimeout(timer);
                try { if (wrapDiv) wrapDiv.style.display='none'; } catch(e){}
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
                    const iExt = document.querySelector('iframe')?.contentWindow?.Ext;
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
                    if ((d.casedescription||'').includes(SHIFT_DESC)||d.shift==='FA73') { idx=i; break; }
                }
                for (const g of iExt.ComponentQuery.query('gridpanel')) {
                    try {
                        const gs = g.getStore?.();
                        if (gs && (gs.storeId||gs.id||'').includes('cscase_lst')) {
                            g.getSelectionModel().select(idx, false, false); break;
                        }
                    } catch(e){}
                }
                const oldLs = iExt.StoreManager.lookup(STORE_LABOR);
                if (oldLs) try { oldLs.removeAll(); } catch(e){}
                setTimeout(() => {
                    try {
                        for (const tp of iExt.ComponentQuery.query('uxtabpanel')) {
                            const items = tp.items?.items || [];
                            const lt = items.find(t => t.title==='Labor');
                            if (lt) {
                                const rt = items.find(t => t.title==='Record View');
                                try { if (rt) tp.setActiveTab(rt); } catch(e){}
                                setTimeout(() => { try { tp.setActiveTab(lt); } catch(e){} }, 300);
                                break;
                            }
                        }
                    } catch(e){}
                    waitForLabor(iExt);
                }, 1200);
            }

            function waitForLabor(iExt) {
                let resolved = false;

                // v4.4 FIX: break→continue + contentDocument-Fallback + Login-Format-Filter
                function getGridLogins() {
                    // Versuch 1: iExt ComponentQuery (präzise, aber Grid muss gerendert sein)
                    try {
                        for (const g of iExt.ComponentQuery.query('gridpanel')) {
                            const gst = g.getStore && g.getStore();
                            if (!gst || (gst.storeId||gst.id||'') !== STORE_LABOR) continue;
                            const view = g.getView && g.getView();
                            if (!view || !view.el || !view.el.dom) continue; // v4.4: war break!
                            const rows = view.el.dom.querySelectorAll('.x-grid-row');
                            const result = Array.from(rows).map(r => {
                                const c = r.querySelector('.x-grid-cell-inner');
                                return c ? c.textContent.trim().toLowerCase() : '';
                            }).filter(Boolean);
                            if (result.length > 0) return result;
                        }
                    } catch(e) {}

                    // Versuch 2: contentDocument (same-origin, kein ExtJS nötig)
                    try {
                        const iframeEl = document.querySelector('iframe[id*="uxtabiframe"]');
                        if (iframeEl && iframeEl.contentDocument) {
                            const rows = iframeEl.contentDocument.querySelectorAll('.x-grid-row');
                            if (rows.length > 0) {
                                // Login-Format-Filter: nur Logins ohne Leerzeichen, 4-15 Zeichen
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
                    finish(ls.data.items.map((item, i) => {
                        const d = item.data;
                        // Priorität: Store-Feld → Grid-Zelle → EAM_ORDER Fallback
                        const login = d.xsd_shp_person||d.xsd_person||d.xsd_employee||gridLogins[i]||EAM_ORDER[i]||'';
                        const info  = lm[login] || {};
                        return { person:login, hl:info.hl||false, trade:d.xsd_csm_trade||'',
                            booked:d.xsd_booked_labor_shift||'', billable:d.xsd_hours_billable_n||'',
                            nonbill:d.xsd_hours_nonbillable||'', avail:d.xsd_hours_avail||'',
                            status:d.xsd_exc_comment||'' };
                    }));
                }
                iExt.StoreManager.on('add', function onAdd(mgr, store) {
                    if ((store.storeId||store.id)===STORE_LABOR) {
                        iExt.StoreManager.un('add', onAdd);
                        // v4.4: 500ms Delay - Grid braucht Zeit zum Rendern nach Store-Load
                        store.on('load', () => setTimeout(() => process(store), 500), null, {single:true});
                    }
                });
                let tries = 0;
                const poll = setInterval(() => {
                    if (++tries > 50) { clearInterval(poll); if (!resolved) finish(new Error('Labor timeout')); return; }
                    const ls = iExt.StoreManager.lookup(STORE_LABOR);
                    if (!ls || ls.getCount()===0) return;
                    // v4.4: 500ms Delay - Grid braucht Zeit zum Rendern nach Store-Load
                    clearInterval(poll); setTimeout(() => process(ls), 500);
                }, 400);
            }
        });
    }

    // ─── Panel UI ────────────────────────────────────────────────────────────
    function injectPanel(rows) {
        const kb = getKpiBody();
        if (!kb) return;

        let panel = document.getElementById(PANEL_ID);
        if (!panel) {
            panel = document.createElement('div');
            panel.id = PANEL_ID;
            panel.style.cssText = 'margin:0;background:#fff;font-family:Arial,sans-serif;font-size:12px;';
            kb.style.overflow = 'auto';
            const kv = kb.querySelector('.x-dataview');
            if (kv) kv.style.display = 'none';
            kb.insertBefore(panel, kb.firstChild);
            panel.addEventListener('click', onPanelClick);
        }

        const isLoading = rows === null;
        const isError   = rows === 'error';
        if (rows && !isLoading && !isError) rows = applyCustomOrder(rows);

        const now = new Date().toLocaleTimeString('de-DE', {hour:'2-digit',minute:'2-digit'});
        const body = isLoading ? '<div style="padding:10px;color:#999;text-align:center;">Lade FA73...</div>'
                   : isError   ? '<div style="padding:8px;color:#c00;">Fehler – <span class="fa73-retry" style="color:#ff9900;cursor:pointer;">Neu laden</span></div>'
                   : buildTable(rows);

        panel.innerHTML =
            '<div style="padding:5px 8px;display:flex;align-items:center;justify-content:space-between;background:#232f3e;">' +
            '<span style="font-weight:bold;font-size:12px;color:#fff;">FA73 Shift Report</span>' +
            `<span style="font-size:10px;color:#aaa;">${now} &nbsp;<span class="fa73-refresh" style="color:#ff9900;cursor:pointer;font-size:14px;">&#8635;</span></span>` +
            '</div>' + body;
    }

    function onPanelClick(e) {
        const starEl = e.target.closest('[data-star-login]');
        if (starEl) {
            e.preventDefault();
            toggleStar(starEl.dataset.starLogin);
            injectPanel(getCached() || null);
            return;
        }
        const moveEl = e.target.closest('[data-move-login]');
        if (moveEl) {
            e.preventDefault();
            moveRow(moveEl.dataset.moveLogin, parseInt(moveEl.dataset.moveDir));
            injectPanel(getCached() || null);
            return;
        }
        if (e.target.closest('.fa73-refresh')) {
            e.preventDefault();
            injectPanel(getCached() || null);
            if (!_loading) triggerRefresh();
            return;
        }
        if (e.target.closest('.fa73-retry')) {
            e.preventDefault();
            injectPanel(null);
            if (!_loading) triggerRefresh();
            return;
        }
    }

    // ─── Tabelle ─────────────────────────────────────────────────────────────
    function buildTable(rows) {
        if (!rows?.length) return '<div style="padding:8px;color:#999;text-align:center;">Keine Daten</div>';
        let tB = 0, tBl = 0;
        const starred = getStarred();

        let html = `<div style="overflow-y:auto;"><table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead><tr style="background:#f0f0f0;border-bottom:2px solid #ddd;">
            <th style="padding:4px 2px 4px 6px;width:18px;"></th>
            <th style="padding:4px 2px;width:28px;"></th>
            <th style="padding:4px 6px;text-align:left;">Login</th>
            <th style="padding:4px 6px;text-align:left;">Trade</th>
            <th style="padding:4px 6px;text-align:center;">Ges.</th>
            <th style="padding:4px 6px;text-align:center;">Bill.</th>
            <th style="padding:4px 6px;text-align:center;">N-Bill.</th>
            <th style="padding:4px 6px;text-align:center;">Verf.</th>
            <th style="padding:4px 6px;text-align:center;">Status</th>
        </tr></thead><tbody>`;

        rows.forEach((row, idx) => {
            const b  = parseFloat((row.booked  ||'0').replace(',','.')) || 0;
            const bl = parseFloat((row.billable||'0').replace(',','.')) || 0;
            tB += b; tBl += bl;

            const isStar = starred.has(row.person) || row.hl;
            const bg = row.status==='AW' ? '#ffcdd2'
                     : b===0            ? '#ffebee'
                     : bl>b             ? '#fff9c4'
                     : bl<b             ? '#bbdefb'
                     : bl===b&&b>0      ? '#c8e6c9' : '#fff';

            const st = row.status==='AW'     ? '<span style="background:#c00;color:#fff;padding:0 3px;border-radius:2px;font-weight:bold;">AW</span>'
                     : row.status==='U'||row.status==='u' ? '<span style="background:#e65100;color:#fff;padding:0 3px;border-radius:2px;font-weight:bold;">U</span>'
                     : row.status==='Urlaub' ? '<span style="background:#7b1fa2;color:#fff;padding:0 3px;border-radius:2px;">Urlaub</span>'
                     : row.status           ? `<span style="background:#eee;padding:0 3px;border-radius:2px;">${row.status}</span>` : '';

            const nc = isStar ? 'color:#d32f2f;font-weight:bold;' : 'color:#232f3e;';

            html += `<tr style="background:${bg};border-bottom:1px solid #f0f0f0;">
                <td style="padding:2px 2px 2px 6px;text-align:center;">
                    <span data-star-login="${row.person}" style="cursor:pointer;font-size:13px;color:${isStar?'#f59e0b':'#ccc'};"
                        title="${isStar?'Stern entfernen':'Favorit setzen'}">${isStar?'★':'☆'}</span>
                </td>
                <td style="padding:2px 2px;text-align:center;white-space:nowrap;">
                    <span data-move-login="${row.person}" data-move-dir="-1"
                        style="cursor:${idx>0?'pointer':'default'};font-size:10px;color:${idx>0?'#555':'#ddd'};padding:0 1px;">▲</span>
                    <span data-move-login="${row.person}" data-move-dir="1"
                        style="cursor:${idx<rows.length-1?'pointer':'default'};font-size:10px;color:${idx<rows.length-1?'#555':'#ddd'};padding:0 1px;">▼</span>
                </td>
                <td style="padding:3px 6px;${nc}">${row.person||'—'}</td>
                <td style="padding:3px 6px;color:#666;">${row.trade}</td>
                <td style="padding:3px 6px;text-align:center;font-weight:bold;">${row.booked||'—'}</td>
                <td style="padding:3px 6px;text-align:center;">${row.billable||'—'}</td>
                <td style="padding:3px 6px;text-align:center;">${row.nonbill||'—'}</td>
                <td style="padding:3px 6px;text-align:center;">${row.avail||'—'}</td>
                <td style="padding:3px 6px;text-align:center;">${st}</td>
            </tr>`;
        });

        html += `</tbody><tfoot><tr style="background:#e8eef4;border-top:2px solid #aaa;font-weight:bold;">
            <td colspan="4" style="padding:4px 6px;color:#555;">∑ ${rows.length} Personen</td>
            <td style="padding:4px 6px;text-align:center;">${tB.toFixed(1).replace('.',',')}</td>
            <td style="padding:4px 6px;text-align:center;">${tBl.toFixed(1).replace('.',',')}</td>
            <td colspan="3"></td>
        </tr></tfoot></table></div>`;
        return html;
    }

})();
