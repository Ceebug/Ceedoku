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
    // Read bits from a byte array
    // ========================================================

    function readBit(bytes, bitIndex) {

        const byteIndex =
            Math.floor(bitIndex / 8);

        const bitIndexInByte =
            bitIndex % 8;

        if (byteIndex >= bytes.length) {

            throw new Error(
                "JSF: unexpected end of field."
            );

        }

        return (
            (bytes[byteIndex] >>
                bitIndexInByte) & 1
        );

    }


    function readValue(bytes, bitOffset, bitCount) {

        let value = 0;

        for (
            let i = 0;
            i < bitCount;
            i++
        ) {

            value |=
                readBit(
                    bytes,
                    bitOffset + i
                ) << i;

        }

        return value;
    }


    // ========================================================
    // Read exact bytes
    // ========================================================

    function take(data, offset, length) {

        if (
            offset + length >
            data.length
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
    // Read Sudoku board
    // 81 cells × 4 bits = 324 bits = 41 bytes
    // ========================================================

    function readBoard(bytes) {

        const board = [];

        for (
            let cell = 0;
            cell < 81;
            cell++
        ) {

            const value =
                readValue(
                    bytes,
                    cell * 4,
                    4
                );

            if (
                value > 9
            ) {

                throw new Error(
                    "JSF: invalid Sudoku cell value."
                );

            }

            board.push(value);

        }

        return board;

    }


    // ========================================================
    // Read givens
    // 81 bits = 11 bytes
    // ========================================================

    function readGivens(bytes) {

        const givens = [];

        for (
            let i = 0;
            i < 81;
            i++
        ) {

            givens.push(
                Boolean(
                    readBit(bytes, i)
                )
            );

        }

        return givens;

    }


    // ========================================================
    // Read notes
    // 81 × 9 = 729 bits = 92 bytes
    // ========================================================

    function readNotes(bytes) {

        const notes = [];

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

                const bitIndex =
                    cell * 9 + note;

                if (
                    readBit(
                        bytes,
                        bitIndex
                    )
                ) {

                    cellNotes.push(
                        note + 1
                    );

                }

            }

            notes.push(cellNotes);

        }

        return notes;

    }


    // ========================================================
    // Read unsigned 64-bit integer
    // ========================================================

    function readUint64(bytes) {

        let value = 0n;

        for (
            let i = 7;
            i >= 0;
            i--
        ) {

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
    // Read unsigned 128-bit integer
    // ========================================================

    function readUint128(bytes) {

        let value = 0n;

        for (
            let i = 15;
            i >= 0;
            i--
        ) {

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

        try {

            // =================================================
            // Validate input
            // =================================================

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


            // =================================================
            // Minimum file size
            // =================================================

            if (
                data.length < 6
            ) {

                throw new Error(
                    "JSF: file is too small to be a CSF file."
                );

            }


            // =================================================
            // Header
            // =================================================

            const encoder =
                new TextEncoder();

            const decoder =
                new TextDecoder(
                    "utf-8",
                    {
                        fatal: true
                    }
                );

            const headerBytes =
                encoder.encode(HEADER);

            let offset = 0;

            let hasHeader = true;

            if (
                data.length >=
                headerBytes.length
            ) {

                let matches = true;

                for (
                    let i = 0;
                    i < headerBytes.length;
                    i++
                ) {

                    if (
                        data[i] !==
                        headerBytes[i]
                    ) {

                        matches = false;
                        break;

                    }

                }

                if (matches) {

                    offset =
                        headerBytes.length;

                } else {

                    hasHeader = false;

                }

            } else {

                hasHeader = false;

            }


            // =================================================
            // Mandatory NUL separator
            // =================================================

            if (
                data[offset] !== 0x00
            ) {

                throw new Error(
                    "JSF: missing mandatory NUL separator."
                );

            }

            offset++;


            // =================================================
            // CRC-32C
            // =================================================

            if (
                offset + 4 >
                data.length
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


            // Everything after the CRC is covered.
            const saveData =
                data.slice(offset);


            const calculatedCRC =
                crc32c(saveData);


            if (
                storedCRC !==
                calculatedCRC
            ) {

                throw new Error(
                    "JSF: CRC-32C checksum mismatch."
                );

            }


            // =================================================
            // Save object
            // =================================================

            const save = {};

            let solution;
            let values;
            let givens;
            let notes;
            let selected;
            let difficulty;


            // =================================================
            // Parse fields
            // =================================================

            let dataOffset = 0;

            while (
                dataOffset <
                saveData.length
            ) {

                const shortcode =
                    saveData[dataOffset++];



                // =============================================
                // undoRedoStack
                // =============================================

                if (
                    shortcode ===
                    KEYS.undoRedoStack
                ) {

                    const stackStart =
                        dataOffset;

                    let separator = -1;


                    for (
                        let i = dataOffset;
                        i < saveData.length;
                        i++
                    ) {

                        if (
                            saveData[i] ===
                            0x00
                        ) {

                            separator = i;
                            break;

                        }

                    }


                    if (
                        separator === -1
                    ) {

                        throw new Error(
                            "JSF: missing undo/redo separator."
                        );

                    }


                    const undoBytes =
                        saveData.slice(
                            stackStart,
                            separator
                        );


                    const redoBytes =
                        saveData.slice(
                            separator + 1
                        );


                    let undoJSON;
                    let redoJSON;


                    try {

                        undoJSON =
                            decoder.decode(
                                undoBytes
                            );

                        redoJSON =
                            decoder.decode(
                                redoBytes
                            );

                    } catch {

                        throw new Error(
                            "JSF: invalid UTF-8 in undo/redo data."
                        );

                    }


                    try {

                        save.undoStack =
                            JSON.parse(
                                undoJSON
                            );

                        save.redoStack =
                            JSON.parse(
                                redoJSON
                            );

                    } catch {

                        throw new Error(
                            "JSF: invalid undo/redo JSON."
                        );

                    }


                    // It MUST be the final field.
                    dataOffset =
                        saveData.length;

                    break;

                }


                // =============================================
                // solution
                // =============================================

                if (
                    shortcode ===
                    KEYS.solution
                ) {

                    const bytes =
                        take(
                            saveData,
                            dataOffset,
                            41
                        );

                    dataOffset += 41;

                    solution =
                        readBoard(bytes);

                    continue;

                }


                // =============================================
                // values
                // =============================================

                if (
                    shortcode ===
                    KEYS.values
                ) {

                    const bytes =
                        take(
                            saveData,
                            dataOffset,
                            41
                        );

                    dataOffset += 41;

                    values =
                        readBoard(bytes);

                    continue;

                }


                // =============================================
                // givens
                // =============================================

                if (
                    shortcode ===
                    KEYS.givens
                ) {

                    const bytes =
                        take(
                            saveData,
                            dataOffset,
                            11
                        );

                    dataOffset += 11;

                    givens =
                        readGivens(bytes);

                    continue;

                }


                // =============================================
                // notes
                // =============================================

                if (
                    shortcode ===
                    KEYS.notes
                ) {

                    const bytes =
                        take(
                            saveData,
                            dataOffset,
                            92
                        );

                    dataOffset += 92;

                    notes =
                        readNotes(bytes);

                    continue;

                }


                // =============================================
                // selected
                // =============================================

                if (
                    shortcode ===
                    KEYS.selected
                ) {

                    const bytes =
                        take(
                            saveData,
                            dataOffset,
                            1
                        );

                    dataOffset++;

                    selected =
                        readValue(
                            bytes,
                            0,
                            7
                        );


                    if (
                        selected > 81
                    ) {

                        throw new Error(
                            "JSF: invalid selected cell."
                        );

                    }

                    continue;

                }


                // =============================================
                // difficulty
                // =============================================

                if (
                    shortcode ===
                    KEYS.difficulty
                ) {

                    const bytes =
                        take(
                            saveData,
                            dataOffset,
                            1
                        );

                    dataOffset++;

                    const value =
                        readValue(
                            bytes,
                            0,
                            3
                        );


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


                // =============================================
                // Boolean fields
                // =============================================

                if (
                    shortcode ===
                    KEYS.pencilMode ||
                    shortcode ===
                    KEYS.eraseMode ||
                    shortcode ===
                    KEYS.timerPaused ||
                    shortcode ===
                    KEYS.finished ||
                    shortcode ===
                    KEYS.canusehelp
                ) {

                    const bytes =
                        take(
                            saveData,
                            dataOffset,
                            1
                        );

                    dataOffset++;

                    const value =
                        Boolean(
                            readValue(
                                bytes,
                                0,
                                1
                            )
                        );


                    if (
                        shortcode ===
                        KEYS.pencilMode
                    ) {

                        save.pencilMode =
                            value;

                    }

                    else if (
                        shortcode ===
                        KEYS.eraseMode
                    ) {

                        save.eraseMode =
                            value;

                    }

                    else if (
                        shortcode ===
                        KEYS.timerPaused
                    ) {

                        save.timerPaused =
                            value;

                    }

                    else if (
                        shortcode ===
                        KEYS.finished
                    ) {

                        save.finished =
                            value;

                    }

                    else if (
                        shortcode ===
                        KEYS.canusehelp
                    ) {

                        save.canusehelp =
                            value;

                    }

                    continue;

                }


                // =============================================
                // 64-bit integers
                // =============================================

                if (
                    shortcode ===
                    KEYS.mistakes ||
                    shortcode ===
                    KEYS.hintcount ||
                    shortcode ===
                    KEYS.hintcounter ||
                    shortcode ===
                    KEYS.cooldownmoves ||
                    shortcode ===
                    KEYS.cooldowntime
                ) {

                    const bytes =
                        take(
                            saveData,
                            dataOffset,
                            8
                        );

                    dataOffset += 8;


                    const value =
                        readUint64(bytes);


                    if (
                        shortcode ===
                        KEYS.mistakes
                    ) {

                        save.mistakes =
                            value;

                    }

                    else if (
                        shortcode ===
                        KEYS.hintcount
                    ) {

                        save.hintcount =
                            value;

                    }

                    else if (
                        shortcode ===
                        KEYS.hintcounter
                    ) {

                        save.hintcounter =
                            value;

                    }

                    else if (
                        shortcode ===
                        KEYS.cooldownmoves
                    ) {

                        save.cooldownmoves =
                            value;

                    }

                    else if (
                        shortcode ===
                        KEYS.cooldowntime
                    ) {

                        save.cooldowntime =
                            value;

                    }

                    continue;

                }


                // =============================================
                // elapsedMs
                // =============================================

                if (
                    shortcode ===
                    KEYS.elapsedMs
                ) {

                    const bytes =
                        take(
                            saveData,
                            dataOffset,
                            16
                        );

                    dataOffset += 16;


                    save.elapsedMs =
                        readUint128(bytes);

                    continue;

                }


                // =============================================
                // cooldowntypetouse
                // =============================================

                if (
                    shortcode ===
                    KEYS.cooldowntypetouse
                ) {

                    const bytes =
                        take(
                            saveData,
                            dataOffset,
                            1
                        );

                    dataOffset++;


                    const value =
                        readValue(
                            bytes,
                            0,
                            1
                        );


                    if (
                        value === 0
                    ) {

                        save.cooldowntypetouse =
                            "time";

                    }

                    else if (
                        value === 1
                    ) {

                        save.cooldowntypetouse =
                            "moves";

                    }

                    else {

                        throw new Error(
                            "JSF: invalid cooldown type."
                        );

                    }

                    continue;

                }


                // =============================================
                // Unknown shortcode
                // =============================================

                throw new Error(
                    "JSF: unknown shortcode 0x" +
                    shortcode
                        .toString(16)
                        .padStart(2, "0")
                        .toUpperCase()
                );

            }


            // =================================================
            // Required fields
            // =================================================

            if (
                solution === undefined
            ) {

                throw new Error(
                    "JSF: missing solution."
                );

            }


            if (
                values === undefined
            ) {

                throw new Error(
                    "JSF: missing values."
                );

            }


            if (
                givens === undefined
            ) {

                throw new Error(
                    "JSF: missing givens."
                );

            }


            if (
                notes === undefined
            ) {

                throw new Error(
                    "JSF: missing notes."
                );

            }


            if (
                selected === undefined
            ) {

                throw new Error(
                    "JSF: missing selected."
                );

            }


            if (
                difficulty === undefined
            ) {

                throw new Error(
                    "JSF: missing difficulty."
                );

            }


            // =================================================
            // Build final object
            // =================================================

            const orderedSave = {

                solution:
                    solution,

                values:
                    values,

                givens:
                    givens,

                notes:
                    notes,

                selected:
                    selected,

                difficulty:
                    difficulty,

                pencilMode:
                    save.pencilMode ??
                    false,

                eraseMode:
                    save.eraseMode ??
                    false,

                mistakes:
                    save.mistakes ??
                    0,

                elapsedMs:
                    save.elapsedMs ??
                    0,

                timerPaused:
                    save.timerPaused ??
                    false,

                undoStack:
                    save.undoStack ??
                    [],

                redoStack:
                    save.redoStack ??
                    [],

                finished:
                    save.finished ??
                    false,

                hintcount:
                    save.hintcount ??
                    0,

                hintcounter:
                    save.hintcounter ??
                    0,

                cooldownmoves:
                    save.cooldownmoves ??
                    0,

                cooldowntime:
                    save.cooldowntime ??
                    0,

                cooldowntypetouse:
                    save.cooldowntypetouse ??
                    "time",

                canusehelp:
                    save.canusehelp ??
                    true

            };


            return JSON.stringify(
                orderedSave
            );


        } catch (error) {

            // ================================================
            // Public JSF errors
            // ================================================

            if (
                error.message ===
                "JSF: CRC-32C checksum mismatch."
            ) {

                throw new Error(
                    "Save File Corrupted"
                );

            }


            throw new Error(
                "Invalid .CSF File"
            );

        }

    }


    return JSF;

})();
