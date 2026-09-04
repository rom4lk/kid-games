const GRID_SIZE = 5;
const SOUND_KEY = "robotLabSoundV1";

const COMMANDS = {
  forward: { label: "Forward", symbol: "↑" },
  left: { label: "Turn left", symbol: "↶" },
  right: { label: "Turn right", symbol: "↷" },
  press: { label: "Press", symbol: "●" },
  repeat: { label: "Repeat two", symbol: "×2" },
};

const DIRECTIONS = ["north", "east", "south", "west"];
const VECTORS = {
  north: { row: -1, column: 0 },
  east: { row: 0, column: 1 },
  south: { row: 1, column: 0 },
  west: { row: 0, column: -1 },
};

function getMotionDelay(milliseconds, reducedMotion) {
  return reducedMotion ? Math.min(milliseconds, 20) : milliseconds;
}

const LEVELS = [
  {
    title: "First Charge",
    mission: "Reach the battery. The robot is already facing the right way.",
    hint: "The battery is three squares ahead. Try three Forward commands.",
    map: [".....", ".....", "...1.", ".....", "....."],
    start: { row: 2, column: 0, direction: "east" },
    limit: 5,
    par: 3,
    available: ["forward"],
    solution: ["forward", "forward", "forward"],
  },
  {
    title: "Turn Test",
    mission: "Go around the wall and reach the battery.",
    hint: "Move once, turn right, cross two squares, then turn toward the battery.",
    map: [".....", "..1..", "#....", "...#.", "....."],
    start: { row: 4, column: 0, direction: "north" },
    limit: 9,
    par: 7,
    available: ["forward", "left", "right"],
    solution: ["forward", "right", "forward", "forward", "left", "forward", "forward"],
  },
  {
    title: "Red Door",
    mission: "Press the red switch, then pass through the matching door.",
    hint: "The robot starts directly below the switch. Stand on it before using Press.",
    map: ["..1..", "..R..", "##.##", "r....", "....."],
    start: { row: 4, column: 0, direction: "north" },
    limit: 11,
    par: 9,
    available: ["forward", "left", "right", "press"],
    solution: ["forward", "press", "right", "forward", "forward", "left", "forward", "forward", "forward"],
  },
  {
    title: "In Order",
    mission: "Collect battery 1 before battery 2.",
    hint: "After battery 1, the wall makes you travel around its right edge.",
    map: [".....", "....2", ".###.", ".....", "..1.."],
    start: { row: 4, column: 0, direction: "east" },
    limit: 13,
    par: 8,
    available: ["forward", "left", "right"],
    solution: ["forward", "forward", "forward", "forward", "left", "forward", "forward", "forward"],
  },
  {
    title: "Switchboard",
    mission: "Open the red door, then find a way through the blue door.",
    hint: "Press red at the start. The blue switch is between the two doors.",
    map: ["####1", "####B", "####b", "####R", "r...."],
    start: { row: 4, column: 0, direction: "east" },
    limit: 14,
    par: 11,
    available: ["forward", "left", "right", "press"],
    solution: ["press", "forward", "forward", "forward", "forward", "left", "forward", "forward", "press", "forward", "forward"],
  },
  {
    title: "Repeat Power",
    mission: "Use Repeat Two to travel four squares with only three cards.",
    hint: "Add Forward, Forward, then Repeat Two.",
    map: ["1....", ".....", ".....", ".....", "....."],
    start: { row: 4, column: 0, direction: "north" },
    limit: 4,
    par: 3,
    available: ["forward", "repeat"],
    solution: ["forward", "forward", "repeat"],
  },
  {
    title: "The Long Way",
    mission: "Follow the winding corridor. Repeats will keep the program short.",
    hint: "Each long corridor is four squares: Forward, Forward, Repeat Two.",
    map: ["1....", ".####", ".....", "####.", "....."],
    start: { row: 4, column: 0, direction: "east" },
    limit: 16,
    par: 13,
    available: ["forward", "left", "right", "repeat"],
    solution: ["forward", "forward", "repeat", "left", "forward", "forward", "left", "forward", "forward", "repeat", "right", "forward", "forward"],
  },
  {
    title: "Master Circuit",
    mission: "Collect both batteries and operate both color systems.",
    hint: "Open red, cross the bottom, travel to blue, then return along the same corridor.",
    map: ["####2", "####B", "b...R", ".###.", "r1..."],
    start: { row: 4, column: 0, direction: "east" },
    limit: 24,
    par: 15,
    available: ["forward", "left", "right", "press", "repeat"],
    solution: [
      "press", "forward", "right", "right", "forward", "repeat", "forward", "right",
      "press", "forward", "forward", "repeat", "left", "forward", "forward",
    ],
  },
];

