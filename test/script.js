/******************************************************************************
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
 ******************************************************************************/

			  const mainmenu = document.getElementById("mainmenu");	
	let runninggame = false	        
              let menuOpen = false;			  
					  function showmainmenu() {

            mainmenu.hidden = false;
        
            requestAnimationFrame(() => {
                mainmenu.classList.add("show");
            });
        }

              const DIFFICULTIES = {easy: { label: "Easy", holes: 36 },medium: { label: "Medium", holes: 44 },hard: { label: "Hard", holes: 51 },expert: { label: "Expert", holes: 58 }};

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
              const eraseButton = document.getElementById("eraseButton");
              const pencilButton = document.getElementById("pencilButton");
	      const pauseBtn = document.getElementById("pause-btn");
	      const modeButton = document.getElementById("mode");			  

			  
              const mistakeStatus = document.getElementById("mistakeStatus");
              const emptyStatus = document.getElementById("emptyStatus");
              const timerEl = document.getElementById("timer");
	      const title = document.getElementById("title");
              const numberGrid = document.getElementById("numberGrid");	

	      const deleteOverlay = document.getElementById("deleteOverlay")
	     const fullscreenButton = document.getElementById("fullscreen")
        
              let solution = [];
              let puzzle = [];
              let values = [];
              let givens = [];
              let notes = [];
              let selected = 40;
              let difficulty = "easy";
              document.title = `Ceedoku - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
              let pencilMode = false;
              let eraseMode = false;
              let mistakes = 0;
              let elapsed = 0;
              let undoStack = [];
              let redoStack = [];
              let finished = false;


			  let winmenuOpen = false;
			let pausemenuOpen = false;
			let pageMode = localStorage.getItem("theme") || "dark";
              function showWinScreen() {
            winDifficulty.textContent =
                difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
		
			
            winMistakes.textContent = mistakes;
            winOverlay.hidden = false;
        
            requestAnimationFrame(() => {
                winOverlay.classList.add("show");
            });
        }
			function showPauseScreen() {
            pauseDifficulty.textContent =
                difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
		
			
            pauseMistakes.textContent = mistakes;
            pauseOverlay.hidden = false;
        
            requestAnimationFrame(() => {
                pauseOverlay.classList.add("show");
            });
        }
const isAndroidPWA =
  /Android/i.test(navigator.userAgent) &&
  (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches
  );

if (isAndroidPWA && fullscreenButton) {
  fullscreenButton.style.width = "0";
  fullscreenButton.style.height = "0";
  fullscreenButton.style.visibility = "hidden";
}
function fullscreen() {
  if (!fullscreenButton) return;

  if (document.fullscreenElement) {
    document.exitFullscreen();
    fullscreenButton.textContent = "❮ ❯";
  } else {
    document.documentElement.requestFullscreen();
    fullscreenButton.textContent = "❯ ❮";
  }
}
document.addEventListener("fullscreenchange", () => {
  if (!fullscreenButton) return;

  fullscreenButton.textContent = document.fullscreenElement
    ? "❯ ❮"
    : "❮ ❯";
});

					function showcontinueGame() {
					if(nosave)return
            continueDifficulty.textContent =
                difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
		
			
            continueMistakes.textContent = mistakes;
            continueOverlay.hidden = false;
        
            requestAnimationFrame(() => {
                continueOverlay.classList.add("show");
            });
        }

					function showdeleteGame() {
            deleteOverlay.hidden = false;
        
            requestAnimationFrame(() => {
                deleteOverlay.classList.add("show");
            });
        }

function changemode(forceMode) {
    console.log("changemode function called");

    if (forceMode) {
        pageMode = forceMode;
    } else {
        // otherwise toggle
        pageMode = (pageMode === "light") ? "dark" : "light";
    }

    console.log("mode is now:", pageMode);

    document.body.classList.remove("light", "dark");
    document.body.classList.add(pageMode);

    localStorage.setItem("theme", pageMode);

    if (modeButton) {
        modeButton.innerHTML = pageMode === "dark" ? "☀" : "<b>☾</b>";
    }
}
        
              const rows = Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => r * 9 + c));
              const cols = Array.from({ length: 9 }, (_, c) => Array.from({ length: 9 }, (_, r) => r * 9 + c));
              const boxes = Array.from({ length: 9 }, (_, b) => {
                const startRow = Math.floor(b / 3) * 3;
                const startCol = (b % 3) * 3;
                return Array.from({ length: 9 }, (_, i) => (startRow + Math.floor(i / 3)) * 9 + startCol + (i % 3));
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
                const full = Array(81).fill(0);
                fillGrid(full);
                const draft = [...full];
                const order = shuffle(Array.from({ length: 81 }, (_, i) => i));
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
        
                return { full, draft };
              }
        
              function formatTime(seconds) {
                const minutes = Math.floor(seconds / 60);
                const secs = seconds % 60;
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
		winTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
		pauseTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
		continueTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
        timerEl.textContent =
            `Time: ${formatTime(Math.floor(elapsedMs / 1000))}`;
    }, 100);
};
function pauseTimer() {
    if (!timerPaused) {
        // PAUSE
        timerPaused = true;

        clearInterval(timerId);

        elapsedMs = Date.now() - startTime;

        pauseBtn.textContent = "▶";
        document.title = "Ceedoku - Paused";

        if (runninggame){saveGame()};
		showPauseScreen()
    } else {
        // RESUME
        timerPaused = false;

        startTimer();

        pauseBtn.textContent = "❚❚";
        document.title = `Ceedoku - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`
		hidepausescreen()
    }
}
			window.addEventListener("visibilitychange", lostfocuspause)
			function lostfocuspause() {
				if (runninggame) {
		if (!timerPaused) {
	    console.log('Window lost focus; paused game');
        timerPaused = true;

        clearInterval(timerId);

        elapsedMs = Date.now() - startTime;

        pauseBtn.textContent = "▶";
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

        pauseBtn.textContent = "▶";
        document.title = "Ceedoku - Paused";
		}
};
			function resumeTimer() {
    if (!timerPaused) return;

    timerPaused = false;

    startTimer();

    pauseBtn.textContent = "❚❚";
    document.title = `Ceedoku - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`
	hidepausescreen()
}
        
              function renderBoard() {
                boardEl.innerHTML = "";
        
                for (let i = 0; i < 81; i += 1) {
        
                  const cell = document.createElement("button");
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
        
            updateNumberCounts();
            updateStatus();
            updateHistoryButtons();
		if (runninggame){saveGame()}
        }
function saveGame() {
if (runninggame){
    if (solution.length !== 81) return;
    localStorage.setItem("save", JSON.stringify({
        solution,
        puzzle,
        values,
        givens,
        notes: notes.map(set => [...set]),
        selected,
        difficulty,
        pencilMode,
        eraseMode,
        mistakes,
        elapsedMs,
        timerPaused,
        undoStack,
        redoStack,
        finished,
        pageMode
    }));
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
                  if (!sameCellState(before, after)) changes.push({ index, before, after });
                });
                return changes;
              }
        
              function pushChanges(changes, activeIndex = selected) {
                if (!changes.length) return;
                undoStack.push({ selected: activeIndex, changes });
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

            winDifficulty.textContent =
                difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        
            winTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
            winMistakes.textContent = mistakes;
        
            winOverlay.hidden = false;
        
            requestAnimationFrame(() => {
                winOverlay.classList.add("show");
            });
        
        }
						function showPauseScreen() {
            pauseDifficulty.textContent =
                difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
		
			
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
		        function hidedeleteGame() {
            deleteOverlay.classList.remove("show");


        }
				        function hidemainmenu() {
            mainmenu.classList.remove("show");
        

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
			  if (timerPaused) { return };
                if (finished || givens[selected]) return;
                if (eraseMode) {
                   toggleEraseMode(false);
                }
                const beforeStates = new Map([[selected, cellSnapshot(selected)]]);
        
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
              }
        
              function eraseSelected() {
                if (finished || givens[selected]) return;
                if (values[selected] === 0 && notes[selected].size === 0) return;
                const beforeStates = new Map([[selected, cellSnapshot(selected)]]);
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

function getCandidates(index) {
  if (values[index] !== 0) return [];

  const row = Math.floor(index / 9);
  const col = index % 9;
  const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);

  const used = new Set();

  for (const i of rows[row]) {
    if (i !== index && values[i]) used.add(values[i]);
  }

  for (const i of cols[col]) {
    if (i !== index && values[i]) used.add(values[i]);
  }

  for (const i of boxes[box]) {
    if (i !== index && values[i]) used.add(values[i]);
  }

  const candidates = [];

  for (let n = 1; n <= 9; n++) {
    if (!used.has(n)) {
      candidates.push(n);
    }
  }

  return candidates;
}

function findNakedSingle(index) {
  const candidates = getCandidates(index);

  if (candidates.length === 1) {
    return {
      index,
      value: candidates[0]
    };
  }

  return null;
}

function findHiddenSingleForCell(index) {

  // Ignore cells that already have a value.
  if (givens[index] || values[index] !== 0) {
    return null;
  }

  // Find every number that this cell could legally contain.
  const candidates = getCandidates(index);

  // Work out which row, column and box this cell belongs to.
  const row = rows[Math.floor(index / 9)];
  const col = cols[index % 9];
  const box = boxes[Math.floor(index / 27) * 3 + Math.floor((index % 9) / 3)];

  // Check each candidate separately.
  for (const number of candidates) {

    // ---------- ROW ----------
    let rowUnique = true;

    for (const other of row) {

      // Don't compare the cell to itself.
      if (other === index) continue;

      // Ignore filled cells.
      if (values[other] !== 0) continue;

      // If another cell can also be this number,
      // then this isn't unique in the row.
      if (getCandidates(other).includes(number)) {
        rowUnique = false;
        break;
      }
    }

    if (rowUnique) {
      return {
        index,
        value: number
      };
    }

    // ---------- COLUMN ----------
    let colUnique = true;

    for (const other of col) {

      if (other === index) continue;

      if (values[other] !== 0) continue;

      if (getCandidates(other).includes(number)) {
        colUnique = false;
        break;
      }
    }

    if (colUnique) {
      return {
        index,
        value: number
      };
    }

    // ---------- BOX ----------
    let boxUnique = true;

    for (const other of box) {

      if (other === index) continue;

      if (values[other] !== 0) continue;

      if (getCandidates(other).includes(number)) {
        boxUnique = false;
        break;
      }
    }

    if (boxUnique) {
      return {
        index,
        value: number
      };
    }
  }

  // None of this cell's candidates were hidden singles.
  return null;
}

function findMoveForCell(index) {
  return (
    findNakedSingle(index) ||
    findHiddenSingleForCell(index) ||
    null
  );
}

function hint() {
  if (finished) return;

  let move = null;

  // Try the selected cell first
  if (
    selected !== null &&
    !givens[selected] &&
    values[selected] === 0
  ) {
    move = findMoveForCell(selected);
  }

  // Otherwise search the whole board
  if (!move) {
    for (let i = 0; i < 81; i++) {
      if (givens[i] || values[i] !== 0) continue;

      move = findMoveForCell(i);

      if (move) break;
    }
  }

  // No logical move found
  if (!move) return;

  const target = move.index;
  selected = target;

  const beforeStates = new Map([[target, cellSnapshot(target)]]);
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
             
        
              function updateHistoryButtons() {
                undoButton.disabled = undoStack.length === 0;
                redoButton.disabled = redoStack.length === 0;
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

        const cell = boardEl.querySelector(`[data-index="${index}"]`);
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

        const animationKind =
            kind === "board"
                ? "board"
                : kind;

        const effect = document.createElement("div");

        effect.className = `complete-effect ${animationKind}`;

        effect.style.setProperty(
            "--sweep-delay",
            `${distance * 60}ms`
        );

        effect.style.setProperty(
            "--fade-delay",
            `${fadeDelay}ms`
        );

        cell.appendChild(effect);

        effect.addEventListener("animationend", (e) => {

            // Remove after the fade finishes.
            if (e.animationName !== "rippleFade") return;

            effect.remove();

        });

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

    boardEl.querySelectorAll(".cell").forEach((cell, index) => {

        cell.classList.remove("complete-sweep", "board");

        cell.style.setProperty(
            "--sweep-delay",
            `${distances[index] * 60}ms`
        );

        requestAnimationFrame(() => {
            cell.classList.add("complete-sweep", "column");
        });

        setTimeout(() => {
            cell.classList.remove("complete-sweep", "board");
            cell.style.removeProperty("--sweep-delay");
        }, 1000 + distances[index] * 60);
    });
}
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
        finished = true;   // <-- FIRST thing inside the win block
		winpauseTimer()
		
        clearInterval(timerId);

        playBoardRipple();

        const maxDistance = Math.max(...getBoardDistances(selected));

        setTimeout(showWinScreen, maxDistance * 60 + 900);
		function clearSave() {
    localStorage.removeItem("save");
	}
    }
}
function forcewin() {
		winpauseTimer()
        clearInterval(timerId);

        playBoardRipple();

        const maxDistance = Math.max(...getBoardDistances(selected));

        setTimeout(showWinScreen, maxDistance * 60 + 900);
		function clearSave() {
    localStorage.removeItem("save");
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
                maindifficultyMenu.classList.add("open");
                maindifficultyToggle.setAttribute("aria-expanded", "true");
                updatemainDifficultyMenu();
              }
			                function closewinDifficultyMenu() {
                winmenuOpen = false;
                winDifficultyMenu.classList.remove("open");
                winDifficultyToggle.setAttribute("aria-expanded", "false");
              }
						                function closepauseDifficultyMenu() {
                pausemenuOpen = false;
                pauseDifficultyMenu.classList.remove("open");
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
                pauseDifficultyMenu.classList.add("open");

                pauseDifficultyToggle.setAttribute("aria-expanded", "false");
                updatepauseDifficultyMenu();
              }
			  			              function openmainDifficultyMenu() {
                mainmenuOpen = true;
                mainDifficultyMenu.classList.add("open");

                mainDifficultyToggle.setAttribute("aria-expanded", "false");
                updatemainDifficultyMenu();
              }
			  			  			              function closemainDifficultyMenu() {
                mainmenuOpen = false;
                mainDifficultyMenu.classList.remove("open");

                mainDifficultyToggle.setAttribute("aria-expanded", "false");
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
                difficultyMenu.querySelectorAll(".menu-item").forEach((item) => {
                  item.setAttribute("aria-selected", item.dataset.difficulty === difficulty ? "true" : "false");
                });
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
function deletesavefile(){localStorage.removeItem("save");}
function deletesave(){deletesavefile();}
function delsave(){deletesave();}
function delsavefile(){delsave();}

function loadgame() {
    const save = localStorage.getItem("save");
	    if (save === null) {
        nosave = true;
		updateGiveUpButton();
        return;
		}
    const game = JSON.parse(save);
	   // ---------------- BOARD ----------------
    solution = game.solution;
if (solution.length !== 81){localStorage.removeItem("save");nosave=true;updateGiveUpButton();return;}
    puzzle = game.puzzle;
    values = game.values;
    givens = game.givens;
    notes = game.notes.map(arr => new Set(arr));

    selected = game.selected;
    difficulty = game.difficulty;
    pencilMode = game.pencilMode;
    eraseMode = game.eraseMode;
    mistakes = game.mistakes;

    undoStack = game.undoStack;
    redoStack = game.redoStack;

    // ---------------- TIMER ----------------
    elapsedMs = game.elapsedMs || 0;
    timerPaused = game.timerPaused || false;

    clearInterval(timerId);
    }
function loadtheme() {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme) {
        pageMode = savedTheme;

        document.body.classList.remove("light", "dark");
        document.body.classList.add(pageMode);

        if (modeButton) {
            modeButton.innerHTML = pageMode === "dark" ? "☀" : "<b>☾</b>";	
        }
}

	    // ---------------- TIMER UI ----------------
		winTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
        timerEl.textContent =
            `Time: ${formatTime(Math.floor(elapsedMs / 1000))}`;
	continueTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
	pauseTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
	pauseMistakes.textContent = formatTime(Math.floor(elapsedMs / 1000));
	continueMistakes.textContent = formatTime(Math.floor(elapsedMs / 1000));
}
function updateGiveUpButton() {
    document.getElementById("igiveup").classList.toggle("disabled", nosave);
    if(nosave){document.getElementById("igiveup").title = "No save found"};
}
loadgame();
loadtheme();		
			
function continueGame() {
runninggame = true;
hidemainmenu();
    pauseBtn.textContent = "❚❚"; 
    // ---------------- TIMER UI ----------------
		winTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
        timerEl.textContent =
            `Time: ${formatTime(Math.floor(elapsedMs / 1000))}`;
	continueTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
	pauseTime.textContent = formatTime(Math.floor(elapsedMs / 1000));
	pauseMistakes.textContent = formatTime(Math.floor(elapsedMs / 1000));
	continueMistakes.textContent = formatTime(Math.floor(elapsedMs / 1000));
    timerPaused = false;
	hidewinscreen();
    hidepausescreen();
    closepauseDifficultyMenu();
	closemainDifficultyMenu()
    startTimer();
	hidecontinuegame();
	renderBoard()
}

setInterval(saveGame, 5000);

function newGame(nextDifficulty = difficulty) {
    runninggame = true
    localStorage.removeItem("save");

    difficulty = nextDifficulty;

    const built = makePuzzle(DIFFICULTIES[difficulty].holes);

    document.title = `Ceedoku - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
