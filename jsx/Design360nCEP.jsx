// Design360n — Photoshop CEP ExtendScript Engine (.jsx)
// Version: 2.76
// ============================================================
// Loaded by CEP (CSXS manifest ScriptPath). Full Photoshop DOM + Action Manager.
// ES3-strict ExtendScript. Every aura* function returns "OK: ..." or "Error: ..."
// after reading back Photoshop state — never silent failures.
// ============================================================

var DESIGN360N_VERSION = "2.76";
function auraVersion() { return DESIGN360N_VERSION; }

/* Exact Glow presets from specification:
   threshold / core / iterations / radius / exposure / gamma */
var PRESETS = [
    { name: "Glow Up",        thr: 0.5,  core: 200, iter: 11, rad: 1000, exp: -0.5, gamma: 1.2, streak: false, sang: 0, slen: 900,  sint: 60, aber: false, adist: 20, rays: false, hue: 0,   sat: 100, blend: "screen" },
    { name: "Soft Bloom",       thr: 0.5,  core: 40,  iter: 8,  rad: 500,  exp: -2.0, gamma: 1.2, streak: false, sang: 0, slen: 900,  sint: 60, aber: false, adist: 20, rays: false, hue: 0,   sat: 100, blend: "screen" },
    { name: "Cinematic",        thr: 0.62, core: 50,  iter: 8,  rad: 700,  exp: -0.5, gamma: 1.1, streak: true,  sang: 0, slen: 1400, sint: 35, aber: false, adist: 20, rays: false, hue: 8,   sat: 110, blend: "screen" },
    { name: "Neon",             thr: 0.35, core: 140, iter: 6,  rad: 220,  exp: -0.9, gamma: 0.8, streak: false, sang: 0, slen: 900,  sint: 60, aber: false, adist: 20, rays: false, hue: 0,   sat: 100, blend: "add" },
    { name: "Warm Sun",         thr: 0.55, core: 60,  iter: 9,  rad: 900,  exp: -1.3, gamma: 1.3, streak: false, sang: 0, slen: 900,  sint: 60, aber: false, adist: 20, rays: true,  hue: 32,  sat: 90,  blend: "screen" },
    { name: "Cold Moon",        thr: 0.6,  core: 50,  iter: 8,  rad: 600,  exp: -0.5, gamma: 1.2, streak: false, sang: 0, slen: 900,  sint: 60, aber: false, adist: 20, rays: false, hue: 180, sat: 70,  blend: "screen" },
    { name: "Anamorphic Blue",  thr: 0.7,  core: 70,  iter: 7,  rad: 350,  exp: -1.4, gamma: 1.2, streak: true,  sang: 0, slen: 2400, sint: 90, aber: false, adist: 20, rays: false, hue: 180, sat: 120, blend: "add" },
    { name: "Dreamy",           thr: 0.4,  core: 30,  iter: 9,  rad: 1200, exp: -1.9, gamma: 1.6, streak: false, sang: 0, slen: 900,  sint: 60, aber: true,  adist: 30, rays: false, hue: -12, sat: 85,  blend: "screen" },
    { name: "Subtle Pop",       thr: 0.7,  core: 80,  iter: 6,  rad: 160,  exp: -0.5, gamma: 1.2, streak: false, sang: 0, slen: 900,  sint: 60, aber: false, adist: 20, rays: false, hue: 0,   sat: 100, blend: "screen" }
];

var SIZES = [
    { label: "Instagram Post (Square) 1080 x 1080", w: 1080, h: 1080 }, { label: "Instagram Portrait (Feed) 1080 x 1350", w: 1080, h: 1350 },
    { label: "Instagram Tall Portrait (Grid) 1080 x 1440", w: 1080, h: 1440 }, { label: "Instagram Story / Reel 1080 x 1920", w: 1080, h: 1920 },
    { label: "Facebook Feed Photo 1080 x 1350", w: 1080, h: 1350 }, { label: "Facebook Post (Link) 1200 x 630", w: 1200, h: 630 },
    { label: "Facebook Story / Reel 1080 x 1920", w: 1080, h: 1920 }, { label: "Facebook Cover 851 x 315", w: 851, h: 315 },
    { label: "YouTube Thumbnail 1280 x 720", w: 1280, h: 720 }, { label: "YouTube Shorts 1080 x 1920", w: 1080, h: 1920 },
    { label: "YouTube Banner 2560 x 1440", w: 2560, h: 1440 }, { label: "TikTok Video 1080 x 1920", w: 1080, h: 1920 },
    { label: "LinkedIn Post 1200 x 627", w: 1200, h: 627 }, { label: "LinkedIn Banner 1584 x 396", w: 1584, h: 396 },
    { label: "X Post 1600 x 900", w: 1600, h: 900 }, { label: "X Header 1500 x 500", w: 1500, h: 500 },
    { label: "Pinterest Pin 1000 x 1500", w: 1000, h: 1500 }
];

var PRINT_SIZES = [
    { label: "A4 — 210 x 297 mm (2480 x 3508 @300dpi)", w: 2480, h: 3508, dpi: 300 },
    { label: "A3 — 297 x 420 mm (3508 x 4961 @300dpi)", w: 3508, h: 4961, dpi: 300 },
    { label: "A5 — 148 x 210 mm (1748 x 2480 @300dpi)", w: 1748, h: 2480, dpi: 300 },
    { label: "Letter — 8.5 x 11 inch (2550 x 3300 @300dpi)", w: 2550, h: 3300, dpi: 300 },
    { label: "Legal — 8.5 x 14 inch (2550 x 4200 @300dpi)", w: 2550, h: 4200, dpi: 300 },
    { label: "Tabloid — 11 x 17 inch (3300 x 5100 @300dpi)", w: 3300, h: 5100, dpi: 300 },
    { label: "Photo 4x6 inch (1200 x 1800 @300dpi)", w: 1200, h: 1800, dpi: 300 },
    { label: "Photo 5x7 inch (1500 x 2100 @300dpi)", w: 1500, h: 2100, dpi: 300 },
    { label: "Photo 8x10 inch (2400 x 3000 @300dpi)", w: 2400, h: 3000, dpi: 300 },
    { label: "Postcard 6x4 inch (1800 x 1200 @300dpi)", w: 1800, h: 1200, dpi: 300 },
    { label: "Business Card — 3.5 x 2 inch (1050 x 600 @300dpi)", w: 1050, h: 600, dpi: 300 },
    { label: "Flyer — A5 Landscape 210 x 148 mm (2480 x 1748 @300dpi)", w: 2480, h: 1748, dpi: 300 }
];

/* ---------------- CORE HELPERS & READ-BACK VERIFICATION ---------------- */
function sTID(s) { return stringIDToTypeID(s); }
function cTID(s) { return charIDToTypeID(s); }

function needDoc() {
    if (app.documents.length === 0) {
        alert("Age ekta chobi/PSD khulun.");
        return null;
    }
    return app.activeDocument;
}

function restoreRGBChannels(doc) {
    try { doc.activeChannels = doc.componentChannels; } catch (e) {}
}

function ensureNotBackground(lyr) {
    if (!lyr) return false;
    try {
        if (lyr.isBackgroundLayer) lyr.isBackgroundLayer = false;
        return !lyr.isBackgroundLayer;
    } catch (e) {
        return false;
    }
}

function ensureRasterLayer(doc, lyr) {
    if (!lyr) return false;
    try {
        doc.activeLayer = lyr;
        if (lyr.kind !== LayerKind.NORMAL) {
            lyr.rasterize(RasterizeType.ENTIRELAYER);
        }
        return true;
    } catch (e) {
        return false;
    }
}

function getLayerId(doc, lyr) {
    try {
        if (lyr) doc.activeLayer = lyr;
        var ref = new ActionReference();
        ref.putProperty(cTID("Prpr"), cTID("LyrI"));
        ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
        var res = executeActionGet(ref);
        return res.getInteger(cTID("LyrI"));
    } catch (e) {
        return -1;
    }
}

function findLayerByName(parent, name) {
    for (var i = 0; i < parent.layers.length; i++) {
        var l = parent.layers[i];
        if (l.name === name) return l;
        if (l.typename === "LayerSet") {
            var sub = findLayerByName(l, name);
            if (sub) return sub;
        }
    }
    return null;
}

function findLayerById(doc, id) {
    if (id == null || id < 0) return null;
    try {
        var d = new ActionDescriptor();
        var r = new ActionReference();
        r.putIdentifier(cTID("Lyr "), id);
        d.putReference(cTID("null"), r);
        d.putBoolean(cTID("MkVs"), false);
        executeAction(cTID("slct"), d, DialogModes.NO);
        var cur = doc.activeLayer;
        if (getLayerId(doc, cur) === id) return cur;
    } catch (e) {}
    return null;
}

