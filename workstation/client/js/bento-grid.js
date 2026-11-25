/* Design360n Workstation v17.7.19 — Bento Grid System Generator
 * Generates Apple-style & Brand-Presentation asymmetric Bento Grids with
 * live interactive SVG preview, 1-click Shuffle, Presets, Gutter, Margin,
 * Corner Radius, and native Illustrator vector/guide/clipping-frame export. */
(function (global) {
  "use strict";

  var csInterface = (typeof CSInterface !== "undefined") ? new CSInterface() : null;

  var PRESETS = {
    apple_hero: [
      { c: 0, r: 0, cs: 2, rs: 2 },
      { c: 2, r: 0, cs: 2, rs: 1 },
      { c: 2, r: 1, cs: 1, rs: 1 },
      { c: 3, r: 1, cs: 1, rs: 2 },
      { c: 0, r: 2, cs: 1, rs: 1 },
      { c: 1, r: 2, cs: 2, rs: 1 }
    ],
    brand_sheet: [
      { c: 0, r: 0, cs: 2, rs: 2 },
      { c: 2, r: 0, cs: 1, rs: 1 },
      { c: 3, r: 0, cs: 1, rs: 1 },
      { c: 2, r: 1, cs: 2, rs: 1 },
      { c: 0, r: 2, cs: 1, rs: 1 },
      { c: 1, r: 2, cs: 1, rs: 1 },
      { c: 2, r: 2, cs: 2, rs: 1 }
    ],
    portfolio_center: [
      { c: 0, r: 0, cs: 1, rs: 2 },
      { c: 1, r: 0, cs: 2, rs: 2 },
      { c: 3, r: 0, cs: 1, rs: 1 },
      { c: 3, r: 1, cs: 1, rs: 2 },
      { c: 0, r: 2, cs: 2, rs: 1 },
      { c: 2, r: 2, cs: 1, rs: 1 }
    ],
    editorial: [
      { c: 0, r: 0, cs: 3, rs: 1 },
      { c: 3, r: 0, cs: 1, rs: 2 },
      { c: 0, r: 1, cs: 2, rs: 2 },
      { c: 2, r: 1, cs: 1, rs: 1 },
      { c: 2, r: 2, cs: 2, rs: 1 }
    ]
  };

  var PALETTE = ["#0ea5e9", "#2ed3a3", "#6366f1", "#f59e0b", "#ec4899", "#14b8a6", "#8b5cf6", "#334155"];

  function seededRand(seed) {
    var s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  function generateRandomBento(cols, rows, seed) {
    var rnd = seededRand(seed || 101);
    var grid = [];
    for (var r = 0; r < rows; r++) {
      grid[r] = [];
      for (var c = 0; c < cols; c++) grid[r][c] = false;
    }
    var cells = [];
    for (var rr = 0; rr < rows; rr++) {
      for (var cc = 0; cc < cols; cc++) {
        if (grid[rr][cc]) continue;
        // Max available span from (cc, rr)
        var maxW = 1;
        while (cc + maxW < cols && !grid[rr][cc + maxW] && maxW < Math.max(2, Math.ceil(cols * 0.6))) maxW++;
        var maxH = 1;
        while (rr + maxH < rows && !grid[rr + maxH][cc] && maxH < Math.max(2, Math.ceil(rows * 0.6))) maxH++;

        var cs = 1, rs = 1;
        var roll = rnd();
        if (roll < 0.28 && maxW >= 2 && maxH >= 2) { cs = 2; rs = 2; }
        else if (roll < 0.56 && maxW >= 2) { cs = (maxW >= 3 && rnd() < 0.25) ? 3 : 2; rs = 1; }
        else if (roll < 0.80 && maxH >= 2) { cs = 1; rs = 2; }

        // Verify full rectangle is free
        var ok = true;
        for (var y = rr; y < rr + rs; y++) {
          for (var x = cc; x < cc + cs; x++) {
            if (grid[y][x]) ok = false;
          }
        }
        if (!ok) { cs = 1; rs = 1; }
        for (var y2 = rr; y2 < rr + rs; y2++) {
          for (var x2 = cc; x2 < cc + cs; x2++) grid[y2][x2] = true;
        }
        cells.push({ c: cc, r: rr, cs: cs, rs: rs });
      }
    }
    return cells;
  }

  function generateUniform(cols, rows) {
    var out = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) out.push({ c: c, r: r, cs: 1, rs: 1 });
    }
    return out;
  }

  function buildBentoPlan(opts) {
    var mode = opts.mode || "random";
    var cols = Math.max(2, Math.min(8, parseInt(opts.cols, 10) || 4));
    var rows = Math.max(2, Math.min(8, parseInt(opts.rows, 10) || 3));
    var cells;
    if (mode === "uniform") {
      cells = generateUniform(cols, rows);
    } else if (PRESETS[mode]) {
      cols = 4; rows = 3;
      cells = PRESETS[mode].map(function (x) { return { c: x.c, r: x.r, cs: x.cs, rs: x.rs }; });
    } else {
      cells = generateRandomBento(cols, rows, opts.seed || 101);
    }

    return {
      mode: mode,
      cols: cols,
      rows: rows,
      gutter: Math.max(0, parseFloat(opts.gutter) || 0),
      margin: Math.max(0, parseFloat(opts.margin) || 0),
      radius: Math.max(0, parseFloat(opts.radius) || 0),
      style: opts.style || "filled", // filled | stroke | guides | palette
      fillColor: opts.fillColor || "#1e293b",
      strokeColor: opts.strokeColor || "#3bcdca",
      artboardPreset: opts.artboardPreset || "active",
      cells: cells
    };
  }

  function bentoToSVG(plan) {
    var W = 320, H = 200;
    if (plan.artboardPreset === "1080x1080") { W = 220; H = 220; }
    else if (plan.artboardPreset === "1080x1350") { W = 200; H = 250; }
    else if (plan.artboardPreset === "a4_p") { W = 190; H = 268; }

    var pad = Math.min(W, H) * Math.min(0.18, (plan.margin / 220));
    var gut = Math.min(W, H) * Math.min(0.08, (plan.gutter / 220));
    var usableW = W - pad * 2 - gut * (plan.cols - 1);
    var usableH = H - pad * 2 - gut * (plan.rows - 1);
    var cw = usableW / plan.cols;
    var ch = usableH / plan.rows;
    var rx = Math.min(Math.min(cw, ch) * 0.45, plan.radius * 0.45);

    var parts = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="100%">',
      '<rect width="' + W + '" height="' + H + '" rx="6" fill="#070c16"/>'
    ];
    plan.cells.forEach(function (cell, idx) {
      var x = pad + cell.c * (cw + gut);
      var y = pad + cell.r * (ch + gut);
      var w = cell.cs * cw + (cell.cs - 1) * gut;
      var h = cell.rs * ch + (cell.rs - 1) * gut;
      var fill = "none", stroke = plan.strokeColor, dash = "";
      if (plan.style === "filled") { fill = plan.fillColor; stroke = "rgba(111,232,192,0.45)"; }
      else if (plan.style === "palette") { fill = PALETTE[idx % PALETTE.length]; stroke = "none"; }
      else if (plan.style === "guides") { fill = "rgba(56,189,248,0.08)"; stroke = "#38bdf8"; dash = ' stroke-dasharray="3 2"'; }
      parts.push('<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="' + rx.toFixed(1) + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.2"' + dash + '/>');
      parts.push('<text x="' + (x + w / 2).toFixed(1) + '" y="' + (y + h / 2 + 3).toFixed(1) + '" text-anchor="middle" fill="#cbd5e1" font-family="Inter,sans-serif" font-size="9" font-weight="700" opacity="0.72">' + (idx + 1) + '</text>');
    });
    parts.push("</svg>");
    return parts.join("");
  }

  function escJSX(obj) {
    var json = JSON.stringify(obj).replace(/[\u007F-\uFFFF]/g, function (ch) {
      return "\\u" + ("0000" + ch.charCodeAt(0).toString(16)).slice(-4);
    });
    return json.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  function initBentoUI() {
    var elMode = document.getElementById("bentoMode");
    var elCols = document.getElementById("bentoCols");
    var elRows = document.getElementById("bentoRows");
    var elGutter = document.getElementById("bentoGutter");
    var elMargin = document.getElementById("bentoMargin");
    var elRadius = document.getElementById("bentoRadius");
    var elStyle = document.getElementById("bentoStyle");
    var elPreset = document.getElementById("bentoArtboard");
    var elFill = document.getElementById("bentoFillCol");
    var elStroke = document.getElementById("bentoStrokeCol");
    var elPrev = document.getElementById("bentoPreview");
    var elStat = document.getElementById("bentoStatus");
    var btnShuf = document.getElementById("btnBentoShuffle");
    var btnGen = document.getElementById("btnBentoGenerate");
    if (!elMode || !elPrev) return;

    var curSeed = 1047;

    function readPlan() {
      return buildBentoPlan({
        mode: elMode.value,
        cols: elCols.value,
        rows: elRows.value,
        gutter: elGutter.value,
        margin: elMargin.value,
        radius: elRadius.value,
        style: elStyle.value,
        artboardPreset: elPreset.value,
        fillColor: elFill.value,
        strokeColor: elStroke.value,
        seed: curSeed
      });
    }

    function refresh() {
      var plan = readPlan();
      elPrev.innerHTML = bentoToSVG(plan);
      if (elStat) elStat.textContent = plan.cells.length + " Bento cards (" + plan.cols + "×" + plan.rows + " grid) — ready to generate in Illustrator.";
    }

    [elMode, elCols, elRows, elGutter, elMargin, elRadius, elStyle, elPreset, elFill, elStroke].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", refresh);
      el.addEventListener("change", refresh);
    });

    if (btnShuf) {
      btnShuf.addEventListener("click", function () {
        elMode.value = "random";
        curSeed = Math.floor(Math.random() * 999999) + 1;
        refresh();
      });
    }

    if (btnGen) {
      btnGen.addEventListener("click", function () {
        var plan = readPlan();
        if (!csInterface || !csInterface.isInCEP()) {
          if (elStat) elStat.textContent = "Preview Mode: Open inside Adobe Illustrator to create Bento Grid.";
          return;
        }
        if (elStat) elStat.textContent = "Generating Bento Grid in Illustrator…";
        csInterface.evalScript("dmGenerateBentoGrid('" + escJSX(plan) + "')", function (res) {
          if (elStat) {
            elStat.textContent = (res && res.indexOf("OK:") === 0) ? res.substring(3) : (res || "Bento Grid created!");
            elStat.style.color = (res && res.indexOf("ERROR:") === 0) ? "#f87171" : "#3bcdca";
          }
        });
      });
    }

    refresh();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initBentoUI);
    else initBentoUI();
  }

  global.BentoGrid = { buildBentoPlan: buildBentoPlan, bentoToSVG: bentoToSVG };
})(typeof window !== "undefined" ? window : globalThis);