difficultyBadge.textContent = DIFFICULTIES[difficulty].label;

    solution = built.full;
    puzzle = built.draft;
    values = [...puzzle];	
    givens = puzzle.map(v => v !== 0);
    notes = Array.from({ length: 81 }, () => new Set());

    selected = values.findIndex(v => v === 0);
    if (selected === -1) selected = 40;

    mistakes = 0;

    elapsedMs = 0;
    timerPaused = false;
    startTime = 0;
    clearInterval(timerId);

    undoStack = [];
    redoStack = [];

    renderBoard();

    timerEl.textContent = "Time: 00:00";
	winTime.textContent = "00:00";
	pauseTime.textContent = "00:00";
	continueTime.textContent = "00:00"
    pauseBtn.textContent = "❚❚";
	title.textContent = "Ceedoku"
    hidewinscreen();
    hidepausescreen();
    closepauseDifficultyMenu();
	closemainDifficultyMenu()
    startTimer();
	hidecontinuegame();
	hidemainmenu();
	document.getElementById("igiveup").classList.remove("disabled", !nosave);
}
        
        
        
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
    if (timerPaused) return;
    hint();
});

eraseButton.addEventListener("click", () => {
    if (timerPaused) return;
    toggleEraseMode();
});

pencilButton.addEventListener("click", () => {
    if (timerPaused) return;
    togglePencilMode();
});
              newGameButton.addEventListener("click", () => newGame());
              winNewGameButton.addEventListener("click", () => newGame());        
			              pauseNewGameButton.addEventListener("click", () => newGame()); 
              difficultyToggle.addEventListener("click", (event) => {event.stopPropagation();toggleDifficultyMenu();});
			  winDifficultyToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    togglewinDifficultyMenu();
});
						  pauseDifficultyToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    togglewinDifficultyMenu();
});
difficultyMenu.addEventListener("click", (event) => {
    console.log("listener fired");

    console.log("target:", event.target);

    const item = event.target.closest(".menu-item");
    console.log("item:", item);

    if (!item) return;

    console.log("difficulty:", item.dataset.difficulty);

    newGame(item.dataset.difficulty);

    console.log("after newGame");
});
			pausedifficultyMenu.addEventListener("click", (event) => {
    console.log("listener fired");

    console.log("target:", event.target);

    const item = event.target.closest(".menu-item");
    console.log("item:", item);

    if (!item) return;

    console.log("difficulty:", item.dataset.difficulty);

    newGame(item.dataset.difficulty);

    console.log("after newGame");
});
winDifficultyMenu.addEventListener("click", (event) => {
    console.log("listener fired");

    console.log("target:", event.target);

    const item = event.target.closest(".menu-item");
    console.log("item:", item);

    if (!item) return;

    console.log("difficulty:", item.dataset.difficulty);

    newGame(item.dataset.difficulty);

    console.log("after newGame");
});
mainDifficultyMenu.addEventListener("click", (event) => {
    console.log("listener fired");

    console.log("target:", event.target);

    const item = event.target.closest(".menu-item");
    console.log("item:", item);

    if (!item) return;

    console.log("difficulty:", item.dataset.difficulty);

    newGame(item.dataset.difficulty);

    console.log("after newGame");
});
              document.addEventListener("click", (event) => {
                if (!winnewGameBand.contains(event.target)) closeDifficultyMenu();
				if (timerPaused) return;
              });
