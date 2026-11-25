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

  /* Home cards + Back button (Photoshop-style navigation, v17.7.3).
   * Only clicks EXISTING tab/subtab/mode buttons and scrolls the page — it never
   * calls a panel function directly and never reads or writes any other
   * element's value. The Home tab button works through app.js initTabs. */
  function goHome() {
    var homeBtn = document.querySelector('.tab-btn[data-tab="tab-home"]');
    if (homeBtn) {
      homeBtn.click();
      window.scrollTo(0, 0);
      return;
    }
    // Fallback if the Home tab button is ever removed: toggle classes directly.
    var btns = document.querySelectorAll(".tab-btn");
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove("active");
    var panes = document.querySelectorAll(".tab-pane");
    for (var j = 0; j < panes.length; j++) panes[j].classList.remove("active");
    var home = document.getElementById("tab-home");
    if (home) home.classList.add("active");
    window.scrollTo(0, 0);
  }
  function openTool(card) {
    var tab = card.getAttribute("data-goto-tab");
    var pro = card.getAttribute("data-goto-pro");
    var mode = card.getAttribute("data-goto-mode");
    if (!tab) return;
    var tabBtn = document.querySelector('.tab-btn[data-tab="' + tab + '"]');
    if (tabBtn) tabBtn.click();
    if (mode) {
      var modeBtn = document.getElementById(mode);
      if (modeBtn) modeBtn.click();
    }
    var target = document.getElementById(tab);
    if (pro) {
      var subBtn = document.querySelector('.subtab-btn[data-pro="' + pro + '"]');
      if (subBtn) subBtn.click();
      var sec = document.getElementById(pro);
      if (sec) target = sec;
    }
    if (target) {
      target.scrollIntoView();
      window.scrollBy(0, -110); // clear the sticky header + tab bar
    }
  }
  function initHomeNav() {
    var cards = document.querySelectorAll(".home-card");
    for (var i = 0; i < cards.length; i++) {
      cards[i].addEventListener("click", function () { openTool(this); });
    }
    var backs = document.querySelectorAll(".back-btn");
    for (var j = 0; j < backs.length; j++) {
      backs[j].addEventListener("click", goHome);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHomeNav);
  } else {
    initHomeNav();
  }
})();
