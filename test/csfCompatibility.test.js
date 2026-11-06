const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
require("../src/js/saveManager.js");

function legacyGame() {
    const solution = Array.from({ length: 81 }, (_, index) => index % 9 + 1);
    const givens = Array.from({ length: 81 }, (_, index) => index < 70);
    const values = solution.map((value, index) =>
        givens[index] || index < 74 ? value : 0
    );
    return {
        solution,
        values,
        givens,
        notes: Array.from({ length: 81 }, (_, index) => index === 74 ? [2, 5] : []),
        selected: 74,
        difficulty: "master",
        pencilMode: true,
        eraseMode: false,
        mistakes: 3,
        elapsedMs: 120000,
        timerPaused: true,
        undoStack: [{ index: 74, before: { value: 0, notes: [2] } }],
        redoStack: [],
        finished: false,
        hintcount: 4,
        hintcounter: 2,
        cooldownmoves: 1,
        cooldowntime: 0,
        cooldowntypetouse: "moves",
        canusehelp: true
    };
}

test("imports and migrates an existing CSF/1 save without losing game state", async () => {
    const downloads = [];
    const context = vm.createContext({
        TextEncoder,
        TextDecoder,
        Uint8Array,
        DataView,
        ArrayBuffer,
        Blob,
        URL: {
            createObjectURL(blob) {
                downloads.push(blob);
                return "blob:legacy-save";
            },
            revokeObjectURL() {}
        },
        document: {
            createElement() {
                return { click() {}, remove() {} };
            },
            body: { appendChild() {} }
        }
    });
    const root = path.resolve(__dirname, "../src/js/lib");
    vm.runInContext(fs.readFileSync(path.join(root, "FSJ.js"), "utf8"), context);
    vm.runInContext(fs.readFileSync(path.join(root, "JSF.js"), "utf8"), context);

    const original = legacyGame();
    const serialized = JSON.stringify(original);
    vm.runInContext("FSJ", context)(serialized, "previous-version");
    const imported = await vm.runInContext("JSF", context)(downloads[0]);
    const importedGame = JSON.parse(imported);
    assert.deepEqual(importedGame.values, original.values);
    assert.deepEqual(importedGame.givens, original.givens);
    assert.equal(importedGame.difficulty, "master");
    assert.equal(importedGame.elapsedMs, 120000);
    assert.deepEqual(importedGame.notes[74], [2, 5]);
    assert.equal(importedGame.mistakes, 3);

    const storage = {
        values: new Map([["save", imported]]),
        getItem(key) { return this.values.get(key) ?? null; },
        setItem(key, value) { this.values.set(key, String(value)); }
    };
    const migrated = globalThis.CeedokuSaveManager.create(storage).migrateLegacy();
    assert.deepEqual(JSON.parse(migrated.data).values, original.values);
});
