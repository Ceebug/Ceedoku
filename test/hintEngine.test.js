const test = require("node:test");
const assert = require("node:assert/strict");
require("../src/js/hintEngine.js");

const engine = globalThis.CeedokuHintEngine;
const solved = "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
    .split("")
    .map(Number);

test("explains a naked single and prefers the selected cell when it is forced", () => {
    const board = [...solved];
    board[0] = 0;
    const move = engine.findMove(board, 0);

    assert.equal(move.index, 0);
    assert.equal(move.value, 5);
    assert.equal(move.technique, "Naked single");
    assert.match(move.explanation, /only 5 fits/i);
    assert.equal(move.steps.length, 4);
    assert.match(move.steps[0], /already in row 1/i);
    assert.match(move.steps[3], /place it in row 1, column 1/i);
    assert.ok(move.relatedCells.includes(1));
    assert.ok(!move.relatedCells.includes(move.index));
});

test("explains hidden singles and deductions unlocked by advanced eliminations", () => {
    const hiddenSingle = "000008910600005008008040007050700020000000000013904006000000000087019600340286070"
        .split("")
        .map(Number);
    const hiddenMove = engine.findMove(hiddenSingle);
    assert.equal(hiddenMove.technique, "Hidden single");
    assert.match(hiddenMove.explanation, /only one possible cell/i);
    assert.equal(hiddenMove.steps.length, 3);
    assert.ok(Array.isArray(hiddenMove.relatedCells));
    assert.ok(hiddenMove.relatedCells.length > 0);
    assert.ok(!hiddenMove.relatedCells.includes(hiddenMove.index));

    const subsetBoard = "500000000000000008100040060000000400400003791703000806000500284007009600000280000"
        .split("")
        .map(Number);
    const subsetMove = engine.findMove(subsetBoard);
    assert.equal(subsetMove.technique, "Naked subset");
    assert.match(subsetMove.explanation, /naked triple/i);
    assert.ok(subsetMove.steps.length > 1);
    assert.ok(subsetMove.relatedCells.length > 1);
    assert.ok(subsetMove.relatedCells.every(index => Number.isInteger(index) && index >= 0 && index < 81));
});

test("logical deductions agree with a known solution across varied incomplete boards", () => {
    let seed = 1234567;
    const random = () => ((seed = seed * 48271 % 2147483647) / 2147483647);
    for (let trial = 0; trial < 120; trial += 1) {
        const board = [...solved];
        const indexes = Array.from({ length: 81 }, (_, index) => index).sort(() => random() - 0.5);
        for (const index of indexes.slice(0, 42 + Math.floor(random() * 23))) {
            board[index] = 0;
        }
        const move = engine.findMove(board);
        if (move) {
            assert.equal(move.value, solved[move.index]);
            assert.ok(move.relatedCells.every(index =>
                Number.isInteger(index) && index >= 0 && index < 81 && index !== move.index
            ));
        }
    }
});

test("provides explanations for the standard logical technique set", () => {
    assert.deepEqual(engine.techniques, [
        "Naked single",
        "Hidden single",
        "Pointing",
        "Claiming",
        "Naked subset",
        "Hidden subset",
        "X-Wing",
        "Swordfish",
        "Jellyfish",
        "XY-Wing",
        "W-Wing",
        "Simple coloring",
        "Backtracking search"
    ]);
});

test("rejects malformed boards and returns no move for a completed board", () => {
    assert.equal(engine.findMove(Array(80).fill(0)), null);
    assert.equal(engine.findMove(solved), null);
    assert.equal(engine.findMove([...solved.slice(0, 80), 10]), null);
});

test("backtracking search solves the grid with a bounded search budget", () => {
    const board = [...solved];
    board[40] = 0;
    const result = engine.solve(board);
    assert.equal(result.complete, true);
    assert.equal(result.solutions.length, 1);
    assert.deepEqual(result.solutions[0], solved);

    const multipleSolutions = engine.solve(Array(81).fill(0), 2, 100);
    assert.equal(multipleSolutions.solutions.length, 2);
    assert.equal(multipleSolutions.complete, true);
});
