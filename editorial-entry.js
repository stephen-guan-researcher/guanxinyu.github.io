// An optional, lightweight frontispiece. The complete homepage works without it.
const SESSION_KEY = "xinyu-entry-seen-v1";

// Decorative bytes are requested only once the optional introduction is shown.
// Closing/entering removes listeners so a late image cannot restart gate motion.
export function loadEntryImage(dialog, onReady = () => {}) {
  const image = dialog.querySelector("[data-entry-image]");
  const source = image?.getAttribute?.("data-src");
  if (!image || !source) return () => {};
  let active = true;
  const cleanup = () => {
    active = false;
    image.removeEventListener?.("load", settle);
    image.removeEventListener?.("error", settle);
  };
  function settle(event) {
    if (!active || !dialog.open) return;
    const loaded = event?.type === "load" || (image.complete && image.naturalWidth > 0);
    dialog.setAttribute("data-entry-image-ready", loaded ? "true" : "error");
    cleanup();
    onReady(loaded ? image : null);
  }
  dialog.setAttribute("data-entry-image-ready", "pending");
  image.addEventListener("load", settle, { once: true });
  image.addEventListener("error", settle, { once: true });
  image.setAttribute("sizes", image.getAttribute("sizes") || "100vw");
  const responsive = image.getAttribute("data-srcset");
  if (responsive) image.setAttribute("srcset", responsive);
  image.setAttribute("src", source);
  if (image.complete && image.naturalWidth > 0) settle({ type: "load" });
  return cleanup;
}

export function shouldShowEntry(win) {
  const hash = win.location?.hash || "";
  if (hash && hash !== "#home") return false;
  if (win.performance?.getEntriesByType?.("navigation")?.[0]?.type === "back_forward") return false;
  const replay = new URLSearchParams(win.location?.search || "").get("intro") === "1";
  if (replay) return true;
  if ((win.scrollY || 0) > 80) return false;
  try { return win.sessionStorage?.getItem(SESSION_KEY) !== "1"; }
  catch { return true; }
}

export function initSiteEntry(doc, win, onComplete = () => {}) {
  const dialog = doc.getElementById("site-entry");
  if (!dialog || typeof dialog.showModal !== "function" || !shouldShowEntry(win)) return false;
  const enter = dialog.querySelector("[data-entry-enter]");
  if (!enter) return false;
  const preference = win.matchMedia?.("(prefers-reduced-motion: reduce)");
  const animations = new Set();
  let exiting = false;
  let completed = false;
  let safetyTimer;
  let cleanupImage = () => {};
  const cancelAnimations = () => {
    animations.forEach((animation) => animation.cancel());
    animations.clear();
  };
  const remember = () => {
    try { win.sessionStorage?.setItem(SESSION_KEY, "1"); } catch { /* Storage may be disabled. */ }
  };
  const complete = (focus = true) => {
    if (completed) return;
    completed = true;
    win.clearTimeout(safetyTimer);
    cleanupImage();
    cancelAnimations();
    if (dialog.open) dialog.close();
    remember();
    preference?.removeEventListener?.("change", onPreferenceChange);
    win.removeEventListener?.("hashchange", onHashChange);
    win.removeEventListener?.("pagehide", onPageHide);
    win.removeEventListener?.("keydown", onKeyDown);
    win.removeEventListener?.("load", focusEntry);
    if (focus) {
      const heading = doc.getElementById("profile-name");
      heading?.setAttribute("tabindex", "-1");
      heading?.focus({ preventScroll: true });
    }
    onComplete();
  };
  const animate = (target, frames, options) => {
    if (typeof target?.animate !== "function") return null;
    const animation = target.animate(frames, options);
    animations.add(animation);
    return animation;
  };
  const leave = (immediate = false) => {
    if (completed) return;
    if (immediate || preference?.matches) return complete();
    if (exiting) return;
    exiting = true;
    cleanupImage();
    cancelAnimations();
    const mobile = (win.innerWidth || 1440) < 600;
    const animation = animate(dialog, [
      { opacity: 1, transform: "none" },
      { opacity: 0, transform: `translateY(-${mobile ? 6 : 12}px)` },
    ], { duration: mobile ? 320 : 560, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" });
    if (!animation) return complete();
    animation.addEventListener("finish", () => complete(), { once: true });
    // Never leave an invisible modal in the way if the animation is interrupted.
    animation.addEventListener("cancel", () => complete(), { once: true });
    safetyTimer = win.setTimeout(() => complete(), 800);
  };
  function onPreferenceChange(event) {
    if (!event.matches) return;
    if (exiting) complete();
    else cancelAnimations();
  }
  function onHashChange() { if (win.location.hash && win.location.hash !== "#home") complete(false); }
  function onPageHide() { complete(false); }
  function focusEntry() {
    if (!completed && dialog.open && !dialog.contains?.(doc.activeElement)) enter.focus({ preventScroll: true });
  }
  function onKeyDown(event) {
    if (!dialog.open) return;
    if (event.key === "Tab") {
      dialog.setAttribute("data-entry-keyboard", "true");
      event.preventDefault();
      enter.focus({ preventScroll: true });
      return;
    }
    if (event.key === "Enter" && !event.repeat) {
      event.preventDefault();
      leave();
    }
  }
  enter.addEventListener("click", () => leave());
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); leave(true); });
  dialog.addEventListener("close", () => complete());
  // Fragment navigation can briefly move focus to body after showModal. Keep
  // Enter operable even then; native dialog still supplies Tab focus isolation.
  win.addEventListener?.("keydown", onKeyDown);
  win.addEventListener?.("load", focusEntry, { once: true });
  preference?.addEventListener?.("change", onPreferenceChange);
  win.addEventListener?.("hashchange", onHashChange);
  win.addEventListener?.("pagehide", onPageHide);
  try { dialog.showModal(); }
  catch { complete(false); return true; }
  cleanupImage = loadEntryImage(dialog, (image) => {
    if (!image || completed || exiting || preference?.matches) return;
    animate(image, [
      { transform: "scale(1.01) translateX(0)", opacity: 1 },
      { transform: "scale(1.025) translateX(-0.4%)", opacity: 0.96 },
    ], { duration: 14000, easing: "ease-in-out", direction: "alternate", iterations: Infinity });
  });
  enter.focus({ preventScroll: true });
  win.requestAnimationFrame?.(focusEntry);
  if (!preference?.matches) {
    animate(dialog.querySelector(".entry-center"), [
      { opacity: 0.2, transform: "translateY(8px)" },
      { opacity: 1, transform: "none" },
    ], { duration: (win.innerWidth || 1440) < 600 ? 320 : 600, easing: "cubic-bezier(.22,1,.36,1)" });
  }
  return true;
}
