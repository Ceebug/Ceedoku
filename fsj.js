// This code comes from FSJ - https://github.com/ceebug/fsj/fsj.js
const FSJ = (() => {

    const HEADER = "CEEDOKU-CSF/1";

    const KEYS = {
        solution: 0x01,
        values: 0x02,
        givens: 0x03,
        notes: 0x04,
        selected: 0x05,
        difficulty: 0x06,
        pencilMode: 0x07,
        eraseMode: 0x08,
        mistakes: 0x09,
        elapsedMs: 0x0A,
        timerPaused: 0x0B,
        undoRedoStack: 0x0C,
        finished: 0x0D,
        hintcount: 0x0E,
        hintcounter: 0x0F,
        cooldownmoves: 0x10,
        cooldowntime: 0x11,
        cooldowntypetouse: 0x12,
        canusehelp: 0x13
    };

    const DIFFICULTIES = {
        easy: 0,
        medium: 1,
        hard: 2,
        expert: 3,
        master: 4,
        extreme: 5,
        impossible: 6,
        godlike: 7
    };


    // ========================================================
    // CRC-32C
    // ========================================================

    function crc32c(bytes) {

        let crc = 0xFFFFFFFF;

        for (const byte of bytes) {

            crc ^= byte;

            for (let i = 0; i < 8; i++) {

                if (crc & 1) {
                    crc =
                        (crc >>> 1) ^
                        0x82F63B78;
                } else {
                    crc >>>= 1;
                }

            }
        }

        return (crc ^ 0xFFFFFFFF) >>> 0;
    }


    // ========================================================
    // Bit writer
    // ========================================================

    function writeBits(values, bitsPerValue) {

        const totalBits =
            values.length * bitsPerValue;

        const bytes =
            new Uint8Array(
                Math.ceil(totalBits / 8)
            );

        let bit = 0;

        for (const value of values) {

            for (
                let i = 0;
                i < bitsPerValue;
                i++
            ) {

                if ((value >> i) & 1) {

                    bytes[
                        Math.floor(bit / 8)
                    ] |=
                        1 << (bit % 8);

                }

                bit++;
            }
        }

        return bytes;
    }


    // ========================================================
    // Append
    // ========================================================

    function append(array, bytes) {

        for (const byte of bytes) {
            array.push(byte);
        }

    }


    // ========================================================
    // Unsigned 64-bit
    // ========================================================

    function uint64(value) {

        if (
            !Number.isSafeInteger(value) ||
            value < 0
        ) {

            throw new Error(
                "FSJ: invalid unsigned 64-bit value."
            );

        }

        let n = BigInt(value);

        const bytes =
            new Uint8Array(8);

        for (let i = 0; i < 8; i++) {

            bytes[i] =
                Number(n & 0xFFn);

            n >>= 8n;
        }

        return bytes;
    }


    // ========================================================
    // Unsigned 128-bit
    // ========================================================

    function uint128(value) {

        if (
            !Number.isSafeInteger(value) ||
            value < 0
        ) {

            throw new Error(
                "FSJ: invalid unsigned 128-bit value."
            );

        }

        let n = BigInt(value);

        const bytes =
            new Uint8Array(16);

        for (let i = 0; i < 16; i++) {

            bytes[i] =
                Number(n & 0xFFn);

            n >>= 8n;
        }

        return bytes;
    }


    // ========================================================
    // Main FSJ function
    // ========================================================

    function FSJ(json) {

        if (typeof json !== "string") {

            throw new TypeError(
                "FSJ: expected a JSON string."
            );

        }


        let save;

        try {

            save = JSON.parse(json);

        } catch {

            throw new Error(
                "FSJ: invalid JSON."
            );

        }


        // ====================================================
        // Validate boards
        // ====================================================

        if (
            !Array.isArray(save.solution) ||
            save.solution.length !== 81
        ) {

            throw new Error(
                "FSJ: solution must contain 81 cells."
            );

        }

        if (
            !Array.isArray(save.values) ||
            save.values.length !== 81
        ) {

            throw new Error(
                "FSJ: values must contain 81 cells."
            );

        }

        if (
            !Array.isArray(save.givens) ||
            save.givens.length !== 81
        ) {

            throw new Error(
                "FSJ: givens must contain 81 cells."
            );

        }

        if (
            !Array.isArray(save.notes) ||
            save.notes.length !== 81
        ) {

            throw new Error(
                "FSJ: notes must contain 81 cells."
            );

        }


        // ====================================================
        // Validate difficulty
        // ====================================================

        if (
            !(save.difficulty in DIFFICULTIES)
        ) {

            throw new Error(
                "FSJ: invalid difficulty."
            );

        }


        const data = [];


        function field(shortcode, bytes) {

            data.push(shortcode);
            append(data, bytes);

        }


        // ====================================================
        // solution
        // ====================================================

        field(
            KEYS.solution,
            writeBits(
                save.solution,
                4
            )
        );


        // ====================================================
        // values
        // ====================================================

        field(
            KEYS.values,
            writeBits(
                save.values,
                4
            )
        );


        // ====================================================
        // givens
        // ====================================================

        const givenBits =
            save.givens.map(
                value => value ? 1 : 0
            );

        field(
            KEYS.givens,
            writeBits(
                givenBits,
                1
            )
        );


        // ====================================================
        // notes
        // ====================================================

        const noteBits = [];

        for (let cell = 0; cell < 81; cell++) {

            const notes =
                Array.isArray(save.notes[cell])
                    ? save.notes[cell]
                    : [];

            for (let note = 1; note <= 9; note++) {

                noteBits.push(
                    notes.includes(note) ? 1 : 0
                );

            }
        }

        field(
            KEYS.notes,
            writeBits(
                noteBits,
                1
            )
        );


        // ====================================================
        // selected
        // ====================================================

        const selected =
            Number(save.selected ?? 0);

        if (
            !Number.isInteger(selected) ||
            selected < 0 ||
            selected > 81
        ) {

            throw new Error(
                "FSJ: invalid selected cell."
            );

        }

        field(
            KEYS.selected,
            writeBits(
                [selected],
                7
            )
        );


        // ====================================================
        // difficulty
        // ====================================================

        field(
            KEYS.difficulty,
            writeBits(
                [
                    DIFFICULTIES[
                        save.difficulty
                    ]
                ],
                3
            )
        );


        // ====================================================
        // 1-bit booleans
        // ====================================================

        field(
            KEYS.pencilMode,
            writeBits(
                [save.pencilMode ? 1 : 0],
                1
            )
        );

        field(
            KEYS.eraseMode,
            writeBits(
                [save.eraseMode ? 1 : 0],
                1
            )
        );


        // ====================================================
        // mistakes
        // ====================================================

        field(
            KEYS.mistakes,
            uint64(
                Number(save.mistakes ?? 0)
            )
        );


        // ====================================================
        // elapsedMs
        // ====================================================

        field(
            KEYS.elapsedMs,
            uint128(
                Number(save.elapsedMs ?? 0)
            )
        );


        // ====================================================
        // timerPaused
        // ====================================================

        field(
            KEYS.timerPaused,
            writeBits(
                [save.timerPaused ? 1 : 0],
                1
            )
        );


        // ====================================================
        // finished
        // ====================================================

        field(
            KEYS.finished,
            writeBits(
                [save.finished ? 1 : 0],
                1
            )
        );


        // ====================================================
        // hintcount
        // ====================================================

        field(
            KEYS.hintcount,
            uint64(
                Number(save.hintcount ?? 0)
            )
        );


        // ====================================================
        // hintcounter
        // ====================================================

        field(
            KEYS.hintcounter,
            uint64(
                Number(save.hintcounter ?? 0)
            )
        );


        // ====================================================
        // cooldownmoves
        // ====================================================

        field(
            KEYS.cooldownmoves,
            uint64(
                Number(save.cooldownmoves ?? 0)
            )
        );


        // ====================================================
        // cooldowntime
        // ====================================================

        field(
            KEYS.cooldowntime,
            uint64(
                Number(save.cooldowntime ?? 0)
            )
        );


        // ====================================================
        // cooldowntypetouse
        // ====================================================

        if (
            save.cooldowntypetouse !== "time" &&
            save.cooldowntypetouse !== "moves"
        ) {

            throw new Error(
                "FSJ: invalid cooldowntypetouse."
            );

        }

        field(
            KEYS.cooldowntypetouse,
            writeBits(
                [
                    save.cooldowntypetouse === "moves"
                        ? 1
                        : 0
                ],
                1
            )
        );


        // ====================================================
        // canusehelp
        // ====================================================

        field(
            KEYS.canusehelp,
            writeBits(
                [save.canusehelp ? 1 : 0],
                1
            )
        );


        // ====================================================
        // undoRedoStack MUST BE LAST
        // ====================================================

        const encoder =
            new TextEncoder();

        const undoJSON =
            JSON.stringify(
                save.undoStack ?? []
            );

        const redoJSON =
            JSON.stringify(
                save.redoStack ?? []
            );


        data.push(
            KEYS.undoRedoStack
        );

        append(
            data,
            encoder.encode(undoJSON)
        );

        // Required NUL separator
        data.push(0x00);

        append(
            data,
            encoder.encode(redoJSON)
        );


        // ====================================================
        // CRC-32C
        // ====================================================

        const saveData =
            new Uint8Array(data);

        const crc =
            crc32c(saveData);


        // ====================================================
        // Build file
        // ====================================================

        const result = [];

        append(
            result,
            encoder.encode(HEADER)
        );

        // Mandatory NUL
        result.push(0x00);

        // CRC-32C, little endian
        result.push(
            crc & 0xFF,
            (crc >>> 8) & 0xFF,
            (crc >>> 16) & 0xFF,
            (crc >>> 24) & 0xFF
        );

        append(
            result,
            saveData
        );


        // ====================================================
        // DOWNLOAD
        // ====================================================

        const blob =
            new Blob(
                [new Uint8Array(result)],
                {
                    type:
                        "application/octet-stream"
                }
            );

        const url =
            URL.createObjectURL(blob);

        const a =
            document.createElement("a");

        a.href = url;

        a.download =
            "ceedoku-save.csf";

        document.body.appendChild(a);

        a.click();

        a.remove();

        URL.revokeObjectURL(url);

    }


    return FSJ;

})();
