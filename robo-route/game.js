const levels = [
  {
    robot: { x: 1, y: 1 },
    parcels: [{ id: "parcel-star", symbol: "star", position: { x: 1, y: 1 }, stationId: "station-star" }],
    stations: [{ id: "station-star", symbol: "star", position: { x: 4, y: 1 } }],
    obstacles: [],
    commands: ["pick", "right", "drop"],
    solution: ["pick", "right", "right", "right", "drop"],
  },
  {
    robot: { x: 2, y: 1 },
    parcels: [{ id: "parcel-star", symbol: "star", position: { x: 1, y: 1 }, stationId: "station-star" }],
    stations: [{ id: "station-star", symbol: "star", position: { x: 5, y: 1 } }],
    obstacles: [],
    commands: ["left", "pick", "right", "drop"],
    solution: ["left", "pick", "right", "right", "right", "right", "drop"],
  },
  {
    robot: { x: 1, y: 2 },
    parcels: [{ id: "parcel-star", symbol: "star", position: { x: 1, y: 1 }, stationId: "station-star" }],
    stations: [{ id: "station-star", symbol: "star", position: { x: 4, y: 1 } }],
    obstacles: [],
    commands: ["left", "pick", "right", "drop", "up"],
    solution: ["up", "pick", "right", "right", "right", "drop"],
  },
  {
    robot: { x: 0, y: 2 },
    parcels: [{ id: "parcel-star", symbol: "star", position: { x: 2, y: 2 }, stationId: "station-star" }],
    stations: [{ id: "station-star", symbol: "star", position: { x: 4, y: 0 } }],
    obstacles: [],
    commands: ["left", "pick", "right", "drop", "up"],
    solution: ["right", "right", "pick", "up", "up", "right", "right", "drop"],
  },
  {
    robot: { x: 4, y: 2 },
    parcels: [{ id: "parcel-star", symbol: "star", position: { x: 4, y: 0 }, stationId: "station-star" }],
    stations: [{ id: "station-star", symbol: "star", position: { x: 0, y: 2 } }],
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
    parcels: [{ id: "parcel-star", symbol: "star", position: { x: 2, y: 2 }, stationId: "station-star" }],
    stations: [{ id: "station-star", symbol: "star", position: { x: 4, y: 0 } }],
    obstacles: [{ x: 3, y: 2 }],
    commands: ["left", "pick", "right", "drop", "up", "down"],
    solution: ["right", "right", "pick", "up", "right", "right", "up", "drop"],
  },
  {
    robot: { x: 0, y: 2 },
    parcels: [{ id: "parcel-star", symbol: "star", position: { x: 0, y: 2 }, stationId: "station-star" }],
    stations: [{ id: "station-star", symbol: "star", position: { x: 5, y: 1 } }],
    obstacles: [],
    button: { x: 2, y: 2 },
    gate: { x: 3, y: 2 },
    gateInitiallyOpen: false,
    commands: ["left", "pick", "right", "drop", "up", "down"],
    solution: ["pick", "right", "right", "right", "right", "right", "up", "drop"],
  },
  {
    robot: { x: 0, y: 1 },
    parcels: [{ id: "parcel-star", symbol: "star", position: { x: 0, y: 1 }, stationId: "station-star" }],
    stations: [{ id: "station-star", symbol: "star", position: { x: 5, y: 1 } }],
    obstacles: [],
    button: { x: 2, y: 0 },
    gate: { x: 3, y: 1 },
    gateInitiallyOpen: false,
    commands: ["left", "pick", "right", "drop", "up", "down"],
    solution: ["pick", "right", "right", "up", "down", "right", "right", "right", "drop"],
  },
  {
    robot: { x: 2, y: 2 },
    parcels: [{ id: "parcel-star", symbol: "star", position: { x: 2, y: 1 }, stationId: "station-star" }],
    stations: [{ id: "station-star", symbol: "star", position: { x: 5, y: 1 } }],
    obstacles: [],
    button: { x: 1, y: 2 },
    gate: { x: 3, y: 1 },
    gateInitiallyOpen: false,
    commands: ["left", "pick", "right", "drop", "up", "down"],
    solution: ["left", "right", "up", "pick", "right", "right", "right", "drop"],
  },
  {
    robot: { x: 1, y: 1 },
    parcels: [{ id: "parcel-star", symbol: "star", position: { x: 1, y: 1 }, stationId: "station-star" }],
    stations: [
      { id: "station-circle", symbol: "circle", position: { x: 2, y: 1 } },
      { id: "station-star", symbol: "star", position: { x: 4, y: 1 } },
    ],
    obstacles: [],
    commands: ["left", "pick", "right", "drop", "up", "down"],
    solution: ["pick", "right", "right", "right", "drop"],
  },
  {
    robot: { x: 1, y: 1 },
    parcels: [
      { id: "parcel-star", symbol: "star", position: { x: 1, y: 0 }, stationId: "station-star" },
      { id: "parcel-circle", symbol: "circle", position: { x: 1, y: 2 }, stationId: "station-circle" },
    ],
    stations: [
      { id: "station-star", symbol: "star", position: { x: 2, y: 0 } },
      { id: "station-circle", symbol: "circle", position: { x: 2, y: 2 } },
    ],
    obstacles: [],
    commands: ["left", "pick", "right", "drop", "up", "down"],
    solution: ["up", "pick", "right", "drop", "left", "down", "down", "pick", "right", "drop"],
  },
  {
    robot: { x: 2, y: 1 },
    parcels: [
      { id: "parcel-star", symbol: "star", position: { x: 2, y: 0 }, stationId: "station-star" },
      { id: "parcel-circle", symbol: "circle", position: { x: 2, y: 2 }, stationId: "station-circle" },
    ],
    stations: [
      { id: "station-star", symbol: "star", position: { x: 4, y: 2 } },
      { id: "station-circle", symbol: "circle", position: { x: 4, y: 0 } },
    ],
    obstacles: [],
    commands: ["left", "pick", "right", "drop", "up", "down"],
    solution: ["up", "pick", "right", "right", "down", "down", "drop", "left", "left", "pick", "right", "right", "up", "up", "drop"],
  },
  {
    robot: { x: 0, y: 0 },
    parcels: [
      { id: "parcel-star", symbol: "star", position: { x: 2, y: 0 }, stationId: "station-star" },
      { id: "parcel-circle", symbol: "circle", position: { x: 1, y: 1 }, stationId: "station-circle" },
    ],
    stations: [
      { id: "station-star", symbol: "star", position: { x: 3, y: 0 } },
      { id: "station-circle", symbol: "circle", position: { x: 0, y: 1 } },
    ],
    obstacles: [{ x: 1, y: 0 }],
    commands: ["left", "pick", "right", "drop", "up", "down"],
    solution: ["down", "right", "pick", "left", "drop", "right", "right", "up", "pick", "right", "drop"],
  },
];

