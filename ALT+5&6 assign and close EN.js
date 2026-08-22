(function () {
    'use strict';

    document.addEventListener('keydown', function (e) {
        if (e.altKey && (e.key === '5' || e.key === '6')) {
            e.preventDefault();
            if (e.key === '5') fillAssigned();
            if (e.key === '6') fillStatus();
        }
    });

    function simulateTab(element) {
        const tabEvent = new KeyboardEvent('keydown', {
            key: 'Tab',
            keyCode: 9,
            code: 'Tab',
            which: 9,
            shiftKey: false,
            bubbles: true
        });
        element.dispatchEvent(tabEvent);
    }

    function fillStatus() {
        const fieldnameInput = document.querySelector('input[name="fieldname"]');
        if (fieldnameInput) {
            fieldnameInput.value = "Status";
            fieldnameInput.dispatchEvent(new Event('input', { bubbles: true }));
            simulateTab(fieldnameInput);
        }

        const filtervalueInput = document.querySelector('input[name="filtervalue"]');
        if (filtervalueInput) {
            setTimeout(() => {
                filtervalueInput.value = "Completed";
                filtervalueInput.dispatchEvent(new Event('input', { bubbles: true }));
            }, 100);
        }
    }

    function fillAssigned() {
        const fieldnameInput = document.querySelector('input[name="fieldname"]');
        if (fieldnameInput) {
            const currentValue = fieldnameInput.value;
            if (currentValue === "--Select Field--") {
                fieldnameInput.value = "Assigned To";
            } else if (currentValue === "--Feld auswählen--") {
                fieldnameInput.value = "Zugewiesen an";
            }
            fieldnameInput.dispatchEvent(new Event('input', { bubbles: true }));
            simulateTab(fieldnameInput);
        }

        const filtervalueInput = document.querySelector('input[name="filtervalue"]');
        if (filtervalueInput) {
            const savedLogin = localStorage.getItem('filtervalueLogin');
            if (savedLogin) {
                filtervalueInput.value = savedLogin;
                filtervalueInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                const login = prompt("Bitte geben Sie den Login ein:");
                if (login) {
                    localStorage.setItem('filtervalueLogin', login);
                    filtervalueInput.value = login;
                    filtervalueInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        }
    }

})();



