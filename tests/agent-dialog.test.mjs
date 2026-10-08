import test from "node:test";
import assert from "node:assert/strict";
import { initAgentDialog } from "../phd-main.js";

function control() {
  return {
    attrs: new Map(), handlers: new Map(), focusCount: 0,
    setAttribute(name, value) { this.attrs.set(name, value); },
    addEventListener(name, handler) { this.handlers.set(name, handler); },
    focus() { this.focusCount += 1; },
    click(event = {}) { this.handlers.get("click")?.(event); },
  };
}

function fixture(hash = "") {
  const openers = [control(), control()];
  const closeButton = control();
  const sources = [control(), control(), control()];
  const toggle = control();
  const panel = { hidden: true };
  const input = { ...control(), disabled: false };
  const dialog = {
    ...control(), open: false, showCount: 0, closeCount: 0,
    showModal() { this.open = true; this.showCount += 1; },
    close() { this.open = false; this.closeCount += 1; },
    setAttribute(name, value) { this.attrs.set(name, value); if (name === "open") this.open = true; },
    removeAttribute(name) { this.attrs.delete(name); if (name === "open") this.open = false; },
    querySelector(selector) {
      return {
        "[data-agent-close]": closeButton,
        "[data-agent-toggle]": toggle,
        "#xinyu-agent-panel": panel,
        "input[name='question']": input,
      }[selector] ?? null;
    },
    querySelectorAll(selector) { assert.equal(selector, "[data-agent-source]"); return sources; },
    getBoundingClientRect() { return { left: 20, right: 620, top: 30, bottom: 530 }; },
  };
  const doc = {
    getElementById(id) { assert.equal(id, "xinyu-agent-dialog"); return dialog; },
    querySelectorAll(selector) { assert.equal(selector, "[data-agent-open]"); return openers; },
  };
  const win = { location: { hash }, handlers: new Map(), addEventListener(name, handler) { this.handlers.set(name, handler); } };
  return { doc, win, dialog, openers, closeButton, sources, toggle, panel, input };
}

test("dialog initialization safely skips pages without an Agent dialog", () => {
  initAgentDialog({ getElementById() { return null; } }, {});
});

test("opening the Agent uses a native modal, reveals answers, and focuses the question", () => {
  const f = fixture();
  initAgentDialog(f.doc, f.win);
  assert.ok(f.openers.every((opener) => opener.attrs.get("aria-expanded") === "false"));
  f.openers[1].click();
  assert.equal(f.dialog.open, true);
  assert.equal(f.dialog.showCount, 1);
  assert.equal(f.panel.hidden, false);
  assert.equal(f.toggle.attrs.get("aria-expanded"), "true");
  assert.equal(f.input.focusCount, 1);
  assert.ok(f.openers.every((opener) => opener.attrs.get("aria-expanded") === "true"));
  f.openers[1].click();
  assert.equal(f.dialog.showCount, 1, "an already-open dialog must not call showModal again");
});

test("the close control closes the modal and restores focus to its actual opener", () => {
  const f = fixture();
  initAgentDialog(f.doc, f.win);
  f.openers[1].click();
  f.closeButton.click();
  assert.equal(f.dialog.open, false);
  assert.equal(f.openers[1].focusCount, 1);
  assert.equal(f.openers[0].focusCount, 0);
  assert.ok(f.openers.every((opener) => opener.attrs.get("aria-expanded") === "false"));
});

test("Escape cancellation closes the Agent and restores accessible trigger state", () => {
  const f = fixture();
  initAgentDialog(f.doc, f.win);
  f.openers[0].click();
  let prevented = false;
  f.dialog.handlers.get("cancel")({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(f.dialog.open, false);
  assert.equal(f.openers[0].focusCount, 1);
  assert.equal(f.openers[0].attrs.get("aria-expanded"), "false");
});

test("only clicks outside the modal bounds dismiss it; inside clicks remain interactive", () => {
  const f = fixture();
  initAgentDialog(f.doc, f.win);
  f.openers[0].click();
  f.dialog.click({ target: f.input, clientX: 0, clientY: 0 });
  assert.equal(f.dialog.open, true);
  f.dialog.click({ target: f.dialog, clientX: 40, clientY: 50 });
  assert.equal(f.dialog.open, true);
  f.dialog.click({ target: f.dialog, clientX: 5, clientY: 50 });
  assert.equal(f.dialog.open, false);
});

test("evidence source navigation closes the modal before returning to the resume", () => {
  const f = fixture();
  initAgentDialog(f.doc, f.win);
  for (const source of f.sources) {
    f.openers[0].click();
    source.click();
    assert.equal(f.dialog.open, false);
    assert.equal(f.openers[0].attrs.get("aria-expanded"), "false");
  }
});

test("the Life Photos hash opens the modal on initial navigation and later hash changes", () => {
  const initial = fixture("#ask-xinyu");
  initAgentDialog(initial.doc, initial.win);
  assert.equal(initial.dialog.open, true);
  assert.equal(initial.dialog.showCount, 1);
  const changed = fixture("#papers");
  initAgentDialog(changed.doc, changed.win);
  assert.equal(changed.dialog.open, false);
  changed.win.location.hash = "#ask-xinyu";
  changed.win.handlers.get("hashchange")();
  assert.equal(changed.dialog.open, true);
});

test("opening an in-flight Agent never focuses its disabled input", () => {
  const f = fixture();
  f.input.disabled = true;
  initAgentDialog(f.doc, f.win);
  f.openers[0].click();
  assert.equal(f.dialog.open, true);
  assert.equal(f.input.focusCount, 0);
});

test("dialog fallback still opens and closes when native dialog methods are unavailable", () => {
  const f = fixture();
  f.dialog.showModal = undefined;
  f.dialog.close = undefined;
  initAgentDialog(f.doc, f.win);
  f.openers[0].click();
  assert.equal(f.dialog.open, true);
  f.closeButton.click();
  assert.equal(f.dialog.open, false);
  assert.equal(f.openers[0].focusCount, 1);
});
