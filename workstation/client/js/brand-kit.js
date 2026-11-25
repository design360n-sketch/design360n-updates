/* Design360n Workstation v17.7.20 — Advanced Brand Identity Kit Studio
 * Select ANY logo in Illustrator (or upload one) -> auto-extract brand colors ->
 * 1-Click generate a complete multi-artboard Agency Brand Identity Kit
 * (Cover & Logo Variations, Color/HEX/CMYK & Typography, Business Card,
 * Letterhead A4, DL Envelope, ID Card, Social Media Kit & Bento Brand Board)! */
(function (global) {
  "use strict";

  var csInterface = (typeof CSInterface !== "undefined") ? new CSInterface() : null;

  function hexToRgb(hex) {
    var h = String(hex || "#0ea5e9").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16) || 0;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToCmykStr(hex) {
    var rgb = hexToRgb(hex);
    var r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
    var k = 1 - Math.max(r, g, b);
    if (k >= 0.999) return "C0 M0 Y0 K100";
    var c = Math.round(((1 - r - k) / (1 - k)) * 100);
    var m = Math.round(((1 - g - k) / (1 - k)) * 100);
    var y = Math.round(((1 - b - k) / (1 - k)) * 100);
    var kp = Math.round(k * 100);
    return "C" + c + " M" + m + " Y" + y + " K" + kp;
  }

  function escJSX(obj) {
    var json = JSON.stringify(obj).replace(/[\u007F-\uFFFF]/g, function (ch) {
      return "\\u" + ("0000" + ch.charCodeAt(0).toString(16)).slice(-4);
    });
    return json.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  function brandPreviewSVG(opts) {
    var p = opts.primary || "#2ed3a3";
    var s = opts.secondary || "#0ea5e9";
    var dk = opts.dark || "#0b1120";
    var lt = opts.light || "#f8fafc";
    var name = (opts.brandName || "BRAND NAME").replace(/[<>&"]/g, "");
    var tag = (opts.tagline || "Crafted with precision").replace(/[<>&"]/g, "");
    var init = name.split(/\s+/).map(function (w) { return w[0] || ""; }).join("").slice(0, 2).toUpperCase() || "BR";

    return [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 190" width="100%" height="100%">',
      '<rect width="340" height="190" rx="8" fill="#070c16"/>',
      // Hero Bento Card (Left)
      '<rect x="10" y="10" width="142" height="112" rx="8" fill="' + dk + '" stroke="' + p + '" stroke-width="1"/>',
      '<rect x="22" y="24" width="28" height="28" rx="6" fill="' + p + '"/>',
      '<text x="36" y="42" text-anchor="middle" fill="' + dk + '" font-family="Inter,sans-serif" font-size="13" font-weight="900">' + init + '</text>',
      '<text x="22" y="72" fill="' + lt + '" font-family="Inter,sans-serif" font-size="12" font-weight="800">' + name.slice(0, 16) + '</text>',
      '<text x="22" y="86" fill="#94a3b8" font-family="Inter,sans-serif" font-size="7.5">' + tag.slice(0, 26) + '</text>',
      '<rect x="22" y="98" width="46" height="4" rx="2" fill="' + p + '"/>',
      // Business Card Mockup (Top Right)
      '<rect x="160" y="10" width="94" height="58" rx="6" fill="' + lt + '"/>',
      '<rect x="160" y="10" width="6" height="58" rx="2" fill="' + p + '"/>',
      '<text x="174" y="30" fill="' + dk + '" font-family="Inter,sans-serif" font-size="8.5" font-weight="800">' + name.slice(0, 13) + '</text>',
      '<text x="174" y="42" fill="#64748b" font-family="Inter,sans-serif" font-size="6">Business Card 85×55mm</text>',
      '<rect x="174" y="50" width="42" height="3" rx="1.5" fill="' + s + '"/>',
      // Letterhead Mini (Far Right)
      '<rect x="262" y="10" width="68" height="92" rx="5" fill="#ffffff"/>',
      '<rect x="262" y="10" width="68" height="12" rx="2" fill="' + dk + '"/>',
      '<rect x="270" y="28" width="32" height="3" rx="1" fill="' + p + '"/>',
      '<rect x="270" y="36" width="52" height="2" rx="1" fill="#cbd5e1"/>',
      '<rect x="270" y="42" width="46" height="2" rx="1" fill="#cbd5e1"/>',
      '<rect x="270" y="48" width="50" height="2" rx="1" fill="#cbd5e1"/>',
      '<rect x="262" y="94" width="68" height="8" rx="2" fill="' + p + '"/>',
      // Typography Specimen (Mid Right)
      '<rect x="160" y="75" width="94" height="47" rx="6" fill="' + p + '"/>',
      '<text x="172" y="102" fill="' + dk + '" font-family="Inter,sans-serif" font-size="22" font-weight="900">Aa</text>',
      '<text x="206" y="95" fill="' + dk + '" font-family="Inter,sans-serif" font-size="7" font-weight="800">TYPE SYSTEM</text>',
      '<text x="206" y="106" fill="' + dk + '" font-family="Inter,sans-serif" font-size="6.5" opacity="0.8">' + (opts.titleFont || "Montserrat").slice(0, 12) + '</text>',
      // 5 Color Swatches Row (Bottom)
      '<rect x="10" y="130" width="60" height="50" rx="6" fill="' + p + '"/><text x="40" y="172" text-anchor="middle" fill="' + dk + '" font-family="monospace" font-size="7" font-weight="700">' + p.toUpperCase() + '</text>',
      '<rect x="75" y="130" width="60" height="50" rx="6" fill="' + s + '"/><text x="105" y="172" text-anchor="middle" fill="#fff" font-family="monospace" font-size="7" font-weight="700">' + s.toUpperCase() + '</text>',
      '<rect x="140" y="130" width="60" height="50" rx="6" fill="' + dk + '" stroke="#334155"/><text x="170" y="172" text-anchor="middle" fill="#cbd5e1" font-family="monospace" font-size="7" font-weight="700">' + dk.toUpperCase() + '</text>',
      '<rect x="205" y="130" width="60" height="50" rx="6" fill="' + lt + '"/><text x="235" y="172" text-anchor="middle" fill="#334155" font-family="monospace" font-size="7" font-weight="700">' + lt.toUpperCase() + '</text>',
      '<rect x="270" y="130" width="60" height="50" rx="6" fill="#1e293b" stroke="' + p + '"/><text x="300" y="158" text-anchor="middle" fill="' + p + '" font-family="Inter,sans-serif" font-size="8" font-weight="800">10 SECTIONS</text><text x="300" y="170" text-anchor="middle" fill="#94a3b8" font-family="Inter,sans-serif" font-size="6.5">PRINT+SOCIAL</text>',
      '</svg>'
    ].join("");
  }

  function initBrandKitUI() {
    var elName = document.getElementById("bkName");
    var elTag = document.getElementById("bkTagline");
    var elWeb = document.getElementById("bkWebsite");
    var elEmail = document.getElementById("bkEmail");
    var elPhone = document.getElementById("bkPhone");
    var elAddr = document.getElementById("bkAddress");
    var elPrim = document.getElementById("bkPrimary");
    var elSec = document.getElementById("bkSecondary");
    var elDark = document.getElementById("bkDark");
    var elLight = document.getElementById("bkLight");
    var elTFont = document.getElementById("bkTitleFont");
    var elBFont = document.getElementById("bkBodyFont");
    var elPrev = document.getElementById("bkPreview");
    var elStat = document.getElementById("bkStatus");
    var btnExt = document.getElementById("btnBkExtractLogo");
    var btnGen = document.getElementById("btnBkGenerate");
    if (!elName || !elPrev) return;

    function getCheckedItems() {
      var keys = ["bkSec1","bkSec2","bkSec3","bkSec4","bkSec5","bkSec6","bkSec7","bkSec8","bkSec9","bkSec10"];
      var out = {};
      keys.forEach(function (k) {
        var el = document.getElementById(k);
        out[k] = el ? !!el.checked : true;
      });
      return out;
    }

    function rgbStr(hex) { var c = hexToRgb(hex); return "RGB(" + c.r + ", " + c.g + ", " + c.b + ")"; }
    function readPlan() {
      var elTpl = document.getElementById("bkTemplate");
      var elAcc = document.getElementById("bkAccent");
      var elStory = document.getElementById("bkStory");
      var elMiss = document.getElementById("bkMission");
      var elAud = document.getElementById("bkAudience");
      var elVal = document.getElementById("bkValues");
      var elPers = document.getElementById("bkPersonality");
      var p = elPrim.value || "#2ed3a3";
      var s = elSec.value || "#0ea5e9";
      var a = (elAcc && elAcc.value) ? elAcc.value : "#f59e0b";
      var dk = elDark.value || "#0b1120";
      var lt = (elLight && elLight.value) ? elLight.value : "#f8fafc";
      return {
        templateStyle: elTpl ? elTpl.value : "bento_dark",
        brandName: elName.value.trim() || "DESIGN360N",
        tagline: elTag.value.trim() || "Crafted with Precision",
        story: elStory ? elStory.value.trim() : "Built to deliver modern, memorable design systems.",
        mission: elMiss ? elMiss.value.trim() : "Empower brands through precision visual craft.",
        audience: elAud ? elAud.value.trim() : "Modern businesses & creative teams",
        values: elVal ? elVal.value.trim() : "Clarity • Craft • Consistency • Trust",
        personality: elPers ? elPers.value.trim() : "Confident, Minimal, Contemporary",
        website: elWeb.value.trim() || "www.design360n.com",
        email: elEmail.value.trim() || "hello@design360n.com",
        phone: elPhone.value.trim() || "+880 1799-137986",
        address: elAddr.value.trim() || "Dhaka, Bangladesh",
        primary: p, secondary: s, accent: a, dark: dk, light: lt,
        rgbPrimary: rgbStr(p), rgbSecondary: rgbStr(s), rgbAccent: rgbStr(a), rgbDark: rgbStr(dk), rgbLight: rgbStr(lt),
        cmykPrimary: rgbToCmykStr(p), cmykSecondary: rgbToCmykStr(s), cmykAccent: rgbToCmykStr(a), cmykDark: rgbToCmykStr(dk), cmykLight: rgbToCmykStr(lt),
        titleFont: elTFont ? elTFont.value.trim() : "Montserrat",
        bodyFont: elBFont ? elBFont.value.trim() : "Arial",
        include: getCheckedItems()
      };
    }

    function refresh() {
      elPrev.innerHTML = brandPreviewSVG(readPlan());
    }

    [elName, elTag, elWeb, elEmail, elPhone, elAddr, elPrim, elSec, elDark, elLight, elTFont, elBFont].forEach(function (el) {
      if (!el) return;
      el.addEventListener("input", refresh);
      el.addEventListener("change", refresh);
    });

    if (btnExt) {
      btnExt.addEventListener("click", function () {
        if (!csInterface || !csInterface.isInCEP()) {
          if (elStat) elStat.textContent = "Preview Mode: Select your vector logo inside Illustrator first.";
          return;
        }
        csInterface.evalScript("dmExtractLogoColorsAI()", function (res) {
          if (res && res.indexOf("OK:") === 0) {
            var cols = res.slice(3).split("|").filter(Boolean);
            if (cols[0]) elPrim.value = cols[0];
            if (cols[1]) elSec.value = cols[1];
            if (cols[2]) elDark.value = cols[2];
            refresh();
            if (elStat) { elStat.textContent = "Extracted " + cols.length + " brand colors from selected logo!"; elStat.style.color = "#3bcdca"; }
          } else {
            if (elStat) { elStat.textContent = res || "Select a vector logo in Illustrator first."; elStat.style.color = "#f87171"; }
          }
        });
      });
    }

    if (btnGen) {
      btnGen.addEventListener("click", function () {
        var plan = readPlan();
        if (!csInterface || !csInterface.isInCEP()) {
          if (elStat) elStat.textContent = "Preview Mode: Open inside Adobe Illustrator to generate Brand Kit.";
          return;
        }
        if (elStat) { elStat.textContent = "Building multi-artboard Brand Identity Kit in Illustrator…"; elStat.style.color = "#3bcdca"; }
        csInterface.evalScript("dmGenerateBrandKitAI('" + escJSX(plan) + "')", function (res) {
          if (elStat) {
            elStat.textContent = (res && res.indexOf("OK:") === 0) ? res.substring(3) : (res || "Brand Identity Kit created!");
            elStat.style.color = (res && res.indexOf("ERROR:") === 0) ? "#f87171" : "#3bcdca";
          }
        });
      });
    }


    var btnPdf = document.getElementById("btnBkExportPDF");
    if (btnPdf) {
      btnPdf.addEventListener("click", function () {
        if (!csInterface || !csInterface.isInCEP()) {
          if (elStat) elStat.textContent = "Preview Mode: Open inside Illustrator to export Brand Guideline PDF.";
          return;
        }
        csInterface.evalScript("dmExportBrandGuidelinePDF()", function (res) {
          if (elStat) {
            elStat.textContent = (res && res.indexOf("OK:") === 0) ? res.substring(3) : (res || "Brand Guideline PDF exported!");
            elStat.style.color = (res && res.indexOf("ERROR:") === 0) ? "#f87171" : "#3bcdca";
          }
        });
      });
    }

    refresh();
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initBrandKitUI);
    else initBrandKitUI();
  }

  global.BrandKitStudio = { brandPreviewSVG: brandPreviewSVG, rgbToCmykStr: rgbToCmykStr };
})(typeof window !== "undefined" ? window : globalThis);