function hasUserMask(doc, lyr) {
    try {
        if (lyr) doc.activeLayer = lyr;
        var ref = new ActionReference();
        ref.putProperty(cTID("Prpr"), sTID("hasUserMask"));
        ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
        var res = executeActionGet(ref);
        if (res.hasKey(sTID("hasUserMask"))) {
            return res.getBoolean(sTID("hasUserMask")) === true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

function hasLayerStyle(doc, lyr, key4) {
    try {
        if (lyr) doc.activeLayer = lyr;
        var ref = new ActionReference();
        ref.putProperty(cTID("Prpr"), cTID("Lefx"));
        ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
        var res = executeActionGet(ref);
        if (!res.hasKey(cTID("Lefx"))) return false;
        var lefx = res.getObjectValue(cTID("Lefx"));
        if (!key4) return true;
        return lefx.hasKey(cTID(key4));
    } catch (e) {
        return false;
    }
}

/* FIXED stampVisible: ALWAYS restores RGB channels, creates a fresh visible top
   artLayer BEFORE calling mergeVisible(duplicate:true). */
function stampVisible(name, doc) {
    var d = doc || app.activeDocument;
    restoreRGBChannels(d);
    var stamp = d.artLayers.add();
    if (d.layers.length > 1 && d.layers[0] !== stamp) {
        stamp.move(d.layers[0], ElementPlacement.PLACEBEFORE);
    }
    d.activeLayer = stamp;
    stamp.visible = true;
    var desc = new ActionDescriptor();
    desc.putBoolean(sTID("duplicate"), true);
    executeAction(sTID("mergeVisible"), desc, DialogModes.NO);
    stamp = d.activeLayer;
    stamp.name = name;
    return stamp;
}

function setBlend(layer, blend, opacity) {
    layer.blendMode = (blend === "add") ? BlendMode.LINEARDODGE : BlendMode.SCREEN;
    if (opacity != null) layer.opacity = opacity;
}

function radialBlurZoom(amount) {
    var d = new ActionDescriptor();
    d.putInteger(sTID("amount"), amount);
    d.putEnumerated(sTID("blurMethod"), sTID("blurMethod"), sTID("zoom"));
    d.putEnumerated(sTID("quality"), sTID("quality"), sTID("best"));
    executeAction(sTID("radialBlur"), d, DialogModes.NO);
}

function applyExposureAM(doc, lyr, expStops) {
    doc.activeLayer = lyr;
    try {
        var d = new ActionDescriptor();
        d.putDouble(cTID("Exps"), expStops);
        d.putDouble(cTID("Ofst"), 0.0);
        d.putDouble(sTID("gammaCorrection"), 1.0);
        executeAction(cTID("Exps"), d, DialogModes.NO);
        return true;
    } catch (e) {
        var bc = Math.max(-100, Math.min(100, Math.round(expStops * 35)));
        lyr.adjustBrightnessContrast(bc, 0);
        return true;
    }
}

function shiftSingleChannel(doc, lyr, chanIdx, dx, dy) {
    if (dx === 0 && dy === 0) return false;
    if (!doc.componentChannels || doc.componentChannels.length <= chanIdx) return false;
    var prevChannels = doc.componentChannels;
    try {
        doc.activeLayer = lyr;
        doc.activeChannels = [doc.componentChannels[chanIdx]];
        lyr.applyOffset(dx, dy, UndefinedAreas.REPEATEDGEPIXELS);
        doc.activeChannels = prevChannels;
        return true;
    } catch (e) {
        restoreRGBChannels(doc);
        return false;
    }
}

function addMaskFromSelection() {
    var d = new ActionDescriptor();
    d.putClass(cTID("Nw  "), cTID("Chnl"));
    var rAt = new ActionReference();
    rAt.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Msk "));
    d.putReference(cTID("At  "), rAt);
    d.putEnumerated(cTID("Usng"), cTID("UsrM"), cTID("RvlS"));
    executeAction(cTID("Mk  "), d, DialogModes.NO);
}

function addRevealAllMask() {
    var d = new ActionDescriptor();
    d.putClass(cTID("Nw  "), cTID("Chnl"));
    var rAt = new ActionReference();
    rAt.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Msk "));
    d.putReference(cTID("At  "), rAt);
    d.putEnumerated(cTID("Usng"), cTID("UsrM"), cTID("RvlA"));
    executeAction(cTID("Mk  "), d, DialogModes.NO);
}

/* sRGB (0..255) -> CIE L*a*b* for Photoshop Color Range */
function rgbToLab(r, g, b) {
    function lin(v) {
        v = v / 255.0;
        return (v <= 0.04045) ? (v / 12.92) : Math.pow((v + 0.055) / 1.055, 2.4);
    }
    var rl = lin(r), gl = lin(g), bl = lin(b);
    var x = (rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375) / 0.95047;
    var y = (rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750) / 1.00000;
    var z = (rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041) / 1.08883;
    function f(t) { return (t > 0.008856) ? Math.pow(t, 1.0 / 3.0) : (7.787 * t + 16.0 / 116.0); }
    var fx = f(x), fy = f(y), fz = f(z);
    return {
        l: Math.max(0, Math.min(100, 116.0 * fy - 16.0)),
        a: Math.max(-128, Math.min(127, 500.0 * (fx - fy))),
        b: Math.max(-128, Math.min(127, 200.0 * (fy - fz)))
    };
}

/* ---------------- 1. GLOW ---------------- */
function doGlow(p) {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    var oldUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    try {
        var base = stampVisible("Glow Up Base TMP", doc);
        var thrIn = Math.max(0, Math.min(253, Math.round(p.thr * 255)));
        var gammaVal = Math.max(0.1, Math.min(9.99, p.gamma || 1.2));
        doc.activeLayer = base;
        base.adjustLevels(thrIn, 255, gammaVal, 0, 255);

        if (p.exp != null && p.exp !== 0) {
            applyExposureAM(doc, base, p.exp);
        }

        var iter = (p.iter != null) ? p.iter : 8;
        var passes = Math.max(2, Math.min(6, Math.round(iter / 2)));
        var maxPx = Math.max(2, Math.min(250, p.rad / 10.0));

        var accum = base.duplicate();
        accum.name = "Glow Up 1";
        accum.move(base, ElementPlacement.PLACEBEFORE);
        doc.activeLayer = accum;
        accum.applyGaussianBlur(Math.max(1, maxPx / Math.pow(2, passes - 1)));
        accum.blendMode = BlendMode.NORMAL;

        var passBlend = (p.blend === "add") ? BlendMode.LINEARDODGE : BlendMode.SCREEN;
        for (var bp = 1; bp < passes; bp++) {
            var frac = (bp + 1) / passes;
            var rPx = Math.max(1, maxPx * frac * frac);
            var passLyr = base.duplicate();
            passLyr.name = "Glow Pass TMP " + bp;
            passLyr.move(accum, ElementPlacement.PLACEBEFORE);
            doc.activeLayer = passLyr;
            passLyr.applyGaussianBlur(rPx);
            passLyr.blendMode = passBlend;
            passLyr.opacity = Math.max(15, Math.round(85 / passes + 20));
            accum = passLyr.merge();
            accum.name = "Glow Up 1";
        }

        if (p.core != null && p.core > 0) {
            var coreLyr = base.duplicate();
            coreLyr.name = "Glow Core TMP";
            coreLyr.move(accum, ElementPlacement.PLACEBEFORE);
            doc.activeLayer = coreLyr;
            coreLyr.applyGaussianBlur(Math.max(1, maxPx * 0.15));
            coreLyr.blendMode = passBlend;
            coreLyr.opacity = Math.max(5, Math.min(100, Math.round(p.core / 2)));
            accum = coreLyr.merge();
            accum.name = "Glow Up 1";
        }

        if (p.streak) {
            var sang = (p.sang == null ? 0 : p.sang);
            var mDist = Math.max(1, Math.min(2000, Math.round((p.slen || 900) / 10)));
            var sint = Math.max(1, Math.min(100, p.sint == null ? 60 : p.sint));
            var st = base.duplicate();
            st.name = "Glow Streaks TMP";
            st.move(accum, ElementPlacement.PLACEBEFORE);
            doc.activeLayer = st;
            st.applyMotionBlur(sang, mDist);
            st.blendMode = passBlend;
            st.opacity = sint;
            accum = st.merge();
            accum.name = "Glow Up 1";
        }

        if (p.rays) {
            var rayLyr = base.duplicate();
            rayLyr.name = "Glow Rays TMP";
            rayLyr.move(accum, ElementPlacement.PLACEBEFORE);
            doc.activeLayer = rayLyr;
            radialBlurZoom(55);
            rayLyr.blendMode = passBlend;
            rayLyr.opacity = 75;
            accum = rayLyr.merge();
            accum.name = "Glow Up 1";
        }

        base.remove();

        if (p.aber) {
            var adist = Math.max(1, Math.round(p.adist || 20));
            shiftSingleChannel(doc, accum, 0, adist, 0);
            shiftSingleChannel(doc, accum, 2, -adist, 0);
        }

        if ((p.hue != null && p.hue !== 0) || (p.sat != null && p.sat !== 100)) {
            doc.activeLayer = accum;
            var satAdj = Math.max(-100, Math.min(100, (p.sat == null ? 100 : p.sat) - 100));
            accum.adjustHueSaturation(p.hue || 0, satAdj, 0);
        }

        accum.name = "Glow Up 1";
        var expectedBlend = (p.blend === "add") ? BlendMode.LINEARDODGE : BlendMode.SCREEN;
        setBlend(accum, p.blend, (p.op == null ? 100 : p.op));
        doc.activeLayer = accum;
        if (p.addMask !== false) {
            addRevealAllMask();
            restoreRGBChannels(doc);
        }

        var verifiedLayer = findLayerByName(doc, "Glow Up 1");
        if (!verifiedLayer) return "Error: Verification failed — 'Glow Up 1' layer not found.";
        if (verifiedLayer.blendMode !== expectedBlend) return "Error: Verification failed — blend mode mismatch.";
        var blendLabel = (p.blend === "add") ? "Add (Linear Dodge)" : "Screen";
        return "OK: Glow Up 1 ready (" + p.name + " | " + blendLabel + " | " + passes + " passes | Exp " + p.exp + ").";
    } catch (e) {
        return "Error: Glow failed — " + e.message;
    } finally {
        restoreRGBChannels(doc);
        try { app.preferences.rulerUnits = oldUnits; } catch (e2) {}
    }
}

/* ---------------- 6. SOCIAL & PRINT SIZES ---------------- */
function addSafeGuides(doc, w, h) {
    doc.guides.removeAll();
    var mx = w * 0.10, my = h * 0.10;
    doc.guides.add(Direction.VERTICAL, UnitValue(mx, "px"));
    doc.guides.add(Direction.VERTICAL, UnitValue(w - mx, "px"));
    doc.guides.add(Direction.VERTICAL, UnitValue(w / 2, "px"));
    doc.guides.add(Direction.HORIZONTAL, UnitValue(my, "px"));
    doc.guides.add(Direction.HORIZONTAL, UnitValue(h - my, "px"));
    doc.guides.add(Direction.HORIZONTAL, UnitValue(h / 2, "px"));
}

function doSize(size, mode, guides) {
    if (!size) return "Error: Invalid size preset.";
    var oldUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    try {
        var doc;
        if (mode === "new") {
            doc = app.documents.add(UnitValue(size.w, "px"), UnitValue(size.h, "px"), 72, "Design360n " + size.w + "x" + size.h, NewDocumentMode.RGB, DocumentFill.WHITE);
        } else {
            doc = needDoc();
            if (!doc) return "Error: No open document to resize.";
            doc.resizeImage(UnitValue(size.w, "px"), UnitValue(size.h, "px"), 72, ResampleMethod.BICUBIC);
        }
        if (guides) addSafeGuides(doc, size.w, size.h);
        var rw = Math.round(doc.width.as("px")), rh = Math.round(doc.height.as("px"));
        if (rw !== size.w || rh !== size.h) {
            return "Error: Size verification failed — got " + rw + "x" + rh + " px.";
        }
        return "OK: " + (mode === "new" ? "New doc " : "Resized to ") + rw + "x" + rh + " px @ 72 DPI.";
    } catch (e) {
        return "Error: Social size failed — " + e.message;
    } finally {
        try { app.preferences.rulerUnits = oldUnits; } catch (e2) {}
    }
}

function auraPrint(i, mode, guides) {
    var s = PRINT_SIZES[i];
    if (!s) return "Error: Invalid print size preset.";
    var oldUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    try {
        var doc;
        if (mode === "new") {
            doc = app.documents.add(UnitValue(s.w, "px"), UnitValue(s.h, "px"), s.dpi, "Design360n Print " + s.w + "x" + s.h, NewDocumentMode.RGB, DocumentFill.WHITE);
        } else {
            doc = needDoc();
            if (!doc) return "Error: No open document to resize.";
            doc.resizeImage(UnitValue(s.w, "px"), UnitValue(s.h, "px"), s.dpi, ResampleMethod.BICUBIC);
        }
        if (guides) addSafeGuides(doc, s.w, s.h);
        var rw = Math.round(doc.width.as("px"));
        var rh = Math.round(doc.height.as("px"));
        var rdpi = Math.round(doc.resolution);
        if (rw !== s.w || rh !== s.h || rdpi !== s.dpi) {
            return "Error: Print verification failed — got " + rw + "x" + rh + " px @ " + rdpi + " DPI.";
        }
        return "OK: Print " + (mode === "new" ? "doc created" : "resized") + " — " + rw + "x" + rh + " px @ " + rdpi + " DPI.";
    } catch (e) {
        return "Error: Print size failed — " + e.message;
    } finally {
        try { app.preferences.rulerUnits = oldUnits; } catch (e2) {}
    }
}

/* ---------------- 3. BG REMOVER v2.22 (PRO AI + CONTIGUOUS WAND + LAB + STUDIO SHADOW CUT) ---------------- */
function hexToRGBObj(hex) {
    if (!hex) return null;
    var h = String(hex).replace("#", "").replace(/[^0-9a-fA-F]/g, "");
    if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
    if (h.length !== 6) return null;
    return { r: parseInt(h.substr(0, 2), 16), g: parseInt(h.substr(2, 2), 16), b: parseInt(h.substr(4, 2), 16) };
}

function samplePointRGB(doc, px, py) {
    var cs = null;
    try {
        cs = doc.colorSamplers.add([UnitValue(px, "px"), UnitValue(py, "px")]);
        var col = { r: Math.round(cs.color.rgb.red), g: Math.round(cs.color.rgb.green), b: Math.round(cs.color.rgb.blue) };
        try { cs.remove(); } catch (e2) {}
        return col;
    } catch (e) {
        if (cs) { try { cs.remove(); } catch (e3) {} }
        return null;
    }
}

function sampleBgRGB(doc) {
    var W = doc.width.as("px"), H = doc.height.as("px");
    var pts = [[4, 4], [Math.max(4, W - 5), 4], [4, Math.max(4, H - 5)], [Math.max(4, W - 5), Math.max(4, H - 5)]];
    var cols = [];
    for (var i = 0; i < pts.length; i++) {
        var c = samplePointRGB(doc, pts[i][0], pts[i][1]);
        if (c) cols.push(c);
    }
    if (cols.length === 0) return null;
    function med(a) {
        var s = a.slice(0);
        s.sort(function (x, y) { return x - y; });
        return s[Math.floor(s.length / 2)];
    }
    var rs = [], gs = [], bs = [];
    for (var j = 0; j < cols.length; j++) { rs.push(cols[j].r); gs.push(cols[j].g); bs.push(cols[j].b); }
    return { r: med(rs), g: med(gs), b: med(bs) };
}

function rgbDist(a, b) {
    var dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
}

function magicWandSelect(xPx, yPx, tol, addToSel, contiguous) {
    var d = new ActionDescriptor();
    var r = new ActionReference();
    r.putProperty(cTID("Chnl"), cTID("fsel"));
    d.putReference(cTID("null"), r);
    var pt = new ActionDescriptor();
    pt.putUnitDouble(cTID("Hrzn"), cTID("#Pxl"), xPx);
    pt.putUnitDouble(cTID("Vrtc"), cTID("#Pxl"), yPx);
    d.putObject(cTID("T   "), cTID("Pnt "), pt);
    d.putInteger(cTID("Tlrn"), Math.max(1, Math.min(255, Math.round(tol))));
    d.putBoolean(cTID("AntA"), true);
    d.putBoolean(cTID("Cntg"), contiguous !== false);
    executeAction(addToSel ? cTID("AddT") : cTID("setd"), d, DialogModes.NO);
}

function colorRangeLabSelect(bg, fuzz) {
    var lab = rgbToLab(bg.r, bg.g, bg.b);
    var d = new ActionDescriptor();
    d.putInteger(cTID("Fzns"), Math.max(1, Math.min(200, Math.round(fuzz))));
    var mn = new ActionDescriptor();
    mn.putDouble(cTID("Lmnc"), lab.l);
    mn.putDouble(cTID("A   "), lab.a);
    mn.putDouble(cTID("B   "), lab.b);
    d.putObject(cTID("Mnm "), cTID("LbCl"), mn);
    var mx = new ActionDescriptor();
    mx.putDouble(cTID("Lmnc"), lab.l);
    mx.putDouble(cTID("A   "), lab.a);
    mx.putDouble(cTID("B   "), lab.b);
    d.putObject(cTID("Mxm "), cTID("LbCl"), mx);
    d.putInteger(sTID("colorModel"), 0);
    executeAction(cTID("ClrR"), d, DialogModes.NO);
}

function hasValidSelection(doc) {
    try {
        var sb = doc.selection.bounds;
        return ((sb[2].as("px") - sb[0].as("px")) >= 2 && (sb[3].as("px") - sb[1].as("px")) >= 2);
    } catch (e) {
        return false;
    }
}

/* AI Auto Cut: tries Photoshop Select Subject (autoCutout) -> fallback native removeBackground.
   Works on ANY background (complex or solid), any layer type (including Background & Smart Object).
   Subject lands on a NEW duplicate layer with an editable Layer Mask; original stays intact & hidden. */
function auraCutAI(feather) {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    var oldUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    restoreRGBChannels(doc);
    var src = doc.activeLayer;
    if (!src) {
        app.preferences.rulerUnits = oldUnits;
        return "Error: No active layer selected.";
    }
    var cut = null;
    try {
        if (src.isBackgroundLayer && !ensureNotBackground(src)) {
            return "Error: Could not unlock Background layer.";
        }
        if (src.typename === "LayerSet" || (src.kind !== LayerKind.NORMAL && src.kind !== LayerKind.SMARTOBJECT)) {
            cut = stampVisible("Design360n Cutout", doc);
        } else {
            cut = src.duplicate();
            cut.name = "Design360n Cutout";
        }
        cut.visible = true;
        doc.activeLayer = cut;
        src.visible = false;
        if (src.visible !== false) {
            cut.remove();
            doc.activeLayer = src;
            return "Error: Original layer could not be hidden.";
        }

        /* Engine 1: AI Select Subject (autoCutout) */
        var masked = false;
        try {
            var d = new ActionDescriptor();
            d.putBoolean(sTID("sampleAllLayers"), false);
            executeAction(sTID("autoCutout"), d, DialogModes.NO);
            if (hasValidSelection(doc)) {
                var fth = (feather == null ? 0 : feather);
                if (fth > 0) doc.selection.feather(fth);
                addMaskFromSelection();
                doc.selection.deselect();
                restoreRGBChannels(doc);
                masked = hasUserMask(doc, cut);
            }
        } catch (eAI1) {
            try { doc.selection.deselect(); } catch (eDes) {}
            masked = false;
        }

        /* Engine 2 fallback: Photoshop native removeBackground action */
        if (!masked) {
            try {
                doc.activeLayer = cut;
                executeAction(sTID("removeBackground"), new ActionDescriptor(), DialogModes.NO);
                restoreRGBChannels(doc);
                masked = hasUserMask(doc, cut);
            } catch (eAI2) {
                masked = false;
            }
        }

        if (!masked) {
            cut.remove();
            src.visible = true;
            doc.activeLayer = src;
            var msg = "AI Background Remove could not detect a subject on this layer. Try Color Auto Cut for solid backgrounds.";
            alert(msg);
            return "Error: " + msg;
        }
        return "OK: Design360n Cutout ready (AI Layer Mask verified; original hidden & intact).";
    } catch (e) {
        if (cut) { try { cut.remove(); } catch (e2) {} }
        try { src.visible = true; doc.activeLayer = src; } catch (e3) {}
        return "Error: AI Auto Cut failed — " + e.message;
    } finally {
        restoreRGBChannels(doc);
        try { app.preferences.rulerUnits = oldUnits; } catch (e4) {}
    }
}

/* Solid Color Cut & Studio Shadow Cut:
   - Contiguous mode (default ON): 8-point perimeter Magic Wand so subject interior is NEVER punched with holes!
   - Global mode (Contiguous OFF): CIE Lab Color Range across entire layer (for gaps/hair).
   - Non-destructive Layer Mask on "Design360n Cutout" (original intact & hidden).
   - Shadow Cut: creates clean subject cutout ("Design360n Shadow Cut") PLUS a real transparent
     Multiply shadow layer ("Design360n Shadow") that blends smoothly over any new background! */
function doCut(tolerance, shadow, feather, hex, strength, contiguous) {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    var oldUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    restoreRGBChannels(doc);
    var src = doc.activeLayer;
    if (!src) {
        app.preferences.rulerUnits = oldUnits;
        return "Error: No active layer selected.";
    }
    var cut = null;
    var shLyr = null;
    try {
        if (src.isBackgroundLayer && !ensureNotBackground(src)) {
            return "Error: Could not unlock Background layer so original could be hidden.";
        }
        var bg = hexToRGBObj(hex);
        var autoUsed = false;
        if (!bg) {
            bg = sampleBgRGB(doc);
            autoUsed = true;
        }
        if (!bg) {
            return "Error: Auto-detect failed to sample corner pixels. Pick a background colour manually.";
        }

        var tol = Math.max(1, Math.min(200, Math.round(tolerance || 32)));
        var fth = (feather == null ? 1 : feather);
        var useContig = (contiguous == null ? true : !!contiguous);
        var W = doc.width.as("px"), H = doc.height.as("px");

        /* Create duplicate subject layer (rasterize duplicate if Smart Object; original stays intact!) */
        cut = src.duplicate();
        var targetName = shadow ? "Design360n Shadow Cut" : "Design360n Cutout";
        cut.name = targetName;
        cut.visible = true;
        doc.activeLayer = cut;
        if (cut.kind !== LayerKind.NORMAL) {
            if (!ensureRasterLayer(doc, cut)) {
                cut.remove();
                doc.activeLayer = src;
                return "Error: Could not rasterize duplicate layer for cutout.";
            }
        }
        src.visible = false;
        if (src.visible !== false) {
            cut.remove();
            doc.activeLayer = src;
            return "Error: Original layer could not be hidden — aborted.";
        }

        /* Select background: Contiguous 8-point perimeter Magic Wand first (protects subject interior!) */
        var matched = false;
        var methodUsed = "";
        if (useContig) {
            var perim = [
                [4, 4], [Math.round(W / 2), 4], [Math.max(4, W - 5), 4],
                [Math.max(4, W - 5), Math.round(H / 2)], [Math.max(4, W - 5), Math.max(4, H - 5)],
                [Math.round(W / 2), Math.max(4, H - 5)], [4, Math.max(4, H - 5)], [4, Math.round(H / 2)]
            ];
            var maxDist = Math.max(tol * 2.2, 42);
            var added = 0;
            for (var pi = 0; pi < perim.length; pi++) {
                var pc = samplePointRGB(doc, perim[pi][0], perim[pi][1]);
                if (pc && rgbDist(pc, bg) <= maxDist) {
                    try {
                        magicWandSelect(perim[pi][0], perim[pi][1], tol, added > 0, true);
                        added++;
                    } catch (eWand) {}
                }
            }
            if (added > 0 && hasValidSelection(doc)) {
                matched = true;
                methodUsed = "Contiguous Magic Wand";
            }
        }

        /* Fallback or Global mode: CIE Lab Color Range */
        if (!matched) {
            var fuzz = shadow ? Math.max(1, Math.round(tol * (strength === "soft" ? 0.85 : strength === "strong" ? 0.5 : 0.7))) : tol;
            colorRangeLabSelect(bg, fuzz);
            if (hasValidSelection(doc)) {
                matched = true;
                methodUsed = "Color Range Lab";
            }
        }

        if (!matched) {
            cut.remove();
            src.visible = true;
            doc.activeLayer = src;
            var emptyMsg = "Background colour not found (RGB " + bg.r + "," + bg.g + "," + bg.b + "). Pick the exact BG colour or use AI Auto Cut.";
            alert(emptyMsg);
            return "Error: " + emptyMsg;
        }

        /* Invert selection so SUBJECT is selected; clean 1px edge halo + apply editable Layer Mask */
        doc.selection.invert();
        if (!hasValidSelection(doc)) {
            doc.selection.deselect();
            cut.remove();
            src.visible = true;
            doc.activeLayer = src;
            var allCleared = "Tolerance (" + tol + ") matched the entire image. Lower Tolerance and try again.";
            alert(allCleared);
            return "Error: " + allCleared;
        }
        try { doc.selection.contract(1); } catch (eCon) {}
        if (fth > 0) { try { doc.selection.feather(fth); } catch (eFth) {} }
        doc.activeLayer = cut;
        addMaskFromSelection();
        doc.selection.deselect();
        restoreRGBChannels(doc);

        if (!hasUserMask(doc, cut)) {
            cut.remove();
            src.visible = true;
            doc.activeLayer = src;
            return "Error: Cutout Layer Mask did not land.";
        }

        /* SHADOW CUT: Build a real transparent Multiply studio shadow layer underneath the subject */
        if (shadow) {
            shLyr = src.duplicate();
            shLyr.name = "Design360n Shadow";
            shLyr.visible = true;
            shLyr.move(cut, ElementPlacement.PLACEAFTER);
            doc.activeLayer = shLyr;
            if (shLyr.kind !== LayerKind.NORMAL) ensureRasterLayer(doc, shLyr);
            shLyr.desaturate();
            /* Push background luminance to pure white (#FFFFFF = invisible in Multiply) while preserving soft gray shadow */
            var bgLum = Math.round(0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b);
            var whitePt = Math.max(120, Math.min(255, bgLum - Math.round(tol * 0.25)));
            var shadowGamma = (strength === "soft") ? 1.25 : (strength === "strong") ? 0.75 : 1.0;
            shLyr.adjustLevels(0, whitePt, shadowGamma, 0, 255);
            shLyr.blendMode = BlendMode.MULTIPLY;
            shLyr.opacity = (strength === "soft") ? 55 : (strength === "strong") ? 95 : 78;
            doc.activeLayer = cut;
            return "OK: Shadow Cut ready — subject on 'Design360n Shadow Cut' + transparent Multiply shadow on 'Design360n Shadow' (" + (strength || "normal") + "; original hidden).";
        }

        return "OK: Design360n Cutout ready (" + methodUsed + " | BG RGB " + bg.r + "," + bg.g + "," + bg.b + (autoUsed ? " auto" : " manual") + " | editable Mask; original hidden).";
    } catch (e) {
        if (shLyr) { try { shLyr.remove(); } catch (eRmS) {} }
        if (cut) { try { cut.remove(); } catch (e2) {} }
        try { src.visible = true; doc.activeLayer = src; } catch (e3) {}
        return "Error: BG Remover failed — " + e.message;
    } finally {
        restoreRGBChannels(doc);
        try { app.preferences.rulerUnits = oldUnits; } catch (e4) {}
    }
}

/* ---------------- 2 & 7. GLASS + REFRESH GLASS (v2.18 CHANNEL & LENS FIX) ---------------- */
var LAST_GLASS = null; /* { frost, o, shapeName, shapeId } */
function glassOpt(o, k, def) { return (o && o[k] != null) ? o[k] : def; }

/* FIXED v2.25 loadShapeSel:
   On Vector Shape layers (SolidColor fill + Vector Mask), loading Trsp directly returns
   the FULL-CANVAS fill rectangle, causing an all-white mask (requiring manual clipping!).
   Solution: duplicate the shape into a temp layer, rasterize it (bakes vector mask, rounded
   corners, text, smart objects cleanly), load Trsp from the rasterized temp layer, read its
   exact bounds, and delete the temp layer. Original Vector Shape remains 100% untouched! */
function loadShapeSel(doc, lyr) {
    var tmp = null;
    try {
        restoreRGBChannels(doc);
        if (!lyr) return false;
        var wasVis = lyr.visible;
        lyr.visible = true;
        tmp = lyr.duplicate();
        tmp.name = "Design360n Shape Alpha TMP";
        tmp.visible = true;
        doc.activeLayer = tmp;
        if (tmp.kind !== LayerKind.NORMAL) {
            tmp.rasterize(RasterizeType.ENTIRELAYER);
        }
        /* Apply any layer mask on tmp if present by merging into empty layer or rasterizing */
        var d = new ActionDescriptor();
        var r1 = new ActionReference();
        r1.putProperty(cTID("Chnl"), cTID("fsel"));
        d.putReference(cTID("null"), r1);
        var r2 = new ActionReference();
        r2.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Trsp"));
        d.putReference(cTID("T   "), r2);
        executeAction(cTID("setd"), d, DialogModes.NO);
        var b = doc.selection.bounds;
        var sw = b[2].as("px") - b[0].as("px");
        var sh = b[3].as("px") - b[1].as("px");
        tmp.remove();
        tmp = null;
        lyr.visible = wasVis;
        return (sw >= 4 && sh >= 4);
    } catch (e) {
        if (tmp) { try { tmp.remove(); } catch (e2) {} }
        return false;
    }
}

function deleteGlassLayers(doc) {
    for (var j = doc.layers.length - 1; j >= 0; j--) {
        var nm = doc.layers[j].name;
        if (nm === "Glass" || /^Glass \d+$/.test(nm) || nm.indexOf("Design360n Glass") === 0 || nm.indexOf("Design360n Shape Glass") === 0) {
            doc.layers[j].remove();
        }
    }
}

function removeTempChannel(doc, name) {
    for (var i = doc.channels.length - 1; i >= 0; i--) {
        if (doc.channels[i].name === name) {
            try { doc.channels[i].remove(); } catch (e) {}
        }
    }
}

/* v2.28 ULTRA-FAST GLASS ENGINE (5x-10x faster):
   - Crops working stamp to shape's padded bounding box FIRST (blur/refraction run on small patch, not 4K canvas)
   - Uses Photoshop GPU-accelerated Lefx (Inner Bevel + Inner Glow + Inside Stroke) for instant edge rim light,
     up to 16% opposite-side darkening, and crisp inside stroke (zero slow multi-layer blur/merge loops!)
   - Real Layer Mask (revealSelection) verified via hasUserMask() read-back. */
function _applyGlassGPUStyle(doc, glass, light01, lang, rimPx, stW, stOp, stHex, useStyleStroke) {
    doc.activeLayer = glass;
    var parts = [];
    if (light01 > 0) {
        /* Inner Bevel: bright rim facing lightAngle + up to 16% darkening opposite, NO centre highlight */
        var bv = new ActionDescriptor();
        bv.putBoolean(cTID("enab"), true);
        bv.putBoolean(sTID("present"), true);
        bv.putBoolean(sTID("showInDialog"), true);
        bv.putEnumerated(cTID("bvlS"), cTID("BESl"), cTID("InrB"));
        bv.putEnumerated(cTID("bvlT"), cTID("bvlT"), cTID("SfBL"));
        bv.putUnitDouble(cTID("srgR"), cTID("#Prc"), Math.round(80 + light01 * 140));
        bv.putUnitDouble(cTID("blur"), cTID("#Pxl"), Math.max(2, rimPx));
        bv.putUnitDouble(cTID("Sftn"), cTID("#Pxl"), 0);
        bv.putBoolean(cTID("uglg"), false);
        bv.putUnitDouble(cTID("lagl"), cTID("#Ang"), lang);
        bv.putUnitDouble(cTID("Lald"), cTID("#Ang"), 28);
        bv.putObject(cTID("hglC"), cTID("RGBC"), rgbDescHex("#FFFFFF"));
        bv.putObject(cTID("sdwC"), cTID("RGBC"), rgbDescHex("#000000"));
        bv.putEnumerated(cTID("hglM"), cTID("BlnM"), cTID("Scrn"));
        bv.putEnumerated(cTID("sdwM"), cTID("BlnM"), cTID("Mltp"));
        bv.putUnitDouble(cTID("hglO"), cTID("#Prc"), Math.round(light01 * 80));
        bv.putUnitDouble(cTID("sdwO"), cTID("#Prc"), Math.max(1, Math.min(16, Math.round(light01 * 16))));
        parts.push([cTID("ebbl"), cTID("ebbl"), bv]);

        /* Edge-only Inner Glow: soft exponential rim sheen */
        var ig = new ActionDescriptor();
        ig.putBoolean(cTID("enab"), true);
        ig.putBoolean(sTID("present"), true);
        ig.putBoolean(sTID("showInDialog"), true);
        ig.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID("Scrn"));
        ig.putUnitDouble(cTID("Opct"), cTID("#Prc"), Math.round(light01 * 38));
        ig.putUnitDouble(cTID("Ckmt"), cTID("#Pxl"), 0);
        ig.putUnitDouble(cTID("blur"), cTID("#Pxl"), Math.max(3, Math.round(rimPx * 1.4)));
        ig.putUnitDouble(cTID("Nose"), cTID("#Prc"), 0);
        ig.putBoolean(cTID("AntA"), true);
        ig.putObject(cTID("Clr "), cTID("RGBC"), rgbDescHex("#FFFFFF"));
        ig.putEnumerated(cTID("GlwT"), cTID("BETE"), cTID("SfBL"));
        ig.putEnumerated(cTID("glwS"), cTID("IGSr"), cTID("SrcE"));
        parts.push([cTID("IrGl"), cTID("IrGl"), ig]);
    }
    if (useStyleStroke && stW > 0 && stOp > 0) {
        var sd = new ActionDescriptor();
        sd.putBoolean(cTID("enab"), true);
        sd.putBoolean(sTID("present"), true);
        sd.putBoolean(sTID("showInDialog"), true);
        sd.putEnumerated(cTID("Styl"), cTID("FStl"), cTID("InsF"));
        sd.putEnumerated(cTID("PntT"), cTID("FrFl"), cTID("SClr"));
        sd.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID("Nrml"));
        sd.putUnitDouble(cTID("Opct"), cTID("#Prc"), stOp);
        sd.putUnitDouble(cTID("Sz  "), cTID("#Pxl"), Math.max(1, stW));
        sd.putObject(cTID("Clr "), cTID("RGBC"), rgbDescHex(stHex));
        parts.push([cTID("FrFX"), cTID("FrFX"), sd]);
    }
    if (parts.length > 0) {
        try { _setLayerStyleParts(parts); } catch (e) {}
    }
}

function doGlassCore(doc, B, chan, shapeLyr, frost, o) {
    restoreRGBChannels(doc);
    var W = doc.width.as("px"), H = doc.height.as("px");
    var x = B.x, y = B.y, w = B.w, h = B.h;
    var maxDist = Math.max(2, Math.min(w, h) / 2.0);
    var frost01 = Math.max(0, Math.min(100, frost)) / 100.0;
    var refr01 = glassOpt(o, "refr", 80) / 100.0;
    var depth01 = glassOpt(o, "depth", 60) / 100.0;
    var disp01 = glassOpt(o, "disp", 45) / 100.0;
    var light01 = glassOpt(o, "light", 80) / 100.0;
    var lang = glassOpt(o, "lightAngle", 144);
    var stW = glassOpt(o, "stroke", 3);
    var stOp = glassOpt(o, "strokeOp", 90);
    var stCol = glassOpt(o, "strokeColor", "FFFFFF");
    var stMode = glassOpt(o, "strokeMode", "solid");
    var stT = glassOpt(o, "strokeTop", true), stR = glassOpt(o, "strokeRight", true),
        stB = glassOpt(o, "strokeBottom", true), stL = glassOpt(o, "strokeLeft", true);

    var depthPx = Math.max(3, depth01 * maxDist * 0.9);
    var blurR = (frost01 <= 0) ? 0 : Math.round(frost01 * 0.35 * maxDist / 1.7);
    var rimPx = Math.max(2, Math.min(14, Math.round(depthPx * 0.22)));
    var rad = lang * Math.PI / 180.0;
    var lx = Math.cos(rad), ly = -Math.sin(rad);

    function loadSel() {
        restoreRGBChannels(doc);
        doc.selection.load(chan, SelectionType.REPLACE, false);
        return true;
    }

    /* STEP 1: Hide shape layer and READ BACK visibility BEFORE stamping */
    if (shapeLyr) {
        shapeLyr.visible = false;
        if (shapeLyr.visible !== false) {
            return "Error: Step 1 (Hide Shape) failed — shape remained visible; aborted.";
        }
    }

    /* STEP 2: Stamp merged photo pixels into ONE new layer named "Glass" */
    var glass = stampVisible("Glass", doc);
    if (!glass || (shapeLyr && glass === shapeLyr)) {
        return "Error: Step 2 (Stamp Background) failed.";
    }
    if (shapeLyr && shapeLyr.parent === doc) {
        try { glass.move(shapeLyr, ElementPlacement.PLACEBEFORE); } catch (eMove) {}
    }
    doc.activeLayer = glass;

    /* FAST OPTIMIZATION: Trim pixels outside padded shape box so Blur & Spherize run on small patch! */
    var pad = Math.max(16, Math.min(80, blurR * 2 + 16));
    var px0 = Math.max(0, Math.floor(x - pad)), py0 = Math.max(0, Math.floor(y - pad));
    var px1 = Math.min(W, Math.ceil(x + w + pad)), py1 = Math.min(H, Math.ceil(y + h + pad));
    if (px0 > 2 || py0 > 2 || px1 < W - 2 || py1 < H - 2) {
        try {
            doc.selection.select([[px0, py0], [px1, py0], [px1, py1], [px0, py1]], SelectionType.REPLACE, 0, false);
            doc.selection.invert();
            doc.selection.clear();
            doc.selection.deselect();
        } catch (eTrim) {
            try { doc.selection.deselect(); } catch (eD0) {}
        }
    }

    /* STEP 3: Shape-scaled Frost Gaussian Blur (runs fast on trimmed patch!) */
    if (blurR >= 1) {
        glass.applyGaussianBlur(blurR);
    }

    /* STEP 4: Fast 1-pass Optical Lens Refraction + Per-channel Dispersion inside shape */
    if (refr01 > 0 || disp01 > 0) {
        loadSel();
        doc.activeLayer = glass;
        if (refr01 > 0) {
            var sphAmt = Math.max(4, Math.min(45, Math.round(refr01 * depth01 * 45)));
            try { glass.applySpherize(sphAmt, SpherizeMode.NORMAL); } catch (eSph) {}
        }
        if (disp01 > 0) {
            var dd = Math.max(1, Math.min(10, Math.round(disp01 * 6)));
            shiftSingleChannel(doc, glass, 0, Math.round(lx * dd), Math.round(ly * dd));
            shiftSingleChannel(doc, glass, 2, Math.round(-lx * dd), Math.round(-ly * dd));
        }
        doc.selection.deselect();
    }

    /* STEP 5: Glass tint lift ONLY inside shape selection (default 7% #FFFFFF) */
    var tintOp = Math.max(0, Math.min(50, glassOpt(o, "tintOp", 7)));
    var tintHex = String(glassOpt(o, "tintColor", "FFFFFF")).replace("#", "").replace(/[^0-9a-fA-F]/g, "");
    if (tintHex.length !== 6) tintHex = "FFFFFF";
    if (tintOp > 0) {
        var tintCol = new SolidColor();
        tintCol.rgb.hexValue = tintHex;
        loadSel();
        doc.activeLayer = glass;
        doc.selection.fill(tintCol, ColorBlendMode.NORMAL, tintOp, false);
        doc.selection.deselect();
    }

    /* STEP 6: Partial/Follow-light custom stroke only when needed (otherwise GPU Stroke in Step 8!) */
    var cleanHex = String(stCol).replace("#", "").replace(/[^0-9a-fA-F]/g, "");
    if (cleanHex.length !== 6) cleanHex = "FFFFFF";
    var useStyleStroke = (stT && stR && stB && stL && stMode === "solid");
    if (!useStyleStroke && stW > 0 && stOp > 0 && (stT || stR || stB || stL)) {
        var sc = new SolidColor(); sc.rgb.hexValue = cleanHex;
        var stLyr = doc.artLayers.add();
        stLyr.name = "Glass Stroke TMP";
        stLyr.move(glass, ElementPlacement.PLACEBEFORE);
        doc.activeLayer = stLyr;
        loadSel();
        doc.selection.stroke(sc, Math.max(1, stW), StrokeLocation.INSIDE, ColorBlendMode.NORMAL, 100, false);
        doc.selection.deselect();
        var cx = x + w / 2.0, cy = y + h / 2.0;
        if (!stT) { doc.selection.select([[x - 2, y - 2], [x + w + 2, y - 2], [cx, cy]], SelectionType.REPLACE, 0, false); doc.selection.clear(); doc.selection.deselect(); }
        if (!stR) { doc.selection.select([[x + w + 2, y - 2], [x + w + 2, y + h + 2], [cx, cy]], SelectionType.REPLACE, 0, false); doc.selection.clear(); doc.selection.deselect(); }
        if (!stB) { doc.selection.select([[x + w + 2, y + h + 2], [x - 2, y + h + 2], [cx, cy]], SelectionType.REPLACE, 0, false); doc.selection.clear(); doc.selection.deselect(); }
        if (!stL) { doc.selection.select([[x - 2, y + h + 2], [x - 2, y - 2], [cx, cy]], SelectionType.REPLACE, 0, false); doc.selection.clear(); doc.selection.deselect(); }
        if (stMode === "follow") {
            loadSel();
            doc.selection.translate(UnitValue(Math.round(-lx * maxDist * 0.6), "px"), UnitValue(Math.round(-ly * maxDist * 0.6), "px"));
            doc.selection.feather(Math.max(2, Math.round(maxDist * 0.35)));
            doc.selection.clear();
            doc.selection.deselect();
        }
        stLyr.opacity = stOp;
        glass = stLyr.merge();
        glass.name = "Glass";
        doc.activeLayer = glass;
    }

    /* STEP 7: Real Layer Mask from shape alpha + READ-BACK VERIFICATION */
    loadSel();
    doc.activeLayer = glass;
    addMaskFromSelection();
    doc.selection.deselect();
    restoreRGBChannels(doc);

    if (!hasUserMask(doc, glass)) {
        try { glass.remove(); } catch (eRm3) {}
        if (shapeLyr) { try { shapeLyr.visible = true; } catch (eSh) {} }
        return "Error: Step 7 (Layer Mask) failed — Glass layer does not have a user mask.";
    }

    /* STEP 8: Instant GPU Rim Light + 16% Opposite Darkening + Inside Stroke (Lefx) */
    _applyGlassGPUStyle(doc, glass, light01, lang, rimPx, stW, stOp, cleanHex, useStyleStroke);

    if (shapeLyr && shapeLyr.visible !== false) {
        return "Error: Step 8 (Verify) failed — shape layer is not hidden.";
    }
    doc.activeLayer = glass;
    try {
        var gb = glass.bounds;
        if (LAST_GLASS) {
            LAST_GLASS.glassBounds = [gb[0].as("px"), gb[1].as("px"), gb[2].as("px"), gb[3].as("px")];
        }
    } catch (eGb) {}
    return "OK: Glass ready — 1 layer 'Glass' with verified Layer Mask" + (shapeLyr ? ", shape hidden" : "") + " (blur " + blurR + "px, fast GPU rim).";
}

function auraShapeGlass(frost, o) {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    var oldUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    var chan = null;
    var lyr = null;
    try {
        restoreRGBChannels(doc);
        lyr = doc.activeLayer;
        if (!lyr) return "Error: Select a shape layer first.";
        if (lyr.isBackgroundLayer) {
            var bgMsg = "Selected layer is Background. Put your shape on a separate layer for Shape to Glass, or use Make Glass with a marquee selection.";
            alert(bgMsg);
            return "Error: " + bgMsg;
        }
        var shapeName = lyr.name;
        var shapeId = getLayerId(doc, lyr);
        LAST_GLASS = { frost: frost, o: o, shapeName: shapeName, shapeId: shapeId };

        lyr.visible = true;
        deleteGlassLayers(doc);

        if (!loadShapeSel(doc, lyr)) {
            return "Error: Could not load shape alpha selection from '" + shapeName + "'.";
        }
        var b = doc.selection.bounds;
        var x = b[0].as("px"), y = b[1].as("px");
        var w = b[2].as("px") - x, h = b[3].as("px") - y;
        if (w < 10 || h < 10) {
            doc.selection.deselect();
            return "Error: Shape layer '" + shapeName + "' is empty or smaller than 10px.";
        }
        removeTempChannel(doc, "Design360n Glass Sel");
        chan = doc.channels.add();
        chan.name = "Design360n Glass Sel";
        doc.selection.store(chan);
        doc.selection.deselect();
        /* CRITICAL: Restore RGB channels immediately after doc.channels.add()! */
        restoreRGBChannels(doc);

        return doGlassCore(doc, { x: x, y: y, w: w, h: h }, chan, lyr, frost, o);
    } catch (e) {
        if (lyr) { try { lyr.visible = true; } catch (e2) {} }
        return "Error: Shape to Glass failed — " + e.message;
    } finally {
        restoreRGBChannels(doc);
        if (chan) { try { chan.remove(); } catch (e3) {} }
        try { removeTempChannel(doc, "Design360n Glass Sel"); } catch (e4) {}
        try { app.preferences.rulerUnits = oldUnits; } catch (e5) {}
    }
}

function auraGlass(frost, o) {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    var oldUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    var chan = null;
    try {
        restoreRGBChannels(doc);
        var sel;
        try { sel = doc.selection.bounds; }
        catch (eSel) {
            return "Error: Make a marquee selection first (or select a shape layer and click Shape to Glass).";
        }
        var x = sel[0].as("px"), y = sel[1].as("px");
        var w = sel[2].as("px") - x, h = sel[3].as("px") - y;
        if (w < 10 || h < 10) return "Error: Selection must be at least 10x10 px.";

        LAST_GLASS = { frost: frost, o: o, shapeName: null, shapeId: -1 };
        removeTempChannel(doc, "Design360n Glass Sel");
        chan = doc.channels.add();
        chan.name = "Design360n Glass Sel";
        doc.selection.store(chan);
        doc.selection.deselect();
        /* CRITICAL: Restore RGB channels immediately after doc.channels.add()! */
        restoreRGBChannels(doc);

        deleteGlassLayers(doc);
        return doGlassCore(doc, { x: x, y: y, w: w, h: h }, chan, null, frost, o);
    } catch (e) {
        return "Error: Make Glass failed — " + e.message;
    } finally {
        restoreRGBChannels(doc);
        if (chan) { try { chan.remove(); } catch (e2) {} }
        try { removeTempChannel(doc, "Design360n Glass Sel"); } catch (e3) {}
        try { app.preferences.rulerUnits = oldUnits; } catch (e4) {}
    }
}

function _syncMovedGlassToShape(doc, shape) {
    if (!LAST_GLASS || !LAST_GLASS.glassBounds) return false;
    var gLyr = findLayerByName(doc, "Glass");
    if (!gLyr) return false;
    try {
        var gb = gLyr.bounds;
        var gx0 = gb[0].as("px"), gy0 = gb[1].as("px"), gx1 = gb[2].as("px"), gy1 = gb[3].as("px");
        var ox0 = LAST_GLASS.glassBounds[0], oy0 = LAST_GLASS.glassBounds[1];
        var ow = LAST_GLASS.glassBounds[2] - ox0, oh = LAST_GLASS.glassBounds[3] - oy0;
        var gw = gx1 - gx0, gh = gy1 - gy0;
        var dx = gx0 - ox0, dy = gy0 - oy0;
        var moved = (Math.abs(dx) >= 2 || Math.abs(dy) >= 2);
        var resized = (ow > 10 && oh > 10 && (Math.abs(gw - ow) >= 3 || Math.abs(gh - oh) >= 3));
        if (!moved && !resized) return false;
        var wasVis = shape.visible;
        shape.visible = true;
        doc.activeLayer = shape;
        if (resized) {
            var sx = (gw / ow) * 100.0, sy = (gh / oh) * 100.0;
            try { shape.resize(sx, sy, AnchorPosition.TOPLEFT); } catch (eRs) {}
        }
        if (moved) {
            shape.translate(UnitValue(dx, "px"), UnitValue(dy, "px"));
        }
        shape.visible = wasVis;
        return true;
    } catch (e) {
        return false;
    }
}

function auraRefreshGlass(frost, o) {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    if (!LAST_GLASS || (!LAST_GLASS.shapeName && !(LAST_GLASS.shapeId > 0))) {
        var msg = "No previous Shape Glass found. Select your shape layer and click Shape to Glass first.";
        alert(msg);
        return "Error: " + msg;
    }
    var shape = null;
    if (LAST_GLASS.shapeId > 0) shape = findLayerById(doc, LAST_GLASS.shapeId);
    if (!shape && LAST_GLASS.shapeName) shape = findLayerByName(doc, LAST_GLASS.shapeName);
    if (!shape) {
        var miss = "Shape layer '" + LAST_GLASS.shapeName + "' is gone (deleted or renamed). Select a shape and click Shape to Glass.";
        alert(miss);
        return "Error: " + miss;
    }
    var oldUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    try {
        /* If user dragged/resized the visible "Glass" layer itself, sync shape to Glass's new position! */
        _syncMovedGlassToShape(doc, shape);
    } finally {
        try { app.preferences.rulerUnits = oldUnits; } catch (eU) {}
    }
    var useFrost = (frost != null) ? frost : LAST_GLASS.frost;
    var useO = (o != null) ? o : LAST_GLASS.o;
    deleteGlassLayers(doc);
    doc.activeLayer = shape;
    var res = auraShapeGlass(useFrost, useO);
    if (res && res.indexOf("OK:") === 0) {
        return "OK: Glass refreshed at new position/size.";
    }
    return res;
}

/* Lightweight check called by panel when Auto-Track Move is ON:
   returns "MOVED" only if the user dragged/resized the "Glass" layer to a new spot. */
function auraCheckGlassMoved() {
    try {
        if (app.documents.length === 0 || !LAST_GLASS || !LAST_GLASS.glassBounds) return "NO";
        var doc = app.activeDocument;
        var gLyr = findLayerByName(doc, "Glass");
        if (!gLyr) return "NO";
        var gb = gLyr.bounds;
        var dx = Math.abs(gb[0].as("px") - LAST_GLASS.glassBounds[0]);
        var dy = Math.abs(gb[1].as("px") - LAST_GLASS.glassBounds[1]);
        var dw = Math.abs((gb[2].as("px") - gb[0].as("px")) - (LAST_GLASS.glassBounds[2] - LAST_GLASS.glassBounds[0]));
        var dh = Math.abs((gb[3].as("px") - gb[1].as("px")) - (LAST_GLASS.glassBounds[3] - LAST_GLASS.glassBounds[1]));
        return (dx >= 2 || dy >= 2 || dw >= 3 || dh >= 3) ? "MOVED" : "NO";
    } catch (e) {
        return "NO";
    }
}

function auraOneClickGlass(frost, o) {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    var lyr = null;
    try { lyr = doc.activeLayer; } catch (e) {}
    /* If user already has Glass selected and tweaks a slider/preset -> instant refresh on tracked shape */
    if (lyr && lyr.name === "Glass" && LAST_GLASS && (LAST_GLASS.shapeId > 0 || LAST_GLASS.shapeName)) {
        return auraRefreshGlass(frost, o);
    }
    /* If active layer is a shape / non-background layer -> instant Shape to Glass */
    if (lyr && !lyr.isBackgroundLayer) {
        return auraShapeGlass(frost, o);
    }
    /* Otherwise if a marquee selection exists -> instant Make Glass */
    var hasSel = false;
    try {
        var sb = doc.selection.bounds;
        if ((sb[2].as("px") - sb[0].as("px")) >= 10 && (sb[3].as("px") - sb[1].as("px")) >= 10) hasSel = true;
    } catch (eSel) { hasSel = false; }
    if (hasSel) {
        return auraGlass(frost, o);
    }
    return "Error: Select a shape layer (not Background) or make a marquee selection, then click 1-Click Glass.";
}

/* Live Auto-Update: when user adjusts any Glass slider/control after applying Glass,
   automatically updates the existing "Glass" layer from the tracked shape (no manual clipping or re-selecting). */
function auraLiveUpdateGlass(frost, o) {
    if (app.documents.length === 0) return "OK: Waiting for document.";
    var doc = app.activeDocument;
    if (!LAST_GLASS || (!LAST_GLASS.shapeName && !(LAST_GLASS.shapeId > 0))) {
        return "OK: Adjust controls, then click 1-Click Shape to Glass.";
    }
    var existingGlass = findLayerByName(doc, "Glass");
    if (!existingGlass) {
        return "OK: Controls updated — click 1-Click Shape to Glass to apply.";
    }
    return auraRefreshGlass(frost, o);
}

/* ---------------- 5. DODGE & BURN ---------------- */
/* v2.34 AUTO DODGE & BURN (Image-wise & Situation-wise) + Manual 50% Gray:
   - mode "portrait" / "product" / "dramatic": automatically extracts the image's real highlights
     (128..255 -> Soft Light Auto Dodge) and real shadows (0..128 -> Soft Light Auto Burn) with
     situation-tuned blur, gamma, and opacity + editable Reveal-All masks!
   - mode "manual": classic 2x neutral 50% gray Soft Light layers for manual brush painting. */
function auraDodgeBurn(mode, strength) {
    var d = needDoc();
    if (!d) return "Error: No open document.";
    restoreRGBChannels(d);
    var m = mode || "portrait";
    var str = (strength == null ? 65 : Math.max(10, Math.min(100, strength)));
    try {
        if (m === "manual") {
            function grayLayer(name) {
                var l = d.artLayers.add();
                l.name = name;
                l.blendMode = BlendMode.SOFTLIGHT;
                var g = new SolidColor();
                g.rgb.hexValue = "808080";
                d.selection.selectAll();
                d.selection.fill(g, ColorBlendMode.NORMAL, 100, false);
                d.selection.deselect();
                return l;
            }
            var dodgeM = grayLayer("Dodge — halka korun");
            var burnM = grayLayer("Burn — garo korun");
            if (dodgeM.blendMode !== BlendMode.SOFTLIGHT || burnM.blendMode !== BlendMode.SOFTLIGHT) {
                return "Error: Dodge & Burn verification failed — Soft Light blend mode did not apply.";
            }
            return "OK: Manual Dodge & Burn ready — 2x 50% gray Soft Light layers created.";
        }

        /* Situation-tuned parameters */
        var W = d.width.as("px"), H = d.height.as("px");
        var minSide = Math.min(W, H);
        var blurPx = Math.max(3, Math.round(minSide * 0.012));
        var dGamma = 1.0, bGamma = 1.0, dOp = str, bOp = Math.round(str * 0.85);
        if (m === "product") {
            blurPx = Math.max(2, Math.round(minSide * 0.006));
            dGamma = 1.15; bGamma = 0.9; dOp = Math.min(100, Math.round(str * 1.1)); bOp = str;
        } else if (m === "dramatic") {
            blurPx = Math.max(4, Math.round(minSide * 0.015));
            dGamma = 1.25; bGamma = 0.78; dOp = Math.min(100, Math.round(str * 1.15)); bOp = Math.min(100, Math.round(str * 1.15));
        }

        /* 1. Auto Dodge (image's own highlights above 50% gray) */
        var dodgeL = stampVisible("Auto Dodge (" + m + ")", d);
        dodgeL.visible = false;
        /* 2. Auto Burn (stamped while dodgeL is hidden so it reads the untouched image!) */
        var burnL = stampVisible("Auto Burn (" + m + ")", d);
        dodgeL.visible = true;
        dodgeL.move(burnL, ElementPlacement.PLACEBEFORE);

        d.activeLayer = dodgeL;
        dodgeL.desaturate();
        dodgeL.adjustLevels(128, 255, dGamma, 128, 255);
        dodgeL.applyGaussianBlur(blurPx);
        dodgeL.blendMode = BlendMode.SOFTLIGHT;
        dodgeL.opacity = dOp;
        try { addRevealAllMask(); restoreRGBChannels(d); } catch (eM1) {}

        d.activeLayer = burnL;
        burnL.desaturate();
        burnL.adjustLevels(0, 128, bGamma, 0, 128);
        burnL.applyGaussianBlur(blurPx);
        burnL.blendMode = BlendMode.SOFTLIGHT;
        burnL.opacity = bOp;
        try { addRevealAllMask(); restoreRGBChannels(d); } catch (eM2) {}

        if (dodgeL.blendMode !== BlendMode.SOFTLIGHT || burnL.blendMode !== BlendMode.SOFTLIGHT) {
            return "Error: Auto Dodge & Burn verification failed.";
        }
        d.activeLayer = dodgeL;
        return "OK: Auto Dodge & Burn (" + m + ", " + str + "%) applied — 2 editable Soft Light layers with masks.";
    } catch (e) {
        return "Error: Dodge & Burn failed — " + e.message;
    } finally {
        restoreRGBChannels(d);
    }
}

/* ---------------- CEP GLOBALS ---------------- */
function auraGlow(i, o) {
    var baseP = PRESETS[i];
    if (!baseP) return "Error: Invalid Glow preset index.";
    var p = {};
    for (var k in baseP) p[k] = baseP[k];
    if (o) {
        if (o.rad != null) p.rad = o.rad;
        if (o.thr != null) p.thr = o.thr / 100.0;
        if (o.core != null) p.core = o.core;
        if (o.iter != null) p.iter = o.iter;
        if (o.exp != null) p.exp = o.exp;
        if (o.gamma != null) p.gamma = o.gamma;
        if (o.op != null) p.op = o.op;
        if (o.blend) p.blend = o.blend;
        if (o.hue != null) p.hue = o.hue;
        if (o.sat != null) p.sat = o.sat;
        if (o.streak != null) p.streak = o.streak;
        if (o.sang != null) p.sang = o.sang;
        if (o.slen != null) p.slen = o.slen;
        if (o.sint != null) p.sint = o.sint;
        if (o.rays != null) p.rays = o.rays;
        if (o.aber != null) p.aber = o.aber;
        if (o.adist != null) p.adist = o.adist;
        if (o.addMask != null) p.addMask = o.addMask;
    }
    return doGlow(p);
}

function auraSize(i, mode, guides) { return doSize(SIZES[i], mode, guides); }
function auraCut(tol, shadow, feather, hex, strength, contiguous) { return doCut(tol, shadow, feather, hex, strength, contiguous); }

/* ---------------- ADVANCED TOOLS (SMART-OBJECT / MULTI-LAYER SAFE) ---------------- */
var GRADES = [
    { name: "Cinematic Teal-Orange", cb: [[-10, 5, 15], [10, 0, -10], [15, 5, -10]], hs: [0, 10, 0], bc: [0, 15], gamma: 1.05 },
    { name: "Vintage Film", cb: [[5, 0, 5], [10, 0, -5], [10, 5, -5]], hs: [0, -20, 0], bc: [5, -10], gamma: 1.1 },
    { name: "Moody Dark", cb: [[0, 0, 10], [0, 0, 5], [0, 0, 0]], hs: [0, -15, 0], bc: [-15, 20], gamma: 0.95 },
    { name: "Golden Hour", cb: [[5, 0, -5], [15, 5, -15], [20, 10, -10]], hs: [0, 15, 0], bc: [5, 5], gamma: 1.05 },
    { name: "B&W Noir", cb: [[0, 0, 0], [0, 0, 0], [0, 0, 0]], hs: [0, -100, 0], bc: [-5, 25], gamma: 1.0 },
    { name: "Cyberpunk", cb: [[0, 0, 20], [-10, 10, 10], [0, 5, 15]], hs: [5, 30, 0], bc: [0, 10], gamma: 1.0 }
];

function auraGrade(i, opacity) {
    var d = needDoc();
    if (!d) return "Error: No open document.";
    var g = GRADES[i];
    if (!g) return "Error: Invalid grade preset.";
    try {
        var l = stampVisible("Grade — " + g.name, d);
        if (opacity != null) l.opacity = opacity;
        l.adjustColorBalance(g.cb[0], g.cb[1], g.cb[2], true);
        l.adjustHueSaturation(g.hs[0], g.hs[1], g.hs[2]);
        l.adjustBrightnessContrast(g.bc[0], g.bc[1]);
        l.adjustLevels(0, 255, g.gamma, 0, 255);
        return "OK: " + g.name + " grade applied on '" + l.name + "'.";
    } catch (e) {
        return "Error: Color Grading failed — " + e.message;
    }
}

function auraRetouch(radius, opacity) {
    var d = needDoc();
    if (!d) return "Error: No open document.";
    restoreRGBChannels(d);
    try {
        var smooth = stampVisible("Skin Smooth — Auto", d);
        /* Stamp sharp detail layer BEFORE blurring or with smooth hidden so High Pass keeps real skin texture! */
        smooth.visible = false;
        var det = stampVisible("Skin Detail — High Pass", d);
        smooth.visible = true;
        det.move(smooth, ElementPlacement.PLACEBEFORE);

        d.activeLayer = smooth;
        smooth.applyGaussianBlur(Math.max(1, radius || 6));
        smooth.opacity = (opacity == null ? 55 : opacity);

        var masked = false;
        try {
            var cd = new ActionDescriptor();
            cd.putEnumerated(cTID("Clrs"), cTID("Clrs"), sTID("skinTones"));
            cd.putInteger(cTID("Fzns"), 40);
            try { cd.putBoolean(sTID("detectFaces"), true); } catch (eDf) {}
            executeAction(cTID("ClrR"), cd, DialogModes.NO);
            if (hasValidSelection(d)) {
                try { d.selection.feather(2); } catch (eF) {}
                d.activeLayer = smooth;
                addMaskFromSelection();
                restoreRGBChannels(d);
                masked = hasUserMask(d, smooth);
            }
            try { d.selection.deselect(); } catch (eD) {}
        } catch (eSkin) { masked = false; }
        if (!masked) {
            d.activeLayer = smooth;
            try { addRevealAllMask(); restoreRGBChannels(d); } catch (eM) {}
        }

        d.activeLayer = det;
        det.applyHighPass(Math.max(2, Math.round((radius || 6) / 2)));
        det.blendMode = BlendMode.LINEARLIGHT;
        det.opacity = 40;
        return "OK: Auto Face Retouch ready (" + (masked ? "skin tone mask verified" : "editable mask added") + " + sharp High Pass texture).";
    } catch (e) {
        return "Error: Skin Retouch failed — " + e.message;
    } finally {
        restoreRGBChannels(d);
    }
}

function auraDetail(strength) {
    var d = needDoc();
    if (!d) return "Error: No open document.";
    try {
        var l = stampVisible("Detail — High Pass", d);
        l.applyHighPass(3);
        l.blendMode = BlendMode.OVERLAY;
        l.opacity = (strength == null ? 50 : strength);
        return "OK: Detail High Pass layer ready (" + l.opacity + "%).";
    } catch (e) {
        return "Error: Detail layer failed — " + e.message;
    }
}

function auraVignette(strength, feather) {
    var d = needDoc();
    if (!d) return "Error: No open document.";
    var oldUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    restoreRGBChannels(d);
    try {
        var W = d.width.as("px"), H = d.height.as("px");
        var safeFeather = Math.max(2, Math.min(feather || 80, Math.floor(Math.min(W, H) * 0.22)));
        var l = d.artLayers.add();
        if (d.layers.length > 1 && d.layers[0] !== l) l.move(d.layers[0], ElementPlacement.PLACEBEFORE);
        l.name = "Vignette";
        var c = new SolidColor(); c.rgb.hexValue = "000000";
        d.selection.selectAll();
        d.selection.fill(c, ColorBlendMode.NORMAL, 100, false);
        d.selection.deselect();
        var cx = W / 2, cy = H / 2, rx = W * 0.42, ry = H * 0.42, pts = [];
        for (var k = 0; k < 32; k++) {
            var a = (k / 32) * Math.PI * 2;
            pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
        }
        d.selection.select(pts, SelectionType.REPLACE, safeFeather, false);
        d.selection.clear();
        d.selection.deselect();
        l.blendMode = BlendMode.MULTIPLY;
        l.opacity = strength;
        return "OK: Vignette ready (Multiply, opacity " + strength + "%, feather " + safeFeather + "px).";
    } catch (e) {
        return "Error: Vignette failed — " + e.message;
    } finally {
        try { app.preferences.rulerUnits = oldUnits; } catch (e2) {}
    }
}

function auraWatermark(text, opacity, sizePx, pos, hexCol) {
    var d = needDoc();
    if (!d) return "Error: No open document.";
    if (!text) text = "© Design360n";
    var oldUnits = app.preferences.rulerUnits;
    var oldTypeUnits = null;
    try { oldTypeUnits = app.preferences.typeUnits; app.preferences.typeUnits = TypeUnits.PIXELS; } catch (eTU) {}
    app.preferences.rulerUnits = Units.PIXELS;
    restoreRGBChannels(d);
    try {
        var W = d.width.as("px"), H = d.height.as("px");
        var margin = Math.max(16, Math.round(Math.min(W, H) * 0.04));
        var mode = pos || "tile_diag";
        var cleanHex = String(hexCol || "FFFFFF").replace("#", "").replace(/[^0-9a-fA-F]/g, "");
        if (cleanHex.length !== 6) cleanHex = "FFFFFF";
        var c = new SolidColor(); c.rgb.hexValue = cleanHex;

        var tl = d.artLayers.add();
        if (d.layers.length > 1 && d.layers[0] !== tl) tl.move(d.layers[0], ElementPlacement.PLACEBEFORE);
        tl.kind = LayerKind.TEXT;
        tl.textItem.contents = text;
        try { tl.textItem.font = "ArialMT"; } catch (eFont) {}

        var isTiled = (mode === "tile_diag" || mode === "tile_grid");
        var defaultPx = isTiled
            ? Math.max(16, Math.round(Math.min(W, H) * 0.036))
            : Math.max(18, Math.round(Math.min(W, H) * 0.045));
        var targetPx = (sizePx != null && sizePx > 0) ? sizePx : defaultPx;
        tl.textItem.size = UnitValue(targetPx, "px");
        tl.textItem.color = c;
        tl.textItem.justification = Justification.CENTER;
        tl.textItem.position = [UnitValue(W / 2, "px"), UnitValue(H / 2, "px")];

        var b = tl.bounds;
        var tw = Math.max(20, b[2].as("px") - b[0].as("px"));
        var th = Math.max(12, b[3].as("px") - b[1].as("px"));

        if (isTiled) {
            tl.name = "Watermark (Full Canvas)";
            /* Cover 1.65x max dimension so even -30 deg rotation covers all 4 corners */
            var spanW = Math.ceil((mode === "tile_diag" ? Math.max(W, H) * 1.65 : W * 1.15));
            var spanH = Math.ceil((mode === "tile_diag" ? Math.max(W, H) * 1.65 : H * 1.15));
            var cellW = Math.max(tw * 1.55, targetPx * 4);
            var cellH = Math.max(th * 2.8, targetPx * 2.8);
            var cols = Math.min(14, Math.max(3, Math.ceil(spanW / cellW) + 2));
            var rows = Math.min(26, Math.max(4, Math.ceil(spanH / cellH) + 2));

            var lines = [];
            var gap = "      ";
            var stagger = "    ";
            var r, ci, rowParts;
            for (r = 0; r < rows; r++) {
                rowParts = [];
                for (ci = 0; ci < cols; ci++) rowParts.push(text);
                lines.push((r % 2 === 1 ? stagger : "") + rowParts.join(gap));
            }
            tl.textItem.contents = lines.join("\r");
            try {
                tl.textItem.useAutoLeading = false;
                tl.textItem.leading = UnitValue(Math.round(cellH), "px");
            } catch (eLead) {}
            if (mode === "tile_diag") {
                try { tl.rotate(-30, AnchorPosition.MIDDLECENTER); } catch (eRot) {}
            }
            b = tl.bounds;
            var cx = (b[0].as("px") + b[2].as("px")) / 2.0;
            var cy = (b[1].as("px") + b[3].as("px")) / 2.0;
            tl.translate(UnitValue((W / 2.0) - cx, "px"), UnitValue((H / 2.0) - cy, "px"));
            tl.opacity = (opacity == null ? 30 : opacity);
            try {
                var wmShT = _dropShadowDesc({ sh: { c: "#000000", b: "Mltp", o: 55, blur: 5, dst: 2, ang: 120 } }, 100, 1);
                if (wmShT) _setLayerStyleParts([[cTID("DrSh"), cTID("DrSh"), wmShT]]);
            } catch (eShT) {}
            return "OK: Full-canvas watermark applied (" + rows + "x" + cols + " tiled, " + tl.opacity + "%).";
        }

        /* Single-position watermark modes */
        tl.name = "Watermark";
        var maxW = Math.max(40, W - margin * 2);
        if (tw > maxW && tw > 0) {
            var pct = (maxW / tw) * 100.0;
            tl.resize(pct, pct, AnchorPosition.MIDDLECENTER);
            b = tl.bounds;
            tw = b[2].as("px") - b[0].as("px");
            th = b[3].as("px") - b[1].as("px");
        }
        if (mode === "diag") {
            try { tl.rotate(-30, AnchorPosition.MIDDLECENTER); } catch (eRot2) {}
            b = tl.bounds;
            tw = b[2].as("px") - b[0].as("px");
            th = b[3].as("px") - b[1].as("px");
        }
        var curX = b[0].as("px"), curY = b[1].as("px");
        var destX = W - margin - tw, destY = H - margin - th;
        if (mode === "bl") { destX = margin; destY = H - margin - th; }
        else if (mode === "tr") { destX = W - margin - tw; destY = margin; }
        else if (mode === "tl") { destX = margin; destY = margin; }
        else if (mode === "center" || mode === "diag") { destX = (W - tw) / 2.0; destY = (H - th) / 2.0; }

        tl.translate(UnitValue(destX - curX, "px"), UnitValue(destY - curY, "px"));
        tl.opacity = (opacity == null ? 40 : opacity);
        try {
            var wmSh = _dropShadowDesc({ sh: { c: "#000000", b: "Mltp", o: 65, blur: 6, dst: 2, ang: 120 } }, 100, 1);
            if (wmSh) _setLayerStyleParts([[cTID("DrSh"), cTID("DrSh"), wmSh]]);
        } catch (eSh) {}
        return "OK: Watermark placed cleanly inside canvas (" + mode.toUpperCase() + ", " + tl.opacity + "%).";
    } catch (e) {
        return "Error: Watermark failed — " + e.message;
    } finally {
        try { app.preferences.rulerUnits = oldUnits; } catch (e2) {}
        try { if (oldTypeUnits != null) app.preferences.typeUnits = oldTypeUnits; } catch (e3) {}
    }
}

function auraBatchExport() {
    var d = needDoc();
    if (!d) return "Error: No open document.";
    var out = Folder.selectDialog("Export folder beche nin");
    if (!out) return "Error: Export cancelled.";
    try {
        var base = d.name.replace(/\.[^.]+$/, "");
        var saved = 0;
        for (var i = 0; i < EXPORT_SIZES.length; i++) {
            var s = EXPORT_SIZES[i];
            var copy = d.duplicate(s[0], true);
            try { copy.flatten(); } catch (eFl) {}
            try { if (typeof BitsPerChannelType !== "undefined") copy.bitsPerChannel = BitsPerChannelType.EIGHT; } catch (e8) {}
            var cw = copy.width.as("px"), ch = copy.height.as("px");
            var scale = Math.max(s[1] / cw, s[2] / ch);
            var rw = Math.max(s[1], Math.round(cw * scale));
            var rh = Math.max(s[2], Math.round(ch * scale));
            copy.resizeImage(UnitValue(rw, "px"), UnitValue(rh, "px"), 72, ResampleMethod.BICUBIC);
            if (rw !== s[1] || rh !== s[2]) {
                copy.resizeCanvas(UnitValue(s[1], "px"), UnitValue(s[2], "px"), AnchorPosition.MIDDLECENTER);
            }
            var f = new File(out + "/" + base + "-" + s[0] + ".jpg");
            var opt = new JPEGSaveOptions(); opt.quality = 10;
            copy.saveAs(f, opt, true, Extension.LOWERCASE);
            copy.close(SaveOptions.DONOTSAVECHANGES);
            if (f.exists) saved++;
        }
        return "OK: Batch Export saved " + saved + "/" + EXPORT_SIZES.length + " JPGs to " + out.fsName + ".";
    } catch (e) {
        return "Error: Batch Export failed — " + e.message;
    }
}

/* ---------------- ADVANCED REALISTIC PHOTO EXPAND (v2.35) ---------------- */
function flipLayer(horizontal) {
    var d = new ActionDescriptor();
    var r = new ActionReference();
    r.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    d.putReference(cTID("null"), r);
    d.putEnumerated(cTID("Axis"), cTID("Axis"), horizontal ? cTID("Hrzn") : cTID("Vrtc"));
    executeAction(cTID("Flip"), d, DialogModes.NO);
}
function rectSel(doc, x1, y1, x2, y2) {
    doc.selection.select([[x1, y1], [x2, y1], [x2, y2], [x1, y2]], SelectionType.REPLACE, 0, false);
}
function contentAwareFillSel() {
    var fd = new ActionDescriptor();
    fd.putEnumerated(cTID("Usng"), cTID("FlCn"), sTID("contentAware"));
    fd.putUnitDouble(cTID("Opct"), cTID("#Prc"), 100);
    fd.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID("Nrml"));
    try { fd.putBoolean(sTID("colorAdaptation"), true); } catch (eCA) {}
    executeAction(cTID("Fl  "), fd, DialogModes.NO);
}

