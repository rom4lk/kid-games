const ROW_COUNT = 3;
const COLUMN_COUNT = 7;
const RIVER_START_COLUMN = 2;
const RIVER_END_COLUMN = 4;
const STORAGE_KEY = "cubeIslandLevelsV1";
const SOUND_KEY = "cubeIslandSoundV1";

const TREE_DATA = [
  { id: "tree-top", row: 0, column: 0 },
  { id: "tree-middle", row: 1, column: 0 },
  { id: "tree-bottom", row: 2, column: 0 },
];

const LEVELS = [
  {
    id: "bridge",
    name: "Build a bridge",
    completionTitle: "Bridge built!",
    completionText: "The bunny can cross now.",
    targetCells: [
      { row: 1, column: 2 },
      { row: 1, column: 3 },
      { row: 1, column: 4 },
    ],
  },
  {
    id: "dock",
    name: "Build a dock",
    completionTitle: "Dock built!",
    completionText: "The boat has a safe stop.",
    targetCells: [
      { row: 1, column: 2 },
      { row: 1, column: 3 },
      { row: 0, column: 3 },
      { row: 2, column: 3 },
    ],
  },
  {
    id: "raft",
    name: "Build a raft",
    completionTitle: "Raft built!",
    completionText: "The raft is ready to sail.",
    targetCells: [
      { row: 0, column: 3 },
      { row: 0, column: 4 },
      { row: 1, column: 3 },
      { row: 1, column: 4 },
    ],
  },
  {
    id: "steps",
    name: "Build river steps",
    completionTitle: "River steps built!",
    completionText: "The bunny can hop across.",
    targetCells: [
      { row: 2, column: 2 },
      { row: 1, column: 3 },
      { row: 0, column: 4 },
    ],
  },
  {
    id: "base",
    name: "Build a river base",
    completionTitle: "River base built!",
    completionText: "The new base is strong and wide.",
    targetCells: [
      { row: 0, column: 3 },
      { row: 1, column: 2 },
      { row: 1, column: 3 },
      { row: 1, column: 4 },
      { row: 2, column: 3 },
    ],
  },
];

function cellKey(row, column) {
  return `${row}:${column}`;
}

function isRiverCell(row, column) {
  return (
    Number.isInteger(row)
    && Number.isInteger(column)
    && row >= 0
    && row < ROW_COUNT
    && column >= RIVER_START_COLUMN
    && column <= RIVER_END_COLUMN
  );
}

function currentLevel(state) {
  return LEVELS[state.levelIndex] || LEVELS[0];
}

function isTargetCell(level, row, column) {
  return level.targetCells.some((cell) => cell.row === row && cell.column === column);
}

