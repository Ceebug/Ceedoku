const test = require("node:test");
const assert = require("node:assert/strict");
require("../src/js/keybindManager.js");

const manager = globalThis.CeedokuKeybindManager;

class MemoryStorage {
    constructor(entries = {}) {
        this.entries = new Map(Object.entries(entries));
    }

    getItem(key) {
        return this.entries.has(key) ? this.entries.get(key) : null;
    }

    setItem(key, value) {
        this.entries.set(key, String(value));
    }
}

test("provides a default binding for every game keyboard action", () => {
    const bindings = manager.defaults();
    assert.equal(Object.keys(bindings).length, manager.ACTIONS.length);
    assert.equal(bindings["number-1"].key, "Digit1");
    assert.equal(bindings["erase-backspace"].key, "Backspace");
    assert.equal(bindings["erase-delete"].key, "Delete");
    assert.equal(bindings["erase-zero"].key, "Digit0");
    assert.equal(bindings["redo-alt"].key, "KeyY");
    assert.equal(bindings.print.primary, true);
});

test("allows every action to be rebound to a unique supported code", () => {
    let bindings = manager.defaults();
    const unusedCodes = [
        ...Array.from({ length: 10 }, (_, index) => `Numpad${index}`),
        "BracketLeft", "BracketRight", "Backslash", "Semicolon", "Quote",
        "Comma", "Period", "Slash", "Minus", "Equal", "Backquote",
        "IntlBackslash", "KeyA", "KeyB"
    ];
    for (const [index, id] of manager.ACTIONS.entries()) {
        const result = manager.assign(bindings, id, { key: unusedCodes[index] });
        assert.equal(result.ok, true, id);
        bindings = result.bindings;
        assert.equal(bindings[id].key, unusedCodes[index]);
    }
    assert.equal(manager.conflicts(bindings), null);
});

test("detects duplicate assignments and reserved shortcuts", () => {
    const bindings = manager.defaults();
    const conflict = manager.assign(bindings, "hint", { key: "Digit1" });
    assert.equal(conflict.ok, false);
    assert.equal(conflict.reason, "conflict");
    assert.deepEqual(conflict.conflict.slice().sort(), ["hint", "number-1"].sort());

    for (const key of ["Tab", "Escape", "F5", "BrowserBack"]) {
        assert.equal(manager.assign(bindings, "hint", { key }).reason, "reserved-key");
    }
    for (const key of ["KeyW", "KeyR", "KeyO", "KeyS", "KeyD", "KeyF"]) {
        assert.equal(manager.assign(bindings, "hint", { key, primary: true }).reason, "reserved-key");
    }
    assert.equal(
        manager.assign(bindings, "hint", { key: "KeyI", primary: true, shift: true }).reason,
        "reserved-key"
    );
    assert.equal(
        manager.assign(bindings, "hint", { key: "Delete", primary: true, shift: true }).reason,
        "reserved-key"
    );
});

test("resets one binding and all bindings to the familiar defaults", () => {
    let bindings = manager.defaults();
    bindings = manager.assign(bindings, "hint", { key: "KeyK" }).bindings;
    assert.equal(bindings.hint.key, "KeyK");

    const resetOne = manager.reset(bindings, "hint");
    assert.equal(resetOne.ok, true);
    bindings = resetOne.bindings;
    assert.equal(bindings.hint.key, "KeyH");

    bindings = manager.assign(bindings, "pencil", { key: "KeyV" }).bindings;
    assert.equal(manager.resetAll().pencil.key, "KeyP");
    assert.deepEqual(manager.resetAll(), manager.defaults());
});

test("matches exact modifiers and displays assigned keys", () => {
    const bindings = manager.defaults();
    assert.equal(manager.eventMatches({
        code: "KeyZ", ctrlKey: true, metaKey: false, altKey: false, shiftKey: true
    }, bindings.redo), true);
    assert.equal(manager.eventMatches({
        code: "KeyZ", ctrlKey: true, metaKey: false, altKey: false, shiftKey: false
    }, bindings.redo), false);
    assert.deepEqual(manager.displayParts(bindings.print, "Win32"), ["Ctrl", "P"]);
    assert.deepEqual(manager.displayParts(bindings.print, "MacIntel"), ["Cmd", "P"]);
    assert.equal(manager.display(bindings.print, "Win32"), "Ctrl + P");
});

test("persists custom bindings independently and safely falls back on invalid data", () => {
    const storage = new MemoryStorage({ settings: '{"theme":"light"}' });
    let bindings = manager.load(storage);
    const result = manager.assign(bindings, "hint", { key: "KeyK" });
    assert.equal(result.ok, true);
    manager.save(storage, result.bindings);
    assert.equal(manager.load(storage).hint.key, "KeyK");
    assert.equal(storage.getItem("settings"), '{"theme":"light"}');

    storage.setItem(manager.STORAGE_KEY, '{"version":0,"bindings":{}}');
    assert.deepEqual(manager.load(storage), manager.defaults());
    storage.setItem(manager.STORAGE_KEY, "{bad json");
    assert.deepEqual(manager.load(storage), manager.defaults());
});