const symbolVisuals = {
  star: {
    name: "Star",
    color: "#5aaee7",
    markup: '<path d="m16 4 3.5 7.1 7.9 1.2-5.7 5.5 1.3 7.8-7-3.7-7 3.7 1.3-7.8-5.7-5.5 7.9-1.2z" />',
  },
  circle: {
    name: "Circle",
    color: "#ef9360",
    markup: '<circle cx="16" cy="16" r="10" />',
  },
};

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
const PREVIOUS_LEVEL_COUNT = 9;

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

function validateLevel(level, index) {
  const label = `Level ${index + 1}`;
  const parcelIds = new Set();
  const stationIds = new Set();
  const parcelPositions = new Set();

  if (!Array.isArray(level.parcels) || level.parcels.length === 0) {
    throw new Error(`${label} must contain at least one parcel.`);
  }
  if (!Array.isArray(level.stations) || level.stations.length === 0) {
    throw new Error(`${label} must contain at least one station.`);
  }

  level.stations.forEach((station) => {
    if (stationIds.has(station.id)) throw new Error(`${label} has duplicate station IDs.`);
    if (!symbolVisuals[station.symbol]) throw new Error(`${label} has an unknown station symbol.`);
    stationIds.add(station.id);
  });

  level.parcels.forEach((parcel) => {
    const positionKey = `${parcel.position.x},${parcel.position.y}`;
    if (parcelIds.has(parcel.id)) throw new Error(`${label} has duplicate parcel IDs.`);
    if (parcelPositions.has(positionKey)) {
      throw new Error(`${label} has parcels sharing a starting cell.`);
    }
    const station = level.stations.find((candidate) => candidate.id === parcel.stationId);
    if (!station) throw new Error(`${label} has a parcel without a matching station.`);
    if (station.symbol !== parcel.symbol) {
      throw new Error(`${label} has a parcel and station with different symbols.`);
    }
    parcelIds.add(parcel.id);
    parcelPositions.add(positionKey);
  });
}

