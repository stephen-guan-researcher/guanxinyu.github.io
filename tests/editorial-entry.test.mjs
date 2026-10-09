import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { initSiteEntry, loadEntryImage, shouldShowEntry } from "../editorial-entry.js";

const SESSION_KEY = "xinyu-entry-seen-v1";

class Events {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, listener, options = {}) {
    const list = this.listeners.get(type) ?? [];
    list.push({ listener, once: Boolean(options?.once) });
    this.listeners.set(type, list);
  }
  removeEventListener(type, listener) {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((item) => item.listener !== listener));
  }
  emit(type, extra = {}) {
    const event = { type, target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...extra };
    for (const item of [...(this.listeners.get(type) ?? [])]) {
      if (item.once) this.removeEventListener(type, item.listener);
      item.listener(event);
    }
    return event;
  }
  count(type) { return (this.listeners.get(type) ?? []).length; }
}

class Animation extends Events {
  constructor(frames, options) {
    super();
    this.frames = frames;
    this.options = options;
    this.cancelCalls = 0;
    this.playState = "running";
  }
  cancel() {
    this.cancelCalls += 1;
    if (this.playState === "idle") return;
    this.playState = "idle";
    this.emit("cancel");
  }
  finish() { this.playState = "finished"; this.emit("finish"); }
}

class Element extends Events {
  constructor() {
    super();
    this.attributes = new Map();
    this.attributeWrites = [];
    this.focusCalls = [];
    this.animations = [];
  }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  hasAttribute(name) { return this.attributes.has(name); }
  setAttribute(name, value) {
    this.attributes.set(name, String(value));
    this.attributeWrites.push([name, String(value)]);
  }
  removeAttribute(name) { this.attributes.delete(name); }
  get dataset() {
    return Object.fromEntries([...this.attributes]
      .filter(([name]) => name.startsWith("data-"))
      .map(([name, value]) => [name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()), value]));
  }
  focus(options) {
    this.focusCalls.push(options);
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }
  animate(frames, options) {
    const animation = new Animation(frames, options);
    this.animations.push(animation);
    return animation;
  }
}

function fixture({ hash = "", search = "", seen = false, reduced = false, mobile = false,
  navigation = "navigate", scrollY = 0, storageReadThrows = false, storageWriteThrows = false,
  noDialog = false, noAnimation = false, modalThrows = false, imageComplete = false,
  imageNaturalWidth = 0 } = {}) {
  const win = new Events();
  const preference = new Events();
  preference.matches = reduced;
  preference.change = (matches) => { preference.matches = matches; preference.emit("change", { matches }); };
  const storage = new Map(seen ? [[SESSION_KEY, "1"]] : []);
  const writes = [];
  win.location = { hash, search };
  win.scrollY = scrollY;
  win.innerWidth = mobile ? 390 : 1440;
  win.performance = { getEntriesByType: () => [{ type: navigation }] };
  win.sessionStorage = {
    getItem(key) { if (storageReadThrows) throw new Error("Storage denied"); return storage.get(key) ?? null; },
    setItem(key, value) {
      if (storageWriteThrows) throw new Error("Storage denied");
      writes.push([key, value]);
      storage.set(key, value);
    },
  };
  win.matchMedia = () => preference;
  const timers = new Map();
  const cleared = [];
  let timerId = 0;
  win.setTimeout = (callback, milliseconds) => {
    const id = ++timerId;
    timers.set(id, { callback, milliseconds });
    return id;
  };
  win.clearTimeout = (id) => { cleared.push(id); timers.delete(id); };
  const frames = [];
  win.requestAnimationFrame = (callback) => { frames.push(callback); return frames.length; };
  const body = new Element();
  const enter = new Element();
  const center = new Element();
  const image = new Element();
  image.setAttribute("data-entry-image", "");
  image.setAttribute("data-src", "images/generated/entry-optical-1600.webp");
  image.setAttribute("data-srcset", "images/generated/entry-optical-960.webp 960w, images/generated/entry-optical-1600.webp 1600w, images/generated/entry-optical-2400.webp 2400w");
  image.setAttribute("sizes", "100vw");
  for (const attribute of ["src", "srcset", "sizes"]) {
    Object.defineProperty(image, attribute, {
      get: () => image.getAttribute(attribute) ?? "",
      set: (value) => image.setAttribute(attribute, value),
    });
  }
  image.attributeWrites.length = 0;
  image.complete = imageComplete;
  image.naturalWidth = imageNaturalWidth;
  const heading = new Element();
  const dialog = new Element();
  dialog.open = false;
  dialog.showCalls = 0;
  dialog.closeCalls = 0;
  dialog.showModal = () => {
    dialog.showCalls += 1;
    if (modalThrows) throw new Error("Modal unavailable");
    dialog.open = true;
  };
  dialog.close = () => { dialog.closeCalls += 1; dialog.open = false; dialog.emit("close"); };
  dialog.contains = (element) => [dialog, enter, center, image].includes(element);
  dialog.querySelector = (selector) => ({ "[data-entry-enter]": enter, ".entry-center": center,
    "[data-entry-image]": image })[selector] ?? null;
  if (noDialog) dialog.showModal = undefined;
  if (noAnimation) { dialog.animate = undefined; center.animate = undefined; image.animate = undefined; }
  const doc = { activeElement: body, body, getElementById: (id) => ({ "site-entry": dialog, "profile-name": heading })[id] ?? null };
  for (const element of [body, enter, center, image, heading, dialog]) element.ownerDocument = doc;
  let completions = 0;
  return { win, doc, body, dialog, enter, center, image, heading, preference, writes, timers, cleared, frames,
    flushFrames() { for (const callback of frames.splice(0)) callback(); },
    complete: () => { completions += 1; }, get completions() { return completions; },
    start() { return initSiteEntry(doc, win, this.complete); } };
}

