const test = require("node:test");
const assert = require("node:assert/strict");
require("../src/js/saveManager.js");

const { create, LEGACY_KEY, STORAGE_KEY, progressFor } = globalThis.CeedokuSaveManager;

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

    removeItem(key) {
        this.entries.delete(key);
    }
}

function previousVersionSave(filledCells = 0) {
    const solution = Array.from({ length: 81 }, (_, index) => index % 9 + 1);
    const givens = Array.from({ length: 81 }, (_, index) => index < 73);
    const values = solution.map((value, index) =>
        givens[index] || index < 73 + filledCells ? value : 0
    );
    return {
        solution,
        values,
        givens,
        notes: Array.from({ length: 81 }, () => []),
        selected: 73,
        difficulty: "expert",
        pencilMode: true,
        eraseMode: false,
        mistakes: 2,
        elapsedMs: 45678,
        timerPaused: true,
        undoStack: [{ index: 73, before: { value: 0 } }],
        redoStack: [],
        finished: false,
        pageMode: "dark",
        hintcount: 3,
        hintcounter: 1,
        cooldownmoves: 2,
        cooldowntime: 0,
        cooldowntypetouse: "moves",
        canusehelp: true
    };
}

test("migrates the existing single-save format without changing the source", () => {
    const original = JSON.stringify(previousVersionSave(2));
    const storage = new MemoryStorage({ [LEGACY_KEY]: original });
    const saves = create(storage);

    const migrated = saves.migrateLegacy();
    assert.ok(migrated);
    assert.equal(migrated.source, "legacy");
    assert.equal(migrated.progress, 25);
    assert.equal(storage.getItem(LEGACY_KEY), original);
    assert.deepEqual(JSON.parse(saves.get(migrated.id).data), JSON.parse(original));
    assert.equal(saves.migrateLegacy().id, migrated.id);
});

test("does not re-import the active compatibility mirror on reload", () => {
    const data = JSON.stringify(previousVersionSave(2));
    const storage = new MemoryStorage({ [LEGACY_KEY]: data });
    const saves = create(storage);
    const existing = saves.add(data, "Managed save");

    assert.equal(saves.migrateLegacy().id, existing.id);
    assert.equal(saves.list().length, 1);
    assert.equal(saves.activeId(), existing.id);
});

test("migrates a changed legacy save without replacing its earlier migration", () => {
    const storage = new MemoryStorage({ [LEGACY_KEY]: JSON.stringify(previousVersionSave(1)) });
    const saves = create(storage);
    const earlier = saves.migrateLegacy();

    storage.setItem(LEGACY_KEY, JSON.stringify(previousVersionSave(4)));
    const later = saves.migrateLegacy();

    assert.notEqual(earlier.id, later.id);
    assert.equal(later.title, "My Save (2)");
    assert.equal(saves.list().length, 2);
    assert.equal(JSON.parse(saves.get(earlier.id).data).values[76], 0);
    assert.equal(
        JSON.parse(saves.get(later.id).data).values[76],
        previousVersionSave(4).solution[76]
    );
});

test("creates, updates, renames, and deletes independent saves", () => {
    const storage = new MemoryStorage();
    const saves = create(storage);
    const firstGame = previousVersionSave(1);
    const secondGame = previousVersionSave(4);
    const first = saves.add(firstGame, "First");
    const second = saves.add(secondGame, "Second");

    assert.notEqual(first.id, second.id);
    assert.equal(saves.get(first.id).progress, 13);
    assert.equal(saves.get(second.id).progress, 50);

    firstGame.values[78] = firstGame.solution[78];
    saves.update(first.id, firstGame);
    saves.rename(first.id, "Renamed");
    assert.equal(saves.get(first.id).title, "Renamed");
    assert.equal(JSON.parse(saves.get(first.id).data).values[78], firstGame.solution[78]);
    assert.equal(JSON.parse(saves.get(second.id).data).values[78], 0);

    assert.equal(saves.remove(first.id).removed, true);
    assert.equal(saves.get(first.id), null);
    assert.equal(saves.get(second.id).title, "Second");
    assert.equal(saves.activeId(), second.id);
});

