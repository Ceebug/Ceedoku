/*****************************************************************************
 * THE SCRIPT - IT FINALLY FUCKING WORKS!
 *
 * DO NOT:
 *  - Change anything in this script.
 *  - Refactor this script.
 *  - "Clean up" this script.
 *  - Touch this script.
 *
 * Reason:
 * It finally works.
 * Nobody knows why.
 * Let's keep it that way.
 * If it ain't broke, don't fix it. It WILL break.
 *****************************************************************************/
document.title = "Ceedoku - Loading"
class CeedokuSpinner extends HTMLElement {
	connectedCallback() {
		this.innerHTML = `
		<svg viewBox="0 0 66 66" height="65px" width="65px" class="spinner">
			<circle
				class="path"
				cx="33"
				cy="33"
				fill="none"
				r="30"
				stroke-linecap="round"
				stroke-width="6"
			></circle>
		</svg>`;
	}
}

customElements.define("ceedoku-spinner", CeedokuSpinner);
window.addEventListener("load", () => {
    const game = document.getElementById("aahtheentiregame");
    const loader = document.getElementById("loader");

    loader.classList.add("fade-out");
    setTimeout(() => {
        loader.style.visibility = "hidden";
    }, 500);

    game.style.visibility = "visible";
    requestAnimationFrame(() => {
        game.classList.add("loaded");
    });

    document.title = "Ceedoku"
});

const hintselectvaluetext = document.getElementById("hintselectvaluetext");
const hintselectvalue = document.getElementById("hintselectvalue");
const hintselectbox = document.getElementById("hintselectbox");
let hintDropdownOpenTimer;

hintselectvalue.addEventListener("click", () => {
    clearTimeout(hintDropdownOpenTimer);
    if (hintselectbox.classList.contains("open")) {
        hintselectbox.classList.remove("open");

        setTimeout(() => {
            hintselectvalue.classList.remove("opening");
        }, 500);
    } else {
        hintselectvalue.classList.add("opening");

        hintDropdownOpenTimer = setTimeout(() => {
            if (!hintselectvalue.disabled) hintselectbox.classList.add("open");
        }, 250);
    }
});
function showNotification(text, duration = 5000) {

    document.getElementById("notification-content").textContent = text;

    document.getElementById("notification").classList.add("show");

    setTimeout(() => {
        document.getElementById("notification").classList.remove("show");
		document.getElementById("notification-content").style.color = "var(--text2)";
    }, duration);
}
let saveManager;
let activeSaveId = null;
let pendingDeleteSaveId = null;
let pendingRenameSaveId = null;
let pendingExportSave = null;
let lastSaveError = "";
try {
    saveManager = CeedokuSaveManager.create(localStorage);
} catch (error) {
    console.error("Save storage is unavailable:", error);
    showNotification(`Save storage is unavailable: ${error.message}`);
}

function reportSaveError(error) {
    console.error("Save management failed:", error);
    const message = error?.message || String(error);
    if (message === lastSaveError) return;
    lastSaveError = message;
    showNotification(`Save error: ${message}`);
    document.getElementById("notification-content").style.color = "#f04c42";
}

function saveGameData() {
    return {
        solution,
        values,
        givens,
        notes: notes.map(set => [...set]),
        selected,
        difficulty,
        customDifficulty: difficulty === "custom" ? customDifficulty : null,
        pencilMode,
        eraseMode,
        mistakes,
        elapsedMs,
        timerPaused,
        undoStack,
        redoStack,
        finished,
        pageMode,
        hintcount,
        hintcounter,
        cooldownmoves,
        cooldowntime,
        cooldowntypetouse,
        canusehelp
    };
}

function syncLegacySave(record) {
    try {
        localStorage.setItem("save", record.data);
        lastSaveError = "";
        return true;
    } catch (error) {
        reportSaveError(error);
        return false;
    }
}

function importSaveData(data, filename = "Imported save") {
    if (!saveManager) {
        localStorage.setItem("save", data);
        loadgame(data);
        return;
    }

    try {
        const title = filename.replace(/\.csf$/i, "").trim() || "Imported save";
        const record = saveManager.add(data, title);
        activeSaveId = record.id;
        syncLegacySave(record);
        loadgame(record.data);
        hideimportexportgame();
        continueGame();
        renderSaveCards();
    } catch (error) {
        reportSaveError(error);
    }
}
if (window.electronAPI) {

    window.electronAPI.onCSFOpen(async (filePath) => {

        try {

            const response = await fetch(
                `file://${filePath.replace(/\\/g, "/")}`
            );

            const blob = await response.blob();

            const file = new File(
                [blob],
                filePath.split("\\").pop(),
                { type: "application/octet-stream" }
            );

            let tmp;

            try {

                tmp = await JSF(file);

            } catch (error) {

                showNotification(error.message);

                const notificationContent =
                    document.getElementById("notification-content");

                notificationContent.style.color = "#f04c42";


                return;
            }

            importSaveData(tmp, filePath.split("\\").pop());
            showNotification("Imported Save File");

        } catch (error) {

            console.error("Failed to open CSF:", error);

            const notificationContent =
                document.getElementById("notification-content");

            notificationContent.style.color = "#f04c42";

            showNotification(error.message);

        }

    });

}
const importSaveInput = document.createElement("input");

importSaveInput.type = "file";
importSaveInput.accept = ".csf";
importSaveInput.style.display = "none";

document.body.appendChild(importSaveInput);

importSaveInput.onchange = async () => {

    const file = importSaveInput.files[0];

    if (!file) return;

    const title =
        importexportOverlay.querySelector("h1");

    if (!file.name.toLowerCase().endsWith(".csf")) {

        title.textContent = "Not A .CSF File";
        title.style.color = "#f04c42";

        return;
    }

    let tmp;

    try {

        tmp = await JSF(file);

    } catch (error) {

        title.textContent = error.message;
        title.style.color = "#f04c42";
        return;
    }

    importSaveData(tmp, file.name);
    title.style.color = "var(--text2)";
    title.textContent = "Imported Save File";
	
    setTimeout(() => {

        title.textContent = "Import/Export Saves";
        title.style.color = "var(--text2)";

        hideimportexportgame();

    }, 2500);
};


let puzzleWorker = null;

if (typeof Worker !== "undefined") {
    try {
        const worker = new Worker("src/js/puzzleGen.js");

        const handleReady = (event) => {
            if (event.data?.type !== "ready") return;

            puzzleWorker = worker;
            worker.removeEventListener("message", handleReady);

            console.log("Puzzle worker loaded successfully.");
        };

        worker.addEventListener("message", handleReady);

        worker.onerror = () => {
            worker.terminate();
            puzzleWorker = null;

            console.warn("Puzzle worker failed to load.");
        };
    } catch {
        puzzleWorker = null;
    }
}
const printBtn = document.getElementById("print")
printBtn.style.display = "none";
function checkTime() {
    let besttimes = JSON.parse(localStorage.getItem("besttimes"));

    // Create besttimes if it doesn't exist
    if (!besttimes) {
        besttimes = {
            easy: null,
            medium: null,
            hard: null,
            expert: null,
            master: null,
            extreme: null,
            impossible: null,
            godlike: null
        };

        localStorage.setItem("besttimes", JSON.stringify(besttimes));
    }

    const oldTime = besttimes[difficulty];

    // No previous best time
    if (oldTime === null || oldTime === undefined) {
        document.getElementById("oldwintime").textContent = "**:**";
        updateBestTime(besttimes);
        return;
    }

    // Not a new best
    if (oldTime <= elapsedMs) {
        return;
    }

    // New best time
    document.getElementById("oldwintime").textContent = formatTime(Math.floor(oldTime / 1000));

    updateBestTime(besttimes);
}

function updateBestTime(besttimes) {
    document.getElementById("newwintime").textContent =
        formatTime(Math.floor(elapsedMs / 1000));

    besttimes[difficulty] = elapsedMs;

    localStorage.setItem("besttimes", JSON.stringify(besttimes));

    showBestTime();
}

function showBestTime() {
    document.querySelector(".besttime").style.display = "flex";
}

function hideBestTime() {
    document.querySelector(".besttime").style.display = "none";
}


let canusecurrenthintsystem = false
let usingsavegame = false;
let viewingCompletedSave = false;
let cooldownmoves = 0
let cooldowntime = 0
const count = 150,
    defaults = {
        origin: {
            y: .7
        }
    };

function fire(particleRatio, opts) {
    confetti(Object.assign({}, defaults, opts, {
        particleCount: Math.floor(count * particleRatio)
    }));
}

function fireconfetti() {
    fire(.25, {
        spread: 26,
        startVelocity: 55
    });
    fire(.2, {
        spread: 60
    });
    fire(.35, {
        spread: 100,
        decay: .91,
        scalar: .8
    });
    fire(.1, {
        spread: 120,
        startVelocity: 25,
        decay: .92,
        scalar: 1.2
    });
    fire(.1, {
        spread: 120,
        startVelocity: 45
    });
}
let settings = {
    SFX: {
        enabled: true,
        completion: true,
        win: true
    },

    VFX: {
        enabled: true,
        completion: true,
        confetti: true,
    },

    hints: {
        enabled: true,
        explanations: {
            enabled: true
        },
        cooldown: {
            enabled: false,
            startinghints: 3,
            cooldowntype: "time",
            cooldowntime: 30,
            hintsaftercooldown: 1,
        },
        hintlimit: {
            enabled: false,
            amount: 10,
        }
    },
	
	tools: {
		enabled: true,
		pencil: {
			enabled: true
		},
		erase: {
			enabled: true
		},
		history: {
			enabled: true
		}
	},
    haptics: {
        enabled: true,
        buttons: true,
        cells: true,
        puzzlecomplete: true
    }
};
function mergeSettings(target, source) {
    for (const key in source) {
        if (
            source[key] !== null &&
            typeof source[key] === "object" &&
            !Array.isArray(source[key])
        ) {
            if (
                target[key] === null ||
                typeof target[key] !== "object" ||
                Array.isArray(target[key])
            ) {
                target[key] = {};
            }

            mergeSettings(target[key], source[key]);
        } else {
            target[key] = source[key];
        }
    }
}
function loadSettings() {
    const saved = localStorage.getItem("settings");
    
    if (saved) {
        mergeSettings(settings, JSON.parse(saved));
    }
	if (settings.hints.cooldown.cooldowntype === "moves") {
        settings.hints.cooldown.cooldowntype = "move";
    }
	if (settings.hints.cooldown.cooldowntype === "move") {
		hintselectvaluetext.textContent = "Move-Based"
	} else {
		hintselectvaluetext.textContent = "Time-Based"
	}
}

function saveSettings() {
    localStorage.setItem("settings", JSON.stringify(settings));
}
let disableprint = true
loadSettings();
let hintcount = settings.hints.cooldown.startinghints
const winSound = new Audio("./src/sounds/win.ogg");
const popSound = new Audio("./src/sounds/pop.ogg");
popSound.preload = "auto";
popSound.load();
winSound.preload = "auto";
winSound.load();
const audioContext = new AudioContext();
const popSource = audioContext.createMediaElementSource(popSound);
const popGain = audioContext.createGain();

popSource.connect(popGain);
popGain.connect(audioContext.destination);
let audioUnlocked = false;

function unlockAudio() {
    if (audioUnlocked) return;

    popSound.muted = true;

    popSound.play()
        .then(() => {
            popSound.pause();
            popSound.currentTime = 0;
            popSound.muted = false;
            audioUnlocked = true;
        })
        .catch(() => {
            popSound.muted = false;
        });
}

function isTouchDevice() {
    return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}
document.addEventListener("pointerdown", unlockAudio, {
    once: true
});
let vibrate;
if ("vibrate" in navigator) {
    vibrate = function(duration = 10) {
        if (typeof isTouchDevice !== "function" || !isTouchDevice()) return;
        if (!settings.haptics.enabled) return;

        navigator.vibrate(duration);
    };
} else {
    vibrate = function() {};
}

let pitchInterval = null;
let popPlaybackId = 0;

function playPop(speed = 1) {
    if (!settings.SFX.enabled) return;

    if (pitchInterval) {
        clearInterval(pitchInterval);
        pitchInterval = null;
    }

    const playbackId = ++popPlaybackId;

    popSound.pause();
    popSound.currentTime = 0;

    popSound.preservesPitch = false;
    popSound.mozPreservesPitch = false;
    popSound.webkitPreservesPitch = false;

    let currentSpeed = Math.min(speed, 7);
    popSound.playbackRate = currentSpeed;

    const stopPitchInterval = () => {
        if (playbackId !== popPlaybackId) return;

        if (pitchInterval) {
            clearInterval(pitchInterval);
            pitchInterval = null;
        }

        popSound.playbackRate = 1;
    };

    popSound.onended = stopPitchInterval;

    try {
        const playback = popSound.play();

        if (playback && typeof playback.catch === "function") {
            playback.catch(error => {
                stopPitchInterval();
                console.log("pop failed -", error);
            });
        }
    } catch (error) {
        stopPitchInterval();
        console.log("pop failed -", error);
        return;
    }

    pitchInterval = setInterval(() => {
        if (playbackId !== popPlaybackId) return;

        currentSpeed = Math.min(currentSpeed + 0.1, 7);
        popSound.playbackRate = currentSpeed;
    }, 50);
}
document.addEventListener("pointerdown", (event) => {
    const button = event.target.closest("button");

    if (!button) return;

    const isCell = button.classList.contains("cell");

    if (isCell ? settings.haptics.cells : settings.haptics.buttons) {
        vibrate(isCell ? 5 : 10);
    }
});
let selectedDifficulty = localStorage.getItem("difficulty") || "easy";
document.getElementById("mainmenubutton").style.display = "none"
const mainmenu = document.getElementById("mainmenu");
let runninggame = false
let menuOpen = false;
let cooldowntypetouse = "just declaring var"

function showmainmenu() {
    printBtn.style.display = "none";
	disableprint = true
    viewingCompletedSave = false;
    completedSaveBack.style.display = "none";
    hideBestTime();
    pauseBtn2.style.display = "none"
    if (!timerPaused) {
        timerPaused = true;

        clearInterval(timerId);

        elapsedMs = Date.now() - startTime;

        if (runninggame) {
            if (cooldowntypetouse !== settings.hints.cooldown.cooldowntype) {
                canusecurrenthintsystem = false
            }
            saveGame();
        };
    }
    mainmenu.inert = false
    document.getElementById("mainmenubutton").style.display = "none"
    mainmenu.hidden = false;
    requestAnimationFrame(() => {
        mainmenu.classList.add("show");
    });
}
window.addEventListener('keydown', function(event) {
    if (event.key === 'Tab') {
        event.preventDefault();
    }
});

const DIFFICULTIES = {
    easy: {
        holes: 36
    },
    medium: {
        holes: 39
    },
    hard: {
        holes: 42
    },
    expert: {
        holes: 45
    },
    master: {
        holes: 48
    },
    extreme: {
        holes: 51
    },
    impossible: {
        holes: 54
    },
    godlike: {
        holes: 54
    }
};
const hintcooldowndisplay = document.getElementById("hintCooldownDisplay")

const boardEl = document.getElementById("board");

const winOverlay = document.getElementById("winOverlay");
const winDifficulty = document.getElementById("winDifficulty");
const winTime = document.getElementById("winTime");
const winMistakes = document.getElementById("winMistakes");
const winNewGameButton = document.getElementById("winNewGameButton");
const winDifficultyToggle = document.getElementById("winDifficultyToggle");
const winDifficultyMenu = document.getElementById("windifficultyMenu");
const winnewGameBand = document.getElementById("winnewgameband");
const winToast = document.getElementById("winToast");

