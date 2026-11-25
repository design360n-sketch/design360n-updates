/**
 * ============================================================================
 * Design360n Workstation v2.1 — Self-Contained Live 3D Mockup & Design-to-3D Engine
 * Zero external dependencies — works 100% offline inside Adobe Illustrator CEP.
 * Features:
 *   - Full Dieline Auto-UV Wrap (maps Illustrator flat artboard onto Front, Back,
 *     Left, Right, and Top 3D faces automatically!) + Front-Only mode
 *   - Export 3D Model (.OBJ), Client 3D Viewer (.HTML), HD PNG / 4-Angle Pack,
 *     and 3D Animated Video (.WebM)
 * ============================================================================
 */
(function initMockup3DEngine(global) {
  "use strict";

  var MATERIALS = {
    white: { name: "Glossy White", base: [244, 246, 250], inner: [228, 232, 238], spec: 0.32, stroke: "rgba(148,163,184,0.35)" },
    kraft: { name: "Kraft Cardboard", base: [198, 156, 109], inner: [173, 132, 87], spec: 0.08, stroke: "rgba(92,64,34,0.38)" },
    black: { name: "Matte Black", base: [34, 38, 46], inner: [24, 27, 34], spec: 0.18, stroke: "rgba(255,255,255,0.14)" },
    corrugated: { name: "E-Flute Corrugated", base: [214, 178, 132], inner: [185, 146, 100], spec: 0.06, stroke: "rgba(104,74,40,0.4)" },
    custom: { name: "Custom Color", base: [59, 205, 202], inner: [42, 165, 162], spec: 0.24, stroke: "rgba(255,255,255,0.22)" }
  };

  var ANGLE_PRESETS = {
    hero: { yaw: -0.62, pitch: 0.34, zoom: 1.0 },
    isometric: { yaw: -0.785, pitch: 0.55, zoom: 0.96 },
    front: { yaw: 0.0, pitch: 0.04, zoom: 1.05 },
    back: { yaw: Math.PI, pitch: 0.06, zoom: 1.05 },
    left: { yaw: Math.PI / 2, pitch: 0.08, zoom: 1.05 },
    right: { yaw: -Math.PI / 2, pitch: 0.08, zoom: 1.05 },
    top: { yaw: -0.35, pitch: 1.25, zoom: 0.95 },
    flat: { yaw: 0.0, pitch: 0.95, zoom: 0.82 }
  };

  function hexToRgb(hex) {
    hex = (hex || "#3bcdca").replace("#", "");
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    var num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  function vSub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function vCross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function vDot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function vNorm(a) {
    var l = Math.hypot(a[0], a[1], a[2]) || 1;
    return [a[0] / l, a[1] / l, a[2] / l];
  }
  function rotX(p, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c];
  }
  function rotY(p, a) {
    var c = Math.cos(a), s = Math.sin(a);
    return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c];
  }
  function hingeRotate(p, o, axis, angle) {
    var rel = [p[0] - o[0], p[1] - o[1], p[2] - o[2]];
    var r = axis === "x" ? rotX(rel, angle) : rotY(rel, angle);
    return [r[0] + o[0], r[1] + o[1], r[2] + o[2]];
  }

  function buildPackagingMesh(params, foldAmount, realScaleMm) {
    var maxDim = Math.max(params.L, params.W, params.H, 1);
    var scale = realScaleMm ? 0.01 : (1.9 / maxDim);
    var L = params.L * scale;
    var W = params.W * scale;
    var H = params.H * scale;
    var f = Math.max(0, Math.min(1, foldAmount));
    var type = params.type || "reverse_tuck";
    var faces = [];

    // Proportional horizontal UV slices for full-dieline wrap: [Left(W) | Front(L) | Right(W) | Back(L)]
    var perim = Math.max(0.001, 2 * L + 2 * W);
    var u0 = 0.04;
    var uSpan = 0.92;
    var uLeftEnd = u0 + (W / perim) * uSpan;
    var uFrontEnd = uLeftEnd + (L / perim) * uSpan;
    var uRightEnd = uFrontEnd + (W / perim) * uSpan;
    var uBackEnd = uRightEnd + (L / perim) * uSpan;

    function addQuad(v0, v1, v2, v3, tag, uvRect, wrapUV) {
      faces.push({
        verts: [v0, v1, v2, v3],
        tag: tag || "panel",
        uv: uvRect || [0, 0, 1, 1],
        wrapUV: wrapUV || uvRect || [0, 0, 1, 1]
      });
    }

    if (type === "bottle_label") {
      var segs = 28;
      var rad = Math.max(realScaleMm ? 0.15 : 0.28, (L / (2 * Math.PI)));
      var bottleH = H * 1.45, neckR = rad * 0.42;
      var yBot = -bottleH * 0.45, yLabBot = -H * 0.5, yLabTop = H * 0.5, yShoulder = bottleH * 0.35, yNeck = bottleH * 0.52;
      var curl = Math.max(0.02, f);
      for (var i = 0; i < segs; i++) {
        var u0b = i / segs, u1b = (i + 1) / segs;
        var a0 = (u0b - 0.5) * Math.PI * 2 * curl, a1 = (u1b - 0.5) * Math.PI * 2 * curl;
        var flatX0 = (u0b - 0.5) * L, flatX1 = (u1b - 0.5) * L;
        var cx0 = flatX0 * (1 - f) + Math.sin(a0) * rad * f, cz0 = Math.cos(a0) * rad * f;
        var cx1 = flatX1 * (1 - f) + Math.sin(a1) * rad * f, cz1 = Math.cos(a1) * rad * f;
        addQuad([cx0 * 1.012, yLabBot, cz0 * 1.012], [cx1 * 1.012, yLabBot, cz1 * 1.012], [cx1 * 1.012, yLabTop, cz1 * 1.012], [cx0 * 1.012, yLabTop, cz0 * 1.012], "front", [u0b, 0, u1b, 1], [u0b, 0.1, u1b, 0.9]);
        if (f > 0.35) {
          var sAlpha = (f - 0.35) / 0.65;
          var c0 = Math.sin(a0), s0 = Math.cos(a0), c1 = Math.sin(a1), s1 = Math.cos(a1);
          addQuad([c0 * rad * sAlpha, yBot, s0 * rad * sAlpha], [c1 * rad * sAlpha, yBot, s1 * rad * sAlpha], [c1 * rad * sAlpha, yLabBot, s1 * rad * sAlpha], [c0 * rad * sAlpha, yLabBot, s0 * rad * sAlpha], "glass");
          addQuad([c0 * rad * sAlpha, yLabTop, s0 * rad * sAlpha], [c1 * rad * sAlpha, yLabTop, s1 * rad * sAlpha], [c1 * neckR * sAlpha, yShoulder, s1 * neckR * sAlpha], [c0 * neckR * sAlpha, yShoulder, s0 * neckR * sAlpha], "glass");
          addQuad([c0 * neckR * 1.08 * sAlpha, yShoulder, s0 * neckR * 1.08 * sAlpha], [c1 * neckR * 1.08 * sAlpha, yShoulder, s1 * neckR * 1.08 * sAlpha], [c1 * neckR * 1.08 * sAlpha, yNeck, s1 * neckR * 1.08 * sAlpha], [c0 * neckR * 1.08 * sAlpha, yNeck, s0 * neckR * 1.08 * sAlpha], "cap");
        }
      }
      return faces;
    }

    if (type === "pillow") {
      var seg = 14, hw = L / 2, hh = H / 2, hd = (W / 2) * (0.2 + 0.8 * f);
      for (var p = 0; p < seg; p++) {
        var pu0 = p / seg, pu1 = (p + 1) / seg;
        var x0 = -hw + pu0 * L, x1 = -hw + pu1 * L;
        var z0 = Math.sin(pu0 * Math.PI) * hd, z1 = Math.sin(pu1 * Math.PI) * hd;
        addQuad([x0, -hh, z0], [x1, -hh, z1], [x1, hh, z1], [x0, hh, z0], "front", [pu0, 0, pu1, 1], [0.08 + pu0 * 0.42, 0.15, 0.08 + pu1 * 0.42, 0.85]);
        addQuad([x1, -hh, -z1], [x0, -hh, -z0], [x0, hh, -z0], [x1, hh, -z1], "back", [pu0, 0, pu1, 1], [0.5 + pu0 * 0.42, 0.15, 0.5 + pu1 * 0.42, 0.85]);
      }
      return faces;
    }

    if (type === "standup_pouch" || type === "flat_pouch") {
      var isFlat = (type === "flat_pouch");
      var pw = L / 2, ph = H / 2, pd = isFlat ? (W * 0.14) : ((W / 2) * (0.15 + 0.85 * f)), topD = isFlat ? (W * 0.04) : (pd * 0.12);
      addQuad([-pw, -ph, pd], [pw, -ph, pd], [pw, ph, topD], [-pw, ph, topD], "front", [0, 0, 1, 1], [0.05, 0.04, 0.95, 0.48]);
      addQuad([pw, -ph, -pd], [-pw, -ph, -pd], [-pw, ph, -topD], [pw, ph, -topD], "back", [0, 0, 1, 1], [0.05, 0.52, 0.95, 0.96]);
      addQuad([pw, -ph, pd], [pw, -ph, -pd], [pw, ph, -topD], [pw, ph, topD], "side");
      addQuad([-pw, -ph, -pd], [-pw, -ph, pd], [-pw, ph, topD], [-pw, ph, -topD], "side");
      addQuad([-pw, -ph, -pd], [pw, -ph, -pd], [pw, -ph, pd], [-pw, -ph, pd], "bottom");
      return faces;
    }

    if (type === "hexagon_box") {
      var hr = Math.max(L, W) * 0.52, hhh = H / 2, sideW = hr;
      for (var hi = 0; hi < 6; hi++) {
        var ha0 = (hi / 6) * Math.PI * 2 + Math.PI / 6;
        var ha1 = ((hi + 1) / 6) * Math.PI * 2 + Math.PI / 6;
        var fx0 = (hi - 3) * sideW, fx1 = (hi - 2) * sideW;
        var hx0 = fx0 * (1 - f) + Math.cos(ha0) * hr * f, hz0 = Math.sin(ha0) * hr * f;
        var hx1 = fx1 * (1 - f) + Math.cos(ha1) * hr * f, hz1 = Math.sin(ha1) * hr * f;
        addQuad([hx0, -hhh, hz0], [hx1, -hhh, hz1], [hx1, hhh, hz1], [hx0, hhh, hz0], hi === 0 ? "front" : "side", [0, 0, 1, 1], [0.06 + (hi / 6) * 0.86, 0.22, 0.06 + ((hi + 1) / 6) * 0.86, 0.78]);
        if (f > 0.65) {
          addQuad([0, hhh, 0], [hx0, hhh, hz0], [hx1, hhh, hz1], [0, hhh, 0], "top");
          addQuad([0, -hhh, 0], [hx1, -hhh, hz1], [hx0, -hhh, hz0], [0, -hhh, 0], "bottom");
        }
      }
      return faces;
    }

    if (type === "pyramid_box") {
      var pl = L / 2, pw2 = W / 2, pyBot = -H * 0.42 * f, slant = Math.sqrt(H * H + pl * pl);
      var b0 = [-pl, pyBot, pw2], b1 = [pl, pyBot, pw2], b2 = [pl, pyBot, -pw2], b3 = [-pl, pyBot, -pw2];
      var tipF = [0, pyBot + H * f, pw2 + slant * (1 - f) - pw2 * f];
      var tipR = [pl + slant * (1 - f) - pl * f, pyBot + H * f, 0];
      var tipB = [0, pyBot + H * f, -pw2 - slant * (1 - f) + pw2 * f];
      var tipL = [-pl - slant * (1 - f) + pl * f, pyBot + H * f, 0];
      addQuad(b0, b1, tipF, tipF, "front", [0, 0, 1, 1], [0.25, 0.1, 0.75, 0.55]);
      addQuad(b1, b2, tipR, tipR, "side",  [0, 0, 1, 1], [0.55, 0.25, 0.95, 0.75]);
      addQuad(b2, b3, tipB, tipB, "back",  [0, 0, 1, 1], [0.25, 0.45, 0.75, 0.90]);
      addQuad(b3, b0, tipL, tipL, "side",  [0, 0, 1, 1], [0.05, 0.25, 0.45, 0.75]);
      addQuad(b3, b2, b1, b0, "bottom");
      return faces;
    }

    if (type === "fries_scoop" || type === "noodle_box") {
      var flB = L * 0.38, flT = L * 0.54, fwB = W * 0.36, fwT = W * 0.54, fh = H / 2;
      var frontTopY = (type === "fries_scoop") ? (fh * 0.65) : fh;
      var backTopY  = (type === "fries_scoop") ? (fh * 1.15) : fh;
      addQuad([-flB, -fh, fwB], [flB, -fh, fwB], [flT, frontTopY, fwT], [-flT, frontTopY, fwT], "front", [0, 0, 1, 1], [uLeftEnd, 0.22, uFrontEnd, 0.78]);
      addQuad([flB, -fh, fwB], [flB, -fh, -fwB], [flT, backTopY, -fwT], [flT, frontTopY, fwT], "side", [0, 0, 1, 1], [uFrontEnd, 0.22, uRightEnd, 0.78]);
      addQuad([flB, -fh, -fwB], [-flB, -fh, -fwB], [-flT, backTopY, -fwT], [flT, backTopY, -fwT], "back", [0, 0, 1, 1], [uRightEnd, 0.22, uBackEnd, 0.78]);
      addQuad([-flB, -fh, -fwB], [-flB, -fh, fwB], [-flT, frontTopY, fwT], [-flT, backTopY, -fwT], "side", [0, 0, 1, 1], [u0, 0.22, uLeftEnd, 0.78]);
      addQuad([-flB, -fh, -fwB], [flB, -fh, -fwB], [flB, -fh, fwB], [-flB, -fh, fwB], "bottom");
      if (type === "noodle_box") {
        // Folded top flaps
        addQuad([-flT, fh, fwT], [flT, fh, fwT], [flT * 0.85, fh + 0.04, 0], [-flT * 0.85, fh + 0.04, 0], "top");
        addQuad([flT, fh, -fwT], [-flT, fh, -fwT], [-flT * 0.85, fh + 0.04, 0], [flT * 0.85, fh + 0.04, 0], "top");
      }
      return faces;
    }

    if (type === "burger_clamshell") {
      var cbL = L * 0.42, cmL = L * 0.54, cbW = W * 0.42, cmW = W * 0.54, cH = H * 0.5;
      // Lower tapered tray
      addQuad([-cbL, -cH, cbW], [cbL, -cH, cbW], [cmL, 0, cmW], [-cmL, 0, cmW], "front", [0, 0, 1, 1], [0.25, 0.52, 0.75, 0.78]);
      addQuad([cbL, -cH, cbW], [cbL, -cH, -cbW], [cmL, 0, -cmW], [cmL, 0, cmW], "side");
      addQuad([cbL, -cH, -cbW], [-cbL, -cH, -cbW], [-cmL, 0, -cmW], [cmL, 0, -cmW], "back");
      addQuad([-cbL, -cH, -cbW], [-cbL, -cH, cbW], [-cmL, 0, cmW], [-cmL, 0, -cmW], "side");
      addQuad([-cbL, -cH, -cbW], [cbL, -cH, -cbW], [cbL, -cH, cbW], [-cbL, -cH, cbW], "bottom");
      // Upper tapered clamshell dome lid
      addQuad([-cmL, 0, cmW], [cmL, 0, cmW], [cbL, cH, cbW], [-cbL, cH, cbW], "front", [0, 0, 1, 1], [0.25, 0.25, 0.75, 0.50]);
      addQuad([cmL, 0, cmW], [cmL, 0, -cmW], [cbL, cH, -cbW], [cbL, cH, cbW], "side");
      addQuad([cmL, 0, -cmW], [-cmL, 0, -cmW], [-cbL, cH, -cbW], [cbL, cH, -cbW], "back");
      addQuad([-cmL, 0, -cmW], [-cmL, 0, cmW], [-cbL, cH, cbW], [-cbL, cH, -cbW], "side");
      addQuad([-cbL, cH, cbW], [cbL, cH, cbW], [cbL, cH, -cbW], [-cbL, cH, -cbW], "top", [0, 0, 1, 1], [0.25, 0.05, 0.75, 0.25]);
      return faces;
    }

    if (type === "pocket_folder") {
      var fl2 = L / 2, fh2 = H / 2, openAng = 0.28 + (1 - f) * 0.9;
      var spine = [-fl2 * 0.2, 0, 0];
      var backF = [[spine[0], -fh2, 0], [spine[0] + L, -fh2, 0], [spine[0] + L, fh2, 0], [spine[0], fh2, 0]];
      var frontF = [[spine[0], -fh2, 0], [spine[0] + L, -fh2, 0], [spine[0] + L, fh2, 0], [spine[0], fh2, 0]]
        .map(function (pt) { return hingeRotate(pt, spine, "y", -openAng); });
      addQuad(frontF[0], frontF[1], frontF[2], frontF[3], "front", [0, 0, 1, 1], [0.04, 0.06, 0.48, 0.94]);
      addQuad(backF[1], backF[0], backF[3], backF[2], "back", [0, 0, 1, 1], [0.52, 0.06, 0.96, 0.94]);
      // Interior pocket flap on right panel
      addQuad([spine[0] + 0.02, -fh2, 0.02], [spine[0] + L, -fh2, 0.02], [spine[0] + L, -fh2 + H * 0.34, 0.02], [spine[0] + 0.02, -fh2 + H * 0.28, 0.02], "side");
      return faces;
    }

    if (type === "hang_tag") {
      var tl = L / 2, th = H / 2, td = 0.025, bevel = L * 0.22;
      addQuad([-tl, -th, td], [tl, -th, td], [tl, th * 0.72, td], [-tl, th * 0.72, td], "front", [0, 0, 1, 1], [0.08, 0.22, 0.92, 0.95]);
      addQuad([-tl, th * 0.72, td], [tl, th * 0.72, td], [tl - bevel, th, td], [-tl + bevel, th, td], "front", [0, 0, 1, 1], [0.18, 0.05, 0.82, 0.22]);
      addQuad([tl, -th, -td], [-tl, -th, -td], [-tl, th * 0.72, -td], [tl, th * 0.72, -td], "back", [0, 0, 1, 1], [0.08, 0.22, 0.92, 0.95]);
      addQuad([tl, th * 0.72, -td], [-tl, th * 0.72, -td], [-tl + bevel, th, -td], [tl - bevel, th, -td], "back");
      // String loop above eyelet
      addQuad([-0.015, th * 0.9, 0], [0.015, th * 0.9, 0], [0.015, th * 1.42, 0], [-0.015, th * 1.42, 0], "handle");
      return faces;
    }

    var hl = L / 2, hh2 = H / 2, hw2 = W / 2;
    var ang90 = (Math.PI / 2) * f;
    var lidAng = (Math.PI / 2) * Math.max(0, Math.min(1, (f - 0.15) / 0.85));

    var front = [[-hl, -hh2, hw2 * f], [hl, -hh2, hw2 * f], [hl, hh2, hw2 * f], [-hl, hh2, hw2 * f]];
    addQuad(front[0], front[1], front[2], front[3], "front", [0, 0, 1, 1], [uLeftEnd, 0.24, uFrontEnd, 0.76]);

    var rPivot = [hl, 0, hw2 * f];
    var right = [[hl, -hh2, hw2 * f], [hl + W, -hh2, hw2 * f], [hl + W, hh2, hw2 * f], [hl, hh2, hw2 * f]]
      .map(function (pt) { return hingeRotate(pt, rPivot, "y", ang90); });
    addQuad(right[0], right[1], right[2], right[3], "side", [0, 0, 1, 1], [uFrontEnd, 0.24, uRightEnd, 0.76]);

    var bPivot = right[1];
    var back = [[hl + W, -hh2, hw2 * f], [hl + W + L, -hh2, hw2 * f], [hl + W + L, hh2, hw2 * f], [hl + W, hh2, hw2 * f]]
      .map(function (pt) { return hingeRotate(hingeRotate(pt, rPivot, "y", ang90), bPivot, "y", ang90); });
    addQuad(back[0], back[1], back[2], back[3], "back", [0, 0, 1, 1], [uRightEnd, 0.24, uBackEnd, 0.76]);

    var lPivot = [-hl, 0, hw2 * f];
    var left = [[-hl - W, -hh2, hw2 * f], [-hl, -hh2, hw2 * f], [-hl, hh2, hw2 * f], [-hl - W, hh2, hw2 * f]]
      .map(function (pt) { return hingeRotate(pt, lPivot, "y", -ang90); });
    addQuad(left[0], left[1], left[2], left[3], "side", [0, 0, 1, 1], [u0, 0.24, uLeftEnd, 0.76]);

    if (type === "gable") {
      var roofH = W * 0.45, handleH = W * 0.25;
      addQuad(front[3], front[2], [hl, hh2 + roofH, 0], [-hl, hh2 + roofH, 0], "top", [0, 0, 1, 1], [uLeftEnd, 0.08, uFrontEnd, 0.24]);
      addQuad(back[3], back[2], [-hl, hh2 + roofH, 0], [hl, hh2 + roofH, 0], "top", [0, 0, 1, 1], [uRightEnd, 0.08, uBackEnd, 0.24]);
      addQuad([-hl, hh2 + roofH, 0], [hl, hh2 + roofH, 0], [hl, hh2 + roofH + handleH, 0], [-hl, hh2 + roofH + handleH, 0], "handle");
    } else if (type === "paper_bag") {
      // Dual 3D arched shopping bag handles on front & back
      var hSpan = L * 0.28, hTop = hh2 + H * 0.24, hThick = 0.025;
      addQuad([-hSpan, hh2, hw2 * f], [-hSpan + hThick, hh2, hw2 * f], [-hSpan * 0.6, hTop, hw2 * f], [-hSpan * 0.6 - hThick, hTop, hw2 * f], "handle");
      addQuad([hSpan - hThick, hh2, hw2 * f], [hSpan, hh2, hw2 * f], [hSpan * 0.6 + hThick, hTop, hw2 * f], [hSpan * 0.6, hTop, hw2 * f], "handle");
      addQuad([-hSpan * 0.6, hTop, hw2 * f], [hSpan * 0.6, hTop, hw2 * f], [hSpan * 0.6, hTop + hThick, hw2 * f], [-hSpan * 0.6, hTop + hThick, hw2 * f], "handle");
      addQuad([-hSpan * 0.6, hTop, -hw2 * f], [hSpan * 0.6, hTop, -hw2 * f], [hSpan * 0.6, hTop + hThick, -hw2 * f], [-hSpan * 0.6, hTop + hThick, -hw2 * f], "handle");
    } else if (type === "drawer_box") {
      // Closed top sleeve + pulled-out inner sliding tray!
      addQuad([-hl, hh2, hw2], [hl, hh2, hw2], [hl, hh2, -hw2], [-hl, hh2, -hw2], "top", [0, 0, 1, 1], [uLeftEnd, 0.06, uFrontEnd, 0.24]);
      var pull = L * 0.36;
      var il = hl * 0.94, ih = hh2 * 0.90, iw = hw2 * 0.94;
      addQuad([hl, -ih, iw], [hl + pull, -ih, iw], [hl + pull, ih, iw], [hl, ih, iw], "side");
      addQuad([hl + pull, -ih, iw], [hl + pull, -ih, -iw], [hl + pull, ih, -iw], [hl + pull, ih, iw], "handle");
      addQuad([hl + pull, -ih, -iw], [hl, -ih, -iw], [hl, ih, -iw], [hl + pull, ih, -iw], "side");
      addQuad([hl, -ih, -iw], [hl + pull, -ih, -iw], [hl + pull, -ih, iw], [hl, -ih, iw], "bottom");
    } else if (type === "tray_lid") {
      // Slightly wider telescoping rigid lid sitting on top
      var ol = hl * 1.04, ow = hw2 * 1.04, lidDrop = H * 0.32;
      addQuad([-ol, hh2 - lidDrop, ow], [ol, hh2 - lidDrop, ow], [ol, hh2 + 0.02, ow], [-ol, hh2 + 0.02, ow], "top", [0, 0, 1, 1], [0.22, 0.22, 0.78, 0.38]);
      addQuad([ol, hh2 - lidDrop, ow], [ol, hh2 - lidDrop, -ow], [ol, hh2 + 0.02, -ow], [ol, hh2 + 0.02, ow], "side");
      addQuad([ol, hh2 - lidDrop, -ow], [-ol, hh2 - lidDrop, -ow], [-ol, hh2 + 0.02, -ow], [ol, hh2 + 0.02, -ow], "top");
      addQuad([-ol, hh2 - lidDrop, -ow], [-ol, hh2 - lidDrop, ow], [-ol, hh2 + 0.02, ow], [-ol, hh2 + 0.02, -ow], "side");
      addQuad([-ol, hh2 + 0.02, ow], [ol, hh2 + 0.02, ow], [ol, hh2 + 0.02, -ow], [-ol, hh2 + 0.02, -ow], "top", [0, 0, 1, 1], [0.22, 0.05, 0.78, 0.22]);
    } else if (type === "mailer" || type === "pizza_box" || type === "book_mailer") {
      var mPivot = [0, hh2, -hw2 * f];
      var openTilt = (Math.PI / 2) * (1 - 0.16 * f) * (f > 0.2 ? 1 : f / 0.2);
      var mLid = [[-hl, hh2, -hw2 * f], [hl, hh2, -hw2 * f], [hl, hh2 + W, -hw2 * f], [-hl, hh2 + W, -hw2 * f]]
        .map(function (pt) { return hingeRotate(pt, mPivot, "x", openTilt); });
      addQuad(mLid[0], mLid[1], mLid[2], mLid[3], "top", [0, 0, 1, 1], [uRightEnd, 0.06, uBackEnd, 0.24]);
      var lipH = Math.min(H * 0.55, 0.14);
      addQuad(mLid[3], mLid[2], [mLid[2][0], mLid[2][1] - lipH, mLid[2][2]], [mLid[3][0], mLid[3][1] - lipH, mLid[3][2]], "handle");
    } else if (type === "rsc_shipper") {
      var f1P = [0, hh2, hw2 * f], f2P = [0, hh2, -hw2 * f];
      var flapA = [[-hl, hh2, hw2 * f], [hl, hh2, hw2 * f], [hl, hh2 + W * 0.49, hw2 * f], [-hl, hh2 + W * 0.49, hw2 * f]]
        .map(function (pt) { return hingeRotate(pt, f1P, "x", -lidAng * 0.94); });
      var flapB = [[-hl, hh2, -hw2 * f], [hl, hh2, -hw2 * f], [hl, hh2 + W * 0.49, -hw2 * f], [-hl, hh2 + W * 0.49, -hw2 * f]]
        .map(function (pt) { return hingeRotate(pt, f2P, "x", lidAng * 0.94); });
      addQuad(flapA[0], flapA[1], flapA[2], flapA[3], "top", [0, 0, 1, 1], [uLeftEnd, 0.08, uFrontEnd, 0.22]);
      addQuad(flapB[1], flapB[0], flapB[3], flapB[2], "top", [0, 0, 1, 1], [uRightEnd, 0.08, uBackEnd, 0.22]);
    } else if (type !== "sleeve" && type !== "display_tray") {
      var tPivot = [0, hh2, hw2 * f];
      var top = [[-hl, hh2, hw2 * f], [hl, hh2, hw2 * f], [hl, hh2 + W, hw2 * f], [-hl, hh2 + W, hw2 * f]]
        .map(function (pt) { return hingeRotate(pt, tPivot, "x", -lidAng); });
      addQuad(top[0], top[1], top[2], top[3], "top", [0, 0, 1, 1], [uRightEnd, 0.06, uBackEnd, 0.24]);
      if (type === "cake_box") {
        addQuad([-hl * 0.35, hh2 + 0.01, 0], [hl * 0.35, hh2 + 0.01, 0], [hl * 0.25, hh2 + H * 0.28, 0], [-hl * 0.25, hh2 + H * 0.28, 0], "handle");
      }
      if (type === "custom_box" && params.optWindow) {
        var ww = hl * 0.62, wh = hh2 * 0.56;
        addQuad([-ww, -wh, hw2 * f + 0.008], [ww, -wh, hw2 * f + 0.008], [ww, wh, hw2 * f + 0.008], [-ww, wh, hw2 * f + 0.008], "glass");
      }
      if (type === "custom_box" && params.optHangTab) {
        addQuad([-hl * 0.45, hh2, -hw2 * f], [hl * 0.45, hh2, -hw2 * f], [hl * 0.35, hh2 + H * 0.24, -hw2 * f], [-hl * 0.35, hh2 + H * 0.24, -hw2 * f], "handle");
      }
    }

    if (type !== "sleeve") {
      var botPivot = [0, -hh2, hw2 * f];
      var bot = [[-hl, -hh2 - W, hw2 * f], [hl, -hh2 - W, hw2 * f], [hl, -hh2, hw2 * f], [-hl, -hh2, hw2 * f]]
        .map(function (pt) { return hingeRotate(pt, botPivot, "x", lidAng); });
      addQuad(bot[0], bot[1], bot[2], bot[3], "bottom", [0, 0, 1, 1], [uLeftEnd, 0.76, uFrontEnd, 0.94]);
    }

    if (type === "display_tray") {
      var hH = H * 0.65;
      addQuad(back[3], back[2], [back[2][0], hh2 + hH, back[2][2]], [back[3][0], hh2 + hH, back[3][2]], "front", [0, 0, 1, 1], [uLeftEnd, 0.05, uFrontEnd, 0.24]);
    }
    if (type === "dispenser_box") {
      // Gravity-feed lower dispensing lip on front bottom
      addQuad([-hl * 0.78, -hh2, hw2 * f], [hl * 0.78, -hh2, hw2 * f], [hl * 0.78, -hh2 + H * 0.14, hw2 * f + W * 0.26], [-hl * 0.78, -hh2 + H * 0.14, hw2 * f + W * 0.26], "handle");
    }

        return faces;
  }

  function Mockup3D(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.yaw = ANGLE_PRESETS.hero.yaw;
    this.pitch = ANGLE_PRESETS.hero.pitch;
    this.zoom = ANGLE_PRESETS.hero.zoom;
    this.fold = 1.0;
    this.materialKey = "white";
    this.customColor = "#3bcdca";
    this.bgMode = "studio_dark";
    this.autoRotate = false;
    this.showWireframe = false;
    this.textureMode = "dieline_wrap"; // "dieline_wrap" (all sides) or "front_only"
    this.artworkImg = null;
    this.artworkDataURL = null;
    this.params = { type: "reverse_tuck", L: 80, W: 50, H: 130 };
    this.isRecording = false;
    this._dragging = false;
    this._lastX = 0;
    this._lastY = 0;

    this._bindInput();
    this.startLoop();
  }

  Mockup3D.prototype._bindInput = function () {
    var self = this;
    this.canvas.addEventListener("mousedown", function (e) {
      self._dragging = true; self._lastX = e.clientX; self._lastY = e.clientY; self.autoRotate = false;
    });
    window.addEventListener("mouseup", function () { self._dragging = false; });
    window.addEventListener("mousemove", function (e) {
      if (!self._dragging) return;
      var dx = e.clientX - self._lastX, dy = e.clientY - self._lastY;
      self._lastX = e.clientX; self._lastY = e.clientY;
      self.yaw += dx * 0.01;
      self.pitch = Math.max(-1.35, Math.min(1.35, self.pitch + dy * 0.01));
    });
    this.canvas.addEventListener("wheel", function (e) {
      e.preventDefault();
      self.zoom = Math.max(0.55, Math.min(1.85, self.zoom - e.deltaY * 0.001));
    }, { passive: false });
  };

  Mockup3D.prototype.setParams = function (params) { this.params = params; };

  Mockup3D.prototype.playFold2Dto3D = function (onStep, onDone) {
    var self = this;
    self.autoRotate = false;
    var startTime = performance.now();
    var dur = 2600;
    function step(now) {
      var t = Math.min(1, (now - startTime) / dur);
      var ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      self.fold = ease;
      // Smoothly transition from top-down flat 2D view -> 3/4 hero 3D angle!
      self.pitch = 1.05 * (1 - ease) + ANGLE_PRESETS.hero.pitch * ease;
      self.yaw = 0.05 * (1 - ease) + ANGLE_PRESETS.hero.yaw * ease;
      self.zoom = 0.85 * (1 - ease) + ANGLE_PRESETS.hero.zoom * ease;
      if (onStep) onStep(Math.round(ease * 100));
      if (t < 1) requestAnimationFrame(step);
      else if (onDone) onDone();
    }
    requestAnimationFrame(step);
  };

  Mockup3D.prototype.setAnglePreset = function (presetName) {
    var p = ANGLE_PRESETS[presetName];
    if (!p) return;
    this.yaw = p.yaw; this.pitch = p.pitch; this.zoom = p.zoom;
    if (presetName === "flat") this.fold = 0.05;
  };

  Mockup3D.prototype.setArtworkDataURL = function (dataURL, onDone) {
    var self = this;
    var img = new Image();
    img.onload = function () {
      self.artworkImg = img;
      self.artworkDataURL = dataURL;
      if (onDone) onDone(true);
    };
    img.onerror = function () { if (onDone) onDone(false); };
    img.src = dataURL;
  };

  Mockup3D.prototype.clearArtwork = function () {
    this.artworkImg = null;
    this.artworkDataURL = null;
  };

  Mockup3D.prototype.startLoop = function () {
    var self = this;
    var lastDraw = 0;
    function tick(now) {
      requestAnimationFrame(tick);
      if (self.canvas && self.canvas.offsetParent === null) return; // Pause completely when tab hidden!
      var active = self._dragging || self.autoRotate || self.isRecording;
      if (!active && (now - lastDraw) < 110) return; // Throttle idle to ~9fps (Zero Illustrator lag!)
      lastDraw = now;
      if (self.autoRotate && !self.isRecording) self.yaw += 0.008;
      self.render();
    }
    requestAnimationFrame(tick);
  };

  Mockup3D.prototype._drawTexturedTri = function (ctx, img, p0, p1, p2, u0, v0, u1, v1, u2, v2) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]);
    ctx.closePath(); ctx.clip();

    var iw = img.width, ih = img.height;
    var sx0 = u0 * iw, sy0 = v0 * ih, sx1 = u1 * iw, sy1 = v1 * ih, sx2 = u2 * iw, sy2 = v2 * ih;
    var denom = sx0 * (sy2 - sy1) - sx1 * sy2 + sx2 * sy1 + (sx1 - sx2) * sy0;
    if (Math.abs(denom) > 0.001) {
      var m11 = -(sy0 * (p2[0] - p1[0]) - sy1 * p2[0] + sy2 * p1[0] + (sy1 - sy2) * p0[0]) / denom;
      var m12 = (sy1 * p2[1] + sy0 * (p1[1] - p2[1]) - sy2 * p1[1] + (sy2 - sy1) * p0[1]) / denom;
      var m21 = (sx0 * (p2[0] - p1[0]) - sx1 * p2[0] + sx2 * p1[0] + (sx1 - sx2) * p0[0]) / denom;
      var m22 = -(sx1 * p2[1] + sx0 * (p1[1] - p2[1]) - sx2 * p1[1] + (sx2 - sx1) * p0[1]) / denom;
      var dx = (sx0 * (sy2 * p1[0] - sy1 * p2[0]) + sy0 * (sx1 * p2[0] - sx2 * p1[0]) + (sx2 * sy1 - sx1 * sy2) * p0[0]) / denom;
      var dy = (sx0 * (sy2 * p1[1] - sy1 * p2[1]) + sy0 * (sx1 * p2[1] - sx2 * p1[1]) + (sx2 * sy1 - sx1 * sy2) * p0[1]) / denom;
      ctx.transform(m11, m12, m21, m22, dx, dy);
      ctx.drawImage(img, 0, 0);
    }
    ctx.restore();
  };

  Mockup3D.prototype.render = function (targetCanvas) {
    var canvas = targetCanvas || this.canvas;
    if (!targetCanvas && canvas.clientWidth > 20 && canvas.clientHeight > 20) {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
    }
    var ctx = canvas.getContext("2d"); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (this.bgMode === "studio_dark") {
      var g = ctx.createRadialGradient(w * 0.5, h * 0.42, w * 0.05, w * 0.5, h * 0.5, w * 0.72);
      g.addColorStop(0, "#172033"); g.addColorStop(1, "#060911");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    } else if (this.bgMode === "studio_light") {
      var gl = ctx.createRadialGradient(w * 0.5, h * 0.4, w * 0.05, w * 0.5, h * 0.5, w * 0.72);
      gl.addColorStop(0, "#ffffff"); gl.addColorStop(1, "#dbe3ee");
      ctx.fillStyle = gl; ctx.fillRect(0, 0, w, h);
    } else if (this.bgMode === "studio_teal") {
      var gt = ctx.createLinearGradient(0, 0, w, h);
      gt.addColorStop(0, "#091b24"); gt.addColorStop(1, "#04080f");
      ctx.fillStyle = gt; ctx.fillRect(0, 0, w, h);
    }

    if (this.bgMode !== "transparent") {
      ctx.save();
      var sg = ctx.createRadialGradient(w * 0.5, h * 0.78, 4, w * 0.5, h * 0.78, Math.min(w, h) * 0.28 * this.zoom);
      sg.addColorStop(0, "rgba(0,0,0,0.42)"); sg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.78, Math.min(w, h) * 0.28 * this.zoom, Math.min(w, h) * 0.075 * this.zoom, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.restore();
    }

    var mat = MATERIALS[this.materialKey] || MATERIALS.white;
    var baseRgb = this.materialKey === "custom" ? hexToRgb(this.customColor) : mat.base;
    var faces = buildPackagingMesh(this.params, this.fold, false);
    var fov = Math.min(w, h) * 1.15 * this.zoom;
    var camDist = 4.6;
    var keyLight = vNorm([0.55, 0.75, 0.85]);
    var rimLight = vNorm([-0.7, 0.35, -0.5]);

    var projected = [];
    for (var i = 0; i < faces.length; i++) {
      var face = faces[i];
      var tv = face.verts.map(function (v) { return rotX(rotY(v, this.yaw), this.pitch); }, this);
      var normal = vNorm(vCross(vSub(tv[1], tv[0]), vSub(tv[2], tv[0])));
      var cz = (tv[0][2] + tv[1][2] + tv[2][2] + tv[3][2]) / 4;
      var pts2d = tv.map(function (v) {
        var persp = fov / Math.max(0.5, camDist - v[2]);
        return [w / 2 + v[0] * persp, h / 2 - v[1] * persp];
      });
      projected.push({ face: face, pts2d: pts2d, normal: normal, cz: cz });
    }

    projected.sort(function (a, b) { return a.cz - b.cz; });

    for (var p = 0; p < projected.length; p++) {
      var item = projected[p];
      var n = item.normal;
      var facing = n[2] >= 0 ? 1 : -1;
      var effN = [n[0] * facing, n[1] * facing, n[2] * facing];
      var shade = 0.42 + Math.max(0, vDot(effN, keyLight)) * 0.56 + Math.max(0, vDot(effN, rimLight)) * 0.25;

      var col = baseRgb;
      if (item.face.tag === "glass") col = [215, 228, 240];
      else if (item.face.tag === "cap") col = [30, 35, 44];
      else if (facing < 0) col = mat.inner;

      ctx.beginPath();
      ctx.moveTo(item.pts2d[0][0], item.pts2d[0][1]);
      ctx.lineTo(item.pts2d[1][0], item.pts2d[1][1]);
      ctx.lineTo(item.pts2d[2][0], item.pts2d[2][1]);
      ctx.lineTo(item.pts2d[3][0], item.pts2d[3][1]);
      ctx.closePath();

      ctx.fillStyle = "rgb(" + Math.min(255, Math.round(col[0] * shade)) + "," + Math.min(255, Math.round(col[1] * shade)) + "," + Math.min(255, Math.round(col[2] * shade)) + ")";
      ctx.fill();

      // Design-to-3D Texture Mapping (Full Dieline Wrap across all box panels OR Front-Only)
      var canMap = this.artworkImg && facing > 0 && item.face.tag !== "glass" && item.face.tag !== "cap" && item.face.tag !== "handle";
      if (canMap) {
        var shouldDraw = (this.textureMode === "dieline_wrap") || (item.face.tag === "front");
        if (shouldDraw) {
          var uv = (this.textureMode === "dieline_wrap") ? (item.face.wrapUV || item.face.uv) : item.face.uv;
          this._drawTexturedTri(ctx, this.artworkImg, item.pts2d[0], item.pts2d[1], item.pts2d[2], uv[0], uv[3], uv[2], uv[3], uv[2], uv[1]);
          this._drawTexturedTri(ctx, this.artworkImg, item.pts2d[0], item.pts2d[2], item.pts2d[3], uv[0], uv[3], uv[2], uv[1], uv[0], uv[1]);
          ctx.fillStyle = "rgba(0,0,0," + Math.max(0, (1 - shade) * 0.36).toFixed(2) + ")";
          ctx.fill();
        }
      }

      ctx.strokeStyle = this.showWireframe ? "#3bcdca" : mat.stroke;
      ctx.lineWidth = this.showWireframe ? 1.4 : 0.85;
      ctx.stroke();
    }
  };

  Mockup3D.prototype.exportOBJ = function (title) {
    var faces = buildPackagingMesh(this.params, this.fold, true);
    var lines = [
      "# Design360n Workstation v2.1 — 3D Packaging Mesh (.OBJ)",
      "# Model: " + (title || this.params.type),
      "# Scale: 1 unit = 100mm (0.1m) — Ready for Blender / Dimension / C4D",
      "o " + (title || "Packaging_Box").replace(/[^A-Za-z0-9_]/g, "_")
    ];
    var vIdx = 1, vtIdx = 1;
    for (var i = 0; i < faces.length; i++) {
      var f = faces[i];
      lines.push("g " + f.tag + "_" + i);
      for (var k = 0; k < f.verts.length; k++) {
        var v = f.verts[k];
        lines.push("v " + v[0].toFixed(4) + " " + v[1].toFixed(4) + " " + v[2].toFixed(4));
      }
      var uv = (this.textureMode === "dieline_wrap" ? f.wrapUV : f.uv) || [0, 0, 1, 1];
      lines.push("vt " + uv[0].toFixed(4) + " " + uv[1].toFixed(4));
      lines.push("vt " + uv[2].toFixed(4) + " " + uv[1].toFixed(4));
      lines.push("vt " + uv[2].toFixed(4) + " " + uv[3].toFixed(4));
      lines.push("vt " + uv[0].toFixed(4) + " " + uv[3].toFixed(4));
      lines.push("f " + vIdx + "/" + vtIdx + " " + (vIdx + 1) + "/" + (vtIdx + 1) + " " + (vIdx + 2) + "/" + (vtIdx + 2) + " " + (vIdx + 3) + "/" + (vtIdx + 3));
      vIdx += 4; vtIdx += 4;
    }
    return lines.join("\n");
  };

  Mockup3D.prototype.exportInteractiveHTML = function (title) {
    var state = {
      params: this.params, materialKey: this.materialKey, customColor: this.customColor,
      bgMode: this.bgMode, fold: this.fold, textureMode: this.textureMode,
      artwork: (this.artworkDataURL && this.artworkDataURL.indexOf("data:image") === 0) ? this.artworkDataURL : null
    };
    var html = [
      "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'>",
      "<title>" + (title || "3D Packaging Mockup") + " — Interactive 3D Preview</title>",
      "<style>body{margin:0;background:#060911;color:#f1f5f9;font-family:Inter,Segoe UI,sans-serif;display:flex;flex-direction:column;height:100vh;overflow:hidden}",
      ".bar{display:flex;justify-content:space-between;align-items:center;padding:12px 18px;background:#0d1321;border-bottom:1px solid rgba(148,163,184,.18)}",
      ".bar h1{font-size:14px;margin:0;color:#3bcdca}.ctrl{display:flex;gap:10px;align-items:center;font-size:12px}",
      "button{background:#131b2e;color:#f1f5f9;border:1px solid rgba(148,163,184,.25);padding:6px 10px;border-radius:6px;cursor:pointer}",
      "button:hover{border-color:#3bcdca;color:#3bcdca}canvas{flex:1;width:100%;height:100%;cursor:grab}</style></head><body>",
      "<div class='bar'><h1>" + (title || "3D Packaging Mockup") + "</h1>",
      "<div class='ctrl'><span>Fold:</span><input id='f' type='range' min='0' max='100' value='" + Math.round(this.fold * 100) + "'>",
      "<button id='spin'>Toggle Auto-Spin</button><button id='png'>Save PNG</button></div></div>",
      "<canvas id='c' width='1200' height='800'></canvas>",
      "<script>",
      "var INITIAL=" + JSON.stringify(state) + ";",
      "(" + initMockup3DEngine.toString() + ")(window);",
      "var cv=document.getElementById('c');function rz(){cv.width=window.innerWidth;cv.height=window.innerHeight-52;}rz();window.onresize=rz;",
      "var m=new Mockup3D(cv);m.setParams(INITIAL.params);m.materialKey=INITIAL.materialKey;m.customColor=INITIAL.customColor;m.bgMode=INITIAL.bgMode;m.fold=INITIAL.fold;m.textureMode=INITIAL.textureMode||'dieline_wrap';m.autoRotate=true;",
      "if(INITIAL.artwork)m.setArtworkDataURL(INITIAL.artwork);",
      "document.getElementById('f').oninput=function(e){m.fold=e.target.value/100;};",
      "document.getElementById('spin').onclick=function(){m.autoRotate=!m.autoRotate;};",
      "document.getElementById('png').onclick=function(){var a=document.createElement('a');a.href=m.exportSnapshotPNG(1600,1600);a.download='3D_Mockup.png';a.click();};",
      "</script></body></html>"
    ];
    return html.join("");
  };

  Mockup3D.prototype.exportSnapshotPNG = function (width, height) {
    var offCanvas = document.createElement("canvas");
    offCanvas.width = width || 1600; offCanvas.height = height || 1600;
    this.render(offCanvas);
    return offCanvas.toDataURL("image/png");
  };

  Mockup3D.prototype.exportMultiAnglePNGs = function (size) {
    var angles = ["hero", "front", "isometric", "back"];
    var savedYaw = this.yaw, savedPitch = this.pitch, savedZoom = this.zoom;
    var results = [];
    for (var i = 0; i < angles.length; i++) {
      this.setAnglePreset(angles[i]);
      results.push({ angle: angles[i], dataUrl: this.exportSnapshotPNG(size || 1400, size || 1400) });
    }
    this.yaw = savedYaw; this.pitch = savedPitch; this.zoom = savedZoom;
    return results;
  };

  Mockup3D.prototype.exportVideo = function (options, onProgress, onComplete, onError) {
    var self = this;
    if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) {
      if (onError) onError("MediaRecorder is not supported in this host runtime.");
      return;
    }
    var resMap = { "1:1": [1080, 1080], "16:9": [1920, 1080], "9:16": [1080, 1920] };
    var dims = resMap[options.aspect || "1:1"] || [720, 720];
    var durationSec = options.duration || 5, fps = 30, totalFrames = durationSec * fps;
    var animMode = options.animation || "turntable";

    var offCanvas = document.createElement("canvas");
    offCanvas.width = dims[0]; offCanvas.height = dims[1];

    var stream = offCanvas.captureStream(fps);
    var mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm";
    var recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 20000000 });
    var chunks = [];
    recorder.ondataavailable = function (e) { if (e.data && e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = function () {
      self.isRecording = false;
      if (onComplete) onComplete(new Blob(chunks, { type: "video/webm" }));
    };

    var savedYaw = this.yaw, savedPitch = this.pitch, savedFold = this.fold, savedZoom = this.zoom;
    this.isRecording = true;
    recorder.start(250);

    var frame = 0;
    var timer = setInterval(function () {
      var t = frame / totalFrames;
      if (animMode === "turntable") {
        self.yaw = savedYaw + t * Math.PI * 2; self.pitch = 0.32; self.fold = 1.0;
      } else if (animMode === "fold_assemble") {
        var foldT = Math.min(1, t / 0.55);
        var ease = foldT < 0.5 ? 2 * foldT * foldT : 1 - Math.pow(-2 * foldT + 2, 2) / 2;
        self.fold = ease; self.pitch = 0.85 - ease * 0.5; self.yaw = -0.6 + t * Math.PI * 1.4;
      } else {
        self.fold = 1.0;
        self.yaw = -0.65 + Math.sin(t * Math.PI * 2) * 0.85;
        self.pitch = 0.25 + Math.cos(t * Math.PI * 2) * 0.22;
        self.zoom = 0.96 + Math.sin(t * Math.PI) * 0.14;
      }
      self.render(offCanvas);
      if (onProgress) onProgress(Math.round((frame / totalFrames) * 100));
      frame++;
      if (frame > totalFrames) {
        clearInterval(timer);
        self.yaw = savedYaw; self.pitch = savedPitch; self.fold = savedFold; self.zoom = savedZoom;
        recorder.stop();
      }
    }, 1000 / fps);
  };

  global.Mockup3D = Mockup3D;
  global.MOCKUP_MATERIALS = MATERIALS;
})(window);
