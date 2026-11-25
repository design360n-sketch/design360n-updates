/**
 * ============================================================================
 * Design360n Workstation v13.0 — Live 2D Dieline <-> 3D Apparel & Bottle Studio
 * - Mode 1: T-Shirt Studio (12 Styles x 7 Graded Sizes XS-3XL, Solid Closed Top)
 * - Mode 2: Bottle & Tumbler Studio (8 Bottle Types x 6 Volumes, 360° Wrap Dieline)
 * - Automatic Live Illustrator Artboard -> 3D Mockup Sync (Auto-hides Dieline Layers!)
 * ============================================================================
 */
(function () {
  "use strict";

  var canvas3d = document.getElementById("apparel3dCanvas");
  var canvas2d = document.getElementById("apparel2dCanvas");
  if (!canvas3d || !canvas2d || typeof Apparel3D === "undefined") return;

  var csInterface = new CSInterface();
  var nodeFS = null;
  try {
    var _req = (typeof window.cep_node !== "undefined" && window.cep_node.require)
      ? window.cep_node.require
      : (typeof require === "function" ? require : null);
    if (_req) nodeFS = _req("fs");
  } catch (e) {}

  function escJSX(obj) {
    return JSON.stringify(obj).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  function status(msg) {
    var el = document.getElementById("apparelStatus");
    if (el) el.textContent = msg;
  }

  var viewer = new Apparel3D.Apparel3DViewer(canvas3d);
  var selectedLayerId = null;
  var nextLayerId = 1;
  var isSyncBusy = false;

  function activeLayerList() {
    return viewer.state.studioMode === "bottle" ? viewer.state.bottleLayers : viewer.state.layers;
  }

  function setActiveLayerList(arr) {
    if (viewer.state.studioMode === "bottle") viewer.state.bottleLayers = arr;
    else viewer.state.layers = arr;
  }

  function syncBoth() {
    viewer.refreshTexture();
    Apparel3D.render2DDielineWorkspace(canvas2d, viewer.atlasCanvas, viewer.state, selectedLayerId);
    updateSpecsLabel();
  }

  function updateSpecsLabel() {
    var el = document.getElementById("apparelSizeSpecs");
    if (!el) return;
    if (viewer.state.studioMode === "bottle") {
      var bsp = Apparel3D.getBottleSpec(viewer.state.bottleType, viewer.state.bottleVol);
      el.textContent = bsp.volCode + ": Wrap Dieline " + bsp.circMm + " × " + bsp.labelHMm + " mm • Ø" + bsp.diamMm + " mm • Total H " + bsp.totalHMm + " mm";
    } else {
      var sp = Apparel3D.getGarmentSpec(viewer.state.garmentType, viewer.state.sizeCode);
      el.textContent = sp.sizeCode + ": Body " + sp.wCm + "×" + sp.hCm + " cm" +
        (sp.slW > 0 ? (" • Sleeve " + sp.slW + "×" + sp.slH + " cm") : " • Sleeveless") +
        " • Rib " + sp.ribW + "×" + sp.ribH + " cm";
    }
  }

  // ==========================================================================
  // 1. STUDIO MODE SWITCH: T-SHIRT STUDIO vs BOTTLE & TUMBLER STUDIO
  // ==========================================================================
  var btnModeTee = document.getElementById("btnModeTShirt");
  var btnModeBot = document.getElementById("btnModeBottle");
  var teeControls = document.getElementById("tshirtControlsWrap");
  var botControls = document.getElementById("bottleControlsWrap");
  var teeLookBox = document.getElementById("tshirtLookBox");
  var botLookBox = document.getElementById("bottleLookBox");
  var btnGenPattern = document.getElementById("btnApparelGenPattern");

  function setStudioMode(mode) {
    viewer.state.studioMode = mode;
    selectedLayerId = null;
    if (btnModeTee) btnModeTee.classList.toggle("btn-primary", mode === "tshirt");
    if (btnModeBot) btnModeBot.classList.toggle("btn-primary", mode === "bottle");
    if (teeControls) teeControls.style.display = mode === "tshirt" ? "grid" : "none";
    if (botControls) botControls.style.display = mode === "bottle" ? "grid" : "none";
    if (teeLookBox) teeLookBox.style.display = mode === "tshirt" ? "block" : "none";
    if (botLookBox) botLookBox.style.display = mode === "bottle" ? "block" : "none";
    if (btnGenPattern) btnGenPattern.textContent = mode === "bottle" ? "Open Bottle Wrap Dieline in AI" : "Open Graded T-Shirt Dieline in AI";
    if (mode === "bottle" && viewer.state.backdrop === "blinds") {
      viewer.state.backdrop = "white";
      var sb = document.getElementById("apparelBackdrop"); if (sb) sb.value = "white";
    }
    viewer.rebuildModel();
    viewer.setCamera("hero");
    syncBoth();
    status(mode === "bottle" ? "Bottle & Tumbler 3D Studio active — design on Illustrator artboard or 2D Wrap Dieline!" : "T-Shirt 3D Studio active — closed-top solid mockup ready!");
  }

  if (btnModeTee) btnModeTee.addEventListener("click", function () { setStudioMode("tshirt"); });
  if (btnModeBot) btnModeBot.addEventListener("click", function () { setStudioMode("bottle"); });

  // Populate T-Shirt Types (12), Sizes (XS-3XL), Bottle Types (8), Volumes (250ml-1L)
  var selType = document.getElementById("apparelType");
  var selSize = document.getElementById("apparelSizeGrade");
  var selBotType = document.getElementById("bottleType");
  var selBotVol = document.getElementById("bottleVolume");

  if (selType) {
    Apparel3D.GARMENT_TYPES.forEach(function (g) {
      var o = document.createElement("option"); o.value = g.id; o.textContent = g.name; selType.appendChild(o);
    });
    selType.addEventListener("change", function () { viewer.state.garmentType = selType.value; viewer.rebuildModel(); syncBoth(); });
  }
  if (selSize) {
    Apparel3D.SIZE_GRADES.forEach(function (gr) {
      var o = document.createElement("option"); o.value = gr.code; o.textContent = gr.name;
      if (gr.code === "XL") o.selected = true; selSize.appendChild(o);
    });
    selSize.addEventListener("change", function () { viewer.state.sizeCode = selSize.value; viewer.rebuildModel(); syncBoth(); });
  }
  if (selBotType) {
    Apparel3D.BOTTLE_TYPES.forEach(function (bt) {
      var o = document.createElement("option"); o.value = bt.id; o.textContent = bt.name; selBotType.appendChild(o);
    });
    selBotType.addEventListener("change", function () { viewer.state.bottleType = selBotType.value; viewer.rebuildModel(); syncBoth(); });
  }
  if (selBotVol) {
    Apparel3D.BOTTLE_VOLUMES.forEach(function (v) {
      var o = document.createElement("option"); o.value = v.code; o.textContent = v.name;
      if (v.code === "710ml") o.selected = true; selBotVol.appendChild(o);
    });
    selBotVol.addEventListener("change", function () { viewer.state.bottleVol = selBotVol.value; viewer.rebuildModel(); syncBoth(); });
  }

  // ==========================================================================
  // 2. INTERACTIVE 2D DIELINE CANVAS (WORKS FOR BOTH T-SHIRT & BOTTLE!)
  // ==========================================================================
  var dragMode = null;
  var dragStart = { x: 0, y: 0, lx: 0, ly: 0, lw: 0, lh: 0 };

  function get2DNormPos(e) {
    var r = canvas2d.getBoundingClientRect();
    var rx = (e.clientX - r.left) / Math.max(1, r.width);
    var ry = (e.clientY - r.top) / Math.max(1, r.height);
    if (viewer.state.studioMode === "bottle") {
      // Map inside the padded bottle dieline rectangle
      var px = 24 / canvas2d.width, py = 26 / canvas2d.height;
      return {
        x: Math.max(0, Math.min(1, (rx - px) / (1 - px * 2))),
        y: Math.max(0, Math.min(1, (ry - py) / (1 - py * 2)))
      };
    }
    return { x: rx, y: ry };
  }

  function findLayerById(id) {
    var arr = activeLayerList();
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }

  function hitTest2D(nx, ny) {
    var arr = activeLayerList();
    if (selectedLayerId) {
      var sel = findLayerById(selectedLayerId);
      if (sel) {
        var corners = [
          [sel.x - sel.w / 2, sel.y - sel.h / 2], [sel.x + sel.w / 2, sel.y - sel.h / 2],
          [sel.x + sel.w / 2, sel.y + sel.h / 2], [sel.x - sel.w / 2, sel.y + sel.h / 2]
        ];
        for (var c = 0; c < corners.length; c++) {
          if (Math.abs(nx - corners[c][0]) < 0.032 && Math.abs(ny - corners[c][1]) < 0.032) return { layer: sel, mode: "scale" };
        }
      }
    }
    for (var i = arr.length - 1; i >= 0; i--) {
      var L = arr[i];
      if (nx >= L.x - L.w / 2 && nx <= L.x + L.w / 2 && ny >= L.y - L.h / 2 && ny <= L.y + L.h / 2) return { layer: L, mode: "move" };
    }
    return null;
  }

  canvas2d.addEventListener("mousedown", function (e) {
    var p = get2DNormPos(e);
    var hit = hitTest2D(p.x, p.y);
    if (hit) {
      selectedLayerId = hit.layer.id;
      dragMode = hit.mode;
      dragStart = { x: p.x, y: p.y, lx: hit.layer.x, ly: hit.layer.y, lw: hit.layer.w, lh: hit.layer.h };
      canvas2d.style.cursor = (dragMode === "scale") ? "nwse-resize" : "grabbing";
    } else {
      selectedLayerId = null; dragMode = null;
    }
    Apparel3D.render2DDielineWorkspace(canvas2d, viewer.atlasCanvas, viewer.state, selectedLayerId);
  });

  window.addEventListener("mousemove", function (e) {
    if (!dragMode || !selectedLayerId) return;
    var L = findLayerById(selectedLayerId);
    if (!L) return;
    var p = get2DNormPos(e);
    if (dragMode === "move") {
      L.x = Math.max(0.02, Math.min(0.98, dragStart.lx + (p.x - dragStart.x)));
      L.y = Math.max(0.02, Math.min(0.98, dragStart.ly + (p.y - dragStart.y)));
    } else if (dragMode === "scale") {
      var dx = Math.abs(p.x - L.x) * 2, dy = Math.abs(p.y - L.y) * 2;
      var aspect = dragStart.lw / Math.max(0.01, dragStart.lh);
      var newW = Math.max(0.04, Math.min(0.94, Math.max(dx, dy * aspect)));
      L.w = newW; L.h = newW / aspect;
    }
    syncBoth();
  });

  window.addEventListener("mouseup", function () { dragMode = null; canvas2d.style.cursor = "crosshair"; });

  // ==========================================================================
  // 3. ADD IMAGE / TEXT / STRIPE & TRANSFORM TOOLBAR
  // ==========================================================================
  function getPlacementCenter() {
    if (viewer.state.studioMode === "bottle") return { x: 0.5, y: 0.5, maxW: 0.36 };
    var z = document.getElementById("apparelUploadZone").value || "front";
    var R = Apparel3D.UV_REGIONS;
    var r = z === "back" ? R.back : (z === "rsleeve" ? R.rightSleeve : (z === "lsleeve" ? R.leftSleeve : R.front));
    return { x: r.x + r.w * 0.5, y: r.y + r.h * 0.45, maxW: r.w * 0.72 };
  }

  function addImageLayer(dataUrl) {
    var img = new Image();
    img.onload = function () {
      var z = document.getElementById("apparelUploadZone").value || "front";
      if (z === "full") {
        if (viewer.state.studioMode === "bottle") viewer.state.fullBottleImg = img;
        else viewer.state.fullPatternImg = img;
        viewer.state.showDemoArtwork = false;
        var cd = document.getElementById("apparelShowDemo"); if (cd) cd.checked = false;
        syncBoth();
        status("Applied Full Wrap Pattern onto 2D Dieline & 3D Mockup!");
        return;
      }
      var c = getPlacementCenter();
      var asp = img.width / Math.max(1, img.height);
      var w = c.maxW, h = w / asp;
      if (h > 0.45) { h = 0.45; w = h * asp; }
      var id = "L" + (nextLayerId++);
      activeLayerList().push({ id: id, type: "image", img: img, x: c.x, y: c.y, w: w, h: h, rot: 0, flipH: false, flipV: false });
      selectedLayerId = id;
      syncBoth();
      status("Added artwork to 2D Dieline — drag or resize corners for instant 3D update!");
    };
    img.src = dataUrl;
  }

  var btnAddImg = document.getElementById("btnApparelUpload");
  var inpUpload = document.getElementById("apparelUploadInput");
  if (btnAddImg) btnAddImg.addEventListener("click", function () {
    if (csInterface.isInCEP() && window.cep && window.cep.fs && window.cep.fs.showOpenDialogEx) {
      var r = window.cep.fs.showOpenDialogEx(false, false, "Add Artwork to 2D Dieline", "", ["png", "jpg", "jpeg", "webp"]);
      if (!r || r.err !== 0 || !r.data || !r.data.length) return;
      var p = r.data[0], ext = p.split(".").pop().toLowerCase(), mime = ext === "png" ? "image/png" : "image/jpeg", url = "";
      if (nodeFS) { try { url = "data:" + mime + ";base64," + nodeFS.readFileSync(p).toString("base64"); } catch (e) {} }
      if (!url && window.cep.fs.readFile) { var rf = window.cep.fs.readFile(p, window.cep.encoding.Base64); if (rf && rf.err === 0) url = "data:" + mime + ";base64," + rf.data; }
      if (url) addImageLayer(url);
    } else if (inpUpload) { inpUpload.value = ""; inpUpload.click(); }
  });
  if (inpUpload) inpUpload.addEventListener("change", function (e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    var rd = new FileReader(); rd.onload = function (ev) { addImageLayer(ev.target.result); }; rd.readAsDataURL(f);
  });

  var btnAddText = document.getElementById("btnDielineAddText");
  if (btnAddText) btnAddText.addEventListener("click", function () {
    var c = getPlacementCenter();
    var txt = (document.getElementById("apparelQuickText").value || "DESIGN360N").trim();
    var col = document.getElementById("apparelQuickColor").value || "#ffffff";
    var id = "L" + (nextLayerId++);
    activeLayerList().push({ id: id, type: "text", text: txt, color: col, x: c.x, y: c.y, w: 0.30, h: 0.12, rot: 0, flipH: false, flipV: false });
    selectedLayerId = id; syncBoth();
  });

  var btnAddBlock = document.getElementById("btnDielineAddBlock");
  if (btnAddBlock) btnAddBlock.addEventListener("click", function () {
    var c = getPlacementCenter();
    var col = document.getElementById("apparelQuickColor").value || "#ffffff";
    var id = "L" + (nextLayerId++);
    activeLayerList().push({ id: id, type: "rect", color: col, x: c.x, y: c.y, w: 0.14, h: 0.36, rot: 0, flipH: false, flipV: false });
    selectedLayerId = id; syncBoth();
  });

  function withSelected(fn) {
    var L = findLayerById(selectedLayerId);
    if (!L) { status("Click an artwork layer on the 2D Dieline first."); return; }
    fn(L); syncBoth();
  }
  var bDup = document.getElementById("btnLayerDup"), bFlip = document.getElementById("btnLayerFlip"),
      bRot = document.getElementById("btnLayerRot"), bDel = document.getElementById("btnLayerDel"),
      bClear = document.getElementById("btnApparelClearArt");

  if (bDup) bDup.addEventListener("click", function () {
    withSelected(function (L) {
      var copy = Object.assign({}, L, { id: "L" + (nextLayerId++), x: Math.min(0.92, L.x + 0.04), y: Math.min(0.92, L.y + 0.04) });
      activeLayerList().push(copy); selectedLayerId = copy.id;
    });
  });
  if (bFlip) bFlip.addEventListener("click", function () { withSelected(function (L) { L.flipH = !L.flipH; }); });
  if (bRot) bRot.addEventListener("click", function () { withSelected(function (L) { L.rot = ((L.rot || 0) + 45) % 360; }); });
  if (bDel) bDel.addEventListener("click", function () {
    if (!selectedLayerId) return;
    setActiveLayerList(activeLayerList().filter(function (x) { return x.id !== selectedLayerId; }));
    selectedLayerId = null; syncBoth();
  });
  if (bClear) bClear.addEventListener("click", function () {
    setActiveLayerList([]);
    if (viewer.state.studioMode === "bottle") viewer.state.fullBottleImg = null;
    else viewer.state.fullPatternImg = null;
    viewer.state.showDemoArtwork = false;
    var cd = document.getElementById("apparelShowDemo"); if (cd) cd.checked = false;
    selectedLayerId = null; syncBoth();
    status("Cleared all graphics — blank surface ready.");
  });

  // ==========================================================================
  // 4. COLORS, MATERIALS, BACKDROP & CAMERAS
  // ==========================================================================
  var colBody = document.getElementById("apparelBodyColor"), colSleeve = document.getElementById("apparelSleeveColor"), colCollar = document.getElementById("apparelCollarColor");
  if (colBody) colBody.addEventListener("input", function () {
    viewer.state.bodyColor = colBody.value;
    if (colSleeve && !document.getElementById("apparelSplitSleeve").checked) { colSleeve.value = colBody.value; viewer.state.sleeveColor = colBody.value; }
    syncBoth();
  });
  if (colSleeve) colSleeve.addEventListener("input", function () { viewer.state.sleeveColor = colSleeve.value; syncBoth(); });
  if (colCollar) colCollar.addEventListener("input", function () { viewer.state.collarColor = colCollar.value; syncBoth(); });

  var bColBody = document.getElementById("bottleBodyColor"), bColCap = document.getElementById("bottleCapColor"), bColRing = document.getElementById("bottleRingColor"), bSelFin = document.getElementById("bottleFinish");
  if (bColBody) bColBody.addEventListener("input", function () { viewer.state.bottleBodyColor = bColBody.value; syncBoth(); });
  if (bColCap) bColCap.addEventListener("input", function () { viewer.state.bottleCapColor = bColCap.value; syncBoth(); });
  if (bColRing) bColRing.addEventListener("input", function () { viewer.state.bottleRingColor = bColRing.value; syncBoth(); });
  if (bSelFin) bSelFin.addEventListener("change", function () { viewer.state.bottleFinish = bSelFin.value; });

  var selMat = document.getElementById("apparelMaterial"), rngWrinkle = document.getElementById("apparelWrinkles"),
      rngFold = document.getElementById("apparelFoldShadow"), selBg = document.getElementById("apparelBackdrop"),
      chkDemo = document.getElementById("apparelShowDemo"), chkLabel = document.getElementById("apparelShowLabel"),
      chkAutoRot = document.getElementById("apparelAutoRotate");

  if (selMat) selMat.addEventListener("change", function () { viewer.state.material = selMat.value; syncBoth(); });
  if (rngWrinkle) rngWrinkle.addEventListener("input", function () { viewer.state.wrinkles = parseFloat(rngWrinkle.value); });
  if (rngFold) rngFold.addEventListener("input", function () { viewer.state.foldShadow = parseFloat(rngFold.value); });
  if (selBg) selBg.addEventListener("change", function () { viewer.state.backdrop = selBg.value; });
  if (chkDemo) chkDemo.addEventListener("change", function () {
    viewer.state.showDemoArtwork = chkDemo.checked;
    if (chkDemo.checked) { viewer.state.fullPatternImg = null; viewer.state.fullBottleImg = null; }
    syncBoth();
  });
  if (chkLabel) chkLabel.addEventListener("change", function () { viewer.state.showNeckLabel = chkLabel.checked; syncBoth(); });
  if (chkAutoRot) chkAutoRot.addEventListener("change", function () { viewer.state.autoRotate = chkAutoRot.checked; });

  var inpBrand = document.getElementById("apparelLabelBrand"), inpMeta = document.getElementById("apparelLabelMeta");
  [inpBrand, inpMeta].forEach(function (inp) {
    if (!inp) return;
    inp.addEventListener("input", function () {
      if (inpBrand) viewer.state.labelBrand = inpBrand.value;
      if (inpMeta) viewer.state.labelMeta = inpMeta.value;
      syncBoth();
    });
  });

  var camBtns = document.querySelectorAll("[data-apparel-cam]");
  for (var c = 0; c < camBtns.length; c++) {
    camBtns[c].addEventListener("click", function () {
      if (chkAutoRot) chkAutoRot.checked = false;
      viewer.setCamera(this.getAttribute("data-apparel-cam"));
    });
  }

  // ==========================================================================
  // 5. ILLUSTRATOR DIELINE GENERATOR + AUTOMATIC LIVE ARTBOARD -> 3D SYNC!
  // ==========================================================================
  if (btnGenPattern) {
    btnGenPattern.addEventListener("click", function () {
      if (viewer.state.studioMode === "bottle") {
        var bsp = Apparel3D.getBottleSpec(viewer.state.bottleType, viewer.state.bottleVol);
        var bPayload = {
          id: bsp.id, name: bsp.name, volCode: bsp.volCode,
          diamMm: bsp.diamMm, circMm: bsp.circMm, labelHMm: bsp.labelHMm, totalHMm: bsp.totalHMm,
          bodyColor: viewer.state.bottleBodyColor
        };
        status("Generating 360° Bottle Wrap Dieline (" + bsp.circMm + "×" + bsp.labelHMm + " mm) in Illustrator...");
        csInterface.evalScript("dmGenerateBottleDielineAI('" + escJSX(bPayload) + "')", function (res) {
          if (res === "STANDALONE_PREVIEW") status("Preview Mode: Open inside Illustrator to generate editable bottle dieline.");
          else status(res || "Bottle Wrap Dieline created!");
        });
      } else {
        var sp = Apparel3D.getGarmentSpec(viewer.state.garmentType, viewer.state.sizeCode);
        var tPayload = {
          id: sp.id, name: sp.name, sizeCode: sp.sizeCode,
          wCm: sp.wCm, hCm: sp.hCm, slW: sp.slW, slH: sp.slH, ribW: sp.ribW, ribH: sp.ribH,
          neckType: sp.neckType, bodyColor: viewer.state.bodyColor,
          labelBrand: viewer.state.labelBrand, labelSize: sp.sizeCode + " / TG", labelMeta: viewer.state.labelMeta
        };
        status("Creating Graded " + sp.sizeCode + " Cut-and-Sew T-Shirt Dieline in Illustrator...");
        csInterface.evalScript("dmGenerateTShirtPatternAI('" + escJSX(tPayload) + "')", function (res) {
          if (res === "STANDALONE_PREVIEW") status("Preview Mode: Open inside Illustrator to generate editable T-Shirt dieline.");
          else status(res || "Graded T-Shirt Dieline created!");
        });
      }
    });
  }

  function syncFromIllustrator(silent) {
    if (isSyncBusy) return;
    isSyncBusy = true;
    if (!silent) status("Syncing Illustrator Artboard → Live 3D Mockup...");
    csInterface.evalScript("dmExportArtboardPNG(" + (silent ? "true" : "false") + ")", function (res) {
      if (res === "UNCHANGED") { isSyncBusy = false; return; }
      isSyncBusy = false;
      if (!res || res.indexOf("OK:") !== 0) {
        if (!silent) status("Sync: " + (res || "Open your Dieline document in Illustrator first."));
        return;
      }
      var pngPath = res.slice(3), srcUrl = "";
      if (nodeFS) { try { srcUrl = "data:image/png;base64," + nodeFS.readFileSync(pngPath).toString("base64"); } catch (e) {} }
      if (!srcUrl && window.cep && window.cep.fs && window.cep.fs.readFile) {
        var rf = window.cep.fs.readFile(pngPath, window.cep.encoding.Base64);
        if (rf && rf.err === 0 && rf.data) srcUrl = "data:image/png;base64," + rf.data;
      }
      if (!srcUrl) srcUrl = "file:///" + pngPath.replace(/\\/g, "/").replace(/^\/+/, "");
      var img = new Image();
      img.onload = function () {
        if (viewer.state.studioMode === "bottle") viewer.state.fullBottleImg = img;
        else viewer.state.fullPatternImg = img;
        viewer.state.showDemoArtwork = false;
        if (chkDemo) chkDemo.checked = false;
        syncBoth();
        if (!silent) status("Live Synced Illustrator Artboard onto 3D Mockup!");
      };
      img.src = srcUrl;
    });
  }

  var btnSyncAI = document.getElementById("btnApparelSyncAI");
  if (btnSyncAI) btnSyncAI.addEventListener("click", function () { syncFromIllustrator(false); });

  var liveSyncTimer = null;
  var chkLiveSync = document.getElementById("apparelLiveSyncAI");
  function updateLiveSyncState() {
    if (liveSyncTimer) { clearInterval(liveSyncTimer); liveSyncTimer = null; }
    if (chkLiveSync && chkLiveSync.checked && csInterface.isInCEP()) {
      liveSyncTimer = setInterval(function () {
        // Only poll when Tab 6 is visible so we never waste CPU
        var pane = document.getElementById("tab-apparel");
        if (pane && pane.classList.contains("active")) syncFromIllustrator(true);
      }, 4000);
      status("Live AI Artboard Auto-Sync ON — draw on Illustrator artboard to see instant 3D Mockup!");
    } else if (chkLiveSync && !chkLiveSync.checked) {
      status("Live AI Artboard Auto-Sync paused.");
    }
  }
  if (chkLiveSync) {
    chkLiveSync.addEventListener("change", updateLiveSyncState);
    if (csInterface.isInCEP()) {
      chkLiveSync.checked = true;
      updateLiveSyncState();
    }
  }

  // ==========================================================================
  // 6. EXPORTS (HD PNG, 360° VIDEO, 3D OBJ)
  // ==========================================================================
  function saveFile(defaultName, ext, data, isBase64) {
    if (csInterface.isInCEP() && window.cep && window.cep.fs && window.cep.fs.showSaveDialogEx) {
      var res = window.cep.fs.showSaveDialogEx("Save " + defaultName, "", [ext], defaultName, ext.toUpperCase() + " (*." + ext + ")");
      if (!res || res.err !== 0 || !res.data) return;
      var outP = res.data.toLowerCase().endsWith("." + ext) ? res.data : (res.data + "." + ext);
      if (nodeFS) nodeFS.writeFileSync(outP, isBase64 ? Buffer.from(data, "base64") : data);
      else window.cep.fs.writeFile(outP, data, isBase64 ? window.cep.encoding.Base64 : window.cep.encoding.UTF8);
      status("Saved: " + outP);
    } else {
      var blob = isBase64
        ? (function () { var bin = atob(data), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return new Blob([arr]); })()
        : new Blob([data], { type: "text/plain" });
      var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = defaultName; a.click();
      status("Downloaded: " + defaultName);
    }
  }

  function exportTag() {
    return viewer.state.studioMode === "bottle"
      ? (viewer.state.bottleType + "_" + viewer.state.bottleVol)
      : (viewer.state.garmentType + "_" + viewer.state.sizeCode);
  }

  var btnExpPNG = document.getElementById("btnApparelExpPNG");
  if (btnExpPNG) btnExpPNG.addEventListener("click", function () {
    saveFile("Design360n_" + exportTag() + "_HD.png", "png", viewer.exportHDPNG(1600).split(",")[1], true);
  });
  var btnExpOBJ = document.getElementById("btnApparelExpOBJ");
  if (btnExpOBJ) btnExpOBJ.addEventListener("click", function () {
    saveFile("Design360n_" + exportTag() + ".obj", "obj", viewer.exportOBJ(), false);
  });
  var btnExpVid = document.getElementById("btnApparelExpVideo");
  if (btnExpVid) btnExpVid.addEventListener("click", function () {
    if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) {
      status("Video recording unavailable in this host; use HD PNG.");
      return;
    }

    function beginVideoCapture() {
      var outSize = 1080, glSize = 1440, fps = 30, durationSec = 5.0, totalFrames = Math.round(durationSec * fps);
      var warmupFrames = 8;
      status("Rendering Supersampled 2K → 1080p 360° Video (25 Mbps VP9)...");

      var comp = document.createElement("canvas");
      comp.width = outSize; comp.height = outSize;
      var cctx = comp.getContext("2d");
      cctx.imageSmoothingEnabled = true;
      cctx.imageSmoothingQuality = "high";

      var oldW = canvas3d.width, oldH = canvas3d.height;
      var oldZoom = viewer.state.zoom, oldPanY = viewer.state.panY, oldRotY = viewer.state.rotY, oldAuto = viewer.state.autoRotate;

      // LOCK _startLoop so canvas3d stays locked at 1440x1440 for every single frame!
      viewer.isRecording = true;
      viewer.state.autoRotate = false;
      var fit = viewer.getAutoFitMetrics(1.0);
      viewer.state.zoom = fit.zoom;
      viewer.state.panY = fit.panY;
      canvas3d.width = glSize;
      canvas3d.height = glSize;

      var mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9"
               : (MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ? "video/webm;codecs=vp8" : "video/webm");
      var stream = comp.captureStream(fps);
      var rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 25000000 });
      var chunks = [];
      rec.ondataavailable = function (e) { if (e.data && e.data.size > 0) chunks.push(e.data); };
      rec.onstop = function () {
        viewer.isRecording = false;
        canvas3d.width = oldW; canvas3d.height = oldH;
        viewer.state.zoom = oldZoom; viewer.state.panY = oldPanY; viewer.state.rotY = oldRotY; viewer.state.autoRotate = oldAuto;
        viewer.renderFrame(false);
        var rd = new FileReader();
        rd.onload = function () { saveFile("Design360n_" + exportTag() + "_1080p_HQ_360.webm", "webm", rd.result.split(",")[1], true); };
        rd.readAsDataURL(new Blob(chunks, { type: "video/webm" }));
      };

      function drawStudioBG() {
        var bg = viewer.state.backdrop;
        var grad = cctx.createRadialGradient(outSize*0.5, outSize*0.44, outSize*0.05, outSize*0.5, outSize*0.5, outSize*0.72);
        if (bg === "white") { grad.addColorStop(0, "#ffffff"); grad.addColorStop(1, "#e2e8f0"); }
        else if (bg === "gray") { grad.addColorStop(0, "#cbd5e1"); grad.addColorStop(1, "#64748b"); }
        else { grad.addColorStop(0, "#373c48"); grad.addColorStop(1, "#090c14"); }
        cctx.fillStyle = grad; cctx.fillRect(0, 0, outSize, outSize);
        if (bg === "blinds") {
          cctx.save(); cctx.translate(outSize/2, outSize/2); cctx.rotate(-0.42); cctx.fillStyle = "rgba(0,0,0,0.48)";
          for (var y = -outSize; y < outSize; y += 64) cctx.fillRect(-outSize, y, outSize*2, 32);
          cctx.restore();
        }
      }

      var streamTrack = stream.getVideoTracks ? stream.getVideoTracks()[0] : null;
      rec.start();
      var frame = -warmupFrames;
      var frameMs = 1000 / fps;
      var lastTime = performance.now();

      function stepFrame(now) {
        if (now - lastTime < frameMs * 0.90 && frame > -warmupFrames) {
          requestAnimationFrame(stepFrame);
          return;
        }
        lastTime = now;
        var t = Math.max(0, frame) / totalFrames;
        viewer.state.rotY = oldRotY + t * Math.PI * 2;
        if (canvas3d.width !== glSize || canvas3d.height !== glSize) {
          canvas3d.width = glSize; canvas3d.height = glSize;
        }
        viewer.renderFrame(true);
        drawStudioBG();
        cctx.drawImage(canvas3d, 0, 0, glSize, glSize, 0, 0, outSize, outSize);
        if (streamTrack && typeof streamTrack.requestFrame === "function") {
          try { streamTrack.requestFrame(); } catch (e) {}
        }
        frame++;
        if (frame <= totalFrames) {
          requestAnimationFrame(stepFrame);
        } else {
          setTimeout(function () { rec.stop(); }, 200);
        }
      }
      requestAnimationFrame(stepFrame);
    }

    // Grab a fresh 200% Hi-Res Illustrator artboard texture right before recording if inside CEP!
    if (csInterface.isInCEP() && (viewer.state.fullBottleImg || viewer.state.fullPatternImg)) {
      status("Upgrading texture to 200% Hi-Res from Illustrator before 360° Video...");
      csInterface.evalScript("dmExportArtboardPNG(false)", function (res) {
        if (res && res.indexOf("OK:") === 0) {
          var p = res.slice(3), srcUrl = "";
          if (nodeFS) { try { srcUrl = "data:image/png;base64," + nodeFS.readFileSync(p).toString("base64"); } catch (e) {} }
          if (!srcUrl && window.cep && window.cep.fs && window.cep.fs.readFile) {
            var rf = window.cep.fs.readFile(p, window.cep.encoding.Base64);
            if (rf && rf.err === 0 && rf.data) srcUrl = "data:image/png;base64," + rf.data;
          }
          if (srcUrl) {
            var hiImg = new Image();
            hiImg.onload = function () {
              if (viewer.state.studioMode === "bottle") viewer.state.fullBottleImg = hiImg;
              else viewer.state.fullPatternImg = hiImg;
              viewer.refreshTexture();
              beginVideoCapture();
            };
            hiImg.onerror = beginVideoCapture;
            hiImg.src = srcUrl;
            return;
          }
        }
        beginVideoCapture();
      });
    } else {
      beginVideoCapture();
    }
  });

  syncBoth();
})();