test("entry is eligible on a fresh home visit and #home", () => {
  assert.equal(shouldShowEntry(fixture().win), true);
  assert.equal(shouldShowEntry(fixture({ hash: "#home" }).win), true);
});

test("paper, career, research, agent and unknown deep links never show the entry", () => {
  for (const hash of ["#papers", "#paper-timbre", "#experience", "#research", "#ask-xinyu", "#unknown"]) {
    const f = fixture({ hash, search: "?intro=1" });
    assert.equal(shouldShowEntry(f.win), false, hash);
    assert.equal(f.start(), false, hash);
    assert.equal(f.dialog.showCalls, 0, hash);
  }
});

test("seen session skips entry unless explicitly replayed on the home location", () => {
  assert.equal(shouldShowEntry(fixture({ seen: true }).win), false);
  assert.equal(shouldShowEntry(fixture({ seen: true, search: "?intro=1" }).win), true);
  assert.equal(shouldShowEntry(fixture({ seen: true, hash: "#home", search: "?v=test&intro=1" }).win), true);
  assert.equal(shouldShowEntry(fixture({ seen: true, search: "?intro=0" }).win), false);
});

test("history navigation always bypasses entry while explicit home replay ignores transient scroll", () => {
  assert.equal(shouldShowEntry(fixture({ navigation: "back_forward", search: "?intro=1" }).win), false);
  assert.equal(shouldShowEntry(fixture({ scrollY: 81 }).win), false);
  assert.equal(shouldShowEntry(fixture({ hash: "#home", scrollY: 900, search: "?intro=1" }).win), true);
  assert.equal(shouldShowEntry(fixture({ hash: "#home", scrollY: 900, search: "?intro=1", navigation: "back_forward" }).win), false);
  assert.equal(shouldShowEntry(fixture({ scrollY: 80 }).win), true);
  assert.equal(shouldShowEntry(fixture({ navigation: "reload" }).win), true);
});

test("disabled or absent session storage never blocks the homepage", () => {
  const denied = fixture({ storageReadThrows: true, storageWriteThrows: true });
  assert.equal(denied.start(), true);
  assert.doesNotThrow(() => denied.dialog.emit("cancel"));
  assert.equal(denied.dialog.open, false);
  assert.equal(denied.completions, 1);
  const absent = fixture();
  delete absent.win.sessionStorage;
  assert.equal(absent.start(), true);
  assert.doesNotThrow(() => absent.dialog.emit("cancel"));
  assert.equal(absent.completions, 1);
});

test("missing dialog, native dialog support, or Enter leaves regular homepage in charge", () => {
  const unsupported = fixture({ noDialog: true });
  assert.equal(unsupported.start(), false);
  assert.equal(unsupported.completions, 0);
  const missing = fixture();
  missing.doc.getElementById = () => null;
  assert.equal(missing.start(), false);
  const noControl = fixture();
  noControl.dialog.querySelector = (selector) => selector === ".entry-center" ? noControl.center : null;
  assert.equal(noControl.start(), false);
});

test("failed showModal completes safely without stealing focus", () => {
  const f = fixture({ modalThrows: true });
  assert.equal(f.start(), true);
  assert.equal(f.completions, 1);
  assert.equal(f.heading.focusCalls.length, 0);
  assert.equal(f.win.count("pagehide"), 0);
  assert.equal(f.preference.count("change"), 0);
});

test("opening focuses Enter but does not mark the session as entered prematurely", () => {
  const f = fixture();
  assert.equal(f.start(), true);
  assert.equal(f.dialog.open, true);
  assert.deepEqual(f.enter.focusCalls, [{ preventScroll: true }]);
  assert.equal(f.dialog.getAttribute("data-entry-keyboard"), null, "automatic entry focus must not enable the keyboard-only focus ring");
  assert.deepEqual(f.writes, []);
  assert.equal(f.center.animations.length, 1);
  assert.equal(f.center.animations[0].options.duration, 600);
});

