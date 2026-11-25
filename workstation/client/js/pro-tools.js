/**
 * ============================================================================
 * Dieline Maker Pro v2.0 — Packaging Pro Tools Module
 * 1. Real-World Packaging Size Presets
 * 2. Offline Vector Barcode Engine (EAN-13 & Code 128B) -> SVG & Illustrator
 * 3. Press Sheet Nesting, Waste % & Paper GSM Weight Calculator
 * 4. Vector Packaging Compliance Icons (Fragile, Keep Dry, This Side Up, Recycle)
 * ============================================================================
 */
(function (global) {
  "use strict";

  // 1. Real-world commercial packaging presets
  var SIZE_PRESETS = [
    // Cosmetics, Perfume & Pharma
    { label: "Perfume 30ml Box (48×34×105 mm)", type: "straight_tuck", L: 48, W: 34, H: 105, t: 0.4, glue: 12, tuck: 14, bleed: 3 },
    { label: "Perfume 50ml Box (60×40×125 mm)", type: "straight_tuck", L: 60, W: 40, H: 125, t: 0.4, glue: 14, tuck: 15, bleed: 3 },
    { label: "Perfume 100ml Luxury Box (78×48×145 mm)", type: "snap_lock", L: 78, W: 48, H: 145, t: 0.5, glue: 15, tuck: 16, bleed: 3 },
    { label: "Skincare Serum 30ml (38×38×112 mm)", type: "reverse_tuck", L: 38, W: 38, H: 112, t: 0.35, glue: 12, tuck: 14, bleed: 3 },
    { label: "Lipstick / Tube Box (24×24×88 mm)", type: "reverse_tuck", L: 24, W: 24, H: 88, t: 0.35, glue: 10, tuck: 12, bleed: 3 },
    { label: "Soap Bar Box (85×32×60 mm)", type: "straight_tuck", L: 85, W: 32, H: 60, t: 0.4, glue: 14, tuck: 15, bleed: 3 },
    { label: "Medicine / Syrup Carton (50×38×115 mm)", type: "reverse_tuck", L: 50, W: 38, H: 115, t: 0.35, glue: 12, tuck: 14, bleed: 3 },
    { label: "Candle Box (85×85×105 mm)", type: "auto_bottom", L: 85, W: 85, H: 105, t: 0.5, glue: 16, tuck: 16, bleed: 3 },
    // E-Commerce, Apparel & Electronics
    { label: "Small E-Commerce Mailer (180×120×55 mm)", type: "mailer", L: 180, W: 120, H: 55, t: 1.5, glue: 0, tuck: 20, bleed: 4 },
    { label: "T-Shirt / Apparel Mailer (280×200×65 mm)", type: "mailer", L: 280, W: 200, H: 65, t: 1.5, glue: 0, tuck: 22, bleed: 4 },
    { label: "Large Hoodie / Gift Mailer (350×260×95 mm)", type: "mailer", L: 350, W: 260, H: 95, t: 1.8, glue: 0, tuck: 25, bleed: 4 },
    { label: "Smartphone Rigid Tray & Lid (170×95×52 mm)", type: "tray_lid", L: 170, W: 95, H: 52, t: 1.5, glue: 15, tuck: 0, bleed: 3 },
    { label: "Luxury Gift Tray & Lid (220×160×75 mm)", type: "tray_lid", L: 220, W: 160, H: 75, t: 1.5, glue: 16, tuck: 0, bleed: 3 },
    { label: "Shoe Box (330×210×125 mm)", type: "tray_lid", L: 330, W: 210, H: 125, t: 1.8, glue: 18, tuck: 0, bleed: 4 },
    { label: "Jewelry Drawer / Matchbox (90×70×32 mm)", type: "drawer_box", L: 90, W: 70, H: 32, t: 0.8, glue: 14, tuck: 0, bleed: 3 },
    { label: "Shipping Master Carton RSC (400×300×250 mm)", type: "rsc_shipper", L: 400, W: 300, H: 250, t: 3.0, glue: 30, tuck: 0, bleed: 5 },
    // Food, Pizza & Bakery
    { label: "Pizza Box 8-inch (210×210×42 mm)", type: "pizza_box", L: 210, W: 210, H: 42, t: 1.5, glue: 0, tuck: 18, bleed: 4 },
    { label: "Pizza Box 10-inch (260×260×45 mm)", type: "pizza_box", L: 260, W: 260, H: 45, t: 1.5, glue: 0, tuck: 20, bleed: 4 },
    { label: "Pizza Box 12-inch (310×310×45 mm)", type: "pizza_box", L: 310, W: 310, H: 45, t: 1.8, glue: 0, tuck: 22, bleed: 4 },
    { label: "Burger Clamshell Box (120×120×85 mm)", type: "burger_clamshell", L: 120, W: 120, H: 85, t: 0.5, glue: 14, tuck: 15, bleed: 3 },
    { label: "French Fries Scoop Medium (85×48×115 mm)", type: "fries_scoop", L: 85, W: 48, H: 115, t: 0.4, glue: 12, tuck: 0, bleed: 3 },
    { label: "Noodle Takeout Box 16oz (85×75×98 mm)", type: "noodle_box", L: 85, W: 75, H: 98, t: 0.45, glue: 14, tuck: 15, bleed: 3 },
    { label: "Bakery Cake Box 8-inch (220×220×120 mm)", type: "cake_box", L: 220, W: 220, H: 120, t: 0.6, glue: 18, tuck: 22, bleed: 3 },
    { label: "Bakery / Lunch Gable Box (160×110×110 mm)", type: "gable", L: 160, W: 110, H: 110, t: 0.6, glue: 16, tuck: 35, bleed: 3 },
    // Pouches, Bags & Bottle Labels
    { label: "250g Coffee Stand-Up Pouch (160×80×230 mm)", type: "standup_pouch", L: 160, W: 80, H: 230, t: 0.2, glue: 10, tuck: 0, bleed: 3 },
    { label: "500g Coffee Stand-Up Pouch (190×95×270 mm)", type: "standup_pouch", L: 190, W: 95, H: 270, t: 0.2, glue: 12, tuck: 0, bleed: 3 },
    { label: "Sachet / Flat Snack Pouch (120×10×160 mm)", type: "flat_pouch", L: 120, W: 10, H: 160, t: 0.15, glue: 10, tuck: 0, bleed: 3 },
    { label: "250ml Bottle Wrap Label (182×58×75 mm)", type: "bottle_label", L: 182, W: 58, H: 75, t: 0.1, glue: 8, tuck: 0, bleed: 3 },
    { label: "500ml Bottle Wrap Label (214×68×120 mm)", type: "bottle_label", L: 214, W: 68, H: 120, t: 0.1, glue: 8, tuck: 0, bleed: 3 },
    { label: "710ml Owala Tumbler Wrap (258×82×165 mm)", type: "bottle_label", L: 258, W: 82, H: 165, t: 0.1, glue: 8, tuck: 0, bleed: 3 },
    { label: "Boutique Shopping Bag M (240×100×300 mm)", type: "paper_bag", L: 240, W: 100, H: 300, t: 0.3, glue: 20, tuck: 38, bleed: 3 },
    { label: "Jewelry Pillow Box (100×32×120 mm)", type: "pillow", L: 100, W: 32, H: 120, t: 0.4, glue: 14, tuck: 0, bleed: 3 }
  ];

  // 1B. All Standard Graphic Design, Print, Social Media & Apparel Artboard Sizes (36 Presets)
  var DESIGN_SIZES = [
    // Print & Stationery (CMYK + 3mm Bleed)
    { cat: "Print & Stationery", name: "Business Card US (3.5 × 2 in)", w: 88.9, h: 50.8, unit: "mm", mode: "CMYK", bleed: 3 },
    { cat: "Print & Stationery", name: "Business Card EU/BD (85 × 55 mm)", w: 85, h: 55, unit: "mm", mode: "CMYK", bleed: 3 },
    { cat: "Print & Stationery", name: "A4 Flyer / Letterhead (210 × 297 mm)", w: 210, h: 297, unit: "mm", mode: "CMYK", bleed: 3 },
    { cat: "Print & Stationery", name: "A5 Flyer / Leaflet (148 × 210 mm)", w: 148, h: 210, unit: "mm", mode: "CMYK", bleed: 3 },
    { cat: "Print & Stationery", name: "A3 Poster (297 × 420 mm)", w: 297, h: 420, unit: "mm", mode: "CMYK", bleed: 3 },
    { cat: "Print & Stationery", name: "A2 Large Poster (420 × 594 mm)", w: 420, h: 594, unit: "mm", mode: "CMYK", bleed: 5 },
    { cat: "Print & Stationery", name: "US Letter Flyer (8.5 × 11 in)", w: 215.9, h: 279.4, unit: "mm", mode: "CMYK", bleed: 3.175 },
    { cat: "Print & Stationery", name: "Tri-Fold Brochure A4 (297 × 210 mm)", w: 297, h: 210, unit: "mm", mode: "CMYK", bleed: 3 },
    { cat: "Print & Stationery", name: "DL Rack Card / Menu (99 × 210 mm)", w: 99, h: 210, unit: "mm", mode: "CMYK", bleed: 3 },
    { cat: "Print & Stationery", name: "Roll-Up X-Banner (800 × 2000 mm)", w: 800, h: 2000, unit: "mm", mode: "CMYK", bleed: 10 },
    { cat: "Print & Stationery", name: "Shop Signboard / Billboard (10 × 4 ft)", w: 3048, h: 1219.2, unit: "mm", mode: "CMYK", bleed: 15 },
    { cat: "Print & Stationery", name: "PVC ID Card (54 × 86 mm)", w: 54, h: 86, unit: "mm", mode: "CMYK", bleed: 2 },
    { cat: "Print & Stationery", name: "Garment Hang Tag (50 × 90 mm)", w: 50, h: 90, unit: "mm", mode: "CMYK", bleed: 3 },
    { cat: "Print & Stationery", name: "Sticker Die-Cut Square (75 × 75 mm)", w: 75, h: 75, unit: "mm", mode: "CMYK", bleed: 3 },
    { cat: "Print & Stationery", name: "Envelope DL (220 × 110 mm)", w: 220, h: 110, unit: "mm", mode: "CMYK", bleed: 3 },
    // Social Media & Digital (RGB Pixel-Exact)
    { cat: "Social Media & Digital", name: "Instagram Square Post (1080 × 1080 px)", w: 1080, h: 1080, unit: "px", mode: "RGB", bleed: 0 },
    { cat: "Social Media & Digital", name: "Instagram Portrait 4:5 (1080 × 1350 px)", w: 1080, h: 1350, unit: "px", mode: "RGB", bleed: 0 },
    { cat: "Social Media & Digital", name: "Instagram / TikTok Reel 9:16 (1080 × 1920 px)", w: 1080, h: 1920, unit: "px", mode: "RGB", bleed: 0 },
    { cat: "Social Media & Digital", name: "Facebook Feed Ad (1200 × 628 px)", w: 1200, h: 628, unit: "px", mode: "RGB", bleed: 0 },
    { cat: "Social Media & Digital", name: "Facebook Page Cover (851 × 315 px)", w: 851, h: 315, unit: "px", mode: "RGB", bleed: 0 },
    { cat: "Social Media & Digital", name: "YouTube Thumbnail (1280 × 720 px)", w: 1280, h: 720, unit: "px", mode: "RGB", bleed: 0 },
    { cat: "Social Media & Digital", name: "YouTube Channel Banner (2560 × 1440 px)", w: 2560, h: 1440, unit: "px", mode: "RGB", bleed: 0 },
    { cat: "Social Media & Digital", name: "LinkedIn Profile Banner (1584 × 396 px)", w: 1584, h: 396, unit: "px", mode: "RGB", bleed: 0 },
    { cat: "Social Media & Digital", name: "Web Hero Banner Full HD (1920 × 1080 px)", w: 1920, h: 1080, unit: "px", mode: "RGB", bleed: 0 },
    { cat: "Social Media & Digital", name: "Logo & Brand Sheet (2000 × 2000 px)", w: 2000, h: 2000, unit: "px", mode: "RGB", bleed: 0 },
    { cat: "Social Media & Digital", name: "Fiverr / Marketplace Gig Cover (1280 × 769 px)", w: 1280, h: 769, unit: "px", mode: "RGB", bleed: 0 },
    // Apparel & Merch Print Areas (300 DPI CMYK)
    { cat: "Apparel & Merch Print", name: "T-Shirt Full Front Chest (12 × 16 in)", w: 304.8, h: 406.4, unit: "mm", mode: "CMYK", bleed: 0 },
    { cat: "Apparel & Merch Print", name: "T-Shirt Left Chest Logo (4 × 4 in)", w: 101.6, h: 101.6, unit: "mm", mode: "CMYK", bleed: 0 },
    { cat: "Apparel & Merch Print", name: "Oversized T-Shirt Back Print (14 × 18 in)", w: 355.6, h: 457.2, unit: "mm", mode: "CMYK", bleed: 0 },
    { cat: "Apparel & Merch Print", name: "Long Sleeve Print Area (4 × 14 in)", w: 101.6, h: 355.6, unit: "mm", mode: "CMYK", bleed: 0 },
    { cat: "Apparel & Merch Print", name: "Inner Neck Label Print (3 × 3 in)", w: 76.2, h: 76.2, unit: "mm", mode: "CMYK", bleed: 0 },
    { cat: "Apparel & Merch Print", name: "Hoodie Front Kangaroo Above (12 × 12 in)", w: 304.8, h: 304.8, unit: "mm", mode: "CMYK", bleed: 0 },
    { cat: "Apparel & Merch Print", name: "Tote Bag Print Area (10 × 12 in)", w: 254, h: 304.8, unit: "mm", mode: "CMYK", bleed: 0 },
    { cat: "Apparel & Merch Print", name: "Cap / Hat Front Embroidery (4.5 × 2.5 in)", w: 114.3, h: 63.5, unit: "mm", mode: "CMYK", bleed: 0 },
    { cat: "Apparel & Merch Print", name: "11oz Ceramic Mug Wrap (210 × 95 mm)", w: 210, h: 95, unit: "mm", mode: "CMYK", bleed: 3 },
    { cat: "Apparel & Merch Print", name: "20oz Tumbler Sublimation Wrap (236 × 208 mm)", w: 236, h: 208, unit: "mm", mode: "CMYK", bleed: 3 }
  ];

  // 2. Standard Press Sheet Sizes (mm)
  var PRESS_SHEETS = [
    { id: "sra3", name: "SRA3 (320 × 450 mm)", w: 320, h: 450 },
    { id: "a3", name: "A3 (297 × 420 mm)", w: 297, h: 420 },
    { id: "20x30", name: "20×30 in (508 × 762 mm)", w: 508, h: 762 },
    { id: "23x36", name: "23×36 in Demy (584 × 914 mm)", w: 584, h: 914 },
    { id: "28x40", name: "28×40 in Offset (711 × 1016 mm)", w: 711, h: 1016 }
  ];

  /**
   * Calculate Sheet Nesting, Waste %, Box Weight & Press Sheets Required
   */
  function calcSheetNesting(flatW, flatH, sheetId, gsm, qty) {
    var sheet = PRESS_SHEETS.find(function (s) { return s.id === sheetId; }) || PRESS_SHEETS[3];
    var gripper = 12; // 12mm offset press gripper margin
    var gap = 4;      // 4mm die gutter between units
    var usableW = sheet.w - 10;
    var usableH = sheet.h - gripper;

    var colsA = Math.floor((usableW + gap) / (flatW + gap));
    var rowsA = Math.floor((usableH + gap) / (flatH + gap));
    var upA = Math.max(0, colsA * rowsA);

    var colsB = Math.floor((usableW + gap) / (flatH + gap));
    var rowsB = Math.floor((usableH + gap) / (flatW + gap));
    var upB = Math.max(0, colsB * rowsB);

    var bestUp = Math.max(upA, upB);
    var rotated = upB > upA;
    var sheetArea = sheet.w * sheet.h;
    var usedArea = bestUp * (flatW * flatH);
    var wastePct = bestUp > 0 ? Math.max(0, Math.round((1 - usedArea / sheetArea) * 1000) / 10) : 100;

    var boxAreaSqm = (flatW * flatH) / 1000000;
    var unitWeightG = Math.round(boxAreaSqm * (gsm || 300) * 10) / 10;
    var sheetsNeeded = bestUp > 0 ? Math.ceil((qty || 1000) / bestUp) : 0;
    var totalWeightKg = Math.round((unitWeightG * (qty || 1000)) / 100) / 10;

    return {
      sheetName: sheet.name,
      bestUp: bestUp,
      orientation: bestUp === 0 ? "Too large for sheet" : (rotated ? "90° Rotated (" + colsB + "×" + rowsB + ")" : "Standard (" + colsA + "×" + rowsA + ")"),
      wastePct: wastePct,
      unitWeightG: unitWeightG,
      sheetsNeeded: sheetsNeeded,
      totalWeightKg: totalWeightKg
    };
  }

  // 3. Pure-JS EAN-13 Vector Barcode Encoder
  var EAN_L = ["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"];
  var EAN_G = ["0100111","0110011","0011011","0100001","0011101","0111001","0000101","0010001","0001001","0010111"];
  var EAN_R = ["1110010","1100110","1101100","1000010","1011100","1001110","1010000","1000100","1001000","1110100"];
  var EAN_PARITY = ["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"];

  function computeEAN13Check(digits12) {
    var sum = 0;
    for (var i = 0; i < 12; i++) {
      sum += parseInt(digits12[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    return String((10 - (sum % 10)) % 10);
  }

  function encodeEAN13(rawInput) {
    var clean = String(rawInput || "894123456789").replace(/\D/g, "");
    while (clean.length < 12) clean += "0";
    clean = clean.substring(0, 12);
    var full = clean + computeEAN13Check(clean);

    var bits = "101"; // Start guard
    var parity = EAN_PARITY[parseInt(full[0], 10)];
    var i;
    for (i = 1; i <= 6; i++) {
      var d = parseInt(full[i], 10);
      bits += parity[i - 1] === "L" ? EAN_L[d] : EAN_G[d];
    }
    bits += "01010"; // Center guard
    for (i = 7; i <= 12; i++) {
      bits += EAN_R[parseInt(full[i], 10)];
    }
    bits += "101"; // End guard

    var bars = [];
    var totalModules = bits.length; // 95
    var runStart = -1;
    for (i = 0; i <= totalModules; i++) {
      var bit = i < totalModules ? bits[i] : "0";
      if (bit === "1" && runStart < 0) runStart = i;
      else if (bit === "0" && runStart >= 0) {
        var isGuard = (runStart < 3) || (runStart >= 45 && runStart <= 49) || (runStart >= 92);
        bars.push([runStart / totalModules, (i - runStart) / totalModules, isGuard ? 1.0 : 0.88]);
        runStart = -1;
      }
    }
    return { label: full, bars: bars };
  }

  // Code 39 fallback for alphanumeric SKUs
  var C39_MAP = {
    "0":"nnnwwnwnn","1":"wnnwnnnnw","2":"nnwwnnnnw","3":"wnwwnnnnn","4":"nnnwwnnnw","5":"wnnwwnnnn",
    "6":"nnwwwnnnn","7":"nnnwnnwnw","8":"wnnwnnwnn","9":"nnwwnnwnn","A":"wnnnnwnnw","B":"nnwnnwnnw",
    "C":"wnwnnwnnn","D":"nnnnwwnnw","E":"wnnnwwnnn","F":"nnwnwwnnn","G":"nnnnnwwnw","H":"wnnnnwwnn",
    "I":"nnwnnwwnn","J":"nnnnwwwnn","K":"wnnnnnnww","L":"nnwnnnnww","M":"wnwnnnnwn","N":"nnnnwnnww",
    "O":"wnnnwnnwn","P":"nnwnwnnwn","Q":"nnnnnnwww","R":"wnnnnnwwn","S":"nnwnnnwwn","T":"nnnnwnwwn",
    "U":"wwnnnnnnw","V":"nwwnnnnnw","W":"wwwnnnnnn","X":"nwnnwnnnw","Y":"wwnnwnnnn","Z":"nwwnwnnnn",
    "-":"nwnnnnwnw",".":"wwnnnnwnn"," ":"nwwnnnwnn","*":"nwnnwnwnn"
  };

  function encodeCode39(rawInput) {
    var text = String(rawInput || "PKG-2026").toUpperCase().replace(/[^0-9A-Z\-\. ]/g, "");
    if (!text) text = "PKG-2026";
    var seq = "*" + text + "*";
    var units = [];
    for (var i = 0; i < seq.length; i++) {
      var pat = C39_MAP[seq[i]] || C39_MAP["-"];
      for (var j = 0; j < pat.length; j++) {
        units.push({ bar: j % 2 === 0, w: pat[j] === "w" ? 2.6 : 1 });
      }
      units.push({ bar: false, w: 1 });
    }
    var totalW = units.reduce(function (s, u) { return s + u.w; }, 0);
    var x = 0, bars = [];
    for (var k = 0; k < units.length; k++) {
      if (units[k].bar) bars.push([x / totalW, units[k].w / totalW, 0.9]);
      x += units[k].w;
    }
    return { label: text, bars: bars };
  }

  function barcodeToSVG(bc) {
    var w = 220, h = 88, padX = 14, padY = 8, bh = 58;
    var bw = w - padX * 2;
    var out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + " " + h + '" width="100%" height="100%">'];
    out.push('<rect x="0" y="0" width="' + w + '" height="' + h + '" rx="6" fill="#ffffff"/>');
    for (var i = 0; i < bc.bars.length; i++) {
      var b = bc.bars[i];
      out.push('<rect x="' + (padX + b[0] * bw).toFixed(2) + '" y="' + padY + '" width="' + (b[1] * bw).toFixed(2) + '" height="' + (b[2] * bh).toFixed(2) + '" fill="#000000"/>');
    }
    out.push('<text x="' + (w / 2) + '" y="' + (h - 8) + '" font-family="monospace" font-size="11" font-weight="700" fill="#000000" text-anchor="middle">' + bc.label + "</text>");
    out.push("</svg>");
    return out.join("");
  }

  // 4. Vector Packaging Compliance Icons (normalized 0..100 coordinates)
  var COMPLIANCE_ICONS = {
    fragile: {
      id: "fragile",
      caption: "FRAGILE",
      paths: [
        { closed: false, filled: false, points: [[32, 18], [68, 18], [64, 48], [50, 58], [36, 48], [32, 18]] },
        { closed: false, filled: false, points: [[50, 58], [50, 82]] },
        { closed: false, filled: false, points: [[36, 82], [64, 82]] },
        { closed: false, filled: false, points: [[48, 22], [54, 34], [46, 42], [52, 50]] }
      ]
    },
    keep_dry: {
      id: "keep_dry",
      caption: "KEEP DRY",
      paths: [
        { closed: true, filled: false, points: [[18, 52], [30, 32], [50, 26], [70, 32], [82, 52]] },
        { closed: false, filled: false, points: [[50, 22], [50, 78], [44, 82], [38, 78]] },
        { closed: false, filled: false, points: [[28, 16], [28, 24]] },
        { closed: false, filled: false, points: [[50, 12], [50, 18]] },
        { closed: false, filled: false, points: [[72, 16], [72, 24]] }
      ]
    },
    this_side_up: {
      id: "this_side_up",
      caption: "THIS SIDE UP",
      paths: [
        { closed: false, filled: false, points: [[34, 70], [34, 24]] },
        { closed: false, filled: false, points: [[24, 36], [34, 24], [44, 36]] },
        { closed: false, filled: false, points: [[66, 70], [66, 24]] },
        { closed: false, filled: false, points: [[56, 36], [66, 24], [76, 36]] },
        { closed: false, filled: false, points: [[20, 80], [80, 80]] }
      ]
    },
    recycle: {
      id: "recycle",
      caption: "RECYCLABLE",
      paths: [
        { closed: false, filled: false, points: [[50, 18], [76, 62], [68, 62]] },
        { closed: false, filled: false, points: [[78, 70], [26, 70], [32, 62]] },
        { closed: false, filled: false, points: [[22, 62], [46, 20], [50, 28]] }
      ]
    }
  };

  global.ProTools = {
    SIZE_PRESETS: SIZE_PRESETS,
    DESIGN_SIZES: DESIGN_SIZES,
    PRESS_SHEETS: PRESS_SHEETS,
    COMPLIANCE_ICONS: COMPLIANCE_ICONS,
    calcSheetNesting: calcSheetNesting,
    encodeEAN13: encodeEAN13,
    encodeCode39: encodeCode39,
    barcodeToSVG: barcodeToSVG
  };
})(window);
