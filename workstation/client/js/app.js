/**
 * Dieline Maker Pro v2.2 — Main Panel Controller
 * Includes Native Save-Location Picker (CEP showSaveDialogEx + Node fs + Browser File System Access API)
 */
(function () {
  "use strict";

  var csInterface = new CSInterface();
  var mockup3d = null;
  var currentDieline = null;
  var currentBarcode = null;
  var nodeFS = null;
  var nodePath = null;
  try {
    var _req = (typeof window.cep_node !== "undefined" && window.cep_node.require)
      ? window.cep_node.require
      : (typeof require === "function" ? require : null);
    if (_req) {
      nodeFS = _req("fs");
      nodePath = _req("path");
    }
  } catch (e) {}

  var els = {
    hostStatus: document.getElementById("hostStatus"),
    toast: document.getElementById("toast"),
    sizePreset: document.getElementById("sizePreset"),
    boxSearch: document.getElementById("boxSearch"),
    boxType: document.getElementById("boxType"),
    typeDesc: document.getElementById("typeDesc"),
    unit: document.getElementById("unit"),
    dimL: document.getElementById("dimL"),
    dimW: document.getElementById("dimW"),
    dimH: document.getElementById("dimH"),
    dimT: document.getElementById("dimT"),
    dimGlue: document.getElementById("dimGlue"),
    dimTuck: document.getElementById("dimTuck"),
    dimBleed: document.getElementById("dimBleed"),
    customOptions: document.getElementById("customOptions"),
    optTopTuck: document.getElementById("optTopTuck"),
    optBottomTuck: document.getElementById("optBottomTuck"),
    optDustFlaps: document.getElementById("optDustFlaps"),
    optWindow: document.getElementById("optWindow"),
    optHangTab: document.getElementById("optHangTab"),
    winW: document.getElementById("winW"),
    winH: document.getElementById("winH"),
    svgPreview: document.getElementById("svgPreview"),
    sheetSize: document.getElementById("sheetSize"),
    includeDims: document.getElementById("includeDims"),
    lockLayers: document.getElementById("lockLayers"),
    useActiveDoc: document.getElementById("useActiveDoc"),
    btnGenerateAI: document.getElementById("btnGenerateAI"),
    btnExportSVG: document.getElementById("btnExportSVG"),
    canvas3d: document.getElementById("canvas3d"),
    foldSlider: document.getElementById("foldSlider"),
    foldVal: document.getElementById("foldVal"),
    autoRotate: document.getElementById("autoRotate"),
    matSelect: document.getElementById("matSelect"),
    bgSelect: document.getElementById("bgSelect"),
    texModeSelect: document.getElementById("texModeSelect"),
    customColorWrap: document.getElementById("customColorWrap"),
    customColor: document.getElementById("customColor"),
    btnSyncAI: document.getElementById("btnSyncAI"),
    artUpload: document.getElementById("artUpload"),
    btnClearArt: document.getElementById("btnClearArt"),
    wireframeToggle: document.getElementById("wireframeToggle"),
    btnQuickPNG: document.getElementById("btnQuickPNG"),
    btnQuickOBJ: document.getElementById("btnQuickOBJ"),
    btnQuickHTML: document.getElementById("btnQuickHTML"),
    btnExportPNG: document.getElementById("btnExportPNG"),
    btnExportMultiPNG: document.getElementById("btnExportMultiPNG"),
    btnExportOBJ: document.getElementById("btnExportOBJ"),
    btnExport3DHTML: document.getElementById("btnExport3DHTML"),
    vidAnim: document.getElementById("vidAnim"),
    vidAspect: document.getElementById("vidAspect"),
    vidDuration: document.getElementById("vidDuration"),
    vidProgress: document.getElementById("vidProgress"),
    vidProgressFill: document.getElementById("vidProgressFill"),
    btnExportVideo: document.getElementById("btnExportVideo"),
    btnClipMask: document.getElementById("btnClipMask"),
    btnReleaseMask: document.getElementById("btnReleaseMask"),
    btnClipBleed: document.getElementById("btnClipBleed"),
    btnSwatchCard: document.getElementById("btnSwatchCard"),
    btnCenterAB: document.getElementById("btnCenterAB"),
    btnFitAB: document.getElementById("btnFitAB"),
    btnSafeGuides: document.getElementById("btnSafeGuides"),
    bcFormat: document.getElementById("bcFormat"),
    bcValue: document.getElementById("bcValue"),
    bcPreview: document.getElementById("bcPreview"),
    btnInsertBarcode: document.getElementById("btnInsertBarcode"),
    btnDownloadBarcode: document.getElementById("btnDownloadBarcode"),
    calcSheet: document.getElementById("calcSheet"),
    calcGsm: document.getElementById("calcGsm"),
    calcQty: document.getElementById("calcQty"),
    kpiUp: document.getElementById("kpiUp"),
    kpiSheets: document.getElementById("kpiSheets"),
    kpiWaste: document.getElementById("kpiWaste"),
    kpiWeight: document.getElementById("kpiWeight"),
    btnPreflight: document.getElementById("btnPreflight"),
    btnOutlineText: document.getElementById("btnOutlineText"),
    btnPrintPDF: document.getElementById("btnPrintPDF"),
    preflightOut: document.getElementById("preflightOut")
  };

  function showToast(msg, isError) {
    els.toast.textContent = msg;
    els.toast.className = "toast show" + (isError ? " error" : "");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { els.toast.className = "toast"; }, 5000);
  }

  function dataURLToBlob(dataURL) {
    var parts = dataURL.split(",");
    var mime = parts[0].match(/:(.*?);/)[1];
    var bin = atob(parts[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  function fallbackDownloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  /**
   * Universal Save-With-Location-Picker
   * 1) In Adobe Illustrator CEP: Native OS "Save As..." dialog via window.cep.fs.showSaveDialogEx
   * 2) In Chrome/Edge Preview: Native OS "Save As..." dialog via window.showSaveFilePicker
   * 3) Fallback: Standard browser download
   */
  function saveFileWithDialog(opts) {
    // opts: { title, defaultName, ext, mime, text, dataUrl, blob, onSaved }
    var extClean = (opts.ext || "bin").replace(/^\./, "");

    // 1. Adobe CEP Native Save Dialog
    if (csInterface.isInCEP() && window.cep && window.cep.fs && typeof window.cep.fs.showSaveDialogEx === "function") {
      var res = window.cep.fs.showSaveDialogEx(
        opts.title || "Save File",
        "",
        [extClean],
        opts.defaultName,
        extClean.toUpperCase() + " File (*." + extClean + ")"
      );
      if (!res || res.err !== 0 || !res.data) {
        showToast("Save cancelled.");
        return;
      }
      var targetPath = res.data;
      if (targetPath.toLowerCase().slice(-(extClean.length + 1)) !== "." + extClean.toLowerCase()) {
        targetPath += "." + extClean;
      }

      if (opts.text !== undefined) {
        if (nodeFS) nodeFS.writeFileSync(targetPath, opts.text, "utf8");
        else window.cep.fs.writeFile(targetPath, opts.text, window.cep.encoding.UTF8);
        showToast("Saved: " + targetPath);
        if (opts.onSaved) opts.onSaved(targetPath);
        return;
      }

      if (opts.dataUrl) {
        var b64 = opts.dataUrl.split(",")[1];
        if (nodeFS) nodeFS.writeFileSync(targetPath, Buffer.from(b64, "base64"));
        else window.cep.fs.writeFile(targetPath, b64, window.cep.encoding.Base64);
        showToast("Saved: " + targetPath);
        if (opts.onSaved) opts.onSaved(targetPath);
        return;
      }

      if (opts.blob) {
        var reader = new FileReader();
        reader.onload = function () {
          var arrBuf = reader.result;
          if (nodeFS) {
            nodeFS.writeFileSync(targetPath, Buffer.from(new Uint8Array(arrBuf)));
          } else {
            var bytes = new Uint8Array(arrBuf), bin = "";
            for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
            window.cep.fs.writeFile(targetPath, btoa(bin), window.cep.encoding.Base64);
          }
          showToast("Saved: " + targetPath);
          if (opts.onSaved) opts.onSaved(targetPath);
        };
        reader.readAsArrayBuffer(opts.blob);
        return;
      }
    }

    // 2. Modern Browser Native Save Picker (Chrome / Edge)
    var outBlob = opts.blob || (opts.dataUrl ? dataURLToBlob(opts.dataUrl) : new Blob([opts.text || ""], { type: opts.mime || "application/octet-stream" }));
    if (typeof window.showSaveFilePicker === "function") {
      var acceptObj = {};
      acceptObj[opts.mime || "application/octet-stream"] = ["." + extClean];
      window.showSaveFilePicker({
        suggestedName: opts.defaultName,
        types: [{ description: extClean.toUpperCase() + " File", accept: acceptObj }]
      }).then(function (handle) {
        return handle.createWritable().then(function (writable) {
          return writable.write(outBlob).then(function () { return writable.close(); });
        });
      }).then(function () {
        showToast("Saved: " + opts.defaultName);
        if (opts.onSaved) opts.onSaved(opts.defaultName);
      }).catch(function (err) {
        if (err && err.name === "AbortError") showToast("Save cancelled.");
        else { fallbackDownloadBlob(outBlob, opts.defaultName); showToast("Downloaded: " + opts.defaultName); }
      });
      return;
    }

    // 3. Fallback
    fallbackDownloadBlob(outBlob, opts.defaultName);
    showToast("Downloaded: " + opts.defaultName);
  }

  /**
   * Save Multi-Angle PNG Pack into a User-Selected Folder (CEP or Directory Picker)
   */
  function saveMultiAnglePackWithFolder(baseName, pack) {
    // 1. CEP Folder Picker
    if (csInterface.isInCEP() && window.cep && window.cep.fs && typeof window.cep.fs.showOpenDialogEx === "function") {
      var res = window.cep.fs.showOpenDialogEx(false, true, "Select Folder to Save 4-Angle 3D Mockup Pack", "", []);
      if (!res || res.err !== 0 || !res.data || !res.data.length) {
        showToast("Folder selection cancelled.");
        return;
      }
      var folder = res.data[0];
      pack.forEach(function (item) {
        var fname = baseName + "_" + item.angle + ".png";
        var fullPath = nodePath ? nodePath.join(folder, fname) : (folder + "/" + fname);
        var b64 = item.dataUrl.split(",")[1];
        if (nodeFS) nodeFS.writeFileSync(fullPath, Buffer.from(b64, "base64"));
        else window.cep.fs.writeFile(fullPath, b64, window.cep.encoding.Base64);
      });
      showToast("Saved all 4 HD PNG angles to: " + folder);
      return;
    }

    // 2. Browser Directory Picker
    if (typeof window.showDirectoryPicker === "function") {
      window.showDirectoryPicker({ mode: "readwrite" }).then(function (dirHandle) {
        var jobs = pack.map(function (item) {
          var fname = baseName + "_" + item.angle + ".png";
          return dirHandle.getFileHandle(fname, { create: true }).then(function (fh) {
            return fh.createWritable().then(function (w) {
              return w.write(dataURLToBlob(item.dataUrl)).then(function () { return w.close(); });
            });
          });
        });
        return Promise.all(jobs);
      }).then(function () {
        showToast("Saved all 4 HD PNG angles to selected folder!");
      }).catch(function (err) {
        if (err && err.name === "AbortError") showToast("Folder selection cancelled.");
        else {
          pack.forEach(function (item, idx) {
            setTimeout(function () { fallbackDownloadBlob(dataURLToBlob(item.dataUrl), baseName + "_" + item.angle + ".png"); }, idx * 250);
          });
        }
      });
      return;
    }

    // 3. Fallback
    pack.forEach(function (item, idx) {
      setTimeout(function () { fallbackDownloadBlob(dataURLToBlob(item.dataUrl), baseName + "_" + item.angle + ".png"); }, idx * 250);
    });
    showToast("Downloading 4-Angle Studio PNG Pack...");
  }

  function escJSX(obj) {
    var json = JSON.stringify(obj).replace(/[\u007F-\uFFFF]/g, function (ch) {
      return "\\u" + ("0000" + ch.charCodeAt(0).toString(16)).slice(-4);
    });
    return json.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  function runQuickAI(fnCall, previewMsg) {
    csInterface.evalScript(fnCall, function (res) {
      if (res === "STANDALONE_PREVIEW") showToast(previewMsg || "Preview Mode: Open inside Adobe Illustrator to run this action.");
      else if (res && res.indexOf("OK:") === 0) showToast(res.substring(3));
      else showToast(res || "Action failed.", true);
    });
  }

  function renderBoxTypeDropdown(filterText) {
    var q = (filterText || "").toLowerCase().trim();
    var prevVal = els.boxType.value;
    els.boxType.innerHTML = "";
    var groups = {};
    DielineEngine.CATALOG.forEach(function (item) {
      if (q && item.name.toLowerCase().indexOf(q) < 0 && item.category.toLowerCase().indexOf(q) < 0 && item.desc.toLowerCase().indexOf(q) < 0) return;
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    Object.keys(groups).forEach(function (cat) {
      var og = document.createElement("optgroup");
      og.label = cat;
      groups[cat].forEach(function (item) {
        var opt = document.createElement("option");
        opt.value = item.id; opt.textContent = item.name;
        og.appendChild(opt);
      });
      els.boxType.appendChild(og);
    });
    if (prevVal && els.boxType.querySelector('option[value="' + prevVal + '"]')) els.boxType.value = prevVal;
  }

  function populateDropdowns() {
    renderBoxTypeDropdown("");


    ProTools.SIZE_PRESETS.forEach(function (p, idx) {
      var opt = document.createElement("option");
      opt.value = String(idx); opt.textContent = p.label;
      els.sizePreset.appendChild(opt);
    });

    ProTools.PRESS_SHEETS.forEach(function (s) {
      var opt = document.createElement("option");
      opt.value = s.id; opt.textContent = s.name;
      if (s.id === "23x36") opt.selected = true;
      els.calcSheet.appendChild(opt);
    });
  }

  function applyValues(obj) {
    var u = els.unit.value;
    var scale = u === "cm" ? 0.1 : u === "in" ? 1 / 25.4 : 1;
    function fmt(v) { return Math.round(v * scale * 100) / 100; }
    els.dimL.value = fmt(obj.L); els.dimW.value = fmt(obj.W); els.dimH.value = fmt(obj.H);
    els.dimT.value = fmt(obj.t); els.dimGlue.value = fmt(obj.glue);
    els.dimTuck.value = fmt(obj.tuck); els.dimBleed.value = fmt(obj.bleed);
  }

  function applyDefaultsForType(typeId) {
    var meta = DielineEngine.CATALOG.find(function (c) { return c.id === typeId; });
    if (!meta) return;
    applyValues(meta.defaults);
    els.typeDesc.textContent = meta.desc;
    els.customOptions.style.display = typeId === "custom_box" ? "block" : "none";
  }

  function readParams() {
    return {
      type: els.boxType.value, unit: els.unit.value,
      L: parseFloat(els.dimL.value) || 80, W: parseFloat(els.dimW.value) || 50, H: parseFloat(els.dimH.value) || 130,
      t: parseFloat(els.dimT.value) || 0.4, glue: parseFloat(els.dimGlue.value) || 0,
      tuck: parseFloat(els.dimTuck.value) || 0, bleed: parseFloat(els.dimBleed.value) || 3,
      optTopTuck: els.optTopTuck.checked, optBottomTuck: els.optBottomTuck.checked,
      optDustFlaps: els.optDustFlaps.checked, optWindow: els.optWindow.checked,
      optHangTab: els.optHangTab.checked, winW: parseFloat(els.winW.value) || 45, winH: parseFloat(els.winH.value) || 55
    };
  }

  function refreshNestingCalculator() {
    if (!currentDieline) return;
    var r = ProTools.calcSheetNesting(
      currentDieline.bounds.width, currentDieline.bounds.height,
      els.calcSheet.value, parseFloat(els.calcGsm.value) || 300, parseInt(els.calcQty.value, 10) || 1000
    );
    els.kpiUp.textContent = r.bestUp + " up (" + r.orientation + ")";
    els.kpiSheets.textContent = r.sheetsNeeded > 0 ? r.sheetsNeeded.toLocaleString() + " sheets" : "N/A";
    els.kpiWaste.textContent = r.wastePct + "%";
    els.kpiWeight.textContent = r.unitWeightG + "g / " + r.totalWeightKg + "kg";
  }

  function refreshBarcode() {
    currentBarcode = els.bcFormat.value === "ean13"
      ? ProTools.encodeEAN13(els.bcValue.value)
      : ProTools.encodeCode39(els.bcValue.value);
    els.bcPreview.innerHTML = ProTools.barcodeToSVG(currentBarcode);
  }

  function refreshAll() {
    currentDieline = DielineEngine.generate(readParams());
    els.svgPreview.innerHTML = DielineEngine.toSVG(currentDieline);
    els.sheetSize.textContent = "Sheet: " + Math.round(currentDieline.bounds.width) + " × " + Math.round(currentDieline.bounds.height) + " mm";
    if (mockup3d) mockup3d.setParams(currentDieline.params);
    refreshNestingCalculator();
  }

  function doDownloadPNG() {
    var fname = (currentDieline ? currentDieline.title : "3D_Mockup") + "_1600px.png";
    saveFileWithDialog({
      title: "Save 3D Mockup HD PNG",
      defaultName: fname,
      ext: "png",
      mime: "image/png",
      dataUrl: mockup3d.exportSnapshotPNG(1600, 1600)
    });
  }

  function doDownloadOBJ() {
    var title = currentDieline ? currentDieline.title : "Packaging_3D";
    saveFileWithDialog({
      title: "Save 3D Packaging Model (.OBJ)",
      defaultName: title + ".obj",
      ext: "obj",
      mime: "text/plain",
      text: mockup3d.exportOBJ(title)
    });
  }

  function doDownload3DHTML() {
    var title = currentDieline ? currentDieline.title : "Packaging_3D_Mockup";
    saveFileWithDialog({
      title: "Save Interactive 3D Viewer (.HTML)",
      defaultName: title + "_3D_Viewer.html",
      ext: "html",
      mime: "text/html",
      text: mockup3d.exportInteractiveHTML(title)
    });
  }

  function initTabs() {
    var btns = document.querySelectorAll(".tab-btn");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        btns.forEach(function (b) { b.classList.remove("active"); });
        document.querySelectorAll(".tab-pane").forEach(function (p) { p.classList.remove("active"); });
        btn.classList.add("active");
        document.getElementById(btn.getAttribute("data-tab")).classList.add("active");
      });
    });
  }

  function initEvents() {
    els.sizePreset.addEventListener("change", function () {
      var idx = parseInt(els.sizePreset.value, 10);
      if (isNaN(idx)) return;
      var p = ProTools.SIZE_PRESETS[idx];
      els.boxType.value = p.type; applyDefaultsForType(p.type); applyValues(p); refreshAll();
      showToast("Loaded preset: " + p.label);
    });

    if (els.boxSearch) els.boxSearch.addEventListener("input", function () { renderBoxTypeDropdown(els.boxSearch.value); if (els.boxType.value) { applyDefaultsForType(els.boxType.value); refreshAll(); } });
    els.boxType.addEventListener("change", function () {
      els.sizePreset.value = ""; applyDefaultsForType(els.boxType.value); refreshAll();
    });

    ["unit", "dimL", "dimW", "dimH", "dimT", "dimGlue", "dimTuck", "dimBleed",
     "optTopTuck", "optBottomTuck", "optDustFlaps", "optWindow", "optHangTab", "winW", "winH"]
      .forEach(function (id) {
        els[id].addEventListener("input", refreshAll);
        els[id].addEventListener("change", refreshAll);
      });

    els.btnGenerateAI.addEventListener("click", function () {
      if (!currentDieline) return;
      var payload = {
        title: currentDieline.title, bounds: currentDieline.bounds,
        cut: currentDieline.cut, crease: currentDieline.crease,
        bleed: currentDieline.bleed, dimensions: currentDieline.dimensions,
        specSummary: currentDieline.specSummary,
        includeDimensions: els.includeDims.checked,
        lockDielineLayers: els.lockLayers.checked,
        useActiveDoc: els.useActiveDoc.checked
      };
      runQuickAI("dmGenerateDieline('" + escJSX(payload) + "')", "Preview Mode: Open inside Adobe Illustrator to generate native vector layers.");
    });

    els.btnExportSVG.addEventListener("click", function () {
      if (!currentDieline) return;
      saveFileWithDialog({
        title: "Save 2D Vector Dieline (.SVG)",
        defaultName: currentDieline.title + ".svg",
        ext: "svg",
        mime: "image/svg+xml",
        text: DielineEngine.toSVG(currentDieline)
      });
    });

    // 3D Controls
    els.foldSlider.addEventListener("input", function () {
      var v = parseInt(els.foldSlider.value, 10);
      els.foldVal.textContent = v + "%";
      if (mockup3d) mockup3d.fold = v / 100;
    });
    els.autoRotate.addEventListener("change", function () { if (mockup3d) mockup3d.autoRotate = els.autoRotate.checked; });
    document.querySelectorAll(".angle-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var ang = btn.getAttribute("data-angle");
        mockup3d.setAnglePreset(ang);
        if (ang === "flat") { els.foldSlider.value = 5; els.foldVal.textContent = "5%"; }
      });
    });
    els.matSelect.addEventListener("change", function () {
      els.customColorWrap.style.display = els.matSelect.value === "custom" ? "block" : "none";
      mockup3d.materialKey = els.matSelect.value;
    });
    els.customColor.addEventListener("input", function () { mockup3d.customColor = els.customColor.value; });
    els.bgSelect.addEventListener("change", function () { mockup3d.bgMode = els.bgSelect.value; });
    els.texModeSelect.addEventListener("change", function () { mockup3d.textureMode = els.texModeSelect.value; });
    els.wireframeToggle.addEventListener("change", function () { mockup3d.showWireframe = els.wireframeToggle.checked; });

    var boxSyncBusy = false;
    function syncBoxFromIllustrator(silent) {
      if (boxSyncBusy) return;
      boxSyncBusy = true;
      csInterface.evalScript("dmExportArtboardPNG(" + (silent ? "true" : "false") + ")", function (res) {
        if (res === "UNCHANGED") { boxSyncBusy = false; return; }
        boxSyncBusy = false;
        if (res === "STANDALONE_PREVIEW") {
          if (!silent) showToast("Preview Mode: Use 'Upload Design' to test artwork outside Illustrator.");
          return;
        }
        if (res && res.indexOf("OK:") === 0) {
          var p = res.substring(3), dataUrl = "";
          try {
            var _req = (typeof window.cep_node !== "undefined" && window.cep_node.require) ? window.cep_node.require : (typeof require === "function" ? require : null);
            if (_req) dataUrl = "data:image/png;base64," + _req("fs").readFileSync(p).toString("base64");
          } catch (e) {}
          if (!dataUrl && window.cep && window.cep.fs && window.cep.fs.readFile) {
            var rf = window.cep.fs.readFile(p, window.cep.encoding.Base64);
            if (rf && rf.err === 0 && rf.data) dataUrl = "data:image/png;base64," + rf.data;
          }
          if (!dataUrl) dataUrl = "file:///" + p.replace(/^\/+/, "") + "?t=" + Date.now();
          mockup3d.setArtworkDataURL(dataUrl, function (ok) {
            if (!silent) showToast(ok ? "Design synced from Illustrator to 3D Box Mockup!" : "Could not load exported PNG.", !ok);
          });
        } else if (!silent) {
          showToast("Sync Error: " + (res || "Open a document in Illustrator first."), true);
        }
      });
    }

    els.btnSyncAI.addEventListener("click", function () { syncBoxFromIllustrator(false); });

    var boxLiveSyncTimer = null;
    var chkBoxLive = document.getElementById("boxLiveSyncAI");
    function updateBoxLiveSync() {
      if (boxLiveSyncTimer) { clearInterval(boxLiveSyncTimer); boxLiveSyncTimer = null; }
      if (chkBoxLive && chkBoxLive.checked && csInterface.isInCEP()) {
        boxLiveSyncTimer = setInterval(function () {
          var pane = document.getElementById("tab-dieline");
          if (pane && pane.classList.contains("active")) syncBoxFromIllustrator(true);
        }, 4000);
      }
    }
    if (chkBoxLive) {
      chkBoxLive.addEventListener("change", updateBoxLiveSync);
      if (csInterface.isInCEP()) updateBoxLiveSync();
    }

    els.artUpload.addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        mockup3d.setArtworkDataURL(ev.target.result, function () { showToast("Applied design: " + file.name); });
      };
      reader.readAsDataURL(file);
    });
    els.btnClearArt.addEventListener("click", function () { mockup3d.clearArtwork(); showToast("Cleared 3D artwork overlay."); });

    // 3D Mockup Downloads (All open Save As / Folder picker!)
    els.btnQuickPNG.addEventListener("click", doDownloadPNG);
    els.btnExportPNG.addEventListener("click", doDownloadPNG);
    els.btnQuickOBJ.addEventListener("click", doDownloadOBJ);
    els.btnExportOBJ.addEventListener("click", doDownloadOBJ);
    els.btnQuickHTML.addEventListener("click", doDownload3DHTML);
    var btnQV = document.getElementById("btnQuickVideo");
    if (btnQV) btnQV.addEventListener("click", function () { if (els.vidAnim) els.vidAnim.value = "turntable"; if (els.btnExportVideo) els.btnExportVideo.click(); });
    var btnPlayFold = document.getElementById("btnPlayFold2Dto3D");
    if (btnPlayFold) {
      btnPlayFold.addEventListener("click", function () {
        if (!mockup3d) return;
        btnPlayFold.disabled = true;
        mockup3d.playFold2Dto3D(
          function (pct) {
            if (els.foldSlider) els.foldSlider.value = pct;
            if (els.foldVal) els.foldVal.textContent = pct + "%";
          },
          function () { btnPlayFold.disabled = false; }
        );
      });
    }
    var btnQFoldVid = document.getElementById("btnQuickFoldVideo");
    if (btnQFoldVid) {
      btnQFoldVid.addEventListener("click", function () {
        if (els.vidAnim) els.vidAnim.value = "fold_assemble";
        if (els.btnExportVideo) els.btnExportVideo.click();
      });
    }

    els.btnExport3DHTML.addEventListener("click", doDownload3DHTML);

    els.btnExportMultiPNG.addEventListener("click", function () {
      var base = currentDieline ? currentDieline.title : "3D_Mockup";
      var pack = mockup3d.exportMultiAnglePNGs(1400);
      saveMultiAnglePackWithFolder(base, pack);
    });

    els.btnExportVideo.addEventListener("click", function () {
      els.btnExportVideo.disabled = true;
      els.vidProgress.classList.add("show");
      els.vidProgressFill.style.width = "0%";
      mockup3d.exportVideo(
        { animation: els.vidAnim.value, aspect: els.vidAspect.value, duration: parseInt(els.vidDuration.value, 10) || 6 },
        function (pct) { els.vidProgressFill.style.width = pct + "%"; },
        function (blob) {
          els.btnExportVideo.disabled = false;
          els.vidProgress.classList.remove("show");
          var fname = (currentDieline ? currentDieline.title : "3D_Mockup") + "_" + els.vidAnim.value + ".webm";
          saveFileWithDialog({
            title: "Save 3D Mockup Video (.WebM)",
            defaultName: fname,
            ext: "webm",
            mime: "video/webm",
            blob: blob
          });
        },
        function (errMsg) {
          els.btnExportVideo.disabled = false;
          els.vidProgress.classList.remove("show");
          showToast(errMsg, true);
        }
      );
    });

    // 1-Click Clipping Mask & Quick AI Actions
    els.btnClipMask.addEventListener("click", function () { runQuickAI("dmOneClickClipMask()"); });
    els.btnReleaseMask.addEventListener("click", function () { runQuickAI("dmReleaseClipMask()"); });
    els.btnClipBleed.addEventListener("click", function () { runQuickAI("dmClipArtworkToBleed()"); });
    els.btnSwatchCard.addEventListener("click", function () { runQuickAI("dmCreateSwatchCard()"); });
    els.btnCenterAB.addEventListener("click", function () { runQuickAI("dmCenterToArtboard()"); });
    els.btnFitAB.addEventListener("click", function () { runQuickAI("dmFitToArtboard()"); });
    els.btnSafeGuides.addEventListener("click", function () { runQuickAI("dmAddSafeGuides()"); });

    // Barcode
    els.bcFormat.addEventListener("change", refreshBarcode);
    els.bcValue.addEventListener("input", refreshBarcode);
    els.btnDownloadBarcode.addEventListener("click", function () {
      if (!currentBarcode) return;
      saveFileWithDialog({
        title: "Save Vector Barcode (.SVG)",
        defaultName: "Barcode_" + currentBarcode.label + ".svg",
        ext: "svg",
        mime: "image/svg+xml",
        text: ProTools.barcodeToSVG(currentBarcode)
      });
    });
    els.btnInsertBarcode.addEventListener("click", function () {
      if (!currentBarcode) return;
      var payload = { label: currentBarcode.label, widthMm: 38, heightMm: 22, bars: currentBarcode.bars };
      runQuickAI("dmInsertVectorBarcode('" + escJSX(payload) + "')", "Preview Mode: Open in Illustrator to insert vector barcode, or click Download SVG.");
    });

    // Sheet Nesting Calculator
    ["calcSheet", "calcGsm", "calcQty"].forEach(function (id) {
      els[id].addEventListener("input", refreshNestingCalculator);
      els[id].addEventListener("change", refreshNestingCalculator);
    });

    // Compliance Icons
    document.querySelectorAll(".icon-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var icon = ProTools.COMPLIANCE_ICONS[btn.getAttribute("data-icon")];
        if (!icon) return;
        runQuickAI("dmInsertComplianceIcon('" + escJSX({ id: icon.id, caption: icon.caption, sizeMm: 18, paths: icon.paths }) + "')");
      });
    });

    // Preflight, Outline Text & Print PDF (opens Save As dialog in Illustrator!)
    els.btnPreflight.addEventListener("click", function () {
      csInterface.evalScript("dmRunPreflight()", function (res) {
        if (res === "STANDALONE_PREVIEW") {
          els.preflightOut.textContent = "Preview Mode: Run inside Adobe Illustrator to audit CMYK color mode, live fonts, linked images, and spot dieline layers.";
        } else if (res && res.indexOf("OK:") === 0) {
          els.preflightOut.textContent = res.substring(3).split(" | ").join("\n");
          showToast("Pre-Press Preflight completed.");
        } else {
          els.preflightOut.textContent = res || "Preflight failed.";
          showToast(res || "Preflight failed.", true);
        }
      });
    });
    els.btnOutlineText.addEventListener("click", function () { runQuickAI("dmOutlineAllText()"); });
    els.btnPrintPDF.addEventListener("click", function () { runQuickAI("dmExportPrintPDF()"); });
  }

  populateDropdowns();
  initTabs();
  mockup3d = new Mockup3D(els.canvas3d);
  applyDefaultsForType("reverse_tuck");
  refreshAll();
  refreshBarcode();
  initEvents();

  if (!csInterface.isInCEP()) {
    els.hostStatus.textContent = "Browser Preview";
    els.hostStatus.classList.add("standalone");
  }

  // v14.2: Vector QR Code Maker Controller (100% Offline ISO 18004)
  (function initQRController() {
    var qrVal = document.getElementById("qrValue");
    var qrSize = document.getElementById("qrSizeMm");
    var qrStyle = document.getElementById("qrStyle");
    var qrCol = document.getElementById("qrColor");
    var qrPrev = document.getElementById("qrPreview");
    var btnInsQR = document.getElementById("btnInsertQR");
    var btnDlQR = document.getElementById("btnDownloadQR");
    if (!qrVal || typeof QREngine === "undefined") return;

    var currentQR = null;
    function refreshQR() {
      var txt = (qrVal.value || "https://design360n.com").trim();
      currentQR = QREngine.encode(txt);
      var svg = QREngine.toSVG(currentQR, {
        color: qrCol ? qrCol.value : "#000000",
        rounded: qrStyle && qrStyle.value === "rounded"
      });
      if (qrPrev) qrPrev.innerHTML = '<div style="width:116px;height:116px;">' + svg + '</div>';
    }

    qrVal.addEventListener("input", refreshQR);
    if (qrStyle) qrStyle.addEventListener("change", refreshQR);
    if (qrCol) qrCol.addEventListener("input", refreshQR);

    var presets = document.querySelectorAll(".qr-preset");
    for (var i = 0; i < presets.length; i++) {
      presets[i].addEventListener("click", function () {
        qrVal.value = this.getAttribute("data-qr");
        refreshQR();
      });
    }

    if (btnInsQR) {
      btnInsQR.addEventListener("click", function () {
        if (!currentQR) refreshQR();
        var col = qrCol ? qrCol.value : "#000000";
        var payload = {
          matrix: currentQR.matrix,
          sizeMm: parseFloat(qrSize ? qrSize.value : 30) || 30,
          color: col,
          use100K: col.toLowerCase() === "#000000",
          rounded: qrStyle && qrStyle.value === "rounded"
        };
        csInterface.evalScript("dmInsertVectorQRCode('" + escJSX(payload) + "')", function (res) {
          if (res === "STANDALONE_PREVIEW") showToast("Preview Mode: Open inside Illustrator to insert Vector QR.");
          else showToast(res || "Inserted Vector QR Code!", res && res.indexOf("ERROR:") === 0);
        });
      });
    }

    if (btnDlQR) {
      btnDlQR.addEventListener("click", function () {
        if (!currentQR) refreshQR();
        var svg = QREngine.toSVG(currentQR, {
          color: qrCol ? qrCol.value : "#000000",
          rounded: qrStyle && qrStyle.value === "rounded"
        });
        saveFileWithDialog({
          title: "Save Vector QR Code SVG",
          defaultName: "Design360n_QR_Code.svg",
          ext: "svg",
          mime: "image/svg+xml",
          text: svg
        });
      });
    }

    refreshQR();
  })();


  // v14.5: All Graphic Design, Print, Social Media & Merch Artboard Size Launcher (36 Presets)
  (function initDesignSizeLauncher() {
    var sel = document.getElementById("designSizeSelect");
    var meta = document.getElementById("designSizeMeta");
    var btn = document.getElementById("btnCreateDesignArtboard");
    if (!sel || !ProTools || !ProTools.DESIGN_SIZES) return;

    var groups = {};
    ProTools.DESIGN_SIZES.forEach(function (d, idx) {
      if (!groups[d.cat]) {
        groups[d.cat] = document.createElement("optgroup");
        groups[d.cat].label = d.cat;
        sel.appendChild(groups[d.cat]);
      }
      var opt = document.createElement("option");
      opt.value = String(idx);
      opt.textContent = d.name;
      groups[d.cat].appendChild(opt);
    });

    function updateMeta() {
      var d = ProTools.DESIGN_SIZES[parseInt(sel.value, 10) || 0];
      if (!d || !meta) return;
      meta.textContent = d.mode + " • " + d.w + " × " + d.h + " " + d.unit + (d.bleed > 0 ? (" • " + d.bleed + "mm Bleed") : " • Pixel-Exact");
    }
    sel.addEventListener("change", updateMeta);
    updateMeta();

    if (btn) {
      btn.addEventListener("click", function () {
        var d = ProTools.DESIGN_SIZES[parseInt(sel.value, 10) || 0];
        if (!d) return;
        csInterface.evalScript("dmCreateDesignArtboardAI('" + escJSX(d) + "')", function (res) {
          if (res === "STANDALONE_PREVIEW") showToast("Preview Mode: Open inside Illustrator to create artboard.");
          else showToast(res || "Artboard created!", res && res.indexOf("ERROR:") === 0);
        });
      });
    }
  })();


  // v15.0: Pro Tools Sub-Tab Switcher
  (function initProSubtabs() {
    var btns = document.querySelectorAll("#proSubtabs .subtab-btn");
    var panes = document.querySelectorAll("#tab-tools .pro-section");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () {
        var target = this.getAttribute("data-pro");
        for (var j = 0; j < btns.length; j++) btns[j].classList.remove("active");
        for (var k = 0; k < panes.length; k++) panes[k].classList.remove("active");
        this.classList.add("active");
        var el = document.getElementById(target);
        if (el) el.classList.add("active");
      });
    }
  })();


  // v16.2: Universal Pro Vector Calendar Controller (Unicode+ANSI, Any Cols x Rows, Box/No-Box)
  (function initCalendarController() {
    var elYear = document.getElementById("calYear");
    var elLang = document.getElementById("calLangMode");
    var elLayout = document.getElementById("calLayoutMode");
    var elSubFont = document.getElementById("calBnSubFont");
    var elBigPt = document.getElementById("calBigPt");
    var elSmallPt = document.getElementById("calSmallPt");
    var elBox  = document.getElementById("calBoxMode");
    var elMBox = document.getElementById("calMonthBox");
    var elCols = document.getElementById("calCols");
    var elRows = document.getElementById("calRows");
    var elCnt  = document.getElementById("calMonthCount");
    var elMonth = document.getElementById("calMonth");
    var elStyle = document.getElementById("calStyle");
    var elPreset = document.getElementById("calSizePreset");
    var elW = document.getElementById("calWidthMm");
    var elH = document.getElementById("calHeightMm");
    var elStart = document.getElementById("calWeekStart");
    var elTitleFont = document.getElementById("calTitleFont");
    var elDowFont = document.getElementById("calDowFont");
    var elFont = document.getElementById("calFont");
    var elFontFilter = document.getElementById("calFontFilter");
    var allInstalledFonts = [
      "Nirmala UI", "Hind Siliguri", "Kalpurush", "SolaimanLipi", "SutonnyMJ", "SutonnyOMJ",
      "Li Ador Noirrit ANSI", "Li Ador Noirrit", "Nikosh", "Montserrat", "Poppins", "Arial", "Helvetica", "Times New Roman"
    ];
    function setFontSelectVal(sel, val) {
      if (!sel || !val) return;
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === val) { sel.selectedIndex = i; return; }
      }
      var low = val.toLowerCase();
      for (var j = 0; j < sel.options.length; j++) {
        if (sel.options[j].value.toLowerCase().indexOf(low) >= 0) { sel.selectedIndex = j; return; }
      }
      var opt = document.createElement("option");
      opt.value = val; opt.textContent = val;
      sel.insertBefore(opt, sel.firstChild);
      sel.selectedIndex = 0;
    }
    function populateFontDropdowns(fontArr, filterText) {
      var q = String(filterText || "").trim().toLowerCase();
      var list = q ? fontArr.filter(function (f) { return f.toLowerCase().indexOf(q) >= 0; }) : fontArr;
      if (list.length === 0) list = fontArr;
      var sels = [elTitleFont, elDowFont, elFont, elSubFont];
      sels.forEach(function (sel) {
        if (!sel) return;
        var prev = sel.value;
        sel.innerHTML = "";
        var frag = document.createDocumentFragment();
        for (var k = 0; k < list.length; k++) {
          var o = document.createElement("option");
          o.value = list[k]; o.textContent = list[k];
          frag.appendChild(o);
        }
        sel.appendChild(frag);
        if (prev) setFontSelectVal(sel, prev);
      });
    }
    var elWknd = document.getElementById("calWeekend");
    var elAcc = document.getElementById("calAccent");
    var elTxt = document.getElementById("calTextCol");
    var elWkCol = document.getElementById("calWkndCol");
    var elPrev = document.getElementById("calPreview");
    var elUseAct = document.getElementById("calUseActiveDoc");
    var btnFonts = document.getElementById("btnCalLoadFonts");
    var btnGenAI = document.getElementById("btnGenCalAI");
    var btnDlSVG = document.getElementById("btnDlCalSVG");
    if (!elYear || typeof CalendarEngine === "undefined") return;

    CalendarEngine.STYLES.forEach(function (st) {
      var o = document.createElement("option"); o.value = st.id; o.textContent = st.name; elStyle.appendChild(o);
    });
    CalendarEngine.SIZE_PRESETS.forEach(function (sz) {
      var o = document.createElement("option"); o.value = sz.id; o.textContent = sz.name;
      if (sz.id === "wall_a4") o.selected = true;
      elPreset.appendChild(o);
    });
    populateFontDropdowns(allInstalledFonts, "");
    setFontSelectVal(elTitleFont, "Montserrat");
    setFontSelectVal(elDowFont, "Montserrat");
    setFontSelectVal(elFont, "Montserrat");
    setFontSelectVal(elSubFont, "Nirmala UI");
    if (elFontFilter) {
      elFontFilter.addEventListener("input", function () {
        populateFontDropdowns(allInstalledFonts, elFontFilter.value);
      });
    }

    function readPlan() {
      return CalendarEngine.buildCalendarPlan({
        year: elYear.value,
        langMode: elLang ? elLang.value : "bn_unicode",
        layoutMode: elLayout ? elLayout.value : "classic_dual",
        bnSubFont: elSubFont ? elSubFont.value : "Nirmala UI",
        bigPt: elBigPt ? elBigPt.value : 0,
        smallPt: elSmallPt ? elSmallPt.value : 0,
        boxMode: elBox ? elBox.value : "none",
        monthBox: !!(elMBox && elMBox.checked),
        cols: elCols ? elCols.value : 3,
        rows: elRows ? elRows.value : 4,
        monthCount: elCnt ? elCnt.value : 12,
        month: elMonth.value,
        style: elStyle.value, widthMm: elW.value, heightMm: elH.value,
        weekStart: elStart.value,
        titleFont: elTitleFont ? elTitleFont.value : elFont.value,
        dowFont: elDowFont ? elDowFont.value : elFont.value,
        fontName: elFont.value, weekendMode: elWknd.value,
        accentColor: elAcc.value, textColor: elTxt.value, weekendColor: elWkCol.value
      });
    }

    function refreshCal() {
      var plan = readPlan();
      if (elPrev) elPrev.innerHTML = CalendarEngine.toSVG(plan, false);
    }

    // Auto-update Month Count when user changes Cols or Rows (capped at 12)
    function syncGridCount() {
      var c = Math.max(1, Math.min(6, parseInt(elCols.value, 10) || 1));
      var r = Math.max(1, Math.min(12, parseInt(elRows.value, 10) || 1));
      elCnt.value = String(Math.min(12, c * r));
      refreshCal();
    }
    elCols.addEventListener("input", syncGridCount);
    elRows.addEventListener("input", syncGridCount);

    elPreset.addEventListener("change", function () {
      var sp = CalendarEngine.SIZE_PRESETS.find(function (x) { return x.id === elPreset.value; });
      if (sp) { elW.value = sp.w; elH.value = sp.h; refreshCal(); }
    });

    if (elLang) elLang.addEventListener("change", function () {
      var v = elLang.value;
      if (v === "bn_ansi") {
        setFontSelectVal(elTitleFont, "SutonnyMJ");
        setFontSelectVal(elDowFont, "SutonnyMJ");
        setFontSelectVal(elFont, "SutonnyMJ");
        setFontSelectVal(elSubFont, "SutonnyMJ");
      } else if (v === "bn_unicode") {
        setFontSelectVal(elTitleFont, "Nirmala UI");
        setFontSelectVal(elDowFont, "Nirmala UI");
        setFontSelectVal(elFont, "Nirmala UI");
        setFontSelectVal(elSubFont, "Nirmala UI");
      } else if (v === "en_bn_ansi") {
        setFontSelectVal(elTitleFont, "Montserrat");
        setFontSelectVal(elDowFont, "Montserrat");
        setFontSelectVal(elFont, "Montserrat");
        setFontSelectVal(elSubFont, "SutonnyMJ");
      } else {
        setFontSelectVal(elTitleFont, "Montserrat");
        setFontSelectVal(elDowFont, "Montserrat");
        setFontSelectVal(elFont, "Montserrat");
        setFontSelectVal(elSubFont, "Nirmala UI");
      }
      refreshCal();
    });

    if (elLayout) elLayout.addEventListener("change", function () {
      if (elLayout.value === "royal_14" && parseInt(elCols.value, 10) > 2) { elCols.value = "2"; elRows.value = "6"; elCnt.value = "12"; }
      refreshCal();
    });
    [elYear, elBox, elMBox, elCnt, elTitleFont, elDowFont, elSubFont, elBigPt, elSmallPt, elMonth, elStyle, elW, elH, elStart, elFont, elWknd, elAcc, elTxt, elWkCol].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", refreshCal);
      el.addEventListener("change", refreshCal);
    });

    if (btnFonts) {
      btnFonts.addEventListener("click", function () {
        csInterface.evalScript("dmListIllustratorFonts()", function (res) {
          if (res && res.indexOf("OK:") === 0) {
            var arr = res.slice(3).split("|").filter(Boolean);
            if (arr.length > 0) {
              allInstalledFonts = arr;
              populateFontDropdowns(allInstalledFonts, elFontFilter ? elFontFilter.value : "");
              showToast("Loaded " + arr.length + " fonts into all 4 dropdowns!");
            }
          } else {
            showToast("Open inside Illustrator to sync installed fonts.", true);
          }
        });
      });
    }

    if (btnGenAI) {
      btnGenAI.addEventListener("click", function () {
        var plan = readPlan();
        plan.useActiveDoc = !!(elUseAct && elUseAct.checked);
        csInterface.evalScript("dmGenerateCalendarAI('" + escJSX(plan) + "')", function (res) {
          if (res === "STANDALONE_PREVIEW") showToast("Preview Mode: Open inside Illustrator to generate Vector Calendar.");
          else showToast(res || "Vector Calendar generated!", res && res.indexOf("ERROR:") === 0);
        });
      });
    }

    var btnSaveUni = document.getElementById("btnCalSaveUniBase");
    if (btnSaveUni) {
      btnSaveUni.addEventListener("click", function () {
        csInterface.evalScript("dmSaveBanglaUnicodeBaseAI()", function (res) {
          if (res === "STANDALONE_PREVIEW") showToast("Preview Mode: Open inside Illustrator to save Auto-Unicode Base.");
          else showToast(res || "Auto-Unicode Base saved!", res && res.indexOf("ERROR:") === 0);
        });
      });
    }

    var btnFixBangla = document.getElementById("btnCalFixBangla");
    if (btnFixBangla) {
      btnFixBangla.addEventListener("click", function () {
        csInterface.evalScript("dmEnableBanglaComposerAI()", function (res) {
          if (res === "STANDALONE_PREVIEW") showToast("Preview Mode: Open inside Illustrator to enable Bangla Composer.");
          else showToast(res || "Bangla Indic Composer enabled!", res && res.indexOf("ERROR:") === 0);
        });
      });
    }

    // Auto-load installed Illustrator fonts once on startup when inside CEP
    if (csInterface.isInCEP() && btnFonts) {
      setTimeout(function () {
        csInterface.evalScript("dmListIllustratorFonts()", function (res) {
          if (res && res.indexOf("OK:") === 0) {
            var arr = res.slice(3).split("|").filter(Boolean);
            if (arr.length > 0) {
              allInstalledFonts = arr;
              populateFontDropdowns(allInstalledFonts, elFontFilter ? elFontFilter.value : "");
            }
          }
        });
      }, 1200);
    }

    if (btnDlSVG) {
      btnDlSVG.addEventListener("click", function () {
        var plan = readPlan();
        saveFileWithDialog({
          title: "Save Vector Calendar SVG",
          defaultName: "Design360n_Calendar_" + plan.year + "_" + plan.cols + "x" + plan.rows + ".svg",
          ext: "svg",
          mime: "image/svg+xml",
          text: CalendarEngine.toSVG(plan, true)
        });
      });
    }

    refreshCal();
  })();

})();
