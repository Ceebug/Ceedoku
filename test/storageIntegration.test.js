const test = require("node:test");
const assert = require("node:assert/strict");
require("../src/js/saveManager.js");
require("../src/js/keybindManager.js");

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

function game(seed) {
    const solution = Array.from({ length: 81 }, (_, index) => (index + seed) % 9 + 1);
    const givens = Array.from({ length: 81 }, (_, index) => index < 72);
    return {
        solution,
        values: solution.map((value, index) => givens[index] ? value : 0),
        givens,
        notes: Array.from({ length: 81 }, () => []),
        selected: 72,
        difficulty: "medium",
        pencilMode: false,
        eraseMode: false,
        mistakes: 0,
        elapsedMs: 1000,
        timerPaused: true,
        undoStack: [],
        redoStack: [],
        finished: false
    };
}

test("deleting a save leaves other saves, keybinds, and existing settings intact", () => {
    const storage = new MemoryStorage({ settings: '{"theme":"light","haptics":{"enabled":false}}' });
    const saves = globalThis.CeedokuSaveManager.create(storage);
    const preferences = globalThis.CeedokuKeybindManager;
    const first = saves.add(game(0), "First game");
    const second = saves.add(game(1), "Second game");
    const custom = preferences.assign(preferences.defaults(), "hint", { key: "KeyK" });
    preferences.save(storage, custom.bindings);
    const settings = storage.getItem("settings");

    assert.equal(saves.remove(first.id).removed, true);
    assert.equal(saves.get(first.id), null);
    assert.deepEqual(JSON.parse(saves.get(second.id).data).solution, game(1).solution);
    assert.equal(preferences.load(storage).hint.key, "KeyK");
    assert.equal(storage.getItem("settings"), settings);
});