test("clicking Enter transitions once then closes and focuses the real heading", () => {
  const f = fixture();
  f.start();
  f.enter.emit("click");
  f.enter.emit("click");
  assert.equal(f.dialog.animations.length, 1);
  assert.equal(f.dialog.open, true);
  assert.equal(f.completions, 0);
  assert.equal(f.center.animations[0].playState, "idle");
  f.dialog.animations[0].finish();
  assert.equal(f.dialog.open, false);
  assert.equal(f.dialog.closeCalls, 1);
  assert.equal(f.completions, 1);
  assert.deepEqual(f.writes, [[SESSION_KEY, "1"]]);
  assert.equal(f.heading.attributes.get("tabindex"), "-1");
  assert.deepEqual(f.heading.focusCalls, [{ preventScroll: true }]);
  assert.equal(f.timers.size, 0);
  f.enter.emit("click");
  f.dialog.emit("cancel");
  assert.equal(f.completions, 1);
});

test("Enter key starts exit while repeated Enter and other keys retain native behavior", () => {
  const f = fixture();
  f.start();
  const repeated = f.win.emit("keydown", { key: "Enter", repeat: true });
  const other = f.win.emit("keydown", { key: "ArrowRight" });
  assert.equal(repeated.defaultPrevented, false);
  assert.equal(other.defaultPrevented, false);
  assert.equal(f.dialog.animations.length, 0);
  const enter = f.win.emit("keydown", { key: "Enter", repeat: false });
  assert.equal(enter.defaultPrevented, true);
  assert.equal(f.dialog.animations.length, 1);
  f.dialog.animations[0].finish();
});

test("Tab and Shift+Tab keep focus on the only Enter control", () => {
  const f = fixture();
  f.start();
  assert.equal(f.doc.activeElement, f.enter);
  for (const shiftKey of [false, false, true, true]) {
    const event = f.win.emit("keydown", { key: "Tab", shiftKey, target: f.doc.activeElement });
    assert.equal(event.defaultPrevented, true);
    assert.equal(f.doc.activeElement, f.enter);
    assert.equal(f.dialog.getAttribute("data-entry-keyboard"), "true", "Tab and Shift+Tab must enable a visible keyboard focus ring");
    assert.deepEqual(f.enter.focusCalls.at(-1), { preventScroll: true });
    assert.equal(f.dialog.open, true);
  }
  assert.equal(f.completions, 0);
});

test("Tab and Shift+Tab from an external body focus return to Enter", () => {
  const f = fixture();
  f.start();
  for (const shiftKey of [false, true]) {
    f.doc.activeElement = f.body;
    const event = f.win.emit("keydown", { key: "Tab", shiftKey, target: f.body });
    assert.equal(event.defaultPrevented, true);
    assert.equal(f.doc.activeElement, f.enter);
    assert.equal(f.dialog.getAttribute("data-entry-keyboard"), "true", "keyboard recovery from external focus still enables the focus ring");
  }
});

test("closing entry removes its Tab trap and leaves normal page navigation untouched", () => {
  const f = fixture();
  f.start();
  f.dialog.emit("cancel");
  assert.equal(f.win.count("keydown"), 0);
  for (const shiftKey of [false, true]) {
    const event = f.win.emit("keydown", { key: "Tab", shiftKey, target: f.heading });
    assert.equal(event.defaultPrevented, false);
    assert.equal(f.doc.activeElement, f.heading);
    assert.equal(f.dialog.getAttribute("data-entry-keyboard"), null, "closed entry must not reactivate its keyboard focus mode");
  }
  assert.equal(f.completions, 1);
});

test("Return remains operable when #home fragment navigation has put focus on body", () => {
  const f = fixture({ hash: "#home" });
  f.start();
  f.doc.activeElement = f.body;
  const returned = f.win.emit("keydown", { key: "Enter", target: f.body, repeat: false });
  assert.equal(returned.defaultPrevented, true);
  assert.equal(f.dialog.animations.length, 1);
  f.dialog.animations[0].finish();
  assert.equal(f.dialog.open, false);
  assert.equal(f.doc.activeElement, f.heading);
  assert.equal(f.win.count("keydown"), 0);
  const afterClose = f.win.emit("keydown", { key: "Enter", target: f.body });
  assert.equal(afterClose.defaultPrevented, false);
  assert.equal(f.completions, 1);
});

test("first animation frame restores entry focus when fragment navigation moved it outside", () => {
  const f = fixture({ hash: "#home" });
  f.start();
  assert.equal(f.frames.length, 1);
  f.doc.activeElement = f.body;
  f.flushFrames();
  assert.equal(f.doc.activeElement, f.enter);
  assert.equal(f.enter.focusCalls.length, 2);
  assert.deepEqual(f.enter.focusCalls[1], { preventScroll: true });
});