function validateLevels(levelList) {
  levelList.forEach(validateLevel);
  return true;
}

validateLevels(levels);

function normalizeProgress(saved) {
  if (!saved || typeof saved !== "object") {
    return { maxUnlockedLevel: 0, completedLevels: [] };
  }

  const completedLevels = Array.isArray(saved.completedLevels) ? saved.completedLevels : [];
  const completedOriginalLevels = Array.from(
    { length: ORIGINAL_LEVEL_COUNT },
    (_, index) => index,
  ).every((index) => completedLevels.includes(index));
  const completedPreviousLevels = Array.from(
    { length: PREVIOUS_LEVEL_COUNT },
    (_, index) => index,
  ).every((index) => completedLevels.includes(index));
  const savedMaximum = Math.min(Number(saved.maxUnlockedLevel) || 0, levels.length - 1);
  let maxUnlockedLevel = savedMaximum;

  if (completedOriginalLevels) {
    maxUnlockedLevel = Math.max(maxUnlockedLevel, ORIGINAL_LEVEL_COUNT);
  }
  if (completedPreviousLevels) {
    maxUnlockedLevel = Math.max(maxUnlockedLevel, PREVIOUS_LEVEL_COUNT);
  }

  return {
    maxUnlockedLevel,
    completedLevels,
  };
}

function initialSimulationState(level) {
  return {
    robotPosition: copyPosition(level.robot),
    parcelStates: level.parcels.map((parcel) => ({
      id: parcel.id,
      position: copyPosition(parcel.position),
      delivered: false,
    })),
    carryingParcelId: null,
    gateOpen: Boolean(level.gateInitiallyOpen),
  };
}

function copySimulationState(state) {
  return {
    robotPosition: copyPosition(state.robotPosition),
    parcelStates: state.parcelStates.map((parcel) => ({
      id: parcel.id,
      position: copyPosition(parcel.position),
      delivered: parcel.delivered,
    })),
    carryingParcelId: state.carryingParcelId ?? null,
    gateOpen: Boolean(state.gateOpen),
  };
}

function isLevelComplete(state) {
  return state.parcelStates.every((parcel) => parcel.delivered);
}

function outcomeFromState(state, details = {}) {
  return {
    failedAt: -1,
    failureReason: null,
    ...details,
    ...state,
    delivered: isLevelComplete(state),
  };
}

function applyCommand(level, state, command) {
  const nextState = copySimulationState(state);
  const movement = movements[command];

  if (movement) {
    const nextPosition = {
      x: nextState.robotPosition.x + movement.x,
      y: nextState.robotPosition.y + movement.y,
    };
    if (isBlockedOn(level, nextPosition, nextState.gateOpen)) {
      return { succeeded: false, state, failureReason: "blocked", blockedPosition: nextPosition };
    }
    nextState.robotPosition = nextPosition;
    const carriedParcel = nextState.parcelStates.find(
      (parcel) => parcel.id === nextState.carryingParcelId,
    );
    if (carriedParcel) carriedParcel.position = copyPosition(nextPosition);
    if (level.button && positionsMatch(nextPosition, level.button)) nextState.gateOpen = true;
    return { succeeded: true, state: nextState };
  }

  if (command === "pick") {
    if (nextState.carryingParcelId) {
      return { succeeded: false, state, failureReason: "hands-full" };
    }
    const parcel = nextState.parcelStates.find(
      (candidate) => !candidate.delivered
        && positionsMatch(candidate.position, nextState.robotPosition),
    );
    if (!parcel) return { succeeded: false, state, failureReason: "no-parcel" };
    nextState.carryingParcelId = parcel.id;
    return { succeeded: true, state: nextState };
  }

  if (command === "drop") {
    if (!nextState.carryingParcelId) {
      return { succeeded: false, state, failureReason: "empty-hands" };
    }
    const parcelDefinition = level.parcels.find(
      (parcel) => parcel.id === nextState.carryingParcelId,
    );
    const matchingStation = level.stations.find(
      (station) => station.id === parcelDefinition.stationId,
    );
    const currentStation = level.stations.find(
      (station) => positionsMatch(station.position, nextState.robotPosition),
    );

    if (!positionsMatch(matchingStation.position, nextState.robotPosition)) {
      return {
        succeeded: false,
        state,
        failureReason: currentStation ? "wrong-station" : "no-station",
        carriedParcelId: parcelDefinition.id,
        matchingStationId: matchingStation.id,
        wrongStationId: currentStation?.id ?? null,
      };
    }

    const parcelState = nextState.parcelStates.find(
      (parcel) => parcel.id === nextState.carryingParcelId,
    );
    parcelState.delivered = true;
    nextState.carryingParcelId = null;
    return { succeeded: true, state: nextState };
  }

  return { succeeded: false, state, failureReason: "unknown-command" };
}