const pauseOverlay = document.getElementById("pauseOverlay");
const pauseDifficulty = document.getElementById("pauseDifficulty");
const pauseTime = document.getElementById("pauseTime");
const pauseMistakes = document.getElementById("pauseMistakes");
const paueNewGameButton = document.getElementById("pauseNewGameButton")
const pauseDifficultyToggle = document.getElementById("pauseDifficultyToggle");
const pauseDifficultyMenu = document.getElementById("pausedifficultyMenu");
const pausenewGameBand = document.getElementById("pausenewgameband");

const mainDifficultyMenu = document.getElementById("maindifficultyMenu");
const mainDifficultyToggle = document.getElementById("mainDifficultyToggle");


const continueDifficulty = document.getElementById("continueDifficulty");
const continueTime = document.getElementById("continueTime");
const continueMistakes = document.getElementById("continueMistakes");
const continueOverlay = document.getElementById("continueOverlay");

const difficultyBadge = document.getElementById("difficultyBadge");
const difficultyMenu = document.getElementById("difficultyMenu");
const difficultyToggle = document.getElementById("difficultyToggle");
const newGameButton = document.getElementById("newGameButton");
const newGameBand = document.getElementById("newGameBand");

const undoButton = document.getElementById("undoButton");
const redoButton = document.getElementById("redoButton");
const hintButton = document.getElementById("hintButton");
const hintExplanationPanel = document.getElementById("hintExplanationPanel");
const hintTechnique = document.getElementById("hintTechnique");
const hintRecommendation = document.getElementById("hintRecommendation");
const hintExplanationSteps = document.getElementById("hintExplanationSteps");
const hintConnector = document.getElementById("hintConnector");
const hintConnectorPath = document.getElementById("hintConnectorPath");
const hintConnectorTarget = document.getElementById("hintConnectorTarget");
document.body.append(hintConnector, hintExplanationPanel);
let pendingHintMove = null;
const eraseButton = document.getElementById("eraseButton");
const pencilButton = document.getElementById("pencilButton");

const pauseBtn2 = document.getElementById("pause-btn2");
const completedSaveBack = document.getElementById("completedSaveBack");
const modeButton = document.getElementById("mode");
const fullscreenButton = document.getElementById("fullscreen")

const mistakeStatus = document.getElementById("mistakeStatus");
const emptyStatus = document.getElementById("emptyStatus");
const timerEl = document.getElementById("timer");
const title = document.getElementById("title");
const numberGrid = document.getElementById("numberGrid");

const deleteOverlay = document.getElementById("deleteOverlay")
const newoverlay = document.getElementById("newOverlay")
const customDifficultyOverlay = document.getElementById("customDifficultyOverlay")
const customHolesInput = document.getElementById("customHolesInput")
const customHolesValue = document.getElementById("customHolesValue")
const customToolsToggle = document.getElementById("customToolsToggle")
const playOverlay = document.getElementById("playOverlay")
const renameSaveOverlay = document.getElementById("renameSaveOverlay")
const saveRenameInput = document.getElementById("saveRenameInput")
const settingsOverlay = document.getElementById("settingsOverlay")
const importexportOverlay = document.getElementById("importexportOverlay")
document.body.append(playOverlay, renameSaveOverlay);

const animationToggle = document.getElementById("animationtoggle");
const completionAnimationToggle = document.getElementById("completionanimationtoggle");
const confettiAnimationToggle = document.getElementById("confettianimationtoggle");

const sfxToggle = document.getElementById("sfxtoggle");
const winSoundToggle = document.getElementById("winsoundtoggle");
const completionSoundToggle = document.getElementById("completionsoundtoggle");

const hapticsToggle = document.getElementById("hapticstoggle");
const buttonHapticsToggle = document.getElementById("buttonhapticstoggle");
const cellHapticsToggle = document.getElementById("cellhapticstoggle");
const winHapticsToggle = document.getElementById("winhapticstoggle");

const hintsToggle = document.getElementById("hintstoggle");
const hintExplanationToggle = document.getElementById("hintExplanationToggle");
const hintCooldownToggle = document.getElementById("hintcooldowntoggle");
const startingHintsInput = document.getElementById("startinghints");
const hintCooldownMethod = document.getElementById("hintcooldownmethod");
const hintCooldownAmount = document.getElementById("hintcooldownamount");
const hintsaftercooldown = document.getElementById("hintsaftercooldown");

const hintlimit = document.getElementById("hintlimit");
const hintlimitinput = document.getElementById("hintlimitinput");

const pencilToggle = document.getElementById("penciltoggle");
const eraseToggle = document.getElementById("erasetoggle");
const toolsToggle = document.getElementById("toolstoggle");
const historyToggle = document.getElementById("historytoggle");

function updatePauseBtn2() {
    pauseBtn2.style.display = viewingCompletedSave
        ? "none"
        : window.matchMedia("(orientation: portrait)").matches
            ? "unset"
            : "none";
}

function updateSettingsMenu() {
    animationToggle.checked = settings.VFX.enabled;
    completionAnimationToggle.checked = settings.VFX.completion;
    confettiAnimationToggle.checked = settings.VFX.confetti;

    completionAnimationToggle.disabled = !settings.VFX.enabled;
    confettiAnimationToggle.disabled = !settings.VFX.enabled;

    sfxToggle.checked = settings.SFX.enabled;
    winSoundToggle.checked = settings.SFX.win;
    completionSoundToggle.checked = settings.SFX.completion;

    winSoundToggle.disabled = !settings.SFX.enabled;
    completionSoundToggle.disabled = !settings.SFX.enabled;


    hapticsToggle.checked = settings.haptics.enabled;
    buttonHapticsToggle.checked = settings.haptics.buttons;
    cellHapticsToggle.checked = settings.haptics.cells;
    winHapticsToggle.checked = settings.haptics.puzzlecomplete;
    buttonHapticsToggle.disabled = !settings.haptics.enabled;
    hintsToggle.checked = settings.hints.enabled;
    hintExplanationToggle.checked = settings.hints.explanations.enabled;
	hintsToggle.disabled = !settings.tools.enabled
    hintExplanationToggle.disabled = !settings.hints.enabled;
	
	toolsToggle.checked = settings.tools.enabled;

	pencilToggle.checked = settings.tools.pencil.enabled;
	eraseToggle.checked = settings.tools.erase.enabled;
	historyToggle.checked = settings.tools.history.enabled;

	pencilToggle.disabled = !settings.tools.enabled;
	eraseToggle.disabled = !settings.tools.enabled;
	historyToggle.disabled = !settings.tools.enabled;

    hintCooldownToggle.checked = settings.hints.cooldown.enabled;
    startingHintsInput.value = settings.hints.cooldown.startinghints;
    hintCooldownMethod.value = settings.hints.cooldown.cooldowntype;
    hintCooldownAmount.value = settings.hints.cooldown.cooldowntime;
    hintsaftercooldown.value = settings.hints.cooldown.hintsaftercooldown;
	if (settings.hints.cooldown.cooldowntype === "move") {
		hintselectvaluetext.textContent = "Move-Based"
	} else {
		hintselectvaluetext.textContent = "Time-Based"
	}
	
    hintlimit.checked = settings.hints.hintlimit.enabled
    hintlimitinput.value = settings.hints.hintlimit.amount

    
    hintlimit.disabled = !settings.hints.enabled
    hintlimitinput.disabled = !settings.hints.hintlimit.enabled
    cellHapticsToggle.disabled = !settings.haptics.enabled;
    winHapticsToggle.disabled = !settings.haptics.enabled;
    hintCooldownToggle.disabled = !settings.hints.enabled;
    startingHintsInput.disabled = !settings.hints.enabled || !settings.hints.cooldown.enabled;
    hintCooldownMethod.disabled = !settings.hints.enabled || !settings.hints.cooldown.enabled;
	hintselectvalue.disabled = !settings.hints.enabled || !settings.hints.cooldown.enabled;
    hintCooldownAmount.disabled = !settings.hints.enabled || !settings.hints.cooldown.enabled;
    hintsaftercooldown.disabled = !settings.hints.enabled || !settings.hints.cooldown.enabled;
    hintselectvalue.classList.toggle("disabled", hintselectvalue.disabled);
    if (hintselectvalue.disabled) {
        clearTimeout(hintDropdownOpenTimer);
        hintselectbox.classList.remove("open");
        hintselectvalue.classList.remove("opening");
    }
}
updateSettingsMenu();

animationToggle.addEventListener("change", () => {
    settings.VFX.enabled = animationToggle.checked;

    if (!settings.VFX.enabled) {
        settings.VFX.completion = false;
        settings.VFX.confetti = false;
    }

    saveSettings();
    updateSettingsMenu();
});
completionAnimationToggle.addEventListener("change", () => {
    settings.VFX.completion = completionAnimationToggle.checked;
    saveSettings();
    updateSettingsMenu();
});
confettiAnimationToggle.addEventListener("change", () => {
    settings.VFX.confetti = confettiAnimationToggle.checked;
    saveSettings();
    updateSettingsMenu();
});
sfxToggle.addEventListener("change", () => {
    settings.SFX.enabled = sfxToggle.checked;

    if (!settings.SFX.enabled) {
        settings.SFX.completion = false;
        settings.SFX.win = false;
    }

    saveSettings();
    updateSettingsMenu();
});
winSoundToggle.addEventListener("change", () => {
    settings.SFX.win = winSoundToggle.checked;
    saveSettings();
    updateSettingsMenu();
});
completionSoundToggle.addEventListener("change", () => {
    settings.SFX.completion = completionSoundToggle.checked;
    saveSettings();
    updateSettingsMenu();
});
hapticsToggle.addEventListener("change", () => {
    settings.haptics.enabled = hapticsToggle.checked;

    if (!settings.haptics.enabled) {
        settings.haptics.cells = false;
        settings.haptics.buttons = false;
        settings.haptics.puzzlecomplete = false;
    }

    saveSettings();
    updateSettingsMenu();
});
buttonHapticsToggle.addEventListener("change", () => {
    settings.haptics.buttons = buttonHapticsToggle.checked;
    saveSettings();
    updateSettingsMenu();
});
cellHapticsToggle.addEventListener("change", () => {
    settings.haptics.cells = cellHapticsToggle.checked;
    saveSettings();
    updateSettingsMenu();
});
winHapticsToggle.addEventListener("change", () => {
    settings.haptics.puzzlecomplete = winHapticsToggle.checked;
    saveSettings();
    updateSettingsMenu();
});
hintsToggle.addEventListener("change", () => {
    settings.hints.enabled = hintsToggle.checked;
    testHintButton();

    if (!settings.hints.enabled) {
        settings.hints.cooldown.enabled = false;
        settings.hints.hintlimit.enabled = false;
    }

    saveSettings();
    updateSettingsMenu();
});
hintExplanationToggle.addEventListener("change", () => {
    settings.hints.explanations.enabled = hintExplanationToggle.checked;
    if (!settings.hints.explanations.enabled) closeHintExplanation();
    saveSettings();
    updateSettingsMenu();
});
toolsToggle.addEventListener("change", () => {
    settings.tools.enabled = toolsToggle.checked;
    testHintButton();
	
    if (!settings.tools.enabled) {
		settings.hints.hintlimit.enabled = false;
		settings.hints.cooldown.enabled = false
        settings.hints.enabled = false;
        settings.tools.pencil.enabled = false;
        settings.tools.erase.enabled = false;
		settings.tools.history.enabled = false;
    }

    saveSettings();
    updateSettingsMenu();
});
hintCooldownToggle.addEventListener("change", () => {
    settings.hints.cooldown.enabled = hintCooldownToggle.checked;
    saveSettings();
    updateSettingsMenu();
});
startingHintsInput.addEventListener("change", () => {
    settings.hints.cooldown.startinghints =
        startingHintsInput.value === "" ? 3 : Number(startingHintsInput.value);
    saveSettings();
    updateSettingsMenu()
});
hintCooldownMethod.addEventListener("change", () => {
    settings.hints.cooldown.cooldowntype = hintCooldownMethod.value
    saveSettings();
    updateSettingsMenu()
});
hintCooldownAmount.addEventListener("change", () => {
    settings.hints.cooldown.cooldowntime = Number(hintCooldownAmount.value) || 30;
    saveSettings();
    updateSettingsMenu()
});
hintsaftercooldown.addEventListener("change", () => {
    settings.hints.cooldown.hintsaftercooldown = Number(hintsaftercooldown.value) || 1;
    saveSettings();
    updateSettingsMenu()
});
hintlimit.addEventListener("change", () => {
    settings.hints.hintlimit.enabled = hintlimit.checked
    saveSettings();
    updateSettingsMenu()
});
hintlimitinput.addEventListener("change", () => {
    settings.hints.hintlimit.limit = Number(hintlimitinput.value) || 1;
    saveSettings();
    updateSettingsMenu()
});
pencilToggle.addEventListener("change", () => {
    settings.tools.pencil.enabled = pencilToggle.checked;
    saveSettings();
    updateSettingsMenu();
});

eraseToggle.addEventListener("change", () => {
    settings.tools.erase.enabled = eraseToggle.checked;
    saveSettings();
    updateSettingsMenu();
});

historyToggle.addEventListener("change", () => {
    settings.tools.history.enabled = historyToggle.checked;
    saveSettings();
    updateSettingsMenu();
});
settings.hints.hintlimit.limit = Number(hintlimitinput.value) || 1;
let hintlimitreached = false
let hintcounter = 0
let solution = [];
let puzzle = [];
let values = [];
let givens = [];
let notes = [];
let selected = 40;
let difficulty = "easy";
let customDifficulty = null;
let pencilMode = false;
let eraseMode = false;
let mistakes = 0;
let elapsed = 0;
let undoStack = [];
let redoStack = [];
let finished = false;

function getDifficultyLabel(key = difficulty, custom = customDifficulty) {
    if (key === "custom" && custom) {
        return `Custom · ${custom.holes} ${custom.holes === 1 ? "hole" : "holes"}`;
    }
    return key.charAt(0).toUpperCase() + key.slice(1);
}

let winmenuOpen = false;
let pausemenuOpen = false;
let pageMode = localStorage.getItem("theme") || "dark";


function opensettingsmenu() {
    document.getElementById("settingsOverlay").classList.add("show");
}

function closesettingsmenu() {
    document.getElementById("settingsOverlay").classList.remove("show");
}

const isAndroidPWA =
    /Android/i.test(navigator.userAgent) &&
    (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.matchMedia("(display-mode: minimal-ui)").matches
    );

if (isAndroidPWA && fullscreenButton) {
    fullscreenButton.style.display = "none";
}

function fullscreen() {
    if (!fullscreenButton) return;

    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen();
    }
}

document.addEventListener("fullscreenchange", () => {
    if (!fullscreenButton) return;

    fullscreenButton.innerHTML = document.fullscreenElement
        ? '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7L9 12L4 17"/><path d="M20 7L15 12L20 17"/></svg>'
        : '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 5L2 12L8 19"></path><path d="M16 5L22 12L16 19"></path></svg>';
});

function showcontinueGame() {
    if (nosave) return
    continueDifficulty.textContent = getDifficultyLabel();


    continueMistakes.textContent = mistakes;
    continueOverlay.hidden = false;

    requestAnimationFrame(() => {
        continueOverlay.classList.add("show");
    });
}

