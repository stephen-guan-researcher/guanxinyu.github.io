import test from "node:test";
import assert from "node:assert/strict";

import {
  initFigureViewer,
  initReadingTools,
  initRevealMotion,
  readingProgress,
} from "../editorial-interactions.js";

class EventTargetMock {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener, options = {}) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push({ listener, once: options?.once === true });
    this.listeners.set(type, listeners);
  }

  dispatch(type, event = {}) {
    const listeners = [...(this.listeners.get(type) ?? [])];
    for (const entry of listeners) {
      entry.listener({ target: this, preventDefault() {}, ...event });
      if (entry.once) {
        this.listeners.set(type, (this.listeners.get(type) ?? []).filter((item) => item !== entry));
      }
    }
  }
}

class ElementMock extends EventTargetMock {
  constructor(tagName) {
    super();
    this.tagName = tagName.toUpperCase();
    this.attributes = new Map();
    this.children = [];
    this.style = {};
    this.hidden = false;
    this.textContent = "";
    this.alt = "";
    this.focusCalls = [];
  }

  append(...children) {
    for (const child of children) {
      child.parentNode = this;
      this.children.push(child);
    }
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name) {
    this.attributes.delete(name);
  }

  set src(value) {
    this.setAttribute("src", value);
  }

  get src() {
    return this.getAttribute("src") ?? "";
  }

  focus(options) {
    this.focusCalls.push(options);
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (selector === "article" && current.tagName === "ARTICLE") return current;
      current = current.parentNode;
    }
    return null;
  }

  querySelector(selector) {
    const descendants = [];
    const visit = (node) => {
      for (const child of node.children ?? []) {
        descendants.push(child);
        visit(child);
      }
    };
    visit(this);
    if (selector === "h3") return descendants.find((node) => node.tagName === "H3") ?? null;
    if (selector === "picture img") {
      const picture = descendants.find((node) => node.tagName === "PICTURE");
      return picture?.querySelector("img") ?? null;
    }
    if (selector === "img") return descendants.find((node) => node.tagName === "IMG") ?? null;
    return null;
  }
}

function mediaPreference(matches = false) {
  const preference = new EventTargetMock();
  preference.matches = matches;
  return preference;
}

function readingFixture({ scrollHeight = 2_000, viewportHeight = 1_000, scrollY = 0, reduced = false } = {}) {
  const progress = new ElementMock("div");
  const back = new ElementMock("button");
  const heading = new ElementMock("h1");
  const preference = mediaPreference(reduced);
  const frames = [];
  const calls = [];
  const listeners = new Map();
  const root = { scrollHeight, clientHeight: viewportHeight, scrollTop: scrollY };
  const doc = {
    documentElement: root,
    querySelector(selector) {
      return new Map([
        ["[data-reading-progress]", progress],
        ["[data-back-to-top]", back],
        ["main h1", heading],
      ]).get(selector) ?? null;
    },
  };
  const win = {
    innerHeight: viewportHeight,
    scrollY,
    matchMedia() { return preference; },
    addEventListener(type, listener) { listeners.set(type, listener); },
    requestAnimationFrame(callback) { frames.push(callback); return frames.length; },
    scrollTo(options) { calls.push(["scroll", options]); },
  };
  const originalFocus = heading.focus.bind(heading);
  heading.focus = (options) => {
    calls.push(["focus", options]);
    originalFocus(options);
  };
  return { back, calls, doc, frames, heading, listeners, preference, progress, root, win };
}

test("readingProgress clamps overscroll and treats a short page as zero progress", () => {
  assert.equal(readingProgress(-50, 2_000, 1_000), 0);
  assert.equal(readingProgress(500, 2_000, 1_000), 0.5);
  assert.equal(readingProgress(5_000, 2_000, 1_000), 1);
  assert.equal(readingProgress(250, 800, 1_000), 0);
  assert.equal(readingProgress(250, 1_000, 1_000), 0);
});

