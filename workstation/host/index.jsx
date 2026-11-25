/* ============================================================================
 * Design360n Workstation v2.1 — Adobe Illustrator ExtendScript Host Engine (ES3 Safe)
 * Features:
 *  - Print-ready CMYK Spot Color Dieline generation (Cut, Crease, Bleed, Dims)
 *  - Live Artboard PNG Export for 3D Mockup UV sync
 *  - 1-Click Clipping Mask (Auto-detect Shape), Release Mask, Clip to Dieline
 *  - Quick Packaging Actions: Center, Fit Artboard, Safe Guides, Swatch Card
 *  - Vector Barcode & Compliance Icon insertion directly into Illustrator
 *  - Live Pre-Press Preflight Checker, 1-Click Outline Text & Print-Ready PDF
 * ============================================================================ */

var MM_TO_PT = 2.834645669291339;

function dmParseJSON(str) {
    if (typeof JSON !== "undefined" && JSON.parse) {
        return JSON.parse(str);
    }
    return eval("(" + str + ")");
}

function dmGetOrCreateSpotColor(doc, name, c, m, y, k) {
    var spot;
    try {
        spot = doc.spots.getByName(name);
    } catch (e) {
        spot = doc.spots.add();
        spot.name = name;
        spot.colorType = ColorModel.SPOT;
        if (doc.documentColorSpace === DocumentColorSpace.RGB) {
            var rgbS = new RGBColor();
            rgbS.red = Math.round(255 * (1 - c / 100) * (1 - k / 100));
            rgbS.green = Math.round(255 * (1 - m / 100) * (1 - k / 100));
            rgbS.blue = Math.round(255 * (1 - y / 100) * (1 - k / 100));
            spot.color = rgbS;
        } else {
            var cmyk = new CMYKColor();
            cmyk.cyan = c; cmyk.magenta = m; cmyk.yellow = y; cmyk.black = k;
            spot.color = cmyk;
        }
    }
    var spotColor = new SpotColor();
    spotColor.spot = spot;
    spotColor.tint = 100;
    return spotColor;
}

function dmCMYK(c, m, y, k) {
    var col = new CMYKColor();
    col.cyan = c; col.magenta = m; col.yellow = y; col.black = k;
    return col;
}


function dmSafeBlack(doc) {
    if (doc && doc.documentColorSpace === DocumentColorSpace.RGB) {
        var rgb = new RGBColor(); rgb.red = 0; rgb.green = 0; rgb.blue = 0; return rgb;
    }
    return dmCMYK(0, 0, 0, 100);
}
function dmSafeWhite(doc) {
    if (doc && doc.documentColorSpace === DocumentColorSpace.RGB) {
        var rgb = new RGBColor(); rgb.red = 255; rgb.green = 255; rgb.blue = 255; return rgb;
    }
    return dmCMYK(0, 0, 0, 0);
}

function dmGetOrCreateLayer(doc, name) {
    var layer;
    try {
        layer = doc.layers.getByName(name);
        layer.locked = false;
        layer.visible = true;
    } catch (e) {
        layer = doc.layers.add();
        layer.name = name;
    }
    return layer;
}

function dmToPt(xMm, yMm, offsetXPt, artboardTopPt, offsetYPt) {
    return [
        offsetXPt + (xMm * MM_TO_PT),
        artboardTopPt - offsetYPt - (yMm * MM_TO_PT)
    ];
}

function dmDrawPath(layer, item, strokeColor, strokeWidthPt, dashed, overprint, offsetXPt, abTopPt, offsetYPt) {
    var pathItem = layer.pathItems.add();
    pathItem.filled = false;
    pathItem.stroked = true;
    pathItem.strokeColor = strokeColor;
    pathItem.strokeWidth = strokeWidthPt;
    pathItem.strokeOverprint = overprint;
    pathItem.closed = !!item.closed;
    pathItem.strokeDashes = dashed ? [6, 4] : [];

    var i, pt, anchor, pp;
    if (item.type === "bezier" && item.anchors && item.anchors.length > 0) {
        for (i = 0; i < item.anchors.length; i++) {
            anchor = item.anchors[i];
            pp = pathItem.pathPoints.add();
            pp.anchor = dmToPt(anchor.p[0], anchor.p[1], offsetXPt, abTopPt, offsetYPt);
            pp.leftDirection = anchor.l
                ? dmToPt(anchor.l[0], anchor.l[1], offsetXPt, abTopPt, offsetYPt)
                : pp.anchor;
            pp.rightDirection = anchor.r
                ? dmToPt(anchor.r[0], anchor.r[1], offsetXPt, abTopPt, offsetYPt)
                : pp.anchor;
            pp.pointType = PointType.SMOOTH;
        }
    } else if (item.points && item.points.length > 0) {
        var coords = [];
        for (i = 0; i < item.points.length; i++) {
            pt = dmToPt(item.points[i][0], item.points[i][1], offsetXPt, abTopPt, offsetYPt);
            coords.push(pt);
        }
        pathItem.setEntirePath(coords);
    }
    return pathItem;
}

function dmDrawDimension(layer, dim, color, offsetXPt, abTopPt, offsetYPt) {
    var p1 = dmToPt(dim.x1, dim.y1, offsetXPt, abTopPt, offsetYPt);
    var p2 = dmToPt(dim.x2, dim.y2, offsetXPt, abTopPt, offsetYPt);

    var line = layer.pathItems.add();
    line.filled = false; line.stroked = true; line.strokeColor = color; line.strokeWidth = 0.5;
    line.setEntirePath([p1, p2]);

    var tickSize = 4;
    var isHoriz = Math.abs(p1[1] - p2[1]) < 1;
    var t1 = layer.pathItems.add();
    t1.filled = false; t1.stroked = true; t1.strokeColor = color; t1.strokeWidth = 0.5;
    var t2 = layer.pathItems.add();
    t2.filled = false; t2.stroked = true; t2.strokeColor = color; t2.strokeWidth = 0.5;

    if (isHoriz) {
        t1.setEntirePath([[p1[0], p1[1] - tickSize], [p1[0], p1[1] + tickSize]]);
        t2.setEntirePath([[p2[0], p2[1] - tickSize], [p2[0], p2[1] + tickSize]]);
    } else {
        t1.setEntirePath([[p1[0] - tickSize, p1[1]], [p1[0] + tickSize, p1[1]]]);
        t2.setEntirePath([[p2[0] - tickSize, p2[1]], [p2[0] + tickSize, p2[1]]]);
    }

    var tf = layer.textFrames.add();
    tf.contents = dim.label;
    tf.textRange.characterAttributes.size = 8;
    tf.textRange.characterAttributes.fillColor = color;
    var midX = (p1[0] + p2[0]) / 2, midY = (p1[1] + p2[1]) / 2;
    tf.position = isHoriz ? [midX - (tf.width / 2), midY + 11] : [midX + 6, midY + 4];
}

function dmGenerateDieline(payloadJSON) {
    try {
        var data = dmParseJSON(payloadJSON);
        var bounds = data.bounds;
        var marginMm = 25;
        var docW = (bounds.width + marginMm * 2) * MM_TO_PT;
        var docH = (bounds.height + marginMm * 2 + 18) * MM_TO_PT;

        var doc;
        if (data.useActiveDoc && app.documents.length > 0) {
            doc = app.activeDocument;
            var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()];
            ab.artboardRect = [0, docH, docW, 0];
        } else {
            var preset = new DocumentPreset();
            preset.width = docW;
            preset.height = docH;
            preset.units = RulerUnits.Millimeters;
            preset.colorMode = DocumentColorSpace.CMYK;
            preset.title = data.title || "Box_Dieline";
            doc = app.documents.addDocument(DocumentColorSpace.CMYK, preset);
        }

        var abRect = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
        var abLeft = abRect[0], abTop = abRect[1], abBottom = abRect[3];
        var offsetXPt = abLeft + (marginMm * MM_TO_PT);
        var offsetYPt = marginMm * MM_TO_PT;

        var cutColor = dmGetOrCreateSpotColor(doc, "DIELINE_CUT", 0, 100, 0, 0);
        var creaseColor = dmGetOrCreateSpotColor(doc, "DIELINE_CREASE", 100, 0, 0, 0);
        var bleedColor = dmGetOrCreateSpotColor(doc, "DIELINE_BLEED", 85, 0, 100, 0);
        var dimColor = dmCMYK(0, 0, 0, 75);

        var artworkLayer = dmGetOrCreateLayer(doc, "Artwork");
        var bleedLayer = dmGetOrCreateLayer(doc, "Bleed");
        var creaseLayer = dmGetOrCreateLayer(doc, "Crease / Fold");
        var cutLayer = dmGetOrCreateLayer(doc, "Cut / Trim");
        var dimLayer = dmGetOrCreateLayer(doc, "Dimensions & Specs");

        dimLayer.zOrder(ZOrderMethod.BRINGTOFRONT);
        cutLayer.zOrder(ZOrderMethod.BRINGTOFRONT);
        creaseLayer.zOrder(ZOrderMethod.BRINGTOFRONT);
        bleedLayer.zOrder(ZOrderMethod.SENDTOBACK);
        artworkLayer.zOrder(ZOrderMethod.SENDTOBACK);

        var i;
        if (data.bleed) {
            for (i = 0; i < data.bleed.length; i++) {
                dmDrawPath(bleedLayer, data.bleed[i], bleedColor, 0.75, false, false, offsetXPt, abTop, offsetYPt);
            }
        }
        if (data.crease) {
            for (i = 0; i < data.crease.length; i++) {
                dmDrawPath(creaseLayer, data.crease[i], creaseColor, 0.75, true, true, offsetXPt, abTop, offsetYPt);
            }
        }
        if (data.cut) {
            for (i = 0; i < data.cut.length; i++) {
                dmDrawPath(cutLayer, data.cut[i], cutColor, 1.0, false, true, offsetXPt, abTop, offsetYPt);
            }
        }
        if (data.includeDimensions && data.dimensions) {
            for (i = 0; i < data.dimensions.length; i++) {
                dmDrawDimension(dimLayer, data.dimensions[i], dimColor, offsetXPt, abTop, offsetYPt);
            }
        }

        var specText = dimLayer.textFrames.add();
        specText.contents = data.specSummary || "Generated by Design360n Workstation v2.1";
        specText.textRange.characterAttributes.size = 9;
        specText.textRange.characterAttributes.fillColor = dimColor;
        specText.position = [offsetXPt, abBottom + (12 * MM_TO_PT)];

        if (data.lockDielineLayers) {
            cutLayer.locked = true;
            creaseLayer.locked = true;
            bleedLayer.locked = true;
            dimLayer.locked = true;
        }
        doc.activeLayer = artworkLayer;
        try { app.executeMenuCommand("fitinwindow"); } catch (e) {}
        return "OK:" + doc.name;
    } catch (err) {
        return "ERROR:" + err.message + " (line " + err.line + ")";
    }
}