function showPlayMenu() {
    renderSaveCards();
    playOverlay.hidden = false;
    requestAnimationFrame(() => playOverlay.classList.add("show"));
}

function hidePlayMenu() {
    playOverlay.classList.remove("show");
    setTimeout(() => {
        if (!playOverlay.classList.contains("show")) playOverlay.hidden = true;
    }, 300);
}

function showRenameSave(id, title) {
    pendingRenameSaveId = id;
    saveRenameInput.value = title || "";
    renameSaveOverlay.hidden = false;
    requestAnimationFrame(() => {
        renameSaveOverlay.classList.add("show");
        saveRenameInput.focus();
        saveRenameInput.select();
    });
}

function hideRenameSave() {
    renameSaveOverlay.classList.remove("show");
    setTimeout(() => {
        if (!renameSaveOverlay.classList.contains("show")) renameSaveOverlay.hidden = true;
    }, 300);
    pendingRenameSaveId = null;
}

function saveRenameGame() {
    if (!pendingRenameSaveId) return;
    try {
        saveManager.rename(pendingRenameSaveId, saveRenameInput.value);
        hideRenameSave();
        renderSaveCards();
    } catch (error) {
        reportSaveError(error);
    }
}

document.getElementById("saveRenameConfirm").addEventListener("click", saveRenameGame);
document.getElementById("saveRenameCancel").addEventListener("click", hideRenameSave);
saveRenameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") saveRenameGame();
    if (event.key === "Escape") hideRenameSave();
});

function makeSaveAction(label, icon, className = "save-action-button") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.title = label;
    button.setAttribute("aria-label", label);
    button.innerHTML = icon;
    return button;
}

let openSaveMoreMenu = null;
let openSaveMoreWrap = null;

function closeSaveMoreMenu() {
    if (!openSaveMoreMenu) return;
    openSaveMoreMenu.hidden = true;
    openSaveMoreMenu.style.removeProperty("left");
    openSaveMoreMenu.style.removeProperty("top");
    if (openSaveMoreWrap) openSaveMoreWrap.appendChild(openSaveMoreMenu);
    openSaveMoreMenu = null;
    openSaveMoreWrap = null;
}

let activeSaveCardDrag = null;

function moveSaveCardPlaceholder(clientY) {
    const { card, list, placeholder } = activeSaveCardDrag;
    const target = Array.from(list.querySelectorAll(".save-card:not(.dragging):not(.save-card-placeholder)"))
        .find(item => clientY < item.getBoundingClientRect().top + item.getBoundingClientRect().height / 2);
    if (target) {
        list.insertBefore(placeholder, target);
    } else {
        list.appendChild(placeholder);
    }
}

function reorderSaveTo(saveId, targetIndex) {
    if (typeof saveManager.reorderTo === "function") {
        return saveManager.reorderTo(saveId, targetIndex);
    }

    let saves = saveManager.list();
    let currentIndex = saves.findIndex(save => save.id === saveId);
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= saves.length) return false;

    while (currentIndex !== targetIndex) {
        const direction = currentIndex < targetIndex ? 1 : -1;
        if (!saveManager.reorder(saveId, direction)) return false;
        currentIndex += direction;
        saves = saveManager.list();
    }
    return true;
}

function finishSaveCardDrag(cancelled = false) {
    if (!activeSaveCardDrag) return;
    const drag = activeSaveCardDrag;
    activeSaveCardDrag = null;

    drag.card.classList.remove("dragging");
    drag.card.style.removeProperty("position");
    drag.card.style.removeProperty("left");
    drag.card.style.removeProperty("top");
    drag.card.style.removeProperty("width");
    drag.card.style.removeProperty("z-index");
    drag.card.style.removeProperty("pointer-events");

    if (cancelled) {
        const cards = Array.from(drag.list.querySelectorAll(".save-card:not(.dragging):not(.save-card-placeholder)"));
        drag.list.insertBefore(drag.placeholder, cards[drag.originalIndex] || null);
    }
    drag.placeholder.replaceWith(drag.card);

    if (drag.captureTarget.hasPointerCapture(drag.pointerId)) {
        drag.captureTarget.releasePointerCapture(drag.pointerId);
    }
    if (cancelled || !drag.moved) return;

    const targetIndex = Array.from(drag.list.querySelectorAll(".save-card:not(.save-card-placeholder)"))
        .indexOf(drag.card);
    if (targetIndex === drag.originalIndex) return;
    try {
        reorderSaveTo(drag.saveId, targetIndex);
        renderSaveCards();
    } catch (error) {
        reportSaveError(error);
        renderSaveCards();
    }
}

document.addEventListener("pointermove", event => {
    if (!activeSaveCardDrag || event.pointerId !== activeSaveCardDrag.pointerId) return;
    const drag = activeSaveCardDrag;
    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;
    drag.moved = true;
    drag.card.classList.add("dragging");
    drag.card.style.left = `${event.clientX - drag.offsetX}px`;
    drag.card.style.top = `${event.clientY - drag.offsetY}px`;

    const listRect = drag.list.getBoundingClientRect();
    if (event.clientY < listRect.top + 28) drag.list.scrollTop -= 12;
    else if (event.clientY > listRect.bottom - 28) drag.list.scrollTop += 12;
    moveSaveCardPlaceholder(event.clientY);
});

document.addEventListener("pointerup", event => {
    if (activeSaveCardDrag && event.pointerId === activeSaveCardDrag.pointerId) {
        finishSaveCardDrag();
    }
});

document.addEventListener("pointercancel", event => {
    if (activeSaveCardDrag && event.pointerId === activeSaveCardDrag.pointerId) {
        finishSaveCardDrag(true);
    }
});

document.addEventListener("pointerdown", event => {
    if (
        openSaveMoreMenu &&
        !openSaveMoreMenu.contains(event.target) &&
        !openSaveMoreWrap?.contains(event.target)
    ) {
        closeSaveMoreMenu();
    }
});

function renderSaveCards() {
    closeSaveMoreMenu();
    const list = document.getElementById("saveCardList");
    const emptyMessage = document.getElementById("emptySaveMessage");
    list.replaceChildren();

    let saves = [];
    try {
        saves = saveManager ? saveManager.list() : [];
        if (!saveManager) {
            const legacy = localStorage.getItem("save");
            if (legacy && CeedokuSaveManager.parseGame(legacy)) {
                saves = [{
                    id: "legacy",
                    title: "My Save",
                    progress: CeedokuSaveManager.progressFor(legacy),
                    lastPlayed: Date.now(),
                    data: legacy
                }];
            }
        }
    } catch (error) {
        reportSaveError(error);
    }

    emptyMessage.hidden = saves.length !== 0;
    for (const [saveIndex, save] of saves.entries()) {
        const card = document.createElement("article");
        card.className = "save-card";
        card.setAttribute("aria-label", `Saved game: ${save.title || "Sudoku game"}. Drag anywhere on the card to reorder.`);
        card.addEventListener("pointerdown", event => {
            if (
                event.button !== 0 ||
                activeSaveCardDrag ||
                !saveManager ||
                event.target.closest("button, a, input, select, textarea, [contenteditable='true']")
            ) return;
            event.preventDefault();
            const rect = card.getBoundingClientRect();
            const placeholder = document.createElement("div");
            placeholder.className = "save-card-placeholder";
            placeholder.setAttribute("aria-hidden", "true");
            placeholder.style.height = `${rect.height}px`;
            card.before(placeholder);
            activeSaveCardDrag = {
                card,
                captureTarget: card,
                list,
                placeholder,
                saveId: save.id,
                originalIndex: saveIndex,
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                offsetX: event.clientX - rect.left,
                offsetY: event.clientY - rect.top,
                moved: false
            };
            card.style.position = "fixed";
            card.style.left = `${rect.left}px`;
            card.style.top = `${rect.top}px`;
            card.style.width = `${rect.width}px`;
            card.style.zIndex = "5010";
            card.style.pointerEvents = "none";
            card.setPointerCapture(event.pointerId);
        });
        const info = document.createElement("div");
        info.className = "save-card-info";
        const titleRow = document.createElement("div");
        titleRow.className = "save-card-title-row";
        const title = document.createElement("h2");
        title.className = "save-card-title";
        title.textContent = save.title || "Sudoku game";
        titleRow.appendChild(title);
        const game = CeedokuSaveManager.parseGame(save.data);
        if (game) {
            game.difficulty = DIFFICULTIES[game.difficulty] || game.difficulty === "custom"
                ? game.difficulty
                : "easy";
            const chip = document.createElement("span");
            chip.className = `save-difficulty-chip difficulty-${game.difficulty}`;
            chip.textContent = game.difficulty === "custom" && game.customDifficulty
                ? `Custom · ${game.customDifficulty.holes} ${game.customDifficulty.holes === 1 ? "hole" : "holes"}`
                : getDifficultyLabel(game.difficulty, game.customDifficulty);
            titleRow.appendChild(chip);
        }
        info.appendChild(titleRow);

        const meta = document.createElement("div");
        meta.className = "save-card-meta";
        const ring = document.createElement("div");
        ring.className = "save-progress-ring";
        ring.setAttribute("aria-hidden", "true");
        const progress = Number.isFinite(save.progress)
            ? Math.max(0, Math.min(100, save.progress))
            : CeedokuSaveManager.progressFor(save.data);
        ring.style.setProperty("--progress", `${progress}%`);
        const progressText = document.createElement("span");
        progressText.className = "save-progress-label";
        progressText.textContent = `${progress}% complete`;
        const calendarIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        calendarIcon.setAttribute("class", "save-calendar-icon");
        calendarIcon.setAttribute("viewBox", "0 0 24 24");
        calendarIcon.setAttribute("fill", "none");
        calendarIcon.setAttribute("stroke", "currentColor");
        calendarIcon.setAttribute("stroke-width", "1.8");
        calendarIcon.setAttribute("stroke-linecap", "round");
        calendarIcon.setAttribute("stroke-linejoin", "round");
        calendarIcon.setAttribute("aria-hidden", "true");
        calendarIcon.innerHTML = '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18"></path>';
        const date = document.createElement("span");
        date.className = "save-last-played";
        date.textContent = Number.isFinite(save.lastPlayed)
            ? new Date(save.lastPlayed).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
            : "Date unavailable";
        meta.append(ring, progressText, calendarIcon, date);
        info.appendChild(meta);

        const actions = document.createElement("div");
        actions.className = "save-card-actions";
        const topRow = document.createElement("div");
        topRow.className = "save-card-action-row";
        const edit = makeSaveAction(
            "Edit save title",
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"></path></svg>',
            "save-square-button"
        );
        edit.addEventListener("click", () => {
            showRenameSave(save.id, save.title);
        });

        const moreWrap = document.createElement("div");
        moreWrap.className = "save-more-wrap";
        const more = makeSaveAction(
            "More save options",
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"></circle><circle cx="12" cy="12" r="1.8"></circle><circle cx="19" cy="12" r="1.8"></circle></svg>',
            "save-square-button"
        );
        const moreMenu = document.createElement("div");
        moreMenu.className = "save-more-menu";
        moreMenu.hidden = true;
        const moveUpButton = document.createElement("button");
        moveUpButton.type = "button";
        moveUpButton.textContent = "Move up";
        moveUpButton.disabled = saveIndex === 0;
        moveUpButton.addEventListener("click", () => {
            try {
                saveManager.reorder(save.id, -1);
                renderSaveCards();
            } catch (error) {
                reportSaveError(error);
            }
        });
        const moveDownButton = document.createElement("button");
        moveDownButton.type = "button";
        moveDownButton.textContent = "Move down";
        moveDownButton.disabled = saveIndex === saves.length - 1;
        moveDownButton.addEventListener("click", () => {
            try {
                saveManager.reorder(save.id, 1);
                renderSaveCards();
            } catch (error) {
                reportSaveError(error);
            }
        });
        const exportButton = document.createElement("button");
        exportButton.type = "button";
        exportButton.textContent = "Export .CSF";
        exportButton.addEventListener("click", () => {
            closeSaveMoreMenu();
            pendingExportSave = save;
            exportnameinput.value = save.title || "Sudoku game";
            showexportnamemenu();
        });
        const duplicateButton = document.createElement("button");
        duplicateButton.type = "button";
        duplicateButton.textContent = "Duplicate save";
        duplicateButton.addEventListener("click", () => {
            closeSaveMoreMenu();
            try {
                saveManager.add(save.data, `${save.title} (copy)`);
                renderSaveCards();
            } catch (error) {
                reportSaveError(error);
            }
        });
        moreMenu.append(moveUpButton, moveDownButton, exportButton, duplicateButton);
        more.addEventListener("click", () => {
            const wasOpen = openSaveMoreMenu === moreMenu && !moreMenu.hidden;
            closeSaveMoreMenu();
            if (wasOpen) return;
            moreMenu.hidden = false;
            document.body.appendChild(moreMenu);
            openSaveMoreMenu = moreMenu;
            openSaveMoreWrap = moreWrap;
            const buttonRect = more.getBoundingClientRect();
            const menuWidth = moreMenu.offsetWidth;
            const menuHeight = moreMenu.offsetHeight;
            const left = Math.max(8, Math.min(
                buttonRect.right - menuWidth,
                window.innerWidth - menuWidth - 8
            ));
            const top = buttonRect.bottom + menuHeight <= window.innerHeight - 8
                ? buttonRect.bottom + 4
                : Math.max(8, buttonRect.top - menuHeight - 4);
            moreMenu.style.left = `${left}px`;
            moreMenu.style.top = `${top}px`;
        });
        moreWrap.append(more, moreMenu);
        topRow.append(edit, moreWrap);

        const bottomRow = document.createElement("div");
        bottomRow.className = "save-card-action-row";
        const play = document.createElement("button");
        play.type = "button";
        play.className = "save-play-button";
        play.textContent = "Play";
        play.addEventListener("click", () => {
            try {
                const record = saveManager
                    ? saveManager.activate(save.id)
                    : save;
                activeSaveId = record.id === "legacy" ? null : record.id;
                syncLegacySave(record);
                loadgame(record.data);
                viewingCompletedSave = Boolean(finished);
                continueGame();
                hidePlayMenu();
            } catch (error) {
                reportSaveError(error);
            }
        });
        const remove = makeSaveAction(
            "Delete saved game",
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 6.5h17"></path><path d="M9 6.5V4.75A1.25 1.25 0 0 1 10.25 3.5h3.5A1.25 1.25 0 0 1 15 4.75V6.5"></path><path d="M5.5 6.5 6.6 19a1.5 1.5 0 0 0 1.5 1.35h7.8a1.5 1.5 0 0 0 1.5-1.35L18.5 6.5"></path><path d="M10 10.5v6.5m4-6.5V17"></path></svg>',
            "save-square-button save-delete-button"
        );
        remove.addEventListener("click", () => showdeleteGame(save.id));
        bottomRow.append(play, remove);
        actions.append(topRow, bottomRow);
        card.append(info, actions);
        list.appendChild(card);
    }
}

function showdeleteGame(saveId) {
    pendingDeleteSaveId = saveId || activeSaveId;
    const prompt = deleteOverlay.querySelector(".win-stats h2");
    if (prompt) prompt.textContent = "This saved game will be permanently deleted.";
    deleteOverlay.hidden = false;

    requestAnimationFrame(() => {
        deleteOverlay.classList.add("show");
    });
}
let canusehelp = true

