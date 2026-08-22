(function () {
    'use strict';

    const TEMPLATE = `[Situation/Problem Description]:\t



[RootCause]:\t\t\t\t\t



[Task/Action (including parts)]:\t



[Parts]:\t


[How many Workers/Wie viele Mitarbeiter]:\t

[Duration/Dauer]:\t

[Results/Resultate]:\t

[Still actions?/Nacharbeiten?]:\t `;

    /* ---------- helpers ---------- */
    function getEditorBody() {
        const iframe = document.querySelector('iframe.x-htmleditor-iframe');
        if (!iframe) return null;
        try {
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            return doc?.body || null;
        } catch (e) {

            return null;
        }
    }

    function insertTemplate() {
        const body = getEditorBody();
        if (!body) {
            console.warn('Rich-text editor not found or not ready');
            return;
        }
        body.innerHTML = TEMPLATE.replace(/\n/g, '<br>');

        // notify ExtJS form
        ['input', 'change', 'keyup'].forEach(evt =>
            body.dispatchEvent(new Event(evt, { bubbles: true }))
        );
        console.log('✅ Template inserted with Alt+C');
    }

    function attachKeyHandler(iframe) {
        if (!iframe || !iframe.contentWindow) return;

        const handler = (e) => {
            if (e.altKey && e.key.toLowerCase() === 'c') {
                e.preventDefault();
                insertTemplate();
            }
        };

        // outer
        document.removeEventListener('keydown', handler);
        document.addEventListener('keydown', handler);

        // inner
        const innerDoc = iframe.contentDocument || iframe.contentWindow.document;
        innerDoc.removeEventListener('keydown', handler);
        innerDoc.addEventListener('keydown', handler);
    }

    function waitForIframeAndAttach() {
        const iframe = document.querySelector('iframe.x-htmleditor-iframe');
        if (!iframe) return;

        if (iframe.contentDocument?.readyState === 'complete') {
            attachKeyHandler(iframe);
        } else {
            iframe.addEventListener('load', () => attachKeyHandler(iframe));
        }
    }

    function init() {
        waitForIframeAndAttach();


        const observer = new MutationObserver(() => {
            waitForIframeAndAttach();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // wait until DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

