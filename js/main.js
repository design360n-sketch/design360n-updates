/* Design360n v2.80 — CEP panel wiring. Full Photoshop control via ExtendScript (evalScript). */
(function () {
  var PANEL_VERSION = "2.80";
  var cs = new CSInterface();
  var $ = function (id) { return document.getElementById(id); };

  /* ---------------- LICENSE KEY + 1-PC HARDWARE DEVICE LOCK (v2.75) ---------------- */
  /* STEP: Paste your deployed Google Apps Script Web App URL below (ends with /exec) */
  var LICENSE_SERVER_URL = "https://script.google.com/macros/s/AKfycbx5HH2LS6FDoHpnKoIM9tDYfNqQ1CxXCe2iFO1MColMUSpacgwnzdO95mwoyLHFovtvvw/exec";
  var LICENSE_OFFLINE_GRACE_DAYS = 7;
  var LIC_STORE_KEY = "design360n_license_v273";

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
      try { fb = localStorage.getItem("design360n_dev_fb") || ""; } catch (e2) {}
      if (!fb) {
        fb = "PC-" + Math.random().toString(36).slice(2, 10).toUpperCase() + Date.now().toString(36).slice(-4).toUpperCase();
        try { localStorage.setItem("design360n_dev_fb", fb); } catch (e3) {}
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

  var isSetupMode = (!LICENSE_SERVER_URL || LICENSE_SERVER_URL.indexOf("PASTE_YOUR_") === 0);
  if (isSetupMode && $("licDemoHint")) $("licDemoHint").style.display = "block";

  function setLicMsg(txt, cls) {
    if (!licMsg) return;
    licMsg.textContent = txt || "";
    licMsg.className = "auth-msg" + (cls ? (" " + cls) : "");
  }
  function unlockExtension(licObj) {
    if (authGate) authGate.classList.add("unlocked");
    if (licChipText) licChipText.textContent = (licObj && licObj.expires && licObj.expires !== "LIFETIME") ? ("Pro • " + licObj.expires) : "Pro • Active";
  }
  function lockExtension(reason) {
    if (authGate) authGate.classList.remove("unlocked");
    if (licChipText) licChipText.textContent = "Locked";
    if (reason) setLicMsg(reason, "err");
  }

  function verifyKeyOnline(key, cb) {
    var cleanKey = String(key || "").trim().toUpperCase();
    if (!cleanKey) { cb({ ok: false, reason: "Please enter your License Key." }); return; }
    if (isSetupMode) {
      if (cleanKey === "D360-DEMO-TEST") {
        cb({ ok: true, customer: "Owner Preview", expires: "LIFETIME" });
      } else {
        cb({ ok: false, reason: "Setup mode: Paste your Google Script URL in js/main.js (or use D360-DEMO-TEST)." });
      }
      return;
    }
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
        if (!isSetupMode) {
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
        }
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

  /* ---------------- FREE AUTO-UPDATE via GitHub (v2.75) ---------------- */
  /* STEP: Paste your GitHub version.json Raw URL below (ends with /version.json).
     While the placeholder stays, auto-update is OFF and nothing is fetched. */
  var UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/design360n-sketch/design360n-updates/main/version.json";
  var pendingUpdate = null;

  function isUpdateConfigured() {
    return !!(UPDATE_MANIFEST_URL && UPDATE_MANIFEST_URL.indexOf("PASTE_YOUR_") !== 0 && UPDATE_MANIFEST_URL.indexOf("version.json") !== -1);
  }
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
      return p.replace(/\/index\.html$/i, "");
    } catch (e) { return ""; }
  }
  function showUpdateBanner(manifest) {
    pendingUpdate = manifest;
    if ($("updVer")) $("updVer").textContent = "v" + manifest.version;
    if ($("updNotes")) $("updNotes").textContent = manifest.notes ? (" — " + manifest.notes) : "";
    if ($("updBanner")) $("updBanner").style.display = "flex";
    setStatus("Update available: v" + manifest.version + " — click Update Now.", "ok");
  }
  function hideUpdateBanner() {
    pendingUpdate = null;
    if ($("updBanner")) $("updBanner").style.display = "none";
  }
  function checkForUpdates(manual) {
    if (!isUpdateConfigured()) {
      if (manual) setStatus("Auto-update not set up yet — paste the GitHub version.json URL in js/main.js.", "err");
      return;
    }
    fetch(UPDATE_MANIFEST_URL, { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (m) {
        if (!m || !m.version || !m.files) { if (manual) setStatus("Update check failed: bad version file.", "err"); return; }
        if (cmpVer(m.version, PANEL_VERSION) > 0) showUpdateBanner(m);
        else {
          hideUpdateBanner();
          if (manual) setStatus("You are on the latest version (v" + PANEL_VERSION + ").", "ok");
        }
      })
      .catch(function (err) {
        if (manual) setStatus("Update check failed: " + err.message, "err");
      });
  }
  function applyUpdate() {
    var m = pendingUpdate;
    if (!m) return;
    var btn = $("updNowBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Updating…"; }
    setStatus("Downloading update v" + m.version + "…");
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
        setStatus("Update v" + m.version + " installed — restart Photoshop so the new engine (JSX) loads.", "ok");
      } else {
        setStatus("Update v" + m.version + " installed — reloading panel…", "ok");
        setTimeout(function () { window.location.reload(); }, 900);
      }
    }).catch(function (err) {
      if (btn) { btn.disabled = false; btn.textContent = "Update Now"; }
      setStatus("Update failed: " + err.message, "err");
    });
  }
  if ($("updNowBtn")) $("updNowBtn").addEventListener("click", applyUpdate);
  if ($("updDismissBtn")) $("updDismissBtn").addEventListener("click", hideUpdateBanner);
  if ($("updCheckBtn")) $("updCheckBtn").addEventListener("click", function () { checkForUpdates(true); });
  /* Auto-check instantly when the panel loads, then re-check every 5 minutes
     while the panel stays open — no reload needed to see a new version. */
  try { checkForUpdates(false); } catch (eU) {}
  setInterval(function () { try { checkForUpdates(false); } catch (eU2) {} }, 300000);

  function setStatus(msg, state) {
    var el = $("status");
    if (!el) return;
    el.textContent = msg;
    el.className = "status" + (state === "err" ? " err" : state === "ok" ? " ok" : "");
  }

  function run(script, fallbackDoneMsg) {
    setStatus("Kaj hocche…");
    cs.evalScript(script, function (res) {
      var s = (res == null) ? "" : String(res);
      if (!s || s === "undefined" || s === "null") {
        setStatus("Error: No response from Photoshop engine (check if script loaded).", "err");
        return;
      }
      if (s === "EvalScript error." || s.indexOf("Error:") === 0 || s.indexOf("Error ") === 0) {
        setStatus(s, "err");
        return;
      }
      if (s.indexOf("OK:") === 0) {
        setStatus(s.substring(3).trim() || fallbackDoneMsg || "Done.", "ok");
        return;
      }
      setStatus(s || fallbackDoneMsg || "Done.", "ok");
    });
  }

  function rng(id, outId) {
    var el = $(id);
    if (!el) return;
    el.addEventListener("input", function () { $(outId).textContent = el.value; });
  }
  function setRange(id, outId, v) {
    var el = $(id);
    if (!el) return;
    el.value = v;
    $(outId).textContent = v;
  }

  /* Exact Glow preset values */
  var LOOKS = [
    { n: "Glow Up",       d: "Ujjol, Oniric-style glow — text, icon, edge ar surjo-r jonno.", thr: 50, core: 200, iter: 11, rad: 1000, exp: -0.5, gamma: 1.2, sang: 0, slen: 900,  sint: 60, adist: 20, hue: 0,   sat: 100, blend: "screen", streak: false, rays: false, aber: false },
    { n: "Soft Bloom",      d: "Norom, halka bloom — portrait ar product-er jonno.",               thr: 50, core: 40,  iter: 8,  rad: 500,  exp: -2.0, gamma: 1.2, sang: 0, slen: 900,  sint: 60, adist: 20, hue: 0,   sat: 100, blend: "screen", streak: false, rays: false, aber: false },
    { n: "Cinematic",       d: "Anamorphic streak soho cinema-r moto glow.",                       thr: 62, core: 50,  iter: 8,  rad: 700,  exp: -0.5, gamma: 1.1, sang: 0, slen: 1400, sint: 35, adist: 20, hue: 8,   sat: 110, blend: "screen", streak: true,  rays: false, aber: false },
    { n: "Neon",            d: "Tej neon glow — text ar shape jolbe.",                             thr: 35, core: 140, iter: 6,  rad: 220,  exp: -0.9, gamma: 0.8, sang: 0, slen: 900,  sint: 60, adist: 20, hue: 0,   sat: 100, blend: "add",    streak: false, rays: false, aber: false },
    { n: "Warm Sun",        d: "Gorom roder moto glow + light rays.",                              thr: 55, core: 60,  iter: 9,  rad: 900,  exp: -1.3, gamma: 1.3, sang: 0, slen: 900,  sint: 60, adist: 20, hue: 32,  sat: 90,  blend: "screen", streak: false, rays: true,  aber: false },
    { n: "Cold Moon",       d: "Thanda nilche chaand-er alo.",                                     thr: 60, core: 50,  iter: 8,  rad: 600,  exp: -0.5, gamma: 1.2, sang: 0, slen: 900,  sint: 60, adist: 20, hue: 180, sat: 70,  blend: "screen", streak: false, rays: false, aber: false },
    { n: "Anamorphic Blue", d: "Lomba nil streak — anamorphic cinema look.",                       thr: 70, core: 70,  iter: 7,  rad: 350,  exp: -1.4, gamma: 1.2, sang: 0, slen: 2400, sint: 90, adist: 20, hue: 180, sat: 120, blend: "add",    streak: true,  rays: false, aber: false },
    { n: "Dreamy",          d: "Shopner moto norom glow + halka rong-er vangon.",                  thr: 40, core: 30,  iter: 9,  rad: 1200, exp: -1.9, gamma: 1.6, sang: 0, slen: 900,  sint: 60, adist: 30, hue: -12, sat: 85,  blend: "screen", streak: false, rays: false, aber: true  },
    { n: "Subtle Pop",      d: "Halka glow — chobi-ta ektu fute uthbe.",                           thr: 70, core: 80,  iter: 6,  rad: 160,  exp: -0.5, gamma: 1.2, sang: 0, slen: 900,  sint: 60, adist: 20, hue: 0,   sat: 100, blend: "screen", streak: false, rays: false, aber: false }
  ];

  var SIZES = [
    ["Instagram Post (Square) 1080 x 1080", 0], ["Instagram Portrait (Feed) 1080 x 1350", 1],
    ["Instagram Tall Portrait (Grid) 1080 x 1440", 2], ["Instagram Story / Reel 1080 x 1920", 3],
    ["Facebook Feed Photo 1080 x 1350", 4], ["Facebook Post (Link) 1200 x 630", 5],
    ["Facebook Story / Reel 1080 x 1920", 6], ["Facebook Cover 851 x 315", 7],
    ["YouTube Thumbnail 1280 x 720", 8], ["YouTube Shorts 1080 x 1920", 9],
    ["YouTube Banner 2560 x 1440", 10], ["TikTok Video 1080 x 1920", 11],
    ["LinkedIn Post 1200 x 627", 12], ["LinkedIn Banner 1584 x 396", 13],
    ["X Post 1600 x 900", 14], ["X Header 1500 x 500", 15],
    ["Pinterest Pin 1000 x 1500", 16]
  ];

  /* Navigation */
  function showHome() {
    $("homeView").style.display = "block";
    var views = document.querySelectorAll(".toolview");
    for (var i = 0; i < views.length; i++) views[i].style.display = "none";
  }
  function showTool(name) {
    $("homeView").style.display = "none";
    var views = document.querySelectorAll(".toolview");
    for (var i = 0; i < views.length; i++) views[i].style.display = "none";
    $("view-" + name).style.display = "block";
    if (name === "styles" && psLiveStyles.length === 0) syncPSStylesFromHost();
    if (name === "animate") loadPosterBreakdown();
  }
  var cards = document.querySelectorAll(".card");
  for (var c = 0; c < cards.length; c++) {
    cards[c].addEventListener("click", function () { showTool(this.getAttribute("data-open")); });
  }
  var backs = document.querySelectorAll("[data-back]");
  for (var b = 0; b < backs.length; b++) backs[b].addEventListener("click", showHome);

  /* Glow tabs */
  var gTabBtns = document.querySelectorAll("#glowTabs .pill");
  for (var gt = 0; gt < gTabBtns.length; gt++) {
    gTabBtns[gt].addEventListener("click", function () {
      var target = this.getAttribute("data-gtab");
      for (var k = 0; k < gTabBtns.length; k++) gTabBtns[k].classList.remove("active");
      this.classList.add("active");
      var panes = document.querySelectorAll(".glow-tabpane");
      for (var p = 0; p < panes.length; p++) panes[p].classList.remove("active");
      var pane = $("gtab-" + target);
      if (pane) pane.classList.add("active");
    });
  }

  /* Glow controls */
  var presetSel = $("glowPreset"), grid = $("looksGrid");
  LOOKS.forEach(function (l, i) {
    var o = document.createElement("option"); o.value = i; o.textContent = l.n; presetSel.appendChild(o);
    var btn = document.createElement("button"); btn.textContent = "✦ " + l.n;
    btn.addEventListener("click", function () { presetSel.value = i; syncLook(); });
    grid.appendChild(btn);
  });
  [
    "grad|v-grad", "gthr|v-gthr", "gcore|v-gcore", "giter|v-giter", "ggamma|v-ggamma",
    "gexp|v-gexp", "gsang|v-gsang", "gslen|v-gslen", "gsint|v-gsint", "gadist|v-gadist",
    "gop|v-gop", "ghue|v-ghue", "gsat|v-gsat"
  ].forEach(function (p) { var a = p.split("|"); rng(a[0], a[1]); });

  function syncLook() {
    var i = +presetSel.value, l = LOOKS[i];
    $("presetDesc").textContent = l.d;
    var btns = grid.querySelectorAll("button");
    for (var k = 0; k < btns.length; k++) btns[k].classList.toggle("sel", k === i);
    setRange("grad", "v-grad", l.rad);
    setRange("gthr", "v-gthr", l.thr);
    setRange("gcore", "v-gcore", l.core);
    setRange("giter", "v-giter", l.iter);
    setRange("ggamma", "v-ggamma", l.gamma);
    setRange("gexp", "v-gexp", l.exp);
    setRange("gsang", "v-gsang", l.sang);
    setRange("gslen", "v-gslen", l.slen);
    setRange("gsint", "v-gsint", l.sint);
    setRange("gadist", "v-gadist", l.adist);
    setRange("gop", "v-gop", 100);
    $("gblend").value = l.blend;
    setRange("ghue", "v-ghue", l.hue);
    setRange("gsat", "v-gsat", l.sat);
    $("gstreak").checked = l.streak;
    $("grays").checked = l.rays;
    $("gaber").checked = l.aber;
  }
  presetSel.addEventListener("change", syncLook); syncLook();

  $("applyGlow").addEventListener("click", function () {
    var o = "{rad:" + $("grad").value +
      ", thr:" + $("gthr").value +
      ", core:" + $("gcore").value +
      ", iter:" + $("giter").value +
      ", gamma:" + $("ggamma").value +
      ", exp:" + $("gexp").value +
      ", sang:" + $("gsang").value +
      ", slen:" + $("gslen").value +
      ", sint:" + $("gsint").value +
      ", adist:" + $("gadist").value +
      ", op:" + $("gop").value +
      ", blend:'" + $("gblend").value + "'" +
      ", hue:" + $("ghue").value +
      ", sat:" + $("gsat").value +
      ", streak:" + $("gstreak").checked +
      ", rays:" + $("grays").checked +
      ", aber:" + $("gaber").checked +
      ", addMask:" + $("gmask").checked + "}";
    run("auraGlow(" + presetSel.value + ", " + o + ")", "Glow Up 1 ready.");
  });

  /* Social & Print sizes */
  var sizeSel = $("sizePreset");
  SIZES.forEach(function (s) {
    var o = document.createElement("option"); o.value = s[1]; o.textContent = s[0]; sizeSel.appendChild(o);
  });
  $("newDoc").addEventListener("click", function () {
    run("auraSize(" + sizeSel.value + ", 'new', " + $("safeGuides").checked + ")", "Notun document khullo.");
  });
  $("resizeDoc").addEventListener("click", function () {
    run("auraSize(" + sizeSel.value + ", 'resize', " + $("safeGuides").checked + ")", "Document resize holo.");
  });

  var PRINT_SIZES = [
    "A4 — 210 x 297 mm (2480 x 3508 @300dpi)", "A3 — 297 x 420 mm (3508 x 4961 @300dpi)",
    "A5 — 148 x 210 mm (1748 x 2480 @300dpi)", "Letter — 8.5 x 11 inch (2550 x 3300 @300dpi)",
    "Legal — 8.5 x 14 inch (2550 x 4200 @300dpi)", "Tabloid — 11 x 17 inch (3300 x 5100 @300dpi)",
    "Photo 4x6 inch (1200 x 1800 @300dpi)", "Photo 5x7 inch (1500 x 2100 @300dpi)",
    "Photo 8x10 inch (2400 x 3000 @300dpi)", "Postcard 6x4 inch (1800 x 1200 @300dpi)",
    "Business Card — 3.5 x 2 inch (1050 x 600 @300dpi)", "Flyer — A5 Landscape 210 x 148 mm (2480 x 1748 @300dpi)"
  ];
  var printSel = $("printPreset");
  PRINT_SIZES.forEach(function (s, i) {
    var o = document.createElement("option"); o.value = i; o.textContent = s; printSel.appendChild(o);
  });
  $("printNew").addEventListener("click", function () {
    run("auraPrint(" + printSel.value + ", 'new', " + $("safeGuides").checked + ")", "Notun print document khullo (300 DPI).");
  });
  $("printResize").addEventListener("click", function () {
    run("auraPrint(" + printSel.value + ", 'resize', " + $("safeGuides").checked + ")", "Print size-e resize holo (300 DPI).");
  });

  /* BG remover */
  var tol = $("tolerance");
  tol.addEventListener("input", function () { $("v-tolerance").textContent = tol.value; });
  rng("cutfeather", "v-cutfeather");
  var bgAuto = $("bgAutoDetect"), bgCol = $("bgColor"), bgHex = $("bgHex");
  function syncBgHex() { $("v-bghex").textContent = bgHex.value.toUpperCase(); }
  bgCol.addEventListener("input", function () { bgAuto.checked = false; bgHex.value = bgCol.value.toUpperCase(); syncBgHex(); });
  bgHex.addEventListener("input", function () { bgAuto.checked = false; syncBgHex(); if (/^#[0-9a-fA-F]{6}$/.test(bgHex.value)) bgCol.value = bgHex.value; });
  var swatches = document.querySelectorAll("#bgSwatches .swatch");
  for (var swi = 0; swi < swatches.length; swi++) {
    swatches[swi].addEventListener("click", function () {
      var hx = this.getAttribute("data-hex");
      bgAuto.checked = false; bgHex.value = hx; bgCol.value = hx; syncBgHex();
    });
  }
  function bgHexVal() {
    if (bgAuto && bgAuto.checked) return "null";
    var h = bgHex.value.replace("#", "");
    return (/^[0-9a-fA-F]{6}$/.test(h)) ? ("'" + h + "'") : "null";
  }
  $("aiCut").addEventListener("click", function () {
    run("auraCutAI(" + $("cutfeather").value + ")", "AI Auto Cut complete.");
  });
  $("autoCut").addEventListener("click", function () {
    run("auraCut(" + tol.value + ", false, " + $("cutfeather").value + ", " + bgHexVal() + ", 'normal', " + ($("bgContiguous") ? $("bgContiguous").checked : true) + ")", "Background remove sesh.");
  });
  $("shadowCut").addEventListener("click", function () {
    run("auraCut(" + tol.value + ", true, " + $("cutfeather").value + ", " + bgHexVal() + ", '" + $("shadowStrength").value + "', " + ($("bgContiguous") ? $("bgContiguous").checked : true) + ")", "Shadow Cut sesh.");
  });

  /* Glass */
  var frost = $("frost");
  frost.addEventListener("input", function () { $("v-frost").textContent = frost.value; });
  ["glassstroke|v-glassstroke", "glassstrokeop|v-glassstrokeop", "glassrefr|v-glassrefr", "glassdepth|v-glassdepth", "glassdisp|v-glassdisp", "glasslight|v-glasslight", "glassangle|v-glassangle", "glasstint|v-glasstint"].forEach(function (p) { var a = p.split("|"); rng(a[0], a[1]); });

  var GLASS_LOOKS = {
    liquid:  { frost: 25, refr: 80, depth: 60, disp: 45, light: 80, angle: 144, tint: 7,  tintCol: "#FFFFFF", stroke: 3, strokeOp: 90, strokeCol: "#FFFFFF", mode: "solid" },
    frosted: { frost: 70, refr: 25, depth: 40, disp: 0,  light: 55, angle: 144, tint: 7,  tintCol: "#FFFFFF", stroke: 3, strokeOp: 90, strokeCol: "#FFFFFF", mode: "solid" },
    clear:   { frost: 0,  refr: 70, depth: 70, disp: 25, light: 70, angle: 144, tint: 7,  tintCol: "#FFFFFF", stroke: 3, strokeOp: 90, strokeCol: "#FFFFFF", mode: "solid" },
    figma:   { frost: 25, refr: 80, depth: 60, disp: 45, light: 80, angle: 144, tint: 7,  tintCol: "#FFFFFF", stroke: 1, strokeOp: 60, strokeCol: "#FFFFFF", mode: "solid" },
    vision:  { frost: 42, refr: 55, depth: 50, disp: 20, light: 90, angle: 135, tint: 10, tintCol: "#FFFFFF", stroke: 2, strokeOp: 75, strokeCol: "#FFFFFF", mode: "follow" },
    prism:   { frost: 5,  refr: 95, depth: 85, disp: 95, light: 95, angle: 144, tint: 5,  tintCol: "#E0F2FE", stroke: 2, strokeOp: 85, strokeCol: "#E0F2FE", mode: "solid" },
    smoke:   { frost: 35, refr: 45, depth: 75, disp: 15, light: 55, angle: 144, tint: 28, tintCol: "#0F172A", stroke: 2, strokeOp: 45, strokeCol: "#94A3B8", mode: "solid" },
    ice:     { frost: 48, refr: 60, depth: 55, disp: 35, light: 85, angle: 130, tint: 14, tintCol: "#BAE6FD", stroke: 2, strokeOp: 80, strokeCol: "#E0F2FE", mode: "solid" },
    rose:    { frost: 38, refr: 50, depth: 50, disp: 30, light: 80, angle: 144, tint: 14, tintCol: "#FBCFE8", stroke: 2, strokeOp: 75, strokeCol: "#FCE7F3", mode: "solid" },
    amber:   { frost: 30, refr: 65, depth: 60, disp: 40, light: 85, angle: 144, tint: 15, tintCol: "#FDE68A", stroke: 2, strokeOp: 80, strokeCol: "#FEF08A", mode: "solid" }
  };
  var chips = document.querySelectorAll(".chip");
  for (var h = 0; h < chips.length; h++) {
    chips[h].addEventListener("click", function () {
      var lk = GLASS_LOOKS[this.getAttribute("data-look")];
      if (!lk) return;
      setRange("frost", "v-frost", lk.frost);
      setRange("glassrefr", "v-glassrefr", lk.refr);
      setRange("glassdepth", "v-glassdepth", lk.depth);
      setRange("glassdisp", "v-glassdisp", lk.disp);
      setRange("glasslight", "v-glasslight", lk.light);
      setRange("glassangle", "v-glassangle", lk.angle);
      setRange("glasstint", "v-glasstint", lk.tint);
      if ($("glasstintcol")) { $("glasstintcol").value = lk.tintCol; $("glasstintcolHex").value = lk.tintCol; $("v-glasstintcol").textContent = lk.tintCol; }
      setRange("glassstroke", "v-glassstroke", lk.stroke);
      setRange("glassstrokeop", "v-glassstrokeop", lk.strokeOp);
      if ($("glasscolor")) { $("glasscolor").value = lk.strokeCol; $("glasscolorHex").value = lk.strokeCol; $("v-glasscolor").textContent = lk.strokeCol; }
      if ($("strokeMode")) $("strokeMode").value = lk.mode || "solid";
      for (var j = 0; j < chips.length; j++) chips[j].classList.remove("sel");
      this.classList.add("sel");
      if ($("glassAutoApply") && $("glassAutoApply").checked) {
        run("auraOneClickGlass(" + frost.value + ", " + glassOpts() + ")", "Glass applied.");
      }
    });
  }
  var gCol = $("glasscolor"), gHex = $("glasscolorHex");
  gCol.addEventListener("input", function () { gHex.value = gCol.value.toUpperCase(); $("v-glasscolor").textContent = gHex.value; });
  gHex.addEventListener("input", function () { $("v-glasscolor").textContent = gHex.value.toUpperCase(); if (/^#[0-9a-fA-F]{6}$/.test(gHex.value)) gCol.value = gHex.value; });
  var gtCol = $("glasstintcol"), gtHex = $("glasstintcolHex");
  if (gtCol && gtHex) {
    gtCol.addEventListener("input", function () { gtHex.value = gtCol.value.toUpperCase(); $("v-glasstintcol").textContent = gtHex.value; });
    gtHex.addEventListener("input", function () { $("v-glasstintcol").textContent = gtHex.value.toUpperCase(); if (/^#[0-9a-fA-F]{6}$/.test(gtHex.value)) gtCol.value = gtHex.value; });
  }

  function glassOpts() {
    var sc = gHex.value.replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(sc)) sc = "FFFFFF";
    var tc = (gtHex ? gtHex.value : "FFFFFF").replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(tc)) tc = "FFFFFF";
    return "{refr:" + $("glassrefr").value + ", depth:" + $("glassdepth").value +
      ", disp:" + $("glassdisp").value + ", light:" + $("glasslight").value +
      ", lightAngle:" + $("glassangle").value + ", tintOp:" + $("glasstint").value + ", tintColor:'" + tc + "'" +
      ", stroke:" + $("glassstroke").value + ", strokeOp:" + $("glassstrokeop").value +
      ", strokeColor:'" + sc + "'" +
      ", strokeTop:" + $("strokeTop").checked + ", strokeRight:" + $("strokeRight").checked +
      ", strokeBottom:" + $("strokeBottom").checked + ", strokeLeft:" + $("strokeLeft").checked +
      ", strokeMode:'" + $("strokeMode").value + "'}";
  }
  $("oneClickGlass").addEventListener("click", function () {
    run("auraOneClickGlass(" + frost.value + ", " + glassOpts() + ")", "1-Click Glass ready.");
  });
  $("makeGlass").addEventListener("click", function () {
    run("auraGlass(" + frost.value + ", " + glassOpts() + ")", "Glass ready.");
  });
  $("makeShapeGlass").addEventListener("click", function () {
    run("auraShapeGlass(" + frost.value + ", " + glassOpts() + ")", "Shape to Glass ready.");
  });
  $("refreshGlass").addEventListener("click", function () {
    run("auraRefreshGlass(" + frost.value + ", " + glassOpts() + ")", "Glass refreshed.");
  });
  /* Live Auto-Update: release any Glass slider/colour/toggle -> auto-updates existing Glass layer */
  function liveGlassUpdate() {
    if ($("glassAutoApply") && $("glassAutoApply").checked) {
      run("auraLiveUpdateGlass(" + frost.value + ", " + glassOpts() + ")", "Glass updated.");
    }
  }
  [
    "frost", "glassrefr", "glassdepth", "glassdisp", "glasslight", "glassangle",
    "glasstint", "glasstintcol", "glasstintcolHex",
    "glassstroke", "glassstrokeop", "glasscolor", "glasscolorHex",
    "strokeTop", "strokeRight", "strokeBottom", "strokeLeft", "strokeMode"
  ].forEach(function (cid) {
    var el = $(cid);
    if (el) el.addEventListener("change", liveGlassUpdate);
  });

  /* Advanced tools */
  var GRADES = [
    ["Cinematic Teal-Orange", "Hollywood film-er moto — teal chhaya, komola alo."],
    ["Vintage Film", "Purono film-er moto norom, halka fada rong."],
    ["Moody Dark", "Garo, dramatic — kom alo, beshi contrast."],
    ["Golden Hour", "Sondhar roder moto gorom sona rong."],
    ["B&W Noir", "Kalo-sada, high contrast — classic noir."],
    ["Cyberpunk", "Neon nil-beguni, futuristic shohor-er look."]
  ];
  var gradeSel = $("gradePreset");
  GRADES.forEach(function (g, i) {
    var o = document.createElement("option"); o.value = i; o.textContent = g[0]; gradeSel.appendChild(o);
  });
  function syncGrade() { $("gradeDesc").textContent = GRADES[+gradeSel.value][1]; }
  gradeSel.addEventListener("change", syncGrade); syncGrade();
  rng("gradeop", "v-gradeop");
  $("applyGrade").addEventListener("click", function () {
    run("auraGrade(" + gradeSel.value + ", " + $("gradeop").value + ")", "Grade ready.");
  });

  rng("radius", "v-radius"); rng("smoothop", "v-smoothop"); rng("detailop", "v-detailop");
  $("applyRetouch").addEventListener("click", function () {
    run("auraRetouch(" + $("radius").value + ", " + $("smoothop").value + ")", "Auto Face Retouch sesh.");
  });
  $("applyDetail").addEventListener("click", function () {
    run("auraDetail(" + $("detailop").value + ")", "Detail layer ready.");
  });

  rng("dbstr", "v-dbstr");
  $("applyDodgeBurn").addEventListener("click", function () {
    var m = $("dbMode") ? $("dbMode").value : "portrait";
    var st = $("dbstr") ? $("dbstr").value : 65;
    run("auraDodgeBurn('" + m + "', " + st + ")", "Dodge & Burn ready.");
  });

  rng("vig", "v-vig"); rng("feather", "v-feather");
  $("applyVignette").addEventListener("click", function () {
    run("auraVignette(" + $("vig").value + ", " + $("feather").value + ")", "Vignette ready.");
  });

  rng("wmop", "v-wmop");
  var wmsize = $("wmsize");
  wmsize.addEventListener("input", function () { $("v-wmsize").textContent = (+wmsize.value === 0 ? "Auto" : wmsize.value + " px"); });
  var wmCol = $("wmCol"), wmColHex = $("wmColHex");
  if (wmCol && wmColHex) {
    wmCol.addEventListener("input", function () { wmColHex.value = wmCol.value.toUpperCase(); $("v-wmcol").textContent = wmColHex.value; });
    wmColHex.addEventListener("input", function () { $("v-wmcol").textContent = wmColHex.value.toUpperCase(); if (/^#[0-9a-fA-F]{6}$/.test(wmColHex.value)) wmCol.value = wmColHex.value; });
  }
  $("applyWatermark").addEventListener("click", function () {
    var t = $("wmText").value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    var pos = $("wmPos") ? $("wmPos").value : "tile_diag";
    var col = (wmColHex ? wmColHex.value : "FFFFFF").replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(col)) col = "FFFFFF";
    run('auraWatermark("' + t + '", ' + $("wmop").value + ", " + wmsize.value + ", '" + pos + "', '" + col + "')", "Watermark ready.");
  });

  $("applyExport").addEventListener("click", function () {
    run("auraBatchExport()", "Batch Export sesh.");
  });

  /* Shared swatch helper */
  function swatchCSS(stops) {
    var parts = [];
    stops.forEach(function (s) { parts.push(s[1] + " " + s[0] + "%"); });
    return "linear-gradient(135deg, " + parts.join(", ") + ")";
  }
  function styleTile(name, swatch, title, onClick) {
    var t = document.createElement("button"); t.className = "styletile"; t.title = title || name;
    var sw = document.createElement("span"); sw.className = "styleswatch"; sw.style.background = swatchCSS(swatch); sw.textContent = "Aa";
    var lb = document.createElement("span"); lb.className = "stylename"; lb.textContent = name;
    t.appendChild(sw); t.appendChild(lb);
    t.addEventListener("click", onClick);
    return t;
  }

  /* ---- Text Effects (137 editable Photoshop Layer Styles) ---- */
  var textfxSel = $("textfxPreset"), textfxCat = $("textfxCat");
  var catAll = document.createElement("option"); catAll.value = "All"; catAll.textContent = "All Categories (" + TEXTFX_META.length + ")"; textfxCat.appendChild(catAll);
  TEXTFX_CATS.forEach(function (c) {
    var o = document.createElement("option"); o.value = c; o.textContent = c; textfxCat.appendChild(o);
  });
  var textfxGrid = $("textfxGrid");
  function fillTextfx() {
    var cat = textfxCat.value;
    var q = ($("textfxSearch") ? ($("textfxSearch").value || "") : "").toLowerCase();
    var list = [];
    TEXTFX_META.forEach(function (m, i) {
      if (cat !== "All" && m.c !== cat) return;
      if (q && m.n.toLowerCase().indexOf(q) < 0 && m.c.toLowerCase().indexOf(q) < 0) return;
      list.push(i);
    });
    textfxSel.innerHTML = "";
    if (textfxGrid) textfxGrid.innerHTML = "";
    list.forEach(function (i) {
      var m = TEXTFX_META[i];
      var o = document.createElement("option"); o.value = i; o.textContent = m.n; textfxSel.appendChild(o);
      if (textfxGrid) {
        var tile = document.createElement("button");
        tile.type = "button";
        tile.className = "tfx-tile";
        tile.setAttribute("data-idx", i);
        tile.title = m.n + " — " + m.c + " (click to apply)";
        var prev = document.createElement("span");
        prev.className = "tfx-preview";
        prev.style.background = swatchCSS((m.g && m.g.length) ? m.g : [[0, "#E5E7EB"], [100, "#9CA3AF"]]);
        if (m.p) {
          if (m.p.hollow) {
            prev.style.background = "none";
            prev.style.webkitTextFillColor = "transparent";
          }
          if (m.p.stroke) prev.style.webkitTextStroke = m.p.stroke;
          if (m.p.glow) prev.style.filter = "drop-shadow(" + m.p.glow.split(",")[0].trim() + ")";
          else if (m.p.sh) prev.style.filter = "drop-shadow(" + m.p.sh.split(",")[0].trim() + ")";
        }
        prev.textContent = "Aa";
        var nm = document.createElement("span");
        nm.className = "tfx-name";
        nm.textContent = m.n;
        tile.appendChild(prev);
        tile.appendChild(nm);
        tile.addEventListener("click", function () {
          textfxSel.value = i;
          syncTextfx();
          run("auraTextFX100(" + i + ", " + $("textfxop").value + ", " + ($("textfxSmart").checked ? "true" : "false") + ")", m.n + " applied.");
        });
        textfxGrid.appendChild(tile);
      }
    });
    $("textfxCount").textContent = list.length;
    syncTextfx();
  }
  function syncTextfx() {
    var i = +textfxSel.value, m = TEXTFX_META[i];
    $("textfxDesc").textContent = m ? m.n + " — " + m.c + " (editable Photoshop Layer Style)." : "";
    if (textfxGrid) {
      var tiles = textfxGrid.querySelectorAll(".tfx-tile");
      for (var k = 0; k < tiles.length; k++) {
        tiles[k].classList.toggle("sel", +tiles[k].getAttribute("data-idx") === i);
      }
    }
  }
  textfxCat.addEventListener("change", fillTextfx);
  if ($("textfxSearch")) $("textfxSearch").addEventListener("input", fillTextfx);
  textfxSel.addEventListener("change", syncTextfx);
  fillTextfx();
  $("applyTextfx").addEventListener("click", function () {
    run("auraTextFX100(" + textfxSel.value + ", " + $("textfxop").value + ", " + ($("textfxSmart").checked ? "true" : "false") + ")", "Text Effect ready.");
  });
  $("clearTextfxStyle").addEventListener("click", function () { run("auraClearStyle()", "Layer Style cleared."); });
  rng("textfxop", "v-textfxop");

  /* ---- Gradient Presets: 28 (Shape / Text / New BG) + Visual 1-Click Grid ---- */
  var gradSel = $("gradPreset"), gradTarget = $("gradTarget"), gradGrid = $("gradGrid");
  function getGradMode() {
    var v = gradTarget ? gradTarget.value : "layer";
    return (v === "bg" || v === "text") ? v : "layer";
  }
  rng("gradang", "v-gradang");
  function gradStyleArg() { return $("gradStyle") ? $("gradStyle").value : "Lnr "; }
  function gradAngArg() { return $("gradang") ? $("gradang").value : 90; }
  function syncGrad() {
    var g = (typeof GRADIENTS !== "undefined") ? GRADIENTS[gradSel.selectedIndex || 0] : null;
    if (g && $("gradang")) setRange("gradang", "v-gradang", g.ang);
    $("gradDesc").textContent = g ? g.n + " — " + g.g.map(function (s) { return s[1]; }).join(" → ") + " (angle " + g.ang + "°)" : "";
  }
  if (gradSel && typeof GRADIENTS !== "undefined") {
    GRADIENTS.forEach(function (g, idx) {
      var o = document.createElement("option"); o.textContent = g.n; gradSel.appendChild(o);
      if (gradGrid) {
        gradGrid.appendChild(styleTile(g.n, g.g, g.n + " — click to apply", function () {
          gradSel.selectedIndex = idx;
          syncGrad();
          run("auraGradientPreset(" + idx + ", '" + getGradMode() + "', " + gradAngArg() + ", '" + gradStyleArg() + "')", g.n + " gradient applied.");
        }));
      }
    });
    $("gradCount").textContent = GRADIENTS.length;
    gradSel.addEventListener("change", syncGrad);
    syncGrad();
  }
  $("applyGradient").addEventListener("click", function () {
    run("auraGradientPreset(" + gradSel.selectedIndex + ", '" + getGradMode() + "', " + gradAngArg() + ", '" + gradStyleArg() + "')", "Gradient preset applied.");
  });

  /* ---- Photoshop Styles Grid (137+ real editable Lefx styles) ---- */
  var styleCat = $("styleCat"), styleGrid = $("styleGrid"), psGrid = $("psStyleGrid");
  var styleAll = document.createElement("option"); styleAll.value = "All"; styleAll.textContent = "All Categories (" + TEXTFX_META.length + ")"; styleCat.appendChild(styleAll);
  TEXTFX_CATS.forEach(function (c) {
    var o = document.createElement("option"); o.value = c; o.textContent = c; styleCat.appendChild(o);
  });
  $("clearLayerStyle").addEventListener("click", function () { run("auraClearStyle()", "Layer Style cleared."); });

  /* Direct Photoshop Styles panel (Window > Styles) sync + .asl importer */
  var psLiveStyles = [];
  function renderPSLiveStyles() {
    var box = $("psLiveGrid"), cnt = $("psLiveCount");
    if (!box) return;
    var q = (($("styleSearch").value || "") + "").toLowerCase();
    box.innerHTML = "";
    var shown = 0;
    psLiveStyles.forEach(function (nm) {
      if (!nm) return;
      if (q && nm.toLowerCase().indexOf(q) < 0) return;
      shown++;
      var esc = nm.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      box.appendChild(styleTile(nm, [[0, "#38BDF8"], [50, "#818CF8"], [100, "#F59E0B"]], nm + " — direct Photoshop Style (ASty)", function () {
        run('auraApplyPSStyle("' + esc + '")', nm + " Photoshop Style applied.");
      }));
    });
    if (cnt) cnt.textContent = shown;
    if (shown === 0) {
      var empty = document.createElement("div");
      empty.className = "hint small";
      empty.style.gridColumn = "1 / -1";
      empty.textContent = psLiveStyles.length ? "No matching Photoshop Style." : "Click 'Load PS Styles' to pull styles directly from Photoshop's Window > Styles panel (or Import .ASL).";
      box.appendChild(empty);
    }
  }
  function syncPSStylesFromHost() {
    cs.evalScript("auraListPSStyles()", function (res) {
      var s = (res == null) ? "" : String(res);
      if (s.indexOf("STYLES:") === 0) {
        var raw = s.substring(7);
        psLiveStyles = raw ? raw.split("||") : [];
        renderPSLiveStyles();
        setStatus("Loaded " + psLiveStyles.length + " live styles from Photoshop Styles panel.", "ok");
      } else if (s && s.indexOf("Error:") === 0) {
        setStatus(s, "err");
      }
    });
  }
  if ($("syncPSStyles")) $("syncPSStyles").addEventListener("click", syncPSStylesFromHost);
  if ($("loadASLFile")) $("loadASLFile").addEventListener("click", function () {
    setStatus("Loading .asl file…");
    cs.evalScript("auraLoadASL()", function (res) {
      var s = (res == null) ? "" : String(res);
      if (s.indexOf("OK:") === 0) {
        setStatus(s.substring(3).trim(), "ok");
        syncPSStylesFromHost();
      } else {
        setStatus(s || "Error: Could not load .asl", "err");
      }
    });
  });
  renderPSLiveStyles();

  psGrid.appendChild(styleTile(
    "Emon Yellow Orange Glow",
    [[0, "#FFFF00"], [100, "#FF6D00"]],
    "Emon Yellow Orange Glow — exact .asl Layer Style (editable)",
    function () { run("auraStyleOnLayer(0)", "Emon Yellow Orange Glow applied."); }
  ));
  ["Gold Classic", "Gold Deep", "Gold Light", "Teal"].forEach(function (nm) {
    var gi = -1;
    for (var k = 0; k < GRADIENTS.length; k++) { if (GRADIENTS[k].n === nm) { gi = k; break; } }
    if (gi < 0) return;
    psGrid.appendChild(styleTile(nm, GRADIENTS[gi].g, nm + " (approx.) — editable Layer Style", function () {
      run("auraGradientPreset(" + gi + ", 'layer')", nm + " Layer Style applied.");
    }));
  });

  function fillStyles() {
    var q = (($("styleSearch").value || "") + "").toLowerCase();
    var cat = styleCat.value || "All";
    styleGrid.innerHTML = "";
    var count = 0;
    TEXTFX_META.forEach(function (m, i) {
      if (cat !== "All" && m.c !== cat) return;
      if (q && m.n.toLowerCase().indexOf(q) < 0 && m.c.toLowerCase().indexOf(q) < 0) return;
      count++;
      var sw = (m.g && m.g.length) ? m.g : [[0, "#E5E7EB"], [100, "#9CA3AF"]];
      styleGrid.appendChild(styleTile(m.n, sw, m.n + " — " + m.c + " (editable Layer Style)", function () {
        run("auraStyleOnLayer(" + i + ")", m.n + " Layer Style applied.");
      }));
    });
    $("styleCount").textContent = count;
  }
  styleCat.addEventListener("change", fillStyles);
  $("styleSearch").addEventListener("input", function () { fillStyles(); renderPSLiveStyles(); });
  fillStyles();

  /* Photo Expand */
  var expandSel = $("expandSize");
  SIZES.forEach(function (s) {
    var o = document.createElement("option"); o.value = s[1]; o.textContent = s[0]; expandSel.appendChild(o);
  });
  expandSel.value = 3;
  rng("blur", "v-blur"); rng("expstep", "v-expstep"); rng("expAddPx", "v-expadd");
  function escGenPrompt() {
    var v = $("genPrompt") ? ($("genPrompt").value || "") : "";
    return v.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
  if ($("fillEmptyCanvas")) $("fillEmptyCanvas").addEventListener("click", function () { run("auraFillEmptyCanvas()", "Empty canvas sides filled."); });
  if ($("genFillSel")) $("genFillSel").addEventListener("click", function () {
    run('auraGenerativeFill("' + escGenPrompt() + '", 4, true)', "Generative Fill complete.");
  });
  if ($("genRemoveObj")) $("genRemoveObj").addEventListener("click", function () {
    run('auraGenerativeFill("", 4, false)', "Object removed cleanly.");
  });
  $("applyExpand").addEventListener("click", function () {
    var dir = $("expandDir") ? $("expandDir").value : "all";
    var addPx = $("expAddPx") ? $("expAddPx").value : 0;
    run("auraExpand(" + expandSel.value + ", " + $("expandMode").value + ", " + $("blur").value + ", " + $("expstep").value + ", '" + dir + "', " + addPx + ', "' + escGenPrompt() + '")', "Photo Expand complete.");
  });





  /* ---- Gemini AI Extreme Expand / Fill (BYOK Free API Key via CEP Node.js + fetch) ---- */
  var gKeyInput = $("geminiApiKey");
  if (gKeyInput) {
    try { gKeyInput.value = localStorage.getItem("design360n_gemini_key") || ""; } catch (e) {}
    gKeyInput.addEventListener("input", function () {
      try { localStorage.setItem("design360n_gemini_key", gKeyInput.value.trim()); } catch (e) {}
    });
  }
  if ($("getGeminiKey")) $("getGeminiKey").addEventListener("click", function () {
    cs.openURLInDefaultBrowser("https://aistudio.google.com/apikey");
    setStatus("Opened Google AI Studio — create a free Gemini API key & paste it above.", "ok");
  });
  if ($("runGeminiFill")) $("runGeminiFill").addEventListener("click", function () {
    var apiKey = gKeyInput ? gKeyInput.value.trim() : "";
    if (!apiKey) {
      setStatus("Error: Paste your free Gemini API key first (click 'Get Free Key').", "err");
      return;
    }
    var userPrompt = $("genPrompt") ? ($("genPrompt").value || "").trim() : "";
    var finalPrompt = userPrompt
      ? ("Edit this poster/photo realistically: " + userPrompt + ". Keep the main subject crisp and natural, seamlessly fill any white or empty margins with matching realistic background texture and lighting.")
      : "Seamlessly expand and fill all white or empty margins/sidebars of this image with ultra-realistic matching background texture, lighting, and natural film grain. Keep the central subject, text, and composition 100% identical and untouched.";

    setStatus("Exporting canvas for Gemini AI…");
    cs.evalScript("auraExportTempCanvas()", function (res) {
      var s = (res == null) ? "" : String(res);
      if (s.indexOf("PATH:") !== 0) { setStatus(s || "Error: Canvas export failed.", "err"); return; }
      var inPath = s.substring(5).trim();
      var fsMod = null, osMod = null, pathMod = null;
      try { fsMod = require("fs"); osMod = require("os"); pathMod = require("path"); } catch (eReq) {}
      if (!fsMod) { setStatus("Error: CEP Node.js fs module unavailable.", "err"); return; }

      var b64 = "";
      try { b64 = fsMod.readFileSync(inPath).toString("base64"); }
      catch (eRd) { setStatus("Error: Could not read exported canvas PNG: " + eRd.message, "err"); return; }

      setStatus("Gemini AI generating ultra-realistic fill…");
      var url = (apiKey.indexOf("AQ.") === 0)
        ? ("https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-image:generateContent?key=" + encodeURIComponent(apiKey))
        : ("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + encodeURIComponent(apiKey));
      var payload = {
        contents: [{
          parts: [
            { text: finalPrompt },
            { inline_data: { mime_type: "image/png", data: b64 } }
          ]
        }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
      };
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.error) { setStatus("Error: Gemini API — " + (data.error.message || "Request failed"), "err"); return; }
        var outB64 = null;
        var cands = (data && data.candidates) ? data.candidates : [];
        for (var i = 0; i < cands.length && !outB64; i++) {
          var parts = (cands[i].content && cands[i].content.parts) ? cands[i].content.parts : [];
          for (var j = 0; j < parts.length; j++) {
            var idata = parts[j].inlineData || parts[j].inline_data;
            if (idata && idata.data) { outB64 = idata.data; break; }
          }
        }
        if (!outB64) { setStatus("Error: Gemini API returned no image. Try a clearer prompt or check API quota.", "err"); return; }
        var outPath = pathMod.join(osMod.tmpdir(), "design360n_ai_out.png");
        fsMod.writeFileSync(outPath, Buffer.from(outB64, "base64"));
        var escOut = outPath.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        run('auraPlaceTempAIResult("' + escOut + '", "Design360n Gemini AI Fill")', "Gemini AI Fill placed!");
      })
      .catch(function (err) {
        setStatus("Error: Network/Gemini API call failed — " + err.message, "err");
      });
    });
  });

  /* ---- 1-Click Poster Animator + Layer Breakdown ---- */
  function loadPosterBreakdown() {
    var box = $("posterBreakdown");
    if (!box) return;
    setStatus("Analyzing poster layers…");
    cs.evalScript("auraAnalyzePoster()", function (res) {
      var s = (res == null) ? "" : String(res);
      box.innerHTML = "";
      if (s.indexOf("BREAKDOWN:") === 0) {
        var rows = s.substring(10).split(";;");
        rows.forEach(function (r) {
          var p = r.split("|");
          var role = p[0] || "LAYER", nm = p[1] || "";
          var div = document.createElement("div"); div.className = "bd-row";
          var tag = document.createElement("span");
          tag.className = "bd-tag" + (role === "HERO" ? " hero" : role === "BG" ? " bg" : "");
          tag.textContent = role;
          var sp = document.createElement("span"); sp.className = "bd-name"; sp.textContent = nm;
          div.appendChild(tag); div.appendChild(sp);
          box.appendChild(div);
        });
        setStatus("Poster breakdown ready (" + rows.length + " layers classified).", "ok");
      } else {
        setStatus(s || "Error: Could not analyze poster.", "err");
      }
    });
  }
  if ($("analyzePoster")) $("analyzePoster").addEventListener("click", loadPosterBreakdown);
  ["animTextDist|v-animtdist", "animStagger|v-animstag", "animHeroDist|v-animhdist", "animFloat|v-animfloat", "animSweepOp|v-animswop", "animHold|v-animhold"].forEach(function (p) { var a = p.split("|"); rng(a[0], a[1]); });
  var swCol = $("animSweepCol"), swHex = $("animSweepColHex");
  if (swCol && swHex) {
    swCol.addEventListener("input", function () { swHex.value = swCol.value.toUpperCase(); $("v-animswcol").textContent = swHex.value; });
    swHex.addEventListener("input", function () { $("v-animswcol").textContent = swHex.value.toUpperCase(); if (/^#[0-9a-fA-F]{6}$/.test(swHex.value)) swCol.value = swHex.value; });
  }
  if ($("animDuration")) $("animDuration").addEventListener("input", function () { $("v-animdur").textContent = this.value; });
  if ($("runPosterAnim")) $("runPosterAnim").addEventListener("click", function () {
    var sc = (swHex ? swHex.value : "FFF5D6").replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(sc)) sc = "FFF5D6";
    var o = "{style:'" + $("animStyle").value +
      "', frames:" + $("animFrames").value +
      ", fps:" + ($("animFps") ? $("animFps").value : 30) +
      ", hold:" + ($("animHold") ? $("animHold").value : 1.0) +
      ", duration:" + ($("animDuration") ? $("animDuration").value : 10) +
      ", bg:" + ($("animBG") ? $("animBG").checked : true) +
      ", text:" + $("animText").checked +
      ", hero:" + $("animHero").checked +
      ", sweep:" + $("animSweep").checked +
      ", textDir:'" + ($("animTextDir") ? $("animTextDir").value : "up") + "'" +
      ", textDist:" + ($("animTextDist") ? $("animTextDist").value : 40) +
      ", stagger:" + ($("animStagger") ? $("animStagger").value : 3) +
      ", heroDist:" + ($("animHeroDist") ? $("animHeroDist").value : 55) +
      ", floatAmp:" + ($("animFloat") ? $("animFloat").value : 8) +
      ", sweepOp:" + ($("animSweepOp") ? $("animSweepOp").value : 72) +
      ", sweepCol:'" + sc + "'}";
    run("auraAnimatePoster(" + o + ")", "Poster Animation ready!");
  });
  /* Pro Cinema & Commercial Studio SFX Engine v2.75 (44.1kHz Stereo 16-bit WAV)
     Features: Bandpass Stereo-Panned Whooshes, Layered Sub-Impact, Crisp UI Pop-Ups,
     Authentic Mechanical Typewriter, Glitch Zaps, Sparkling Light-Sweep Shimmer,
     Warm Musical Groove Bed, and 4-Tap Stereo Room Reverb — synced to exact 1-by-1 text timing! */
  function buildEnvironmentSfxWav(durationSec, envMode, textCount) {
    var sr = 44100;
    var totalSamples = Math.max(sr * 2, Math.round(durationSec * sr));
    var L = new Float32Array(totalSamples);
    var R = new Float32Array(totalSamples);
    var nTexts = Math.max(1, Math.min(10, parseInt(textCount, 10) || 4));

    function addLR(idx, lv, rv) {
      if (idx >= 0 && idx < totalSamples) { L[idx] += lv; R[idx] += rv; }
    }
    var seed = 42069;
    function rand() { seed = (seed * 16807) % 2147483647; return ((seed - 1) / 2147483646) * 2 - 1; }

    /* 1. Resonant Bandpass Stereo-Panned Air Whoosh (L->R or R->L) */
    function addStereoWhoosh(tSec, durSec, gain, panStart, panEnd, fLow, fHigh) {
      var s0 = Math.round(tSec * sr), n = Math.round(durSec * sr);
      var b0 = 0, b1 = 0, b2 = 0; /* pink-ish noise state */
      var y1 = 0, y2 = 0;         /* resonant filter state */
      for (var i = 0; i < n; i++) {
        var p = i / n;
        var w = rand();
        b0 = 0.997 * b0 + w * 0.029;
        b1 = 0.985 * b1 + w * 0.032;
        b2 = 0.950 * b2 + w * 0.048;
        var pink = (b0 + b1 + b2 + w * 0.18) * 1.4;
        var freq = fLow + (fHigh - fLow) * Math.sin(p * Math.PI);
        var fc = Math.min(0.45, (2 * Math.PI * freq) / sr);
        var q = 0.35;
        y1 += fc * (pink - y1 - q * y2);
        y2 += fc * y1;
        var env = Math.pow(Math.sin(p * Math.PI), 1.6);
        var sig = y1 * env * gain;
        var pan = panStart + (panEnd - panStart) * p; /* -1 left .. +1 right */
        var gL = Math.cos((pan + 1) * Math.PI * 0.25);
        var gR = Math.sin((pan + 1) * Math.PI * 0.25);
        addLR(s0 + i, sig * gL, sig * gR);
      }
    }

    /* 2. Layered Cinematic Sub-Impact / Model Landing Thump */
    function addCinematicImpact(tSec, durSec, fStart, fEnd, gain) {
      var s0 = Math.round(tSec * sr), n = Math.round(durSec * sr), ph = 0, ph2 = 0;
      for (var i = 0; i < n; i++) {
        var p = i / n;
        var freq = fStart * Math.pow(fEnd / fStart, Math.pow(p, 0.55));
        ph += (2 * Math.PI * freq) / sr;
        ph2 += (2 * Math.PI * freq * 2.02) / sr;
        var att = Math.min(1, i / (sr * 0.005));
        var body = (Math.sin(ph) * 0.82 + Math.sin(ph2) * 0.18) * Math.pow(1 - p, 2.0);
        var punch = (i < sr * 0.025) ? (rand() * (1 - i / (sr * 0.025)) * 0.25) : 0;
        var v = Math.tanh((body + punch) * 1.4) * att * gain;
        addLR(s0 + i, v, v);
      }
    }

    /* 3. Modern Crisp UI Pop-Up / Bubble Snap (Reels/Apple style) */
    function addModernPop(tSec, gain, pan) {
      var s0 = Math.round(tSec * sr), n = Math.round(0.16 * sr), ph = 0;
      var gL = Math.cos((pan + 1) * Math.PI * 0.25), gR = Math.sin((pan + 1) * Math.PI * 0.25);
      for (var i = 0; i < n; i++) {
        var p = i / n;
        /* Fast upward pitch snap 260Hz -> 920Hz -> 580Hz */
        var f = (p < 0.22) ? (260 + 660 * (p / 0.22)) : (920 - 340 * ((p - 0.22) / 0.78));
        ph += (2 * Math.PI * f) / sr;
        var env = Math.min(1, i / (sr * 0.003)) * Math.pow(1 - p, 2.8);
        var click = (i < sr * 0.008) ? (rand() * 0.22 * (1 - i / (sr * 0.008))) : 0;
        var v = (Math.sin(ph) * 0.85 + Math.sin(ph * 2) * 0.15 + click) * env * gain;
        addLR(s0 + i, v * gL, v * gR);
      }
    }

    /* 4. Authentic Mechanical Typewriter Keys (layered metallic click + woody thock) */
    function addMechanicalTypewriter(tSec, totalDurSec, clicks, gain) {
      var spacing = Math.max(0.055, Math.min(0.11, totalDurSec / Math.max(1, clicks)));
      for (var c = 0; c < clicks; c++) {
        var jitter = ((c % 3) - 1) * 0.006;
        var s0 = Math.round((tSec + c * spacing + jitter) * sr);
        var n = Math.round(0.045 * sr);
        var pan = -0.25 + (c / Math.max(1, clicks)) * 0.5;
        var gL = Math.cos((pan + 1) * Math.PI * 0.25), gR = Math.sin((pan + 1) * Math.PI * 0.25);
        var phHi = 0, phLo = 0;
        var fHi = 2400 + (c % 4) * 240;
        for (var i = 0; i < n; i++) {
          var p = i / n;
          phHi += (2 * Math.PI * fHi) / sr;
          phLo += (2 * Math.PI * 190) / sr;
          var hiClick = (rand() * 0.55 + Math.sin(phHi) * 0.45) * Math.pow(1 - p, 7);
          var loThock = Math.sin(phLo) * Math.pow(1 - p, 4) * 0.45;
          var v = (hiClick + loThock) * gain;
          addLR(s0 + i, v * gL, v * gR);
        }
      }
    }

    /* 5. Trendy Digital Glitch Zap */
    function addGlitchZap(tSec, durSec, gain) {
      var s0 = Math.round(tSec * sr), n = Math.round(durSec * sr), ph = 0;
      for (var i = 0; i < n; i++) {
        var p = i / n;
        var stepF = ((Math.floor(p * 12) % 2 === 0) ? 1400 : 420) * (1 - p * 0.5);
        ph += (2 * Math.PI * stepF) / sr;
        var gate = (Math.floor(p * 16) % 3 === 0) ? 0.25 : 1.0;
        var v = (Math.tanh(Math.sin(ph) * 2.5) * 0.5 + rand() * 0.35) * gate * Math.pow(1 - p, 1.8) * gain;
        addLR(s0 + i, v * 0.9, v * 1.05);
      }
    }

    /* 6. Sparkling Glass / Golden Light-Sweep Shimmer */
    function addLightSweepShimmer(tSec, durSec, rootFreq, gain) {
      var s0 = Math.round(tSec * sr), n = Math.round(durSec * sr);
      var ratios = [1, 1.25, 1.5, 2.0, 2.5, 3.0]; /* Major 9th sparkle chord */
      for (var i = 0; i < n; i++) {
        var p = i / n;
        var env = Math.pow(Math.sin(p * Math.PI), 1.4);
        var t = i / sr;
        var vL = 0, vR = 0;
        for (var k = 0; k < ratios.length; k++) {
          var f = rootFreq * ratios[k] * (1 + p * 0.06);
          var w = 0.28 / (1 + k * 0.45);
          vL += Math.sin(2 * Math.PI * f * t) * w;
          vR += Math.sin(2 * Math.PI * (f * 1.004) * t + k) * w;
        }
        /* Pan shimmer smoothly L -> R matching the light beam */
        var pan = -0.7 + 1.4 * p;
        var gL = Math.cos((pan + 1) * Math.PI * 0.25), gR = Math.sin((pan + 1) * Math.PI * 0.25);
        addLR(s0 + i, vL * env * gain * gL, vR * env * gain * gR);
      }
      addStereoWhoosh(tSec, durSec, gain * 0.45, -0.8, 0.8, 700, 3200);
    }

    /* 7. Warm Sidechained Musical Bed + Subtle Groove Pulse */
    function addStudioMusicBed(chordFreqs, padGain, pulseBpm, pulseGain) {
      var fadeIn = Math.round(sr * 0.9), fadeOut = Math.round(sr * 1.4);
      var beatSamples = Math.round((60 / pulseBpm) * sr);
      for (var i = 0; i < totalSamples; i++) {
        var env = 1;
        if (i < fadeIn) env = i / fadeIn;
        else if (i > totalSamples - fadeOut) env = (totalSamples - i) / fadeOut;
        var t = i / sr;
        /* Gentle sidechain ducking on the beat */
        var beatPos = (i % beatSamples) / beatSamples;
        var duck = 0.72 + 0.28 * Math.min(1, beatPos * 2.5);
        var vL = 0, vR = 0;
        for (var k = 0; k < chordFreqs.length; k++) {
          var f = chordFreqs[k];
          vL += (Math.sin(2 * Math.PI * f * t) + 0.15 * Math.sin(2 * Math.PI * f * 2 * t)) / chordFreqs.length;
          vR += (Math.sin(2 * Math.PI * (f * 1.0035) * t + 0.4) + 0.15 * Math.sin(2 * Math.PI * f * 2.004 * t)) / chordFreqs.length;
        }
        /* Subtle soft shaker/kick pulse */
        var groove = 0;
        if (pulseGain > 0 && beatPos < 0.08) {
          var bp = beatPos / 0.08;
          groove = Math.sin(2 * Math.PI * (90 - 45 * bp) * t) * Math.pow(1 - bp, 2.5) * pulseGain;
        }
        addLR(i, (vL * padGain * duck + groove) * env, (vR * padGain * duck + groove) * env);
      }
    }

    var animDur = durationSec * 0.80;
    var tHeroStart = animDur * 0.05;
    var tHeroLand = animDur * 0.26;
    var tTextStart = animDur * 0.30;
    var tTextEnd = animDur * 0.88;
    var textSlot = (tTextEnd - tTextStart) / nTexts;
    var tSw1 = animDur * 0.34;
    var tSw2 = animDur * 0.68;

    /* Environment-wise Studio Bed + Hero Rise/Landing */
    if (envMode === "luxury") {
      addStudioMusicBed([130.81, 196.0, 246.94, 293.66], 0.16, 85, 0.04);
      addStereoWhoosh(tHeroStart, 1.3, 0.28, -0.5, 0.5, 180, 1200);
      addCinematicImpact(tHeroLand, 1.0, 105, 38, 0.36);
      addLightSweepShimmer(tSw1, 1.3, 659.25, 0.28);
      addLightSweepShimmer(tSw2, 1.3, 880.0, 0.26);
    } else if (envMode === "promo") {
      addStudioMusicBed([110.0, 164.81, 220.0], 0.12, 124, 0.16);
      addStereoWhoosh(tHeroStart, 0.85, 0.38, -0.8, 0.8, 250, 2400);
      addCinematicImpact(tHeroLand, 0.85, 170, 36, 0.58);
      addLightSweepShimmer(tSw1, 1.0, 587.33, 0.30);
      addLightSweepShimmer(tSw2, 1.0, 783.99, 0.30);
    } else if (envMode === "character") {
      addStudioMusicBed([65.41, 98.0, 146.83, 196.0], 0.17, 72, 0.05);
      addStereoWhoosh(tHeroStart, 1.5, 0.34, -0.4, 0.4, 140, 950);
      addCinematicImpact(tHeroLand, 1.3, 95, 32, 0.56);
      addLightSweepShimmer(tSw1, 1.4, 523.25, 0.24);
      addLightSweepShimmer(tSw2, 1.4, 659.25, 0.24);
    } else {
      /* commercial (default): polished modern TVC / Reels commercial sound design */
      addStudioMusicBed([130.81, 164.81, 196.0, 246.94], 0.13, 112, 0.11);
      addStereoWhoosh(tHeroStart, 1.0, 0.34, -0.6, 0.6, 220, 1900);
      addCinematicImpact(tHeroLand, 0.75, 135, 42, 0.46);
      addLightSweepShimmer(tSw1, 1.1, 659.25, 0.28);
      addLightSweepShimmer(tSw2, 1.1, 880.0, 0.28);
    }

    /* Synced 1-by-1 Text SFX matching exact v2.60 _TEXT_MOTIONS sequence! */
    var seqKeys = ["popup", "typewriter", "left", "right", "slam", "glitch"];
    for (var ti = 0; ti < nTexts; ti++) {
      var ts = tTextStart + ti * textSlot;
      var mk = seqKeys[ti % seqKeys.length];
      if (mk === "popup") {
        addModernPop(ts, 0.42, (ti % 2 === 0 ? -0.2 : 0.2));
      } else if (mk === "typewriter") {
        addMechanicalTypewriter(ts, textSlot * 0.82, Math.max(5, Math.min(10, Math.round(textSlot * 9))), 0.30);
      } else if (mk === "left") {
        addStereoWhoosh(ts, Math.min(0.45, textSlot * 0.7), 0.32, -0.9, 0.2, 300, 2200);
        addModernPop(ts + 0.14, 0.22, 0.1);
      } else if (mk === "right") {
        addStereoWhoosh(ts, Math.min(0.45, textSlot * 0.7), 0.32, 0.9, -0.2, 300, 2200);
        addModernPop(ts + 0.14, 0.22, -0.1);
      } else if (mk === "slam") {
        addStereoWhoosh(ts, 0.25, 0.26, 0, 0, 500, 1800);
        addCinematicImpact(ts + 0.16, 0.35, 140, 48, 0.32);
      } else {
        addGlitchZap(ts, Math.min(0.32, textSlot * 0.6), 0.26);
      }
    }

    /* 4-Tap Stereo Room Reverb (gives lush studio depth instead of dry flat sound!) */
    var taps = [
      { d: Math.round(0.029 * sr), g: 0.22 },
      { d: Math.round(0.053 * sr), g: 0.16 },
      { d: Math.round(0.089 * sr), g: 0.11 },
      { d: Math.round(0.137 * sr), g: 0.07 }
    ];
    for (var ri = 0; ri < totalSamples; ri++) {
      var revL = 0, revR = 0;
      for (var k = 0; k < taps.length; k++) {
        var di = ri - taps[k].d;
        if (di >= 0) {
          revL += R[di] * taps[k].g;
          revR += L[di] * taps[k].g;
        }
      }
      L[ri] += revL;
      R[ri] += revR;
    }

    /* Mastering Soft-Limiter -> 44.1kHz Stereo 16-bit PCM WAV */
    var dataBytes = totalSamples * 4;
    var buf = Buffer.alloc(44 + dataBytes);
    buf.write("RIFF", 0);
    buf.writeUInt32LE(36 + dataBytes, 4);
    buf.write("WAVE", 8);
    buf.write("fmt ", 12);
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20);
    buf.writeUInt16LE(2, 22);
    buf.writeUInt32LE(sr, 24);
    buf.writeUInt32LE(sr * 4, 28);
    buf.writeUInt16LE(4, 32);
    buf.writeUInt16LE(16, 34);
    buf.write("data", 36);
    buf.writeUInt32LE(dataBytes, 40);
    var off = 44;
    for (var j = 0; j < totalSamples; j++) {
      var sl = Math.tanh(L[j] * 1.15);
      var srV = Math.tanh(R[j] * 1.15);
      buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(sl * 32000))), off);
      buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(srV * 32000))), off + 2);
      off += 4;
    }
    return buf;
  }

  function findFFmpegBinary(fsMod, pathMod) {
    var cp = null;
    try { cp = require("child_process"); } catch (e) { return null; }
    var candidates = ["ffmpeg"];
    if (process.platform === "win32") {
      candidates.push(
        "C:\\ffmpeg\\bin\\ffmpeg.exe",
        "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
        "C:\\ProgramData\\chocolatey\\bin\\ffmpeg.exe"
      );
      if (process.env && process.env.LOCALAPPDATA) {
        candidates.push(pathMod.join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Links", "ffmpeg.exe"));
      }
    } else {
      candidates.push("/usr/local/bin/ffmpeg", "/opt/homebrew/bin/ffmpeg", "/usr/bin/ffmpeg");
    }
    for (var i = 0; i < candidates.length; i++) {
      var bin = candidates[i];
      if (bin !== "ffmpeg" && fsMod && !fsMod.existsSync(bin)) continue;
      try {
        cp.execFileSync(bin, ["-version"], { stdio: "ignore", timeout: 2500 });
        return bin;
      } catch (eT) {}
    }
    return null;
  }

  if ($("exportAnimVideo")) $("exportAnimVideo").addEventListener("click", function () {
    setStatus("Checking animation frames…");
    cs.evalScript("auraExportAnimFrames()", function (res) {
      try {
        var s = (res == null) ? "" : String(res);
        if (s.indexOf("FRAMES:") !== 0) { setStatus(s || "Error: Run 1-Click Auto Animate Poster first.", "err"); return; }
        var parts = s.substring(7).split("||");
        var dir = parts[0];
        var count = parseInt(parts[1], 10) || 48;
        var outFps = 24;
        var uiDur = ($("animDuration") ? parseFloat($("animDuration").value) : 0);
        var durationSec = Math.max(3, Math.min(20, uiDur || parseFloat(parts[4]) || 10));

        var fsMod = null, pathMod = null, osMod = null, cpMod = null;
        try { fsMod = require("fs"); pathMod = require("path"); osMod = require("os"); cpMod = require("child_process"); } catch (eR) {}
        if (!fsMod) {
          setStatus("Exported " + count + " frames to " + dir, "ok");
          return;
        }
        if (count < 2) {
          setStatus("Error: Only 1 frame found. Click '1-Click Auto Animate Poster' first!", "err");
          return;
        }

        /* Tier 1: Check FFmpeg for 100% Universal H.264 MP4 (yuv420p — works on FB, IG, WhatsApp, Mobile, Premiere, Windows!) */
        var ffmpegBin = findFFmpegBinary(fsMod, pathMod);

        /* Tier 2: Check Native Chromium MediaRecorder H.264 MP4 -> fallback VP8/H264 WebM */
        var mime = "video/webm";
        var ext = ".webm";
        if (ffmpegBin) {
          ext = ".mp4";
          mime = "video/mp4";
        } else if (typeof MediaRecorder !== "undefined") {
          if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.42E01E")) { mime = "video/mp4;codecs=avc1.42E01E"; ext = ".mp4"; }
          else if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) { mime = "video/mp4;codecs=avc1"; ext = ".mp4"; }
          else if (MediaRecorder.isTypeSupported("video/mp4")) { mime = "video/mp4"; ext = ".mp4"; }
          else if (MediaRecorder.isTypeSupported("video/webm;codecs=h264")) { mime = "video/webm;codecs=h264"; ext = ".webm"; }
          else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) { mime = "video/webm;codecs=vp8"; ext = ".webm"; }
          else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) { mime = "video/webm;codecs=vp9"; ext = ".webm"; }
        }

        /* Open native Windows/Mac Save As dialog IMMEDIATELY */
        var defaultDir = pathMod.join(osMod.homedir(), "Desktop");
        var defaultName = "Design360n_Animation_" + Date.now() + ext;
        var targetPath = pathMod.join(defaultDir, defaultName);

        if (window.cep && window.cep.fs && typeof window.cep.fs.showSaveDialogEx === "function") {
          setStatus("Choose folder & file name to save " + ext.toUpperCase() + " video…");
          var initDirForward = defaultDir.replace(/\\/g, "/");
          var dlg = window.cep.fs.showSaveDialogEx(
            "Save Universal Video (" + ext.toUpperCase() + ")",
            initDirForward,
            [ext.replace(".", "")],
            defaultName,
            "Video File (" + ext.toUpperCase() + ")"
          );
          if (!dlg || dlg.err !== 0 || !dlg.data) {
            setStatus("Video export cancelled.");
            return;
          }
          targetPath = dlg.data;
          if (targetPath.toLowerCase().slice(-ext.length) !== ext.toLowerCase()) targetPath += ext;
        }

        /* Resolve Environment SFX mode (auto matches Animation Style Preset) */
        var rawEnv = $("animSfxEnv") ? $("animSfxEnv").value : "auto";
        var sfxMode = (rawEnv === "auto") ? ($("animStyle") ? $("animStyle").value : "commercial") : rawEnv;
        if (sfxMode === "minimal") sfxMode = "promo";
        var sfxWavPath = null;
        var sfxWavBuf = null;
        if (sfxMode !== "none") {
          try {
            setStatus("Synthesizing " + sfxMode + " SFX audio (" + durationSec + "s)…");
            var textCount = parseInt(parts[5], 10) || 4;
            sfxWavBuf = buildEnvironmentSfxWav(durationSec, sfxMode, textCount);
            sfxWavPath = pathMod.join(dir, "sfx_track.wav");
            fsMod.writeFileSync(sfxWavPath, sfxWavBuf);
          } catch (eSfx) { sfxWavPath = null; sfxWavBuf = null; }
        }

        /* Fast path: FFmpeg direct universal H.264 MP4 + Stereo AAC SFX (yuv420p + faststart) */
        if (ffmpegBin && cpMod) {
          setStatus("Encoding Universal H.264 MP4 + SFX (" + durationSec + "s, 24 FPS)…");
          var animDur = Math.max(2.0, durationSec * 0.80);
          var holdDur = Math.max(0.5, durationSec - animDur);
          var inFps = (count / animDur).toFixed(3);
          var inputPattern = pathMod.join(dir, "frame_%03d.jpg");
          var vf = "scale=trunc(iw/2)*2:trunc(ih/2)*2,tpad=stop_mode=clone:stop_duration=" + holdDur.toFixed(2);
          var args = [
            "-y",
            "-framerate", String(inFps),
            "-i", inputPattern
          ];
          if (sfxWavPath && fsMod.existsSync(sfxWavPath)) {
            args.push("-i", sfxWavPath);
          }
          args.push(
            "-vf", vf,
            "-r", String(outFps),
            "-c:v", "libx264",
            "-profile:v", "baseline",
            "-level", "3.1",
            "-pix_fmt", "yuv420p"
          );
          if (sfxWavPath && fsMod.existsSync(sfxWavPath)) {
            args.push("-c:a", "aac", "-b:a", "192k", "-shortest");
          }
          args.push("-movflags", "+faststart", "-crf", "18", targetPath);
          cpMod.execFile(ffmpegBin, args, { timeout: 120000 }, function (err) {
            if (!err && fsMod.existsSync(targetPath)) {
              setStatus("Universal H.264 MP4 saved (" + durationSec + "s) -> " + targetPath, "ok");
              try {
                if (process.platform === "win32") cpMod.exec('explorer /select,"' + targetPath.replace(/\//g, "\\") + '"');
                else if (process.platform === "darwin") cpMod.exec('open -R "' + targetPath + '"');
              } catch (eEx0) {}
              return;
            }
            /* Fallback to MediaRecorder if FFmpeg errored */
            startCanvasEncode();
          });
          return;
        }

        function startCanvasEncode() {
          if (typeof MediaRecorder === "undefined") {
            setStatus("Error: MediaRecorder unavailable and FFmpeg not installed.", "err");
            return;
          }
          var imgs = [];
          function loadNext(idx) {
            try {
              if (idx > count) { runEncode(); return; }
              setStatus("Loading frame " + idx + "/" + count + "…");
              var pad = (idx < 10 ? "00" : idx < 100 ? "0" : "") + idx;
              var fp = pathMod.join(dir, "frame_" + pad + ".jpg");
              if (!fsMod.existsSync(fp)) { loadNext(idx + 1); return; }
              var img = new Image();
              img.onload = function () { imgs.push(img); loadNext(idx + 1); };
              img.onerror = function () { loadNext(idx + 1); };
              img.src = "data:image/jpeg;base64," + fsMod.readFileSync(fp).toString("base64");
            } catch (eL) {
              setStatus("Error loading frame " + idx + ": " + eL.message, "err");
            }
          }

          function runEncode() {
            try {
              if (imgs.length < 2) { setStatus("Error: Not enough frames loaded (" + imgs.length + ").", "err"); return; }
              var cv = document.createElement("canvas");
              cv.width = Math.min(1080, imgs[0].width);
              cv.height = Math.round(cv.width * (imgs[0].height / imgs[0].width));
              if (cv.width % 2 !== 0) cv.width--;
              if (cv.height % 2 !== 0) cv.height--;
              cv.style.cssText = "position:fixed;left:-9999px;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none;";
              document.body.appendChild(cv);

              var ctx = cv.getContext("2d");
              ctx.drawImage(imgs[0], 0, 0, cv.width, cv.height);

              var stream = cv.captureStream(outFps);
              var vTrack = stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
              var audioCtx = null, audioSrc = null;
              var combinedStream = stream;
              if (sfxWavBuf && (typeof AudioContext !== "undefined" || typeof webkitAudioContext !== "undefined")) {
                try {
                  var AC = window.AudioContext || window.webkitAudioContext;
                  audioCtx = new AC();
                  var dest = audioCtx.createMediaStreamDestination();
                  var ab = sfxWavBuf.buffer.slice(sfxWavBuf.byteOffset, sfxWavBuf.byteOffset + sfxWavBuf.byteLength);
                  audioCtx.decodeAudioData(ab, function (decoded) {
                    try {
                      audioSrc = audioCtx.createBufferSource();
                      audioSrc.buffer = decoded;
                      audioSrc.connect(dest);
                      audioSrc.start(0);
                    } catch (eAS) {}
                  }, function () {});
                  var aTracks = dest.stream.getAudioTracks();
                  if (vTrack && aTracks && aTracks.length > 0) {
                    combinedStream = new MediaStream([vTrack, aTracks[0]]);
                  }
                } catch (eAC) {}
              }
              var recOpts = { videoBitsPerSecond: 6000000 };
              try { if (MediaRecorder.isTypeSupported(mime)) recOpts.mimeType = mime; } catch (eMT) {}
              var rec = new MediaRecorder(combinedStream, recOpts);
              var chunks = [];
              var totalTicks = Math.max(outFps * 3, Math.round(durationSec * outFps));
              var animTicks = Math.max(imgs.length, Math.round(totalTicks * 0.80));

              rec.ondataavailable = function (ev) { if (ev.data && ev.data.size > 0) chunks.push(ev.data); };
              rec.onerror = function (ev) {
                try { if (cv.parentNode) cv.parentNode.removeChild(cv); } catch (eRm1) {}
                setStatus("Error recording video: " + (ev && ev.error ? ev.error.message : "MediaRecorder error"), "err");
              };
              rec.onstop = function () {
                try { if (cv.parentNode) cv.parentNode.removeChild(cv); } catch (eRmC) {}
                try { if (audioSrc) audioSrc.stop(); if (audioCtx) audioCtx.close(); } catch (eRmA) {}
                var blob = new Blob(chunks, { type: mime });
                var reader = new FileReader();
                reader.onloadend = function () {
                  try {
                    var buf = Buffer.from(reader.result);
                    fsMod.writeFileSync(targetPath, buf);
                    var durSec = (totalTicks / outFps).toFixed(1);
                    setStatus("Video saved (" + durSec + "s " + ext.toUpperCase() + ") -> " + targetPath, "ok");
                    try {
                      if (process.platform === "win32") cpMod.exec('explorer /select,"' + targetPath.replace(/\//g, "\\") + '"');
                      else if (process.platform === "darwin") cpMod.exec('open -R "' + targetPath + '"');
                    } catch (eEx) {}
                  } catch (eW) {
                    setStatus("Error saving video: " + eW.message, "err");
                  }
                };
                reader.readAsArrayBuffer(blob);
              };

              var tick = 0;
              var intervalMs = Math.round(1000 / outFps);
              rec.start(100);

              function drawStep() {
                if (tick >= totalTicks) {
                  setStatus("Finalizing " + durationSec + "s video file…");
                  setTimeout(function () { try { rec.stop(); } catch (eS) {} }, 250);
                  return;
                }
                if (tick % 6 === 0) setStatus("Recording " + durationSec + "s video — " + Math.round((tick / totalTicks) * 100) + "%…");
                var frameIdx = (tick < animTicks)
                  ? Math.min(imgs.length - 1, Math.floor((tick / animTicks) * imgs.length))
                  : (imgs.length - 1);
                ctx.drawImage(imgs[frameIdx], 0, 0, cv.width, cv.height);
                ctx.fillStyle = (tick % 2 === 0) ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)";
                ctx.fillRect(0, 0, 1, 1);
                if (vTrack && typeof vTrack.requestFrame === "function") {
                  try { vTrack.requestFrame(); } catch (eRF) {}
                }
                tick++;
                setTimeout(drawStep, intervalMs);
              }
              setTimeout(drawStep, 60);
            } catch (eEnc) {
              setStatus("Error encoding video: " + eEnc.message, "err");
            }
          }
          loadNext(1);
        }
        startCanvasEncode();
      } catch (eOuter) {
        setStatus("Error exporting video: " + eOuter.message, "err");
      }
    });
  });
  if ($("exportAnimGIF")) $("exportAnimGIF").addEventListener("click", function () { run("auraExportGIF()", "GIF exported."); });

  /* ---- Free Assets & PNG Hub ---- */
  var resBtns = document.querySelectorAll(".res-btn");
  for (var ri = 0; ri < resBtns.length; ri++) {
    resBtns[ri].addEventListener("click", function () {
      var q = ($("assetQuery") ? ($("assetQuery").value || "").trim() : "");
      var base = this.getAttribute("data-url");
      var sBase = this.getAttribute("data-search");
      var url = (q && sBase && sBase !== base) ? (sBase + encodeURIComponent(q)) : base;
      cs.openURLInDefaultBrowser(url);
      setStatus("Opened " + (this.querySelector("b") ? this.querySelector("b").textContent : url) + " in browser.", "ok");
    });
  }
  if ($("placeAssetFile")) $("placeAssetFile").addEventListener("click", function () { run("auraPlaceFile()", "File placed."); });

  /* ---- Quick Designer Tools ---- */
  if ($("utilCenter")) $("utilCenter").addEventListener("click", function () { run("auraCenterLayer()", "Layer centered."); });
  if ($("utilFit")) $("utilFit").addEventListener("click", function () { run("auraFitCanvas()", "Layer fitted to canvas."); });
  if ($("utilPlace")) $("utilPlace").addEventListener("click", function () { run("auraPlaceFile()", "File placed."); });
  if ($("utilExportPNG")) $("utilExportPNG").addEventListener("click", function () { run("auraQuickExportPNG()", "PNG exported."); });
  if ($("utilPalette")) $("utilPalette").addEventListener("click", function () {
    setStatus("Extracting palette…");
    cs.evalScript("auraExtractPalette()", function (res) {
      var s = (res == null) ? "" : String(res);
      if (s.indexOf("PALETTE:") === 0) {
        var cols = s.substring(8).split(",");
        var row = $("palRow");
        if (row) {
          row.innerHTML = "";
          cols.forEach(function (hx) {
            var b = document.createElement("button");
            b.type = "button"; b.className = "pal-chip";
            b.style.background = hx; b.textContent = hx; b.title = "Click to copy " + hx;
            b.addEventListener("click", function () {
              try { navigator.clipboard.writeText(hx); } catch (e) {}
              setStatus("Copied " + hx + " to clipboard!", "ok");
            });
            row.appendChild(b);
          });
        }
        setStatus("Extracted " + cols.length + " colors from photo.", "ok");
      } else {
        setStatus(s || "Error: Could not extract palette.", "err");
      }
    });
  });

  /* Auto-Track Move: when Glass view is open & toggle ON, moving the "Glass" layer auto-refreshes background */
  var _glassBusy = false;
  setInterval(function () {
    if (_glassBusy) return;
    var gv = $("view-glass");
    if (!gv || gv.style.display !== "block") return;
    if (!$("glassAutoMove") || !$("glassAutoMove").checked) return;
    cs.evalScript("auraCheckGlassMoved()", function (res) {
      if (String(res).trim() === "MOVED" && !_glassBusy) {
        _glassBusy = true;
        setStatus("Glass moved — updating background…");
        cs.evalScript("auraRefreshGlass(" + frost.value + ", " + glassOpts() + ")", function (r2) {
          _glassBusy = false;
          var s = (r2 == null) ? "" : String(r2);
          if (s.indexOf("OK:") === 0) setStatus(s.substring(3).trim(), "ok");
          else if (s) setStatus(s, "err");
        });
      }
    });
  }, 900);

  /* Live JSX version check */
  cs.evalScript("auraVersion()", function (res) {
    var v = (res == null) ? "" : String(res).trim();
    if (v === PANEL_VERSION) {
      setStatus("Design360n v" + PANEL_VERSION + " ready — engine verified.", "ok");
    } else if (v && v !== "EvalScript error." && v !== "undefined") {
      setStatus("Warning: Version mismatch (Panel v" + PANEL_VERSION + " vs JSX v" + v + "). Re-run Install.bat with Photoshop closed.", "err");
    } else {
      setStatus("Design360n v" + PANEL_VERSION + " loaded.");
    }
  });

  /* AI & Pro Upscaler (v2.75) */
  if ($("upSharp")) $("upSharp").addEventListener("input", function () { $("v-upsharp").textContent = this.value; });
  if ($("upNoise")) $("upNoise").addEventListener("input", function () { $("v-upnoise").textContent = this.value; });
  if ($("runUpscalePro")) $("runUpscalePro").addEventListener("click", function () {
    var o = "{scale:" + $("upScale").value +
      ", mode:'" + $("upMode").value + "'" +
      ", sharp:" + $("upSharp").value +
      ", noise:" + $("upNoise").value +
      ", grain:" + $("upGrain").checked + "}";
    run("auraUpscalePro(" + o + ")", "Pro Upscale complete!");
  });
  var upKeyIn = $("upGeminiKey");
  if (upKeyIn) {
    try { upKeyIn.value = localStorage.getItem("design360n_gemini_key") || ""; } catch (eUK) {}
    upKeyIn.addEventListener("input", function () {
      var v = upKeyIn.value.trim();
      try { localStorage.setItem("design360n_gemini_key", v); } catch (eUK2) {}
      if ($("geminiApiKey")) $("geminiApiKey").value = v;
    });
  }
  if ($("runUpscaleGemini")) $("runUpscaleGemini").addEventListener("click", function () {
    var apiKey = "";
    try { apiKey = (localStorage.getItem("design360n_gemini_key") || "").trim(); } catch (eK) {}
    if (!apiKey) {
      setStatus("Age 'Photo Expand Pro'-te apnar Gemini API Key save korun, ba '1-Click Pro Upscale (Offline)' use korun!", "err");
      return;
    }
    var scaleVal = $("upScale").value;
    var o = "{scale:" + scaleVal +
      ", mode:'" + $("upMode").value + "'" +
      ", sharp:" + Math.round(Number($("upSharp").value) * 0.65) +
      ", noise:" + $("upNoise").value +
      ", grain:" + $("upGrain").checked + "}";

    setStatus("Step 1/3: Exporting clean photo for Gemini AI Super-Resolution…");
    cs.evalScript("auraExportTempCanvas()", function (expRes) {
      var sRes = String(expRes || "");
      if (sRes.indexOf("PATH:") !== 0) { setStatus(sRes || "Error exporting canvas.", "err"); return; }
      var tmpPath = sRes.substring(5);
      var fsMod = null;
      try { fsMod = require("fs"); } catch (eF) {}
      if (!fsMod || !fsMod.existsSync(tmpPath)) { setStatus("Error: Temp PNG not found.", "err"); return; }

      setStatus("Step 2/3: Reconstructing ultra-sharp 4K details with Gemini AI…");
      var b64 = fsMod.readFileSync(tmpPath).toString("base64");
      var promptText = "Ultra-high-resolution AI photo restoration and deblurring: dramatically restore crisp facial details, sharp eyes, natural skin pores, individual hair strands, clean fabric/product texture, and razor-sharp edges while keeping the EXACT same person, face identity, pose, colors, background, and layout. Photorealistic 4K studio quality, zero blur, zero artifacts.";
      var isVertexExpress = apiKey.indexOf("AQ.") === 0;
      var url = isVertexExpress
        ? ("https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-image:generateContent?key=" + encodeURIComponent(apiKey))
        : ("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=" + encodeURIComponent(apiKey));

      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [
            { text: promptText },
            { inlineData: { mimeType: "image/png", data: b64 } }
          ]}],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] }
        })
      }).then(function (r) { return r.json(); }).then(function (data) {
        if (data && data.error) {
          setStatus("Gemini API Error: " + (data.error.message || JSON.stringify(data.error)), "err");
          return;
        }
        var parts = (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
        var outB64 = null;
        for (var i = 0; i < parts.length; i++) {
          if (parts[i].inlineData && parts[i].inlineData.data) { outB64 = parts[i].inlineData.data; break; }
        }
        if (!outB64) {
          setStatus("Gemini returned no image (try Offline Pro Upscale).", "err");
          return;
        }
        var outPath = tmpPath.replace(/\.png$/i, "_ai_upscaled.png");
        fsMod.writeFileSync(outPath, Buffer.from(outB64, "base64"));
        var escPath = outPath.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        setStatus("Step 3/3: Placing AI-restored photo & scaling " + scaleVal + "x…");
        cs.evalScript('auraPlaceTempAIResult("' + escPath + '", "Gemini AI Restored")', function (pRes) {
          if (String(pRes || "").indexOf("Error:") === 0) { setStatus(pRes, "err"); return; }
          cs.evalScript("auraUpscalePro(" + o + ")", function (upRes) {
            setStatus(upRes || "Gemini AI 4K Upscale complete!", String(upRes || "").indexOf("Error:") === 0 ? "err" : "ok");
          });
        });
      }).catch(function (err) {
        setStatus("Gemini AI network error: " + err.message, "err");
      });
    });
  });


  /* Home live tool search filter (v2.75) */
  if ($("homeSearch")) {
    $("homeSearch").addEventListener("input", function () {
      var q = this.value.trim().toLowerCase();
      var secs = document.querySelectorAll("[data-catsec]");
      for (var s = 0; s < secs.length; s++) {
        var cList = secs[s].querySelectorAll(".card");
        var vis = 0;
        for (var i = 0; i < cList.length; i++) {
          var txt = (cList[i].textContent || "").toLowerCase();
          var show = !q || txt.indexOf(q) !== -1;
          cList[i].style.display = show ? "" : "none";
          if (show) vis++;
        }
        secs[s].style.display = vis > 0 ? "" : "none";
      }
    });
  }

})();
