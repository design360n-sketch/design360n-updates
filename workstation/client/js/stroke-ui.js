/**
 * ============================================================================
 * Design360n Workstation v10.0 — Pen-Tool Precision Stroke AI Controller
 * Features:
 *   1. 1-Click Pen-Tool Stroke Icon Finder (100% Free Iconify API: Lucide/Tabler/Feather)
 *   2. Engine 1: AI Pen-Tool Redraw (Google Gemini Free API — auto-crops & redraws
 *      minimal-anchor circles, rects & smooth cubic Beziers like a Pen Tool artist)
 *   3. Engine 2–6: Native Illustrator Line Art, Exact Outline, VTracer B&W/Color, Cloud AI
 *   4. 1-Click Pen-Tool Rebuild Selected (4-Pt Circles, Rects, 0/45/90° Snap, Smooth Beziers)
 *   5. Automatic Batch Folder Processor (auto-saves .AI & .SVG in Source Folder)
 * ============================================================================
 */
(function () {
  "use strict";

  var csInterface = new CSInterface();
  var nodeFS = null, nodePath = null, nodeOS = null;
  try {
    var _req = (typeof window.cep_node !== "undefined" && window.cep_node.require)
      ? window.cep_node.require
      : (typeof require === "function" ? require : null);
    if (_req) {
      nodeFS = _req("fs");
      nodePath = _req("path");
      nodeOS = _req("os");
    }
  } catch (e) {}

  var nodeHTTPS = null, nodeURL = null;
  try {
    var _reqNet = (typeof window.cep_node !== "undefined" && window.cep_node.require)
      ? window.cep_node.require
      : (typeof require === "function" ? require : null);
    if (_reqNet) {
      nodeHTTPS = _reqNet("https");
      nodeURL = _reqNet("url");
    }
  } catch (e) {}

  function cepHttpRequest(urlStr, opts) {
    opts = opts || {};
    if (nodeHTTPS && nodeURL) {
      return new Promise(function (resolve, reject) {
        try {
          var parsed = nodeURL.parse(urlStr);
          var reqOpts = {
            hostname: parsed.hostname,
            port: parsed.port || 443,
            path: parsed.path,
            method: opts.method || "GET",
            headers: opts.headers || {}
          };
          var req = nodeHTTPS.request(reqOpts, function (res) {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              cepHttpRequest(res.headers.location, opts).then(resolve, reject);
              return;
            }
            var chunks = [];
            res.on("data", function (d) { chunks.push(d); });
            res.on("end", function () {
              var body = Buffer.concat(chunks).toString("utf8");
              resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text: body });
            });
          });
          req.on("error", function (err) { reject(err); });
          req.setTimeout(30000, function () { req.abort(); reject(new Error("Request timed out")); });
          if (opts.body) req.write(opts.body);
          req.end();
        } catch (err) { reject(err); }
      });
    }
    return fetch(urlStr, opts).then(function (r) {
      return r.text().then(function (t) { return { ok: r.ok, status: r.status, text: t }; });
    });
  }

  function joinPath(dir, name) {
    if (nodePath) return nodePath.join(dir, name);
    return dir.replace(/[\\/]+$/, "") + "/" + name;
  }

  function writeTextFile(filePath, content) {
    if (nodeFS) {
      nodeFS.writeFileSync(filePath, content, "utf8");
      return true;
    }
    if (window.cep && window.cep.fs && window.cep.fs.writeFile) {
      window.cep.fs.writeFile(filePath, content, window.cep.encoding.UTF8);
      return true;
    }
    return false;
  }

  function getTempPath(filename) {
    if (nodeOS && nodePath) return nodePath.join(nodeOS.tmpdir(), filename);
    return joinPath(sourceFolderPath || "", filename);
  }

  function listRasterFilesInFolder(folderPath) {
    var names = [];
    if (nodeFS) {
      try { names = nodeFS.readdirSync(folderPath); } catch (e) {}
    }
    if ((!names || !names.length) && window.cep && window.cep.fs && window.cep.fs.readdir) {
      var r = window.cep.fs.readdir(folderPath);
      if (r && r.err === 0 && r.data) names = r.data;
    }
    names.sort();
    var out = [];
    for (var i = 0; i < names.length; i++) {
      var fn = names[i];
      if (/\.(png|jpe?g|webp|bmp)$/i.test(fn) && !/_stroke\./i.test(fn)) {
        out.push(joinPath(folderPath, fn));
      }
    }
    return out;
  }

  var sourceFolderPath = "";
  var cepFileList = [];
  var browserFileList = [];
  var lastTracedResult = null;
  var lastTracedName = "icon_set";
  var lastImageAbsPath = "";
  var lastImageDataURL = "";
  var lastGeneratedSVG = "";
  var isRunning = false;

  var els = {
    btnSelectFolder: document.getElementById("btnStrokeFolder"),
    browserFolderInput: document.getElementById("strokeBrowserFolder"),
    singleImgInput: document.getElementById("strokeSingleImg"),
    folderInfo: document.getElementById("strokeFolderInfo"),
    engine: document.getElementById("strokeEngine"),
    format: document.getElementById("strokeFormat"),
    threshold: document.getElementById("strokeThresh"),
    threshVal: document.getElementById("strokeThreshVal"),
    smooth: document.getElementById("strokeSmooth"),
    smoothVal: document.getElementById("strokeSmoothVal"),
    weight: document.getElementById("strokeWeight"),
    mergeGap: document.getElementById("strokeGap"),
    color: document.getElementById("strokeColor"),
    invert: document.getElementById("strokeInvert"),
    keepOpen: document.getElementById("strokeKeepOpen"),
    previewBox: document.getElementById("strokePreviewBox"),
    previewStats: document.getElementById("strokePreviewStats"),
    btnOpenSingleAI: document.getElementById("btnStrokeSingleAI"),
    btnDownloadSingleSVG: document.getElementById("btnStrokeSingleSVG"),
    btnStartBatch: document.getElementById("btnStrokeStartBatch"),
    progressBar: document.getElementById("strokeProgress"),
    progressFill: document.getElementById("strokeProgressFill"),
    logBox: document.getElementById("strokeLog"),
    geminiBox: document.getElementById("geminiApiBox"),
    geminiModel: document.getElementById("geminiModel"),
    geminiKey: document.getElementById("geminiApiKey"),
    cloudBox: document.getElementById("cloudApiBox"),
    cloudProv: document.getElementById("cloudProvider"),
    cloudKey: document.getElementById("cloudApiKey"),
    penIconQuery: document.getElementById("penIconQuery"),
    penIconPack: document.getElementById("penIconPack"),
    btnPenIconSearch: document.getElementById("btnPenIconSearch"),
    penIconResults: document.getElementById("penIconResults"),
    penIconStatus: document.getElementById("penIconStatus")
  };

  if (!els.btnSelectFolder) return;

  function log(msg) {
    var ts = new Date().toTimeString().slice(0, 8);
    els.logBox.textContent += "[" + ts + "] " + msg + "\n";
    els.logBox.scrollTop = els.logBox.scrollHeight;
  }

  function clearLog() { els.logBox.textContent = ""; }

  function getOptions() {
    return {
      engine: els.engine ? els.engine.value : "gemini_pentool",
      threshold: parseInt(els.threshold.value, 10) || 165,
      smoothness: parseFloat(els.smooth.value) || 1.5,
      strokeWidth: parseFloat(els.weight.value) || 0,
      mergeGap: parseInt(els.mergeGap.value, 10) || 14,
      strokeColor: els.color.value || "#000000",
      invert: els.invert.checked
    };
  }

  function escJSX(obj) {
    return JSON.stringify(obj).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  function syncApiBoxes() {
    var eng = els.engine ? els.engine.value : "";
    if (els.geminiBox) els.geminiBox.style.display = eng === "gemini_pentool" ? "block" : "none";
    if (els.cloudBox) els.cloudBox.style.display = eng === "cloud_ai" ? "block" : "none";
  }

  if (els.geminiKey && window.localStorage) {
    els.geminiKey.value = localStorage.getItem("d360_gemini_api_key") || "";
    els.geminiKey.addEventListener("input", function () {
      localStorage.setItem("d360_gemini_api_key", els.geminiKey.value.trim());
    });
  }
  if (els.cloudKey && window.localStorage) {
    els.cloudKey.value = localStorage.getItem("d360_cloud_api_key") || "";
    els.cloudKey.addEventListener("input", function () {
      localStorage.setItem("d360_cloud_api_key", els.cloudKey.value.trim());
    });
  }
  if (els.engine) {
    els.engine.addEventListener("change", syncApiBoxes);
    syncApiBoxes();
  }

  // ==========================================================================
  // 1. 1-CLICK PEN-TOOL STROKE ICON FINDER (100% FREE ICONIFY API)
  // ==========================================================================
  function insertIconifySVG(iconFullName) {
    var parts = iconFullName.split(":");
    if (parts.length !== 2) return;
    var prefix = parts[0], name = parts[1];
    var opts = getOptions();
    var sw = opts.strokeWidth > 0 ? opts.strokeWidth : 2;
    if (els.penIconStatus) els.penIconStatus.textContent = "Fetching pure Pen-Tool stroke SVG: " + iconFullName + "...";

    cepHttpRequest("https://api.iconify.design/" + encodeURIComponent(prefix) + "/" + encodeURIComponent(name) + ".svg?width=120&height=120")
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text;
      })
      .then(function (svgText) {
        var cleanSvg = svgText
          .replace(/currentColor/g, opts.strokeColor || "#000000")
          .replace(/stroke-width="[^"]*"/g, 'stroke-width="' + sw + '"');

        lastGeneratedSVG = cleanSvg;
        lastTracedName = name;
        els.previewBox.innerHTML = cleanSvg;
        els.previewStats.textContent = "Pen-Tool Icon: " + iconFullName + " • " + sw + "pt";

        if (csInterface.isInCEP()) {
          csInterface.evalScript("dmInsertStrokeSVGToActiveDoc('" + escJSX({
            svgContent: cleanSvg,
            name: "PenTool_" + name,
            targetSize: 120,
            strokeColor: opts.strokeColor || "#000000",
            strokeWidth: sw,
            newDoc: false
          }) + "')", function (res) {
            if (els.penIconStatus) els.penIconStatus.textContent = res;
            log("Pen-Tool Icon (" + iconFullName + "): " + res);
          });
        } else {
          var blob = new Blob([cleanSvg], { type: "image/svg+xml" });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = name + "_pentool_stroke.svg";
          a.click();
          if (els.penIconStatus) els.penIconStatus.textContent = "Downloaded pure Pen-Tool SVG: " + name + "_pentool_stroke.svg";
        }
      })
      .catch(function (err) {
        if (els.penIconStatus) els.penIconStatus.textContent = "Error fetching icon: " + err.message;
      });
  }

  function searchPenToolIcons() {
    var q = els.penIconQuery ? els.penIconQuery.value.trim() : "";
    if (!q) {
      if (els.penIconStatus) els.penIconStatus.textContent = "Type an icon keyword (e.g. globe, mail, home, lock, cart, user).";
      return;
    }
    var prefixes = els.penIconPack ? els.penIconPack.value : "lucide,tabler,feather,iconoir";
    if (els.penIconStatus) els.penIconStatus.textContent = "Searching pure Pen-Tool stroke icons for \"" + q + "\"...";
    if (els.penIconResults) els.penIconResults.innerHTML = "";

    var url = "https://api.iconify.design/search?query=" + encodeURIComponent(q) + "&limit=24&prefixes=" + encodeURIComponent(prefixes);
    cepHttpRequest(url)
      .then(function (r) {
        if (!r.ok) throw new Error("Iconify HTTP " + r.status);
        return JSON.parse(r.text);
      })
      .then(function (data) {
        var icons = (data && data.icons) ? data.icons : [];
        if (!icons.length) {
          if (els.penIconStatus) els.penIconStatus.textContent = "No pure-stroke icons found for \"" + q + "\". Try a simpler English word.";
          return;
        }
        if (els.penIconStatus) els.penIconStatus.textContent = "Found " + icons.length + " Pen-Tool icons. Click any icon to insert directly into Illustrator!";
        icons.forEach(function (ic) {
          var parts = ic.split(":");
          var btn = document.createElement("button");
          btn.type = "button";
          btn.title = ic + " (Click to insert into Illustrator)";
          btn.style.cssText = "background:#ffffff;border:1px solid #334155;border-radius:6px;padding:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;height:40px;";
          var img = document.createElement("img");
          img.src = "https://api.iconify.design/" + encodeURIComponent(parts[0]) + "/" + encodeURIComponent(parts[1]) + ".svg?color=%230f172a";
          img.alt = ic;
          img.style.cssText = "width:24px;height:24px;pointer-events:none;";
          btn.appendChild(img);
          btn.addEventListener("click", function () { insertIconifySVG(ic); });
          els.penIconResults.appendChild(btn);
        });
      })
      .catch(function (err) {
        if (els.penIconStatus) els.penIconStatus.textContent = "Search failed (check internet): " + err.message;
      });
  }

  if (els.btnPenIconSearch) els.btnPenIconSearch.addEventListener("click", searchPenToolIcons);
  if (els.penIconQuery) {
    els.penIconQuery.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); searchPenToolIcons(); }
    });
  }

  // ==========================================================================
  // 2. IMAGE LOADING & AUTO-CROPPING HELPERS
  // ==========================================================================
  function loadImagePrepared(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        var maxDim = Math.max(img.width, img.height);
        var scale = maxDim < 900 ? 2 : Math.min(1, 1600 / maxDim);
        var w = Math.max(16, Math.round(img.width * scale));
        var h = Math.max(16, Math.round(img.height * scale));
        var cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        var ctx = cv.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve({
          imgData: ctx.getImageData(0, 0, w, h),
          dataUrl: cv.toDataURL("image/png"),
          canvas: cv,
          width: w,
          height: h,
          upscaled: scale > 1
        });
      };
      img.onerror = function () { reject(new Error("Could not decode image.")); };
      img.src = src;
    });
  }

  function fileToDataURL(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function (e) { resolve(e.target.result); };
      r.onerror = function () { reject(new Error("File read failed")); };
      r.readAsDataURL(file);
    });
  }

  function cepFileToDataURL(absPath) {
    var ext = absPath.split(".").pop().toLowerCase();
    var mime = ext === "png" ? "image/png" : (ext === "webp" ? "image/webp" : "image/jpeg");
    if (nodeFS) {
      try {
        var buf = nodeFS.readFileSync(absPath);
        return "data:" + mime + ";base64," + buf.toString("base64");
      } catch (e) {}
    }
    if (window.cep && window.cep.fs && window.cep.fs.readFile) {
      var rf = window.cep.fs.readFile(absPath, window.cep.encoding.Base64);
      if (rf && rf.err === 0 && rf.data) return "data:" + mime + ";base64," + rf.data;
    }
    return "file:///" + absPath.replace(/\\/g, "/").replace(/^\/+/, "");
  }

  function writeTempPNGForIllustrator(dataUrl, baseName) {
    var b64 = dataUrl.split(",")[1];
    var fname = "dm_trace_" + baseName.replace(/[^A-Za-z0-9_]/g, "_") + ".png";
    if (nodeFS && nodeOS && nodePath) {
      var tmpPath = nodePath.join(nodeOS.tmpdir(), fname);
      nodeFS.writeFileSync(tmpPath, Buffer.from(b64, "base64"));
      return tmpPath;
    }
    if (window.cep && window.cep.fs && sourceFolderPath) {
      var fallbackPath = joinPath(sourceFolderPath, "_" + fname);
      window.cep.fs.writeFile(fallbackPath, b64, window.cep.encoding.Base64);
      return fallbackPath;
    }
    return "";
  }

  // ==========================================================================
  // 3. ENGINE 1: AI PEN-TOOL REDRAW (GOOGLE GEMINI FREE API)
  // ==========================================================================
  function cropIconToBase64(srcCanvas, bbox) {
    var pad = Math.max(10, Math.round(Math.max(bbox.w, bbox.h) * 0.12));
    var sx = Math.max(0, Math.floor(bbox.x - pad));
    var sy = Math.max(0, Math.floor(bbox.y - pad));
    var sw = Math.min(srcCanvas.width - sx, Math.ceil(bbox.w + pad * 2));
    var sh = Math.min(srcCanvas.height - sy, Math.ceil(bbox.h + pad * 2));
    var size = 256;
    var cv = document.createElement("canvas");
    cv.width = size; cv.height = size;
    var ctx = cv.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    var scale = Math.min((size - 24) / Math.max(1, sw), (size - 24) / Math.max(1, sh));
    var dw = sw * scale, dh = sh * scale;
    ctx.drawImage(srcCanvas, sx, sy, sw, sh, (size - dw) / 2, (size - dh) / 2, dw, dh);
    return cv.toDataURL("image/png").split(",")[1];
  }

  function callGeminiSingleIconSVG(base64Png, model, apiKey, strokeColor, strokeWidth) {
    var sw = strokeWidth > 0 ? strokeWidth : 4;
    var prompt =
      "You are a senior Adobe Illustrator Pen-Tool icon designer. " +
      "Redraw this icon from scratch as a clean, minimal-anchor, symmetrical single-line vector stroke SVG on viewBox=\"0 0 100 100\". " +
      "STRICT RULES:\n" +
      "1. Output ONLY raw <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">...</svg> with NO markdown fences and NO explanation.\n" +
      "2. Use ONLY pure stroke geometry: <circle>, <ellipse>, <rect rx=\"...\">, <line>, <polyline>, <polygon>, and clean minimal-anchor cubic Bezier <path d=\"M... C...\">.\n" +
      "3. Every element MUST have fill=\"none\" stroke=\"" + strokeColor + "\" stroke-width=\"" + sw + "\" stroke-linecap=\"round\" stroke-linejoin=\"round\".\n" +
      "4. NEVER trace outlines as filled shapes, NEVER add background rectangles, and keep lines ruler-straight and curves Pen-Tool smooth.";

    var endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(apiKey);
    var bodyStr = JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: "image/png", data: base64Png } }
        ]
      }],
      generationConfig: { temperature: 0.1 }
    });
    return cepHttpRequest(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": String(bodyStr.length) },
      body: bodyStr
    }).then(function (r) {
      if (!r.ok) throw new Error("Gemini API HTTP " + r.status + ": " + (r.text || "").slice(0, 140));
      return JSON.parse(r.text);
    }).then(function (j) {
      var txt = (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts && j.candidates[0].content.parts[0].text) || "";
      txt = txt.replace(/```[a-z]*\s*/gi, "").replace(/```/g, "").trim();
      var m = txt.match(/<svg[\s\S]*?<\/svg>/i);
      if (!m) throw new Error("Gemini did not return valid SVG markup.");
      return m[0];
    });
  }

  function extractInnerSVG(svgStr) {
    var m = svgStr.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    return m ? m[1].trim() : "";
  }

  function callGeminiPenToolRedraw(prep, traced, opts) {
    var key = els.geminiKey ? els.geminiKey.value.trim() : "";
    if (!key) {
      return Promise.reject(new Error("Paste your free Google Gemini API key (aistudio.google.com/apikey) first!"));
    }
    var model = els.geminiModel ? els.geminiModel.value : "gemini-2.5-flash";
    var color = opts.strokeColor || "#000000";
    var sw = opts.strokeWidth > 0 ? opts.strokeWidth : 2.5;

    // Collect icon bounding boxes (or treat entire image as 1 icon if single)
    var boxes = [];
    if (traced && traced.icons && traced.icons.length > 1 && traced.icons.length <= 25) {
      traced.icons.forEach(function (ic) {
        if (ic.bbox && ic.bbox.w >= 16 && ic.bbox.h >= 16) boxes.push(ic.bbox);
      });
    }
    if (boxes.length === 0) {
      boxes.push({ x: 0, y: 0, w: prep.width, h: prep.height });
    }

    var groups = [];
    var idx = 0;

    function runNext() {
      if (idx >= boxes.length) {
        var masterSvg =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + prep.width + ' ' + prep.height +
          '" width="' + prep.width + '" height="' + prep.height + '">\n' +
          groups.join("\n") + '\n</svg>';
        return Promise.resolve(masterSvg);
      }
      var b = boxes[idx];
      var num = idx + 1;
      log("  -> Gemini Pen-Tool redrawing Icon_" + num + "/" + boxes.length + "...");
      var b64 = cropIconToBase64(prep.canvas, b);
      var iconSW = Math.max(1.5, Math.min(8, Math.round((sw * (100 / Math.max(40, Math.max(b.w, b.h)))) * 10) / 10));
      return callGeminiSingleIconSVG(b64, model, key, color, iconSW).then(function (svg) {
        var inner = extractInnerSVG(svg);
        var scale = Math.min(b.w, b.h) / 100;
        var ox = (b.x + (b.w - 100 * scale) / 2).toFixed(2);
        var oy = (b.y + (b.h - 100 * scale) / 2).toFixed(2);
        groups.push('  <g id="Icon_' + num + '" transform="translate(' + ox + ',' + oy + ') scale(' + scale.toFixed(4) + ')">\n    ' + inner + '\n  </g>');
        idx++;
        return runNext();
      });
    }

    return runNext();
  }

  // ==========================================================================
  // 4. NATIVE ILLUSTRATOR, VTRACER & CLOUD AI BRIDGES
  // ==========================================================================
  function sendSchneiderToAI(result, title, savePath, keepOpen) {
    return new Promise(function (resolve) {
      var payload = {
        title: title, width: result.width, height: result.height,
        strokeWidth: result.strokeWidth, strokeColor: result.strokeColor,
        icons: result.icons, savePath: savePath || "", keepOpen: !!keepOpen
      };
      csInterface.evalScript("dmCreateStrokeVectorAI('" + escJSX(payload) + "')", function (res) {
        resolve(res || "ERROR:No response");
      });
    });
  }

  function extractDotsFromResult(traced) {
    var dots = [];
    if (!traced || !traced.icons) return dots;
    traced.icons.forEach(function (ic) {
      ic.paths.forEach(function (p) {
        if (p.primitive === "dot" && p.anchors && p.anchors.length) {
          dots.push([p.anchors[0].p[0], p.anchors[0].p[1]]);
        }
      });
    });
    return dots;
  }

  function sendNativeLineArtToAI(imgPath, title, opts, traced, saveAiPath, saveSvgPath, keepOpen) {
    return new Promise(function (resolve) {
      var estStroke = (traced && traced.autoStrokeWidth) ? traced.autoStrokeWidth : 6;
      var dynMaxStroke = Math.max(12, Math.min(48, Math.round(estStroke * 2.6)));
      var payload = {
        imagePath: imgPath,
        title: title,
        threshold: opts.threshold,
        smoothness: opts.smoothness,
        mergeGap: opts.mergeGap,
        strokeColor: opts.strokeColor,
        strokeWidth: opts.strokeWidth,
        autoStrokeWidth: estStroke,
        srcWidth: (traced && traced.width) ? traced.width : 1000,
        srcHeight: (traced && traced.height) ? traced.height : 1000,
        dots: extractDotsFromResult(traced),
        maxStroke: dynMaxStroke,
        saveAiPath: saveAiPath || "",
        saveSvgPath: saveSvgPath || "",
        keepOpen: !!keepOpen
      };
      var jsxFn = (opts.engine === "exact_outline") ? "dmExactOutlineTraceAI" : "dmOneClickImageToVectorToStroke";
      csInterface.evalScript(jsxFn + "('" + escJSX(payload) + "')", function (res) {
        resolve(res || "ERROR:No response");
      });
    });
  }

  function runLocalVTracer(inputImgPath, outputSvgPath, colorMode) {
    return new Promise(function (resolve, reject) {
      var _req = (typeof window.cep_node !== "undefined" && window.cep_node.require)
        ? window.cep_node.require
        : (typeof require === "function" ? require : null);
      if (!_req) {
        reject(new Error("VTracer local engine requires running inside Adobe Illustrator CEP."));
        return;
      }
      var cp = _req("child_process");
      var cm = colorMode === "color" ? "color" : "binary";
      var pyCode = "import sys, vtracer; vtracer.convert_image_to_svg_py(sys.argv[1], sys.argv[2], colormode=sys.argv[3], mode='spline', filter_speckle=4)";

      cp.execFile("python", ["-c", pyCode, inputImgPath, outputSvgPath, cm], { timeout: 60000 }, function (err) {
        if (!err) { resolve(outputSvgPath); return; }
        cp.execFile("py", ["-c", pyCode, inputImgPath, outputSvgPath, cm], { timeout: 60000 }, function (err2) {
          if (!err2) { resolve(outputSvgPath); return; }
          cp.execFile("vtracer", ["--input", inputImgPath, "--output", outputSvgPath, "--colormode", cm, "--mode", "spline", "--filter-speckle", "4"], { timeout: 60000 }, function (err3) {
            if (!err3) { resolve(outputSvgPath); return; }
            reject(new Error("VTracer not installed yet. Run: pip install vtracer and try again."));
          });
        });
      });
    });
  }

  function callCloudAIVectorize(dataUrl) {
    var provider = els.cloudProv ? els.cloudProv.value : "recraft";
    var key = els.cloudKey ? els.cloudKey.value.trim() : "";
    if (!key) return Promise.reject(new Error("Enter your Recraft or Vectorizer.AI API key first."));

    var parts = dataUrl.split(",");
    var bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    var blob = new Blob([arr], { type: "image/png" });
    var fd = new FormData();

    if (provider === "recraft") {
      fd.append("file", blob, "icon.png");
      return fetch("https://external.api.recraft.ai/v1/images/vectorize", {
        method: "POST",
        headers: { "Authorization": "Bearer " + key },
        body: fd
      }).then(function (r) {
        if (!r.ok) throw new Error("Recraft API error (" + r.status + ")");
        return r.json();
      }).then(function (j) {
        if (!j.image || !j.image.url) throw new Error("No SVG URL returned by Recraft.");
        return fetch(j.image.url).then(function (r2) { return r2.text(); });
      });
    } else {
      fd.append("image", blob, "icon.png");
      fd.append("output.file_format", "svg");
      var auth = key.indexOf(":") >= 0 ? ("Basic " + btoa(key)) : ("Bearer " + key);
      return fetch("https://vectorizer.ai/api/v1/vectorize", {
        method: "POST",
        headers: { "Authorization": auth },
        body: fd
      }).then(function (r) {
        if (!r.ok) throw new Error("Vectorizer.AI error (" + r.status + ")");
        return r.text();
      });
    }
  }

  function renderPreview(result, name) {
    lastTracedResult = result;
    lastTracedName = name;
    lastGeneratedSVG = StrokeTracer.toSVG(result);
    els.previewBox.innerHTML = lastGeneratedSVG;
    els.previewStats.textContent =
      result.iconCount + " icon(s) • " + result.pathCount + " stroke paths • " + result.strokeWidth + "px";
  }

  var lastPrepared = null;

  // ==========================================================================
  // 5. SOURCE FOLDER & SINGLE IMAGE LOADERS
  // ==========================================================================
  els.btnSelectFolder.addEventListener("click", function () {
    if (csInterface.isInCEP() && window.cep && window.cep.fs && typeof window.cep.fs.showOpenDialogEx === "function") {
      var res = window.cep.fs.showOpenDialogEx(false, true, "Select Source Folder with Raster Icons (PNG/JPG)", "", []);
      if (!res || res.err !== 0 || !res.data || !res.data.length) return;
      sourceFolderPath = res.data[0];
      cepFileList = listRasterFilesInFolder(sourceFolderPath);
      els.folderInfo.textContent = sourceFolderPath + "  (" + cepFileList.length + " raster image(s) ready)";
      clearLog();
      log("Selected Source Folder: " + sourceFolderPath);
      log("Found " + cepFileList.length + " raster image(s).");

      if (cepFileList.length > 0) {
        var first = cepFileList[0];
        var base = first.split(/[\\/]/).pop().replace(/\.[^.]+$/, "");
        lastImageAbsPath = first;
        loadImagePrepared(cepFileToDataURL(first)).then(function (prep) {
          lastPrepared = prep;
          lastImageDataURL = prep.dataUrl;
          var traced = StrokeTracer.traceImageData(prep.imgData, getOptions());
          renderPreview(traced, base);
          log("Preview ready: " + base + " (" + traced.iconCount + " icon(s) detected)");
        }).catch(function (e) { log("Preview error: " + e.message); });
      }
    } else {
      els.browserFolderInput.click();
    }
  });

  els.browserFolderInput.addEventListener("change", function (e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    browserFileList = files.filter(function (f) { return /\.(png|jpe?g|webp|bmp)$/i.test(f.name) && !/_stroke\./i.test(f.name); });
    browserFileList.sort(function (a, b) { return a.name.localeCompare(b.name); });
    els.folderInfo.textContent = "Selected " + browserFileList.length + " raster image(s) (Browser Preview Mode)";
    clearLog();
    log("Loaded " + browserFileList.length + " image(s) in Browser Preview.");
    if (browserFileList.length > 0) {
      fileToDataURL(browserFileList[0]).then(loadImagePrepared).then(function (prep) {
        lastPrepared = prep;
        lastImageDataURL = prep.dataUrl;
        var base = browserFileList[0].name.replace(/\.[^.]+$/, "");
        renderPreview(StrokeTracer.traceImageData(prep.imgData, getOptions()), base);
      });
    }
  });

  var btnSingleTest = document.getElementById("btnStrokeSingleTest");
  if (btnSingleTest) {
    btnSingleTest.addEventListener("click", function () {
      if (csInterface.isInCEP() && window.cep && window.cep.fs && typeof window.cep.fs.showOpenDialogEx === "function") {
        var res = window.cep.fs.showOpenDialogEx(false, false, "Select Raster Icon Image (PNG/JPG)", sourceFolderPath || "", ["png", "jpg", "jpeg", "webp", "bmp"]);
        if (!res || res.err !== 0 || !res.data || !res.data.length) return;
        var absP = res.data[0];
        lastImageAbsPath = absP;
        var bName = absP.split(/[\\/]/).pop().replace(/\.[^.]+$/, "");
        log("Loading image: " + bName + "...");
        loadImagePrepared(cepFileToDataURL(absP)).then(function (prep) {
          lastPrepared = prep;
          lastImageDataURL = prep.dataUrl;
          var traced = StrokeTracer.traceImageData(prep.imgData, getOptions());
          renderPreview(traced, bName);
          log("Ready: " + bName + " (" + traced.iconCount + " icon(s) detected)");
        }).catch(function (err) { log("ERROR: " + err.message); });
      } else {
        els.singleImgInput.value = "";
        els.singleImgInput.click();
      }
    });
  }

  els.singleImgInput.addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    lastImageAbsPath = f.path || "";
    fileToDataURL(f).then(loadImagePrepared).then(function (prep) {
      lastPrepared = prep;
      lastImageDataURL = prep.dataUrl;
      var base = f.name.replace(/\.[^.]+$/, "");
      var traced = StrokeTracer.traceImageData(prep.imgData, getOptions());
      renderPreview(traced, base);
      log("Loaded: " + f.name + " (" + traced.iconCount + " icon(s) detected)");
    });
  });

  els.threshold.addEventListener("input", function () { els.threshVal.textContent = els.threshold.value; });
  els.smooth.addEventListener("input", function () { els.smoothVal.textContent = els.smooth.value; });

  // ==========================================================================
  // 6. OPEN SINGLE PREVIEW IN ILLUSTRATOR (ALL 6 ENGINES)
  // ==========================================================================
  els.btnOpenSingleAI.addEventListener("click", function () {
    if (!lastTracedResult && !lastGeneratedSVG) { log("Load a folder or test image first."); return; }
    var opts = getOptions();

    if (opts.engine === "gemini_pentool") {
      if (!lastPrepared) { log("ERROR: Load a test image first."); return; }
      log("Starting AI Pen-Tool Redraw (Gemini Free API) on " + lastTracedName + "...");
      callGeminiPenToolRedraw(lastPrepared, lastTracedResult, opts).then(function (svgText) {
        lastGeneratedSVG = svgText;
        els.previewBox.innerHTML = svgText;
        els.previewStats.textContent = "Gemini Pen-Tool SVG Ready!";
        if (csInterface.isInCEP()) {
          csInterface.evalScript("dmInsertStrokeSVGToActiveDoc('" + escJSX({
            svgContent: svgText,
            title: lastTracedName + "_PenTool",
            name: lastTracedName + "_PenTool",
            width: lastPrepared.width,
            height: lastPrepared.height,
            strokeColor: opts.strokeColor || "#000000",
            strokeWidth: opts.strokeWidth > 0 ? opts.strokeWidth : 2,
            newDoc: true
          }) + "')", function (r) { log("Gemini Pen-Tool -> Illustrator: " + r); });
        } else {
          log("Preview updated! Click Save Preview SVG to download.");
        }
      }).catch(function (err) { log("Gemini Pen-Tool ERROR: " + err.message); });
      return;
    }

    if (opts.engine === "vtracer_bw" || opts.engine === "vtracer_color") {
      var vtIn = lastImageAbsPath || (lastImageDataURL ? writeTempPNGForIllustrator(lastImageDataURL, lastTracedName) : "");
      if (!vtIn) { log("ERROR: Load a test image first."); return; }
      var vtOut = getTempPath("d360_vtracer_" + lastTracedName + ".svg");
      var cmode = opts.engine === "vtracer_color" ? "color" : "binary";
      log("Running VTracer (" + cmode + " spline) on " + lastTracedName + "...");
      runLocalVTracer(vtIn, vtOut, cmode).then(function (svgP) {
        csInterface.evalScript("dmImportSVGAndSaveAI('" + escJSX({ svgPath: svgP, saveAiPath: "", keepOpen: true }) + "')", function (r) { log("VTracer -> Illustrator: " + r); });
      }).catch(function (err) { log("VTracer ERROR: " + err.message); });
      return;
    }

    if (opts.engine === "cloud_ai") {
      if (!lastImageDataURL) { log("ERROR: Load a test image first."); return; }
      log("Sending image to Cloud AI Vectorizer API...");
      callCloudAIVectorize(lastImageDataURL).then(function (svgText) {
        lastGeneratedSVG = svgText;
        els.previewBox.innerHTML = svgText;
        var tmpSvg = getTempPath("d360_cloud_" + lastTracedName + ".svg");
        writeTextFile(tmpSvg, svgText);
        if (csInterface.isInCEP()) {
          csInterface.evalScript("dmImportSVGAndSaveAI('" + escJSX({ svgPath: tmpSvg, saveAiPath: "", keepOpen: true }) + "')", function (r) { log("Cloud AI -> Illustrator: " + r); });
        } else {
          log("Cloud AI SVG ready! Click Save Preview SVG.");
        }
      }).catch(function (err) { log("Cloud AI ERROR: " + err.message); });
      return;
    }

    if ((opts.engine === "vec_to_stroke" || opts.engine === "exact_outline") && csInterface.isInCEP()) {
      var tmpPath = lastImageDataURL ? writeTempPNGForIllustrator(lastImageDataURL, lastTracedName) : lastImageAbsPath;
      if (!tmpPath) { log("ERROR: Could not prepare image for Illustrator."); return; }
      log("Running Adobe Illustrator Native C++ Trace on " + lastTracedName + "...");
      sendNativeLineArtToAI(tmpPath, lastTracedName + "_stroke", opts, lastTracedResult, "", "", true)
        .then(function (res) { log("Illustrator: " + res); });
    } else if (lastTracedResult) {
      sendSchneiderToAI(lastTracedResult, lastTracedName + "_stroke", "", true).then(function (res) {
        if (res === "STANDALONE_PREVIEW") log("Preview Mode: Open inside Illustrator to create native .AI editable strokes.");
        else log("Illustrator: " + res);
      });
    }
  });

  // Save Preview SVG with Native Save As dialog
  els.btnDownloadSingleSVG.addEventListener("click", function () {
    var svg = lastGeneratedSVG || (lastTracedResult ? StrokeTracer.toSVG(lastTracedResult) : "");
    if (!svg) { log("Load or generate an icon preview first."); return; }
    var fname = lastTracedName + "_pentool_stroke.svg";
    if (csInterface.isInCEP() && window.cep && window.cep.fs && window.cep.fs.showSaveDialogEx) {
      var res = window.cep.fs.showSaveDialogEx("Save Editable Stroke SVG", sourceFolderPath || "", ["svg"], fname, "SVG File (*.svg)");
      if (res && res.err === 0 && res.data) {
        var p = res.data.toLowerCase().endsWith(".svg") ? res.data : (res.data + ".svg");
        writeTextFile(p, svg);
        log("Saved Editable Stroke SVG: " + p);
      }
    } else {
      var blob = new Blob([svg], { type: "image/svg+xml" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = fname; a.click();
      log("Downloaded: " + fname);
    }
  });

  // ==========================================================================
  // 7. AUTOMATIC BATCH FOLDER PROCESSOR (CLEAN UNIFIED ROUTER FOR ALL 6 ENGINES)
  // ==========================================================================
  els.btnStartBatch.addEventListener("click", function () {
    if (isRunning) return;
    var inCEP = csInterface.isInCEP() && cepFileList.length > 0;
    var total = inCEP ? cepFileList.length : browserFileList.length;
    if (total === 0) {
      log("ERROR: Select a Source Folder containing PNG/JPG images first.");
      return;
    }

    isRunning = true;
    els.btnStartBatch.disabled = true;
    els.progressBar.classList.add("show");
    els.progressFill.style.width = "0%";
    clearLog();

    var fmt = els.format.value;
    var opts = getOptions();
    var keepOpen = els.keepOpen.checked;
    log("Batch Started: " + total + " image(s) | Engine: " + opts.engine.toUpperCase() + " | Format: " + fmt.toUpperCase());

    var idx = 0;
    function processNext() {
      if (idx >= total) {
        isRunning = false;
        els.btnStartBatch.disabled = false;
        els.progressFill.style.width = "100%";
        log("ALL DONE! " + total + " file(s) converted & auto-saved in Source Folder.");
        return;
      }

      var currentNum = idx + 1;
      els.progressFill.style.width = Math.round((idx / total) * 100) + "%";

      if (inCEP) {
        var absPath = cepFileList[idx];
        var baseName = absPath.split(/[\\/]/).pop().replace(/\.[^.]+$/, "");
        var outSvgPath = (fmt === "svg" || fmt === "both") ? joinPath(sourceFolderPath, baseName + "_stroke.svg") : "";
        var outAiPath = (fmt === "ai" || fmt === "both") ? joinPath(sourceFolderPath, baseName + "_stroke.ai") : "";

        log("[" + currentNum + "/" + total + "] " + baseName + "...");

        loadImagePrepared(cepFileToDataURL(absPath))
          .then(function (prep) {
            var traced = StrokeTracer.traceImageData(prep.imgData, opts);
            renderPreview(traced, baseName);

            if (opts.engine === "gemini_pentool") {
              return callGeminiPenToolRedraw(prep, traced, opts).then(function (svgText) {
                var savedSvg = outSvgPath || getTempPath("d360_gp_" + baseName + ".svg");
                writeTextFile(savedSvg, svgText);
                if (outSvgPath) log("  -> Gemini Pen-Tool Saved SVG: " + baseName + "_stroke.svg");
                if (outAiPath) {
                  return new Promise(function (res2) {
                    csInterface.evalScript("dmInsertStrokeSVGToActiveDoc('" + escJSX({
                      svgPath: savedSvg, title: baseName + "_PenTool", name: baseName + "_PenTool",
                      width: prep.width, height: prep.height,
                      strokeColor: opts.strokeColor || "#000000",
                      strokeWidth: opts.strokeWidth > 0 ? opts.strokeWidth : 2,
                      newDoc: true, saveAiPath: outAiPath, keepOpen: keepOpen
                    }) + "')", function (r) { log("  -> " + r); res2(); });
                  });
                }
              });
            } else if (opts.engine === "vtracer_bw" || opts.engine === "vtracer_color") {
              var vtSvg = outSvgPath || getTempPath("d360_vt_" + baseName + ".svg");
              var vMode = opts.engine === "vtracer_color" ? "color" : "binary";
              return runLocalVTracer(absPath, vtSvg, vMode).then(function () {
                if (outSvgPath) log("  -> VTracer Saved SVG: " + baseName + "_stroke.svg");
                if (outAiPath) {
                  return new Promise(function (res2) {
                    csInterface.evalScript("dmImportSVGAndSaveAI('" + escJSX({ svgPath: vtSvg, saveAiPath: outAiPath, keepOpen: keepOpen }) + "')", function (r) { log("  -> " + r); res2(); });
                  });
                }
              });
            } else if (opts.engine === "cloud_ai") {
              return callCloudAIVectorize(prep.dataUrl).then(function (svgText) {
                var savedSvg = outSvgPath || getTempPath("d360_cl_" + baseName + ".svg");
                writeTextFile(savedSvg, svgText);
                if (outSvgPath) log("  -> Cloud AI Saved SVG: " + baseName + "_stroke.svg");
                if (outAiPath) {
                  return new Promise(function (res2) {
                    csInterface.evalScript("dmImportSVGAndSaveAI('" + escJSX({ svgPath: savedSvg, saveAiPath: outAiPath, keepOpen: keepOpen }) + "')", function (r) { log("  -> " + r); res2(); });
                  });
                }
              });
            } else if (opts.engine === "vec_to_stroke" || opts.engine === "exact_outline") {
              var traceImgPath = prep.upscaled ? (writeTempPNGForIllustrator(prep.dataUrl, baseName) || absPath) : absPath;
              return sendNativeLineArtToAI(traceImgPath, baseName + "_stroke", opts, traced, outAiPath, outSvgPath, keepOpen)
                .then(function (res) { log("  -> " + res); });
            } else {
              if (outSvgPath) {
                writeTextFile(outSvgPath, StrokeTracer.toSVG(traced));
                log("  -> Saved SVG: " + baseName + "_stroke.svg");
              }
              if (outAiPath) {
                return sendSchneiderToAI(traced, baseName + "_stroke", outAiPath, keepOpen)
                  .then(function (res) { log("  -> Illustrator AI: " + res); });
              }
            }
          })
          .catch(function (err) { log("  -> ERROR on " + baseName + ": " + err.message); })
          .then(function () {
            idx++;
            setTimeout(processNext, 70);
          });
      } else {
        var fileObj = browserFileList[idx];
        var bName = fileObj.name.replace(/\.[^.]+$/, "");
        log("[" + currentNum + "/" + total + "] " + fileObj.name + "...");
        fileToDataURL(fileObj).then(loadImagePrepared).then(function (prep) {
          var traced = StrokeTracer.traceImageData(prep.imgData, opts);
          renderPreview(traced, bName);
          var blob = new Blob([StrokeTracer.toSVG(traced)], { type: "image/svg+xml" });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob); a.download = bName + "_stroke.svg"; a.click();
          log("  -> Exported SVG: " + bName + "_stroke.svg (" + traced.iconCount + " icons)");
        }).catch(function (err) { log("  -> ERROR: " + err.message); })
          .then(function () { idx++; setTimeout(processNext, 220); });
      }
    }

    processNext();
  });

  // ==========================================================================
  // 8. 1-CLICK ILLUSTRATOR PEN-TOOL REBUILD & POLISH TOOLBAR
  // ==========================================================================
  var btnPenRebuild = document.getElementById("btnPenToolRebuild");
  var btnPolish = document.getElementById("btnPolishLayer");
  var btnUnify = document.getElementById("btnUnifyStrokes");
  var btnF2S = document.getElementById("btnFillsToStrokes");
  var btnVec2Stroke = document.getElementById("btnVecToCenterStroke");

  if (btnPenRebuild) btnPenRebuild.addEventListener("click", function () {
    var o = getOptions();
    csInterface.evalScript("dmPenToolRebuildSelection('" + escJSX({ strokeColor: o.strokeColor, strokeWidth: o.strokeWidth }) + "')", function (r) {
      log("Pen-Tool Rebuild: " + r);
    });
  });
  if (btnPolish) btnPolish.addEventListener("click", function () {
    var o = getOptions();
    csInterface.evalScript("dmPolishActiveLayer('" + escJSX({ strokeColor: o.strokeColor, strokeWidth: o.strokeWidth || 2 }) + "')", function (r) {
      log("Polish: " + r);
    });
  });
  if (btnUnify) btnUnify.addEventListener("click", function () {
    var o = getOptions();
    csInterface.evalScript("dmUnifyDocStrokes('" + escJSX({ strokeColor: o.strokeColor, strokeWidth: o.strokeWidth || 2 }) + "')", function (r) {
      log("Unify: " + r);
    });
  });
  if (btnF2S) btnF2S.addEventListener("click", function () {
    var o = getOptions();
    csInterface.evalScript("dmFillsToStrokes('" + escJSX({ strokeColor: o.strokeColor, strokeWidth: o.strokeWidth || 2 }) + "')", function (r) {
      log("Fills->Strokes: " + r);
    });
  });
  if (btnVec2Stroke) btnVec2Stroke.addEventListener("click", function () {
    var o = getOptions();
    csInterface.evalScript("dmVectorToCenterlineStroke('" + escJSX({ strokeColor: o.strokeColor, strokeWidth: o.strokeWidth }) + "')", function (r) {
      log("Vector->Stroke: " + r);
    });
  });

})();
