/**
 * ============================================================================
 * Dieline Maker Pro v4.0 — Studio-Grade Raster-to-Editable-Stroke Engine
 * True Illustrator-Quality Centerline Vectorizer:
 *   1. Smart Alpha/Luminance Binarization + Denoise
 *   2. Chamfer Distance Transform (EDT) for Sub-Pixel Stroke Centering
 *   3. Zhang-Suen Thinning + Corner-Horn Spur Pruning + Smooth Junction Stitching
 *   4. Sub-Pixel EDT Ridge Projection (eliminates 1px staircase wobble!)
 *   5. Geometric Primitive Fitting:
 *      - Exact 4-Anchor Bezier Circles (Clock, Globe, Lens, Wheels, Heads)
 *      - Exact Axis-Aligned Rectangles (Calendar boxes, Bars, Frames)
 *   6. Philip Schneider Least-Squares Cubic Bezier Curve Fitting
 *      (minimal anchor points, buttery-smooth Illustrator handles, crisp corners)
 * ============================================================================
 */
(function (global) {
  "use strict";

  function binarize(imgData, threshold, invert) {
    var w = imgData.width, h = imgData.height, d = imgData.data;
    var bin = new Uint8Array(w * h);
    var thresh = threshold !== undefined ? threshold : 165;

    var transparentCount = 0;
    var step = Math.max(1, Math.floor((w * h) / 4000));
    for (var s = 0; s < w * h; s += step) {
      if (d[s * 4 + 3] < 40) transparentCount++;
    }
    var hasAlphaBg = transparentCount > 20;

    for (var i = 0; i < w * h; i++) {
      var r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], a = d[i * 4 + 3];
      var fg = hasAlphaBg ? (a > (255 - thresh) ? 1 : 0) : ((0.299 * r + 0.587 * g + 0.114 * b) < thresh ? 1 : 0);
      bin[i] = invert ? (1 - fg) : fg;
    }

    var clean = new Uint8Array(bin);
    for (var y = 1; y < h - 1; y++) {
      var row = y * w;
      for (var x = 1; x < w - 1; x++) {
        var idx = row + x;
        var sum = bin[idx - w - 1] + bin[idx - w] + bin[idx - w + 1] +
                  bin[idx - 1] + bin[idx + 1] +
                  bin[idx + w - 1] + bin[idx + w] + bin[idx + w + 1];
        if (bin[idx] === 1 && sum <= 1) clean[idx] = 0;
        else if (bin[idx] === 0 && sum >= 7) clean[idx] = 1;
      }
    }
    return clean;
  }

  /**
   * 2-Pass Chamfer Distance Transform (gives exact distance from stroke edge to center)
   */
  function computeDistanceField(bin, w, h) {
    var dist = new Float32Array(w * h);
    var INF = 1e6;
    for (var i = 0; i < w * h; i++) dist[i] = bin[i] ? INF : 0;

    for (var y = 1; y < h - 1; y++) {
      var row = y * w;
      for (var x = 1; x < w - 1; x++) {
        var idx = row + x;
        if (!bin[idx]) continue;
        var m = dist[idx];
        var v1 = dist[idx - 1] + 1, v2 = dist[idx - w] + 1;
        var v3 = dist[idx - w - 1] + 1.414, v4 = dist[idx - w + 1] + 1.414;
        if (v1 < m) m = v1; if (v2 < m) m = v2; if (v3 < m) m = v3; if (v4 < m) m = v4;
        dist[idx] = m;
      }
    }
    for (var y2 = h - 2; y2 >= 1; y2--) {
      var row2 = y2 * w;
      for (var x2 = w - 2; x2 >= 1; x2--) {
        var idx2 = row2 + x2;
        if (!bin[idx2]) continue;
        var m2 = dist[idx2];
        var u1 = dist[idx2 + 1] + 1, u2 = dist[idx2 + w] + 1;
        var u3 = dist[idx2 + w + 1] + 1.414, u4 = dist[idx2 + w - 1] + 1.414;
        if (u1 < m2) m2 = u1; if (u2 < m2) m2 = u2; if (u3 < m2) m2 = u3; if (u4 < m2) m2 = u4;
        dist[idx2] = m2;
      }
    }
    return dist;
  }

  function zhangSuenThin(bin, w, h) {
    var img = new Uint8Array(bin);
    var toRemove = new Uint8Array(w * h);
    var changed = true, iter = 0, maxIter = 90;

    while (changed && iter < maxIter) {
      changed = false; iter++;
      for (var pass = 0; pass < 2; pass++) {
        var removeCount = 0;
        for (var y = 1; y < h - 1; y++) {
          var row = y * w;
          for (var x = 1; x < w - 1; x++) {
            var idx = row + x;
            if (!img[idx]) continue;
            var p2 = img[idx - w], p3 = img[idx - w + 1], p4 = img[idx + 1], p5 = img[idx + w + 1];
            var p6 = img[idx + w], p7 = img[idx + w - 1], p8 = img[idx - 1], p9 = img[idx - w - 1];
            var B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
            if (B < 2 || B > 6) continue;
            var A =
              ((p2 === 0 && p3 === 1) ? 1 : 0) + ((p3 === 0 && p4 === 1) ? 1 : 0) +
              ((p4 === 0 && p5 === 1) ? 1 : 0) + ((p5 === 0 && p6 === 1) ? 1 : 0) +
              ((p6 === 0 && p7 === 1) ? 1 : 0) + ((p7 === 0 && p8 === 1) ? 1 : 0) +
              ((p8 === 0 && p9 === 1) ? 1 : 0) + ((p9 === 0 && p2 === 1) ? 1 : 0);
            if (A !== 1) continue;
            if (pass === 0) { if (p2 * p4 * p6 !== 0 || p4 * p6 * p8 !== 0) continue; }
            else { if (p2 * p4 * p8 !== 0 || p2 * p6 * p8 !== 0) continue; }
            toRemove[idx] = 1; removeCount++;
          }
        }
        if (removeCount > 0) {
          changed = true;
          for (var k = 0; k < w * h; k++) { if (toRemove[k]) { img[k] = 0; toRemove[k] = 0; } }
        }
      }
    }

    for (var py = 1; py < h - 1; py++) {
      for (var px = 1; px < w - 1; px++) {
        var ii = py * w + px;
        if (!img[ii]) continue;
        var n = img[ii - w], s = img[ii + w], e = img[ii + 1], ww = img[ii - 1];
        var nw = img[ii - w - 1], ne = img[ii - w + 1], sw = img[ii + w - 1], se = img[ii + w + 1];
        if ((n && e && !sw) || (e && s && !nw) || (s && ww && !ne) || (ww && n && !se)) img[ii] = 0;
      }
    }
    return img;
  }

  function estimateStrokeWidth(bin, skel, w, h) {
    var ink = 0, sk = 0;
    for (var i = 0; i < w * h; i++) { if (bin[i]) ink++; if (skel[i]) sk++; }
    if (sk === 0) return 2;
    return Math.max(1, Math.min(24, Math.round((ink / sk) * 10) / 10));
  }

  function pruneSpurs(skel, w, h, maxSpurLen) {
    var dirs = [[0,-1],[1,0],[0,1],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]];
    function nbs(idx) {
      var x = idx % w, y = (idx - x) / w, out = [];
      for (var d = 0; d < 8; d++) {
        var nx = x + dirs[d][0], ny = y + dirs[d][1];
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          var ni = ny * w + nx;
          if (skel[ni]) out.push(ni);
        }
      }
      return out;
    }

    var pruned = true, rounds = 0;
    while (pruned && rounds < 4) {
      pruned = false; rounds++;
      for (var i = 0; i < w * h; i++) {
        if (!skel[i]) continue;
        var nb = nbs(i);
        if (nb.length !== 1) continue;
        var chain = [i], seen = {}; seen[i] = true;
        var prev = i, curr = nb[0], hitJunction = false;
        while (chain.length <= maxSpurLen) {
          var cnb = nbs(curr);
          if (cnb.length >= 3) { hitJunction = true; break; }
          if (cnb.length === 1) break;
          chain.push(curr);
          var next = cnb[0] === prev ? cnb[1] : cnb[0];
          if (seen[next]) break; seen[next] = true;
          prev = curr; curr = next;
        }
        if (hitJunction && chain.length <= maxSpurLen) {
          for (var k = 0; k < chain.length; k++) skel[chain[k]] = 0;
          pruned = true;
        }
      }
    }
    return skel;
  }

  function traceSkeleton(skel, w, h) {
    var dirs = [[0,-1],[1,0],[0,1],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]];
    function getNeighbors(x, y) {
      var n = [];
      for (var d = 0; d < 8; d++) {
        var nx = x + dirs[d][0], ny = y + dirs[d][1];
        if (nx >= 0 && nx < w && ny >= 0 && ny < h && skel[ny * w + nx]) n.push([nx, ny]);
      }
      return n;
    }

    var visitedEdge = {};
    function edgeKey(x1, y1, x2, y2) {
      var a = y1 * w + x1, b = y2 * w + x2;
      return a < b ? (a + "_" + b) : (b + "_" + a);
    }

    var endpoints = [], junctions = [], allPixels = [];
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        if (!skel[y * w + x]) continue;
        var nb = getNeighbors(x, y);
        allPixels.push([x, y]);
        if (nb.length === 1) endpoints.push([x, y]);
        else if (nb.length >= 3) junctions.push([x, y]);
      }
    }

    var polylines = [];
    function walkFrom(sx, sy, nx, ny) {
      var ek = edgeKey(sx, sy, nx, ny);
      if (visitedEdge[ek]) return;
      visitedEdge[ek] = true;
      var pts = [[sx, sy], [nx, ny]];
      var cx = nx, cy = ny, px = sx, py = sy;
      while (true) {
        var nbs = getNeighbors(cx, cy);
        if (nbs.length !== 2) break;
        var next = (nbs[0][0] === px && nbs[0][1] === py) ? nbs[1] : nbs[0];
        if (!next) break;
        var ek2 = edgeKey(cx, cy, next[0], next[1]);
        if (visitedEdge[ek2]) break;
        visitedEdge[ek2] = true;
        pts.push(next);
        px = cx; py = cy; cx = next[0]; cy = next[1];
        if (cx === sx && cy === sy) break;
      }
      if (pts.length >= 2) {
        var first = pts[0], last = pts[pts.length - 1];
        var isClosed = Math.hypot(first[0] - last[0], first[1] - last[1]) <= 1.8 && pts.length >= 6;
        if (isClosed) pts.pop();
        polylines.push({ points: pts, closed: isClosed });
      }
    }

    var i, j, p, nbs;
    for (i = 0; i < endpoints.length; i++) { p = endpoints[i]; nbs = getNeighbors(p[0], p[1]); for (j = 0; j < nbs.length; j++) walkFrom(p[0], p[1], nbs[j][0], nbs[j][1]); }
    for (i = 0; i < junctions.length; i++) { p = junctions[i]; nbs = getNeighbors(p[0], p[1]); for (j = 0; j < nbs.length; j++) walkFrom(p[0], p[1], nbs[j][0], nbs[j][1]); }
    for (i = 0; i < allPixels.length; i++) { p = allPixels[i]; nbs = getNeighbors(p[0], p[1]); for (j = 0; j < nbs.length; j++) walkFrom(p[0], p[1], nbs[j][0], nbs[j][1]); }
    return polylines;
  }

  function mergeSmoothCollinear(polylines) {
    var list = polylines.map(function (pl) { return { points: pl.points.slice(), closed: !!pl.closed }; });

    function endTangent(pts, atEnd) {
      var n = pts.length, step = Math.min(5, n - 1);
      var a = atEnd ? pts[n - 1 - step] : pts[step];
      var b = atEnd ? pts[n - 1] : pts[0];
      var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      return [dx / l, dy / l];
    }

    var merged = true, guard = 0;
    while (merged && guard < 220) {
      merged = false; guard++;
      var bestScore = 0.72, bestPair = null;
      for (var i = 0; i < list.length; i++) {
        if (list[i].closed || list[i].points.length < 2) continue;
        var pi = list[i].points;
        if (pi.length >= 10 && Math.hypot(pi[0][0] - pi[pi.length - 1][0], pi[0][1] - pi[pi.length - 1][1]) <= 3.5) {
          list[i].closed = true; merged = true; break;
        }
        for (var j = i + 1; j < list.length; j++) {
          if (list[j].closed || list[j].points.length < 2) continue;
          var pj = list[j].points;
          var combos = [
            [true, false, pi[pi.length - 1], pj[0]],
            [true, true, pi[pi.length - 1], pj[pj.length - 1]],
            [false, false, pi[0], pj[0]],
            [false, true, pi[0], pj[pj.length - 1]]
          ];
          for (var c = 0; c < 4; c++) {
            var d = Math.hypot(combos[c][2][0] - combos[c][3][0], combos[c][2][1] - combos[c][3][1]);
            if (d > 3.2) continue;
            var t1 = endTangent(pi, combos[c][0]), t2 = endTangent(pj, combos[c][1]);
            var align = -(t1[0] * t2[0] + t1[1] * t2[1]);
            if (align > bestScore) { bestScore = align; bestPair = { i: i, j: j, endI: combos[c][0], endJ: combos[c][1] }; }
          }
        }
        if (merged) break;
      }
      if (!merged && bestPair) {
        var A = list[bestPair.i].points, B = list[bestPair.j].points;
        if (!bestPair.endI) A.reverse();
        if (bestPair.endJ) B.reverse();
        var joined = A.concat(B.slice(1));
        var isClosed = joined.length >= 10 && Math.hypot(joined[0][0] - joined[joined.length - 1][0], joined[0][1] - joined[joined.length - 1][1]) <= 3.5;
        if (isClosed) joined.pop();
        list[bestPair.i] = { points: joined, closed: isClosed };
        list.splice(bestPair.j, 1);
        merged = true;
      }
    }

    return list.filter(function (pl) {
      var len = 0;
      for (var k = 1; k < pl.points.length; k++) len += Math.hypot(pl.points[k][0] - pl.points[k - 1][0], pl.points[k][1] - pl.points[k - 1][1]);
      return len >= 1.5;
    });
  }

  /**
   * Project raw skeleton pixels onto exact sub-pixel ridge center of the Distance Field
   * + corner-locked Gaussian smoothing
   */
  function refineSubpixelCenter(pts, closed, distField, w, h) {
    var n = pts.length;
    var cur = pts.map(function (p) {
      var x = Math.round(p[0]), y = Math.round(p[1]);
      if (x <= 1 || x >= w - 2 || y <= 1 || y >= h - 2) return [p[0], p[1]];
      // Parabolic sub-pixel peak interpolation on 3x3 distance field
      var c = distField[y * w + x];
      var l = distField[y * w + (x - 1)], r = distField[y * w + (x + 1)];
      var u = distField[(y - 1) * w + x], d = distField[(y + 1) * w + x];
      var dx = 0, dy = 0;
      var denX = (l - 2 * c + r);
      if (Math.abs(denX) > 0.05 && denX < 0) dx = Math.max(-0.5, Math.min(0.5, 0.5 * (l - r) / denX));
      var denY = (u - 2 * c + d);
      if (Math.abs(denY) > 0.05 && denY < 0) dy = Math.max(-0.5, Math.min(0.5, 0.5 * (u - d) / denY));
      return [x + dx, y + dy];
    });

    if (n < 5) return cur;
    for (var it = 0; it < 6; it++) {
      var next = cur.map(function (p) { return [p[0], p[1]]; });
      for (var i = 0; i < n; i++) {
        if (!closed && (i === 0 || i === n - 1)) continue;
        var pPrev = cur[(i - 1 + n) % n], pCurr = cur[i], pNext = cur[(i + 1) % n];
        var pBack = cur[(i - 3 + n) % n], pFwd = cur[(i + 3) % n];
        var v1x = pCurr[0] - pBack[0], v1y = pCurr[1] - pBack[1];
        var v2x = pFwd[0] - pCurr[0], v2y = pFwd[1] - pCurr[1];
        var l1 = Math.hypot(v1x, v1y), l2 = Math.hypot(v2x, v2y);
        if (l1 > 1.5 && l2 > 1.5 && ((v1x * v2x + v1y * v2y) / (l1 * l2)) < 0.32) continue;
        next[i] = [0.25 * pPrev[0] + 0.5 * pCurr[0] + 0.25 * pNext[0], 0.25 * pPrev[1] + 0.5 * pCurr[1] + 0.25 * pNext[1]];
      }
      cur = next;
    }
    return cur;
  }

  /**
   * Perfect 4-Anchor Circle Fitter
   */
  function tryFitPerfectCircle(pts, closed) {
    if (!closed || pts.length < 10) return null;
    var cx = 0, cy = 0, n = pts.length;
    for (var i = 0; i < n; i++) { cx += pts[i][0]; cy += pts[i][1]; }
    cx /= n; cy /= n;
    var meanR = 0, radii = [];
    for (i = 0; i < n; i++) { var r = Math.hypot(pts[i][0] - cx, pts[i][1] - cy); radii.push(r); meanR += r; }
    meanR /= n;
    if (meanR < 3.2) return null;
    var maxErr = 0;
    for (i = 0; i < n; i++) { var e = Math.abs(radii[i] - meanR) / meanR; if (e > maxErr) maxErr = e; }
    if (maxErr > 0.062) return null;

    var k = meanR * 0.55228475;
    function rd(v) { return Math.round(v * 100) / 100; }
    return {
      type: "bezier", closed: true, primitive: "circle",
      anchors: [
        { p: [rd(cx), rd(cy - meanR)], l: [rd(cx - k), rd(cy - meanR)], r: [rd(cx + k), rd(cy - meanR)], corner: false },
        { p: [rd(cx + meanR), rd(cy)], l: [rd(cx + meanR), rd(cy - k)], r: [rd(cx + meanR), rd(cy + k)], corner: false },
        { p: [rd(cx), rd(cy + meanR)], l: [rd(cx + k), rd(cy + meanR)], r: [rd(cx - k), rd(cy + meanR)], corner: false },
        { p: [rd(cx - meanR), rd(cy)], l: [rd(cx - meanR), rd(cy + k)], r: [rd(cx - meanR), rd(cy - k)], corner: false }
      ]
    };
  }

  /**
   * Perfect Axis-Aligned Rectangle Detector (for Calendar squares, Bar Chart bars, etc.)
   */
  function tryFitRectangle(pts, closed) {
    if (!closed || pts.length < 8) return null;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (var i = 0; i < pts.length; i++) {
      if (pts[i][0] < minX) minX = pts[i][0]; if (pts[i][1] < minY) minY = pts[i][1];
      if (pts[i][0] > maxX) maxX = pts[i][0]; if (pts[i][1] > maxY) maxY = pts[i][1];
    }
    var rw = maxX - minX, rh = maxY - minY;
    if (rw < 5 || rh < 5) return null;
    var tol = Math.max(1.8, Math.min(rw, rh) * 0.11);
    for (i = 0; i < pts.length; i++) {
      var x = pts[i][0], y = pts[i][1];
      var dEdge = Math.min(Math.abs(x - minX), Math.abs(x - maxX), Math.abs(y - minY), Math.abs(y - maxY));
      if (dEdge > tol) return null;
    }
    function rd(v) { return Math.round(v * 100) / 100; }
    var x0 = rd(minX), y0 = rd(minY), x1 = rd(maxX), y1 = rd(maxY);
    return {
      type: "bezier", closed: true, primitive: "rect",
      anchors: [
        { p: [x0, y0], l: [x0, y0], r: [x0, y0], corner: true },
        { p: [x1, y0], l: [x1, y0], r: [x1, y0], corner: true },
        { p: [x1, y1], l: [x1, y1], r: [x1, y1], corner: true },
        { p: [x0, y1], l: [x0, y1], r: [x0, y1], corner: true }
      ]
    };
  }

  /* ==========================================================================
   * PHILIP SCHNEIDER LEAST-SQUARES CUBIC BEZIER FITTER (Adobe Illustrator style)
   * Fits minimal, silky-smooth cubic Bezier curves to any dense curve segment!
   * ========================================================================== */
  function vAdd(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
  function vSub(a, b) { return [a[0] - b[0], a[1] - b[1]]; }
  function vScale(a, s) { return [a[0] * s, a[1] * s]; }
  function vDot(a, b) { return a[0] * b[0] + a[1] * b[1]; }
  function vLen(a) { return Math.hypot(a[0], a[1]); }
  function vNorm(a) { var l = vLen(a) || 1; return [a[0] / l, a[1] / l]; }

  function evalCubic(b, t) {
    var mt = 1 - t;
    return [
      mt*mt*mt*b[0][0] + 3*mt*mt*t*b[1][0] + 3*mt*t*t*b[2][0] + t*t*t*b[3][0],
      mt*mt*mt*b[0][1] + 3*mt*mt*t*b[1][1] + 3*mt*t*t*b[2][1] + t*t*t*b[3][1]
    ];
  }

  function chordLengthParam(pts) {
    var u = [0];
    for (var i = 1; i < pts.length; i++) u.push(u[i - 1] + vLen(vSub(pts[i], pts[i - 1])));
    var total = u[u.length - 1] || 1;
    for (i = 0; i < u.length; i++) u[i] /= total;
    return u;
  }

  function generateBezier(pts, u, tHat1, tHat2) {
    var n = pts.length, p0 = pts[0], p3 = pts[n - 1];
    var C00 = 0, C01 = 0, C11 = 0, X0 = 0, X1 = 0;
    for (var i = 0; i < n; i++) {
      var t = u[i], mt = 1 - t;
      var b0 = mt*mt*mt, b1 = 3*mt*mt*t, b2 = 3*mt*t*t, b3 = t*t*t;
      var A0 = vScale(tHat1, b1), A1 = vScale(tHat2, b2);
      C00 += vDot(A0, A0); C01 += vDot(A0, A1); C11 += vDot(A1, A1);
      var tmp = vSub(pts[i], vAdd(vScale(p0, b0 + b1), vScale(p3, b2 + b3)));
      X0 += vDot(A0, tmp); X1 += vDot(A1, tmp);
    }
    var det = C00 * C11 - C01 * C01;
    var alphaL = 0, alphaR = 0;
    if (Math.abs(det) > 1e-6) {
      alphaL = (C11 * X0 - C01 * X1) / det;
      alphaR = (C00 * X1 - C01 * X0) / det;
    }
    var segLen = vLen(vSub(p3, p0));
    var eps = 1e-6 * segLen;
    if (alphaL < eps || alphaR < eps || alphaL > segLen * 1.2 || alphaR > segLen * 1.2) {
      alphaL = alphaR = segLen / 3;
    }
    return [p0, vAdd(p0, vScale(tHat1, alphaL)), vAdd(p3, vScale(tHat2, alphaR)), p3];
  }

  function fitCubicRecursive(pts, tHat1, tHat2, maxError, outCubics, depth) {
    var n = pts.length;
    if (n === 2) {
      var d = vLen(vSub(pts[1], pts[0])) / 3;
      outCubics.push([pts[0], vAdd(pts[0], vScale(tHat1, d)), vAdd(pts[1], vScale(tHat2, d)), pts[1]]);
      return;
    }

    // Check if segment is already a razor-straight line!
    var p0 = pts[0], pEnd = pts[n - 1], lineVec = vSub(pEnd, p0), lineLen = vLen(lineVec);
    if (lineLen > 0.5) {
      var maxLineDist = 0;
      for (var li = 1; li < n - 1; li++) {
        var rel = vSub(pts[li], p0);
        var perp = Math.abs(rel[0] * lineVec[1] - rel[1] * lineVec[0]) / lineLen;
        if (perp > maxLineDist) maxLineDist = perp;
      }
      if (maxLineDist <= Math.min(1.35, maxError * 0.85)) {
        outCubics.push([p0, p0, pEnd, pEnd, true]); // Straight line segment!
        return;
      }
    }

    var u = chordLengthParam(pts);
    var bez = generateBezier(pts, u, tHat1, tHat2);

    var maxDist = 0, splitIdx = Math.floor(n / 2);
    for (var i = 1; i < n - 1; i++) {
      var err = vLen(vSub(evalCubic(bez, u[i]), pts[i]));
      if (err > maxDist) { maxDist = err; splitIdx = i; }
    }

    if (maxDist <= maxError || depth >= 12 || n <= 4) {
      outCubics.push(bez);
      return;
    }

    var tCenter = vNorm(vSub(pts[splitIdx - 1], pts[splitIdx + 1]));
    fitCubicRecursive(pts.slice(0, splitIdx + 1), tHat1, tCenter, maxError, outCubics, depth + 1);
    fitCubicRecursive(pts.slice(splitIdx), vScale(tCenter, -1), tHat2, maxError, outCubics, depth + 1);
  }

  /**
   * Split dense smoothed path at sharp corners, snap H/V straight edges,
   * and fit Schneider Cubic Beziers to every smooth section!
   */
  function fitSchneiderPath(pts, closed, maxError) {
    var n = pts.length;
    if (n < 2) return null;

    // 1. Detect true sharp corners using a robust 4-point chord angle
    var cornerIndices = [];
    var step = Math.min(4, Math.max(2, Math.floor(n / 8)));
    for (var i = 0; i < n; i++) {
      if (!closed && (i === 0 || i === n - 1)) { cornerIndices.push(i); continue; }
      var a = pts[(i - step + n) % n], b = pts[i], c = pts[(i + step) % n];
      var v1 = vSub(b, a), v2 = vSub(c, b);
      var l1 = vLen(v1), l2 = vLen(v2);
      if (l1 > 1.5 && l2 > 1.5) {
        var cosA = vDot(v1, v2) / (l1 * l2);
        if (cosA < 0.42) cornerIndices.push(i);
      }
    }

    // Deduplicate adjacent corner triggers (keep sharpest local corner)
    var cleanCorners = [];
    for (var ci = 0; ci < cornerIndices.length; ci++) {
      var idx = cornerIndices[ci];
      if (cleanCorners.length === 0 || idx - cleanCorners[cleanCorners.length - 1] > step + 1) {
        cleanCorners.push(idx);
      }
    }

    // Build ordered sub-segments between corners
    var segments = [];
    if (closed) {
      if (cleanCorners.length === 0) {
        segments.push(pts.concat([pts[0]]));
      } else {
        for (var s = 0; s < cleanCorners.length; s++) {
          var s0 = cleanCorners[s], s1 = cleanCorners[(s + 1) % cleanCorners.length];
          var seg = [];
          if (s1 > s0) seg = pts.slice(s0, s1 + 1);
          else seg = pts.slice(s0).concat(pts.slice(0, s1 + 1));
          if (seg.length >= 2) segments.push(seg);
        }
      }
    } else {
      if (cleanCorners[0] !== 0) cleanCorners.unshift(0);
      if (cleanCorners[cleanCorners.length - 1] !== n - 1) cleanCorners.push(n - 1);
      for (var s2 = 0; s2 < cleanCorners.length - 1; s2++) {
        var seg2 = pts.slice(cleanCorners[s2], cleanCorners[s2 + 1] + 1);
        if (seg2.length >= 2) segments.push(seg2);
      }
    }

    // Fit Schneider cubics on each corner-to-corner segment
    var allCubics = [];
    for (var sg = 0; sg < segments.length; sg++) {
      var sp = segments[sg];
      var kTan = Math.min(3, sp.length - 1);
      var t1 = vNorm(vSub(sp[kTan], sp[0]));
      var t2 = vNorm(vSub(sp[sp.length - 1 - kTan], sp[sp.length - 1]));
      fitCubicRecursive(sp, t1, t2, maxError, allCubics, 0);
    }
    if (allCubics.length === 0) return null;

    // Snap straight H/V line cubics (within ±4.5 deg)
    var maxSlope = Math.tan(4.5 * Math.PI / 180);
    for (var m = 0; m < allCubics.length; m++) {
      if (allCubics[m][4]) { // marked as straight
        var pA = allCubics[m][0], pB = allCubics[m][3];
        var dx = Math.abs(pB[0] - pA[0]), dy = Math.abs(pB[1] - pA[1]);
        if (Math.hypot(dx, dy) >= 6) {
          if (dy / Math.max(dx, 0.001) < maxSlope) { var ay = (pA[1] + pB[1]) / 2; pA[1] = ay; pB[1] = ay; }
          else if (dx / Math.max(dy, 0.001) < maxSlope) { var ax = (pA[0] + pB[0]) / 2; pA[0] = ax; pB[0] = ax; }
        }
      }
    }

    // Convert cubic chain into Illustrator-native Anchor Points [{p, l, r, corner}]
    function rd(v) { return Math.round(v * 100) / 100; }
    var anchors = [];
    for (var cIdx = 0; cIdx < allCubics.length; cIdx++) {
      var cur = allCubics[cIdx];
      var prevC = cIdx > 0 ? allCubics[cIdx - 1] : (closed ? allCubics[allCubics.length - 1] : null);
      var pPt = cur[0];
      var rH = cur[4] ? pPt : cur[1];
      var lH = prevC ? (prevC[4] ? pPt : prevC[2]) : pPt;
      var isC = !!(cur[4] && (!prevC || prevC[4]));
      anchors.push({ p: [rd(pPt[0]), rd(pPt[1])], l: [rd(lH[0]), rd(lH[1])], r: [rd(rH[0]), rd(rH[1])], corner: isC });
    }
    if (!closed) {
      var lastC = allCubics[allCubics.length - 1];
      var endP = lastC[3];
      var endL = lastC[4] ? endP : lastC[2];
      anchors.push({ p: [rd(endP[0]), rd(endP[1])], l: [rd(endL[0]), rd(endL[1])], r: [rd(endP[0]), rd(endP[1])], corner: true });
    }

    return { type: "bezier", closed: !!closed, anchors: anchors };
  }

  function clusterIcons(bezierPaths, mergeGapPx) {
    var gap = mergeGapPx !== undefined ? mergeGapPx : 14;
    var items = bezierPaths.map(function (bp) {
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (var i = 0; i < bp.anchors.length; i++) {
        var p = bp.anchors[i].p;
        if (p[0] < minX) minX = p[0]; if (p[1] < minY) minY = p[1];
        if (p[0] > maxX) maxX = p[0]; if (p[1] > maxY) maxY = p[1];
      }
      return { path: bp, box: [minX, minY, maxX, maxY] };
    });

    var parent = items.map(function (_, idx) { return idx; });
    function find(x) { return parent[x] === x ? x : (parent[x] = find(parent[x])); }
    function union(a, b) { var ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; }
    function boxesNear(a, b, g) { return !(a[2] + g < b[0] || b[2] + g < a[0] || a[3] + g < b[1] || b[3] + g < a[1]); }

    for (var i = 0; i < items.length; i++) {
      for (var j = i + 1; j < items.length; j++) { if (boxesNear(items[i].box, items[j].box, gap)) union(i, j); }
    }

    var groupMap = {};
    for (var k = 0; k < items.length; k++) {
      var root = find(k);
      if (!groupMap[root]) groupMap[root] = { paths: [], box: [Infinity, Infinity, -Infinity, -Infinity] };
      groupMap[root].paths.push(items[k].path);
      var bx = items[k].box;
      if (bx[0] < groupMap[root].box[0]) groupMap[root].box[0] = bx[0];
      if (bx[1] < groupMap[root].box[1]) groupMap[root].box[1] = bx[1];
      if (bx[2] > groupMap[root].box[2]) groupMap[root].box[2] = bx[2];
      if (bx[3] > groupMap[root].box[3]) groupMap[root].box[3] = bx[3];
    }

    var icons = Object.keys(groupMap).map(function (key) { return groupMap[key]; });
    icons.sort(function (a, b) {
      if (Math.abs(a.box[1] - b.box[1]) > 24) return a.box[1] - b.box[1];
      return a.box[0] - b.box[0];
    });
    return icons;
  }


  /**
   * Detect small solid circular dots (e.g. Speech Bubble "...", Clock center pivot)
   * before skeletonization so thinning never erases them!
   */
  function detectSolidDots(bin, w, h, estStroke) {
    var visited = new Uint8Array(w * h);
    var dots = [];
    var maxDotSize = Math.max(12, Math.round(estStroke * 2.4));
    var minPixels = Math.max(4, Math.round(estStroke * 0.9));

    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        var start = y * w + x;
        if (!bin[start] || visited[start]) continue;
        // Flood-fill component (bail out early if larger than a dot)
        var q = [start];
        visited[start] = 1;
        var head = 0, minX = x, maxX = x, minY = y, maxY = y;
        var tooBig = false;

        while (head < q.length) {
          var cur = q[head++];
          var cx = cur % w, cy = (cur - cx) / w;
          if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
          if ((maxX - minX) > maxDotSize || (maxY - minY) > maxDotSize) tooBig = true;

          var nbs = [cur - 1, cur + 1, cur - w, cur + w];
          for (var n = 0; n < 4; n++) {
            var ni = nbs[n];
            if (ni >= 0 && ni < w * h && bin[ni] && !visited[ni]) {
              visited[ni] = 1;
              q.push(ni);
            }
          }
        }

        var bw = maxX - minX + 1, bh = maxY - minY + 1;
        if (!tooBig && q.length >= minPixels) {
          var aspect = Math.max(bw, bh) / Math.max(1, Math.min(bw, bh));
          var fillRatio = q.length / (bw * bh);
          // Compact round dot (aspect <= 1.45, solid fill >= 0.58)
          if (aspect <= 1.22 && fillRatio >= 0.68) {
            var dcx = Math.round(((minX + maxX) / 2) * 100) / 100;
            var dcy = Math.round(((minY + maxY) / 2) * 100) / 100;
            dots.push({
              type: "bezier",
              closed: false,
              primitive: "dot",
              anchors: [
                { p: [dcx, dcy], l: [dcx, dcy], r: [dcx, dcy], corner: true },
                { p: [dcx + 0.2, dcy], l: [dcx + 0.2, dcy], r: [dcx + 0.2, dcy], corner: true }
              ]
            });
          }
        }
      }
    }
    return dots;
  }

  function traceImageData(imgData, options) {
    options = options || {};
    var w = imgData.width, h = imgData.height;
    var bin = binarize(imgData, options.threshold !== undefined ? options.threshold : 165, !!options.invert);
    var distField = computeDistanceField(bin, w, h);
    var skel = zhangSuenThin(bin, w, h);
    var autoStroke = estimateStrokeWidth(bin, skel, w, h);

    var spurLimit = Math.max(2, Math.min(4, Math.round(autoStroke * 0.45)));
    skel = pruneSpurs(skel, w, h, spurLimit);

    var rawPolylines = mergeSmoothCollinear(traceSkeleton(skel, w, h));
    var maxErr = Math.max(0.65, (options.smoothness !== undefined ? options.smoothness : 1.4));
    var bezierPaths = [];

    for (var i = 0; i < rawPolylines.length; i++) {
      var pl = rawPolylines[i];
      var smoothPts = refineSubpixelCenter(pl.points, pl.closed, distField, w, h);

      // 1. Exact Circle Fit
      var circleFit = tryFitPerfectCircle(smoothPts, pl.closed);
      if (circleFit) { bezierPaths.push(circleFit); continue; }

      // 2. Exact Rectangle Fit
      var rectFit = tryFitRectangle(smoothPts, pl.closed);
      if (rectFit) { bezierPaths.push(rectFit); continue; }

      // 3. Schneider Least-Squares Cubic Bezier Fit
      var bp = fitSchneiderPath(smoothPts, pl.closed, maxErr);
      if (bp) bezierPaths.push(bp);
    }

    var solidDots = detectSolidDots(bin, w, h, autoStroke);
    for (var di = 0; di < solidDots.length; di++) bezierPaths.push(solidDots[di]);
    var icons = clusterIcons(bezierPaths, options.mergeGap !== undefined ? options.mergeGap : 14);
    var strokeWidth = (options.strokeWidth && options.strokeWidth > 0) ? options.strokeWidth : autoStroke;

    return {
      width: w, height: h,
      strokeWidth: strokeWidth, autoStrokeWidth: autoStroke,
      strokeColor: options.strokeColor || "#000000",
      iconCount: icons.length, pathCount: bezierPaths.length,
      icons: icons
    };
  }

  function toSVG(result) {
    function bezierToD(bp) {
      var an = bp.anchors;
      if (!an || !an.length) return "";
      var d = "M " + an[0].p[0] + " " + an[0].p[1];
      for (var i = 0; i < an.length - 1; i++) {
        var a = an[i], b = an[i + 1];
        if (a.r[0] === a.p[0] && a.r[1] === a.p[1] && b.l[0] === b.p[0] && b.l[1] === b.p[1]) {
          d += " L " + b.p[0] + " " + b.p[1];
        } else {
          d += " C " + a.r[0] + " " + a.r[1] + ", " + b.l[0] + " " + b.l[1] + ", " + b.p[0] + " " + b.p[1];
        }
      }
      if (bp.closed && an.length > 2) {
        var last = an[an.length - 1], first = an[0];
        if (last.r[0] === last.p[0] && last.r[1] === last.p[1] && first.l[0] === first.p[0] && first.l[1] === first.p[1]) d += " Z";
        else d += " C " + last.r[0] + " " + last.r[1] + ", " + first.l[0] + " " + first.l[1] + ", " + first.p[0] + " " + first.p[1] + " Z";
      }
      return d;
    }

    var out = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + result.width + " " + result.height + '" width="' + result.width + '" height="' + result.height + '">'
    ];
    for (var i = 0; i < result.icons.length; i++) {
      var icon = result.icons[i];
      out.push('  <g id="Icon_' + (i + 1) + '" fill="none" stroke="' + result.strokeColor + '" stroke-width="' + result.strokeWidth + '" stroke-linecap="round" stroke-linejoin="round">');
      for (var j = 0; j < icon.paths.length; j++) out.push('    <path d="' + bezierToD(icon.paths[j]) + '" />');
      out.push("  </g>");
    }
    out.push("</svg>");
    return out.join("\n");
  }

  global.StrokeTracer = { traceImageData: traceImageData, toSVG: toSVG };
})(window);
