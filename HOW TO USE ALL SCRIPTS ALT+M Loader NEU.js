// ==UserScript==
// @name         HOW TO USE ALL SCRIPTS ALT+M Loader NEU
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Displays a box with specific instructions on scripts
// @author       Kanataza
// @match        aHR0cHM6Ly9ldTEuZWFtLmh4Z25zbWFydGNsb3VkLmNvbS8=
// @grant        none
// @icon         https://media.licdn.com/dms/image/D4E03AQGYEWJAKzMoHg/profile-displayphoto-shrink_800_800/0/1675186919356?e=2147483647&v=beta&t=yD2lwHTC78Y0eFQGGpl173y2Rhv9LmZgCe6LKvLYFvI

// ==/UserScript==

(function() {
    'use strict';

    // Function to get the saved modal state
    function getModalState() {
        return localStorage.getItem('xyz-modal-closed') === 'true';
    }

    // Function to set the modal state
    function setModalState(isClosed) {
        localStorage.setItem('xyz-modal-closed', isClosed);
    }

    // Create the modal container
    var modalContainer = document.createElement('div');
    modalContainer.id = 'xyz-modal-container';
    modalContainer.style.position = 'fixed';
    modalContainer.style.zIndex = '10000';
    modalContainer.style.left = '50%';
    modalContainer.style.top = '50%';
    modalContainer.style.transform = 'translate(-50%, -50%)';
    modalContainer.style.width = '400px';
    modalContainer.style.padding = '20px';
    modalContainer.style.backgroundColor = '#fff';
    modalContainer.style.border = '2px solid #000';
    modalContainer.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
    modalContainer.style.cursor = 'move';
    document.body.appendChild(modalContainer);

    // Create the close button
    var closeButton = document.createElement('span');
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '20px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '20px';
    closeButton.onclick = function() {
        modalContainer.style.display = 'none';
        setModalState(true); // Save the state as closed
    };
    modalContainer.appendChild(closeButton);

    // Create the content of the modal
    var modalContent = document.createElement('div');
    modalContent.innerHTML = `
        <h2>xyz Script Instructions</h2>
        <p>ALT+1 = Fills out the Checklist/Füllt Checkliste aus</p>
        <p>ALT+2 = Remove the check on the Checklist/Entfernt das abgehakte in der Checkliste</p>
        <p>ALT+3 = Fills out the Record View in a WO for Tickets/Füllt Datenansicht automatisch aus</p>
        <p>ALT+4 = Opens a Window for Time booking/Öffnet ein Fenster zum Zeiten buchen (buggy/Fehlerhaft)</p>
        <p>ALT+5 = by right-clicking on the work order (field update) you have to click 2x ALT+5 so that “assigned to” is filled in</p>
        <p>ALT+6 = Same way like ALT+5 but it fills the Workorder Status to "Completed"</p>
        <h3>To open and close this Window press ALT+M</h3>
    `;
    modalContainer.appendChild(modalContent);

    // Make the modal draggable
    var isDragging = false;
    var startX, startY, initialMouseX, initialMouseY;

    modalContainer.onmousedown = function(e) {
        isDragging = true;
        startX = modalContainer.offsetLeft;
        startY = modalContainer.offsetTop;
        initialMouseX = e.clientX;
        initialMouseY = e.clientY;
        document.onmousemove = onMouseMove;
        document.onmouseup = onMouseUp;
        return false;
    };

    function onMouseMove(e) {
        if (!isDragging) return;
        var dx = e.clientX - initialMouseX;
        var dy = e.clientY - initialMouseY;
        modalContainer.style.left = startX + dx + 'px';
        modalContainer.style.top = startY + dy + 'px';
        return false;
    }

    function onMouseUp() {
        isDragging = false;
        document.onmousemove = null;
        document.onmouseup = null;
    }

    // Function to toggle the modal visibility
    function toggleModal() {
        if (modalContainer.style.display === 'none') {
            modalContainer.style.display = 'block';
            setModalState(false); // Save the state as open
        } else {
            modalContainer.style.display = 'none';
            setModalState(true); // Save the state as closed
        }
    }

    // Check the saved modal state and set initial display
    if (getModalState()) {
        modalContainer.style.display = 'none';
    } else {
        modalContainer.style.display = 'block';
    }

    // Add keyboard shortcut to toggle the modal
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key.toLowerCase() === 'm') {
            toggleModal();
        }
    });
})();