test("load restores external focus once but does not refocus an already focused Enter", () => {
  const moved = fixture({ hash: "#home" });
  moved.start();
  moved.doc.activeElement = moved.body;
  moved.win.emit("load");
  assert.equal(moved.doc.activeElement, moved.enter);
  assert.equal(moved.win.count("load"), 0);
  const focused = fixture();
  focused.start();
  focused.flushFrames();
  focused.win.emit("load");
  assert.equal(focused.doc.activeElement, focused.enter);
  assert.equal(focused.enter.focusCalls.length, 1);
});

test("completion removes load/keydown hooks and a pending focus frame cannot steal restored focus", () => {
  const f = fixture();
  f.start();
  assert.equal(f.win.count("load"), 1);
  assert.equal(f.win.count("keydown"), 1);
  f.dialog.emit("cancel");
  assert.equal(f.win.count("load"), 0);
  assert.equal(f.win.count("keydown"), 0);
  assert.equal(f.doc.activeElement, f.heading);
  const enterFocusCount = f.enter.focusCalls.length;
  f.flushFrames();
  f.win.emit("load");
  assert.equal(f.doc.activeElement, f.heading);
  assert.equal(f.enter.focusCalls.length, enterFocusCount);
});

test("Escape immediately closes without an exit animation", () => {
  const f = fixture();
  f.start();
  const event = f.dialog.emit("cancel");
  assert.equal(event.defaultPrevented, true);
  assert.equal(f.dialog.open, false);
  assert.equal(f.dialog.animations.length, 0);
  assert.equal(f.completions, 1);
  assert.equal(f.heading.focusCalls.length, 1);
});

test("canceled exit animation cannot leave an invisible modal blocking the page", () => {
  const f = fixture();
  f.start();
  f.enter.emit("click");
  f.dialog.animations[0].cancel();
  assert.equal(f.dialog.open, false);
  assert.equal(f.completions, 1);
  assert.equal(f.timers.size, 0);
  assert.equal(f.win.count("hashchange"), 0);
  assert.equal(f.win.count("pagehide"), 0);
});

test("an 800 ms safety timer guarantees completion if finish never fires", () => {
  const f = fixture();
  f.start();
  f.enter.emit("click");
  const timer = [...f.timers.values()][0];
  assert.equal(timer.milliseconds, 800);
  timer.callback();
  assert.equal(f.dialog.open, false);
  assert.equal(f.completions, 1);
  assert.equal(f.dialog.animations[0].playState, "idle");
  assert.equal(f.timers.size, 0);
});

test("missing Web Animations support enters immediately", () => {
  const f = fixture({ noAnimation: true });
  f.start();
  f.enter.emit("click");
  assert.equal(f.completions, 1);
  assert.equal(f.dialog.open, false);
  assert.equal(f.timers.size, 0);
});

test("mobile uses shorter motion and smaller exit movement", () => {
  const f = fixture({ mobile: true });
  f.start();
  assert.equal(f.center.animations[0].options.duration, 320);
  f.enter.emit("click");
  const animation = f.dialog.animations[0];
  assert.equal(animation.options.duration, 320);
  assert.equal(animation.frames[1].transform, "translateY(-6px)");
  animation.finish();
});

test("initial reduced motion skips all animations but keeps an operable entry", () => {
  const f = fixture({ reduced: true });
  f.start();
  assert.equal(f.dialog.open, true);
  assert.equal(f.center.animations.length, 0);
  f.enter.emit("click");
  assert.equal(f.dialog.animations.length, 0);
  assert.equal(f.dialog.open, false);
  assert.equal(f.completions, 1);
});

test("enabling reduced motion cancels opening motion then enters immediately", () => {
  const f = fixture();
  f.start();
  f.preference.change(true);
  assert.equal(f.center.animations[0].playState, "idle");
  assert.equal(f.dialog.open, true);
  f.enter.emit("click");
  assert.equal(f.dialog.open, false);
  assert.equal(f.dialog.animations.length, 0);
  assert.equal(f.completions, 1);
});

test("enabling reduced motion during exit cancels motion and cleans up exactly once", () => {
  const f = fixture();
  f.start();
  f.enter.emit("click");
  f.preference.change(true);
  assert.equal(f.dialog.open, false);
  assert.equal(f.dialog.animations[0].playState, "idle");
  assert.equal(f.completions, 1);
  assert.equal(f.preference.count("change"), 0);
  assert.equal(f.timers.size, 0);
});

