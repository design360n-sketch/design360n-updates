/* Design360n Workstation v17.7 — LICENSE KEY + 1-PC HARDWARE DEVICE LOCK.
 * Mirrors the proven gate in the Design360n Photoshop extension (js/main.js v2.75).
 * Validates the key against the same Google Apps Script license server (/exec).
 * NO demo key, NO setup-mode bypass — the server URL below is the live one.
 * Loaded BEFORE app.js; locks the panel behind #authGate until a valid key is stored. */
(function () {
  var PANEL_VERSION = "17.7";
  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- LICENSE KEY + 1-PC HARDWARE DEVICE LOCK ---------------- */
  var LICENSE_SERVER_URL = "https://script.google.com/macros/s/AKfycbx5HH2LS6FDoHpnKoIM9tDYfNqQ1CxXCe2iFO1MColMUSpacgwnzdO95mwoyLHFovtvvw/exec";
  var LICENSE_OFFLINE_GRACE_DAYS = 7;
  var LIC_STORE_KEY = "design360n_workstation_license";

  function getHardwareDeviceId() {
    try {
      var osM = require("os");
      var cpM = require("child_process");
      var crM = require("crypto");
      var rawId = osM.hostname() + "|" + (osM.userInfo ? osM.userInfo().username : "user") + "|" + osM.platform() + "|" + osM.arch();
      if (process.platform === "win32") {
        try {
          var out = String(cpM.execSync("wmic csproduct get uuid", { timeout: 2500, stdio: ["ignore", "pipe", "ignore"] }) || "");
          var lines = out.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(function (x) { return x && x.toUpperCase() !== "UUID"; });
          if (lines.length > 0 && lines[0].length > 8) rawId = lines[0] + "|" + osM.hostname();
        } catch (eW) {}
      }
      return "PC-" + crM.createHash("sha256").update(rawId).digest("hex").slice(0, 14).toUpperCase();
    } catch (e) {
      var fb = "";
      try { fb = localStorage.getItem("design360n_workstation_dev_fb") || ""; } catch (e2) {}
      if (!fb) {
        fb = "PC-" + Math.random().toString(36).slice(2, 10).toUpperCase() + Date.now().toString(36).slice(-4).toUpperCase();
        try { localStorage.setItem("design360n_workstation_dev_fb", fb); } catch (e3) {}
      }
      return fb;
    }
  }

  var DEVICE_ID = getHardwareDeviceId();
  var authGate = $("authGate");
  var licKeyIn = $("licKeyInput");
  var licBtn = $("licActivateBtn");
  var licMsg = $("licMsg");
  var licChip = $("licChip");
  var licChipText = $("licChipText");
  if ($("licDevId")) $("licDevId").textContent = DEVICE_ID;

  function setLicMsg(txt, cls) {
    if (!licMsg) return;
    licMsg.textContent = txt || "";
    licMsg.className = "auth-msg" + (cls ? (" " + cls) : "");
  }
  function formatShortExpiry(rawExp) {
    if (!rawExp || String(rawExp).toUpperCase() === "LIFETIME") return "";
    var s = String(rawExp).trim();
    var d = new Date(s);
    if (isNaN(d.getTime())) {
      // Fallback: strip timezone/parenthetical (e.g. "SUN DEC 20 2026 06:00:00 GMT+0600 (...)")
      var m = s.match(/([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
      if (m) return m[2] + " " + m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() + " " + m[3].slice(-2);
      return s.slice(0, 12);
    }
    var mos = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return d.getDate() + " " + mos[d.getMonth()] + " " + String(d.getFullYear()).slice(-2);
  }
  function unlockExtension(licObj) {
    if (authGate) authGate.classList.add("unlocked");
    var shortExp = (licObj && licObj.expires) ? formatShortExpiry(licObj.expires) : "";
    if (licChipText) licChipText.textContent = shortExp ? ("Pro • " + shortExp) : "Pro • Active";
    if (licChip && licObj && licObj.expires) licChip.title = "License expires: " + licObj.expires + " (click to switch key)";
  }
  function lockExtension(reason) {
    if (authGate) authGate.classList.remove("unlocked");
    if (licChipText) licChipText.textContent = "Locked";
    if (reason) setLicMsg(reason, "err");
  }

  function verifyKeyOnline(key, cb) {
    var cleanKey = String(key || "").trim().toUpperCase();
    if (!cleanKey) { cb({ ok: false, reason: "Please enter your License Key." }); return; }
    var url = LICENSE_SERVER_URL + "?key=" + encodeURIComponent(cleanKey) + "&device=" + encodeURIComponent(DEVICE_ID);
    fetch(url, { method: "GET" })
      .then(function (r) { return r.json(); })
      .then(function (data) { cb(data || { ok: false, reason: "Invalid server response." }); })
      .catch(function (err) { cb({ ok: false, offline: true, reason: "Network error: " + err.message }); });
  }

  function initLicenseGate() {
    if (!authGate) return;
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(LIC_STORE_KEY) || "null"); } catch (e) {}
    if (saved && saved.key && saved.device === DEVICE_ID) {
      var ageDays = (Date.now() - (saved.verifiedAt || 0)) / (1000 * 60 * 60 * 24);
      if (ageDays <= LICENSE_OFFLINE_GRACE_DAYS) {
        unlockExtension(saved);
        verifyKeyOnline(saved.key, function (res) {
          if (res && res.ok) {
            saved.verifiedAt = Date.now();
            saved.expires = res.expires || saved.expires;
            try { localStorage.setItem(LIC_STORE_KEY, JSON.stringify(saved)); } catch (eS) {}
            unlockExtension(saved);
          } else if (res && !res.offline) {
            try { localStorage.removeItem(LIC_STORE_KEY); } catch (eR) {}
            lockExtension(res.reason || "License revoked or expired.");
          }
        });
        return;
      }
    }
    lockExtension("");
  }

  if (licBtn) {
    licBtn.addEventListener("click", function () {
      var k = licKeyIn ? licKeyIn.value.trim().toUpperCase() : "";
      if (!k) { setLicMsg("Enter your License Key first.", "err"); return; }
      setLicMsg("Verifying license key…");
      verifyKeyOnline(k, function (res) {
        if (res && res.ok) {
          var rec = { key: k, device: DEVICE_ID, customer: res.customer || "Pro User", expires: res.expires || "LIFETIME", verifiedAt: Date.now() };
          try { localStorage.setItem(LIC_STORE_KEY, JSON.stringify(rec)); } catch (eS) {}
          setLicMsg("License Activated! Welcome " + rec.customer + ".", "ok");
          setTimeout(function () { unlockExtension(rec); }, 350);
        } else {
          setLicMsg((res && res.reason) || "Activation failed.", "err");
        }
      });
    });
  }
  if (licKeyIn) {
    licKeyIn.addEventListener("keydown", function (ev) { if (ev.key === "Enter" && licBtn) licBtn.click(); });
  }
  if (licChip) {
    licChip.addEventListener("click", function () {
      if (authGate && !authGate.classList.contains("unlocked")) return;
      if (confirm("Deactivate / switch License Key on this PC?")) {
        try { localStorage.removeItem(LIC_STORE_KEY); } catch (e) {}
        lockExtension("Logged out. Enter a valid License Key to continue.");
      }
    });
  }
  initLicenseGate();
})();