function loadgame(saveOverride) {
    let save = saveOverride;
    if (save === undefined && saveManager && activeSaveId) {
        try {
            save = saveManager.get(activeSaveId)?.data;
        } catch (error) {
            reportSaveError(error);
            return;
        }
    }
    if (save === undefined || save === null) {
        save = localStorage.getItem("save");
    }
    if (save === null) {
        nosave = true;
        updateGiveUpButton();
        return;
    }
    const game = CeedokuSaveManager.parseGame(save);
    if (!game) {
        showNotification("The saved game is incomplete or invalid. Its data has been preserved.");
        nosave = true;
        updateGiveUpButton();
        return;
    }
    solution = game.solution;
    if (game.hintcounter) {
        hintcounter = game.hintcounter
    } else {
        hintcounter = 0
    }
    values = game.values;
    givens = game.givens || values.map(value => value !== 0);
    if (game.canusehelp !== undefined) {
        canusehelp = game.canusehelp;
    } else {
        canusehelp = true
    }
    notes = Array.isArray(game.notes) && game.notes.length === 81
        ? game.notes.map(arr => new Set(Array.isArray(arr) ? arr : []))
        : Array.from({ length: 81 }, () => new Set());

    selected = Number.isInteger(game.selected) && game.selected >= 0 && game.selected < 81
        ? game.selected
        : values.findIndex(value => value === 0);
    if (selected < 0) selected = 40;
    if (
        game.difficulty === "custom" &&
        Number.isInteger(game.customDifficulty?.holes) &&
        game.customDifficulty.holes >= 1 &&
        game.customDifficulty.holes <= 64 &&
        typeof game.customDifficulty.toolsEnabled === "boolean"
    ) {
        difficulty = "custom";
        customDifficulty = { ...game.customDifficulty };
        canusehelp = customDifficulty.toolsEnabled;
    } else {
        difficulty = DIFFICULTIES[game.difficulty] ? game.difficulty : "easy";
        customDifficulty = null;
    }
    pencilMode = game.pencilMode;
    eraseMode = game.eraseMode;
    mistakes = Number.isFinite(game.mistakes) && game.mistakes >= 0 ? game.mistakes : 0;
	continueMistakes.textContent = mistakes;

    undoStack = Array.isArray(game.undoStack) ? game.undoStack : [];
    redoStack = Array.isArray(game.redoStack) ? game.redoStack : [];
    finished = Boolean(game.finished);

    if (game.cooldowntypetouse === undefined) {
        hintcount = settings.hints.cooldown.startinghints;
        savehintcount = settings.hints.cooldown.startinghints;
        canusecurrenthintsystem = true
    } else if (game.cooldowntypetouse !== settings.hints.cooldown.cooldowntype) {
        canusecurrenthintsystem = false;
        savehintcount = game.hintcount;
        cooldowntypetouse = game.cooldowntypetouse;
        savecooldownmoves = game.cooldownmoves;
        savecooldowntime = game.cooldowntime
    } else if (game.cooldowntypetouse == settings.hints.cooldown.cooldowntype) {
        savehintcount = game.hintcount;
        canusecurrenthintsystem = true;
        cooldowntypetouse = game.cooldowntypetouse;
        savecooldownmoves = game.cooldownmoves
        savecooldowntime = game.cooldowntime
    }
    testhistorybuttons();

    // ---------------- TIMER ----------------
    elapsedMs = Number.isFinite(game.elapsedMs) && game.elapsedMs >= 0 ? game.elapsedMs : 0;
    timerPaused = Boolean(game.timerPaused);
	continueTime.textContent = formatTime(Math.floor(elapsedMs / 1000));

    clearInterval(timerId);
	nosave = false;
	testHintButton();
	updateGiveUpButton();
}

function changemode(forceMode) {
    
    if (forceMode) {
        pageMode = forceMode;
    } else {
        // otherwise toggle
        pageMode = (pageMode === "light") ? "dark" : "light";
    }


    const updateTheme = () => {
        document.body.classList.add("theme-switching");
        document.body.classList.remove("light", "dark");
        document.body.classList.add(pageMode);
        localStorage.setItem("theme", pageMode);

	if (modeButton) {
		modeButton.innerHTML = pageMode === "dark"
			? '<svg style="transform:translatey(1px)" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" style="fill: currentColor;"></circle><path d="M12 2V4"></path><path d="M12 20V22"></path><path d="M4.93 4.93L6.34 6.34"></path><path d="M17.66 17.66L19.07 19.07"></path><path d="M2 12H4"></path><path d="M20 12H22"></path><path d="M4.93 19.07L6.34 17.66"></path><path d="M17.66 6.34L19.07 4.93"></path></svg>'
			: '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.5C19.4 15.05 18.16 15.35 16.85 15.35C12.33 15.35 8.65 11.67 8.65 7.15C8.65 5.84 8.95 4.6 9.5 3.5C5.6 4.45 2.7 7.97 2.7 12.15C2.7 17.06 6.68 21.05 11.6 21.05C15.78 21.05 19.55 18.4 20.5 14.5Z"></path></svg>';
	}
    };

    if (document.startViewTransition) {
        const transition = document.startViewTransition(updateTheme);
        const clearThemeSwitch = () => document.body.classList.remove("theme-switching");
        transition.finished.then(
            clearThemeSwitch,
            clearThemeSwitch
        );
        setTimeout(clearThemeSwitch, 250);
    } else {
        updateTheme();
        setTimeout(() => document.body.classList.remove("theme-switching"), 0);
    }
}

const rows = Array.from({
    length: 9
}, (_, r) => Array.from({
    length: 9
}, (_, c) => r * 9 + c));
const cols = Array.from({
    length: 9
}, (_, c) => Array.from({
    length: 9
}, (_, r) => r * 9 + c));
const boxes = Array.from({
    length: 9
}, (_, b) => {
    const startRow = Math.floor(b / 3) * 3;
    const startCol = (b % 3) * 3;
    return Array.from({
        length: 9
    }, (_, i) => (startRow + Math.floor(i / 3)) * 9 + startCol + (i % 3));
});

function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function boxIndex(row, col) {
    return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

function canPlace(grid, index, value) {
    const row = Math.floor(index / 9);
    const col = index % 9;
    for (let i = 0; i < 9; i += 1) {
        if (grid[row * 9 + i] === value || grid[i * 9 + col] === value) return false;
    }
    return boxes[boxIndex(row, col)].every((cellIndex) => grid[cellIndex] !== value);
}




function fillGrid(grid, index = 0) {
    if (index === 81) return true;
    if (grid[index] !== 0) return fillGrid(grid, index + 1);
    for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (canPlace(grid, index, value)) {
            grid[index] = value;
            if (fillGrid(grid, index + 1)) return true;
            grid[index] = 0;
        }
    }
    return false;
}

function countSolutions(grid, limit = 2) {
    const emptyIndex = grid.findIndex((value) => value === 0);
    if (emptyIndex === -1) return 1;
    let count = 0;
    for (let value = 1; value <= 9; value += 1) {
        if (canPlace(grid, emptyIndex, value)) {
            grid[emptyIndex] = value;
            count += countSolutions(grid, limit);
            grid[emptyIndex] = 0;
            if (count >= limit) return count;
        }
    }
    return count;
}

function makePuzzle(holes) {
    if (puzzleWorker) {
        return new Promise((resolve, reject) => {
            const worker = puzzleWorker;

            const handleMessage = (event) => {
                worker.removeEventListener("message", handleMessage);
                worker.removeEventListener("error", handleError);

                resolve(event.data);
            };

            const handleError = (error) => {
                worker.removeEventListener("message", handleMessage);
                worker.removeEventListener("error", handleError);

                puzzleWorker = null;
                reject(error);
            };

            worker.addEventListener("message", handleMessage);
            worker.addEventListener("error", handleError);

            worker.postMessage({ holes });
        });
    }

    return new Promise((resolve) => {
        const full = Array(81).fill(0);
        fillGrid(full);

        const draft = [...full];

        const order = shuffle(
            Array.from(
                { length: 81 },
                (_, i) => i
            )
        );

        let removed = 0;

        for (const index of order) {
            if (removed >= holes) break;

            const keep = draft[index];

            draft[index] = 0;

            const probe = [...draft];

            if (countSolutions(probe, 2) === 1) {
                removed += 1;
            } else {
                draft[index] = keep;
            }
        }

        resolve({
            full,
            draft
        });
    });
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds / 60) % 60;
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}


let elapsedMs = 0;
let startTime = 0;
let timerId = null;
let timerPaused = false;

function startTimer() {
    clearInterval(timerId);

    startTime = Date.now() - elapsedMs;

    timerId = setInterval(() => {
        elapsedMs = Date.now() - startTime;

        const formattedTime = formatTime(Math.floor(elapsedMs / 1000));
        winTime.textContent = formattedTime;
        pauseTime.textContent = formattedTime;
        continueTime.textContent = formattedTime;
        timerEl.textContent = formattedTime;

        if (hintcounter == settings.hints.hintlimit.limit && !hintlimitreached) {
            hintlimitreached = true;
        }

        if (
            settings.hints.cooldown.enabled &&
            settings.hints.cooldown.cooldowntype === "time" &&
            cooldowntime > 0
        ) {
            cooldowntime--;

            if (cooldowntime === 0 && !hintlimitreached) {
                hintcount = settings.hints.cooldown.hintsaftercooldown;
            } else {
                hintcount = 0;
            }
        }

        updateHintCooldownDisplay();
    }, 1000);
}

function pauseTimer() {
    if (!timerPaused) {
        // PAUSE
        timerPaused = true;

        clearInterval(timerId);

        elapsedMs = Date.now() - startTime;

        pauseBtn2.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M4 2C2.9 2 2 2.9 2 4V20C2 21.1 2.9 22 4 22C4.3 22 4.6 21.93 4.87 21.79L21.2 13.25C22.27 12.69 22.27 11.31 21.2 10.75L4.87 2.21C4.6 2.07 4.3 2 4 2Z"></path></svg>';
        document.title = "Ceedoku - Paused";

        if (runninggame) {
            saveGame()
        };
        showPauseScreen()
    } else {
        // RESUME
        timerPaused = false;

        startTimer();

        pauseBtn2.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M2 4C2 2.9 2.9 2 4 2H8C9.1 2 10 2.9 10 4V20C10 21.1 9.1 22 8 22H4C2.9 22 2 21.1 2 20Z"/><path d="M14 4C14 2.9 14.9 2 16 2H20C21.1 2 22 2.9 22 4V20C22 21.1 21.1 22 20 22H16C14.9 22 14 21.1 14 20Z"/></svg>';
        document.title = `Ceedoku - ${getDifficultyLabel()}`
        hidepausescreen()
    }
}
window.addEventListener("visibilitychange", lostfocuspause)

function lostfocuspause() {
    if (runninggame) {
        if (!timerPaused) {
            timerPaused = true;

            clearInterval(timerId);

            elapsedMs = Date.now() - startTime;

            pauseBtn2.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M2 4C2 2.9 2.9 2 4 2H8C9.1 2 10 2.9 10 4V20C10 21.1 9.1 22 8 22H4C2.9 22 2 21.1 2 20Z"/><path d="M14 4C14 2.9 14.9 2 16 2H20C21.1 2 22 2.9 22 4V20C22 21.1 21.1 22 20 22H16C14.9 22 14 21.1 14 20Z"/></svg>';
            document.title = "Ceedoku - Paused";
            showPauseScreen()
        }
    }
};


function winpauseTimer() {
    if (!timerPaused) {
        // PAUSE
        timerPaused = true;

        clearInterval(timerId);

        elapsedMs = Date.now() - startTime;

        document.title = "Ceedoku - Paused";
    }
};

function resumeTimer() {
    if (!timerPaused) return;

    timerPaused = false;

    startTimer();

    pauseBtn2.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M2 4C2 2.9 2.9 2 4 2H8C9.1 2 10 2.9 10 4V20C10 21.1 9.1 22 8 22H4C2.9 22 2 21.1 2 20Z"/><path d="M14 4C14 2.9 14.9 2 16 2H20C21.1 2 22 2.9 22 4V20C22 21.1 21.1 22 20 22H16C14.9 22 14 21.1 14 20Z"/></svg>';
    document.title = `Ceedoku - ${getDifficultyLabel()}`
    hidepausescreen()
}

function renderBoard() {
    boardEl.innerHTML = "";

    for (let i = 0; i < 81; i += 1) {

        const cell = document.createElement("button");
        cell.tabIndex = -1;
        cell.className = "cell";
        cell.type = "button";
        cell.dataset.index = String(i);
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", `Row ${Math.floor(i / 9) + 1}, column ${i % 9 + 1}`);
        cell.addEventListener("click", () => selectCell(i));
        boardEl.appendChild(cell);
    }
    paintBoard();
}

function renderNumberPad() {
    numberGrid.innerHTML = "";
    for (let value = 1; value <= 9; value += 1) {
        const button = document.createElement("button");
        button.className = "number-button";
        button.type = "button";
        button.textContent = value;
        button.dataset.value = String(value);
        button.setAttribute("aria-label", `Use ${value}`);
        button.addEventListener("click", () => placeNumber(value));

        numberGrid.appendChild(button);
    }
}


function renderNotes(noteSet) {
    const grid = document.createElement("div");
    grid.className = "note-grid";
    for (let value = 1; value <= 9; value += 1) {
        const mark = document.createElement("span");
        mark.textContent = noteSet.has(value) ? value : "";
        grid.appendChild(mark);
    }
    return grid;
}

function exportsave() {
    const list = document.getElementById("exportSaveList");
    const emptyMessage = document.getElementById("exportSaveEmpty");
    list.replaceChildren();

    let saves;
    try {
        saves = getExportableSaves();
    } catch (error) {
        reportSaveError(error);
        return;
    }

    emptyMessage.hidden = saves.length !== 0;
    for (const save of saves) {
        const card = document.createElement("article");
        card.className = "save-card save-export-card";
        card.setAttribute("role", "listitem");

        const info = document.createElement("div");
        info.className = "save-card-info";
        const titleRow = document.createElement("div");
        titleRow.className = "save-card-title-row";
        const title = document.createElement("h2");
        title.className = "save-card-title";
        title.textContent = save.title || "Sudoku game";
        titleRow.appendChild(title);

        const game = CeedokuSaveManager.parseGame(save.data);
        if (game) {
            const gameDifficulty = DIFFICULTIES[game.difficulty] || game.difficulty === "custom"
                ? game.difficulty
                : "easy";
            const chip = document.createElement("span");
            chip.className = `save-difficulty-chip difficulty-${gameDifficulty}`;
            chip.textContent = gameDifficulty === "custom" && game.customDifficulty
                ? `Custom · ${game.customDifficulty.holes} ${game.customDifficulty.holes === 1 ? "hole" : "holes"}`
                : getDifficultyLabel(gameDifficulty, game.customDifficulty);
            titleRow.appendChild(chip);
        }
        info.appendChild(titleRow);

        const meta = document.createElement("div");
        meta.className = "save-card-meta";
        const ring = document.createElement("div");
        ring.className = "save-progress-ring";
        ring.setAttribute("aria-hidden", "true");
        const progress = Number.isFinite(save.progress)
            ? Math.max(0, Math.min(100, save.progress))
            : CeedokuSaveManager.progressFor(save.data);
        ring.style.setProperty("--progress", `${progress}%`);
        const progressText = document.createElement("span");
        progressText.className = "save-progress-label";
        progressText.textContent = `${progress}% complete`;
        const calendarIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        calendarIcon.setAttribute("class", "save-calendar-icon");
        calendarIcon.setAttribute("viewBox", "0 0 24 24");
        calendarIcon.setAttribute("fill", "none");
        calendarIcon.setAttribute("stroke", "currentColor");
        calendarIcon.setAttribute("stroke-width", "1.8");
        calendarIcon.setAttribute("stroke-linecap", "round");
        calendarIcon.setAttribute("stroke-linejoin", "round");
        calendarIcon.setAttribute("aria-hidden", "true");
        calendarIcon.innerHTML = '<rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M16 3v4M8 3v4M3 10h18"></path>';
        const date = document.createElement("span");
        date.className = "save-last-played";
        date.textContent = Number.isFinite(save.lastPlayed)
            ? new Date(save.lastPlayed).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
            : "Date unavailable";
        meta.append(ring, progressText, calendarIcon, date);
        info.appendChild(meta);

        const option = document.createElement("button");
        option.type = "button";
        option.className = "save-play-button";
        option.textContent = "Export";
        option.setAttribute("aria-label", `Export ${save.title || "Sudoku game"}`);
        option.addEventListener("click", () => {
            pendingExportSave = save;
            hideExportSavePicker(false);
            exportnameinput.value = save.title || "Sudoku game";
            showexportnamemenu();
        });
        card.append(info, option);
        list.appendChild(card);
    }

    const picker = document.getElementById("exportSavePicker");
    picker.hidden = false;
    requestAnimationFrame(() => picker.classList.add("show"));
};

