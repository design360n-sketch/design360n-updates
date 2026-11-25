/**
 * ============================================================================
 * Design360n Workstation v9.0 — Universal 30-Type Parametric Packaging Engine
 * Categories:
 *   1. Folding Cartons (6): RTE, STE, Snap-Lock, Auto-Bottom, Hang-Tab Auto, Seal End
 *   2. E-Commerce & Corrugated (5): Mailer 0427, Shipper 0201, Pizza 0426, Book Wrap, Tray & Lid
 *   3. Food, Bakery & Takeaway (5): Gable, Burger Clamshell, Fries Scoop, Noodle Pail, Cake Window
 *   4. Specialty, Luxury & Gift (5): Pillow, Sleeve, Slide Drawer/Matchbox, Hexagon, Pyramid
 *   5. Display & Retail POS (2): Counter PDQ Display, Gravity Dispenser Box
 *   6. Pouches, Bags & Folders (4): Stand-Up Pouch, 3-Side Seal Sachet, Paper Bag, Pocket Folder
 *   7. Labels, Tags & Custom (3): Bottle/Jar Label, Die-Cut Hang Tag, Custom Box Builder
 * ============================================================================
 */
(function (global) {
  "use strict";

  var UNIT_TO_MM = { mm: 1, cm: 10, in: 25.4 };

  var PACKAGING_CATALOG = [
    // 1. Folding Cartons
    { id: "reverse_tuck", name: "Reverse Tuck End (RTE)", category: "Folding Cartons", desc: "Cosmetic, pharma & retail carton", defaults: { L: 80, W: 50, H: 130, t: 0.4, glue: 14, tuck: 16, bleed: 3 } },
    { id: "straight_tuck", name: "Straight Tuck End (STE)", category: "Folding Cartons", desc: "Premium retail & perfume carton", defaults: { L: 85, W: 55, H: 140, t: 0.4, glue: 14, tuck: 16, bleed: 3 } },
    { id: "snap_lock", name: "Snap-Lock Bottom (1-2-3)", category: "Folding Cartons", desc: "Interlocking heavy-duty bottom flaps", defaults: { L: 90, W: 70, H: 150, t: 0.5, glue: 15, tuck: 18, bleed: 3 } },
    { id: "auto_bottom", name: "Auto-Lock / Crash Bottom", category: "Folding Cartons", desc: "Pre-glued fast-assembly bottom", defaults: { L: 95, W: 75, H: 145, t: 0.5, glue: 16, tuck: 18, bleed: 3 } },
    { id: "tuck_top_auto_bot", name: "Hang-Tab Retail Carton (Euro Slot)", category: "Folding Cartons", desc: "Pegboard hanging retail box", defaults: { L: 85, W: 45, H: 140, t: 0.4, glue: 14, tuck: 16, bleed: 3 } },
    { id: "seal_end", name: "Seal End Box (Cereal / Toothpaste)", category: "Folding Cartons", desc: "Full-overlap glued top & bottom", defaults: { L: 140, W: 55, H: 200, t: 0.5, glue: 16, tuck: 0, bleed: 3 } },

    // 2. E-Commerce & Corrugated
    { id: "mailer", name: "Mailer Box (FEFCO 0427)", category: "E-Commerce & Corrugated", desc: "Roll-end tuck-front shipping box", defaults: { L: 200, W: 140, H: 65, t: 1.5, glue: 0, tuck: 22, bleed: 4 } },
    { id: "rsc_shipper", name: "Shipping Carton (FEFCO 0201)", category: "E-Commerce & Corrugated", desc: "Regular slotted corrugated shipper", defaults: { L: 240, W: 160, H: 150, t: 3.0, glue: 30, tuck: 0, bleed: 4 } },
    { id: "pizza_box", name: "Pizza / Flat Hinged Box (FEFCO 0426)", category: "E-Commerce & Corrugated", desc: "Front-tuck pizza & flat bakery box", defaults: { L: 260, W: 260, H: 45, t: 1.8, glue: 0, tuck: 25, bleed: 4 } },
    { id: "book_mailer", name: "Book Wrap Mailer (FEFCO 0401)", category: "E-Commerce & Corrugated", desc: "Cross-fold book & frame shipper", defaults: { L: 230, W: 165, H: 35, t: 1.8, glue: 0, tuck: 0, bleed: 4 } },
    { id: "tray_lid", name: "Two-Piece Rigid Tray & Lid", category: "E-Commerce & Corrugated", desc: "Telescoping gift, shoe & apparel box", defaults: { L: 160, W: 120, H: 55, t: 1.2, glue: 15, tuck: 0, bleed: 3 } },

    // 3. Food, Bakery & Takeaway
    { id: "gable", name: "Gable Top Carry Box", category: "Food, Bakery & Takeaway", desc: "Food, bakery & gift box with handle", defaults: { L: 140, W: 90, H: 120, t: 0.6, glue: 16, tuck: 35, bleed: 3 } },
    { id: "burger_clamshell", name: "Burger / Clamshell Food Box", category: "Food, Bakery & Takeaway", desc: "Tapered hinged takeaway clamshell", defaults: { L: 115, W: 115, H: 75, t: 0.5, glue: 12, tuck: 18, bleed: 3 } },
    { id: "fries_scoop", name: "French Fries / Popcorn Scoop Box", category: "Food, Bakery & Takeaway", desc: "Curved-front QSR snack scoop carton", defaults: { L: 85, W: 45, H: 110, t: 0.45, glue: 14, tuck: 0, bleed: 3 } },
    { id: "noodle_box", name: "Takeout Noodle / Oyster Pail", category: "Food, Bakery & Takeaway", desc: "Interlocking top-flap food pail", defaults: { L: 95, W: 85, H: 105, t: 0.5, glue: 14, tuck: 20, bleed: 3 } },
    { id: "cake_box", name: "Bakery Cake / Pastry Box (Window)", category: "Food, Bakery & Takeaway", desc: "One-piece cake box with top window", defaults: { L: 200, W: 200, H: 100, t: 0.8, glue: 18, tuck: 24, bleed: 3 } },

    // 4. Specialty, Luxury & Gift
    { id: "pillow", name: "Pillow Box", category: "Specialty, Luxury & Gift", desc: "Curved arc fold gift & jewelry box", defaults: { L: 110, W: 36, H: 140, t: 0.4, glue: 14, tuck: 0, bleed: 3 } },
    { id: "sleeve", name: "Packaging Sleeve / Belly Band", category: "Specialty, Luxury & Gift", desc: "Open wrap-around slipcase sleeve", defaults: { L: 120, W: 45, H: 90, t: 0.4, glue: 16, tuck: 0, bleed: 3 } },
    { id: "drawer_box", name: "Slide Drawer / Matchbox (2-Piece)", category: "Specialty, Luxury & Gift", desc: "Inner tray drawer + outer slide sleeve", defaults: { L: 130, W: 85, H: 40, t: 1.0, glue: 15, tuck: 0, bleed: 3 } },
    { id: "hexagon_box", name: "Hexagonal 6-Sided Box", category: "Specialty, Luxury & Gift", desc: "6-panel luxury candle, tea & jar box", defaults: { L: 55, W: 55, H: 120, t: 0.5, glue: 14, tuck: 16, bleed: 3 } },
    { id: "pyramid_box", name: "Pyramid / Triangular Favor Box", category: "Specialty, Luxury & Gift", desc: "4-triangle gift & chocolate pyramid", defaults: { L: 85, W: 85, H: 105, t: 0.4, glue: 12, tuck: 0, bleed: 3 } },

    // 5. Display & Retail POS
    { id: "display_tray", name: "Counter Display Box (PDQ)", category: "Display & Retail POS", desc: "Slanted open-front retail display", defaults: { L: 160, W: 110, H: 130, t: 1.2, glue: 18, tuck: 0, bleed: 3 } },
    { id: "dispenser_box", name: "Gravity Dispenser / Tear-Front Box", category: "Display & Retail POS", desc: "Perforated front-scoop sachet box", defaults: { L: 110, W: 85, H: 180, t: 0.5, glue: 15, tuck: 16, bleed: 3 } },

    // 6. Pouches, Bags & Folders
    { id: "standup_pouch", name: "Stand-Up Pouch (Doypack)", category: "Pouches, Bags & Folders", desc: "Coffee & snack pouch with bottom gusset", defaults: { L: 140, W: 70, H: 210, t: 0.2, glue: 10, tuck: 0, bleed: 3 } },
    { id: "flat_pouch", name: "3-Side Seal Flat Sachet / Mylar", category: "Pouches, Bags & Folders", desc: "Flat spice, mask & sample sachet", defaults: { L: 110, W: 10, H: 150, t: 0.15, glue: 10, tuck: 0, bleed: 3 } },
    { id: "paper_bag", name: "Gusseted Shopping / Paper Bag", category: "Pouches, Bags & Folders", desc: "Retail carry bag with turn-top & handles", defaults: { L: 200, W: 90, H: 250, t: 0.3, glue: 20, tuck: 35, bleed: 3 } },
    { id: "pocket_folder", name: "Presentation Pocket Folder", category: "Pouches, Bags & Folders", desc: "Bi-fold corporate folder with pocket", defaults: { L: 220, W: 10, H: 310, t: 0.4, glue: 15, tuck: 85, bleed: 3 } },

    // 7. Labels, Tags & Custom Builder
    { id: "bottle_label", name: "Wrap-Around Bottle / Jar Label", category: "Labels, Tags & Custom", desc: "L = Circumference, H = Label Height", defaults: { L: 210, W: 67, H: 95, t: 0.1, glue: 8, tuck: 0, bleed: 3 } },
    { id: "hang_tag", name: "Die-Cut Apparel Hang / Swing Tag", category: "Labels, Tags & Custom", desc: "Chamfered garment tag with string hole", defaults: { L: 55, W: 5, H: 95, t: 0.4, glue: 0, tuck: 0, bleed: 3 } },
    { id: "custom_box", name: "Custom Box + Window / Hang Tab", category: "Labels, Tags & Custom", desc: "Configurable flaps, window & Euro slot", defaults: { L: 90, W: 55, H: 140, t: 0.4, glue: 15, tuck: 16, bleed: 3 } }
  ];

  function toMm(val, unit) { return Number(val) * (UNIT_TO_MM[unit] || 1); }
  function formatUnit(mmVal, unit) {
    var v = mmVal / (UNIT_TO_MM[unit] || 1);
    return (Math.round(v * 10) / 10) + " " + unit;
  }
  function poly(points, closed) { return { type: "polyline", closed: !!closed, points: points }; }
  function line(x1, y1, x2, y2) { return { type: "polyline", closed: false, points: [[x1, y1], [x2, y2]] }; }
  function rect(x, y, w, h) { return poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true); }

  function roundedRect(x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    var k = r * 0.55228475;
    return {
      type: "bezier", closed: true,
      anchors: [
        { p: [x + r, y], l: [x + r - k, y], r: [x + r, y] },
        { p: [x + w - r, y], l: [x + w - r, y], r: [x + w - r + k, y] },
        { p: [x + w, y + r], l: [x + w, y + r - k], r: [x + w, y + r] },
        { p: [x + w, y + h - r], l: [x + w, y + h - r], r: [x + w, y + h - r + k] },
        { p: [x + w - r, y + h], l: [x + w - r + k, y + h], r: [x + w - r, y + h] },
        { p: [x + r, y + h], l: [x + r, y + h], r: [x + r - k, y + h] },
        { p: [x, y + h - r], l: [x, y + h - r + k], r: [x, y + h - r] },
        { p: [x, y + r], l: [x, y + r], r: [x, y + r - k] }
      ]
    };
  }

  function circle(cx, cy, r) {
    var k = r * 0.55228475;
    return {
      type: "bezier", closed: true,
      anchors: [
        { p: [cx, cy - r], l: [cx - k, cy - r], r: [cx + k, cy - r] },
        { p: [cx + r, cy], l: [cx + r, cy - k], r: [cx + r, cy + k] },
        { p: [cx, cy + r], l: [cx + k, cy + r], r: [cx - k, cy + r] },
        { p: [cx - r, cy], l: [cx - r, cy + k], r: [cx - r, cy - k] }
      ]
    };
  }

  function normalizeGeometry(cut, crease, bleed, dimensions, bleedMm) {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    function scan(list) {
      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (item.points) {
          for (var j = 0; j < item.points.length; j++) {
            var p = item.points[j];
            if (p[0] < minX) minX = p[0]; if (p[1] < minY) minY = p[1];
            if (p[0] > maxX) maxX = p[0]; if (p[1] > maxY) maxY = p[1];
          }
        }
        if (item.anchors) {
          for (var a = 0; a < item.anchors.length; a++) {
            var an = item.anchors[a], pts = [an.p, an.l || an.p, an.r || an.p];
            for (var q = 0; q < pts.length; q++) {
              if (pts[q][0] < minX) minX = pts[q][0]; if (pts[q][1] < minY) minY = pts[q][1];
              if (pts[q][0] > maxX) maxX = pts[q][0]; if (pts[q][1] > maxY) maxY = pts[q][1];
            }
          }
        }
      }
    }
    scan(cut); scan(crease);
    var pad = Math.max(bleedMm || 3, 2);
    var shiftX = -minX + pad, shiftY = -minY + pad;

    function shiftList(list) {
      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        if (item.points) {
          for (var j = 0; j < item.points.length; j++) {
            item.points[j] = [Math.round((item.points[j][0] + shiftX) * 100) / 100, Math.round((item.points[j][1] + shiftY) * 100) / 100];
          }
        }
        if (item.anchors) {
          for (var a = 0; a < item.anchors.length; a++) {
            var an = item.anchors[a];
            an.p = [Math.round((an.p[0] + shiftX) * 100) / 100, Math.round((an.p[1] + shiftY) * 100) / 100];
            if (an.l) an.l = [Math.round((an.l[0] + shiftX) * 100) / 100, Math.round((an.l[1] + shiftY) * 100) / 100];
            if (an.r) an.r = [Math.round((an.r[0] + shiftX) * 100) / 100, Math.round((an.r[1] + shiftY) * 100) / 100];
          }
        }
      }
    }
    shiftList(cut); shiftList(crease); shiftList(bleed);
    for (var d = 0; d < dimensions.length; d++) {
      dimensions[d].x1 = Math.round((dimensions[d].x1 + shiftX) * 100) / 100;
      dimensions[d].y1 = Math.round((dimensions[d].y1 + shiftY) * 100) / 100;
      dimensions[d].x2 = Math.round((dimensions[d].x2 + shiftX) * 100) / 100;
      dimensions[d].y2 = Math.round((dimensions[d].y2 + shiftY) * 100) / 100;
    }
    var totalW = Math.round(((maxX - minX) + pad * 2) * 100) / 100;
    var totalH = Math.round(((maxY - minY) + pad * 2) * 100) / 100;
    if (bleed.length === 0 && bleedMm > 0) bleed.push(rect(0, 0, totalW, totalH));
    return { width: totalW, height: totalH };
  }

  function addTuckAssembly(cut, crease, x, y, L, W, tuck, dir) {
    var yMid = y + dir * W, yEnd = yMid + dir * tuck;
    var taper = Math.min(3.5, L * 0.05), r = Math.min(4, tuck * 0.35);
    crease.push(line(x, y, x + L, y));
    crease.push(line(x, yMid, x + L, yMid));
    cut.push(poly([[x, y], [x, yMid], [x + taper, yEnd - dir * r], [x + taper + r, yEnd], [x + L - taper - r, yEnd], [x + L - taper, yEnd - dir * r], [x + L, yMid], [x + L, y]], false));
  }

  function addDustFlap(cut, crease, x, y, W, dir) {
    var dustH = Math.min(W * 0.65, 38), inset = Math.min(4, W * 0.08), shoulder = Math.min(5, dustH * 0.25);
    crease.push(line(x, y, x + W, y));
    cut.push(poly([[x, y], [x + 1.5, y + dir * shoulder], [x + inset, y + dir * dustH], [x + W - inset, y + dir * dustH], [x + W - 1.5, y + dir * shoulder], [x + W, y]], false));
  }

  function buildCarton(params, mode) {
    var L = params.L, W = params.W, H = params.H, glue = Math.max(params.glue || 14, 8), tuck = Math.max(params.tuck || 16, 10), unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    var x0 = 0, x1 = glue, x2 = x1 + W, x3 = x2 + L, x4 = x3 + W, x5 = x4 + L, y0 = 0, y1 = H;
    var gTaper = Math.min(5, glue * 0.35);

    cut.push(poly([[x1, y0], [x0, y0 + gTaper], [x0, y1 - gTaper], [x1, y1]], false));
    crease.push(line(x1, y0, x1, y1)); crease.push(line(x2, y0, x2, y1));
    crease.push(line(x3, y0, x3, y1)); crease.push(line(x4, y0, x4, y1));
    cut.push(line(x5, y0, x5, y1));

    var hasTopTuck = mode !== "custom_box" || params.optTopTuck !== false;
    var hasBottomTuck = mode !== "custom_box" || params.optBottomTuck !== false;
    var hasDust = mode !== "custom_box" || params.optDustFlaps !== false;

    if (mode === "seal_end") {
      // Full-overlap glued flaps on both top and bottom
      var fO = W * 0.92;
      crease.push(line(x1, y0, x5, y0)); crease.push(line(x1, y1, x5, y1));
      var ps = [[x1, x2], [x2, x3], [x3, x4], [x4, x5]];
      for (var s = 0; s < ps.length; s++) {
        var isSide = (s === 0 || s === 2), fh = isSide ? W * 0.6 : fO;
        cut.push(poly([[ps[s][0] + 1, y0], [ps[s][0] + 2, y0 - fh], [ps[s][1] - 2, y0 - fh], [ps[s][1] - 1, y0]], false));
        cut.push(poly([[ps[s][0] + 1, y1], [ps[s][0] + 2, y1 + fh], [ps[s][1] - 2, y1 + fh], [ps[s][1] - 1, y1]], false));
      }
      dims.push({ x1: x2, y1: y1 + fO + 10, x2: x3, y2: y1 + fO + 10, label: "L: " + formatUnit(L, unit) });
      dims.push({ x1: x5 + 10, y1: y0, x2: x5 + 10, y2: y1, label: "H: " + formatUnit(H, unit) });
      return { cut: cut, crease: crease, bleed: bleed, dims: dims };
    }

    if (hasTopTuck) {
      addTuckAssembly(cut, crease, x4, y0, L, W, tuck, -1);
      cut.push(line(x2, y0, x3, y0));
      if (hasDust) { addDustFlap(cut, crease, x1, y0, W, -1); addDustFlap(cut, crease, x3, y0, W, -1); }
      else { cut.push(line(x1, y0, x2, y0)); cut.push(line(x3, y0, x4, y0)); }
    } else cut.push(line(x1, y0, x5, y0));

    if (mode === "tuck_top_auto_bot") {
      // Pegboard header tab with Euro Slot on Back panel top
      var tabH = 30;
      cut.push(poly([[x4, y0 - W], [x4 + 4, y0 - W - tabH], [x5 - 4, y0 - W - tabH], [x5, y0 - W]], false));
      var hx = x4 + L / 2, hy = y0 - W - tabH / 2;
      cut.push(roundedRect(hx - 14, hy - 3, 28, 6, 3));
      cut.push(circle(hx, hy - 2, 4.5));
    }

    if (mode === "reverse_tuck" || mode === "custom_box" || mode === "dispenser_box") {
      if (hasBottomTuck) {
        addTuckAssembly(cut, crease, x2, y1, L, W, tuck, 1);
        cut.push(line(x4, y1, x5, y1));
        if (hasDust) { addDustFlap(cut, crease, x1, y1, W, 1); addDustFlap(cut, crease, x3, y1, W, 1); }
        else { cut.push(line(x1, y1, x2, y1)); cut.push(line(x3, y1, x4, y1)); }
      } else cut.push(line(x1, y1, x5, y1));
    } else if (mode === "straight_tuck") {
      addTuckAssembly(cut, crease, x4, y1, L, W, tuck, 1);
      cut.push(line(x2, y1, x3, y1));
      addDustFlap(cut, crease, x1, y1, W, 1); addDustFlap(cut, crease, x3, y1, W, 1);
    } else if (mode === "snap_lock") {
      var fMain = W * 0.72, fSide = W * 0.55, fLock = W * 0.65, midB = x4 + L / 2;
      crease.push(line(x1, y1, x5, y1));
      cut.push(poly([[x1, y1], [x1 + 2, y1 + fSide], [x2 - 2, y1 + fSide * 0.78], [x2, y1]], false));
      cut.push(poly([[x2, y1], [x2 + 4, y1 + fMain], [x3 - 4, y1 + fMain], [x3, y1]], false));
      cut.push(poly([[x3, y1], [x3 + 2, y1 + fSide * 0.78], [x4 - 2, y1 + fSide], [x4, y1]], false));
      cut.push(poly([[x4, y1], [x4 + 3, y1 + fLock], [midB - L * 0.14, y1 + fLock], [midB - L * 0.1, y1 + fLock * 0.6], [midB + L * 0.1, y1 + fLock * 0.6], [midB + L * 0.14, y1 + fLock], [x5 - 3, y1 + fLock], [x5, y1]], false));
    } else if (mode === "auto_bottom" || mode === "tuck_top_auto_bot") {
      var fH = W * 0.62;
      crease.push(line(x1, y1, x5, y1));
      crease.push(line(x2, y1, x2 + fH, y1 + fH)); crease.push(line(x4, y1, x4 + fH, y1 + fH));
      cut.push(poly([[x1, y1], [x1 + 2, y1 + fH * 0.85], [x2 - 2, y1 + fH * 0.85], [x2, y1]], false));
      cut.push(poly([[x2, y1], [x2 + 2, y1 + fH], [x3 - 4, y1 + fH], [x3, y1]], false));
      cut.push(poly([[x3, y1], [x3 + 2, y1 + fH * 0.85], [x4 - 2, y1 + fH * 0.85], [x4, y1]], false));
      cut.push(poly([[x4, y1], [x4 + 2, y1 + fH], [x5 - 4, y1 + fH], [x5, y1]], false));
    }

    if (mode === "dispenser_box") {
      // Tear-away front dispenser window at bottom of Front panel (x2..x3)
      var dH = Math.min(H * 0.36, 65), dW = L * 0.78, dx = x2 + (L - dW) / 2, dy = y1 - dH;
      crease.push(poly([[dx, y1], [dx, dy + 8], [dx + 8, dy], [dx + dW - 8, dy], [dx + dW, dy + 8], [dx + dW, y1]], false));
      cut.push(circle(x2 + L / 2, dy, 7)); // Finger punch tear hole
    }

    if (mode === "custom_box") {
      if (params.optWindow) {
        var winW = Math.min(L * 0.65, Math.max(15, params.winW || L * 0.55));
        var winH = Math.min(H * 0.55, Math.max(15, params.winH || H * 0.45));
        cut.push(roundedRect(x2 + (L - winW) / 2, y0 + (H - winH) / 2, winW, winH, Math.min(6, winW * 0.12)));
      }
      if (params.optHangTab) {
        var hx2 = x4 + L / 2, slotY = y0 - W * 0.5;
        cut.push(roundedRect(hx2 - 14, slotY - 3, 28, 6, 3));
        cut.push(circle(hx2, slotY - 2, 4.5));
      }
    }

    dims.push({ x1: x2, y1: y1 + W + tuck + 10, x2: x3, y2: y1 + W + tuck + 10, label: "L: " + formatUnit(L, unit) });
    dims.push({ x1: x3, y1: y1 + W + tuck + 10, x2: x4, y2: y1 + W + tuck + 10, label: "W: " + formatUnit(W, unit) });
    dims.push({ x1: x5 + 10, y1: y0, x2: x5 + 10, y2: y1, label: "H: " + formatUnit(H, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildMailer(params, isPizza) {
    var L = params.L, W = params.W, H = params.H, unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    var y0 = 0, lidLip = Math.min(H * 0.62, 30), y1 = y0 + lidLip, y2 = y1 + W, y3 = y2 + H, y4 = y3 + W, y5 = y4 + H, y6 = y5 + H * (isPizza ? 0.45 : 0.85);
    var sideSpan = isPizza ? H : H * 2;
    var xL = sideSpan, xR = xL + L, earW = Math.min(22, H * 0.6);

    cut.push(poly([
      [xL + 4, y0], [xR - 4, y0], [xR, y1], [xR + earW, y1 + 4], [xR + earW, y2 - 4], [xR, y2], [xR, y3],
      [xR + sideSpan, y3 + 3], [xR + sideSpan, y4 - 3], [xR, y4],
      [xR, y5], [xR - 4, y6], [xL + 4, y6], [xL, y5], [xL, y4],
      [xL - sideSpan, y4 - 3], [xL - sideSpan, y3 + 3], [xL, y3],
      [xL, y2], [xL - earW, y2 - 4], [xL - earW, y1 + 4], [xL, y1], [xL + 4, y0]
    ], true));

    [y1, y2, y3, y4, y5].forEach(function (yy) { crease.push(line(xL, yy, xR, yy)); });
    crease.push(line(xL, y1, xL, y2)); crease.push(line(xR, y1, xR, y2));
    crease.push(line(xL, y3, xL, y4)); crease.push(line(xR, y3, xR, y4));
    if (!isPizza) {
      crease.push(line(xL - H, y3 + 2, xL - H, y4 - 2));
      crease.push(line(xR + H, y3 + 2, xR + H, y4 - 2));
    } else {
      // Pizza vent holes on back wall
      cut.push(circle(xL + L * 0.25, y2 + H / 2, 4));
      cut.push(circle(xL + L * 0.75, y2 + H / 2, 4));
    }
    var tabW = Math.min(H * 0.85, W * 0.42);
    cut.push(poly([[xL, y2], [xL - tabW, y2 + 3], [xL - tabW, y3 - 3], [xL, y3]], false));
    cut.push(poly([[xR, y2], [xR + tabW, y2 + 3], [xR + tabW, y3 - 3], [xR, y3]], false));
    crease.push(line(xL, y2, xL, y3)); crease.push(line(xR, y2, xR, y3));
    cut.push(roundedRect(xL + L / 2 - 12, y5 - 2, 24, 5, 2.5));

    dims.push({ x1: xL, y1: y6 + 10, x2: xR, y2: y6 + 10, label: "L: " + formatUnit(L, unit) });
    dims.push({ x1: xR + sideSpan + 10, y1: y3, x2: xR + sideSpan + 10, y2: y4, label: "W: " + formatUnit(W, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildBookMailer(params) {
    var L = params.L, W = params.W, H = params.H, unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    // Cross-shaped book wrap (FEFCO 0401)
    var x0 = 0, x1 = W * 0.55, x2 = x1 + H, x3 = x2 + L, x4 = x3 + H, x5 = x4 + W * 0.55;
    var y0 = 0, y1 = W * 0.52, y2 = y1 + H, y3 = y2 + W, y4 = y3 + H, y5 = y4 + W * 0.52;
    cut.push(poly([
      [x2, y0], [x3, y0], [x3, y2], [x5, y2], [x5, y3], [x3, y3],
      [x3, y5], [x2, y5], [x2, y3], [x0, y3], [x0, y2], [x2, y2]
    ], true));
    [y1, y2, y3, y4].forEach(function (yy) { crease.push(line(x2, yy, x3, yy)); });
    [x1, x2, x3, x4].forEach(function (xx) { crease.push(line(xx, y2, xx, y3)); });
    dims.push({ x1: x2, y1: y5 + 10, x2: x3, y2: y5 + 10, label: "L: " + formatUnit(L, unit) });
    dims.push({ x1: x5 + 10, y1: y2, x2: x5 + 10, y2: y3, label: "W: " + formatUnit(W, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildRSC(params) {
    var L = params.L, W = params.W, H = params.H, glue = Math.max(params.glue || 30, 18), flapH = W / 2, slot = Math.max(params.t || 3, 2), unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    var x0 = 0, x1 = glue, x2 = x1 + L, x3 = x2 + W, x4 = x3 + L, x5 = x4 + W, y0 = 0, y1 = flapH, y2 = y1 + H, y3 = y2 + flapH;
    cut.push(poly([[x1, y1], [x0, y1 + 6], [x0, y2 - 6], [x1, y2]], false));
    [x1, x2, x3, x4].forEach(function (xx) { crease.push(line(xx, y1, xx, y2)); });
    cut.push(line(x5, y1, x5, y2));
    crease.push(line(x1, y1, x5, y1)); crease.push(line(x1, y2, x5, y2));
    var panels = [[x1, x2], [x2, x3], [x3, x4], [x4, x5]];
    for (var i = 0; i < panels.length; i++) {
      var px1 = panels[i][0] + (i > 0 ? slot / 2 : 0), px2 = panels[i][1] - (i < 3 ? slot / 2 : 0);
      cut.push(poly([[px1, y1], [px1, y0], [px2, y0], [px2, y1]], false));
      cut.push(poly([[px1, y2], [px1, y3], [px2, y3], [px2, y2]], false));
    }
    dims.push({ x1: x1, y1: y3 + 12, x2: x2, y2: y3 + 12, label: "L: " + formatUnit(L, unit) });
    dims.push({ x1: x5 + 12, y1: y1, x2: x5 + 12, y2: y2, label: "H: " + formatUnit(H, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildTrayLid(params) {
    var L = params.L, W = params.W, H = params.H, t = Math.max(params.t || 1.2, 0.5), unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    function drawTray(ox, oy, tl, tw, th, label) {
      var tab = Math.min(th * 0.75, 22);
      crease.push(rect(ox + th, oy + th, tl, tw));
      cut.push(poly([[ox + th, oy + th], [ox + th, oy], [ox + th + tl, oy], [ox + th + tl, oy + th]], false));
      cut.push(poly([[ox + th, oy + th + tw], [ox + th, oy + th * 2 + tw], [ox + th + tl, oy + th * 2 + tw], [ox + th + tl, oy + th + tw]], false));
      cut.push(poly([[ox + th, oy + th], [ox, oy + th], [ox, oy + th + tw], [ox + th, oy + th + tw]], false));
      cut.push(poly([[ox + th + tl, oy + th], [ox + th * 2 + tl, oy + th], [ox + th * 2 + tl, oy + th + tw], [ox + th + tl, oy + th + tw]], false));
      var corners = [
        [[ox + th, oy + th], [ox + th - tab, oy + th - 2], [ox + th - tab, oy + 2], [ox + th, oy]],
        [[ox + th + tl, oy + th], [ox + th + tl + tab, oy + th - 2], [ox + th + tl + tab, oy + 2], [ox + th + tl, oy]],
        [[ox + th, oy + th + tw], [ox + th - tab, oy + th + tw + 2], [ox + th - tab, oy + th * 2 + tw - 2], [ox + th, oy + th * 2 + tw]],
        [[ox + th + tl, oy + th + tw], [ox + th + tl + tab, oy + th + tw + 2], [ox + th + tl + tab, oy + th * 2 + tw - 2], [ox + th + tl, oy + th * 2 + tw]]
      ];
      corners.forEach(function (c) { cut.push(poly(c, false)); crease.push(line(c[0][0], c[0][1], c[3][0], c[3][1])); });
      dims.push({ x1: ox + th, y1: oy + th * 2 + tw + 9, x2: ox + th + tl, y2: oy + th * 2 + tw + 9, label: label + " L: " + formatUnit(tl, unit) });
    }
    drawTray(0, 0, L, W, H, "Base");
    drawTray(L + H * 2 + 25, 0, L + t * 2 + 1.5, W + t * 2 + 1.5, Math.max(H * 0.55, 18), "Lid");
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildDrawerBox(params) {
    // 2-Piece Matchbox: Inner Tray + Outer Slide Sleeve
    var L = params.L, W = params.W, H = params.H, t = Math.max(params.t || 1, 0.5), glue = Math.max(params.glue || 15, 10), unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    // Inner drawer tray
    var tab = Math.min(H * 0.7, 20);
    crease.push(rect(H, H, L, W));
    cut.push(poly([[H, H], [H, 0], [H + L, 0], [H + L, H]], false));
    cut.push(poly([[H, H + W], [H, H * 2 + W], [H + L, H * 2 + W], [H + L, H + W]], false));
    cut.push(poly([[H, H], [0, H], [0, H + W], [H, H + W]], false));
    cut.push(poly([[H + L, H], [H * 2 + L, H], [H * 2 + L, H + W], [H + L, H + W]], false));
    // Finger notch on tray pull end
    cut.push(circle(0, H + W / 2, Math.min(10, W * 0.16)));
    // Outer slide sleeve below
    var sy = H * 2 + W + 24, sW = W + t * 2 + 1.5, sH = H + t * 2 + 1.5;
    var sx0 = 0, sx1 = glue, sx2 = sx1 + sH, sx3 = sx2 + sW, sx4 = sx3 + sH, sx5 = sx4 + sW;
    cut.push(poly([[sx0, sy + 3], [sx1, sy], [sx5, sy], [sx5, sy + L], [sx1, sy + L], [sx0, sy + L - 3]], true));
    [sx1, sx2, sx3, sx4].forEach(function (xx) { crease.push(line(xx, sy, xx, sy + L)); });
    dims.push({ x1: H, y1: sy + L + 10, x2: H + L, y2: sy + L + 10, label: "Drawer L: " + formatUnit(L, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildBurgerClamshell(params) {
    var L = params.L, W = params.W, H = params.H, hHalf = H * 0.5, taper = Math.min(14, H * 0.18), unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    // Bottom tray + hinged top lid tray (mirrored vertically)
    var x0 = hHalf, x1 = x0 + L;
    var y0 = 0, y1 = hHalf, y2 = y1 + W, y3 = y2 + hHalf, y4 = y3 + hHalf, y5 = y4 + W, y6 = y5 + hHalf;
    crease.push(rect(x0, y1, L, W));
    crease.push(rect(x0, y4, L, W));
    crease.push(line(x0, y3, x1, y3)); // Back hinge
    cut.push(poly([
      [x0 + taper, y0], [x1 - taper, y0], [x1, y1], [x1 + hHalf, y1 + taper], [x1 + hHalf, y2 - taper], [x1, y2],
      [x1, y4], [x1 + hHalf, y4 + taper], [x1 + hHalf, y5 - taper], [x1, y5], [x1 - taper, y6], [x0 + taper, y6],
      [x0, y5], [x0 - hHalf, y5 - taper], [x0 - hHalf, y4 + taper], [x0, y4],
      [x0, y2], [x0 - hHalf, y2 - taper], [x0 - hHalf, y1 + taper], [x0, y1]
    ], true));
    dims.push({ x1: x0, y1: y6 + 10, x2: x1, y2: y6 + 10, label: "L: " + formatUnit(L, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildFriesScoop(params) {
    var L = params.L, W = params.W, H = params.H, glue = Math.max(params.glue || 14, 10), unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    var x0 = 0, x1 = glue, x2 = x1 + W, x3 = x2 + L, x4 = x3 + W, x5 = x4 + L;
    var y0 = 0, yFront = H * 0.28, y1 = H;
    // Curved high back & low front scoop
    cut.push(poly([[x0, yFront + 5], [x1, yFront], [x2, yFront], [x2 + L / 2, yFront + 14], [x3, yFront], [x4, y0 + 8], [x4 + L / 2, y0], [x5, y0 + 8], [x5, y1], [x4, y1], [x3, y1 + W * 0.6], [x2, y1 + W * 0.6], [x1, y1], [x0, y1 - 5]], true));
    [x1, x2, x3, x4].forEach(function (xx) { crease.push(line(xx, yFront, xx, y1)); });
    crease.push(line(x2, y1, x3, y1));
    dims.push({ x1: x2, y1: y1 + W * 0.6 + 10, x2: x3, y2: y1 + W * 0.6 + 10, label: "L: " + formatUnit(L, unit) });
    dims.push({ x1: x5 + 10, y1: y0, x2: x5 + 10, y2: y1, label: "H: " + formatUnit(H, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildNoodleBox(params) {
    var L = params.L, W = params.W, H = params.H, flap = Math.min(L * 0.58, 55), unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    // Cross-fold pail centered on base (L x W)
    var x0 = H + flap, x1 = x0 + L, y0 = H + flap, y1 = y0 + W;
    crease.push(rect(x0, y0, L, W));
    // 4 slanted walls + top interlocking flaps
    var flare = Math.min(12, L * 0.12);
    // Top wall + flap
    crease.push(line(x0 - flare, y0 - H, x1 + flare, y0 - H));
    cut.push(poly([[x0, y0], [x0 - flare, y0 - H], [x0 - flare + 6, y0 - H - flap], [x1 + flare - 6, y0 - H - flap], [x1 + flare, y0 - H], [x1, y0]], false));
    // Bottom wall + flap
    crease.push(line(x0 - flare, y1 + H, x1 + flare, y1 + H));
    cut.push(poly([[x0, y1], [x0 - flare, y1 + H], [x0 - flare + 6, y1 + H + flap], [x1 + flare - 6, y1 + H + flap], [x1 + flare, y1 + H], [x1, y1]], false));
    // Left & right walls + gusset flaps
    crease.push(line(x0 - H, y0 - flare, x0 - H, y1 + flare));
    cut.push(poly([[x0, y0], [x0 - H, y0 - flare], [x0 - H - flap * 0.75, y0], [x0 - H - flap * 0.75, y1], [x0 - H, y1 + flare], [x0, y1]], false));
    crease.push(line(x1 + H, y0 - flare, x1 + H, y1 + flare));
    cut.push(poly([[x1, y0], [x1 + H, y0 - flare], [x1 + H + flap * 0.75, y0], [x1 + H + flap * 0.75, y1], [x1 + H, y1 + flare], [x1, y1]], false));
    dims.push({ x1: x0, y1: y1 + H + flap + 10, x2: x1, y2: y1 + H + flap + 10, label: "Base L: " + formatUnit(L, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildCakeBox(params) {
    var res = buildMailer(params, true);
    // Add top die-cut display window on Lid panel
    var L = params.L, W = params.W, H = params.H;
    var lidLip = Math.min(H * 0.62, 30), winW = L * 0.68, winH = W * 0.62;
    res.cut.push(roundedRect(H + (L - winW) / 2, lidLip + (W - winH) / 2, winW, winH, 10));
    return res;
  }

  function buildHexagon(params) {
    var S = params.L, H = params.H, glue = Math.max(params.glue || 14, 8), tuck = Math.max(params.tuck || 16, 10), unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    var x = glue;
    cut.push(poly([[glue, 0], [0, 5], [0, H - 5], [glue, H]], false));
    for (var i = 0; i < 6; i++) {
      crease.push(line(x, 0, x, H));
      // Top & bottom hexagonal closure flaps on alternating panels
      if (i === 0) addTuckAssembly(cut, crease, x, 0, S, S * 1.15, tuck, -1);
      else if (i === 3) addTuckAssembly(cut, crease, x, H, S, S * 1.15, tuck, 1);
      else {
        addDustFlap(cut, crease, x, 0, S, -1);
        addDustFlap(cut, crease, x, H, S, 1);
      }
      x += S;
    }
    cut.push(line(x, 0, x, H));
    dims.push({ x1: glue, y1: H + S * 1.2 + tuck + 10, x2: glue + S, y2: H + S * 1.2 + tuck + 10, label: "Side: " + formatUnit(S, unit) });
    dims.push({ x1: x + 10, y1: 0, x2: x + 10, y2: H, label: "H: " + formatUnit(H, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildPyramid(params) {
    var L = params.L, H = params.H, unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    // Square base (L x L) surrounded by 4 triangular faces of slant height H + ribbon holes
    var cx = H + L / 2, cy = H + L / 2, x0 = H, y0 = H, x1 = x0 + L, y1 = y0 + L;
    crease.push(rect(x0, y0, L, L));
    // 4 Triangles
    var tips = [[cx, y0 - H], [x1 + H, cy], [cx, y1 + H], [x0 - H, cy]];
    cut.push(poly([[x0, y0], tips[0], [x1, y0], tips[1], [x1, y1], tips[2], [x0, y1], tips[3]], true));
    // Ribbon punch holes near tips
    tips.forEach(function (tp) {
      var hx = tp[0] + (cx - tp[0]) * 0.16, hy = tp[1] + (cy - tp[1]) * 0.16;
      cut.push(circle(hx, hy, 2.8));
    });
    dims.push({ x1: x0, y1: y1 + H + 10, x2: x1, y2: y1 + H + 10, label: "Base L: " + formatUnit(L, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildPillow(params) {
    var L = params.L, W = params.W, H = params.H, glue = Math.max(params.glue || 14, 8), arcBulge = Math.max(W * 0.55, 14), unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    var x0 = 0, x1 = glue, x2 = x1 + L, x3 = x2 + L, y0 = arcBulge, y1 = y0 + H;
    cut.push(poly([[x1, y0], [x0, y0 + 6], [x0, y1 - 6], [x1, y1]], false));
    crease.push(line(x1, y0, x1, y1)); crease.push(line(x2, y0, x2, y1)); cut.push(line(x3, y0, x3, y1));
    function arcBezier(ax, ay, bx, by, bulgeY) {
      var cDx = (bx - ax) * 0.28;
      return { type: "bezier", closed: false, anchors: [{ p: [ax, ay], l: [ax, ay], r: [ax + cDx, ay + bulgeY] }, { p: [bx, by], l: [bx - cDx, by + bulgeY], r: [bx, by] }] };
    }
    cut.push(arcBezier(x1, y0, x2, y0, -arcBulge)); cut.push(arcBezier(x2, y0, x3, y0, -arcBulge));
    cut.push(arcBezier(x1, y1, x2, y1, arcBulge)); cut.push(arcBezier(x2, y1, x3, y1, arcBulge));
    crease.push(arcBezier(x1, y0, x2, y0, arcBulge * 0.85)); crease.push(arcBezier(x2, y0, x3, y0, arcBulge * 0.85));
    crease.push(arcBezier(x1, y1, x2, y1, -arcBulge * 0.85)); crease.push(arcBezier(x2, y1, x3, y1, -arcBulge * 0.85));
    cut.push(circle(x2 + L / 2, y0 - arcBulge * 0.72, 5));
    dims.push({ x1: x1, y1: y1 + arcBulge + 10, x2: x2, y2: y1 + arcBulge + 10, label: "L: " + formatUnit(L, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildSleeve(params) {
    var L = params.L, W = params.W, H = params.H, glue = Math.max(params.glue || 16, 10), unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    var x0 = 0, x1 = glue, x2 = x1 + W, x3 = x2 + L, x4 = x3 + W, x5 = x4 + L, y0 = 0, y1 = H;
    cut.push(poly([[x0, y0 + 3], [x1, y0], [x5, y0], [x5, y1], [x1, y1], [x0, y1 - 3]], true));
    [x1, x2, x3, x4].forEach(function (xx) { crease.push(line(xx, y0, xx, y1)); });
    dims.push({ x1: x2, y1: y1 + 10, x2: x3, y2: y1 + 10, label: "L: " + formatUnit(L, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildGable(params) {
    var L = params.L, W = params.W, H = params.H, glue = Math.max(params.glue || 16, 10), handleH = Math.max(params.tuck || 35, 24), roofH = W * 0.55, unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    var x0 = 0, x1 = glue, x2 = x1 + L, x3 = x2 + W, x4 = x3 + L, x5 = x4 + W, yTop = 0, yHandle = handleH, yRoof = yHandle + roofH, yBot = yRoof + H, yFlap = yBot + W * 0.65;
    cut.push(poly([[x1, yRoof], [x0, yRoof + 6], [x0, yBot - 6], [x1, yBot]], false));
    [x1, x2, x3, x4].forEach(function (xx) { crease.push(line(xx, yRoof, xx, yBot)); });
    cut.push(line(x5, yRoof, x5, yBot)); crease.push(line(x1, yRoof, x5, yRoof)); crease.push(line(x1, yBot, x5, yBot));
    [x1, x3].forEach(function (gx) {
      crease.push(line(gx, yHandle, gx + L, yHandle));
      cut.push(poly([[gx, yRoof], [gx, yHandle], [gx + 6, yTop], [gx + L - 6, yTop], [gx + L, yHandle], [gx + L, yRoof]], false));
      var hW = Math.min(L * 0.45, 72), hH = Math.min(handleH * 0.46, 18);
      cut.push(roundedRect(gx + (L - hW) / 2, yTop + (handleH - hH) / 2, hW, hH, hH / 2));
    });
    [x2, x4].forEach(function (sx) {
      var sm = sx + W / 2;
      cut.push(poly([[sx, yRoof], [sm, yHandle], [sx + W, yRoof]], false));
      crease.push(line(sm, yHandle, sm, yRoof));
    });
    [[x1, x2], [x2, x3], [x3, x4], [x4, x5]].forEach(function (bp) {
      cut.push(poly([[bp[0], yBot], [bp[0] + 3, yFlap], [bp[1] - 3, yFlap], [bp[1], yBot]], false));
    });
    dims.push({ x1: x1, y1: yFlap + 10, x2: x2, y2: yFlap + 10, label: "L: " + formatUnit(L, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildDisplayTray(params) {
    var L = params.L, W = params.W, H = params.H, frontH = Math.max(H * 0.35, 25), headerH = Math.max(H * 0.65, 55), unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    var xL = H, xR = xL + L, y0 = 0, y1 = headerH, y2 = y1 + H, y3 = y2 + W, y4 = y3 + frontH;
    cut.push(poly([[xL + 8, y0], [xR - 8, y0], [xR, y1], [xR, y2], [xR + H, y2], [xR + frontH, y3], [xR, y3], [xR, y4], [xL, y4], [xL, y3], [xL - frontH, y3], [xL - H, y2], [xL, y2], [xL, y1]], true));
    [y1, y2, y3].forEach(function (yy) { crease.push(line(xL, yy, xR, yy)); });
    crease.push(line(xL, y2, xL, y3)); crease.push(line(xR, y2, xR, y3));
    dims.push({ x1: xL, y1: y4 + 10, x2: xR, y2: y4 + 10, label: "L: " + formatUnit(L, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildStandupPouch(params, isFlat) {
    var L = params.L, W = params.W, H = params.H, seal = Math.max(params.glue || 10, 6), gusset = isFlat ? 0 : (W / 2), unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    var y0 = 0, y1 = H, y2 = y1 + gusset, y3 = y2 + gusset, y4 = y3 + H;
    cut.push(rect(0, y0, L, y4));
    crease.push(line(seal, y0, seal, y4)); crease.push(line(L - seal, y0, L - seal, y4));
    if (!isFlat) {
      crease.push(line(0, y0 + 28, L, y0 + 28)); crease.push(line(0, y4 - 28, L, y4 - 28));
      crease.push(line(0, y1, L, y1)); crease.push(line(0, y2, L, y2)); crease.push(line(0, y3, L, y3));
    } else {
      crease.push(line(0, y1, L, y1)); // Fold center
      crease.push(line(0, y0 + seal, L, y0 + seal)); crease.push(line(0, y4 - seal, L, y4 - seal));
    }
    cut.push(poly([[0, y0 + 18], [4, y0 + 20], [0, y0 + 22]], false));
    cut.push(poly([[L, y0 + 18], [L - 4, y0 + 20], [L, y0 + 22]], false));
    dims.push({ x1: 0, y1: y4 + 10, x2: L, y2: y4 + 10, label: "W: " + formatUnit(L, unit) });
    dims.push({ x1: L + 10, y1: y0, x2: L + 10, y2: y1, label: "H: " + formatUnit(H, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildPaperBag(params) {
    var L = params.L, W = params.W, H = params.H, glue = Math.max(params.glue || 20, 14), turnTop = Math.max(params.tuck || 35, 22), botFold = W * 0.65, unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    var x0 = 0, x1 = glue, x2 = x1 + L, x3 = x2 + W, x4 = x3 + L, x5 = x4 + W, y0 = 0, y1 = turnTop, y2 = y1 + H, y3 = y2 + botFold;
    cut.push(rect(x0, y0, x5, y3));
    [x1, x2, x2 + W / 2, x3, x4, x4 + W / 2].forEach(function (xx) { crease.push(line(xx, y0, xx, y3)); });
    crease.push(line(x0, y1, x5, y1)); crease.push(line(x0, y2, x5, y2));
    var holeY = y1 + 16, holeSpan = L * 0.42;
    [x1 + L / 2, x3 + L / 2].forEach(function (fc) { cut.push(circle(fc - holeSpan / 2, holeY, 3)); cut.push(circle(fc + holeSpan / 2, holeY, 3)); });
    dims.push({ x1: x1, y1: y3 + 12, x2: x2, y2: y3 + 12, label: "L: " + formatUnit(L, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildPocketFolder(params) {
    var L = params.L, H = params.H, spine = Math.max(params.W || 10, 4), glue = Math.max(params.glue || 15, 10), pocketH = Math.max(params.tuck || 85, 50), unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    var x0 = 0, x1 = L, x2 = x1 + spine, x3 = x2 + L, x4 = x3 + glue, y0 = 0, y1 = H, y2 = H + pocketH;
    cut.push(poly([[x0, y0], [x3, y0], [x3, y1], [x4, y1 + 8], [x4, y2 - 8], [x3, y2], [x2 + 4, y2], [x2, y1], [x0, y1]], true));
    crease.push(line(x1, y0, x1, y1)); crease.push(line(x2, y0, x2, y1));
    crease.push(line(x2, y1, x3, y1)); crease.push(line(x3, y1, x3, y2));
    // Business card slits on pocket
    var cx = x2 + L / 2, cy = y1 + pocketH / 2;
    cut.push(poly([[cx - 42, cy - 12], [cx - 42, cy - 22], [cx - 32, cy - 22]], false));
    cut.push(poly([[cx + 42, cy + 12], [cx + 42, cy + 22], [cx + 32, cy + 22]], false));
    dims.push({ x1: x0, y1: y2 + 10, x2: x1, y2: y2 + 10, label: "Panel L: " + formatUnit(L, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildBottleLabel(params) {
    var L = params.L, H = params.H, overlap = Math.max(params.glue || 8, 0), unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    cut.push(roundedRect(0, 0, L + overlap, H, Math.min(3, H * 0.05)));
    if (overlap > 0) crease.push(line(L, 0, L, H));
    crease.push(line(L / 2, 0, L / 2, H));
    dims.push({ x1: 0, y1: H + 10, x2: L, y2: H + 10, label: "Wrap L: " + formatUnit(L, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function buildHangTag(params) {
    var L = params.L, H = params.H, ch = Math.min(14, L * 0.24), unit = params.unit || "mm";
    var cut = [], crease = [], bleed = [], dims = [];
    cut.push(poly([[ch, 0], [L - ch, 0], [L, ch], [L, H], [0, H], [0, ch]], true));
    cut.push(circle(L / 2, Math.max(10, ch * 0.9), 2.5)); // String punch hole
    crease.push(line(0, ch + 4, L, ch + 4)); // Optional design guide
    dims.push({ x1: 0, y1: H + 10, x2: L, y2: H + 10, label: "W: " + formatUnit(L, unit) });
    dims.push({ x1: L + 10, y1: 0, x2: L + 10, y2: H, label: "H: " + formatUnit(H, unit) });
    return { cut: cut, crease: crease, bleed: bleed, dims: dims };
  }

  function generate(rawParams) {
    var unit = rawParams.unit || "mm";
    var params = {
      type: rawParams.type || "reverse_tuck", unit: unit,
      L: Math.max(15, toMm(rawParams.L || 80, unit)), W: Math.max(4, toMm(rawParams.W || 50, unit)), H: Math.max(15, toMm(rawParams.H || 130, unit)),
      t: Math.max(0.1, toMm(rawParams.t || 0.4, unit)), glue: Math.max(0, toMm(rawParams.glue !== undefined ? rawParams.glue : 14, unit)),
      tuck: Math.max(0, toMm(rawParams.tuck !== undefined ? rawParams.tuck : 16, unit)), bleed: Math.max(0, toMm(rawParams.bleed !== undefined ? rawParams.bleed : 3, unit)),
      optTopTuck: rawParams.optTopTuck !== false, optBottomTuck: rawParams.optBottomTuck !== false, optDustFlaps: rawParams.optDustFlaps !== false,
      optWindow: !!rawParams.optWindow, optHangTab: !!rawParams.optHangTab, winW: toMm(rawParams.winW || 45, unit), winH: toMm(rawParams.winH || 55, unit)
    };

    var geo;
    switch (params.type) {
      case "reverse_tuck": case "straight_tuck": case "snap_lock": case "auto_bottom":
      case "tuck_top_auto_bot": case "seal_end": case "dispenser_box": case "custom_box":
        geo = buildCarton(params, params.type); break;
      case "mailer": geo = buildMailer(params, false); break;
      case "pizza_box": geo = buildMailer(params, true); break;
      case "cake_box": geo = buildCakeBox(params); break;
      case "book_mailer": geo = buildBookMailer(params); break;
      case "rsc_shipper": geo = buildRSC(params); break;
      case "tray_lid": geo = buildTrayLid(params); break;
      case "drawer_box": geo = buildDrawerBox(params); break;
      case "burger_clamshell": geo = buildBurgerClamshell(params); break;
      case "fries_scoop": geo = buildFriesScoop(params); break;
      case "noodle_box": geo = buildNoodleBox(params); break;
      case "hexagon_box": geo = buildHexagon(params); break;
      case "pyramid_box": geo = buildPyramid(params); break;
      case "pillow": geo = buildPillow(params); break;
      case "sleeve": geo = buildSleeve(params); break;
      case "gable": geo = buildGable(params); break;
      case "display_tray": geo = buildDisplayTray(params); break;
      case "standup_pouch": geo = buildStandupPouch(params, false); break;
      case "flat_pouch": geo = buildStandupPouch(params, true); break;
      case "paper_bag": geo = buildPaperBag(params); break;
      case "pocket_folder": geo = buildPocketFolder(params); break;
      case "bottle_label": geo = buildBottleLabel(params); break;
      case "hang_tag": geo = buildHangTag(params); break;
      default: geo = buildCarton(params, "reverse_tuck");
    }

    var bounds = normalizeGeometry(geo.cut, geo.crease, geo.bleed, geo.dims, params.bleed);
    var meta = PACKAGING_CATALOG.find(function (c) { return c.id === params.type; }) || PACKAGING_CATALOG[0];

    return {
      title: meta.name.replace(/[^A-Za-z0-9]+/g, "_") + "_" + Math.round(params.L) + "x" + Math.round(params.W) + "x" + Math.round(params.H) + "mm",
      meta: meta, params: params, bounds: { width: bounds.width, height: bounds.height },
      cut: geo.cut, crease: geo.crease, bleed: geo.bleed, dimensions: geo.dims,
      specSummary: meta.name + "  |  Size: " + formatUnit(params.L, unit) + " × " + formatUnit(params.W, unit) + " × " + formatUnit(params.H, unit) + "  |  Sheet: " + formatUnit(bounds.width, unit) + " × " + formatUnit(bounds.height, unit)
    };
  }

  function toSVG(dieline) {
    var pad = 18, vbW = dieline.bounds.width + pad * 2, vbH = dieline.bounds.height + pad * 2;
    function pathToD(item) {
      var d = "";
      if (item.type === "bezier" && item.anchors && item.anchors.length > 0) {
        var an = item.anchors;
        d = "M " + an[0].p[0] + " " + an[0].p[1];
        for (var i = 0; i < an.length - 1; i++) {
          var c1 = an[i].r || an[i].p, c2 = an[i + 1].l || an[i + 1].p, p2 = an[i + 1].p;
          d += " C " + c1[0] + " " + c1[1] + ", " + c2[0] + " " + c2[1] + ", " + p2[0] + " " + p2[1];
        }
        if (item.closed) {
          var last = an[an.length - 1], first = an[0];
          d += " C " + (last.r || last.p)[0] + " " + (last.r || last.p)[1] + ", " + (first.l || first.p)[0] + " " + (first.l || first.p)[1] + ", " + first.p[0] + " " + first.p[1] + " Z";
        }
      } else if (item.points && item.points.length > 0) {
        d = "M " + item.points[0][0] + " " + item.points[0][1];
        for (var j = 1; j < item.points.length; j++) d += " L " + item.points[j][0] + " " + item.points[j][1];
        if (item.closed) d += " Z";
      }
      return d;
    }
    var strokeScale = Math.max(vbW, vbH) / 360;
    var svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + (-pad) + " " + (-pad) + " " + vbW + " " + vbH + '" width="100%" height="100%">'];
    dieline.bleed.forEach(function (b) { svg.push('<path d="' + pathToD(b) + '" fill="rgba(59,205,202,0.04)" stroke="#10b981" stroke-width="' + (strokeScale * 0.9) + '" stroke-dasharray="' + (strokeScale * 2) + ' ' + (strokeScale * 2) + '" />'); });
    dieline.crease.forEach(function (c) { svg.push('<path d="' + pathToD(c) + '" fill="none" stroke="#38bdf8" stroke-width="' + (strokeScale * 1.1) + '" stroke-dasharray="' + (strokeScale * 4.5) + ' ' + (strokeScale * 3) + '" />'); });
    dieline.cut.forEach(function (k) { svg.push('<path d="' + pathToD(k) + '" fill="none" stroke="#f43f5e" stroke-width="' + (strokeScale * 1.45) + '" stroke-linecap="round" stroke-linejoin="round" />'); });
    var fontSize = Math.max(strokeScale * 7.5, 4);
    dieline.dimensions.forEach(function (dm) {
      svg.push('<line x1="' + dm.x1 + '" y1="' + dm.y1 + '" x2="' + dm.x2 + '" y2="' + dm.y2 + '" stroke="#94a3b8" stroke-width="' + (strokeScale * 0.7) + '" />');
      svg.push('<text x="' + ((dm.x1 + dm.x2) / 2) + '" y="' + ((dm.y1 + dm.y2) / 2 - strokeScale * 2.5) + '" fill="#cbd5e1" font-family="Inter,Segoe UI,sans-serif" font-size="' + fontSize + '" text-anchor="middle">' + dm.label + "</text>");
    });
    svg.push("</svg>");
    return svg.join("");
  }

  global.DielineEngine = { CATALOG: PACKAGING_CATALOG, generate: generate, toSVG: toSVG };
})(window);