test("pagehide closes and removes listeners without focusing into an inactive page", () => {
  const f = fixture();
  f.start();
  f.win.emit("pagehide", { persisted: true });
  assert.equal(f.dialog.open, false);
  assert.equal(f.completions, 1);
  assert.equal(f.heading.focusCalls.length, 0);
  assert.equal(f.win.count("pagehide"), 0);
  assert.equal(f.win.count("hashchange"), 0);
  assert.equal(f.preference.count("change"), 0);
  assert.equal(shouldShowEntry(f.win), false, "bfcache return must not replay the dismissed introduction");
});

test("moving to a deep link closes entry without stealing the anchor target focus", () => {
  const f = fixture();
  f.start();
  f.win.location.hash = "#home";
  f.win.emit("hashchange");
  assert.equal(f.dialog.open, true);
  f.win.location.hash = "#paper-timbre";
  f.win.emit("hashchange");
  assert.equal(f.dialog.open, false);
  assert.equal(f.heading.focusCalls.length, 0);
  assert.equal(f.completions, 1);
});

test("external dialog close still completes cleanup and restores heading focus", () => {
  const f = fixture();
  f.start();
  f.dialog.close();
  assert.equal(f.completions, 1);
  assert.equal(f.heading.focusCalls.length, 1);
  assert.equal(f.win.count("pagehide"), 0);
});

test("deferred banner does not load for skipped, unsupported, or failed introductions", () => {
  for (const options of [
    { hash: "#papers" }, { hash: "#experience", search: "?intro=1" },
    { seen: true }, { navigation: "back_forward", search: "?intro=1" },
    { scrollY: 81 }, { noDialog: true }, { modalThrows: true },
  ]) {
    const f = fixture(options);
    f.start();
    assert.equal(f.image.getAttribute("src"), null, JSON.stringify(options));
    assert.equal(f.image.getAttribute("srcset"), null, JSON.stringify(options));
    assert.equal(f.image.count("load"), 0, JSON.stringify(options));
    assert.equal(f.image.count("error"), 0, JSON.stringify(options));
    assert.equal(f.image.animations.length, 0, JSON.stringify(options));
  }
});

test("successful modal opening loads the responsive optical banner without blocking Enter", () => {
  const f = fixture();
  assert.equal(f.image.hasAttribute("src"), false);
  assert.equal(f.image.hasAttribute("srcset"), false);
  const originalShow = f.dialog.showModal;
  f.dialog.showModal = () => {
    assert.equal(f.image.hasAttribute("src"), false, "image must not be requested before successful showModal");
    originalShow();
  };
  assert.equal(f.start(), true);
  assert.equal(f.image.getAttribute("sizes"), "100vw");
  assert.equal(f.image.getAttribute("srcset"), f.image.getAttribute("data-srcset"));
  assert.equal(f.image.getAttribute("src"), f.image.getAttribute("data-src"));
  assert.equal(f.dialog.getAttribute("data-entry-image-ready"), "pending");
  assert.equal(f.image.animations.length, 0, "motion waits for an actual image load");
  assert.equal(f.doc.activeElement, f.enter);
  assert.equal(f.dialog.open, true);
  const srcsetWrite = f.image.attributeWrites.findIndex(([name]) => name === "srcset");
  const sourceWrite = f.image.attributeWrites.findIndex(([name]) => name === "src");
  assert.ok(srcsetWrite >= 0 && srcsetWrite < sourceWrite, "responsive candidates are set before fallback src");
});

test("banner helper settles once on load and removes both pending listeners", () => {
  const f = fixture();
  f.dialog.open = true;
  const settled = [];
  const cleanup = loadEntryImage(f.dialog, (image) => settled.push(image));
  assert.equal(typeof cleanup, "function");
  f.image.naturalWidth = 1600;
  f.image.emit("load");
  assert.equal(f.dialog.getAttribute("data-entry-image-ready"), "true");
  assert.deepEqual(settled, [f.image]);
  assert.equal(f.image.count("load"), 0);
  assert.equal(f.image.count("error"), 0);
  f.image.emit("load");
  f.image.emit("error");
  cleanup();
  assert.deepEqual(settled, [f.image]);
});

test("banner helper reports an error once without treating a failed image as ready", () => {
  const f = fixture();
  f.dialog.open = true;
  const settled = [];
  loadEntryImage(f.dialog, (image) => settled.push(image));
  f.image.emit("error");
  f.image.emit("load");
  assert.deepEqual(settled, [null]);
  assert.equal(f.dialog.getAttribute("data-entry-image-ready"), "error");
  assert.equal(f.image.count("load"), 0);
  assert.equal(f.image.count("error"), 0);
});

