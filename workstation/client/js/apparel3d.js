/**
 * ============================================================================
 * Design360n Workstation v13.0 — 3D Apparel (Closed-Top Solid) & 3D Bottle Studio
 * 100% Offline Procedural WebGL 3D Engine + Interactive 2D Cut-and-Sew & Bottle Dielines
 *   - 12 T-Shirt Types × 7 Graded Sizes (XS–3XL) with Solid Closed Shoulder Yoke & Neck Cavity
 *   - 8 Bottle & Tumbler Types × 6 Volumes (250ml–1L) including Owala-style Flip-Lid Tumbler
 * ============================================================================
 */
(function (global) {
  "use strict";

  var GARMENT_TYPES = [
    { id: "oversized",  name: "Oversized Drop-Shoulder Tee", bodyW: 1.12, bodyH: 1.06, waistTaper: 0.99, sleeveLen: 0.56, sleeveRad: 0.25,  sleeveDrop: 0.68, neckType: "crew",  neckDepth: 0.14, collarH: 0.055, wCm: 58, hCm: 76, slW: 46, slH: 27, ribW: 48, ribH: 2.8 },
    { id: "classic",    name: "Classic Regular Crewneck",    bodyW: 1.00, bodyH: 1.00, waistTaper: 0.94, sleeveLen: 0.44, sleeveRad: 0.21,  sleeveDrop: 0.55, neckType: "crew",  neckDepth: 0.15, collarH: 0.045, wCm: 53, hCm: 73, slW: 42, slH: 23, ribW: 46, ribH: 2.2 },
    { id: "slim",       name: "Slim / Athletic Fit Tee",     bodyW: 0.92, bodyH: 0.98, waistTaper: 0.85, sleeveLen: 0.38, sleeveRad: 0.185, sleeveDrop: 0.48, neckType: "crew",  neckDepth: 0.16, collarH: 0.040, wCm: 48, hCm: 71, slW: 38, slH: 21, ribW: 44, ribH: 2.0 },
    { id: "vneck",      name: "V-Neck T-Shirt",              bodyW: 0.98, bodyH: 1.00, waistTaper: 0.92, sleeveLen: 0.42, sleeveRad: 0.20,  sleeveDrop: 0.54, neckType: "vneck", neckDepth: 0.26, collarH: 0.042, wCm: 52, hCm: 73, slW: 41, slH: 23, ribW: 50, ribH: 2.2 },
    { id: "longsleeve", name: "Long-Sleeve T-Shirt",         bodyW: 1.00, bodyH: 1.02, waistTaper: 0.93, sleeveLen: 1.08, sleeveRad: 0.20,  sleeveDrop: 0.72, neckType: "crew",  neckDepth: 0.15, collarH: 0.045, wCm: 53, hCm: 74, slW: 42, slH: 63, ribW: 46, ribH: 2.2 },
    { id: "polo",       name: "Polo Shirt (Collar+Placket)", bodyW: 1.00, bodyH: 1.02, waistTaper: 0.94, sleeveLen: 0.44, sleeveRad: 0.205, sleeveDrop: 0.54, neckType: "polo",  neckDepth: 0.22, collarH: 0.100, wCm: 53, hCm: 74, slW: 42, slH: 24, ribW: 44, ribH: 7.5 },
    { id: "henley",     name: "Henley 3-Button Tee",         bodyW: 0.98, bodyH: 1.00, waistTaper: 0.92, sleeveLen: 0.44, sleeveRad: 0.20,  sleeveDrop: 0.54, neckType: "polo",  neckDepth: 0.20, collarH: 0.042, wCm: 52, hCm: 73, slW: 41, slH: 23, ribW: 46, ribH: 2.2 },
    { id: "raglan",     name: "Raglan / Baseball 3/4 Tee",   bodyW: 1.00, bodyH: 1.02, waistTaper: 0.94, sleeveLen: 0.74, sleeveRad: 0.205, sleeveDrop: 0.66, neckType: "crew",  neckDepth: 0.15, collarH: 0.045, wCm: 53, hCm: 74, slW: 42, slH: 44, ribW: 46, ribH: 2.2 },
    { id: "jersey",     name: "Sports Sublimation Jersey",   bodyW: 1.04, bodyH: 1.04, waistTaper: 0.93, sleeveLen: 0.48, sleeveRad: 0.22,  sleeveDrop: 0.58, neckType: "vneck", neckDepth: 0.22, collarH: 0.048, wCm: 55, hCm: 75, slW: 44, slH: 25, ribW: 48, ribH: 2.4 },
    { id: "tank",       name: "Sleeveless / Tank Top",       bodyW: 0.94, bodyH: 1.00, waistTaper: 0.91, sleeveLen: 0.00, sleeveRad: 0.00,  sleeveDrop: 0.00, neckType: "scoop", neckDepth: 0.24, collarH: 0.032, wCm: 50, hCm: 71, slW: 0,  slH: 0,  ribW: 48, ribH: 1.8 },
    { id: "crop",       name: "Boxy Crop Top / Streetwear",  bodyW: 1.08, bodyH: 0.76, waistTaper: 1.02, sleeveLen: 0.46, sleeveRad: 0.23,  sleeveDrop: 0.60, neckType: "crew",  neckDepth: 0.14, collarH: 0.050, wCm: 56, hCm: 53, slW: 44, slH: 23, ribW: 47, ribH: 2.5 },
    { id: "hoodie",     name: "Heavyweight Pullover Hoodie", bodyW: 1.15, bodyH: 1.08, waistTaper: 0.96, sleeveLen: 1.10, sleeveRad: 0.24,  sleeveDrop: 0.74, neckType: "crew",  neckDepth: 0.12, collarH: 0.140, wCm: 60, hCm: 74, slW: 48, slH: 64, ribW: 54, ribH: 6.0 }
  ];

  var SIZE_GRADES = [
    { code: "XS",  name: "XS (Extra Small)", dW: -7.5, dH: -6.0, dSlW: -4.5, dSlH: -3.0, dRib: -3.0, scale3D: 0.90 },
    { code: "S",   name: "S (Small)",        dW: -5.0, dH: -4.0, dSlW: -3.0, dSlH: -2.0, dRib: -2.0, scale3D: 0.94 },
    { code: "M",   name: "M (Medium)",       dW: -2.5, dH: -2.0, dSlW: -1.5, dSlH: -1.0, dRib: -1.0, scale3D: 0.97 },
    { code: "L",   name: "L (Large — Base)", dW:  0.0, dH:  0.0, dSlW:  0.0, dSlH:  0.0, dRib:  0.0, scale3D: 1.00 },
    { code: "XL",  name: "XL (Extra Large)", dW:  3.0, dH:  2.0, dSlW:  1.5, dSlH:  1.5, dRib:  1.5, scale3D: 1.04 },
    { code: "2XL", name: "2XL (Double XL)",  dW:  6.0, dH:  4.0, dSlW:  3.0, dSlH:  2.5, dRib:  2.5, scale3D: 1.08 },
    { code: "3XL", name: "3XL (Triple XL)",  dW:  9.0, dH:  6.0, dSlW:  4.5, dSlH:  3.5, dRib:  3.5, scale3D: 1.12 }
  ];

  // 8 Bottle & Tumbler Types (including Owala-style Insulated Flip-Lid Tumbler!)
  var BOTTLE_TYPES = [
    { id: "owala",   name: "Insulated Flip-Lid Tumbler (Owala Style)", diamMm: 82, totalHMm: 265, labelHMm: 165, capStyle: "owala",   bodyR: 0.44, bodyH: 1.32, capH: 0.36 },
    { id: "water",   name: "Classic Water / Juice Bottle (Screw Cap)", diamMm: 68, totalHMm: 225, labelHMm: 120, capStyle: "screw",   bodyR: 0.38, bodyH: 1.24, capH: 0.34 },
    { id: "can",     name: "Aluminum Beverage Can (330/500ml)",        diamMm: 66, totalHMm: 155, labelHMm: 132, capStyle: "can",     bodyR: 0.42, bodyH: 1.36, capH: 0.14 },
    { id: "serum",   name: "Cosmetic Serum / Dropper Bottle",          diamMm: 42, totalHMm: 118, labelHMm: 68,  capStyle: "dropper", bodyR: 0.36, bodyH: 0.98, capH: 0.46 },
    { id: "pump",    name: "Lotion / Shampoo Pump Bottle",             diamMm: 70, totalHMm: 210, labelHMm: 140, capStyle: "pump",    bodyR: 0.41, bodyH: 1.24, capH: 0.42 },
    { id: "shaker",  name: "Sports Protein Shaker Bottle",             diamMm: 92, totalHMm: 220, labelHMm: 135, capStyle: "owala",   bodyR: 0.48, bodyH: 1.22, capH: 0.34 },
    { id: "wine",    name: "Tall Wine / Olive Oil Glass Bottle",       diamMm: 76, totalHMm: 300, labelHMm: 145, capStyle: "wine",    bodyR: 0.36, bodyH: 1.18, capH: 0.62 },
    { id: "jar",     name: "Cosmetic Cream / Supplement Jar",          diamMm: 86, totalHMm: 105, labelHMm: 68,  capStyle: "jar",     bodyR: 0.54, bodyH: 0.82, capH: 0.24 }
  ];

  var BOTTLE_VOLUMES = [
    { code: "250ml", name: "250 ml (8 oz)",  scale: 0.82 },
    { code: "350ml", name: "350 ml (12 oz)", scale: 0.90 },
    { code: "500ml", name: "500 ml (16 oz)", scale: 1.00 },
    { code: "710ml", name: "710 ml (24 oz)", scale: 1.08 },
    { code: "950ml", name: "950 ml (32 oz)", scale: 1.16 },
    { code: "1000ml",name: "1000 ml (1 L)",  scale: 1.22 }
  ];

  var UV_REGIONS = {
    neckRibFront: { x: 0.04, y: 0.03, w: 0.44, h: 0.055 },
    neckRibBack:  { x: 0.52, y: 0.03, w: 0.44, h: 0.055 },
    neckRib:      { x: 0.04, y: 0.03, w: 0.92, h: 0.055 },
    rightSleeve:  { x: 0.04, y: 0.12, w: 0.44, h: 0.21 },
    leftSleeve:   { x: 0.52, y: 0.12, w: 0.44, h: 0.21 },
    front:        { x: 0.04, y: 0.36, w: 0.44, h: 0.60 },
    back:         { x: 0.52, y: 0.36, w: 0.44, h: 0.60 },
    // Bottle Wrap Atlas Regions (top 0..0.16 = Cap/Lid, 0.16..0.24 = Neck Ring, 0.24..0.94 = 360° Label Wrap, 0.94..1 = Base)
    bottleCap:    { x: 0.00, y: 0.00, w: 1.00, h: 0.16 },
    bottleRing:   { x: 0.00, y: 0.16, w: 1.00, h: 0.08 },
    bottleLabel:  { x: 0.00, y: 0.24, w: 1.00, h: 0.70 },
    bottleBase:   { x: 0.00, y: 0.94, w: 1.00, h: 0.06 }
  };

  function getGarmentSpec(id, sizeCode) {
    var base = GARMENT_TYPES[0];
    for (var i = 0; i < GARMENT_TYPES.length; i++) if (GARMENT_TYPES[i].id === id) { base = GARMENT_TYPES[i]; break; }
    var gr = SIZE_GRADES[3];
    for (var j = 0; j < SIZE_GRADES.length; j++) if (SIZE_GRADES[j].code === sizeCode) { gr = SIZE_GRADES[j]; break; }
    return {
      id: base.id, name: base.name, sizeCode: gr.code, sizeName: gr.name,
      bodyW: base.bodyW * (0.94 + 0.06 * gr.scale3D), bodyH: base.bodyH * (0.96 + 0.04 * gr.scale3D),
      waistTaper: base.waistTaper, sleeveLen: base.sleeveLen, sleeveRad: base.sleeveRad, sleeveDrop: base.sleeveDrop,
      neckType: base.neckType, neckDepth: base.neckDepth, collarH: base.collarH,
      wCm: Math.max(36, Math.round((base.wCm + gr.dW) * 10) / 10),
      hCm: Math.max(44, Math.round((base.hCm + gr.dH) * 10) / 10),
      slW: base.slW > 0 ? Math.max(28, Math.round((base.slW + gr.dSlW) * 10) / 10) : 0,
      slH: base.slH > 0 ? Math.max(16, Math.round((base.slH + gr.dSlH) * 10) / 10) : 0,
      ribW: Math.max(36, Math.round((base.ribW + gr.dRib) * 10) / 10), ribH: base.ribH
    };
  }

  function getBottleSpec(id, volCode) {
    var base = BOTTLE_TYPES[0];
    for (var i = 0; i < BOTTLE_TYPES.length; i++) if (BOTTLE_TYPES[i].id === id) { base = BOTTLE_TYPES[i]; break; }
    var vol = BOTTLE_VOLUMES[3]; // 710ml default
    for (var j = 0; j < BOTTLE_VOLUMES.length; j++) if (BOTTLE_VOLUMES[j].code === volCode) { vol = BOTTLE_VOLUMES[j]; break; }
    var diamMm = Math.round(base.diamMm * (0.88 + 0.12 * vol.scale));
    var circMm = Math.round(Math.PI * diamMm * 10) / 10;
    var labelHMm = Math.round(base.labelHMm * (0.85 + 0.15 * vol.scale));
    var totalHMm = Math.round(base.totalHMm * (0.85 + 0.15 * vol.scale));

    // Exact realistic 3D body-to-cap proportions matching real products (e.g. Owala 78% body / 22% ring+lid)
    var capFracMap = { owala: 0.21, screw: 0.16, can: 0.08, dropper: 0.30, pump: 0.24, wine: 0.28, jar: 0.24 };
    var capFrac = capFracMap[base.capStyle] || 0.20;
    var total3DH = (base.id === "jar") ? 1.15 : 1.72;
    var trueR = Math.min(0.56, Math.max(0.22, (diamMm / Math.max(90, totalHMm)) * total3DH * 0.52));
    var trueCapH = total3DH * capFrac;
    var trueBodyH = total3DH - trueCapH;

    return {
      id: base.id, name: base.name, volCode: vol.code, volName: vol.name,
      capStyle: base.capStyle,
      diamMm: diamMm, circMm: circMm, labelHMm: labelHMm, totalHMm: totalHMm,
      bodyR: trueR,
      bodyH: trueBodyH,
      capH: trueCapH
    };
  }

  function finalizeMesh(pos, nrm, uv, idx) {
    var len = pos.length;
    for (var i = 0; i < len; i++) nrm[i] = 0;
    for (var t = 0; t < idx.length; t += 3) {
      var i0 = idx[t] * 3, i1 = idx[t + 1] * 3, i2 = idx[t + 2] * 3;
      var ax = pos[i1] - pos[i0], ay = pos[i1 + 1] - pos[i0 + 1], az = pos[i1 + 2] - pos[i0 + 2];
      var bx = pos[i2] - pos[i0], by = pos[i2 + 1] - pos[i0 + 1], bz = pos[i2 + 2] - pos[i0 + 2];
      var nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
      nrm[i0] += nx; nrm[i0 + 1] += ny; nrm[i0 + 2] += nz;
      nrm[i1] += nx; nrm[i1 + 1] += ny; nrm[i1 + 2] += nz;
      nrm[i2] += nx; nrm[i2 + 1] += ny; nrm[i2 + 2] += nz;
    }
    for (var v = 0; v < len; v += 3) {
      var l = Math.sqrt(nrm[v] * nrm[v] + nrm[v + 1] * nrm[v + 1] + nrm[v + 2] * nrm[v + 2]) || 1;
      nrm[v] /= l; nrm[v + 1] /= l; nrm[v + 2] /= l;
    }
    return {
      positions: new Float32Array(pos),
      normals:   new Float32Array(nrm),
      uvs:       new Float32Array(uv),
      indices:   new Uint16Array(idx),
      triCount:  idx.length / 3
    };
  }

  // ==========================================================================
  // 1. SOLID CLOSED-TOP 3D GARMENT MESH BUILDER (FIXED: ZERO HOLLOW TOP!)
  // ==========================================================================
  function buildGarmentMesh(spec) {
    var pos = [], nrm = [], uv = [], idx = [];
    function pushV(x, y, z, u, v) { pos.push(x, y, z); nrm.push(0, 1, 0); uv.push(u, v); return (pos.length / 3) - 1; }
    function addQuad(a, b, c, d) { idx.push(a, b, c, a, c, d); }

    // Visible relative size scale (XS -> 3XL clearly scales in studio)
    var sizeVis = 1.0;
    if (spec.sizeCode === "XS") sizeVis = 0.89;
    else if (spec.sizeCode === "S") sizeVis = 0.94;
    else if (spec.sizeCode === "M") sizeVis = 0.98;
    else if (spec.sizeCode === "L") sizeVis = 1.01;
    else if (spec.sizeCode === "XL") sizeVis = 1.05;
    else if (spec.sizeCode === "2XL") sizeVis = 1.10;
    else if (spec.sizeCode === "3XL") sizeVis = 1.15;

    var halfW = 0.56 * spec.bodyW * sizeVis;
    var topY  = 0.84 * spec.bodyH * sizeVis;
    var botY  = -0.82 * spec.bodyH * sizeVis;
    var totalH = topY - botY;

    // Clean circular ribbed crewneck opening (like pro ghost-mannequin mockups)
    var rxCol = halfW * 0.35;
    var rzCol = 0.155 * spec.bodyW * sizeVis;

    function collarYAt(ang) {
      var cc = Math.cos(ang);
      if (cc >= 0) {
        var depth = (spec.neckType === "vneck" || spec.neckType === "polo")
          ? Math.pow(cc, 1.25) * spec.neckDepth * 1.15
          : Math.pow(cc, 1.45) * spec.neckDepth * 1.10;
        return topY - depth * sizeVis;
      }
      return topY - Math.pow(-cc, 1.55) * 0.028 * sizeVis;
    }

    // A) SCULPTED GHOST-MANNEQUIN TORSO (Athletic V-taper + Curved Bottom Hem + Realistic Drape Creases)
    var segU = 64, segV = 48, torsoGrid = [];
    for (var j = 0; j <= segV; j++) {
      var tv = j / segV, row = [];
      for (var i = 0; i <= segU; i++) {
        var tu = i / segU;
        var ang = (tu * 2 - 0.5) * Math.PI;
        var cosA = Math.cos(ang), sinA = Math.sin(ang);
        var isFront = (i <= segU / 2);

        // Athletic V-taper silhouette: broad upper chest -> slim sculpted waist -> subtle hip flare
        var taperStrength = 1.0 - (spec.waistTaper - 0.80) * 2.2;
        var chestFull = Math.exp(-Math.pow((tv - 0.14) / 0.18, 2.0)) * 0.08;
        var waistIn   = Math.exp(-Math.pow((tv - 0.68) / 0.24, 2.0)) * (0.115 * Math.max(0.35, taperStrength));
        var hipFlare  = Math.exp(-Math.pow((tv - 0.96) / 0.14, 2.0)) * 0.032;
        var widthCurve = 1.0 + chestFull - waistIn + hipFlare;

        // Smooth upper shoulder rounding
        if (tv < 0.08) widthCurve *= (0.94 + 0.06 * (tv / 0.08));

        var rx = halfW * widthCurve;

        // Realistic chest & upper-back 3D anatomy (not a flat board, not a fat barrel)
        var pecFull = isFront
          ? (0.072 * Math.exp(-Math.pow((tv - 0.24) / 0.22, 2.0)) * Math.pow(Math.max(0, cosA), 0.9))
          : (0.042 * Math.exp(-Math.pow((tv - 0.22) / 0.24, 2.0)) * Math.pow(Math.max(0, -cosA), 0.9));
        var bellyCurve = isFront ? (0.022 * Math.sin(tv * Math.PI) * Math.max(0, cosA)) : 0;
        var rz = (0.185 * spec.bodyW * (1.0 - waistIn * 0.65) + pecFull + bellyCurve) * sizeVis;

        // Sculpted diagonal armpit tension folds + lower waist compression wrinkles (ghost-mannequin realism!)
        var diagLeft  = Math.sin((tv * 7.5 - sinA * 4.2) * Math.PI * 0.55) * Math.exp(-Math.pow((tv - 0.45) / 0.30, 2.0));
        var diagRight = Math.sin((tv * 7.5 + sinA * 4.2) * Math.PI * 0.55) * Math.exp(-Math.pow((tv - 0.48) / 0.30, 2.0));
        var waistWrinkle = Math.sin(tv * 26.0 + Math.abs(sinA) * 3.5) * Math.exp(-Math.pow((tv - 0.78) / 0.16, 2.0)) * Math.pow(Math.abs(sinA), 0.8);
        var hemDrape = Math.sin(ang * 5.0 + tv * 1.4) * Math.pow(tv, 2.0);
        var disp = (0.0085 * (diagLeft + diagRight) * 0.5 + 0.009 * waistWrinkle + 0.007 * hemDrape) * sizeVis;

        var hemLip = (tv > 0.955) ? (0.0045 * Math.sin(((tv - 0.955) / 0.045) * Math.PI)) : 0.0;
        var x = sinA * (rx + disp * 0.75 + hemLip);
        var z = cosA * (rz + disp * 1.15 + hemLip);

        // Smooth shoulder slope + realistic curved front/back bottom hem!
        var shoulderDrop = Math.pow(Math.abs(sinA), 1.55) * 0.145 * sizeVis * Math.pow(1 - tv, 1.35);
        var neckCarve = (topY - collarYAt(ang)) * Math.pow(1 - tv, 2.8);
        var hemCurve = -0.042 * sizeVis * Math.abs(cosA) * Math.pow(tv, 2.2);
        var y = topY - tv * totalH - shoulderDrop - neckCarve + hemCurve;

        var uCoord = isFront
          ? (UV_REGIONS.front.x + (i / (segU / 2)) * UV_REGIONS.front.w)
          : (UV_REGIONS.back.x + ((i - segU / 2) / (segU / 2)) * UV_REGIONS.back.w);
        var vCoord = (isFront ? UV_REGIONS.front.y : UV_REGIONS.back.y) + tv * UV_REGIONS.front.h;
        row.push(pushV(x, y, z, uCoord, vCoord));
      }
      torsoGrid.push(row);
    }
    for (var j2 = 0; j2 < segV; j2++) {
      for (var i2 = 0; i2 < segU; i2++) {
        addQuad(torsoGrid[j2][i2], torsoGrid[j2 + 1][i2], torsoGrid[j2 + 1][i2 + 1], torsoGrid[j2][i2 + 1]);
      }
    }

    // B) SCULPTED SHOULDER YOKE CAP (Bridges outer shoulder smoothly into ribbed collar base)
    var capRings = 10, capGrid = [];
    for (var r = 0; r <= capRings; r++) {
      var tr = r / capRings;
      var crow = [];
      for (var i3 = 0; i3 <= segU; i3++) {
        var tu3 = i3 / segU;
        var ang3 = (tu3 * 2 - 0.5) * Math.PI;
        var sin3 = Math.sin(ang3), cos3 = Math.cos(ang3);
        var isF3 = (i3 <= segU / 2);

        var oIdx = torsoGrid[0][i3] * 3;
        var ox = pos[oIdx], oy = pos[oIdx + 1], oz = pos[oIdx + 2];
        var ix = sin3 * rxCol;
        var iz = cos3 * rzCol;
        var iy = collarYAt(ang3);

        var domeLift = Math.sin(tr * Math.PI) * 0.042 * sizeVis * Math.pow(Math.abs(sin3), 0.75);
        var px = ox + (ix - ox) * tr;
        var pz = oz + (iz - oz) * tr;
        var py = oy + (iy - oy) * tr + domeLift;

        var uCap = isF3
          ? (UV_REGIONS.front.x + (i3 / (segU / 2)) * UV_REGIONS.front.w)
          : (UV_REGIONS.back.x + ((i3 - segU / 2) / (segU / 2)) * UV_REGIONS.back.w);
        var vCap = (isF3 ? UV_REGIONS.front.y : UV_REGIONS.back.y) + (1 - tr) * 0.04;
        crow.push(pushV(px, py, pz, uCap, vCap));
      }
      capGrid.push(crow);
    }
    for (var r2 = 0; r2 < capRings; r2++) {
      for (var i4 = 0; i4 < segU; i4++) {
        addQuad(capGrid[r2 + 1][i4], capGrid[r2][i4], capGrid[r2][i4 + 1], capGrid[r2 + 1][i4 + 1]);
      }
    }

    // C) SMOOTH THICK RIBBED COLLAR BAND (Zero spikes, realistic rounded rim)
    var colSegU = segU, colSegV = 8, colGrid = [];
    for (var cv = 0; cv <= colSegV; cv++) {
      var ctv = cv / colSegV;
      var crow2 = [];
      for (var cu = 0; cu <= colSegU; cu++) {
        var ctu = cu / colSegU;
        var cAng = (ctu * 2 - 0.5) * Math.PI;
        var cs = Math.sin(cAng), cc = Math.cos(cAng);
        var thick = 1.0 + 0.075 * Math.sin(ctv * Math.PI) - (ctv > 0.5 ? (ctv - 0.5) * 0.16 : 0);
        if (spec.neckType === "polo" && ctv < 0.6) thick += 0.15 * (0.6 - ctv);
        var cx = cs * rxCol * thick;
        var cz = cc * rzCol * thick;
        var lift = Math.sin(ctv * Math.PI) * spec.collarH * sizeVis * (0.62 + 0.38 * Math.abs(cc));
        var cy = collarYAt(cAng) + lift;
        var uC = UV_REGIONS.neckRib.x + ctu * UV_REGIONS.neckRib.w;
        var vC = UV_REGIONS.neckRib.y + ctv * UV_REGIONS.neckRib.h;
        crow2.push(pushV(cx, cy, cz, uC, vC));
      }
      colGrid.push(crow2);
    }
    for (var cv2 = 0; cv2 < colSegV; cv2++) {
      for (var cu2 = 0; cu2 < colSegU; cu2++) {
        addQuad(colGrid[cv2 + 1][cu2], colGrid[cv2][cu2], colGrid[cv2][cu2 + 1], colGrid[cv2 + 1][cu2 + 1]);
      }
    }

    // D) DEEP DARK INNER NECK CAVITY (Gives real 3D ghost-mannequin depth inside the collar!)
    var cavSegV = 8, cavGrid = [];
    for (var kv = 0; kv <= cavSegV; kv++) {
      var ktv = kv / cavSegV;
      var krow = [];
      for (var ku = 0; ku <= colSegU; ku++) {
        var ktu = ku / colSegU;
        var kAng = (ktu * 2 - 0.5) * Math.PI;
        var ks = Math.sin(kAng), kc = Math.cos(kAng);
        var shrink = 0.90 * (1.0 - 0.14 * ktv);
        var kx = ks * rxCol * shrink;
        var kz = kc * rzCol * shrink;
        var ky = collarYAt(kAng) - ktv * 0.38 * sizeVis;
        var uIn = UV_REGIONS.back.x + (0.30 + (1 - ktu) * 0.40) * UV_REGIONS.back.w;
        var vIn = UV_REGIONS.back.y + (0.04 + ktv * 0.24) * UV_REGIONS.back.h;
        krow.push(pushV(kx, ky, kz, uIn, vIn));
      }
      cavGrid.push(krow);
    }
    for (var kv2 = 0; kv2 < cavSegV; kv2++) {
      for (var ku2 = 0; ku2 < colSegU; ku2++) {
        addQuad(cavGrid[kv2][ku2], cavGrid[kv2][ku2 + 1], cavGrid[kv2 + 1][ku2 + 1], cavGrid[kv2 + 1][ku2]);
      }
    }
    var cavCenter = pushV(0, topY - 0.48 * sizeVis, 0, UV_REGIONS.back.x + 0.02, UV_REGIONS.back.y + 0.55);
    for (var ku3 = 0; ku3 < colSegU; ku3++) {
      idx.push(cavGrid[cavSegV][ku3], cavGrid[cavSegV][ku3 + 1], cavCenter);
    }

    // E) BOTTOM HEM CLOSURE
    var botCenter = pushV(0, botY + 0.03, 0, UV_REGIONS.front.x + 0.02, UV_REGIONS.front.y + 0.58);
    for (var bi = 0; bi < segU; bi++) {
      idx.push(torsoGrid[segV][bi], botCenter, torsoGrid[segV][bi + 1]);
    }

    // F) NATURAL HANGING GHOST-MANNEQUIN SLEEVES (Steep natural arm hang ~66 deg, rounded deltoid cap, realistic sleeve creases!)
    function buildSleeve(side) {
      if (spec.sleeveLen <= 0.01) return;
      var sSegL = 24, sSegR = 32, sGrid = [];
      var reg = (side < 0) ? UV_REGIONS.rightSleeve : UV_REGIONS.leftSleeve;

      var isLong = (spec.id === "longsleeve" || spec.id === "hoodie");
      var isOversized = (spec.id === "oversized" || spec.id === "crop" || spec.id === "hoodie");

      // Anchor deeply into rounded deltoid shoulder so sleeve flows smoothly down along body (NO T-pose!)
      var rootEmbed = halfW * 0.26;
      var startX = side * (halfW - rootEmbed);
      var shoulderTopY = topY - 0.132 * sizeVis;
      var baseRadY = Math.max(spec.sleeveRad * 1.02, 0.215 * spec.bodyW) * sizeVis;
      var baseRadZ = 0.175 * spec.bodyW * sizeVis;
      var startY = shoulderTopY - baseRadY * 0.86;

      // Natural hanging angle: ~64-72 deg down from horizontal (like real studio ghost-mannequin T-shirt!)
      var hangAngle = isLong ? 1.16 : (isOversized ? 0.94 : 1.00);
      var totalLen = (spec.sleeveLen * (isLong ? 0.96 : 1.06) * sizeVis) + rootEmbed * 0.72;

      // Smooth rounded deltoid shoulder curve -> natural hanging sleeve
      var p0x = startX, p0y = startY;
      var p1x = startX + side * (totalLen * 0.48), p1y = startY - Math.sin(hangAngle) * (totalLen * 0.18);
      var p2x = startX + side * Math.cos(hangAngle) * totalLen, p2y = startY - Math.sin(hangAngle) * totalLen;

      for (var sl = 0; sl <= sSegL; sl++) {
        var tl = sl / sSegL;
        var omt = 1 - tl;
        var axisX = omt * omt * p0x + 2 * omt * tl * p1x + tl * tl * p2x;
        var axisY = omt * omt * p0y + 2 * omt * tl * p1y + tl * tl * p2y;
        var axisZ = -0.012 * tl * sizeVis;

        var tanX = 2 * omt * (p1x - p0x) + 2 * tl * (p2x - p1x);
        var tanY = 2 * omt * (p1y - p0y) + 2 * tl * (p2y - p1y);
        var tanLen = Math.sqrt(tanX * tanX + tanY * tanY) || 1;
        tanX /= tanLen; tanY /= tanLen;
        var upX = (side > 0) ? -tanY : tanY;
        var upY = (side > 0) ?  tanX : -tanX;

        var blendCap = Math.pow(1 - tl, 1.8);
        var taper = isLong ? (1.0 - 0.44 * Math.pow(tl, 0.85)) : (1.0 - 0.22 * tl);
        var radY = baseRadY * blendCap + (spec.sleeveRad * 0.86 * sizeVis * taper) * (1 - blendCap);
        var radZ = baseRadZ * blendCap + (0.145 * spec.bodyW * sizeVis * taper) * (1 - blendCap);
        var cuffLip = (tl > 0.91) ? (0.005 * Math.sin(((tl - 0.91) / 0.09) * Math.PI)) : 0.0;

        var srow = [];
        for (var sr = 0; sr <= sSegR; sr++) {
          var tr = sr / sSegR, phi = tr * Math.PI * 2;
          var cP = Math.cos(phi), sP = Math.sin(phi);
          // Natural sleeve drape folds on under-side & near cuff
          var foldS = (0.0085 * Math.sin(phi * 3.0 + tl * 3.8) + 0.0045 * Math.cos(phi * 5.0 - tl * 2.0)) * Math.sin(tl * Math.PI);
          var ly = cP * (radY + foldS + cuffLip);
          var lz = sP * (radZ + foldS * 0.7 + cuffLip);
          var rootTuck = (sl === 0) ? 0.90 : 1.0;
          var vx = axisX + upX * ly * rootTuck;
          var vy = axisY + upY * ly * rootTuck;
          var vz = axisZ + lz * rootTuck;
          srow.push(pushV(vx, vy, vz, reg.x + tr * reg.w, reg.y + tl * reg.h));
        }
        sGrid.push(srow);
      }

      // Correct OUTWARD-facing winding so sleeves share identical studio lighting with torso!
      for (var sl2 = 0; sl2 < sSegL; sl2++) {
        for (var sr2 = 0; sr2 < sSegR; sr2++) {
          if (side > 0) addQuad(sGrid[sl2][sr2], sGrid[sl2][sr2 + 1], sGrid[sl2 + 1][sr2 + 1], sGrid[sl2 + 1][sr2]);
          else addQuad(sGrid[sl2][sr2], sGrid[sl2 + 1][sr2], sGrid[sl2 + 1][sr2 + 1], sGrid[sl2][sr2 + 1]);
        }
      }

      // Recessed inner cuff dark interior
      var endX = p2x - side * 0.04;
      var endY = p2y + 0.05;
      var cuffCenter = pushV(endX, endY, -0.02, reg.x + 0.02, reg.y + 0.02);
      for (var sr3 = 0; sr3 < sSegR; sr3++) {
        if (side > 0) idx.push(sGrid[sSegL][sr3], cuffCenter, sGrid[sSegL][sr3 + 1]);
        else idx.push(sGrid[sSegL][sr3], sGrid[sSegL][sr3 + 1], cuffCenter);
      }
    }
    buildSleeve(-1);
    buildSleeve(+1);

    return finalizeMesh(pos, nrm, uv, idx);
  }

  // ==========================================================================
  // 2. HIGH-POLY PROCEDURAL 3D BOTTLE & TUMBLER LATHE ENGINE (OWALA + 7 MORE!)
  // ==========================================================================
  function buildBottleMesh(spec) {
    var pos = [], nrm = [], uv = [], idx = [];
    function pushV(x, y, z, u, v) { pos.push(x, y, z); nrm.push(0, 1, 0); uv.push(u, v); return (pos.length / 3) - 1; }
    function addQuad(a, b, c, d) { idx.push(a, b, c, a, c, d); }

    var R = spec.bodyR;
    var H = spec.bodyH;
    var capH = spec.capH;
    var botY = -(H + capH) * 0.5;
    var topBodyY = botY + H;
    var topCapY = topBodyY + capH;

    // Lathe profile array: [y, radius, vTexCoord]
    // UV V mapping: 0.94..1.0 = Base, 0.24..0.94 = 360° Label Wrap, 0.16..0.24 = Neck Ring, 0.0..0.16 = Cap/Lid
    var prof = [];
    prof.push([botY, 0.001, 0.99]);
    prof.push([botY, R * 0.86, 0.97]);
    prof.push([botY + 0.04, R * 0.97, 0.95]);
    prof.push([botY + 0.09, R, 0.94]);

    // Main cylindrical label wrap zone (smooth subdivided rings)
    var bodyRings = 16;
    for (var b = 1; b <= bodyRings; b++) {
      var tb = b / bodyRings;
      var py = (botY + 0.09) + tb * (H - 0.20);
      var pr = R;
      if (spec.capStyle === "wine" && tb > 0.72) {
        var wt = (tb - 0.72) / 0.28;
        pr = R * (1.0 - 0.62 * wt * wt);
      } else if (spec.capStyle === "water" && tb > 0.78) {
        var wt2 = (tb - 0.78) / 0.22;
        pr = R * (1.0 - 0.56 * wt2);
      } else if (spec.capStyle === "serum" && tb > 0.82) {
        var wt3 = (tb - 0.82) / 0.18;
        pr = R * (1.0 - 0.45 * wt3);
      }
      var vTex = 0.94 - tb * 0.70; // 0.94 (bottom of label) -> 0.24 (top of label)
      prof.push([py, pr, vTex]);
    }

    // Crisp beveled insulated-bottle shoulder -> gleaming stainless steel neck collar
    var topR = prof[prof.length - 1][1];
    var isLoopCap = (spec.capStyle === "owala" || spec.capStyle === "sport" || spec.capStyle === "screw");
    if (isLoopCap) {
      prof.push([topBodyY - 0.08, topR * 0.99, 0.245]);
      prof.push([topBodyY - 0.04, topR * 0.93, 0.242]);
      prof.push([topBodyY + 0.02, topR * 0.70, 0.238]);
      // Gleaming Brushed Stainless Steel Neck Collar (matching reference!)
      prof.push([topBodyY + 0.025, topR * 0.68, 0.225]);
      prof.push([topBodyY + capH * 0.30, topR * 0.68, 0.172]);
      // Matte sculpted cap base sitting cleanly on steel collar
      prof.push([topBodyY + capH * 0.31, topR * 0.74, 0.155]);
      prof.push([topBodyY + capH * 0.56, topR * 0.75, 0.10]);
      prof.push([topBodyY + capH * 0.62, topR * 0.66, 0.06]);
      prof.push([topBodyY + capH * 0.64, 0.001, 0.02]);
    } else {
      prof.push([topBodyY - 0.05, topR * 0.96, 0.24]);
      prof.push([topBodyY, topR * 0.88, 0.23]);
      prof.push([topBodyY + 0.01, topR * 0.90, 0.22]);
      prof.push([topBodyY + capH * 0.24, topR * 0.90, 0.17]);
    }

    // Sculpted Cap / Lid per Bottle Type
    if (isLoopCap) {
      // Handled above with steel collar + sculpted cap base + 3D hollow carry loop below
    } else if (spec.capStyle === "owala_unused") {
    } else if (spec.capStyle === "can") {
      prof.push([topBodyY + 0.05, R * 0.86, 0.14]);
      prof.push([topBodyY + 0.09, R * 0.88, 0.06]);
      prof.push([topBodyY + 0.07, R * 0.80, 0.03]);
      prof.push([topBodyY + 0.07, 0.001, 0.01]);
    } else if (spec.capStyle === "dropper") {
      prof.push([topBodyY + capH * 0.35, topR * 0.94, 0.14]);
      prof.push([topBodyY + capH * 0.42, topR * 0.42, 0.10]);
      prof.push([topBodyY + capH * 0.85, topR * 0.36, 0.04]);
      prof.push([topCapY, topR * 0.22, 0.02]);
      prof.push([topCapY, 0.001, 0.01]);
    } else if (spec.capStyle === "pump") {
      prof.push([topBodyY + capH * 0.36, topR * 0.60, 0.14]);
      prof.push([topBodyY + capH * 0.68, topR * 0.24, 0.09]);
      prof.push([topBodyY + capH * 0.72, topR * 0.44, 0.06]);
      prof.push([topCapY, topR * 0.42, 0.02]);
      prof.push([topCapY, 0.001, 0.01]);
    } else if (spec.capStyle === "wine") {
      prof.push([topBodyY + capH * 0.75, topR * 0.92, 0.12]);
      prof.push([topBodyY + capH * 0.82, topR * 1.05, 0.06]);
      prof.push([topCapY, topR * 0.96, 0.02]);
      prof.push([topCapY, 0.001, 0.01]);
    } else {
      // Screw cap / Jar lid
      prof.push([topBodyY + capH * 0.30, topR * 0.94, 0.14]);
      prof.push([topCapY - 0.02, topR * 0.94, 0.04]);
      prof.push([topCapY, topR * 0.86, 0.02]);
      prof.push([topCapY, 0.001, 0.01]);
    }

    var segU = 48;
    var grid = [];
    for (var j = 0; j < prof.length; j++) {
      var py2 = prof[j][0], pr2 = prof[j][1], pv2 = prof[j][2];
      var row = [];
      for (var i = 0; i <= segU; i++) {
        var tu = i / segU;
        var ang = (tu * 2.0 - 0.5) * Math.PI; // u=0.5 faces directly front (+Z)
        var x = Math.sin(ang) * pr2;
        var z = Math.cos(ang) * pr2;
        row.push(pushV(x, py2, z, tu, pv2));
      }
      grid.push(row);
    }
    for (var j2 = 0; j2 < prof.length - 1; j2++) {
      for (var i2 = 0; i2 < segU; i2++) {
        addQuad(grid[j2][i2], grid[j2][i2 + 1], grid[j2 + 1][i2 + 1], grid[j2 + 1][i2]);
      }
    }

    // TRUE 3D HOLLOW CIRCULAR CARRY-LOOP HANDLE (Torus arch with clean open hole, matching studio reference!)
    if (spec.capStyle === "owala" || spec.capStyle === "sport" || spec.capStyle === "screw") {
      var majR = topR * 0.36;
      var minR = topR * 0.135;
      var loopCy = topBodyY + capH * 0.80;
      var tSegU = 28, tSegV = 14, tGrid = [];
      for (var tu2 = 0; tu2 <= tSegU; tu2++) {
        var theta = (tu2 / tSegU) * Math.PI * 2.0; // ring in XY plane so hole faces front (+Z)!
        var ct = Math.cos(theta), st = Math.sin(theta);
        // Slightly taller ergonomic oval arch
        var cxL = ct * majR * 1.02;
        var cyL = loopCy + st * majR * 1.12;
        var trow = [];
        for (var tv2 = 0; tv2 <= tSegV; tv2++) {
          var phi2 = (tv2 / tSegV) * Math.PI * 2.0;
          var cp2 = Math.cos(phi2), sp2 = Math.sin(phi2);
          // Slightly wider grip along Z for comfortable sculpted handle thickness
          var vx = cxL + ct * cp2 * minR;
          var vy = cyL + st * cp2 * minR;
          var vz = sp2 * minR * 1.35;
          trow.push(pushV(vx, vy, vz, 0.5, 0.06));
        }
        tGrid.push(trow);
      }
      for (var tu3 = 0; tu3 < tSegU; tu3++) {
        for (var tv3 = 0; tv3 < tSegV; tv3++) {
          addQuad(tGrid[tu3][tv3], tGrid[tu3 + 1][tv3], tGrid[tu3 + 1][tv3 + 1], tGrid[tu3][tv3 + 1]);
        }
      }
    }

    return finalizeMesh(pos, nrm, uv, idx);
  }

  // ==========================================================================
  // 3. 2D TEXTURE ATLAS COMPOSITOR (DRIVES BOTH T-SHIRT & BOTTLE!)
  // ==========================================================================
  function createTextureAtlas() {
    var cv = document.createElement("canvas");
    cv.width = 2048; cv.height = 2048;
    return cv;
  }

  function drawLayerItem(ctx, layer, W, H) {
    var cx = layer.x * W, cy = layer.y * H, lw = layer.w * W, lh = layer.h * H;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((layer.rot || 0) * Math.PI / 180);
    ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);
    ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1;
    if (layer.type === "image" && layer.img) {
      ctx.drawImage(layer.img, -lw / 2, -lh / 2, lw, lh);
    } else if (layer.type === "rect") {
      ctx.fillStyle = layer.color || "#f8f5ef";
      ctx.fillRect(-lw / 2, -lh / 2, lw, lh);
    } else if (layer.type === "text") {
      ctx.fillStyle = layer.color || "#ffffff";
      ctx.font = "800 " + Math.round(lh * 0.72) + "px Inter, Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(layer.text || "DESIGN360N", 0, 0);
    }
    ctx.restore();
  }

  function drawTShirtDemo(ctx, W, H, baseCol) {
    var fr = UV_REGIONS.front, bk = UV_REGIONS.back;
    ctx.save();
    // Clean flagship minimalist studio chest graphic (symmetric, zero weird sleeve stripes!)
    var fx = (fr.x + fr.w * 0.50) * W;
    var fy = (fr.y + fr.h * 0.34) * H;
    ctx.strokeStyle = "rgba(248, 250, 252, 0.88)";
    ctx.lineWidth = 4;
    ctx.strokeRect(fx - 125, fy - 48, 250, 96);
    ctx.fillStyle = "rgba(248, 250, 252, 0.95)";
    ctx.font = "900 34px Inter, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("DESIGN360N", fx, fy - 8);
    ctx.fillStyle = "rgba(111, 232, 192, 0.95)";
    ctx.font = "700 16px Inter, Segoe UI, sans-serif";
    ctx.fillText("STUDIO EDITION • 260 GSM", fx, fy + 24);

    // Subtle back yoke emblem
    var bx = (bk.x + bk.w * 0.50) * W;
    var by = (bk.y + bk.h * 0.24) * H;
    ctx.fillStyle = "rgba(248, 250, 252, 0.78)";
    ctx.font = "800 22px Inter, Segoe UI, sans-serif";
    ctx.fillText("D360N", bx, by);
    ctx.restore();
  }

  function drawBottleDemo(ctx, W, H) {
    // Stylish monochrome sticker/doodle wrap inspired by the user's Owala reference photo!
    var ly = UV_REGIONS.bottleLabel.y * H, lh = UV_REGIONS.bottleLabel.h * H;
    ctx.save();
    ctx.strokeStyle = "#f8fafc";
    ctx.fillStyle = "#f8fafc";
    ctx.lineWidth = 5;
    // Stars & dots scattered across 360 wrap
    var stars = [[120,380],[260,520],[420,340],[560,480],[720,370],[880,540],[190,700],[490,740],[680,680],[840,780],[340,620],[610,320]];
    stars.forEach(function (s) {
      ctx.beginPath(); ctx.arc(s[0], s[1], 7, 0, Math.PI * 2); ctx.fill();
    });
    // Playing card + Dice + Brand Emblem
    ctx.strokeRect(430, ly + lh * 0.16, 110, 150);
    ctx.font = "bold 46px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("♥", 485, ly + lh * 0.30);
    ctx.strokeRect(580, ly + lh * 0.42, 96, 96);
    [[604, ly+lh*0.46],[652, ly+lh*0.46],[628, ly+lh*0.50],[604, ly+lh*0.54],[652, ly+lh*0.54]].forEach(function (d) {
      ctx.beginPath(); ctx.arc(d[0], d[1], 7, 0, Math.PI * 2); ctx.fill();
    });
    // Vertical brand mark like reference
    ctx.save();
    ctx.translate(310, ly + lh * 0.72);
    ctx.rotate(-Math.PI / 2);
    ctx.font = "800 34px Inter, sans-serif";
    ctx.fillText("DESIGN360N", 0, 0);
    ctx.restore();
    ctx.restore();
  }

  function renderAtlas(cv, state) {
    var ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    var W = cv.width, H = cv.height;

    if (state.studioMode === "bottle") {
      // Base bottle body color
      ctx.fillStyle = state.bottleBodyColor || "#16181d";
      ctx.fillRect(0, 0, W, H);

      // Top Cap / Lid region (0..0.16)
      ctx.fillStyle = state.bottleCapColor || "#f4f2ee";
      ctx.fillRect(0, 0, W, UV_REGIONS.bottleCap.h * H);
      // Dark brown spout accent at very top (0..0.045) for Owala style
      if (state.bottleType === "owala") {
        ctx.fillStyle = "#3f2e26";
        ctx.fillRect(0, 0, W, H * 0.045);
      }

      // Metallic Neck Ring (0.16..0.24)
      ctx.fillStyle = state.bottleRingColor || "#c8a996";
      ctx.fillRect(0, UV_REGIONS.bottleRing.y * H, W, UV_REGIONS.bottleRing.h * H);

      // 360° Label Wrap Zone (0.24..0.94)
      var ly = UV_REGIONS.bottleLabel.y * H, lh = UV_REGIONS.bottleLabel.h * H;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, ly, W, lh); ctx.clip();
      if (state.fullBottleImg) {
        ctx.drawImage(state.fullBottleImg, 0, ly, W, lh);
      } else if (state.showDemoArtwork) {
        drawBottleDemo(ctx, W, H);
      }
      if (state.bottleLayers && state.bottleLayers.length) {
        for (var bi = 0; bi < state.bottleLayers.length; bi++) {
          var bl = state.bottleLayers[bi];
          // Map 2D bottle dieline layer y (0..1) into label zone (0.24..0.94)
          drawLayerItem(ctx, {
            type: bl.type, img: bl.img, text: bl.text, color: bl.color,
            x: bl.x, y: UV_REGIONS.bottleLabel.y + bl.y * UV_REGIONS.bottleLabel.h,
            w: bl.w, h: bl.h * UV_REGIONS.bottleLabel.h, rot: bl.rot, flipH: bl.flipH, flipV: bl.flipV
          }, W, H);
        }
      }
      ctx.restore();
      return;
    }

    // T-SHIRT MODE ATLAS
    ctx.fillStyle = state.bodyColor || "#7a1c1c";
    ctx.fillRect(0, 0, W, H);

    if (state.sleeveColor && state.sleeveColor !== state.bodyColor) {
      ctx.fillStyle = state.sleeveColor;
      ctx.fillRect(UV_REGIONS.rightSleeve.x * W - 18, UV_REGIONS.rightSleeve.y * H - 18, UV_REGIONS.rightSleeve.w * W + 36, UV_REGIONS.rightSleeve.h * H + 36);
      ctx.fillRect(UV_REGIONS.leftSleeve.x * W - 18, UV_REGIONS.leftSleeve.y * H - 18, UV_REGIONS.leftSleeve.w * W + 36, UV_REGIONS.leftSleeve.h * H + 36);
    }
    if (state.collarColor) {
      ctx.fillStyle = state.collarColor;
      ctx.fillRect(0, 0, W, (UV_REGIONS.neckRib.y + UV_REGIONS.neckRib.h) * H + 16);
    }
    if (state.fullPatternImg) {
      ctx.drawImage(state.fullPatternImg, 0, 0, W, H);
    } else if (state.showDemoArtwork) {
      drawTShirtDemo(ctx, W, H, state.bodyColor);
    }
    if (state.layers && state.layers.length) {
      for (var i = 0; i < state.layers.length; i++) drawLayerItem(ctx, state.layers[i], W, H);
    }
    if (state.garmentType === "polo" || state.garmentType === "henley") {
      var px = (UV_REGIONS.front.x + UV_REGIONS.front.w * 0.5) * W, py = UV_REGIONS.front.y * H;
      ctx.fillStyle = "rgba(0,0,0,0.22)"; ctx.fillRect(px - 14, py, 28, 130);
      var cnt = state.garmentType === "henley" ? 3 : 2;
      for (var k = 0; k < cnt; k++) { ctx.beginPath(); ctx.arc(px, py + 36 + k * 36, 5.5, 0, Math.PI * 2); ctx.fillStyle = "#e2e8f0"; ctx.fill(); }
    }
    if (state.showNeckLabel) {
      var lx = (UV_REGIONS.back.x + UV_REGIONS.back.w * 0.5) * W, ly2 = (UV_REGIONS.back.y + 0.04) * H;
      ctx.save(); ctx.fillStyle = "rgba(255,255,255,0.82)"; ctx.textAlign = "center";
      ctx.font = "bold 20px sans-serif"; ctx.fillText((state.labelBrand || "DESIGN360N").toUpperCase(), lx, ly2 + 26);
      ctx.font = "bold 16px sans-serif"; ctx.fillText((state.sizeCode || "XL") + " / TG", lx, ly2 + 48);
      ctx.font = "11px sans-serif"; ctx.fillText(state.labelMeta || "100% COTTON • MADE IN BANGLADESH", lx, ly2 + 66);
      ctx.restore();
    }
  }

  // ==========================================================================
  // 4. INTERACTIVE 2D DIELINE WORKSPACE RENDERER (T-SHIRT & BOTTLE!)
  // ==========================================================================
  function tracePanelPath(ctx, reg, W, H, kind, neckType) {
    var x = reg.x * W, y = reg.y * H, pw = reg.w * W, ph = reg.h * H;
    ctx.beginPath();
    if (kind === "sleeve") {
      ctx.moveTo(x, y + ph * 0.36);
      ctx.quadraticCurveTo(x + pw * 0.25, y, x + pw * 0.50, y);
      ctx.quadraticCurveTo(x + pw * 0.75, y, x + pw, y + ph * 0.36);
      ctx.lineTo(x + pw * 0.92, y + ph); ctx.lineTo(x + pw * 0.08, y + ph); ctx.closePath();
    } else if (kind === "rib") {
      ctx.rect(x, y, pw, ph);
    } else {
      var isFront = (kind === "front");
      var neckD = isFront ? (neckType === "vneck" || neckType === "polo" ? ph * 0.14 : ph * 0.085) : ph * 0.035;
      var armD = ph * 0.28, armIn = pw * 0.085;
      ctx.moveTo(x + pw * 0.30, y);
      if (isFront && (neckType === "vneck" || neckType === "polo")) { ctx.lineTo(x + pw * 0.50, y + neckD); ctx.lineTo(x + pw * 0.70, y); }
      else { ctx.quadraticCurveTo(x + pw * 0.50, y + neckD * 1.45, x + pw * 0.70, y); }
      ctx.lineTo(x + pw * 0.94, y + ph * 0.04);
      ctx.quadraticCurveTo(x + pw - armIn * 1.1, y + armD * 0.55, x + pw, y + armD);
      ctx.lineTo(x + pw, y + ph); ctx.lineTo(x, y + ph); ctx.lineTo(x, y + armD);
      ctx.quadraticCurveTo(x + armIn * 1.1, y + armD * 0.55, x + pw * 0.06, y + ph * 0.04);
      ctx.closePath();
    }
  }

  function render2DDielineWorkspace(canvas2d, atlasCanvas, state, selectedId) {
    var ctx = canvas2d.getContext("2d");
    var W = canvas2d.width, H = canvas2d.height;
    ctx.fillStyle = "#111622"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(148,163,184,0.08)"; ctx.lineWidth = 1;
    for (var gx = 0; gx < W; gx += 24) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 0; gy < H; gy += 24) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    if (state.studioMode === "bottle") {
      var bsp = getBottleSpec(state.bottleType, state.bottleVol);
      var padX = 24, padY = 26, dw = W - padX * 2, dh = H - padY * 2;
      // Draw clipped 360° wrap label from atlas
      ctx.drawImage(atlasCanvas, 0, UV_REGIONS.bottleLabel.y * atlasCanvas.height, atlasCanvas.width, UV_REGIONS.bottleLabel.h * atlasCanvas.height, padX, padY, dw, dh);
      // Bleed (red dashed), Cut (cyan solid), Safe Zone (green dashed)
      ctx.strokeStyle = "#f43f5e"; ctx.setLineDash([4, 3]); ctx.strokeRect(padX - 6, padY - 6, dw + 12, dh + 12);
      ctx.strokeStyle = "#3bcdca"; ctx.setLineDash([]); ctx.lineWidth = 1.6; ctx.strokeRect(padX, padY, dw, dh);
      ctx.strokeStyle = "#22c55e"; ctx.setLineDash([3, 3]); ctx.lineWidth = 1; ctx.strokeRect(padX + 10, padY + 10, dw - 20, dh - 20);
      // Front Center line
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.moveTo(padX + dw * 0.5, padY); ctx.lineTo(padX + dw * 0.5, padY + dh); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#3bcdca"; ctx.font = "600 10px Inter, sans-serif"; ctx.textAlign = "center";
      ctx.fillText("360° Bottle Wrap Dieline: " + bsp.circMm + " × " + bsp.labelHMm + " mm (Ø" + bsp.diamMm + "mm • " + bsp.volCode + ")", W / 2, 16);
      ctx.fillStyle = "#94a3b8"; ctx.font = "9px Inter, sans-serif";
      ctx.fillText("BACK SEAM", padX + 28, H - 8); ctx.fillText("FRONT CENTER", W / 2, H - 8); ctx.fillText("BACK SEAM", W - padX - 28, H - 8);

      // Selected layer box on bottle dieline
      if (selectedId && state.bottleLayers) {
        for (var k = 0; k < state.bottleLayers.length; k++) {
          var BL = state.bottleLayers[k];
          if (BL.id !== selectedId) continue;
          var blx = padX + BL.x * dw, bly = padY + BL.y * dh, blw = BL.w * dw, blh = BL.h * dh;
          ctx.save(); ctx.translate(blx, bly); ctx.rotate((BL.rot || 0) * Math.PI / 180);
          ctx.strokeStyle = "#3bcdca"; ctx.lineWidth = 1.5; ctx.strokeRect(-blw / 2, -blh / 2, blw, blh);
          ctx.fillStyle = "#ffffff";
          [[-blw/2,-blh/2],[blw/2,-blh/2],[blw/2,blh/2],[-blw/2,blh/2]].forEach(function (pt) {
            ctx.fillRect(pt[0]-3, pt[1]-3, 6, 6); ctx.strokeRect(pt[0]-3, pt[1]-3, 6, 6);
          });
          ctx.restore();
        }
      }
      return;
    }

    var spec = getGarmentSpec(state.garmentType, state.sizeCode);
    var panels = [
      { key: "neckRibFront", kind: "rib",   label: "Neck Rib Front • " + (spec.ribW / 2).toFixed(1) + "×" + spec.ribH + " cm" },
      { key: "neckRibBack",  kind: "rib",   label: "Neck Rib Back • " + (spec.ribW / 2).toFixed(1) + "×" + spec.ribH + " cm" },
      { key: "front",        kind: "front", label: "Front (" + spec.sizeCode + ") • " + spec.wCm + "×" + spec.hCm + " cm" },
      { key: "back",         kind: "back",  label: "Back (" + spec.sizeCode + ") • " + spec.wCm + "×" + spec.hCm + " cm" }
    ];
    if (spec.slW > 0) {
      panels.push({ key: "rightSleeve", kind: "sleeve", label: "Right Sleeve • " + spec.slW + "×" + spec.slH + " cm" });
      panels.push({ key: "leftSleeve",  kind: "sleeve", label: "Left Sleeve • " + spec.slW + "×" + spec.slH + " cm" });
    }
    for (var i = 0; i < panels.length; i++) {
      var p = panels[i], reg = UV_REGIONS[p.key];
      ctx.save(); tracePanelPath(ctx, reg, W, H, p.kind, spec.neckType); ctx.clip(); ctx.drawImage(atlasCanvas, 0, 0, W, H); ctx.restore();
      ctx.save(); ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.setLineDash([3, 3]);
      var cx = (reg.x + reg.w * 0.5) * W; ctx.beginPath(); ctx.moveTo(cx, reg.y * H); ctx.lineTo(cx, (reg.y + reg.h) * H); ctx.stroke(); ctx.restore();
      ctx.save(); tracePanelPath(ctx, reg, W, H, p.kind, spec.neckType); ctx.strokeStyle = "rgba(59,205,202,0.8)"; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
      ctx.fillStyle = "#cbd5e1"; ctx.font = "600 9px Inter, sans-serif"; ctx.textAlign = "center";
      ctx.fillText(p.label, (reg.x + reg.w * 0.5) * W, reg.y * H - 3);
    }
    if (selectedId && state.layers) {
      for (var k2 = 0; k2 < state.layers.length; k2++) {
        var L = state.layers[k2];
        if (L.id !== selectedId) continue;
        var lx = L.x * W, ly = L.y * H, lw = L.w * W, lh = L.h * H;
        ctx.save(); ctx.translate(lx, ly); ctx.rotate((L.rot || 0) * Math.PI / 180);
        ctx.strokeStyle = "#3bcdca"; ctx.lineWidth = 1.5; ctx.strokeRect(-lw / 2, -lh / 2, lw, lh);
        ctx.fillStyle = "#ffffff";
        [[-lw/2,-lh/2],[lw/2,-lh/2],[lw/2,lh/2],[-lw/2,lh/2]].forEach(function (pt) {
          ctx.fillRect(pt[0]-3, pt[1]-3, 6, 6); ctx.strokeRect(pt[0]-3, pt[1]-3, 6, 6);
        });
        ctx.restore();
      }
    }
  }

  // ==========================================================================
  // 5. WEBGL 3D RENDERER (CLOTH + BOTTLE SPECULAR SHADING)
  // ==========================================================================
  var VS_SRC = [
    "attribute vec3 aPos; attribute vec3 aNrm; attribute vec2 aUV;",
    "uniform mat4 uMVP; uniform mat4 uModel;",
    "varying vec3 vNrm; varying vec3 vWorldPos; varying vec2 vUV;",
    "void main() {",
    "  vec4 wp = uModel * vec4(aPos, 1.0);",
    "  vWorldPos = wp.xyz; vNrm = normalize((uModel * vec4(aNrm, 0.0)).xyz); vUV = aUV;",
    "  gl_Position = uMVP * vec4(aPos, 1.0);",
    "}"
  ].join("\n");

  var FS_SRC = [
    "precision mediump float;",
    "varying vec3 vNrm; varying vec3 vWorldPos; varying vec2 vUV;",
    "uniform sampler2D uTex; uniform float uWrinkle; uniform float uFoldShadow; uniform float uSheen; uniform float uSpecPow;",
    "void main() {",
    "  vec4 tex = texture2D(uTex, vUV);",
    "  vec3 N = normalize(vNrm);",
    "  float foldAO = 1.0;",
    "  if (uWrinkle > 0.01) {",
    "    // High-definition studio fabric drape & diagonal tension crease normal perturbation",
    "    float dA = sin(vWorldPos.x * 7.5 + vWorldPos.y * 4.5) * cos(vWorldPos.y * 6.0 - vWorldPos.z * 4.0);",
    "    float dB = sin(vWorldPos.x * 15.0 - vWorldPos.y * 11.0);",
    "    float micro = sin(vUV.x * 640.0) * sin(vUV.y * 640.0) * 0.012;",
    "    N = normalize(N + vec3((dA * 0.09 + dB * 0.035) * uWrinkle, (dB * 0.045) * uWrinkle, micro));",
    "    foldAO = 1.0 - uFoldShadow * 0.16 * max(0.0, -dA);",
    "  }",
    "  // Studio 3-point photography rig: Overhead Softbox Key + Side Fill + Crisp Silhouette Rim",
    "  vec3 Lkey  = normalize(vec3(0.35, 1.35, 1.45));",
    "  vec3 Lfill = normalize(vec3(-1.15, 0.40, 0.75));",
    "  vec3 Lrim  = normalize(vec3(0.0, 0.90, -1.35));",
    "  vec3 V     = normalize(vec3(0.0, 0.05, 3.6) - vWorldPos);",
    "  vec3 Hkey  = normalize(Lkey + V);",
    "  float diffKey  = max(0.0, (dot(N, Lkey) + 0.35) / 1.35);",
    "  float diffFill = max(0.0, (dot(N, Lfill) + 0.30) / 1.30) * 0.28;",
    "  float hemi     = 0.20 + 0.18 * (N.y * 0.5 + 0.5);",
    "  // Realistic satin/cotton specular sheen on shoulder & chest ridges (makes black tees look 3D!)",
    "  float specBase = pow(max(dot(N, Hkey), 0.0), max(12.0, uSpecPow)) * max(uSheen, 0.14);",
    "  float rimFres  = pow(1.0 - max(dot(N, V), 0.0), 2.8) * (0.14 + 0.12 * max(0.0, dot(N, Lrim) + 0.4));",
    "  vec3 lit = tex.rgb * (hemi + 0.70 * diffKey + diffFill) * foldAO;",
    "  vec3 col = lit + vec3(specBase * 0.55 + rimFres * 0.42);",
    "  gl_FragColor = vec4(min(col, vec3(1.0)), 1.0);",
    "}"
  ].join("\n");

  function mat4Identity() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
  function mat4Mul(a, b) {
    var o = new Float32Array(16);
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++)
      o[j*4+i] = a[i]*b[j*4] + a[4+i]*b[j*4+1] + a[8+i]*b[j*4+2] + a[12+i]*b[j*4+3];
    return o;
  }
  function mat4Perspective(fov, asp, n, f) {
    var t = 1 / Math.tan(fov / 2), nf = 1 / (n - f);
    return new Float32Array([t/asp,0,0,0, 0,t,0,0, 0,0,(f+n)*nf,-1, 0,0,2*f*n*nf,0]);
  }
  function mat4Translate(x, y, z) { var m = mat4Identity(); m[12] = x; m[13] = y; m[14] = z; return m; }
  function mat4RotY(r) { var c = Math.cos(r), s = Math.sin(r); return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]); }
  function mat4RotX(r) { var c = Math.cos(r), s = Math.sin(r); return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]); }

  function Apparel3DViewer(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, antialias: true, alpha: true })
           || canvas.getContext("experimental-webgl", { preserveDrawingBuffer: true, antialias: true, alpha: true });

    this.state = {
      studioMode: "tshirt", // "tshirt" | "bottle"
      garmentType: "oversized", sizeCode: "XL",
      bodyColor: "#14161a", sleeveColor: "#14161a", collarColor: "#0e1013",
      bottleType: "owala", bottleVol: "710ml",
      bottleBodyColor: "#1b1e23", bottleCapColor: "#22252b", bottleRingColor: "#d8dee6",
      bottleFinish: "matte",
      material: "cotton", wrinkles: 0.55, foldShadow: 0.65, backdrop: "gray",
      showDemoArtwork: true, showNeckLabel: true,
      labelBrand: "DESIGN360N", labelMeta: "100% COTTON • MADE IN BANGLADESH",
      fullPatternImg: null, fullBottleImg: null,
      layers: [], bottleLayers: [],
      rotY: 0.04, rotX: 0.04, zoom: 3.40, panY: 0.00, autoRotate: false
    };

    this.atlasCanvas = createTextureAtlas();
    this.mesh = null; this.glRes = null;
    this._dragging = false; this._lastX = 0; this._lastY = 0; this.isRecording = false;

    if (this.gl) this._initGL();
    this.rebuildModel();
    this.refreshTexture();
    this._bindInteraction();
    this._startLoop();
  }

  Apparel3DViewer.prototype._initGL = function () {
    var gl = this.gl;
    function compile(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS_SRC));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS_SRC));
    gl.linkProgram(prog); gl.useProgram(prog);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    this.glRes = {
      prog: prog, tex: tex,
      aPos: gl.getAttribLocation(prog, "aPos"), aNrm: gl.getAttribLocation(prog, "aNrm"), aUV: gl.getAttribLocation(prog, "aUV"),
      uMVP: gl.getUniformLocation(prog, "uMVP"), uModel: gl.getUniformLocation(prog, "uModel"),
      uWrinkle: gl.getUniformLocation(prog, "uWrinkle"), uFoldShadow: gl.getUniformLocation(prog, "uFoldShadow"),
      uSheen: gl.getUniformLocation(prog, "uSheen"), uSpecPow: gl.getUniformLocation(prog, "uSpecPow"),
      posBuf: gl.createBuffer(), nrmBuf: gl.createBuffer(), uvBuf: gl.createBuffer(), idxBuf: gl.createBuffer()
    };
  };

  Apparel3DViewer.prototype.rebuildModel = function () {
    if (this.state.studioMode === "bottle") {
      this.mesh = buildBottleMesh(getBottleSpec(this.state.bottleType, this.state.bottleVol));
    } else {
      this.mesh = buildGarmentMesh(getGarmentSpec(this.state.garmentType, this.state.sizeCode));
    }
    if (!this.gl || !this.glRes) return;
    var gl = this.gl, r = this.glRes;
    gl.bindBuffer(gl.ARRAY_BUFFER, r.posBuf); gl.bufferData(gl.ARRAY_BUFFER, this.mesh.positions, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, r.nrmBuf); gl.bufferData(gl.ARRAY_BUFFER, this.mesh.normals, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, r.uvBuf);  gl.bufferData(gl.ARRAY_BUFFER, this.mesh.uvs, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, r.idxBuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indices, gl.STATIC_DRAW);
  };
  Apparel3DViewer.prototype.rebuildGarment = Apparel3DViewer.prototype.rebuildModel;

  Apparel3DViewer.prototype.refreshTexture = function () {
    renderAtlas(this.atlasCanvas, this.state);
    if (!this.gl || !this.glRes) return;
    var gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.glRes.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.atlasCanvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    var aniso = gl.getExtension("EXT_texture_filter_anisotropic") || gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
    if (aniso) {
      var maxA = gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 4;
      gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, maxA));
    }
  };

  Apparel3DViewer.prototype._applyBackdropStyle = function () {
    var b = this.state.backdrop;
    var bg = "radial-gradient(circle at 50% 42%, #2b2f3a 0%, #090c14 100%)";
    if (b === "blinds") bg = "repeating-linear-gradient(155deg, rgba(255,255,255,0.12) 0px, rgba(255,255,255,0.12) 18px, rgba(0,0,0,0.68) 18px, rgba(0,0,0,0.68) 44px), radial-gradient(circle at 50% 45%, #373c48 0%, #0d1017 100%)";
    else if (b === "white") bg = "radial-gradient(circle at 50% 45%, #ffffff 0%, #e2e8f0 100%)";
    else if (b === "gray") bg = "radial-gradient(circle at 50% 45%, #cbd5e1 0%, #64748b 100%)";
    else if (b === "transparent") bg = "repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%) 50% / 14px 14px";
    this.canvas.style.background = bg;
  };

  Apparel3DViewer.prototype.renderFrame = function (isExport) {
    this._applyBackdropStyle();
    if (!this.gl || !this.glRes || !this.mesh) return;
    if (!isExport) {
      var cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
      if (cw > 20 && ch > 20) {
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        var tw = Math.round(cw * dpr), th = Math.round(ch * dpr);
        if (this.canvas.width !== tw || this.canvas.height !== th) {
          this.canvas.width = tw;
          this.canvas.height = th;
        }
      }
    }
    var gl = this.gl, r = this.glRes;
    var w = this.canvas.width, h = this.canvas.height;
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    var proj = mat4Perspective(0.75, w / Math.max(1, h), 0.1, 25.0);
    var view = mat4Translate(0, this.state.panY, -this.state.zoom);
    var model = mat4Mul(mat4RotX(this.state.rotX), mat4RotY(this.state.rotY));
    var mvp = mat4Mul(proj, mat4Mul(view, model));

    gl.useProgram(r.prog);
    gl.uniformMatrix4fv(r.uMVP, false, mvp);
    gl.uniformMatrix4fv(r.uModel, false, model);
    if (this.state.studioMode === "bottle") {
      gl.uniform1f(r.uWrinkle, 0.0);
      gl.uniform1f(r.uFoldShadow, 0.0);
      var fMap = { matte: [0.18, 18.0], glossy: [0.58, 48.0], metallic: [0.72, 32.0], glass: [0.65, 64.0] };
      var fp = fMap[this.state.bottleFinish] || fMap.matte;
      gl.uniform1f(r.uSheen, fp[0]);
      gl.uniform1f(r.uSpecPow, fp[1]);
    } else {
      gl.uniform1f(r.uWrinkle, this.state.wrinkles);
      gl.uniform1f(r.uFoldShadow, this.state.foldShadow);
      var sMap = { cotton: 0.14, heavyweight: 0.10, mesh: 0.22, fleece: 0.08, silk: 0.42 };
      gl.uniform1f(r.uSheen, sMap[this.state.material] || 0.14);
      gl.uniform1f(r.uSpecPow, 16.0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, r.posBuf); gl.enableVertexAttribArray(r.aPos); gl.vertexAttribPointer(r.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, r.nrmBuf); gl.enableVertexAttribArray(r.aNrm); gl.vertexAttribPointer(r.aNrm, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, r.uvBuf);  gl.enableVertexAttribArray(r.aUV);  gl.vertexAttribPointer(r.aUV, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, r.idxBuf);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, r.tex);
    gl.drawElements(gl.TRIANGLES, this.mesh.indices.length, gl.UNSIGNED_SHORT, 0);
  };

  Apparel3DViewer.prototype._startLoop = function () {
    var self = this;
    var lastDraw = 0;
    function tick(now) {
      requestAnimationFrame(tick);
      if (self.isRecording) return; // Lock WebGL canvas at 1440x1440 during HD video recording!
      if (self.canvas && self.canvas.offsetParent === null) return; // Pause WebGL completely when tab hidden!
      var active = self._dragging || self.state.autoRotate;
      if (!active && (now - lastDraw) < 110) return; // Throttle idle WebGL to ~9fps (Zero GPU hang!)
      lastDraw = now;
      if (self.state.autoRotate && !self._dragging) self.state.rotY += 0.012;
      self.renderFrame();
    }
    requestAnimationFrame(tick);
  };

  Apparel3DViewer.prototype._bindInteraction = function () {
    var self = this;
    this.canvas.addEventListener("mousedown", function (e) { self._dragging = true; self._lastX = e.clientX; self._lastY = e.clientY; });
    window.addEventListener("mousemove", function (e) {
      if (!self._dragging) return;
      self.state.rotY += (e.clientX - self._lastX) * 0.012;
      self.state.rotX = Math.max(-0.9, Math.min(0.9, self.state.rotX + (e.clientY - self._lastY) * 0.01));
      self._lastX = e.clientX; self._lastY = e.clientY;
    });
    window.addEventListener("mouseup", function () { self._dragging = false; });
    this.canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      self.state.zoom = Math.max(1.4, Math.min(4.8, self.state.zoom + (e.deltaY > 0 ? 0.16 : -0.16)));
    }, { passive: false });
  };

  Apparel3DViewer.prototype.getAutoFitMetrics = function (aspect) {
    var m = this.mesh;
    if (!m || !m.positions || !m.positions.length) return { panY: 0, zoom: 2.5 };
    var minY = 1e9, maxY = -1e9, maxR = 0;
    for (var i = 0; i < m.positions.length; i += 3) {
      var x = m.positions[i], y = m.positions[i + 1], z = m.positions[i + 2];
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      var r = Math.sqrt(x * x + z * z);
      if (r > maxR) maxR = r;
    }
    var midY = (minY + maxY) * 0.5;
    var halfH = (maxY - minY) * 0.5;
    var tanHalf = Math.tan(0.75 * 0.5);
    var zForH = (halfH * 1.24) / tanHalf + maxR * 0.65;
    var zForW = (maxR * 1.32) / (tanHalf * Math.max(0.5, aspect || 1.0)) + maxR * 0.65;
    return { panY: -midY, zoom: Math.max(zForH, zForW) };
  };

  Apparel3DViewer.prototype.setCamera = function (preset) {
    this.state.autoRotate = false;
    var asp = this.canvas.width / Math.max(1, this.canvas.height);
    var fit = this.getAutoFitMetrics(asp);
    this.state.panY = fit.panY;
    var zDef = fit.zoom;
    if (preset === "front")       { this.state.rotY = 0;       this.state.rotX = 0.05; this.state.zoom = zDef; }
    else if (preset === "back")   { this.state.rotY = Math.PI; this.state.rotX = 0.05; this.state.zoom = zDef; }
    else if (preset === "left")   { this.state.rotY = -1.45;   this.state.rotX = 0.06; this.state.zoom = zDef; }
    else if (preset === "right")  { this.state.rotY = 1.45;    this.state.rotX = 0.06; this.state.zoom = zDef; }
    else if (preset === "collar") { this.state.rotY = 0.12;    this.state.rotX = 0.28; this.state.zoom = zDef * 0.62; this.state.panY = fit.panY - 0.42; }
    else                          { this.state.rotY = 0.35;    this.state.rotX = 0.08; this.state.zoom = zDef; }
  };

  Apparel3DViewer.prototype.exportHDPNG = function (size) {
    size = size || 1600;
    var oldW = this.canvas.width, oldH = this.canvas.height;
    var oldZoom = this.state.zoom, oldPanY = this.state.panY;

    // Auto-frame cleanly for 1:1 square HD export (never tiny, never cropped!)
    var fit = this.getAutoFitMetrics(1.0);
    this.state.panY = fit.panY;
    this.state.zoom = fit.zoom;
    this.canvas.width = size;
    this.canvas.height = size;
    this.renderFrame(true);

    var out = document.createElement("canvas");
    out.width = size; out.height = size;
    var ctx = out.getContext("2d");
    if (this.state.backdrop !== "transparent") {
      var grad = ctx.createRadialGradient(size*0.5, size*0.44, size*0.05, size*0.5, size*0.5, size*0.72);
      if (this.state.backdrop === "white") { grad.addColorStop(0, "#ffffff"); grad.addColorStop(1, "#e2e8f0"); }
      else if (this.state.backdrop === "gray") { grad.addColorStop(0, "#cbd5e1"); grad.addColorStop(1, "#64748b"); }
      else { grad.addColorStop(0, "#373c48"); grad.addColorStop(1, "#090c14"); }
      ctx.fillStyle = grad; ctx.fillRect(0, 0, size, size);
      if (this.state.backdrop === "blinds") {
        ctx.save(); ctx.translate(size/2, size/2); ctx.rotate(-0.42); ctx.fillStyle = "rgba(0,0,0,0.48)";
        for (var y = -size; y < size; y += 92) ctx.fillRect(-size, y, size*2, 46);
        ctx.restore();
      }
    }
    ctx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height, 0, 0, size, size);
    var url = out.toDataURL("image/png");

    // Restore live preview framing
    this.canvas.width = oldW; this.canvas.height = oldH;
    this.state.zoom = oldZoom; this.state.panY = oldPanY;
    this.renderFrame();
    return url;
  };

  Apparel3DViewer.prototype.exportOBJ = function () {
    var m = this.mesh;
    var tag = this.state.studioMode === "bottle" ? (this.state.bottleType + "_" + this.state.bottleVol) : (this.state.garmentType + "_" + this.state.sizeCode);
    var lines = ["# Design360n Workstation v13.0 — 3D Model (" + tag + ")", "o Design360n_3D"];
    for (var i = 0; i < m.positions.length; i += 3) lines.push("v " + m.positions[i].toFixed(4) + " " + m.positions[i+1].toFixed(4) + " " + m.positions[i+2].toFixed(4));
    for (var j = 0; j < m.uvs.length; j += 2) lines.push("vt " + m.uvs[j].toFixed(4) + " " + (1 - m.uvs[j+1]).toFixed(4));
    for (var k = 0; k < m.indices.length; k += 3) {
      var a = m.indices[k]+1, b = m.indices[k+1]+1, c = m.indices[k+2]+1;
      lines.push("f " + a + "/" + a + " " + b + "/" + b + " " + c + "/" + c);
    }
    return lines.join("\n");
  };

  global.Apparel3D = {
    GARMENT_TYPES: GARMENT_TYPES,
    SIZE_GRADES: SIZE_GRADES,
    BOTTLE_TYPES: BOTTLE_TYPES,
    BOTTLE_VOLUMES: BOTTLE_VOLUMES,
    UV_REGIONS: UV_REGIONS,
    getGarmentSpec: getGarmentSpec,
    getBottleSpec: getBottleSpec,
    render2DDielineWorkspace: render2DDielineWorkspace,
    Apparel3DViewer: Apparel3DViewer
  };
})(typeof window !== "undefined" ? window : global);