test("reorders saves independently of their last-played timestamps", () => {
    const saves = create(new MemoryStorage());
    const first = saves.add(previousVersionSave(1), "First");
    const second = saves.add(previousVersionSave(2), "Second");
    const third = saves.add(previousVersionSave(3), "Third");

    const initialOrder = saves.list().map(save => save.id);
    assert.equal(saves.reorder(initialOrder[1], -1), true);
    const reordered = [initialOrder[1], initialOrder[0], initialOrder[2]];
    assert.deepEqual(saves.list().map(save => save.id), reordered);
    saves.activate(initialOrder[2]);
    assert.deepEqual(saves.list().map(save => save.id), reordered);
    assert.equal(saves.reorder(initialOrder[1], -1), false);
    assert.equal(saves.reorder(initialOrder[2], 1), false);
});

test("moves a save to a requested position and persists the new order", () => {
    const storage = new MemoryStorage();
    const saves = create(storage);
    const first = saves.add(previousVersionSave(1), "First");
    const second = saves.add(previousVersionSave(2), "Second");
    const third = saves.add(previousVersionSave(3), "Third");
    const original = saves.list().map(save => save.id);

    assert.equal(saves.reorderTo(original[2], 0), true);
    assert.deepEqual(saves.list().map(save => save.id), [original[2], original[0], original[1]]);
    assert.equal(saves.reorderTo(original[2], 0), false);
    assert.equal(saves.reorderTo("missing", 1), false);
    assert.throws(() => saves.reorderTo(first.id, -1), /non-negative integer/);
    assert.equal(saves.reorderTo(second.id, 3), false);
    assert.deepEqual(create(storage).list().map(save => save.id), [original[2], original[0], original[1]]);
    assert.ok(saves.get(third.id));
});

test("does not impose a save-count limit", () => {
    const saves = create(new MemoryStorage());
    const ids = new Set();
    for (let index = 0; index < 200; index += 1) {
        ids.add(saves.add(previousVersionSave(index % 9), `Game ${index}`).id);
    }
    assert.equal(ids.size, 200);
    assert.equal(saves.list().length, 200);
});

test("reports completion progress and rejects invalid imports without replacing data", () => {
    const storage = new MemoryStorage();
    const saves = create(storage);
    const first = saves.add(previousVersionSave(0), "Valid");
    const before = storage.getItem(STORAGE_KEY);

    assert.equal(progressFor(previousVersionSave(8)), 100);
    assert.throws(() => saves.add("not-json", "Broken"), /incomplete or invalid/);
    assert.equal(storage.getItem(STORAGE_KEY), before);
    assert.equal(saves.get(first.id).title, "Valid");
    assert.equal(saves.migrateLegacy(), null);
});

test("preserves malformed collection data and surfaces unavailable storage", () => {
    const corrupt = "{broken";
    const storage = new MemoryStorage({ [STORAGE_KEY]: corrupt });
    const saves = create(storage);
    assert.throws(() => saves.list(), /corrupted/);
    assert.equal(storage.getItem(STORAGE_KEY), corrupt);

    const failingStorage = {
        getItem() { return null; },
        setItem() { throw new Error("quota exceeded"); }
    };
    assert.throws(() => create(failingStorage).add(previousVersionSave(), "Game"), /quota exceeded/);
});

test("supports older incomplete states that predate optional fields", () => {
    const oldState = previousVersionSave(3);
    delete oldState.notes;
    delete oldState.givens;
    const storage = new MemoryStorage({ [LEGACY_KEY]: JSON.stringify(oldState) });
    const migrated = create(storage).migrateLegacy();
    assert.ok(migrated);
    assert.equal(JSON.parse(migrated.data).mistakes, 2);
});