function getExportableSaves() {
    if (saveManager) return saveManager.list();
    const legacy = localStorage.getItem("save");
    if (!legacy || !CeedokuSaveManager.parseGame(legacy)) return [];
    return [{
        id: "legacy",
        title: "My Save",
        data: legacy
    }];
}

function hideExportSavePicker(clearSelection = true) {
    const picker = document.getElementById("exportSavePicker");
    picker.classList.remove("show");
    picker.hidden = true;
    if (clearSelection) pendingExportSave = null;
}

function exportsavename() {
    const filename = exportnameinput.value.trim();
    if (!pendingExportSave) {
        showNotification("Choose a saved game to export first.");
        return;
    }
    if (!filename) {
        showNotification("Enter a filename for the exported save.");
        exportnameinput.focus();
        return;
    }
    try {
        FSJ(pendingExportSave.data, filename);
    } catch (error) {
        reportSaveError(error);
        return;
    }
    pendingExportSave = null;
	importexportOverlay.querySelector("h1").textContent = "Save Exported";
	importexportOverlay.querySelector("h1").style.color = "var(--text2)";
	hideexportnamemenu();
	setTimeout(() => {
    	importexportOverlay.querySelector("h1").textContent = "Import/Export Saves";
		hideimportexportgame()
	}, 5000);
}
function importsave() {
    importSaveInput.value = "";
    importSaveInput.click();
}
function getCompletedCellSet(units = getCompletedUnits()) {
    const completed = new Set();
    units.rows.forEach((done, index) => {
        if (done) rows[index].forEach((cellIndex) => completed.add(cellIndex));
    });
    units.cols.forEach((done, index) => {
        if (done) cols[index].forEach((cellIndex) => completed.add(cellIndex));
    });
    units.boxes.forEach((done, index) => {
        if (done) boxes[index].forEach((cellIndex) => completed.add(cellIndex));
    });
    return completed;
}

function paintBoard() {
    const selectedValue = selected >= 0 ? values[selected] : 0;
    const selectedRow = Math.floor(selected / 9);
    const selectedCol = selected % 9;
    const selectedBoxRow = Math.floor(selectedRow / 3);
    const selectedBoxCol = Math.floor(selectedCol / 3);

    const completedCells = getCompletedCellSet();

    boardEl.querySelectorAll(".cell").forEach((cell) => {
        const i = Number(cell.dataset.index);
        const row = Math.floor(i / 9);
        const col = i % 9;
        const boxRow = Math.floor(row / 3);
        const boxCol = Math.floor(col / 3);

        const value = values[i];
        const complete = completedCells.has(i);
        const userValue = value !== 0 && !givens[i];

        // Remove everything except active animation effects.
        for (const child of [...cell.childNodes]) {
            if (
                child.nodeType === Node.ELEMENT_NODE &&
                child.classList.contains("complete-effect")
            ) {
                continue;
            }

            child.remove();
        }

        if (value) {
            cell.append(value);
        } else if (notes[i]?.size) {
            cell.append(renderNotes(notes[i]));
        }

        cell.classList.toggle("given", givens[i]);
        cell.classList.toggle("selected", i === selected);
        cell.classList.toggle("completed", complete);
        cell.classList.toggle("correct", userValue && value === solution[i] && !complete);
        cell.classList.toggle("error", userValue && value !== solution[i] && !complete);

        if (!canusehelp) {
            cell.classList.remove("error")
            cell.classList.remove("correct")
        }

        // Highlight same row, column and box
        cell.classList.toggle(
            "related",
            selected >= 0 &&
            (
                row === selectedRow ||
                col === selectedCol ||
                (boxRow === selectedBoxRow && boxCol === selectedBoxCol)
            )
        );

        // Highlight matching numbers
        cell.classList.toggle(
            "same-number",
            selectedValue !== 0 &&
            value === selectedValue
        );

        cell.setAttribute("aria-selected", i === selected ? "true" : "false");
    });

    updateHintHighlights();
    updateNumberCounts();
    updateStatus();
    updateHistoryButtons();
    if (runninggame) {
        saveGame()
    }
}

function saveGame() {
    if (!runninggame && !finished) return;
    if (solution.length !== 81) return;
    if (difficulty === "custom" && (!Number.isInteger(customDifficulty?.holes) || customDifficulty.holes < 1 || customDifficulty.holes > 64)) return;

    const data = saveGameData();
    if (!saveManager) {
        try {
            localStorage.setItem("save", JSON.stringify(data));
        } catch (error) {
            reportSaveError(error);
        }
        return;
    }

    try {
        const record = activeSaveId
            ? saveManager.update(activeSaveId, data)
            : saveManager.add(data, "New game");
        activeSaveId = record.id;
        syncLegacySave(record);
        lastSaveError = "";
    } catch (error) {
        reportSaveError(error);
    }
}

function selectCell(index) {
    selected = index;
    paintBoard();
    if (eraseMode) {
        eraseSelected();
    }
}

function cellSnapshot(index) {
    return {
        value: values[index],
        notes: [...(notes[index] || [])].sort((a, b) => a - b)
    };
}

function sameCellState(a, b) {
    return a.value === b.value && a.notes.length === b.notes.length && a.notes.every((note, index) => note === b.notes[index]);
}

function restoreCell(index, state) {
    values[index] = state.value;
    notes[index] = new Set(state.notes);
}

function makeChangeList(beforeStates) {
    const changes = [];
    beforeStates.forEach((before, index) => {
        const after = cellSnapshot(index);
        if (!sameCellState(before, after)) changes.push({
            index,
            before,
            after
        });
    });
    return changes;
}

function pushChanges(changes, activeIndex = selected) {
    if (!changes.length) return;
    undoStack.push({
        selected: activeIndex,
        changes
    });
    redoStack = [];
    updateHistoryButtons();
}

function collectNewlyCompleted(previous, next) {
    const indexes = new Set();
    next.rows.forEach((done, index) => {
        if (done && !previous.rows[index]) rows[index].forEach((cellIndex) => indexes.add(cellIndex));
    });
    next.cols.forEach((done, index) => {
        if (done && !previous.cols[index]) cols[index].forEach((cellIndex) => indexes.add(cellIndex));
    });
    next.boxes.forEach((done, index) => {
        if (done && !previous.boxes[index]) boxes[index].forEach((cellIndex) => indexes.add(cellIndex));
    });
    return indexes;
}

function showWinScreen() {
    winpauseTimer();
    if (settings.haptics.puzzlecomplete) {
        vibrate([20, 50, 40]);
    }
    if (settings.SFX.enabled && settings.SFX.win) {
        winSound.currentTime = 0;
        winSound.play().catch(() => {});
    }
    winDifficulty.textContent = getDifficultyLabel();


    winMistakes.textContent = mistakes;
    winOverlay.hidden = false;

    requestAnimationFrame(() => {
        winOverlay.classList.add("show");
    });
    setTimeout(() => {
        if (settings.VFX.enabled && settings.VFX.confetti) {
            fireconfetti();
        }
    }, 200);
}

function showPauseScreen() {
    pauseDifficulty.textContent = getDifficultyLabel();


    pauseMistakes.textContent = mistakes;
    pauseOverlay.hidden = false;

    requestAnimationFrame(() => {
        pauseOverlay.classList.add("show");
    });
}

function hidewinscreen() {
    winOverlay.classList.remove("show");


}

function hidecontinuegame() {
    continueOverlay.classList.remove("show");


}
function hideimportexportgame() {
	// reset the title of the import/export game menu back to default on close of the menu.
	importexportOverlay.querySelector("h1").textContent = "Import/Export Saves";
	importexportOverlay.querySelector("h1").style.color = "var(--text2)";
	importexportOverlay.hidden = true;
	importexportOverlay.classList.remove("show");
}
const exportnamemenu = document.getElementById("namefileOverlay")
const exportnamemenuinput = document.getElementById("savenameinput")
const exportnameinput = exportnamemenuinput
function showexportnamemenu() {
	exportnamemenu.hidden = false;
	requestAnimationFrame(() => {
        exportnamemenu.classList.add("show");
		exportnamemenuinput.focus();
    });
}
function hideexportnamemenu() {
	exportnamemenu.hidden = true;
	exportnamemenu.classList.remove("show");
	exportnameinput.value = ""
}
function showimportexportmenu() {
	importexportOverlay.hidden = false;
	requestAnimationFrame(() => {
        importexportOverlay.classList.add("show");
    });
}
function hidedeleteGame() {
    deleteOverlay.classList.remove("show");
}

function hidemainmenu() {
    document.getElementById("mainmenubutton").style.display = ""
    mainmenu.classList.remove("show");
    mainmenu.inert = true

}

function hidepausescreen() {
    pauseOverlay.classList.remove("show");
}

function scrubNotes(indexes, beforeStates) {
    indexes.forEach((index) => {
        if (!beforeStates.has(index)) beforeStates.set(index, cellSnapshot(index));
        notes[index].clear();
    });
}

function togglePencilMode(force) {
    pencilMode = typeof force === "boolean" ? force : !pencilMode;

    if (pencilMode) {
        eraseMode = false;
    }

    pencilButton.setAttribute("aria-pressed", pencilMode);
    eraseButton.setAttribute("aria-pressed", eraseMode);
}

function toggleEraseMode(force) {
    eraseMode = typeof force === "boolean" ? force : !eraseMode;

    if (eraseMode) {
        pencilMode = false;
    }

    eraseButton.setAttribute("aria-pressed", eraseMode);
    pencilButton.setAttribute("aria-pressed", pencilMode);
}

function placeNumber(value, options = {}) {
    if (timerPaused) {
        return
    };
    if (finished || givens[selected]) return;
    if (eraseMode) {
        toggleEraseMode(false);
    }
    const beforeStates = new Map([
        [selected, cellSnapshot(selected)]
    ]);

    if (pencilMode) {
        if (values[selected] !== 0) return;
        if (notes[selected].has(value)) notes[selected].delete(value);
        else notes[selected].add(value);
        if (!options.fromHistory) pushChanges(makeChangeList(beforeStates), selected);
        paintBoard();
        return;
    }

    if (values[selected] === value && notes[selected].size === 0) return;
    const previousCompleted = getCompletedUnits();
    values[selected] = value;
    notes[selected].clear();
    const nextCompleted = getCompletedUnits();
    scrubNotes(collectNewlyCompleted(previousCompleted, nextCompleted), beforeStates);
    if (!options.fromHistory) pushChanges(makeChangeList(beforeStates), selected);
    if (value !== 0 && value !== solution[selected] && !options.fromHistory) mistakes += 1;
    paintBoard();
    animateNewCompletions(previousCompleted, selected);
    checkWin();
    if (!options.fromHistory && cooldownmoves > 0 && !hintlimitreached) {
        cooldownmoves--;
        updateHintCooldownDisplay();
        if (cooldownmoves === 0) {
            hintcount = settings.hints.cooldown.hintsaftercooldown;
            enableHintButton();
            updateHintCooldownDisplay();
        }
    }
}

function eraseSelected() {
    if (finished || givens[selected]) return;
    if (values[selected] === 0 && notes[selected].size === 0) return;
    const beforeStates = new Map([
        [selected, cellSnapshot(selected)]
    ]);
    values[selected] = 0;
    notes[selected].clear();
    pushChanges(makeChangeList(beforeStates), selected);
    paintBoard();
}

function applyHistoryMove(move, direction) {
    if (!move) return;
    const previousCompleted = getCompletedUnits();
    selected = move.selected;
    move.changes.forEach((change) => {
        restoreCell(change.index, direction === "undo" ? change.before : change.after);
    });
    paintBoard();
    animateNewCompletions(previousCompleted, selected);
    checkWin();
}

function undo() {
    const move = undoStack.pop();
    if (!move) return;
    redoStack.push(move);
    applyHistoryMove(move, "undo");
}

function redo() {
    const move = redoStack.pop();
    if (!move) return;
    undoStack.push(move);
    applyHistoryMove(move, "redo");
}

function enableHintButton() {
    document.getElementById("hintButton").classList.remove("disabled");
    document.getElementById("hintButton").disabled = false;
}

function disableHintButton() {
    document.getElementById("hintButton").classList.add("disabled");
    document.getElementById("hintButton").disabled = true;
}

function disablehistorybuttons() {
    redoButton.disabled = true;
    undoButton.disabled = true;
}

function enablehistorybuttons() {
    redoButton.disabled = false;
    undoButton.disabled = false;
}

function disableotherbuttons() {
    eraseButton.disabled = true;
    pencilButton.disabled = true;
    pencilMode = false;
    eraseMode = false;
    pencilButton.setAttribute("aria-pressed", "false");
    eraseButton.setAttribute("aria-pressed", "false");
}

function enableotherbuttons() {
    pencilButton.disabled = !settings.tools.enabled || !settings.tools.pencil.enabled;
    eraseButton.disabled = !settings.tools.enabled || !settings.tools.erase.enabled;
}

function testhistorybuttons() {
    if (canusehelp && settings.tools.enabled) {
        if (settings.tools.history.enabled) {
            enablehistorybuttons();
        } else {
            disablehistorybuttons();
        }

        enableotherbuttons();
    } else {
        disablehistorybuttons();
        disableotherbuttons();
    }
}

function testHintButton() {
    if (!settings.hints.enabled) {
        disableHintButton();
    } else {
        enableHintButton();
    }
    if (!canusehelp) {
        disableHintButton();
    }
}

testHintButton();