function uniqueTargetCells(cells, level) {
  const seen = new Set();
  return (Array.isArray(cells) ? cells : []).filter((cell) => {
    if (!cell || !isTargetCell(level, cell.row, cell.column)) return false;
    const key = cellKey(cell.row, cell.column);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isLevelComplete(level, placedCells) {
  const placed = new Set(uniqueTargetCells(placedCells, level).map((cell) => cellKey(cell.row, cell.column)));
  return level.targetCells.every((cell) => placed.has(cellKey(cell.row, cell.column)));
}

function createGameState() {
  return {
    levelIndex: 0,
    phase: "build",
    placedCells: [],
    completed: false,
  };
}

function placePlank(state, row, column) {
  if (!state || state.phase !== "build") return false;
  const level = currentLevel(state);
  if (!isTargetCell(level, row, column)) return false;

  const key = cellKey(row, column);
  if (state.placedCells.some((cell) => cellKey(cell.row, cell.column) === key)) return false;

  state.placedCells.push({ row, column });
  if (isLevelComplete(level, state.placedCells)) {
    state.phase = "level-complete";
    state.completed = state.levelIndex === LEVELS.length - 1;
  }
  return true;
}

function removePlank(state, row, column) {
  if (!state || state.phase !== "build") return false;
  const key = cellKey(row, column);
  const index = state.placedCells.findIndex((cell) => cellKey(cell.row, cell.column) === key);
  if (index < 0) return false;
  state.placedCells.splice(index, 1);
  return true;
}

function advanceLevel(state) {
  if (!state || state.phase !== "level-complete" || state.completed) return false;
  state.levelIndex += 1;
  state.phase = "build";
  state.placedCells = [];
  return true;
}

function normalizeSavedState(value) {
  if (!value || typeof value !== "object") return createGameState();

  const state = createGameState();
  const levelIndex = Number.isInteger(value.levelIndex) ? value.levelIndex : 0;
  state.levelIndex = Math.max(0, Math.min(LEVELS.length - 1, levelIndex));
  const level = currentLevel(state);
  state.placedCells = uniqueTargetCells(value.placedCells, level);

  if (isLevelComplete(level, state.placedCells)) {
    state.phase = "level-complete";
    state.completed = state.levelIndex === LEVELS.length - 1;
  }

  return state;
}

function initializeGame() {
  const elements = {
    shell: document.querySelector("#game-shell"),
    goalPanel: document.querySelector(".goal-panel"),
    goal: document.querySelector("#goal-visual"),
    levelNumber: document.querySelector("#level-number"),
    world: document.querySelector("#world"),
    frame: document.querySelector(".world-frame"),
    hero: document.querySelector("#hero"),
    friend: document.querySelector("#friend"),
    celebration: document.querySelector("#celebration"),
    inventory: document.querySelector("#inventory"),
    action: document.querySelector("#action-button"),
    actionIcon: document.querySelector("#action-icon"),
    actionLabel: document.querySelector("#action-label"),
    hint: document.querySelector("#hint-button"),
    sound: document.querySelector("#sound-button"),
    pause: document.querySelector("#pause-button"),
    pauseOverlay: document.querySelector("#pause-overlay"),
    resume: document.querySelector("#resume-button"),
    restart: document.querySelector("#restart-button"),
    levelComplete: document.querySelector("#level-complete"),
    completeLevel: document.querySelector("#complete-level"),
    completeTitle: document.querySelector("#complete-title"),
    completeText: document.querySelector("#complete-text"),
    nextLevel: document.querySelector("#next-level-button"),
    nextLevelLabel: document.querySelector("#next-level-label"),
    status: document.querySelector("#status"),
  };

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = motionQuery.matches;
  let state = loadGame();
  let selectedCell = null;
  let keyboardPosition = { ...currentLevel(state).targetCells[0] };
  let keyboardActive = false;
  let paused = false;
  let hintTimers = [];
  let hintClearTimer = null;
  let soundEnabled = loadSoundPreference();

  function loadGame() {
    try {
      return normalizeSavedState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch {
      return createGameState();
    }
  }

  function saveGame() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // The current session still works when storage is unavailable.
    }
  }

  function clearSavedGame() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // There is nothing else to clear when storage is unavailable.
    }
  }

  function loadSoundPreference() {
    try {
      return localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      return true;
    }
  }

  function saveSoundPreference() {
    try {
      localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off");
    } catch {
      // Sound remains available for the current session only.
    }
  }

  function playTone(frequency, delay, duration, wave = "sine", volume = 0.05) {
    if (!soundEnabled) return;
    window.GameSound?.tone({ frequency, delay, duration, wave, volume });
  }

  function playSound(name) {
    if (!soundEnabled) return;
    const patterns = {
      select: [[330, 0, 0.08]],
      place: [[230, 0, 0.07, "square"], [315, 0.06, 0.11, "triangle"]],
      remove: [[315, 0, 0.08], [230, 0.06, 0.11]],
      hint: [[520, 0, 0.08], [660, 0.11, 0.13]],
      error: [[175, 0, 0.08, "triangle"], [150, 0.07, 0.12, "triangle"]],
      success: [[392, 0, 0.12], [523, 0.11, 0.14], [659, 0.23, 0.2], [784, 0.38, 0.3]],
    };
    (patterns[name] || []).forEach(([frequency, delay, duration, wave]) => {
      playTone(frequency, delay, duration, wave);
    });
  }

  function announce(message) {
    elements.status.textContent = "";
    window.requestAnimationFrame(() => {
      elements.status.textContent = message;
    });
  }

  function treeAt(row, column) {
    return TREE_DATA.find((tree) => tree.row === row && tree.column === column) || null;
  }

  function hasPlacedPlank(row, column) {
    const key = cellKey(row, column);
    return state.placedCells.some((cell) => cellKey(cell.row, cell.column) === key);
  }

  function remainingBlockCount() {
    return currentLevel(state).targetCells.length - state.placedCells.length;
  }

  function blueprintMarkup(level) {
    const cells = [];
    for (let row = 0; row < ROW_COUNT; row += 1) {
      for (let column = RIVER_START_COLUMN; column <= RIVER_END_COLUMN; column += 1) {
        const target = isTargetCell(level, row, column);
        const done = target && hasPlacedPlank(row, column);
        const classes = ["blueprint-cell"];
        if (target) classes.push("is-target");
        if (done) classes.push("is-done");
        cells.push(`<span class="${classes.join(" ")}"></span>`);
      }
    }
    return cells.join("");
  }

  function renderGoal() {
    const level = currentLevel(state);
    const levelNumber = state.levelIndex + 1;
    const remaining = remainingBlockCount();
    elements.levelNumber.textContent = String(levelNumber);
    elements.goalPanel.setAttribute("aria-label", `${level.name}. ${remaining} blocks left.`);
    elements.goal.innerHTML = `
      <div class="goal-copy">
        <span class="level-counter">Level ${levelNumber} of ${LEVELS.length}</span>
        <strong class="goal-title">${level.name}</strong>
        <span class="goal-instruction">Put blocks on the bright spots</span>
        <span class="goal-count">${remaining} blocks left</span>
      </div>
      <div class="goal-blueprint" aria-hidden="true">${blueprintMarkup(level)}</div>
    `;
  }

  function renderInventorySlot(index, available, used) {
    const slot = document.createElement("span");
    slot.className = "inventory-slot";
    slot.setAttribute("aria-hidden", "true");
    if (available) {
      slot.classList.add("is-filled");
      slot.innerHTML = "<span class=\"slot-block slot-block--plank\"></span>";
    } else if (used) {
      slot.classList.add("is-used");
    }
    slot.dataset.index = String(index);
    return slot;
  }

  function renderInventory() {
    const level = currentLevel(state);
    const available = remainingBlockCount();
    elements.inventory.replaceChildren();
    elements.inventory.setAttribute("aria-label", `${available} plank blocks available`);

    for (let index = 0; index < level.targetCells.length; index += 1) {
      elements.inventory.append(renderInventorySlot(index, index < available, index >= available));
    }
  }

  function tileLabel(row, column) {
    const level = currentLevel(state);
    if (treeAt(row, column)) return "Tree block";
    if (isTargetCell(level, row, column)) {
      return hasPlacedPlank(row, column) ? "Placed plank block" : "Bright build spot";
    }
    if (isRiverCell(row, column)) return "Water tile";
    if (row === 1 && column === 1) return "Home island";
    if (row === 1 && column === 5) return "Friend island";
    return "Grass block";
  }

  function renderWorld() {
    const level = currentLevel(state);
    elements.world.replaceChildren();

    for (let row = 0; row < ROW_COUNT; row += 1) {
      for (let column = 0; column < COLUMN_COUNT; column += 1) {
        const tile = document.createElement("button");
        const tree = treeAt(row, column);
        const water = isRiverCell(row, column);
        const target = isTargetCell(level, row, column);
        const placed = hasPlacedPlank(row, column);
        const selected = selectedCell?.row === row && selectedCell?.column === column;
        const actionable = state.phase === "build" && target;

        tile.type = "button";
        tile.tabIndex = -1;
        tile.className = `tile ${water ? "water" : "land"}`;
        tile.dataset.row = String(row);
        tile.dataset.column = String(column);
        tile.setAttribute("role", "gridcell");
        tile.setAttribute("aria-label", tileLabel(row, column));
        tile.setAttribute("aria-disabled", actionable ? "false" : "true");

        const blockDepth = document.createElement("span");
        blockDepth.className = "block-depth";
        blockDepth.setAttribute("aria-hidden", "true");
        tile.append(blockDepth);

        if (actionable) tile.classList.add("is-actionable");
        if (target) tile.classList.add("is-build-target");
        if (selected) tile.classList.add("is-selected");
        if (keyboardActive && keyboardPosition.row === row && keyboardPosition.column === column) {
          tile.classList.add("is-keyboard-target");
        }

        if (tree) {
          const treeVisual = document.createElement("span");
          treeVisual.className = "tree-art";
          treeVisual.setAttribute("aria-hidden", "true");
          tile.append(treeVisual);
        } else if (water && placed) {
          const plankVisual = document.createElement("span");
          plankVisual.className = "plank-art";
          plankVisual.setAttribute("aria-hidden", "true");
          tile.append(plankVisual);
        } else if (water && target) {
          const targetVisual = document.createElement("span");
          targetVisual.className = "build-target";
          targetVisual.setAttribute("aria-hidden", "true");
          targetVisual.textContent = "+";
          tile.append(targetVisual);

          if (selected) {
            const ghostVisual = document.createElement("span");
            ghostVisual.className = "block-ghost";
            ghostVisual.setAttribute("aria-hidden", "true");
            tile.append(ghostVisual);
          }
        }

        elements.world.append(tile);
      }
    }

    window.requestAnimationFrame(positionCharacters);
  }

  function showBlockBurst(row, column) {
    const tile = elements.world.querySelector(`[data-row="${row}"][data-column="${column}"]`);
    if (!tile) return;

    const burst = document.createElement("span");
    burst.className = "block-burst block-burst--plank";
    burst.style.left = `${tile.offsetLeft + tile.offsetWidth / 2}px`;
    burst.style.top = `${tile.offsetTop + tile.offsetHeight / 2}px`;
    burst.setAttribute("aria-hidden", "true");

    const directions = [[-34, -28], [-18, 24], [3, -34], [27, -17], [31, 20], [8, 31]];
    directions.forEach(([x, y], index) => {
      const piece = document.createElement("i");
      piece.style.setProperty("--burst-x", `${x}px`);
      piece.style.setProperty("--burst-y", `${y}px`);
      piece.style.setProperty("--burst-delay", `${index * 18}ms`);
      burst.append(piece);
    });

    elements.frame.append(burst);
    window.requestAnimationFrame(() => burst.classList.add("is-visible"));
    window.setTimeout(() => burst.remove(), reduceMotion ? 90 : 620);
  }

  function positionElementAtCell(element, row, column) {
    const tile = elements.world.querySelector(`[data-row="${row}"][data-column="${column}"]`);
    if (!tile) return;
    element.style.left = `${tile.offsetLeft + (tile.offsetWidth - element.offsetWidth) / 2}px`;
    element.style.top = `${tile.offsetTop + tile.offsetHeight - element.offsetHeight + 2}px`;
  }

  function positionCharacters() {
    const level = currentLevel(state);
    const friendVisible = ["bridge", "steps"].includes(level.id);
    positionElementAtCell(elements.hero, 1, 1);
    elements.friend.classList.toggle("is-hidden", !friendVisible);
    if (!friendVisible) return;

    const friendPosition = state.phase === "level-complete"
      ? { row: 1, column: 1 }
      : { row: 1, column: 5 };
    positionElementAtCell(elements.friend, friendPosition.row, friendPosition.column);
    elements.friend.classList.toggle("is-waiting", state.phase === "build" && !reduceMotion);
  }

  function currentAction() {
    if (paused || state.phase !== "build") {
      return { name: "idle", label: "Choose", ariaLabel: "No action available", enabled: false };
    }

    if (selectedCell) {
      if (hasPlacedPlank(selectedCell.row, selectedCell.column)) {
        return { name: "remove", label: "Take", ariaLabel: "Take this block back", enabled: true };
      }
      return { name: "place", label: "Place", ariaLabel: "Place a plank block here", enabled: true };
    }

    return { name: "idle", label: "Choose", ariaLabel: "Choose a bright spot", enabled: false };
  }

  function renderAction() {
    const action = currentAction();
    elements.action.disabled = !action.enabled;
    elements.action.setAttribute("aria-label", action.ariaLabel);
    elements.actionIcon.className = `action-icon action-icon--${action.name}`;
    elements.actionLabel.textContent = action.label;
  }

  function renderSound() {
    elements.sound.classList.toggle("is-muted", !soundEnabled);
    elements.sound.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
  }

  function renderCompletion() {
    const complete = state.phase === "level-complete";
    elements.levelComplete.hidden = !complete;
    elements.celebration.classList.toggle("is-visible", complete);
    if (!complete) return;

    const level = currentLevel(state);
    const levelNumber = state.levelIndex + 1;
    if (state.completed) {
      elements.levelComplete.setAttribute("aria-label", "All levels complete");
      elements.completeLevel.textContent = `All ${LEVELS.length} levels complete`;
      elements.completeTitle.textContent = "All builds are ready!";
      elements.completeText.textContent = "You built the whole cube island.";
      elements.nextLevelLabel.textContent = "Play again";
      elements.nextLevel.setAttribute("aria-label", "Play again");
      return;
    }

    elements.levelComplete.setAttribute("aria-label", `Level ${levelNumber} complete`);
    elements.completeLevel.textContent = `Level ${levelNumber} complete`;
    elements.completeTitle.textContent = level.completionTitle;
    elements.completeText.textContent = level.completionText;
    elements.nextLevelLabel.textContent = "Next level";
    elements.nextLevel.setAttribute("aria-label", "Next level");
  }

  function render() {
    const level = currentLevel(state);
    elements.shell.dataset.level = level.id;
    renderGoal();
    renderWorld();
    renderInventory();
    renderAction();
    renderSound();
    renderCompletion();
  }

  function initialAnnouncement() {
    if (state.phase === "level-complete") {
      return state.completed ? "All levels complete." : `${currentLevel(state).completionTitle} Choose the next level.`;
    }
    return `${currentLevel(state).name}. Choose a bright spot.`;
  }

  function clearHint() {
    window.clearTimeout(hintClearTimer);
    hintClearTimer = null;
    document.querySelectorAll(".is-hint, .is-strong-hint").forEach((element) => {
      element.classList.remove("is-hint", "is-strong-hint");
    });
  }

  function clearHintTimers() {
    hintTimers.forEach((timer) => window.clearTimeout(timer));
    hintTimers = [];
  }

  function restartHintTimers() {
    clearHintTimers();
    if (paused || state.phase !== "build") return;
    hintTimers = [
      window.setTimeout(() => showHint(1, false), 8000),
      window.setTimeout(() => showHint(2, false), 16000),
    ];
  }

  function markUsefulInteraction() {
    clearHint();
    restartHintTimers();
  }

  function suggestedCell() {
    const level = currentLevel(state);
    return level.targetCells.find((cell) => !hasPlacedPlank(cell.row, cell.column)) || null;
  }

  function hintTarget() {
    const action = currentAction();
    if (action.enabled) return elements.action;
    const targetCell = suggestedCell();
    if (!targetCell) return null;
    return elements.world.querySelector(`[data-row="${targetCell.row}"][data-column="${targetCell.column}"]`);
  }

  function showHint(level, withSound = true) {
    clearHint();
    const target = hintTarget();
    if (!target) return;
    target.classList.add("is-hint");
    if (level >= 2) target.classList.add("is-strong-hint");
    if (withSound) playSound("hint");
    announce("The next bright spot is shown.");
    hintClearTimer = window.setTimeout(clearHint, 5000);
  }

  function refuseCell(row, column) {
    const tile = elements.world.querySelector(`[data-row="${row}"][data-column="${column}"]`);
    if (tile) {
      tile.classList.remove("is-refused");
      window.requestAnimationFrame(() => tile.classList.add("is-refused"));
      window.setTimeout(() => tile.classList.remove("is-refused"), reduceMotion ? 40 : 440);
    }
    playSound("error");
    announce("Use a bright spot. Nothing was lost.");
  }

  function chooseCell(row, column) {
    if (paused || state.phase !== "build") return;
    clearHint();
    const level = currentLevel(state);

    if (!isTargetCell(level, row, column)) {
      refuseCell(row, column);
      return;
    }

    selectedCell = { row, column };
    playSound("select");
    render();
    announce(hasPlacedPlank(row, column) ? "This block can be taken back." : "This bright spot is ready.");
    restartHintTimers();
  }

  function finishLevel() {
    clearHintTimers();
    selectedCell = null;
    saveGame();
    playSound("success");
    render();
    announce(state.completed ? "All levels complete." : `${currentLevel(state).completionTitle} Choose the next level.`);
    window.requestAnimationFrame(() => elements.nextLevel.focus());
  }

  function performAction() {
    const action = currentAction();
    if (!action.enabled) return;
    clearHint();
    const actionCell = { ...selectedCell };

    if (action.name === "place") {
      if (!placePlank(state, actionCell.row, actionCell.column)) return;
      selectedCell = null;
      playSound("place");
      showBlockBurst(actionCell.row, actionCell.column);
      if (state.phase === "level-complete") {
        finishLevel();
        return;
      }
      announce("The plank block was placed.");
    } else if (action.name === "remove") {
      if (!removePlank(state, actionCell.row, actionCell.column)) return;
      selectedCell = null;
      playSound("remove");
      announce("The plank block returned to the tray.");
    }

    saveGame();
    render();
    markUsefulInteraction();
  }

  function openNextLevel() {
    if (state.completed) {
      restartGame();
      return;
    }
    if (!advanceLevel(state)) return;

    selectedCell = null;
    keyboardPosition = { ...currentLevel(state).targetCells[0] };
    keyboardActive = false;
    saveGame();
    render();
    restartHintTimers();
    announce(`${currentLevel(state).name}. Choose a bright spot.`);
    elements.world.focus();
  }

  function setPaused(value) {
    paused = value;
    elements.pauseOverlay.hidden = !paused;
    elements.shell.inert = paused;
    if (paused) {
      clearHint();
      clearHintTimers();
      elements.resume.focus();
      announce("Game paused.");
    } else {
      elements.shell.inert = false;
      elements.pause.focus();
      restartHintTimers();
      announce("Game resumed.");
    }
    renderAction();
  }

  function restartGame() {
    state = createGameState();
    selectedCell = null;
    keyboardPosition = { ...currentLevel(state).targetCells[0] };
    keyboardActive = false;
    clearSavedGame();
    if (paused) setPaused(false);
    render();
    restartHintTimers();
    announce("Level 1 is ready. Build a bridge.");
    elements.world.focus();
  }

  function moveKeyboardCursor(rowDelta, columnDelta) {
    keyboardPosition = {
      row: Math.max(0, Math.min(ROW_COUNT - 1, keyboardPosition.row + rowDelta)),
      column: Math.max(0, Math.min(COLUMN_COUNT - 1, keyboardPosition.column + columnDelta)),
    };
    keyboardActive = true;
    renderWorld();
    announce(tileLabel(keyboardPosition.row, keyboardPosition.column));
  }

  elements.world.addEventListener("pointerdown", () => {
    keyboardActive = false;
  });

  elements.world.addEventListener("click", (event) => {
    const tile = event.target.closest(".tile");
    if (!tile) return;
    const row = Number(tile.dataset.row);
    const column = Number(tile.dataset.column);
    keyboardPosition = { row, column };
    chooseCell(row, column);
  });

  elements.world.addEventListener("focus", () => {
    keyboardActive = true;
    renderWorld();
  });

  elements.world.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const directions = {
      arrowup: [-1, 0],
      w: [-1, 0],
      arrowdown: [1, 0],
      s: [1, 0],
      arrowleft: [0, -1],
      a: [0, -1],
      arrowright: [0, 1],
      d: [0, 1],
    };

    if (directions[key]) {
      event.preventDefault();
      moveKeyboardCursor(...directions[key]);
      return;
    }
    if (key === "enter") {
      event.preventDefault();
      chooseCell(keyboardPosition.row, keyboardPosition.column);
      return;
    }
    if (key === " ") {
      event.preventDefault();
      performAction();
    }
  });

  elements.action.addEventListener("click", performAction);
  elements.nextLevel.addEventListener("click", openNextLevel);
  elements.hint.addEventListener("click", () => showHint(2));
  elements.sound.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    saveSoundPreference();
    renderSound();
    if (soundEnabled) playSound("select");
  });
  elements.pause.addEventListener("click", () => setPaused(true));
  elements.resume.addEventListener("click", () => setPaused(false));
  elements.restart.addEventListener("click", restartGame);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    setPaused(!paused);
  });

  window.addEventListener("resize", () => window.requestAnimationFrame(positionCharacters));
  motionQuery.addEventListener("change", (event) => {
    reduceMotion = event.matches;
    positionCharacters();
  });

  render();
  restartHintTimers();
  announce(initialAnnouncement());
  if (state.phase === "level-complete") {
    window.requestAnimationFrame(() => elements.nextLevel.focus());
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    ROW_COUNT,
    COLUMN_COUNT,
    RIVER_START_COLUMN,
    RIVER_END_COLUMN,
    TREE_DATA,
    LEVELS,
    createGameState,
    isRiverCell,
    isTargetCell,
    isLevelComplete,
    placePlank,
    removePlank,
    advanceLevel,
    normalizeSavedState,
  };
}

if (typeof document !== "undefined") {
  initializeGame();
}
