// ==UserScript==
// @name          APM GOD ALT1-4 DE&EN (Locked)
// @namespace     https://phonetool.amazon.com/users/kanataza
// @version       1.5
// @description   All what you need honey - Locked until subscription
// @author        kanataza
// @match         *://eu1.eam.hxgnsmartcloud.com/*
// @match         *://us1.eam.hxgnsmartcloud.com/*
// @require       https://code.jquery.com/jquery-3.6.0.min.js
// @require       https://code.jquery.com/ui/1.12.1/jquery-ui.min.js
// @grant         GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    const $ = jQuery.noConflict(true);

    // Funktion zur Erstellung und Anzeige des Abo-Fensters
    function showLockModal() {
        // Falls das Fenster bereits existiert, nur sichtbar machen und nach vorne holen
        if ($("#xyz-lock-modal").length > 0) {
            $("#xyz-lock-modal").show();
            return;
        }

        const modalContent = `
            <div id="xyz-lock-modal" style="position:fixed; z-index:100000; left:50%; top:50%; transform:translate(-50%, -50%); width:400px; padding:20px; background-color:#fff; border:3px solid red; box-shadow:0px 0px 20px rgba(0,0,0,0.8); cursor:move; font-family: Arial, sans-serif; color: black;">
                <span id="close-xyz-lock" style="position:absolute; top:10px; right:20px; cursor:pointer; font-size:24px; font-weight:bold; color:#aaa; user-select:none;">&times;</span>
                <div style="text-align:center; color:red;">
                    <h2 style="margin-top:0;">⚠️ ABO ERFORDERLICH ⚠️</h2>
                    <p style="color:black;">Um diese Scripts weiterhin zu nutzen, schließe bitte ein Abo bei <b>Azad Kanat</b> ab.<b><br> Paypal: Azadkanat@icloud.com </br></b></p>
                    <hr style="border:1px solid red;">
                    <p style="color:black;"><b>Preise:</b></p>
                    <ul style="list-style:none; padding:0; color:black; font-weight:bold;">
                        <li>Standard: 20€ / Monat</li>
                        <li>Für Cihanker: 30€ / Monat</li>
                    </ul>
                    <p style="font-size:0.8em; color:gray;">Das Skript bleibt bis zur Freischaltung deaktiviert.</p>
                </div>
            </div>
        `;

        $("body").append(modalContent);

        // Draggable machen über jQuery UI
        $("#xyz-lock-modal").draggable();

        // Schließen-Button Event (X) mit korrekter jQuery .css() Methode
        $("#close-xyz-lock").hover(
            function() { $(this).css('color', '#000'); },
            function() { $(this).css('color', '#aaa'); }
        ).click(function() {
            $("#xyz-lock-modal").hide();
        });
    }

    // Abgefangene Shortcuts -> Zeigen nur das Abo-Fenster
    document.addEventListener('keydown', function(event) {
        if (event.altKey) {
            const key = event.key.toLowerCase();
            if (key === '1' || key === '2' || key === 'x' || key === '3' || key === '4') {
                event.preventDefault();
                event.stopPropagation();
                showLockModal();
            }
        }
    }, true); // 'true' stellt sicher, dass das Event im Capturing-Modus abgefangen wird

    $(document).keydown(function(event) {
        if (event.altKey && event.which === 52) { // ALT+4 Absicherung für jQuery Listener
            event.preventDefault();
            event.stopPropagation();
            showLockModal();
        }
    });

    console.log("APM GOD Script geladen, aber für Shortcuts gesperrt.");

})();