function createLevelState(level) {
  return {
    position: { row: level.start.row, column: level.start.column },
    direction: level.start.direction,
    openDoors: new Set(),
    collected: new Set(),
  };
}

function expandProgram(program) {
  const expanded = [];

  program.forEach((command, sourceIndex) => {
    if (command === "repeat") {
      expanded.push(
        ...expanded.slice(-2).map((entry) => ({ command: entry.command, sourceIndex })),
      );
      return;
    }

    expanded.push({ command, sourceIndex });
  });

  return expanded;
}

function findInvalidRepeat(program) {
  let actionCount = 0;

  for (let index = 0; index < program.length; index += 1) {
    if (program[index] === "repeat") {
      if (actionCount < 2) return index;
      actionCount += 2;
    } else {
      actionCount += 1;
    }
  }

  return -1;
}

function getCell(level, position) {
  return level.map[position.row][position.column];
}

function getBatteryOrders(level) {
  return level.map
    .flatMap((row) => [...row])
    .filter((cell) => /[1-9]/.test(cell))
    .map(Number)
    .sort((first, second) => first - second);
}

function getDoorColor(cell) {
  if (cell === "R") return "red";
  if (cell === "B") return "blue";
  return null;
}

function getSwitchColor(cell) {
  if (cell === "r") return "red";
  if (cell === "b") return "blue";
  return null;
}

function collectBattery(level, state) {
  const cell = getCell(level, state.position);
  if (!/[1-9]/.test(cell)) return null;

  const order = Number(cell);
  if (state.collected.has(order)) return null;

  const nextOrder = getBatteryOrders(level).find((number) => !state.collected.has(number));
  if (order !== nextOrder) {
    return { type: "wrong-battery", order, nextOrder };
  }

  state.collected.add(order);
  return { type: "battery", order };
}

function applyCommand(level, state, command) {
  if (command === "left" || command === "right") {
    const turn = command === "right" ? 1 : -1;
    const currentIndex = DIRECTIONS.indexOf(state.direction);
    state.direction = DIRECTIONS[(currentIndex + turn + DIRECTIONS.length) % DIRECTIONS.length];
    return { ok: true, event: { type: "turn" } };
  }

  if (command === "press") {
    const color = getSwitchColor(getCell(level, state.position));
    if (!color) {
      return { ok: false, reason: "The robot is not standing on a switch." };
    }
    state.openDoors.add(color);
    return { ok: true, event: { type: "switch", color } };
  }

  if (command === "forward") {
    const vector = VECTORS[state.direction];
    const nextPosition = {
      row: state.position.row + vector.row,
      column: state.position.column + vector.column,
    };

    const outside = nextPosition.row < 0
      || nextPosition.row >= GRID_SIZE
      || nextPosition.column < 0
      || nextPosition.column >= GRID_SIZE;

    if (outside) {
      return { ok: false, reason: "The edge of the lab blocks the robot." };
    }

    const nextCell = getCell(level, nextPosition);
    if (nextCell === "#") {
      return { ok: false, reason: "A wall blocks the robot." };
    }

    const doorColor = getDoorColor(nextCell);
    if (doorColor && !state.openDoors.has(doorColor)) {
      return { ok: false, reason: `The ${doorColor} door is still closed.` };
    }

    state.position = nextPosition;
    return { ok: true, event: collectBattery(level, state) };
  }

  return { ok: false, reason: "Unknown command." };
}