function hint() {
    updateHintCooldownDisplay();
    if (!settings.hints.enabled) return;
    if (hintlimitreached) {
        updateHintCooldownDisplay();
        getHintCooldownText()
        return 
    };
    if (hintcount <= 0 && settings.hints.cooldown.enabled) return;
    if (finished) return;

    pendingHintMove = CeedokuHintEngine.findMove(values, selected, solution);
    if (!pendingHintMove) {
        const target = values.findIndex((value, index) => value === 0 && !givens[index]);
        if (target >= 0 && solution[target]) {
            pendingHintMove = {
                index: target,
                value: solution[target],
                technique: "Solution check",
                explanation: `The current board has no placement from the implemented logical techniques yet. The answer key confirms ${solution[target]} belongs in row ${Math.floor(target / 9) + 1}, column ${target % 9 + 1}.`,
                steps: [
                    "The available logical techniques do not resolve an empty cell on this board.",
                    `The answer key confirms ${solution[target]} belongs in row ${Math.floor(target / 9) + 1}, column ${target % 9 + 1}.`
                ],
                relatedCells: Array.from({ length: 81 }, (_, index) => {
                    const sameRow = Math.floor(index / 9) === Math.floor(target / 9);
                    const sameColumn = index % 9 === target % 9;
                    const sameBox = Math.floor(Math.floor(index / 9) / 3) === Math.floor(Math.floor(target / 9) / 3) &&
                        Math.floor((index % 9) / 3) === Math.floor((target % 9) / 3);
                    return index !== target && values[index] !== 0 && (sameRow || sameColumn || sameBox)
                        ? index
                        : -1;
                }).filter(index => index >= 0)
            };
        }
    }
    if (!pendingHintMove) {
        showNotification("No hint is available for this board.");
        return;
    }

    if (!settings.hints.explanations.enabled) {
        applyHint();
        return;
    }

    hintTechnique.textContent = pendingHintMove.technique;
    hintRecommendation.textContent = `Place ${pendingHintMove.value} in row ${Math.floor(pendingHintMove.index / 9) + 1}, column ${pendingHintMove.index % 9 + 1}`;
    hintExplanationSteps.replaceChildren(...(pendingHintMove.steps || [pendingHintMove.explanation])
        .map(step => {
            const item = document.createElement("li");
            item.textContent = step;
            return item;
        }));
    hintExplanationPanel.hidden = false;
    hintConnector.hidden = false;
    hintConnector.style.visibility = "hidden";
    hintExplanationPanel.classList.add("show");
    updateHintHighlights();
    positionHintExplanation();
}

function closeHintExplanation() {
    pendingHintMove = null;
    hintExplanationPanel.classList.remove("show");
    hintExplanationPanel.hidden = true;
    hintConnector.hidden = true;
    hintConnector.style.visibility = "";
    updateHintHighlights();
}

function updateHintHighlights() {
    if (!boardEl) return;
    const target = pendingHintMove?.index ?? -1;
    const relatedCells = new Set(pendingHintMove?.relatedCells || []);
    boardEl.querySelectorAll(".cell").forEach((cell, index) => {
        cell.classList.toggle("hint-related", relatedCells.has(index));
        cell.classList.toggle("hint-target", index === target);
    });
}

function positionHintExplanation() {
    if (!pendingHintMove || hintExplanationPanel.hidden) return;
    const targetCell = boardEl.querySelector(`[data-index="${pendingHintMove.index}"]`);
    if (!targetCell) return;

    const target = targetCell.getBoundingClientRect();
    const board = boardEl.getBoundingClientRect();
    const panel = hintExplanationPanel;
    const gap = 9;
    const margin = 12;
    panel.style.visibility = "hidden";
    panel.style.left = "0px";
    panel.style.top = "0px";
    const panelRect = panel.getBoundingClientRect();
    const width = panelRect.width;
    const height = panelRect.height;
    const numberPad = document.getElementById("numberGrid");
    const numberPadRect = numberPad?.getBoundingClientRect();
    const rightSpace = window.innerWidth - board.right - gap - margin;
    const leftSpace = board.left - gap - margin;
    let placement;
    let left;
    let top;

    if (window.matchMedia("(max-width: 600px)").matches && numberPadRect) {
        placement = "mobile";
        left = (window.innerWidth - width) / 2;
        top = numberPadRect.top;
    } else if (rightSpace >= width) {
        placement = "left";
        left = board.right + gap;
        top = target.top + target.height / 2 - height / 2;
    } else if (leftSpace >= width) {
        placement = "right";
        left = board.left - width - gap;
        top = target.top + target.height / 2 - height / 2;
    } else {
        left = Math.max(margin, Math.min(
            target.left + target.width / 2 - width / 2,
            window.innerWidth - width - margin
        ));
        if (window.innerHeight - target.bottom >= height + gap + margin) {
            placement = "top";
            top = target.bottom + gap;
        } else {
            placement = "bottom";
            top = target.top - height - gap;
        }
    }

    panel.dataset.placement = placement;
    const placedLeft = Math.max(margin, Math.min(left, window.innerWidth - width - margin));
    const placedTop = Math.max(margin, Math.min(top, window.innerHeight - height - margin));
    panel.style.left = `${placedLeft}px`;
    panel.style.top = `${placedTop}px`;
    const targetX = target.left + target.width / 2;
    const targetY = target.top + target.height / 2;
    let startX = targetX;
    let startY = targetY;
    let endX;
    let endY;
    if (placement === "left") {
        startX = target.right - 2;
        endX = placedLeft;
        endY = Math.max(placedTop + 14, Math.min(placedTop + height - 14, targetY));
    } else if (placement === "right") {
        startX = target.left + 2;
        endX = placedLeft + width;
        endY = Math.max(placedTop + 14, Math.min(placedTop + height - 14, targetY));
    } else if (placement === "top") {
        startY = target.bottom - 2;
        endX = Math.max(placedLeft + 14, Math.min(placedLeft + width - 14, targetX));
        endY = placedTop;
    } else if (placement === "mobile") {
        startY = target.bottom - 2;
        endX = placedLeft + width / 2;
        endY = placedTop;
    } else {
        startY = target.top + 2;
        endX = Math.max(placedLeft + 14, Math.min(placedLeft + width - 14, targetX));
        endY = placedTop + height;
    }
    hintConnector.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
    const control1X = startX + (endX - startX) * .4;
    const control2X = startX + (endX - startX) * .6;
    hintConnectorPath.setAttribute("d", `M ${startX} ${startY} C ${control1X} ${startY}, ${control2X} ${endY}, ${endX} ${endY}`);
    hintConnectorTarget.setAttribute("cx", startX);
    hintConnectorTarget.setAttribute("cy", startY);
    hintConnector.style.visibility = "";
    panel.style.visibility = "";
}

window.addEventListener("resize", positionHintExplanation);
window.addEventListener("scroll", positionHintExplanation, true);

function applyHint() {
    const move = pendingHintMove;
    if (!move) return;
    if (values[move.index] !== 0) {
        closeHintExplanation();
        showNotification("The board changed, so that hint is no longer available.");
        return;
    }
    closeHintExplanation();

    if (settings.hints.cooldown.enabled && !hintlimitreached) {
        hintcount--;
        if (settings.hints.hintlimit.enabled) {
            hintcounter++;
            updateHintCooldownDisplay();
            if (hintcounter >= settings.hints.hintlimit.limit) {
                hintlimitreached = true;
                updateHintCooldownDisplay();
            }
        }
        if (hintcount <= 0) {
            canusecurrenthintsystem = true;
            cooldowntypetouse = settings.hints.cooldown.cooldowntype;
            starthintcooldown();
            saveGame();
        }
        updateHintCooldownDisplay();
    } else if (!hintlimitreached && settings.hints.hintlimit.enabled) {
        hintcounter++;
        updateHintCooldownDisplay();
        if (hintcounter >= settings.hints.hintlimit.limit) {
            hintlimitreached = true;
            updateHintCooldownDisplay();
        }
    }
        
    const target = move.index;
    selected = target;

    const beforeStates = new Map([
        [target, cellSnapshot(target)]
    ]);
    const previousCompleted = getCompletedUnits();

    values[target] = move.value;
    notes[target].clear();

    const nextCompleted = getCompletedUnits();

    scrubNotes(
        collectNewlyCompleted(previousCompleted, nextCompleted),
        beforeStates
    );

    pushChanges(makeChangeList(beforeStates), target);

    paintBoard();
    animateNewCompletions(previousCompleted, selected);
    checkWin();
}

document.getElementById("applyHintButton").addEventListener("click", applyHint);
document.getElementById("dismissHintButton").addEventListener("click", closeHintExplanation);
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && pendingHintMove) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeHintExplanation();
    }
});

function starthintcooldown() {
    if (!usingsavegame) {
        if (settings.hints.cooldown.cooldowntype === "move") {
            cooldownmoves = settings.hints.cooldown.cooldowntime;
        }

        if (settings.hints.cooldown.cooldowntype === "time") {
            cooldowntime = settings.hints.cooldown.cooldowntime;
            updateHintCooldownDisplay();
        }
    } else {
        if (!canusecurrenthintsystem) {
            if (cooldowntypetouse === "move") {
                cooldownmoves = savecooldownmoves;
            }

            if (cooldowntypetouse === "time") {
                cooldowntime = savecooldowntime;
                updateHintCooldownDisplay();
            }
        } else {
            if (settings.hints.cooldown.cooldowntype === "move") {
                cooldownmoves = settings.hints.cooldown.cooldowntime;
            }

            if (settings.hints.cooldown.cooldowntype === "time") {
                cooldowntime = settings.hints.cooldown.cooldowntime;
                updateHintCooldownDisplay();
            }
        }
    }
}

function getHintCooldownText() {
    if (hintlimitreached && settings.hints.hintlimit.enabled) {
        disableHintButton();
        return `Limit Hit`
    }
    if (hintcount > 0) {
        if (settings.hints.enabled) {
            enableHintButton()
        }
        return `${hintcount} hint${hintcount === 1 ? "" : "s"}`;
    }

    if (settings.hints.cooldown.cooldowntype === "move") {
        disableHintButton()
        return `${cooldownmoves} move${cooldownmoves === 1 ? "" : "s"}`;
    }

    if (settings.hints.cooldown.cooldowntype === "time") {
        disableHintButton()
        return `${cooldowntime} sec${cooldowntime === 1 ? "" : "s"}`;
    }

    return "It broke?!";
}

function updateHintCooldownDisplay() {
    testHintButton();
    if (hintlimitreached) {
        getHintCooldownText();
        return
    }
    if (!settings.hints.enabled) {
        hintcooldowndisplay.textContent = "Disabled";
        return;
    }
    if (!canusehelp) {
        hintcooldowndisplay.textContent = "Disabled";
        disableHintButton();
        return;
    }

    if (!settings.hints.cooldown.enabled) {
        hintcooldowndisplay.textContent = "∞";
        hintcooldowndisplay.style.fontWeight = "800";
        return;
    }

    hintcooldowndisplay.style.fontWeight = "unset";
    hintcooldowndisplay.textContent = getHintCooldownText();
}
updateHintCooldownDisplay();

function updateHistoryButtons() {
    if (canusehelp && settings.tools.enabled && settings.tools.history.enabled) {
        undoButton.disabled = undoStack.length === 0;
        redoButton.disabled = redoStack.length === 0;
    } else {
        undoButton.disabled = true
        redoButton.disabled = true
    }
}

function updateNumberCounts() {
    const counts = Array(10).fill(0);
    values.forEach((value) => {
        if (value > 0) counts[value] += 1;
    });
    numberGrid.querySelectorAll(".number-button").forEach((button) => {
        const value = Number(button.dataset.value);
        button.classList.toggle("used-up", counts[value] >= 9);
    });
}

function updateStatus() {
    const empty = values.filter((value) => value === 0).length;
    mistakeStatus.textContent = `Mistakes: ${mistakes}`;
    emptyStatus.textContent = `Empty: ${empty}`;
}

function isUnitComplete(indexes) {
    const seen = new Set();
    for (const index of indexes) {
        const value = values[index];
        if (value === 0 || value !== solution[index] || seen.has(value)) return false;
        seen.add(value);
    }
    return seen.size === 9;
}

function getCompletedUnits() {
    return {
        rows: rows.map(isUnitComplete),
        cols: cols.map(isUnitComplete),
        boxes: boxes.map(isUnitComplete)
    };
}

function animateIndexes(indexes, origin, kind) {
    const distancesPlayed = new Set();

    const boardDistances =
        kind === "board"
            ? getBoardDistances(origin)
            : null;


    const maxDistance =
        kind === "board"
            ? Math.max(...boardDistances)
            : 8;

    const fadeDelay = maxDistance * 60 + 500;

    indexes.forEach((index) => {

        const cell = boardEl.querySelector(
            `[data-index="${index}"]`
        );

        if (!cell) return;

        const row = Math.floor(index / 9);
        const col = index % 9;

        const originRow = Math.floor(origin / 9);
        const originCol = origin % 9;

        let distance;

        if (kind === "row") {

            distance = Math.abs(col - originCol);

        } else if (kind === "column") {

            distance = Math.abs(row - originRow);

        } else if (kind === "box") {

            distance =
                Math.abs(row - originRow) +
                Math.abs(col - originCol);

        } else {

            distance = boardDistances[index];

        }

        // Play one sound per distance.
        if (
            settings.SFX.enabled &&
            settings.SFX.completion
        ) {
            if (!distancesPlayed.has(distance)) {

                distancesPlayed.add(distance);

                setTimeout(() => {
                    playPop(
                        Math.min(1 + distance * 0.5)
                    );
                }, distance * 60);
            }
        }

        if (
            settings.VFX.enabled &&
            settings.VFX.completion
        ) {

            const animationKind =
                kind === "board"
                    ? "board"
                    : kind;

            // Create the animation effect.
            const effect = document.createElement("div");

            effect.className =
                `complete-effect ${animationKind}`;

            effect.style.setProperty(
                "--sweep-delay",
                `${distance * 60}ms`
            );

            effect.style.setProperty(
                "--fade-delay",
                `${fadeDelay}ms`
            );

            // Effect goes first.
            cell.appendChild(effect);

            // Create a new number on top of the effect.
            const number = document.createElement("p");

            number.textContent = values[index];

            number.style.margin = "0px";
            number.style.position = "absolute";
            number.style.zIndex = "2";

            // Given cells get the heavier font weight.
            if (givens[index]) {
                number.style.fontWeight = "760";
            }

            // Match the cell's current state.
            if (cell.classList.contains("error")) {

                number.style.color = "var(--danger)";

            } else if (cell.classList.contains("correct")) {

                number.style.color = "var(--lime-text)";

            } else {

                number.style.color = "var(--text)";
            }

            // Number goes after the effect.
            cell.appendChild(number);

            let cleanedUp = false;
            const cleanup = () => {
                if (cleanedUp) return;
                cleanedUp = true;
                clearTimeout(cleanupTimeout);
                effect.remove();
                number.remove();
            };

            effect.addEventListener("animationend", (event) => {
                if (
                    event.animationName === "rippleFade" ||
                    event.animationName === "boxGrow2"
                ) {
                    cleanup();
                }
            });

            effect.addEventListener("animationcancel", cleanup);

            // Safari can occasionally omit animationend/animationcancel.
            const cleanupTimeout = setTimeout(
                cleanup,
                Math.max(
                    distance * 60 + 500,
                    fadeDelay + 350
                ) + 100
            );
        }
    });
}
const allIndexes = [...Array(81).keys()];
animateIndexes(allIndexes, selected, "board");

function animateNewCompletions(previous, origin) {
    const next = getCompletedUnits();
    next.rows.forEach((done, index) => {
        if (done && !previous.rows[index]) animateIndexes(rows[index], origin, "row");
    });
    next.cols.forEach((done, index) => {
        if (done && !previous.cols[index]) animateIndexes(cols[index], origin, "column");
    });
    next.boxes.forEach((done, index) => {
        if (done && !previous.boxes[index]) animateIndexes(boxes[index], origin, "box");
    });
}