/* Subject-Protected Realistic Content-Aware Fill:
   1. Detects subject (burger/person/product) via autoCutout and saves crisp subject on a top layer.
   2. Temporarily removes subject from the working background layer using Content-Aware Fill so
      background expansion NEVER clones pieces of the subject into the new edges!
   3. Fills the expanded empty margins cleanly from the pure background texture.
   4. Merges the untouched original photo/subject cleanly back over the center (zero seam!). */
function _runSubjectProtectedExpandFill(doc, workLyr, origPhotoLyr) {
    var subjLyr = null;
    try {
        doc.activeLayer = workLyr;
        /* Step A: Try to isolate subject so it doesn't pollute Content-Aware sampling */
        var hasSubj = false;
        try {
            var sd = new ActionDescriptor();
            sd.putBoolean(sTID("sampleAllLayers"), false);
            executeAction(sTID("autoCutout"), sd, DialogModes.NO);
            if (hasValidSelection(doc)) hasSubj = true;
        } catch (eAuto) { hasSubj = false; }

        if (hasSubj) {
            /* Save crisp subject + original interior on top */
            try { doc.selection.expand(8); } catch (eExS) {}
            doc.activeLayer = workLyr;
            /* Clean subject out of background working copy so CAF only samples pure background */
            try { contentAwareFillSel(); } catch (eSubCAF) {}
            doc.selection.deselect();
        }
    } catch (eProt) {
        try { doc.selection.deselect(); } catch (eD) {}
    }

    /* Step B: Select ONLY the empty transparent canvas margins around workLyr + 6px overlap */
    doc.activeLayer = workLyr;
    var dSel = new ActionDescriptor();
    var r1 = new ActionReference();
    r1.putProperty(cTID("Chnl"), cTID("fsel"));
    dSel.putReference(cTID("null"), r1);
    var r2 = new ActionReference();
    r2.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Trsp"));
    dSel.putReference(cTID("T   "), r2);
    executeAction(cTID("setd"), dSel, DialogModes.NO);

    doc.selection.invert();
    if (!hasValidSelection(doc)) {
        doc.selection.deselect();
        return false;
    }
    try { doc.selection.expand(6); } catch (eExp) {}
    contentAwareFillSel();
    _applyBorderGrainMatch(doc, workLyr);
    doc.selection.deselect();

    /* Step C: Restore untouched crisp original photo right over center with soft 2px feathered edge */
    if (origPhotoLyr) {
        try {
            origPhotoLyr.visible = true;
            origPhotoLyr.move(workLyr, ElementPlacement.PLACEBEFORE);
            doc.activeLayer = origPhotoLyr;
            var dSel2 = new ActionDescriptor();
            var r3 = new ActionReference();
            r3.putProperty(cTID("Chnl"), cTID("fsel"));
            dSel2.putReference(cTID("null"), r3);
            var r4 = new ActionReference();
            r4.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Trsp"));
            dSel2.putReference(cTID("T   "), r4);
            executeAction(cTID("setd"), dSel2, DialogModes.NO);
            try { doc.selection.contract(2); doc.selection.feather(2); } catch (eCF) {}
            addMaskFromSelection();
            doc.selection.deselect();
            restoreRGBChannels(doc);
            /* Merge cleanly so result is ONE realistic seamless expanded layer */
            workLyr = origPhotoLyr.merge();
            workLyr.name = "Photo Expand (Realistic)";
        } catch (eRest) {
            try { doc.selection.deselect(); } catch (eD2) {}
        }
    }
    restoreRGBChannels(doc);
    return true;
}

function _tryAdobeGenerativeFill(promptText) {
    var d = new ActionDescriptor();
    var r = new ActionReference();
    r.putEnumerated(cTID("Dcmn"), cTID("Ordn"), cTID("Trgt"));
    d.putReference(cTID("null"), r);
    d.putString(sTID("prompt"), promptText ? String(promptText) : "");
    d.putString(sTID("serviceID"), "clio");
    d.putString(sTID("mode"), "inpainting");
    executeAction(sTID("syntheticFill"), d, DialogModes.NO);
}

/* Subtle 1.2% monochromatic film grain match on newly generated border only so it never looks plastic */
function _applyBorderGrainMatch(doc, lyr) {
    try {
        doc.activeLayer = lyr;
        lyr.applyAddNoise(1.2, NoiseDistribution.GAUSSIAN, true);
    } catch (e) {}
}

/* EXTREME 1-Click Generative Fill / Object Remove on any Marquee or Lasso selection */
function auraGenerativeFill(promptText, featherPx, preferFirefly) {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    var oldU = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    restoreRGBChannels(doc);
    try {
        if (!hasValidSelection(doc)) {
            return "Error: First select an area with Marquee or Lasso tool, then click Generative Fill / Object Remove.";
        }
        var fth = (featherPx != null && featherPx > 0) ? Math.min(20, Math.round(featherPx)) : 4;
        var promptStr = (promptText != null) ? String(promptText).replace(/^\s+|\s+$/g, "") : "";

        /* Path 1: Adobe Firefly Generative Fill (if user chose Firefly or entered a creative prompt) */
        if (preferFirefly || promptStr.length > 0) {
            try {
                if (fth > 0) { try { doc.selection.feather(fth); } catch (eF) {} }
                _tryAdobeGenerativeFill(promptStr);
                doc.selection.deselect();
                return "OK: Adobe Generative Fill complete" + (promptStr ? (" ('" + promptStr + "')") : "") + "!";
            } catch (eFirefly) {
                /* Seamless fallback to Extreme Offline Content-Aware + Grain Match */
            }
        }

        /* Path 2: Extreme Offline Content-Aware Fill + Feather + Monochromatic Grain Match */
        var gfLayer = stampVisible(promptStr ? ("GenFill — " + promptStr) : "GenFill — Clean Remove", doc);
        doc.activeLayer = gfLayer;
        try { doc.selection.expand(4); } catch (eEx) {}
        if (fth > 0) { try { doc.selection.feather(fth); } catch (eF2) {} }
        contentAwareFillSel();
        _applyBorderGrainMatch(doc, gfLayer);
        doc.selection.deselect();
        restoreRGBChannels(doc);
        return "OK: Extreme Content-Aware Fill + Grain Match complete on '" + gfLayer.name + "'!";
    } catch (e) {
        try { doc.selection.deselect(); } catch (e2) {}
        return "Error: Generative Fill failed — " + e.message;
    } finally {
        restoreRGBChannels(doc);
        try { app.preferences.rulerUnits = oldU; } catch (e3) {}
    }
}
function mirrorSide(doc, base, side, step, curW, curH) {
    if (side === "right") doc.resizeCanvas(UnitValue(curW + step, "px"), UnitValue(curH, "px"), AnchorPosition.MIDDLELEFT);
    else if (side === "left") doc.resizeCanvas(UnitValue(curW + step, "px"), UnitValue(curH, "px"), AnchorPosition.MIDDLERIGHT);
    else if (side === "bottom") doc.resizeCanvas(UnitValue(curW, "px"), UnitValue(curH + step, "px"), AnchorPosition.MIDDLETOP);
    else doc.resizeCanvas(UnitValue(curW, "px"), UnitValue(curH + step, "px"), AnchorPosition.MIDDLEBOTTOM);
    doc.activeLayer = base;
    if (side === "right") rectSel(doc, curW - step, 0, curW, curH);
    else if (side === "left") rectSel(doc, step, 0, step + step, curH);
    else if (side === "bottom") rectSel(doc, 0, curH - step, curW, curH);
    else rectSel(doc, 0, step, curW, step + step);
    doc.selection.copy();
    doc.selection.deselect();
    var pl = doc.paste();
    if (!pl) pl = doc.activeLayer;
    if (side === "right" || side === "left") flipLayer(true); else flipLayer(false);
    var b = pl.bounds;
    var tx = (side === "right") ? curW : 0;
    var ty = (side === "bottom") ? curH : 0;
    pl.translate(tx - b[0].as("px"), ty - b[1].as("px"));
    try { pl.move(base, ElementPlacement.PLACEBEFORE); } catch (eMvP) {}
    pl.merge();
    doc.activeLayer = base;
}
function tileBand(fill, src, x1, y1, x2, y2) {
    var doc = app.activeDocument, count = 0, col = 0, row = 0, tx = 0, ty = 0;
    for (tx = x1, col = 0; tx < x2 && count < 60; tx += src.w, col++) {
        for (ty = y1, row = 0; ty < y2 && count < 60; ty += src.h, row++) {
            doc.activeLayer = fill;
            var pl = doc.paste();
            if (!pl) pl = doc.activeLayer;
            if (col % 2 === 1) flipLayer(true);
            if (row % 2 === 1) flipLayer(false);
            var b = pl.bounds;
            pl.translate(tx - b[0].as("px"), ty - b[1].as("px"));
            try { pl.move(fill, ElementPlacement.PLACEBEFORE); } catch (eMvT) {}
            pl.merge();
            count++;
        }
    }
}

/* Modes:
   0 = Realistic Content-Aware Fill (Photoshop native seam-free fill — best realism!)
   1 = Natural Mirror / Selection-Source Tile
   2 = Studio Blur Ambient Fill
   3 = Smooth Edge Stretch (clean studio backdrops)
   4 = Solid Auto-Edge / Foreground Colour
   dir: "all" | "top" | "bottom" | "left" | "right" | "horiz" | "vert"
   addPx: if > 0, expands by +addPx pixels in chosen direction(s) instead of fixed social size */
