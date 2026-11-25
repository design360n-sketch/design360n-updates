/* Design360n Workstation — Easy UI: "Advanced / Aro settings" toggles.
 * This file ONLY toggles the .open class on the nearest .adv wrapper when
 * its toggle button is clicked. It never calls any panel function, never
 * reads or writes any other element's value, and never changes any state
 * except the collapsed/expanded class and aria-expanded on the button. */
(function () {
  function init() {
    var toggles = document.querySelectorAll(".adv-toggle");
    for (var i = 0; i < toggles.length; i++) {
      toggles[i].addEventListener("click", function () {
        var box = this.parentElement;
        if (!box || !box.classList || !box.classList.contains("adv")) return;
        var open = box.classList.toggle("open");
        this.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
