/* Design360n Workstation v17.7.1 — AUTO-UPDATE from GitHub.
 * Same mechanism as the Photoshop panel (js/main.js v2.75): when a newer
 * version is published in version-workstation.json, a banner appears and
 * "Update Now" downloads the listed files from the GitHub updates repo
 * and overwrites them in the extension folder (Node fs). The license key
 * gate still protects use — without a valid key the panel stays locked.
 * Checks on load, then every 5 minutes. Silent when offline. */
(function () {
  var PANEL_VERSION = "17.7.7";
  var UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/design360n-sketch/design360n-updates/main/version-workstation.json";
  var pendingUpdate = null;
  var $ = function (id) { return document.getElementById(id); };
  function cmpVer(a, b) {
    var pa = String(a || "0").split("."), pb = String(b || "0").split(".");
    for (var i = 0; i < Math.max(pa.length, pb.length); i++) {
      var d = (parseInt(pa[i] || "0", 10) || 0) - (parseInt(pb[i] || "0", 10) || 0);
      if (d !== 0) return d;
    }
    return 0;
  }
  function extDir() {
    try {
      var p = decodeURIComponent(window.location.pathname || "");
      if (p.charAt(0) === "/" && /^[A-Za-z]:\//.test(p.slice(1))) p = p.slice(1);
      // Panel lives in client/index.html — the extension root is one level up.
      return p.replace(/\/client\/index\.html$/i, "");
    } catch (e) { return ""; }
  }
  function setNotes(t) { if ($("updNotes")) $("updNotes").textContent = t; }
  function showUpdateBanner(m) {
    pendingUpdate = m;
    if ($("updVer")) $("updVer").textContent = "v" + m.version;
    setNotes(m.notes ? (" \u2014  " + m.notes) : "");
    var b = $("updBanner");
    if (b) b.style.display = "flex";
  }
  function hideUpdateBanner() {
    pendingUpdate = null;
    var b = $("updBanner");
    if (b) b.style.display = "none";
  }
  var hostStatusDefault = "Illustrator CEP";
  function setHostStatus(t) { var hs = $("hostStatus"); if (hs) hs.textContent = t; }
  function restoreHostStatus() { setTimeout(function () { setHostStatus(hostStatusDefault); }, 4000); }
  function checkForUpdates(manual) {
    if (!UPDATE_MANIFEST_URL) return;
    // Cache-buster: GitHub raw caches ~5 min — a fresh timestamp makes every check see a just-published version at once.
    var url = UPDATE_MANIFEST_URL + (UPDATE_MANIFEST_URL.indexOf("?") === -1 ? "?" : "&") + "t=" + Date.now();
    if (manual) setHostStatus("Checking for updates\u2026");
    fetch(url, { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (m) {
        if (!m || !m.version || !m.files) { if (manual) { setHostStatus("Update check failed"); restoreHostStatus(); } return; }
        if (cmpVer(m.version, PANEL_VERSION) > 0) { showUpdateBanner(m); if (manual) setHostStatus("Update available: v" + m.version); }
        else { hideUpdateBanner(); if (manual) { setHostStatus("You are up to date (v" + PANEL_VERSION + ")"); restoreHostStatus(); } }
      })
      .catch(function () { if (manual) { setHostStatus("Update check failed"); restoreHostStatus(); } /* auto: stay silent */ });
  }
  function applyUpdate() {
    var m = pendingUpdate;
    if (!m) return;
    var btn = $("updNowBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Updating\u2026"; }
    setNotes(" \u2014  Downloading update v" + m.version + "\u2026");
    var base = String(m.baseUrl || "");
    if (base && base.charAt(base.length - 1) !== "/") base += "/";
    var files = m.files || [];
    var chain = Promise.resolve();
    var touchedJsx = false;
    files.forEach(function (rel) {
      chain = chain.then(function () {
        return fetch(base + rel, { cache: "no-store" }).then(function (r) {
          if (!r.ok) throw new Error("Download failed: " + rel + " (" + r.status + ")");
          return r.text();
        }).then(function (txt) {
          var fsM = null, pathM = null;
          try { fsM = require("fs"); pathM = require("path"); } catch (eR) {}
          if (!fsM || !pathM) throw new Error("File write is not available in this panel.");
          var dir = extDir();
          if (!dir) throw new Error("Extension folder not found.");
          var full = pathM.join(dir, rel);
          fsM.mkdirSync(pathM.dirname(full), { recursive: true });
          fsM.writeFileSync(full, txt, "utf8");
          if (/\.jsx$/i.test(rel)) touchedJsx = true;
        });
      });
    });
    chain.then(function () {
      hideUpdateBanner();
      if (touchedJsx) {
        // New engine (JSX) only loads after an Illustrator restart — show it in the header status.
        var hs = $("hostStatus");
        if (hs) hs.textContent = "Update v" + m.version + " installed \u2014 restart Illustrator";
        setNotes("");
      } else {
        setTimeout(function () { window.location.reload(); }, 900);
      }
    }).catch(function (err) {
      if (btn) { btn.disabled = false; btn.textContent = "Update Now"; }
      setNotes(" \u2014  Update failed: " + err.message);
    });
  }
  if ($("updNowBtn")) $("updNowBtn").addEventListener("click", applyUpdate);
  if ($("updDismissBtn")) $("updDismissBtn").addEventListener("click", hideUpdateBanner);
  if ($("updCheckBtn")) $("updCheckBtn").addEventListener("click", function () { try { checkForUpdates(true); } catch (e) {} });
  try { checkForUpdates(); } catch (e) {}
  setInterval(function () { try { checkForUpdates(); } catch (e2) {} }, 60000);
})();