function playBoardRipple() {
    const distances = getBoardDistances(selected);
    const distancesPlayed = new Set();

    boardEl.querySelectorAll(".cell").forEach((cell, index) => {

        const distance = distances[index];

        // Sound
        if (settings.SFX.enabled && settings.SFX.completion) {
            if (!distancesPlayed.has(distance)) {
                distancesPlayed.add(distance);

                setTimeout(() => {
                    playPop(Math.min(1 + distance * 0.25));
                }, distance * 60);
            }
        }

        // Animation
        if (settings.VFX.enabled && settings.VFX.completion) {

            cell.classList.remove("complete-sweep", "board");

            cell.style.setProperty(
                "--sweep-delay",
                `${distance * 60}ms`
            );
            cell.style.setProperty("--fade-delay", "1000ms");

            requestAnimationFrame(() => {
                cell.classList.add("complete-sweep", "board");
            });

            // Keep the pseudo-element mounted until its 350ms fade finishes.
            setTimeout(() => {
                cell.classList.remove("complete-sweep", "board");
                cell.style.removeProperty("--sweep-delay");
                cell.style.removeProperty("--fade-delay");
            }, 1450 + distance * 60);
        }
    });
}
document.addEventListener("pointerup", () => {
    updateHintCooldownDisplay();
});

function getBoardDistances(startIndex) {
    const distances = Array(81).fill(-1);
    const queue = [startIndex];

    distances[startIndex] = 0;

    while (queue.length) {
        const current = queue.shift();

        const row = Math.floor(current / 9);
        const col = current % 9;

        const neighbors = [];

        if (row > 0) neighbors.push(current - 9);
        if (row < 8) neighbors.push(current + 9);
        if (col > 0) neighbors.push(current - 1);
        if (col < 8) neighbors.push(current + 1);

        for (const next of neighbors) {
            if (distances[next] !== -1) continue;

            distances[next] = distances[current] + 1;
            queue.push(next);
        }
    }

    return distances;
}

function checkWin() {

    if (finished) return;

    if (values.every((value, index) => value === solution[index])) {
        popSound.playbackRate = 2;
        pauseBtn2.style.display = "none"
        runninggame = false
        finished = true;
        saveGame();

        clearInterval(timerId);

        playBoardRipple();
        checkTime()
        const maxDistance = Math.max(...getBoardDistances(selected));

        setTimeout(showWinScreen, maxDistance * 60 + 900);
    }
}


function closeDifficultyMenu() {
    menuOpen = false;
    difficultyMenu.classList.remove("open");
    difficultyToggle.setAttribute("aria-expanded", "false");
}

function openDifficultyMenu() {
    menuOpen = true;
    difficultyMenu.classList.add("open");
    difficultyToggle.setAttribute("aria-expanded", "true");
    updateDifficultyMenu();
}

function openmainDifficultyMenu() {
    newOverlay.hidden = false;

    requestAnimationFrame(() => {
        newOverlay.classList.add("show");
    });
}

function openCustomDifficultyMenu() {
    customDifficultyOverlay.hidden = false;
    requestAnimationFrame(() => customDifficultyOverlay.classList.add("show"));
}

function closeCustomDifficultyMenu() {
    customDifficultyOverlay.classList.remove("show");
    setTimeout(() => {
        if (!customDifficultyOverlay.classList.contains("show")) {
            customDifficultyOverlay.hidden = true;
        }
    }, 300);
}

customHolesInput.addEventListener("input", () => {
    customHolesValue.textContent = customHolesInput.value;
});
document.getElementById("cancelCustomDifficulty").addEventListener("click", closeCustomDifficultyMenu);
document.getElementById("startCustomGame").addEventListener("click", () => {
    closeCustomDifficultyMenu();
    newGame("custom", {
        holes: Number(customHolesInput.value),
        toolsEnabled: customToolsToggle.checked
    });
});

function closewinDifficultyMenu() {
    winmenuOpen = false;
    winDifficultyMenu.classList.remove("open");
    winDifficultyToggle.setAttribute("aria-expanded", "false");
}

function closepauseDifficultyMenu() {
    pausemenuOpen = false;
    pauseDifficultyMenu.classList.remove("open");
    pauseDifficultyMenu.classList.remove("opens-up", "viewport-menu");
    pauseDifficultyMenu.style.removeProperty("max-height");
    pauseDifficultyMenu.style.removeProperty("left");
    pauseDifficultyMenu.style.removeProperty("top");
    pausenewGameBand.appendChild(pauseDifficultyMenu);
    pauseDifficultyToggle.setAttribute("aria-expanded", "false");
}

function openwinDifficultyMenu() {
    winmenuOpen = true;
    windifficultyMenu.classList.add("open");

    winDifficultyToggle.setAttribute("aria-expanded", "false");
    updatewinDifficultyMenu();
}

function openpauseDifficultyMenu() {
    pausemenuOpen = true;
    document.body.appendChild(pauseDifficultyMenu);
    pauseDifficultyMenu.classList.add("open");
    pauseDifficultyMenu.classList.add("viewport-menu");

    pauseDifficultyToggle.setAttribute("aria-expanded", "true");
    updatepauseDifficultyMenu();
    positionPauseDifficultyMenu();
}

function positionPauseDifficultyMenu() {
    if (!pausemenuOpen) return;
    const band = pausenewGameBand.getBoundingClientRect();
    const menuHeight = pauseDifficultyMenu.scrollHeight;
    const siteControls = document.getElementById("sitecontrols");
    const topInset = Math.max(12, (siteControls?.getBoundingClientRect().bottom || 0) + 12);
    const spaceBelow = window.innerHeight - band.bottom - 12;
    const spaceAbove = band.top - topInset;
    const opensUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    const availableSpace = Math.max(0, Math.min(
        window.innerHeight - 24,
        opensUp ? spaceAbove : spaceBelow
    ));
    const height = Math.min(menuHeight, availableSpace);
    const width = pauseDifficultyMenu.getBoundingClientRect().width;
    const left = Math.max(12, Math.min(
        band.right - width,
        window.innerWidth - width - 12
    ));
    const maxTop = Math.max(opensUp ? topInset : 12, window.innerHeight - height - 12);
    const top = opensUp
        ? Math.max(topInset, Math.min(maxTop, band.top - height - 4))
        : Math.max(12, Math.min(maxTop, band.bottom + 4));
    pauseDifficultyMenu.style.maxHeight = `${height}px`;
    pauseDifficultyMenu.style.setProperty("left", `${left}px`, "important");
    pauseDifficultyMenu.style.setProperty("top", `${top}px`, "important");
}
window.addEventListener("resize", positionPauseDifficultyMenu);

function closemainDifficultyMenu() {
    newOverlay.hidden = true;
    requestAnimationFrame(() => {
        newOverlay.classList.remove("show");
    });
}

function hidenewgame() {
    closemainDifficultyMenu()
}

function toggleDifficultyMenu() {
    if (menuOpen) {
        closeDifficultyMenu();
    } else {
        openDifficultyMenu();
    }
}

function togglemainDifficultyMenu() {
    if (mainmenuOpen) {
        closemainDifficultyMenu();
    } else {
        openmainDifficultyMenu();
    }
}

function togglewinDifficultyMenu() {
    if (winmenuOpen) {
        closewinDifficultyMenu();
    } else {
        openwinDifficultyMenu();
    }
}

function togglepauseDifficultyMenu() {
    if (pausemenuOpen) {
        closepauseDifficultyMenu();
    } else {
        openpauseDifficultyMenu();
    }
}

function updateDifficultyMenu() {
    difficultyMenu.querySelectorAll(".menu-item").forEach((item) => {
        item.setAttribute("aria-selected", item.dataset.difficulty === difficulty ? "true" : "false");
    });
}

function updatemainDifficultyMenu() {
    return
}

function updatewinDifficultyMenu() {
    windifficultyMenu.querySelectorAll(".menu-item").forEach((item) => {
        item.setAttribute("aria-selected", item.dataset.difficulty === difficulty ? "true" : "false");
    });
}

function updatepauseDifficultyMenu() {
    pauseDifficultyMenu.querySelectorAll(".menu-item").forEach((item) => {
        item.setAttribute("aria-selected", item.dataset.difficulty === difficulty ? "true" : "false");
    });
}
let nosave = false;

function deletesavefile() {
    deleteSaveById(activeSaveId);
}

function deletesave() {
    deletesavefile();
}

function delsave() {
    deletesave();
}

function delsavefile() {
    delsave();
}

function deleteSaveById(id) {
    try {
        if (saveManager && id && id !== "legacy") {
            const deletingActive = id === activeSaveId;
            const result = saveManager.remove(id);
            if (!result.removed) return;
            activeSaveId = result.activeId;
            if (deletingActive) {
                runninggame = false;
                clearInterval(timerId);
            }
            const activeSave = activeSaveId ? saveManager.get(activeSaveId) : null;
            if (activeSave) {
                syncLegacySave(activeSave);
            } else {
                localStorage.removeItem("save");
            }
        } else {
            localStorage.removeItem("save");
            activeSaveId = null;
        }
        renderSaveCards();
    } catch (error) {
        reportSaveError(error);
    }
}

function loadtheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
        pageMode = savedTheme;

        document.body.classList.remove("light", "dark");
        document.body.classList.add(pageMode);

		if (modeButton) {
			modeButton.innerHTML = pageMode === "dark"
				? '<svg style="transform:translatey(1px)" viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4" style="fill: currentColor;"></circle><path d="M12 2V4"></path><path d="M12 20V22"></path><path d="M4.93 4.93L6.34 6.34"></path><path d="M17.66 17.66L19.07 19.07"></path><path d="M2 12H4"></path><path d="M20 12H22"></path><path d="M4.93 19.07L6.34 17.66"></path><path d="M17.66 6.34L19.07 4.93"></path></svg>'
				: '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.5C19.4 15.05 18.16 15.35 16.85 15.35C12.33 15.35 8.65 11.67 8.65 7.15C8.65 5.84 8.95 4.6 9.5 3.5C5.6 4.45 2.7 7.97 2.7 12.15C2.7 17.06 6.68 21.05 11.6 21.05C15.78 21.05 19.55 18.4 20.5 14.5Z"></path></svg>';
		}
    }

    // ---------------- TIMER UI ----------------
	winTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
	pauseTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
	continueTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
	timerEl.textContent = formatTime(Math.floor(elapsedMs / 1000));
    pauseMistakes.textContent = formatTime(Math.floor(elapsedMs / 1000));
    continueMistakes.textContent = formatTime(Math.floor(elapsedMs / 1000));
}

function updateGiveUpButton() {
	const igiveup = document.getElementById("igiveup")
	const exportbutton = document.getElementById("exportbutton")
	
    igiveup.classList.remove("disabled");
    igiveup.disabled = false;
    let hasExportableSaves = false;
    try {
        hasExportableSaves = getExportableSaves().length > 0;
    } catch (error) {
        reportSaveError(error);
    }
	exportbutton.classList.toggle("disabled", !hasExportableSaves);
	exportbutton.disabled = !hasExportableSaves;
	
    if (nosave) {
        igiveup.title = "Open saved games or start a new one."
    };
	if (!nosave) {
		igiveup.title = "Open your saved games or start a new one."
	}
    exportbutton.title = hasExportableSaves
        ? "Choose a saved game to export."
        : "No saved games are available to export.";
}
if (saveManager) {
    try {
        saveManager.migrateLegacy();
        activeSaveId = saveManager.activeId();
        const activeSave = activeSaveId ? saveManager.get(activeSaveId) : null;
        if (activeSave) syncLegacySave(activeSave);
    } catch (error) {
        reportSaveError(error);
    }
}
loadgame();
loadtheme();

function continueGame() {
    printBtn.style.display = "";
	disableprint = false
    hideBestTime();
    updatePauseBtn2();
    usingsavegame = true;
    
    if (savehintcount > 0) {
        hintcount = savehintcount
        cooldowntime = 0
        cooldownmoves = 0
        canusecurrenthintsystem = true
    } else {
        hintcount = 0;
        starthintcooldown()
    }
	// update soo many ui elements and stuff on continuing a game
    updateHintCooldownDisplay();
    const completedSave = viewingCompletedSave && finished;
    runninggame = !completedSave;
    hidemainmenu();
    pauseBtn2.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M2 4C2 2.9 2.9 2 4 2H8C9.1 2 10 2.9 10 4V20C10 21.1 9.1 22 8 22H4C2.9 22 2 21.1 2 20Z"/><path d="M14 4C14 2.9 14.9 2 16 2H20C21.1 2 22 2.9 22 4V20C22 21.1 21.1 22 20 22H16C14.9 22 14 21.1 14 20Z"/></svg>';
	document.title = `Ceedoku - ${getDifficultyLabel()}`;
    difficultyBadge.textContent = getDifficultyLabel();
	winTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
	pauseTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
	continueTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
	timerEl.textContent = formatTime(Math.floor(elapsedMs / 1000));
    pauseMistakes.textContent = mistakes
    continueMistakes.textContent = mistakes
    if (completedSave) {
        timerPaused = true;
        clearInterval(timerId);
        pauseBtn2.style.display = "none";
        completedSaveBack.style.display = "";
    } else {
        viewingCompletedSave = false;
        completedSaveBack.style.display = "none";
        timerPaused = false;
        startTimer();
    }
    hidewinscreen();
    hidepausescreen();
    closepauseDifficultyMenu();
    closemainDifficultyMenu()
    hidecontinuegame();
    renderBoard()
}

setInterval(saveGame, 1000);

async function newGame(
    nextDifficulty = difficulty,
    customOptions = difficulty === "custom" ? customDifficulty : null
) {
    saveGame();
    runninggame = false;
    viewingCompletedSave = false;
    completedSaveBack.style.display = "none";
    clearInterval(timerId);
    activeSaveId = null;
    printBtn.style.display = "";
	disableprint = false
    hideBestTime();
    updatePauseBtn2();
    nosave = false
    cooldowntypetouse = settings.hints.cooldown.cooldowntype
    usingsavegame = false;
    cooldownmoves = 0;
    cooldowntime = 0;
    hintcounter = 0;
    hintlimitreached = false
    hintcount = settings.hints.cooldown.startinghints;
    canusecurrenthintsystem = true

    if (settings.hints.cooldown.startinghints === 0) {
        starthintcooldown()
    }

    finished = false
    difficulty = nextDifficulty;
    customDifficulty = difficulty === "custom" && customOptions
        ? {
            holes: Math.max(1, Math.min(55, Math.trunc(Number(customOptions.holes) || 1))),
            toolsEnabled: customOptions.toolsEnabled !== false
        }
        : null;
    localStorage.setItem("difficulty", difficulty);

    if (difficulty === "godlike" || (difficulty === "custom" && !customDifficulty?.toolsEnabled)) {
        canusehelp = false
        pencilMode = false
        eraseMode = false
    } else {
        canusehelp = true
    }
    testhistorybuttons();
    testHintButton();

    updateHintCooldownDisplay();

    if (window.matchMedia("(orientation: landscape)").matches) {
        let scaleValue = difficulty === "impossible" ? "1.2" : "1.3";
        document.querySelectorAll(".win-stat-scaled").forEach(el => el.style.setProperty("--win-stat-size", scaleValue));
    }

    const built = await makePuzzle(customDifficulty ? customDifficulty.holes : DIFFICULTIES[difficulty].holes);
    if (customDifficulty) {
        customDifficulty.holes = built.draft.filter(value => value === 0).length;
    }

    document.title = `Ceedoku - ${getDifficultyLabel()}`;
    difficultyBadge.textContent = getDifficultyLabel();
    solution = built.full;
    puzzle = built.draft;
    values = [...puzzle];
    givens = puzzle.map(v => v !== 0);
    notes = Array.from({
        length: 81
    }, () => new Set());

    selected = values.findIndex(v => v === 0);
    if (selected === -1) selected = 40;

    mistakes = 0;

    elapsedMs = 0;
    timerPaused = false;
    startTime = 0;
    clearInterval(timerId);

    undoStack = [];
    redoStack = [];

    runninggame = true;
    if (saveManager && (difficulty !== "custom" || (Number.isInteger(customDifficulty?.holes) && customDifficulty.holes >= 1 && customDifficulty.holes <= 64))) {
        try {
            const record = saveManager.add(
                saveGameData(),
                "New game"
            );
            activeSaveId = record.id;
            syncLegacySave(record);
        } catch (error) {
            reportSaveError(error);
        }
    }

    renderBoard();

    timerEl.textContent = "00:00";
    winTime.textContent = "00:00";
    pauseTime.textContent = "00:00";
    continueTime.textContent = "00:00"
    pauseBtn2.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor"><path d="M2 4C2 2.9 2.9 2 4 2H8C9.1 2 10 2.9 10 4V20C10 21.1 9.1 22 8 22H4C2.9 22 2 21.1 2 20Z"/><path d="M14 4C14 2.9 14.9 2 16 2H20C21.1 2 22 2.9 22 4V20C22 21.1 21.1 22 20 22H16C14.9 22 14 21.1 14 20Z"/></svg>';
    title.textContent = "Ceedoku"
    hidewinscreen();
    hidepausescreen();
    closepauseDifficultyMenu();
    closemainDifficultyMenu()
    startTimer();
    hidecontinuegame();
    hidePlayMenu();
    hidemainmenu();
    document.getElementById("igiveup").classList.remove("disabled", !nosave);
    testhistorybuttons();
}


