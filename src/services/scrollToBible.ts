// src/utils/scrollToBible.ts
export function scrollToBible(offsetPx = 0) {
  const el = document.getElementById("bible-container");
  if (!el) {
    // If content just changed and the element isn't in the DOM yet, try next frame.
    requestAnimationFrame(() => scrollToBible(offsetPx));
    return;
  }
  const y = el.getBoundingClientRect().top + window.scrollY - offsetPx;
  window.scrollTo({ top: y, behavior: "smooth" });
}

export function getHeaderOffsetPx(headerId = "selector") {
  const header = document.getElementById(headerId);
  return header ? header.offsetHeight : 0;
}