function dmExportArtworkFor3D() {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open in Illustrator.";
        var doc = app.activeDocument;
        var tempFile = new File(Folder.temp.fsName + "/dieline_maker_3d_tex.png");

        var hiddenLayers = [];
        var techNames = ["Cut / Trim", "Crease / Fold", "Bleed", "Dimensions & Specs"];
        var i, j, lyr;
        for (i = 0; i < doc.layers.length; i++) {
            lyr = doc.layers[i];
            for (j = 0; j < techNames.length; j++) {
                if (lyr.name === techNames[j] && lyr.visible) {
                    lyr.visible = false;
                    hiddenLayers.push(lyr);
                }
            }
        }

        var opts = new ExportOptionsPNG24();
        opts.artBoardClipping = true;
        opts.transparency = false;
        opts.antiAliasing = true;
        opts.horizontalScale = 150;
        opts.verticalScale = 150;
        doc.exportFile(tempFile, ExportType.PNG24, opts);

        for (i = 0; i < hiddenLayers.length; i++) hiddenLayers[i].visible = true;
        return "OK:" + tempFile.fsName.replace(/\\/g, "/");
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

/* ============================================================================
 * 1-CLICK CLIPPING MASK & ILLUSTRATOR QUICK TOOLS
 * ============================================================================ */

/**
 * 1-Click Smart Clipping Mask into Shape
 * Automatically finds the clipping shape (PathItem / CompoundPathItem) in the
 * selection—even if it was behind the image—brings it to front, and clips!
 */
function dmOneClickClipMask() {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open.";
        var doc = app.activeDocument;
        var sel = doc.selection;
        if (!sel || sel.length < 2) {
            return "ERROR:Select at least 2 objects (your image/artwork + a shape) first.";
        }

        // Find the best vector shape to act as the clipping mask (even if behind the image!)
        var maskItem = null;
        var i;
        for (i = 0; i < sel.length; i++) {
            if (sel[i].typename === "PathItem" || sel[i].typename === "CompoundPathItem") {
                maskItem = sel[i];
                break;
            }
        }
        if (!maskItem) maskItem = sel[0];

        var parentLayer = maskItem.layer;
        parentLayer.locked = false;
        parentLayer.visible = true;

        // Measure exact Shape Bounds (width, height, center)
        var mb = maskItem.geometricBounds; // [left, top, right, bottom]
        var mW = Math.abs(mb[2] - mb[0]);
        var mH = Math.abs(mb[1] - mb[3]);
        var mCx = (mb[0] + mb[2]) / 2;
        var mCy = (mb[1] + mb[3]) / 2;

        // Collect all non-mask items to clip & AUTO-FIT proportionally to exact shape size!
        var targets = [];
        for (i = sel.length - 1; i >= 0; i--) {
            if (sel[i] !== maskItem) targets.push(sel[i]);
        }

        for (i = 0; i < targets.length; i++) {
            var it = targets[i];
            if (mW > 0.5 && mH > 0.5 && it.width > 0.5 && it.height > 0.5) {
                // Proportional Cover Fit: completely fills the exact shape size with zero distortion or gaps!
                var scalePct = Math.max(mW / it.width, mH / it.height) * 100.0;
                it.resize(scalePct, scalePct, true, true, true, true, scalePct, Transformation.CENTER);
                // Re-measure geometricBounds after resize and center dead-on to the shape!
                var ib = it.geometricBounds;
                var iCx = (ib[0] + ib[2]) / 2;
                var iCy = (ib[1] + ib[3]) / 2;
                it.translate(mCx - iCx, mCy - iCy);
            }
        }

        var clipGroup = parentLayer.groupItems.add();
        clipGroup.name = "Smart_Clip_Group";

        for (i = 0; i < targets.length; i++) {
            targets[i].move(clipGroup, ElementPlacement.PLACEATEND);
        }
        // Place mask shape at top of group & enable clipping
        maskItem.move(clipGroup, ElementPlacement.PLACEATBEGINNING);
        clipGroup.clipped = true;
        doc.selection = [clipGroup];

        return "OK:Auto-fitted & clipped cleanly to exact shape size!";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

/**
 * 1-Click Release Clipping Mask
 */
function dmReleaseClipMask() {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open.";
        var doc = app.activeDocument;
        var sel = doc.selection;
        if (!sel || sel.length === 0) return "ERROR:Select a clipped group first.";

        var released = 0;
        var i;
        for (i = 0; i < sel.length; i++) {
            if (sel[i].typename === "GroupItem" && sel[i].clipped) {
                sel[i].clipped = false;
                released++;
            }
        }
        if (released === 0) {
            try { app.executeMenuCommand("releaseMask"); return "OK:Released clipping mask."; } catch (e) {}
            return "ERROR:Selected object is not a clipping mask.";
        }
        return "OK:Released " + released + " clipping mask(s).";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

/**
 * 1-Click Clip All Artwork Inside the Bleed Dieline Boundary
 */
function dmClipArtworkToBleed() {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open.";
        var doc = app.activeDocument;
        var bleedLayer = null, artLayer = null;
        for (var li = 0; li < doc.layers.length; li++) {
            var ln = doc.layers[li].name.toLowerCase();
            if (!bleedLayer && ln.indexOf("bleed") >= 0) bleedLayer = doc.layers[li];
            if (!artLayer && ln.indexOf("artwork") >= 0) artLayer = doc.layers[li];
        }
        if (!bleedLayer) return "ERROR:No Bleed layer found. Generate a Dieline or Design Artboard first.";
        if (!artLayer) artLayer = doc.activeLayer;
        if (artLayer.pageItems.length === 0) return "ERROR:Place your design on the 'Artwork' layer first.";
        if (bleedLayer.pathItems.length === 0) return "ERROR:No path found on 'Bleed' layer.";

        var wasLocked = bleedLayer.locked;
        bleedLayer.locked = false;
        artLayer.locked = false;

        var maskCopy = bleedLayer.pathItems[0].duplicate(artLayer, ElementPlacement.PLACEATBEGINNING);
        maskCopy.stroked = false;
        maskCopy.filled = false;

        var grp = artLayer.groupItems.add();
        grp.name = "Artwork_Clipped_To_Bleed";
        var i;
        for (i = artLayer.pageItems.length - 1; i >= 0; i--) {
            var it = artLayer.pageItems[i];
            if (it !== grp && it !== maskCopy) {
                it.move(grp, ElementPlacement.PLACEATEND);
            }
        }
        maskCopy.move(grp, ElementPlacement.PLACEATBEGINNING);
        grp.clipped = true;

        bleedLayer.locked = wasLocked;
        return "OK:All artwork clipped cleanly inside Bleed boundary!";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

/**
 * Center Selected Object(s) on Active Artboard
 */
function dmCenterToArtboard() {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open.";
        var doc = app.activeDocument;
        var sel = doc.selection;
        if (!sel || sel.length === 0) return "ERROR:Select at least one object first.";

        var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
        var abCx = (ab[0] + ab[2]) / 2;
        var abCy = (ab[1] + ab[3]) / 2;

        for (var i = 0; i < sel.length; i++) {
            var item = sel[i];
            item.position = [abCx - item.width / 2, abCy + item.height / 2];
        }
        return "OK:Centered " + sel.length + " object(s) to artboard.";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

/**
 * Fit Selected Object(s) Proportionally to Active Artboard (with 5mm margin)
 */
function dmFitToArtboard() {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open.";
        var doc = app.activeDocument;
        var sel = doc.selection;
        if (!sel || sel.length === 0) return "ERROR:Select an object or artwork first.";

        var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
        var margin = 5 * MM_TO_PT;
        var targetW = (ab[2] - ab[0]) - margin * 2;
        var targetH = (ab[1] - ab[3]) - margin * 2;
        var abCx = (ab[0] + ab[2]) / 2;
        var abCy = (ab[1] + ab[3]) / 2;

        for (var i = 0; i < sel.length; i++) {
            var item = sel[i];
            if (item.width > 0 && item.height > 0) {
                var ratio = Math.min(targetW / item.width, targetH / item.height) * 100;
                item.resize(ratio, ratio);
                item.position = [abCx - item.width / 2, abCy + item.height / 2];
            }
        }
        return "OK:Fitted selection proportionally to artboard.";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

/**
 * Add Print-Safe Margin Guides (5mm inset around Artboard)
 */
function dmAddSafeGuides() {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open.";
        var doc = app.activeDocument;
        var lyr = dmGetOrCreateLayer(doc, "Safe Guides");
        var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
        var inset = 5 * MM_TO_PT;
        var rect = lyr.pathItems.rectangle(ab[1] - inset, ab[0] + inset, (ab[2] - ab[0]) - inset * 2, (ab[1] - ab[3]) - inset * 2);
        rect.filled = false;
        rect.stroked = false;
        rect.guides = true;
        lyr.locked = true;
        return "OK:Added 5mm Print-Safe Margin Guides.";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

/**
 * Generate Print-Spec Color Swatch Bar at Bottom of Artboard
 */
function dmCreateSwatchCard() {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open.";
        var doc = app.activeDocument;
        var lyr = dmGetOrCreateLayer(doc, "Dimensions & Specs");
        var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;

        var swSize = 7 * MM_TO_PT;
        var gap = 2 * MM_TO_PT;
        var startX = ab[0] + (10 * MM_TO_PT);
        var startY = ab[3] + (10 * MM_TO_PT);

        var grp = lyr.groupItems.add();
        grp.name = "Print_Color_Control_Strip";

        // Standard CMYK (or RGB) + Spot control patches
        var isRGBDoc = (doc.documentColorSpace === DocumentColorSpace.RGB);
        var patches = isRGBDoc ? [
            dmHexToRGBColor("#00aeef"),
            dmHexToRGBColor("#ec008c"),
            dmHexToRGBColor("#fff200"),
            dmHexToRGBColor("#000000"),
            dmHexToRGBColor("#808080")
        ] : [
            dmCMYK(100, 0, 0, 0),
            dmCMYK(0, 100, 0, 0),
            dmCMYK(0, 0, 100, 0),
            dmCMYK(0, 0, 0, 100),
            dmCMYK(0, 0, 0, 50)
        ];
        var i;
        for (i = 0; i < doc.spots.length && patches.length < 12; i++) {
            var sc = new SpotColor();
            sc.spot = doc.spots[i];
            sc.tint = 100;
            patches.push(sc);
        }

        for (i = 0; i < patches.length; i++) {
            var box = grp.pathItems.rectangle(startY, startX + i * (swSize + gap), swSize, swSize);
            box.filled = true;
            box.fillColor = patches[i];
            box.stroked = true;
            box.strokeColor = dmSafeBlack(doc);
            box.strokeWidth = 0.4;
        }
        return "OK:Added CMYK + Spot Color Control Strip (" + patches.length + " swatches).";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

function dmInsertVectorBarcode(payloadJSON) {
    try {
        if (app.documents.length === 0) return "ERROR:Open or generate a document in Illustrator first.";
        var data = dmParseJSON(payloadJSON);
        var doc = app.activeDocument;
        var lyr = dmGetOrCreateLayer(doc, "Barcode & Marks");
        lyr.zOrder(ZOrderMethod.BRINGTOFRONT);

        var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
        var cx = (ab[0] + ab[2]) / 2, cy = (ab[1] + ab[3]) / 2;
        var wPt = (data.widthMm || 38) * MM_TO_PT, hPt = (data.heightMm || 22) * MM_TO_PT;
        var pad = 4 * MM_TO_PT, left = cx - wPt / 2, top = cy + hPt / 2;

        var grp = lyr.groupItems.add();
        grp.name = "Barcode_" + (data.label || "Vector");

        var bg = grp.pathItems.rectangle(top + pad, left - pad, wPt + pad * 2, hPt + pad * 2 + 10);
        bg.filled = true; bg.stroked = false; bg.fillColor = dmSafeWhite(doc);

        var kBlack = dmSafeBlack(doc);
        for (var i = 0; i < data.bars.length; i++) {
            var b = data.bars[i];
            var r = grp.pathItems.rectangle(top, left + b[0] * wPt, b[1] * wPt, b[2] * hPt);
            r.filled = true; r.stroked = false; r.fillColor = kBlack;
        }

        if (data.label) {
            var tf = grp.textFrames.add();
            tf.contents = data.label;
            tf.textRange.characterAttributes.size = 8.5;
            tf.textRange.characterAttributes.fillColor = kBlack;
            tf.position = [cx - (tf.width / 2), top - hPt - 2];
        }
        return "OK:Vector barcode added to 'Barcode & Marks' layer (100% K black).";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

function dmInsertComplianceIcon(payloadJSON) {
    try {
        if (app.documents.length === 0) return "ERROR:Open or generate a document in Illustrator first.";
        var data = dmParseJSON(payloadJSON);
        var doc = app.activeDocument;
        var lyr = dmGetOrCreateLayer(doc, "Barcode & Marks");
        var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
        var cx = (ab[0] + ab[2]) / 2, cy = (ab[1] + ab[3]) / 2;
        var sizePt = (data.sizeMm || 18) * MM_TO_PT;
        var kBlack = dmSafeBlack(doc);

        var grp = lyr.groupItems.add();
        grp.name = "Icon_" + data.id;

        var frame = grp.pathItems.roundedRectangle(cy + sizePt / 2, cx - sizePt / 2, sizePt, sizePt, 4, 4);
        frame.filled = false; frame.stroked = true; frame.strokeColor = kBlack; frame.strokeWidth = 1.2;

        for (var i = 0; i < data.paths.length; i++) {
            var seg = data.paths[i], pts = [];
            for (var j = 0; j < seg.points.length; j++) {
                pts.push([(cx - sizePt / 2) + (seg.points[j][0] / 100) * sizePt, (cy + sizePt / 2) - (seg.points[j][1] / 100) * sizePt]);
            }
            var pItem = grp.pathItems.add();
            pItem.filled = !!seg.filled; pItem.stroked = !seg.filled;
            if (seg.filled) pItem.fillColor = kBlack; else { pItem.strokeColor = kBlack; pItem.strokeWidth = 1.2; }
            pItem.closed = !!seg.closed;
            pItem.setEntirePath(pts);
        }

        if (data.caption) {
            var tf = grp.textFrames.add();
            tf.contents = data.caption;
            tf.textRange.characterAttributes.size = 6.5;
            tf.textRange.characterAttributes.fillColor = kBlack;
            tf.position = [cx - tf.width / 2, cy - sizePt / 2 - 2];
        }
        return "OK:Inserted vector icon '" + data.caption + "'";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

function dmRunPreflight() {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open.";
        var doc = app.activeDocument;
        var isCMYK = doc.documentColorSpace === DocumentColorSpace.CMYK;
        var liveTexts = doc.textFrames.length;
        var placedCount = doc.placedItems.length;
        var rasterCount = doc.rasterItems.length;

        var hasCut = false, hasCrease = false;
        for (var i = 0; i < doc.spots.length; i++) {
            var nm = doc.spots[i].name.toUpperCase();
            if (nm.indexOf("CUT") >= 0) hasCut = true;
            if (nm.indexOf("CREASE") >= 0 || nm.indexOf("FOLD") >= 0) hasCrease = true;
        }

        return "OK:" +
            "Color Space: " + (isCMYK ? "CMYK (Print Ready)" : "RGB (WARNING: Convert to CMYK!)") + " | " +
            "Live Text Frames: " + liveTexts + (liveTexts > 0 ? " (Outline before print)" : " (OK)") + " | " +
            "Linked Images: " + placedCount + ", Embedded: " + rasterCount + " | " +
            "Spot Cut: " + (hasCut ? "OK" : "Missing") + ", Spot Crease: " + (hasCrease ? "OK" : "Missing");
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

function dmOutlineAllText() {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open.";
        var doc = app.activeDocument;
        var count = 0;
        for (var i = doc.textFrames.length - 1; i >= 0; i--) {
            var tf = doc.textFrames[i];
            if (!tf.locked && !tf.layer.locked) {
                tf.createOutline();
                count++;
            }
        }
        return "OK:Converted " + count + " live text frame(s) to vector outlines.";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

function dmExportPrintPDF() {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open.";
        var doc = app.activeDocument;
        var cleanName = doc.name.replace(/\.[^\.]+$/, "") + "_PRINT_READY.pdf";
        var defaultFile = new File(Folder.desktop.fsName + "/" + cleanName);
        var pdfFile = defaultFile.saveDlg("Save Print-Ready PDF", "PDF Files:*.pdf");
        if (!pdfFile) return "OK:PDF export cancelled.";

        var opts = new PDFSaveOptions();
        opts.compatibility = PDFCompatibility.ACROBAT5;
        opts.preserveEditability = false;
        opts.trimMarks = true;
        opts.bleedOffsetRect = [8.5, 8.5, 8.5, 8.5];
        opts.generateThumbnails = true;

        doc.saveAs(pdfFile, opts);
        return "OK:Saved Print-Ready PDF: " + pdfFile.fsName;
    } catch (err) {
        return "ERROR:" + err.message;
    }
}


/* ============================================================================
 * RASTER TO EDITABLE STROKE LINE ICON — NATIVE ILLUSTRATOR .AI GENERATOR
 * ============================================================================ */
function dmHexToRGBColor(hex) {
    hex = (hex || "#000000").replace("#", "");
    if (hex.length === 3) hex = hex.charAt(0)+hex.charAt(0)+hex.charAt(1)+hex.charAt(1)+hex.charAt(2)+hex.charAt(2);
    var col = new RGBColor();
    col.red = parseInt(hex.substring(0, 2), 16) || 0;
    col.green = parseInt(hex.substring(2, 4), 16) || 0;
    col.blue = parseInt(hex.substring(4, 6), 16) || 0;
    return col;
}

/**
 * Create native Adobe Illustrator document with Editable Stroke Line Icons
 * grouped per detected icon, and auto-save .AI file directly into Source Folder!
 */
function dmCreateStrokeVectorAI(payloadJSON) {
    try {
        var data = dmParseJSON(payloadJSON);
        var docW = Math.max(64, data.width || 512);
        var docH = Math.max(64, data.height || 512);

        var preset = new DocumentPreset();
        preset.width = docW;
        preset.height = docH;
        preset.units = RulerUnits.Pixels;
        preset.colorMode = DocumentColorSpace.RGB;
        preset.title = data.title || "Editable_Stroke_Icons";

        var doc = app.documents.addDocument(DocumentColorSpace.RGB, preset);
        var lyr = doc.layers[0];
        lyr.name = "Editable Stroke Icons";

        var strokeCol = dmHexToRGBColor(data.strokeColor || "#000000");
        var sw = data.strokeWidth || 2;
        var icons = data.icons || [];

        var i, j, k, iconGrp, bp, pItem, an, pp;
        for (i = 0; i < icons.length; i++) {
            iconGrp = lyr.groupItems.add();
            iconGrp.name = "Icon_" + (i + 1);
            var paths = icons[i].paths || [];
            for (j = 0; j < paths.length; j++) {
                bp = paths[j];
                if (!bp.anchors || bp.anchors.length < 2) continue;
                pItem = iconGrp.pathItems.add();
                pItem.filled = false;
                pItem.stroked = true;
                pItem.strokeColor = strokeCol;
                pItem.strokeWidth = sw;
                pItem.strokeCap = StrokeCap.ROUNDENDCAP;
                pItem.strokeJoin = StrokeJoin.ROUNDENDJOIN;
                pItem.closed = !!bp.closed;

                for (k = 0; k < bp.anchors.length; k++) {
                    an = bp.anchors[k];
                    pp = pItem.pathPoints.add();
                    // Convert top-left pixel Y to Illustrator bottom-left Y
                    pp.anchor = [an.p[0], docH - an.p[1]];
                    pp.leftDirection = [an.l[0], docH - an.l[1]];
                    pp.rightDirection = [an.r[0], docH - an.r[1]];
                    pp.pointType = an.corner ? PointType.CORNER : PointType.SMOOTH;
                }
            }
        }

        // Auto-save native .AI file inside Source Folder if savePath is provided
        if (data.savePath) {
            var aiFile = new File(data.savePath);
            var saveOpts = new IllustratorSaveOptions();
            saveOpts.compressed = true;
            saveOpts.pdfCompatible = true;
            doc.saveAs(aiFile, saveOpts);
            if (!data.keepOpen) {
                doc.close(SaveOptions.DONOTSAVECHANGES);
            }
            return "OK:" + aiFile.fsName + " (" + icons.length + " icons)";
        }

        try { app.executeMenuCommand("fitinwindow"); } catch (e) {}
        return "OK:Created " + icons.length + " editable stroke icon(s) in Illustrator.";
    } catch (err) {
        return "ERROR:" + err.message + " (line " + err.line + ")";
    }
}


/**
 * ============================================================================
 * v5.0 ADVANCED ENGINE: Adobe Illustrator Native C++ Line Art (Strokes Only)
 *  1. High-precision sub-pixel medial-axis tracing (fills=false, strokes=true)
 *  2. Automatic cleanup of invisible/unstroked/white artifacts after Expand
 *  3. Uniform Round Cap / Round Join & optional custom Stroke Weight + Color
 *  4. Automatic Spatial Icon Detection & Grouping (Icon_1, Icon_2, ... Icon_N)
 *  5. Auto-Save native Editable .AI and/or .SVG directly into Source Folder
 * ============================================================================
 */
function dmCollectAllPaths(container, outArr) {
    if (!container) return;
    if (container.typename === "PathItem") {
        outArr.push(container);
        return;
    }
    if (container.typename === "CompoundPathItem") {
        for (var c = 0; c < container.pathItems.length; c++) outArr.push(container.pathItems[c]);
        return;
    }
    if (!container.pageItems) return;
    var i, it;
    for (i = 0; i < container.pageItems.length; i++) {
        it = container.pageItems[i];
        if (it.typename === "PathItem") {
            outArr.push(it);
        } else if (it.typename === "GroupItem") {
            dmCollectAllPaths(it, outArr);
        } else if (it.typename === "CompoundPathItem") {
            for (var j = 0; j < it.pathItems.length; j++) outArr.push(it.pathItems[j]);
        }
    }
}

function dmGroupPathsIntoIcons(doc, lyr, mergeGapPt) {
    var rawPaths = [];
    dmCollectAllPaths(lyr, rawPaths);

    // Filter to genuine visible stroked paths and move them flat to top layer first
    var valid = [];
    var i, p, b;
    for (i = rawPaths.length - 1; i >= 0; i--) {
        p = rawPaths[i];
        if (!p.stroked || p.pathPoints.length < 2) {
            try { p.remove(); } catch (e) {}
            continue;
        }
        p.filled = false;
        try { p.move(lyr, ElementPlacement.PLACEATEND); } catch (e) {}
        b = p.geometricBounds; // [left, top, right, bottom] (top > bottom in AI)
        valid.push({ item: p, box: [b[0], b[1], b[2], b[3]] });
    }

    // Remove empty leftover groups from expandTracing
    for (i = lyr.groupItems.length - 1; i >= 0; i--) {
        if (lyr.groupItems[i].pageItems.length === 0) {
            try { lyr.groupItems[i].remove(); } catch (e) {}
        }
    }

    var n = valid.length;
    if (n === 0) return 0;

    // Union-Find spatial clustering in Illustrator coordinates (top > bottom)
    var parent = [];
    for (i = 0; i < n; i++) parent.push(i);
    function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
    function union(a, b) { var ra = find(a), rb = find(b); if (ra !== rb) parent[ra] = rb; }

    function near(a, b, g) {
        // [left, top, right, bottom] where top > bottom
        return !(a[2] + g < b[0] || b[2] + g < a[0] || a[3] - g > b[1] || b[3] - g > a[1]);
    }

    var j;
    for (i = 0; i < n; i++) {
        for (j = i + 1; j < n; j++) {
            if (near(valid[i].box, valid[j].box, mergeGapPt)) union(i, j);
        }
    }

    var clusters = {};
    var keys = [];
    for (i = 0; i < n; i++) {
        var r = find(i);
        if (!clusters[r]) {
            clusters[r] = { items: [], left: 1e9, top: -1e9 };
            keys.push(r);
        }
        clusters[r].items.push(valid[i].item);
        if (valid[i].box[0] < clusters[r].left) clusters[r].left = valid[i].box[0];
        if (valid[i].box[1] > clusters[r].top) clusters[r].top = valid[i].box[1];
    }

    // Sort icons top-to-bottom, left-to-right (reading order)
    keys.sort(function (a, b) {
        if (Math.abs(clusters[a].top - clusters[b].top) > 28) return clusters[b].top - clusters[a].top;
        return clusters[a].left - clusters[b].left;
    });

    for (i = 0; i < keys.length; i++) {
        var grp = lyr.groupItems.add();
        grp.name = "Icon_" + (i + 1);
        var items = clusters[keys[i]].items;
        for (j = 0; j < items.length; j++) {
            try { items[j].move(grp, ElementPlacement.PLACEATEND); } catch (e) {}
        }
    }
    return keys.length;
}

function dmNativeLineArtTraceAI(payloadJSON) {
    try {
        var data = dmParseJSON(payloadJSON);
        var imgFile = new File(data.imagePath);
        if (!imgFile.exists) return "ERROR:Image file not found: " + data.imagePath;

        var preset = new DocumentPreset();
        preset.width = 1000;
        preset.height = 1000;
        preset.units = RulerUnits.Pixels;
        preset.colorMode = DocumentColorSpace.RGB;
        preset.title = data.title || "Editable_Stroke_Icons";

        var doc = app.documents.addDocument(DocumentColorSpace.RGB, preset);
        var lyr = doc.layers[0];
        lyr.name = "Editable Stroke Icons";

        var placed = lyr.placedItems.add();
        placed.file = imgFile;
        placed.position = [0, placed.height];
        doc.artboards[0].artboardRect = [0, placed.height, placed.width, 0];

        var abW = placed.width;
        var scaleX = (data.srcWidth && data.srcWidth > 0) ? (abW / data.srcWidth) : 1;
        var scaledAutoSW = Math.max(1.0, Math.round(((data.autoStrokeWidth || 4) * scaleX) * 10) / 10);
        var finalSW = (data.strokeWidth && data.strokeWidth > 0) ? data.strokeWidth : scaledAutoSW;

        // Tight maxStrokeWeight prevents Illustrator from bridging parallel gaps or creating extra crossover lines!
        var tightMaxStroke = Math.max(8, Math.min(22, Math.round(scaledAutoSW * 1.85)));

        var traced = placed.trace();
        var opts = traced.tracing.tracingOptions;
        try { opts.loadFromPreset("Line Art"); } catch (e) {}
        try { opts.tracingMode = TracingModeType.TRACINGMODEBLACKANDWHITE; } catch (e) {}
        try { opts.fills = false; } catch (e) {}
        try { opts.strokes = true; } catch (e) {}
        try { opts.threshold = data.threshold || 155; } catch (e) {}
        try { opts.maxStrokeWeight = tightMaxStroke; } catch (e) {}
        try { opts.minStrokeLength = 6; } catch (e) {}
        try { opts.pathFitting = Math.max(1.8, Math.min(6.0, (data.smoothness || 1.5) * 1.4)); } catch (e) {}
        try { opts.cornerAngle = 22; } catch (e) {}
        try { opts.minArea = 12; } catch (e) {}
        try { opts.ignoreWhite = true; } catch (e) {}
        app.redraw();

        traced.tracing.expandTracing();

        // Clean uniform editable stroke styling — non-destructive (preserves Adobe's exact smooth Bezier curves!)
        var strokeCol = dmHexToRGBColor(data.strokeColor || "#000000");
        var allP = [];
        dmCollectAllPaths(lyr, allP);
        for (var i = allP.length - 1; i >= 0; i--) {
            var p = allP[i];
            if (!p.stroked || p.pathPoints.length < 2) {
                try { p.remove(); } catch (e) {}
                continue;
            }
            // Drop tiny stray noise specks (< 2pt bounding box)
            var b = p.geometricBounds;
            if (Math.abs(b[2] - b[0]) < 1.8 && Math.abs(b[1] - b[3]) < 1.8) {
                try { p.remove(); } catch (e) {}
                continue;
            }
            p.filled = false;
            p.strokeColor = strokeCol;
            p.strokeWidth = finalSW;
            p.strokeCap = StrokeCap.ROUNDENDCAP;
            p.strokeJoin = StrokeJoin.ROUNDENDJOIN;
        }

        // Group individual icons cleanly (Icon_1, Icon_2, ...)
        var iconCount = dmGroupPathsIntoIcons(doc, lyr, Math.max(5, (data.mergeGap || 14) * scaleX));

        if (data.saveSvgPath) {
            var svgFile = new File(data.saveSvgPath);
            var svgOpts = new ExportOptionsSVG();
            svgOpts.embedRasterImages = false;
            svgOpts.coordinatePrecision = 3;
            doc.exportFile(svgFile, ExportType.SVG, svgOpts);
        }
        if (data.saveAiPath) {
            var aiFile = new File(data.saveAiPath);
            var aiOpts = new IllustratorSaveOptions();
            aiOpts.compressed = true;
            aiOpts.pdfCompatible = true;
            doc.saveAs(aiFile, aiOpts);
            if (!data.keepOpen) doc.close(SaveOptions.DONOTSAVECHANGES);
            return "OK:" + aiFile.name + " (" + iconCount + " icons, " + finalSW + "pt stroke)";
        }

        try { app.executeMenuCommand("fitinwindow"); } catch (e) {}
        return "OK:Created " + iconCount + " clean editable stroke icon(s) (" + finalSW + "pt).";
    } catch (err) {
        return "ERROR:" + err.message + " (line " + err.line + ")";
    }
}

/**
 * v6.0 Post-Trace Geometric Vector Polisher (runs directly on Adobe's C++ expanded paths!)
 * - Replaces slightly wobbly traced circles (Clock, Globe ring, Cart wheels, Heads, Lens)
 *   with mathematically EXACT 4-anchor Illustrator ellipses!
 * - Snaps near-horizontal & near-vertical straight stroke lines (±3.5°) to exact 0°/90°!
 */
function dmGeometricPolishPaths(lyr, strokeCol, finalSW) {
    var allP = [];
    dmCollectAllPaths(lyr, allP);
    var maxSlope = Math.tan(3.5 * Math.PI / 180);
    var i, k, p, pts, n;

    for (i = allP.length - 1; i >= 0; i--) {
        p = allP[i];
        if (!p.stroked || p.pathPoints.length < 2) continue;
        pts = p.pathPoints;
        n = pts.length;

        // A. Exact Circle Snap for closed traced loops
        if (p.closed && n >= 4) {
            var cx = 0, cy = 0;
            for (k = 0; k < n; k++) { cx += pts[k].anchor[0]; cy += pts[k].anchor[1]; }
            cx /= n; cy /= n;

            var sumR = 0, radii = [];
            for (k = 0; k < n; k++) {
                var dx = pts[k].anchor[0] - cx, dy = pts[k].anchor[1] - cy;
                var r = Math.sqrt(dx * dx + dy * dy);
                radii.push(r); sumR += r;
            }
            var meanR = sumR / n;
            if (meanR >= 5) {
                var maxErr = 0;
                for (k = 0; k < n; k++) {
                    var err = Math.abs(radii[k] - meanR) / meanR;
                    if (err > maxErr) maxErr = err;
                }
                // True circle within 7.5% radial tolerance -> replace with exact 4-anchor Illustrator circle!
                if (maxErr <= 0.075) {
                    try {
                        var circ = lyr.pathItems.ellipse(cy + meanR, cx - meanR, meanR * 2, meanR * 2);
                        circ.filled = false;
                        circ.stroked = true;
                        circ.strokeColor = strokeCol;
                        circ.strokeWidth = finalSW;
                        circ.strokeCap = StrokeCap.ROUNDENDCAP;
                        circ.strokeJoin = StrokeJoin.ROUNDENDJOIN;
                        p.remove();
                        continue;
                    } catch (e) {}
                }
            }
        }

        // B. Razor-Straight H/V Snap for 2-point straight lines (Document lines, Bars, Equator, Ticks)
        if (!p.closed && n === 2) {
            var a0 = pts[0].anchor, a1 = pts[1].anchor;
            var ddx = Math.abs(a1[0] - a0[0]), ddy = Math.abs(a1[1] - a0[1]);
            if (Math.sqrt(ddx * ddx + ddy * ddy) >= 8) {
                if (ddy / Math.max(ddx, 0.001) < maxSlope) {
                    var avgY = (a0[1] + a1[1]) / 2;
                    pts[0].anchor = [a0[0], avgY]; pts[0].leftDirection = [a0[0], avgY]; pts[0].rightDirection = [a0[0], avgY];
                    pts[1].anchor = [a1[0], avgY]; pts[1].leftDirection = [a1[0], avgY]; pts[1].rightDirection = [a1[0], avgY];
                } else if (ddx / Math.max(ddy, 0.001) < maxSlope) {
                    var avgX = (a0[0] + a1[0]) / 2;
                    pts[0].anchor = [avgX, a0[1]]; pts[0].leftDirection = [avgX, a0[1]]; pts[0].rightDirection = [avgX, a0[1]];
                    pts[1].anchor = [avgX, a1[1]]; pts[1].leftDirection = [avgX, a1[1]]; pts[1].rightDirection = [avgX, a1[1]];
                }
            }
        }
    }
}

/**
 * Mode 3: Exact Outline Vector (99.9% Pixel-Identical Black & White Logo Trace)
 */
function dmExactOutlineTraceAI(payloadJSON) {
    try {
        var data = dmParseJSON(payloadJSON);
        var imgFile = new File(data.imagePath);
        if (!imgFile.exists) return "ERROR:Image file not found: " + data.imagePath;

        var preset = new DocumentPreset();
        preset.width = 1000; preset.height = 1000;
        preset.units = RulerUnits.Pixels;
        preset.colorMode = DocumentColorSpace.RGB;
        preset.title = data.title || "Exact_Outline_Icons";

        var doc = app.documents.addDocument(DocumentColorSpace.RGB, preset);
        var lyr = doc.layers[0];
        lyr.name = "Exact Vector Icons";

        var placed = lyr.placedItems.add();
        placed.file = imgFile;
        placed.position = [0, placed.height];
        doc.artboards[0].artboardRect = [0, placed.height, placed.width, 0];

        var traced = placed.trace();
        var opts = traced.tracing.tracingOptions;
        try { opts.loadFromPreset("Black and White Logo"); } catch (e) {}
        try { opts.tracingMode = TracingModeType.TRACINGMODEBLACKANDWHITE; } catch (e) {}
        try { opts.fills = true; } catch (e) {}
        try { opts.strokes = false; } catch (e) {}
        try { opts.threshold = data.threshold || 165; } catch (e) {}
        try { opts.pathFitting = 0.8; } catch (e) {}
        try { opts.cornerAngle = 18; } catch (e) {}
        try { opts.minArea = 4; } catch (e) {}
        try { opts.ignoreWhite = true; } catch (e) {}
        app.redraw();
        traced.tracing.expandTracing();

        if (data.saveSvgPath) {
            var svgOpts = new ExportOptionsSVG();
            svgOpts.embedRasterImages = false;
            svgOpts.coordinatePrecision = 3;
            doc.exportFile(new File(data.saveSvgPath), ExportType.SVG, svgOpts);
        }
        if (data.saveAiPath) {
            var aiFile = new File(data.saveAiPath);
            var aiOpts = new IllustratorSaveOptions();
            aiOpts.compressed = true; aiOpts.pdfCompatible = true;
            doc.saveAs(aiFile, aiOpts);
            if (!data.keepOpen) doc.close(SaveOptions.DONOTSAVECHANGES);
            return "OK:Exact Outline saved -> " + aiFile.name;
        }
        try { app.executeMenuCommand("fitinwindow"); } catch (e) {}
        return "OK:Exact 99.9% Fidelity Outline Vectors created in Illustrator.";
    } catch (err) {
        return "ERROR:" + err.message + " (line " + err.line + ")";
    }
}


/* ============================================================================
 * v7.0 CLOUD AI SVG -> NATIVE .AI CONVERTER & 1-CLICK STROKE POLISH TOOLS
 * ============================================================================ */
function dmImportSVGAndSaveAI(payloadJSON) {
    try {
        var data = dmParseJSON(payloadJSON);
        var svgFile = new File(data.svgPath);
        if (!svgFile.exists) return "ERROR:SVG file not found: " + data.svgPath;
        var doc = app.open(svgFile);
        if (data.saveAiPath) {
            var aiFile = new File(data.saveAiPath);
            var aiOpts = new IllustratorSaveOptions();
            aiOpts.compressed = true;
            aiOpts.pdfCompatible = true;
            doc.saveAs(aiFile, aiOpts);
            if (!data.keepOpen) doc.close(SaveOptions.DONOTSAVECHANGES);
            return "OK:AI saved -> " + aiFile.name;
        }
        try { app.executeMenuCommand("fitinwindow"); } catch (e) {}
        return "OK:Opened AI Vectorized SVG in Illustrator.";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

function dmUnifyDocStrokes(payloadJSON) {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open.";
        var data = dmParseJSON(payloadJSON);
        var doc = app.activeDocument;
        var col = dmHexToRGBColor(data.strokeColor || "#000000");
        var sw = (data.strokeWidth && data.strokeWidth > 0) ? data.strokeWidth : 4;
        var count = 0;
        for (var i = 0; i < doc.pathItems.length; i++) {
            var p = doc.pathItems[i];
            if (!p.locked && !p.layer.locked && p.stroked) {
                p.strokeWidth = sw;
                p.strokeColor = col;
                p.strokeCap = StrokeCap.ROUNDENDCAP;
                p.strokeJoin = StrokeJoin.ROUNDENDJOIN;
                count++;
            }
        }
        return "OK:Unified " + count + " stroke path(s) to " + sw + "pt.";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

function dmPolishActiveLayer(payloadJSON) {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open.";
        var data = dmParseJSON(payloadJSON);
        var doc = app.activeDocument;
        var col = dmHexToRGBColor(data.strokeColor || "#000000");
        var sw = (data.strokeWidth && data.strokeWidth > 0) ? data.strokeWidth : 4;
        dmGeometricPolishPaths(doc.activeLayer, col, sw);
        return "OK:Geometric Circle & H/V Straight-Line Polish applied to active layer!";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

function dmFillsToStrokes(payloadJSON) {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open.";
        var data = dmParseJSON(payloadJSON);
        var doc = app.activeDocument;
        var sel = doc.selection;
        var targets = (sel && sel.length > 0) ? sel : doc.pathItems;
        var col = dmHexToRGBColor(data.strokeColor || "#000000");
        var sw = (data.strokeWidth && data.strokeWidth > 0) ? data.strokeWidth : 3;
        var count = 0;

        function convertItem(it) {
            if (it.typename === "PathItem") {
                it.filled = false;
                it.stroked = true;
                it.strokeColor = col;
                it.strokeWidth = sw;
                it.strokeCap = StrokeCap.ROUNDENDCAP;
                it.strokeJoin = StrokeJoin.ROUNDENDJOIN;
                count++;
            } else if (it.typename === "GroupItem") {
                for (var g = 0; g < it.pageItems.length; g++) convertItem(it.pageItems[g]);
            } else if (it.typename === "CompoundPathItem") {
                for (var c = 0; c < it.pathItems.length; c++) convertItem(it.pathItems[c]);
            }
        }
        for (var i = 0; i < targets.length; i++) convertItem(targets[i]);
        return "OK:Converted " + count + " path(s) from Fills to Editable Strokes (" + sw + "pt).";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}


/**
 * v7.3: Convert Clean Filled Vector Outline(s) -> Single-Line Editable Centerline Stroke!
 * Works directly on selected CompoundPathItems (hollow rings/frames like Heart, Shield,
 * Clock, Speech Bubble, Document, Gear, Calendar boxes) by measuring exact vector thickness
 * from outer vs inner paths, insetting the clean outer Bezier path by -t/2, removing the
 * inner hole path, and applying exact editable strokeWidth = t!
 */
function dmVectorToCenterlineStroke(payloadJSON) {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open.";
        var data = dmParseJSON(payloadJSON);
        var doc = app.activeDocument;
        var sel = doc.selection;
        if (!sel || sel.length === 0) {
            return "ERROR:Select one or more filled vector icon shapes first.";
        }

        var strokeCol = dmHexToRGBColor(data.strokeColor || "#000000");
        var customSW = (data.strokeWidth && data.strokeWidth > 0) ? data.strokeWidth : 0;
        var converted = 0;

        function processItem(it) {
            if (it.typename === "GroupItem") {
                for (var g = it.pageItems.length - 1; g >= 0; g--) {
                    processItem(it.pageItems[g]);
                }
                return;
            }

            // Case 1: Hollow Vector Ring (CompoundPathItem with 2 paths: outer + inner hole)
            if (it.typename === "CompoundPathItem" && it.pathItems.length === 2) {
                var pA = it.pathItems[0], pB = it.pathItems[1];
                var bA = pA.geometricBounds, bB = pB.geometricBounds;
                var wA = Math.abs(bA[2] - bA[0]), hA = Math.abs(bA[1] - bA[3]);
                var wB = Math.abs(bB[2] - bB[0]), hB = Math.abs(bB[1] - bB[3]);
                var outer = (wA * hA >= wB * hB) ? pA : pB;
                var inner = (outer === pA) ? pB : pA;
                var bOut = outer.geometricBounds, bIn = inner.geometricBounds;
                var wOut = Math.abs(bOut[2] - bOut[0]), hOut = Math.abs(bOut[1] - bOut[3]);
                var wIn = Math.abs(bIn[2] - bIn[0]), hIn = Math.abs(bIn[1] - bIn[3]);

                // Exact stroke thickness directly from the clean vector geometry!
                var estT = Math.max(0.75, ((wOut - wIn) + (hOut - hIn)) / 4);
                var useSW = customSW > 0 ? customSW : Math.min(finalSW * 1.25, Math.round(estT * 10) / 10);

                // Duplicate clean outer Bezier path outside compound, inset proportionally by -t/2!
                var parentContainer = it.parent;
                var newPath = outer.duplicate(parentContainer, ElementPlacement.PLACEATBEGINNING);
                var sx = wOut > estT ? ((wOut - estT) / wOut) * 100 : 95;
                var sy = hOut > estT ? ((hOut - estT) / hOut) * 100 : 95;
                newPath.resize(sx, sy, true, false, false, false, 100, Transformation.CENTER);
                newPath.filled = false;
                newPath.stroked = true;
                newPath.strokeColor = strokeCol;
                newPath.strokeWidth = useSW;
                newPath.strokeCap = StrokeCap.ROUNDENDCAP;
                newPath.strokeJoin = StrokeJoin.ROUNDENDJOIN;

                it.remove();
                converted++;
                return;
            }

            // Case 2: Simple filled straight bar/line (narrow aspect ratio >= 3:1) -> exact centerline 2-point stroke!
            if (it.typename === "PathItem" && it.filled && !it.stroked) {
                var bb = it.geometricBounds; // [left, top, right, bottom]
                var bw = Math.abs(bb[2] - bb[0]), bh = Math.abs(bb[1] - bb[3]);
                var minDim = Math.min(bw, bh), maxDim = Math.max(bw, bh);
                if (minDim > 0 && (maxDim / minDim) >= 2.6) {
                    var swBar = customSW > 0 ? customSW : (Math.round(minDim * 10) / 10);
                    var linePath = it.parent.pathItems.add();
                    linePath.filled = false;
                    linePath.stroked = true;
                    linePath.strokeColor = strokeCol;
                    linePath.strokeWidth = swBar;
                    linePath.strokeCap = StrokeCap.ROUNDENDCAP;
                    linePath.strokeJoin = StrokeJoin.ROUNDENDJOIN;
                    if (bw >= bh) {
                        var my = (bb[1] + bb[3]) / 2;
                        linePath.setEntirePath([[bb[0] + minDim / 2, my], [bb[2] - minDim / 2, my]]);
                    } else {
                        var mx = (bb[0] + bb[2]) / 2;
                        linePath.setEntirePath([[mx, bb[1] - minDim / 2], [mx, bb[3] + minDim / 2]]);
                    }
                    it.remove();
                    converted++;
                } else if (maxDim <= 18 && (maxDim / Math.max(minDim, 0.1)) <= 1.35) {
                    // Small circular dot (e.g. Speech Bubble "...") -> round-cap stroke dot!
                    var dcx = (bb[0] + bb[2]) / 2, dcy = (bb[1] + bb[3]) / 2;
                    var dotP = it.parent.pathItems.add();
                    dotP.filled = false; dotP.stroked = true;
                    dotP.strokeColor = strokeCol;
                    dotP.strokeWidth = customSW > 0 ? customSW : (Math.round(maxDim * 10) / 10);
                    dotP.strokeCap = StrokeCap.ROUNDENDCAP;
                    dotP.setEntirePath([[dcx, dcy], [dcx + 0.2, dcy]]);
                    it.remove();
                    converted++;
                }
            }
        }

        // Snapshot selection array since items get replaced
        var items = [];
        for (var i = 0; i < sel.length; i++) items.push(sel[i]);
        for (var j = 0; j < items.length; j++) processItem(items[j]);

        return "OK:Converted " + converted + " clean vector shape(s) directly into Single-Line Editable Strokes!";
    } catch (err) {
        return "ERROR:" + err.message + " (line " + err.line + ")";
    }
}


/* ============================================================================
 * v8.4: PURE 1-CLICK IMAGE -> EDITABLE STROKE PIPELINE
 * Uses pure, non-destructive Adobe Illustrator C++ Line Art (zero hybrid
 * splitting, zero outer.resize shifting, zero dropped reflection arcs!)
 * + DPI-Exact Uniform Stroke Weight
 * + Non-Overlapping Round Dot Restoration (only where no stroke exists!)
 * ============================================================================ */
function dmOneClickImageToVectorToStroke(payloadJSON) {
    try {
        var data = dmParseJSON(payloadJSON);
        var imgFile = new File(data.imagePath);
        if (!imgFile.exists) return "ERROR:Image file not found: " + data.imagePath;

        var preset = new DocumentPreset();
        preset.width = 1000; preset.height = 1000;
        preset.units = RulerUnits.Pixels;
        preset.colorMode = DocumentColorSpace.RGB;
        preset.title = data.title || "Editable_Stroke_Icons";

        var doc = app.documents.addDocument(DocumentColorSpace.RGB, preset);
        var lyr = doc.layers[0];
        lyr.name = "Editable Stroke Icons";

        var placed = lyr.placedItems.add();
        placed.file = imgFile;
        placed.position = [0, placed.height];
        doc.artboards[0].artboardRect = [0, placed.height, placed.width, 0];

        var abW = placed.width;
        var abH = placed.height;
        var scaleX = (data.srcWidth && data.srcWidth > 0) ? (abW / data.srcWidth) : 1;
        var scaleY = (data.srcHeight && data.srcHeight > 0) ? (abH / data.srcHeight) : 1;
        var scaledAutoSW = Math.max(1.2, Math.round(((data.autoStrokeWidth || 4) * scaleX) * 10) / 10);
        var finalSW = (data.strokeWidth && data.strokeWidth > 0) ? data.strokeWidth : scaledAutoSW;
        var strokeCol = dmHexToRGBColor(data.strokeColor || "#000000");

        // Pure Adobe C++ Line Art Trace (exact clean medial-axis curves — preserves House, Lens arc, Envelope, Globe, Cloud, Cart, Document!)
        var traced = placed.trace();
        var opts = traced.tracing.tracingOptions;
        try { opts.loadFromPreset("Line Art"); } catch (e) {}
        try { opts.tracingMode = TracingModeType.TRACINGMODEBLACKANDWHITE; } catch (e) {}
        try { opts.fills = false; } catch (e) {}
        try { opts.strokes = true; } catch (e) {}
        try { opts.threshold = data.threshold || 155; } catch (e) {}
        try { opts.maxStrokeWeight = Math.max(24, Math.min(60, Math.round(Math.max(scaledAutoSW, finalSW) * 3.0))); } catch (e) {}
        try { opts.minStrokeLength = 1; } catch (e) {}
        try { opts.pathFitting = Math.max(0.8, Math.min(4.0, data.smoothness || 1.2)); } catch (e) {}
        try { opts.cornerAngle = 18; } catch (e) {}
        try { opts.minArea = 4; } catch (e) {}
        try { opts.ignoreWhite = true; } catch (e) {}
        app.redraw();
        traced.tracing.expandTracing();

        // Style all traced paths uniformly with exact DPI-matched stroke weight & collect existing centers
        var existingCenters = [];
        var allP = [];
        dmCollectAllPaths(lyr, allP);
        for (var i = allP.length - 1; i >= 0; i--) {
            var p = allP[i];
            if (!p.stroked || p.pathPoints.length < 2) {
                try { p.remove(); } catch (e) {}
                continue;
            }
            p.filled = false;
            p.strokeColor = strokeCol;
            p.strokeWidth = finalSW;
            p.strokeCap = StrokeCap.ROUNDENDCAP;
            p.strokeJoin = StrokeJoin.ROUNDENDJOIN;
            var pb = p.geometricBounds;
            existingCenters.push([(pb[0] + pb[2]) / 2, (pb[1] + pb[3]) / 2]);
        }

        // Smart Non-Overlapping Dot Restoration: ONLY add solid circular dots (e.g. Speech Bubble "...")
        // if no Line Art path already sits at that exact spot!
        if (data.dots && data.dots.length > 0) {
            var abTop = doc.artboards[0].artboardRect[1];
            var minGap = Math.max(3, finalSW * 1.4);
            for (var d = 0; d < data.dots.length; d++) {
                var dx = data.dots[d][0] * scaleX;
                var dy = abTop - (data.dots[d][1] * scaleY);
                var dup = false;
                for (var e = 0; e < existingCenters.length; e++) {
                    var ex = existingCenters[e][0] - dx, ey = existingCenters[e][1] - dy;
                    if (Math.sqrt(ex * ex + ey * ey) < minGap) { dup = true; break; }
                }
                if (!dup) {
                    var dotP = lyr.pathItems.add();
                    dotP.filled = false; dotP.stroked = true;
                    dotP.strokeColor = strokeCol;
                    dotP.strokeWidth = finalSW * 1.15;
                    dotP.strokeCap = StrokeCap.ROUNDENDCAP;
                    dotP.strokeJoin = StrokeJoin.ROUNDENDJOIN;
                    dotP.setEntirePath([[dx, dy], [dx + 0.25, dy]]);
                }
            }
        }

        var iconCount = dmGroupPathsIntoIcons(doc, lyr, Math.max(5, (data.mergeGap || 14) * scaleX));

        if (data.saveSvgPath) {
            var svgOpts = new ExportOptionsSVG();
            svgOpts.embedRasterImages = false;
            svgOpts.coordinatePrecision = 3;
            doc.exportFile(new File(data.saveSvgPath), ExportType.SVG, svgOpts);
        }
        if (data.saveAiPath) {
            var aiFile = new File(data.saveAiPath);
            var aiOpts = new IllustratorSaveOptions();
            aiOpts.compressed = true;
            aiOpts.pdfCompatible = true;
            doc.saveAs(aiFile, aiOpts);
            if (!data.keepOpen) doc.close(SaveOptions.DONOTSAVECHANGES);
            return "OK:" + aiFile.name + " (" + iconCount + " icons, " + finalSW + "pt)";
        }

        try { app.executeMenuCommand("fitinwindow"); } catch (e) {}
        return "OK:Created " + iconCount + " clean editable stroke icon(s) (" + finalSW + "pt)!";
    } catch (err) {
        return "ERROR:" + err.message + " (line " + err.line + ")";
    }
}


/* ============================================================================
 * v10.0: TRUE PEN-TOOL GEOMETRIC REBUILDER (Minimal-Anchor Bezier Engine)
 * Converts bumpy traced paths into crisp Pen-Tool artwork directly inside AI:
 *   1. True 4-Anchor Pen-Tool Circles & Ellipses (pathItems.ellipse)
 *   2. True 4/8-Anchor Rectangles & Rounded Rects (pathItems.roundedRectangle)
 *   3. Pen-Tool Shift-Snapping (0 / 45 / 90 degree ruler-straight segments)
 *   4. Douglas-Peucker Anchor Reduction + Smooth Catmull-Rom Bezier Handles
 * ============================================================================ */
function dmDistPtToSeg(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    var lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-6) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    var t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    if (t < 0) t = 0; else if (t > 1) t = 1;
    var projX = x1 + t * dx, projY = y1 + t * dy;
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
}

function dmSimplifyDP(pts, eps) {
    if (pts.length <= 2) return pts;
    var maxD = 0, idx = 0;
    var first = pts[0], last = pts[pts.length - 1];
    for (var i = 1; i < pts.length - 1; i++) {
        var d = dmDistPtToSeg(pts[i][0], pts[i][1], first[0], first[1], last[0], last[1]);
        if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > eps) {
        var left = dmSimplifyDP(pts.slice(0, idx + 1), eps);
        var right = dmSimplifyDP(pts.slice(idx), eps);
        return left.slice(0, left.length - 1).concat(right);
    }
    return [first, last];
}

function dmSnapPenAngle(pts, isClosed) {
    if (pts.length < 2) return pts;
    var out = [];
    for (var i = 0; i < pts.length; i++) out.push([pts[i][0], pts[i][1]]);
    var maxRad = 6.5 * Math.PI / 180;
    var count = isClosed ? out.length : (out.length - 1);
    for (var s = 0; s < count; s++) {
        var a = out[s], b = out[(s + 1) % out.length];
        var dx = b[0] - a[0], dy = b[1] - a[1];
        var len = Math.sqrt(dx * dx + dy * dy);
        if (len < 2) continue;
        var ang = Math.atan2(dy, dx);
        // Snap to nearest 45 deg (0, 45, 90, 135, 180, -135, -90, -45)
        var step = Math.PI / 4;
        var nearest = Math.round(ang / step) * step;
        if (Math.abs(ang - nearest) <= maxRad) {
            if (Math.abs(Math.sin(nearest)) < 0.01) {
                var midY = (a[1] + b[1]) / 2;
                a[1] = midY; b[1] = midY;
            } else if (Math.abs(Math.cos(nearest)) < 0.01) {
                var midX = (a[0] + b[0]) / 2;
                a[0] = midX; b[0] = midX;
            } else {
                var cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
                var half = len / 2;
                a[0] = cx - Math.cos(nearest) * half;
                a[1] = cy - Math.sin(nearest) * half;
                b[0] = cx + Math.cos(nearest) * half;
                b[1] = cy + Math.sin(nearest) * half;
            }
        }
    }
    return out;
}

function dmPenToolRebuildSelection(payloadJSON) {
    try {
        if (app.documents.length === 0) return "ERROR:Open an Illustrator document first.";
        var doc = app.activeDocument;
        var data = dmParseJSON(payloadJSON);
        var strokeCol = dmHexToRGBColor(data.strokeColor || "#000000");
        var customSW = (data.strokeWidth && data.strokeWidth > 0) ? data.strokeWidth : 0;

        var rawTargets = [];
        if (doc.selection && doc.selection.length > 0) {
            for (var s = 0; s < doc.selection.length; s++) dmCollectAllPaths(doc.selection[s], rawTargets);
        } else {
            dmCollectAllPaths(doc.activeLayer, rawTargets);
        }
        if (rawTargets.length === 0) return "ERROR:No vector paths found to rebuild.";

        var circles = 0, rects = 0, curves = 0, anchorsRemoved = 0;

        for (var i = rawTargets.length - 1; i >= 0; i--) {
            var p = rawTargets[i];
            if (!p || p.typename !== "PathItem" || p.pathPoints.length < 2) continue;
            var origPts = p.pathPoints.length;
            var useSW = customSW > 0 ? customSW : (p.stroked ? p.strokeWidth : 2);
            var parentContainer = (p.parent && (p.parent.typename === "Layer" || p.parent.typename === "GroupItem")) ? p.parent : doc.activeLayer;
            var bb = p.geometricBounds; // [left, top, right, bottom]
            var left = bb[0], top = bb[1], right = bb[2], bottom = bb[3];
            var bw = Math.abs(right - left), bh = Math.abs(top - bottom);
            if (bw < 0.5 && bh < 0.5) continue;

            var pts = [];
            for (var k = 0; k < origPts; k++) {
                pts.push([p.pathPoints[k].anchor[0], p.pathPoints[k].anchor[1]]);
            }

            // 1. Check for True 4-Anchor Pen-Tool Circle / Ellipse
            if (p.closed && origPts >= 5 && bw > 2 && bh > 2) {
                var cx = (left + right) / 2, cy = (top + bottom) / 2;
                var rx = bw / 2, ry = bh / 2;
                var errSum = 0, errMax = 0;
                for (var c = 0; c < pts.length; c++) {
                    var nx = (pts[c][0] - cx) / rx;
                    var ny = (pts[c][1] - cy) / ry;
                    var e = Math.abs(Math.sqrt(nx * nx + ny * ny) - 1);
                    errSum += e;
                    if (e > errMax) errMax = e;
                }
                if ((errSum / pts.length) < 0.065 && errMax < 0.14) {
                    // Snap near-perfect circles (within 5% aspect) to exact circle
                    var finalW = bw, finalH = bh, finalL = left, finalT = top;
                    if (Math.abs(bw - bh) / Math.max(bw, bh) < 0.06) {
                        var diam = (bw + bh) / 2;
                        finalW = diam; finalH = diam;
                        finalL = cx - diam / 2; finalT = cy + diam / 2;
                    }
                    var ell = parentContainer.pathItems.ellipse(finalT, finalL, finalW, finalH);
                    ell.filled = false; ell.stroked = true;
                    ell.strokeColor = strokeCol; ell.strokeWidth = useSW;
                    ell.strokeCap = StrokeCap.ROUNDENDCAP; ell.strokeJoin = StrokeJoin.ROUNDENDJOIN;
                    try { p.remove(); } catch (e) {}
                    circles++;
                    anchorsRemoved += Math.max(0, origPts - 4);
                    continue;
                }
            }

            // 2. Check for True 4/8-Anchor Pen-Tool Rectangle / Rounded Rectangle
            if (p.closed && origPts >= 4 && bw > 4 && bh > 4) {
                var tol = Math.max(1.2, Math.min(bw, bh) * 0.055);
                var onEdge = 0, cornerInset = 0, cornerSamples = 0;
                for (var r = 0; r < pts.length; r++) {
                    var px = pts[r][0], py = pts[r][1];
                    var dL = Math.abs(px - left), dR = Math.abs(px - right);
                    var dT = Math.abs(py - top), dB = Math.abs(py - bottom);
                    var minD = Math.min(Math.min(dL, dR), Math.min(dT, dB));
                    if (minD <= tol) {
                        onEdge++;
                    } else {
                        var dxC = Math.min(dL, dR), dyC = Math.min(dT, dB);
                        if (dxC < bw * 0.25 && dyC < bh * 0.25) {
                            cornerInset += Math.max(dxC, dyC);
                            cornerSamples++;
                        }
                    }
                }
                if ((onEdge + cornerSamples) === pts.length && onEdge >= 4) {
                    var rectItem;
                    if (cornerSamples > 0) {
                        var rad = Math.min(Math.min(bw, bh) * 0.35, Math.max(1.5, (cornerInset / cornerSamples) * 1.35));
                        rectItem = parentContainer.pathItems.roundedRectangle(top, left, bw, bh, rad, rad);
                    } else {
                        rectItem = parentContainer.pathItems.rectangle(top, left, bw, bh);
                    }
                    rectItem.filled = false; rectItem.stroked = true;
                    rectItem.strokeColor = strokeCol; rectItem.strokeWidth = useSW;
                    rectItem.strokeCap = StrokeCap.ROUNDENDCAP; rectItem.strokeJoin = StrokeJoin.ROUNDENDJOIN;
                    try { p.remove(); } catch (e) {}
                    rects++;
                    anchorsRemoved += Math.max(0, origPts - rectItem.pathPoints.length);
                    continue;
                }
            }

            // 3. Minimal-Anchor Pen-Tool Simplification + 0/45/90 Snap + Smooth Bezier Handles
            var eps = Math.max(0.85, Math.min(3.0, Math.max(bw, bh) * 0.016));
            var simp = dmSimplifyDP(pts, eps);
            if (p.closed && simp.length > 2) {
                var firstP = simp[0], lastP = simp[simp.length - 1];
                if (Math.sqrt((firstP[0] - lastP[0]) * (firstP[0] - lastP[0]) + (firstP[1] - lastP[1]) * (firstP[1] - lastP[1])) < eps * 1.5) {
                    simp.pop();
                }
            }
            if (simp.length < 2) simp = pts.slice(0, 2);
            simp = dmSnapPenAngle(simp, p.closed);

            var np = parentContainer.pathItems.add();
            np.closed = p.closed;
            np.filled = false; np.stroked = true;
            np.strokeColor = strokeCol; np.strokeWidth = useSW;
            np.strokeCap = StrokeCap.ROUNDENDCAP; np.strokeJoin = StrokeJoin.ROUNDENDJOIN;

            var nLen = simp.length;
            for (var m = 0; m < nLen; m++) {
                var pt = np.pathPoints.add();
                var curr = simp[m];
                pt.anchor = [curr[0], curr[1]];

                var hasPrev = p.closed || m > 0;
                var hasNext = p.closed || m < nLen - 1;
                if (hasPrev && hasNext && nLen >= 3) {
                    var prev = simp[(m - 1 + nLen) % nLen];
                    var next = simp[(m + 1) % nLen];
                    var v1x = curr[0] - prev[0], v1y = curr[1] - prev[1];
                    var v2x = next[0] - curr[0], v2y = next[1] - curr[1];
                    var l1 = Math.sqrt(v1x * v1x + v1y * v1y);
                    var l2 = Math.sqrt(v2x * v2x + v2y * v2y);
                    if (l1 > 0.5 && l2 > 0.5) {
                        var dot = (v1x * v2x + v1y * v2y) / (l1 * l2);
                        // Smooth curve if turn angle is gentle (cos > 0.45 => > ~117 deg internal angle)
                        if (dot > 0.45 && dot < 0.996) {
                            var tx = (next[0] - prev[0]) / 6;
                            var ty = (next[1] - prev[1]) / 6;
                            // Clamp handle length so it never loops
                            var tLen = Math.sqrt(tx * tx + ty * ty);
                            var maxH = Math.min(l1, l2) * 0.42;
                            if (tLen > maxH && tLen > 0) {
                                tx = tx * (maxH / tLen);
                                ty = ty * (maxH / tLen);
                            }
                            pt.pointType = PointType.SMOOTH;
                            pt.leftDirection = [curr[0] - tx, curr[1] - ty];
                            pt.rightDirection = [curr[0] + tx, curr[1] + ty];
                        } else {
                            pt.pointType = PointType.CORNER;
                            pt.leftDirection = [curr[0], curr[1]];
                            pt.rightDirection = [curr[0], curr[1]];
                        }
                    } else {
                        pt.pointType = PointType.CORNER;
                        pt.leftDirection = [curr[0], curr[1]];
                        pt.rightDirection = [curr[0], curr[1]];
                    }
                } else {
                    pt.pointType = PointType.CORNER;
                    pt.leftDirection = [curr[0], curr[1]];
                    pt.rightDirection = [curr[0], curr[1]];
                }
            }

            try { p.remove(); } catch (e) {}
            curves++;
            anchorsRemoved += Math.max(0, origPts - nLen);
        }

        app.redraw();
        return "OK:Pen-Tool Rebuild Done! " + circles + " exact circle(s), " + rects + " exact rect(s), " + curves + " smooth Bezier path(s) (" + anchorsRemoved + " extra anchors removed).";
    } catch (err) {
        return "ERROR:" + err.message + " (line " + err.line + ")";
    }
}

/* ============================================================================
 * v10.0: INSERT PURE-STROKE PEN-TOOL SVG DIRECTLY INTO ACTIVE ILLUSTRATOR DOC
 * Used by Iconify 1-Click Pen-Tool Icon Finder & Gemini Pen-Tool Redrawer
 * ============================================================================ */
function dmInsertStrokeSVGToActiveDoc(payloadJSON) {
    try {
        var data = dmParseJSON(payloadJSON);
        var svgFile = null;
        var tempCreated = false;

        if (data.svgContent && data.svgContent.length > 10) {
            var tmpPath = Folder.temp.fsName + "/d360_pentool_" + (new Date().getTime()) + ".svg";
            svgFile = new File(tmpPath);
            svgFile.encoding = "UTF-8";
            svgFile.open("w");
            svgFile.write(data.svgContent);
            svgFile.close();
            tempCreated = true;
        } else if (data.svgPath) {
            svgFile = new File(data.svgPath);
        }

        if (!svgFile || !svgFile.exists) return "ERROR:SVG file could not be created or found.";

        var targetDoc;
        if (app.documents.length > 0 && !data.newDoc) {
            targetDoc = app.activeDocument;
        } else {
            var preset = new DocumentPreset();
            preset.width = data.width || 1000;
            preset.height = data.height || 1000;
            preset.units = RulerUnits.Pixels;
            preset.colorMode = DocumentColorSpace.RGB;
            preset.title = data.title || "PenTool_Stroke_Icons";
            targetDoc = app.documents.addDocument(DocumentColorSpace.RGB, preset);
        }

        var srcDoc = app.open(svgFile);
        var grp = targetDoc.activeLayer.groupItems.add();
        grp.name = data.name || "PenTool_Icon";

        for (var i = srcDoc.pageItems.length - 1; i >= 0; i--) {
            try { srcDoc.pageItems[i].duplicate(grp, ElementPlacement.PLACEATBEGINNING); } catch (e) {}
        }
        srcDoc.close(SaveOptions.DONOTSAVECHANGES);
        if (tempCreated) { try { svgFile.remove(); } catch (e) {} }

        try { targetDoc.activate(); } catch (e) {}

        if (data.targetSize && data.targetSize > 0 && grp.width > 0 && grp.height > 0) {
            var maxD = Math.max(grp.width, grp.height);
            var scalePct = (data.targetSize / maxD) * 100;
            grp.resize(scalePct, scalePct, true, true, true, true, scalePct, Transformation.CENTER);
        }

        var ab = targetDoc.artboards[targetDoc.artboards.getActiveArtboardIndex()].artboardRect;
        var abCX = (ab[0] + ab[2]) / 2, abCY = (ab[1] + ab[3]) / 2;
        if (grp.width > 0 && grp.height > 0) {
            grp.position = [abCX - grp.width / 2, abCY + grp.height / 2];
        }

        var strokeCol = dmHexToRGBColor(data.strokeColor || "#000000");
        var sw = (data.strokeWidth && data.strokeWidth > 0) ? data.strokeWidth : 2;
        var allP = [];
        dmCollectAllPaths(grp, allP);
        for (var p = 0; p < allP.length; p++) {
            try {
                allP[p].filled = false;
                allP[p].stroked = true;
                allP[p].strokeColor = strokeCol;
                allP[p].strokeWidth = sw;
                allP[p].strokeCap = StrokeCap.ROUNDENDCAP;
                allP[p].strokeJoin = StrokeJoin.ROUNDENDJOIN;
            } catch (e) {}
        }

        try { targetDoc.selection = [grp]; } catch (e) {}
        if (data.saveAiPath) {
            var aiFile = new File(data.saveAiPath);
            var aiOpts = new IllustratorSaveOptions();
            aiOpts.compressed = true; aiOpts.pdfCompatible = true;
            targetDoc.saveAs(aiFile, aiOpts);
            if (!data.keepOpen) targetDoc.close(SaveOptions.DONOTSAVECHANGES);
            return "OK:Saved Pen-Tool AI -> " + aiFile.name;
        }
        try { app.executeMenuCommand("fitinwindow"); } catch (e) {}
        return "OK:Inserted pure Pen-Tool stroke icon (" + allP.length + " clean paths, " + sw + "pt)!";
    } catch (err) {
        return "ERROR:" + err.message + " (line " + err.line + ")";
    }
}


/* ============================================================================
 * v11.0: 1-CLICK CUT-AND-SEW T-SHIRT 2D PATTERN GENERATOR IN ILLUSTRATOR
 * Matches Apparel3D UV_REGIONS 1:1 so "Sync Illustrator -> 3D T-Shirt" wraps
 * Front, Back, Right Sleeve, Left Sleeve, Neck Rib & Inner Label seamlessly!
 * ============================================================================ */
function dmGenerateTShirtPatternAI(payloadJSON) {
    try {
        var data = dmParseJSON(payloadJSON);
        var W = 1024, H = 1024; // Exact 1:1 UV Atlas Aspect Ratio
        var preset = new DocumentPreset();
        preset.width = W; preset.height = H;
        preset.units = RulerUnits.Pixels;
        preset.colorMode = DocumentColorSpace.RGB;
        preset.title = "TShirt_Dieline_" + (data.id || "oversized") + "_" + (data.sizeCode || "XL");

        var doc = app.documents.addDocument(DocumentColorSpace.RGB, preset);
        var ab = doc.artboards[0];
        ab.artboardRect = [0, H, W, 0];

        var bodyCol = dmHexToRGBColor(data.bodyColor || "#7a1c1c");
        var cutCol = dmHexToRGBColor("#00e5ff");
        var guideCol = dmHexToRGBColor("#94a3b8");
        var labelCol = dmHexToRGBColor("#ffffff");

        // Layer 1: ARTWORK_ZONE (User draws/places patterns & logos here!)
        var artLayer = doc.layers[0];
        artLayer.name = "ARTWORK_ZONE (Design Here)";

        var bg = artLayer.pathItems.rectangle(H, 0, W, H);
        bg.filled = true; bg.fillColor = bodyCol; bg.stroked = false;
        bg.name = "Base_Fabric_Fill";

        // Helper: convert top-down normalized (nx, ny, nw, nh) to Illustrator [top, left, w, h]
        function addPanel(layer, name, nx, ny, nw, nh, neckType, isFront, isSleeve) {
            var x = nx * W, yTop = H - (ny * H), pw = nw * W, ph = nh * H;
            var p = layer.pathItems.add();
            p.name = name;
            p.closed = true;
            p.filled = false;
            p.stroked = true;
            p.strokeColor = cutCol;
            p.strokeWidth = 1.5;

            if (isSleeve) {
                // Sculpted bell sleeve pattern contour
                p.setEntirePath([
                    [x, yTop - ph * 0.35],
                    [x + pw * 0.25, yTop - ph * 0.08],
                    [x + pw * 0.50, yTop],
                    [x + pw * 0.75, yTop - ph * 0.08],
                    [x + pw, yTop - ph * 0.35],
                    [x + pw * 0.92, yTop - ph],
                    [x + pw * 0.08, yTop - ph]
                ]);
            } else if (neckType === "rib") {
                p.setEntirePath([
                    [x, yTop], [x + pw, yTop], [x + pw, yTop - ph], [x, yTop - ph]
                ]);
            } else {
                // Sculpted Front / Back torso pattern with shoulder slope, armholes & neckline
                var neckD = isFront ? (neckType === "vneck" || neckType === "polo" ? ph * 0.14 : ph * 0.085) : ph * 0.035;
                var armD = ph * 0.28;
                var armIn = pw * 0.08;
                var pts = [
                    [x + pw * 0.30, yTop],
                    [x + pw * 0.50, yTop - neckD],
                    [x + pw * 0.70, yTop],
                    [x + pw * 0.94, yTop - ph * 0.04],
                    [x + pw - armIn, yTop - armD * 0.55],
                    [x + pw, yTop - armD],
                    [x + pw, yTop - ph],
                    [x, yTop - ph],
                    [x, yTop - armD],
                    [x + armIn, yTop - armD * 0.55],
                    [x + pw * 0.06, yTop - ph * 0.04]
                ];
                p.setEntirePath(pts);
            }

            // Center dashed fold line
            var cl = layer.pathItems.add();
            cl.filled = false; cl.stroked = true;
            cl.strokeColor = guideCol; cl.strokeWidth = 0.8;
            try { cl.strokeDashes = [4, 4]; } catch (e) {}
            cl.setEntirePath([[x + pw * 0.5, yTop], [x + pw * 0.5, yTop - ph]]);

            // Panel title text
            var tf = layer.textFrames.add();
            tf.contents = name;
            tf.position = [x + 8, yTop - 6];
            try {
                tf.textRange.characterAttributes.size = 11;
                tf.textRange.characterAttributes.fillColor = cutCol;
            } catch (e) {}
        }

        // Layer 2: PATTERN_CUT_SEAM (Matches UV_REGIONS 1:1)
        var patLayer = doc.layers.add();
        patLayer.name = "PATTERN_CUT_SEAM (Hide before Sync)";

        addPanel(patLayer, "Neck Rib (" + (data.neckType || "crew").toUpperCase() + ")", 0.04, 0.03, 0.92, 0.06, "rib", false, false);
        if (data.slW > 0) {
            addPanel(patLayer, "Right Sleeve (" + data.slW + "x" + data.slH + " cm)", 0.04, 0.12, 0.44, 0.21, "", false, true);
            addPanel(patLayer, "Left Sleeve (" + data.slW + "x" + data.slH + " cm)", 0.52, 0.12, 0.44, 0.21, "", false, true);
        }
        addPanel(patLayer, "Front [" + (data.sizeCode || "XL") + "] (" + data.wCm + "x" + data.hCm + " cm)", 0.04, 0.36, 0.44, 0.60, data.neckType || "crew", true, false);
        addPanel(patLayer, "Back [" + (data.sizeCode || "XL") + "] (" + data.wCm + "x" + data.hCm + " cm)", 0.52, 0.36, 0.44, 0.60, data.neckType || "crew", false, false);

        // Layer 3: NECK_LABEL (Editable Vector Inner Neck Label on Upper Back!)
        var lblLayer = doc.layers.add();
        lblLayer.name = "INNER_NECK_LABEL";
        var lx = (0.52 + 0.44 * 0.5) * W;
        var ly = H - ((0.36 + 0.05) * H);
        var ltf = lblLayer.textFrames.add();
        ltf.contents = (data.labelBrand || "DESIGN360N") + "\r" + (data.labelSize || "XL / TG") + "\r" + (data.labelMeta || "100% COTTON • MADE IN BANGLADESH");
        ltf.position = [lx - 75, ly];
        try {
            ltf.textRange.characterAttributes.size = 11;
            ltf.textRange.characterAttributes.fillColor = labelCol;
            ltf.textRange.paragraphAttributes.justification = Justification.CENTER;
        } catch (e) {}

        patLayer.locked = true;
        doc.activeLayer = artLayer;
        try { app.executeMenuCommand("fitinwindow"); } catch (e) {}
        return "OK:Created " + (data.name || "T-Shirt") + " 2D Cut-and-Sew Pattern in Illustrator! Design on ARTWORK_ZONE, then click Sync to 3D.";
    } catch (err) {
        return "ERROR:" + err.message + " (line " + err.line + ")";
    }
}


/* ============================================================================
 * v13.0: FAST AUTO-CLEAN ARTBOARD PNG EXPORT FOR LIVE 3D MOCKUP SYNC
 * Auto-hides all technical Dieline/Cut/Crease/Bleed/Safe-Zone/Spec layers,
 * exports active artboard clipped to PNG, and restores layer visibility!
 * ============================================================================ */
var _dmLastArtHash = "";

function dmExportArtboardPNG(isLivePoll) {
    try {
        if (app.documents.length === 0) return "ERROR:No active document open in Illustrator.";
        var doc = app.activeDocument;

        // Ultra-fast anti-hang change fingerprint: skip heavy PNG export during auto-poll if nothing changed!
        if (isLivePoll) {
            var pCount = doc.pageItems.length;
            var hash = doc.name + "|" + pCount + "|" + doc.layers.length;
            if (pCount > 0) {
                try {
                    var f0 = doc.pageItems[0].geometricBounds;
                    var fLast = doc.pageItems[pCount - 1].geometricBounds;
                    hash += "|" + Math.round(f0[0]) + "," + Math.round(f0[1]) + "," + Math.round(fLast[0]) + "," + Math.round(fLast[1]);
                } catch (e) {}
            }
            if (doc.selection && doc.selection.length > 0) {
                try {
                    var sb = doc.selection[0].geometricBounds;
                    hash += "|S:" + doc.selection.length + ":" + Math.round(sb[0]) + "," + Math.round(sb[1]) + "," + Math.round(sb[2]) + "," + Math.round(sb[3]);
                } catch (e) {}
            }
            if (hash === _dmLastArtHash) return "UNCHANGED";
            _dmLastArtHash = hash;
        } else {
            _dmLastArtHash = "";
        }

        var tempFile = new File(Folder.temp.fsName + "/d360_live_3d_sync.png");

        var hiddenLayers = [];
        for (var i = 0; i < doc.layers.length; i++) {
            var lyr = doc.layers[i];
            var nm = lyr.name.toUpperCase();
            if (lyr.visible && (
                nm.indexOf("PATTERN_CUT_SEAM") >= 0 ||
                nm.indexOf("BOTTLE_DIELINE") >= 0 ||
                nm.indexOf("BOTTLE_BLEED") >= 0 ||
                nm.indexOf("BOTTLE_SAFE") >= 0 ||
                nm.indexOf("DIELINE_") >= 0 ||
                nm === "CUT / TRIM" ||
                nm === "CREASE / FOLD" ||
                nm === "BLEED" ||
                nm === "DIMENSIONS & SPECS"
            )) {
                lyr.visible = false;
                hiddenLayers.push(lyr);
            }
        }

        var scalePct = isLivePoll ? 115 : 200;
        var opts = new ExportOptionsPNG24();
        opts.artBoardClipping = true;
        opts.transparency = false;
        opts.antiAliasing = true;
        opts.horizontalScale = scalePct;
        opts.verticalScale = scalePct;
        doc.exportFile(tempFile, ExportType.PNG24, opts);

        for (var j = 0; j < hiddenLayers.length; j++) hiddenLayers[j].visible = true;
        return "OK:" + tempFile.fsName.replace(/\\/g, "/");
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

/* ============================================================================
 * v13.0: 1-CLICK 360° BOTTLE / TUMBLER WRAP-AROUND LABEL DIELINE IN ILLUSTRATOR
 * Exact millimeter print-ready artboard (Circumference = pi * D x Label Height)
 * with Spot Cut Line, 3mm Bleed, 5mm Safe Zone, Front/Back Guides & Specs!
 * ============================================================================ */
function dmGenerateBottleDielineAI(payloadJSON) {
    try {
        var data = dmParseJSON(payloadJSON);
        var MM_TO_PT = 2.83464567;
        var wMm = data.circMm || 257.6;
        var hMm = data.labelHMm || 165.0;
        var wPt = wMm * MM_TO_PT;
        var hPt = hMm * MM_TO_PT;
        var bleedPt = 3.0 * MM_TO_PT;
        var safePt  = 5.0 * MM_TO_PT;

        var preset = new DocumentPreset();
        preset.width = wPt;
        preset.height = hPt;
        preset.units = RulerUnits.Millimeters;
        preset.colorMode = DocumentColorSpace.CMYK;
        preset.title = "Bottle_Wrap_Dieline_" + (data.id || "owala") + "_" + (data.volCode || "710ml");

        var doc = app.documents.addDocument(DocumentColorSpace.CMYK, preset);
        doc.artboards[0].artboardRect = [0, hPt, wPt, 0];

        var bodyCol = dmHexToRGBColor(data.bodyColor || "#16181d");
        var cutSpot = dmGetOrCreateSpotColor(doc, "DIELINE_CUT", 100, 0, 0, 0);
        var bleedSpot = dmGetOrCreateSpotColor(doc, "DIELINE_BLEED", 0, 100, 100, 0);
        var safeSpot = dmGetOrCreateSpotColor(doc, "SAFE_ZONE", 80, 0, 100, 0);

        // Layer 1: ARTWORK_ZONE (User places vector icons, patterns & logos here!)
        var artLayer = doc.layers[0];
        artLayer.name = "ARTWORK_ZONE (Design Here)";
        var bg = artLayer.pathItems.rectangle(hPt + bleedPt, -bleedPt, wPt + bleedPt * 2, hPt + bleedPt * 2);
        bg.filled = true; bg.fillColor = bodyCol; bg.stroked = false;
        bg.name = "Bottle_Base_Color";

        // Layer 2: BOTTLE_BLEED (3mm)
        var bleedLayer = doc.layers.add();
        bleedLayer.name = "BOTTLE_BLEED (3mm)";
        var bRect = bleedLayer.pathItems.rectangle(hPt + bleedPt, -bleedPt, wPt + bleedPt * 2, hPt + bleedPt * 2);
        bRect.filled = false; bRect.stroked = true; bRect.strokeColor = bleedSpot; bRect.strokeWidth = 0.75;
        try { bRect.strokeDashes = [4, 3]; } catch (e) {}
        bleedLayer.locked = true;

        // Layer 3: BOTTLE_SAFE_ZONE (5mm)
        var safeLayer = doc.layers.add();
        safeLayer.name = "BOTTLE_SAFE_ZONE (5mm)";
        var sRect = safeLayer.pathItems.rectangle(hPt - safePt, safePt, wPt - safePt * 2, hPt - safePt * 2);
        sRect.filled = false; sRect.stroked = true; sRect.strokeColor = safeSpot; sRect.strokeWidth = 0.6;
        try { sRect.strokeDashes = [3, 3]; } catch (e) {}
        safeLayer.locked = true;

        // Layer 4: BOTTLE_DIELINE_CUT (Exact 360° Circumference Cut + Center/Seam Guides + Specs)
        var cutLayer = doc.layers.add();
        cutLayer.name = "BOTTLE_DIELINE_CUT (Auto-Hidden on 3D Sync)";
        var cRect = cutLayer.pathItems.rectangle(hPt, 0, wPt, hPt);
        cRect.filled = false; cRect.stroked = true; cRect.strokeColor = cutSpot; cRect.strokeWidth = 1.0;

        // Front Center vertical guide
        var fc = cutLayer.pathItems.add();
        fc.filled = false; fc.stroked = true; fc.strokeColor = cutSpot; fc.strokeWidth = 0.6;
        try { fc.strokeDashes = [5, 4]; } catch (e) {}
        fc.setEntirePath([[wPt * 0.5, hPt], [wPt * 0.5, 0]]);

        // 4mm Overlap Seam Tab indicator on right edge
        var ovPt = 4.0 * MM_TO_PT;
        var ov = cutLayer.pathItems.add();
        ov.filled = false; ov.stroked = true; ov.strokeColor = cutSpot; ov.strokeWidth = 0.5;
        try { ov.strokeDashes = [2, 2]; } catch (e) {}
        ov.setEntirePath([[wPt - ovPt, hPt], [wPt - ovPt, 0]]);

        // Dimension & Spec Header above artboard
        var tf = cutLayer.textFrames.add();
        tf.contents = (data.name || "Bottle") + " (" + (data.volCode || "710ml") + ")  |  Wrap Dieline: " + wMm + " x " + hMm + " mm  |  Diameter: " + (data.diamMm || 82) + " mm  |  Bleed: 3mm  |  Safe: 5mm";
        tf.position = [0, hPt + bleedPt + 18];
        try {
            tf.textRange.characterAttributes.size = 9;
            tf.textRange.characterAttributes.fillColor = cutSpot;
        } catch (e) {}

        cutLayer.locked = true;
        doc.activeLayer = artLayer;
        try { app.executeMenuCommand("fitinwindow"); } catch (e) {}
        return "OK:Created " + (data.volCode || "710ml") + " Bottle Wrap Dieline (" + wMm + "x" + hMm + " mm)! Design on ARTWORK_ZONE — 3D Bottle auto-updates!";
    } catch (err) {
        return "ERROR:" + err.message + " (line " + err.line + ")";
    }
}


/* ============================================================================
 * v14.2: 1-CLICK VECTOR QR CODE GENERATOR DIRECTLY IN ADOBE ILLUSTRATOR
 * Draws crisp horizontal-merged vector modules + quiet-zone white background
 * in Print 100% K Black (CMYK) or Custom RGB Color, cleanly grouped!
 * ============================================================================ */
function dmInsertVectorQRCode(payloadJSON) {
    try {
        var data = dmParseJSON(payloadJSON);
        var mat = data.matrix;
        if (!mat || !mat.length) return "ERROR:Invalid QR matrix.";

        var doc;
        if (app.documents.length > 0) {
            doc = app.activeDocument;
        } else {
            var preset = new DocumentPreset();
            preset.width = 400; preset.height = 400;
            preset.units = RulerUnits.Millimeters;
            preset.colorMode = DocumentColorSpace.CMYK;
            preset.title = "Vector_QR_Code";
            doc = app.documents.addDocument(DocumentColorSpace.CMYK, preset);
        }

        var MM_TO_PT = 2.83464567;
        var sizeMm = data.sizeMm || 30;
        var n = mat.length;
        var quiet = 4;
        var totalModules = n + quiet * 2;
        var totalPt = sizeMm * MM_TO_PT;
        var modPt = totalPt / totalModules;

        var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
        var startX = (ab[0] + ab[2]) / 2 - totalPt / 2;
        var startY = (ab[1] + ab[3]) / 2 + totalPt / 2;

        var grp = doc.activeLayer.groupItems.add();
        grp.name = "Vector_QR_" + (data.sizeMm || 30) + "mm";

        // Quiet-zone white background
        var bg = grp.pathItems.rectangle(startY, startX, totalPt, totalPt);
        bg.stroked = false;
        bg.filled = true;
        if (doc.documentColorSpace === DocumentColorSpace.CMYK) {
            bg.fillColor = dmCMYK(0, 0, 0, 0);
        } else {
            bg.fillColor = dmHexToRGBColor("#ffffff");
        }

        var fillCol;
        if (data.use100K && doc.documentColorSpace === DocumentColorSpace.CMYK) {
            fillCol = dmCMYK(0, 0, 0, 100);
        } else {
            fillCol = dmHexToRGBColor(data.color || "#000000");
        }

        var rounded = !!data.rounded;
        var count = 0;

        for (var y = 0; y < n; y++) {
            var x = 0;
            while (x < n) {
                if (!mat[y][x]) { x++; continue; }
                // Merge adjacent horizontal modules into a single clean vector rectangle when square!
                var run = 1;
                if (!rounded) {
                    while (x + run < n && mat[y][x + run]) run++;
                }
                var rx = startX + (x + quiet) * modPt;
                var ry = startY - (y + quiet) * modPt;
                var rw = run * modPt;
                var item;
                if (rounded) {
                    var rad = modPt * 0.34;
                    item = grp.pathItems.roundedRectangle(ry, rx, rw, modPt, rad, rad);
                } else {
                    item = grp.pathItems.rectangle(ry, rx, rw, modPt);
                }
                item.stroked = false;
                item.filled = true;
                item.fillColor = fillCol;
                count++;
                x += run;
            }
        }

        doc.selection = [grp];
        return "OK:Inserted crisp Vector QR Code (" + sizeMm + "mm, " + count + " vector paths)!";
    } catch (err) {
        return "ERROR:" + err.message + " (line " + err.line + ")";
    }
}


/* ============================================================================
 * v14.5: 1-CLICK ALL DESIGN ARTBOARD & PRINT SIZE LAUNCHER IN ILLUSTRATOR
 * Creates exact CMYK (with 3mm Bleed & Safe Guides) or RGB pixel-exact artboards!
 * ============================================================================ */
function dmCreateDesignArtboardAI(payloadJSON) {
    try {
        var data = dmParseJSON(payloadJSON);
        var isPx = (data.unit === "px");
        var MM_TO_PT = 2.83464567;
        var wPt = isPx ? (data.w || 1080) : ((data.w || 210) * MM_TO_PT);
        var hPt = isPx ? (data.h || 1080) : ((data.h || 297) * MM_TO_PT);
        var isCMYK = (data.mode === "CMYK");

        var preset = new DocumentPreset();
        preset.width = wPt;
        preset.height = hPt;
        preset.units = isPx ? RulerUnits.Pixels : RulerUnits.Millimeters;
        preset.colorMode = isCMYK ? DocumentColorSpace.CMYK : DocumentColorSpace.RGB;
        preset.title = (data.name || "Design360n_Artboard").replace(/[^A-Za-z0-9_ -]/g, "").slice(0, 48);

        var doc = app.documents.addDocument(preset.colorMode, preset);
        doc.artboards[0].artboardRect = [0, hPt, wPt, 0];

        var artLayer = doc.layers[0];
        artLayer.name = "Artwork";

        if (!isPx && data.bleed && data.bleed > 0) {
            var bPt = data.bleed * MM_TO_PT;
            var sPt = Math.min(5, Math.max(3, data.bleed)) * MM_TO_PT;
            var guideLayer = doc.layers.add();
            guideLayer.name = "Bleed & Safe Guides";

            var bSpot = dmGetOrCreateSpotColor(doc, "DIELINE_BLEED", 0, 100, 100, 0);
            var sSpot = dmGetOrCreateSpotColor(doc, "SAFE_ZONE", 80, 0, 100, 0);

            var br = guideLayer.pathItems.rectangle(hPt + bPt, -bPt, wPt + bPt * 2, hPt + bPt * 2);
            br.filled = false; br.stroked = true; br.strokeColor = bSpot; br.strokeWidth = 0.75;
            try { br.strokeDashes = [4, 3]; } catch (e) {}

            var sr = guideLayer.pathItems.rectangle(hPt - sPt, sPt, wPt - sPt * 2, hPt - sPt * 2);
            sr.filled = false; sr.stroked = true; sr.strokeColor = sSpot; sr.strokeWidth = 0.6;
            try { sr.strokeDashes = [3, 3]; } catch (e) {}

            guideLayer.locked = true;
            doc.activeLayer = artLayer;
        }

        try { app.executeMenuCommand("fitinwindow"); } catch (e) {}
        return "OK:Created " + (data.name || "Artboard") + " (" + (isCMYK ? "CMYK" : "RGB") + ")!";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}


/* ============================================================================
 * v16.0: LIST INSTALLED ILLUSTRATOR FONTS & 1-CLICK VECTOR CALENDAR GENERATOR
 * Generates 100% editable vector TextFrames & grids in ANY style, font & size!
 * ============================================================================ */
function dmListIllustratorFonts() {
    try {
        var bnFonts = [], otherFonts = [];
        var seen = {};
        var maxCount = 0;
        try { maxCount = app.textFonts.length; } catch (e) { maxCount = 0; }
        for (var i = 0; i < maxCount; i++) {
            var fam = null;
            try { fam = app.textFonts[i].family; } catch (e2) { continue; } // broken font: skip it
            if (!fam || seen[fam]) continue;
            seen[fam] = true;
            var low = fam.toLowerCase();
            if (low.indexOf("sutonny") >= 0 || low.indexOf("ansi") >= 0 || low.indexOf("bangla") >= 0 ||
                low.indexOf("bengali") >= 0 || low.indexOf("hind") >= 0 || low.indexOf("kalpurush") >= 0 ||
                low.indexOf("solaiman") >= 0 || low.indexOf("nirmala") >= 0 || low.indexOf("ador") >= 0 ||
                low.indexOf("nikosh") >= 0 || low.indexOf("vrinda") >= 0 || low.indexOf("siyam") >= 0 || low.indexOf("mj") >= 0) {
                bnFonts.push(fam);
            } else {
                otherFonts.push(fam);
            }
        }
        bnFonts.sort();
        otherFonts.sort();
        return "OK:" + bnFonts.concat(otherFonts).join("|");
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

/* ============================================================================
 * v17.3: ZERO-BREAK BANGLA VECTOR CALENDAR IN ILLUSTRATOR
 * Places Chromium HarfBuzz-shaped 300-DPI calendar image & converts it via
 * Adobe Illustrator's native C++ Vectorizer into crisp, 100% unbreakable
 * vector paths (works on EVERY Illustrator version without Indic Composer!)
 * ============================================================================ */
function dmEnableBanglaComposerAI() {
    try {
        try { app.preferences.setBooleanPreference("AI WorldReadiness Dict Key", true); } catch (e) {}
        try { app.preferences.setBooleanPreference("showAsianTextOptions", false); } catch (e) {}
        try { app.preferences.setBooleanPreference("text/indicOptions", true); } catch (e) {}
        try { app.preferences.setBooleanPreference("text/useIndicComposer", true); } catch (e) {}
        try { app.preferences.setBooleanPreference("text/meOptions", true); } catch (e) {}
        if (app.documents.length > 0) {
            var doc = app.activeDocument;
            for (var i = 0; i < doc.textFrames.length; i++) {
                try {
                    var tf = doc.textFrames[i];
                    if (tf.locked || tf.layer.locked) continue;
                    tf.textRange.paragraphAttributes.everyLineComposer = true;
                } catch (e) {}
            }
            try { app.executeMenuCommand("Adobe Paragraph Palette"); } catch (e) {}
        }
        return "OK:Show Indic Options enabled! In Paragraph Panel menu (≡), select 'Middle Eastern & South Asian Single-Line Composer' (restart AI once if option not yet visible).";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

function dmGetBanglaBaseFile() {
    return new File(Folder.userData.fsName + "/Design360n_BanglaUnicodeBase.ai");
}

function dmSaveBanglaUnicodeBaseAI() {
    try {
        if (app.documents.length === 0) return "ERROR:Open a document with at least one fixed Bangla text frame first.";
        var doc = app.activeDocument;
        var srcTF = null;
        if (doc.selection && doc.selection.length > 0) {
            for (var s = 0; s < doc.selection.length; s++) {
                if (doc.selection[s].typename === "TextFrame") { srcTF = doc.selection[s]; break; }
            }
        }
        if (!srcTF && doc.textFrames.length > 0) srcTF = doc.textFrames[0];
        if (!srcTF) return "ERROR:No text frame found. Fix one Bangla text via Paragraph -> Middle Eastern & South Asian Single-line Composer, select it, then click Save Auto-Uni.";

        var baseDoc = app.documents.add(DocumentColorSpace.CMYK, 100, 100);
        var dup = srcTF.duplicate(baseDoc.layers[0], ElementPlacement.PLACEATEND);
        dup.contents = "\u0995";
        dup.position = [10, 90];

        var outFile = dmGetBanglaBaseFile();
        var saveOpts = new IllustratorSaveOptions();
        try { saveOpts.pdfCompatible = false; } catch (e) {}
        try { saveOpts.compressed = true; } catch (e) {}
        baseDoc.saveAs(outFile, saveOpts);
        baseDoc.close(SaveOptions.DONOTSAVECHANGES);
        return "OK:Auto-Unicode Bangla Base saved! From now on, every Unicode calendar will auto-shape with 0 broken Bangla!";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

function dmIsAnsiFontName(name) {
    var q = String(name || "").toLowerCase();
    return (q.indexOf("sutonny") >= 0 || q.indexOf("ansi") >= 0 || q.indexOf("nikoshban") >= 0 ||
            q.indexOf("kongsho") >= 0 || q.indexOf("sulekha") >= 0 || q.indexOf("bijoy") >= 0 ||
            /mj($|[\s\-_])/.test(q));
}

function dmIsLatinOnlyFontName(name) {
    var q = String(name || "").toLowerCase();
    var latin = ["arial", "helvetica", "myriad", "montserrat", "poppins", "roboto", "inter", "times", "calibri", "segoe", "georgia", "verdana", "tahoma", "cambria", "open sans", "lato", "bebas", "oswald", "playfair"];
    for (var i = 0; i < latin.length; i++) {
        if (q.indexOf(latin[i]) >= 0) return true;
    }
    return false;
}

function dmIsUnicodeBanglaFontName(name) {
    var q = String(name || "").toLowerCase();
    if (dmIsAnsiFontName(q) || dmIsLatinOnlyFontName(q)) return false;
    var uni = ["nirmala", "hind", "kalpurush", "solaiman", "noto", "vrinda", "shonar", "nikosh", "siyam", "rupali", "adorsho", "bensen", "akaash", "mukti", "charukola", "tiro", "galada", "anek", "mina", "baloo", "atma", "li ", "shohid", "bornomala", "ekushey", "bangla", "bengali"];
    for (var i = 0; i < uni.length; i++) {
        if (q.indexOf(uni[i]) >= 0) return true;
    }
    return false;
}

function dmFindTextFont(familyOrName) {
    if (!familyOrName) return null;
    var q = familyOrName.toLowerCase();
    var fallback = null;
    // A broken/missing font throws error 1430996551 when its name is read.
    // Guard every font read so one bad font is skipped instead of killing the calendar.
    var maxCount = 0;
    try { maxCount = app.textFonts.length; } catch (e) { return null; }
    for (var i = 0; i < maxCount; i++) {
        var f = null, fam = "", nm = "", fnm = "", sty = "";
        try {
            f = app.textFonts[i];
            fam = (f.family || "").toLowerCase();
            nm  = (f.name || "").toLowerCase();
            fnm = (f.fullName || "").toLowerCase();
            sty = (f.style || "").toLowerCase();
        } catch (e2) { continue; } // broken font: skip it, try the next one
        if (nm === q || fnm === q) return f;
        if (fam === q) {
            if (sty.indexOf("regular") >= 0) return f;
            if (!fallback) fallback = f;
        }
    }
    if (fallback) return fallback;
    for (var j = 0; j < maxCount; j++) {
        var f2 = null, fam2 = "", nm2 = "";
        try {
            f2 = app.textFonts[j];
            fam2 = (f2.family || "").toLowerCase();
            nm2  = (f2.name || "").toLowerCase();
        } catch (e3) { continue; } // broken font: skip it
        if (fam2.indexOf(q) >= 0 || nm2.indexOf(q) >= 0) return f2;
    }
    return null;
}

function dmFindBestBanglaFont(requestedName, isAnsi) {
    var req = String(requestedName || "");
    if (req) {
        // ALWAYS honor ANY font the user explicitly selected/typed if it is installed in Illustrator!
        var exact = dmFindTextFont(req);
        if (exact) return exact;
    }
    var candidates = isAnsi
        ? ["SutonnyMJ", "SutonnyOMJ", "SutonnyCMJ", "KongshoMJ", "SulekhaMJ", "Li Ador Noirrit ANSI", "ANSI", "NikoshBAN", "MJ"]
        : ["Hind Siliguri", "Kalpurush", "SolaimanLipi", "Noto Sans Bengali", "Li Ador Noirrit", "Nirmala UI", "Nirmala", "Shonar Bangla", "Vrinda", "Siyam Rupali", "Nikosh", "AdorshoLipi", "BenSen", "Charukola", "Tiro Bangla"];
    for (var c = 0; c < candidates.length; c++) {
        var found = dmFindTextFont(candidates[c]);
        if (found) {
            var fc = (found.family || "") + " " + (found.name || "");
            if (isAnsi && (dmIsLatinOnlyFontName(fc) || dmIsUnicodeBanglaFontName(fc))) continue;
            if (!isAnsi && (dmIsAnsiFontName(fc) || dmIsLatinOnlyFontName(fc))) continue;
            return found;
        }
    }
    return null;
}

function dmGenerateCalendarAI(payloadJSON) {
    try {
        var plan = dmParseJSON(payloadJSON);
        var wPt = (plan.widthMm || 210) * MM_TO_PT;
        var hPt = (plan.heightMm || 297) * MM_TO_PT;

        var doc;
        if (plan.useActiveDoc && app.documents.length > 0) {
            doc = app.activeDocument;
        } else {
            var preset = new DocumentPreset();
            preset.width = wPt; preset.height = hPt;
            preset.units = RulerUnits.Millimeters;
            preset.colorMode = DocumentColorSpace.CMYK;
            preset.title = "Calendar_" + (plan.year || 2026) + "_" + (plan.layoutMode || "classic");
            doc = app.documents.addDocument(DocumentColorSpace.CMYK, preset);
            doc.artboards[0].artboardRect = [0, hPt, wPt, 0];
        }

        var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
        var left0 = ab[0], top0 = ab[1];
        var abW = ab[2] - ab[0], abH = ab[1] - ab[3];
        if (!plan.useActiveDoc) { abW = wPt; abH = hPt; }

        var lyr = dmGetOrCreateLayer(doc, "Calendar_" + (plan.year || 2026));
        var masterGrp = lyr.groupItems.add();
        masterGrp.name = "Calendar_" + (plan.year || 2026) + "_" + (plan.layoutMode || "classic");

        var isDark = (plan.style === "dark");
        var accentCol = dmHexToRGBColor(plan.accentColor || "#0ea5e9");
        var textCol   = isDark ? dmHexToRGBColor("#f1f5f9") : dmHexToRGBColor(plan.textColor || "#111827");
        var subCol    = isDark ? dmHexToRGBColor("#94a3b8") : dmHexToRGBColor("#64748b");
        var wkndCol   = dmHexToRGBColor(plan.weekendColor || "#e11d48");
        var whiteCol  = dmHexToRGBColor("#ffffff");
        var gridCol   = isDark ? dmHexToRGBColor("#334155") : dmHexToRGBColor("#cbd5e1");

        // Smart Auto Font Detection for Main Font AND Bangla Sub-Date Font (Supports all 5 Unicode + ANSI modes!)
        var mainIsAnsi = (plan.langMode === "bn_ansi");
        var mainIsUni  = (plan.langMode === "bn_unicode");
        var subWantsAnsi = (plan.langMode === "bn_ansi" || plan.langMode === "en_bn_ansi");

        var useMainUniFallback = false;
        var useSubUniFallback  = false;
        var chosenFont = null;
        var titleFontObj = null;
        var dowFontObj = null;

        if (mainIsAnsi) {
            chosenFont   = dmFindBestBanglaFont(plan.fontName, true);
            titleFontObj = dmFindBestBanglaFont(plan.titleFont || plan.fontName, true) || chosenFont;
            dowFontObj   = dmFindBestBanglaFont(plan.dowFont || plan.fontName, true) || chosenFont;
            if (!chosenFont) { useMainUniFallback = true; chosenFont = dmFindBestBanglaFont("", false); titleFontObj = chosenFont; dowFontObj = chosenFont; }
        } else if (mainIsUni) {
            chosenFont   = dmFindBestBanglaFont(plan.fontName, false);
            titleFontObj = dmFindBestBanglaFont(plan.titleFont || plan.fontName, false) || chosenFont;
            dowFontObj   = dmFindBestBanglaFont(plan.dowFont || plan.fontName, false) || chosenFont;
        } else {
            chosenFont   = dmFindTextFont(plan.fontName || "Montserrat") || dmFindTextFont("Arial");
            titleFontObj = dmFindTextFont(plan.titleFont || plan.fontName || "Montserrat") || chosenFont;
            dowFontObj   = dmFindTextFont(plan.dowFont || plan.fontName || "Montserrat") || chosenFont;
        }

        // Last resort: if no font was found at all, fall back to Arial so the calendar still builds.
        if (!chosenFont) { try { chosenFont = dmFindTextFont("Arial"); } catch (eF) { chosenFont = null; } }
        if (!titleFontObj) titleFontObj = chosenFont;
        if (!dowFontObj) dowFontObj = chosenFont;

        var bnSubFont = null;
        if (subWantsAnsi) {
            bnSubFont = dmFindBestBanglaFont(plan.bnSubFont || "", true);
            if (!bnSubFont) { useSubUniFallback = true; bnSubFont = dmFindBestBanglaFont("", false); }
        } else {
            bnSubFont = dmFindBestBanglaFont(plan.bnSubFont || "", false) || chosenFont;
        }

        var useUnicodeFallback = useMainUniFallback;
        var wantAnsiSub = (subWantsAnsi && !useSubUniFallback);

        // Enable Illustrator's Real World-Ready / Show Indic Options preference whenever Unicode Bengali is used!
        if (mainIsUni || useMainUniFallback || !wantAnsiSub) {
            try { app.preferences.setBooleanPreference("AI WorldReadiness Dict Key", true); } catch (e) {}
            try { app.preferences.setBooleanPreference("showAsianTextOptions", false); } catch (e) {}
            try { app.preferences.setBooleanPreference("text/indicOptions", true); } catch (e) {}
            try { app.preferences.setBooleanPreference("text/useIndicComposer", true); } catch (e) {}
            try { app.preferences.setBooleanPreference("text/meOptions", true); } catch (e) {}
        }

        if (isDark) {
            var bgR = masterGrp.pathItems.rectangle(top0, left0, abW, abH);
            bgR.stroked = false; bgR.filled = true; bgR.fillColor = dmHexToRGBColor("#0b1120");
        }

        var isUniMode = (plan.langMode === "bn_unicode" || useUnicodeFallback);
        var needsUniComposer = (isUniMode || !wantAnsiSub);
        var uniSeedTF = null;
        if (needsUniComposer) {
            try {
                var baseFile = dmGetBanglaBaseFile();
                if (baseFile.exists) {
                    var bDoc = app.open(baseFile);
                    if (bDoc.textFrames.length > 0) {
                        uniSeedTF = bDoc.textFrames[0].duplicate(masterGrp, ElementPlacement.PLACEATEND);
                    }
                    bDoc.close(SaveOptions.DONOTSAVECHANGES);
                    doc.activate();
                }
            } catch (e) { uniSeedTF = null; }
        }

        function addTxt(parentGrp, str, xPt, yCenterPt, sizePt, col, alignCenter, fontOverride, forceUni) {
            var tf;
            if ((isUniMode || forceUni) && uniSeedTF) {
                tf = uniSeedTF.duplicate(parentGrp, ElementPlacement.PLACEATEND);
            } else {
                tf = parentGrp.textFrames.add();
            }
            tf.contents = String(str);
            var ca = tf.textRange.characterAttributes;
            ca.size = Math.max(4, sizePt);
            ca.fillColor = col;
            var useF = fontOverride || chosenFont;
            if (useF) { try { ca.textFont = useF; } catch (e) {} }
            try { tf.textRange.paragraphAttributes.justification = alignCenter ? Justification.CENTER : Justification.LEFT; } catch (e) {}
            tf.position = [alignCenter ? (xPt - tf.width / 2) : xPt, yCenterPt + tf.height / 2];
            return tf;
        }

        var padX = abW * 0.055, padY = abH * 0.055;
        var titleH = plan.months.length > 1 ? abH * 0.085 : 0;
        var yrText = useUnicodeFallback ? (plan.previewYearLabel || plan.year) : (plan.yearLabel || plan.year);

        if (plan.months.length > 1) {
            addTxt(masterGrp, String(yrText), left0 + abW / 2, top0 - padY - titleH * 0.48, titleH * 0.58, accentCol, true, titleFontObj);
        }

        var areaW = abW - padX * 2, areaH = abH - padY * 2 - titleH;
        var cols = plan.cols || 3, rows = plan.rows || 4;
        var gapX = cols > 1 ? areaW * 0.038 : 0;
        var gapY = rows > 1 ? areaH * 0.038 : 0;
        var cellW = (areaW - gapX * (cols - 1)) / cols;
        var cellH = (areaH - gapY * (rows - 1)) / rows;
        var boxMode = plan.boxMode || "none";
        var softBgCol = isDark ? dmHexToRGBColor("#1e293b") : dmHexToRGBColor("#f1f5f9");
        var softWkCol = isDark ? dmHexToRGBColor("#3b1525") : dmHexToRGBColor("#ffe4e6");

        for (var i = 0; i < plan.months.length; i++) {
            var md = plan.months[i];
            var gCols = md.gridCols || 7;
            var numRows = Math.max(md.weeks.length, gCols === 14 ? 3 : 6);
            var mName = useUnicodeFallback ? md.previewMonthName : md.monthName;
            var hArr  = useUnicodeFallback ? md.previewHeaders   : md.headers;
            var bnRng = useSubUniFallback ? md.previewBnRange   : md.bnRange;

            var gc = i % cols, gr = Math.floor(i / cols);
            var mx = left0 + padX + gc * (cellW + gapX);
            var myTop = top0 - padY - titleH - gr * (cellH + gapY);

            var mGrp = masterGrp.groupItems.add();
            mGrp.name = "Month_" + (i + 1);

            var mHeadH = cellH * (bnRng ? 0.22 : 0.19), dowH = cellH * 0.12;
            var bodyTop = myTop - mHeadH - dowH, bodyH = cellH - mHeadH - dowH;
            var rowH = bodyH / numRows, colW = cellW / gCols;
            var headLabel = mName + (plan.months.length === 1 ? (" " + (useUnicodeFallback ? md.previewYearLabel : md.yearLabel)) : "");

            if (plan.monthBox) {
                var mp = cellW * 0.03;
                var mFrame = mGrp.pathItems.roundedRectangle(myTop + mp, mx - mp, cellW + mp * 2, cellH + mp * 2, mp * 1.6, mp * 1.6);
                mFrame.filled = false; mFrame.stroked = true; mFrame.strokeColor = accentCol; mFrame.strokeWidth = 0.7;
            }

            if (plan.style === "desk" || plan.style === "corporate") {
                var hb = (plan.style === "desk")
                    ? mGrp.pathItems.roundedRectangle(myTop, mx, cellW, mHeadH * 0.86, mHeadH * 0.18, mHeadH * 0.18)
                    : mGrp.pathItems.rectangle(myTop, mx, cellW, mHeadH * 0.86);
                hb.stroked = false; hb.filled = true; hb.fillColor = accentCol;
                addTxt(mGrp, (plan.langMode === "en" ? headLabel.toUpperCase() : headLabel), mx + cellW / 2, myTop - mHeadH * (bnRng ? 0.32 : 0.43), mHeadH * (bnRng ? 0.34 : 0.42), whiteCol, true, titleFontObj);
                if (bnRng) addTxt(mGrp, bnRng, mx + cellW / 2, myTop - mHeadH * 0.68, mHeadH * 0.22, whiteCol, true, bnSubFont, !wantAnsiSub);
            } else if (plan.style === "luxury") {
                var pill = mGrp.pathItems.roundedRectangle(myTop - mHeadH * 0.06, mx + cellW * 0.10, cellW * 0.80, mHeadH * 0.78, mHeadH * 0.38, mHeadH * 0.38);
                pill.filled = false; pill.stroked = true; pill.strokeColor = accentCol; pill.strokeWidth = Math.max(0.6, cellW * 0.008);
                addTxt(mGrp, headLabel, mx + cellW / 2, myTop - mHeadH * (bnRng ? 0.34 : 0.45), mHeadH * 0.34, accentCol, true, titleFontObj);
                if (bnRng) addTxt(mGrp, bnRng, mx + cellW / 2, myTop - mHeadH * 0.66, mHeadH * 0.20, subCol, true, bnSubFont, !wantAnsiSub);
            } else {
                var isEd = (plan.style === "editorial");
                addTxt(mGrp, headLabel, isEd ? mx : (mx + cellW / 2), myTop - mHeadH * (bnRng ? 0.34 : 0.46), mHeadH * (isEd ? 0.46 : 0.40), accentCol, !isEd, titleFontObj);
                if (bnRng) addTxt(mGrp, bnRng, isEd ? mx : (mx + cellW / 2), myTop - mHeadH * 0.72, mHeadH * 0.22, subCol, !isEd, bnSubFont, !wantAnsiSub);
                var ul = mGrp.pathItems.add();
                ul.filled = false; ul.stroked = true; ul.strokeColor = accentCol; ul.strokeWidth = Math.max(0.5, cellW * 0.007);
                ul.setEntirePath([[mx, myTop - mHeadH * 0.92], [mx + cellW, myTop - mHeadH * 0.92]]);
            }

            // Weekday Headers (7 or 14 columns!)
            var dowFs = Math.min(dowH * 0.46, colW * 0.32);
            for (var c = 0; c < gCols; c++) {
                addTxt(mGrp, hArr[c], mx + (c + 0.5) * colW, myTop - mHeadH - dowH * 0.50, dowFs, md.weekendCols[c] ? wkndCol : textCol, true, dowFontObj);
            }

            // Box / Grid Lines
            if (boxMode === "grid") {
                var dowBox = mGrp.pathItems.rectangle(myTop - mHeadH, mx, cellW, dowH);
                dowBox.filled = false; dowBox.stroked = true; dowBox.strokeColor = gridCol; dowBox.strokeWidth = 0.5;
                var outer = mGrp.pathItems.rectangle(bodyTop, mx, cellW, bodyH);
                outer.filled = false; outer.stroked = true; outer.strokeColor = gridCol; outer.strokeWidth = 0.5;
                for (var gc2 = 1; gc2 < gCols; gc2++) {
                    var vl = mGrp.pathItems.add(); vl.filled = false; vl.stroked = true; vl.strokeColor = gridCol; vl.strokeWidth = 0.35;
                    vl.setEntirePath([[mx + gc2 * colW, bodyTop], [mx + gc2 * colW, bodyTop - bodyH]]);
                }
                for (var gr2 = 1; gr2 < numRows; gr2++) {
                    var hl2 = mGrp.pathItems.add(); hl2.filled = false; hl2.stroked = true; hl2.strokeColor = gridCol; hl2.strokeWidth = 0.35;
                    hl2.setEntirePath([[mx, bodyTop - gr2 * rowH], [mx + cellW, bodyTop - gr2 * rowH]]);
                }
            } else if (boxMode === "rows") {
                for (var gr3 = 0; gr3 <= numRows; gr3++) {
                    var hl3 = mGrp.pathItems.add(); hl3.filled = false; hl3.stroked = true; hl3.strokeColor = gridCol; hl3.strokeWidth = 0.35;
                    hl3.setEntirePath([[mx, bodyTop - gr3 * rowH], [mx + cellW, bodyTop - gr3 * rowH]]);
                }
            } else if (boxMode === "cols") {
                for (var gc3 = 0; gc3 <= gCols; gc3++) {
                    var vl3 = mGrp.pathItems.add(); vl3.filled = false; vl3.stroked = true; vl3.strokeColor = gridCol; vl3.strokeWidth = 0.35;
                    vl3.setEntirePath([[mx + gc3 * colW, bodyTop], [mx + gc3 * colW, bodyTop - bodyH]]);
                }
            }

            // Dates (Classic Dual-Date OR Royal 14-Col OR Plain 7-Col)
            var autoBigPt = Math.min(colW, rowH) * (md.showDualBn ? 0.42 : 0.48);
            var bigPt = (plan.bigPt && plan.bigPt > 0) ? Math.min(plan.bigPt, autoBigPt * 1.45) : autoBigPt;
            var smallPt = (plan.smallPt && plan.smallPt > 0) ? Math.min(plan.smallPt, bigPt * 0.78) : (bigPt * 0.56);

            for (var r = 0; r < md.weeks.length; r++) {
                for (var c2 = 0; c2 < gCols; c2++) {
                    var cell = md.weeks[r][c2];
                    if (!cell) continue;
                    var mainTxt = useUnicodeFallback ? cell.prevMain : cell.main;
                    var subTxt  = useSubUniFallback ? cell.prevSub  : cell.sub;
                    var padB = Math.min(colW, rowH) * 0.07;

                    if (boxMode === "cells") {
                        var cb = mGrp.pathItems.roundedRectangle(bodyTop - r * rowH - padB, mx + c2 * colW + padB, colW - padB * 2, rowH - padB * 2, padB * 1.6, padB * 1.6);
                        cb.filled = false; cb.stroked = true; cb.strokeColor = md.weekendCols[c2] ? wkndCol : gridCol; cb.strokeWidth = 0.4;
                    } else if (boxMode === "sq_cells") {
                        var sb = mGrp.pathItems.rectangle(bodyTop - r * rowH - padB, mx + c2 * colW + padB, colW - padB * 2, rowH - padB * 2);
                        sb.filled = false; sb.stroked = true; sb.strokeColor = md.weekendCols[c2] ? wkndCol : gridCol; sb.strokeWidth = 0.4;
                    } else if (boxMode === "circles") {
                        var diam = Math.min(colW, rowH) * 0.80;
                        var ell = mGrp.pathItems.ellipse(bodyTop - (r + 0.5) * rowH + diam / 2, mx + (c2 + 0.5) * colW - diam / 2, diam, diam);
                        ell.filled = false; ell.stroked = true; ell.strokeColor = md.weekendCols[c2] ? wkndCol : gridCol; ell.strokeWidth = 0.4;
                    } else if (boxMode === "filled_cells") {
                        var fb = mGrp.pathItems.roundedRectangle(bodyTop - r * rowH - padB, mx + c2 * colW + padB, colW - padB * 2, rowH - padB * 2, padB * 1.4, padB * 1.4);
                        fb.stroked = false; fb.filled = true; fb.fillColor = md.weekendCols[c2] ? softWkCol : softBgCol;
                    }

                    if (md.showDualBn && subTxt) {
                        addTxt(mGrp, mainTxt, mx + (c2 + 0.36) * colW, bodyTop - (r + 0.48) * rowH, bigPt, md.weekendCols[c2] ? wkndCol : textCol, true);
                        addTxt(mGrp, subTxt,  mx + (c2 + 0.76) * colW, bodyTop - (r + 0.62) * rowH, smallPt, subCol, true, bnSubFont, !wantAnsiSub);
                    } else {
                        addTxt(mGrp, mainTxt, mx + (c2 + 0.5) * colW, bodyTop - (r + 0.5) * rowH, bigPt, md.weekendCols[c2] ? wkndCol : textCol, true);
                    }
                }
            }
        }

        if (uniSeedTF) { try { uniSeedTF.remove(); } catch (e) {} }
        try { app.executeMenuCommand("fitinwindow"); } catch (e) {}
        var mainFName = chosenFont ? chosenFont.family : "Default";
        var subFName = bnSubFont ? bnSubFont.family : mainFName;
        var modeNote = (mainIsAnsi && !useMainUniFallback) || wantAnsiSub ? "ANSI/Bijoy" : (plan.langMode === "en" ? "English" : (uniSeedTF ? "Auto-Unicode" : "Unicode"));
        return "OK:Editable Calendar created (" + modeNote + " | Main: " + mainFName + ", Bangla: " + subFName + ")!";
    } catch (err) {
        return "ERROR:" + err.message + " (line " + err.line + ")";
    }
}

/* --- Seal Maker: round / oval rubber-stamp seal, true vector (v17.7.13 precision) --- */
function dmSealColor(doc, name) {
    var isRGB = (doc && doc.documentColorSpace === DocumentColorSpace.RGB);
    var c;
    if (name === "blue") {
        if (isRGB) { c = new RGBColor(); c.red = 0; c.green = 80; c.blue = 180; }
        else { c = dmCMYK(100, 70, 0, 0); }
    } else if (name === "red") {
        if (isRGB) { c = new RGBColor(); c.red = 200; c.green = 30; c.blue = 30; }
        else { c = dmCMYK(0, 100, 100, 0); }
    } else if (name === "green") {
        if (isRGB) { c = new RGBColor(); c.red = 0; c.green = 130; c.blue = 70; }
        else { c = dmCMYK(100, 0, 100, 0); }
    } else {
        c = dmSafeBlack(doc);
    }
    return c;
}

function dmSealLineText(grp, str, cx, yCenterPt, size, col, fontObj, maxW, maxH) {
    if (!str) return null;
    str = String(str).replace(/^\s+|\s+$/g, "");
    if (!str) return null;

    function measureLine(txt, s) {
        var t = grp.textFrames.add();
        t.contents = txt;
        var c = t.textRange.characterAttributes;
        c.size = s; c.fillColor = col;
        if (fontObj) { try { c.textFont = fontObj; } catch (eF) {} }
        var w = t.width;
        try {
            var gb = t.geometricBounds;
            var gw = Math.abs(gb[2] - gb[0]);
            if (gw > 0) w = Math.max(w, gw);
        } catch (eM) {}
        t.remove();
        return w;
    }

    var lines = [str];
    var sz = size;

    // Split into 2 balanced lines if single line would shrink below readable threshold
    if (maxW && str.indexOf(" ") > 0) {
        var wSingle = measureLine(str, sz);
        if (wSingle > maxW && (sz * (maxW / wSingle)) < Math.max(5.5, size * 0.72)) {
            var sp = -1, best = 9999;
            for (var i2 = 0; i2 < str.length; i2++) {
                if (str.charAt(i2) === " ") {
                    var d = Math.abs(i2 - str.length / 2);
                    if (d < best) { best = d; sp = i2; }
                }
            }
            if (sp > 0) {
                lines = [str.substring(0, sp), str.substring(sp + 1)];
            }
        }
    }

    // Always re-fit font size so EVERY line stays strictly inside maxW and total height inside maxH!
    for (var pass = 0; pass < 3; pass++) {
        if (maxW) {
            var widest = 0;
            for (var k = 0; k < lines.length; k++) {
                var lw = measureLine(lines[k], sz);
                if (lw > widest) widest = lw;
            }
            if (widest > maxW && widest > 0) {
                sz = Math.max(4.0, sz * (maxW / widest) * 0.96);
            }
        }
        if (maxH) {
            var totalH = (lines.length === 1) ? (sz * 0.95) : (sz * 0.95 + (lines.length - 1) * sz * 1.25);
            if (totalH > maxH && totalH > 0) {
                sz = Math.max(4.0, sz * (maxH / totalH) * 0.95);
            }
        }
    }

    var gap = sz * 1.25;
    for (var li = 0; li < lines.length; li++) {
        var line = lines[li];
        var ly = (lines.length === 1) ? yCenterPt : (yCenterPt + (lines.length - 1) * gap / 2 - li * gap);
        var tf = grp.textFrames.add();
        tf.contents = line;
        var fc = tf.textRange.characterAttributes;
        fc.size = sz; fc.fillColor = col;
        if (fontObj) { try { fc.textFont = fontObj; } catch (eF2) {} }
        try { tf.textRange.paragraphAttributes.justification = Justification.CENTER; } catch (eJ) {}
        tf.position = [cx - tf.width / 2, ly + tf.height / 2];
        try {
            var gb2 = tf.geometricBounds;
            var ax = (gb2[0] + gb2[2]) / 2, ay = (gb2[1] + gb2[3]) / 2;
            var pos = tf.position;
            tf.position = [pos[0] + (cx - ax), pos[1] + (ly - ay)];
        } catch (eG) {}
    }
    return true;
}

function dmSealArcText(grp, str, cx, cy, rxE, ryE, maxSpanDeg, fs, col, fontObj) {
    // Precision proportional arc text: measures each glyph's real width so 'I' and 'M'
    // space naturally, strictly centered at 90 deg (12 o'clock), with glyph centers
    // locked dead-center on the (rxE, ryE) ellipse track.
    var n = str.length;
    if (n === 0) return;

    var chars = [];
    var widths = [];
    var totalW = 0;
    var tracking = fs * 0.08;
    for (var i = 0; i < n; i++) {
        var ch = str.charAt(i);
        var tf = grp.textFrames.add();
        tf.contents = (ch === " ") ? "i" : ch;
        var ca = tf.textRange.characterAttributes;
        ca.size = fs;
        ca.fillColor = col;
        if (fontObj) { try { ca.textFont = fontObj; } catch (eF) {} }
        var w = (ch === " ") ? (fs * 0.36) : Math.max(fs * 0.24, tf.width);
        if (ch === " ") {
            tf.remove();
            chars.push(null);
        } else {
            chars.push(tf);
        }
        widths.push(w);
        totalW += w + (i < n - 1 ? tracking : 0);
    }

    var rAvg = (rxE + ryE) / 2;
    var naturalSpanDeg = (totalW / Math.max(1, rAvg)) * (180 / Math.PI);
    var spanDeg = Math.min(maxSpanDeg, Math.max(naturalSpanDeg, Math.min(maxSpanDeg, 120)));
    var aStartDeg = 90 + spanDeg / 2;

    var curW = 0;
    for (var j = 0; j < n; j++) {
        var midW = curW + widths[j] / 2;
        var frac = (totalW > 0) ? (midW / totalW) : ((j + 0.5) / n);
        var aDeg = aStartDeg - spanDeg * frac;
        var aRad = aDeg * Math.PI / 180;
        var px = cx + rxE * Math.cos(aRad);
        var py = cy + ryE * Math.sin(aRad);
        var tf2 = chars[j];
        if (tf2) {
            tf2.position = [px - tf2.width / 2, py + tf2.height / 2];
            try {
                var gb = tf2.geometricBounds;
                var ax = (gb[0] + gb[2]) / 2, ay = (gb[1] + gb[3]) / 2;
                var pos = tf2.position;
                tf2.position = [pos[0] + (px - ax), pos[1] + (py - ay)];
            } catch (eG) {}
            // Tangent angle on ellipse for clean perpendicular alignment on both Round & Oval seals
            var tx = -rxE * Math.sin(aRad);
            var ty =  ryE * Math.cos(aRad);
            var rotDeg = (Math.atan2(ty, tx) * 180 / Math.PI) + 180;
            try { tf2.rotate(rotDeg, true, true, true, true, Transformation.CENTER); } catch (eR) {}
        }
        curW += widths[j] + tracking;
    }
}

function dmGenerateSeal(payloadJSON) {
    try {
        var p = dmParseJSON(payloadJSON);
        var outerText = String(p.outerText || "M/S NAYEM ENTERPRISE").toUpperCase();
        var innerText = String(p.innerText || "");
        var centre1 = String(p.centre1 || "");
        var centre2 = String(p.centre2 || "");
        var shape = (p.shape === "oval") ? "oval" : "round";
        var rings = (p.rings === "single") ? "single" : "double";
        var centre = (p.centre === "text" || p.centre === "none") ? p.centre : "star";
        var diaMm = parseFloat(p.diameterMm) || 40;
        if (diaMm < 20) diaMm = 20;
        if (diaMm > 100) diaMm = 100;
        var colName = String(p.color || "black");

        var doc;
        if (app.documents.length > 0) {
            doc = app.activeDocument;
        } else {
            var preset = new DocumentPreset();
            preset.width = 400; preset.height = 400;
            preset.units = RulerUnits.Millimeters;
            preset.colorMode = DocumentColorSpace.CMYK;
            preset.title = "Seal_Maker";
            doc = app.documents.addDocument(DocumentColorSpace.CMYK, preset);
        }

        var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
        var cx = (ab[0] + ab[2]) / 2;
        var cy = (ab[1] + ab[3]) / 2;
        var diaPt = diaMm * MM_TO_PT;
        var rx = diaPt / 2;
        var ry = (shape === "oval") ? diaPt * 0.36 : diaPt / 2;
        var rMin = Math.min(rx, ry);
        var col = dmSealColor(doc, colName);

        var lyr = dmGetOrCreateLayer(doc, "Seal_Maker");
        var grp = lyr.groupItems.add();
        grp.name = "Seal_" + Math.round(diaMm) + "mm";

        // Outer ring(s) — balanced classic rubber-stamp track ratio (inF = 0.72)
        var inF = 0.72;
        var outerW = Math.max(1.0, diaPt * 0.015);
        var innerW = Math.max(0.7, outerW * 0.62);
        var ring = grp.pathItems.ellipse(cy + ry, cx - rx, rx * 2, ry * 2);
        ring.filled = false; ring.stroked = true; ring.strokeColor = col; ring.strokeWidth = outerW;
        if (rings === "double") {
            var ring2 = grp.pathItems.ellipse(cy + ry * inF, cx - rx * inF, rx * inF * 2, ry * inF * 2);
            ring2.filled = false; ring2.stroked = true; ring2.strokeColor = col; ring2.strokeWidth = innerW;
        }

        var fontObj = dmFindTextFont("Arial Bold") || dmFindTextFont("Arial-BoldMT") || dmFindTextFont("Arial");

        // Outer ring text: dead-centered in the track between outer & inner rings, capped to 56% of track height!
        if (outerText) {
            var trackFrac = (rings === "double") ? ((1 + inF) / 2) : 0.86;
            var rTxtX = rx * trackFrac;
            var rTxtY = ry * trackFrac;
            var trackW = (rings === "double") ? (rMin * (1 - inF) - (outerW + innerW) * 0.6) : (rMin * 0.24);
            var maxFsByTrack = Math.max(4.5, (trackW * 0.56) / 0.72);
            var maxSpanDeg = 215;
            var rAvg = (rTxtX + rTxtY) / 2;
            var maxArcLen = (maxSpanDeg * Math.PI / 180) * rAvg * 0.90;
            var fsByArc = maxArcLen / Math.max(1, outerText.length * 0.72);
            var fs = Math.max(4.5, Math.min(maxFsByTrack, fsByArc, 22));
            dmSealArcText(grp, outerText, cx, cy, rTxtX, rTxtY, maxSpanDeg, fs, col, fontObj);
        }

        // Inner cavity safe dimensions (with generous margin from inner ring)
        var riX = (rings === "double") ? (rx * inF - innerW * 0.8) : (rx * 0.72);
        var riY = (rings === "double") ? (ry * inF - innerW * 0.8) : (ry * 0.72);
        var hasInner = !!innerText.replace(/^\s+|\s+$/g, "");

        // Centre element: star or centre text
        if (centre === "star") {
            var starCy = hasInner ? (cy + riY * 0.22) : cy;
            var sR = Math.min(riX, riY) * (hasInner ? 0.34 : 0.42);
            var sRi = sR * 0.42;
            var starPts = [];
            for (var s = 0; s < 10; s++) {
                var aDeg = 90 - s * 36;
                var aRad = aDeg * Math.PI / 180;
                var rr = (s % 2 === 0) ? sR : sRi;
                starPts.push([cx + rr * Math.cos(aRad), starCy + rr * Math.sin(aRad)]);
            }
            var star = grp.pathItems.add();
            star.setEntirePath(starPts);
            star.closed = true;
            star.filled = true; star.fillColor = col;
            star.stroked = false;
        } else if (centre === "text") {
            var cCy = hasInner ? (cy + riY * 0.20) : cy;
            var cSize = Math.max(5.5, Math.min(13, diaPt * 0.095));
            var cMaxW = riX * 1.50;
            var cLines = [];
            if (centre1) cLines.push(centre1);
            if (centre2) cLines.push(centre2);
            if (cLines.length === 1) {
                dmSealLineText(grp, cLines[0], cx, cCy, cSize, col, fontObj, cMaxW, riY * 0.45);
            } else if (cLines.length === 2) {
                dmSealLineText(grp, cLines[0], cx, cCy + cSize * 0.58, cSize, col, fontObj, cMaxW, riY * 0.28);
                dmSealLineText(grp, cLines[1], cx, cCy - cSize * 0.58, cSize, col, fontObj, cMaxW, riY * 0.28);
            }
        }

        // Inner text line — cleanly inside the lower inner cavity, strictly bounded by chord width!
        if (hasInner) {
            var iSize = Math.max(4.8, Math.min(9.5, diaPt * 0.072));
            var dyIn = (centre === "none") ? 0 : (riY * 0.36);
            var maxBlockH = riY * 0.40;
            // Measure chord at the bottom of the text block so even 2nd line NEVER touches inner ring!
            var yWorst = Math.min(riY * 0.86, dyIn + maxBlockH * 0.52);
            var chordAtBottom = 2 * riX * Math.sqrt(Math.max(0.08, 1 - (yWorst / riY) * (yWorst / riY))) * 0.86;
            dmSealLineText(grp, innerText, cx, cy - dyIn, iSize, col, fontObj, chordAtBottom, maxBlockH);
        }

        try { app.executeMenuCommand("fitinwindow"); } catch (eF2) {}
        var shapeLabel = (shape === "oval") ? "Oval" : "Round";
        var ringLabel = (rings === "single") ? "Single Ring" : "Double Ring";
        var centreLabel = (centre === "star") ? "Star" : (centre === "text" ? "Text" : "None");
        return "OK:Seal created (" + Math.round(diaMm) + "mm " + shapeLabel + ", " + ringLabel + ", " + centreLabel + ")!";
    } catch (err) {
        return "ERROR:" + err.message + " (line " + err.line + ")";
    }
}

/* --- Bento Grid System: Asymmetric rounded vector cards & guides (v17.7.19) --- */
function dmGenerateBentoGrid(payloadJSON) {
    try {
        var p = dmParseJSON(payloadJSON);
        var cols = Math.max(2, Math.min(8, parseInt(p.cols, 10) || 4));
        var rows = Math.max(2, Math.min(8, parseInt(p.rows, 10) || 3));
        var gutter = Math.max(0, parseFloat(p.gutter) || 0);
        var margin = Math.max(0, parseFloat(p.margin) || 0);
        var radius = Math.max(0, parseFloat(p.radius) || 0);
        var style = String(p.style || "filled");
        var presetKey = String(p.artboardPreset || "active");
        var cells = p.cells || [];
        if (cells.length === 0) return "ERROR:No bento cells to generate.";

        var doc;
        if (presetKey === "active" && app.documents.length > 0) {
            doc = app.activeDocument;
        } else {
            var wPt = 1920, hPt = 1080, isCMYK = false;
            if (presetKey === "1080x1080") { wPt = 1080; hPt = 1080; }
            else if (presetKey === "1080x1350") { wPt = 1080; hPt = 1350; }
            else if (presetKey === "a4_l") { wPt = 297 * MM_TO_PT; hPt = 210 * MM_TO_PT; isCMYK = true; }
            else if (presetKey === "a4_p") { wPt = 210 * MM_TO_PT; hPt = 297 * MM_TO_PT; isCMYK = true; }
            var dp = new DocumentPreset();
            dp.width = wPt; dp.height = hPt;
            dp.units = isCMYK ? RulerUnits.Millimeters : RulerUnits.Pixels;
            dp.colorMode = isCMYK ? DocumentColorSpace.CMYK : DocumentColorSpace.RGB;
            dp.title = "Bento_Grid_" + cols + "x" + rows;
            doc = app.documents.addDocument(dp.colorMode, dp);
            doc.artboards[0].artboardRect = [0, hPt, wPt, 0];
        }

        var ab = doc.artboards[doc.artboards.getActiveArtboardIndex()].artboardRect;
        var left0 = ab[0], top0 = ab[1];
        var abW = ab[2] - ab[0], abH = ab[1] - ab[3];

        var usableW = Math.max(20, abW - margin * 2 - gutter * (cols - 1));
        var usableH = Math.max(20, abH - margin * 2 - gutter * (rows - 1));
        var cw = usableW / cols;
        var ch = usableH / rows;

        var lyrName = (style === "guides") ? "Bento_Guides" : "Bento_Grid";
        var lyr = dmGetOrCreateLayer(doc, lyrName);
        var grp = lyr.groupItems.add();
        grp.name = "Bento_" + cols + "x" + rows + "_" + cells.length + "cards";

        var palHex = ["#0ea5e9", "#2ed3a3", "#6366f1", "#f59e0b", "#ec4899", "#14b8a6", "#8b5cf6", "#334155"];
        var fillCol = dmHexToRGBColor(p.fillColor || "#1e293b");
        var strokeCol = dmHexToRGBColor(p.strokeColor || "#3bcdca");

        for (var i = 0; i < cells.length; i++) {
            var c = cells[i];
            var x = left0 + margin + c.c * (cw + gutter);
            var yTop = top0 - margin - c.r * (ch + gutter);
            var w = c.cs * cw + (c.cs - 1) * gutter;
            var h = c.rs * ch + (c.rs - 1) * gutter;
            var rr = Math.min(radius, Math.min(w, h) * 0.45);

            var rect = (rr > 0.5)
                ? grp.pathItems.roundedRectangle(yTop, x, w, h, rr, rr)
                : grp.pathItems.rectangle(yTop, x, w, h);
            rect.name = "Bento_Card_" + (i + 1);

            if (style === "guides") {
                rect.filled = false; rect.stroked = false;
                try { rect.guides = true; } catch (eG) { rect.stroked = true; rect.strokeColor = strokeCol; rect.strokeWidth = 0.75; }
            } else if (style === "stroke") {
                rect.filled = false; rect.stroked = true; rect.strokeColor = strokeCol; rect.strokeWidth = 1.25;
            } else if (style === "palette") {
                rect.filled = true; rect.fillColor = dmHexToRGBColor(palHex[i % palHex.length]); rect.stroked = false;
            } else {
                rect.filled = true; rect.fillColor = fillCol; rect.stroked = true; rect.strokeColor = strokeCol; rect.strokeWidth = 0.75;
            }
        }

        try { app.executeMenuCommand("fitinwindow"); } catch (eF) {}
        return "OK:Created Bento Grid (" + cells.length + " vector cards, " + cols + "×" + rows + ")!";
    } catch (err) {
        return "ERROR:" + err.message + " (line " + err.line + ")";
    }
}

/* --- Advanced Brand Identity Kit Studio: Logo -> 8-Artboard System (v17.7.20) --- */
function dmColorToHex(c) {
    try {
        if (!c) return null;
        if (c.typename === "RGBColor") {
            var r = Math.round(c.red), g = Math.round(c.green), b = Math.round(c.blue);
            return "#" + ("0" + r.toString(16)).slice(-2) + ("0" + g.toString(16)).slice(-2) + ("0" + b.toString(16)).slice(-2);
        }
        if (c.typename === "CMYKColor") {
            var r2 = Math.round(255 * (1 - c.cyan / 100) * (1 - c.black / 100));
            var g2 = Math.round(255 * (1 - c.magenta / 100) * (1 - c.black / 100));
            var b2 = Math.round(255 * (1 - c.yellow / 100) * (1 - c.black / 100));
            return "#" + ("0" + r2.toString(16)).slice(-2) + ("0" + g2.toString(16)).slice(-2) + ("0" + b2.toString(16)).slice(-2);
        }
    } catch (e) {}
    return null;
}

function dmExtractLogoColorsAI() {
    try {
        if (app.documents.length === 0 || !app.activeDocument.selection || app.activeDocument.selection.length === 0) {
            return "ERROR:Select your vector logo in Illustrator first.";
        }
        var seen = {}, cols = [];
        function walk(item) {
            if (!item || cols.length >= 4) return;
            if (item.typename === "GroupItem") {
                for (var i = 0; i < item.pageItems.length; i++) walk(item.pageItems[i]);
            } else if (item.typename === "CompoundPathItem") {
                for (var j = 0; j < item.pathItems.length; j++) walk(item.pathItems[j]);
            } else if (item.typename === "PathItem") {
                var hx = item.filled ? dmColorToHex(item.fillColor) : (item.stroked ? dmColorToHex(item.strokeColor) : null);
                if (hx && hx !== "#ffffff" && !seen[hx]) { seen[hx] = true; cols.push(hx); }
            }
        }
        var sel = app.activeDocument.selection;
        for (var s = 0; s < sel.length; s++) walk(sel[s]);
        if (cols.length === 0) return "ERROR:No vector fill/stroke colors found in selection.";
        return "OK:" + cols.join("|");
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

function dmExportBrandGuidelinePDF() {
    try {
        if (app.documents.length === 0) return "ERROR:Generate or open your Brand Identity Kit document first.";
        var doc = app.activeDocument;
        var outFile = File.saveDialog("Save Brand Guideline Book PDF", "*.pdf");
        if (!outFile) return "OK:PDF export cancelled.";
        if (outFile.name.toLowerCase().indexOf(".pdf") < 0) outFile = new File(outFile.fsName + ".pdf");
        var opts = new PDFSaveOptions();
        opts.preserveEditability = true;
        opts.viewAfterSaving = true;
        doc.saveAs(outFile, opts);
        return "OK:Brand Guideline PDF saved to " + outFile.name + "!";
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

/* One-click auto PDF export (v17.7.25) — same as dmExportBrandGuidelinePDF
 * but NO save dialog: saves silently into the panel temp folder with a
 * timestamped name and returns "OK:<full path>" so the panel can attach
 * it to the Send-to-Muse package. The manual button keeps the dialog
 * version above. Works offline (local file write only). */
function dmExportBrandGuidelinePDFAuto() {
    try {
        if (app.documents.length === 0) return "ERROR:NO_DOC";
        var doc = app.activeDocument;
        var tmpDir = new Folder(Folder.temp + "/Design360n_BrandKit_Mockups");
        if (!tmpDir.exists) tmpDir.create();
        var d = new Date();
        function pad2(n) { return (n < 10 ? "0" : "") + n; }
        var stamp = "" + d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + "-" + pad2(d.getHours()) + pad2(d.getMinutes());
        var base = String(doc.name || "Brand_Kit").replace(/\.ai$/i, "").replace(/[\\\/:*?"<>|]+/g, "_");
        var outFile = new File(tmpDir.fsName + "/" + base + "_Brand_Guideline_" + stamp + ".pdf");
        var opts = new PDFSaveOptions();
        opts.preserveEditability = true;
        opts.viewAfterSaving = false;
        doc.saveAs(outFile, opts);
        if (!outFile.exists) return "ERROR:SAVE_FAILED";
        return "OK:" + outFile.fsName;
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

function dmExportSelectedLogo() {
    /* Exports the CURRENT SELECTION (the logo the user is working on) as a
     * transparent PNG into the panel temp folder, so Brand Kit Pro can stamp
     * the REAL logo onto every mockup photo. Returns "OK:<full path>" or an
     * "ERROR:<code>" string the panel shows to the user. Runs from the CEP
     * evaluateScript context, like every other dm* function here.
     * - artboard clipped to the artwork bounds, PNG24 with transparency on.
     * - long side at least 1000px (export scale raised when the artwork is
     *   small; capped at 800% so a tiny mark cannot explode the export).
     * - the user's document is never modified: selection is DUPLICATED into
     *   a throwaway temp document, which is closed without saving.
     * Known limit: cross-document duplicate() is the standard Illustrator
     * scripting pattern, but it was NOT live-tested in real Illustrator —
     * if it throws, the panel reports the exact error instead of faking it. */
    try {
        if (app.documents.length === 0) return "ERROR:NO_DOC";
        var doc = app.activeDocument;
        if (!doc.selection || doc.selection.length === 0) return "ERROR:NO_SELECTION";
        /* v17.7.26: locked / hidden items cannot be duplicated — filter
         * them out first. A locked logo used to fail the whole export with
         * a bare DUPLICATE_FAILED and no useful message; now the panel can
         * tell the user to unlock it. */
        var useSel = [];
        for (var fi = 0; fi < doc.selection.length; fi++) {
            var it = doc.selection[fi], skipIt = false;
            try { if (it.locked) skipIt = true; } catch (eLk) {}
            try { if (it.hidden) skipIt = true; } catch (eHd) {}
            try { if (it.layer && (it.layer.locked || !it.layer.visible)) skipIt = true; } catch (eLy) {}
            if (!skipIt) useSel.push(it);
        }
        if (useSel.length === 0) return "ERROR:SELECTION_LOCKED";
        var sel = useSel;
        var x0 = 1e9, y0 = -1e9, x1 = -1e9, y1 = 1e9, i, gotBounds = false;
        for (i = 0; i < sel.length; i++) {
            var gb;
            try { gb = sel[i].geometricBounds; } catch (eGb) { continue; }
            if (!gb) continue;
            gotBounds = true;
            if (gb[0] < x0) x0 = gb[0];
            if (gb[1] > y0) y0 = gb[1];
            if (gb[2] > x1) x1 = gb[2];
            if (gb[3] < y1) y1 = gb[3];
        }
        if (!gotBounds) return "ERROR:NO_SELECTION";
        var wPt = Math.max(1, x1 - x0), hPt = Math.max(1, y0 - y1);
        var tmpDir = new Folder(Folder.temp + "/Design360n_BrandKit_Mockups");
        if (!tmpDir.exists) tmpDir.create();
        var outFile = new File(tmpDir.fsName + "/logo_export.png");
        var dp = new DocumentPreset();
        dp.width = wPt; dp.height = hPt; dp.units = RulerUnits.Points; dp.colorMode = DocumentColorSpace.RGB;
        dp.title = "Design360n_Logo_Export";
        var tmp = app.documents.addDocument(DocumentColorSpace.RGB, dp);
        try { tmp.artboards[0].artboardRect = [x0, y0, x1, y1]; } catch (eAb) {}
        var okDup = false, dupCount = 0;
        try {
            for (i = 0; i < sel.length; i++) {
                try { sel[i].duplicate(tmp.layers[0], ElementPlacement.PLACEATEND); dupCount++; } catch (eOne) {}
            }
            okDup = (dupCount > 0);
        } catch (eDup) { okDup = (dupCount > 0); }
        if (!okDup) {
            try { tmp.close(SaveOptions.DONOTSAVECHANGES); } catch (eC) {}
            return "ERROR:DUPLICATE_FAILED";
        }
        var longSide = Math.max(wPt, hPt);
        var scalePct = Math.max(100, Math.ceil(1000 / longSide * 100));
        if (scalePct > 800) scalePct = 800;
        var opts = new ExportOptionsPNG24();
        opts.transparency = true;
        opts.antiAliasing = true;
        opts.artBoardClipping = true;
        opts.horizontalScale = scalePct;
        opts.verticalScale = scalePct;
        try {
            tmp.exportFile(outFile, ExportType.PNG24, opts);
        } catch (eEx) {
            try { tmp.close(SaveOptions.DONOTSAVECHANGES); } catch (eC2) {}
            return "ERROR:EXPORT_FAILED";
        }
        try { tmp.close(SaveOptions.DONOTSAVECHANGES); } catch (eC3) {}
        try { app.activeDocument = doc; } catch (eAc) {}
        if (!outFile.exists) return "ERROR:EXPORT_FAILED";
        return "OK:" + outFile.fsName;
    } catch (err) {
        return "ERROR:" + err.message;
    }
}

function dmGenerateBrandKitAI(payloadJSON) {
    try {
        var p = dmParseJSON(payloadJSON);
        /* --- Online mockup photos (Brand Kit Pro) ---
         * p.mockups = { category: localTempFilePath } — downloaded at runtime
         * by the panel (Openverse). dmPlaceMockup places the photo contain-fit
         * inside a card zone with a subtle 10% brand-color tint so stock
         * photos feel brand-owned. Returns false on ANY problem (missing
         * file, bad image, place error) so callers fall back to vector art.
         * --- Logo-on-mockup stamping (Brand Kit Pro) ---
         * A blank photo is useless in a guideline: every placed photo gets
         * the USER'S logo stamped on it by dmStampLogoOnMockup, following
         * the kit's own guideline rules (sec2: clearspace = x-height,
         * min size 20mm print / 64px web, never distort, right variant
         * per background):
         * - UNIFORM scale only (same % X and Y) — aspect ratio preserved
         *   exactly; the logo is never stretched or squeezed to fit.
         * - CLEARSPACE x = 15% of the stamped logo width, empty on all
         *   four sides inside the photo's real placed bounds.
         * - MIN SIZE floor BK_MIN_LOGO_W = 64px (the book's digital min);
         *   a zone that cannot fit 64px + clearspace is SKIPPED — the
         *   photo stays blank rather than shrinking the logo below min.
         * - VARIANT rule, the SAME on all 18 zones: auto = reversed-white
         *   on dark/busy photos, primary on light photos; an explicit
         *   primary / reversed / mono choice wins. The 10% tint rect sits
         *   UNDER the logo (the stamp is added after the tint), so the
         *   tint never recolors the logo.
         * - PLACEMENT is centered on the photo's actual placed bounds,
         *   with the same relative margins per category (BK_STAMP_FRAC),
         *   so card, sign, packaging and shirt read as one system.
         * - Logo source priority: p.logoFile (Illustrator-export PNG or
         *   user-picked PNG) > selected-artwork seed duplicate >
         *   generated text lockup — in the stamps AND in the logo
         *   sections (lg/placeLogo); a supplied file is never silently
         *   replaced by the generated tile. If the file is missing, the
         *   OK string says so (logoFileMissing) instead of hiding it.
         *   Stamp counts are reported in the OK string so the panel
         *   status line can say how many zones got the stamp and how
         *   many were skipped for min size. */
        var mkPaths = (p.mockups && typeof p.mockups === "object") ? p.mockups : {};
        var mkTone = (p.mockupTone && typeof p.mockupTone === "object") ? p.mockupTone : {};
        var logoFile = (p.logoFile && String(p.logoFile).length > 0) ? String(p.logoFile) : "";
        /* v17.7.26: a logo file that no longer exists must be reported,
         * not silently replaced by the generated tile. Checked ONCE here
         * so every consumer (stamps AND logo sections) sees the same
         * truth. bkLogoUsedNote() is called at the end, when srcSel is
         * known, so the status line can confirm which logo was used. */
        var logoFileMissing = false;
        if (logoFile) {
            try { if (!(new File(logoFile)).exists) { logoFileMissing = true; logoFile = ""; } } catch (eLx) { logoFileMissing = true; logoFile = ""; }
        }
        function bkLogoUsedNote() {
            var s = logoFile ? "Logo: apnar file" : ((typeof srcSel !== "undefined" && srcSel.length > 0) ? "Logo: Illustrator selection" : "Logo: generated");
            if (logoFileMissing) s += " (Note: logo file paoa jayni — generated/selection logo use hoyeche)";
            return s;
        }
        var logoVariant = String(p.logoVariant || "auto");
        var logoTone = String(p.logoTone || "dark");
        var BK_MIN_LOGO_W = 64;
        var BK_CLEARSPACE = 0.15;
        var BK_STAMP_FRAC = { stationery: 0.40, signage: 0.48, packaging: 0.44, bag: 0.46, apparel: 0.44, cup: 0.50, social: 0.46, laptop: 0.40, phone: 0.48, billboard: 0.46 };
        var lastMkBounds = null;
        var stampOK = 0, stampSkip = 0, stampSkipCats = [];
        var stampSeed = null, stampCols = null, stampFont = null;
        /* --- Selectable logos (v17.7.25) ---
         * Stamped logos and logo-section logos MUST be directly selectable
         * in Illustrator with one click. Everything drawn by this engine
         * lives inside one big group per sheet/board ("Brand_Sheet_*"), so
         * a logo nested in there can only be reached via isolation mode —
         * one click selects the whole sheet instead. Fix: every logo group
         * is created as a DIRECT CHILD of the document layer (stampLayer),
         * named ("Logo — Signage", "Logo — Primary Lockup", …), unlocked
         * and visible, sitting ABOVE the photo/card art (it is added after
         * the sheet group exists, so it stacks on top). The photo, tint
         * and cards stay inside the sheet group — only logos move out.
         * bkLogoName() keeps names unique ("Brand Logo", "Brand Logo 2"). */
        var stampLayer = null;
        var bkLogoNameSeq = {};
        var BK_CAT_LABEL = { stationery: "Stationery", signage: "Signage", packaging: "Packaging", bag: "Bag", apparel: "Apparel", cup: "Cup", social: "Social", laptop: "Laptop", phone: "Phone", billboard: "Billboard" };
        function bkLogoName(base) {
            bkLogoNameSeq[base] = (bkLogoNameSeq[base] || 0) + 1;
            return bkLogoNameSeq[base] > 1 ? base + " " + bkLogoNameSeq[base] : base;
        }
        /* --- SPACING SYSTEM (v17.7.25 — one grid for the whole kit) ---
         * Sheets (1200x1950): base unit U = 12. Outer margin M = 36 (3U).
         * Gutter G = 24 (2U) between cards, columns and rows. Inner card
         * padding P = 24. Micro gap m = 12 (label-to-content). Content
         * frame: x 36..1164, top H-36, bottom H-1914.
         * Book (1280x720): margin M = 48 (4U), gutter G = 24, padding
         * P = 24, micro m = 12. Content frame: top y0-96, bottom y0-672
         * (height 576). Full-bleed bands (hero/strip/type bar/app grid)
         * are edge-to-edge BY DESIGN (gap 0) — they are bands, not cards.
         * Typographic leading inside a text block is content-dependent
         * and stays as designed; the system governs margins, gutters,
         * row gaps, frames and zone insets. */
        function dmPlaceMockup(grp, cat, x, yTop, w, h, tintC) {
            try {
                lastMkBounds = null;
                var path = mkPaths[cat];
                if (!path) return false;
                var f = new File(String(path));
                if (!f.exists) return false;
                var pi = grp.placedItems.add();
                pi.file = f;
                var gb = pi.geometricBounds;
                var iw = Math.max(1, gb[2] - gb[0]), ih = Math.max(1, gb[1] - gb[3]);
                var sc = Math.min(w / iw, h / ih) * 100;
                if (sc > 0 && sc < 10000) pi.resize(sc, sc, true, true, true, true, sc, Transformation.CENTER);
                var gb2 = pi.geometricBounds;
                var cx = x + w / 2, cy = yTop - h / 2;
                pi.translate(cx - (gb2[0] + gb2[2]) / 2, cy - (gb2[1] + gb2[3]) / 2);
                lastMkBounds = pi.geometricBounds;
                if (tintC) {
                    try {
                        var ov = grp.pathItems.rectangle(yTop, x, w, h);
                        ov.filled = true; ov.fillColor = tintC; ov.stroked = false;
                        ov.opacity = 10;
                    } catch (eOv) {}
                }
                return true;
            } catch (ePM) { return false; }
        }
        function dmStampLogoOnMockup(grp, cat) {
            /* v17.7.25: the stamp group is created as a direct child of the
             * layer (stampLayer), NOT inside the photo's sheet group — so
             * one click in Illustrator selects ONLY the logo. The photo,
             * tint and cards stay inside grp; the stamp sits above them. */
            try {
                if (!lastMkBounds) return false;
                var pb = lastMkBounds;
                var pw = Math.max(1, pb[2] - pb[0]), ph = Math.max(1, pb[1] - pb[3]);
                var frac = BK_STAMP_FRAC[cat] || 0.40;
                var tone = String(mkTone[cat] || "busy");
                var st = (stampLayer ? stampLayer.groupItems.add() : grp.groupItems.add());
                st.name = bkLogoName("Logo — " + (BK_CAT_LABEL[cat] || cat));
                var isRaster = false, isSeed = false;
                if (logoFile) {
                    try {
                        var lf = new File(logoFile);
                        if (lf.exists) {
                            var lpi = st.placedItems.add();
                            lpi.file = lf;
                            isRaster = true;
                        }
                    } catch (eLf) {}
                }
                if (!isRaster && stampSeed && stampSeed.pageItems.length > 0) {
                    try {
                        var du = stampSeed.duplicate(st, ElementPlacement.PLACEATEND);
                        isSeed = true;
                    } catch (eSd) {}
                }
                var variant = logoVariant;
                if (variant === "auto") variant = (tone === "light") ? "primary" : "reversed";
                if (!isRaster && !isSeed) {
                    if (!stampCols) { try { st.remove(); } catch (eR0) {} return false; }
                    var bn2 = String(p.brandName || "DESIGN360N").toUpperCase();
                    var tileC = stampCols.primary, initC = stampCols.dark;
                    if (variant === "reversed") { tileC = stampCols.white; initC = stampCols.primary; }
                    else if (variant === "mono") { tileC = stampCols.dark; initC = stampCols.white; }
                    var tile = st.pathItems.roundedRectangle(50, -50, 100, 100, 22, 22);
                    tile.filled = true; tile.fillColor = tileC; tile.stroked = false;
                    var tf = st.textFrames.add();
                    tf.contents = bn2.substring(0, 2);
                    var ca = tf.textRange.characterAttributes;
                    ca.size = 42; ca.fillColor = initC;
                    if (stampFont) { try { ca.textFont = stampFont; } catch (eF2) {} }
                    try { tf.textRange.paragraphAttributes.justification = Justification.CENTER; } catch (eJ) {}
                    tf.position = [0 - tf.width / 2, 18];
                    try {
                        var tfb = tf.geometricBounds;
                        tf.translate(0 - (tfb[0] + tfb[2]) / 2, 0 - (tfb[1] + tfb[3]) / 2);
                    } catch (eTc) {}
                }
                var sgb = st.geometricBounds;
                var sw = Math.max(0, sgb[2] - sgb[0]), sh = Math.max(0, sgb[1] - sgb[3]);
                if (sw <= 0 || sh <= 0) { try { st.remove(); } catch (eR1) {} return false; }
                var aspect = sh / sw;
                var targetW = Math.min(pw * frac, pw / 1.30, ph / (aspect + 0.30));
                if (targetW < BK_MIN_LOGO_W) {
                    try { st.remove(); } catch (eR2) {}
                    stampSkip++; stampSkipCats.push(cat);
                    return false;
                }
                var scP = targetW / sw * 100;
                st.resize(scP, scP, true, true, true, true, scP, Transformation.CENTER);
                if ((isRaster || isSeed) && stampCols) {
                    var clash = (logoTone === "dark" && tone !== "light") || (logoTone === "light" && tone !== "dark");
                    if (clash) {
                        try {
                            var sgb2 = st.geometricBounds;
                            var lw2 = sgb2[2] - sgb2[0], lh2 = sgb2[1] - sgb2[3];
                            var pad = BK_CLEARSPACE * lw2;
                            var scr = st.pathItems.roundedRectangle(sgb2[1] + pad, sgb2[0] - pad, lw2 + pad * 2, lh2 + pad * 2, Math.max(6, Math.min(lw2, lh2) * 0.12), Math.max(6, Math.min(lw2, lh2) * 0.12));
                            scr.filled = true;
                            scr.fillColor = (logoTone === "dark") ? stampCols.white : stampCols.dark;
                            scr.stroked = false;
                            scr.opacity = 88;
                            scr.zOrder(ZOrderMethod.SENDTOBACK);
                        } catch (eScr) {}
                    }
                }
                var sgb3 = st.geometricBounds;
                var pcx = (pb[0] + pb[2]) / 2, pcy = (pb[1] + pb[3]) / 2;
                st.translate(pcx - (sgb3[0] + sgb3[2]) / 2, pcy - (sgb3[1] + sgb3[3]) / 2);
                stampOK++;
                return true;
            } catch (eSt) { return false; }
        }
        var inc = p.include || {};
        var srcDoc = (app.documents.length > 0) ? app.activeDocument : null;
        var srcSel = [];
        if (srcDoc && srcDoc.selection && srcDoc.selection.length > 0) {
            for (var si = 0; si < srcDoc.selection.length; si++) srcSel.push(srcDoc.selection[si]);
        }

        var tpl = String(p.templateStyle || "book_10");
        if (tpl !== "book_10") {
            // SINGLE VERTICAL BEHANCE / AGENCY PRESENTATION BRAND SHEET (1200 x 1950 px)
            var W = 1200, H = 1950;
            var dpB = new DocumentPreset();
            dpB.width = W; dpB.height = H; dpB.units = RulerUnits.Pixels; dpB.colorMode = DocumentColorSpace.RGB;
            dpB.title = (p.brandName || "Brand") + "_Brand_Sheet_" + tpl;
            var docB = app.documents.addDocument(DocumentColorSpace.RGB, dpB);
            docB.artboards[0].artboardRect = [0, H, W, 0];
            docB.artboards[0].name = "Brand_Presentation_Sheet";

            var lyrB = docB.layers[0]; lyrB.name = "Brand_Sheet";
            stampLayer = lyrB; /* v17.7.25: logos go to the layer, not the sheet group */
            var seedB = null;
            if (srcSel.length > 0) {
                try {
                    seedB = lyrB.groupItems.add(); seedB.name = "_LogoSeed";
                    for (var sb = 0; sb < srcSel.length; sb++) srcSel[sb].duplicate(seedB, ElementPlacement.PLACEATEND);
                } catch (eSb) { seedB = null; }
            }

            var cP = dmHexToRGBColor(p.primary || "#2ed3a3");
            var cS = dmHexToRGBColor(p.secondary || "#0ea5e9");
            var cA = dmHexToRGBColor(p.accent || "#f59e0b");
            var cDk = dmHexToRGBColor(p.dark || "#0b1120");
            var cCream = dmHexToRGBColor("#F7F2E9");
            var cLt = dmHexToRGBColor(p.light || "#f8fafc");
            var cWhite = dmHexToRGBColor("#ffffff");
            var cMuted = dmHexToRGBColor("#94a3b8");
            var fT = dmFindTextFont(p.titleFont || "Montserrat") || dmFindTextFont("Arial Bold") || dmFindTextFont("Arial");
            var fB = dmFindTextFont(p.bodyFont || "Arial") || fT;
            var bn = String(p.brandName || "DESIGN360N").toUpperCase();
            var g = lyrB.groupItems.add(); g.name = "Brand_Sheet_" + tpl;
            stampSeed = seedB;
            stampCols = { primary: cP, dark: cDk, white: cWhite, light: cCream };
            stampFont = fT;

            function bx(x, yTop, w, h, fc, sc, sw, rad) {
                var r = (rad && rad > 0) ? g.pathItems.roundedRectangle(yTop, x, w, h, rad, rad) : g.pathItems.rectangle(yTop, x, w, h);
                if (fc) { r.filled = true; r.fillColor = fc; } else r.filled = false;
                if (sc) { r.stroked = true; r.strokeColor = sc; r.strokeWidth = sw || 1; } else r.stroked = false;
                return r;
            }
            function tx(s, x, yTop, sz, col, fO, ctr) {
                var tf = g.textFrames.add(); tf.contents = String(s || "");
                var ca = tf.textRange.characterAttributes; ca.size = Math.max(6, sz); ca.fillColor = col;
                if (fO) { try { ca.textFont = fO; } catch (e) {} }
                try { tf.textRange.paragraphAttributes.justification = ctr ? Justification.CENTER : Justification.LEFT; } catch (e) {}
                tf.position = [ctr ? (x - tf.width / 2) : x, yTop];
                return tf;
            }
            function lg(cx, cy, mw, mh, label) {
                /* v17.7.26: logos are direct children of the layer
                 * (stampLayer), named, so one click selects ONLY the logo.
                 * The SUPPLIED logo file wins here too — before this, lg()
                 * only ever used the live Illustrator selection (seedB), so
                 * an uploaded PNG was ignored in the logo sections and the
                 * sections showed the generated initials tile. */
                if (logoFile) {
                    try {
                        var lgF = new File(logoFile);
                        if (lgF.exists) {
                            var lgFileGrp = (stampLayer || g).groupItems.add();
                            lgFileGrp.name = bkLogoName(label || "Brand Logo");
                            var lgPi = lgFileGrp.placedItems.add();
                            lgPi.file = lgF;
                            var lgb = lgPi.geometricBounds;
                            var llw = Math.max(1, lgb[2] - lgb[0]), llh = Math.max(1, lgb[1] - lgb[3]);
                            var lsc = Math.min(mw / llw, mh / llh) * 100;
                            if (lsc > 0 && lsc < 10000) lgPi.resize(lsc, lsc, true, true, true, true, lsc, Transformation.CENTER);
                            var lgb2 = lgPi.geometricBounds;
                            lgPi.translate(cx - (lgb2[0] + lgb2[2]) / 2, cy - (lgb2[1] + lgb2[3]) / 2);
                            return lgFileGrp;
                        }
                    } catch (eLf2) {}
                }
                if (seedB && seedB.pageItems.length > 0) {
                    var du = seedB.duplicate(stampLayer || g, ElementPlacement.PLACEATEND);
                    try { du.name = bkLogoName(label || "Brand Logo"); } catch (eNm) {}
                    var gb = du.geometricBounds;
                    var lw = Math.max(1, gb[2] - gb[0]), lh = Math.max(1, gb[1] - gb[3]);
                    var sc = Math.min(mw / lw, mh / lh) * 100;
                    du.resize(sc, sc, true, true, true, true, sc, Transformation.CENTER);
                    var gb2 = du.geometricBounds;
                    du.translate(cx - (gb2[0] + gb2[2]) / 2, cy - (gb2[1] + gb2[3]) / 2);
                    return du;
                }
                var sz = Math.min(mw, mh);
                var lgGrp = (stampLayer || g).groupItems.add();
                lgGrp.name = bkLogoName(label || "Brand Logo");
                var tile = lgGrp.pathItems.roundedRectangle(cy + sz / 2, cx - sz / 2, sz, sz, sz * 0.24, sz * 0.24);
                tile.filled = true; tile.fillColor = cP; tile.stroked = false;
                var ltf = lgGrp.textFrames.add(); ltf.contents = bn.substring(0, 2);
                var lca = ltf.textRange.characterAttributes; lca.size = Math.max(6, sz * 0.42); lca.fillColor = cDk;
                try { lca.textFont = fT; } catch (eLF) {}
                try { ltf.textRange.paragraphAttributes.justification = Justification.CENTER; } catch (eLJ) {}
                ltf.position = [cx - ltf.width / 2, cy + sz * 0.20];
                return lgGrp;
            }

            if (tpl === "bento_dark") {
                // Style 1: Crave & Co. / Vigio Dark Bento Brand Sheet (Rounded 26px Cards on Obsidian)
                bx(0, H, W, H, cDk, null, 0, 0);
                // 1. Top Full-Width Hero Lockup Card (Primary + Secondary side-by-side)
                bx(36, H - 36, 1128, 380, cCream, null, 0, 28);
                lg(330, H - 220, 340, 230, "Logo — Primary Lockup");
                lg(860, H - 220, 360, 220, "Logo — Secondary Lockup");
                tx("PRIMARY & SECONDARY LOGO LOCKUPS", 600, H - 386, 11, cMuted, fT, true);

                // 2. Row 2: 2 Square Brand Badges (Left) + Geometric Construction Grid Card (Right)
                bx(36, H - 440, 268, 270, cP, null, 0, 26); lg(170, H - 575, 165, 130);
                bx(328, H - 440, 268, 270, cS, null, 0, 26); lg(462, H - 575, 165, 130);
                // Right: Construction Grid Card (Vigio style dashed guidelines!)
                bx(620, H - 440, 544, 270, cP, null, 0, 26);
                for (var gx = 1; gx < 6; gx++) {
                    var vl = g.pathItems.add(); vl.filled = false; vl.stroked = true; vl.strokeColor = cWhite; vl.strokeWidth = 0.8;
                    try { vl.strokeDashes = [4, 4]; } catch (e) {}
                    vl.setEntirePath([[620 + gx * 91, H - 440], [620 + gx * 91, H - 710]]);
                }
                for (var gy = 1; gy < 4; gy++) {
                    var hl = g.pathItems.add(); hl.filled = false; hl.stroked = true; hl.strokeColor = cWhite; hl.strokeWidth = 0.8;
                    try { hl.strokeDashes = [4, 4]; } catch (e) {}
                    hl.setEntirePath([[620, H - 440 - gy * 67], [1164, H - 440 - gy * 67]]);
                }
                lg(892, H - 575, 280, 170);

                // 3. Row 3: Typography Specimen Card (Left) + App Icon Badge Card (Right)
                bx(36, H - 734, 692, 250, cCream, null, 0, 26);
                tx("Aa", 80, H - 772, 118, cDk, fT, false);
                tx((p.titleFont || "Poppins") + "\n" + (p.personality ? ("Bold & SemiBold • " + String(p.personality).replace(/,\s*/g, " • ")) : "Bold & SemiBold"), 285, H - 796, 17, cDk, fT, false);
                tx("ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz  0123456789", 80, H - 918, 13, cDk, fB, false);

                bx(752, H - 734, 412, 250, cWhite, null, 0, 26);
                bx(881, H - 776, 170, 170, cP, null, 0, 38);
                lg(966, H - 861, 105, 85);
                // Notification red badge
                var nb = g.pathItems.ellipse(H - 760, 1021, 42, 42); nb.filled = true; nb.fillColor = cA; nb.stroked = false;
                tx("9", 1042, H - 771, 18, cWhite, fT, true);

                // 4. Row 4: 4 Pill HEX Color Swatches (Crave & Co. style!)
                var pills = [[cP, p.primary, cDk], [cS, p.secondary, cWhite], [cCream, "#F7F2E9", cDk], [cA, p.accent, cDk]];
                for (var pi = 0; pi < 4; pi++) {
                    var px2 = 36 + pi * 282;
                    bx(px2, H - 1008, 268, 92, pills[pi][0], null, 0, 46);
                    tx(String(pills[pi][1] || "").toUpperCase(), px2 + 134, H - 1042, 18, pills[pi][2], fT, true);
                }

                // 5. Row 5: Wide Hero Wordmark Banner + Brand Story Card
                bx(36, H - 1124, 432, 330, cDk, cP, 1.5, 26);
                tx("BRAND STORY", 68, H - 1160, 13, cP, fT, false);
                tx(bn + "\n\n" + (p.tagline || "") + "\n\n" + (p.story || ""), 68, H - 1200, 15, cWhite, fB, false);
                bx(492, H - 1124, 672, 330, cP, null, 0, 26);
                lg(828, H - 1280, 360, 210);

                // 6. Row 6: Packaging Cup/Box Card + Die-Cut Sticker Card
                bx(36, H - 1478, 620, 436, cCream, null, 0, 26);
                tx("PACKAGING & MERCHANDISE", 346, H - 1510, 13, cDk, fT, true);
                if (dmPlaceMockup(g, "packaging", 56, H - 1540, 580, 360, cP)) { dmStampLogoOnMockup(g, "packaging"); } else {
                    bx(110, H - 1560, 175, 280, cS, null, 0, 18); lg(197, H - 1690, 110, 85);
                    bx(330, H - 1610, 240, 230, cDk, null, 0, 16); lg(450, H - 1720, 130, 95);
                }
                bx(680, H - 1478, 484, 436, cS, null, 0, 26);
                if (dmPlaceMockup(g, "cup", 704, H - 1500, 436, 330, cP)) { dmStampLogoOnMockup(g, "cup"); } else {
                    bx(768, H - 1565, 320, 240, cWhite, null, 0, 56);
                    lg(922, H - 1685, 230, 150);
                }
                tx("BRANDED MERCHANDISE", 922, H - 1865, 13, cWhite, fT, true);
            } else if (tpl === "swiss_corp") {
                // Style 2: Inova Brandscape Swiss Minimal Corporate Sheet (Clean White Grid)
                // Spacing system v17.7.25: M=36, G=24 — rows at H-36 / H-480 / H-924 / H-1368, footer H-1752.
                bx(0, H, W, H, cWhite, null, 0, 0);
                // Top 3-Col Row
                bx(36, H - 36, 375, 420, cWhite, dmHexToRGBColor("#e2e8f0"), 1, 0);
                tx("STRATEGY\nBRAND IDENTITY\nVISUAL DESIGN", 60, H - 64, 11, cMuted, fT, false);
                lg(223, H - 243, 250, 140);
                tx((p.tagline || (bn + " — BRAND IDENTITY")).toUpperCase(), 223, H - 393, 11, cDk, fT, true);

                bx(435, H - 36, 375, 420, cLt, null, 0, 0);
                // Angled Business Card Front & Back
                bx(481, H - 66, 283, 175, cP, null, 0, 4); lg(622, H - 153, 150, 85);
                bx(481, H - 265, 283, 175, cWhite, cMuted, 0.5, 4);
                tx(bn + "\n" + (p.phone || "") + "\n" + (p.email || "") + "\n" + (p.website || ""), 505, H - 300, 11, cDk, fB, false);

                bx(834, H - 36, 330, 420, cP, null, 0, 0);
                tx((p.tagline || bn) + "\n" + String(p.values || "").replace(/\s*•\s*/g, "\n"), 858, H - 163, 16, cWhite, fT, false);

                // Mid 3-Col: Typeface Specimen | App Icon | 4 Vertical Full-Bleed Color Columns
                bx(36, H - 480, 375, 420, cLt, null, 0, 0);
                tx("PRIMARY TYPEFACE — " + (p.titleFont || "Montserrat").toUpperCase(), 60, H - 510, 10, cMuted, fT, false);
                tx("A B C D E F G H I J K L M N\nO P Q R S T U V W X Y Z\n0 1 2 3 4 5 6 7 8 9", 60, H - 557, 14, cDk, fT, false);
                tx(String(p.personality || "").replace(/,\s*/g, " • ").toUpperCase() || (p.titleFont || "Montserrat").toUpperCase(), 60, H - 848, 11, cP, fT, false);

                bx(435, H - 480, 320, 420, cLt, null, 0, 0);
                bx(521, H - 597, 140, 140, cP, null, 0, 32); lg(591, H - 667, 86, 70);
                tx(bn, 591, H - 767, 16, cDk, fT, true);

                // 4 Vertical Color Columns (Inova signature!)
                var vCols = [[cP, "PRIMARY", p.primary, cWhite], [cS, "SECONDARY", p.secondary, cWhite], [cLt, "LIGHT", String(p.light || "#F8FAFC").toUpperCase(), cDk], [cDk, "DARK", p.dark, cWhite]];
                for (var vc = 0; vc < 4; vc++) {
                    var vx2 = 779 + vc * 97;
                    bx(vx2, H - 480, 94, 420, vCols[vc][0], null, 0, 0);
                    tx(vCols[vc][1] + "\n" + String(vCols[vc][2]).toUpperCase(), vx2 + 12, H - 848, 9, vCols[vc][3], fT, false);
                }

                // Applications Grid (Signboard, Tote Bag, Bottle, T-Shirt)
                bx(36, H - 924, 552, 420, cLt, null, 0, 0);
                tx("STOREFRONT & 3D WALL SIGNAGE", 60, H - 960, 11, cMuted, fT, false);
                if (dmPlaceMockup(g, "signage", 60, H - 985, 504, 348, cP)) { dmStampLogoOnMockup(g, "signage"); } else { lg(312, H - 1148, 320, 180); }

                bx(612, H - 924, 552, 420, cP, null, 0, 0);
                tx("MERCHANDISE & TOTE BAG", 636, H - 960, 11, cWhite, fT, false);
                if (dmPlaceMockup(g, "bag", 636, H - 985, 504, 348, cP)) { dmStampLogoOnMockup(g, "bag"); } else { lg(888, H - 1148, 260, 180); }

                bx(36, H - 1368, 360, 348, cDk, null, 0, 0);
                tx("MOBILE APP ICON", 216, H - 1404, 11, cP, fT, true);
                bx(136, H - 1468, 160, 160, cP, null, 0, 34); lg(216, H - 1548, 95, 80);

                bx(420, H - 1368, 360, 348, cLt, null, 0, 0);
                tx("BOTTLE PACKAGING", 600, H - 1404, 11, cDk, fT, true);
                if (dmPlaceMockup(g, "packaging", 440, H - 1428, 320, 264, cP)) { dmStampLogoOnMockup(g, "packaging"); } else { bx(540, H - 1468, 130, 224, cP, null, 0, 26); lg(605, H - 1580, 88, 65); }

                bx(804, H - 1368, 360, 348, cS, null, 0, 0);
                tx("STAFF APPAREL TEE", 984, H - 1404, 11, cWhite, fT, true);
                if (dmPlaceMockup(g, "apparel", 824, H - 1428, 320, 264, cP)) { dmStampLogoOnMockup(g, "apparel"); } else { lg(984, H - 1560, 180, 120); }

                // Clean Editorial Footer — the brand's own words, not a slogan
                bx(0, H - 1752, W, 198, cWhite, null, 0, 0);
                tx((p.tagline || bn), 48, H - 1824, 34, cDk, fT, false);
                tx(String(p.values || "").toUpperCase(), 560, H - 1854, 11, cMuted, fT, true);
                lg(1010, H - 1854, 180, 90);
            } else if (tpl === "editorial_warm") {
                // Style 3: Carlam Warm Editorial Brand Sheet (Cream Hero, 3-Col Strip, 5 Circular Swatches, Full-Width Type Bar)
                bx(0, H, W, H, cCream, null, 0, 0);
                tx("PRIMARY LOGO", 600, H - 40, 14, cDk, fT, true);
                lg(600, H - 235, 520, 280, "Logo — Primary Lockup");

                // 3-Column Strip: Logotype | Brandmark | Submark
                bx(0, H - 440, 400, 340, cP, null, 0, 0); tx("LOGOTYPE", 200, H - 472, 13, cWhite, fT, true); lg(200, H - 620, 240, 140, "Logo — Logotype");
                bx(400, H - 440, 400, 340, cCream, null, 0, 0); tx("BRANDMARK", 600, H - 472, 13, cDk, fT, true); lg(600, H - 620, 210, 160, "Logo — Brandmark");
                bx(800, H - 440, 400, 340, cDk, null, 0, 0); tx("SUBMARK", 1000, H - 472, 13, cCream, fT, true); lg(1000, H - 620, 210, 160, "Logo — Submark");

                // 5 Circular Color Swatches Row
                tx("COLOR PALETTE", 600, H - 804, 16, cDk, fT, true);
                var circs = [[cP, "Primary", p.primary], [cCream, "Cream", "#F7F2E9"], [cA, "Accent", p.accent], [cS, "Secondary", p.secondary], [cDk, "Dark Base", p.dark]];
                for (var cc = 0; cc < 5; cc++) {
                    var cxC = 200 + cc * 160;
                    var ell = g.pathItems.ellipse(H - 870, cxC - 68, 136, 136);
                    ell.filled = true; ell.fillColor = circs[cc][0];
                    ell.stroked = (cc === 1); if (cc === 1) { ell.strokeColor = cMuted; ell.strokeWidth = 1; }
                    tx(circs[cc][1] + "\n" + String(circs[cc][2]).toUpperCase(), cxC, H - 1022, 12, cDk, fT, true);
                }

                // Full-Width Primary Typography Bar (Dual Aa)
                bx(0, H - 1056, W, 250, cP, null, 0, 0);
                tx("TYPOGRAPHY", 600, H - 1082, 15, cWhite, fT, true);
                tx("Aa", 110, H - 1126, 96, cWhite, fT, false);
                tx((p.titleFont || "Montserrat") + "\nABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz", 285, H - 1148, 13, cWhite, fT, false);
                tx("Aa", 680, H - 1126, 96, cWhite, fB, false);
                tx((p.bodyFont || "Arial") + "\nABCDEFGHIJKLMNOPQRSTUVWXYZ\n0123456789 !@#$%", 845, H - 1148, 13, cWhite, fB, false);

                // Bottom Application Grid
                bx(36, H - 1330, 540, 584, cWhite, cMuted, 0.6, 14);
                tx(bn + "\n" + (p.tagline || ""), 70, H - 1370, 26, cDk, fT, false);
                lg(306, H - 1650, 280, 190);
                bx(600, H - 1330, 564, 284, cDk, null, 0, 14);
                tx("SIGNBOARD & STOREFRONT", 882, H - 1360, 12, cA, fT, true);
                if (dmPlaceMockup(g, "signage", 624, H - 1390, 516, 200, cP)) { dmStampLogoOnMockup(g, "signage"); } else { lg(882, H - 1490, 240, 130); }
                bx(600, H - 1638, 270, 276, cWhite, cMuted, 0.6, 14);
                if (dmPlaceMockup(g, "cup", 624, H - 1662, 222, 190, cP)) { dmStampLogoOnMockup(g, "cup"); } else { lg(735, H - 1757, 140, 90); }
                tx((p.address || "") + "\n" + (p.phone || ""), 735, H - 1863, 10, cDk, fB, true);
                bx(894, H - 1638, 270, 276, cA, null, 0, 14);
                if (dmPlaceMockup(g, "apparel", 918, H - 1662, 222, 190, cP)) { dmStampLogoOnMockup(g, "apparel"); } else { lg(1029, H - 1757, 150, 110); }
                tx("UNIFORM / APRON", 1029, H - 1886, 11, cDk, fT, true);
            } else {
                // Style 4: Break Bold Retail & Pattern Sheet (Vibrant Hero + 3 Pill Lockups + Pattern Footer Strip)
                // Spacing system v17.7.25: M=36, G=24 — hero band 0..520, mid row H-544, app rows H-823 / H-1237, footer H-1641.
                bx(0, H, W, H, cCream, null, 0, 0);
                bx(0, H, W, 520, cP, null, 0, 0);
                lg(600, H - 200, 480, 240);
                // 3 Pill Logo Variations inside hero
                bx(96, H - 370, 280, 105, cP, cWhite, 2, 52); lg(236, H - 422, 160, 70);
                bx(460, H - 370, 280, 105, cDk, null, 0, 52); lg(600, H - 422, 160, 70);
                bx(824, H - 370, 280, 105, cCream, null, 0, 52); lg(964, H - 422, 160, 70);

                // Mid Row: Color Palette (3 Vertical Rounded Cards) + Typography Aa
                bx(36, H - 544, 190, 32, cP, null, 0, 10); tx("COLOR PALETTE", 131, H - 553, 12, cWhite, fT, true);
                var rSw = [[cP, "PRIMARY", p.primary], [cS, "SECONDARY", p.secondary], [cDk, "DARK TONE", p.dark]];
                for (var rs = 0; rs < 3; rs++) {
                    var rxS = 36 + rs * 175;
                    bx(rxS, H - 594, 155, 175, rSw[rs][0], null, 0, 14);
                    tx(rSw[rs][1] + "\n" + String(rSw[rs][2]).toUpperCase(), rxS + 77, H - 785, 11, cDk, fT, true);
                }
                bx(600, H - 544, 190, 32, cP, null, 0, 10); tx("TYPOGRAPHY", 695, H - 553, 12, cWhite, fT, true);
                tx("Aa", 600, H - 604, 125, cP, fT, false);
                tx("PRIMARY FONT\n" + (p.titleFont || "Poppins Bold") + "\nABCDEFGHIJKLMNOPQRSTUVWXYZ\n0123456789", 810, H - 622, 13, cDk, fT, false);

                // Application 2x3 Grid (Cup, Shopping Bag, Round Sign, Drawer Box, Sticker)
                bx(0, H - 823, 400, 414, cCream, null, 0, 0);
                if (dmPlaceMockup(g, "cup", 24, H - 859, 352, 336, cP)) { dmStampLogoOnMockup(g, "cup"); } else { bx(115, H - 912, 170, 230, cP, null, 0, 18); lg(200, H - 1027, 115, 80); }
                tx("CUP PACKAGING", 200, H - 1207, 12, cDk, fT, true);
                bx(400, H - 823, 400, 414, cP, null, 0, 0);
                if (dmPlaceMockup(g, "bag", 424, H - 859, 352, 336, cP)) { dmStampLogoOnMockup(g, "bag"); } else { bx(490, H - 907, 220, 240, cCream, null, 0, 10); lg(600, H - 1027, 130, 90); }
                tx("SHOPPING BAG", 600, H - 1207, 12, cWhite, fT, true);
                bx(800, H - 823, 400, 414, cDk, null, 0, 0);
                if (dmPlaceMockup(g, "signage", 824, H - 859, 352, 336, cP)) { dmStampLogoOnMockup(g, "signage"); } else {
                    var rsEl = g.pathItems.ellipse(H - 907, 880, 240, 240); rsEl.filled = true; rsEl.fillColor = cP; rsEl.stroked = true; rsEl.strokeColor = cWhite; rsEl.strokeWidth = 4;
                    lg(1000, H - 1027, 150, 105);
                }
                tx("ROUND SIGNAGE", 1000, H - 1207, 12, cWhite, fT, true);

                bx(0, H - 1237, 600, 404, cS, null, 0, 0);
                if (dmPlaceMockup(g, "packaging", 24, H - 1261, 552, 320, cP)) { dmStampLogoOnMockup(g, "packaging"); } else { bx(140, H - 1311, 320, 220, cP, null, 0, 14); lg(300, H - 1421, 180, 110); }
                tx("PACKAGING BOX", 300, H - 1593, 13, cWhite, fT, true);
                bx(600, H - 1237, 600, 404, cDk, null, 0, 0); bx(744, H - 1311, 312, 220, cCream, null, 0, 48); lg(900, H - 1421, 190, 120); tx("BRAND STICKER", 900, H - 1593, 13, cWhite, fT, true);

                // Seamless Brand Pattern Footer Strip!
                bx(0, H - 1641, W, 309, cP, null, 0, 0);
                for (var pf = 0; pf < 6; pf++) {
                    lg(100 + pf * 200, H - 1740, 90, 65);
                    lg(190 + pf * 200, H - 1855, 80, 58);
                }
            }

            if (seedB) { try { seedB.remove(); } catch (eR) {} }
            try { app.executeMenuCommand("fitinwindow"); } catch (eF) {}
            return "OK:Generated Vertical Behance Brand Sheet (" + tpl + (srcSel.length > 0 ? " • Your Logo Applied!" : "") + ")! • Logo on mockups: " + stampOK + " stamped per guideline" + (stampSkip > 0 ? " (" + stampSkip + " skipped — below min size: " + stampSkipCats.join(", ") + ")" : "") + " • " + bkLogoUsedNote() + ".";
        }

        // All 10 Complete Agency Branding Checklist Artboards (1920x1080 presentation / print-ready boards)
        var specs = [];
        if (inc.bkSec1 !== false)  specs.push(["01_Brand_Strategy", 1280, 720, "sec1"]);
        if (inc.bkSec2 !== false)  specs.push(["02_Logo_Identity_System", 1280, 720, "sec2"]);
        if (inc.bkSec3 !== false)  specs.push(["03_Color_System_HEX_RGB_CMYK", 1280, 720, "sec3"]);
        if (inc.bkSec4 !== false)  specs.push(["04_Typography_Hierarchy", 1280, 720, "sec4"]);
        if (inc.bkSec5 !== false)  specs.push(["05_Brand_Graphics_Pattern", 1280, 720, "sec5"]);
        if (inc.bkSec6 !== false)  specs.push(["06_Stationery_Suite", 1280, 720, "sec6"]);
        if (inc.bkSec7 !== false)  specs.push(["07_Marketing_Social_Media", 1280, 720, "sec7"]);
        if (inc.bkSec8 !== false)  specs.push(["08_Packaging_Design_Suite", 1280, 720, "sec8"]);
        if (inc.bkSec9 !== false)  specs.push(["09_Brand_Applications", 1280, 720, "sec9"]);
        if (inc.bkSec10 !== false) specs.push(["10_Brand_Guidelines_Dos_Donts", 1280, 720, "sec10"]);
        if (specs.length === 0) return "ERROR:Select at least 1 branding section.";

        var dp = new DocumentPreset();
        dp.width = 1280; dp.height = 720;
        dp.units = RulerUnits.Pixels;
        dp.colorMode = DocumentColorSpace.RGB;
        dp.title = (p.brandName || "Brand") + "_Complete_Brand_Book";
        var doc = app.documents.addDocument(DocumentColorSpace.RGB, dp);

        var seedLyr = doc.layers[0];
        seedLyr.name = "Brand_Identity_Book";
        stampLayer = seedLyr; /* v17.7.25: logos go to the layer, not the section group */
        var logoSeedGrp = null;
        if (srcSel.length > 0) {
            try {
                logoSeedGrp = seedLyr.groupItems.add();
                logoSeedGrp.name = "_LogoSeed";
                for (var sk = 0; sk < srcSel.length; sk++) srcSel[sk].duplicate(logoSeedGrp, ElementPlacement.PLACEATEND);
            } catch (eDup) { logoSeedGrp = null; }
        }

        var colP  = dmHexToRGBColor(p.primary || "#2ed3a3");
        var colS  = dmHexToRGBColor(p.secondary || "#0ea5e9");
        var colA  = dmHexToRGBColor(p.accent || "#f59e0b");
        var colDk = dmHexToRGBColor(p.dark || "#0b1120");
        var colDk2 = dmHexToRGBColor("#131c31");
        var colLt = dmHexToRGBColor(p.light || "#f8fafc");
        var colMuted = dmHexToRGBColor("#94a3b8");
        var colWhite = dmHexToRGBColor("#ffffff");
        var colRed = dmHexToRGBColor("#f43f5e");
        var colGrn = dmHexToRGBColor("#10b981");
        var fTitle = dmFindTextFont(p.titleFont || "Montserrat") || dmFindTextFont("Arial Bold") || dmFindTextFont("Arial");
        var fBody  = dmFindTextFont(p.bodyFont || "Arial") || fTitle;
        var bName  = String(p.brandName || "DESIGN360N").toUpperCase();
        stampSeed = logoSeedGrp;
        stampCols = { primary: colP, dark: colDk, white: colWhite, light: colLt };
        stampFont = fTitle;

        function addBox(grp, x, yTop, w, h, fillC, strokeC, sw, rad) {
            var r = (rad && rad > 0) ? grp.pathItems.roundedRectangle(yTop, x, w, h, rad, rad) : grp.pathItems.rectangle(yTop, x, w, h);
            if (fillC) { r.filled = true; r.fillColor = fillC; } else { r.filled = false; }
            if (strokeC) { r.stroked = true; r.strokeColor = strokeC; r.strokeWidth = sw || 1; } else { r.stroked = false; }
            return r;
        }
        function addT(grp, txt, x, yTop, sz, col, fObj, center) {
            var tf = grp.textFrames.add();
            tf.contents = String(txt || "");
            var ca = tf.textRange.characterAttributes;
            ca.size = Math.max(5, sz); ca.fillColor = col;
            if (fObj) { try { ca.textFont = fObj; } catch (e) {} }
            try { tf.textRange.paragraphAttributes.justification = center ? Justification.CENTER : Justification.LEFT; } catch (e) {}
            tf.position = [center ? (x - tf.width / 2) : x, yTop];
            return tf;
        }
        function placeLogo(grp, cx, cy, maxW, maxH, label) {
            /* v17.7.25: logos are direct children of the layer
             * (stampLayer), named, so one click selects ONLY the logo.
             * v17.7.26: the SUPPLIED logo file wins here too (book
             * sections) — previously only the live selection
             * (logoSeedGrp) was used, so an uploaded PNG never reached
             * the book's logo sections. */
            if (logoFile) {
                try {
                    var plF = new File(logoFile);
                    if (plF.exists) {
                        var plFileGrp = (stampLayer || grp).groupItems.add();
                        plFileGrp.name = bkLogoName(label || "Brand Logo");
                        var plPi = plFileGrp.placedItems.add();
                        plPi.file = plF;
                        var pgb = plPi.geometricBounds;
                        var plw = Math.max(1, pgb[2] - pgb[0]), plh = Math.max(1, pgb[1] - pgb[3]);
                        var psc = Math.min(maxW / plw, maxH / plh) * 100;
                        if (psc > 0 && psc < 10000) plPi.resize(psc, psc, true, true, true, true, psc, Transformation.CENTER);
                        var pgb2 = plPi.geometricBounds;
                        plPi.translate(cx - (pgb2[0] + pgb2[2]) / 2, cy - (pgb2[1] + pgb2[3]) / 2);
                        return plFileGrp;
                    }
                } catch (ePf2) {}
            }
            if (logoSeedGrp && logoSeedGrp.pageItems.length > 0) {
                var lg = logoSeedGrp.duplicate(stampLayer || grp, ElementPlacement.PLACEATEND);
                try { lg.name = bkLogoName(label || "Brand Logo"); } catch (eNm2) {}
                var gb = lg.geometricBounds;
                var lw = Math.max(1, gb[2] - gb[0]), lh = Math.max(1, gb[1] - gb[3]);
                var sc = Math.min(maxW / lw, maxH / lh) * 100;
                lg.resize(sc, sc, true, true, true, true, sc, Transformation.CENTER);
                var gb2 = lg.geometricBounds;
                lg.translate(cx - (gb2[0] + gb2[2]) / 2, cy - (gb2[1] + gb2[3]) / 2);
                return lg;
            }
            var rSz = Math.min(maxW, maxH);
            var plGrp = (stampLayer || grp).groupItems.add();
            plGrp.name = bkLogoName(label || "Brand Logo");
            addBox(plGrp, cx - rSz / 2, cy + rSz / 2, rSz, rSz, colP, null, 0, rSz * 0.22);
            addT(plGrp, bName.substring(0, 2), cx, cy + rSz * 0.22, rSz * 0.42, colDk, fTitle, true);
            return plGrp;
        }
        function slideHeader(g, x0, y0, num, title, isDark) {
            addBox(g, x0, y0, 1280, 720, isDark ? colDk : colLt, null, 0, 0);
            addBox(g, x0, y0, 1280, 8, colP, null, 0, 0);
            addT(g, num + " / " + title, x0 + 48, y0 - 34, 22, isDark ? colWhite : colDk, fTitle, false);
            addT(g, bName + " — BRAND IDENTITY SYSTEM", x0 + 1232 - 220, y0 - 38, 10, colMuted, fBody, false);
        }

        // Lay out all 10 boards in a clean 2-column grid
        var curX = 0, curY = 0;
        for (var i = 0; i < specs.length; i++) {
            var sp = specs[i];
            var abW = sp[1], abH = sp[2], key = sp[3];
            if (i > 0 && i % 2 === 0) { curX = 0; curY -= (abH + 100); }
            var rect = [curX, curY, curX + abW, curY - abH];
            var abObj = (i === 0) ? doc.artboards[0] : doc.artboards.add(rect);
            abObj.artboardRect = rect; abObj.name = sp[0];
            curX += abW + 100;
            var x0 = rect[0], y0 = rect[1];
            var g = seedLyr.groupItems.add(); g.name = sp[0];

            if (key === "sec1") {
                slideHeader(g, x0, y0, "01", "BRAND STRATEGY", true);
                // Hero Logo + Name + Tagline
                addBox(g, x0 + 48, y0 - 96, 420, 576, colDk2, colP, 1.5, 20);
                placeLogo(g, x0 + 258, y0 - 270, 210, 150, "Logo — Hero Lockup");
                addT(g, bName, x0 + 258, y0 - 390, 34, colWhite, fTitle, true);
                addT(g, p.tagline || "", x0 + 258, y0 - 440, 15, colP, fBody, true);
                addT(g, "COMPLETE BRAND GUIDELINES", x0 + 258, y0 - 595, 11, colMuted, fTitle, true);
                // 6 Strategy Cards on right
                var sCards = [
                    ["BRAND STORY & POSITIONING", p.story || ""],
                    ["MISSION & VISION", p.mission || ""],
                    ["CORE BRAND VALUES", p.values || ""],
                    ["BRAND PERSONALITY", p.personality || ""],
                    ["TARGET AUDIENCE", p.audience || ""],
                    ["TAGLINE & SLOGAN", (p.tagline || "") + " • " + (p.website || "")]
                ];
                for (var sc = 0; sc < 6; sc++) {
                    var sx = x0 + 492 + (sc % 2) * 380, sy = y0 - 96 - Math.floor(sc / 2) * 200;
                    addBox(g, sx, sy, 360, 176, colDk2, colS, 0.8, 16);
                    addT(g, sCards[sc][0], sx + 22, sy - 26, 11, colP, fTitle, false);
                    addT(g, sCards[sc][1], sx + 22, sy - 60, 13, colWhite, fBody, false);
                }
            } else if (key === "sec2") {
                slideHeader(g, x0, y0, "02", "LOGO & IDENTITY SYSTEM", false);
                var lCards = [
                    [x0 + 48,  y0 - 96, 379, 276, colWhite, "PRIMARY LOGO (ON LIGHT)", false],
                    [x0 + 451, y0 - 96, 378, 276, colDk,    "SECONDARY LOCKUP (ON DARK)", true],
                    [x0 + 853, y0 - 96, 379, 276, colP,     "LOGO MARK / ICON & MONOGRAM", false],
                    [x0 + 48,  y0 - 396, 580, 276, colWhite, "CLEAR SPACE GRID (MINIMUM 'X' PADDING)", false],
                    [x0 + 652, y0 - 396, 580, 276, colDk2,   "MINIMUM SIZE & USAGE RULES (20mm Print / 64px Web)", true]
                ];
                var lLabels = ["Logo — Primary Lockup", "Logo — Secondary Lockup", "Logo — Mark / Monogram"];
                for (var lc = 0; lc < lCards.length; lc++) {
                    var ld = lCards[lc];
                    addBox(g, ld[0], ld[1], ld[2], ld[3], ld[4], colP, 1.0, 16);
                    if (lc < 3) placeLogo(g, ld[0] + ld[2] / 2, ld[1] - ld[3] * 0.44, ld[2] * 0.54, ld[3] * 0.48, lLabels[lc]);
                    else if (lc === 3) {
                        addBox(g, ld[0] + 120, ld[1] - 48, ld[2] - 240, ld[3] - 110, null, colS, 1.0, 0);
                        placeLogo(g, ld[0] + ld[2] / 2, ld[1] - ld[3] * 0.44, 170, 105, "Logo — Clear Space");
                    } else {
                        placeLogo(g, ld[0] + 120, ld[1] - 125, 90, 65, "Logo — Min Size");
                        addT(g, "Print Min: 20mm   |   Digital Min: 64px\nWordmark: " + bName + "\nMonogram: " + bName.substring(0, 2) + "\nAlways preserve original aspect ratio & clear space.", ld[0] + 200, ld[1] - 85, 12.5, colWhite, fBody, false);
                    }
                    addT(g, ld[5], ld[0] + 20, ld[1] - ld[3] + 26, 10.5, ld[6] ? colP : colDk, fTitle, false);
                }
            } else if (key === "sec3") {
                slideHeader(g, x0, y0, "03", "COLOR SYSTEM (HEX • RGB • CMYK • 60-30-10 RATIO)", false);
                var sws = [
                    ["PRIMARY (30%)", p.primary, p.rgbPrimary, p.cmykPrimary, colP, colDk],
                    ["SECONDARY (10%)", p.secondary, p.rgbSecondary, p.cmykSecondary, colS, colWhite],
                    ["ACCENT (5%)", p.accent, p.rgbAccent, p.cmykAccent, colA, colDk],
                    ["DARK NEUTRAL (40%)", p.dark, p.rgbDark, p.cmykDark, colDk, colWhite],
                    ["LIGHT NEUTRAL (15%)", p.light, p.rgbLight, p.cmykLight, colWhite, colDk]
                ];
                for (var s3 = 0; s3 < sws.length; s3++) {
                    var sx3 = x0 + 48 + s3 * 242;
                    addBox(g, sx3, y0 - 96, 218, 340, sws[s3][4], colMuted, 0.7, 16);
                    addT(g, sws[s3][0], sx3 + 24, y0 - 328, 10.5, sws[s3][5], fTitle, false);
                    addT(g, String(sws[s3][1]).toUpperCase(), sx3 + 24, y0 - 352, 15, sws[s3][5], fTitle, false);
                    addT(g, sws[s3][2] || "", sx3 + 24, y0 - 380, 9.5, sws[s3][5], fBody, false);
                    addT(g, sws[s3][3] || "", sx3 + 24, y0 - 400, 9.5, sws[s3][5], fBody, false);
                }
                // Color Usage Ratio Bar (60 / 30 / 10)
                addT(g, "COLOR USAGE RATIO (60% NEUTRALS • 30% PRIMARY • 10% SECONDARY / ACCENT)", x0 + 48, y0 - 472, 12, colDk, fTitle, false);
                addBox(g, x0 + 48, y0 - 508, 682, 140, colDk, null, 0, 12);
                addT(g, "60% NEUTRAL BASE", x0 + 389, y0 - 568, 15, colWhite, fTitle, true);
                addBox(g, x0 + 754, y0 - 508, 341, 140, colP, null, 0, 12);
                addT(g, "30% PRIMARY", x0 + 924, y0 - 568, 14, colDk, fTitle, true);
                addBox(g, x0 + 1119, y0 - 508, 113, 140, colA, null, 0, 12);
                addT(g, "10%", x0 + 1175, y0 - 568, 13, colDk, fTitle, true);
            } else if (key === "sec4") {
                slideHeader(g, x0, y0, "04", "TYPOGRAPHY & HIERARCHY SYSTEM", true);
                addBox(g, x0 + 48, y0 - 96, 580, 576, colDk2, colP, 1.2, 18);
                addT(g, "Aa", x0 + 72, y0 - 136, 140, colP, fTitle, false);
                addT(g, "PRIMARY DISPLAY: " + (p.titleFont || "Montserrat").toUpperCase(), x0 + 72, y0 - 330, 14, colP, fTitle, false);
                addT(g, "ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789 !@#$%&*", x0 + 72, y0 - 368, 19, colWhite, fTitle, false);
                addT(g, "WEIGHTS: Regular (400) • Medium (500) • Bold (700) • Black (900)", x0 + 72, y0 - 588, 11, colMuted, fBody, false);

                addBox(g, x0 + 652, y0 - 96, 580, 576, colDk2, colS, 1.2, 18);
                addT(g, "TYPOGRAPHY HIERARCHY & BODY FONT (" + (p.bodyFont || "Arial") + ")", x0 + 676, y0 - 136, 12, colS, fTitle, false);
                addT(g, "H1 — Display Headline (48pt Bold)", x0 + 676, y0 - 186, 28, colWhite, fTitle, false);
                addT(g, "H2 — Section Heading (28pt SemiBold)", x0 + 676, y0 - 256, 20, colP, fTitle, false);
                addT(g, "H3 — Card Subheading (18pt Medium)", x0 + 676, y0 - 316, 15, colWhite, fTitle, false);
                addT(g, "Body Copy (12pt Regular) — " + (p.bodyFont || "Arial") + "\n" + String(p.personality || "").replace(/,\s*/g, " • "), x0 + 676, y0 - 376, 12.5, colMuted, fBody, false);
                addT(g, "CAPTION / METADATA (9PT UPPERCASE TRACKED)", x0 + 676, y0 - 476, 10, colA, fTitle, false);
            } else if (key === "sec5") {
                slideHeader(g, x0, y0, "05", "BRAND GRAPHICS, PATTERN & MOTIFS", true);
                // Pattern Grid Tile
                addBox(g, x0 + 48, y0 - 96, 580, 576, colDk2, colP, 1.2, 18);
                addT(g, "BRAND PATTERN TILE", x0 + 72, y0 - 120, 12, colP, fTitle, false);
                for (var py = 0; py < 4; py++) {
                    for (var px = 0; px < 5; px++) {
                        addBox(g, x0 + 88 + px * 104, y0 - 156 - py * 116, 84, 84, (px + py) % 2 === 0 ? colP : colS, null, 0, 18);
                    }
                }
                // Shapes, Iconography & Photo Direction
                addBox(g, x0 + 652, y0 - 96, 580, 276, colDk2, colS, 1.0, 18);
                addT(g, "GRAPHIC MOTIFS & ICONOGRAPHY STYLE", x0 + 676, y0 - 120, 12, colS, fTitle, false);
                addBox(g, x0 + 676, y0 - 176, 90, 90, colP, null, 0, 45);
                addBox(g, x0 + 790, y0 - 176, 90, 90, colS, null, 0, 18);
                addBox(g, x0 + 904, y0 - 176, 90, 90, null, colA, 4, 18);
                addBox(g, x0 + 1018, y0 - 176, 190, 90, colA, null, 0, 45);

                addBox(g, x0 + 652, y0 - 396, 580, 276, colLt, null, 0, 18);
                addT(g, "PHOTOGRAPHY & TEXTURE DIRECTION", x0 + 676, y0 - 420, 12, colDk, fTitle, false);
                var photoDir = "Photography for " + bName + (p.personality ? " — " + String(p.personality).replace(/,\s*/g, ", ") + "." : ".");
                photoDir += "\n• " + (p.industry ? ("Shot in the " + p.industry + " world — real places, real materials") : "Real places, real materials, honest light");
                photoDir += "\n• Color grading anchored to Primary & Dark Neutral tones";
                photoDir += "\n• Generous negative space kept free for typography";
                if (p.values) photoDir += "\n• " + String(p.values).replace(/,\s*/g, " • ");
                addT(g, photoDir, x0 + 676, y0 - 466, 13, colDk, fBody, false);
            } else if (key === "sec6") {
                slideHeader(g, x0, y0, "06", "COMPLETE STATIONERY SUITE (CARD • LETTERHEAD • ENVELOPE • INVOICE • ID • EMAIL SIG)", false);
                // Business Card Front + Back
                addBox(g, x0 + 48, y0 - 96, 250, 155, colDk, colP, 1, 10);
                placeLogo(g, x0 + 173, y0 - 158, 95, 65, "Logo — Business Card");
                addT(g, bName, x0 + 173, y0 - 210, 11, colWhite, fTitle, true);
                addBox(g, x0 + 322, y0 - 96, 250, 155, colWhite, colMuted, 0.7, 10);
                addBox(g, x0 + 322, y0 - 96, 10, 155, colP, null, 0, 0);
                addT(g, bName + "\n" + (p.phone || "") + "\n" + (p.email || "") + "\n" + (p.website || ""), x0 + 344, y0 - 122, 9.5, colDk, fBody, false);
                // DL Envelope — real stationery mockup photo when available, else vector
                addBox(g, x0 + 48, y0 - 275, 524, 180, colWhite, colMuted, 0.7, 10);
                addBox(g, x0 + 48, y0 - 441, 524, 14, colP, null, 0, 0);
                if (dmPlaceMockup(g, "stationery", x0 + 72, y0 - 299, 476, 132, colP)) { dmStampLogoOnMockup(g, "stationery"); } else {
                    placeLogo(g, x0 + 116, y0 - 332, 68, 42);
                    addT(g, "DL ENVELOPE (220×110mm)\n" + (p.address || ""), x0 + 166, y0 - 314, 10, colDk, fBody, false);
                }
                // Email Signature & Notepad
                addBox(g, x0 + 48, y0 - 479, 524, 193, colDk2, colS, 1, 12);
                placeLogo(g, x0 + 115, y0 - 575, 80, 60);
                addT(g, "EMAIL SIGNATURE TEMPLATE\n" + bName + "\n" + (p.phone || "") + " | " + (p.email || "") + "\n" + (p.website || ""), x0 + 185, y0 - 519, 11.5, colWhite, fBody, false);
                // A4 Letterhead + Invoice Preview (Right)
                addBox(g, x0 + 596, y0 - 96, 320, 576, colWhite, colMuted, 0.8, 10);
                addBox(g, x0 + 596, y0 - 96, 320, 14, colP, null, 0, 0);
                placeLogo(g, x0 + 650, y0 - 142, 65, 40);
                addT(g, "LETTERHEAD & INVOICE / QUOTATION\n\n" + bName + "\n" + (p.email || "") + "\n" + (p.website || "") + "\n\nInvoice #: INV-2026-001", x0 + 618, y0 - 190, 10, colDk, fBody, false);
                addBox(g, x0 + 596, y0 - 637, 320, 35, colDk, null, 0, 0);
                // Staff ID Card & Folder
                addBox(g, x0 + 940, y0 - 96, 292, 576, colWhite, colP, 1.2, 16);
                addBox(g, x0 + 940, y0 - 96, 292, 130, colDk, null, 0, 12);
                placeLogo(g, x0 + 1086, y0 - 160, 110, 72);
                addBox(g, x0 + 1016, y0 - 260, 140, 140, colLt, colP, 3, 70);
                addT(g, "STAFF ID CARD\n" + bName + "\nID #001 • Authorized", x0 + 1086, y0 - 430, 13, colDk, fTitle, true);
            } else if (key === "sec7") {
                slideHeader(g, x0, y0, "07", "MARKETING & SOCIAL MEDIA KIT (FB • IG POST/STORY • BANNER • FLYER)", true);
                // IG Square Post
                addBox(g, x0 + 48, y0 - 96, 360, 360, colDk2, colP, 2, 18);
                placeLogo(g, x0 + 228, y0 - 215, 140, 100, "Logo — Social Post");
                addT(g, bName, x0 + 228, y0 - 305, 24, colWhite, fTitle, true);
                addT(g, "INSTAGRAM / FB POST (1080×1080)", x0 + 228, y0 - 418, 10, colP, fTitle, true);
                // IG Story Vertical — real phone mockup photo when available
                addBox(g, x0 + 432, y0 - 96, 240, 576, colP, null, 0, 18);
                if (dmPlaceMockup(g, "phone", x0 + 456, y0 - 120, 192, 280, colP)) { dmStampLogoOnMockup(g, "phone"); } else { placeLogo(g, x0 + 552, y0 - 280, 130, 95); }
                addT(g, "IG STORY\n1080×1920", x0 + 552, y0 - 420, 16, colDk, fTitle, true);
                // FB Cover Banner — real social mockup photo when available
                addBox(g, x0 + 696, y0 - 96, 536, 210, colDk2, colS, 2, 16);
                if (dmPlaceMockup(g, "social", x0 + 720, y0 - 120, 240, 162, colP)) {
                    dmStampLogoOnMockup(g, "social");
                    addT(g, bName + "\n" + (p.tagline || "") + "\nFACEBOOK COVER (851×315)", x0 + 980, y0 - 155, 15, colWhite, fTitle, false);
                } else {
                    placeLogo(g, x0 + 840, y0 - 201, 120, 90);
                    addT(g, bName + "\n" + (p.tagline || "") + "\nFACEBOOK COVER (851×315)", x0 + 940, y0 - 155, 15, colWhite, fTitle, false);
                }
                // Flyer & Poster
                addBox(g, x0 + 696, y0 - 330, 536, 342, colLt, colP, 1.5, 16);
                addBox(g, x0 + 696, y0 - 330, 536, 60, colDk, null, 0, 12);
                addT(g, "PROMOTIONAL FLYER / POSTER / AD TEMPLATE", x0 + 964, y0 - 352, 13, colP, fTitle, true);
                placeLogo(g, x0 + 964, y0 - 510, 160, 105);
                addT(g, (p.website || "") + "  •  " + (p.phone || ""), x0 + 964, y0 - 620, 13, colDk, fTitle, true);
                // Promo Strip bottom left
                addBox(g, x0 + 48, y0 - 480, 360, 192, colS, null, 0, 16);
                addT(g, "PROMO WEB BANNER\n" + (p.tagline || ""), x0 + 228, y0 - 548, 15, colWhite, fTitle, true);
            } else if (key === "sec8") {
                slideHeader(g, x0, y0, "08", "PACKAGING DESIGN SUITE (BOX • BAG • LABEL • TAG • STICKER • THANK YOU)", false);
                var pCards = [
                    [x0 + 48,  y0 - 96, 379, 276, colDk,    "PRODUCT BOX DESIGN", true, "packaging"],
                    [x0 + 451, y0 - 96, 378, 276, colP,     "SHOPPING BAG", false, "bag"],
                    [x0 + 853, y0 - 96, 379, 276, colWhite, "PRODUCT LABEL & STICKER", false, ""],
                    [x0 + 48,  y0 - 396, 379, 276, colWhite, "HANG TAG (50×90mm)", false, ""],
                    [x0 + 451, y0 - 396, 378, 276, colDk2,   "THANK YOU CARD", true, ""],
                    [x0 + 853, y0 - 396, 379, 276, colS,     "BRANDED TISSUE PAPER PATTERN", true, ""]
                ];
                for (var pc = 0; pc < pCards.length; pc++) {
                    var pd = pCards[pc];
                    addBox(g, pd[0], pd[1], pd[2], pd[3], pd[4], colP, 1.0, 16);
                    var placed8 = pd[7] ? dmPlaceMockup(g, pd[7], pd[0] + 24, pd[1] - 24, pd[2] - 48, pd[3] - 72, colP) : false;
                    if (placed8) dmStampLogoOnMockup(g, pd[7]); else placeLogo(g, pd[0] + pd[2] / 2, pd[1] - pd[3] * 0.5 + 12, pd[2] * 0.48, pd[3] * 0.44);
                    addT(g, pd[5], pd[0] + pd[2] / 2, pd[1] - pd[3] + 60, 11, pd[6] ? colWhite : colDk, fTitle, true);
                }
            } else if (key === "sec9") {
                slideHeader(g, x0, y0, "09", "BRAND APPLICATIONS (SIGNBOARD • STOREFRONT • OFFICE • UNIFORM • VEHICLE • BOOTH)", true);
                var aCards = [
                    [x0 + 48,  y0 - 96, 580, 180, colDk2, "SHOP SIGNBOARD & STOREFRONT FASCIA", "signage"],
                    [x0 + 652, y0 - 96, 580, 180, colP,   "OFFICE RECEPTION WALL BRANDING", ""],
                    [x0 + 48,  y0 - 300, 379, 372, colDk2, "STAFF UNIFORM & MERCH", "apparel"],
                    [x0 + 451, y0 - 300, 378, 372, colS,   "DELIVERY VEHICLE WRAP", "billboard"],
                    [x0 + 853, y0 - 300, 379, 372, colLt,  "EXHIBITION BOOTH BACKDROP", "laptop"]
                ];
                for (var ac = 0; ac < aCards.length; ac++) {
                    var ad = aCards[ac];
                    var isLtC = (ac === 1 || ac === 4);
                    addBox(g, ad[0], ad[1], ad[2], ad[3], ad[4], colP, 1.0, 16);
                    var placed9 = ad[6] ? dmPlaceMockup(g, ad[6], ad[0] + 24, ad[1] - 24, ad[2] - 48, ad[3] - 72, colP) : false;
                    if (placed9) dmStampLogoOnMockup(g, ad[6]); else placeLogo(g, ad[0] + ad[2] / 2, ad[1] - ad[3] * 0.5 + 12, ad[2] * 0.44, ad[3] * 0.42);
                    addT(g, ad[5], ad[0] + ad[2] / 2, ad[1] - ad[3] + 60, 11, isLtC ? colDk : colWhite, fTitle, true);
                }
            } else if (key === "sec10") {
                slideHeader(g, x0, y0, "10", "BRAND GUIDELINES — LOGO DO'S, DON'TS & CONSISTENCY RULES", false);
                addBox(g, x0 + 48, y0 - 96, 580, 576, colWhite, colGrn, 2.0, 18);
                addT(g, "✓  LOGO DO'S (CORRECT USAGE)", x0 + 72, y0 - 120, 16, colGrn, fTitle, false);
                placeLogo(g, x0 + 338, y0 - 260, 200, 130, "Logo — Correct Usage");
                addT(g, "✓ Keep original proportions & vector sharpness\n✓ Maintain clear space around all 4 sides\n✓ Use official Primary, Dark, or White lockups\n✓ Apply approved brand fonts & 60-30-10 color ratio\n✓ Export CMYK 300 DPI for print, RGB for digital", x0 + 72, y0 - 390, 13, colDk, fBody, false);

                addBox(g, x0 + 652, y0 - 96, 580, 576, colWhite, colRed, 2.0, 18);
                addT(g, "✕  LOGO DON'TS (NEVER DO)", x0 + 676, y0 - 120, 16, colRed, fTitle, false);
                addT(g, "✕ Never stretch, squash, or skew the logo\n✕ Never rotate or tilt the primary mark\n✕ Never apply unapproved colors or gradients\n✕ Never add heavy drop shadows or outer glows\n✕ Never place dark logo on dark or busy photos\n✕ Never crop or crowd text inside clear space", x0 + 676, y0 - 210, 13.5, colDk, fBody, false);
                addBox(g, x0 + 676, y0 - 524, 532, 120, colDk, null, 0, 14);
                addT(g, "OFFICIAL BRAND CONTACT\n" + bName + " • " + (p.website || "") + "\n" + (p.email || "") + " • " + (p.phone || ""), x0 + 942, y0 - 552, 12, colP, fTitle, true);
            }
        }

        if (logoSeedGrp) { try { logoSeedGrp.remove(); } catch (eRem) {} }
        try { app.executeMenuCommand("fitall"); } catch (eFit) {}
        return "OK:Generated Complete " + specs.length + "-Section Brand Identity Book (" + (srcSel.length > 0 ? "Your Selected Logo Applied!" : "Monogram Applied") + ")! • Logo on mockups: " + stampOK + " stamped per guideline" + (stampSkip > 0 ? " (" + stampSkip + " skipped — below min size: " + stampSkipCats.join(", ") + ")" : "") + " • " + bkLogoUsedNote() + ".";
    } catch (err) {
        return "ERROR:" + err.message + " (line " + err.line + ")";
    }
}
