"use strict";
(() => {
  // Additive usability fix for long scholarly text. Does not modify the
  // original photo garden or its circular slide / petal transition logic.
  if (!document.querySelector(".research-root")) return;
  window.addEventListener("wheel", event => {
    // The explicit chapter toggle owns wheel handling when available.
    if (document.querySelector(".rh-chapter-read-toggle")) return;
    if (event.ctrlKey || event.metaKey) return;
    const panel=event.target.closest(".dd-panel, .research-inner");
    if (!panel) return;
    if (Math.abs(event.deltaX)>Math.abs(event.deltaY)*0.85) return;
    const delta=event.deltaY;
    const overflow=panel.scrollHeight-panel.clientHeight;
    const canScroll=overflow>6 &&
      ((delta>0 && panel.scrollTop<overflow-2) ||
       (delta<0 && panel.scrollTop>2));
    if (canScroll) {
      // Keep wheel behaviour native within text; do not turn pages until
      // the reader reaches the top/bottom of this scene.
      event.stopImmediatePropagation();
    }
  }, {capture:true, passive:true});
  // Native links preserve deep links; a visible "read scroll" hint is
  // provided by the content itself. No global keyboard interceptions.
})();
