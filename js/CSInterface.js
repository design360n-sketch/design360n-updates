/* Minimal CSInterface shim for Design360n CEP panel.
 * Uses the CEP __adobe_cep__ bridge that Photoshop exposes to extension panels.
 * Only the calls this panel needs are implemented.
 */
function CSInterface() {}
CSInterface.prototype.evalScript = function (script, callback) {
    try {
        if (window.__adobe_cep__) {
            window.__adobe_cep__.evalScript(script, callback || function () {});
        } else if (typeof cep !== "undefined" && cep.util && cep.util.evalScript) {
            cep.util.evalScript(script, callback || function () {});
        } else {
            if (callback) callback("CEP bridge payoa jay nai — Photoshop-e extension hisebe load hoy nai.");
        }
    } catch (e) {
        if (callback) callback("Error: " + e.message);
    }
};
CSInterface.prototype.getHostEnvironment = function () {
    try {
        if (window.__adobe_cep__) {
            return JSON.parse(window.__adobe_cep__.getHostEnvironment());
        }
    } catch (e) { /* ignore */ }
    return { appName: "PHSP", appVersion: "" };
};

CSInterface.prototype.openURLInDefaultBrowser = function (url) {
    try {
        if (typeof cep !== "undefined" && cep.util && cep.util.openURLInDefaultBrowser) {
            cep.util.openURLInDefaultBrowser(url);
            return true;
        }
        if (window.__adobe_cep__ && window.__adobe_cep__.invokeSync) {
            window.__adobe_cep__.invokeSync("openURLInDefaultBrowser", JSON.stringify({ url: url }));
            return true;
        }
        window.open(url, "_blank");
        return true;
    } catch (e) {
        try { window.open(url, "_blank"); } catch (e2) {}
        return false;
    }
};