document.addEventListener("keyup", (event) => {
    console.log(event.key);

    if (event.code === "Space") {
        event.preventDefault();
        pauseTimer();
    }
});
              document.addEventListener("keydown", (event) => {
			   if (timerPaused) return;
                console.log(event.key);
                const key = event.key.toLowerCase();
                if (key === "escape") {
                  closeDifficultyMenu();
                  closewinDifficultyMenu();
                  closepauseDifficultyMenu();
                  return;
                }
 
        
                if ((event.ctrlKey || event.metaKey) && key === "z") {
                  event.preventDefault();
                  if (event.shiftKey) redo();
                  else undo();
                  return;
                }
                if ((event.ctrlKey || event.metaKey) && key === "y") {
                  event.preventDefault();
                  redo();
                  return;
                }
                if (event.ctrlKey || event.metaKey) return;
        
                if (key === "p") {
                  event.preventDefault();
                  togglePencilMode();
                  return;
                }
        	if (key === "e") {
          	event.preventDefault();
         	toggleEraseMode();
        	return;
        	}
			 if (timerPaused) return;
                if (/^[1-9]$/.test(key)) placeNumber(Number(key));
                if (key === "backspace" || key === "delete" || key === "0") eraseSelected();
                if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) {
                  event.preventDefault();
                  const row = Math.floor(selected / 9);
                  const col = selected % 9;
                  const nextRow = key === "arrowup" ? Math.max(0, row - 1) : key === "arrowdown" ? Math.min(8, row + 1) : row;
                  const nextCol = key === "arrowleft" ? Math.max(0, col - 1) : key === "arrowright" ? Math.min(8, col + 1) : col;
                  selectCell(nextRow * 9 + nextCol);
                }
              });   
			  function forceAriaSelectedFalse() {
    const menu = document.getElementById("maindifficultyMenu");
    if (!menu) return;

    const observer = new MutationObserver(() => {
        menu.querySelectorAll('[aria-selected="true"]').forEach(button => {
            button.setAttribute("aria-selected", "false");
        });
    });

    observer.observe(menu, {
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-selected"]
    });

    // Also clear any that are already true
    menu.querySelectorAll('[aria-selected="true"]').forEach(button => {
        button.setAttribute("aria-selected", "false");
    });
}
forceAriaSelectedFalse();
function deleteGame() {
	delsave()
	location.reload()
}
setTimeout(() => {
    document.body.style.visibility = "visible";
}, 100);

