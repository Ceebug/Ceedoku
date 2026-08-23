postMessage({ type: "ready" });
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

function canPlace(grid, index, value) {
    const row = Math.floor(index / 9);
    const col = index % 9;

    for (let c = 0; c < 9; c++) {
        if (grid[row * 9 + c] === value) return false;
    }

    for (let r = 0; r < 9; r++) {
        if (grid[r * 9 + col] === value) return false;
    }

    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;

    for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
            if (grid[r * 9 + c] === value) return false;
        }
    }

    return true;
}

function fillGrid(grid, index = 0) {
    if (index === 81) return true;

    if (grid[index] !== 0) {
        return fillGrid(grid, index + 1);
    }

    for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (canPlace(grid, index, value)) {
            grid[index] = value;

            if (fillGrid(grid, index + 1)) {
                return true;
            }

            grid[index] = 0;
        }
    }

    return false;
}

function countSolutions(grid, limit = 2) {
    const emptyIndex = grid.findIndex(value => value === 0);

    if (emptyIndex === -1) {
        return 1;
    }

    let count = 0;

    for (let value = 1; value <= 9; value++) {
        if (canPlace(grid, emptyIndex, value)) {
            grid[emptyIndex] = value;

            count += countSolutions(grid, limit);

            grid[emptyIndex] = 0;

            if (count >= limit) {
                return count;
            }
        }
    }

    return count;
}

function makePuzzle(holes) {
    const full = Array(81).fill(0);

    fillGrid(full);

    const draft = [...full];

    const order = shuffle(
        Array.from({ length: 81 }, (_, i) => i)
    );

    let removed = 0;

    for (const index of order) {
        if (removed >= holes) break;

        const keep = draft[index];

        draft[index] = 0;

        const probe = [...draft];

        if (countSolutions(probe, 2) === 1) {
            removed++;
        } else {
            draft[index] = keep;
        }
    }

    return {
        full,
        draft
    };
}

self.onmessage = event => {
    const { holes } = event.data;

    const result = makePuzzle(holes);

    self.postMessage(result);
};
