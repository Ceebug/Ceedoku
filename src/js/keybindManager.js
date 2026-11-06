(function (root) {
    const defaults = [
        { id: "print", label: "Print game", key: "KeyP", primary: true },
        { id: "undo", label: "Undo", key: "KeyZ", primary: true },
        { id: "redo", label: "Redo", key: "KeyZ", primary: true, shift: true },
        { id: "redo-alt", label: "Redo (alternate)", key: "KeyY", primary: true },
        { id: "pause", label: "Pause / resume", key: "Space" },
        { id: "pencil", label: "Toggle pencil mode", key: "KeyP" },
        { id: "hint", label: "Get a hint", key: "KeyH" },
        { id: "erase-mode", label: "Toggle erase mode", key: "KeyE" },
        ...Array.from({ length: 9 }, (_, index) => ({
            id: `number-${index + 1}`,
            label: `Enter ${index + 1}`,
            key: `Digit${index + 1}`
        })),
        { id: "erase-backspace", label: "Erase cell", key: "Backspace" },
        { id: "erase-delete", label: "Erase cell", key: "Delete" },
        { id: "erase-zero", label: "Erase cell", key: "Digit0" },
        { id: "move-up", label: "Move selection up", key: "ArrowUp" },
        { id: "move-down", label: "Move selection down", key: "ArrowDown" },
        { id: "move-left", label: "Move selection left", key: "ArrowLeft" },
        { id: "move-right", label: "Move selection right", key: "ArrowRight" }
    ];
    const STORAGE_KEY = "keybinds";
    const ACTIONS = defaults.map(binding => binding.id);
    const RESERVED_CODES = new Set([
        "Tab", "Escape", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8",
        "F9", "F10", "F11", "F12", "BrowserBack", "BrowserForward",
        "BrowserRefresh", "BrowserSearch", "BrowserHome", "ControlLeft",
        "ControlRight", "ShiftLeft", "ShiftRight", "AltLeft", "AltRight",
        "MetaLeft", "MetaRight", "Unidentified", "Process", "Dead"
    ]);

    function defaultBindings() {
        return Object.fromEntries(defaults.map(binding => [binding.id, { ...binding }]));
    }

    function normalize(binding) {
        if (!binding || typeof binding.key !== "string" || !/^[A-Za-z][A-Za-z0-9]*$/.test(binding.key)) {
            return null;
        }
        return {
            key: binding.key,
            primary: Boolean(binding.primary),
            ctrl: Boolean(binding.ctrl),
            meta: Boolean(binding.meta),
            alt: Boolean(binding.alt),
            shift: Boolean(binding.shift)
        };
    }

    function isReserved(binding) {
        if (RESERVED_CODES.has(binding.key) || /^F\d+$/.test(binding.key)) return true;
        if (binding.alt && /^Arrow/.test(binding.key)) return true;
        const command = binding.primary || binding.ctrl || binding.meta;
        if (!command) return false;
        const key = binding.key.toLowerCase();
        return ["w", "t", "n", "r", "l", "q", "o", "s", "d", "f", "g", "h", "j", "u"].some(letter =>
            binding.key === `Key${letter.toUpperCase()}`
        ) ||
            (binding.shift && ["KeyI", "KeyJ", "KeyC", "KeyU"].includes(binding.key)) ||
            (key === "delete" && (binding.primary || binding.ctrl || binding.meta)) ||
            key === "escape";
    }

    function signature(binding) {
        const modifiers = [
            binding.primary ? "primary" : "",
            binding.ctrl ? "ctrl" : "",
            binding.meta ? "meta" : "",
            binding.alt ? "alt" : "",
            binding.shift ? "shift" : ""
        ].filter(Boolean).join("+");
        return `${modifiers}:${binding.key}`;
    }

    function conflicts(bindings) {
        const occupied = new Map();
        for (const id of ACTIONS) {
            const binding = normalize(bindings[id]);
            if (!binding) continue;
            const key = signature(binding);
            if (occupied.has(key)) return [occupied.get(key), id];
            occupied.set(key, id);
        }
        return null;
    }

    function load(storage) {
        const defaultsMap = defaultBindings();
        const raw = storage.getItem(STORAGE_KEY);
        if (raw === null) return defaultsMap;

        try {
            const saved = JSON.parse(raw);
            if (!saved || typeof saved !== "object" || saved.version !== 1 || !saved.bindings) {
                return defaultsMap;
            }
            const merged = { ...defaultsMap };
            for (const id of ACTIONS) {
                if (!(id in saved.bindings)) continue;
                const binding = normalize(saved.bindings[id]);
                if (!binding || isReserved(binding)) return defaultsMap;
                merged[id] = { id, label: defaults.find(item => item.id === id).label, ...binding };
            }
            if (conflicts(merged)) return defaultsMap;
            return merged;
        } catch {
            return defaultsMap;
        }
    }

    function save(storage, bindings) {
        storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, bindings }));
    }

    function assign(bindings, id, candidate) {
        if (!ACTIONS.includes(id)) return { ok: false, reason: "unknown-action" };
        const binding = normalize(candidate);
        if (!binding || !binding.key || ["ControlLeft", "ControlRight", "ShiftLeft", "ShiftRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight"].includes(binding.key)) {
            return { ok: false, reason: "unsupported-key" };
        }
        if (isReserved(binding)) return { ok: false, reason: "reserved-key" };

        const updated = { ...bindings, [id]: { ...bindings[id], ...binding } };
        const conflict = conflicts(updated);
        if (conflict) return { ok: false, reason: "conflict", conflict };
        return { ok: true, bindings: updated };
    }

    function reset(bindings, id) {
        if (!ACTIONS.includes(id)) return { ok: false, reason: "unknown-action" };
        return assign(bindings, id, defaultBindings()[id]);
    }

    function resetAll() {
        return defaultBindings();
    }

    function eventMatches(event, binding) {
        const primary = Boolean(event.ctrlKey || event.metaKey);
        return event.code === binding.key &&
            (binding.primary ? primary : Boolean(event.ctrlKey) === Boolean(binding.ctrl) && Boolean(event.metaKey) === Boolean(binding.meta)) &&
            Boolean(event.altKey) === Boolean(binding.alt) &&
            Boolean(event.shiftKey) === Boolean(binding.shift);
    }

    function displayParts(binding, platform = root.navigator?.userAgentData?.platform || root.navigator?.platform || "") {
        const parts = [];
        if (binding.primary) {
            parts.push(/Mac|iPhone|iPad|iPod/i.test(platform) ? "Cmd" : "Ctrl");
        }
        else {
            if (binding.ctrl) parts.push("Ctrl");
            if (binding.meta) parts.push("Cmd");
        }
        if (binding.alt) parts.push("Alt");
        if (binding.shift) parts.push("Shift");
        const key = binding.key
            .replace(/^Key/, "")
            .replace(/^Digit/, "")
            .replace(/^Arrow/, "Arrow ")
            .replace(/^Space$/, "Space")
            .replace(/^Backspace$/, "Backspace")
            .replace(/^Delete$/, "Delete");
        parts.push(key);
        return parts;
    }

    function display(binding, platform) {
        return displayParts(binding, platform).join(" + ");
    }

    root.CeedokuKeybindManager = {
        STORAGE_KEY,
        ACTIONS,
        defaults: defaultBindings,
        load,
        save,
        assign,
        reset,
        resetAll,
        conflicts,
        isReserved,
        eventMatches,
        displayParts,
        display
    };
})(globalThis);