test("initReadingTools coalesces scroll and resize work into one animation frame", () => {
  const fixture = readingFixture();
  initReadingTools(fixture.doc, fixture.win);

  assert.equal(fixture.progress.style.transform, "scaleX(0)");
  assert.equal(fixture.progress.hidden, false);
  assert.equal(fixture.back.hidden, true);

  fixture.win.scrollY = 1_000;
  fixture.listeners.get("scroll")();
  fixture.listeners.get("scroll")();
  fixture.listeners.get("resize")();

  assert.equal(fixture.frames.length, 1);
  assert.equal(fixture.progress.style.transform, "scaleX(0)", "the DOM must wait for the queued frame");
  fixture.frames.shift()();
  assert.equal(fixture.progress.style.transform, "scaleX(1)");
  assert.equal(fixture.back.hidden, false);
});

test("initReadingTools hides inactive controls on a short page", () => {
  const fixture = readingFixture({ scrollHeight: 700, viewportHeight: 900 });
  initReadingTools(fixture.doc, fixture.win);

  assert.equal(fixture.progress.hidden, true);
  assert.equal(fixture.progress.style.transform, "scaleX(0)");
  assert.equal(fixture.back.hidden, true);
});

test("reduced-motion back-to-top focuses the heading and scrolls instantly", () => {
  const fixture = readingFixture({ scrollY: 900, reduced: true });
  initReadingTools(fixture.doc, fixture.win);
  fixture.back.dispatch("click");

  assert.equal(fixture.heading.getAttribute("tabindex"), "-1");
  assert.deepEqual(fixture.heading.focusCalls, [{ preventScroll: true }]);
  assert.deepEqual(
    fixture.calls.filter(([type]) => type === "scroll"),
    [["scroll", { top: 0, behavior: "instant" }]],
  );
});

function revealFixture({ reduced = false } = {}) {
  const preference = mediaPreference(reduced);
  const section = new ElementMock("section");
  let animateCalls = 0;
  const animation = new EventTargetMock();
  animation.cancelCalls = 0;
  animation.cancel = () => {
    animation.cancelCalls += 1;
    animation.dispatch("cancel");
  };
  section.animate = (keyframes, options) => {
    animateCalls += 1;
    animation.keyframes = keyframes;
    animation.options = options;
    return animation;
  };
  const observers = [];
  class IntersectionObserverMock {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options;
      this.observed = [];
      this.unobserved = [];
      this.disconnectCalls = 0;
      observers.push(this);
    }

    observe(target) { this.observed.push(target); }
    unobserve(target) { this.unobserved.push(target); }
    disconnect() { this.disconnectCalls += 1; }
  }
  const doc = {
    querySelectorAll(selector) {
      assert.equal(selector, ".editorial-hero, .workspace-main > .content-card, .workspace-main > .news-card");
      return [section];
    },
  };
  const win = {
    IntersectionObserver: IntersectionObserverMock,
    matchMedia() { return preference; },
  };
  return { animation, doc, get animateCalls() { return animateCalls; }, observers, preference, section, win };
}

test("initRevealMotion does not construct an observer for reduced motion", () => {
  const fixture = revealFixture({ reduced: true });
  initRevealMotion(fixture.doc, fixture.win);
  assert.equal(fixture.observers.length, 0);
  assert.equal(fixture.animateCalls, 0);
});

