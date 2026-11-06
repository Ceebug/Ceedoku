(function (root) {
    const STORAGE_KEY = "ceedoku.saves.v1";
    const LEGACY_KEY = "save";

    function parseGame(value) {
        let game;
        try {
            game = typeof value === "string" ? JSON.parse(value) : value;
        } catch {
            return null;
        }

        if (
            !game ||
            !Array.isArray(game.solution) ||
            game.solution.length !== 81 ||
            !game.solution.every(value => Number.isInteger(value) && value >= 1 && value <= 9) ||
            !Array.isArray(game.values) ||
            game.values.length !== 81 ||
            !game.values.every(value => Number.isInteger(value) && value >= 0 && value <= 9) ||
            (game.givens !== undefined &&
                (!Array.isArray(game.givens) ||
                    game.givens.length !== 81 ||
                    !game.givens.every(value => typeof value === "boolean")))
        ) {
            return null;
        }

        return game;
    }

    function progressFor(value) {
        const game = parseGame(value);
        if (!game) return 0;

        const givens = game.givens || game.values.map(value => value !== 0);
        const emptyCells = givens.reduce((count, given) => count + (given ? 0 : 1), 0);
        if (!emptyCells) return 100;

        const completedCells = game.values.reduce(
            (count, cell, index) => count + (!givens[index] && cell !== 0 ? 1 : 0),
            0
        );
        return Math.round((completedCells / emptyCells) * 100);
    }

    function createId(store) {
        let id;
        do {
            id = root.crypto?.randomUUID?.() ||
                `save-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        } while (store.saves.some(save => save && save.id === id));
        return id;
    }

    function create(storage) {
        function read() {
            const raw = storage.getItem(STORAGE_KEY);
            if (raw === null) return { version: 1, activeId: null, saves: [] };

            let store;
            try {
                store = JSON.parse(raw);
            } catch {
                throw new Error("Saved games are corrupted. The original data was left untouched.");
            }
            if (!store || store.version !== 1 || !Array.isArray(store.saves)) {
                throw new Error("Saved games use an unsupported format. The original data was left untouched.");
            }
            return {
                version: 1,
                activeId: typeof store.activeId === "string" ? store.activeId : null,
                order: Array.isArray(store.order) ? store.order.filter(id => typeof id === "string") : null,
                saves: store.saves
            };
        }

        function write(store) {
            storage.setItem(STORAGE_KEY, JSON.stringify(store));
        }

        function list() {
            const store = read();
            const saves = store.saves
                .filter(save => save && typeof save.id === "string" && parseGame(save.data))
                .slice();
            if (Array.isArray(store.order)) {
                const order = new Map(store.order.map((id, index) => [id, index]));
                return saves.sort((a, b) =>
                    (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
                        (order.get(b.id) ?? Number.MAX_SAFE_INTEGER) ||
                    (b.lastPlayed || 0) - (a.lastPlayed || 0)
                );
            }
            return saves.sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0));
        }

        function get(id) {
            return read().saves.find(save =>
                save && save.id === id && parseGame(save.data)
            ) || null;
        }

        function add(value, title, source) {
            const data = typeof value === "string" ? value : JSON.stringify(value);
            const game = parseGame(data);
            if (!game) throw new Error("This save is incomplete or invalid and cannot be added.");

            const store = read();
            const timestamp = Date.now();
            const save = {
                id: createId(store),
                title: String(title || "Sudoku game").trim() || "Sudoku game",
                createdAt: timestamp,
                lastPlayed: timestamp,
                progress: progressFor(game),
                data
            };
            if (source) save.source = source;
            store.saves.push(save);
            if (Array.isArray(store.order)) store.order.unshift(save.id);
            store.activeId = save.id;
            write(store);
            return save;
        }

        function update(id, value) {
            const data = typeof value === "string" ? value : JSON.stringify(value);
            const game = parseGame(data);
            if (!game) throw new Error("The current game state is incomplete and was not saved.");

            const store = read();
            const save = store.saves.find(item => item.id === id);
            if (!save) throw new Error("The active saved game no longer exists.");
            save.data = data;
            save.lastPlayed = Date.now();
            save.progress = progressFor(game);
            store.activeId = id;
            write(store);
            return save;
        }

        function activate(id) {
            const store = read();
            const save = store.saves.find(item => item.id === id);
            if (!save) throw new Error("The selected saved game could not be found.");
            store.activeId = id;
            save.lastPlayed = Date.now();
            write(store);
            return save;
        }

        function rename(id, title) {
            const normalizedTitle = String(title || "").trim();
            if (!normalizedTitle) throw new Error("A saved game title cannot be empty.");
            const store = read();
            const save = store.saves.find(item => item.id === id);
            if (!save) throw new Error("The selected saved game could not be found.");
            save.title = normalizedTitle;
            write(store);
            return save;
        }

        function reorder(id, direction) {
            if (direction !== -1 && direction !== 1) {
                throw new Error("Save order direction must be -1 or 1.");
            }
            const store = read();
            const saves = store.saves
                .filter(save => save && typeof save.id === "string" && parseGame(save.data))
                .slice();
            const currentOrder = Array.isArray(store.order)
                ? new Map(store.order.map((saveId, index) => [saveId, index]))
                : null;
            saves.sort((a, b) => currentOrder
                ? (currentOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
                    (currentOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER) ||
                    (b.lastPlayed || 0) - (a.lastPlayed || 0)
                : (b.lastPlayed || 0) - (a.lastPlayed || 0)
            );
            const index = saves.findIndex(save => save.id === id);
            const target = index + direction;
            if (index < 0 || target < 0 || target >= saves.length) return false;
            [saves[index], saves[target]] = [saves[target], saves[index]];
            store.order = saves.map(save => save.id);
            write(store);
            return true;
        }

        function reorderTo(id, targetIndex) {
            if (!Number.isInteger(targetIndex) || targetIndex < 0) {
                throw new Error("Save order index must be a non-negative integer.");
            }
            const store = read();
            const saves = store.saves
                .filter(save => save && typeof save.id === "string" && parseGame(save.data))
                .slice();
            const currentOrder = Array.isArray(store.order)
                ? new Map(store.order.map((saveId, index) => [saveId, index]))
                : null;
            saves.sort((a, b) => currentOrder
                ? (currentOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (currentOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER) ||
                    (b.lastPlayed || 0) - (a.lastPlayed || 0)
                : (b.lastPlayed || 0) - (a.lastPlayed || 0)
            );
            const sourceIndex = saves.findIndex(save => save.id === id);
            if (sourceIndex < 0 || targetIndex >= saves.length || sourceIndex === targetIndex) return false;
            const [save] = saves.splice(sourceIndex, 1);
            saves.splice(targetIndex, 0, save);
            store.order = saves.map(item => item.id);
            write(store);
            return true;
        }

        function remove(id) {
            const store = read();
            const index = store.saves.findIndex(item => item.id === id);
            if (index < 0) return { removed: false, activeId: store.activeId };
            store.saves.splice(index, 1);
            if (Array.isArray(store.order)) {
                store.order = store.order.filter(saveId => saveId !== id);
            }
            if (store.activeId === id) {
                store.activeId = store.saves.length
                    ? store.saves.slice().sort((a, b) => b.lastPlayed - a.lastPlayed)[0].id
                    : null;
            }
            write(store);
            return { removed: true, activeId: store.activeId };
        }

        function migrateLegacy() {
            const legacy = storage.getItem(LEGACY_KEY);
            if (legacy === null || !parseGame(legacy)) return null;

            const store = read();
            const existing = store.saves.find(save => save && save.data === legacy && parseGame(save.data));
            if (existing) {
                if (!store.activeId) {
                    store.activeId = existing.id;
                    write(store);
                }
                return existing;
            }

            const timestamp = Date.now();
            const previousLegacySaves = store.saves.filter(save =>
                save && typeof save.title === "string" && /^My Save(?: \(\d+\))?$/.test(save.title)
            ).length;
            const save = {
                id: createId(store),
                title: previousLegacySaves ? `My Save (${previousLegacySaves + 1})` : "My Save",
                createdAt: timestamp,
                lastPlayed: timestamp,
                progress: progressFor(legacy),
                data: legacy,
                source: "legacy"
            };
            store.saves.push(save);
            if (Array.isArray(store.order)) store.order.unshift(save.id);
            store.activeId = save.id;
            write(store);
            return save;
        }

        function activeId() {
            return read().activeId;
        }

        return { list, get, add, update, activate, rename, reorder, reorderTo, remove, migrateLegacy, activeId, progressFor, parseGame };
    }

    root.CeedokuSaveManager = { STORAGE_KEY, LEGACY_KEY, create, parseGame, progressFor };
})(globalThis);
