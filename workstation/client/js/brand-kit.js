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
  var bkMockupBusy = false;
  var bkPlanFn = null;
  var bkLogoFilePath = "";
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
  function bkPickBest(results) {
    var usable = (results || []).filter(bkUsableImage);
    if (usable.length === 0) return null;
    function score(r) {
      var s = (r.width || 0) * (r.height || 0);
      if ((r.width || 0) >= (r.height || 0)) s += 1000000;
      if (r.license === "cc0" || r.license === "pdm") s += 500000;
      if (/flat|front view|straight|overhead/i.test(r.title || "")) s += 300000;
      return s;
    }
    usable.sort(function (a, b) { return score(b) - score(a); });
    return usable[0];
  }
  function bkQueryURL(q, page) {
    return BK_MOCKUP_API + "?q=" + encodeURIComponent(q) + "&page_size=8&license_type=commercial&page=" + (page || 1);
  }
  function bkFetchCategory(cat, industry, mood, page, done) {
    var def = BK_MOCKUPS[cat];
    if (!def) { done(null); return; }
    var queries = [];
    var qi;
    for (qi = 0; qi < def.queries.length; qi++) {
      if (mood && industry) queries.push(mood + " " + industry + " " + def.queries[qi]);
      if (industry) queries.push(industry + " " + def.queries[qi]);
      queries.push(def.queries[qi]);
    }
    var i = 0;
    function next() {
      if (i >= queries.length) { done(null); return; }
      var q = queries[i++];
      bkFetchJSON(bkQueryURL(q, page), 12000).then(function (j) {
        var best = j ? bkPickBest(j.results) : null;
        if (best) done(best);
        else next();
      });
    }
    next();
  }
  function bkDownloadImage(url, filename, done) {
    var n = bkNode();
    var dir = bkTempDir();
    if (!n || !dir) { done(null); return; }
    var ext = /\.png(\?|#|$)/i.test(url) ? ".png" : ".jpg";
    var full = n.path.join(dir, filename + ext);
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
  function bkMockupTones() {
    var out = {};
    for (var cat in bkMockupCache) {
      if (bkMockupCache.hasOwnProperty(cat) && bkMockupCache[cat].tone) out[cat] = bkMockupCache[cat].tone;
    }
    return out;
  }
  function bkFetchAll(cats, industry, mood, progress, done) {
    var idx = 0;
    function next() {
      if (idx >= cats.length) { done(); return; }
      var cat = cats[idx++];
      if (progress) progress(cat, idx, cats.length);
      bkFetchCategory(cat, industry, mood, 1, function (best) {
        if (!best) { next(); return; }
        bkDownloadImage(best.url, cat, function (localPath) {
          if (localPath) {
            bkMockupCache[cat] = { url: best.url, localPath: localPath, title: best.title || cat, license: best.license || "", creator: best.creator || "", width: best.width || 0, height: best.height || 0, tone: "busy" };
            bkSampleFileTone(localPath, function (tone) {
              bkMockupCache[cat].tone = tone;
              next();
            });
          } else next();
        });
      });
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
        bkFetchCategory(cat, plan.industry, bkMoodWord(plan.personality), 2, function (best) {
          if (!best) { if (st) st.textContent = "No alternate photo found for " + cat + "."; return; }
          bkDownloadImage(best.url, cat + "_alt" + Date.now(), function (localPath) {
            if (localPath) {
              bkMockupCache[cat] = { url: best.url, localPath: localPath, title: best.title || cat, license: best.license || "", creator: best.creator || "", width: best.width || 0, height: best.height || 0, tone: "busy" };
              bkSampleFileTone(localPath, function (tone) {
                bkMockupCache[cat].tone = tone;
                bkRenderThumbs();
                if (st) st.textContent = "Swapped " + cat + " mockup ✓";
              });
            } else if (st) st.textContent = "Download failed for " + cat + ".";
          });
        });
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
      setStatus("Fetching online mockups from Openverse… (0/" + cats.length + ")");
      bkFetchAll(cats, plan.industry, bkMoodWord(plan.personality), function (cat, n, total) {
        setStatus("Fetching online mockups… (" + n + "/" + total + ") — " + (BK_MOCKUPS[cat] ? BK_MOCKUPS[cat].label : cat));
        bkRenderThumbs();
      }, function () {
        bkMockupBusy = false;
        btn.disabled = false;
        bkRenderThumbs();
        var n = Object.keys(bkMockupCache).length;
        setStatus(n > 0 ? ("Ready: " + n + " real mockup photo(s) downloaded ✓ — Generate will place them in the artwork. Click a thumbnail to swap it.") : "Could not fetch mockups (offline?). Generate will use the vector-only sheets.");
      });
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
        logoSource: elLogoSrc ? elLogoSrc.value : "illustrator",
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
        function doGenerate(finalPlan) {
          if (elStat) { elStat.textContent = "Building multi-artboard Brand Identity Kit in Illustrator…"; elStat.style.color = "#3bcdca"; }
          csInterface.evalScript("dmGenerateBrandKitAI('" + escJSX(finalPlan) + "')", function (res) {
            if (elStat) {
              elStat.textContent = (res && res.indexOf("OK:") === 0) ? res.substring(3) : (res || "Brand Identity Kit created!");
              elStat.style.color = (res && res.indexOf("ERROR:") === 0) ? "#f87171" : "#3bcdca";
            }
          });
        }
        /* Step 2 — fetch any mockup photos still missing, then generate. */
        function afterLogo(finalPlan) {
          var need = (finalPlan.mockupMode !== "off") ? bkEnabledCats(finalPlan).filter(function (c) { return !bkMockupCache[c]; }) : [];
          if (need.length === 0) { doGenerate(finalPlan); return; }
          if (bkMockupBusy) { if (elStat) elStat.textContent = "Still fetching mockups — please wait a few seconds, then Generate again."; return; }
          bkMockupBusy = true;
          if (elStat) { elStat.textContent = "Fetching online mockups for your brand…"; elStat.style.color = "#3bcdca"; }
          bkFetchAll(need, finalPlan.industry, bkMoodWord(finalPlan.personality), function (cat, n, total) {
            if (elStat) elStat.textContent = "Fetching online mockups… (" + n + "/" + total + ")";
            bkRenderThumbs();
          }, function () {
            bkMockupBusy = false;
            bkRenderThumbs();
            finalPlan.mockups = bkMockupPaths();
            finalPlan.mockupTone = bkMockupTones();
            doGenerate(finalPlan);
          });
        }
        /* Step 1 — resolve the logo source (Illustrator selection / file /
         * generated text). Illustrator mode exports the selected artwork as
         * a transparent PNG first; with nothing selected we STOP and tell
         * the user — never generate with a wrong logo. */
        function resolveLogoFile(cb) {
          if (plan.logoSource === "illustrator") {
            if (elStat) { elStat.textContent = "Exporting your selected logo from Illustrator…"; elStat.style.color = "#3bcdca"; }
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
              } else {
                if (elStat) { elStat.textContent = "Logo export hoyni (" + (res || "unknown error") + ") — logo file ba Generated text logo use koren."; elStat.style.color = "#f87171"; }
                cb(false);
              }
            });
          } else if (plan.logoSource === "file") {
            if (bkLogoFilePath) {
              plan.logoFile = bkLogoFilePath;
              bkSampleFileTone(plan.logoFile, function (tone) {
                bkLogoToneCurrent = tone; plan.logoTone = tone;
                cb(true);
              });
            } else {
              plan.logoFile = "";
              plan.logoTone = bkHexTone(plan.primary);
              if (elStat) { elStat.textContent = "Kono logo file pick kora hoyni — generated text logo diye banano hocche."; elStat.style.color = "#f59e0b"; }
              cb(true);
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

    /* --- Logo source: Illustrator selection (default) / file / generated --- */
    var elLogoSrc = document.getElementById("bkLogoSource");
    var elLogoFile = document.getElementById("bkLogoFile");
    var elLogoFileRow = document.getElementById("bkLogoFileRow");
    var elLogoFileStatus = document.getElementById("bkLogoFileStatus");
    function syncLogoSourceUI() {
      if (elLogoFileRow) elLogoFileRow.style.display = (elLogoSrc && elLogoSrc.value === "file") ? "" : "none";
    }
    if (elLogoSrc) elLogoSrc.addEventListener("change", syncLogoSourceUI);
    syncLogoSourceUI();
    if (elLogoFile) {
      elLogoFile.addEventListener("change", function () {
        var f = elLogoFile.files && elLogoFile.files[0];
        if (!f) { bkLogoFilePath = ""; bkLogoToneCurrent = ""; if (elLogoFileStatus) elLogoFileStatus.textContent = ""; return; }
        var name = f.name || "";
        if (!/\.(png|jpe?g)$/i.test(name)) {
          bkLogoFilePath = ""; bkLogoToneCurrent = "";
          if (elLogoFileStatus) elLogoFileStatus.textContent = "Only PNG or JPG logo files — this file was not used.";
          return;
        }
        var n = bkNode(), dir = bkTempDir();
        if (!n || !dir) {
          bkLogoFilePath = ""; bkLogoToneCurrent = "";
          if (elLogoFileStatus) elLogoFileStatus.textContent = "Could not copy the logo file (no temp folder access).";
          return;
        }
        var ext = /\.png$/i.test(name) ? ".png" : ".jpg";
        var dest = n.path.join(dir, "logo_user" + ext);
        var rd = new FileReader();
        rd.onload = function () {
          try {
            var buf = (typeof Buffer !== "undefined") ? Buffer.from(rd.result) : new Uint8Array(rd.result);
            n.fs.writeFileSync(dest, buf);
            bkLogoFilePath = dest;
            bkSampleFileTone(dest, function (tone) { bkLogoToneCurrent = tone; });
            if (elLogoFileStatus) elLogoFileStatus.textContent = "Logo file ready: " + name + " ✓ — it will be stamped on every mockup.";
          } catch (e) {
            bkLogoFilePath = ""; bkLogoToneCurrent = "";
            if (elLogoFileStatus) elLogoFileStatus.textContent = "Could not read that file — pick the PNG again, or use 'Logo from Illustrator'.";
          }
        };
        rd.onerror = function () {
          bkLogoFilePath = ""; bkLogoToneCurrent = "";
          if (elLogoFileStatus) elLogoFileStatus.textContent = "Could not read that file — pick the PNG again, or use 'Logo from Illustrator'.";
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

  global.BrandKitStudio = { brandPreviewSVG: brandPreviewSVG, rgbToCmykStr: rgbToCmykStr, mockupCatalog: BK_MOCKUPS, templateZones: BK_TEMPLATE_ZONES, suggestTemplate: bkSuggestTemplate, moodWord: bkMoodWord, toneFromPixels: bkToneFromPixels };
})(typeof window !== "undefined" ? window : globalThis);