test("banner helper cleanup before settlement cancels all pending readiness callbacks", () => {
  const f = fixture();
  f.dialog.open = true;
  const settled = [];
  const cleanup = loadEntryImage(f.dialog, (image) => settled.push(image));
  cleanup();
  cleanup();
  f.image.naturalWidth = 1600;
  f.image.emit("load");
  f.image.emit("error");
  assert.deepEqual(settled, []);
  assert.equal(f.dialog.getAttribute("data-entry-image-ready"), "pending");
  assert.equal(f.image.count("load"), 0);
  assert.equal(f.image.count("error"), 0);
});

test("missing decorative image or deferred source safely leaves normal entry behavior intact", () => {
  for (const missing of ["image", "source"]) {
    const f = fixture();
    if (missing === "image") {
      const query = f.dialog.querySelector;
      f.dialog.querySelector = (selector) => selector === "[data-entry-image]" ? null : query(selector);
    } else f.image.removeAttribute("data-src");
    assert.equal(f.start(), true);
    assert.equal(f.image.hasAttribute("src"), false);
    assert.equal(f.image.count("load"), 0);
    assert.equal(f.dialog.open, true);
    f.dialog.emit("cancel");
    assert.equal(f.dialog.open, false);
    assert.equal(f.completions, 1);
  }
});

test("banner error settles safely and leaves the welcome action operable", () => {
  const f = fixture();
  f.start();
  f.image.emit("error");
  assert.equal(f.dialog.getAttribute("data-entry-image-ready"), "error");
  assert.equal(f.image.animations.length, 0);
  assert.equal(f.image.count("load"), 0);
  assert.equal(f.image.count("error"), 0);
  assert.equal(f.doc.activeElement, f.enter);
  assert.equal(f.dialog.open, true);
  f.enter.emit("click");
  f.dialog.animations[0].finish();
  assert.equal(f.dialog.open, false);
  assert.equal(f.completions, 1);
});

test("cached banner load can settle immediately after native dialog opening", () => {
  const f = fixture({ imageComplete: true, imageNaturalWidth: 1600 });
  f.start();
  assert.equal(f.dialog.getAttribute("data-entry-image-ready"), "true");
  assert.equal(f.image.count("load"), 0);
  assert.equal(f.image.count("error"), 0);
  assert.equal(f.image.animations.length, 1);
  assert.equal(f.dialog.open, true);
});

test("loaded optical banner motion is canceled when reduced motion is enabled", () => {
  const f = fixture();
  f.start();
  f.image.naturalWidth = 1600;
  f.image.emit("load");
  assert.equal(f.image.animations.length, 1);
  const animation = f.image.animations[0];
  assert.equal(animation.options.iterations, Infinity);
  assert.equal(animation.options.direction, "alternate");
  assert.equal(animation.options.duration, 14000);
  f.preference.change(true);
  assert.equal(animation.playState, "idle");
  assert.equal(f.dialog.open, true);
  f.enter.emit("click");
  assert.equal(f.dialog.animations.length, 0);
  assert.equal(f.dialog.open, false);
  assert.equal(f.completions, 1);
});

test("initial or newly enabled reduced motion also suppresses a late-loading banner animation", () => {
  for (const initiallyReduced of [false, true]) {
    const f = fixture({ reduced: initiallyReduced });
    f.start();
    if (!initiallyReduced) f.preference.change(true);
    f.image.naturalWidth = 1600;
    f.image.emit("load");
    assert.equal(f.dialog.getAttribute("data-entry-image-ready"), "true");
    assert.equal(f.image.animations.length, 0);
    assert.equal(f.dialog.open, true);
    f.enter.emit("click");
    assert.equal(f.dialog.open, false);
    assert.equal(f.completions, 1);
  }
});

test("an image loaded during exit cannot add motion or revive the modal", () => {
  const f = fixture();
  f.start();
  f.enter.emit("click");
  const stateBefore = f.dialog.getAttribute("data-entry-image-ready");
  assert.equal(f.image.count("load"), 0);
  assert.equal(f.image.count("error"), 0);
  f.image.naturalWidth = 1600;
  f.image.emit("load");
  assert.equal(f.image.animations.length, 0);
  assert.equal(f.dialog.getAttribute("data-entry-image-ready"), stateBefore);
  f.dialog.animations[0].finish();
  assert.equal(f.dialog.open, false);
  assert.equal(f.completions, 1);
});

test("closing pending or loaded banner removes image hooks and all image motion", () => {
  for (const loaded of [false, true]) {
    const f = fixture();
    f.start();
    if (loaded) {
      f.image.naturalWidth = 1600;
      f.image.emit("load");
    }
    f.dialog.emit("cancel");
    const stateBefore = f.dialog.getAttribute("data-entry-image-ready");
    const animationsBefore = f.image.animations.length;
    assert.equal(f.image.count("load"), 0);
    assert.equal(f.image.count("error"), 0);
    assert.ok(f.image.animations.every((animation) => animation.playState === "idle"));
    f.image.emit("load");
    f.image.emit("error");
    assert.equal(f.image.animations.length, animationsBefore);
    assert.equal(f.dialog.getAttribute("data-entry-image-ready"), stateBefore);
    assert.equal(f.dialog.open, false);
    assert.equal(f.dialog.showCalls, 1);
    assert.equal(f.completions, 1);
    assert.equal(f.doc.activeElement, f.heading);
  }
});

