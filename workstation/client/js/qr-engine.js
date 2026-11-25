/**
 * ============================================================================
 * Design360n Workstation v14.2 — 100% Offline ISO/IEC 18004 Vector QR Engine
 * Pure JS Byte-Mode QR Encoder (Versions 1–10, ECC Level M) + SVG Generator
 * Zero external dependencies — guaranteed scannable by all phone cameras!
 * ============================================================================
 */
(function (global) {
  "use strict";

  // GF(256) exp/log tables with primitive polynomial 0x11D
  var EXP = new Array(512);
  var LOG = new Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) {
      EXP[i] = x;
      LOG[x] = i;
      x <<= 1;
      if (x & 0x100) x ^= 0x11D;
    }
    for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
  })();

  function gfMul(a, b) {
    return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];
  }

  function rsGenPoly(ecLen) {
    var poly = [1];
    for (var i = 0; i < ecLen; i++) {
      var next = new Array(poly.length + 1);
      for (var k = 0; k < next.length; k++) next[k] = 0;
      for (var j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], EXP[i]);
      }
      poly = next;
    }
    return poly;
  }

  function rsCompute(data, ecLen) {
    var gen = rsGenPoly(ecLen);
    var res = new Array(ecLen);
    for (var i = 0; i < ecLen; i++) res[i] = 0;
    for (var d = 0; d < data.length; d++) {
      var factor = data[d] ^ res[0];
      res.shift();
      res.push(0);
      if (factor !== 0) {
        for (var j = 0; j < ecLen; j++) res[j] ^= gfMul(gen[j + 1], factor);
      }
    }
    return res;
  }

  // Version 1..10 ECC Level M specs: [ver, totalDataBytes, ecBytesPerBlock, numBlocks, alignCoords]
  var VER_SPECS = [
    [1,  16,  10, 1, []],
    [2,  28,  16, 1, [6, 18]],
    [3,  44,  26, 1, [6, 22]],
    [4,  64,  18, 2, [6, 26]],
    [5,  86,  24, 2, [6, 30]],
    [6,  108, 16, 4, [6, 34]],
    [7,  124, 18, 4, [6, 22, 38]],
    [8,  154, 22, 4, [6, 24, 42]],
    [9,  182, 22, 5, [6, 26, 46]],
    [10, 216, 26, 5, [6, 28, 50]]
  ];

  // Exact block splits for Version 1..10 ECC Level M: [[count, dataBytes], ...]
  var BLOCK_SPLITS = {
    1:  [[1, 16]],
    2:  [[1, 28]],
    3:  [[1, 44]],
    4:  [[2, 32]],
    5:  [[2, 43]],
    6:  [[4, 27]],
    7:  [[4, 31]],
    8:  [[2, 38], [2, 39]],
    9:  [[3, 36], [2, 37]],
    10: [[4, 43], [1, 44]]
  };

  function toUTF8Bytes(str) {
    var out = [];
    for (var i = 0; i < str.length; i++) {
      var c = str.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F));
      else out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F));
    }
    return out;
  }

  function makeBitBuffer() {
    var bits = [];
    return {
      put: function (val, len) {
        for (var i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
      },
      bits: bits
    };
  }

  function buildFormatBits(maskIdx) {
    // ECC Level M = 00 (2 bits) + 3-bit mask index
    var data = (0 << 3) | maskIdx;
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    return ((data << 10) | rem) ^ 0x5412;
  }

  function buildVersionBits(ver) {
    var rem = ver;
    for (var i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
    return (ver << 12) | rem;
  }

  function encodeQR(text) {
    var raw = toUTF8Bytes(String(text || "https://design360n.com"));
    var spec = null;
    for (var v = 0; v < VER_SPECS.length; v++) {
      var ver = VER_SPECS[v][0];
      var capBytes = VER_SPECS[v][1];
      var headerBits = 4 + (ver <= 9 ? 8 : 16);
      if (Math.ceil((headerBits + raw.length * 8) / 8) <= capBytes) {
        spec = VER_SPECS[v];
        break;
      }
    }
    if (!spec) {
      // Truncate safely to Version 10 max (213 bytes)
      raw = raw.slice(0, 213);
      spec = VER_SPECS[VER_SPECS.length - 1];
    }

    var verNum = spec[0], totalDataBytes = spec[1], ecPerBlock = spec[2], alignCoords = spec[4];
    var bb = makeBitBuffer();
    bb.put(0x4, 4); // Byte mode indicator
    bb.put(raw.length, verNum <= 9 ? 8 : 16);
    for (var i = 0; i < raw.length; i++) bb.put(raw[i], 8);

    // Terminator + byte alignment + pad codewords (0xEC, 0x11)
    var maxBits = totalDataBytes * 8;
    bb.put(0, Math.min(4, maxBits - bb.bits.length));
    while (bb.bits.length % 8 !== 0) bb.put(0, 1);
    var dataBytes = [];
    for (var b = 0; b < bb.bits.length; b += 8) {
      var val = 0;
      for (var k = 0; k < 8; k++) val = (val << 1) | bb.bits[b + k];
      dataBytes.push(val);
    }
    var padIdx = 0;
    while (dataBytes.length < totalDataBytes) {
      dataBytes.push(padIdx % 2 === 0 ? 0xEC : 0x11);
      padIdx++;
    }

    // Split into blocks & compute Reed-Solomon ECC
    var splits = BLOCK_SPLITS[verNum];
    var blocksData = [], blocksEC = [], offset = 0, maxDataLen = 0;
    for (var s = 0; s < splits.length; s++) {
      var cnt = splits[s][0], dLen = splits[s][1];
      if (dLen > maxDataLen) maxDataLen = dLen;
      for (var c = 0; c < cnt; c++) {
        var blk = dataBytes.slice(offset, offset + dLen);
        offset += dLen;
        blocksData.push(blk);
        blocksEC.push(rsCompute(blk, ecPerBlock));
      }
    }

    // Interleave data codewords + ECC codewords
    var finalBytes = [];
    for (var di = 0; di < maxDataLen; di++) {
      for (var bi = 0; bi < blocksData.length; bi++) {
        if (di < blocksData[bi].length) finalBytes.push(blocksData[bi][di]);
      }
    }
    for (var ei = 0; ei < ecPerBlock; ei++) {
      for (var bi2 = 0; bi2 < blocksEC.length; bi2++) {
        finalBytes.push(blocksEC[bi2][ei]);
      }
    }

    // Build QR Matrix
    var size = verNum * 4 + 17;
    var mat = [], isFunc = [];
    for (var y = 0; y < size; y++) {
      mat.push(new Array(size));
      isFunc.push(new Array(size));
      for (var x = 0; x < size; x++) { mat[y][x] = 0; isFunc[y][x] = false; }
    }

    function setFunc(x, y, dark) {
      if (x < 0 || y < 0 || x >= size || y >= size) return;
      mat[y][x] = dark ? 1 : 0;
      isFunc[y][x] = true;
    }

    // Finder patterns + separators
    function drawFinder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) {
        for (var dx = -4; dx <= 4; dx++) {
          var xx = cx + dx, yy = cy + dy;
          if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue;
          var dist = Math.max(Math.abs(dx), Math.abs(dy));
          setFunc(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
    drawFinder(3, 3);
    drawFinder(size - 4, 3);
    drawFinder(3, size - 4);

    // Timing patterns
    for (var t = 8; t < size - 8; t++) {
      setFunc(t, 6, t % 2 === 0);
      setFunc(6, t, t % 2 === 0);
    }

    // Alignment patterns
    for (var ai = 0; ai < alignCoords.length; ai++) {
      for (var aj = 0; aj < alignCoords.length; aj++) {
        if ((ai === 0 && aj === 0) || (ai === 0 && aj === alignCoords.length - 1) || (ai === alignCoords.length - 1 && aj === 0)) continue;
        var acx = alignCoords[ai], acy = alignCoords[aj];
        for (var dy2 = -2; dy2 <= 2; dy2++) {
          for (var dx2 = -2; dx2 <= 2; dx2++) {
            setFunc(acx + dx2, acy + dy2, Math.max(Math.abs(dx2), Math.abs(dy2)) !== 1);
          }
        }
      }
    }

    // Reserve format areas + dark module
    for (var f = 0; f <= 8; f++) {
      if (f !== 6) { setFunc(8, f, false); setFunc(f, 8, false); }
      if (f < 8) { setFunc(size - 1 - f, 8, false); setFunc(8, size - 1 - f, false); }
    }
    setFunc(8, size - 8, true);

    // Version info for Version >= 7
    if (verNum >= 7) {
      var vBits = buildVersionBits(verNum);
      for (var vi = 0; vi < 18; vi++) {
        var darkV = ((vBits >>> vi) & 1) === 1;
        var a = Math.floor(vi / 3), b2 = vi % 3;
        setFunc(size - 11 + b2, a, darkV);
        setFunc(a, size - 11 + b2, darkV);
      }
    }

    // Place data bits in zig-zag columns
    var bitIdx = 0, totalBits = finalBytes.length * 8;
    for (var col = size - 1; col >= 1; col -= 2) {
      if (col === 6) col = 5;
      var upward = (((col + 1) & 2) === 0);
      for (var step = 0; step < size; step++) {
        var row = upward ? (size - 1 - step) : step;
        for (var dx3 = 0; dx3 < 2; dx3++) {
          var xx2 = col - dx3;
          if (!isFunc[row][xx2]) {
            var bit = 0;
            if (bitIdx < totalBits) bit = (finalBytes[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1;
            mat[row][xx2] = bit;
            bitIdx++;
          }
        }
      }
    }

    // Apply Mask 0 ((row + col) % 2 === 0) cleanly & write Format Info
    var maskIdx = 0;
    for (var my = 0; my < size; my++) {
      for (var mx = 0; mx < size; mx++) {
        if (!isFunc[my][mx] && ((my + mx) % 2 === 0)) {
          mat[my][mx] ^= 1;
        }
      }
    }

    var fmt = buildFormatBits(maskIdx);
    for (var fi = 0; fi <= 5; fi++) setFunc(8, fi, ((fmt >>> fi) & 1) === 1);
    setFunc(8, 7, ((fmt >>> 6) & 1) === 1);
    setFunc(8, 8, ((fmt >>> 7) & 1) === 1);
    setFunc(7, 8, ((fmt >>> 8) & 1) === 1);
    for (var fi2 = 9; fi2 < 15; fi2++) setFunc(14 - fi2, 8, ((fmt >>> fi2) & 1) === 1);
    for (var fi3 = 0; fi3 < 8; fi3++) setFunc(size - 1 - fi3, 8, ((fmt >>> fi3) & 1) === 1);
    for (var fi4 = 8; fi4 < 15; fi4++) setFunc(8, size - 15 + fi4, ((fmt >>> fi4) & 1) === 1);
    setFunc(8, size - 8, true);

    return { version: verNum, size: size, matrix: mat, text: String(text || "") };
  }

  function toSVG(qr, opts) {
    opts = opts || {};
    var color = opts.color || "#000000";
    var bg = opts.bg || "#ffffff";
    var rounded = !!opts.rounded;
    var quiet = 4;
    var full = qr.size + quiet * 2;
    var parts = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + full + ' ' + full + '" width="100%" height="100%" shape-rendering="crispEdges">',
      '<rect width="' + full + '" height="' + full + '" fill="' + bg + '" />'
    ];
    for (var y = 0; y < qr.size; y++) {
      for (var x = 0; x < qr.size; x++) {
        if (qr.matrix[y][x]) {
          var rx = x + quiet, ry = y + quiet;
          if (rounded) {
            parts.push('<rect x="' + rx + '" y="' + ry + '" width="1" height="1" rx="0.36" ry="0.36" fill="' + color + '" />');
          } else {
            parts.push('<rect x="' + rx + '" y="' + ry + '" width="1" height="1" fill="' + color + '" />');
          }
        }
      }
    }
    parts.push('</svg>');
    return parts.join("");
  }

  global.QREngine = {
    encode: encodeQR,
    toSVG: toSVG
  };
})(typeof window !== "undefined" ? window : global);
