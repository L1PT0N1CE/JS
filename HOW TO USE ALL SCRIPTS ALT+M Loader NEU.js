(function () {
    'use strict';

    const SHORTCUTS = {
        'EAM / APM': [
            ['Alt+1', 'Linke Checkliste ausfüllen'],
            ['Alt+2', 'Rechte Checkliste ausfüllen'],
            ['Alt+X', 'Checkliste entfernen'],
            ['Alt+3', 'Work Order ausfüllen (ggf. 2x drücken)'],
            ['Alt+4', 'Book Labor Fenster öffnen'],
            ['Alt+5', 'Ausgewählte WO zuweisen (2x)'],
            ['Alt+6', 'Ausgewählte WO schließen (2x)'],
            ['Alt+C', 'FWO Comment Template einfügen'],
            ['Alt+N', 'LOTO Bild hochladen'],
        ],
        'SIM / Ticketing': [
            ['Alt+1', 'Auto-Refresher einstellen'],
            ['Alt+2', 'Ticket mir zuweisen'],
            ['Alt+3', 'Antwort: Ticket erhalten'],
            ['Alt+4', 'Smart Reply (Titel-basiert)'],
            ['Alt+5', 'CTI → OpsTechIT / Client Devices / Other'],
        ],
        'Allgemein': [
            ['Alt+M', 'Diese Hilfe ein-/ausblenden'],
        ],
    };

    const COLORS = {
        bg: '#0f1117',
        border: '#2a2d3a',
        header: '#1a1d27',
        accent: '#00d4ff',
        accent2: '#7c3aed',
        accent3: '#22c55e',
        text: '#e2e8f0',
        muted: '#64748b',
        row: '#13161f',
        rowHover: '#1e2130',
    };

    const SECTION_COLORS = ['#00d4ff', '#a78bfa', '#34d399'];

    function createModal() {
        if (document.getElementById('__aki_help__')) return;

        const overlay = document.createElement('div');
        overlay.id = '__aki_help__';
        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            zIndex: '2147483647', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        });

        const modal = document.createElement('div');
        Object.assign(modal.style, {
            background: COLORS.bg, border: `1px solid ${COLORS.border}`,
            borderRadius: '12px', width: '480px', maxHeight: '85vh',
            overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.8)',
            fontFamily: '"Segoe UI", system-ui, sans-serif', color: COLORS.text,
            userSelect: 'none',
        });

        // Header
        const header = document.createElement('div');
        Object.assign(header.style, {
            background: COLORS.header, padding: '16px 20px',
            borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'move',
        });
        header.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:18px">⌨️</span>
                <div>
                    <div style="font-size:15px;font-weight:700;color:#fff">AKI Script Shortcuts</div>
                    <div style="font-size:11px;color:${COLORS.muted}">ALT+M zum Schließen</div>
                </div>
            </div>
            <button id="__aki_close__" style="background:none;border:none;color:${COLORS.muted};font-size:20px;cursor:pointer;padding:0 4px;line-height:1">×</button>
        `;

        // Body
        const body = document.createElement('div');
        Object.assign(body.style, {
            padding: '16px 20px', overflowY: 'auto', maxHeight: 'calc(85vh - 60px)',
        });

        Object.entries(SHORTCUTS).forEach(([section, items], si) => {
            const color = SECTION_COLORS[si] || COLORS.accent;

            const sectionEl = document.createElement('div');
            sectionEl.style.marginBottom = '16px';

            const sectionTitle = document.createElement('div');
            Object.assign(sectionTitle.style, {
                fontSize: '11px', fontWeight: '700', letterSpacing: '1px',
                color: color, textTransform: 'uppercase', marginBottom: '8px',
                paddingBottom: '6px', borderBottom: `1px solid ${COLORS.border}`,
            });
            sectionTitle.textContent = section;
            sectionEl.appendChild(sectionTitle);

            items.forEach(([key, desc]) => {
                const row = document.createElement('div');
                Object.assign(row.style, {
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '7px 8px', borderRadius: '6px', cursor: 'default',
                    transition: 'background .15s',
                });
                row.onmouseenter = () => row.style.background = COLORS.rowHover;
                row.onmouseleave = () => row.style.background = 'transparent';

                const kbd = document.createElement('kbd');
                Object.assign(kbd.style, {
                    background: `${color}18`, border: `1px solid ${color}40`,
                    color: color, padding: '3px 8px', borderRadius: '5px',
                    fontSize: '11px', fontWeight: '700', fontFamily: 'monospace',
                    minWidth: '52px', textAlign: 'center', whiteSpace: 'nowrap',
                    flexShrink: '0',
                });
                kbd.textContent = key;

                const txt = document.createElement('span');
                txt.style.fontSize = '13px';
                txt.style.color = COLORS.text;
                txt.textContent = desc;

                row.appendChild(kbd);
                row.appendChild(txt);
                sectionEl.appendChild(row);
            });

            body.appendChild(sectionEl);
        });

        // Footer
        const footer = document.createElement('div');
        Object.assign(footer.style, {
            padding: '10px 20px', borderTop: `1px solid ${COLORS.border}`,
            fontSize: '11px', color: COLORS.muted, textAlign: 'center',
        });
        footer.textContent = 'kanataza · FRA7 RME · powered by Aki';

        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Draggable
        let dragging = false, ox = 0, oy = 0;
        header.addEventListener('mousedown', e => {
            dragging = true;
            const r = modal.getBoundingClientRect();
            ox = e.clientX - r.left; oy = e.clientY - r.top;
            modal.style.position = 'fixed';
        });
        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            modal.style.left = (e.clientX - ox) + 'px';
            modal.style.top  = (e.clientY - oy) + 'px';
            overlay.style.alignItems = 'flex-start';
            overlay.style.justifyContent = 'flex-start';
        });
        document.addEventListener('mouseup', () => dragging = false);

        // Close
        overlay.addEventListener('click', e => { if (e.target === overlay) toggle(); });
        document.getElementById('__aki_close__').onclick = toggle;
    }

    function toggle() {
        const el = document.getElementById('__aki_help__');
        if (el) { el.remove(); }
        else { createModal(); }
    }

    document.addEventListener('keydown', e => {
        if (e.altKey && e.key.toLowerCase() === 'm') {
            e.preventDefault();
            toggle();
        }
    });

})();