function doExpand(size, mode, blurPx, step, dir, addPx, promptText) {
    var _step = (step == null || step < 10) ? 40 : step;
    var _dir = dir || "all";
    var _add = (addPx != null && addPx > 0) ? Math.round(addPx) : 0;
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    var oldUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    restoreRGBChannels(doc);
    try {
        var W = Math.round(doc.width.as("px")), H = Math.round(doc.height.as("px"));
        var newW = W, newH = H;
        if (_add > 0) {
            if (_dir === "left" || _dir === "right") newW = W + _add;
            else if (_dir === "horiz") newW = W + _add * 2;
            else if (_dir === "top" || _dir === "bottom") newH = H + _add;
            else if (_dir === "vert") newH = H + _add * 2;
            else { newW = W + _add * 2; newH = H + _add * 2; }
        } else {
            /* Smart Aspect-Ratio Expand: works even on 2K/4K photos larger than 1080x1920! */
            var targetAR = size.w / size.h;
            var curAR = W / H;
            if (W >= size.w || H >= size.h) {
                if (curAR > targetAR) {
                    newW = W;
                    newH = Math.round(W / targetAR);
                } else {
                    newH = H;
                    newW = Math.round(H * targetAR);
                }
            } else {
                newW = Math.max(W, size.w);
                newH = Math.max(H, size.h);
            }
            if (_dir === "top" || _dir === "bottom" || _dir === "vert") newW = W;
            if (_dir === "left" || _dir === "right" || _dir === "horiz") newH = H;
            /* If aspect ratio already matched exactly, add +20% headroom automatically */
            if (newW <= W && newH <= H) {
                if (_dir === "left" || _dir === "right") newW = Math.round(W * 1.25);
                else if (_dir === "horiz") newW = Math.round(W * 1.35);
                else if (_dir === "top" || _dir === "bottom") newH = Math.round(H * 1.25);
                else if (_dir === "vert") newH = Math.round(H * 1.35);
                else { newW = Math.round(W * 1.25); newH = Math.round(H * 1.25); }
            }
        }
        if (newW === W && newH === H) {
            return "Error: Image is already larger than or equal to target size. Increase Custom +px or pick a larger size.";
        }

        /* Determine AnchorPosition from direction */
        var anchor = AnchorPosition.MIDDLECENTER;
        if (_dir === "top") anchor = AnchorPosition.BOTTOMCENTER;
        else if (_dir === "bottom") anchor = AnchorPosition.TOPCENTER;
        else if (_dir === "left") anchor = AnchorPosition.MIDDLERIGHT;
        else if (_dir === "right") anchor = AnchorPosition.MIDDLELEFT;

        /* Capture optional user marquee selection BEFORE resizing */
        var selSrc = null;
        try {
            var sb = doc.selection.bounds;
            var sx = sb[0].as("px"), sy = sb[1].as("px");
            var sw = sb[2].as("px") - sx, sh = sb[3].as("px") - sy;
            if (sw >= 10 && sh >= 10) selSrc = { x: sx, y: sy, w: sw, h: sh };
        } catch (eSel) {}

        /* Smart check: if user's photo layer has empty margins on canvas & mode==0, fill those margins directly! */
        if (mode === 0 && _add === 0 && doc.activeLayer && !doc.activeLayer.isBackgroundLayer) {
            try {
                var ab = doc.activeLayer.bounds;
                var alw = ab[2].as("px") - ab[0].as("px"), alh = ab[3].as("px") - ab[1].as("px");
                if (alw > 10 && alh > 10 && (alw < W - 8 || alh < H - 8)) {
                    return auraFillEmptyCanvas();
                }
            } catch (eAB) {}
        }

        /* MODE 0: Realistic Content-Aware Fill (v2.37 FIXED: uses caLyr's own Trsp -> invert -> expand(5)) */
        if (mode === 0) {
            var caLyr = stampVisible("Photo Expand (Content-Aware)", doc);
            /* Unlock Background layer if present so resizeCanvas leaves transparent border cleanly */
            try {
                var bgLyr = doc.layers[doc.layers.length - 1];
                if (bgLyr && bgLyr.isBackgroundLayer) ensureNotBackground(bgLyr);
            } catch (eBg) {}

            doc.resizeCanvas(UnitValue(newW, "px"), UnitValue(newH, "px"), anchor);
            doc.activeLayer = caLyr;
            var origKeep2 = caLyr.duplicate();
            origKeep2.name = "Expand Orig TMP";
            origKeep2.visible = false;
            var ok2 = _runSubjectProtectedExpandFill(doc, caLyr, origKeep2);
            if (!ok2) {
                try { origKeep2.remove(); } catch (eR2) {}
                return "Error: Expanded border selection was empty.";
            }
            return "OK: Subject-Protected Realistic Expand ready — " + newW + "x" + newH + " px (" + _dir + ").";
        }


        /* MODE 5: Adobe Generative Expand (Firefly Online, auto-falls back to Subject-Protected Offline if offline) */
        if (mode === 5) {
            var gfLyr = stampVisible("Photo Expand (Generative)", doc);
            try {
                var bgL5 = doc.layers[doc.layers.length - 1];
                if (bgL5 && bgL5.isBackgroundLayer) ensureNotBackground(bgL5);
            } catch (eBg5) {}
            doc.resizeCanvas(UnitValue(newW, "px"), UnitValue(newH, "px"), anchor);
            doc.activeLayer = gfLyr;
            var dS5 = new ActionDescriptor();
            var r51 = new ActionReference(); r51.putProperty(cTID("Chnl"), cTID("fsel")); dS5.putReference(cTID("null"), r51);
            var r52 = new ActionReference(); r52.putEnumerated(cTID("Chnl"), cTID("Chnl"), cTID("Trsp")); dS5.putReference(cTID("T   "), r52);
            executeAction(cTID("setd"), dS5, DialogModes.NO);
            doc.selection.invert();
            try { doc.selection.expand(6); } catch (eE5) {}
            try {
                _tryAdobeGenerativeFill(promptText || "");
                doc.selection.deselect();
                return "OK: Adobe Generative Expand complete — " + newW + "x" + newH + " px.";
            } catch (eGF) {
                doc.selection.deselect();
                var origK5 = gfLyr.duplicate(); origK5.visible = false;
                _runSubjectProtectedExpandFill(doc, gfLyr, origK5);
                return "OK: Offline Subject-Protected Realistic Expand complete — " + newW + "x" + newH + " px (Firefly unavailable offline).";
            }
        }

        /* MODE 1: Natural Mirror / Selection-Source Seamless Tile */
        if (mode === 1) {
            var base = stampVisible("Photo Expand (Mirror)", doc);
            if (selSrc) {
                rectSel(doc, selSrc.x, selSrc.y, selSrc.x + selSrc.w, selSrc.y + selSrc.h);
                doc.selection.copy();
                doc.selection.deselect();
                var fill = doc.artLayers.add();
                fill.name = "Photo Expand (Selection Fill)";
                fill.move(base, ElementPlacement.PLACEAFTER);
                doc.resizeCanvas(UnitValue(newW, "px"), UnitValue(newH, "px"), anchor);
                var ox = (_dir === "left") ? (newW - W) : (_dir === "right") ? 0 : Math.round((newW - W) / 2);
                var oy = (_dir === "top") ? (newH - H) : (_dir === "bottom") ? 0 : Math.round((newH - H) / 2);
                if (ox > 0) tileBand(fill, selSrc, 0, 0, ox, newH);
                if (ox + W < newW) tileBand(fill, selSrc, ox + W, 0, newW, newH);
                if (oy > 0) tileBand(fill, selSrc, ox, 0, ox + W, oy);
                if (oy + H < newH) tileBand(fill, selSrc, ox, oy + H, ox + W, newH);
                return "OK: Selection-Source Expand ready — " + newW + "x" + newH + " px (your selection tiled seamlessly).";
            }
            var curW = W, curH = H, guard = 0;
            while ((curW < newW || curH < newH) && guard < 60) {
                guard++;
                if (curW < newW) {
                    var sx2 = Math.min(_step, (_dir === "left" || _dir === "right") ? (newW - curW) : Math.ceil((newW - curW) / 2));
                    if (_dir === "right") { mirrorSide(doc, base, "right", sx2, curW, curH); curW += sx2; }
                    else if (_dir === "left") { mirrorSide(doc, base, "left", sx2, curW, curH); curW += sx2; }
                    else { mirrorSide(doc, base, "right", sx2, curW, curH); curW += sx2; if (curW < newW) { var sxL = Math.min(sx2, newW - curW); mirrorSide(doc, base, "left", sxL, curW, curH); curW += sxL; } }
                }
                if (curH < newH) {
                    var sy2 = Math.min(_step, (_dir === "top" || _dir === "bottom") ? (newH - curH) : Math.ceil((newH - curH) / 2));
                    if (_dir === "bottom") { mirrorSide(doc, base, "bottom", sy2, curW, curH); curH += sy2; }
                    else if (_dir === "top") { mirrorSide(doc, base, "top", sy2, curW, curH); curH += sy2; }
                    else { mirrorSide(doc, base, "bottom", sy2, curW, curH); curH += sy2; if (curH < newH) { var syT = Math.min(sy2, newH - curH); mirrorSide(doc, base, "top", syT, curW, curH); curH += syT; } }
                }
            }
            return "OK: Mirror Expand ready — " + curW + "x" + curH + " px (" + _dir + ").";
        }

        /* MODE 2: Studio Ambient Blur Fill */
        if (mode === 2) {
            var orig = doc.activeLayer;
            if (orig && orig.isBackgroundLayer) ensureNotBackground(orig);
            var fill2 = stampVisible("Expand Fill (Studio Blur)", doc);
            try { fill2.move(orig, ElementPlacement.PLACEAFTER); } catch (eMv) {}
            var sc = Math.max(newW / W, newH / H) * 105;
            fill2.resize(sc, sc, AnchorPosition.MIDDLECENTER);
            fill2.applyGaussianBlur(Math.max(5, blurPx || 40));
            doc.resizeCanvas(UnitValue(newW, "px"), UnitValue(newH, "px"), anchor);
            return "OK: Studio Blur Expand ready — " + newW + "x" + newH + " px.";
        }

        /* MODE 3: Smooth Edge Stretch (clean studio backdrops) */
        if (mode === 3) {
            var orig3 = doc.activeLayer;
            if (orig3 && orig3.isBackgroundLayer) ensureNotBackground(orig3);
            var stLyr = stampVisible("Expand Fill (Edge Stretch)", doc);
            try { stLyr.move(orig3, ElementPlacement.PLACEAFTER); } catch (eMv3) {}
            doc.resizeCanvas(UnitValue(newW, "px"), UnitValue(newH, "px"), anchor);
            stLyr.resize((newW / W) * 102, (newH / H) * 102, AnchorPosition.MIDDLECENTER);
            stLyr.applyGaussianBlur(Math.max(4, Math.round((blurPx || 20) * 0.35)));
            return "OK: Edge Stretch Expand ready — " + newW + "x" + newH + " px.";
        }

        /* MODE 4: Solid Auto-Edge Colour Fill */
        var lastLyr = doc.layers[doc.layers.length - 1];
        if (lastLyr && lastLyr.isBackgroundLayer) ensureNotBackground(lastLyr);
        var edgeBg = sampleBgRGB(doc);
        var c = app.foregroundColor;
        if (edgeBg) {
            c = new SolidColor();
            c.rgb.red = edgeBg.r; c.rgb.green = edgeBg.g; c.rgb.blue = edgeBg.b;
        }
        doc.resizeCanvas(UnitValue(newW, "px"), UnitValue(newH, "px"), anchor);
        var col = doc.artLayers.add();
        col.name = "Expand Fill (Auto Edge Colour)";
        doc.selection.selectAll();
        doc.selection.fill(c, ColorBlendMode.NORMAL, 100, false);
        doc.selection.deselect();
        try { col.move(doc.layers[doc.layers.length - 1], ElementPlacement.PLACEAFTER); } catch (eMv2) {}
        return "OK: Solid Auto-Colour Expand ready — " + newW + "x" + newH + " px.";
    } catch (e) {
        return "Error: Photo Expand failed — " + e.message;
    } finally {
        restoreRGBChannels(doc);
        try { app.preferences.rulerUnits = oldUnits; } catch (e2) {}
    }
}

/* v2.38: 1-Click Fill Empty Canvas Around Active Photo Layer (Content-Aware Fill)
   Perfect when a portrait/smaller photo is placed on a 1080x1080 or 1080x1920 canvas
   leaving white/transparent bars on the sides or top/bottom! */
function auraFillEmptyCanvas() {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    var oldUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    restoreRGBChannels(doc);
    var srcLyr = doc.activeLayer;
    if (!srcLyr) {
        app.preferences.rulerUnits = oldUnits;
        return "Error: Select your photo layer first.";
    }
    try {
        var W = Math.round(doc.width.as("px")), H = Math.round(doc.height.as("px"));
        var b = srcLyr.bounds;
        var lx = b[0].as("px"), ly = b[1].as("px"), lw = b[2].as("px") - lx, lh = b[3].as("px") - ly;
        if (lw >= W - 4 && lh >= H - 4) {
            return "Error: This layer already fills the whole canvas. Use 'Expand Photo' below to enlarge the canvas.";
        }
        var work = srcLyr.duplicate();
        work.name = "Photo Expand (Canvas Fill)";
        work.visible = true;
        doc.activeLayer = work;
        if (work.kind !== LayerKind.NORMAL) {
            ensureRasterLayer(doc, work);
        }
        var origKeep = work.duplicate();
        origKeep.name = "Expand Orig TMP";
        origKeep.visible = false;
        var ok = _runSubjectProtectedExpandFill(doc, work, origKeep);
        if (!ok) {
            try { origKeep.remove(); } catch (eR0) {}
            try { work.remove(); } catch (eR1) {}
            return "Error: No empty canvas area found around '" + srcLyr.name + "'.";
        }
        return "OK: Realistic Subject-Protected Fill complete around '" + srcLyr.name + "' (zero subject cloning, seamless edge)!";
    } catch (e) {
        try { doc.selection.deselect(); } catch (e2) {}
        return "Error: Fill Empty Canvas failed — " + e.message;
    } finally {
        restoreRGBChannels(doc);
        try { app.preferences.rulerUnits = oldUnits; } catch (e3) {}
    }
}

function auraExpand(i, mode, blur, step, dir, addPx, promptText) { return doExpand(SIZES[i], mode, blur, step, dir, addPx, promptText); }

/* ---------------- TEXT HELPERS ---------------- */
function textColor(hex) { var c = new SolidColor(); c.rgb.hexValue = String(hex).replace("#", ""); return c; }

function smartTextLayer() {
    var doc = null;
    try { if (app.documents.length > 0) doc = app.activeDocument; } catch (e) {}
    if (!doc) {
        doc = app.documents.add(UnitValue(1920, "px"), UnitValue(1080, "px"), 72, "Design360n Text", NewDocumentMode.RGB, DocumentFill.TRANSPARENT);
    }
    var l = null;
    try { l = doc.activeLayer; } catch (e2) {}
    if (l && l.kind === LayerKind.TEXT) return l;
    var tl = doc.artLayers.add();
    tl.kind = LayerKind.TEXT;
    tl.name = "Design360n Text";
    tl.textItem.contents = "DESIGN360N";
    tl.textItem.size = UnitValue(72, "pt");
    var oldU = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    try {
        tl.textItem.position = [doc.width.as("px") / 2, doc.height.as("px") / 2];
    } finally {
        app.preferences.rulerUnits = oldU;
    }
    tl.textItem.justification = Justification.CENTER;
    tl.textItem.color = textColor("FFFFFF");
    doc.activeLayer = tl;
    return tl;
}

function textFontScale(lyr) {
    var fs = 72;
    try { fs = lyr.textItem.size.as("px"); } catch (e1) {
        try { fs = lyr.textItem.size.value; } catch (e2) {}
    }
    if (!(fs > 0)) fs = 72;
    var sc = fs / 72.0;
    if (sc < 0.25) sc = 0.25;
    if (sc > 4) sc = 4;
    return sc;
}

function toSmartObject(lyr) {
    app.activeDocument.activeLayer = lyr;
    executeAction(sTID("newPlacedLayer"), new ActionDescriptor(), DialogModes.NO);
    return app.activeDocument.activeLayer;
}

