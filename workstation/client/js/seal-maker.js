/* Design360n Workstation — Seal Maker client.
 * Reads the Seal Maker fields and calls the host engine (dmGenerateSeal)
 * through the panel's standard CSInterface.evalScript pattern (same as the
 * QR and Calendar tools in app.js). Standalone file: it never touches any
 * other tool's logic or elements, and only writes its own status line. */
(function () {
  var csInterface = new CSInterface();

  function escJSX(obj) {
    var json = JSON.stringify(obj).replace(/[\u007F-\uFFFF]/g, function (ch) {
      return "\\u" + ("0000" + ch.charCodeAt(0).toString(16)).slice(-4);
    });
    return json.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }

  function status(msg, isError) {
    var el = document.getElementById("sealStatus");
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? "#f87171" : "#3bcdca";
  }

  function val(id, fallback) {
    var el = document.getElementById(id);
    if (!el) return fallback;
    var v = (el.value || "").toString().trim();
    return v === "" ? fallback : v;
  }

  function generateSeal() {
    var dia = parseFloat(val("sealDiameter", "40")) || 40;
    if (dia < 20) dia = 20;
    if (dia > 100) dia = 100;
    var payload = {
      outerText: val("sealOuterText", "M/S NAYEM ENTERPRISE"),
      innerText: val("sealInnerText", "PROPRIETOR: NAYEM ISLAM"),
      centre1: val("sealCentre1", "DHAKA"),
      centre2: val("sealCentre2", "BANGLADESH"),
      shape: val("sealShape", "round"),
      rings: val("sealRings", "double"),
      centre: val("sealCentre", "star"),
      diameterMm: dia,
      color: val("sealColor", "black")
    };
    if (!csInterface.isInCEP()) {
      status("Preview Mode: Open inside Adobe Illustrator to generate the seal.", true);
      return;
    }
    status("Generating seal…");
    try {
      csInterface.evalScript("dmGenerateSeal('" + escJSX(payload) + "')", function (res) {
        if (res === "STANDALONE_PREVIEW") {
          status("Preview Mode: Open inside Adobe Illustrator to generate the seal.", true);
        } else if (res && res.indexOf("OK:") === 0) {
          status(res.substring(3));
        } else {
          status(res || "Seal generation failed.", true);
        }
      });
    } catch (e) {
      status("Seal generation failed: " + (e && e.message ? e.message : e), true);
    }
  }

  function init() {
    var btn = document.getElementById("sealGenerate");
    if (btn) btn.addEventListener("click", generateSeal);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