// Replays a program without animation so hints can read the real world state
// instead of comparing the child's route against the stored reference solution.
function simulate(level, commands) {
  let simulationState = initialSimulationState(level);

  for (let index = 0; index < commands.length; index += 1) {
    const result = applyCommand(level, simulationState, commands[index]);
    if (!result.succeeded) {
      return outcomeFromState(simulationState, {
        failedAt: index,
        failureReason: result.failureReason,
        blockedPosition: result.blockedPosition,
        carriedParcelId: result.carriedParcelId,
        matchingStationId: result.matchingStationId,
        wrongStationId: result.wrongStationId,
      });
    }
    simulationState = result.state;
  }

  return outcomeFromState(simulationState);
}

function simulationStateKey(state) {
  const parcels = state.parcelStates.map((parcel) => (
    `${parcel.id}:${parcel.position.x},${parcel.position.y},${parcel.delivered ? 1 : 0}`
  )).join("|");
  return [
    `${state.robotPosition.x},${state.robotPosition.y}`,
    state.carryingParcelId ?? "-",
    state.gateOpen ? "1" : "0",
    parcels,
  ].join(";");
}

// Breadth-first search uses the same transitions as the simulator and can
// choose either parcel first from the child's actual partial route.
function findShortestCompletion(level, from) {
  const initialState = copySimulationState(from);
  if (isLevelComplete(initialState)) {
    return { commands: [], firstCommand: null, exploredStates: 1 };
  }
  const queue = [{ state: initialState, commands: [] }];
  const seen = new Set([simulationStateKey(initialState)]);
  let cursor = 0;

  while (cursor < queue.length) {
    const node = queue[cursor];
    cursor += 1;

    for (const command of level.commands) {
      const result = applyCommand(level, node.state, command);
      if (!result.succeeded) continue;
      const commands = [...node.commands, command];
      if (isLevelComplete(result.state)) {
        return {
          commands,
          firstCommand: commands[0],
          exploredStates: cursor,
        };
      }
      const key = simulationStateKey(result.state);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: result.state, commands });
    }
  }

  return null;
}