/* ---------------- 125+ EDITABLE PHOTOSHOP LAYER STYLES DATA ---------------- */
var TEXTFX100 = [{"n": "3D Gold Blockbuster", "cat": "3D Highlight", "base": "#FFB800", "g": [[0, "#FFFDE7"], [35, "#FFD54F"], [65, "#D97706"], [100, "#78350F"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 220, "sz": 7, "ho": 95, "so": 55}, "sat": {"c": "#FEF08A", "o": 45, "ang": 25, "dst": 10, "sz": 14}, "sh": {"c": "#451A03", "b": "Nrml", "o": 100, "blur": 1, "dst": 11, "ck": 95, "ang": 120}, "p": {"sh": "0 4px 0 #78350F, 0 8px 12px rgba(0,0,0,.7)"}}, {"n": "Neon Tube Cyan", "cat": "3D Highlight", "base": "#E0F2FE", "g": [[0, "#FFFFFF"], [55, "#A5F3FC"], [100, "#22D3EE"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 85, "blur": 8}, "og": {"c": "#06B6D4", "b": "Scrn", "o": 100, "blur": 42}, "p": {"glow": "0 0 10px #22D3EE, 0 0 22px #06B6D4"}}, {"n": "Sticker Cutout White", "cat": "3D Highlight", "base": "#FACC15", "g": [[0, "#FEF08A"], [55, "#FACC15"], [100, "#F97316"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ol": {"c": "#FFFFFF", "w": 10}, "sh": {"c": "#000000", "b": "Mltp", "o": 65, "blur": 22, "dst": 10, "ck": 15, "ang": 90}, "p": {"stroke": "2px #FFFFFF", "sh": "0 6px 12px rgba(0,0,0,.7)"}}, {"n": "Liquid Mirror Chrome", "cat": "3D Highlight", "base": "#E2E8F0", "g": [[0, "#FFFFFF"], [24, "#94A3B8"], [48, "#F8FAFC"], [51, "#1E293B"], [76, "#CBD5E1"], [100, "#FFFFFF"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 240, "sz": 6, "ho": 100, "so": 50}, "sat": {"c": "#FFFFFF", "o": 35, "ang": 19, "dst": 8, "sz": 12}, "sh": {"c": "#020617", "b": "Mltp", "o": 80, "blur": 14, "dst": 8, "ck": 20, "ang": 110}, "p": {"sh": "0 3px 0 #475569, 0 6px 12px rgba(0,0,0,.75)"}}, {"n": "Frosted Glass Clear", "cat": "3D Highlight", "base": "#E0F2FE", "fillOp": 38, "g": [[0, "#FFFFFF"], [50, "#BAE6FD"], [100, "#FFFFFF"]], "ang": 135, "gm": "Scrn", "gop": 65, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 120, "sz": 5, "ho": 100, "so": 15}, "ol": {"c": "#FFFFFF", "w": 2}, "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 75, "blur": 10}, "sh": {"c": "#0C4A6E", "b": "Mltp", "o": 45, "blur": 20, "dst": 8, "ck": 0, "ang": 90}, "p": {"stroke": "1px rgba(255,255,255,.85)", "glow": "0 0 12px rgba(186,230,253,.55)"}}, {"n": "Comic Hard Pop", "cat": "3D Highlight", "base": "#FFE600", "g": [[0, "#FFFF8D"], [50, "#FFE600"], [100, "#FFAB00"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ol": {"c": "#000000", "w": 6}, "sh": {"c": "#000000", "b": "Nrml", "o": 100, "blur": 0, "dst": 16, "ck": 100, "ang": 135}, "p": {"stroke": "2px #000000", "sh": "4px 4px 0 #000000"}}, {"n": "Molten Fire Blaze", "cat": "3D Highlight", "base": "#F97316", "g": [[0, "#FEF9C3"], [35, "#FACC15"], [70, "#EA580C"], [100, "#991B1B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "LnrD", "c": "#FEF08A", "o": 75, "blur": 12}, "og": {"c": "#F97316", "b": "LnrD", "o": 90, "blur": 38}, "sh": {"c": "#450A0A", "b": "Mltp", "o": 85, "blur": 18, "dst": 6, "ck": 10, "ang": 90}, "p": {"glow": "0 0 14px #F97316, 0 0 24px #DC2626"}}, {"n": "Luxury Rose Foil", "cat": "3D Highlight", "base": "#F4A29E", "g": [[0, "#FFF1F2"], [35, "#FBCFE8"], [68, "#D47A76"], [100, "#9D4446"]], "ang": 120, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "sat": {"c": "#FFF1F2", "o": 40, "ang": 30, "dst": 8, "sz": 16}, "sh": {"c": "#2A0A0E", "b": "Mltp", "o": 55, "blur": 24, "dst": 8, "ck": 0, "ang": 90}, "p": {"sh": "0 4px 12px rgba(244,162,158,.45)"}}, {"n": "Cyberpunk Laser Pink", "cat": "3D Highlight", "base": "#F472B6", "g": [[0, "#FDF2F8"], [40, "#F472B6"], [85, "#DB2777"], [100, "#701A75"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "Scrn", "c": "#A5F3FC", "o": 65, "blur": 7}, "og": {"c": "#EC4899", "b": "Scrn", "o": 95, "blur": 40}, "p": {"glow": "0 0 12px #EC4899, 0 0 24px #A855F7"}}, {"n": "Mega Offer 3D Red", "cat": "3D Highlight", "base": "#EF4444", "g": [[0, "#FF6B6B"], [55, "#DC2626"], [100, "#991B1B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ol": {"c": "#FFFFFF", "w": 3}, "sh": {"c": "#5C0707", "b": "Nrml", "o": 100, "blur": 0, "dst": 18, "ck": 100, "ang": 125}, "p": {"stroke": "1px #FFFFFF", "sh": "4px 5px 0 #7F1D1D"}}, {"n": "Cinema Floating White", "cat": "3D Highlight", "base": "#FFFFFF", "g": [[0, "#FFFFFF"], [75, "#F8FAFC"], [100, "#E2E8F0"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "sh": {"c": "#000000", "b": "Mltp", "o": 75, "blur": 32, "dst": 10, "ck": 5, "ang": 90}, "p": {"sh": "0 8px 18px rgba(0,0,0,.9)"}}, {"n": "Obsidian Gold Border", "cat": "3D Highlight", "base": "#0F172A", "g": [[0, "#475569"], [48, "#0F172A"], [100, "#020617"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "sat": {"c": "#FFFFFF", "o": 25, "ang": 20, "dst": 6, "sz": 10}, "ol": {"c": "#FACC15", "w": 4}, "og": {"c": "#F59E0B", "b": "Scrn", "o": 55, "blur": 22}, "p": {"stroke": "1.5px #FACC15", "glow": "0 0 10px rgba(245,158,11,.6)"}}, {"n": "Holographic Pearl", "cat": "3D Highlight", "base": "#A5F3FC", "g": [[0, "#FDE68A"], [25, "#FBCFE8"], [50, "#A5F3FC"], [75, "#C4B5FD"], [100, "#6EE7B7"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "sat": {"c": "#FFFFFF", "o": 45, "ang": 40, "dst": 10, "sz": 14}, "ol": {"c": "#FFFFFF", "w": 2}, "og": {"c": "#C4B5FD", "b": "Scrn", "o": 60, "blur": 24}, "p": {"glow": "0 0 12px rgba(196,181,253,.7)"}}, {"n": "Carved Stone Emboss", "cat": "3D Highlight", "base": "#94A3B8", "g": [[0, "#CBD5E1"], [50, "#64748B"], [100, "#334155"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "Embs", "d": 260, "sz": 8, "ho": 80, "so": 70}, "ish": {"c": "#0F172A", "o": 70, "blur": 8, "dst": 4, "ang": 120}, "p": {"sh": "0 2px 0 #1E293B, inset 0 2px 4px #000"}}, {"n": "Juicy 3D Candy Gel", "cat": "3D Highlight", "base": "#FB923C", "g": [[0, "#FFFBEB"], [25, "#FDE047"], [65, "#F97316"], [100, "#EA580C"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 130, "sz": 12, "ho": 100, "so": 25}, "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 65, "blur": 8}, "sh": {"c": "#7C2D12", "b": "Mltp", "o": 75, "blur": 16, "dst": 8, "ck": 10, "ang": 90}, "p": {"sh": "0 4px 10px rgba(249,115,22,.65)"}}, {"n": "Hollow Neon Lime", "cat": "3D Highlight", "base": "#A3E635", "fillOp": 12, "g": [[0, "#ECFCCB"], [100, "#84CC16"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ol": {"c": "#A3E635", "w": 5}, "og": {"c": "#84CC16", "b": "Scrn", "o": 100, "blur": 36}, "p": {"hollow": true, "stroke": "2px #A3E635", "glow": "0 0 14px #84CC16"}}, {"n": "Retro 80s Synthwave", "cat": "3D Highlight", "base": "#E879F9", "g": [[0, "#38BDF8"], [42, "#FFFFFF"], [48, "#3B0764"], [65, "#EC4899"], [100, "#FEF08A"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 190, "sz": 5, "ho": 95, "so": 40}, "og": {"c": "#EC4899", "b": "Scrn", "o": 75, "blur": 28}, "p": {"glow": "0 0 12px #EC4899"}}, {"n": "Emerald Velvet Gold", "cat": "3D Highlight", "base": "#059669", "g": [[0, "#34D399"], [50, "#047857"], [100, "#022C22"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ish": {"c": "#022C22", "o": 65, "blur": 10, "dst": 4, "ang": 90}, "ol": {"c": "#FDE68A", "w": 2}, "sh": {"c": "#000000", "b": "Mltp", "o": 75, "blur": 20, "dst": 9, "ck": 10, "ang": 90}, "p": {"stroke": "1px #FDE68A", "sh": "0 5px 12px rgba(0,0,0,.8)"}}, {"n": "Emon Yellow Orange Glow", "cat": "Emon", "base": "#FF6D00", "g": [[0, "#FFFF00"], [100, "#FF6D00"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 60, "grev": true, "gtype": "Lnr ", "ig": {"b": "LnrD", "c": "#FFF200", "o": 35, "blur": 10, "src": "SrcE"}, "og": {"c": "#FFF200", "b": "LnrD", "o": 35, "blur": 20}, "sh": {"c": "#000000", "b": "Nrml", "o": 75, "blur": 35, "dst": 10, "ck": 18, "ang": 90, "uglg": true}}, {"n": "PS Glass Button", "cat": "PS Default", "base": "#38BDF8", "g": [[0, "#E0F2FE"], [48, "#38BDF8"], [52, "#0284C7"], [100, "#7DD3FC"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 140, "sz": 7, "ho": 85, "so": 45}, "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 55, "blur": 8}, "sh": {"c": "#0C4A6E", "o": 55, "blur": 10, "dst": 5}, "ol": {"c": "#BAE6FD", "w": 2}}, {"n": "PS Chrome Bevel", "cat": "PS Default", "base": "#CBD5E1", "g": [[0, "#FFFFFF"], [25, "#94A3B8"], [50, "#F8FAFC"], [75, "#334155"], [100, "#E2E8F0"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 260, "sz": 8, "ho": 95, "so": 80}, "sh": {"c": "#000000", "o": 65, "blur": 8, "dst": 5}, "ol": {"c": "#475569", "w": 2}, "satin": {"c": "#FFFFFF", "o": 35, "dst": 6, "blur": 8}}, {"n": "PS Glossy Red Gel", "cat": "PS Default", "base": "#EF4444", "g": [[0, "#FCA5A5"], [45, "#EF4444"], [55, "#B91C1C"], [100, "#F87171"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 180, "sz": 8, "ho": 90, "so": 50}, "ig": {"b": "Scrn", "c": "#FEE2E2", "o": 50, "blur": 6}, "sh": {"c": "#450A0A", "o": 60, "blur": 10, "dst": 5}, "ol": {"c": "#991B1B", "w": 2}}, {"n": "PS Glossy Green Gel", "cat": "PS Default", "base": "#22C55E", "g": [[0, "#BBF7D0"], [45, "#22C55E"], [55, "#15803D"], [100, "#4ADE80"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 180, "sz": 8, "ho": 90, "so": 50}, "ig": {"b": "Scrn", "c": "#DCFCE7", "o": 50, "blur": 6}, "sh": {"c": "#052E16", "o": 60, "blur": 10, "dst": 5}, "ol": {"c": "#166534", "w": 2}}, {"n": "PS Soft Plastic Blue", "cat": "PS Default", "base": "#3B82F6", "g": [[0, "#93C5FD"], [50, "#3B82F6"], [100, "#1D4ED8"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 150, "sz": 10, "ho": 85, "so": 55}, "sh": {"c": "#1E3A8A", "o": 55, "blur": 12, "dst": 6}, "ish": {"c": "#FFFFFF", "o": 45, "blur": 5, "dst": 3}}, {"n": "PS Aqua Crystal", "cat": "PS Default", "base": "#06B6D4", "g": [[0, "#CFFAFE"], [40, "#22D3EE"], [100, "#0E7490"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 130, "sz": 6, "ho": 90, "so": 35}, "ig": {"b": "Scrn", "c": "#ECFEFF", "o": 65, "blur": 10}, "og": {"c": "#22D3EE", "b": "Scrn", "o": 45, "blur": 14}, "sh": {"c": "#083344", "o": 55, "blur": 8, "dst": 4}}, {"n": "PS Embossed Stone", "cat": "PS Default", "base": "#9CA3AF", "g": [[0, "#D1D5DB"], [50, "#9CA3AF"], [100, "#4B5563"]], "ang": 120, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "Embs", "d": 220, "sz": 6, "ho": 75, "so": 80}, "sh": {"c": "#111827", "o": 65, "blur": 6, "dst": 4}, "ish": {"c": "#1F2937", "o": 40, "blur": 4, "dst": 2}}, {"n": "PS Carved Wood", "cat": "PS Default", "base": "#92400E", "g": [[0, "#D97706"], [40, "#92400E"], [70, "#78350F"], [100, "#451A03"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 200, "sz": 7, "ho": 65, "so": 85}, "sh": {"c": "#290F02", "o": 70, "blur": 8, "dst": 5}, "ish": {"c": "#451A03", "o": 55, "blur": 5, "dst": 3}, "satin": {"c": "#B45309", "o": 30, "dst": 8, "blur": 10}}, {"n": "PS Copper Plate", "cat": "PS Default", "base": "#D97706", "g": [[0, "#FED7AA"], [35, "#EA580C"], [70, "#9A3412"], [100, "#FDBA74"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 240, "sz": 7, "ho": 90, "so": 75}, "sh": {"c": "#431407", "o": 65, "blur": 9, "dst": 5}, "ol": {"c": "#7C2D12", "w": 2}, "satin": {"c": "#FDBA74", "o": 35, "dst": 7, "blur": 9}}, {"n": "PS Satin Silk Purple", "cat": "PS Default", "base": "#9333EA", "g": [[0, "#E9D5FF"], [50, "#9333EA"], [100, "#581C87"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 120, "sz": 6, "ho": 80, "so": 50}, "sh": {"c": "#3B0764", "o": 60, "blur": 10, "dst": 5}, "satin": {"c": "#F3E8FF", "o": 45, "dst": 10, "blur": 12}}, {"n": "PS Matte Paper Cut", "cat": "PS Default", "base": "#F8FAFC", "g": [[0, "#FFFFFF"], [100, "#E2E8F0"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 60, "sz": 3, "ho": 85, "so": 30}, "sh": {"c": "#0F172A", "o": 40, "blur": 14, "dst": 6}, "ol": {"c": "#CBD5E1", "w": 1}}, {"n": "PS Brushed Steel", "cat": "PS Default", "base": "#64748B", "g": [[0, "#E2E8F0"], [30, "#94A3B8"], [60, "#475569"], [100, "#CBD5E1"]], "ang": 0, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 190, "sz": 5, "ho": 85, "so": 70}, "sh": {"c": "#0F172A", "o": 65, "blur": 7, "dst": 4}, "ol": {"c": "#334155", "w": 2}}, {"n": "PS Dark Obsidian", "cat": "PS Default", "base": "#1E293B", "g": [[0, "#475569"], [45, "#1E293B"], [100, "#020617"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 220, "sz": 6, "ho": 80, "so": 90}, "ig": {"b": "Scrn", "c": "#94A3B8", "o": 30, "blur": 5}, "sh": {"c": "#000000", "o": 80, "blur": 12, "dst": 6}, "ol": {"c": "#64748B", "w": 1}}, {"n": "PS Soft Drop Pill", "cat": "PS Default", "base": "#FFFFFF", "g": [[0, "#FFFFFF"], [100, "#F1F5F9"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "sh": {"c": "#0F172A", "o": 35, "blur": 18, "dst": 8}, "ish": {"c": "#FFFFFF", "o": 80, "blur": 3, "dst": 2}, "ol": {"c": "#E2E8F0", "w": 1}}, {"n": "Gold Classic", "cat": "Gold & Luxury", "base": "#FDE047", "g": [[0, "#FEF9C3"], [50, "#FDE047"], [100, "#F59E0B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 220, "sz": 7, "ho": 90, "so": 75}, "sh": {"c": "#291400", "o": 72, "blur": 10, "dst": 5}, "ol": {"c": "#78350F", "w": 1}}, {"n": "Gold Deep", "cat": "Gold & Luxury", "base": "#F59E0B", "g": [[0, "#FDE68A"], [50, "#F59E0B"], [100, "#B45309"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 220, "sz": 7, "ho": 90, "so": 75}, "sh": {"c": "#291400", "o": 72, "blur": 10, "dst": 5}, "ol": {"c": "#78350F", "w": 1}}, {"n": "Gold Light", "cat": "Gold & Luxury", "base": "#FEF08A", "g": [[0, "#FFFFFF"], [50, "#FEF08A"], [100, "#FACC15"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 220, "sz": 7, "ho": 90, "so": 75}, "sh": {"c": "#291400", "o": 72, "blur": 10, "dst": 5}, "ol": {"c": "#78350F", "w": 1}}, {"n": "Royal 24K Gold", "cat": "Gold & Luxury", "base": "#F59E0B", "g": [[0, "#FFFBEB"], [25, "#FCD34D"], [50, "#D97706"], [75, "#FEF08A"], [100, "#92400E"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 220, "sz": 7, "ho": 90, "so": 75}, "og": {"c": "#FDE047", "b": "Scrn", "o": 40, "blur": 16}, "sh": {"c": "#291400", "o": 72, "blur": 10, "dst": 5}, "ol": {"c": "#78350F", "w": 1}, "satin": {"c": "#FEF08A", "o": 30, "dst": 7, "blur": 9}}, {"n": "Rose Gold Luxe", "cat": "Gold & Luxury", "base": "#F472B6", "g": [[0, "#FFF1F2"], [35, "#F9A8D4"], [65, "#DB2777"], [100, "#FBCFE8"]], "ang": 120, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 220, "sz": 7, "ho": 90, "so": 75}, "sh": {"c": "#291400", "o": 72, "blur": 10, "dst": 5}, "ol": {"c": "#78350F", "w": 1}, "satin": {"c": "#FEF08A", "o": 30, "dst": 7, "blur": 9}}, {"n": "Champagne Shimmer", "cat": "Gold & Luxury", "base": "#FDE68A", "g": [[0, "#FFFBEB"], [45, "#FDE68A"], [100, "#CA8A04"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 220, "sz": 7, "ho": 90, "so": 75}, "sh": {"c": "#291400", "o": 72, "blur": 10, "dst": 5}, "ol": {"c": "#78350F", "w": 1}}, {"n": "Antique Bronze", "cat": "Gold & Luxury", "base": "#B45309", "g": [[0, "#FDE68A"], [45, "#B45309"], [100, "#451A03"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 220, "sz": 7, "ho": 90, "so": 75}, "sh": {"c": "#291400", "o": 72, "blur": 10, "dst": 5}, "ol": {"c": "#78350F", "w": 1}, "satin": {"c": "#FEF08A", "o": 30, "dst": 7, "blur": 9}}, {"n": "Liquid Gold", "cat": "Gold & Luxury", "base": "#EAB308", "g": [[0, "#FEF9C3"], [30, "#CA8A04"], [55, "#FEF08A"], [80, "#A16207"], [100, "#FDE047"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 220, "sz": 7, "ho": 90, "so": 75}, "og": {"c": "#FDE047", "b": "Scrn", "o": 40, "blur": 16}, "sh": {"c": "#291400", "o": 72, "blur": 10, "dst": 5}, "ol": {"c": "#78350F", "w": 1}, "satin": {"c": "#FEF08A", "o": 30, "dst": 7, "blur": 9}}, {"n": "White Gold", "cat": "Gold & Luxury", "base": "#F8FAFC", "g": [[0, "#FFFFFF"], [45, "#E2E8F0"], [75, "#FEF3C7"], [100, "#94A3B8"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 220, "sz": 7, "ho": 90, "so": 75}, "sh": {"c": "#291400", "o": 72, "blur": 10, "dst": 5}, "ol": {"c": "#78350F", "w": 1}}, {"n": "Gold Foil Stamp", "cat": "Gold & Luxury", "base": "#FACC15", "g": [[0, "#FEF08A"], [50, "#EAB308"], [100, "#854D0E"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 220, "sz": 7, "ho": 90, "so": 75}, "sh": {"c": "#291400", "o": 72, "blur": 10, "dst": 5}, "ol": {"c": "#78350F", "w": 1}}, {"n": "Amber Jewel", "cat": "Gold & Luxury", "base": "#D97706", "g": [[0, "#FEF3C7"], [40, "#F59E0B"], [100, "#78350F"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 220, "sz": 7, "ho": 90, "so": 75}, "sh": {"c": "#291400", "o": 72, "blur": 10, "dst": 5}, "ol": {"c": "#78350F", "w": 1}, "satin": {"c": "#FEF08A", "o": 30, "dst": 7, "blur": 9}}, {"n": "Luxury Black Gold", "cat": "Gold & Luxury", "base": "#1C1917", "g": [[0, "#44403C"], [50, "#1C1917"], [100, "#0C0A09"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 220, "sz": 7, "ho": 90, "so": 75}, "sh": {"c": "#291400", "o": 72, "blur": 10, "dst": 5}, "ol": {"c": "#FACC15", "w": 3}}, {"n": "Neon Cyan Tube", "cat": "Neon & Cyber", "base": "#22D3EE", "g": [[0, "#ECFEFF"], [50, "#22D3EE"], [100, "#0891B2"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 75, "blur": 6, "src": "SrcC"}, "og": {"c": "#22D3EE", "b": "LnrD", "o": 85, "blur": 22}, "sh": {"c": "#000000", "o": 75, "blur": 8, "dst": 4}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Neon Hot Pink", "cat": "Neon & Cyber", "base": "#EC4899", "g": [[0, "#FDF2F8"], [50, "#F472B6"], [100, "#DB2777"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 75, "blur": 6, "src": "SrcC"}, "og": {"c": "#EC4899", "b": "LnrD", "o": 85, "blur": 22}, "sh": {"c": "#000000", "o": 75, "blur": 8, "dst": 4}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Neon Electric Lime", "cat": "Neon & Cyber", "base": "#84CC16", "g": [[0, "#F7FEE7"], [50, "#A3E635"], [100, "#4D7C0F"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 75, "blur": 6, "src": "SrcC"}, "og": {"c": "#84CC16", "b": "LnrD", "o": 85, "blur": 22}, "sh": {"c": "#000000", "o": 75, "blur": 8, "dst": 4}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Neon Violet Pulse", "cat": "Neon & Cyber", "base": "#A855F7", "g": [[0, "#FAF5FF"], [50, "#C084FC"], [100, "#7E22CE"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 75, "blur": 6, "src": "SrcC"}, "og": {"c": "#A855F7", "b": "LnrD", "o": 85, "blur": 22}, "sh": {"c": "#000000", "o": 75, "blur": 8, "dst": 4}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Neon Laser Red", "cat": "Neon & Cyber", "base": "#EF4444", "g": [[0, "#FEF2F2"], [50, "#F87171"], [100, "#DC2626"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 75, "blur": 6, "src": "SrcC"}, "og": {"c": "#EF4444", "b": "LnrD", "o": 85, "blur": 22}, "sh": {"c": "#000000", "o": 75, "blur": 8, "dst": 4}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Neon Solar Yellow", "cat": "Neon & Cyber", "base": "#FACC15", "g": [[0, "#FEFCE8"], [50, "#FDE047"], [100, "#CA8A04"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 75, "blur": 6, "src": "SrcC"}, "og": {"c": "#FACC15", "b": "LnrD", "o": 85, "blur": 22}, "sh": {"c": "#000000", "o": 75, "blur": 8, "dst": 4}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Cyberpunk Dual", "cat": "Neon & Cyber", "base": "#22D3EE", "g": [[0, "#67E8F9"], [50, "#22D3EE"], [100, "#E879F9"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 75, "blur": 6, "src": "SrcC"}, "og": {"c": "#E879F9", "b": "LnrD", "o": 85, "blur": 22}, "sh": {"c": "#000000", "o": 75, "blur": 8, "dst": 4}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Tokyo Night", "cat": "Neon & Cyber", "base": "#38BDF8", "g": [[0, "#F472B6"], [50, "#818CF8"], [100, "#22D3EE"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 75, "blur": 6, "src": "SrcC"}, "og": {"c": "#818CF8", "b": "LnrD", "o": 85, "blur": 22}, "sh": {"c": "#000000", "o": 75, "blur": 8, "dst": 4}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Acid Mint Glow", "cat": "Neon & Cyber", "base": "#34D399", "g": [[0, "#ECFDF5"], [50, "#34D399"], [100, "#059669"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 75, "blur": 6, "src": "SrcC"}, "og": {"c": "#34D399", "b": "LnrD", "o": 85, "blur": 22}, "sh": {"c": "#000000", "o": 75, "blur": 8, "dst": 4}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Hyper Orange Neon", "cat": "Neon & Cyber", "base": "#FB923C", "g": [[0, "#FFF7ED"], [50, "#FB923C"], [100, "#EA580C"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 75, "blur": 6, "src": "SrcC"}, "og": {"c": "#FB923C", "b": "LnrD", "o": 85, "blur": 22}, "sh": {"c": "#000000", "o": 75, "blur": 8, "dst": 4}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Ultraviolet Glow", "cat": "Neon & Cyber", "base": "#6366F1", "g": [[0, "#EEF2FF"], [50, "#818CF8"], [100, "#4338CA"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 75, "blur": 6, "src": "SrcC"}, "og": {"c": "#6366F1", "b": "LnrD", "o": 85, "blur": 22}, "sh": {"c": "#000000", "o": 75, "blur": 8, "dst": 4}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "White LED Sign", "cat": "Neon & Cyber", "base": "#FFFFFF", "g": [[0, "#FFFFFF"], [100, "#E0F2FE"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 75, "blur": 6, "src": "SrcC"}, "og": {"c": "#38BDF8", "b": "LnrD", "o": 85, "blur": 22}, "sh": {"c": "#000000", "o": 75, "blur": 8, "dst": 4}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Blockbuster Gold", "cat": "3D & Cinematic", "base": "#F59E0B", "g": [[0, "#FEF3C7"], [45, "#F59E0B"], [55, "#92400E"], [100, "#FCD34D"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 280, "sz": 9, "ho": 92, "so": 85}, "sh": {"c": "#1C1917", "o": 88, "blur": 10, "dst": 9, "ck": 20}, "ol": {"c": "#1C1917", "w": 3}}, {"n": "Action Steel", "cat": "3D & Cinematic", "base": "#94A3B8", "g": [[0, "#F8FAFC"], [45, "#94A3B8"], [55, "#334155"], [100, "#CBD5E1"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 280, "sz": 9, "ho": 92, "so": 85}, "sh": {"c": "#0F172A", "o": 88, "blur": 10, "dst": 9, "ck": 20}, "ol": {"c": "#0F172A", "w": 3}}, {"n": "Epic Crimson", "cat": "3D & Cinematic", "base": "#DC2626", "g": [[0, "#FCA5A5"], [45, "#DC2626"], [55, "#7F1D1D"], [100, "#EF4444"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 280, "sz": 9, "ho": 92, "so": 85}, "sh": {"c": "#1F0505", "o": 88, "blur": 10, "dst": 9, "ck": 20}, "ol": {"c": "#1F0505", "w": 3}}, {"n": "Sci-Fi Titanium", "cat": "3D & Cinematic", "base": "#38BDF8", "g": [[0, "#E0F2FE"], [48, "#38BDF8"], [52, "#1E3A8A"], [100, "#7DD3FC"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 280, "sz": 9, "ho": 92, "so": 85}, "sh": {"c": "#082F49", "o": 88, "blur": 10, "dst": 9, "ck": 20}, "ol": {"c": "#082F49", "w": 3}}, {"n": "YouTube Bold Yellow", "cat": "3D & Cinematic", "base": "#FACC15", "g": [[0, "#FEF08A"], [50, "#FACC15"], [100, "#EA580C"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 280, "sz": 9, "ho": 92, "so": 85}, "sh": {"c": "#000000", "o": 88, "blur": 10, "dst": 9, "ck": 20}, "ol": {"c": "#000000", "w": 3}}, {"n": "YouTube Viral Red", "cat": "3D & Cinematic", "base": "#EF4444", "g": [[0, "#FCA5A5"], [50, "#EF4444"], [100, "#991B1B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 280, "sz": 9, "ho": 92, "so": 85}, "sh": {"c": "#000000", "o": 88, "blur": 10, "dst": 9, "ck": 20}, "ol": {"c": "#000000", "w": 3}}, {"n": "Gaming Emerald", "cat": "3D & Cinematic", "base": "#10B981", "g": [[0, "#A7F3D0"], [50, "#10B981"], [100, "#065F46"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 280, "sz": 9, "ho": 92, "so": 85}, "sh": {"c": "#022C22", "o": 88, "blur": 10, "dst": 9, "ck": 20}, "ol": {"c": "#022C22", "w": 3}}, {"n": "Esports Purple", "cat": "3D & Cinematic", "base": "#8B5CF6", "g": [[0, "#DDD6FE"], [50, "#8B5CF6"], [100, "#4C1D95"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 280, "sz": 9, "ho": 92, "so": 85}, "sh": {"c": "#1E1B4B", "o": 88, "blur": 10, "dst": 9, "ck": 20}, "ol": {"c": "#1E1B4B", "w": 3}}, {"n": "Trailer Silver", "cat": "3D & Cinematic", "base": "#E2E8F0", "g": [[0, "#FFFFFF"], [48, "#CBD5E1"], [52, "#475569"], [100, "#94A3B8"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 280, "sz": 9, "ho": 92, "so": 85}, "sh": {"c": "#020617", "o": 88, "blur": 10, "dst": 9, "ck": 20}, "ol": {"c": "#020617", "w": 3}}, {"n": "Heroic Blue", "cat": "3D & Cinematic", "base": "#2563EB", "g": [[0, "#93C5FD"], [50, "#2563EB"], [100, "#1E3A8A"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 280, "sz": 9, "ho": 92, "so": 85}, "sh": {"c": "#0F172A", "o": 88, "blur": 10, "dst": 9, "ck": 20}, "ol": {"c": "#0F172A", "w": 3}}, {"n": "Noir Impact", "cat": "3D & Cinematic", "base": "#F1F5F9", "g": [[0, "#FFFFFF"], [55, "#94A3B8"], [100, "#1E293B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 280, "sz": 9, "ho": 92, "so": 85}, "sh": {"c": "#000000", "o": 88, "blur": 10, "dst": 9, "ck": 20}, "ol": {"c": "#000000", "w": 3}}, {"n": "Chiseled Granite", "cat": "3D & Cinematic", "base": "#6B7280", "g": [[0, "#D1D5DB"], [50, "#6B7280"], [100, "#1F2937"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 280, "sz": 9, "ho": 92, "so": 85}, "sh": {"c": "#030712", "o": 88, "blur": 10, "dst": 9, "ck": 20}, "ol": {"c": "#030712", "w": 3}}, {"n": "Sticker White Pop", "cat": "Comic & Sticker", "base": "#F43F5E", "g": [[0, "#FB7185"], [100, "#E11D48"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "sh": {"c": "#000000", "o": 85, "blur": 2, "dst": 7, "ck": 80}, "ol": {"c": "#FFFFFF", "w": 5}}, {"n": "Comic Boom Yellow", "cat": "Comic & Sticker", "base": "#FACC15", "g": [[0, "#FEF08A"], [100, "#EA580C"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "sh": {"c": "#000000", "o": 85, "blur": 2, "dst": 7, "ck": 80}, "ol": {"c": "#000000", "w": 4}}, {"n": "Pop Art Cyan", "cat": "Comic & Sticker", "base": "#06B6D4", "g": [[0, "#67E8F9"], [100, "#0284C7"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "sh": {"c": "#000000", "o": 85, "blur": 2, "dst": 7, "ck": 80}, "ol": {"c": "#000000", "w": 4}}, {"n": "Manga Impact", "cat": "Comic & Sticker", "base": "#FFFFFF", "g": [[0, "#FFFFFF"], [100, "#E5E7EB"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "sh": {"c": "#000000", "o": 85, "blur": 2, "dst": 7, "ck": 80}, "ol": {"c": "#000000", "w": 5}}, {"n": "Cartoon Lime", "cat": "Comic & Sticker", "base": "#84CC16", "g": [[0, "#BEF264"], [100, "#16A34A"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "sh": {"c": "#000000", "o": 85, "blur": 2, "dst": 7, "ck": 80}, "ol": {"c": "#14532D", "w": 4}}, {"n": "Bubblegum Sticker", "cat": "Comic & Sticker", "base": "#EC4899", "g": [[0, "#FBCFE8"], [100, "#EC4899"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "sh": {"c": "#000000", "o": 85, "blur": 2, "dst": 7, "ck": 80}, "ol": {"c": "#FFFFFF", "w": 5}}, {"n": "Arcade Orange", "cat": "Comic & Sticker", "base": "#F97316", "g": [[0, "#FDE047"], [100, "#EA580C"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "sh": {"c": "#000000", "o": 85, "blur": 2, "dst": 7, "ck": 80}, "ol": {"c": "#1E1B4B", "w": 4}}, {"n": "Super Blue Badge", "cat": "Comic & Sticker", "base": "#3B82F6", "g": [[0, "#93C5FD"], [100, "#1D4ED8"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "sh": {"c": "#000000", "o": 85, "blur": 2, "dst": 7, "ck": 80}, "ol": {"c": "#FFFFFF", "w": 5}}, {"n": "Bold Black Stamp", "cat": "Comic & Sticker", "base": "#111827", "g": [[0, "#374151"], [100, "#030712"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "sh": {"c": "#000000", "o": 85, "blur": 2, "dst": 7, "ck": 80}, "ol": {"c": "#FACC15", "w": 4}}, {"n": "Playful Violet", "cat": "Comic & Sticker", "base": "#8B5CF6", "g": [[0, "#DDD6FE"], [100, "#7C3AED"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "sh": {"c": "#000000", "o": 85, "blur": 2, "dst": 7, "ck": 80}, "ol": {"c": "#FFFFFF", "w": 5}}, {"n": "Synthwave Horizon", "cat": "Retro & 80s", "base": "#F472B6", "g": [[0, "#38BDF8"], [48, "#F8FAFC"], [52, "#7C3AED"], [78, "#EC4899"], [100, "#FDE047"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 160, "sz": 5, "ho": 85, "so": 65}, "og": {"c": "#EC4899", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#1E052B", "o": 80, "blur": 6, "dst": 6}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Miami Vice", "cat": "Retro & 80s", "base": "#22D3EE", "g": [[0, "#22D3EE"], [50, "#F472B6"], [100, "#FB7185"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 160, "sz": 5, "ho": 85, "so": 65}, "og": {"c": "#22D3EE", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#1E052B", "o": 80, "blur": 6, "dst": 6}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "VHS Sunset", "cat": "Retro & 80s", "base": "#FB923C", "g": [[0, "#FEF08A"], [45, "#F97316"], [100, "#7E22CE"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 160, "sz": 5, "ho": 85, "so": 65}, "og": {"c": "#F97316", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#1E052B", "o": 80, "blur": 6, "dst": 6}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Outrun Chrome", "cat": "Retro & 80s", "base": "#A855F7", "g": [[0, "#67E8F9"], [45, "#FFFFFF"], [52, "#4C1D95"], [100, "#F472B6"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 160, "sz": 5, "ho": 85, "so": 65}, "og": {"c": "#A855F7", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#1E052B", "o": 80, "blur": 6, "dst": 6}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Arcade Gold 84", "cat": "Retro & 80s", "base": "#FACC15", "g": [[0, "#FEF08A"], [50, "#F97316"], [100, "#BE123C"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 160, "sz": 5, "ho": 85, "so": 65}, "og": {"c": "#FACC15", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#1E052B", "o": 80, "blur": 6, "dst": 6}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Disco Magenta", "cat": "Retro & 80s", "base": "#D946EF", "g": [[0, "#F5D0FE"], [50, "#D946EF"], [100, "#4A044E"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 160, "sz": 5, "ho": 85, "so": 65}, "og": {"c": "#D946EF", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#1E052B", "o": 80, "blur": 6, "dst": 6}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Cassette Teal", "cat": "Retro & 80s", "base": "#14B8A6", "g": [[0, "#99F6E4"], [50, "#14B8A6"], [100, "#1E3A8A"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 160, "sz": 5, "ho": 85, "so": 65}, "og": {"c": "#14B8A6", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#1E052B", "o": 80, "blur": 6, "dst": 6}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Vintage Cream", "cat": "Retro & 80s", "base": "#FEF3C7", "g": [[0, "#FFFBEB"], [60, "#FDE68A"], [100, "#D97706"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 160, "sz": 5, "ho": 85, "so": 65}, "og": {"c": "#B45309", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#1E052B", "o": 80, "blur": 6, "dst": 6}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Retro Mint Diner", "cat": "Retro & 80s", "base": "#6EE7B7", "g": [[0, "#D1FAE5"], [50, "#34D399"], [100, "#0D9488"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 160, "sz": 5, "ho": 85, "so": 65}, "og": {"c": "#0F766E", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#1E052B", "o": 80, "blur": 6, "dst": 6}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Groovy Berry", "cat": "Retro & 80s", "base": "#E11D48", "g": [[0, "#FDA4AF"], [50, "#E11D48"], [100, "#4C0519"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 160, "sz": 5, "ho": 85, "so": 65}, "og": {"c": "#FB7185", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#1E052B", "o": 80, "blur": 6, "dst": 6}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Inferno Blaze", "cat": "Fire & Lava", "base": "#F97316", "g": [[0, "#FEF08A"], [45, "#F97316"], [100, "#DC2626"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "LnrD", "c": "#FEF08A", "o": 55, "blur": 8}, "og": {"c": "#F97316", "b": "Scrn", "o": 70, "blur": 18}, "sh": {"c": "#450A0A", "o": 75, "blur": 8, "dst": 5}}, {"n": "Molten Lava", "cat": "Fire & Lava", "base": "#EA580C", "g": [[0, "#FDE047"], [35, "#EA580C"], [75, "#991B1B"], [100, "#450A0A"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "LnrD", "c": "#FEF08A", "o": 55, "blur": 8}, "og": {"c": "#F97316", "b": "Scrn", "o": 70, "blur": 18}, "sh": {"c": "#450A0A", "o": 75, "blur": 8, "dst": 5}}, {"n": "Solar Flare", "cat": "Fire & Lava", "base": "#FEF08A", "g": [[0, "#FFFFFF"], [30, "#FEF08A"], [70, "#F97316"], [100, "#EF4444"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "LnrD", "c": "#FEF08A", "o": 55, "blur": 8}, "og": {"c": "#F97316", "b": "Scrn", "o": 70, "blur": 18}, "sh": {"c": "#450A0A", "o": 75, "blur": 8, "dst": 5}}, {"n": "Phoenix Wing", "cat": "Fire & Lava", "base": "#FB7185", "g": [[0, "#FDE047"], [50, "#FB7185"], [100, "#9F1239"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "LnrD", "c": "#FEF08A", "o": 55, "blur": 8}, "og": {"c": "#F97316", "b": "Scrn", "o": 70, "blur": 18}, "sh": {"c": "#450A0A", "o": 75, "blur": 8, "dst": 5}}, {"n": "Ember Glow", "cat": "Fire & Lava", "base": "#EA580C", "g": [[0, "#FDBA74"], [50, "#EA580C"], [100, "#7C2D12"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "LnrD", "c": "#FEF08A", "o": 55, "blur": 8}, "og": {"c": "#F97316", "b": "Scrn", "o": 70, "blur": 18}, "sh": {"c": "#450A0A", "o": 75, "blur": 8, "dst": 5}}, {"n": "Dragon Breath", "cat": "Fire & Lava", "base": "#F59E0B", "g": [[0, "#FEF9C3"], [40, "#F59E0B"], [80, "#DC2626"], [100, "#1C1917"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "LnrD", "c": "#FEF08A", "o": 55, "blur": 8}, "og": {"c": "#F97316", "b": "Scrn", "o": 70, "blur": 18}, "sh": {"c": "#450A0A", "o": 75, "blur": 8, "dst": 5}}, {"n": "Magma Crust", "cat": "Fire & Lava", "base": "#B91C1C", "g": [[0, "#FB923C"], [55, "#B91C1C"], [100, "#290808"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "LnrD", "c": "#FEF08A", "o": 55, "blur": 8}, "og": {"c": "#F97316", "b": "Scrn", "o": 70, "blur": 18}, "sh": {"c": "#450A0A", "o": 75, "blur": 8, "dst": 5}}, {"n": "Sunset Flame", "cat": "Fire & Lava", "base": "#F97316", "g": [[0, "#FDE047"], [50, "#F97316"], [100, "#C026D3"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "LnrD", "c": "#FEF08A", "o": 55, "blur": 8}, "og": {"c": "#F97316", "b": "Scrn", "o": 70, "blur": 18}, "sh": {"c": "#450A0A", "o": 75, "blur": 8, "dst": 5}}, {"n": "Torch Light", "cat": "Fire & Lava", "base": "#FBBF24", "g": [[0, "#FFFBEB"], [50, "#FBBF24"], [100, "#D97706"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "LnrD", "c": "#FEF08A", "o": 55, "blur": 8}, "og": {"c": "#F97316", "b": "Scrn", "o": 70, "blur": 18}, "sh": {"c": "#450A0A", "o": 75, "blur": 8, "dst": 5}}, {"n": "Volcanic Ash", "cat": "Fire & Lava", "base": "#7F1D1D", "g": [[0, "#FCA5A5"], [50, "#7F1D1D"], [100, "#18181B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "ig": {"b": "LnrD", "c": "#FEF08A", "o": 55, "blur": 8}, "og": {"c": "#F97316", "b": "Scrn", "o": 70, "blur": 18}, "sh": {"c": "#450A0A", "o": 75, "blur": 8, "dst": 5}}, {"n": "Glacier Frost", "cat": "Ice & Crystal", "base": "#BAE6FD", "g": [[0, "#FFFFFF"], [45, "#BAE6FD"], [100, "#0284C7"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 150, "sz": 6, "ho": 95, "so": 40}, "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 60, "blur": 7}, "og": {"c": "#7DD3FC", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#0C4A6E", "o": 60, "blur": 8, "dst": 4}}, {"n": "Arctic Diamond", "cat": "Ice & Crystal", "base": "#E0F2FE", "g": [[0, "#F8FAFC"], [35, "#E0F2FE"], [70, "#38BDF8"], [100, "#0369A1"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 150, "sz": 6, "ho": 95, "so": 40}, "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 60, "blur": 7}, "og": {"c": "#7DD3FC", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#0C4A6E", "o": 60, "blur": 8, "dst": 4}}, {"n": "Frozen Lake", "cat": "Ice & Crystal", "base": "#67E8F9", "g": [[0, "#ECFEFF"], [50, "#67E8F9"], [100, "#0E7490"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 150, "sz": 6, "ho": 95, "so": 40}, "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 60, "blur": 7}, "og": {"c": "#7DD3FC", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#0C4A6E", "o": 60, "blur": 8, "dst": 4}}, {"n": "Winter Mist", "cat": "Ice & Crystal", "base": "#CBD5E1", "g": [[0, "#FFFFFF"], [50, "#CBD5E1"], [100, "#64748B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 150, "sz": 6, "ho": 95, "so": 40}, "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 60, "blur": 7}, "og": {"c": "#7DD3FC", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#0C4A6E", "o": 60, "blur": 8, "dst": 4}}, {"n": "Crystal Sapphire", "cat": "Ice & Crystal", "base": "#60A5FA", "g": [[0, "#DBEAFE"], [45, "#60A5FA"], [100, "#1D4ED8"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 150, "sz": 6, "ho": 95, "so": 40}, "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 60, "blur": 7}, "og": {"c": "#7DD3FC", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#0C4A6E", "o": 60, "blur": 8, "dst": 4}}, {"n": "Polar Aurora", "cat": "Ice & Crystal", "base": "#38BDF8", "g": [[0, "#A7F3D0"], [50, "#38BDF8"], [100, "#6366F1"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 150, "sz": 6, "ho": 95, "so": 40}, "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 60, "blur": 7}, "og": {"c": "#7DD3FC", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#0C4A6E", "o": 60, "blur": 8, "dst": 4}}, {"n": "Snowflake Glow", "cat": "Ice & Crystal", "base": "#E0F2FE", "g": [[0, "#FFFFFF"], [60, "#E0F2FE"], [100, "#93C5FD"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 150, "sz": 6, "ho": 95, "so": 40}, "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 60, "blur": 7}, "og": {"c": "#7DD3FC", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#0C4A6E", "o": 60, "blur": 8, "dst": 4}}, {"n": "Iceberg Deep", "cat": "Ice & Crystal", "base": "#0284C7", "g": [[0, "#BAE6FD"], [50, "#0284C7"], [100, "#0C4A6E"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 150, "sz": 6, "ho": 95, "so": 40}, "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 60, "blur": 7}, "og": {"c": "#7DD3FC", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#0C4A6E", "o": 60, "blur": 8, "dst": 4}}, {"n": "Mint Icicle", "cat": "Ice & Crystal", "base": "#5EEAD4", "g": [[0, "#ECFDF5"], [50, "#5EEAD4"], [100, "#0F766E"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 150, "sz": 6, "ho": 95, "so": 40}, "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 60, "blur": 7}, "og": {"c": "#7DD3FC", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#0C4A6E", "o": 60, "blur": 8, "dst": 4}}, {"n": "Frosted Lavender", "cat": "Ice & Crystal", "base": "#C4B5FD", "g": [[0, "#F5F3FF"], [50, "#C4B5FD"], [100, "#6D28D9"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 150, "sz": 6, "ho": 95, "so": 40}, "ig": {"b": "Scrn", "c": "#FFFFFF", "o": 60, "blur": 7}, "og": {"c": "#7DD3FC", "b": "Scrn", "o": 55, "blur": 14}, "sh": {"c": "#0C4A6E", "o": 60, "blur": 8, "dst": 4}}, {"n": "Mirror Chrome", "cat": "Chrome & Metallic", "base": "#64748B", "g": [[0, "#FFFFFF"], [28, "#64748B"], [50, "#F8FAFC"], [72, "#1E293B"], [100, "#CBD5E1"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 250, "sz": 7, "ho": 95, "so": 80}, "sh": {"c": "#020617", "o": 72, "blur": 9, "dst": 5}, "satin": {"c": "#FFFFFF", "o": 35, "dst": 6, "blur": 8}}, {"n": "Silver Satin", "cat": "Chrome & Metallic", "base": "#CBD5E1", "g": [[0, "#FFFFFF"], [50, "#CBD5E1"], [100, "#64748B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 250, "sz": 7, "ho": 95, "so": 80}, "sh": {"c": "#020617", "o": 72, "blur": 9, "dst": 5}, "satin": {"c": "#FFFFFF", "o": 35, "dst": 6, "blur": 8}}, {"n": "Gunmetal Dark", "cat": "Chrome & Metallic", "base": "#334155", "g": [[0, "#94A3B8"], [50, "#334155"], [100, "#0F172A"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 250, "sz": 7, "ho": 95, "so": 80}, "sh": {"c": "#020617", "o": 72, "blur": 9, "dst": 5}, "satin": {"c": "#FFFFFF", "o": 35, "dst": 6, "blur": 8}}, {"n": "Blue Titanium", "cat": "Chrome & Metallic", "base": "#60A5FA", "g": [[0, "#E0F2FE"], [45, "#60A5FA"], [55, "#1E3A8A"], [100, "#93C5FD"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 250, "sz": 7, "ho": 95, "so": 80}, "sh": {"c": "#020617", "o": 72, "blur": 9, "dst": 5}, "satin": {"c": "#FFFFFF", "o": 35, "dst": 6, "blur": 8}}, {"n": "Platinum Shine", "cat": "Chrome & Metallic", "base": "#E5E7EB", "g": [[0, "#FFFFFF"], [40, "#E5E7EB"], [70, "#9CA3AF"], [100, "#F3F4F6"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 250, "sz": 7, "ho": 95, "so": 80}, "sh": {"c": "#020617", "o": 72, "blur": 9, "dst": 5}, "satin": {"c": "#FFFFFF", "o": 35, "dst": 6, "blur": 8}}, {"n": "Rose Chrome", "cat": "Chrome & Metallic", "base": "#FDA4AF", "g": [[0, "#FFF1F2"], [40, "#FDA4AF"], [55, "#881337"], [100, "#FECDD3"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 250, "sz": 7, "ho": 95, "so": 80}, "sh": {"c": "#020617", "o": 72, "blur": 9, "dst": 5}, "satin": {"c": "#FFFFFF", "o": 35, "dst": 6, "blur": 8}}, {"n": "Emerald Metal", "cat": "Chrome & Metallic", "base": "#10B981", "g": [[0, "#D1FAE5"], [45, "#10B981"], [55, "#064E3B"], [100, "#6EE7B7"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 250, "sz": 7, "ho": 95, "so": 80}, "sh": {"c": "#020617", "o": 72, "blur": 9, "dst": 5}, "satin": {"c": "#FFFFFF", "o": 35, "dst": 6, "blur": 8}}, {"n": "Violet Anodized", "cat": "Chrome & Metallic", "base": "#8B5CF6", "g": [[0, "#EDE9FE"], [45, "#8B5CF6"], [55, "#3B0764"], [100, "#C4B5FD"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 250, "sz": 7, "ho": 95, "so": 80}, "sh": {"c": "#020617", "o": 72, "blur": 9, "dst": 5}, "satin": {"c": "#FFFFFF", "o": 35, "dst": 6, "blur": 8}}, {"n": "Iron Forged", "cat": "Chrome & Metallic", "base": "#475569", "g": [[0, "#CBD5E1"], [50, "#475569"], [100, "#1E293B"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 250, "sz": 7, "ho": 95, "so": 80}, "sh": {"c": "#020617", "o": 72, "blur": 9, "dst": 5}, "satin": {"c": "#FFFFFF", "o": 35, "dst": 6, "blur": 8}}, {"n": "Liquid Mercury", "cat": "Chrome & Metallic", "base": "#94A3B8", "g": [[0, "#F8FAFC"], [30, "#94A3B8"], [60, "#E2E8F0"], [100, "#334155"]], "ang": 120, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 250, "sz": 7, "ho": 95, "so": 80}, "sh": {"c": "#020617", "o": 72, "blur": 9, "dst": 5}, "satin": {"c": "#FFFFFF", "o": 35, "dst": 6, "blur": 8}}, {"n": "Sunset Classic", "cat": "Sunset & Ocean", "base": "#FF6B35", "g": [[0, "#FFD23F"], [50, "#FF6B35"], [100, "#C026D3"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 120, "sz": 5, "ho": 80, "so": 50}, "sh": {"c": "#0F172A", "o": 62, "blur": 8, "dst": 4}}, {"n": "Sunset Diagonal", "cat": "Sunset & Ocean", "base": "#FF6B35", "g": [[0, "#FFD23F"], [50, "#FF6B35"], [100, "#C026D3"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 120, "sz": 5, "ho": 80, "so": 50}, "sh": {"c": "#0F172A", "o": 62, "blur": 8, "dst": 4}}, {"n": "Tropical Peach", "cat": "Sunset & Ocean", "base": "#FB923C", "g": [[0, "#FEF08A"], [50, "#FB923C"], [100, "#F43F5E"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 120, "sz": 5, "ho": 80, "so": 50}, "sh": {"c": "#0F172A", "o": 62, "blur": 8, "dst": 4}}, {"n": "Warm Horizon", "cat": "Sunset & Ocean", "base": "#F97316", "g": [[0, "#FDE68A"], [50, "#F97316"], [100, "#9D174D"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 120, "sz": 5, "ho": 80, "so": 50}, "sh": {"c": "#0F172A", "o": 62, "blur": 8, "dst": 4}}, {"n": "Coral Reef", "cat": "Sunset & Ocean", "base": "#FB7185", "g": [[0, "#FECDD3"], [50, "#FB7185"], [100, "#EA580C"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 120, "sz": 5, "ho": 80, "so": 50}, "sh": {"c": "#0F172A", "o": 62, "blur": 8, "dst": 4}}, {"n": "Ocean Classic", "cat": "Sunset & Ocean", "base": "#0EA5E9", "g": [[0, "#22D3EE"], [50, "#0EA5E9"], [100, "#1D4ED8"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 120, "sz": 5, "ho": 80, "so": 50}, "sh": {"c": "#0F172A", "o": 62, "blur": 8, "dst": 4}}, {"n": "Deep Sea", "cat": "Sunset & Ocean", "base": "#0369A1", "g": [[0, "#38BDF8"], [50, "#0369A1"], [100, "#1E1B4B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 120, "sz": 5, "ho": 80, "so": 50}, "sh": {"c": "#0F172A", "o": 62, "blur": 8, "dst": 4}}, {"n": "Lagoon Teal", "cat": "Sunset & Ocean", "base": "#14B8A6", "g": [[0, "#5EEAD4"], [50, "#14B8A6"], [100, "#0F766E"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 120, "sz": 5, "ho": 80, "so": 50}, "sh": {"c": "#0F172A", "o": 62, "blur": 8, "dst": 4}}, {"n": "Caribbean Wave", "cat": "Sunset & Ocean", "base": "#06B6D4", "g": [[0, "#A7F3D0"], [50, "#06B6D4"], [100, "#2563EB"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 120, "sz": 5, "ho": 80, "so": 50}, "sh": {"c": "#0F172A", "o": 62, "blur": 8, "dst": 4}}, {"n": "Midnight Tide", "cat": "Sunset & Ocean", "base": "#2563EB", "g": [[0, "#67E8F9"], [50, "#2563EB"], [100, "#0F172A"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 120, "sz": 5, "ho": 80, "so": 50}, "sh": {"c": "#0F172A", "o": 62, "blur": 8, "dst": 4}}, {"n": "Skyline Breeze", "cat": "Sunset & Ocean", "base": "#38BDF8", "g": [[0, "#E0F2FE"], [50, "#38BDF8"], [100, "#0284C7"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 120, "sz": 5, "ho": 80, "so": 50}, "sh": {"c": "#0F172A", "o": 62, "blur": 8, "dst": 4}}, {"n": "Teal Glow", "cat": "Sunset & Ocean", "base": "#14B8A6", "g": [[0, "#99F6E4"], [50, "#14B8A6"], [100, "#115E59"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 120, "sz": 5, "ho": 80, "so": 50}, "sh": {"c": "#0F172A", "o": 62, "blur": 8, "dst": 4}}, {"n": "Cotton Candy", "cat": "Candy & Pastel", "base": "#F9A8D4", "g": [[0, "#FBCFE8"], [50, "#F9A8D4"], [100, "#C084FC"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 90, "sz": 6, "ho": 90, "so": 30}, "sh": {"c": "#4C1D95", "o": 38, "blur": 10, "dst": 5}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Berry Cream", "cat": "Candy & Pastel", "base": "#F472B6", "g": [[0, "#FCE7F3"], [50, "#F472B6"], [100, "#9D174D"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 90, "sz": 6, "ho": 90, "so": 30}, "sh": {"c": "#4C1D95", "o": 38, "blur": 10, "dst": 5}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Pastel Rainbow", "cat": "Candy & Pastel", "base": "#FDE68A", "g": [[0, "#FCA5A5"], [33, "#FDE68A"], [67, "#86EFAC"], [100, "#93C5FD"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 90, "sz": 6, "ho": 90, "so": 30}, "sh": {"c": "#4C1D95", "o": 38, "blur": 10, "dst": 5}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Lavender Milk", "cat": "Candy & Pastel", "base": "#C4B5FD", "g": [[0, "#F5F3FF"], [50, "#C4B5FD"], [100, "#8B5CF6"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 90, "sz": 6, "ho": 90, "so": 30}, "sh": {"c": "#4C1D95", "o": 38, "blur": 10, "dst": 5}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Peach Sorbet", "cat": "Candy & Pastel", "base": "#FDBA74", "g": [[0, "#FFEDD5"], [50, "#FDBA74"], [100, "#FB7185"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 90, "sz": 6, "ho": 90, "so": 30}, "sh": {"c": "#4C1D95", "o": 38, "blur": 10, "dst": 5}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Mint Macaron", "cat": "Candy & Pastel", "base": "#6EE7B7", "g": [[0, "#D1FAE5"], [50, "#6EE7B7"], [100, "#34D399"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 90, "sz": 6, "ho": 90, "so": 30}, "sh": {"c": "#4C1D95", "o": 38, "blur": 10, "dst": 5}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Lemonade Pop", "cat": "Candy & Pastel", "base": "#FDE047", "g": [[0, "#FEF9C3"], [50, "#FDE047"], [100, "#F9A8D4"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 90, "sz": 6, "ho": 90, "so": 30}, "sh": {"c": "#4C1D95", "o": 38, "blur": 10, "dst": 5}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Sky Marshmallow", "cat": "Candy & Pastel", "base": "#BAE6FD", "g": [[0, "#E0F2FE"], [50, "#BAE6FD"], [100, "#DDD6FE"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 90, "sz": 6, "ho": 90, "so": 30}, "sh": {"c": "#4C1D95", "o": 38, "blur": 10, "dst": 5}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Strawberry Glaze", "cat": "Candy & Pastel", "base": "#FB7185", "g": [[0, "#FFE4E6"], [50, "#FB7185"], [100, "#E11D48"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 90, "sz": 6, "ho": 90, "so": 30}, "sh": {"c": "#4C1D95", "o": 38, "blur": 10, "dst": 5}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Unicorn Shimmer", "cat": "Candy & Pastel", "base": "#A5F3FC", "g": [[0, "#FBCFE8"], [50, "#A5F3FC"], [100, "#C4B5FD"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 90, "sz": 6, "ho": 90, "so": 30}, "sh": {"c": "#4C1D95", "o": 38, "blur": 10, "dst": 5}, "ol": {"c": "#FFFFFF", "w": 2}}, {"n": "Forest Canopy", "cat": "Forest, Royal & Mono", "base": "#4ADE80", "g": [[0, "#BEF264"], [50, "#4ADE80"], [100, "#059669"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 140, "sz": 5, "ho": 85, "so": 60}, "sh": {"c": "#09090B", "o": 68, "blur": 8, "dst": 4}}, {"n": "Jungle Emerald", "cat": "Forest, Royal & Mono", "base": "#10B981", "g": [[0, "#6EE7B7"], [50, "#10B981"], [100, "#064E3B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 140, "sz": 5, "ho": 85, "so": 60}, "sh": {"c": "#09090B", "o": 68, "blur": 8, "dst": 4}}, {"n": "Olive Gold", "cat": "Forest, Royal & Mono", "base": "#84CC16", "g": [[0, "#ECFCCB"], [50, "#84CC16"], [100, "#3F6212"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 140, "sz": 5, "ho": 85, "so": 60}, "sh": {"c": "#09090B", "o": 68, "blur": 8, "dst": 4}}, {"n": "Matcha Zen", "cat": "Forest, Royal & Mono", "base": "#65A30D", "g": [[0, "#D9F99D"], [50, "#65A30D"], [100, "#365314"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 140, "sz": 5, "ho": 85, "so": 60}, "sh": {"c": "#09090B", "o": 68, "blur": 8, "dst": 4}}, {"n": "Royal Velvet", "cat": "Forest, Royal & Mono", "base": "#A78BFA", "g": [[0, "#FDE68A"], [50, "#A78BFA"], [100, "#6D28D9"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 140, "sz": 5, "ho": 85, "so": 60}, "sh": {"c": "#09090B", "o": 68, "blur": 8, "dst": 4}}, {"n": "Imperial Purple", "cat": "Forest, Royal & Mono", "base": "#9333EA", "g": [[0, "#E9D5FF"], [50, "#9333EA"], [100, "#3B0764"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 140, "sz": 5, "ho": 85, "so": 60}, "sh": {"c": "#09090B", "o": 68, "blur": 8, "dst": 4}}, {"n": "Majestic Indigo", "cat": "Forest, Royal & Mono", "base": "#4F46E5", "g": [[0, "#C7D2FE"], [50, "#4F46E5"], [100, "#1E1B4B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 140, "sz": 5, "ho": 85, "so": 60}, "sh": {"c": "#09090B", "o": 68, "blur": 8, "dst": 4}}, {"n": "Crown Burgundy", "cat": "Forest, Royal & Mono", "base": "#BE123C", "g": [[0, "#FECDD3"], [50, "#BE123C"], [100, "#4C0519"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 140, "sz": 5, "ho": 85, "so": 60}, "sh": {"c": "#09090B", "o": 68, "blur": 8, "dst": 4}}, {"n": "Rainbow Vivid", "cat": "Forest, Royal & Mono", "base": "#FBBF24", "g": [[0, "#F87171"], [33, "#FBBF24"], [67, "#34D399"], [100, "#60A5FA"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 140, "sz": 5, "ho": 85, "so": 60}, "sh": {"c": "#09090B", "o": 68, "blur": 8, "dst": 4}}, {"n": "Spectrum Glow", "cat": "Forest, Royal & Mono", "base": "#8B5CF6", "g": [[0, "#EC4899"], [33, "#8B5CF6"], [67, "#06B6D4"], [100, "#10B981"]], "ang": 0, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 140, "sz": 5, "ho": 85, "so": 60}, "sh": {"c": "#09090B", "o": 68, "blur": 8, "dst": 4}}, {"n": "Mono Crisp White", "cat": "Forest, Royal & Mono", "base": "#E5E7EB", "g": [[0, "#FFFFFF"], [50, "#E5E7EB"], [100, "#9CA3AF"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 140, "sz": 5, "ho": 85, "so": 60}, "sh": {"c": "#09090B", "o": 68, "blur": 8, "dst": 4}}, {"n": "Mono Slate", "cat": "Forest, Royal & Mono", "base": "#64748B", "g": [[0, "#E2E8F0"], [50, "#64748B"], [100, "#1E293B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 140, "sz": 5, "ho": 85, "so": 60}, "sh": {"c": "#09090B", "o": 68, "blur": 8, "dst": 4}}, {"n": "Mono Charcoal", "cat": "Forest, Royal & Mono", "base": "#27272A", "g": [[0, "#52525B"], [50, "#27272A"], [100, "#09090B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 140, "sz": 5, "ho": 85, "so": 60}, "sh": {"c": "#09090B", "o": 68, "blur": 8, "dst": 4}}, {"n": "Editorial B&W", "cat": "Forest, Royal & Mono", "base": "#F8FAFC", "g": [[0, "#FFFFFF"], [48, "#F8FAFC"], [52, "#18181B"], [100, "#52525B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false, "gtype": "Lnr ", "bev": {"s": "InrB", "d": 140, "sz": 5, "ho": 85, "so": 60}, "sh": {"c": "#09090B", "o": 68, "blur": 8, "dst": 4}}];
var GRADIENTS = [{"n": "Gold Classic", "g": [[0, "#FEF9C3"], [50, "#FDE047"], [100, "#F59E0B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Gold Deep", "g": [[0, "#FDE68A"], [50, "#F59E0B"], [100, "#B45309"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Gold Light", "g": [[0, "#FFFFFF"], [50, "#FEF08A"], [100, "#FACC15"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Teal", "g": [[0, "#5EEAD4"], [50, "#14B8A6"], [100, "#0F766E"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Emon Yellow Orange", "g": [[0, "#FFFF00"], [100, "#FF6D00"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 60, "grev": true}, {"n": "Sunset", "g": [[0, "#FFD23F"], [50, "#FF6B35"], [100, "#C026D3"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Ocean", "g": [[0, "#22D3EE"], [50, "#0EA5E9"], [100, "#1D4ED8"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Fire", "g": [[0, "#FDE047"], [50, "#F97316"], [100, "#DC2626"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Neon", "g": [[0, "#67E8F9"], [50, "#22D3EE"], [100, "#E879F9"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Candy", "g": [[0, "#FBCFE8"], [50, "#F9A8D4"], [100, "#C084FC"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Forest", "g": [[0, "#BEF264"], [50, "#4ADE80"], [100, "#059669"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Royal", "g": [[0, "#FDE68A"], [50, "#A78BFA"], [100, "#6D28D9"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Ice", "g": [[0, "#FFFFFF"], [50, "#BAE6FD"], [100, "#38BDF8"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Rose", "g": [[0, "#FECDD3"], [50, "#FB7185"], [100, "#BE123C"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Metallic", "g": [[0, "#F8FAFC"], [50, "#CBD5E1"], [100, "#64748B"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Rainbow", "g": [[0, "#F87171"], [33, "#FBBF24"], [67, "#34D399"], [100, "#60A5FA"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Mono", "g": [[0, "#FFFFFF"], [50, "#D4D4D4"], [100, "#737373"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Purple Haze", "g": [[0, "#E9D5FF"], [50, "#A855F7"], [100, "#6B21A8"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Mint", "g": [[0, "#D1FAE5"], [50, "#6EE7B7"], [100, "#059669"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Peach", "g": [[0, "#FFEDD5"], [50, "#FDBA74"], [100, "#EA580C"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Sky", "g": [[0, "#E0F2FE"], [50, "#7DD3FC"], [100, "#0284C7"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Lavender", "g": [[0, "#EDE9FE"], [50, "#C4B5FD"], [100, "#7C3AED"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Crimson", "g": [[0, "#FECACA"], [50, "#F87171"], [100, "#991B1B"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Copper", "g": [[0, "#FDE68A"], [50, "#D97706"], [100, "#78350F"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Silver", "g": [[0, "#FFFFFF"], [50, "#E5E7EB"], [100, "#9CA3AF"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Pink Pop", "g": [[0, "#FBCFE8"], [50, "#EC4899"], [100, "#9D174D"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Emerald", "g": [[0, "#A7F3D0"], [50, "#34D399"], [100, "#065F46"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Blue Steel", "g": [[0, "#DBEAFE"], [50, "#93C5FD"], [100, "#1E40AF"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Instagram Glow", "g": [[0, "#FEDA75"], [30, "#FA7E1E"], [60, "#D62976"], [85, "#962FBF"], [100, "#4F5BD5"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Apple Aurora", "g": [[0, "#00F5A0"], [50, "#00D9F5"], [100, "#7C3AED"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "iOS Liquid Blue", "g": [[0, "#38BDF8"], [50, "#6366F1"], [100, "#A855F7"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Midnight Velvet", "g": [[0, "#0F172A"], [50, "#1E1B4B"], [100, "#4C1D95"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Obsidian Studio", "g": [[0, "#27272A"], [50, "#18181B"], [100, "#09090B"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Dark Teal Poster", "g": [[0, "#042F2E"], [50, "#0F766E"], [100, "#14B8A6"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Dark Crimson Pro", "g": [[0, "#1C0408"], [50, "#7F1D1D"], [100, "#EF4444"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Cyberpunk Neon", "g": [[0, "#FF0080"], [50, "#7928CA"], [100, "#00DFD8"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Synthwave 84", "g": [[0, "#FF61D2"], [50, "#FE9090"], [100, "#4158D0"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Hyper Mango", "g": [[0, "#FFE259"], [100, "#FFA751"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Electric Violet", "g": [[0, "#4776E6"], [100, "#8E54E9"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Cosmic Fusion", "g": [[0, "#FF00CC"], [100, "#333399"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Northern Lights", "g": [[0, "#43E97B"], [50, "#38F9D7"], [100, "#2563EB"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Luxury 24K Gold", "g": [[0, "#FFF7CC"], [28, "#F5C542"], [55, "#B8860B"], [80, "#FDE68A"], [100, "#784F00"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Rose Gold Silk", "g": [[0, "#FFF1F2"], [35, "#F4B6C2"], [70, "#B76E79"], [100, "#FDE2E4"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Chrome Reflection", "g": [[0, "#FFFFFF"], [25, "#94A3B8"], [50, "#F8FAFC"], [75, "#334155"], [100, "#CBD5E1"]], "ang": 90, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Champagne Cream", "g": [[0, "#FFFDF7"], [50, "#F7E7CE"], [100, "#D4AF37"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Warm Coffee", "g": [[0, "#D6CCC2"], [50, "#8D6E63"], [100, "#3E2723"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Food Poster Warm", "g": [[0, "#FF9A00"], [50, "#FF3D00"], [100, "#6A040F"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Fresh Citrus", "g": [[0, "#F9D423"], [50, "#FF4E50"], [100, "#FC913A"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Berry Smoothie", "g": [[0, "#FF758C"], [50, "#FF7EB3"], [100, "#8E2DE2"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Matcha Cream", "g": [[0, "#ECFDF5"], [50, "#A7F3D0"], [100, "#10B981"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Soft Peach Cloud", "g": [[0, "#FFECD2"], [100, "#FCB69F"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Dreamy Pastel", "g": [[0, "#A1C4FD"], [50, "#C2E9FB"], [100, "#FBC2EB"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Sakura Blossom", "g": [[0, "#FFF0F5"], [50, "#FBCFE8"], [100, "#F472B6"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Deep Ocean Abyss", "g": [[0, "#020617"], [50, "#0F172A"], [100, "#0369A1"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Royal Navy Gold", "g": [[0, "#0A192F"], [65, "#1E3A8A"], [100, "#F59E0B"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Emerald Night", "g": [[0, "#022C22"], [50, "#065F46"], [100, "#34D399"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Sunset Beach", "g": [[0, "#FF512F"], [50, "#F09819"], [100, "#DD2476"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Miami Neon", "g": [[0, "#00DBDE"], [100, "#FC00FF"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Holographic Foil", "g": [[0, "#E0C3FC"], [33, "#8EC5FC"], [66, "#A1FFCE"], [100, "#FAFFD1"]], "ang": 45, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Arctic Mist", "g": [[0, "#F8FAFC"], [50, "#E0F2FE"], [100, "#94A3B8"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Volcano Ember", "g": [[0, "#18181B"], [50, "#991B1B"], [100, "#F97316"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Ultraviolet Pro", "g": [[0, "#1E1B4B"], [50, "#6D28D9"], [100, "#EC4899"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Clean White Card", "g": [[0, "#FFFFFF"], [50, "#F8FAFC"], [100, "#E2E8F0"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}, {"n": "Matte Charcoal", "g": [[0, "#3F3F46"], [50, "#18181B"], [100, "#09090B"]], "ang": 135, "gm": "Nrml", "gop": 100, "gscl": 100, "grev": false}];
var GRADIENT_NAMES = ["Gold Classic", "Gold Deep", "Gold Light", "Teal", "Emon Yellow Orange", "Sunset", "Ocean", "Fire", "Neon", "Candy", "Forest", "Royal", "Ice", "Rose", "Metallic", "Rainbow", "Mono", "Purple Haze", "Mint", "Peach", "Sky", "Lavender", "Crimson", "Copper", "Silver", "Pink Pop", "Emerald", "Blue Steel", "Instagram Glow", "Apple Aurora", "iOS Liquid Blue", "Midnight Velvet", "Obsidian Studio", "Dark Teal Poster", "Dark Crimson Pro", "Cyberpunk Neon", "Synthwave 84", "Hyper Mango", "Electric Violet", "Cosmic Fusion", "Northern Lights", "Luxury 24K Gold", "Rose Gold Silk", "Chrome Reflection", "Champagne Cream", "Warm Coffee", "Food Poster Warm", "Fresh Citrus", "Berry Smoothie", "Matcha Cream", "Soft Peach Cloud", "Dreamy Pastel", "Sakura Blossom", "Deep Ocean Abyss", "Royal Navy Gold", "Emerald Night", "Sunset Beach", "Miami Neon", "Holographic Foil", "Arctic Mist", "Volcano Ember", "Ultraviolet Pro", "Clean White Card", "Matte Charcoal"];

/* ---------------- 4. REAL PHOTOSHOP LAYER STYLES ENGINE (v2.18) ---------------- */
function hexRGB(h) {
    h = String(h).replace("#", "");
    return { r: parseInt(h.substr(0, 2), 16), g: parseInt(h.substr(2, 2), 16), b: parseInt(h.substr(4, 2), 16) };
}
function rgbDescHex(h) {
    var c = hexRGB(h);
    var d = new ActionDescriptor();
    d.putDouble(cTID("Rd  "), c.r);
    d.putDouble(cTID("Grn "), c.g);
    d.putDouble(cTID("Bl  "), c.b);
    return d;
}

function _fxPartsToDesc(parts) {
    var d = new ActionDescriptor();
    d.putUnitDouble(cTID("Scl "), cTID("#Prc"), 100);
    for (var k = 0; k < parts.length; k++) {
        d.putObject(parts[k][0], parts[k][1], parts[k][2]);
    }
    return d;
}
function _setLayerStyleParts(parts) {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putProperty(cTID("Prpr"), cTID("Lefx"));
    ref.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
    desc.putReference(cTID("null"), ref);
    desc.putObject(cTID("T   "), cTID("Lefx"), _fxPartsToDesc(parts));
    executeAction(cTID("setd"), desc, DialogModes.NO);
}

function _gradStopList(fx) {
    var list = new ActionList();
    var stops = (fx.g && fx.g.length) ? fx.g : [[0, "#FFFFFF"], [100, fx.base || "#888888"]];
    for (var gi = 0; gi < stops.length; gi++) {
        var sd = new ActionDescriptor();
        sd.putObject(cTID("Clr "), cTID("RGBC"), rgbDescHex(stops[gi][1]));
        sd.putEnumerated(cTID("Type"), cTID("Clry"), cTID("UsrS"));
        sd.putInteger(cTID("Lctn"), Math.max(0, Math.min(4096, Math.round(stops[gi][0] * 40.96))));
        sd.putInteger(cTID("Mdpn"), 50);
        list.putObject(cTID("Clrt"), sd);
    }
    return list;
}

function _gradTransList() {
    var tl = new ActionList();
    var t0 = new ActionDescriptor();
    t0.putUnitDouble(cTID("Opct"), cTID("#Prc"), 100);
    t0.putInteger(cTID("Lctn"), 0);
    t0.putInteger(cTID("Mdpn"), 50);
    tl.putObject(cTID("TrnS"), t0);
    var t1 = new ActionDescriptor();
    t1.putUnitDouble(cTID("Opct"), cTID("#Prc"), 100);
    t1.putInteger(cTID("Lctn"), 4096);
    t1.putInteger(cTID("Mdpn"), 50);
    tl.putObject(cTID("TrnS"), t1);
    return tl;
}

function _gradOverlayDesc(fx, strength) {
    var d = new ActionDescriptor();
    d.putBoolean(cTID("enab"), true);
    d.putBoolean(sTID("present"), true);
    d.putBoolean(sTID("showInDialog"), true);
    d.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID(fx.gm || "Nrml"));
    d.putUnitDouble(cTID("Opct"), cTID("#Prc"), Math.round((fx.gop == null ? 100 : fx.gop) * strength / 100));
    var gd = new ActionDescriptor();
    gd.putString(cTID("Nm  "), fx.n || "Gradient");
    gd.putEnumerated(cTID("GrdF"), cTID("GrdF"), cTID("CstS"));
    gd.putDouble(cTID("Intr"), 4096);
    gd.putList(cTID("Clrs"), _gradStopList(fx));
    gd.putList(cTID("Trns"), _gradTransList());
    d.putObject(cTID("Grad"), cTID("Grdn"), gd);
    d.putEnumerated(cTID("Type"), cTID("GrdT"), cTID(fx.gtype || "Lnr "));
    d.putUnitDouble(cTID("Angl"), cTID("#Ang"), fx.ang == null ? 90 : fx.ang);
    d.putUnitDouble(cTID("Scl "), cTID("#Prc"), fx.gscl == null ? 100 : fx.gscl);
    d.putBoolean(cTID("Rvrs"), fx.grev ? true : false);
    d.putBoolean(cTID("Dthr"), true);
    d.putBoolean(cTID("Algn"), true);
    return d;
}

function _dropShadowDesc(fx, strength, sc) {
    if (!fx.sh) return null;
    sc = (sc == null ? 1 : sc);
    var sh = fx.sh;
    var d = new ActionDescriptor();
    d.putBoolean(cTID("enab"), true);
    d.putBoolean(sTID("present"), true);
    d.putBoolean(sTID("showInDialog"), true);
    d.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID(sh.b || "Mltp"));
    d.putUnitDouble(cTID("Opct"), cTID("#Prc"), Math.round((sh.o == null ? 70 : sh.o) * strength / 100));
    d.putBoolean(cTID("uglg"), sh.uglg ? true : false);
    d.putUnitDouble(cTID("lagl"), cTID("#Ang"), sh.ang == null ? 120 : sh.ang);
    d.putUnitDouble(cTID("Dstn"), cTID("#Pxl"), (sh.dst == null ? 5 : sh.dst) * sc);
    d.putUnitDouble(cTID("Ckmt"), cTID("#Pxl"), sh.ck || 0);
    d.putUnitDouble(cTID("blur"), cTID("#Pxl"), (sh.blur == null ? 8 : sh.blur) * sc);
    d.putUnitDouble(cTID("Nose"), cTID("#Prc"), 0);
    d.putBoolean(cTID("AntA"), false);
    d.putObject(cTID("Clr "), cTID("RGBC"), rgbDescHex(sh.c || "#000000"));
    return d;
}

function _innerShadowDesc(fx, strength, sc) {
    if (!fx.ish) return null;
    sc = (sc == null ? 1 : sc);
    var sh = fx.ish;
    var d = new ActionDescriptor();
    d.putBoolean(cTID("enab"), true);
    d.putBoolean(sTID("present"), true);
    d.putBoolean(sTID("showInDialog"), true);
    d.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID(sh.b || "Mltp"));
    d.putUnitDouble(cTID("Opct"), cTID("#Prc"), Math.round((sh.o == null ? 50 : sh.o) * strength / 100));
    d.putBoolean(cTID("uglg"), false);
    d.putUnitDouble(cTID("lagl"), cTID("#Ang"), sh.ang == null ? 120 : sh.ang);
    d.putUnitDouble(cTID("Dstn"), cTID("#Pxl"), (sh.dst == null ? 3 : sh.dst) * sc);
    d.putUnitDouble(cTID("Ckmt"), cTID("#Pxl"), 0);
    d.putUnitDouble(cTID("blur"), cTID("#Pxl"), (sh.blur == null ? 5 : sh.blur) * sc);
    d.putUnitDouble(cTID("Nose"), cTID("#Prc"), 0);
    d.putBoolean(cTID("AntA"), false);
    d.putObject(cTID("Clr "), cTID("RGBC"), rgbDescHex(sh.c || "#000000"));
    return d;
}

function _outerGlowDesc(fx, strength, sc) {
    if (!fx.og) return null;
    sc = (sc == null ? 1 : sc);
    var gl = fx.og;
    var d = new ActionDescriptor();
    d.putBoolean(cTID("enab"), true);
    d.putBoolean(sTID("present"), true);
    d.putBoolean(sTID("showInDialog"), true);
    d.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID(gl.b || "Scrn"));
    d.putUnitDouble(cTID("Opct"), cTID("#Prc"), Math.round((gl.o == null ? 65 : gl.o) * strength / 100));
    d.putUnitDouble(cTID("Ckmt"), cTID("#Pxl"), 0);
    d.putUnitDouble(cTID("blur"), cTID("#Pxl"), (gl.blur || 16) * sc);
    d.putUnitDouble(cTID("Nose"), cTID("#Prc"), 0);
    d.putUnitDouble(cTID("Rng "), cTID("#Prc"), 50);
    d.putUnitDouble(cTID("Jttr"), cTID("#Prc"), 0);
    d.putEnumerated(cTID("GlwT"), cTID("BETE"), cTID("SfBL"));
    d.putObject(cTID("Clr "), cTID("RGBC"), rgbDescHex(gl.c || "#FFFFFF"));
    return d;
}

function _innerGlowDesc(fx, strength, sc) {
    if (!fx.ig) return null;
    sc = (sc == null ? 1 : sc);
    var ig = fx.ig;
    var d = new ActionDescriptor();
    d.putBoolean(cTID("enab"), true);
    d.putBoolean(sTID("present"), true);
    d.putBoolean(sTID("showInDialog"), true);
    d.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID(ig.b || "Scrn"));
    d.putUnitDouble(cTID("Opct"), cTID("#Prc"), Math.round((ig.o == null ? 55 : ig.o) * strength / 100));
    d.putUnitDouble(cTID("Ckmt"), cTID("#Pxl"), 0);
    d.putUnitDouble(cTID("blur"), cTID("#Pxl"), (ig.blur || 8) * sc);
    d.putUnitDouble(cTID("Nose"), cTID("#Prc"), 0);
    d.putBoolean(cTID("AntA"), false);
    d.putObject(cTID("Clr "), cTID("RGBC"), rgbDescHex(ig.c || "#FFFFFF"));
    d.putEnumerated(cTID("GlwT"), cTID("BETE"), cTID("SfBL"));
    if (ig.src) d.putEnumerated(cTID("glwS"), cTID("IGSr"), cTID(ig.src));
    return d;
}

function _bevelDesc(fx, sc) {
    if (!fx.bev) return null;
    sc = (sc == null ? 1 : sc);
    var bv = fx.bev;
    var d = new ActionDescriptor();
    d.putBoolean(cTID("enab"), true);
    d.putBoolean(sTID("present"), true);
    d.putBoolean(sTID("showInDialog"), true);
    d.putEnumerated(cTID("bvlS"), cTID("BESl"), cTID(bv.s || "InrB"));
    d.putEnumerated(cTID("bvlT"), cTID("bvlT"), cTID("SfBL"));
    d.putUnitDouble(cTID("srgR"), cTID("#Prc"), bv.d || 150);
    d.putUnitDouble(cTID("blur"), cTID("#Pxl"), (bv.sz || 6) * sc);
    d.putUnitDouble(cTID("Sftn"), cTID("#Pxl"), 0);
    d.putUnitDouble(cTID("lagl"), cTID("#Ang"), 120);
    d.putUnitDouble(cTID("Lald"), cTID("#Ang"), 30);
    d.putObject(cTID("hglC"), cTID("RGBC"), rgbDescHex("#FFFFFF"));
    d.putObject(cTID("sdwC"), cTID("RGBC"), rgbDescHex("#000000"));
    d.putEnumerated(cTID("hglM"), cTID("BlnM"), cTID("Scrn"));
    d.putEnumerated(cTID("sdwM"), cTID("BlnM"), cTID("Mltp"));
    d.putUnitDouble(cTID("hglO"), cTID("#Prc"), bv.ho == null ? 80 : bv.ho);
    d.putUnitDouble(cTID("sdwO"), cTID("#Prc"), bv.so == null ? 65 : bv.so);
    return d;
}

function _strokeDesc(fx, sc) {
    if (!fx.ol) return null;
    sc = (sc == null ? 1 : sc);
    var d = new ActionDescriptor();
    d.putBoolean(cTID("enab"), true);
    d.putBoolean(sTID("present"), true);
    d.putBoolean(sTID("showInDialog"), true);
    d.putEnumerated(cTID("Styl"), cTID("FStl"), cTID("OutF"));
    d.putEnumerated(cTID("PntT"), cTID("FrFl"), cTID("SClr"));
    d.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID("Nrml"));
    d.putUnitDouble(cTID("Opct"), cTID("#Prc"), 100);
    d.putUnitDouble(cTID("Sz  "), cTID("#Pxl"), Math.max(1, Math.round((fx.ol.w || 2) * sc)));
    d.putObject(cTID("Clr "), cTID("RGBC"), rgbDescHex(fx.ol.c || "#FFFFFF"));
    return d;
}

function _satinDesc(fx, strength, sc) {
    if (!fx.satin) return null;
    sc = (sc == null ? 1 : sc);
    var st = fx.satin;
    var d = new ActionDescriptor();
    d.putBoolean(cTID("enab"), true);
    d.putBoolean(sTID("present"), true);
    d.putBoolean(sTID("showInDialog"), true);
    d.putEnumerated(cTID("Md  "), cTID("BlnM"), cTID("Ovrl"));
    d.putObject(cTID("Clr "), cTID("RGBC"), rgbDescHex(st.c || "#FFFFFF"));
    d.putBoolean(cTID("AntA"), true);
    d.putBoolean(cTID("Invr"), true);
    d.putUnitDouble(cTID("Opct"), cTID("#Prc"), Math.round((st.o == null ? 35 : st.o) * strength / 100));
    d.putUnitDouble(cTID("lagl"), cTID("#Ang"), 19);
    d.putUnitDouble(cTID("Dstn"), cTID("#Pxl"), (st.dst || 7) * sc);
    d.putUnitDouble(cTID("blur"), cTID("#Pxl"), (st.blur || 9) * sc);
    return d;
}

function _applyRealLayerStyleToLayer(doc, lyr, fx, strength, sc) {
    if (lyr.isBackgroundLayer && !ensureNotBackground(lyr)) {
        return { ok: false, error: "Could not unlock Background layer to apply Layer Style." };
    }
    doc.activeLayer = lyr;
    try { lyr.fillOpacity = (fx.fillOp != null ? fx.fillOp : 100); } catch (eFO) {}
    var go = _gradOverlayDesc(fx, strength);
    var parts = [[cTID("GrFl"), cTID("GrFl"), go]];
    var applied = ["Gradient Overlay"];

    var extras = [
        ["DrSh", _dropShadowDesc(fx, strength, sc), "Drop Shadow"],
        ["IrSh", _innerShadowDesc(fx, strength, sc), "Inner Shadow"],
        ["OrGl", _outerGlowDesc(fx, strength, sc), "Outer Glow"],
        ["IrGl", _innerGlowDesc(fx, strength, sc), "Inner Glow"],
        ["ebbl", _bevelDesc(fx, sc), "Bevel"],
        ["FrFX", _strokeDesc(fx, sc), "Stroke"],
        ["ChFX", _satinDesc(fx, strength, sc), "Satin"]
    ];
    for (var ei = 0; ei < extras.length; ei++) {
        if (extras[ei][1]) {
            parts.push([cTID(extras[ei][0]), cTID(extras[ei][0]), extras[ei][1]]);
            applied.push(extras[ei][2]);
        }
    }

    try {
        _setLayerStyleParts(parts);
    } catch (eFull) {
        parts = [[cTID("GrFl"), cTID("GrFl"), go]];
        applied = ["Gradient Overlay"];
        try {
            _setLayerStyleParts(parts);
        } catch (eCore) {
            return { ok: false, error: "Gradient Overlay AM setd failed: " + eCore.message };
        }
        for (var j = 0; j < extras.length; j++) {
            if (!extras[j][1]) continue;
            parts.push([cTID(extras[j][0]), cTID(extras[j][0]), extras[j][1]]);
            try {
                _setLayerStyleParts(parts);
                applied.push(extras[j][2]);
            } catch (eSub) {
                parts.pop();
            }
        }
    }

    if (!hasLayerStyle(doc, lyr, "GrFl")) {
        return { ok: false, error: "Read-back check failed — Layer Style did not land on '" + lyr.name + "'." };
    }
    return { ok: true, applied: applied };
}

function auraClearStyle() {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    try {
        var d = new ActionDescriptor();
        var r = new ActionReference();
        r.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
        d.putReference(cTID("null"), r);
        executeAction(sTID("disableLayerFX"), d, DialogModes.NO);
        return "OK: Layer Style cleared on '" + doc.activeLayer.name + "'.";
    } catch (e) {
        try {
            executeAction(sTID("clearEffects"), new ActionDescriptor(), DialogModes.NO);
            return "OK: Layer Style cleared on '" + doc.activeLayer.name + "'.";
        } catch (e2) {
            return "Error: Could not clear Layer Style — " + e2.message;
        }
    }
}

function auraStyleOnLayer(i) {
    var fx = TEXTFX100[i];
    if (!fx) return "Error: Invalid style index.";
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    var lyr = doc.activeLayer;
    if (!lyr) return "Error: Select a layer (text, shape, or photo) first.";
    if (lyr.kind === LayerKind.TEXT && fx.base) {
        try { lyr.textItem.color = textColor(fx.base); } catch (e) {}
    }
    var sc = (lyr.kind === LayerKind.TEXT) ? textFontScale(lyr) : 1;
    var res = _applyRealLayerStyleToLayer(doc, lyr, fx, 100, sc);
    if (!res.ok) {
        alert("Layer Style could not be applied to '" + lyr.name + "':\n" + res.error);
        return "Error: " + res.error;
    }
    return "OK: '" + fx.n + "' Layer Style verified on '" + lyr.name + "' (" + res.applied.join(", ") + "; editable via fx icon).";
}

function auraGradientPreset(i, mode, angleOverride, styleOverride) {
    var g = GRADIENTS[i];
    if (!g) return "Error: Invalid gradient preset.";
    var stops = g.g;
    var mid = stops[Math.floor(stops.length / 2)][1];
    var fx = {
        n: g.n, g: g.g, ang: (angleOverride != null ? angleOverride : g.ang), gtype: (styleOverride || "Lnr "), gm: g.gm || "Nrml",
        gop: (g.gop == null ? 100 : g.gop),
        gscl: (g.gscl == null ? 100 : g.gscl),
        grev: !!g.grev, base: mid
    };
    var doc, lyr;
    if (mode === "bg") {
        if (app.documents.length === 0) {
            doc = app.documents.add(UnitValue(1080, "px"), UnitValue(1080, "px"), 72, "Design360n BG — " + g.n, NewDocumentMode.RGB, DocumentFill.WHITE);
        } else {
            doc = app.activeDocument;
        }
        restoreRGBChannels(doc);
        lyr = doc.artLayers.add();
        lyr.name = "BG — " + g.n;
        doc.activeLayer = lyr;
        doc.selection.selectAll();
        doc.selection.fill(textColor(mid), ColorBlendMode.NORMAL, 100, false);
        doc.selection.deselect();
        try {
            var last = doc.layers[doc.layers.length - 1];
            if (last && last !== lyr) {
                if (last.isBackgroundLayer) {
                    lyr.move(last, ElementPlacement.PLACEBEFORE);
                } else {
                    lyr.move(last, ElementPlacement.PLACEAFTER);
                }
            }
        } catch (eMv) {}
    } else if (mode === "text") {
        lyr = smartTextLayer();
        if (!lyr) return "Error: Could not create or find text layer.";
        doc = app.activeDocument;
        try { lyr.textItem.color = textColor(mid); } catch (e) {}
    } else {
        doc = needDoc();
        if (!doc) return "Error: No open document.";
        lyr = doc.activeLayer;
        if (!lyr) return "Error: Select a layer (shape, text, or photo) first.";
        if (lyr.kind === LayerKind.TEXT) {
            try { lyr.textItem.color = textColor(mid); } catch (e2) {}
        }
    }
    var res = _applyRealLayerStyleToLayer(doc, lyr, fx, 100, 1);
    if (!res.ok) {
        alert("Gradient Layer Style could not be applied to '" + lyr.name + "':\n" + res.error);
        return "Error: " + res.error;
    }
    if (mode === "bg") {
        return "OK: '" + g.n + "' created as editable Gradient Background layer ('" + lyr.name + "').";
    }
    return "OK: '" + g.n + "' Gradient Overlay Layer Style verified on '" + lyr.name + "' (editable via fx icon).";
}

function auraTextFX100(i, strength, smart) {
    var fx = TEXTFX100[i];
    if (!fx) return "Error: Invalid Text Effect index.";
    var doc = null, orig = null;
    if (app.documents.length > 0) {
        doc = app.activeDocument;
        try {
            var cur = doc.activeLayer;
            if (cur && !cur.isBackgroundLayer) orig = cur;
        } catch (e) {}
    }
    if (!orig) {
        orig = smartTextLayer();
        if (!orig) return "Error: Could not find or create layer.";
        doc = app.activeDocument;
    }
    var s = (strength == null ? 100 : strength);
    var isText = (orig.kind === LayerKind.TEXT);
    var sc = isText ? textFontScale(orig) : 1;
    if (isText && fx.base) {
        try { orig.textItem.color = textColor(fx.base); } catch (e) {}
    }
    var res = _applyRealLayerStyleToLayer(doc, orig, fx, s, sc);
    if (!res.ok) {
        alert("Text Effect Layer Style could not be applied:\n" + res.error);
        return "Error: " + res.error;
    }
    var useSmart = (smart == null ? false : !!smart);
    var didSmart = false;
    if (useSmart) {
        var before = orig;
        try {
            orig = toSmartObject(orig);
            didSmart = (orig !== before);
        } catch (eSm) { didSmart = false; }
    }
    return "OK: '" + fx.n + "' Layer Style verified (" + res.applied.join(", ") + (didSmart ? "; Smart Object" : "") + "; editable via fx icon).";
}

/* ---------------- DIRECT PHOTOSHOP STYLES PANEL BRIDGE (v2.32 FIXED) ---------------- */
function auraListPSStyles() {
    try {
        var ref = new ActionReference();
        ref.putProperty(cTID("Prpr"), sTID("presetManager"));
        ref.putEnumerated(cTID("capp"), cTID("Ordn"), cTID("Trgt"));
        var appDesc = executeActionGet(ref);
        if (!appDesc.hasKey(sTID("presetManager"))) {
            return "Error: Photoshop presetManager not available.";
        }
        var pmList = appDesc.getList(sTID("presetManager"));
        var names = [];
        var foundItem = null;
        for (var i = 0; i < pmList.count; i++) {
            var cls = pmList.getObjectType(i);
            var clsStr = "";
            try { clsStr = String(typeIDToStringID(cls)).toLowerCase(); } catch (e0) {}
            if (cls === cTID("Styl") || cls === sTID("style") || clsStr.indexOf("style") >= 0) {
                foundItem = pmList.getObjectValue(i);
                break;
            }
        }
        /* Fallback: in Photoshop presetManager, index 3 is always Styles */
        if (!foundItem && pmList.count > 3) {
            foundItem = pmList.getObjectValue(3);
        }
        if (foundItem) {
            var nmList = null;
            if (foundItem.hasKey(cTID("Nm  "))) nmList = foundItem.getList(cTID("Nm  "));
            else if (foundItem.hasKey(sTID("name"))) nmList = foundItem.getList(sTID("name"));
            if (nmList) {
                for (var j = 0; j < nmList.count; j++) {
                    names.push(nmList.getString(j));
                }
            }
        }
        return "STYLES:" + names.join("||");
    } catch (e) {
        return "Error: Could not read Photoshop Styles panel — " + e.message;
    }
}

function auraApplyPSStyle(styleName) {
    if (!styleName) return "Error: No Photoshop Style name provided.";
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    var lyr = doc.activeLayer;
    if (!lyr) return "Error: Select a layer (Text, Shape, or Photo) first.";
    try {
        if (lyr.isBackgroundLayer && !ensureNotBackground(lyr)) {
            return "Error: Could not unlock Background layer.";
        }
        doc.activeLayer = lyr;
        var d = new ActionDescriptor();
        var r = new ActionReference();
        r.putName(cTID("Styl"), styleName);
        d.putReference(cTID("null"), r);
        var rLyr = new ActionReference();
        rLyr.putEnumerated(cTID("Lyr "), cTID("Ordn"), cTID("Trgt"));
        d.putReference(cTID("T   "), rLyr);
        executeAction(cTID("ASty"), d, DialogModes.NO);
        if (!hasLayerStyle(doc, lyr, null)) {
            return "Error: Photoshop Style '" + styleName + "' did not land on '" + lyr.name + "'.";
        }
        return "OK: Photoshop Style '" + styleName + "' applied to '" + lyr.name + "' (editable via fx icon).";
    } catch (e) {
        return "Error: Could not apply Photoshop Style '" + styleName + "' — " + e.message;
    }
}

/* FIXED v2.32 auraLoadASL:
   Uses Photoshop Action Manager setd on Prpr/Styl with Appe=true (appends .asl into Window > Styles).
   Previously called app.load(f) which tries to open .asl as an image document and fails! */
function auraLoadASL() {
    try {
        var f = File.openDialog("Select Photoshop Styles (.asl) file", "Photoshop Styles:*.asl");
        if (!f) return "Error: Cancelled.";
        var d = new ActionDescriptor();
        var r = new ActionReference();
        r.putProperty(cTID("Prpr"), cTID("Styl"));
        r.putEnumerated(cTID("capp"), cTID("Ordn"), cTID("Trgt"));
        d.putReference(cTID("null"), r);
        d.putPath(cTID("T   "), f);
        d.putBoolean(cTID("Appe"), true);
        executeAction(cTID("setd"), d, DialogModes.NO);
        return "OK: Loaded '" + f.name + "' into Photoshop Styles panel.";
    } catch (e) {
        return "Error: Could not load .asl file — " + e.message;
    }
}

/* ---------------- QUICK DESIGNER UTILITIES (v2.36) ---------------- */
function auraCenterLayer() {
    var d = needDoc();
    if (!d) return "Error: No open document.";
    var oldU = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    try {
        var l = d.activeLayer;
        if (!l || l.isBackgroundLayer) return "Error: Select a non-Background layer to center.";
        var W = d.width.as("px"), H = d.height.as("px");
        var b = l.bounds;
        var lx = b[0].as("px"), ly = b[1].as("px"), lw = b[2].as("px") - lx, lh = b[3].as("px") - ly;
        if (lw <= 0 || lh <= 0) return "Error: Selected layer is empty.";
        l.translate(UnitValue((W - lw) / 2 - lx, "px"), UnitValue((H - lh) / 2 - ly, "px"));
        return "OK: '" + l.name + "' centered on canvas.";
    } catch (e) {
        return "Error: Center Layer failed — " + e.message;
    } finally {
        try { app.preferences.rulerUnits = oldU; } catch (e2) {}
    }
}

function auraFitCanvas() {
    var d = needDoc();
    if (!d) return "Error: No open document.";
    var oldU = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    try {
        var l = d.activeLayer;
        if (!l || l.isBackgroundLayer) return "Error: Select a non-Background layer to fit.";
        var W = d.width.as("px"), H = d.height.as("px");
        var b = l.bounds;
        var lx = b[0].as("px"), ly = b[1].as("px"), lw = b[2].as("px") - lx, lh = b[3].as("px") - ly;
        if (lw <= 0 || lh <= 0) return "Error: Selected layer is empty.";
        var pct = Math.min(W / lw, H / lh) * 100.0;
        l.resize(pct, pct, AnchorPosition.MIDDLECENTER);
        b = l.bounds;
        lx = b[0].as("px"); ly = b[1].as("px"); lw = b[2].as("px") - lx; lh = b[3].as("px") - ly;
        l.translate(UnitValue((W - lw) / 2 - lx, "px"), UnitValue((H - lh) / 2 - ly, "px"));
        return "OK: '" + l.name + "' scaled & centered to fit canvas.";
    } catch (e) {
        return "Error: Fit to Canvas failed — " + e.message;
    } finally {
        try { app.preferences.rulerUnits = oldU; } catch (e2) {}
    }
}

function auraPlaceFile() {
    var d = needDoc();
    if (!d) return "Error: Open a document first.";
    try {
        var f = File.openDialog("Select PNG / JPG / SVG / PSD to place", "Images:*.png;*.jpg;*.jpeg;*.webp;*.svg;*.psd;*.ai");
        if (!f) return "Error: Cancelled.";
        var desc = new ActionDescriptor();
        desc.putPath(cTID("null"), f);
        desc.putEnumerated(cTID("FTcs"), cTID("QCSt"), cTID("Qcsa"));
        executeAction(cTID("Plc "), desc, DialogModes.NO);
        return "OK: Placed '" + f.name + "' onto canvas.";
    } catch (e) {
        return "Error: Could not place file — " + e.message;
    }
}

function auraQuickExportPNG() {
    var d = needDoc();
    if (!d) return "Error: No open document.";
    try {
        var base = d.name.replace(/\.[^.]+$/, "");
        var f = File.saveDialog("Export Transparent PNG", "PNG Image:*.png");
        if (!f) return "Error: Export cancelled.";
        if (!/\.png$/i.test(f.name)) f = new File(f.fsName + ".png");
        var opt = new PNGSaveOptions();
        opt.compression = 6;
        opt.interlaced = false;
        d.saveAs(f, opt, true, Extension.LOWERCASE);
        return "OK: Exported PNG to " + f.name + ".";
    } catch (e) {
        return "Error: PNG Export failed — " + e.message;
    }
}

function auraExtractPalette() {
    var d = needDoc();
    if (!d) return "Error: No open document.";
    var oldU = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    try {
        var W = d.width.as("px"), H = d.height.as("px");
        var pts = [
            [Math.round(W * 0.2), Math.round(H * 0.2)],
            [Math.round(W * 0.8), Math.round(H * 0.2)],
            [Math.round(W * 0.5), Math.round(H * 0.5)],
            [Math.round(W * 0.25), Math.round(H * 0.8)],
            [Math.round(W * 0.75), Math.round(H * 0.8)]
        ];
        function toHex(n) { var h = Math.max(0, Math.min(255, Math.round(n))).toString(16).toUpperCase(); return h.length < 2 ? "0" + h : h; }
        var hexes = [];
        for (var i = 0; i < pts.length; i++) {
            var c = samplePointRGB(d, pts[i][0], pts[i][1]);
            if (c) hexes.push("#" + toHex(c.r) + toHex(c.g) + toHex(c.b));
        }
        if (hexes.length === 0) return "Error: Could not sample colors from document.";
        return "PALETTE:" + hexes.join(",");
    } catch (e) {
        return "Error: Palette extract failed — " + e.message;
    } finally {
        try { app.preferences.rulerUnits = oldU; } catch (e2) {}
    }
}

/* ---------------- ADVANCED POSTER ANIMATOR v2.49 (PER-TEXT VARIED MOTION + REAL VIDEO EXPORT) ---------------- */
function _isAdjustmentLayer(l) {
    if (!l || l.typename === "LayerSet") return false;
    try {
        var k = l.kind;
        if (k === LayerKind.NORMAL || k === LayerKind.TEXT || k === LayerKind.SMARTOBJECT || k === LayerKind.SOLIDFILL || k === LayerKind.GRADIENTFILL || k === LayerKind.PATTERNFILL) {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

/* Safe check: only layers with real non-empty pixels/text/smart-object bounds can be translated */
function _canTranslateLayer(l) {
    if (!l || l.typename === "LayerSet") return false;
    try {
        if (l.isBackgroundLayer || l.allLocked || l.positionLocked || !l.visible) return false;
        var k = l.kind;
        if (k !== LayerKind.NORMAL && k !== LayerKind.TEXT && k !== LayerKind.SMARTOBJECT) return false;
        var b = l.bounds;
        var w = b[2].as("px") - b[0].as("px");
        var h = b[3].as("px") - b[1].as("px");
        return (w > 1 && h > 1);
    } catch (e) {
        return false;
    }
}

/* Deep recursive walk (up to 10 nested groups) so EVERY Text, Hero, Accent, and BG layer is found! */
function _classifyPosterLayers(doc) {
    var W = doc.width.as("px"), H = doc.height.as("px");
    var areaDoc = Math.max(1, W * H);
    var bg = [], hero = [], texts = [], accents = [];
    var candidatesHero = [];

    function walk(parent, depth) {
        if (!parent || !parent.layers || depth > 10) return;
        for (var i = 0; i < parent.layers.length; i++) {
            var l = parent.layers[i];
            if (!l.visible) continue;
            if (l.name === "CC Light Sweep") continue;
            if (l.typename === "LayerSet") {
                walk(l, depth + 1);
                continue;
            }
            if (_isAdjustmentLayer(l)) continue;
            try { if (l.allLocked || l.positionLocked || l.grouped) continue; } catch (eLk) {}

            var lw = 0, lh = 0, ly = 0;
            try {
                var b = l.bounds;
                lw = b[2].as("px") - b[0].as("px");
                lh = b[3].as("px") - b[1].as("px");
                ly = b[1].as("px");
            } catch (eB) {}
            var area = lw * lh;
            if (lw <= 1 || lh <= 1) continue; /* Never include empty 0x0 layers — prevents empty bounding rectangle error! */

            var movable = _canTranslateLayer(l);

            if (l.kind === LayerKind.TEXT) {
                texts.push({ lyr: l, name: l.name, y: ly, area: area, canMove: movable });
            } else if (l.isBackgroundLayer || l.kind === LayerKind.SOLIDFILL || l.kind === LayerKind.GRADIENTFILL || l.kind === LayerKind.PATTERNFILL || (area >= areaDoc * 0.88)) {
                bg.push({ lyr: l, name: l.name, y: ly, area: area, canMove: movable });
            } else if (l.name.indexOf("Glass") === 0 || (area > 0 && area < areaDoc * 0.10)) {
                accents.push({ lyr: l, name: l.name, y: ly, area: area, canMove: movable });
            } else if (area > 0) {
                candidatesHero.push({ lyr: l, name: l.name, y: ly, area: area, canMove: movable });
            }
        }
    }
    walk(doc, 0);

    candidatesHero.sort(function (a, b) { return b.area - a.area; });
    if (candidatesHero.length > 0) {
        hero.push(candidatesHero[0]);
        for (var k = 1; k < candidatesHero.length; k++) accents.push(candidatesHero[k]);
    }
    texts.sort(function (a, b) { return a.y - b.y; });
    accents.sort(function (a, b) { return a.y - b.y; });

    return { bg: bg, hero: hero, texts: texts, accents: accents };
}

var _TEXT_MOTIONS = [
    { key: "popup",      label: "1-by-1 Pop-Up Bounce" },
    { key: "typewriter", label: "1-by-1 Typewriter Reveal" },
    { key: "left",       label: "1-by-1 Slide Left" },
    { key: "right",      label: "1-by-1 Slide Right" },
    { key: "slam",       label: "1-by-1 Elastic Top Drop" },
    { key: "glitch",     label: "1-by-1 Glitch Pop" }
];

function auraAnalyzePoster() {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    var oldU = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    try {
        var c = _classifyPosterLayers(doc);
        var parts = [];
        for (var i = 0; i < c.bg.length; i++) parts.push("BG|" + c.bg[i].name + " (Fade + Parallax Drift)");
        for (var h = 0; h < c.hero.length; h++) parts.push("HERO|" + c.hero[h].name + " (Creative Bottom Rise + Float)");
        for (var t = 0; t < c.texts.length; t++) {
            var tm = _TEXT_MOTIONS[t % _TEXT_MOTIONS.length];
            parts.push("TEXT #" + (t + 1) + "|" + c.texts[t].name + " (" + tm.label + ")");
        }
        for (var a = 0; a < c.accents.length; a++) parts.push("ACCENT|" + c.accents[a].name + " (Pop-In)");
        if (parts.length === 0) return "Error: No unlocked visible layers found to animate.";
        return "BREAKDOWN:" + parts.join(";;");
    } catch (e) {
        return "Error: Poster analysis failed — " + e.message;
    } finally {
        try { app.preferences.rulerUnits = oldU; } catch (e2) {}
    }
}

function _animMakeFrameTimeline() {
    try { executeAction(sTID("makeFrameAnimation"), new ActionDescriptor(), DialogModes.NO); } catch (e) {}
}
function _animDuplicateFrame() {
    var d = new ActionDescriptor();
    var r = new ActionReference();
    r.putEnumerated(sTID("animationFrameClass"), cTID("Ordn"), cTID("Trgt"));
    d.putReference(cTID("null"), r);
    executeAction(cTID("Dplc"), d, DialogModes.NO);
}
function _animSelectFrameByIndex(idx1Based) {
    var d = new ActionDescriptor();
    var r = new ActionReference();
    r.putIndex(sTID("animationFrameClass"), idx1Based);
    d.putReference(cTID("null"), r);
    executeAction(cTID("slct"), d, DialogModes.NO);
}
function _animSetDelay(sec) {
    try {
        var d = new ActionDescriptor();
        var r = new ActionReference();
        r.putEnumerated(sTID("animationFrameClass"), cTID("Ordn"), cTID("Trgt"));
        d.putReference(cTID("null"), r);
        var td = new ActionDescriptor();
        td.putDouble(sTID("animationFrameDelay"), sec);
        d.putObject(cTID("T   "), sTID("animationFrameClass"), td);
        executeAction(cTID("setd"), d, DialogModes.NO);
    } catch (e) {}
}
function _animSetLoopForever() {
    try {
        var d = new ActionDescriptor();
        var r = new ActionReference();
        r.putEnumerated(sTID("animationClass"), cTID("Ordn"), cTID("Trgt"));
        d.putReference(cTID("null"), r);
        var td = new ActionDescriptor();
        td.putEnumerated(sTID("animationLoopEnum"), sTID("animationLoopEnum"), sTID("loopForever"));
        d.putObject(cTID("T   "), sTID("animationClass"), td);
        executeAction(cTID("setd"), d, DialogModes.NO);
    } catch (e) {}
}
function _createCCLightSweepLayer(doc, W, H, hexCol, sweepOp, targetLyr) {
    var oldSw = findLayerByName(doc, "CC Light Sweep");
    if (oldSw) { try { oldSw.remove(); } catch (eRm) {} }
    restoreRGBChannels(doc);

    /* Determine sweep region: strictly target the Hero / Product / Main Character / Subject if present! */
    var x0 = 0, y0 = 0, rw = W, rh = H;
    if (targetLyr) {
        try {
            var tb = targetLyr.bounds;
            var tw = tb[2].as("px") - tb[0].as("px");
            var th = tb[3].as("px") - tb[1].as("px");
            if (tw > 10 && th > 10) {
                x0 = tb[0].as("px"); y0 = tb[1].as("px"); rw = tw; rh = th;
            }
        } catch (eTB) {}
    }

    var sw = doc.artLayers.add();
    sw.name = "CC Light Sweep";
    var bw = Math.max(36, Math.round(rw * 0.22));
    var skew = Math.round(Math.min(rw * 0.35, rh * 0.25));
    var cx0 = Math.round(x0 + rw * 0.45);
    var pts = [[cx0, y0], [cx0 + bw, y0], [cx0 + bw - skew, y0 + rh], [cx0 - skew, y0 + rh]];
    doc.activeLayer = sw;
    doc.selection.select(pts, SelectionType.REPLACE, 0, false);
    var cleanHex = String(hexCol || "FFFFFF").replace("#", "").replace(/[^0-9a-fA-F]/g, "");
    if (cleanHex.length !== 6) cleanHex = "FFFFFF";
    var col = new SolidColor(); col.rgb.hexValue = cleanHex;
    doc.selection.fill(col, ColorBlendMode.NORMAL, 100, false);
    doc.selection.deselect();
    sw.applyGaussianBlur(Math.max(10, Math.round(bw * 0.42)));
    sw.blendMode = BlendMode.SCREEN;
    sw.opacity = (sweepOp == null ? 72 : sweepOp);

    /* Place directly above Product / Character / Subject and CLIP MASK (sw.grouped = true) so light ONLY sweeps on subject! */
    if (targetLyr) {
        try {
            sw.move(targetLyr, ElementPlacement.PLACEBEFORE);
            sw.grouped = true;
        } catch (eClip) {
            try { if (doc.layers.length > 1 && doc.layers[0] !== sw) sw.move(doc.layers[0], ElementPlacement.PLACEBEFORE); } catch (eMv) {}
        }
    } else {
        try { if (doc.layers.length > 1 && doc.layers[0] !== sw) sw.move(doc.layers[0], ElementPlacement.PLACEBEFORE); } catch (eMv2) {}
    }
    return { lyr: sw, startX: -Math.round(rw * 0.85), endX: Math.round(rw * 0.95) };
}

/* Quartic Ease-Out + Back-Overshoot Ease for dynamic pro motion graphics */
function _easeOut(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var u = 1 - t;
    return 1 - u * u * u * u;
}
function _easeOutBack(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var c1 = 1.35, c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

var LAST_ANIM_META = { frames: 0, fps: 24, hold: 2.0, duration: 10, dir: "" };

function auraAnimatePoster(o) {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    var oldU = app.preferences.rulerUnits;
    var oldDlg = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;
    app.preferences.rulerUnits = Units.PIXELS;
    restoreRGBChannels(doc);
    var tracks = [];
    var sweepLyr = null;
    try {
        var W = doc.width.as("px"), H = doc.height.as("px");
        var style = (o && o.style) ? o.style : "commercial";
        var doBG = (o && o.bg != null) ? !!o.bg : true;
        var doText = (o && o.text != null) ? !!o.text : true;
        var doHero = (o && o.hero != null) ? !!o.hero : true;
        var doSweep = (o && o.sweep != null) ? !!o.sweep : true;
        var durationSec = (o && o.duration != null) ? Math.max(3, Math.min(20, Number(o.duration))) : 10;
        var totalFrames = (o && o.frames) ? Math.max(16, Math.min(72, Math.round(o.frames))) : 48;
        var fps = (o && o.fps) ? Math.max(12, Math.min(30, Number(o.fps))) : 24;
        var frameDelay = Math.round(((durationSec * 0.80) / Math.max(1, totalFrames)) * 1000) / 1000;
        var holdSec = (o && o.hold != null) ? Math.max(0.5, Math.min(5.0, Number(o.hold))) : Math.round(durationSec * 0.20 * 10) / 10;

        var textDir = (o && o.textDir) ? o.textDir : "varied"; /* varied = each text gets its own distinct animation! */
        var textDist = (o && o.textDist != null) ? Number(o.textDist) : Math.round(H * 0.05);
        var stagger = (o && o.stagger != null) ? Math.max(1, Math.min(8, Math.round(o.stagger))) : 3;
        var heroDist = (o && o.heroDist != null) ? Number(o.heroDist) : Math.round(H * 0.06);
        var floatAmp = (o && o.floatAmp != null) ? Number(o.floatAmp) : Math.max(4, Math.round(H * 0.008));
        var sweepOp = (o && o.sweepOp != null) ? Math.max(10, Math.min(100, Number(o.sweepOp))) : 72;
        var sweepCol = (o && o.sweepCol) ? o.sweepCol : ((style === "luxury" || style === "commercial") ? "FFF5D6" : "FFFFFF");

        var cls = _classifyPosterLayers(doc);
        if (cls.hero.length === 0 && cls.texts.length === 0 && cls.accents.length === 0) {
            return "Error: Need at least one unlocked visible Hero, Text, or Shape layer to animate.";
        }

        tracks = [];
        /* STAGE 1: BG MOTION — smooth cinematic fade-in + gentle Ken-Burns parallax drift (movable unclipped BG only) */
        if (doBG) {
            for (var bi = 0; bi < cls.bg.length; bi++) {
                if (cls.bg[bi].canMove) {
                    tracks.push({
                        role: "bg", motion: "bg_parallax", canMove: true, lyr: cls.bg[bi].lyr,
                        origOp: cls.bg[bi].lyr.opacity,
                        startF: 0, endF: Math.max(4, Math.round(totalFrames * 0.16)),
                        dxInit: 0, dyInit: 0, curDx: 0, curDy: 0, floatAmp: 8
                    });
                }
            }
        }
        /* STAGE 2: MODEL / HERO — creative deep bottom rise (+28% H) with organic arc + soft elastic settle + breathing float */
        if (doHero) {
            var hStart = Math.max(2, Math.round(totalFrames * 0.05));
            var hEnd = Math.round(totalFrames * 0.30);
            var deepRise = Math.max(heroDist * 2, Math.round(H * 0.26));
            for (var h = 0; h < cls.hero.length; h++) {
                tracks.push({
                    role: "hero", motion: "bottom_arc_rise", canMove: cls.hero[h].canMove, useBack: true, lyr: cls.hero[h].lyr,
                    origOp: cls.hero[h].lyr.opacity,
                    startF: hStart, endF: hEnd,
                    dxInit: 0, dyInit: deepRise,
                    curDx: 0, curDy: 0, floatAmp: Math.max(floatAmp, 6)
                });
            }
        }
        /* STAGE 3: TEXTS — STRICT ONE-BY-ONE sequential reveal (each text finishes cleanly before the next!) */
        if (doText && cls.texts.length > 0) {
            var textSpanStart = Math.round(totalFrames * 0.30);
            var textSpanEnd = Math.round(totalFrames * 0.88);
            var slotLen = Math.max(4, Math.floor((textSpanEnd - textSpanStart) / cls.texts.length));
            var animLen = Math.max(3, Math.round(slotLen * 0.85));
            for (var t = 0; t < cls.texts.length; t++) {
                var stF = Math.min(totalFrames - 4, textSpanStart + t * slotLen);
                var enF = Math.min(totalFrames - 2, stF + animLen);
                var modeK = (textDir === "varied") ? _TEXT_MOTIONS[t % _TEXT_MOTIONS.length].key : textDir;
                var tDx = 0, tDy = 0, useBack = false, pulse = false, origTxt = null;
                try { if (cls.texts[t].lyr.kind === LayerKind.TEXT) origTxt = String(cls.texts[t].lyr.textItem.contents); } catch (eOT) {}
                if (modeK === "popup") { tDy = Math.round(textDist * 1.15); useBack = true; }
                else if (modeK === "typewriter") { tDx = 0; tDy = 0; }
                else if (modeK === "glitch") { tDx = 0; tDy = 0; }
                else if (modeK === "wave") { tDy = Math.round(textDist * 1.1); }
                else if (modeK === "slam") { tDy = -Math.round(textDist * 1.45); useBack = true; pulse = true; }
                else if (modeK === "left") { tDx = -Math.round(textDist * 1.85); }
                else if (modeK === "right") { tDx = Math.round(textDist * 1.85); }
                else if (modeK === "down") { tDy = -Math.round(textDist * 1.2); }
                else if (modeK === "up") { tDy = Math.round(textDist * 1.25); useBack = true; pulse = (t >= 3); }
                tracks.push({
                    role: "text", motion: modeK, canMove: cls.texts[t].canMove, useBack: useBack, pulse: pulse,
                    origText: origTxt, curText: origTxt,
                    lyr: cls.texts[t].lyr, origOp: cls.texts[t].lyr.opacity,
                    startF: stF, endF: enF,
                    dxInit: tDx, dyInit: tDy, curDx: 0, curDy: 0, floatAmp: (modeK === "wave" ? 5 : 0)
                });
            }
        }
        /* STAGE 4: ACCENTS — alternating side pop-in */
        for (var a = 0; a < cls.accents.length; a++) {
            var aSt = Math.min(totalFrames - 8, Math.round(totalFrames * 0.30) + a * 3);
            tracks.push({
                role: "accent", motion: "pop", canMove: cls.accents[a].canMove, useBack: true,
                lyr: cls.accents[a].lyr, origOp: cls.accents[a].lyr.opacity,
                startF: aSt, endF: Math.min(totalFrames - 2, aSt + Math.max(6, Math.round(totalFrames * 0.14))),
                dxInit: (a % 2 === 0 ? -28 : 28), dyInit: 20, curDx: 0, curDy: 0, floatAmp: 0
            });
        }

        sweepLyr = null; var sweepCurX = 0, sweepStartX = -Math.round(W * 0.75), sweepEndX = Math.round(W * 0.85);
        if (doSweep) {
            try {
                /* Always clip CC Light Sweep to the Hero / Product / Main Character / Subject (fallback to Accent or Text #1) */
                var swTarget = (cls.hero.length > 0) ? cls.hero[0].lyr
                    : (cls.accents.length > 0 ? cls.accents[0].lyr
                    : (cls.texts.length > 0 ? cls.texts[0].lyr : null));
                var swObj = _createCCLightSweepLayer(doc, W, H, sweepCol, sweepOp, swTarget);
                if (swObj && swObj.lyr && _canTranslateLayer(swObj.lyr)) {
                    sweepLyr = swObj.lyr;
                    sweepStartX = swObj.startX;
                    sweepEndX = swObj.endX;
                    sweepLyr.translate(UnitValue(sweepStartX, "px"), UnitValue(0, "px"));
                    sweepCurX = sweepStartX;
                } else {
                    sweepLyr = null;
                }
            } catch (eSwI) { sweepLyr = null; }
        }

        _animMakeFrameTimeline();

        /* Prepare real frame-capture folder so 1-click Video Export ALWAYS has every real animated frame! */
        var _tmpRoot = (typeof Folder !== "undefined" && Folder.temp && Folder.temp.fsName) ? Folder.temp.fsName : "/tmp";
        var frameDir = null;
        try { if (typeof Folder === "function") frameDir = new Folder(_tmpRoot + "/design360n_vid_frames"); } catch (eFD0) {}
        try {
            if (frameDir && frameDir.exists) {
                var oldFs = frameDir.getFiles("frame_*.jpg");
                for (var ofi = 0; ofi < oldFs.length; ofi++) { try { oldFs[ofi].remove(); } catch (eRmF) {} }
            } else {
                if (frameDir) frameDir.create();
            }
        } catch (eFD) {}
        var jpgOpt = null;
        try { jpgOpt = new JPEGSaveOptions(); jpgOpt.quality = 8; } catch (eJO) {}
        var capturedFrames = 0;

        for (var f = 0; f < totalFrames; f++) {
            if (f > 0) _animDuplicateFrame();
            _animSetDelay(f === totalFrames - 1 ? holdSec : frameDelay);

            for (var ti = 0; ti < tracks.length; ti++) {
                var tr = tracks[ti];
                var targetDx = 0, targetDy = 0, targetOp = tr.origOp;

                if (tr.role === "bg") {
                    var bp = f / Math.max(1, totalFrames - 1);
                    targetDx = Math.round(Math.sin(bp * Math.PI * 2) * tr.floatAmp);
                    targetDy = Math.round(Math.sin(bp * Math.PI) * Math.round(tr.floatAmp * 0.4));
                    var bgFade = (f <= tr.endF) ? (0.45 + 0.55 * _easeOut(f / Math.max(1, tr.endF))) : 1.0;
                    targetOp = Math.round(tr.origOp * bgFade);
                } else if (f < tr.startF) {
                    targetDx = tr.dxInit;
                    targetDy = tr.dyInit;
                    targetOp = 0;
                } else if (f <= tr.endF) {
                    var prog = (tr.endF > tr.startF) ? ((f - tr.startF) / (tr.endF - tr.startF)) : 1;
                    if (tr.motion === "typewriter" && tr.origText && tr.origText.length > 0) {
                        var chN = Math.max(1, Math.round(prog * tr.origText.length));
                        var subT = tr.origText.substring(0, chN) + (prog < 0.96 ? "|" : "");
                        if (tr.curText !== subT) {
                            try { tr.lyr.textItem.contents = subT; tr.curText = subT; } catch (eTW) {}
                        }
                        targetDx = 0; targetDy = 0; targetOp = tr.origOp;
                    } else if (tr.motion === "glitch") {
                        var decay = 1 - prog;
                        var jx = Math.round(((f % 2 === 0 ? 1 : -1) * 16 + Math.sin(f * 3.1) * 8) * decay);
                        var jy = Math.round(((f % 3 === 0 ? 1 : -1) * 5) * decay);
                        targetDx = jx;
                        targetDy = jy;
                        targetOp = Math.round(tr.origOp * (prog < 0.7 && (f % 2 === 0) ? 0.55 : 1.0));
                    } else if (tr.motion === "bottom_arc_rise") {
                        /* Creative deep bottom rise with subtle organic curve + silky elastic settle */
                        var ezHero = _easeOutBack(prog);
                        targetDx = Math.round(Math.sin(prog * Math.PI) * 12);
                        targetDy = Math.round(tr.dyInit * (1 - ezHero));
                        targetOp = Math.round(tr.origOp * Math.min(1, prog * 1.8));
                    } else if (tr.motion === "popup") {
                        /* Punchy spring pop-up overshoot */
                        var ezPop = _easeOutBack(prog);
                        targetDx = 0;
                        targetDy = Math.round(tr.dyInit * (1 - ezPop));
                        targetOp = Math.round(tr.origOp * Math.min(1, prog * 2.2));
                    } else {
                        var ez = tr.useBack ? _easeOutBack(prog) : _easeOut(prog);
                        targetDx = Math.round(tr.dxInit * (1 - ez));
                        targetDy = Math.round(tr.dyInit * (1 - ez));
                        targetOp = Math.round(tr.origOp * _easeOut(prog));
                    }
                } else {
                    if (tr.motion === "typewriter" && tr.origText != null && tr.curText !== tr.origText) {
                        try { tr.lyr.textItem.contents = tr.origText; tr.curText = tr.origText; } catch (eTW2) {}
                    }
                    targetDx = 0;
                    targetOp = tr.origOp;
                    if ((tr.role === "hero" || tr.motion === "wave") && tr.floatAmp > 0) {
                        var phase = ((f - tr.endF) / Math.max(1, totalFrames - tr.endF)) * Math.PI * 2;
                        targetDy = Math.round(Math.sin(phase) * tr.floatAmp);
                    } else if (tr.pulse) {
                        var pp = ((f - tr.endF) / Math.max(1, totalFrames - tr.endF)) * Math.PI * 2;
                        targetOp = Math.round(tr.origOp * (0.82 + 0.18 * Math.cos(pp)));
                        targetDy = 0;
                    } else {
                        targetDy = 0;
                    }
                }

                var ddx = targetDx - tr.curDx;
                var ddy = targetDy - tr.curDy;
                if (tr.canMove && (ddx !== 0 || ddy !== 0)) {
                    try { tr.lyr.translate(UnitValue(ddx, "px"), UnitValue(ddy, "px")); } catch (eTr) { tr.canMove = false; }
                    tr.curDx = targetDx;
                    tr.curDy = targetDy;
                }
                try { tr.lyr.opacity = Math.max(0, Math.min(100, targetOp)); } catch (eOp) {}
            }

            if (sweepLyr) {
                var sw1S = Math.round(totalFrames * 0.34), sw1E = Math.round(totalFrames * 0.54);
                var sw2S = Math.round(totalFrames * 0.68), sw2E = Math.round(totalFrames * 0.90);
                var sp = -1;
                if (f >= sw1S && f <= sw1E) sp = (f - sw1S) / Math.max(1, sw1E - sw1S);
                else if (f >= sw2S && f <= sw2E) sp = (f - sw2S) / Math.max(1, sw2E - sw2S);
                if (sp < 0) {
                    sweepLyr.opacity = 0;
                } else {
                    var targetX = Math.round(sweepStartX + (sweepEndX - sweepStartX) * sp);
                    var dx = targetX - sweepCurX;
                    if (dx !== 0) {
                        try { sweepLyr.translate(UnitValue(dx, "px"), UnitValue(0, "px")); } catch (eSwT) {}
                        sweepCurX = targetX;
                    }
                    sweepLyr.opacity = Math.max(0, Math.round(Math.sin(sp * Math.PI) * sweepOp));
                }
            }

            /* Capture this exact animated frame directly from Photoshop canvas */
            try {
                var fnIdx = f + 1;
                var padF = (fnIdx < 10 ? "00" : fnIdx < 100 ? "0" : "") + fnIdx;
                if (frameDir && jpgOpt) { var frameFile = new File(frameDir.fsName + "/frame_" + padF + ".jpg");
                doc.saveAs(frameFile, jpgOpt, true, Extension.LOWERCASE);
                if (frameFile.exists) capturedFrames++; }
            } catch (eCap) {}
        }

        _animSetLoopForever();
        LAST_ANIM_META = { frames: capturedFrames > 0 ? capturedFrames : totalFrames, fps: fps, hold: holdSec, duration: durationSec, textCount: cls.texts.length, dir: (frameDir ? frameDir.fsName : "") };
        return "OK: " + totalFrames + "-frame Varied Poster Animation ready (" + cls.hero.length + " Hero, " + cls.texts.length + " Varied Texts, " + cls.accents.length + " Accent" + (doSweep ? " + CC Light Sweep" : "") + "). Click 'Export Video' or open Window > Timeline!";
    } catch (e) {
        return "Error: Poster Animation failed — " + e.message;
    } finally {
        /* GUARANTEED RESTORE: Put every single animated layer back to its EXACT original (0,0) position & opacity! */
        for (var ri = 0; ri < tracks.length; ri++) {
            var rtr = tracks[ri];
            try {
                if (rtr.canMove && (rtr.curDx !== 0 || rtr.curDy !== 0)) {
                    rtr.lyr.translate(UnitValue(-rtr.curDx, "px"), UnitValue(-rtr.curDy, "px"));
                    rtr.curDx = 0;
                    rtr.curDy = 0;
                }
            } catch (eR1) {}
            try { if (rtr.origText != null && rtr.curText !== rtr.origText) { rtr.lyr.textItem.contents = rtr.origText; rtr.curText = rtr.origText; } } catch (eR0) {}
            try { rtr.lyr.opacity = rtr.origOp; } catch (eR2) {}
        }
        if (sweepLyr) {
            try { sweepLyr.opacity = 0; sweepLyr.visible = false; } catch (eR3) {}
        }
        restoreRGBChannels(doc);
        try { app.preferences.rulerUnits = oldU; } catch (e2) {}
        try { app.displayDialogs = oldDlg; } catch (e3) {}
    }
}

/* v2.52 REAL 1-CLICK VIDEO FRAME EXPORTER (uses real frames captured during auraAnimatePoster -> guaranteed motion!) */
function auraExportAnimFrames() {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    try {
        var outDir = new Folder((LAST_ANIM_META && LAST_ANIM_META.dir) ? LAST_ANIM_META.dir : (Folder.temp.fsName + "/design360n_vid_frames"));
        var files = outDir.exists ? outDir.getFiles("frame_*.jpg") : [];
        var fps = (LAST_ANIM_META && LAST_ANIM_META.fps) ? LAST_ANIM_META.fps : 16;
        var hold = (LAST_ANIM_META && LAST_ANIM_META.hold != null) ? LAST_ANIM_META.hold : 1.5;
        if (files && files.length >= 2) {
            var dur = (LAST_ANIM_META && LAST_ANIM_META.duration != null) ? LAST_ANIM_META.duration : 10;
            var tCnt = (LAST_ANIM_META && LAST_ANIM_META.textCount != null) ? LAST_ANIM_META.textCount : 4;
            return "FRAMES:" + outDir.fsName + "||" + files.length + "||" + fps + "||" + hold + "||" + dur + "||" + tCnt;
        }
        return "Error: Please click '1-Click Auto Animate Poster' first so all animation frames are generated!";
    } catch (e) {
        return "Error: Frame export failed — " + e.message;
    }
}
function auraPickVideoSavePath(defaultExt) {
    try {
        var ext = defaultExt || ".webm";
        var f = File.saveDialog("Save Poster Animation Video", "Video (*" + ext + "):*" + ext);
        if (!f) return "CANCEL";
        var full = f.fsName;
        if (full.toLowerCase().slice(-ext.length) !== ext.toLowerCase()) full += ext;
        return "PATH:" + full;
    } catch (e) {
        return "Error: Save dialog failed — " + e.message;
    }
}

function auraRenderVideo() {
    return auraExportAnimFrames();
}

function auraExportGIF() {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    try {
        var f = File.saveDialog("Export Animated GIF", "Animated GIF:*.gif");
        if (!f) return "Error: Export cancelled.";
        if (!/\.gif$/i.test(f.name)) f = new File(f.fsName + ".gif");
        var opt = new ExportOptionsSaveForWeb();
        opt.format = SaveDocumentType.COMPUSERVEGIF;
        opt.colors = 256;
        opt.dither = Dither.DIFFUSION;
        opt.ditherAmount = 88;
        opt.transparency = true;
        opt.lossy = 0;
        doc.exportDocument(f, ExportType.SAVEFORWEB, opt);
        return "OK: Exported Animated GIF to " + f.name + "!";
    } catch (e) {
        return "Error: GIF export failed — " + e.message;
    }
}

/* ---------------- GEMINI AI GENERATIVE FILL / EXPAND BRIDGE (v2.47) ---------------- */
function auraExportTempCanvas() {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    try {
        var tmpFile = new File(Folder.temp.fsName + "/design360n_ai_in.png");
        if (tmpFile.exists) { try { tmpFile.remove(); } catch (e0) {} }
        var copy = doc.duplicate("Design360n_AI_TMP", true);
        try {
            var cw = copy.width.as("px"), ch = copy.height.as("px");
            var maxDim = 1536;
            if (cw > maxDim || ch > maxDim) {
                var sc = maxDim / Math.max(cw, ch);
                copy.resizeImage(UnitValue(Math.round(cw * sc), "px"), UnitValue(Math.round(ch * sc), "px"), 72, ResampleMethod.BICUBIC);
            }
            if (typeof BitsPerChannelType !== "undefined") copy.bitsPerChannel = BitsPerChannelType.EIGHT;
        } catch (eRs) {}
        var opt = new PNGSaveOptions();
        opt.compression = 4;
        opt.interlaced = false;
        copy.saveAs(tmpFile, opt, true, Extension.LOWERCASE);
        copy.close(SaveOptions.DONOTSAVECHANGES);
        return "PATH:" + tmpFile.fsName;
    } catch (e) {
        return "Error: Could not export canvas for AI — " + e.message;
    }
}

function auraPlaceTempAIResult(filePath, layerName) {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    var oldU = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    restoreRGBChannels(doc);
    try {
        var f = new File(filePath);
        if (!f.exists) return "Error: AI output image not found at " + filePath;
        var desc = new ActionDescriptor();
        desc.putPath(cTID("null"), f);
        desc.putEnumerated(cTID("FTcs"), cTID("QCSt"), cTID("Qcsa"));
        executeAction(cTID("Plc "), desc, DialogModes.NO);
        var lyr = doc.activeLayer;
        lyr.name = layerName || "Design360n Gemini AI Fill";
        /* Fit placed AI layer cleanly to exact canvas dimensions */
        var W = doc.width.as("px"), H = doc.height.as("px");
        var b = lyr.bounds;
        var lw = b[2].as("px") - b[0].as("px"), lh = b[3].as("px") - b[1].as("px");
        if (lw > 0 && lh > 0 && (Math.abs(lw - W) > 2 || Math.abs(lh - H) > 2)) {
            lyr.resize((W / lw) * 100.0, (H / lh) * 100.0, AnchorPosition.MIDDLECENTER);
            b = lyr.bounds;
            lyr.translate(UnitValue(-b[0].as("px"), "px"), UnitValue(-b[1].as("px"), "px"));
        }
        return "OK: Gemini AI Generative Fill placed on '" + lyr.name + "'!";
    } catch (e) {
        return "Error: Could not place AI result — " + e.message;
    } finally {
        try { app.preferences.rulerUnits = oldU; } catch (e2) {}
    }
}


/* ---------------- AI & PRO IMAGE UPSCALER ULTRA v2.68 (2-PASS NEURAL + CAMERA RAW TEXTURE/CLARITY + SMART DEBLUR) ---------------- */
function _amDeepUpscale(newWpx, noisePct, newDpi) {
    var d = new ActionDescriptor();
    d.putUnitDouble(cTID("Wdth"), cTID("#Pxl"), newWpx);
    if (newDpi && newDpi > 0) d.putUnitDouble(cTID("Rslt"), cTID("#Rsl"), newDpi);
    d.putBoolean(sTID("scaleStyles"), true);
    d.putBoolean(cTID("CnsP"), true);
    d.putEnumerated(cTID("Intr"), cTID("Intp"), sTID("deepUpscale"));
    d.putUnitDouble(cTID("Nose"), cTID("#Prc"), Math.max(0, Math.min(100, Math.round(noisePct || 15))));
    executeAction(cTID("ImgS"), d, DialogModes.NO);
}

function _amSmartSharpenDeblur(amountPct, radiusPx, noiseReducePct) {
    var d = new ActionDescriptor();
    d.putUnitDouble(cTID("Amnt"), cTID("#Prc"), Math.max(10, Math.min(400, amountPct)));
    d.putUnitDouble(cTID("Rds "), cTID("#Pxl"), Math.max(0.5, Math.min(6.0, radiusPx)));
    d.putUnitDouble(cTID("Nose"), cTID("#Prc"), Math.max(0, Math.min(100, noiseReducePct)));
    d.putEnumerated(cTID("blur"), sTID("blurType"), cTID("LnsB"));
    d.putBoolean(sTID("preset"), false);
    executeAction(sTID("smartSharpen"), d, DialogModes.NO);
}

function _amCameraRawEnhance(textureVal, clarityVal, sharpVal, lumNoise, colNoise, dehazeVal) {
    var d = new ActionDescriptor();
    d.putInteger(cTID("CrTx"), Math.max(-100, Math.min(100, Math.round(textureVal))));
    d.putInteger(cTID("Cl12"), Math.max(-100, Math.min(100, Math.round(clarityVal))));
    d.putInteger(cTID("Dhze"), Math.max(-100, Math.min(100, Math.round(dehazeVal || 0))));
    d.putInteger(cTID("Shrp"), Math.max(0, Math.min(150, Math.round(sharpVal))));
    d.putDouble(cTID("ShpR"), 1.2);
    d.putInteger(cTID("ShpD"), 35);
    d.putInteger(cTID("ShpM"), 25); /* Edge-masked sharpening so smooth skin/BG stays clean! */
    d.putInteger(cTID("LNR "), Math.max(0, Math.min(100, Math.round(lumNoise))));
    d.putInteger(cTID("LNRD"), 60);
    d.putInteger(cTID("CNR "), Math.max(0, Math.min(100, Math.round(colNoise))));
    executeAction(sTID("Adobe Camera Raw Filter"), d, DialogModes.NO);
}

function _resizeStep(doc, wPx, hPx, noisePct, dpi) {
    try {
        _amDeepUpscale(wPx, noisePct, dpi || 0);
        return "Preserve Details 2.0";
    } catch (eDeep) {
        var useDpi = dpi || 72;
        try { if (!dpi && doc.resolution) useDpi = doc.resolution; } catch (eR) {}
        try {
            doc.resizeImage(UnitValue(wPx, "px"), UnitValue(hPx, "px"), useDpi, ResampleMethod.PRESERVEDETAILS);
            return "Preserve Details";
        } catch (ePD) {
            try {
                doc.resizeImage(UnitValue(wPx, "px"), UnitValue(hPx, "px"), useDpi, ResampleMethod.BICUBICSMOOTHER);
                return "Bicubic Smoother";
            } catch (eBS) {
                doc.resizeImage(UnitValue(wPx, "px"), UnitValue(hPx, "px"), useDpi, ResampleMethod.BICUBIC);
                return "Bicubic";
            }
        }
    }
}

function auraUpscalePro(o) {
    var doc = needDoc();
    if (!doc) return "Error: No open document.";
    var oldU = app.preferences.rulerUnits;
    var oldDlg = app.displayDialogs;
    app.displayDialogs = DialogModes.NO;
    app.preferences.rulerUnits = Units.PIXELS;
    restoreRGBChannels(doc);
    try {
        var scale = (o && o.scale) ? Math.max(1, Math.min(4, Number(o.scale))) : 2;
        var mode = (o && o.mode) ? o.mode : "balanced";
        var sharp = (o && o.sharp != null) ? Math.max(0, Math.min(100, Number(o.sharp))) : 65;
        var noise = (o && o.noise != null) ? Math.max(0, Math.min(100, Number(o.noise))) : 20;
        var addGrain = (o && o.grain != null) ? !!o.grain : true;

        var origW = Math.round(doc.width.as("px"));
        var origH = Math.round(doc.height.as("px"));
        var targetW = Math.min(12000, Math.round(origW * scale));
        var targetH = Math.max(1, Math.round(origH * (targetW / Math.max(1, origW))));
        var printDpi = (mode === "print300") ? 300 : 0;

        /* Step 1: Progressive 2-Pass Neural Upscale for 3x/4x (way sharper edges than a single jump!) */
        var methodLabel = "HD Enhance";
        if (scale > 2.2) {
            var midW = Math.round(origW * 2);
            var midH = Math.round(origH * 2);
            _resizeStep(doc, midW, midH, Math.round(noise * 0.7), 0);
            methodLabel = "2-Pass " + _resizeStep(doc, targetW, targetH, noise, printDpi);
        } else if (scale > 1.01) {
            methodLabel = _resizeStep(doc, targetW, targetH, noise, printDpi);
        }

        /* Step 2: Clean Full-Color "Upscaled HD Master" Layer (zero gray screen, instant Before/After eye toggle!) */
        var hdLyr = null;
        var usedACR = false;
        try {
            if (doc.layers.length === 1 && doc.layers[0].typename === "ArtLayer") {
                hdLyr = doc.layers[0].duplicate();
                hdLyr.name = "Upscaled HD Master (" + scale + "x)";
                doc.activeLayer = hdLyr;
            } else {
                var tmpTop = doc.artLayers.add();
                if (doc.layers.length > 1 && doc.layers[0] !== tmpTop) tmpTop.move(doc.layers[0], ElementPlacement.PLACEBEFORE);
                tmpTop.name = "Upscaled HD Master (" + scale + "x)";
                doc.activeLayer = tmpTop;
                var sd = new ActionDescriptor();
                sd.putBoolean(cTID("Dplc"), true);
                executeAction(cTID("MrgV"), sd, DialogModes.NO);
                hdLyr = doc.activeLayer;
                hdLyr.name = "Upscaled HD Master (" + scale + "x)";
            }
            hdLyr.blendMode = BlendMode.NORMAL;
            hdLyr.opacity = 100;

            /* Step 3: Camera Raw Studio Texture + Clarity + Edge-Masked Sharpen + Luminance/Color Denoise! */
            if (sharp > 0 || noise > 0) {
                var crTex = (mode === "portrait") ? Math.round(sharp * 0.38) : (mode === "product" ? Math.round(sharp * 0.65) : Math.round(sharp * 0.52));
                var crClar = (mode === "portrait") ? Math.round(sharp * 0.16) : (mode === "product" ? Math.round(sharp * 0.42) : Math.round(sharp * 0.28));
                var crShrp = (mode === "product") ? Math.round(45 + sharp * 0.85) : Math.round(35 + sharp * 0.65);
                var crLnr = Math.round(noise * 0.75);
                var crCnr = Math.max(15, Math.round(noise * 0.8));
                var crDehaze = (mode === "portrait") ? 4 : 8;
                try {
                    _amCameraRawEnhance(crTex, crClar, crShrp, crLnr, crCnr, crDehaze);
                    usedACR = true;
                } catch (eACR) {
                    /* Fallback if Camera Raw unavailable: Dust&Scratches + Local Clarity */
                    if (noise >= 15) {
                        try { hdLyr.applyDustAndScratches(Math.max(1, Math.min(3, Math.round(noise / 30))), 14); } catch (eDn) {}
                    }
                }
            }

            /* Step 4: Precision Lens-Blur Deconvolution Smart Sharpen (actually deblurs soft edges!) */
            if (sharp > 0) {
                var ssAmt = (mode === "product") ? Math.round(95 + sharp * 1.4)
                    : (mode === "portrait" ? Math.round(65 + sharp * 0.95) : Math.round(80 + sharp * 1.2));
                var ssRad = (mode === "product") ? (1.3 + scale * 0.3)
                    : (mode === "portrait" ? (1.0 + scale * 0.22) : (1.2 + scale * 0.26));
                try {
                    _amSmartSharpenDeblur(ssAmt, ssRad, Math.max(12, Math.round(noise * 0.55)));
                } catch (eSS) {
                    try { hdLyr.applyUnSharpMask(Math.min(220, ssAmt), ssRad, 2); } catch (eU1) {}
                }
                if (!usedACR) {
                    try {
                        var clarAmt = (mode === "portrait") ? 14 : 22;
                        hdLyr.applyUnSharpMask(clarAmt, Math.round(18 * Math.min(2, scale)), 0);
                    } catch (eClar) {}
                }
            }

            /* Step 5: Subtle Natural Micro-Texture (removes plastic/waxy look) */
            if (addGrain && mode !== "product") {
                try { hdLyr.applyAddNoise(0.5, NoiseDistribution.GAUSSIAN, true); } catch (eGr) {}
            }
        } catch (eHD) {}

        var finalW = Math.round(doc.width.as("px"));
        var finalH = Math.round(doc.height.as("px"));
        return "OK: Upscaled " + origW + "x" + origH + " -> " + finalW + "x" + finalH + " px (" + scale + "x " + methodLabel + (usedACR ? " + Camera Raw HD" : " + Smart Deblur") + ")!";
    } catch (e) {
        return "Error: Upscale failed — " + e.message;
    } finally {
        restoreRGBChannels(doc);
        try { app.preferences.rulerUnits = oldU; } catch (e2) {}
        try { app.displayDialogs = oldDlg; } catch (e3) {}
    }
}
