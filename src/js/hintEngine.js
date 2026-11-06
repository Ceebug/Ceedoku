(function (root) {
    const digits = Array.from({ length: 9 }, (_, index) => index + 1);
    const rows = Array.from({ length: 9 }, (_, row) =>
        Array.from({ length: 9 }, (_, col) => row * 9 + col)
    );
    const columns = Array.from({ length: 9 }, (_, col) =>
        Array.from({ length: 9 }, (_, row) => row * 9 + col)
    );
    const boxes = Array.from({ length: 9 }, (_, box) => {
        const rowStart = Math.floor(box / 3) * 3;
        const colStart = box % 3 * 3;
        return Array.from({ length: 9 }, (_, index) =>
            (rowStart + Math.floor(index / 3)) * 9 + colStart + index % 3
        );
    });
    const units = [
        ...rows.map((cells, index) => ({ cells, type: "row", index })),
        ...columns.map((cells, index) => ({ cells, type: "column", index })),
        ...boxes.map((cells, index) => ({ cells, type: "box", index }))
    ];

    function coordinate(index) {
        return `row ${Math.floor(index / 9) + 1}, column ${index % 9 + 1}`;
    }

    function createCandidates(board) {
        if (!Array.isArray(board) || board.length !== 81) return null;
        const candidates = Array.from({ length: 81 }, () => new Set());
        for (let index = 0; index < 81; index += 1) {
            const value = board[index];
            if (!Number.isInteger(value) || value < 0 || value > 9) return null;
            if (value !== 0) continue;
            candidates[index] = getCellCandidates(board, index);
            if (!candidates[index].size) return null;
        }
        return candidates;
    }

    function getCellCandidates(board, index) {
        const row = rows[Math.floor(index / 9)];
        const column = columns[index % 9];
        const box = boxes[Math.floor(Math.floor(index / 9) / 3) * 3 + Math.floor((index % 9) / 3)];
        const used = new Set([...row, ...column, ...box].map(cell => board[cell]).filter(Boolean));
        return new Set(digits.filter(digit => !used.has(digit)));
    }

    function solve(board, maxSolutions = 2, maxNodes = 20000) {
        const grid = board.slice();
        const solutions = [];
        let nodes = 0;
        let complete = true;
        function search() {
            if (solutions.length >= maxSolutions || !complete) return;
            nodes += 1;
            if (nodes > maxNodes) {
                complete = false;
                return;
            }
            let bestIndex = -1;
            let bestCandidates = null;
            for (let index = 0; index < 81; index += 1) {
                if (grid[index] !== 0) continue;
                const options = getCellCandidates(grid, index);
                if (!options.size) return;
                if (!bestCandidates || options.size < bestCandidates.size) {
                    bestIndex = index;
                    bestCandidates = options;
                    if (options.size === 1) break;
                }
            }
            if (bestIndex < 0) {
                solutions.push(grid.slice());
                return;
            }
            for (const value of bestCandidates) {
                grid[bestIndex] = value;
                search();
                grid[bestIndex] = 0;
                if (solutions.length >= maxSolutions) return;
            }
        }
        search();
        return { solutions, complete };
    }

    function findSingle(board, candidates, preferredIndex) {
        const order = preferredIndex !== undefined && preferredIndex >= 0
            ? [preferredIndex, ...Array.from({ length: 81 }, (_, index) => index).filter(index => index !== preferredIndex)]
            : Array.from({ length: 81 }, (_, index) => index);
        for (const index of order) {
            if (board[index] === 0 && candidates[index].size === 1) {
                const value = candidates[index].values().next().value;
                const row = Math.floor(index / 9);
                const column = index % 9;
                const box = Math.floor(row / 3) * 3 + Math.floor(column / 3);
                const unitsForCell = [
                    { label: `row ${row + 1}`, cells: rows[row] },
                    { label: `column ${column + 1}`, cells: columns[column] },
                    { label: `box ${box + 1}`, cells: boxes[box] }
                ];
                return {
                    index,
                    value,
                    technique: "Naked single",
                    explanation: `Only ${value} fits in ${coordinate(index)} because every other digit is already used in its row, column, or box.`,
                    steps: [
                        ...unitsForCell.map(unit => {
                            const used = [...new Set(unit.cells.map(cell => board[cell]).filter(Boolean))].sort((a, b) => a - b);
                            return used.length
                                ? `Digits ${used.join(", ")} are already in ${unit.label}, so they cannot go in ${coordinate(index)}.`
                                : `There are no placed digits in ${unit.label} to eliminate candidates.`;
                        }),
                        `That leaves ${value} as the only candidate. Place it in ${coordinate(index)}.`
                    ],
                    relatedCells: Array.from({ length: 81 }, (_, peer) =>
                        peer !== index && arePeers(index, peer) && board[peer] !== 0 ? peer : -1
                    ).filter(peer => peer >= 0)
                };
            }
        }
        for (const unit of units) {
            for (const digit of digits) {
                const cells = unit.cells.filter(index => board[index] === 0 && candidates[index].has(digit));
                if (cells.length === 1) {
                    return {
                        index: cells[0],
                        value: digit,
                        technique: "Hidden single",
                        explanation: `${digit} has only one possible cell in ${unit.type} ${unit.index + 1}, so it must go in ${coordinate(cells[0])}.`,
                        steps: [
                            `${digit} must appear once in ${unit.type} ${unit.index + 1}.`,
                            `Checking the legal candidates in that unit leaves ${coordinate(cells[0])} as the only place for ${digit}.`,
                            `Place ${digit} in ${coordinate(cells[0])}.`
                        ],
                        relatedCells: unit.cells.filter(index => board[index] !== 0)
                    };
                }
            }
        }
        return null;
    }

    function subsetCombinations(items, size, visit) {
        const chosen = [];
        function walk(start) {
            if (chosen.length === size) {
                visit(chosen.slice());
                return;
            }
            for (let index = start; index <= items.length - (size - chosen.length); index += 1) {
                chosen.push(items[index]);
                walk(index + 1);
                chosen.pop();
            }
        }
        walk(0);
    }

    function elimination(candidates, indexes, digitsToRemove, technique, description, relatedCells = []) {
        const changes = [];
        for (const index of indexes) {
            const removed = digitsToRemove.filter(digit => candidates[index].has(digit));
            if (removed.length) changes.push({ index, removed });
        }
        return changes.length
            ? {
                changes,
                technique,
                description,
                relatedCells: [...new Set([...relatedCells, ...changes.map(change => change.index)])]
            }
            : null;
    }

    function findLockedCandidate(board, candidates) {
        for (let boxIndex = 0; boxIndex < boxes.length; boxIndex += 1) {
            const box = boxes[boxIndex];
            for (const digit of digits) {
                const cells = box.filter(index => board[index] === 0 && candidates[index].has(digit));
                if (cells.length < 2) continue;
                const row = Math.floor(cells[0] / 9);
                if (cells.every(index => Math.floor(index / 9) === row)) {
                    const changes = elimination(
                        candidates,
                        rows[row].filter(index => !box.includes(index)),
                        [digit],
                        "Pointing",
                        `In box ${boxIndex + 1}, every possible ${digit} is in row ${row + 1}; remove ${digit} from the rest of that row.`,
                        cells
                    );
                    if (changes) return changes;
                }
                const column = cells[0] % 9;
                if (cells.every(index => index % 9 === column)) {
                    const changes = elimination(
                        candidates,
                        columns[column].filter(index => !box.includes(index)),
                        [digit],
                        "Pointing",
                        `In box ${boxIndex + 1}, every possible ${digit} is in column ${column + 1}; remove ${digit} from the rest of that column.`,
                        cells
                    );
                    if (changes) return changes;
                }
            }
        }
        for (const [isRow, lines] of [[true, rows], [false, columns]]) {
          for (const [lineIndex, line] of lines.entries()) {
            for (const digit of digits) {
                const cells = line.filter(index => board[index] === 0 && candidates[index].has(digit));
                if (cells.length < 2) continue;
                const boxIndexes = new Set(cells.map(index =>
                    Math.floor(Math.floor(index / 9) / 3) * 3 + Math.floor((index % 9) / 3)
                ));
                if (boxIndexes.size !== 1) continue;
                const boxIndex = boxIndexes.values().next().value;
                const changes = elimination(
                    candidates,
                    boxes[boxIndex].filter(index => !line.includes(index)),
                    [digit],
                    "Claiming",
                    `All possible ${digit}s in ${isRow ? `row ${lineIndex + 1}` : `column ${lineIndex + 1}`} lie inside box ${boxIndex + 1}; remove ${digit} from the other cells in that box.`,
                    cells
                );
                if (changes) return changes;
            }
          }
        }
        return null;
    }

    function findNakedSubset(board, candidates) {
        for (const unit of units) {
            const cells = unit.cells.filter(index => board[index] === 0 && candidates[index].size >= 2 && candidates[index].size <= 4);
            for (let size = 2; size <= 4; size += 1) {
                let result = null;
                subsetCombinations(cells, size, subset => {
                    if (result) return;
                    const union = new Set(subset.flatMap(index => [...candidates[index]]));
                    if (union.size !== size) return;
                    const others = unit.cells.filter(index => !subset.includes(index) && board[index] === 0);
                    result = elimination(
                        candidates,
                        others,
                        [...union],
                        "Naked subset",
                        `A naked ${["", "", "pair", "triple", "quad"][size]} in ${unit.type} ${unit.index + 1} uses ${[...union].join(" and ")}; remove those candidates from the other cells in the unit.`,
                        subset
                    );
                });
                if (result) return result;
            }
        }
        return null;
    }

    function findHiddenSubset(board, candidates) {
        for (const unit of units) {
            const emptyCells = unit.cells.filter(index => board[index] === 0);
            for (let size = 2; size <= 4; size += 1) {
                let result = null;
                subsetCombinations(digits, size, subset => {
                    if (result) return;
                    const cells = emptyCells.filter(index => subset.some(digit => candidates[index].has(digit)));
                    if (cells.length !== size) return;
                    if (subset.some(digit => !cells.some(index => candidates[index].has(digit)))) return;
                    for (const index of cells) {
                        const extras = [...candidates[index]].filter(digit => !subset.includes(digit));
                        if (!extras.length) continue;
                        result = {
                            changes: [{ index, removed: extras }],
                            technique: "Hidden subset",
                            description: `A hidden ${["", "", "pair", "triple", "quad"][size]} of ${subset.join(" and ")} occupies the only possible cells in ${unit.type} ${unit.index + 1}; remove other candidates from those cells.`,
                            relatedCells: cells
                        };
                        break;
                    }
                });
                if (result) return result;
            }
        }
        return null;
    }

    function findFish(board, candidates) {
        for (const size of [2, 3, 4]) {
            for (const orientation of ["row", "column"]) {
                const bases = orientation === "row" ? rows : columns;
                const covers = orientation === "row" ? columns : rows;
                for (const digit of digits) {
                    const eligible = bases
                        .map((cells, index) => ({
                            index,
                            covers: covers.map((cover, coverIndex) =>
                                cover.some(cell => cells.includes(cell) && board[cell] === 0 && candidates[cell].has(digit))
                                    ? coverIndex
                                    : -1
                            ).filter(index => index >= 0)
                        }))
                        .filter(base => base.covers.length >= 2 && base.covers.length <= size);
                    let result = null;
                    subsetCombinations(eligible, size, chosen => {
                        if (result) return;
                        const coverSet = new Set(chosen.flatMap(base => base.covers));
                        if (coverSet.size !== size) return;
                        const targets = [];
                        const patternCells = [];
                        for (const base of chosen) {
                            for (const coverIndex of coverSet) {
                                const cell = covers[coverIndex].find(index =>
                                    bases[base.index].includes(index) &&
                                    board[index] === 0 &&
                                    candidates[index].has(digit)
                                );
                                if (cell !== undefined) patternCells.push(cell);
                            }
                        }
                        for (let baseIndex = 0; baseIndex < bases.length; baseIndex += 1) {
                            if (chosen.some(base => base.index === baseIndex)) continue;
                            for (const coverIndex of coverSet) {
                                const target = covers[coverIndex].find(cell =>
                                    bases[baseIndex].includes(cell) && board[cell] === 0 && candidates[cell].has(digit)
                                );
                                if (target !== undefined) targets.push(target);
                            }
                        }
                        result = elimination(
                            candidates,
                            targets,
                            [digit],
                            ["", "", "X-Wing", "Swordfish", "Jellyfish"][size],
                            `${["", "", "X-Wing", "Swordfish", "Jellyfish"][size]} pattern for ${digit} across ${orientation}s confines it to the same ${size} ${orientation === "row" ? "columns" : "rows"}; remove it from the other cells in those lines.`,
                            patternCells
                        );
                    });
                    if (result) return result;
                }
            }
        }
        return null;
    }

    function arePeers(first, second) {
        return rows[Math.floor(first / 9)].includes(second) ||
            columns[first % 9].includes(second) ||
            boxes[Math.floor(Math.floor(first / 9) / 3) * 3 + Math.floor((first % 9) / 3)].includes(second);
    }

    function findXYWing(board, candidates) {
        const bivalue = Array.from({ length: 81 }, (_, index) => index)
            .filter(index => board[index] === 0 && candidates[index].size === 2);
        for (const pivot of bivalue) {
            const [x, y] = candidates[pivot];
            const wings = bivalue.filter(index => index !== pivot && arePeers(pivot, index));
            for (const first of wings) {
                const firstValues = [...candidates[first]];
                const z = firstValues.find(value => value !== x && value !== y);
                const sharedPivot = firstValues.find(value => value === x || value === y);
                if (z === undefined || sharedPivot === undefined) continue;
                for (const second of wings) {
                    if (second === first || candidates[second].size !== 2) continue;
                    if (!candidates[second].has(z)) continue;
                    const otherPivot = [...candidates[second]].find(value => value !== z);
                    if (otherPivot === undefined || otherPivot === sharedPivot) continue;
                    if (!candidates[pivot].has(otherPivot)) continue;
                    const targets = Array.from({ length: 81 }, (_, index) => index)
                        .filter(index => board[index] === 0 && index !== pivot && index !== first && index !== second &&
                            candidates[index].has(z) && arePeers(index, first) && arePeers(index, second));
                    const result = elimination(
                        candidates,
                        targets,
                        [z],
                        "XY-Wing",
                        `An XY-Wing uses ${coordinate(pivot)} as the pivot and pincers at ${coordinate(first)} and ${coordinate(second)}; ${z} can be removed from cells that see both pincers.`,
                        [pivot, first, second]
                    );
                    if (result) return result;
                }
            }
        }
        return null;
    }

    function findWWing(board, candidates) {
        const bivalue = Array.from({ length: 81 }, (_, index) => index)
            .filter(index => board[index] === 0 && candidates[index].size === 2);
        for (let firstIndex = 0; firstIndex < bivalue.length; firstIndex += 1) {
            const first = bivalue[firstIndex];
            const values = [...candidates[first]];
            for (const second of bivalue.slice(firstIndex + 1)) {
                if (!values.every(value => candidates[second].has(value))) continue;
                const targetDigit = values[0];
                const removableDigit = values[1];
                for (const unit of units) {
                    const strongLink = unit.cells.filter(index =>
                        board[index] === 0 && candidates[index].has(targetDigit)
                    );
                    if (strongLink.length !== 2) continue;
                    const [linkA, linkB] = strongLink;
                    if ([first, second].includes(linkA) || [first, second].includes(linkB)) continue;
                    if (!(
                        (arePeers(first, linkA) && arePeers(second, linkB)) ||
                        (arePeers(first, linkB) && arePeers(second, linkA))
                    )) continue;
                    const targets = Array.from({ length: 81 }, (_, index) => index)
                        .filter(index => index !== first && index !== second && board[index] === 0 &&
                            candidates[index].has(removableDigit) && arePeers(index, first) && arePeers(index, second));
                    const result = elimination(
                        candidates,
                        targets,
                        [removableDigit],
                        "W-Wing",
                        `Two ${values.join("/")} cells are joined by a strong link on ${targetDigit}; remove ${removableDigit} from cells that see both wings.`,
                        [first, second, linkA, linkB]
                    );
                    if (result) return result;
                }
            }
        }
        return null;
    }

    function findSimpleColoring(board, candidates) {
        for (const digit of digits) {
            const links = new Map();
            for (const unit of units) {
                const cells = unit.cells.filter(index => board[index] === 0 && candidates[index].has(digit));
                if (cells.length !== 2) continue;
                for (const index of cells) {
                    if (!links.has(index)) links.set(index, new Set());
                    links.get(index).add(cells[0] === index ? cells[1] : cells[0]);
                }
            }
            const colors = new Map();
            for (const start of links.keys()) {
                if (colors.has(start)) continue;
                const component = [[], []];
                const queue = [start];
                colors.set(start, 0);
                let conflict = false;
                while (queue.length) {
                    const index = queue.shift();
                    const color = colors.get(index);
                    component[color].push(index);
                    for (const neighbor of links.get(index) || []) {
                        if (!colors.has(neighbor)) {
                            colors.set(neighbor, 1 - color);
                            queue.push(neighbor);
                        } else if (colors.get(neighbor) === color) {
                            conflict = true;
                        }
                    }
                }
                if (conflict || !component[0].length || !component[1].length) continue;
                for (let color = 0; color < 2; color += 1) {
                    const seesConflict = component[color].some((index, offset) =>
                        component[color].slice(offset + 1).some(other => arePeers(index, other))
                    );
                    if (seesConflict) {
                        const result = elimination(
                            candidates,
                            component[color],
                            [digit],
                            "Simple coloring",
                            `The ${color ? "second" : "first"} color for ${digit} creates a conflict in one Sudoku unit, so that color is false and can be removed.`,
                            [...component[0], ...component[1]]
                        );
                        if (result) return result;
                    }
                }
                const coloredCells = new Set([...component[0], ...component[1]]);
                const targets = Array.from({ length: 81 }, (_, index) => index)
                    .filter(index => board[index] === 0 && !coloredCells.has(index) && candidates[index].has(digit) &&
                        component[0].some(cell => arePeers(index, cell)) &&
                        component[1].some(cell => arePeers(index, cell)));
                const result = elimination(
                    candidates,
                    targets,
                    [digit],
                    "Simple coloring",
                    `This candidate's strong-link chain alternates between two colors. A cell seeing both colors cannot contain ${digit}.`,
                    [...component[0], ...component[1]]
                );
                if (result) return result;
            }
        }
        return null;
    }

    const techniques = [
        findLockedCandidate,
        findNakedSubset,
        findHiddenSubset,
        findFish,
        findXYWing,
        findWWing,
        findSimpleColoring
    ];

    function findMove(board, preferredIndex, knownSolution) {
        const candidates = createCandidates(board);
        if (!candidates) return null;
        const explanations = [];
        for (let attempt = 0; attempt < 300; attempt += 1) {
            const single = findSingle(board, candidates, preferredIndex);
            if (single) {
                if (explanations.length) {
                    single.explanation = `${explanations.map(step => step.description).join(" ")} ${single.explanation}`;
                    single.technique = explanations[explanations.length - 1].technique;
                    single.steps = [
                        ...explanations.map(step => step.description),
                        ...(single.steps || [single.explanation])
                    ];
                }
                single.relatedCells = [...new Set([
                    ...(single.relatedCells || []),
                    ...explanations.flatMap(step => step.relatedCells || [])
                ])].filter(index => index !== single.index);
                return single;
            }
            let progress = false;
            for (const technique of techniques) {
                const step = technique(board, candidates);
                if (!step) continue;
                for (const change of step.changes) {
                    for (const digit of change.removed) candidates[change.index].delete(digit);
                }
                explanations.push(step);
                progress = true;
                break;
            }
            if (!progress) {
                const searchResult = solve(board);
                const hasUniqueSolution = searchResult.complete && searchResult.solutions.length === 1;
                const solution = hasUniqueSolution ? searchResult.solutions[0] : knownSolution;
                if (!solution || solution.length !== 81) return null;
                const target = preferredIndex !== undefined && preferredIndex >= 0 && board[preferredIndex] === 0
                    ? preferredIndex
                    : board.findIndex(value => value === 0);
                if (target < 0 || !solution[target]) return null;
                return {
                    index: target,
                    value: solution[target],
                    technique: hasUniqueSolution ? "Backtracking search" : "Answer key",
                    explanation: hasUniqueSolution
                        ? `No logical pattern gives a placement yet, so a constraint search tried the legal candidates and found ${solution[target]} is needed at ${coordinate(target)} to complete the grid.`
                        : `This board has more than one or no verifiable logical path from its current entries. The saved answer key places ${solution[target]} at ${coordinate(target)}.`,
                    steps: [
                        hasUniqueSolution
                            ? "The listed logical techniques did not resolve an empty cell, so a bounded constraint search checked the remaining legal candidates."
                            : "The listed logical techniques did not resolve an empty cell, so the saved answer key was used.",
                        `The answer for ${coordinate(target)} is ${solution[target]}.`
                    ],
                    relatedCells: Array.from({ length: 81 }, (_, peer) =>
                        peer !== target && arePeers(target, peer) && board[peer] !== 0 ? peer : -1
                    ).filter(peer => peer >= 0)
                };
            }
        }
        return null;
    }

    root.CeedokuHintEngine = {
        findMove,
        solve,
        coordinate,
        techniques: ["Naked single", "Hidden single", "Pointing", "Claiming", "Naked subset", "Hidden subset", "X-Wing", "Swordfish", "Jellyfish", "XY-Wing", "W-Wing", "Simple coloring", "Backtracking search"]
    };
})(globalThis);