test("initRevealMotion keeps content visible, unobserves revealed sections, and cancels active motion", () => {
  const fixture = revealFixture();
  const originalStyle = { ...fixture.section.style };
  initRevealMotion(fixture.doc, fixture.win);

  assert.equal(fixture.observers.length, 1);
  const [observer] = fixture.observers;
  assert.deepEqual(observer.observed, [fixture.section]);
  assert.equal(fixture.section.hidden, false);
  assert.deepEqual(fixture.section.style, originalStyle, "initialization must not hide readable source content");

  observer.callback([{ target: fixture.section, isIntersecting: true }]);
  assert.deepEqual(observer.unobserved, [fixture.section]);
  assert.equal(fixture.animateCalls, 1);
  assert.deepEqual(fixture.animation.options, {
    duration: 420,
    easing: "cubic-bezier(.2,.7,.2,1)",
  });

  fixture.preference.matches = true;
  fixture.preference.dispatch("change", { matches: true });
  assert.equal(observer.disconnectCalls, 1);
  assert.equal(fixture.animation.cancelCalls, 1);
});

function imageFigure({ pending = false, title = "Paper title", src = "images/full.png", alt = "Paper figure" } = {}) {
  const article = new ElementMock("article");
  const heading = new ElementMock("h3");
  heading.textContent = title;
  const figure = new ElementMock("figure");
  if (pending) figure.setAttribute("data-figure-status", "pending");
  const picture = new ElementMock("picture");
  const image = new ElementMock("img");
  image.setAttribute("src", src);
  image.alt = alt;
  picture.append(image);
  figure.append(picture);
  article.append(heading, figure);
  return { article, figure, image };
}

function figureFixture({ dialogSupported = true } = {}) {
  const eligible = imageFigure();
  const pending = imageFigure({ pending: true, title: "Pending paper", src: "images/pending-background.png" });
  const body = new ElementMock("body");
  const expectedSelector = ".publication-card-figure:not([data-figure-status='pending']), .life-tile";
  const doc = {
    body,
    selectors: [],
    querySelectorAll(selector) {
      this.selectors.push(selector);
      if (selector === expectedSelector) return [eligible.figure];
      if (selector.includes(".publication-card-figure")) return [eligible.figure, pending.figure];
      return [];
    },
    getElementById(id) {
      if (id !== "figure-viewer") return null;
      return body.children.find((child) => child.id === id) ?? null;
    },
    createElement(tagName) {
      const element = new ElementMock(tagName);
      if (tagName === "dialog" && dialogSupported) {
        element.showCount = 0;
        element.showModal = () => { element.open = true; element.showCount += 1; };
        element.close = () => { element.open = false; element.dispatch("close"); };
      }
      return element;
    },
  };
  return { body, doc, eligible, expectedSelector, pending };
}

test("initFigureViewer leaves figures untouched when dialog support is unavailable", () => {
  const fixture = figureFixture({ dialogSupported: false });
  initFigureViewer(fixture.doc);

  assert.deepEqual(fixture.doc.selectors, [fixture.expectedSelector]);
  assert.equal(fixture.body.children.length, 0);
  assert.equal(fixture.eligible.figure.children.length, 1);
});

test("initFigureViewer lazy-loads originals, restores focus, and excludes pending backgrounds", () => {
  const fixture = figureFixture();
  initFigureViewer(fixture.doc);

  assert.deepEqual(fixture.doc.selectors, [fixture.expectedSelector]);
  assert.equal(fixture.body.children.length, 1);
  const [viewer] = fixture.body.children;
  const [header, viewerImage] = viewer.children;
  const [, close] = header.children;
  const expand = fixture.eligible.figure.children.find((child) => child.className === "figure-expand");

  assert.ok(expand, "eligible publication figures receive an expand button");
  assert.equal(fixture.pending.figure.children.length, 1, "pending artwork must not become an expandable original");
  assert.equal(viewerImage.getAttribute("src"), null, "the full-resolution source stays unloaded before a click");

  expand.dispatch("click");
  assert.equal(viewerImage.getAttribute("src"), "images/full.png");
  assert.equal(viewerImage.alt, "Paper figure");
  assert.equal(viewer.showCount, 1);
  assert.equal(header.children[0].textContent, "Paper title");

  close.dispatch("click");
  assert.equal(viewerImage.getAttribute("src"), null);
  assert.deepEqual(expand.focusCalls, [{ preventScroll: true }]);
});