function nextHelpfulCommand(level, from) {
  return findShortestCompletion(level, from)?.firstCommand ?? null;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    levels,
    movements,
    SPARE_SLOTS,
    ORIGINAL_LEVEL_COUNT,
    PREVIOUS_LEVEL_COUNT,
    copyPosition,
    positionsMatch,
    slotCount,
    isBlockedOn,
    validateLevel,
    validateLevels,
    normalizeProgress,
    initialSimulationState,
    copySimulationState,
    isLevelComplete,
    applyCommand,
    simulate,
    findShortestCompletion,
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
    parcelStates: [],
    carryingParcelId: null,
    gateOpen: false,
    running: false,
    soundOn: readSoundSetting(),
  };

  const robot = document.querySelector("#robot");
  const heldParcel = document.querySelector(".held-parcel");
  const heldParcelSymbol = document.querySelector("#heldParcelSymbol");
  const parcelContainer = document.querySelector("#parcels");
  const stationContainer = document.querySelector("#deliveryStations");
  const goalPairs = document.querySelector("#goalPairs");
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
  const commandButtons = [...document.querySelectorAll(".command-button")];
  const parcelElements = new Map();
  const stationElements = new Map();

  let idleHintTimer = 0;

  // The lamp is the only way out of a stuck route, so it offers itself after a
  // long pause instead of waiting to be discovered.
  function restartIdleHint() {
    window.clearTimeout(idleHintTimer);
    hintButton.classList.remove("is-idle");
    if (state.running || isLevelComplete(state)) return;
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

  function symbolSvg(symbol, className = "symbol-icon") {
    return `<svg class="${className}" viewBox="0 0 32 32" aria-hidden="true">
      ${symbolVisuals[symbol].markup}
    </svg>`;
  }

  function renderGoal() {
    const level = currentLevel();
    goalPairs.replaceChildren();

    level.parcels.forEach((parcel) => {
      const visual = symbolVisuals[parcel.symbol];
      const pair = document.createElement("span");
      pair.className = "goal-pair";
      pair.style.setProperty("--pair-color", visual.color);
      pair.innerHTML = `
        <span class="goal-parcel">
          <svg viewBox="0 0 64 64">
            <path class="goal-parcel-body" d="M13 22 32 12l19 10v25L32 57 13 47z" />
            <path d="m13 22 19 10 19-10M32 32v25M24 16l19 10" />
            <g class="goal-symbol" transform="translate(16 24)">${visual.markup}</g>
          </svg>
        </span>
        <span class="goal-arrow">
          <svg viewBox="0 0 72 40">
            <path d="M8 20h48" />
            <path d="m44 8 14 12-14 12" />
          </svg>
        </span>
        <span class="goal-station">
          <svg viewBox="0 0 64 64">
            <path class="goal-station-body" d="M12 27 32 10l20 17v27H12z" />
            <path d="M24 54V36h16v18" />
            <g class="goal-symbol" transform="translate(16 23)">${visual.markup}</g>
          </svg>
        </span>`;
      goalPairs.append(pair);
    });
  }

  function renderParcelsAndStations() {
    const level = currentLevel();
    parcelContainer.replaceChildren();
    stationContainer.replaceChildren();
    parcelElements.clear();
    stationElements.clear();

    level.stations.forEach((station) => {
      const visual = symbolVisuals[station.symbol];
      const element = document.createElement("div");
      element.className = "delivery-station";
      element.setAttribute("role", "img");
      element.setAttribute("aria-label", `${visual.name} delivery station`);
      element.style.setProperty("--pair-color", visual.color);
      element.innerHTML = `
        <div class="station-roof"></div>
        <div class="station-body">
          <div class="station-symbol">${symbolSvg(station.symbol)}</div>
          <div class="station-bay"><span class="station-glow"></span></div>
        </div>
        <div class="station-light"></div>`;
      setGridPosition(element, station.position, 1 + station.position.y * 3);
      stationContainer.append(element);
      stationElements.set(station.id, element);
    });

    level.parcels.forEach((parcel) => {
      const visual = symbolVisuals[parcel.symbol];
      const element = document.createElement("div");
      element.className = "parcel";
      element.setAttribute("role", "img");
      element.setAttribute("aria-label", `${visual.name} parcel`);
      element.style.setProperty("--pair-color", visual.color);
      element.innerHTML = `
        <span class="parcel-lid"></span>
        <span class="parcel-ribbon"></span>
        ${symbolSvg(parcel.symbol)}`;
      setGridPosition(element, parcel.position);
      parcelContainer.append(element);
      parcelElements.set(parcel.id, element);
    });
  }

  function updateWorld() {
    setGridPosition(robot, state.robotPosition);
    const level = currentLevel();

    state.parcelStates.forEach((parcelState) => {
      const element = parcelElements.get(parcelState.id);
      if (!element) return;
      const hidden = parcelState.delivered || parcelState.id === state.carryingParcelId;
      setGridPosition(element, parcelState.position);
      element.classList.toggle("is-hidden", hidden);
      element.setAttribute("aria-hidden", String(hidden));
    });

    level.stations.forEach((station) => {
      const element = stationElements.get(station.id);
      const delivered = level.parcels.some((parcel) => (
        parcel.stationId === station.id
        && state.parcelStates.find((parcelState) => parcelState.id === parcel.id)?.delivered
      ));
      element?.classList.toggle("is-complete", delivered);
      element?.querySelector(".station-light")?.classList.toggle("is-active", delivered);
    });

    const carriedParcel = level.parcels.find(
      (parcel) => parcel.id === state.carryingParcelId,
    );
    robot.classList.toggle("is-carrying", Boolean(carriedParcel));
    heldParcel.setAttribute("aria-hidden", String(!carriedParcel));
    if (carriedParcel) {
      const visual = symbolVisuals[carriedParcel.symbol];
      heldParcel.style.setProperty("--pair-color", visual.color);
      heldParcel.setAttribute("aria-label", `${visual.name} parcel in robot's hands`);
      heldParcelSymbol.innerHTML = visual.markup;
    } else {
      heldParcel.removeAttribute("aria-label");
      heldParcelSymbol.replaceChildren();
    }
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
    const initialState = initialSimulationState(currentLevel());
    state.robotPosition = initialState.robotPosition;
    state.parcelStates = initialState.parcelStates;
    state.carryingParcelId = initialState.carryingParcelId;
    state.gateOpen = initialState.gateOpen;
    robot.classList.remove("is-confused", "is-stepping");
    heldParcel.classList.remove("is-mismatch");
    parcelElements.forEach((element) => element.classList.remove("is-mismatch"));
    stationElements.forEach((element) => {
      element.classList.remove("is-mismatch", "is-match-target");
    });
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

  async function animateGateOpening(openedGate) {
    if (!openedGate) return;
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

  function showBlockedGate(position) {
    const level = currentLevel();
    if (!level.gate || state.gateOpen || !positionsMatch(position, level.gate)) return;
    const gate = gates.firstElementChild;
    if (!gate) return;
    gate.classList.remove("is-blocked");
    void gate.offsetWidth;
    gate.classList.add("is-blocked");
  }

  function applySimulationState(nextState) {
    state.robotPosition = nextState.robotPosition;
    state.parcelStates = nextState.parcelStates;
    state.carryingParcelId = nextState.carryingParcelId;
    state.gateOpen = nextState.gateOpen;
  }

  async function executeCommand(command) {
    const gateWasOpen = state.gateOpen;
    const result = applyCommand(currentLevel(), state, command);
    if (!result.succeeded) {
      if (result.failureReason === "blocked") showBlockedGate(result.blockedPosition);
      return result;
    }

    applySimulationState(result.state);
    const movement = movements[command];
    if (movement) {
      await animateStep();
      await animateGateOpening(!gateWasOpen && state.gateOpen);
      return result;
    }

    if (command === "pick") {
      updateWorld();
      playTone(490, 0.1, "sine", 0.07);
      playTone(720, 0.14, "sine", 0.06, 0.08);
      await wait(paceOf(450));
      return result;
    }

    if (command === "drop") {
      updateWorld();
      playTone(760, 0.18, "triangle", 0.08);
      await wait(paceOf(480));
      return result;
    }

    return result;
  }

  async function showFailure(index, failure) {
    markSlot(index, "is-wrong");
    robot.classList.add("is-confused");
    if (failure.failureReason === "wrong-station") {
      heldParcel.classList.add("is-mismatch");
      parcelElements.get(failure.carriedParcelId)?.classList.add("is-mismatch");
      stationElements.get(failure.matchingStationId)?.classList.add("is-match-target");
      stationElements.get(failure.wrongStationId)?.classList.add("is-mismatch");
    }
    playTone(175, 0.18, "sawtooth", 0.045);
    playTone(135, 0.24, "sawtooth", 0.04, 0.14);
    await wait(prefersReducedMotion.matches ? 650 : 850);
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
      const result = await executeCommand(state.commands[index]);
      programStrip.children[index]?.classList.remove("is-active");

      if (!result.succeeded) {
        await showFailure(index, result);
        state.running = false;
        setControlsDisabled(false);
        return;
      }
    }

    if (isLevelComplete(state)) {
      showSuccess();
    } else {
      // Every command ran, but not every parcel is home yet. That is an unfinished
      // route, not a mistake, so point at the next step instead of marking a slot wrong.
      const outcome = outcomeFromState(copySimulationState(state));
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
    renderGoal();
    renderParcelsAndStations();
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
