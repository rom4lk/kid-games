const levels = [
  {
    robot: { x: 1, y: 1 },
    parcel: { x: 1, y: 1 },
    station: { x: 4, y: 1 },
    obstacles: [],
    commands: ["pick", "right", "drop"],
    solution: ["pick", "right", "right", "right", "drop"],
  },
  {
    robot: { x: 2, y: 1 },
    parcel: { x: 1, y: 1 },
    station: { x: 5, y: 1 },
    obstacles: [],
    commands: ["left", "pick", "right", "drop"],
    solution: ["left", "pick", "right", "right", "right", "right", "drop"],
  },
  {
    robot: { x: 1, y: 2 },
    parcel: { x: 1, y: 1 },
    station: { x: 4, y: 1 },
    obstacles: [],
    commands: ["left", "pick", "right", "drop", "up"],
    solution: ["up", "pick", "right", "right", "right", "drop"],
  },
  {
    robot: { x: 0, y: 2 },
    parcel: { x: 2, y: 2 },
    station: { x: 4, y: 0 },
    obstacles: [],
    commands: ["left", "pick", "right", "drop", "up"],
    solution: ["right", "right", "pick", "up", "up", "right", "right", "drop"],
  },
  {
    robot: { x: 4, y: 2 },
    parcel: { x: 4, y: 0 },
    station: { x: 0, y: 2 },
    obstacles: [],
    commands: ["left", "pick", "right", "drop", "up", "down"],
    solution: [
      "up",
      "up",
      "pick",
      "left",
      "left",
      "left",
      "left",
      "down",
      "down",
      "drop",
    ],
  },
  {
    robot: { x: 0, y: 2 },
    parcel: { x: 2, y: 2 },
    station: { x: 4, y: 0 },
    obstacles: [{ x: 3, y: 2 }],
    commands: ["left", "pick", "right", "drop", "up", "down"],
    solution: ["right", "right", "pick", "up", "right", "right", "up", "drop"],
  },
  {
    robot: { x: 0, y: 2 },
    parcel: { x: 0, y: 2 },
    station: { x: 5, y: 1 },
    obstacles: [],
    button: { x: 2, y: 2 },
    gate: { x: 3, y: 2 },
    gateInitiallyOpen: false,
    commands: ["left", "pick", "right", "drop", "up", "down"],
    solution: ["pick", "right", "right", "right", "right", "right", "up", "drop"],
  },
  {
    robot: { x: 0, y: 1 },
    parcel: { x: 0, y: 1 },
    station: { x: 5, y: 1 },
    obstacles: [],
    button: { x: 2, y: 0 },
    gate: { x: 3, y: 1 },
    gateInitiallyOpen: false,
    commands: ["left", "pick", "right", "drop", "up", "down"],
    solution: ["pick", "right", "right", "up", "down", "right", "right", "right", "drop"],
  },
  {
    robot: { x: 2, y: 2 },
    parcel: { x: 2, y: 1 },
    station: { x: 5, y: 1 },
    obstacles: [],
    button: { x: 1, y: 2 },
    gate: { x: 3, y: 1 },
    gateInitiallyOpen: false,
    commands: ["left", "pick", "right", "drop", "up", "down"],
    solution: ["left", "right", "up", "pick", "right", "right", "right", "drop"],
  },
];

