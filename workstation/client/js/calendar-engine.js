/**
 * ============================================================================
 * Design360n Workstation v17.0 — Universal + Bangla Dual-Date Calendar Engine
 * Features:
 *   - 3 Layouts:
 *       1. Classic Dual-Date (7 Cols: Big Gregorian Date + Small Bangla Panjika Date)
 *       2. Royal Wide (14 Cols: 2 Weeks per Row — Bangladeshi Wall Calendar Standard!)
 *       3. Clean Plain (7 Cols: Single Date — English, Bangla Unicode, or Bangla ANSI)
 *   - Built-in Bangladesh Academy Solar Calendar (বৈশাখ–চৈত্র, বঙ্গাব্দ, Leap-Year Falgun!)
 *   - 8 Date Box Styles + Month Outer Card Box + Custom Corner Radius + Any Cols x Rows
 *   - Dual Font Support (Main Font + Separate Bangla Sub-Date Font) + Unicode & Bijoy ANSI
 * ============================================================================
 */
(function (global) {
  "use strict";

  var MONTHS_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  var DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  var MONTHS_BN_UNI = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];
  var DAYS_BN_UNI = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];

  var BN_SOLAR_MONTHS_UNI = [
    "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন",
    "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"
  ];
  // Verified Bijoy ANSI for 12 Bengali Solar Months (বৈশাখ..চৈত্র)
  var BN_SOLAR_MONTHS_ANSI = [
    "\u2030ekvL", "\u02C6R¨ô", "Avlvp", "kÖveY", "fv`ª", "Avwk\u00A6b",
    "KvwZ©K", "AMÖnvqY", "\u2020cŠl", "gvN", "dvêyb", "\u2030PÎ"
  ];

  var MONTHS_BN_ANSI = [
    "Rvbyqvwi", "\u2020de\u00AA\u00E6qvwi", "gvP\u00A9", "Gwc\u00D6j", "\u2020g", "Ryb",
    "RyjvB", "AvM\u00F7", "\u2020m\u2021\u00DF\u00A4^i", "A\u2021\u00B1vei", "b\u2021f\u00A4^i", "wW\u2021m\u00A4^i"
  ];
  var DAYS_BN_ANSI = ["iwe", "\u2020mvg", "g\u00BDj", "eya", "e\u201Ent", "\u00EF\u00B5", "kwb"];

  var BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  function toBnUnicodeDigits(num) {
    return String(num).replace(/[0-9]/g, function (d) { return BN_DIGITS[parseInt(d, 10)]; });
  }

  function isLeapYear(y) {
    return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
  }

  /**
   * Bangladesh Bangla Academy Revised Calendar (Pohela Boishakh = April 14)
   * Returns { bnYear, bnMonthIdx (0..11), bnDay (1..31), bnMonthUni, bnMonthAnsi }
   */
  function gregorianToBangla(year, monthIdx, day) {
    var dt = new Date(year, monthIdx, day);
    var pohela = new Date(year, 3, 14); // April 14
    var bnYear = (dt >= pohela) ? (year - 593) : (year - 594);
    var startYear = (dt >= pohela) ? year : (year - 1);
    var startDate = new Date(startYear, 3, 14);
    var diffDays = Math.round((dt.getTime() - startDate.getTime()) / 86400000);

    // Bangla Academy month lengths: first 6 months = 31 days, next 5 = 30 days, Falgun (idx 10) = 29 (30 in leap year of startYear+1)
    var falgunDays = isLeapYear(startYear + 1) ? 30 : 29;
    var lens = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, falgunDays, 30];
    var m = 0;
    while (m < 11 && diffDays >= lens[m]) {
      diffDays -= lens[m];
      m++;
    }
    return {
      bnYear: bnYear,
      bnMonthIdx: m,
      bnDay: diffDays + 1,
      bnMonthUni: BN_SOLAR_MONTHS_UNI[m],
      bnMonthAnsi: BN_SOLAR_MONTHS_ANSI[m]
    };
  }

  var SIZE_PRESETS = [
    { id: "desk_a5", name: "Desk Calendar A5 Landscape (210 × 148 mm)", w: 210, h: 148 },
    { id: "wall_a4", name: "Wall Calendar A4 Portrait (210 × 297 mm)",  w: 210, h: 297 },
    { id: "wall_a3", name: "Wall Calendar A3 Portrait (297 × 420 mm)",  w: 297, h: 420 },
    { id: "wall_lg", name: "Large Wall Poster (450 × 600 mm)",          w: 450, h: 600 },
    { id: "pocket",  name: "Pocket Card Calendar (85 × 55 mm)",         w: 85,  h: 55  },
    { id: "square",  name: "Square Desk Calendar (180 × 180 mm)",       w: 180, h: 180 }
  ];

  var STYLES = [
    { id: "minimal",   name: "Modern Minimal (Underline)" },
    { id: "desk",      name: "Filled Header Bar (Rounded)" },
    { id: "corporate", name: "Corporate Solid Header" },
    { id: "editorial", name: "Bold Editorial (Left Align)" },
    { id: "luxury",    name: "Luxury Pill Outline" },
    { id: "dark",      name: "Dark Studio Theme" }
  ];

  function formatNumber(n, langMode, forPreview) {
    if (langMode === "bn_unicode") return toBnUnicodeDigits(n);
    if (langMode === "bn_ansi" && forPreview) return toBnUnicodeDigits(n);
    return String(n);
  }

  function buildMonthData(year, monthIdx, weekStart, weekendMode, langMode, layoutMode) {
    var firstDay = new Date(year, monthIdx, 1).getDay();
    var daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
    var offset = (firstDay - weekStart + 7) % 7;

    var isWide14 = (layoutMode === "royal_14");
    var showDualBn = (layoutMode === "classic_dual" || layoutMode === "royal_14");
    var gridCols = isWide14 ? 14 : 7;

    var mainLang = (langMode === "bn_unicode" || langMode === "bn_ansi") ? langMode : "en";
    var subIsAnsi = (langMode === "bn_ansi" || langMode === "en_bn_ansi");
    var mArr = mainLang === "bn_unicode" ? MONTHS_BN_UNI : (mainLang === "bn_ansi" ? MONTHS_BN_ANSI : MONTHS_EN);
    var dArr = mainLang === "bn_unicode" ? DAYS_BN_UNI   : (mainLang === "bn_ansi" ? DAYS_BN_ANSI   : DAYS_EN);
    var mPrevArr = (mainLang === "bn_ansi" || mainLang === "bn_unicode") ? MONTHS_BN_UNI : MONTHS_EN;
    var dPrevArr = (mainLang === "bn_ansi" || mainLang === "bn_unicode") ? DAYS_BN_UNI : DAYS_EN;

    var headers = [], previewHeaders = [], weekendCols = [];
    for (var c = 0; c < gridCols; c++) {
      var dow = (weekStart + (c % 7)) % 7;
      headers.push(dArr[dow]);
      previewHeaders.push(dPrevArr[dow]);
      var isWE = false;
      if (weekendMode === "fri_sat") isWE = (dow === 5 || dow === 6);
      else if (weekendMode === "sat_sun") isWE = (dow === 6 || dow === 0);
      else if (weekendMode === "sun_only") isWE = (dow === 0);
      else if (weekendMode === "fri_only") isWE = (dow === 5);
      weekendCols.push(isWE);
    }

    // Build cell objects: { main, prevMain, sub, prevSub }
    var bnStart = gregorianToBangla(year, monthIdx, 1);
    var bnEnd   = gregorianToBangla(year, monthIdx, daysInMonth);
    var bnSubUni = bnStart.bnMonthIdx === bnEnd.bnMonthIdx
      ? (bnStart.bnMonthUni + " " + toBnUnicodeDigits(bnStart.bnYear))
      : (bnStart.bnMonthUni + "–" + bnEnd.bnMonthUni + " " + toBnUnicodeDigits(bnEnd.bnYear));
    var bnSubAnsi = bnStart.bnMonthIdx === bnEnd.bnMonthIdx
      ? (bnStart.bnMonthAnsi + " " + bnStart.bnYear)
      : (bnStart.bnMonthAnsi + "-" + bnEnd.bnMonthAnsi + " " + bnEnd.bnYear);

    var cells = [];
    for (var i = 0; i < offset; i++) cells.push(null);
    for (var d = 1; d <= daysInMonth; d++) {
      var bn = showDualBn ? gregorianToBangla(year, monthIdx, d) : null;
      cells.push({
        main: formatNumber(d, mainLang, false),
        prevMain: formatNumber(d, mainLang, true),
        sub: bn ? (subIsAnsi ? String(bn.bnDay) : toBnUnicodeDigits(bn.bnDay)) : "",
        prevSub: bn ? toBnUnicodeDigits(bn.bnDay) : ""
      });
    }
    while (cells.length % gridCols !== 0) cells.push(null);

    var weeks = [];
    for (var r = 0; r < cells.length; r += gridCols) {
      weeks.push(cells.slice(r, r + gridCols));
    }

    return {
      year: year,
      yearLabel: formatNumber(year, mainLang, false),
      previewYearLabel: formatNumber(year, mainLang, true),
      monthIdx: monthIdx,
      monthName: mArr[monthIdx],
      previewMonthName: mPrevArr[monthIdx],
      bnRange: showDualBn ? (subIsAnsi ? bnSubAnsi : bnSubUni) : "",
      previewBnRange: showDualBn ? bnSubUni : "",
      gridCols: gridCols,
      showDualBn: showDualBn,
      headers: headers,
      previewHeaders: previewHeaders,
      weekendCols: weekendCols,
      weeks: weeks
    };
  }

  function buildCalendarPlan(opts) {
    var year = parseInt(opts.year, 10) || 2026;
    var cols = Math.max(1, Math.min(6, parseInt(opts.cols, 10) || 3));
    var rows = Math.max(1, Math.min(12, parseInt(opts.rows, 10) || 4));
    var startMonth = Math.max(0, Math.min(11, parseInt(opts.month, 10) || 0));
    var monthCount = Math.max(1, Math.min(12, parseInt(opts.monthCount, 10) || Math.min(12, cols * rows)));
    var weekStart = parseInt(opts.weekStart, 10) || 0;
    var weekendMode = opts.weekendMode || "fri_sat";
    var langMode = opts.langMode || "en_bn_uni";
    var mainLang = (langMode === "bn_unicode" || langMode === "bn_ansi") ? langMode : "en";
    var layoutMode = opts.layoutMode || "classic_dual"; // "classic_dual" | "royal_14" | "plain_7"
    var boxMode = opts.boxMode || "none";

    var months = [];
    for (var k = 0; k < monthCount; k++) {
      var mIdx = (startMonth + k) % 12;
      var yVal = year + Math.floor((startMonth + k) / 12);
      months.push(buildMonthData(yVal, mIdx, weekStart, weekendMode, langMode, layoutMode));
    }

    return {
      year: year,
      yearLabel: formatNumber(year, mainLang, false),
      previewYearLabel: formatNumber(year, mainLang, true),
      langMode: langMode,
      layoutMode: layoutMode,
      boxMode: boxMode,
      monthBox: !!opts.monthBox,
      cols: cols, rows: rows, monthCount: monthCount,
      widthMm: parseFloat(opts.widthMm) || 210,
      heightMm: parseFloat(opts.heightMm) || 297,
      style: opts.style || "minimal",
      titleFont: opts.titleFont || opts.fontName || "Montserrat",
      dowFont: opts.dowFont || opts.fontName || "Montserrat",
      fontName: opts.fontName || "Montserrat",
      bnSubFont: opts.bnSubFont || "Nirmala UI",
      bigPt: parseFloat(opts.bigPt) || 0,
      smallPt: parseFloat(opts.smallPt) || 0,
      accentColor: opts.accentColor || "#0ea5e9",
      textColor: opts.textColor || "#111827",
      weekendColor: opts.weekendColor || "#e11d48",
      months: months
    };
  }

  function toSVG(plan, forExport) {
    var W = plan.widthMm, H = plan.heightMm;
    var isDark = (plan.style === "dark");
    var bgCol = isDark ? "#0b1120" : "#ffffff";
    var txtCol = isDark ? "#f1f5f9" : plan.textColor;
    var subCol = isDark ? "#94a3b8" : "#64748b";
    var gridCol = isDark ? "rgba(148,163,184,0.28)" : "#cbd5e1";
    var padX = W * 0.055, padY = H * 0.055;
    var titleH = plan.months.length > 1 ? H * 0.085 : 0;
    var useRaw = !!forExport;
    var yrStr = useRaw ? plan.yearLabel : plan.previewYearLabel;

    var parts = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="100%" height="100%">',
      '<rect width="' + W + '" height="' + H + '" fill="' + bgCol + '" />'
    ];

    var ff = (useRaw ? plan.fontName : (plan.langMode !== "en" ? "Hind Siliguri, Nirmala UI, Noto Sans Bengali, sans-serif" : plan.fontName)).replace(/"/g, "");
    if (plan.months.length > 1) {
      parts.push('<text x="' + (W / 2).toFixed(2) + '" y="' + (padY + titleH * 0.58).toFixed(2) + '" text-anchor="middle" font-family="' + ff + ', sans-serif" font-weight="800" font-size="' + (titleH * 0.60).toFixed(2) + '" fill="' + plan.accentColor + '">' + yrStr + '</text>');
    }

    var areaW = W - padX * 2, areaH = H - padY * 2 - titleH;
    var gapX = plan.cols > 1 ? areaW * 0.038 : 0;
    var gapY = plan.rows > 1 ? areaH * 0.038 : 0;
    var cellW = (areaW - gapX * (plan.cols - 1)) / plan.cols;
    var cellH = (areaH - gapY * (plan.rows - 1)) / plan.rows;

    for (var i = 0; i < plan.months.length; i++) {
      var md = plan.months[i];
      var gCols = md.gridCols || 7;
      var numRows = Math.max(md.weeks.length, gCols === 14 ? 3 : 6);
      var mName = useRaw ? md.monthName : md.previewMonthName;
      var hArr  = useRaw ? md.headers   : md.previewHeaders;
      var bnRng = useRaw ? md.bnRange   : md.previewBnRange;
      var gc = i % plan.cols, gr = Math.floor(i / plan.cols);
      var mx = padX + gc * (cellW + gapX), my = padY + titleH + gr * (cellH + gapY);
      var mHeadH = cellH * (bnRng ? 0.22 : 0.19), dowH = cellH * 0.12, bodyY = my + mHeadH + dowH, bodyH = cellH - mHeadH - dowH;
      var rowH = bodyH / numRows, colW = cellW / gCols;
      var titleLbl = (plan.langMode === "en" && (plan.style === "desk" || plan.style === "corporate"))
        ? (mName.toUpperCase() + (plan.months.length === 1 ? (" " + yrStr) : ""))
        : (mName + (plan.months.length === 1 ? (" " + yrStr) : ""));

      var sw = Math.max(0.18, cellW * 0.0045).toFixed(2);
      if (plan.monthBox) {
        var mp = cellW * 0.03;
        parts.push('<rect x="' + (mx - mp).toFixed(2) + '" y="' + (my - mp).toFixed(2) + '" width="' + (cellW + mp * 2).toFixed(2) + '" height="' + (cellH + mp * 2).toFixed(2) + '" rx="' + (mp * 1.6).toFixed(2) + '" fill="none" stroke="' + plan.accentColor + '" stroke-width="' + (parseFloat(sw) * 1.3).toFixed(2) + '" />');
      }

      // Header Style + Bangla Solar Month Subtitle
      if (plan.style === "desk" || plan.style === "corporate") {
        parts.push('<rect x="' + mx.toFixed(2) + '" y="' + my.toFixed(2) + '" width="' + cellW.toFixed(2) + '" height="' + (mHeadH * 0.86).toFixed(2) + '" rx="' + (plan.style === "desk" ? (mHeadH * 0.18).toFixed(2) : "0") + '" fill="' + plan.accentColor + '" />');
        parts.push('<text x="' + (mx + cellW / 2).toFixed(2) + '" y="' + (my + mHeadH * (bnRng ? 0.44 : 0.58)).toFixed(2) + '" text-anchor="middle" font-family="' + ff + ', sans-serif" font-weight="700" font-size="' + (mHeadH * (bnRng ? 0.36 : 0.44)).toFixed(2) + '" fill="#ffffff">' + titleLbl + '</text>');
        if (bnRng) parts.push('<text x="' + (mx + cellW / 2).toFixed(2) + '" y="' + (my + mHeadH * 0.74).toFixed(2) + '" text-anchor="middle" font-family="Hind Siliguri, sans-serif" font-size="' + (mHeadH * 0.24).toFixed(2) + '" fill="rgba(255,255,255,0.88)">' + bnRng + '</text>');
      } else if (plan.style === "luxury") {
        parts.push('<rect x="' + (mx + cellW * 0.10).toFixed(2) + '" y="' + (my + mHeadH * 0.06).toFixed(2) + '" width="' + (cellW * 0.80).toFixed(2) + '" height="' + (mHeadH * 0.78).toFixed(2) + '" rx="' + (mHeadH * 0.38).toFixed(2) + '" fill="none" stroke="' + plan.accentColor + '" stroke-width="' + Math.max(0.3, cellW * 0.008).toFixed(2) + '" />');
        parts.push('<text x="' + (mx + cellW / 2).toFixed(2) + '" y="' + (my + mHeadH * (bnRng ? 0.44 : 0.58)).toFixed(2) + '" text-anchor="middle" font-family="' + ff + ', sans-serif" font-weight="700" font-size="' + (mHeadH * 0.36).toFixed(2) + '" fill="' + plan.accentColor + '">' + titleLbl + '</text>');
        if (bnRng) parts.push('<text x="' + (mx + cellW / 2).toFixed(2) + '" y="' + (my + mHeadH * 0.72).toFixed(2) + '" text-anchor="middle" font-family="Hind Siliguri, sans-serif" font-size="' + (mHeadH * 0.22).toFixed(2) + '" fill="' + subCol + '">' + bnRng + '</text>');
      } else {
        var isEd = (plan.style === "editorial");
        parts.push('<text x="' + (isEd ? mx : mx + cellW / 2).toFixed(2) + '" y="' + (my + mHeadH * (bnRng ? 0.48 : 0.66)).toFixed(2) + '" text-anchor="' + (isEd ? "start" : "middle") + '" font-family="' + ff + ', sans-serif" font-weight="800" font-size="' + (mHeadH * (isEd ? 0.46 : 0.40)).toFixed(2) + '" fill="' + plan.accentColor + '">' + titleLbl + '</text>');
        if (bnRng) parts.push('<text x="' + (isEd ? mx : mx + cellW / 2).toFixed(2) + '" y="' + (my + mHeadH * 0.78).toFixed(2) + '" text-anchor="' + (isEd ? "start" : "middle") + '" font-family="Hind Siliguri, sans-serif" font-size="' + (mHeadH * 0.24).toFixed(2) + '" fill="' + subCol + '">' + bnRng + '</text>');
        parts.push('<line x1="' + mx.toFixed(2) + '" y1="' + (my + mHeadH * 0.92).toFixed(2) + '" x2="' + (mx + cellW).toFixed(2) + '" y2="' + (my + mHeadH * 0.92).toFixed(2) + '" stroke="' + plan.accentColor + '" stroke-width="' + Math.max(0.25, cellW * 0.007).toFixed(2) + '" />');
      }

      // Weekday Headers (7 or 14 columns!)
      for (var c = 0; c < gCols; c++) {
        parts.push('<text x="' + (mx + (c + 0.5) * colW).toFixed(2) + '" y="' + (my + mHeadH + dowH * 0.68).toFixed(2) + '" text-anchor="middle" font-family="' + ff + ', sans-serif" font-weight="700" font-size="' + (Math.min(dowH * 0.52, colW * 0.34)).toFixed(2) + '" fill="' + (md.weekendCols[c] ? plan.weekendColor : txtCol) + '">' + hArr[c] + '</text>');
      }

      // Box / Grid Lines
      if (plan.boxMode === "grid") {
        parts.push('<rect x="' + mx.toFixed(2) + '" y="' + (my + mHeadH).toFixed(2) + '" width="' + cellW.toFixed(2) + '" height="' + dowH.toFixed(2) + '" fill="none" stroke="' + gridCol + '" stroke-width="' + sw + '" />');
        parts.push('<rect x="' + mx.toFixed(2) + '" y="' + bodyY.toFixed(2) + '" width="' + cellW.toFixed(2) + '" height="' + bodyH.toFixed(2) + '" fill="none" stroke="' + gridCol + '" stroke-width="' + sw + '" />');
        for (var gc2 = 1; gc2 < gCols; gc2++) parts.push('<line x1="' + (mx + gc2 * colW).toFixed(2) + '" y1="' + bodyY.toFixed(2) + '" x2="' + (mx + gc2 * colW).toFixed(2) + '" y2="' + (bodyY + bodyH).toFixed(2) + '" stroke="' + gridCol + '" stroke-width="' + sw + '" />');
        for (var gr2 = 1; gr2 < numRows; gr2++) parts.push('<line x1="' + mx.toFixed(2) + '" y1="' + (bodyY + gr2 * rowH).toFixed(2) + '" x2="' + (mx + cellW).toFixed(2) + '" y2="' + (bodyY + gr2 * rowH).toFixed(2) + '" stroke="' + gridCol + '" stroke-width="' + sw + '" />');
      } else if (plan.boxMode === "rows") {
        for (var gr3 = 0; gr3 <= numRows; gr3++) parts.push('<line x1="' + mx.toFixed(2) + '" y1="' + (bodyY + gr3 * rowH).toFixed(2) + '" x2="' + (mx + cellW).toFixed(2) + '" y2="' + (bodyY + gr3 * rowH).toFixed(2) + '" stroke="' + gridCol + '" stroke-width="' + sw + '" />');
      } else if (plan.boxMode === "cols") {
        for (var gc3 = 0; gc3 <= gCols; gc3++) parts.push('<line x1="' + (mx + gc3 * colW).toFixed(2) + '" y1="' + bodyY.toFixed(2) + '" x2="' + (mx + gc3 * colW).toFixed(2) + '" y2="' + (bodyY + bodyH).toFixed(2) + '" stroke="' + gridCol + '" stroke-width="' + sw + '" />');
      }

      // Date Cells (Single OR Classic Dual-Date Big + Small Bangla!)
      for (var r = 0; r < md.weeks.length; r++) {
        for (var c2 = 0; c2 < gCols; c2++) {
          var cell = md.weeks[r][c2];
          if (!cell) continue;
          var mainTxt = useRaw ? cell.main : cell.prevMain;
          var subTxt  = useRaw ? cell.sub  : cell.prevSub;
          var padB = Math.min(colW, rowH) * 0.07;
          var cellStroke = md.weekendCols[c2] ? plan.weekendColor : gridCol;

          if (plan.boxMode === "cells" || plan.boxMode === "sq_cells") {
            var rRad = plan.boxMode === "cells" ? (padB * 1.6).toFixed(2) : "0";
            parts.push('<rect x="' + (mx + c2 * colW + padB).toFixed(2) + '" y="' + (bodyY + r * rowH + padB).toFixed(2) + '" width="' + (colW - padB * 2).toFixed(2) + '" height="' + (rowH - padB * 2).toFixed(2) + '" rx="' + rRad + '" fill="none" stroke="' + cellStroke + '" stroke-width="' + sw + '" />');
          } else if (plan.boxMode === "circles") {
            var radC = Math.min(colW, rowH) * 0.42;
            parts.push('<circle cx="' + (mx + (c2 + 0.5) * colW).toFixed(2) + '" cy="' + (bodyY + (r + 0.5) * rowH).toFixed(2) + '" r="' + radC.toFixed(2) + '" fill="none" stroke="' + cellStroke + '" stroke-width="' + sw + '" />');
          } else if (plan.boxMode === "filled_cells") {
            var fillTint = isDark ? "rgba(255,255,255,0.08)" : (md.weekendCols[c2] ? "rgba(225,29,72,0.10)" : "rgba(148,163,184,0.16)");
            parts.push('<rect x="' + (mx + c2 * colW + padB).toFixed(2) + '" y="' + (bodyY + r * rowH + padB).toFixed(2) + '" width="' + (colW - padB * 2).toFixed(2) + '" height="' + (rowH - padB * 2).toFixed(2) + '" rx="' + (padB * 1.4).toFixed(2) + '" fill="' + fillTint + '" />');
          }

          var bigFs = Math.min(colW, rowH) * (md.showDualBn ? 0.44 : 0.50);
          var subFs = bigFs * 0.56;
          if (md.showDualBn && subTxt) {
            // Side-by-side Dual Date (Big English/Main on left, Small Bangla Panjika on bottom-right!)
            parts.push('<text x="' + (mx + (c2 + 0.36) * colW).toFixed(2) + '" y="' + (bodyY + (r + 0.62) * rowH).toFixed(2) + '" text-anchor="middle" font-family="' + ff + ', sans-serif" font-weight="700" font-size="' + bigFs.toFixed(2) + '" fill="' + (md.weekendCols[c2] ? plan.weekendColor : txtCol) + '">' + mainTxt + '</text>');
            parts.push('<text x="' + (mx + (c2 + 0.76) * colW).toFixed(2) + '" y="' + (bodyY + (r + 0.76) * rowH).toFixed(2) + '" text-anchor="middle" font-family="Hind Siliguri, sans-serif" font-weight="600" font-size="' + subFs.toFixed(2) + '" fill="' + subCol + '">' + subTxt + '</text>');
          } else {
            parts.push('<text x="' + (mx + (c2 + 0.5) * colW).toFixed(2) + '" y="' + (bodyY + (r + 0.66) * rowH).toFixed(2) + '" text-anchor="middle" font-family="' + ff + ', sans-serif" font-weight="600" font-size="' + bigFs.toFixed(2) + '" fill="' + (md.weekendCols[c2] ? plan.weekendColor : txtCol) + '">' + mainTxt + '</text>');
          }
        }
      }
    }
    parts.push('</svg>');
    return parts.join("");
  }

  global.CalendarEngine = {
    MONTHS: MONTHS_EN,
    SIZE_PRESETS: SIZE_PRESETS,
    STYLES: STYLES,
    gregorianToBangla: gregorianToBangla,
    buildCalendarPlan: buildCalendarPlan,
    toSVG: toSVG
  };
})(typeof window !== "undefined" ? window : global);