function isLevelComplete(level, state) {
  return state.collected.size === getBatteryOrders(level).length;
}

function simulateProgram(level, program) {
  const state = createLevelState(level);
  const steps = expandProgram(program);

  for (const step of steps) {
    const result = applyCommand(level, state, step.command);
    if (!result.ok) return { complete: false, state, error: result.reason };
    if (isLevelComplete(level, state)) return { complete: true, state, error: null };
  }

  return { complete: isLevelComplete(level, state), state, error: null };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    LEVELS,
    createLevelState,
    expandProgram,
    findInvalidRepeat,
    applyCommand,
    getMotionDelay,
    isLevelComplete,
    simulateProgram,
  };
}

if (typeof document !== "undefined") {
  const elements = {
    gameShell: document.querySelector(".game-shell"),
    board: document.querySelector("#board"),
    boardFrame: document.querySelector("#boardFrame"),
    missionNumber: document.querySelector("#missionNumber"),
    missionLabel: document.querySelector("#missionLabel"),
    missionTitle: document.querySelector("#missionTitle"),
    missionCopy: document.querySelector("#missionCopy"),
    commandCount: document.querySelector("#commandCount"),
    commandLimit: document.querySelector("#commandLimit"),
    parValue: document.querySelector("#parValue"),
    partCount: document.querySelector("#partCount"),
    programList: document.querySelector("#programList"),
    emptyProgram: document.querySelector("#emptyProgram"),
    messageBox: document.querySelector("#messageBox"),
    gameMessage: document.querySelector("#gameMessage"),
    levelGrid: document.querySelector("#levelGrid"),
    switchLegend: document.querySelector("#switchLegend"),
    resultDialog: document.querySelector("#resultDialog"),
    resultStars: document.querySelector("#resultStars"),
    resultCopy: document.querySelector("#resultCopy"),
    partReward: document.querySelector("#partReward"),
    nextButton: document.querySelector("#nextButton"),
    runButton: document.querySelector("#runButton"),
    soundButton: document.querySelector("#soundButton"),
  };

  let currentLevelIndex = 0;
  let program = [];
  let levelState = createLevelState(LEVELS[0]);
  let completedLevels = readCompletedLevels();
  let running = false;
  let runVersion = 0;
  let resultTimer = 0;
  let soundEnabled = readSoundSetting();
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function readCompletedLevels() {
    try {
      const saved = JSON.parse(localStorage.getItem("robotLabCompletedV1"));
      return new Set(Array.isArray(saved) ? saved : []);
    } catch {
      return new Set();
    }
  }

  function saveCompletedLevels() {
    try {
      localStorage.setItem("robotLabCompletedV1", JSON.stringify([...completedLevels]));
    } catch {
      // Private browsing modes can refuse writes. Progress stays for this session only.
    }
  }

  function readSoundSetting() {
    try {
      return localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      return true;
    }
  }

  function saveSoundSetting() {
    try {
      localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off");
    } catch {
      // Private browsing modes can refuse writes. The choice stays for this session only.
    }
  }

  function isLevelUnlocked(index) {
    return index === 0 || completedLevels.has(index - 1);
  }

  function setMessage(message, tone = "neutral") {
    elements.gameMessage.textContent = message;
    elements.messageBox.dataset.tone = tone;
  }

  function playTone(frequency, duration = 0.09, type = "sine") {
    if (!soundEnabled) return;
    window.GameSound?.tone({ frequency, duration, wave: type, volume: 0.09 });
  }

  function playSuccessSound() {
    [440, 554, 659, 880].forEach((frequency, index) => {
      window.setTimeout(() => playTone(frequency, 0.18, "triangle"), index * 100);
    });
  }

  function renderBoard() {
    const fragment = document.createDocumentFragment();
    elements.board.innerHTML = "";

    for (let row = 0; row < GRID_SIZE; row += 1) {
      for (let column = 0; column < GRID_SIZE; column += 1) {
        const cell = document.createElement("div");
        const symbol = LEVELS[currentLevelIndex].map[row][column];
        const batteryOrder = /[1-9]/.test(symbol) ? Number(symbol) : null;
        const doorColor = getDoorColor(symbol);
        const switchColor = getSwitchColor(symbol);
        const isRobot = levelState.position.row === row && levelState.position.column === column;
        const batteryCollected = batteryOrder && levelState.collected.has(batteryOrder);

        cell.className = "cell";
        cell.setAttribute("role", "gridcell");

        if (symbol === "#") {
          cell.classList.add("wall-cell");
          cell.innerHTML = '<div class="wall-tile" aria-label="Wall"><i></i><i></i><i></i></div>';
        }

        if (batteryOrder && !batteryCollected) {
          cell.classList.add("battery-cell");
          cell.innerHTML = `
            <div class="battery" aria-label="Battery ${batteryOrder}">
              <span class="battery-cap"></span>
              <span class="battery-bolt">ϟ</span>
              ${getBatteryOrders(LEVELS[currentLevelIndex]).length > 1 ? `<b>${batteryOrder}</b>` : ""}
            </div>
          `;
        }

        if (batteryCollected) {
          cell.innerHTML = '<div class="charge-mark" aria-label="Collected battery">✦</div>';
        }

        if (switchColor) {
          const pressed = levelState.openDoors.has(switchColor);
          cell.innerHTML = `
            <div class="floor-switch ${switchColor} ${pressed ? "pressed" : ""}" aria-label="${switchColor} switch">
              <span></span>
            </div>
          `;
        }

        if (doorColor) {
          const open = levelState.openDoors.has(doorColor);
          cell.classList.add("door-cell", `${doorColor}-door`, open ? "door-open" : "door-closed");
          cell.innerHTML = `
            <div class="door" aria-label="${open ? "Open" : "Closed"} ${doorColor} door">
              <span></span><span></span><span></span>
            </div>
          `;
        }

        if (isRobot) {
          const robot = document.createElement("div");
          robot.className = `robot-token direction-${levelState.direction}`;
          robot.setAttribute("aria-label", `Robot facing ${levelState.direction}`);
          robot.innerHTML = `
            <span class="direction-arrow">▲</span>
            <span class="robot-antenna"></span>
            <span class="robot-face"><i></i><i></i></span>
            <span class="robot-base"></span>
          `;
          cell.append(robot);
        }

        fragment.append(cell);
      }
    }

    elements.board.append(fragment);
  }

  // The two actions a "Repeat two" card will copy, so the child can see what it
  // means instead of reading about it. When the card right before it is itself
  // a repeat, both copied actions collapse onto that one card's source index,
  // so trace through it to the two concrete cards it copied instead.
  function repeatSourceIndexes(repeatIndex) {
    const expanded = expandProgram(program.slice(0, repeatIndex));
    const directSources = [...new Set(expanded.slice(-2).map((entry) => entry.sourceIndex))];
    return [...new Set(directSources.flatMap((index) => (
      program[index] === "repeat" ? repeatSourceIndexes(index) : [index]
    )))];
  }

  function renderProgram(activeSourceIndex = -1, errorSourceIndex = -1) {
    const focusIndex = errorSourceIndex >= 0 ? errorSourceIndex : activeSourceIndex;
    const pairedIndexes = program[focusIndex] === "repeat"
      ? repeatSourceIndexes(focusIndex)
      : [];
    elements.programList.innerHTML = "";
    elements.emptyProgram.hidden = program.length > 0;

    program.forEach((command, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `program-chip chip-${command}`;
      button.dataset.programIndex = index;
      button.setAttribute("aria-label", `Remove command ${index + 1}: ${COMMANDS[command].label}`);
      button.innerHTML = `
        <small>${String(index + 1).padStart(2, "0")}</small>
        <span>${COMMANDS[command].symbol}</span>
        <b>${COMMANDS[command].label}</b>
      `;
      button.classList.toggle("active", index === activeSourceIndex);
      button.classList.toggle("error", index === errorSourceIndex);
      button.classList.toggle("paired", pairedIndexes.includes(index));
      button.disabled = running;
      elements.programList.append(button);
    });

    elements.commandCount.textContent = program.length;
    elements.runButton.disabled = program.length === 0 || running;
    document.querySelector("#undoButton").disabled = program.length === 0 || running;
    document.querySelector("#clearButton").disabled = program.length === 0 || running;
  }

  function renderLevels() {
    elements.levelGrid.innerHTML = LEVELS.map((level, index) => {
      const unlocked = isLevelUnlocked(index);
      const complete = completedLevels.has(index);
      const stateLabel = complete ? "Complete" : unlocked ? "Open" : "Locked";
      return `
        <button class="level-button ${index === currentLevelIndex ? "active" : ""} ${complete ? "complete" : ""}"
          type="button" data-level="${index}" ${unlocked && !running ? "" : "disabled"}
          aria-label="Mission ${index + 1}: ${level.title}. ${stateLabel}">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <i aria-hidden="true">${complete ? "✓" : unlocked ? "" : "•"}</i>
        </button>
      `;
    }).join("");
  }

  function renderBlueprint() {
    elements.partCount.textContent = completedLevels.size;
    document.querySelectorAll(".blueprint-robot .part").forEach((part) => {
      part.classList.toggle("built", completedLevels.has(Number(part.dataset.part) - 1));
    });
  }

  function renderAvailableCommands() {
    const available = LEVELS[currentLevelIndex].available;
    document.querySelectorAll(".command-button").forEach((button) => {
      button.hidden = !available.includes(button.dataset.command);
      button.disabled = running || program.length >= LEVELS[currentLevelIndex].limit;
    });
  }

  function resetSimulation() {
    runVersion += 1;
    running = false;
    levelState = createLevelState(LEVELS[currentLevelIndex]);
    elements.boardFrame.classList.remove("board-error");
    renderBoard();
    renderProgram();
    renderAvailableCommands();
  }

  function startLevel(index) {
    if (!isLevelUnlocked(index)) return;
    running = false;
    runVersion += 1;
    currentLevelIndex = index;
    program = [];
    levelState = createLevelState(LEVELS[index]);
    window.clearTimeout(resultTimer);
    elements.resultDialog.hidden = true;
    elements.gameShell.inert = false;
    elements.partReward.setAttribute("aria-hidden", "true");

    const level = LEVELS[index];
    elements.missionNumber.textContent = `${String(index + 1).padStart(2, "0")} / ${String(LEVELS.length).padStart(2, "0")}`;
    elements.missionLabel.textContent = `Mission ${String(index + 1).padStart(2, "0")}`;
    elements.missionTitle.textContent = level.title;
    elements.missionCopy.textContent = level.mission;
    elements.commandLimit.textContent = level.limit;
    elements.parValue.textContent = level.par;
    elements.switchLegend.hidden = !level.map.some((row) => /[rb]/.test(row));
    setMessage(index === 0 ? "Add three Forward commands, then press Run." : "Study the board and build your program.");

    renderBoard();
    renderProgram();
    renderLevels();
    renderBlueprint();
    renderAvailableCommands();
  }

  function addCommand(command) {
    const level = LEVELS[currentLevelIndex];
    if (running) return;
    if (!level.available.includes(command)) {
      setMessage("This mission does not use that command yet.", "warning");
      playTone(180, 0.12, "square");
      return;
    }
    if (program.length >= level.limit) return;
    if (command === "repeat" && expandProgram(program).length < 2) {
      setMessage("Repeat Two needs at least two earlier actions.", "warning");
      playTone(180, 0.12, "square");
      return;
    }

    resetSimulation();
    program.push(command);
    setMessage(program.length === level.limit ? "Program full. Run it or remove a command." : "Command added. Keep building or press Run.");
    playTone(320 + program.length * 18, 0.06, "triangle");
    renderProgram();
    renderAvailableCommands();
  }

  function removeCommand(index) {
    if (running) return;
    resetSimulation();
    program.splice(index, 1);
    setMessage("Command removed. Check the new sequence.");
    renderProgram();
    renderAvailableCommands();
  }

  function delay(milliseconds) {
    const duration = getMotionDelay(milliseconds, reducedMotionQuery.matches);
    return new Promise((resolve) => window.setTimeout(resolve, duration));
  }

  // The world explains the failure too: the robot bumps and the square it
  // could not enter flashes, so the English sentence is not the only channel.
  function showBlockedStep(command) {
    const robot = elements.board.querySelector(".robot-token");
    if (robot) {
      robot.classList.remove("blocked");
      void robot.offsetWidth;
      robot.classList.add("blocked");
    }

    if (command !== "forward") return;
    const vector = VECTORS[levelState.direction];
    const row = levelState.position.row + vector.row;
    const column = levelState.position.column + vector.column;
    if (row < 0 || row >= GRID_SIZE || column < 0 || column >= GRID_SIZE) return;
    const cell = elements.board.children[row * GRID_SIZE + column];
    if (!cell) return;
    cell.classList.remove("refused");
    void cell.offsetWidth;
    cell.classList.add("refused");
  }

  function showStepEvent(event) {
    if (!event) return;
    if (event.type === "battery") {
      setMessage(`Battery ${event.order} charged!`, "success");
      playTone(760, 0.15, "triangle");
    }
    if (event.type === "wrong-battery") {
      setMessage(`Battery ${event.order} is waiting. Collect battery ${event.nextOrder} first.`, "warning");
      playTone(190, 0.12, "square");
    }
    if (event.type === "switch") {
      setMessage(`${event.color[0].toUpperCase()}${event.color.slice(1)} doors are open!`, "success");
      playTone(event.color === "red" ? 520 : 620, 0.12, "triangle");
    }
  }

  async function runProgram() {
    if (running || program.length === 0) return;
    const invalidRepeatIndex = findInvalidRepeat(program);
    if (invalidRepeatIndex >= 0) {
      renderProgram(-1, invalidRepeatIndex);
      setMessage("Repeat Two needs two earlier actions. Fix the highlighted card.", "error");
      playTone(130, 0.18, "sawtooth");
      return;
    }

    const level = LEVELS[currentLevelIndex];
    const currentRun = ++runVersion;
    running = true;
    const state = createLevelState(level);
    levelState = state;
    elements.boardFrame.classList.remove("board-error");
    setMessage("Program running...", "running");
    renderBoard();
    renderProgram();
    renderAvailableCommands();
    renderLevels();
    await delay(300);
    if (currentRun !== runVersion) return;

    for (const step of expandProgram(program)) {
      renderProgram(step.sourceIndex);
      playTone(step.command === "forward" ? 260 : 340, 0.05, "square");
      await delay(220);
      if (currentRun !== runVersion) return;

      const result = applyCommand(level, state, step.command);
      levelState = state;
      renderBoard();

      if (!result.ok) {
        running = false;
        renderProgram(-1, step.sourceIndex);
        renderAvailableCommands();
        renderLevels();
        setMessage(`${result.reason} Fix the highlighted command.`, "error");
        elements.boardFrame.classList.add("board-error");
        showBlockedStep(step.command);
        playTone(130, 0.22, "sawtooth");
        return;
      }

      showStepEvent(result.event);
      await delay(330);
      if (currentRun !== runVersion) return;

      if (isLevelComplete(level, state)) {
        finishLevel();
        return;
      }
    }

    running = false;
    renderProgram();
    renderAvailableCommands();
    renderLevels();
    const remaining = getBatteryOrders(level).length - state.collected.size;
    setMessage(`Program ended. ${remaining} ${remaining === 1 ? "battery is" : "batteries are"} still waiting.`, "warning");
  }

  function getStars(level) {
    if (program.length <= level.par) return 3;
    if (program.length <= level.par + 2) return 2;
    return 1;
  }

  function finishLevel() {
    const level = LEVELS[currentLevelIndex];
    const firstCompletion = !completedLevels.has(currentLevelIndex);
    completedLevels.add(currentLevelIndex);
    saveCompletedLevels();
    running = false;
    renderProgram();
    renderAvailableCommands();
    renderLevels();
    renderBlueprint();
    setMessage("Mission complete!", "success");
    elements.resultStars.textContent = `${"★".repeat(getStars(level))}${"☆".repeat(3 - getStars(level))}`;
    elements.resultStars.setAttribute("aria-label", `${getStars(level)} out of 3 stars`);
    elements.resultCopy.textContent = firstCompletion
      ? "A new robot part has joined your blueprint."
      : "Great debugging. This mission is complete again.";
    elements.partReward.textContent = firstCompletion ? `Part ${currentLevelIndex + 1}` : "Replay win";
    elements.partReward.setAttribute("aria-hidden", "false");
    elements.nextButton.innerHTML = currentLevelIndex === LEVELS.length - 1
      ? 'See all missions <span aria-hidden="true">→</span>'
      : 'Next mission <span aria-hidden="true">→</span>';
    playSuccessSound();
    const resultDelay = getMotionDelay(350, reducedMotionQuery.matches);
    resultTimer = window.setTimeout(() => {
      elements.resultDialog.hidden = false;
      elements.gameShell.inert = true;
      elements.nextButton.focus();
    }, resultDelay);
  }

  document.querySelector("#commandPalette").addEventListener("click", (event) => {
    const button = event.target.closest(".command-button");
    if (button) addCommand(button.dataset.command);
  });

  elements.programList.addEventListener("click", (event) => {
    const chip = event.target.closest(".program-chip");
    if (chip) removeCommand(Number(chip.dataset.programIndex));
  });

  elements.levelGrid.addEventListener("click", (event) => {
    const button = event.target.closest(".level-button");
    if (button) startLevel(Number(button.dataset.level));
  });

  document.querySelector("#undoButton").addEventListener("click", () => {
    if (program.length > 0) removeCommand(program.length - 1);
  });

  document.querySelector("#clearButton").addEventListener("click", () => {
    if (running) return;
    resetSimulation();
    program = [];
    setMessage("Program cleared. Build a new plan.");
    renderProgram();
    renderAvailableCommands();
  });

  elements.runButton.addEventListener("click", runProgram);

  document.querySelector("#hintButton").addEventListener("click", () => {
    setMessage(LEVELS[currentLevelIndex].hint, "hint");
    playTone(470, 0.09, "triangle");
  });

  document.querySelector("#replayButton").addEventListener("click", () => startLevel(currentLevelIndex));

  elements.nextButton.addEventListener("click", () => {
    if (currentLevelIndex < LEVELS.length - 1) {
      startLevel(currentLevelIndex + 1);
      return;
    }
    elements.resultDialog.hidden = true;
    startLevel(0);
  });

  elements.soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    saveSoundSetting();
    elements.soundButton.classList.toggle("muted", !soundEnabled);
    elements.soundButton.querySelector("span").textContent = soundEnabled ? "♪" : "×";
    elements.soundButton.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
    if (soundEnabled) playTone(520, 0.08, "triangle");
  });

  elements.soundButton.classList.toggle("muted", !soundEnabled);
  elements.soundButton.querySelector("span").textContent = soundEnabled ? "♪" : "×";
  elements.soundButton.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");

  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (!elements.resultDialog.hidden) return;
    // A focused control (Undo, Clear, a mission tile...) has its own Enter/Backspace
    // behavior, so the game shortcuts must not hijack it.
    if (event.target.closest?.("button, select, input, textarea, a[href], [tabindex]")) return;

    const keyboardCommands = {
      KeyF: "forward",
      KeyL: "left",
      KeyR: "right",
      KeyP: "press",
      KeyX: "repeat",
    };
    const command = keyboardCommands[event.code];
    if (command) {
      addCommand(command);
      return;
    }
    if (event.key === "Enter") runProgram();
    if (event.key === "Backspace") {
      event.preventDefault();
      if (program.length > 0) removeCommand(program.length - 1);
    }
  });

  // The win dialog traps focus and closes on Escape, and the board behind it
  // is marked inert so Tab and the screen reader cannot reach it while it is open.
  document.addEventListener("keydown", (event) => {
    if (elements.resultDialog.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      startLevel(currentLevelIndex);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...elements.resultDialog.querySelectorAll("button")];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  startLevel(0);
}