test("lack of image Web Animations support does not block banner load or entry completion", () => {
  const f = fixture({ noAnimation: true });
  f.start();
  f.image.naturalWidth = 1600;
  f.image.emit("load");
  assert.equal(f.dialog.getAttribute("data-entry-image-ready"), "true");
  assert.equal(f.image.animations.length, 0);
  f.enter.emit("click");
  assert.equal(f.dialog.open, false);
  assert.equal(f.completions, 1);
});

test("entry markup is natively closed and leaves the only h1 in the ordinary homepage", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const opening = html.match(/<dialog\b[^>]*\bid="site-entry"[^>]*>/)?.[0];
  assert.ok(opening);
  assert.doesNotMatch(opening, /\bopen(?:\s|=|>)/);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.match(html, /<h2\b[^>]*id="entry-name"[^>]*>Xinyu Guan<\/h2>/);
  const entry = html.match(/<dialog\b[^>]*\bid="site-entry"[^>]*>[\s\S]*?<\/dialog>/)?.[0] ?? "";
  assert.equal((entry.match(/<button\b/g) ?? []).length, 1, "the welcome screen has only one visible action");
  assert.match(entry, /data-entry-enter/);
  assert.doesNotMatch(entry, /data-entry-skip|Skip intro/);
  assert.match(entry, /<p\b[^>]*class="entry-company"[^>]*>Alibaba Group<\/p>/);
  assert.doesNotMatch(entry, /TaoTian Group @ Alibaba/);
  const hero = html.match(/<section\b[^>]*class="editorial-hero"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.doesNotMatch(hero, /class="hero-role"|class="hero-focus"/);
  assert.match(html, /AutoResearch \/ Post-Training \/ Agentic RL/);
});

test("centered text-only welcome keeps one native entrance and no decorative image source", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const entry = html.match(/<dialog\b[^>]*\bid="site-entry"[^>]*>[\s\S]*?<\/dialog>/)?.[0] ?? "";
  assert.ok(entry, "the optional native welcome dialog is present");
  for (const className of ["entry-center", "entry-header", "entry-identity", "entry-affiliation", "entry-footer"]) {
    assert.match(entry, new RegExp(`class="${className}"`));
  }
  assert.doesNotMatch(entry, /entry-rule|entry-visual|<hr\b/);
  assert.doesNotMatch(entry, /<(?:img|picture|canvas|video|audio|iframe)\b/i, "the welcome consists only of text and its invitation control");
  assert.doesNotMatch(entry, /\b(?:data-entry-image|data-src(?:set)?|src(?:set)?)\s*(?:=|>|\/)/i,
    "neither eager nor deferred decorative sources remain in the welcome");
  assert.equal((entry.match(/<(?:button|a|input|select|textarea)\b/g) ?? []).length, 1,
    "the invitation CTA is the only interactive entrance");
  assert.equal((entry.match(/\bdata-entry-enter\b/g) ?? []).length, 1);
  assert.match(entry, /\bri-arrow-right-line\b/);
  assert.match(entry, /<p\b[^>]*class="entry-role"[^>]*>AI Agent Researcher<\/p>/);
  assert.match(entry, /<p\b[^>]*class="entry-company"[^>]*>Alibaba Group<\/p>/);
  assert.match(entry, /AutoResearch \/ Post-Training \/ Agentic RL/);
});

test("text-only entry does not initialize or request the backward-compatible decorative image", () => {
  const f = fixture();
  const query = f.dialog.querySelector;
  f.dialog.querySelector = (selector) => selector === "[data-entry-image]" ? null : query(selector);
  assert.equal(f.start(), true);
  assert.equal(f.dialog.getAttribute("data-entry-image-ready"), null);
  assert.equal(f.image.getAttribute("src"), null);
  assert.equal(f.image.getAttribute("srcset"), null);
  assert.equal(f.image.count("load"), 0);
  assert.equal(f.image.count("error"), 0);
  assert.equal(f.image.animations.length, 0);
  assert.equal(f.doc.activeElement, f.enter);
  f.enter.emit("click");
  f.dialog.animations[0].finish();
  assert.equal(f.dialog.open, false);
  assert.equal(f.completions, 1);
  assert.equal(f.doc.activeElement, f.heading);
});

