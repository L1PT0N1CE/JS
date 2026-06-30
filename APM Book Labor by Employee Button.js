(function () {
  "use strict";

  const LS_KEY = 'bl_username';        // eigener Key — kein Konflikt mit apmUsername (APM GOD)
  const LS_USERS_KEY = 'apmUserList';

  /* ================= USERNAME HANDLING ================= */

  function getUsername() {
    return localStorage.getItem(LS_KEY) || null;
  }

  function getUserList() {
    try {
      return JSON.parse(localStorage.getItem(LS_USERS_KEY)) || [];
    } catch { return []; }
  }

  function saveUserToList(username) {
    const list = getUserList();
    if (!list.includes(username)) {
      list.unshift(username);
      if (list.length > 5) list.pop(); // max 5 gespeicherte Logins
      localStorage.setItem(LS_USERS_KEY, JSON.stringify(list));
    }
  }

  function setActiveUser(username, callback) {
    localStorage.setItem(LS_KEY, username);
    saveUserToList(username);

    // employee-Feld befüllen falls vorhanden
    const empField = document.querySelector('input[name="employee"]');
    if (empField) setField(empField, username);

    if (callback) callback(username);
  }

  function askForUsername(onSuccess) {
    const overlay = createOverlay();
    overlay.style.zIndex = "999999";

    const box = document.createElement("div");
    box.style = "position:relative; background:white; padding:24px 24px 20px; border-radius:8px; min-width:300px; text-align:center; box-shadow:0 0 16px rgba(0,0,0,0.4);";

    const title = document.createElement("h3");
    title.innerText = "APM Script - Login";
    title.style = "margin:0 0 6px 0; font-size:15px;";

    const sub = document.createElement("p");
    sub.innerText = "Bitte deinen EAM-Benutzernamen eingeben:";
    sub.style = "margin:0 0 14px 0; font-size:12px; color:#555;";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "z.B. KANATAZA";
    input.style = "width:200px; padding:7px 10px; font-size:14px; border:1px solid #ccc; border-radius:4px; text-transform:uppercase;";

    // Autofill: gespeicherte Logins zuerst, dann sonstige LocalStorage-Keys
    const savedList = getUserList();
    if (savedList.length > 0) {
      input.value = savedList[0];
    } else {
      const knownLogins = ['login', 'lastSelectedEmployee', 'filtervalueLogin'];
      for (const key of knownLogins) {
        const val = localStorage.getItem(key);
        if (val && val.length > 2 && val.length < 20) {
          input.value = val.toUpperCase();
          break;
        }
      }
    }

    input.addEventListener("input", () => {
      input.value = input.value.toUpperCase();
    });

    // Gespeicherte Benutzer als Schnellauswahl anzeigen
    const savedList2 = getUserList();
    let quickSelectRow = null;
    if (savedList2.length > 0) {
      quickSelectRow = document.createElement("div");
      quickSelectRow.style = "margin-bottom:10px; display:flex; flex-wrap:wrap; gap:5px; justify-content:center;";

      const hint = document.createElement("div");
      hint.style = "width:100%; font-size:11px; color:#888; margin-bottom:3px;";
      hint.innerText = "Gespeicherte Logins:";
      quickSelectRow.appendChild(hint);

      savedList2.forEach(user => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.innerText = user;
        chip.style = "padding:3px 10px; font-size:12px; border-radius:12px; border:1px solid #ff9900; background:#fff8ee; cursor:pointer; font-weight:bold; color:#a05800;";
        chip.onclick = () => {
          document.body.removeChild(overlay);
          setActiveUser(user, onSuccess);
        };
        quickSelectRow.appendChild(chip);
      });
    }

    const okBtn = document.createElement("button");
    okBtn.innerText = "Speichern & Weiter";
    okBtn.style = "margin-top:14px; padding:7px 16px; cursor:pointer; background:#ff9900; border:1px solid #a88734; border-radius:4px; font-weight:bold;";
    okBtn.onclick = () => {
      const val = input.value.trim();
      if (!val) { input.style.border = "1px solid red"; return; }
      document.body.removeChild(overlay);
      setActiveUser(val, onSuccess);
    };

    input.addEventListener("keydown", e => {
      if (e.key === "Enter") okBtn.click();
    });

    const elements = [title, sub];
    if (quickSelectRow) elements.push(quickSelectRow);
    elements.push(input, document.createElement("br"), okBtn);
    box.append(...elements);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    setTimeout(() => input.focus(), 100);
  }

  /* Benutzer-Auswahl Modal (beim Klick auf "ändern") */
  function openUserSwitchModal(onClose, onSuccess) {
    const overlay = createOverlay();
    overlay.style.zIndex = "999999";

    const box = document.createElement("div");
    box.style = "position:relative; background:white; padding:24px 24px 20px; border-radius:8px; min-width:320px; text-align:center; box-shadow:0 0 16px rgba(0,0,0,0.4);";

    box.appendChild(createCloseButton(() => {
      document.body.removeChild(overlay);
      if (onClose) onClose();
    }));

    const title = document.createElement("h3");
    title.innerText = "Login wechseln";
    title.style = "margin:0 0 14px 0; font-size:15px;";

    box.appendChild(title);

    const savedList = getUserList();

    if (savedList.length > 0) {
      const listLabel = document.createElement("p");
      listLabel.innerText = "Gespeicherte Logins:";
      listLabel.style = "font-size:12px; color:#555; margin:0 0 8px 0; font-weight:bold;";
      box.appendChild(listLabel);

      savedList.forEach(user => {
        const row = document.createElement("div");
        row.style = "display:flex; align-items:center; justify-content:space-between; margin:5px 0; padding:6px 10px; border:1px solid #eee; border-radius:6px; background:#fafafa;";

        const nameSpan = document.createElement("span");
        nameSpan.innerText = user;
        nameSpan.style = "font-weight:bold; font-size:13px;";

        const selectBtn = document.createElement("button");
        selectBtn.innerText = "Auswählen";
        selectBtn.style = "padding:3px 10px; font-size:12px; cursor:pointer; background:#ff9900; border:1px solid #a88734; border-radius:4px; font-weight:bold;";
        selectBtn.onclick = () => {
          document.body.removeChild(overlay);
          setActiveUser(user, onSuccess);
          if (onClose) onClose();
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.innerText = "✕";
        deleteBtn.title = "Entfernen";
        deleteBtn.style = "padding:3px 7px; font-size:12px; cursor:pointer; background:none; border:1px solid #ccc; border-radius:4px; color:#999; margin-left:5px;";
        deleteBtn.onclick = () => {
          const newList = getUserList().filter(u => u !== user);
          localStorage.setItem(LS_USERS_KEY, JSON.stringify(newList));
          row.remove();
        };

        row.append(nameSpan, selectBtn, deleteBtn);
        box.appendChild(row);
      });
    }

    const divider = document.createElement("p");
    divider.innerText = "— oder neu eingeben —";
    divider.style = "font-size:11px; color:#aaa; margin:14px 0 8px 0;";
    box.appendChild(divider);

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Neuer Benutzername";
    input.style = "width:200px; padding:7px 10px; font-size:14px; border:1px solid #ccc; border-radius:4px; text-transform:uppercase;";
    input.addEventListener("input", () => { input.value = input.value.toUpperCase(); });

    const okBtn = document.createElement("button");
    okBtn.innerText = "Speichern & Nutzen";
    okBtn.style = "margin-top:12px; padding:7px 16px; cursor:pointer; background:#ff9900; border:1px solid #a88734; border-radius:4px; font-weight:bold;";
    okBtn.onclick = () => {
      const val = input.value.trim();
      if (!val) { input.style.border = "1px solid red"; return; }
      document.body.removeChild(overlay);
      setActiveUser(val, onSuccess);
      if (onClose) onClose();
    };

    input.addEventListener("keydown", e => { if (e.key === "Enter") okBtn.click(); });

    box.append(input, document.createElement("br"), okBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    setTimeout(() => input.focus(), 100);
  }

  function ensureUsername(callback) {
    const existing = getUsername();
    if (existing) {
      callback(existing);
    } else {
      askForUsername(callback);
    }
  }

  /* ================= HILFSFUNKTIONEN ================= */

  function getCurrentDate() {
    const monthsEN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const monthsDE = ["JAN", "FEB", "MRZ", "APR", "MAI", "JUN", "JUL", "AUG", "SEP", "OKT", "NOV", "DEC"];
    const allLabels = Array.from(document.querySelectorAll('.x-form-item-label-text'));
    const isDE = allLabels.some(el => el.innerText.trim() === "Arbeitsdatum:");
    const m = isDE ? monthsDE : monthsEN;
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}-${m[d.getMonth()]}-${d.getFullYear()}`;
  }

  function setField(el, val) {
    if (!el) return;
    el.focus();
    const clickEvt = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, buttons: 1 });
    el.dispatchEvent(clickEvt);
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /* ================= LABOR BUCHUNG LOGIK ================= */

  function fillFields(type, hrs, text) {
    const f1 = document.querySelector('input[name="octype"]');
    const f2 = document.querySelector('input[name="hrswork"]');
    const f3 = document.querySelector('input[name="boodescription"]');
    const f4 = document.querySelector('input[name="datework"]');
    const f5 = document.querySelector('input[name="employee"]');

    setField(f1, type);
    setField(f4, getCurrentDate());
    setField(f2, hrs);
    if (f5) setField(f5, getUsername());
    setTimeout(() => setField(f3, text), 200);
  }

  /* ================= MODAL HELPER ================= */

  function createCloseButton(onClose) {
    const xBtn = document.createElement("button");
    xBtn.innerText = "✕";
    xBtn.style = `
      position: absolute;
      top: 8px;
      right: 10px;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #555;
      line-height: 1;
      padding: 0;
    `;
    xBtn.title = "Schließen";
    xBtn.onclick = onClose;
    return xBtn;
  }

  function createOverlay() {
    const overlay = document.createElement("div");
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:100000;";
    overlay.addEventListener("keydown", e => e.stopPropagation());
    return overlay;
  }

  /* ================= EDIT MODAL ================= */

  function openEditModal(type, defaultText) {
    ensureUsername(username => {
      const overlay = createOverlay();

      const box = document.createElement("div");
      box.style = "position:relative; background:white; padding:20px; border-radius:8px; min-width:280px; text-align:center; box-shadow:0 0 12px rgba(0,0,0,0.35);";

      const closeOverlay = () => document.body.removeChild(overlay);
      box.appendChild(createCloseButton(closeOverlay));

      const title = document.createElement("h3");
      title.innerText = `Buchung: ${type} (${username})`;
      title.style.marginBottom = "15px";

      const inputTime = document.createElement("input");
      inputTime.type = "text";
      inputTime.value = "0,5";
      inputTime.style = "width:120px; padding:6px; margin:5px;";

      const inputText = document.createElement("input");
      inputText.type = "text";
      inputText.value = defaultText;
      inputText.style = "width:200px; padding:6px; margin:5px;";

      const dateInfo = document.createElement("p");
      dateInfo.innerText = `Datum: ${getCurrentDate()}`;
      dateInfo.style = "font-size:11px; color:#888; margin:6px 0 0 0;";

      const okBtn = document.createElement("button");
      okBtn.innerText = "OK";
      okBtn.style = "padding:6px 12px; margin-top:12px; cursor:pointer;";
      okBtn.onclick = () => {
        closeOverlay();
        fillFields(type, inputTime.value, inputText.value);
      };

      box.append(
        title,
        "Zeit (Komma):", document.createElement("br"),
        inputTime, document.createElement("br"),
        "Beschreibung:", document.createElement("br"),
        inputText, document.createElement("br"),
        dateInfo,
        okBtn
      );

      overlay.appendChild(box);
      document.body.appendChild(overlay);
    });
  }

  /* ================= MAIN MODAL ================= */

  function openMainModal() {
    ensureUsername(() => {
      const overlay = createOverlay();
      overlay.style.zIndex = "99999";

      const box = document.createElement("div");
      box.style = "position:relative; background:white; padding:20px 20px 16px; border-radius:8px; text-align:center; min-width:250px; box-shadow:0 0 12px rgba(0,0,0,0.35);";

      const closeOverlay = () => document.body.removeChild(overlay);
      box.appendChild(createCloseButton(closeOverlay));

      const title = document.createElement("p");
      title.innerText = "Buchungstyp wählen:";
      title.style = "margin: 8px 0 12px; font-weight:bold;";

      const userInfo = document.createElement("p");
      const currentUser = getUsername();
      userInfo.style = "font-size:11px; color:#888; margin:0 0 10px 0;";
      userInfo.innerHTML = `Eingeloggt als: <strong>${currentUser}</strong> `;

      const changeLink = document.createElement("a");
      changeLink.href = "#";
      changeLink.innerText = "ändern";
      changeLink.style = "font-size:11px; color:#ff9900;";
      changeLink.onclick = (e) => {
        e.preventDefault();
        closeOverlay();
        openUserSwitchModal(null, () => openMainModal());
      };

      userInfo.appendChild(changeLink);

      const createBtn = (label, type, text) => {
        const b = document.createElement("button");
        b.innerText = label;
        b.style = "margin:5px; padding:6px 12px; cursor:pointer;";
        b.onclick = () => { closeOverlay(); openEditModal(type, text); };
        return b;
      };

      box.append(
        title,
        userInfo,
        createBtn("Start-MET", "MET", "Startmeeting"),
        createBtn("RSP-MET", "MET", "RSP & RME MEETING"),
        createBtn("ADM", "ADM", "MAILS"),
        createBtn("T", "T", "Learn ATOZ")
      );

      overlay.appendChild(box);
      document.body.appendChild(overlay);
    });
  }

  /* ================= UI BUTTON INJEKTION ================= */

  function injectUI() {
    if (!document.getElementById("kanataza-book-btn")) {
      const target = document.querySelector('input[name="workorderdesc"]');
      if (target) {
        const btn = document.createElement("button");
        btn.id = "kanataza-book-btn";
        btn.type = "button";
        btn.innerText = "Book LABOR";
        btn.style = "margin-left:10px; padding:6px 12px; cursor:pointer;";
        btn.onclick = openMainModal;
        target.insertAdjacentElement("afterend", btn);
      }
    }
  }

  const observer = new MutationObserver(injectUI);
  observer.observe(document.body, { childList: true, subtree: true });
  injectUI();

})();
