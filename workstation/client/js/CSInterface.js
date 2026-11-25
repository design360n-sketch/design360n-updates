/**
 * Lightweight Adobe CEP CSInterface bridge (compatible with CSXS 9 - 13)
 * Works natively inside Adobe Illustrator CEP and gracefully falls back in a regular browser.
 */
(function (global) {
  "use strict";

  function CSInterface() {
    this.hostEnvironment = this.getHostEnvironment();
  }

  CSInterface.prototype.isInCEP = function () {
    return typeof window.__adobe_cep__ !== "undefined";
  };

  CSInterface.prototype.getHostEnvironment = function () {
    if (this.isInCEP()) {
      try {
        return JSON.parse(window.__adobe_cep__.getHostEnvironment());
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  CSInterface.prototype.evalScript = function (script, callback) {
    if (callback === null || callback === undefined) {
      callback = function () {};
    }
    if (this.isInCEP()) {
      window.__adobe_cep__.evalScript(script, callback);
    } else {
      console.warn("[CSInterface] Running outside Adobe Illustrator (Standalone Browser Preview Mode).");
      callback("STANDALONE_PREVIEW");
    }
  };

  CSInterface.prototype.getSystemPath = function (pathType) {
    if (this.isInCEP()) {
      var path = decodeURI(window.__adobe_cep__.getSystemPath(pathType));
      if (path.indexOf("file://") === 0) {
        path = path.replace("file://", "");
        if (/^\/[A-Za-z]:/.test(path)) {
          path = path.substring(1);
        }
      }
      return path;
    }
    return "";
  };

  CSInterface.prototype.addEventListener = function (type, listener, obj) {
    if (this.isInCEP()) {
      window.__adobe_cep__.addEventListener(type, listener, obj);
    }
  };

  CSInterface.prototype.openURLInDefaultBrowser = function (url) {
    if (this.isInCEP() && window.cep && window.cep.util) {
      window.cep.util.openURLInDefaultBrowser(url);
    } else {
      window.open(url, "_blank");
    }
  };

  global.CSInterface = CSInterface;
})(window);
