const JSF = (() => {

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

    const DIFFICULTIES = [
        "easy",
        "medium",
        "hard",
        "expert",
        "master",
        "extreme",
        "impossible",
        "godlike"
    ];


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
    // Read bits
    // ========================================================

    function readBits(bytes, bitCount) {

        const values = [];

        for (
            let start = 0;
            start < bitCount;
        ) {

            let value = 0;

            for (
                let bit = 0;
                bit < 8 && start < bitCount;
                bit++, start++
            ) {

                if (
                    bytes[
                        Math.floor(start / 8)
                    ] &
                    (1 << (start % 8))
                ) {

                    value |= 1 << bit;
                }
            }

            values.push(value);
        }

        return values;
    }


    // ========================================================
    // Read an exact number of bytes
    // ========================================================

    function take(data, offset, length) {

        if (
            offset + length > data.length
        ) {

            throw new Error(
                "JSF: unexpected end of file."
            );

        }

        return data.slice(
            offset,
            offset + length
        );
    }


    // ========================================================
    // Read 64-bit unsigned integer
    // ========================================================

    function readUint64(bytes) {

        let value = 0n;

        for (let i = 7; i >= 0; i--) {

            value =
                (value << 8n) |
                BigInt(bytes[i]);

        }

        if (
            value >
            BigInt(Number.MAX_SAFE_INTEGER)
        ) {

            throw new Error(
                "JSF: 64-bit value exceeds JavaScript safe integer range."
            );

        }

        return Number(value);
    }


    // ========================================================
    // Read 128-bit unsigned integer
    // ========================================================

    function readUint128(bytes) {

        let value = 0n;

        for (let i = 15; i >= 0; i--) {

            value =
                (value << 8n) |
                BigInt(bytes[i]);

        }

        if (
            value >
            BigInt(Number.MAX_SAFE_INTEGER)
        ) {

            throw new Error(
                "JSF: 128-bit value exceeds JavaScript safe integer range."
            );

        }

        return Number(value);
    }


    // ========================================================
    // Main parser
    // ========================================================

    async function JSF(file) {

        if (
            !(file instanceof Blob)
        ) {

            throw new TypeError(
                "JSF: expected a File or Blob."
            );

        }

        const data =
            new Uint8Array(
                await file.arrayBuffer()
            );


        // ====================================================
        // Minimum size
        // ====================================================

        if (data.length < 6) {

            throw new Error(
                "JSF: file is too small to be a CSF file."
            );

        }


        // ====================================================
        // Header
        // ====================================================

        const decoder =
            new TextDecoder();

        const headerLength =
            new TextEncoder()
                .encode(HEADER)
                .length;

        const possibleHeader =
            decoder.decode(
                data.slice(
                    0,
                    headerLength
                )
            );


        let offset = 0;

        if (
            possibleHeader === HEADER
        ) {

            offset =
                headerLength;

        }


        // ====================================================
        // Mandatory NUL separator
        // ====================================================

        if (data[offset] !== 0x00) {

            throw new Error(
                "JSF: missing mandatory NUL separator."
            );

        }

        offset++;


        // ====================================================
        // CRC
        // ====================================================

        if (
            offset + 4 > data.length
        ) {

            throw new Error(
                "JSF: missing CRC-32C checksum."
            );

        }

        const storedCRC =
            (
                data[offset] |
                (data[offset + 1] << 8) |
                (data[offset + 2] << 16) |
                (data[offset + 3] << 24)
            ) >>> 0;

        offset += 4;


        // Everything after the CRC is
        // covered by the checksum.

        const saveData =
            data.slice(offset);

        const calculatedCRC =
            crc32c(saveData);

        if (
            storedCRC !== calculatedCRC
        ) {

            throw new Error(
                "JSF: CRC-32C checksum mismatch."
            );

        }


        // ====================================================
        // Save object
        // ====================================================

        const save = {};

        let solution;
        let values;
        let givens;
        let notes;
        let selected;
        let difficulty;


        // ====================================================
        // Parse normal fields
        // ====================================================

        while (
            offset < data.length
        ) {

            const shortcode =
                data[offset++];


            // -----------------------------------------------
            // undoRedoStack MUST be final
            // -----------------------------------------------

            if (
                shortcode ===
                KEYS.undoRedoStack
            ) {

                const stackStart =
                    offset;

                let separator = -1;

                for (
                    let i = offset;
                    i < data.length;
                    i++
                ) {

                    if (data[i] === 0x00) {

                        separator = i;
                        break;

                    }

                }

                if (separator === -1) {

                    throw new Error(
                        "JSF: missing undo/redo separator."
                    );

                }


                const undoBytes =
                    data.slice(
                        stackStart,
                        separator
                    );

                const redoBytes =
                    data.slice(
                        separator + 1
                    );


                const undoJSON =
                    decoder.decode(
                        undoBytes
                    );

                const redoJSON =
                    decoder.decode(
                        redoBytes
                    );


                try {

                    save.undoStack =
                        JSON.parse(undoJSON);

                    save.redoStack =
                        JSON.parse(redoJSON);

                } catch {

                    throw new Error(
                        "JSF: invalid undo/redo JSON."
                    );

                }


                // undoRedoStack MUST be final.
                offset = data.length;

                break;
            }


            // -----------------------------------------------
            // solution
            // -----------------------------------------------

            if (
                shortcode === KEYS.solution
            ) {

                const length = 41;

                const bytes =
                    take(
                        saveData,
                        offset -
                        (data.length - saveData.length),
                        length
                    );

                offset += length;

                const bits =
                    readBits(
                        bytes,
                        324
                    );

                solution =
                    bits.slice(0, 81);

                continue;
            }


            // -----------------------------------------------
            // values
            // -----------------------------------------------

            if (
                shortcode === KEYS.values
            ) {

                const length = 41;

                const bytes =
                    take(
                        data,
                        offset,
                        length
                    );

                offset += length;

                const bits =
                    readBits(
                        bytes,
                        324
                    );

                values =
                    bits.slice(0, 81);

                continue;
            }


            // -----------------------------------------------
            // givens
            // -----------------------------------------------

            if (
                shortcode === KEYS.givens
            ) {

                const length = 11;

                const bytes =
                    take(
                        data,
                        offset,
                        length
                    );

                offset += length;

                givens =
                    readBits(
                        bytes,
                        81
                    ).map(
                        value => Boolean(value)
                    );

                continue;
            }


            // -----------------------------------------------
            // notes
            // -----------------------------------------------

            if (
                shortcode === KEYS.notes
            ) {

                const length = 92;

                const bytes =
                    take(
                        data,
                        offset,
                        length
                    );

                offset += length;

                const bits =
                    readBits(
                        bytes,
                        729
                    );

                notes = [];

                for (
                    let cell = 0;
                    cell < 81;
                    cell++
                ) {

                    const cellNotes = [];

                    for (
                        let note = 0;
                        note < 9;
                        note++
                    ) {

                        if (
                            bits[
                                cell * 9 + note
                            ]
                        ) {

                            cellNotes.push(
                                note + 1
                            );

                        }

                    }

                    notes.push(cellNotes);
                }

                continue;
            }


            // -----------------------------------------------
            // selected
            // -----------------------------------------------

            if (
                shortcode === KEYS.selected
            ) {

                const bytes =
                    take(
                        data,
                        offset,
                        1
                    );

                offset++;

                selected =
                    readBits(
                        bytes,
                        7
                    )[0];

                continue;
            }


            // -----------------------------------------------
            // difficulty
            // -----------------------------------------------

            if (
                shortcode === KEYS.difficulty
            ) {

                const bytes =
                    take(
                        data,
                        offset,
                        1
                    );

                offset++;

                const value =
                    readBits(
                        bytes,
                        3
                    )[0];

                if (
                    value >=
                    DIFFICULTIES.length
                ) {

                    throw new Error(
                        "JSF: invalid difficulty."
                    );

                }

                difficulty =
                    DIFFICULTIES[value];

                continue;
            }


            // -----------------------------------------------
            // 1-bit boolean fields
            // -----------------------------------------------

            if (
                shortcode === KEYS.pencilMode ||
                shortcode === KEYS.eraseMode ||
                shortcode === KEYS.timerPaused ||
                shortcode === KEYS.finished ||
                shortcode === KEYS.canusehelp
            ) {

                const bytes =
                    take(
                        data,
                        offset,
                        1
                    );

                offset++;

                const value =
                    Boolean(
                        readBits(
                            bytes,
                            1
                        )[0]
                    );


                if (
                    shortcode ===
                    KEYS.pencilMode
                ) {

                    save.pencilMode = value;

                } else if (
                    shortcode ===
                    KEYS.eraseMode
                ) {

                    save.eraseMode = value;

                } else if (
                    shortcode ===
                    KEYS.timerPaused
                ) {

                    save.timerPaused = value;

                } else if (
                    shortcode ===
                    KEYS.finished
                ) {

                    save.finished = value;

                } else if (
                    shortcode ===
                    KEYS.canusehelp
                ) {

                    save.canusehelp = value;

                }

                continue;
            }


            // -----------------------------------------------
            // 64-bit integers
            // -----------------------------------------------

            if (
                shortcode === KEYS.mistakes ||
                shortcode === KEYS.hintcount ||
                shortcode === KEYS.hintcounter ||
                shortcode === KEYS.cooldownmoves ||
                shortcode === KEYS.cooldowntime
            ) {

                const bytes =
                    take(
                        data,
                        offset,
                        8
                    );

                offset += 8;

                const value =
                    readUint64(bytes);


                if (
                    shortcode ===
                    KEYS.mistakes
                ) {

                    save.mistakes = value;

                } else if (
                    shortcode ===
                    KEYS.hintcount
                ) {

                    save.hintcount = value;

                } else if (
                    shortcode ===
                    KEYS.hintcounter
                ) {

                    save.hintcounter = value;

                } else if (
                    shortcode ===
                    KEYS.cooldownmoves
                ) {

                    save.cooldownmoves = value;

                } else if (
                    shortcode ===
                    KEYS.cooldowntime
                ) {

                    save.cooldowntime = value;

                }

                continue;
            }


            // -----------------------------------------------
            // elapsedMs
            // -----------------------------------------------

            if (
                shortcode === KEYS.elapsedMs
            ) {

                const bytes =
                    take(
                        data,
                        offset,
                        16
                    );

                offset += 16;

                save.elapsedMs =
                    readUint128(bytes);

                continue;
            }


            // -----------------------------------------------
            // cooldowntypetouse
            // -----------------------------------------------

            if (
                shortcode ===
                KEYS.cooldowntypetouse
            ) {

                const bytes =
                    take(
                        data,
                        offset,
                        1
                    );

                offset++;

                const value =
                    readBits(
                        bytes,
                        1
                    )[0];

                if (value === 0) {

                    save.cooldowntypetouse =
                        "time";

                } else if (value === 1) {

                    save.cooldowntypetouse =
                        "moves";

                } else {

                    throw new Error(
                        "JSF: invalid cooldown type."
                    );

                }

                continue;
            }


            // -----------------------------------------------
            // Unknown shortcode
            // -----------------------------------------------

            throw new Error(
                "JSF: unknown shortcode 0x" +
                shortcode
                    .toString(16)
                    .padStart(2, "0")
                    .toUpperCase()
            );
        }


        // ====================================================
        // Required fields
        // ====================================================

        if (!solution) {

            throw new Error(
                "JSF: missing solution."
            );

        }

        if (!values) {

            throw new Error(
                "JSF: missing values."
            );

        }

        if (!givens) {

            throw new Error(
                "JSF: missing givens."
            );

        }

        if (!notes) {

            throw new Error(
                "JSF: missing notes."
            );

        }

        if (selected === undefined) {

            throw new Error(
                "JSF: missing selected."
            );

        }

        if (!difficulty) {

            throw new Error(
                "JSF: missing difficulty."
            );

        }


        // ====================================================
        // Build final JSON
        // ====================================================

        save.solution = solution;
        save.values = values;
        save.givens = givens;
        save.notes = notes;
        save.selected = selected;
        save.difficulty = difficulty;


        // Keep output ordering similar to
        // the normal Ceedoku save object.

        const orderedSave = {

            solution: save.solution,
            values: save.values,
            givens: save.givens,
            notes: save.notes,
            selected: save.selected,
            difficulty: save.difficulty,
            pencilMode: save.pencilMode ?? false,
            eraseMode: save.eraseMode ?? false,
            mistakes: save.mistakes ?? 0,
            elapsedMs: save.elapsedMs ?? 0,
            timerPaused: save.timerPaused ?? false,
            undoStack: save.undoStack ?? [],
            redoStack: save.redoStack ?? [],
            finished: save.finished ?? false,
            hintcount: save.hintcount ?? 0,
            hintcounter: save.hintcounter ?? 0,
            cooldownmoves: save.cooldownmoves ?? 0,
            cooldowntime: save.cooldowntime ?? 0,
            cooldowntypetouse:
                save.cooldowntypetouse ?? "time",
            canusehelp:
                save.canusehelp ?? true

        };


        return JSON.stringify(
            orderedSave
        );

    }


    return JSF;

})();