const commandIcons = {
  left: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path class="command-arrow" d="M55 32H14M28 17 13 32l15 15" />
      <path class="command-trail" d="M48 49h.1M57 49h.1" />
    </svg>`,
  pick: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path class="command-box" d="M22 34h32v22H22zM22 34l16 8 16-8M38 42v14" />
      <path class="command-arrow" d="M11 48V12M4 20l7-8 7 8" />
    </svg>`,
  right: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path class="command-arrow" d="M9 32h41M36 17l15 15-15 15" />
      <path class="command-trail" d="M7 49h.1M16 49h.1" />
    </svg>`,
  drop: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path class="command-box" d="M22 8h32v22H22zM22 8l16 8 16-8M38 16v14" />
      <path class="command-arrow" d="M11 8v36M4 36l7 8 7-8" />
      <path class="command-ground" d="M4 55h52" />
    </svg>`,
  up: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path class="command-arrow" d="M32 55V14M17 28l15-15 15 15" />
      <path class="command-trail" d="M49 48v.1M49 57v.1" />
    </svg>`,
  down: `
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path class="command-arrow" d="M32 9v41M17 36l15 15 15-15" />
      <path class="command-trail" d="M49 7v.1M49 16v.1" />
    </svg>`,
};

const commandColors = {
  left: "#5aaee7",
  pick: "#f9c94d",
  right: "#8c78d5",
  drop: "#f26f5b",
  up: "#72bd67",
  down: "#ef9360",
};

const commandLabels = {
  left: "Move left",
  pick: "Pick up",
  right: "Move right",
  drop: "Put down",
  up: "Move up",
  down: "Move down",
};

const movements = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};

const STORAGE_KEY = "roboRouteProgressV1";
const SOUND_KEY = "roboRouteSoundV1";
const SPARE_SLOTS = 2;
const IDLE_HINT_DELAY = 12000;
const ORIGINAL_LEVEL_COUNT = 6;

function copyPosition(position) {
  return { x: position.x, y: position.y };
}

function positionsMatch(first, second) {
  return first.x === second.x && first.y === second.y;
}

function slotCount(level) {
  return level.solution.length + SPARE_SLOTS;
}

function isBlockedOn(level, position, gateOpen = Boolean(level.gateInitiallyOpen)) {
  const outsideGrid = position.x < 0 || position.x > 5 || position.y < 0 || position.y > 2;
  const hitsObstacle = level.obstacles.some((obstacle) => positionsMatch(position, obstacle));
  const hitsClosedGate = Boolean(
    level.gate && !gateOpen && positionsMatch(position, level.gate),
  );
  return outsideGrid || hitsObstacle || hitsClosedGate;
}

function normalizeProgress(saved) {
  if (!saved || typeof saved !== "object") {
    return { maxUnlockedLevel: 0, completedLevels: [] };
  }

  const completedLevels = Array.isArray(saved.completedLevels) ? saved.completedLevels : [];
  const completedOriginalLevels = Array.from(
    { length: ORIGINAL_LEVEL_COUNT },
    (_, index) => index,
  ).every((index) => completedLevels.includes(index));
  const savedMaximum = Math.min(Number(saved.maxUnlockedLevel) || 0, levels.length - 1);

  return {
    maxUnlockedLevel: completedOriginalLevels
      ? Math.max(savedMaximum, ORIGINAL_LEVEL_COUNT)
      : savedMaximum,
    completedLevels,
  };
}

// Replays a program without animation so hints can read the real world state
// instead of comparing the child's route against the stored reference solution.
function simulate(level, commands) {
  let robotPosition = copyPosition(level.robot);
  let parcelPosition = copyPosition(level.parcel);
  let carrying = false;
  let delivered = false;
  let gateOpen = Boolean(level.gateInitiallyOpen);

  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index];
    const movement = movements[command];
    const fail = {
      failedAt: index,
      robotPosition,
      parcelPosition,
      carrying,
      delivered,
      gateOpen,
    };

    if (movement) {
      const next = { x: robotPosition.x + movement.x, y: robotPosition.y + movement.y };
      if (isBlockedOn(level, next, gateOpen)) return fail;
      robotPosition = next;
      if (carrying) parcelPosition = copyPosition(next);
      if (level.button && positionsMatch(robotPosition, level.button)) gateOpen = true;
    } else if (command === "pick") {
      if (carrying || !positionsMatch(parcelPosition, robotPosition)) return fail;
      carrying = true;
    } else if (command === "drop") {
      if (!carrying || !positionsMatch(robotPosition, level.station)) return fail;
      carrying = false;
      delivered = true;
    }
  }

  return { failedAt: -1, robotPosition, parcelPosition, carrying, delivered, gateOpen };
}

// Breadth-first search for the first command of a shortest finish from here,
// so any legal route the child invented gets a useful next step.
function nextHelpfulCommand(level, from) {
  if (from.delivered) return null;
  const initialGateOpen = from.gateOpen ?? Boolean(level.gateInitiallyOpen);
  const keyOf = (position, carrying, gateOpen) => (
    `${position.x},${position.y},${carrying ? 1 : 0},${gateOpen ? 1 : 0}`
  );
  const queue = [{
    position: from.robotPosition,
    carrying: from.carrying,
    gateOpen: initialGateOpen,
    first: null,
  }];
  const seen = new Set([keyOf(from.robotPosition, from.carrying, initialGateOpen)]);

  while (queue.length > 0) {
    const node = queue.shift();

    for (const command of level.commands) {
      let position = node.position;
      let carrying = node.carrying;
      let gateOpen = node.gateOpen;

      if (command === "pick") {
        if (carrying || !positionsMatch(position, level.parcel)) continue;
        carrying = true;
      } else if (command === "drop") {
        if (!carrying || !positionsMatch(position, level.station)) continue;
        return node.first ?? command;
      } else {
        const movement = movements[command];
        const next = { x: position.x + movement.x, y: position.y + movement.y };
        if (isBlockedOn(level, next, gateOpen)) continue;
        position = next;
        if (level.button && positionsMatch(position, level.button)) gateOpen = true;
      }

      const key = keyOf(position, carrying, gateOpen);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ position, carrying, gateOpen, first: node.first ?? command });
    }
  }

  return null;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    levels,
    movements,
    SPARE_SLOTS,
    ORIGINAL_LEVEL_COUNT,
    copyPosition,
    positionsMatch,
    slotCount,
    isBlockedOn,
    normalizeProgress,
    simulate,
    nextHelpfulCommand,
  };
}

if (typeof document !== "undefined") {
  const prefersReducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

  // Reduced motion removes the walk animation, so the waits that covered it have
  // to shrink too. Otherwise the robot appears to freeze between commands.
  function paceOf(milliseconds) {
    return prefersReducedMotion.matches ? 1 : milliseconds;
  }

  function readProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return normalizeProgress(saved);
    } catch {
      return { maxUnlockedLevel: 0, completedLevels: [] };
    }
  }

  function readSoundSetting() {
    try {
      return localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      return true;
    }
  }

  const savedProgress = readProgress();

  const state = {
    currentLevel: 0,
    maxUnlockedLevel: savedProgress.maxUnlockedLevel,
    completedLevels: new Set(savedProgress.completedLevels),
    commands: [],
    robotPosition: { x: 2, y: 1 },
    parcelPosition: { x: 1, y: 1 },
    carrying: false,
    delivered: false,
    gateOpen: false,
    running: false,
    soundOn: readSoundSetting(),
  };

  const robot = document.querySelector("#robot");
  const parcel = document.querySelector("#parcel");
  const station = document.querySelector(".delivery-station");
  const obstacles = document.querySelector("#obstacles");
  const floorButtons = document.querySelector("#floorButtons");
  const gates = document.querySelector("#gates");
  const levelProgress = document.querySelector("#levelProgress");
  const programStrip = document.querySelector("#programStrip");
  const commandPalette = document.querySelector("#commandPalette");
  const playButton = document.querySelector("#playButton");
  const clearButton = document.querySelector("#clearButton");
  const soundButton = document.querySelector("#soundButton");
  const hintButton = document.querySelector("#hintButton");
  const againButton = document.querySelector("#againButton");
  const successLayer = document.querySelector("#successLayer");
  const finalParade = document.querySelector("#finalParade");
  const confetti = document.querySelector("#confetti");
  const coach = document.querySelector("#coach");
  const stationLight = document.querySelector(".station-light");
  const commandButtons = [...document.querySelectorAll(".command-button")];

  let idleHintTimer = 0;

  // The lamp is the only way out of a stuck route, so it offers itself after a
  // long pause instead of waiting to be discovered.
  function restartIdleHint() {
    window.clearTimeout(idleHintTimer);
    hintButton.classList.remove("is-idle");
    if (state.running || state.delivered) return;
    idleHintTimer = window.setTimeout(() => {
      if (!state.running) hintButton.classList.add("is-idle");
    }, IDLE_HINT_DELAY);
  }

  function currentLevel() {
    return levels[state.currentLevel];
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        maxUnlockedLevel: state.maxUnlockedLevel,
        completedLevels: [...state.completedLevels],
      }));
    } catch {
      // Private browsing modes can refuse writes. Progress stays for this session only.
    }
  }

  function playTone(frequency, duration = 0.12, wave = "sine", volume = 0.08, delay = 0) {
    if (!state.soundOn) return;
    window.GameSound?.tone({ frequency, duration, wave, volume, delay });
  }

  function playSuccessSound() {
    playTone(523, 0.17, "sine", 0.09, 0);
    playTone(659, 0.17, "sine", 0.09, 0.14);
    playTone(784, 0.3, "sine", 0.1, 0.28);
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  function setGridPosition(element, position, zIndex = 3 + position.y * 3) {
    element.style.setProperty("--x", position.x);
    element.style.setProperty("--y", position.y);
    element.style.zIndex = String(zIndex);
  }

  function updateGateMechanic() {
    floorButtons.firstElementChild?.classList.toggle("is-pressed", state.gateOpen);
    gates.firstElementChild?.classList.toggle("is-open", state.gateOpen);
  }

  function updateWorld() {
    setGridPosition(robot, state.robotPosition);
    setGridPosition(parcel, state.parcelPosition);
    setGridPosition(station, currentLevel().station);
    robot.classList.toggle("is-carrying", state.carrying);
    parcel.classList.toggle("is-hidden", state.carrying || state.delivered);
    stationLight.classList.toggle("is-active", state.delivered);
    updateGateMechanic();
  }

  function renderObstacles() {
    obstacles.replaceChildren();
    currentLevel().obstacles.forEach((position) => {
      const obstacle = document.createElement("span");
      obstacle.className = "obstacle";
      setGridPosition(obstacle, position);
      obstacles.append(obstacle);
    });
  }

  function renderGateMechanic() {
    const level = currentLevel();
    floorButtons.replaceChildren();
    gates.replaceChildren();

    if (level.button) {
      const button = document.createElement("span");
      button.className = "floor-button";
      button.innerHTML = `
        <span class="button-base"></span>
        <span class="button-plate">
          <svg viewBox="0 0 64 64">
            <path d="M29 54c-9-1-13-8-9-16l8-17c2-5 10-5 12 1l6 18c2 8-6 15-17 14Z" />
            <circle cx="22" cy="17" r="5" />
            <circle cx="31" cy="11" r="5" />
            <circle cx="41" cy="12" r="4.5" />
            <circle cx="49" cy="18" r="4" />
          </svg>
        </span>`;
      setGridPosition(button, level.button, 2);
      floorButtons.append(button);
    }

    if (level.gate) {
      const gate = document.createElement("span");
      gate.className = "gate";
      gate.innerHTML = `
        <span class="gate-opening">
          <span class="gate-panel"><span class="gate-lock">×</span></span>
        </span>
        <span class="gate-frame"></span>`;
      setGridPosition(gate, level.gate, 5 + level.gate.y * 3);
      gates.append(gate);
    }

    updateGateMechanic();
  }

  function renderLevelProgress() {
    levelProgress.replaceChildren();
    levels.forEach((level, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "level-dot";
      button.setAttribute("aria-label", `Level ${index + 1}`);
      button.classList.toggle("is-current", index === state.currentLevel);
      button.classList.toggle("is-complete", state.completedLevels.has(index));
      button.disabled = index > state.maxUnlockedLevel || state.running;
      button.addEventListener("click", () => loadLevel(index));
      levelProgress.append(button);
    });
  }

  function renderAvailableCommands() {
    const availableCommands = currentLevel().commands;
    commandPalette.dataset.commandCount = availableCommands.length;
    commandButtons.forEach((button) => {
      button.hidden = !availableCommands.includes(button.dataset.command);
    });
  }

  function resetWorld() {
    state.robotPosition = copyPosition(currentLevel().robot);
    state.parcelPosition = copyPosition(currentLevel().parcel);
    state.carrying = false;
    state.delivered = false;
    state.gateOpen = Boolean(currentLevel().gateInitiallyOpen);
    robot.classList.remove("is-confused", "is-stepping");
    gates.firstElementChild?.classList.remove("is-opening", "is-blocked");
    floorButtons.firstElementChild?.classList.remove("is-activating");
    updateWorld();
  }

  function renderProgram() {
    const slots = slotCount(currentLevel());
    programStrip.replaceChildren();
    programStrip.style.setProperty("--slot-count", slots);

    for (let index = 0; index < slots; index += 1) {
      const slot = document.createElement("button");
      const command = state.commands[index];
      slot.className = "program-slot";
      slot.type = "button";
      slot.dataset.index = index;
      slot.setAttribute("role", "listitem");

      if (command) {
        slot.classList.add("is-filled");
        slot.style.setProperty("--slot-color", commandColors[command]);
        slot.innerHTML = commandIcons[command];
        slot.setAttribute("aria-label", `${commandLabels[command]}. Tap to remove.`);
        slot.addEventListener("click", () => removeCommand(index));
      } else {
        slot.setAttribute("aria-label", `Empty command slot ${index + 1}`);
        slot.disabled = true;
      }

      programStrip.append(slot);
    }
  }

  function setControlsDisabled(disabled) {
    playButton.disabled = disabled;
    clearButton.disabled = disabled;
    hintButton.disabled = disabled;
    commandButtons.forEach((button) => {
      button.disabled = disabled;
    });
    renderLevelProgress();
  }

  function clearHints() {
    document.querySelectorAll(".is-hinted, .is-wrong").forEach((element) => {
      element.classList.remove("is-hinted", "is-wrong");
    });
  }

  function addCommand(command) {
    if (state.running || state.commands.length >= slotCount(currentLevel())) return;
    clearHints();
    coach.classList.add("is-hidden");
    state.commands.push(command);
    restartIdleHint();
    playTone(330 + state.commands.length * 30, 0.08, "triangle", 0.06);
    renderProgram();
  }

  function removeCommand(index) {
    if (state.running) return;
    clearHints();
    state.commands.splice(index, 1);
    restartIdleHint();
    playTone(220, 0.08, "triangle", 0.05);
    renderProgram();
  }

  function clearProgram() {
    if (state.running) return;
    state.commands = [];
    resetWorld();
    clearHints();
    renderProgram();
    playTone(210, 0.12, "triangle", 0.05);
  }

  function markSlot(index, className) {
    const slot = programStrip.children[index];
    if (slot) slot.classList.add(className);
  }

  function suggestNextCommand(outcome) {
    const nextCommand = nextHelpfulCommand(currentLevel(), outcome);

    if (!nextCommand || state.commands.length >= slotCount(currentLevel())) {
      playButton.classList.add("is-hinted");
      window.setTimeout(() => playButton.classList.remove("is-hinted"), 1900);
      return;
    }

    markSlot(state.commands.length, "is-hinted");
    document.querySelector(`[data-command="${nextCommand}"]`)?.classList.add("is-hinted");
  }

  function showHint() {
    if (state.running) return;
    window.clearTimeout(idleHintTimer);
    hintButton.classList.remove("is-idle");
    clearHints();
    const outcome = simulate(currentLevel(), state.commands);

    if (outcome.failedAt >= 0) {
      markSlot(outcome.failedAt, "is-wrong");
      playTone(190, 0.16, "sine", 0.07);
      return;
    }

    if (outcome.delivered) {
      playButton.classList.add("is-hinted");
      window.setTimeout(() => playButton.classList.remove("is-hinted"), 1900);
    } else {
      suggestNextCommand(outcome);
    }

    playTone(660, 0.12, "sine", 0.07);
    playTone(880, 0.16, "sine", 0.06, 0.1);
  }

  async function animateStep() {
    robot.classList.remove("is-stepping");
    void robot.offsetWidth;
    robot.classList.add("is-stepping");
    playTone(180, 0.08, "triangle", 0.045);
    updateWorld();
    await wait(paceOf(480));
    robot.classList.remove("is-stepping");
  }

  async function activateGateIfNeeded() {
    const level = currentLevel();
    if (
      state.gateOpen
      || !level.button
      || !positionsMatch(state.robotPosition, level.button)
    ) {
      return;
    }

    state.gateOpen = true;
    const button = floorButtons.firstElementChild;
    const gate = gates.firstElementChild;
    button?.classList.add("is-activating");
    gate?.classList.add("is-opening");
    updateGateMechanic();
    playTone(420, 0.12, "triangle", 0.07);
    playTone(680, 0.18, "sine", 0.07, 0.1);
    await wait(paceOf(430));
    button?.classList.remove("is-activating");
    gate?.classList.remove("is-opening");
  }

  function isBlocked(position) {
    return isBlockedOn(currentLevel(), position, state.gateOpen);
  }

  function showBlockedGate(position) {
    const level = currentLevel();
    if (!level.gate || state.gateOpen || !positionsMatch(position, level.gate)) return;
    const gate = gates.firstElementChild;
    if (!gate) return;
    gate.classList.remove("is-blocked");
    void gate.offsetWidth;
    gate.classList.add("is-blocked");
  }

  async function executeCommand(command) {
    const movement = movements[command];
    if (movement) {
      const nextPosition = {
        x: state.robotPosition.x + movement.x,
        y: state.robotPosition.y + movement.y,
      };
      if (isBlocked(nextPosition)) {
        showBlockedGate(nextPosition);
        return false;
      }
      state.robotPosition = nextPosition;
      if (state.carrying) state.parcelPosition = copyPosition(nextPosition);
      await animateStep();
      await activateGateIfNeeded();
      return true;
    }

    if (command === "pick") {
      if (state.carrying || !positionsMatch(state.parcelPosition, state.robotPosition)) {
        return false;
      }
      state.carrying = true;
      updateWorld();
      playTone(490, 0.1, "sine", 0.07);
      playTone(720, 0.14, "sine", 0.06, 0.08);
      await wait(paceOf(450));
      return true;
    }

    if (command === "drop") {
      if (!state.carrying || !positionsMatch(state.robotPosition, currentLevel().station)) {
        return false;
      }
      state.carrying = false;
      state.delivered = true;
      updateWorld();
      playTone(760, 0.18, "triangle", 0.08);
      await wait(paceOf(480));
      return true;
    }

    return false;
  }

  async function showFailure(index) {
    markSlot(index, "is-wrong");
    robot.classList.add("is-confused");
    playTone(175, 0.18, "sawtooth", 0.045);
    playTone(135, 0.24, "sawtooth", 0.04, 0.14);
    await wait(paceOf(850));
    robot.classList.remove("is-confused");
    resetWorld();
  }

  function makeConfetti() {
    const colors = ["#f9c94d", "#f26f5b", "#32b8aa", "#5aaee7", "#8c78d5"];
    confetti.replaceChildren();

    for (let index = 0; index < 42; index += 1) {
      const piece = document.createElement("span");
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[index % colors.length];
      piece.style.animationDelay = `${Math.random() * 0.5}s`;
      piece.style.animationDuration = `${1.3 + Math.random() * 1.1}s`;
      confetti.append(piece);
    }
  }

  function showSuccess() {
    state.completedLevels.add(state.currentLevel);
    state.maxUnlockedLevel = Math.max(
      state.maxUnlockedLevel,
      Math.min(state.currentLevel + 1, levels.length - 1),
    );
    saveProgress();
    renderLevelProgress();
    makeConfetti();
    successLayer.classList.add("is-visible");
    successLayer.setAttribute("aria-hidden", "false");
    const isLastLevel = state.currentLevel === levels.length - 1;
    // Finishing every route earns a visible parade, not just another single star.
    const allDone = state.completedLevels.size === levels.length;
    successLayer.classList.toggle("is-final", allDone);
    finalParade.replaceChildren();
    if (allDone) {
      levels.forEach(() => {
        const star = document.createElement("span");
        finalParade.append(star);
      });
    }
    againButton.classList.toggle("is-replay", isLastLevel);
    againButton.setAttribute("aria-label", isLastLevel ? "Return to level one" : "Next level");
    playSuccessSound();
    againButton.focus({ preventScroll: true });
  }

  async function runProgram() {
    if (state.running) return;
    if (state.commands.length === 0) {
      showHint();
      return;
    }

    state.running = true;
    window.clearTimeout(idleHintTimer);
    hintButton.classList.remove("is-idle");
    setControlsDisabled(true);
    clearHints();
    resetWorld();
    await wait(paceOf(250));

    for (let index = 0; index < state.commands.length; index += 1) {
      markSlot(index, "is-active");
      const succeeded = await executeCommand(state.commands[index]);
      programStrip.children[index]?.classList.remove("is-active");

      if (!succeeded) {
        await showFailure(index);
        state.running = false;
        setControlsDisabled(false);
        return;
      }
    }

    if (state.delivered) {
      showSuccess();
    } else {
      // Every command ran, the parcel just is not home yet. That is an unfinished
      // route, not a mistake, so point at the next step instead of marking a slot wrong.
      const outcome = simulate(currentLevel(), state.commands);
      await wait(paceOf(280));
      resetWorld();
      suggestNextCommand(outcome);
    }

    state.running = false;
    setControlsDisabled(false);
  }

  function loadLevel(index) {
    if (state.running || index < 0 || index > state.maxUnlockedLevel) return;
    state.currentLevel = index;
    state.commands = [];
    successLayer.classList.remove("is-visible");
    successLayer.setAttribute("aria-hidden", "true");
    confetti.replaceChildren();
    clearHints();
    renderAvailableCommands();
    renderObstacles();
    renderGateMechanic();
    resetWorld();
    renderProgram();
    renderLevelProgress();
    restartIdleHint();
    coach.classList.toggle(
      "is-hidden",
      index !== 0 || state.completedLevels.has(0),
    );
  }

  function advanceLevel() {
    const isLastLevel = state.currentLevel === levels.length - 1;
    const nextLevel = isLastLevel ? 0 : state.currentLevel + 1;
    loadLevel(nextLevel);
    commandButtons.find((button) => !button.hidden)?.focus({ preventScroll: true });
  }

  function renderSoundButton() {
    soundButton.classList.toggle("is-on", state.soundOn);
    soundButton.setAttribute(
      "aria-label",
      state.soundOn ? "Turn sound off" : "Turn sound on",
    );
  }

  function toggleSound() {
    state.soundOn = !state.soundOn;
    renderSoundButton();
    try {
      localStorage.setItem(SOUND_KEY, state.soundOn ? "on" : "off");
    } catch {
      // Private browsing modes can refuse writes. The choice stays for this session only.
    }
    if (state.soundOn) playTone(620, 0.1, "sine", 0.06);
  }

  commandButtons.forEach((button) => {
    button.addEventListener("click", () => addCommand(button.dataset.command));
  });

  playButton.addEventListener("click", runProgram);
  clearButton.addEventListener("click", clearProgram);
  hintButton.addEventListener("click", showHint);
  againButton.addEventListener("click", advanceLevel);
  soundButton.addEventListener("click", toggleSound);

  renderSoundButton();

  const firstUnfinished = levels.findIndex((_, index) => !state.completedLevels.has(index));
  loadLevel(firstUnfinished === -1 ? 0 : Math.min(firstUnfinished, state.maxUnlockedLevel));
}