test("welcome styling is pure white, centered, image-free, and has no colored arrow block", () => {
  const css = readFileSync(new URL("../editorial-styles.css", import.meta.url), "utf8");
  const rule = (selector) => css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
  assert.match(rule(".site-entry"), /\bbackground(?:-color)?\s*:\s*(?:#fff(?:fff)?|white|rgb\(255\s*,\s*255\s*,\s*255\))\s*;/i);
  assert.match(rule(".entry-center"), /\btext-align\s*:\s*center\s*;/);
  assert.match(rule(".entry-center"), /\b(?:place-items|align-items|justify-items|place-content|align-content|justify-content)\s*:\s*center\s*;/,
    "the welcome contents occupy a centered column");
  for (const selector of [".entry-header", ".entry-footer"]) {
    assert.match(rule(selector), /\b(?:place-items|align-items|justify-items|place-content|align-content|justify-content)\s*:\s*center\s*;/,
      `${selector} keeps its contents centered`);
  }
  assert.doesNotMatch(css, /\.entry-visual\b|entry-optical|\.entry-rule\b/,
    "the retired banner and odd name rule have no active welcome selectors");
  const entryRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, selectors]) => /\.(?:site-entry|entry-[\w-]+)/.test(selectors));
  for (const [, selectors, declarations] of entryRules) {
    assert.doesNotMatch(declarations, /url\s*\(/i, `${selectors.trim()} must not load decorative imagery`);
  }
  assert.doesNotMatch(rule(".entry-arrow"), /\bbackground(?:-color)?\s*:\s*#[\da-f]{3,8}\s*;/i,
    "the arrow remains an unboxed text icon rather than a color block");
  assert.doesNotMatch(rule(".entry-arrow"), /\b(?:width|height|aspect-ratio)\s*:/,
    "the arrow does not retain the old square-button dimensions");
  assert.match(rule(".entry-enter:focus"), /\boutline\s*:\s*none\s*;/,
    "initial autofocus does not draw a frame around Enter");
  assert.match(rule('.site-entry[data-entry-keyboard="true"] .entry-enter:focus-visible'), /\boutline\s*:\s*[1-9]\d*(?:\.\d+)?px\s+solid\s+[^;]+;/,
    "keyboard navigation retains a real focus indicator");
});

test("single invitation button visibly and accessibly says Explore my work", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const entry = html.match(/<dialog\b[^>]*\bid="site-entry"[^>]*>[\s\S]*?<\/dialog>/)?.[0] ?? "";
  const buttons = entry.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [];
  assert.equal(buttons.length, 1, "the welcome offers a single native entrance button");
  const button = buttons[0];
  const opening = button.match(/^<button\b[^>]*>/)?.[0] ?? "";
  const visibleLabel = button.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const accessibleLabel = opening.match(/\baria-label="([^"]*)"/)?.[1] ?? visibleLabel;
  assert.equal(visibleLabel, "Explore my work");
  assert.equal(accessibleLabel, "Explore my work", "assistive technology announces the same invitation shown visually");
  assert.match(opening, /\btype="button"/);
  assert.match(opening, /\bdata-entry-enter\b/);
  assert.doesNotMatch(opening, /\bdisabled(?:\s|=|>)|\baria-hidden="true"/,
    "the invitation remains an enabled, accessible native button");
  assert.ok(
    /<i\b[^>]*\bri-arrow-right-line\b[^>]*\baria-hidden="true"/.test(button)
    || /<span\b[^>]*\bclass="entry-arrow"[^>]*\baria-hidden="true"[^>]*>\s*<i\b[^>]*\bri-arrow-right-line\b/.test(button),
    "the decorative arrow or its wrapper is excluded from the accessible name",
  );
});

test("invitation capsule preserves at least a 56px touch target at every declared breakpoint", () => {
  const css = readFileSync(new URL("../editorial-styles.css", import.meta.url), "utf8");
  const buttonRules = [...css.matchAll(/(?:^|\n)\s*\.entry-enter\s*\{([^}]*)\}/g)]
    .map((match) => match[1]);
  assert.ok(buttonRules.length > 0, "the invitation has a base button rule");
  const base = buttonRules[0];
  const minHeight = Number(base.match(/\bmin-height\s*:\s*(\d+(?:\.\d+)?)px\s*;/)?.[1]);
  assert.ok(minHeight >= 56, "the base invitation touch target is at least 56px tall");
  const radius = Number(base.match(/\bborder-radius\s*:\s*(\d+(?:\.\d+)?)px\s*;/)?.[1]);
  assert.ok(radius >= minHeight / 2, "the selected invitation has a capsule silhouette");
  for (const declarations of buttonRules) {
    const declaredHeight = declarations.match(/\bmin-height\s*:\s*(\d+(?:\.\d+)?)px\s*;/)?.[1];
    if (declaredHeight !== undefined) {
      assert.ok(Number(declaredHeight) >= 56, "mobile or short-height overrides never shrink the target below 56px");
    }
  }
});
