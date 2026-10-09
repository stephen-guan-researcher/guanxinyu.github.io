import { initSiteEntry } from "./editorial-entry.js?v=20261009-invitation-entry-1";

// Small, progressively enhanced interactions. Content never depends on motion.
export function readingProgress(scrollTop, scrollHeight, viewportHeight) {
  const distance = Math.max(0, scrollHeight - viewportHeight);
  if (!Number.isFinite(distance) || distance === 0) return 0;
  return Math.min(1, Math.max(0, Number(scrollTop) || 0) / distance);
}

export function initReadingTools(doc, win) {
  const progress = doc.querySelector("[data-reading-progress]");
  const back = doc.querySelector("[data-back-to-top]");
  if (!progress || !back) return;
  const reduced = win.matchMedia?.("(prefers-reduced-motion: reduce)");
  const update = () => {
    const root = doc.documentElement;
    const height = win.innerHeight || root.clientHeight;
    const top = win.scrollY ?? root.scrollTop ?? 0;
    progress.hidden = root.scrollHeight <= height;
    progress.style.transform = `scaleX(${readingProgress(top, root.scrollHeight, height)})`;
    back.hidden = top < Math.max(600, height * 0.8);
  };
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    if (typeof win.requestAnimationFrame !== "function") return update();
    scheduled = true;
    win.requestAnimationFrame(() => { scheduled = false; update(); });
  };
  win.addEventListener("scroll", schedule, { passive: true });
  win.addEventListener("resize", schedule, { passive: true });
  doc.addEventListener?.("toggle", schedule, true);
  doc.addEventListener?.("load", schedule, true);
  if (typeof win.ResizeObserver === "function") {
    const observer = new win.ResizeObserver(schedule);
    observer.observe(doc.body);
  }
  back.addEventListener("click", () => {
    const heading = doc.querySelector("main h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
    win.scrollTo({ top: 0, behavior: reduced?.matches ? "instant" : "smooth" });
  });
  update();
}

export function initRevealMotion(doc, win) {
  const preference = win.matchMedia?.("(prefers-reduced-motion: reduce)");
  if (preference?.matches || typeof win.IntersectionObserver !== "function") return;
  const animations = new Set();
  const observer = new win.IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (preference?.matches || typeof entry.target.animate !== "function") continue;
      const animation = entry.target.animate([
        { opacity: 0.55, transform: "translateY(10px)" },
        { opacity: 1, transform: "none" },
      ], { duration: 420, easing: "cubic-bezier(.2,.7,.2,1)" });
      animations.add(animation);
      animation.addEventListener("finish", () => animations.delete(animation), { once: true });
      animation.addEventListener("cancel", () => animations.delete(animation), { once: true });
    }
  }, { threshold: 0, rootMargin: "0px 0px -24px 0px" });
  doc.querySelectorAll(".editorial-hero, .workspace-main > .content-card, .workspace-main > .news-card")
    .forEach((section) => observer.observe(section));
  preference?.addEventListener?.("change", (event) => {
    if (!event.matches) return;
    observer.disconnect();
    animations.forEach((animation) => animation.cancel());
    animations.clear();
  });
}

export function initFigureViewer(doc) {
  const figures = [...doc.querySelectorAll(".publication-card-figure:not([data-figure-status='pending']), .life-tile")];
  if (!figures.length || doc.getElementById("figure-viewer")) return;
  const viewer = doc.createElement("dialog");
  if (typeof viewer.showModal !== "function") return;
  viewer.id = "figure-viewer";
  viewer.className = "figure-viewer";
  viewer.setAttribute("aria-labelledby", "figure-viewer-title");
  const header = doc.createElement("div");
  header.className = "figure-viewer-heading";
  const title = doc.createElement("h2");
  title.id = "figure-viewer-title";
  const close = doc.createElement("button");
  close.type = "button";
  close.textContent = "Close";
  close.setAttribute("aria-label", "Close image viewer");
  const image = doc.createElement("img");
  image.decoding = "async";
  header.append(title, close);
  viewer.append(header, image);
  doc.body.append(viewer);
  let opener;
  const dismiss = () => viewer.close();
  close.addEventListener("click", dismiss);
  viewer.addEventListener("cancel", (event) => { event.preventDefault(); dismiss(); });
  viewer.addEventListener("click", (event) => {
    if (event.target !== viewer) return;
    const bounds = viewer.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) dismiss();
  });
  // The viewer has one interactive control; keep keyboard focus visible.
  viewer.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    close.focus();
  });
  viewer.addEventListener("close", () => {
    image.removeAttribute("src");
    opener?.focus({ preventScroll: true });
  });
  for (const figure of figures) {
    const source = figure.querySelector("picture img");
    if (!source?.getAttribute("src")) continue;
    const button = doc.createElement("button");
    button.type = "button";
    button.className = "figure-expand";
    button.setAttribute("aria-label", `Enlarge image: ${source.alt}`);
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-controls", viewer.id);
    button.title = "Click to enlarge";
    button.addEventListener("click", () => {
      opener = button;
      title.textContent = figure.closest("article")?.querySelector("h3")?.textContent.trim() || source.alt;
      image.alt = source.alt;
      // Full-resolution assets are requested only after an explicit click.
      image.src = source.getAttribute("src");
      viewer.showModal();
    });
    figure.append(button);
  }
}

export function initEditorialInteractions(doc, win) {
  if (!doc.body?.classList.contains("editorial-page")) return;
  initReadingTools(doc, win);
  initFigureViewer(doc);
  if (!initSiteEntry(doc, win, () => initRevealMotion(doc, win))) initRevealMotion(doc, win);
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => initEditorialInteractions(document, window));
}