function fitWinStatText() {
    document.querySelectorAll(".win-stat-scaled > h2").forEach(heading => {
        heading.style.fontSize = "";

        const panel = heading.parentElement;
        const panelStyle = getComputedStyle(panel);
        const availableWidth = panel.clientWidth
            - Number.parseFloat(panelStyle.paddingLeft)
            - Number.parseFloat(panelStyle.paddingRight);

        if (!availableWidth || heading.scrollWidth <= availableWidth) return;

        const baseFontSize = Number.parseFloat(getComputedStyle(heading).fontSize);
        let low = 8;
        let high = baseFontSize;

        for (let i = 0; i < 14; i++) {
            const fontSize = (low + high) / 2;
            heading.style.fontSize = `${fontSize}px`;

            if (heading.scrollWidth <= availableWidth) {
                low = fontSize;
            } else {
                high = fontSize;
            }
        }

        heading.style.fontSize = `${low}px`;
    });
}

const winStatResizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(fitWinStatText);
});

document.querySelectorAll(".win-stat-scaled").forEach(panel => {
    winStatResizeObserver.observe(panel);
});

const winStatTextObserver = new MutationObserver(() => {
    requestAnimationFrame(fitWinStatText);
});

document.querySelectorAll(".win-stat-scaled > h2").forEach(heading => {
    winStatTextObserver.observe(heading, {
        childList: true,
        characterData: true,
        subtree: true
    });
});

window.addEventListener("resize", fitWinStatText);
requestAnimationFrame(fitWinStatText);


renderNumberPad();


undoButton.addEventListener("click", () => {
    if (timerPaused) return;
    undo();
});

redoButton.addEventListener("click", () => {
    if (timerPaused) return;
    redo();
});

hintButton.addEventListener("click", () => {
    if (!canusehelp) return;
    if (timerPaused) return;
    hint();
});

eraseButton.addEventListener("click", () => {
    if (!canusehelp || !settings.tools.enabled || !settings.tools.erase.enabled) return;
    if (timerPaused) return;
    toggleEraseMode();
});

pencilButton.addEventListener("click", () => {
    if (timerPaused) return;
    if (!canusehelp || !settings.tools.enabled || !settings.tools.pencil.enabled) return;
    togglePencilMode();
});
newGameButton.addEventListener("click", () => newGame());
winNewGameButton.addEventListener("click", () => newGame());
pauseNewGameButton.addEventListener("click", () => newGame());
difficultyToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleDifficultyMenu();
});
winDifficultyToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    togglewinDifficultyMenu();
});
pauseDifficultyToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    togglepauseDifficultyMenu();
});
difficultyMenu.addEventListener("click", (event) => {
    const item = event.target.closest(".menu-item");
    if (!item) return;
    if (item.dataset.difficulty === "custom") {
        closeDifficultyMenu();
        openCustomDifficultyMenu();
        return;
    }
    newGame(item.dataset.difficulty);
});
pausedifficultyMenu.addEventListener("click", (event) => {
    const item = event.target.closest(".menu-item");
    if (!item) return;
    closepauseDifficultyMenu();
    if (item.dataset.difficulty === "custom") {
        openCustomDifficultyMenu();
        return;
    }
    newGame(item.dataset.difficulty);
});
winDifficultyMenu.addEventListener("click", (event) => {
    const item = event.target.closest(".menu-item");
    if (!item) return;
    if (item.dataset.difficulty === "custom") {
        closewinDifficultyMenu();
        openCustomDifficultyMenu();
        return;
    }
    newGame(item.dataset.difficulty);
});


mainDifficultyMenu.addEventListener("click", (event) => {
    const item = event.target.closest(".menu-item");

    if (!item) return;

    if (item.dataset.difficulty === "custom") {
        openCustomDifficultyMenu();
        return;
    }

    document.querySelectorAll(".menu-item").forEach(i => {
        i.setAttribute("aria-selected", "false");
    });


    item.setAttribute("aria-selected", "true");

    selectedDifficulty = item.dataset.difficulty;

    localStorage.setItem("difficulty", selectedDifficulty);
    const bestTimes = JSON.parse(localStorage.getItem("besttimes")) || {};
    const bestTime = bestTimes[selectedDifficulty];

    document.getElementById("besttimedisplay").textContent = typeof bestTime === "number" ? formatTime(Math.floor(bestTime / 1000)) : "**:**";
});

function continuenewGame() {
    newGame(selectedDifficulty);
}

document.addEventListener("click", (event) => {
    if (!winnewGameBand.contains(event.target)) {
        closeDifficultyMenu();
    }

    if (timerPaused) return;
});

let capturingKeybindAction = null;
let keyBindings = CeedokuKeybindManager.defaults();
try {
    keyBindings = CeedokuKeybindManager.load(localStorage);
} catch (error) {
    reportSaveError(error);
}

function renderKeybinds() {
    const list = document.getElementById("keybindList");
    if (!list) return;
    list.replaceChildren();

    const actions = Object.values(CeedokuKeybindManager.defaults());
    actions.forEach((action, index) => {
        const row = document.createElement("div");
        row.className = "setting-row keybind-row";
        const label = document.createElement("span");
        label.className = "setting-name keybind-label";
        const labelText = document.createElement("strong");
        labelText.textContent = action.label;
        label.appendChild(labelText);
        const controls = document.createElement("div");
        controls.className = "keybind-controls";
        const assign = document.createElement("button");
        assign.type = "button";
        assign.className = "keybind-assign";
        assign.setAttribute("aria-label", `${action.label}: ${CeedokuKeybindManager.display(keyBindings[action.id])}. Click to change binding.`);
        CeedokuKeybindManager.displayParts(keyBindings[action.id]).forEach((part, partIndex) => {
            if (partIndex > 0) assign.appendChild(document.createTextNode(" + "));
            const keycap = document.createElement("kbd");
            keycap.className = "font-mono";
            keycap.textContent = part;
            assign.appendChild(keycap);
        });
        assign.addEventListener("click", () => {
            capturingKeybindAction = action.id;
            assign.classList.add("listening");
            assign.textContent = "Press a key…";
            assign.setAttribute("aria-label", `Press a key for ${action.label}.`);
            showNotification(`Press a key for ${action.label}.`);
        });
        const reset = document.createElement("button");
        reset.type = "button";
        reset.className = "keybind-reset";
        reset.setAttribute("aria-label", `Reset ${action.label} to its default`);
        reset.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--text)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g transform="translate(24 0) scale(-1 1)"><path d="M17 19H9.9A5.5 5.5 0 0 1 9.9 8H19"></path><path d="M14 4L19 9L14 14"></path></g></svg>`;
        reset.title = `Reset ${action.label} to its default`;
        reset.addEventListener("click", () => {
            const result = CeedokuKeybindManager.reset(keyBindings, action.id);
            if (!result.ok) {
                const conflictingAction = CeedokuKeybindManager.defaults()[result.conflict?.[0]];
                showNotification(conflictingAction
                    ? `Cannot reset ${action.label}: its default key is assigned to ${conflictingAction.label}.`
                    : `Cannot reset ${action.label} until its default key is available.`);
                return;
            }
            keyBindings = result.bindings;
            saveKeybinds();
            renderKeybinds();
            showNotification(`${action.label} reset.`);
        });
        controls.append(assign, reset);
        row.append(label, controls);
        list.appendChild(row);
        if (index < actions.length - 1) {
            const divider = document.createElement("hr");
            divider.className = "keybind-divider";
            list.appendChild(divider);
        }
    });

    const resetAll = document.getElementById("resetAllKeybinds");
    resetAll.onclick = () => {
        keyBindings = CeedokuKeybindManager.resetAll();
        saveKeybinds();
        renderKeybinds();
        showNotification("All keyboard bindings reset.");
    };
}

function saveKeybinds() {
    try {
        CeedokuKeybindManager.save(localStorage, keyBindings);
    } catch (error) {
        reportSaveError(error);
    }
}

function handleKeybindCapture(event) {
    if (!capturingKeybindAction) return false;
    event.preventDefault();
    if (event.code === "Escape") {
        capturingKeybindAction = null;
        renderKeybinds();
        showNotification("Binding assignment cancelled.");
        return true;
    }

    const result = CeedokuKeybindManager.assign(keyBindings, capturingKeybindAction, {
        key: event.code,
        primary: Boolean(event.ctrlKey || event.metaKey),
        alt: Boolean(event.altKey),
        shift: Boolean(event.shiftKey)
    });
    if (!result.ok) {
        const message = result.reason === "conflict"
            ? `That key is already assigned to ${CeedokuKeybindManager.defaults()[result.conflict[0]].label}.`
            : result.reason === "reserved-key"
                ? "That key combination is reserved by your browser or operating system."
                : "That key cannot be assigned.";
        showNotification(message);
        return true;
    }

    const action = capturingKeybindAction;
    keyBindings = result.bindings;
    capturingKeybindAction = null;
    saveKeybinds();
    renderKeybinds();
    showNotification(
        `${CeedokuKeybindManager.defaults()[action].label} updated to ${CeedokuKeybindManager.display(keyBindings[action])}.`
    );
    return true;
}

function isEditableKeyboardTarget(target) {
    return target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

document.addEventListener("keydown", (event) => {
    if (handleKeybindCapture(event)) return;
    if (isEditableKeyboardTarget(event.target)) return;

    const action = CeedokuKeybindManager.ACTIONS.find(id =>
        CeedokuKeybindManager.eventMatches(event, keyBindings[id])
    );
    if (!action) return;

    event.preventDefault();
    if (action === "print") {
        if (disableprint) {
            showNotification("Print mode cannot be used when a game is not active", 5000);
        } else {
            window.print();
        }
        return;
    }
    if (action === "pause") {
        if (runninggame) pauseTimer();
        return;
    }
    if (!runninggame || timerPaused) return;

    if (action === "undo") {
        if (canusehelp) undo();
    } else if (action === "redo" || action === "redo-alt") {
        if (canusehelp && settings.tools.enabled && settings.tools.history.enabled) redo();
    } else if (action === "pencil") {
        if (canusehelp && settings.tools.enabled && settings.tools.pencil.enabled) togglePencilMode();
    } else if (action === "hint") {
        if (canusehelp) hint();
    } else if (action === "erase-mode") {
        if (canusehelp && settings.tools.enabled && settings.tools.erase.enabled) toggleEraseMode();
    } else if (action.startsWith("number-")) {
        placeNumber(Number(action.slice("number-".length)));
    } else if (action.startsWith("erase-")) {
        if (canusehelp && settings.tools.enabled && settings.tools.erase.enabled) eraseSelected();
    } else if (action.startsWith("move-")) {
        const row = Math.floor(selected / 9);
        const col = selected % 9;
        const direction = action.slice("move-".length);
        const nextRow = direction === "up" ? (row + 8) % 9
            : direction === "down" ? (row + 1) % 9 : row;
        const nextCol = direction === "left" ? (col + 8) % 9
            : direction === "right" ? (col + 1) % 9 : col;
        selectCell(nextRow * 9 + nextCol);
    }
});

function deleteGame() {
    deleteSaveById(pendingDeleteSaveId || activeSaveId);
    pendingDeleteSaveId = null;
    deleteOverlay.classList.remove("show");
}

const elementstoanimate = document.querySelectorAll(".whatdoievencallthis");

const observer = new MutationObserver(() => {
    const isDark = document.body.classList.contains("dark");

    elementstoanimate.forEach(element => {
        element.animate(
            isDark ? [{
                    filter: "brightness(0.1)"
                },
                {
                    filter: "brightness(1)"
                }
            ] : [{
                    filter: "brightness(1)"
                },
                {
                    filter: "brightness(0.1)"
                }
            ], {
                duration: 200,
                easing: "ease",
                fill: "forwards"
            }
        );
    });
});

const isDark2 = document.body.classList.contains("dark");
elementstoanimate.forEach(element => {
    element.animate(
        isDark2 ? [{
                filter: "brightness(0.1)"
            },
            {
                filter: "brightness(1)"
            }
        ] : [{
                filter: "brightness(1)"
            },
            {
                filter: "brightness(0.1)"
            }
        ], {
            duration: 200,
            easing: "ease",
            fill: "forwards"
        }
    );
});
observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"]
});
pauseBtn2.style.display = "none"
const defaultItem = document.querySelector(`#maindifficultyMenu .menu-item[data-difficulty="${selectedDifficulty}"]`);
defaultItem.setAttribute("aria-selected", "true");
const bestTimesa = JSON.parse(localStorage.getItem("besttimes")) || {};
const bestTimea = bestTimesa[selectedDifficulty];

document.getElementById("besttimedisplay").textContent =
    typeof bestTimea === "number" ? formatTime(Math.floor(bestTimea / 1000)) : "**:**";
renderKeybinds();
exportnamemenuinput.addEventListener("input", () => {
    if (exportnamemenuinput.value === "") {
		document.getElementById("savenamebutton").classList.add("disabled")
		document.getElementById("savenamebutton").disabled = true
		return
	}
	if (exportnamemenuinput.value != "") {
		document.getElementById("savenamebutton").classList.remove("disabled")
		document.getElementById("savenamebutton").disabled = false
		return
	}
});
if (exportnamemenuinput.value === "") {
	document.getElementById("savenamebutton").classList.add("disabled")
	document.getElementById("savenamebutton").disabled = true
}
exportnamemenuinput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        if (!exportnamemenuinput.disabled && exportnamemenuinput.value !== "") {
            exportsavename();
        }
    }
});

function setcooldownvalue(input) {
    const type = input === "move" ? "move" : input === "time" ? "time" : null;
    if (!type) return;
    hintCooldownMethod.value = type;
    settings.hints.cooldown.cooldowntype = type;
    hintselectvaluetext.textContent = type === "move" ? "Move-Based" : "Time-Based";
    hintselectbox.classList.remove("open");
    hintselectvalue.classList.remove("opening");
    saveSettings();
    updateSettingsMenu();
}
		
