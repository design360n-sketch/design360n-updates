/* Design360n Workstation v17.7.20 — Advanced Brand Identity Kit Studio
 * Select ANY logo in Illustrator (or upload one) -> auto-extract brand colors ->
 * 1-Click generate a complete multi-artboard Agency Brand Identity Kit
 * (Cover & Logo Variations, Color/HEX/CMYK & Typography, Business Card,
 * Letterhead A4, DL Envelope, ID Card, Social Media Kit & Bento Brand Board)! */
(function (global) {
  "use strict";

  var csInterface = (typeof CSInterface !== "undefined") ? new CSInterface() : null;

  function hexToRgb(hex) {
    var h = String(hex || "#0ea5e9").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16) || 0;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToCmykStr(hex) {
    var rgb = hexToRgb(hex);
    var r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    var k = 1 - Math.max(r, g, b);
    if (k >= 0.999) return "C0 M0 Y0 K100";
    var c = Math.round(((1 - r - k) / (1 - k)) * 100);
    var m = Math.round(((1 - g - k) / (1 - k)) * 100);
    var y = Math.round(((1 - b - k) / (1 - k)) * 100);
    var kp = Math.round(k * 100);
    return "C" + c + " M" + m + " Y" + y + " K" + kp;
  }

  function escJSX(obj) {
    var json = JSON.stringify(obj).replace(/[\u007F-\uFFFF]/g, function (ch) {
      return "\\u" + ("0000" + ch.charCodeAt(0).toString(16)).slice(-4);
    });
    return json.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  /* --- Online Mockups (Brand Kit Pro — brand-wise real photos) ---
   * Source: Openverse API (api.openverse.org) — CC-licensed images, no API
   * key, commercial use allowed (license_type=commercial). Query chains
   * prefer FLAT / FRONT-ON photos ("business card flat", "flat lay …",
   * "… front") so the user's logo can be stamped on straight, without
   * perspective warp (Illustrator scripting cannot warp — see the stamp
   * rules in dmGenerateBrandKitAI). Every chain below was verified live
   * 2026-11-25 — each first query returns results, and the generic
   * queries stay as fallbacks. Photos download at RUNTIME into the OS
   * temp folder and reach the JSX as local file paths. Nothing binary
   * ships in the auto-update. If offline or a download fails, sheets
   * still build vector-only. */
  var BK_MOCKUP_API = "https://api.openverse.org/v1/images/";
  var BK_MOCKUP_CATS = ["stationery", "signage", "packaging", "bag", "apparel", "cup", "social", "laptop", "phone", "billboard"];
  var BK_MOCKUPS = {
    stationery: { label: "Stationery", queries: ["business card flat", "flat lay stationery", "envelope flat lay", "stationery mockup", "business card mockup", "letterhead mockup"] },
    signage: { label: "Signage", queries: ["front signage", "signage", "shop sign", "storefront sign mockup"] },
    packaging: { label: "Packaging", queries: ["product box flat", "flat lay packaging", "packaging mockup", "product box mockup"] },
    bag: { label: "Bag / Tote", queries: ["flat lay bag", "tote bag flat", "shopping bag mockup", "tote bag mockup"] },
    apparel: { label: "Apparel / Tee", queries: ["t-shirt flat", "flat lay t-shirt", "t-shirt mockup", "apparel mockup"] },
    cup: { label: "Cup / Mug", queries: ["coffee cup flat lay", "mug flat lay", "coffee cup mockup", "mug mockup"] },
    social: { label: "Social Post", queries: ["social media mockup", "instagram post mockup"] },
    laptop: { label: "Laptop / Web", queries: ["laptop flat lay", "laptop mockup", "website mockup"] },
    phone: { label: "Phone / App", queries: ["smartphone flat lay", "smartphone mockup", "mobile app mockup"] },
    billboard: { label: "Billboard", queries: ["billboard front", "poster flat", "billboard mockup", "poster mockup"] }
  };
  /* Zones each template actually uses (Auto mode fetches only these). */
  var BK_TEMPLATE_ZONES = {
    bento_dark: ["packaging", "cup"],
    swiss_corp: ["signage", "bag", "packaging", "apparel"],
    editorial_warm: ["signage", "cup", "apparel"],
    bold_retail: ["cup", "bag", "signage", "packaging"],
    book_10: ["stationery", "phone", "social", "packaging", "bag", "signage", "apparel", "billboard", "laptop"]
  };
  /* --- Brand-aware template suggestion (never forces a choice) ---
   * Only words the USER typed (industry / personality fields) are matched,
   * token by token — nothing is invented. Returns the matching template
   * entry or null. */
  var BK_TEMPLATE_SUGGEST = [
    { tpl: "editorial_warm", name: "Warm Editorial", reason: "coffee/food brand er warm, premium look", words: ["coffee", "food", "restaurant", "cafe", "bakery", "tea", "juice", "snack", "kitchen", "sweet", "dessert", "spice", "catering", "hotel", "resort", "chocolate", "pizza", "burger"] },
    { tpl: "swiss_corp", name: "Swiss Minimal Corporate", reason: "tech/corporate brand er clean, minimal look", words: ["tech", "software", "app", "digital", "ai", "startup", "corporate", "finance", "bank", "law", "consult", "estate", "education", "medical", "pharma", "logistics", "saas"] },
    { tpl: "bold_retail", name: "Bold Retail", reason: "fashion/retail brand er bold, vibrant look", words: ["fashion", "retail", "shop", "store", "boutique", "beauty", "cosmetic", "jewelry", "jewellery", "clothing", "apparel", "lifestyle", "ecommerce", "gift"] },
    { tpl: "bento_dark", name: "Bento Dark", reason: "agency/creative brand er modern bento look", words: ["agency", "creative", "studio", "design", "marketing", "media", "art", "branding", "photography", "event", "production"] }
  ];
  function bkTokens(s) {
    return (" " + String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ") + " ").split(" ").filter(Boolean);
  }
  function bkSuggestTemplate(industry, personality) {
    var toks = bkTokens((industry || "") + " " + (personality || ""));
    for (var i = 0; i < BK_TEMPLATE_SUGGEST.length; i++) {
      var s = BK_TEMPLATE_SUGGEST[i];
      for (var j = 0; j < s.words.length; j++) {
        if (toks.indexOf(s.words[j]) >= 0) return s;
      }
    }
    return null;
  }
  /* --- Mood word for mockup photos (only a word the user typed) ---
   * The first personality word that is a known mood is used to steer the
   * photo search (e.g. "luxury coffee shop packaging mockup"). If the
   * user typed no mood word, the search uses industry only. */
  var BK_MOODS = ["minimal", "luxury", "premium", "rustic", "modern", "vintage", "bold", "elegant", "playful", "clean", "warm", "dark", "bright", "natural", "organic", "classic", "royal", "soft", "fresh"];
  function bkMoodWord(personality) {
    var toks = bkTokens(personality);
    for (var i = 0; i < toks.length; i++) {
      if (BK_MOODS.indexOf(toks[i]) >= 0) return toks[i];
    }
    return "";
  }
  var bkMockupCache = {};
  var bkLastPlan = null, bkLastPdfPath = "", bkLastLogoPath = "";
  /* --- Mockup variety (v17.7.25) ---
   * DIAGNOSED REPEAT BUG (v17.7.24): the cache was keyed by CATEGORY with
   * ONE photo per category, the Generate flow only fetched categories NOT
   * already in the cache, the picker always returned the same top result
   * for a given query, and the downloader returned the existing file if
   * present — so every template and every Generate reused the exact same
   * packaging/cup/signage photo. Fixed: every Generate re-fetches ALL
   * enabled categories fresh; bkUsedUrls tracks every URL already assigned
   * in this session and the picker skips them; the fetcher paginates
   * (pages 1..4) through the whole query chain before ever repeating;
   * downloaded files are named with a URL hash so a new photo never
   * serves the stale file. Only when a category is truly exhausted may a
   * photo repeat — and the status line says so. */
  var bkUsedUrls = {};
  function bkHashStr(s) {
    var h = 0, i;
    s = String(s || "");
    for (i = 0; i < s.length; i++) { h = ((h << 5) - h + s.charCodeAt(i)) | 0; }
    return ("0000000" + (h >>> 0).toString(16)).slice(-8);
  }
  function bkRealisticScore(r) {
    /* Prefer REAL photography: penalise illustration / render / 3d /
     * clip-art / vector / cartoon / AI-generated titles & tags; boost
     * results that look like real mockup photography. */
    var tags = (r.tags || []).map(function (t) { return (t && t.name) ? t.name : String(t || ""); }).join(" ");
    var text = ((r.title || "") + " " + (r.description || "") + " " + tags).toLowerCase();
    var s = 0;
    /* The penalty must dwarf the pixel-count term (which can be tens of
     * millions) — otherwise a huge render still beats a real photo. */
    if (/illustration|render|3d model|clip ?art|vector|cartoon|drawing|painting|ai[- ]?generated|digital art|computer generated|cgi/.test(text)) s -= 50000000;
    if (/photo|photograph|mockup|real/.test(text)) s += 150000;
    return s;
  }
  var bkMockupBusy = false;
  var bkPlanFn = null;
  var bkLogoFilePath = "";
  var bkLogoFileName = "";
  var bkLogoToneCurrent = "";

  function bkNode() {
    try {
      if (typeof require !== "function") return null;
      return { fs: require("fs"), path: require("path"), os: require("os") };
    } catch (e) { return null; }
  }
  function bkTempDir() {
    var n = bkNode();
    if (!n) return null;
    try {
      var dir = n.path.join(n.os.tmpdir(), "Design360n_BrandKit_Mockups");
      if (!n.fs.existsSync(dir)) n.fs.mkdirSync(dir);
      return dir;
    } catch (e) { return null; }
  }
  function bkFetchJSON(url, timeoutMs) {
    return new Promise(function (resolve) {
      var done = false;
      var timer = setTimeout(function () { if (!done) { done = true; resolve(null); } }, timeoutMs || 12000);
      fetch(url).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (!done) { done = true; clearTimeout(timer); resolve(j); }
      }).catch(function () { if (!done) { done = true; clearTimeout(timer); resolve(null); } });
    });
  }
  function bkUsableImage(r) {
    if (!r || !r.url) return false;
    return /\.(jpe?g|png)(\?|#|$)/i.test(r.url);
  }
  function bkPickBest(results, exclude) {
    /* exclude: map of URLs already used elsewhere this session — a photo
     * may be picked only once per generation. Realism (bkRealisticScore)
     * is scored alongside the existing flat/front-on, landscape, largest,
     * CC0/pdm rules. */
    var usable = (results || []).filter(function (r) { return bkUsableImage(r) && !(exclude && exclude[r.url]); });
    if (usable.length === 0) return null;
    function score(r) {
      var s = (r.width || 0) * (r.height || 0);
      if ((r.width || 0) >= (r.height || 0)) s += 1000000;
      if (r.license === "cc0" || r.license === "pdm") s += 500000;
      if (/flat|front view|straight|overhead/i.test(r.title || "")) s += 300000;
      s += bkRealisticScore(r);
      return s;
    }
    usable.sort(function (a, b) { return score(b) - score(a); });
    return usable[0];
  }
  function bkQueryURL(q, page) {
    return BK_MOCKUP_API + "?q=" + encodeURIComponent(q) + "&page_size=8&license_type=commercial&page=" + (page || 1);
  }
  function bkFetchCategory(cat, industry, mood, page, done, exclude) {
    /* Fetches ONE distinct photo for a category: walks the query chain
     * (mood + industry + query, industry + query, bare query) and paginates
     * pages startPage..startPage+3, skipping every URL in `exclude`
     * (already used elsewhere). done(best, repeated) — repeated is true
     * only in the last-resort path below, when the category is truly
     * exhausted and a photo had to repeat rather than leave the zone
     * blank. At most 12 API attempts per category before that fallback. */
    var def = BK_MOCKUPS[cat];
    if (!def) { done(null, false); return; }
    var queries = [];
    var qi;
    for (qi = 0; qi < def.queries.length; qi++) {
      if (mood && industry) queries.push(mood + " " + industry + " " + def.queries[qi]);
      if (industry) queries.push(industry + " " + def.queries[qi]);
      queries.push(def.queries[qi]);
    }
    var startPage = page || 1, maxPage = startPage + 3, pg = startPage, i = 0, attempts = 0, triedRepeat = false;
    function tryNext() {
      if (attempts >= 12) { tryRepeat(); return; }
      if (i >= queries.length) {
        i = 0; pg++;
        if (pg > maxPage) { tryRepeat(); return; }
      }
      var q = queries[i++];
      attempts++;
      bkFetchJSON(bkQueryURL(q, pg), 12000).then(function (j) {
        var best = j ? bkPickBest(j.results, exclude) : null;
        if (best) done(best, false);
        else tryNext();
      });
    }
    function tryRepeat() {
      /* Last resort: allow a photo already used elsewhere rather than
       * leaving the zone blank. The caller reports it in the status. */
      if (triedRepeat) { done(null, false); return; }
      triedRepeat = true;
      i = 0; pg = startPage;
      function nextRepeat() {
        if (i >= queries.length) {
          i = 0; pg++;
          if (pg > maxPage) { done(null, false); return; }
        }
        var q = queries[i++];
        bkFetchJSON(bkQueryURL(q, pg), 12000).then(function (j) {
          var best = j ? bkPickBest(j.results, null) : null;
          if (best) done(best, true);
          else nextRepeat();
        });
      }
      nextRepeat();
    }
    tryNext();
  }
  function bkDownloadImage(url, filename, done) {
    var n = bkNode();
    var dir = bkTempDir();
    if (!n || !dir) { done(null); return; }
    var ext = /\.png(\?|#|$)/i.test(url) ? ".png" : ".jpg";
    /* v17.7.25: the URL hash in the filename stops a fresh photo from
     * serving the stale file of the same category (the old plain
     * "<cat>.jpg" name did exactly that). */
    var full = n.path.join(dir, filename + "_" + bkHashStr(url) + ext);
    if (n.fs.existsSync(full)) { done(full); return; }
    var timer = setTimeout(function () { done(null); }, 20000);
    fetch(url).then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.arrayBuffer(); }).then(function (ab) {
      clearTimeout(timer);
      try {
        var buf = (typeof Buffer !== "undefined") ? Buffer.from(ab) : new Uint8Array(ab);
        n.fs.writeFileSync(full, buf);
        done(full);
      } catch (e) { done(null); }
    }).catch(function () { clearTimeout(timer); done(null); });
  }
  /* --- Photo / logo tone sampling (for the stamp variant rule) ---
   * The JSX stamps the right logo variant per background: reversed-white
   * on dark/busy photos, primary on light ones. The tone is measured here
   * in the panel (canvas sampling of the central area where the logo will
   * sit) and passed to the JSX per category. Any failure defaults to
   * "busy" — the safe choice (reversed-white + scrim). */
  function bkToneFromPixels(data, w, h) {
    var x0 = Math.floor(w * 0.25), x1 = Math.ceil(w * 0.75);
    var y0 = Math.floor(h * 0.25), y1 = Math.ceil(h * 0.75);
    var n = 0, sum = 0, sumSq = 0, x, y, i, a, lum;
    for (y = y0; y < y1; y += 2) {
      for (x = x0; x < x1; x += 2) {
        i = (y * w + x) * 4; a = data[i + 3];
        if (a < 128) continue;
        lum = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
        sum += lum; sumSq += lum * lum; n++;
      }
    }
    if (n < 20) return "busy";
    var mean = sum / n, sd = Math.sqrt(Math.max(0, sumSq / n - mean * mean));
    if (sd > 0.22) return "busy";
    if (mean < 0.5) return "dark";
    if (mean > 0.65) return "light";
    return "busy";
  }
  function bkSampleImageTone(dataUrl, done) {
    try {
      var img = new Image();
      img.onload = function () {
        try {
          var cv = document.createElement("canvas");
          var w = img.naturalWidth || img.width || 1, h = img.naturalHeight || img.height || 1;
          var sc = Math.min(1, 120 / Math.max(w, h));
          cv.width = Math.max(1, Math.round(w * sc)); cv.height = Math.max(1, Math.round(h * sc));
          var cx = cv.getContext("2d");
          cx.drawImage(img, 0, 0, cv.width, cv.height);
          var d = cx.getImageData(0, 0, cv.width, cv.height).data;
          done(bkToneFromPixels(d, cv.width, cv.height));
        } catch (e) { done("busy"); }
      };
      img.onerror = function () { done("busy"); };
      img.src = dataUrl;
    } catch (e) { done("busy"); }
  }
  function bkFileToDataUrl(localPath, done) {
    var n = bkNode();
    if (!n) { done(null); return; }
    try {
      var buf = n.fs.readFileSync(localPath);
      if (typeof Buffer === "undefined" || !buf) { done(null); return; }
      var ext = /\.png(\?|#|$)/i.test(localPath) ? "image/png" : "image/jpeg";
      done("data:" + ext + ";base64," + buf.toString("base64"));
    } catch (e) { done(null); }
  }
  function bkSampleFileTone(localPath, done) {
    bkFileToDataUrl(localPath, function (du) {
      if (!du) { done("busy"); return; }
      bkSampleImageTone(du, done);
    });
  }
  function bkHexTone(hex) {
    var c = hexToRgb(hex);
    var lum = (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
    return lum < 0.5 ? "dark" : "light";
  }

  /* --- Logo upload (v17.7.26) ---
   * DIAGNOSED BUG (user, real Illustrator): "logo upload ileo oita niye
   * kaj korteche na" — even after uploading, the kit ignored the logo.
   * Root cause: the file input's change handler set bkLogoFilePath but
   * NEVER switched the Logo Source dropdown to "file" — readPlan() reads
   * the source from the dropdown (default "illustrator"), so Generate
   * went down the Illustrator-selection path and ignored the uploaded
   * file completely. Second cause: the JSX logo sections (lg/placeLogo)
   * only ever used the live Illustrator selection — never p.logoFile —
   * so even a used file never reached the logo sections. Third cause:
   * the plain <input type="file"> is unreliable inside a CEP panel (the
   * native dialog may never open / change may never fire), so the picker
   * here is the CEP-native dialog (window.cep.fs.showOpenDialog), with
   * the hidden file input kept only as a non-CEP fallback. */
  function bkCepFs() {
    try {
      if (typeof window !== "undefined" && window.cep && window.cep.fs) return window.cep.fs;
      if (typeof cep !== "undefined" && cep && cep.fs) return cep.fs;
    } catch (e) {}
    return null;
  }
  function bkLogoFileReady(dest, name) {
    /* Shared tail after a logo file has been copied into the temp folder:
     * record it, FORCE the source to "file", sample its tone, and show
     * the name everywhere the user looks before pressing Generate. */
    bkLogoFilePath = dest;
    bkLogoFileName = name || "";
    var elLogoSrc = document.getElementById("bkLogoSource");
    if (elLogoSrc) { elLogoSrc.value = "file"; }
    bkSampleFileTone(dest, function (tone) { bkLogoToneCurrent = tone; });
    bkShowLogoLoaded();
  }
  function bkShowLogoLoaded() {
    var elLoaded = document.getElementById("bkLogoLoaded");
    var elClear = document.getElementById("bkLogoClear");
    var elFileStatus = document.getElementById("bkLogoFileStatus");
    if (elLoaded) {
      if (bkLogoFilePath && bkLogoFileName) {
        elLoaded.textContent = "Logo ready: " + bkLogoFileName + " ✓ — Generate chaple ei logo tai use hobe (mockup + logo section sob jaygay).";
      } else {
        elLoaded.textContent = "Kono logo deoa hoyni — Upload Logo chapen, ba Illustrator e logo ta select kore Generate chapen.";
      }
    }
    if (elClear) elClear.style.display = (bkLogoFilePath && bkLogoFileName) ? "" : "none";
    if (elFileStatus && bkLogoFilePath && bkLogoFileName) elFileStatus.textContent = "Logo file ready: " + bkLogoFileName + " ✓ — it will be used on every mockup and in the logo sections.";
  }
  function bkClearLogoFile() {
    bkLogoFilePath = ""; bkLogoFileName = ""; bkLogoToneCurrent = "";
    var elLogoSrc = document.getElementById("bkLogoSource");
    if (elLogoSrc) { elLogoSrc.value = "illustrator"; }
    var elRow = document.getElementById("bkLogoFileRow");
    if (elRow) elRow.style.display = "none";
    bkShowLogoLoaded();
  }
  function bkLogoSourceForPlan(elLogoSrc) {
    /* A loaded logo file beats the dropdown default: the user uploaded a
     * file, so Generate must use it even if the dropdown still says
     * "illustrator". An explicit "generated" choice still wins; clearing
     * the uploaded file (✕ soran) restores the dropdown's choice. */
    var src = elLogoSrc ? elLogoSrc.value : "illustrator";
    if (src !== "generated" && bkLogoFilePath) return "file";
    return src;
  }
  function bkPickLogoFile() {
    var elStat = document.getElementById("bkStatus");
    function fail(msg) { if (elStat) { elStat.textContent = msg; elStat.style.color = "#f87171"; } }
    function accept(srcPath) {
      var name = String(srcPath || "").split(/[\\\/]/).pop() || "";
      if (!/\.(png|jpe?g)$/i.test(name)) {
        bkLogoFilePath = ""; bkLogoFileName = "";
        fail("Oi file ta logo hobe na — shudhu PNG ba JPG logo file pick koren.");
        bkShowLogoLoaded();
        return;
      }
      var n = bkNode(), dir = bkTempDir();
      if (!n || !dir) {
        fail("Logo copy kora jayni — temp folder pacche na. Illustrator restart kore abar try koren.");
        return;
      }
      var ext = /\.png$/i.test(name) ? ".png" : ".jpg";
      var dest = n.path.join(dir, "logo_user" + ext);
      try {
        if (typeof n.fs.copyFileSync === "function") n.fs.copyFileSync(srcPath, dest);
        else { var buf = n.fs.readFileSync(srcPath); n.fs.writeFileSync(dest, buf); }
      } catch (e) {
        fail("Logo file ta pora jayni (" + (e && e.message ? e.message : "read error") + ") — abar pick koren.");
        return;
      }
      bkLogoFileReady(dest, name);
      if (elStat) { elStat.textContent = "Logo ready: " + name + " ✓ — Generate chaple ei logo tai use hobe."; elStat.style.color = "#3bcdca"; }
    }
    var cfs = bkCepFs();
    if (cfs && typeof cfs.showOpenDialog === "function") {
      try {
        cfs.showOpenDialog(false, false, "Pick your logo (PNG / JPG)", "", ["png", "jpg", "jpeg"], function (res) {
          var paths = null;
          if (res) {
            if (Array.isArray(res.data)) paths = res.data;
            else if (Array.isArray(res)) paths = res;
            else if (typeof res === "string") paths = [res];
            else if (typeof res.data === "string") paths = [res.data];
          }
          if (!paths || !paths.length || !paths[0]) {
            if (elStat) elStat.textContent = "Logo pick kora hoyni — ager logo tai thaklo (thakle).";
            return;
          }
          accept(String(paths[0]));
        });
        return;
      } catch (e) { /* fall through to the hidden file input */ }
    }
    var elFile = document.getElementById("bkLogoFile");
    if (elFile && typeof elFile.click === "function") {
      var elRow = document.getElementById("bkLogoFileRow");
      if (elRow) elRow.style.display = "";
      elFile.click();
      return;
    }
    fail("Logo picker khola jayni — Illustrator er vitore panel ta khule abar try koren.");
  }
  function bkMockupTones() {
    var out = {};
    for (var cat in bkMockupCache) {
      if (bkMockupCache.hasOwnProperty(cat) && bkMockupCache[cat].tone) out[cat] = bkMockupCache[cat].tone;
    }
    return out;
  }
  function bkFetchAll(cats, industry, mood, progress, done) {
    /* v17.7.25: every category is fetched fresh with the session-wide
     * used-URL set as the exclude list, so no photo URL is assigned twice
     * in one generation. done(repeats) — the categories (if any) whose
     * photo had to repeat because the category ran out of distinct photos. */
    var idx = 0, repeats = [];
    function next() {
      if (idx >= cats.length) { done(repeats); return; }
      var cat = cats[idx++];
      if (progress) progress(cat, idx, cats.length);
      bkFetchCategory(cat, industry, mood, 1, function (best, repeated) {
        if (!best) { next(); return; }
        if (repeated) repeats.push(cat);
        bkDownloadImage(best.url, cat, function (localPath) {
          if (localPath) {
            /* v17.7.25: a URL is NEVER removed from bkUsedUrls — once a
             * photo was used in this session it stays excluded, so a
             * later Generate can never re-pick an earlier generation's
             * photo (deleting the old URL here was the repeat bug). */
            bkUsedUrls[best.url] = true;
            bkMockupCache[cat] = { url: best.url, localPath: localPath, title: best.title || cat, license: best.license || "", creator: best.creator || "", width: best.width || 0, height: best.height || 0, tone: "busy" };
            bkSampleFileTone(localPath, function (tone) {
              bkMockupCache[cat].tone = tone;
              next();
            });
          } else next();
        });
      }, bkUsedUrls);
    }
    next();
  }
  function bkMockupPaths() {
    var out = {};
    var cat;
    for (cat in bkMockupCache) {
      if (bkMockupCache.hasOwnProperty(cat) && bkMockupCache[cat].localPath) out[cat] = bkMockupCache[cat].localPath;
    }
    return out;
  }
  function bkEnabledCats(plan) {
    var mode = plan.mockupMode || "auto";
    if (mode === "auto") {
      var zones = BK_TEMPLATE_ZONES[plan.templateStyle] || BK_TEMPLATE_ZONES.book_10;
      return zones.slice();
    }
    var out = [];
    BK_MOCKUP_CATS.forEach(function (cat) {
      var el = document.getElementById("bkMk" + cat.charAt(0).toUpperCase() + cat.slice(1));
      if (el && el.checked) out.push(cat);
    });
    return out;
  }
  function bkRenderThumbs() {
    var box = document.getElementById("bkMockupThumbs");
    if (!box) return;
    var html = "";
    BK_MOCKUP_CATS.forEach(function (cat) {
      var m = bkMockupCache[cat];
      if (!m) return;
      var tip = (m.title || cat).replace(/"/g, "") + " — " + (m.creator || "Openverse") + " (" + (m.license || "CC") + ") — click to swap";
      html += '<img class="bk-mock-thumb" data-cat="' + cat + '" src="' + m.url + '" title="' + tip + '" alt="' + cat + '" />';
    });
    box.innerHTML = html || '<span class="hint">No mockups fetched yet.</span>';
    var imgs = box.querySelectorAll("img.bk-mock-thumb");
    for (var i = 0; i < imgs.length; i++) {
      imgs[i].addEventListener("click", function () {
        var cat = this.getAttribute("data-cat");
        var plan = bkPlanFn ? bkPlanFn() : null;
        if (!plan || bkMockupBusy) return;
        var st = document.getElementById("bkMockupStatus");
        if (st) st.textContent = "Swapping " + (BK_MOCKUPS[cat] ? BK_MOCKUPS[cat].label : cat) + " mockup…";
        /* v17.7.25: the swap must fetch a photo no other zone is using —
         * exclude every URL currently assigned in the cache. */
        var exclude = {};
        for (var c in bkMockupCache) {
          if (bkMockupCache.hasOwnProperty(c) && bkMockupCache[c].url) exclude[bkMockupCache[c].url] = true;
        }
        bkFetchCategory(cat, plan.industry, bkMoodWord(plan.personality), 2, function (best, repeated) {
          if (!best) { if (st) st.textContent = "No alternate photo found for " + cat + "."; return; }
          bkDownloadImage(best.url, cat + "_alt" + Date.now(), function (localPath) {
            if (localPath) {
              /* v17.7.25: the swapped-out URL stays in bkUsedUrls too —
               * a photo used once this session is never picked again. */
              bkUsedUrls[best.url] = true;
              bkMockupCache[cat] = { url: best.url, localPath: localPath, title: best.title || cat, license: best.license || "", creator: best.creator || "", width: best.width || 0, height: best.height || 0, tone: "busy" };
              bkSampleFileTone(localPath, function (tone) {
                bkMockupCache[cat].tone = tone;
                bkRenderThumbs();
                if (st) st.textContent = "Swapped " + cat + " mockup ✓" + (repeated ? " (no fresh alternate — photo repeated)" : "");
              });
            } else if (st) st.textContent = "Download failed for " + cat + ".";
          });
        }, exclude);
      });
    }
  }
  function bkWireMockupUI(readPlanFn, setStatus) {
    var btn = document.getElementById("btnBkFetchMockups");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (bkMockupBusy) return;
      var plan = readPlanFn();
      var cats = bkEnabledCats(plan);
      if (plan.mockupMode === "off") { setStatus("Mockups are OFF — vector-only sheets. Switch mode to Auto / Manual to fetch photos."); return; }
      if (cats.length === 0) { setStatus("Tick at least one mockup category first."); return; }
      bkMockupBusy = true;
      btn.disabled = true;
      setStatus("Mockup anchi… (0/" + cats.length + ")");
      bkFetchAll(cats, plan.industry, bkMoodWord(plan.personality), function (cat, n, total) {
        setStatus("Mockup anchi… (" + n + "/" + total + ") — " + (BK_MOCKUPS[cat] ? BK_MOCKUPS[cat].label : cat));
        bkRenderThumbs();
      }, function (repeats) {
        bkMockupBusy = false;
        btn.disabled = false;
        bkRenderThumbs();
        var n = Object.keys(bkMockupCache).length;
        var repNote = (repeats && repeats.length) ? (" (photo repeat hoyeche: " + repeats.join(", ") + " — ar fresh photo chilo na)") : "";
        setStatus(n > 0 ? ("Ready: " + n + " distinct real mockup photo(s) downloaded ✓ — Generate will place them in the artwork. Click a thumbnail to swap it." + repNote) : "Could not fetch mockups (offline?). Generate will use the vector-only sheets.");
      });
    });
  }

  /* --- Send to Muse package (v17.7.25, panel side only) ---
   * The panel is the SENDER, Muse is the BUILDER of the final guideline:
   * the user presses Send to Muse in the panel, the brand package comes
   * to Muse here, and Muse takes the BEST realistic online mockups and
   * builds the full brand guideline. The panel's own Generate is only the
   * instant local preview/draft — its fetch is fast, not "the best".
   * The package is built LOCALLY in the OS temp folder (works offline);
   * bkTransmitMusePackage below POSTs it to the server (see
   * upload-spec.json for the exact contract). */
  function bkPanelVersion() {
    /* PANEL_VERSION lives inside an IIFE in update-check.js and is not
     * global — read the version chip the panel itself renders, with a
     * fallback that matches the current release. */
    try {
      var el = document.querySelector ? document.querySelector(".brand-ver") : null;
      var t = el ? String(el.textContent || "").replace(/^v/i, "").trim() : "";
      if (/^\d+\.\d+\.\d+$/.test(t)) return t;
    } catch (e) {}
    return "17.7.26";
  }
  function bkLicenseKeyHead() {
    try {
      var raw = localStorage.getItem("design360n_workstation_license");
      var rec = raw ? JSON.parse(raw) : null;
      var k = rec && rec.key ? String(rec.key) : "";
      return k ? k.substring(0, 4) : "no-key";
    } catch (e) { return "no-key"; }
  }
  function bkStampNow() {
    var d = new Date();
    function p2(n) { return (n < 10 ? "0" : "") + n; }
    return "" + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + "-" + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds());
  }
  function bkSafeName(s) {
    return (String(s || "brand").replace(/[^a-z0-9-_]+/gi, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "") || "brand");
  }
  function bkBuildMusePackage(plan, pdfPath, done) {
    /* Assembles the handoff package under
     * <temp>/Design360n_BrandKit_Mockups/outbox/<brand>-<YYYYMMDD-HHmm>/
     * with: guideline PDF (panel draft), plan.json (the exact plan sent
     * to the JSX), the logo file actually used, manifest.txt (license key
     * FIRST 4 chars only), upload-spec.json (server handoff spec) and
     * muse-brief.txt (plain-words brief for Muse). done({ok, dir, files,
     * pdf, plan, logo}) — ok:false when the temp folder is unavailable. */
    var n = bkNode(), dir = bkTempDir();
    if (!n || !dir) { done({ ok: false, reason: "no-temp" }); return; }
    var outDir = n.path.join(dir, "outbox");
    var out = n.path.join(outDir, bkSafeName(plan.brandName) + "-" + bkStampNow());
    try {
      if (!n.fs.existsSync(outDir)) n.fs.mkdirSync(outDir);
      /* v17.7.26: two Sends in the same second must not collide on the
       * folder name — suffix until the name is free. */
      var suffix = 0;
      while (n.fs.existsSync(out)) { suffix++; out = n.path.join(outDir, bkSafeName(plan.brandName) + "-" + bkStampNow() + "-" + suffix); }
      n.fs.mkdirSync(out);
    } catch (e) { done({ ok: false, reason: "no-outbox" }); return; }
    var files = [];
    function wfile(name, content) {
      try { n.fs.writeFileSync(n.path.join(out, name), content); files.push(name); return true; } catch (e) { return false; }
    }
    function cfile(src, name) {
      if (!src) return false;
      try {
        var buf = n.fs.readFileSync(src);
        n.fs.writeFileSync(n.path.join(out, name), buf);
        files.push(name); return true;
      } catch (e) { return false; }
    }
    var safeBrand = bkSafeName(plan.brandName);
    var pdfName = safeBrand + "_Brand_Guideline.pdf";
    var pdfOk = pdfPath ? cfile(pdfPath, pdfName) : false;
    var planOk = wfile("plan.json", JSON.stringify(plan, null, 2));
    var logoSrc = plan.logoFile || bkLastLogoPath || bkLogoFilePath || "";
    var logoExt = /\.png$/i.test(logoSrc) ? ".png" : ".jpg";
    var logoOk = logoSrc ? cfile(logoSrc, "logo" + logoExt) : false;
    var zones = Object.keys(plan.mockups || {});
    var lines = zones.map(function (cat) {
      var m = bkMockupCache[cat];
      if (!m) return cat + " | (no photo — vector-only)";
      return cat + " | " + (m.url || "") + " | " + (m.license || "") + " | by " + (m.creator || "unknown");
    });
    var manifest = [
      "Brand: " + plan.brandName,
      "Template: " + plan.templateStyle,
      "Date/Time: " + new Date().toString(),
      "Panel version: " + bkPanelVersion(),
      "License key (first 4 chars): " + bkLicenseKeyHead(),
      "Mockup mode: " + (plan.mockupMode || "auto"),
      "Logo variant: " + (plan.logoVariant || "auto"),
      "Logo file used: " + (logoOk ? "logo" + logoExt : "generated text logo (no file)"),
      "Guideline PDF: " + (pdfOk ? pdfName + " (panel draft — reference only)" : "not exported"),
      "",
      "Mockup photos the panel used (zone | url | license | creator):"
    ].concat(lines.length ? lines : ["(none — vector-only sheets)"]).join("\n");
    wfile("manifest.txt", manifest);
    var spec = {
      endpoint: "https://script.google.com/macros/s/AKfycbx5HH2LS6FDoHpnKoIM9tDYfNqQ1CxXCe2iFO1MColMUSpacgwnzdO95mwoyLHFovtvvw/exec",
      action: "brandkit_upload",
      method: "POST",
      contentType: "text/plain (body is a JSON string — Apps Script has no CORS preflight handler, so a JSON content type would fail before reaching doPost)",
      request: { action: "brandkit_upload", brand: "<name>", licenseKey: "<full key from the gate, or '' when none is stored>", files: [{ name: "<file name>", mime: "<mime>", base64: "<base64>" }] },
      filesSent: "guideline PDF + logo + plan.json + manifest.txt + muse-brief.txt (upload-spec.json itself is NOT sent)",
      responseOk: { ok: true, folderId: "<Drive folder id>", fileIds: { "<name>": "<id>" }, validated: true, brand: "<name>" },
      responseFail: { ok: false, error: "<plain reason>" },
      driveFolder: "Design360n BrandKit Inbox",
      notes: "Apps Script doPost (Code_v6.gs, action brandkit_upload) saves into Drive folder 'Design360n BrandKit Inbox' and returns the JSON above. Panel reads the JSON reply — same POST pattern as the website AI tools."
    };
    wfile("upload-spec.json", JSON.stringify(spec, null, 2));
    var brief = "Brand: " + plan.brandName + ". Industry: " + (plan.industry || "(not given)") + ". Personality: " + (plan.personality || "") + ". " +
      "Build the full brand guideline with the BEST realistic online mockups (distinct photo per zone, logo stamped on every mockup per the guideline rules). " +
      "Panel draft PDF included for reference only — Muse's version is the final.";
    wfile("muse-brief.txt", brief);
    done({ ok: true, dir: out, files: files, pdf: pdfOk, plan: planOk, logo: logoOk });
  }

  /* --- Send to Muse TRANSMIT (v17.7.26, panel side) ---
   * After the local package is built, POST it to the license-server
   * /exec endpoint (action brandkit_upload). Same POST pattern as the
   * website AI tools (proven live): Content-Type text/plain with a JSON
   * string body — Apps Script has no CORS preflight handler, so a JSON
   * content type would fail before reaching doPost. fetch follows the
   * /exec redirect and the reply JSON is readable (same as the AI tools).
   * 60s timeout via AbortController. done({ok, folderId, fileIds,
   * validated, error}) — ok:false NEVER loses the package: the local
   * outbox folder stays on disk and the caller must show its path.
   * The FULL license key goes in the POST body only (never displayed,
   * never written to manifest.txt — that keeps first-4-chars only). */
  var BK_EXEC_URL = "https://script.google.com/macros/s/AKfycbx5HH2LS6FDoHpnKoIM9tDYfNqQ1CxXCe2iFO1MColMUSpacgwnzdO95mwoyLHFovtvvw/exec";
  function bkLicenseKeyFull() {
    try {
      var raw = localStorage.getItem("design360n_workstation_license");
      var rec = raw ? JSON.parse(raw) : null;
      return (rec && rec.key) ? String(rec.key) : "";
    } catch (e) { return ""; }
  }
  function bkMimeForFile(name) {
    if (/\.pdf$/i.test(name)) return "application/pdf";
    if (/\.png$/i.test(name)) return "image/png";
    if (/\.jpe?g$/i.test(name)) return "image/jpeg";
    if (/\.json$/i.test(name)) return "application/json";
    return "text/plain";
  }
  function bkTransmitMusePackage(pkg, brand, done) {
    var n = bkNode();
    if (!n || !pkg || !pkg.dir || !pkg.files || !pkg.files.length) { done({ ok: false, error: "package ta thik moto toiri hoyni — abar Generate + Send chapen" }); return; }
    if (typeof fetch !== "function") { done({ ok: false, error: "ei panel-e internet call kora jacche na" }); return; }
    var files = [];
    try {
      pkg.files.forEach(function (name) {
        if (name === "upload-spec.json") return; /* spec stays local only */
        var buf = n.fs.readFileSync(n.path.join(pkg.dir, name));
        files.push({ name: name, mime: bkMimeForFile(name), base64: buf.toString("base64") });
      });
    } catch (e) { done({ ok: false, error: "package er file gulo pora jayni" }); return; }
    if (!files.length) { done({ ok: false, error: "package ta thik moto toiri hoyni — abar Generate + Send chapen" }); return; }
    var body = { action: "brandkit_upload", brand: brand || "brand", licenseKey: bkLicenseKeyFull(), files: files };
    var ctrl = null, timer = null;
    try {
      ctrl = new AbortController();
      timer = setTimeout(function () { try { ctrl.abort(); } catch (e2) {} }, 60000);
    } catch (e3) { ctrl = null; }
    var opts = { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) };
    if (ctrl) opts.signal = ctrl.signal;
    fetch(BK_EXEC_URL, opts).then(function (r) {
      return r.text().then(function (t) { return { status: r.status, text: t }; });
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      var j = null;
      try { j = JSON.parse(res.text); } catch (eJ) { j = null; }
      if (j && j.ok) { done({ ok: true, folderId: j.folderId || "", fileIds: j.fileIds || {}, validated: !!j.validated, brand: j.brand || body.brand, note: j.note || "" }); return; }
      var why = (j && (j.error || j.reason)) || ("server theke thik reply aseni (HTTP " + res.status + ")");
      done({ ok: false, error: why });
    }).catch(function (err) {
      if (timer) clearTimeout(timer);
      var aborted = err && err.name === "AbortError";
      done({ ok: false, error: aborted ? "60 second-e server theke kono reply aseni — internet slow ba server busy hote pare" : "internet/server-er sathe jogajog hocche na" + ((err && err.message) ? " (" + err.message + ")" : "") });
    });
  }

  function brandPreviewSVG(opts) {
    var p = opts.primary || "#2ed3a3";
    var s = opts.secondary || "#0ea5e9";
    var dk = opts.dark || "#0b1120";
    var lt = opts.light || "#f8fafc";
    var name = (opts.brandName || "BRAND NAME").replace(/[<>&"]/g, "");
    var tag = (opts.tagline || "Crafted with precision").replace(/[<>&"]/g, "");
    var init = name.split(/\s+/).map(function (w) { return w[0] || ""; }).join("").slice(0, 2).toUpperCase() || "BR";

    return [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 190" width="100%" height="100%">',
      '<rect width="340" height="190" rx="8" fill="#070c16"/>',
      // Hero Bento Card (Left)
      '<rect x="10" y="10" width="142" height="112" rx="8" fill="' + dk + '" stroke="' + p + '" stroke-width="1"/>',
      '<rect x="22" y="24" width="28" height="28" rx="6" fill="' + p + '"/>',
      '<text x="36" y="42" text-anchor="middle" fill="' + dk + '" font-family="Inter,sans-serif" font-size="13" font-weight="900">' + init + '</text>',
      '<text x="22" y="72" fill="' + lt + '" font-family="Inter,sans-serif" font-size="12" font-weight="800">' + name.slice(0, 16) + '</text>',
      '<text x="22" y="86" fill="#94a3b8" font-family="Inter,sans-serif" font-size="7.5">' + tag.slice(0, 26) + '</text>',
      '<rect x="22" y="98" width="46" height="4" rx="2" fill="' + p + '"/>',
      // Business Card Mockup (Top Right)
      '<rect x="160" y="10" width="94" height="58" rx="6" fill="' + lt + '"/>',
      '<rect x="160" y="10" width="6" height="58" rx="2" fill="' + p + '"/>',
      '<text x="174" y="30" fill="' + dk + '" font-family="Inter,sans-serif" font-size="8.5" font-weight="800">' + name.slice(0, 13) + '</text>',
      '<text x="174" y="42" fill="#64748b" font-family="Inter,sans-serif" font-size="6">Business Card 85×55mm</text>',
      '<rect x="174" y="50" width="42" height="3" rx="1.5" fill="' + s + '"/>',
      // Letterhead Mini (Far Right)
      '<rect x="262" y="10" width="68" height="92" rx="5" fill="#ffffff"/>',
      '<rect x="262" y="10" width="68" height="12" rx="2" fill="' + dk + '"/>',
      '<rect x="270" y="28" width="32" height="3" rx="1" fill="' + p + '"/>',
      '<rect x="270" y="36" width="52" height="2" rx="1" fill="#cbd5e1"/>',
      '<rect x="270" y="42" width="46" height="2" rx="1" fill="#cbd5e1"/>',
      '<rect x="270" y="48" width="50" height="2" rx="1" fill="#cbd5e1"/>',
      '<rect x="262" y="94" width="68" height="8" rx="2" fill="' + p + '"/>',
      // Typography Specimen (Mid Right)
      '<rect x="160" y="75" width="94" height="47" rx="6" fill="' + p + '"/>',
      '<text x="172" y="102" fill="' + dk + '" font-family="Inter,sans-serif" font-size="22" font-weight="900">Aa</text>',
      '<text x="206" y="95" fill="' + dk + '" font-family="Inter,sans-serif" font-size="7" font-weight="800">TYPE SYSTEM</text>',
      '<text x="206" y="106" fill="' + dk + '" font-family="Inter,sans-serif" font-size="6.5" opacity="0.8">' + (opts.titleFont || "Montserrat").slice(0, 12) + '</text>',
      // 5 Color Swatches Row (Bottom)
      '<rect x="10" y="130" width="60" height="50" rx="6" fill="' + p + '"/><text x="40" y="172" text-anchor="middle" fill="' + dk + '" font-family="monospace" font-size="7" font-weight="700">' + p.toUpperCase() + '</text>',
      '<rect x="75" y="130" width="60" height="50" rx="6" fill="' + s + '"/><text x="105" y="172" text-anchor="middle" fill="#fff" font-family="monospace" font-size="7" font-weight="700">' + s.toUpperCase() + '</text>',
      '<rect x="140" y="130" width="60" height="50" rx="6" fill="' + dk + '" stroke="#334155"/><text x="170" y="172" text-anchor="middle" fill="#cbd5e1" font-family="monospace" font-size="7" font-weight="700">' + dk.toUpperCase() + '</text>',
      '<rect x="205" y="130" width="60" height="50" rx="6" fill="' + lt + '"/><text x="235" y="172" text-anchor="middle" fill="#334155" font-family="monospace" font-size="7" font-weight="700">' + lt.toUpperCase() + '</text>',
      '<rect x="270" y="130" width="60" height="50" rx="6" fill="#1e293b" stroke="' + p + '"/><text x="300" y="158" text-anchor="middle" fill="' + p + '" font-family="Inter,sans-serif" font-size="8" font-weight="800">10 SECTIONS</text><text x="300" y="170" text-anchor="middle" fill="#94a3b8" font-family="Inter,sans-serif" font-size="6.5">PRINT+SOCIAL</text>',
      '</svg>'
    ].join("");
  }

  function initBrandKitUI() {
    var elName = document.getElementById("bkName");
    var elTag = document.getElementById("bkTagline");
    var elWeb = document.getElementById("bkWebsite");
    var elEmail = document.getElementById("bkEmail");
    var elPhone = document.getElementById("bkPhone");
    var elAddr = document.getElementById("bkAddress");
    var elPrim = document.getElementById("bkPrimary");
    var elSec = document.getElementById("bkSecondary");
    var elDark = document.getElementById("bkDark");
    var elLight = document.getElementById("bkLight");
    var elTFont = document.getElementById("bkTitleFont");
    var elBFont = document.getElementById("bkBodyFont");
    var elPrev = document.getElementById("bkPreview");
    var elStat = document.getElementById("bkStatus");
    var btnExt = document.getElementById("btnBkExtractLogo");
    var btnGen = document.getElementById("btnBkGenerate");
    if (!elName || !elPrev) return;

    function getCheckedItems() {
      var keys = ["bkSec1","bkSec2","bkSec3","bkSec4","bkSec5","bkSec6","bkSec7","bkSec8","bkSec9","bkSec10"];
      var out = {};
      keys.forEach(function (k) {
        var el = document.getElementById(k);
        out[k] = el ? !!el.checked : true;
      });
      return out;
    }

    function rgbStr(hex) { var c = hexToRgb(hex); return "RGB(" + c.r + ", " + c.g + ", " + c.b + ")"; }
    function readPlan() {
      var elTpl = document.getElementById("bkTemplate");
      var elAcc = document.getElementById("bkAccent");
      var elInd = document.getElementById("bkIndustry");
      var elMode = document.getElementById("bkMockupMode");
      var elLogoSrc = document.getElementById("bkLogoSource");
      var elLogoVar = document.getElementById("bkLogoVariant");
      var elStory = document.getElementById("bkStory");
      var elMiss = document.getElementById("bkMission");
      var elAud = document.getElementById("bkAudience");
      var elVal = document.getElementById("bkValues");
      var elPers = document.getElementById("bkPersonality");
      var p = elPrim.value || "#2ed3a3";
      var s = elSec.value || "#0ea5e9";
      var a = (elAcc && elAcc.value) ? elAcc.value : "#f59e0b";
      var dk = elDark.value || "#0b1120";
      var lt = (elLight && elLight.value) ? elLight.value : "#f8fafc";
      return {
        templateStyle: elTpl ? elTpl.value : "bento_dark",
        brandName: elName.value.trim() || "DESIGN360N",
        tagline: elTag.value.trim() || "Crafted with Precision",
        story: elStory ? elStory.value.trim() : "Built to deliver modern, memorable design systems.",
        mission: elMiss ? elMiss.value.trim() : "Empower brands through precision visual craft.",
        audience: elAud ? elAud.value.trim() : "Modern businesses & creative teams",
        values: elVal ? elVal.value.trim() : "Clarity • Craft • Consistency • Trust",
        personality: elPers ? elPers.value.trim() : "Confident, Minimal, Contemporary",
        website: elWeb.value.trim() || "www.design360n.com",
        email: elEmail.value.trim() || "hello@design360n.com",
        phone: elPhone.value.trim() || "+880 1799-137986",
        address: elAddr.value.trim() || "Dhaka, Bangladesh",
        primary: p, secondary: s, accent: a, dark: dk, light: lt,
        rgbPrimary: rgbStr(p), rgbSecondary: rgbStr(s), rgbAccent: rgbStr(a), rgbDark: rgbStr(dk), rgbLight: rgbStr(lt),
        cmykPrimary: rgbToCmykStr(p), cmykSecondary: rgbToCmykStr(s), cmykAccent: rgbToCmykStr(a), cmykDark: rgbToCmykStr(dk), cmykLight: rgbToCmykStr(lt),
        titleFont: elTFont ? elTFont.value.trim() : "Montserrat",
        bodyFont: elBFont ? elBFont.value.trim() : "Arial",
        industry: elInd ? elInd.value.trim() : "",
        mockupMode: elMode ? elMode.value : "auto",
        mockups: bkMockupPaths(),
        mockupTone: bkMockupTones(),
        logoSource: bkLogoSourceForPlan(elLogoSrc),
        logoVariant: elLogoVar ? elLogoVar.value : "auto",
        logoFile: bkLogoFilePath || "",
        logoTone: bkLogoToneCurrent || bkHexTone(p),
        include: getCheckedItems()
      };
    }

    function refresh() {
      elPrev.innerHTML = brandPreviewSVG(readPlan());
    }

    [elName, elTag, elWeb, elEmail, elPhone, elAddr, elPrim, elSec, elDark, elLight, elTFont, elBFont].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", refresh);
      el.addEventListener("change", refresh);
    });

    if (btnExt) {
      btnExt.addEventListener("click", function () {
        if (!csInterface || !csInterface.isInCEP()) {
          if (elStat) elStat.textContent = "Preview Mode: Select your vector logo inside Illustrator first.";
          return;
        }
        csInterface.evalScript("dmExtractLogoColorsAI()", function (res) {
          if (res && res.indexOf("OK:") === 0) {
            var cols = res.slice(3).split("|").filter(Boolean);
            if (cols[0]) elPrim.value = cols[0];
            if (cols[1]) elSec.value = cols[1];
            if (cols[2]) elDark.value = cols[2];
            refresh();
            if (elStat) { elStat.textContent = "Extracted " + cols.length + " brand colors from selected logo!"; elStat.style.color = "#3bcdca"; }
          } else {
            if (elStat) { elStat.textContent = res || "Select a vector logo in Illustrator first."; elStat.style.color = "#f87171"; }
          }
        });
      });
    }

    if (btnGen) {
      btnGen.addEventListener("click", function () {
        var plan = readPlan();
        if (!csInterface || !csInterface.isInCEP()) {
          if (elStat) elStat.textContent = "Preview Mode: Open inside Adobe Illustrator to generate Brand Kit.";
          return;
        }
        /* One-click auto Generate (v17.7.25): logo → brand-wise mockups →
         * kit in Illustrator → guideline PDF exported automatically.
         * The panel result is the instant LOCAL preview/draft; the final
         * guideline with the best online mockups is Muse's step after
         * "Send to Muse" — the panel never promises it picks "the best". */
        function doGenerate(finalPlan) {
          if (elStat) { elStat.textContent = "Kit banacchi…"; elStat.style.color = "#3bcdca"; }
          csInterface.evalScript("dmGenerateBrandKitAI('" + escJSX(finalPlan) + "')", function (res) {
            var ok = res && res.indexOf("OK:") === 0;
            if (!ok) {
              if (elStat) {
                elStat.textContent = (res && res.indexOf("ERROR:") === 0) ? res.substring(6) : (res || "Brand Identity Kit created!");
                elStat.style.color = "#f87171";
              }
              return;
            }
            bkLastPlan = finalPlan;
            bkLastLogoPath = finalPlan.logoFile || "";
            if (elStat) { elStat.textContent = "PDF export hocche…"; elStat.style.color = "#3bcdca"; }
            csInterface.evalScript("dmExportBrandGuidelinePDFAuto()", function (resPdf) {
              if (resPdf && resPdf.indexOf("OK:") === 0) {
                bkLastPdfPath = resPdf.substring(3);
                if (elStat) { elStat.textContent = "Kit + PDF ready ✓ — Muse er kache pathanor jonno ready ✓ (Send to Muse chapen — Muse online theke best mockup niye full brand guideline banabe)."; elStat.style.color = "#3bcdca"; }
              } else {
                bkLastPdfPath = "";
                if (elStat) { elStat.textContent = res.substring(3) + " — PDF export hoyni, tobe kit Illustrator e toiri ache. Send to Muse te PDF thakbe na."; elStat.style.color = "#f59e0b"; }
              }
            });
          });
        }
        /* Step 2 — fetch ALL enabled mockup photos FRESH for this
         * generation (never reuse the cache — that was the repeat bug),
         * then generate. */
        function afterLogo(finalPlan) {
          var need = (finalPlan.mockupMode !== "off") ? bkEnabledCats(finalPlan) : [];
          if (need.length === 0) { doGenerate(finalPlan); return; }
          if (bkMockupBusy) { if (elStat) elStat.textContent = "Mockup anchi — ektu wait koren, tarpor abar Generate chapen."; return; }
          bkMockupBusy = true;
          if (elStat) { elStat.textContent = "Mockup anchi… (brand-wise online theke)"; elStat.style.color = "#3bcdca"; }
          bkFetchAll(need, finalPlan.industry, bkMoodWord(finalPlan.personality), function (cat, n, total) {
            if (elStat) elStat.textContent = "Mockup anchi… (" + n + "/" + total + ")";
            bkRenderThumbs();
          }, function (repeats) {
            bkMockupBusy = false;
            bkRenderThumbs();
            finalPlan.mockups = bkMockupPaths();
            finalPlan.mockupTone = bkMockupTones();
            if (repeats && repeats.length && elStat) elStat.textContent = "Note: " + repeats.join(", ") + " er jonno fresh photo chilo na — photo repeat hoyeche.";
            doGenerate(finalPlan);
          });
        }
        /* Step 1 — resolve the logo source (Illustrator selection / file /
         * generated text). Illustrator mode exports the selected artwork as
         * a transparent PNG first; with nothing selected we STOP and tell
         * the user — never generate with a wrong logo. */
        function resolveLogoFile(cb) {
          if (plan.logoSource === "illustrator") {
            if (elStat) { elStat.textContent = "Logo nicchi… (Illustrator theke)"; elStat.style.color = "#3bcdca"; }
            csInterface.evalScript("dmExportSelectedLogo()", function (res) {
              if (res && res.indexOf("OK:") === 0) {
                plan.logoFile = res.substring(3);
                bkSampleFileTone(plan.logoFile, function (tone) {
                  bkLogoToneCurrent = tone; plan.logoTone = tone;
                  cb(true);
                });
              } else if (res && res.indexOf("ERROR:NO_SELECTION") === 0) {
                if (elStat) { elStat.textContent = "Illustrator e logo ta select kore abar Generate chapen — kono logo select kora nai."; elStat.style.color = "#f87171"; }
                cb(false);
              } else if (res && res.indexOf("ERROR:SELECTION_LOCKED") === 0) {
                if (elStat) { elStat.textContent = "Logo ta locked ba lukano ache — Illustrator e unlock kore abar select kore Generate chapen."; elStat.style.color = "#f87171"; }
                cb(false);
              } else {
                if (elStat) { elStat.textContent = "Logo export hoyni (" + (res || "unknown error") + ") — logo file ba Generated text logo use koren."; elStat.style.color = "#f87171"; }
                cb(false);
              }
            });
          } else if (plan.logoSource === "file") {
            /* v17.7.26: NO silent fallback — if the user chose a file, a
             * missing file must STOP the Generate with the exact reason,
             * never build the kit with the generated text logo instead. */
            var nF = bkNode();
            if (!bkLogoFilePath) {
              if (elStat) { elStat.textContent = "Logo file pick kora hoyni — age 'Upload Logo' chapen, tarpor Generate chapen."; elStat.style.color = "#f87171"; }
              cb(false);
            } else if (nF && !nF.fs.existsSync(bkLogoFilePath)) {
              if (elStat) { elStat.textContent = "Logo file ta ar paoa jacche na (" + (bkLogoFileName || "logo") + ") — abar 'Upload Logo' chapen."; elStat.style.color = "#f87171"; }
              cb(false);
            } else {
              plan.logoFile = bkLogoFilePath;
              bkSampleFileTone(plan.logoFile, function (tone) {
                bkLogoToneCurrent = tone; plan.logoTone = tone;
                cb(true);
              });
            }
          } else {
            plan.logoFile = "";
            plan.logoTone = bkHexTone(plan.primary);
            cb(true);
          }
        }
        plan.mockupTone = bkMockupTones();
        plan.logoTone = bkLogoToneCurrent || bkHexTone(plan.primary);
        resolveLogoFile(function (ok) { if (ok) afterLogo(plan); });
      });
    }


    var btnPdf = document.getElementById("btnBkExportPDF");
    if (btnPdf) {
      btnPdf.addEventListener("click", function () {
        if (!csInterface || !csInterface.isInCEP()) {
          if (elStat) elStat.textContent = "Preview Mode: Open inside Illustrator to export Brand Guideline PDF.";
          return;
        }
        csInterface.evalScript("dmExportBrandGuidelinePDF()", function (res) {
          if (elStat) {
            elStat.textContent = (res && res.indexOf("OK:") === 0) ? res.substring(3) : (res || "Brand Guideline PDF exported!");
            elStat.style.color = (res && res.indexOf("ERROR:") === 0) ? "#f87171" : "#3bcdca";
          }
        });
      });
    }

    /* --- Send to Muse (v17.7.26): the MAIN deliverable path. The panel
     * builds the brand package locally, then bkTransmitMusePackage POSTs
     * it to the server — Muse picks the BEST realistic online mockups
     * and builds the final guideline. A failed transmit never loses the
     * package: the local outbox folder stays on disk and the status line
     * shows its exact path. */
    var btnSend = document.getElementById("btnBkSendToMuse");
    var elSendStatus = document.getElementById("bkSendStatus");
    if (btnSend) {
      btnSend.addEventListener("click", function () {
        /* v17.7.26: the gate is "no Generate yet" ONLY — a Generate whose
         * PDF export failed must NOT block Send (the package builder
         * tolerates a missing PDF). Every outcome names the exact step. */
        if (!bkLastPlan) {
          if (elSendStatus) elSendStatus.textContent = "Age Generate chapen — tarpor Send to Muse chaple package ready hobe.";
          if (elStat) { elStat.textContent = "Age Generate chapen — tarpor Send to Muse chaple package ready hobe."; elStat.style.color = "#f87171"; }
          return;
        }
        if (!bkLastPdfPath && elSendStatus) elSendStatus.textContent = "Note: guideline PDF export hoyni — package ta PDF chara banano hocche.";
        if (elSendStatus) elSendStatus.textContent = "Package banacchi…";
        bkBuildMusePackage(bkLastPlan, bkLastPdfPath, function (res) {
          if (!res.ok) {
            var why = (res.reason === "no-temp") ? "temp folder pacche na" : (res.reason === "no-outbox") ? "outbox folder banano jayni" : (res.reason || "unknown error");
            if (elSendStatus) elSendStatus.textContent = "Package banano jayni — " + why + ". Illustrator restart kore abar Generate + Send chapen.";
            if (elStat) { elStat.textContent = "Send to Muse hoyni — package banano jayni (" + why + ")."; elStat.style.color = "#f87171"; }
            return;
          }
          var nFiles = (res.files && res.files.length) || 0;
          if (elSendStatus) elSendStatus.textContent = "Package ready ✓ (" + nFiles + " files) — Muse er kache pathacchi…";
          if (elStat) { elStat.textContent = "Package ready ✓ — Muse er kache pathacchi…"; elStat.style.color = "#3bcdca"; }
          bkTransmitMusePackage(res, bkLastPlan.brandName, function (tx) {
            if (tx.ok) {
              var okMsg = "Muse er kache pathano hoye geche ✓ — Drive folder: Design360n BrandKit Inbox" + (tx.validated ? "" : " (license key mileni — unvalidated hishebe save hoyeche)") + ". Muse online theke best mockup niye full brand guideline banabe.";
              if (elSendStatus) elSendStatus.textContent = okMsg + (tx.folderId ? " Folder ID: " + tx.folderId : "");
              if (elStat) { elStat.textContent = okMsg; elStat.style.color = "#3bcdca"; }
              return;
            }
            var why = tx.error || "unknown error";
            var failMsg = "Muse er kache pathano jayni — " + why + ". Package ta roye geche: " + res.dir + " — pore abar Send chapen.";
            if (elSendStatus) elSendStatus.textContent = failMsg;
            if (elStat) { elStat.textContent = failMsg; elStat.style.color = "#f87171"; }
          });
        });
      });
    }

    /* --- Brand-aware template suggestion (guides only, never forces) --- */
    var elIndSug = document.getElementById("bkIndustry");
    var elPersSug = document.getElementById("bkPersonality");
    var elTplSel = document.getElementById("bkTemplate");
    var elTplSug = document.getElementById("bkTemplateSuggest");
    function refreshTemplateSuggest() {
      if (!elTplSug) return;
      var s = bkSuggestTemplate(elIndSug ? elIndSug.value : "", elPersSug ? elPersSug.value : "");
      if (!s) { elTplSug.textContent = "Industry / personality likhle ekhane template suggestion asbe."; return; }
      var cur = elTplSel ? elTplSel.value : "";
      elTplSug.textContent = "Ei brand er jonno " + s.name + " valo manabe — " + s.reason + ". Apni chaile onno template o nite paren." + (cur === s.tpl ? " (ekhon etai select kora ache ✓)" : "");
    }
    [elIndSug, elPersSug, elTplSel].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", refreshTemplateSuggest);
      el.addEventListener("change", refreshTemplateSuggest);
    });
    refreshTemplateSuggest();

    /* --- Logo source: Illustrator selection (default) / file / generated ---
     * v17.7.26: the big "Upload Logo" button opens the CEP-native dialog;
     * picking a file forces the source to "file" (bkLogoFileReady) so the
     * uploaded file can never be ignored again. The hidden file input is
     * only the non-CEP fallback — its handler shares the same tail. */
    var elLogoSrc = document.getElementById("bkLogoSource");
    var elLogoFile = document.getElementById("bkLogoFile");
    var elLogoFileRow = document.getElementById("bkLogoFileRow");
    var elLogoFileStatus = document.getElementById("bkLogoFileStatus");
    function syncLogoSourceUI() {
      if (elLogoFileRow) elLogoFileRow.style.display = (elLogoSrc && elLogoSrc.value === "file") ? "" : "none";
    }
    var btnUploadLogo = document.getElementById("btnBkUploadLogo");
    if (btnUploadLogo) btnUploadLogo.addEventListener("click", function () { bkPickLogoFile(); });
    var btnClearLogo = document.getElementById("bkLogoClear");
    if (btnClearLogo) btnClearLogo.addEventListener("click", function () {
      bkClearLogoFile();
      if (elStat) elStat.textContent = "Logo sorano hoyeche — ekhon Illustrator selection ba Generated text logo use hobe.";
    });
    bkShowLogoLoaded();
    if (elLogoSrc) elLogoSrc.addEventListener("change", syncLogoSourceUI);
    syncLogoSourceUI();
    if (elLogoFile) {
      elLogoFile.addEventListener("change", function () {
        var f = elLogoFile.files && elLogoFile.files[0];
        if (!f) { bkLogoFilePath = ""; bkLogoFileName = ""; bkLogoToneCurrent = ""; if (elLogoFileStatus) elLogoFileStatus.textContent = ""; bkShowLogoLoaded(); return; }
        var name = f.name || "";
        if (!/\.(png|jpe?g)$/i.test(name)) {
          bkLogoFilePath = ""; bkLogoFileName = ""; bkLogoToneCurrent = "";
          if (elLogoFileStatus) elLogoFileStatus.textContent = "Only PNG or JPG logo files — this file was not used.";
          bkShowLogoLoaded();
          return;
        }
        var n = bkNode(), dir = bkTempDir();
        if (!n || !dir) {
          bkLogoFilePath = ""; bkLogoFileName = ""; bkLogoToneCurrent = "";
          if (elLogoFileStatus) elLogoFileStatus.textContent = "Could not copy the logo file (no temp folder access).";
          bkShowLogoLoaded();
          return;
        }
        var ext = /\.png$/i.test(name) ? ".png" : ".jpg";
        var dest = n.path.join(dir, "logo_user" + ext);
        var rd = new FileReader();
        rd.onload = function () {
          try {
            var buf = (typeof Buffer !== "undefined") ? Buffer.from(rd.result) : new Uint8Array(rd.result);
            n.fs.writeFileSync(dest, buf);
            bkLogoFileReady(dest, name);
            if (elLogoFileStatus) elLogoFileStatus.textContent = "Logo file ready: " + name + " ✓ — it will be used on every mockup and in the logo sections.";
            if (elStat) { elStat.textContent = "Logo ready: " + name + " ✓ — Generate chaple ei logo tai use hobe."; elStat.style.color = "#3bcdca"; }
          } catch (e) {
            bkLogoFilePath = ""; bkLogoFileName = ""; bkLogoToneCurrent = "";
            if (elLogoFileStatus) elLogoFileStatus.textContent = "Could not read that file — pick the PNG again, or use 'Logo from Illustrator'.";
            bkShowLogoLoaded();
          }
        };
        rd.onerror = function () {
          bkLogoFilePath = ""; bkLogoFileName = ""; bkLogoToneCurrent = "";
          if (elLogoFileStatus) elLogoFileStatus.textContent = "Could not read that file — pick the PNG again, or use 'Logo from Illustrator'.";
          bkShowLogoLoaded();
        };
        rd.readAsArrayBuffer(f);
      });
    }

    bkPlanFn = readPlan;
    bkWireMockupUI(readPlan, function (t) { if (elStat) elStat.textContent = t; });
    bkRenderThumbs();

    refresh();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initBrandKitUI);
    else initBrandKitUI();
  }

  global.BrandKitStudio = { brandPreviewSVG: brandPreviewSVG, rgbToCmykStr: rgbToCmykStr, mockupCatalog: BK_MOCKUPS, templateZones: BK_TEMPLATE_ZONES, suggestTemplate: bkSuggestTemplate, moodWord: bkMoodWord, toneFromPixels: bkToneFromPixels, _test: { pickBest: bkPickBest, fetchCategory: bkFetchCategory, fetchAll: bkFetchAll, cache: function () { return bkMockupCache; }, usedUrls: function () { return bkUsedUrls; }, downloadImage: bkDownloadImage, buildPackage: bkBuildMusePackage, hashStr: bkHashStr, realisticScore: bkRealisticScore, panelVersion: bkPanelVersion, licenseKeyHead: bkLicenseKeyHead, transmitPackage: bkTransmitMusePackage, licenseKeyFull: bkLicenseKeyFull } };
})(typeof window !== "undefined" ? window : globalThis);
