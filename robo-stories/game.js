// The first half of this file is the game model: level parsing, the simulator,
// the shortest-program search and the saved-progress rules. It has no DOM and is
// exported for the tests. The second half, guarded by `typeof document`, is the
// interface.

const RAW_STORIES = typeof ROBO_STORIES !== "undefined"
  ? ROBO_STORIES
  : require("./levels.js");

const PROGRESS_KEY = "roboStoriesProgressV1";
const SURVEY_KEY = "roboStoriesSurveyV1";
const SOUND_KEY = "roboStoriesSoundV1";
const SPARE_SLOTS = 2;
const MAX_STARS = 3;
const IDLE_HINT_DELAY = 12000;

const DIRECTIONS = ["north", "east", "south", "west"];
const VECTORS = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};
const ARROW_HEADINGS = { left: "west", right: "east", up: "north", down: "south" };
const MOVEMENT_COMMANDS = {
  arrows: ["left", "right", "up", "down"],
  turns: ["forward", "turnLeft", "turnRight"],
};
const ACTION_COMMANDS = ["pick", "drop", "repeat"];
const SURVEY_ANSWERS = ["easy", "normal", "hard"];

const SYMBOLS = {
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
  triangle: {
    name: "Triangle",
    color: "#72bd67",
    markup: '<path d="M16 5 27 26H5z" />',
  },
};

const SHAPES = {
  circle: { name: "Round", color: "#f26f5b", markup: '<circle cx="16" cy="16" r="9" />' },
  square: { name: "Square", color: "#5aaee7", markup: '<rect x="7" y="7" width="18" height="18" rx="3" />' },
};

const LEGEND = {
  ".": null,
  "#": { kind: "wall" },
  "*": { kind: "target" },
  s: { kind: "parcel", symbol: "star" },
  c: { kind: "parcel", symbol: "circle" },
  t: { kind: "parcel", symbol: "triangle" },
  S: { kind: "station", symbol: "star" },
  C: { kind: "station", symbol: "circle" },
  T: { kind: "station", symbol: "triangle" },
  o: { kind: "switch", shape: "circle" },
  O: { kind: "gate", shape: "circle" },
  q: { kind: "switch", shape: "square" },
  Q: { kind: "gate", shape: "square" },
};

function positionsMatch(first, second) {
  return first.x === second.x && first.y === second.y;
}

function parseMap(map, label) {
  if (!Array.isArray(map) || map.length === 0) throw new Error(`${label} has no map.`);
  const width = map[0].length;
  const parsed = {
    width,
    height: map.length,
    walls: [],
    targets: [],
    parcels: [],
    stations: [],
    switches: [],
    gates: [],
  };

  map.forEach((row, y) => {
    if (row.length !== width) throw new Error(`${label} has rows of different length.`);
    [...row].forEach((char, x) => {
      const entry = /[1-9]/.test(char) ? { kind: "target", order: Number(char) } : LEGEND[char];
      if (entry === undefined) throw new Error(`${label} uses an unknown map symbol "${char}".`);
      if (entry === null) return;
      if (entry.kind === "wall") parsed.walls.push({ x, y });
      if (entry.kind === "target") parsed.targets.push({ x, y, order: entry.order ?? null });
      if (entry.kind === "parcel") parsed.parcels.push({ id: entry.symbol, symbol: entry.symbol, x, y });
      if (entry.kind === "station") parsed.stations.push({ id: entry.symbol, symbol: entry.symbol, x, y });
      if (entry.kind === "switch") parsed.switches.push({ x, y, shape: entry.shape });
      if (entry.kind === "gate") parsed.gates.push({ x, y, shape: entry.shape });
    });
  });

  return parsed;
}

function validateLevel(level, label) {
  const inside = (position) => position.x >= 0 && position.x < level.width
    && position.y >= 0 && position.y < level.height;
  const isWall = (position) => level.walls.some((wall) => positionsMatch(wall, position));

  if (!inside(level.robot)) throw new Error(`${label} starts the robot outside the map.`);
  if (isWall(level.robot)) throw new Error(`${label} starts the robot inside a wall.`);
  if (level.gates.some((gate) => positionsMatch(gate, level.robot))) {
    throw new Error(`${label} starts the robot inside a gate.`);
  }
  if (level.switches.some((floorSwitch) => positionsMatch(floorSwitch, level.robot))) {
    throw new Error(`${label} starts the robot on a switch, which would never be stepped on.`);
  }
  if (level.targets.some((target) => positionsMatch(target, level.robot))) {
    throw new Error(`${label} starts the robot on a target, which would never be collected.`);
  }
  if (!DIRECTIONS.includes(level.robot.facing)) throw new Error(`${label} has an unknown facing.`);
  if (level.parcels.length === 0 && level.targets.length === 0) {
    throw new Error(`${label} has nothing to deliver or collect.`);
  }

  const parcelSymbols = new Set();
  level.parcels.forEach((parcel) => {
    if (parcelSymbols.has(parcel.symbol)) throw new Error(`${label} has two parcels with the same sign.`);
    parcelSymbols.add(parcel.symbol);
    if (!level.stations.some((station) => station.symbol === parcel.symbol)) {
      throw new Error(`${label} has a parcel without a station of the same sign.`);
    }
  });
  const stationSymbols = new Set();
  level.stations.forEach((station) => {
    if (stationSymbols.has(station.symbol)) throw new Error(`${label} has two stations with the same sign.`);
    stationSymbols.add(station.symbol);
  });

  const ordered = level.targets.filter((target) => target.order !== null);
  if (ordered.length > 0 && ordered.length !== level.targets.length) {
    throw new Error(`${label} mixes numbered and plain things to collect.`);
  }
  const orders = ordered.map((target) => target.order).sort((a, b) => a - b);
  orders.forEach((order, index) => {
    if (order !== index + 1) throw new Error(`${label} numbers its targets with gaps.`);
  });

  level.gates.forEach((gate) => {
    if (!level.switches.some((floorSwitch) => floorSwitch.shape === gate.shape)) {
      throw new Error(`${label} has a gate without a switch of the same shape.`);
    }
  });

  const allowed = [...MOVEMENT_COMMANDS[level.movement], ...ACTION_COMMANDS];
  level.commands.forEach((command) => {
    if (!allowed.includes(command)) {
      throw new Error(`${label} offers the command "${command}", which its story does not use.`);
    }
  });
  if (level.commands.length === 0) throw new Error(`${label} offers no commands.`);
  level.solution.forEach((command) => {
    if (!level.commands.includes(command)) {
      throw new Error(`${label} solves itself with "${command}", which the palette does not offer.`);
    }
  });
}

function normalizeStories(rawStories) {
  return rawStories.map((story, storyIndex) => {
    if (!MOVEMENT_COMMANDS[story.movement]) {
      throw new Error(`Story ${story.id} has an unknown movement "${story.movement}".`);
    }
    const levels = story.levels.map((raw, index) => {
      const label = `${story.title} level ${index + 1}`;
      const level = {
        ...parseMap(raw.map, label),
        id: `${story.id}-${index + 1}`,
        storyId: story.id,
        index,
        movement: story.movement,
        theme: story.theme,
        title: raw.title,
        goal: raw.goal,
        hint: raw.hint,
        robot: { x: raw.robot.x, y: raw.robot.y, facing: raw.robot.facing },
        commands: [...raw.commands],
        solution: [...raw.solution],
        par: raw.solution.length,
      };
      validateLevel(level, label);
      return level;
    });
    return { ...story, index: storyIndex, levels };
  });
}

const STORIES = normalizeStories(RAW_STORIES);

function slotCount(level) {
  return level.par + SPARE_SLOTS;
}

function starsFor(level, cardCount) {
  return Math.max(1, MAX_STARS - Math.max(0, cardCount - level.par));
}

function initialState(level) {
  return {
    robot: { x: level.robot.x, y: level.robot.y, facing: level.robot.facing },
    parcels: level.parcels.map((parcel) => ({ id: parcel.id, x: parcel.x, y: parcel.y, delivered: false })),
    carrying: null,
    collected: level.targets.map(() => false),
    openGates: [],
    lastTwo: [],
  };
}

function copyState(state) {
  return {
    robot: { ...state.robot },
    parcels: state.parcels.map((parcel) => ({ ...parcel })),
    carrying: state.carrying,
    collected: [...state.collected],
    openGates: [...state.openGates],
    lastTwo: [...state.lastTwo],
  };
}

function isComplete(level, state) {
  return state.parcels.every((parcel) => parcel.delivered)
    && state.collected.every(Boolean);
}

function blockedBy(level, state, position) {
  const outside = position.x < 0 || position.x >= level.width
    || position.y < 0 || position.y >= level.height;
  if (outside) return "edge";
  if (level.walls.some((wall) => positionsMatch(wall, position))) return "wall";
  const gate = level.gates.find((candidate) => positionsMatch(candidate, position));
  if (gate && !state.openGates.includes(gate.shape)) return "gate";
  return null;
}

function nextTargetIndex(level, state) {
  let best = -1;
  level.targets.forEach((target, index) => {
    if (state.collected[index]) return;
    if (best === -1 || target.order < level.targets[best].order) best = index;
  });
  return best;
}

function withHistory(state, command) {
  state.lastTwo = [...state.lastTwo, command].slice(-2);
  return state;
}

function applyCommand(level, state, command) {
  if (command === "turnLeft" || command === "turnRight") {
    const turn = command === "turnRight" ? 1 : -1;
    const next = copyState(state);
    const index = DIRECTIONS.indexOf(state.robot.facing);
    next.robot.facing = DIRECTIONS[(index + turn + DIRECTIONS.length) % DIRECTIONS.length];
    return { ok: true, state: withHistory(next, command), events: [{ type: "turn", facing: next.robot.facing }] };
  }

  const heading = command === "forward" ? state.robot.facing : ARROW_HEADINGS[command];
  if (heading) {
    const vector = VECTORS[heading];
    const position = { x: state.robot.x + vector.x, y: state.robot.y + vector.y };
    const block = blockedBy(level, state, position);
    if (block) {
      return { ok: false, reason: "blocked", blockedBy: block, blockedAt: position };
    }

    const next = copyState(state);
    const events = [{ type: "step", heading }];
    next.robot.x = position.x;
    next.robot.y = position.y;
    if (level.movement === "arrows") next.robot.facing = heading;

    const carried = next.parcels.find((parcel) => parcel.id === next.carrying);
    if (carried) {
      carried.x = position.x;
      carried.y = position.y;
    }

    const floorSwitch = level.switches.find((candidate) => positionsMatch(candidate, position));
    if (floorSwitch && !next.openGates.includes(floorSwitch.shape)) {
      next.openGates = [...next.openGates, floorSwitch.shape].sort();
      events.push({ type: "switch", shape: floorSwitch.shape });
    }

    const targetIndex = level.targets.findIndex((target) => positionsMatch(target, position));
    if (targetIndex >= 0 && !next.collected[targetIndex]) {
      const expected = nextTargetIndex(level, next);
      if (level.targets[targetIndex].order !== null && expected !== targetIndex) {
        events.push({ type: "wrong-order", index: targetIndex, expected });
      } else {
        next.collected[targetIndex] = true;
        events.push({ type: "collect", index: targetIndex });
      }
    }

    return { ok: true, state: withHistory(next, command), events };
  }

  if (command === "pick") {
    if (state.carrying) return { ok: false, reason: "hands-full", carriedId: state.carrying };
    const parcel = state.parcels.find((candidate) => !candidate.delivered
      && positionsMatch(candidate, state.robot));
    if (!parcel) return { ok: false, reason: "no-parcel" };
    const next = copyState(state);
    next.carrying = parcel.id;
    return { ok: true, state: withHistory(next, command), events: [{ type: "pick", parcelId: parcel.id }] };
  }

  if (command === "drop") {
    if (!state.carrying) return { ok: false, reason: "empty-hands" };
    const parcelDefinition = level.parcels.find((parcel) => parcel.id === state.carrying);
    const matchingStation = level.stations.find((station) => station.symbol === parcelDefinition.symbol);
    const currentStation = level.stations.find((station) => positionsMatch(station, state.robot));
    if (!currentStation || currentStation.symbol !== parcelDefinition.symbol) {
      return {
        ok: false,
        reason: currentStation ? "wrong-station" : "no-station",
        carriedId: parcelDefinition.id,
        matchingStationId: matchingStation.id,
        wrongStationId: currentStation?.id ?? null,
      };
    }
    const next = copyState(state);
    const parcel = next.parcels.find((candidate) => candidate.id === next.carrying);
    parcel.delivered = true;
    next.carrying = null;
    return { ok: true, state: withHistory(next, command), events: [{ type: "drop", parcelId: parcel.id }] };
  }

  return { ok: false, reason: "unknown-command" };
}

// A "repeat" card copies the two actions before it, so the program can be
// expanded before it runs. A repeat with fewer than two earlier actions is
// kept as an invalid step and reported at its own card.
function expandProgram(program) {
  const expanded = [];
  program.forEach((command, sourceIndex) => {
    if (command !== "repeat") {
      expanded.push({ command, sourceIndex });
      return;
    }
    const tail = expanded.slice(-2);
    if (tail.length < 2) {
      expanded.push({ command, sourceIndex, invalid: true });
      return;
    }
    tail.forEach((entry) => expanded.push({ command: entry.command, sourceIndex }));
  });
  return expanded;
}

function findInvalidRepeat(program) {
  return expandProgram(program).find((step) => step.invalid)?.sourceIndex ?? -1;
}

// The cards a repeat copies, traced through earlier repeats down to concrete
// cards, so the interface can light them up together with the repeat card.
function repeatSources(program, repeatIndex) {
  const expanded = expandProgram(program.slice(0, repeatIndex));
  const direct = [...new Set(expanded.slice(-2).map((entry) => entry.sourceIndex))];
  return [...new Set(direct.flatMap((index) => (
    program[index] === "repeat" ? repeatSources(program, index) : [index]
  )))];
}

// Replays a program without animation. The run stops at the first card that
// cannot execute and at the moment the goal is reached, so cards after the
// goal never spoil a finished route.
function simulate(level, program) {
  let state = initialState(level);
  const steps = expandProgram(program);

  for (const step of steps) {
    if (step.invalid) {
      return { failedAt: step.sourceIndex, reason: "repeat-needs-two", complete: false, state };
    }
    const result = applyCommand(level, state, step.command);
    if (!result.ok) {
      const { ok, reason, ...details } = result;
      return { failedAt: step.sourceIndex, reason, complete: false, state, ...details };
    }
    state = result.state;
    if (isComplete(level, state)) {
      return { failedAt: -1, reason: null, complete: true, state, completedAt: step.sourceIndex };
    }
  }

  return { failedAt: -1, reason: null, complete: false, state };
}

function stateKey(level, state, withHistoryKey) {
  const parts = [
    `${state.robot.x},${state.robot.y}`,
    level.movement === "turns" ? state.robot.facing[0] : "",
    state.carrying ?? "-",
    state.parcels.map((parcel) => (parcel.delivered ? "D" : "-")).join(""),
    state.collected.map((flag) => (flag ? "1" : "0")).join(""),
    state.openGates.join("+"),
    withHistoryKey ? state.lastTwo.join(",") : "",
  ];
  return parts.join(";");
}

// Breadth-first search over the same transitions as the simulator. It counts
// cards, not steps: a repeat card is one transition that performs two moves.
// Used by the hint from the child's real position and by the tests to confirm
// that every stored solution is the shortest.
function findShortestCompletion(level, fromState) {
  if (isComplete(level, fromState)) return { commands: [], explored: 0 };
  const usesRepeat = level.commands.includes("repeat");
  const key = (state) => stateKey(level, state, usesRepeat);
  const nodes = [{ state: fromState, parent: -1, command: null }];
  const seen = new Set([key(fromState)]);
  let cursor = 0;

  const pathTo = (nodeIndex, lastCommand) => {
    const commands = [lastCommand];
    let index = nodeIndex;
    while (index > 0) {
      commands.unshift(nodes[index].command);
      index = nodes[index].parent;
    }
    return commands;
  };

  while (cursor < nodes.length) {
    const node = nodes[cursor];
    for (const command of level.commands) {
      let resultState;
      if (command === "repeat") {
        if (node.state.lastTwo.length < 2) continue;
        const [first, second] = node.state.lastTwo;
        const afterFirst = applyCommand(level, node.state, first);
        if (!afterFirst.ok) continue;
        if (isComplete(level, afterFirst.state)) {
          return { commands: pathTo(cursor, command), explored: cursor + 1 };
        }
        const afterSecond = applyCommand(level, afterFirst.state, second);
        if (!afterSecond.ok) continue;
        resultState = afterSecond.state;
      } else {
        const result = applyCommand(level, node.state, command);
        if (!result.ok) continue;
        resultState = result.state;
      }

      if (isComplete(level, resultState)) {
        return { commands: pathTo(cursor, command), explored: cursor + 1 };
      }
      const resultKey = key(resultState);
      if (seen.has(resultKey)) continue;
      seen.add(resultKey);
      nodes.push({ state: resultState, parent: cursor, command });
    }
    cursor += 1;
  }

  return null;
}

function nextHelpfulCommand(level, fromState) {
  return findShortestCompletion(level, fromState)?.commands[0] ?? null;
}

// Saved progress: best stars per level, grouped by story. Garbage becomes an
// empty record instead of breaking the game.
function normalizeProgress(saved) {
  const progress = { stories: {} };
  const stories = saved && typeof saved === "object" ? saved.stories : null;
  if (!stories || typeof stories !== "object") return progress;
  STORIES.forEach((story) => {
    const record = stories[story.id];
    if (!record || typeof record !== "object") return;
    const levels = {};
    story.levels.forEach((level) => {
      const stars = Number(record[level.index]);
      if (Number.isInteger(stars) && stars >= 1 && stars <= MAX_STARS) levels[level.index] = stars;
    });
    if (Object.keys(levels).length > 0) progress.stories[story.id] = levels;
  });
  return progress;
}

function levelStars(progress, story, index) {
  return progress.stories[story.id]?.[index] ?? 0;
}

function isLevelUnlocked(progress, story, index) {
  return index === 0 || levelStars(progress, story, index - 1) > 0;
}

function completedCount(progress, story) {
  return story.levels.filter((level) => levelStars(progress, story, level.index) > 0).length;
}

function isStoryComplete(progress, story) {
  return completedCount(progress, story) === story.levels.length;
}

function recordStars(progress, story, index, stars) {
  const record = progress.stories[story.id] ?? {};
  record[index] = Math.max(record[index] ?? 0, stars);
  progress.stories[story.id] = record;
  return progress;
}

function normalizeSurvey(saved) {
  if (!Array.isArray(saved)) return [];
  return saved.filter((entry) => entry && typeof entry === "object"
    && typeof entry.story === "string"
    && Number.isInteger(entry.level)
    && SURVEY_ANSWERS.includes(entry.answer));
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    STORIES,
    SPARE_SLOTS,
    MAX_STARS,
    SURVEY_ANSWERS,
    SYMBOLS,
    SHAPES,
    parseMap,
    normalizeStories,
    slotCount,
    starsFor,
    initialState,
    applyCommand,
    expandProgram,
    findInvalidRepeat,
    repeatSources,
    simulate,
    isComplete,
    findShortestCompletion,
    nextHelpfulCommand,
    normalizeProgress,
    levelStars,
    isLevelUnlocked,
    completedCount,
    isStoryComplete,
    recordStars,
    normalizeSurvey,
  };
}

if (typeof document !== "undefined") {
  const prefersReducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

  // Reduced motion removes the walk animation, so the waits that covered it
  // shrink too. Otherwise the robot appears to freeze between commands.
  function paceOf(milliseconds) {
    return prefersReducedMotion.matches ? 1 : milliseconds;
  }

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private browsing modes can refuse writes. The value stays for this session only.
    }
  }

  function readSoundSetting() {
    try {
      return localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      return true;
    }
  }

  const COMMAND_LABELS = {
    left: "Move left",
    right: "Move right",
    up: "Move up",
    down: "Move down",
    forward: "Forward",
    turnLeft: "Turn left",
    turnRight: "Turn right",
    pick: "Pick up",
    drop: "Put down",
    repeat: "Repeat two",
  };

  const KEY_COMMANDS = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
    KeyF: "forward",
    KeyL: "turnLeft",
    KeyR: "turnRight",
    KeyP: "pick",
    KeyD: "drop",
    KeyX: "repeat",
  };

  const ACCESSORIES = {
    cap: "🧢",
    key: "🔑",
    bolt: "⚡",
    flag: "🚩",
    broom: "🧹",
    compass: "🧭",
  };

  const $ = (selector) => document.querySelector(selector);
  const shell = $(".game-shell");
  const screens = {
    menu: $("#menuScreen"),
    story: $("#storyScreen"),
    play: $("#playScreen"),
    done: $("#storyDoneScreen"),
  };
  const backButton = $("#backButton");
  const levelBadge = $("#levelBadge");
  const goalCard = $("#goalCard");
  const goalPairs = $("#goalPairs");
  const soundButton = $("#soundButton");
  const parentButton = $("#parentButton");
  const storyGrid = $("#storyGrid");
  const levelGrid = $("#levelGrid");
  const worldCard = $("#worldCard");
  const track = $("#track");
  const tiles = $("#tiles");
  const layers = {
    walls: $("#walls"),
    switches: $("#switches"),
    gates: $("#gates"),
    stations: $("#stations"),
    targets: $("#targets"),
    parcels: $("#parcels"),
  };
  const robot = $("#robot");
  const robotBeam = $("#robotBeam");
  const heldParcel = $("#heldParcel");
  const heldParcelSymbol = $("#heldParcelSymbol");
  const hintButton = $("#hintButton");
  const successLayer = $("#successLayer");
  const resultStars = $("#resultStars");
  const survey = $("#survey");
  const nextButton = $("#nextButton");
  const confetti = $("#confetti");
  const coach = $("#coach");
  const clearButton = $("#clearButton");
  const programStrip = $("#programStrip");
  const playButton = $("#playButton");
  const commandPalette = $("#commandPalette");
  const commandButtons = [...commandPalette.querySelectorAll(".command-button")];
  const adultTitle = $("#adultTitle");
  const adultGoal = $("#adultGoal");
  const adultHint = $("#adultHint");
  const parentPanel = $("#parentPanel");
  const surveyTable = $("#surveyTable");
  const copyStatus = $("#copyStatus");
  const surveyJson = $("#surveyJson");

  const commandIcons = Object.fromEntries(commandButtons.map((button) => [
    button.dataset.command,
    button.querySelector("svg").outerHTML,
  ]));
  const commandColors = Object.fromEntries(commandButtons.map((button) => [
    button.dataset.command,
    getComputedStyle(button).getPropertyValue("--button-color").trim(),
  ]));

  const parcelElements = new Map();
  const stationElements = new Map();
  const targetElements = [];
  const switchElements = new Map();
  const gateElements = new Map();

  const state = {
    screen: "menu",
    progress: normalizeProgress(readJson(PROGRESS_KEY)),
    survey: normalizeSurvey(readJson(SURVEY_KEY)),
    soundOn: readSoundSetting(),
    story: STORIES[0],
    level: STORIES[0].levels[0],
    program: [],
    world: initialState(STORIES[0].levels[0]),
    running: false,
    session: { startedAt: Date.now(), runs: 0, hints: 0 },
    pendingSurvey: null,
    storyJustFinished: false,
  };

  let idleHintTimer = 0;
  let copyStatusTimer = 0;

  function saveProgress() {
    writeJson(PROGRESS_KEY, state.progress);
  }

  function saveSurvey() {
    writeJson(SURVEY_KEY, state.survey);
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

  function symbolSvg(symbol, className = "symbol-icon") {
    return `<svg class="${className}" viewBox="0 0 32 32" aria-hidden="true">${SYMBOLS[symbol].markup}</svg>`;
  }

  function shapeSvg(shape, className = "shape-icon") {
    return `<svg class="${className}" viewBox="0 0 32 32" aria-hidden="true">${SHAPES[shape].markup}</svg>`;
  }

  function targetMarkup(theme) {
    if (theme === "mars") {
      return `<span class="target-art target-crystal"><svg viewBox="0 0 48 48" aria-hidden="true">
        <path class="crystal-body" d="M24 4 40 20 24 44 8 20z" />
        <path d="M8 20h32M24 4l-6 16 6 24 6-24z" />
      </svg></span>`;
    }
    if (theme === "room") {
      return `<span class="target-art target-dust"><svg viewBox="0 0 48 48" aria-hidden="true">
        <path class="dust-body" d="M10 30c-4-8 4-16 12-14 3-6 14-6 16 2 6 0 8 10 2 13-1 6-9 8-14 4-5 4-14 2-16-5z" />
        <circle cx="18" cy="26" r="2.4" /><circle cx="28" cy="22" r="2.2" /><circle cx="30" cy="31" r="2" />
      </svg></span>`;
    }
    return `<span class="target-art target-battery"><span class="battery-cap"></span><svg viewBox="0 0 32 48" aria-hidden="true">
      <path d="M18 6 8 26h8l-2 16 10-20h-8z" />
    </svg></span>`;
  }

  function setGridPosition(element, position) {
    element.style.setProperty("--x", position.x);
    element.style.setProperty("--y", position.y);
  }

  function screenHeading(name) {
    return screens[name].querySelector("h1, h2, [data-screen-focus]");
  }

  function showScreen(name) {
    state.screen = name;
    shell.dataset.screen = name;
    Object.entries(screens).forEach(([key, section]) => {
      section.hidden = key !== name;
    });
    backButton.hidden = name === "menu" || name === "done";
    levelBadge.hidden = name !== "play";
    goalCard.hidden = name !== "play";
    window.clearTimeout(idleHintTimer);
    hintButton.classList.remove("is-idle");
    window.scrollTo({ top: 0, behavior: "auto" });
    screenHeading(name)?.focus?.({ preventScroll: true });
  }

  // ---- Menu of stories ----

  function renderMascot(container) {
    container.querySelectorAll(".accessory").forEach((badge) => {
      const story = STORIES.find((candidate) => candidate.accessory === badge.dataset.accessory);
      badge.hidden = !story || !isStoryComplete(state.progress, story);
    });
  }

  function renderStoryMenu() {
    storyGrid.replaceChildren();
    STORIES.forEach((story) => {
      const done = completedCount(state.progress, story);
      const total = story.levels.length;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "story-card";
      card.classList.toggle("is-complete", done === total);
      card.dataset.story = story.id;
      card.innerHTML = `
        <span class="story-card-emoji" aria-hidden="true">${story.emoji}</span>
        <span class="story-card-title"></span>
        <span class="story-card-lead adult-text"></span>
        <span class="story-card-progress" aria-hidden="true">
          <span class="progress-bar"><span class="progress-fill" style="--fill: ${done / total}"></span></span>
          <span class="progress-text">${done} / ${total}</span>
        </span>
        <span class="story-card-mark" aria-hidden="true">${done === total ? ACCESSORIES[story.accessory] : ""}</span>`;
      card.querySelector(".story-card-title").textContent = story.title;
      card.querySelector(".story-card-lead").textContent = story.lead;
      card.setAttribute("aria-label", `${story.title}. ${done} of ${total} levels done.`);
      card.addEventListener("click", () => openStory(story));
      storyGrid.append(card);
    });
    renderMascot($("#mascot"));
  }

  // ---- One story: the grid of levels ----

  function miniMap(level) {
    const cells = [];
    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        const position = { x, y };
        const classes = ["mini-cell"];
        if (level.walls.some((wall) => positionsMatch(wall, position))) classes.push("is-wall");
        if (level.targets.some((target) => positionsMatch(target, position))) classes.push("is-target");
        if (level.stations.some((station) => positionsMatch(station, position))) classes.push("is-station");
        if (level.parcels.some((parcel) => positionsMatch(parcel, position))) classes.push("is-parcel");
        if (level.gates.some((gate) => positionsMatch(gate, position))) classes.push("is-gate");
        if (level.switches.some((floorSwitch) => positionsMatch(floorSwitch, position))) classes.push("is-switch");
        if (positionsMatch(level.robot, position)) classes.push("is-robot");
        cells.push(`<i class="${classes.join(" ")}"></i>`);
      }
    }
    return `<span class="mini-map" style="--columns: ${level.width}" aria-hidden="true">${cells.join("")}</span>`;
  }

  function starRow(stars) {
    return `<span class="star-row" aria-hidden="true">${Array.from({ length: MAX_STARS }, (_, index) => (
      `<i class="${index < stars ? "is-filled" : ""}"></i>`
    )).join("")}</span>`;
  }

  function renderLevelGrid() {
    const story = state.story;
    $("#storyEmoji").textContent = story.emoji;
    $("#storyTitle").textContent = story.title;
    $("#storyLead").textContent = story.lead;
    levelGrid.replaceChildren();

    story.levels.forEach((level) => {
      const unlocked = isLevelUnlocked(state.progress, story, level.index);
      const stars = levelStars(state.progress, story, level.index);
      const isNext = unlocked && stars === 0;
      const card = document.createElement("button");
      card.type = "button";
      card.className = "level-card";
      card.classList.toggle("is-locked", !unlocked);
      card.classList.toggle("is-done", stars > 0);
      card.classList.toggle("is-next", isNext);
      card.disabled = !unlocked;
      card.innerHTML = `
        <span class="level-card-number" aria-hidden="true">${level.index + 1}</span>
        ${miniMap(level)}
        <span class="level-card-lock" aria-hidden="true">🔒</span>
        ${starRow(stars)}
        <span class="level-card-title adult-text"></span>
        <span class="level-card-note adult-text"${unlocked ? " hidden" : ""}>Finish the previous level first.</span>`;
      card.querySelector(".level-card-title").textContent = level.title;
      const stateLabel = stars > 0 ? `${stars} of 3 stars` : unlocked ? "Open" : "Locked";
      card.setAttribute("aria-label", `Level ${level.index + 1}: ${level.title}. ${stateLabel}`);
      card.addEventListener("click", () => openLevel(story, level.index));
      levelGrid.append(card);
    });
  }

  function openStory(story) {
    state.story = story;
    renderLevelGrid();
    showScreen("story");
  }

  // ---- The play screen ----

  function currentLevel() {
    return state.level;
  }

  function fitTrack() {
    const level = currentLevel();
    const styles = getComputedStyle(worldCard);
    const horizontal = parseFloat(styles.getPropertyValue("--track-inset-x")) || 60;
    const top = parseFloat(styles.getPropertyValue("--track-inset-top")) || 70;
    const bottom = parseFloat(styles.getPropertyValue("--track-inset-bottom")) || 28;
    const availableWidth = worldCard.clientWidth - horizontal * 2;
    const availableHeight = worldCard.clientHeight - top - bottom;
    const cell = Math.max(30, Math.floor(Math.min(
      availableWidth / level.width,
      availableHeight / level.height,
    )));
    track.style.setProperty("--cell", `${cell}px`);
    track.style.setProperty("--columns", level.width);
    track.style.setProperty("--rows", level.height);
    track.style.width = `${cell * level.width}px`;
    track.style.height = `${cell * level.height}px`;
    track.style.top = `${top + Math.max(0, (availableHeight - cell * level.height) / 2)}px`;
  }

  // The headlight turns the short way round: a left turn from north must not
  // spin three quarters clockwise just because the angles wrap at 360.
  const FACING_ANGLES = { east: 0, south: 90, west: 180, north: 270 };
  let beamAngle = 0;

  function pointBeam(facing) {
    const current = ((beamAngle % 360) + 360) % 360;
    const delta = ((FACING_ANGLES[facing] - current + 540) % 360) - 180;
    beamAngle += delta;
    robotBeam.style.setProperty("--angle", `${beamAngle}deg`);
  }

  function renderTiles() {
    const level = currentLevel();
    tiles.replaceChildren();
    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        const tile = document.createElement("span");
        tile.className = "tile";
        tile.dataset.x = x;
        tile.dataset.y = y;
        tiles.append(tile);
      }
    }
    tiles.style.setProperty("--columns", level.width);
    tiles.style.setProperty("--rows", level.height);
  }

  function renderGoal() {
    const level = currentLevel();
    goalPairs.replaceChildren();

    level.parcels.forEach((parcel) => {
      const visual = SYMBOLS[parcel.symbol];
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
          <svg viewBox="0 0 72 40"><path d="M8 20h48" /><path d="m44 8 14 12-14 12" /></svg>
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

    if (level.targets.length > 0) {
      const ordered = level.targets[0].order !== null;
      const pair = document.createElement("span");
      pair.className = "goal-pair goal-collect";
      const icons = ordered
        ? [...level.targets].sort((a, b) => a.order - b.order).map((target) => (
          `<span class="goal-target">${targetMarkup(level.theme)}<b>${target.order}</b></span>`
        )).join("")
        : `<span class="goal-target">${targetMarkup(level.theme)}${level.targets.length > 1 ? `<b>×${level.targets.length}</b>` : ""}</span>`;
      pair.innerHTML = `
        <span class="goal-targets">${icons}</span>
        <span class="goal-arrow">
          <svg viewBox="0 0 72 40"><path d="M8 20h48" /><path d="m44 8 14 12-14 12" /></svg>
        </span>
        <span class="goal-sparkle" aria-hidden="true">✦</span>`;
      goalPairs.append(pair);
    }

    const goalLabel = level.parcels.length > 0
      ? "Goal: match every parcel with its station"
      : "Goal: collect everything on the field";
    goalCard.setAttribute("aria-label", goalLabel);
  }

  function renderWorldObjects() {
    const level = currentLevel();
    Object.values(layers).forEach((layer) => layer.replaceChildren());
    parcelElements.clear();
    stationElements.clear();
    targetElements.length = 0;
    switchElements.clear();
    gateElements.clear();

    level.walls.forEach((wall) => {
      const element = document.createElement("span");
      element.className = "entity wall";
      element.innerHTML = '<span class="wall-art"></span>';
      setGridPosition(element, wall);
      layers.walls.append(element);
    });

    level.switches.forEach((floorSwitch) => {
      const element = document.createElement("span");
      element.className = `entity floor-switch shape-${floorSwitch.shape}`;
      element.style.setProperty("--shape-color", SHAPES[floorSwitch.shape].color);
      element.innerHTML = `
        <span class="switch-base"></span>
        <span class="switch-plate">${shapeSvg(floorSwitch.shape)}</span>`;
      setGridPosition(element, floorSwitch);
      layers.switches.append(element);
      switchElements.set(floorSwitch.shape, [...(switchElements.get(floorSwitch.shape) ?? []), element]);
    });

    level.gates.forEach((gate) => {
      const element = document.createElement("span");
      element.className = `entity gate shape-${gate.shape}`;
      element.style.setProperty("--shape-color", SHAPES[gate.shape].color);
      element.innerHTML = `
        <span class="gate-opening"><span class="gate-panel"><span class="gate-lock">${shapeSvg(gate.shape)}</span></span></span>
        <span class="gate-frame"></span>`;
      setGridPosition(element, gate);
      layers.gates.append(element);
      gateElements.set(gate.shape, [...(gateElements.get(gate.shape) ?? []), element]);
    });

    level.stations.forEach((station) => {
      const visual = SYMBOLS[station.symbol];
      const element = document.createElement("span");
      element.className = "entity delivery-station";
      element.setAttribute("role", "img");
      element.setAttribute("aria-label", `${visual.name} delivery station`);
      element.style.setProperty("--pair-color", visual.color);
      element.innerHTML = `
        <span class="station-art">
          <span class="station-roof"></span>
          <span class="station-body">
            <span class="station-symbol">${symbolSvg(station.symbol)}</span>
            <span class="station-bay"><span class="station-glow"></span></span>
          </span>
          <span class="station-light"></span>
        </span>`;
      setGridPosition(element, station);
      layers.stations.append(element);
      stationElements.set(station.id, element);
    });

    level.targets.forEach((target, index) => {
      const element = document.createElement("span");
      element.className = `entity target ${target.order !== null ? "is-ordered" : ""}`;
      element.setAttribute("role", "img");
      element.setAttribute("aria-label", target.order !== null ? `Target ${target.order}` : "Target");
      element.innerHTML = `${targetMarkup(level.theme)}${target.order !== null ? `<b class="target-order">${target.order}</b>` : ""}<span class="target-spark" aria-hidden="true">✦</span>`;
      setGridPosition(element, target);
      layers.targets.append(element);
      targetElements[index] = element;
    });

    level.parcels.forEach((parcel) => {
      const visual = SYMBOLS[parcel.symbol];
      const element = document.createElement("span");
      element.className = "entity parcel";
      element.setAttribute("role", "img");
      element.setAttribute("aria-label", `${visual.name} parcel`);
      element.style.setProperty("--pair-color", visual.color);
      element.innerHTML = `
        <span class="parcel-art">
          <span class="parcel-lid"></span>
          <span class="parcel-ribbon"></span>
          ${symbolSvg(parcel.symbol)}
        </span>`;
      setGridPosition(element, parcel);
      layers.parcels.append(element);
      parcelElements.set(parcel.id, element);
    });
  }

  function updateWorld() {
    const level = currentLevel();
    const world = state.world;
    setGridPosition(robot, world.robot);
    pointBeam(world.robot.facing);
    robot.setAttribute("aria-label", level.movement === "turns"
      ? `Robot facing ${world.robot.facing}`
      : "Robot");

    world.parcels.forEach((parcelState) => {
      const element = parcelElements.get(parcelState.id);
      if (!element) return;
      const hidden = parcelState.delivered || parcelState.id === world.carrying;
      setGridPosition(element, parcelState);
      element.classList.toggle("is-hidden", hidden);
      element.setAttribute("aria-hidden", String(hidden));
    });

    level.stations.forEach((station) => {
      const element = stationElements.get(station.id);
      const delivered = world.parcels.some((parcel) => parcel.delivered
        && level.parcels.find((definition) => definition.id === parcel.id)?.symbol === station.symbol);
      element?.classList.toggle("is-complete", delivered);
      element?.querySelector(".station-light")?.classList.toggle("is-active", delivered);
    });

    world.collected.forEach((collected, index) => {
      targetElements[index]?.classList.toggle("is-collected", collected);
    });

    const carried = level.parcels.find((parcel) => parcel.id === world.carrying);
    robot.classList.toggle("is-carrying", Boolean(carried));
    heldParcel.setAttribute("aria-hidden", String(!carried));
    if (carried) {
      const visual = SYMBOLS[carried.symbol];
      heldParcel.style.setProperty("--pair-color", visual.color);
      heldParcel.setAttribute("aria-label", `${visual.name} parcel in robot's hands`);
      heldParcelSymbol.innerHTML = visual.markup;
    } else {
      heldParcel.removeAttribute("aria-label");
      heldParcelSymbol.replaceChildren();
    }

    Object.keys(SHAPES).forEach((shape) => {
      const open = world.openGates.includes(shape);
      (switchElements.get(shape) ?? []).forEach((element) => element.classList.toggle("is-pressed", open));
      (gateElements.get(shape) ?? []).forEach((element) => element.classList.toggle("is-open", open));
    });
  }

  function resetWorld() {
    state.world = initialState(currentLevel());
    robot.classList.remove("is-confused", "is-stepping");
    heldParcel.classList.remove("is-mismatch");
    parcelElements.forEach((element) => element.classList.remove("is-mismatch"));
    stationElements.forEach((element) => element.classList.remove("is-mismatch", "is-match-target"));
    targetElements.forEach((element) => element.classList.remove("is-refused", "is-expected"));
    gateElements.forEach((elements) => elements.forEach((element) => element.classList.remove("is-opening", "is-blocked")));
    switchElements.forEach((elements) => elements.forEach((element) => element.classList.remove("is-activating")));
    tiles.querySelectorAll(".is-refused").forEach((tile) => tile.classList.remove("is-refused"));
    updateWorld();
  }

  function renderAvailableCommands() {
    const level = currentLevel();
    commandPalette.dataset.commandCount = level.commands.length;
    commandButtons.forEach((button) => {
      button.hidden = !level.commands.includes(button.dataset.command);
    });
    updateRepeatAvailability();
  }

  // The repeat card only lights up once two actions stand before it, so the
  // rule "repeat needs two cards" is shown instead of explained.
  function updateRepeatAvailability() {
    const repeatButton = commandButtons.find((button) => button.dataset.command === "repeat");
    if (!repeatButton) return;
    const ready = expandProgram(state.program).filter((step) => !step.invalid).length >= 2;
    repeatButton.classList.toggle("is-waiting", !ready);
    repeatButton.disabled = state.running || !ready;
  }

  function renderProgram(activeIndex = -1) {
    const level = currentLevel();
    const slots = slotCount(level);
    const pairedIndexes = state.program[activeIndex] === "repeat"
      ? repeatSources(state.program, activeIndex)
      : [];
    programStrip.replaceChildren();
    programStrip.style.setProperty("--slot-count", slots);

    for (let index = 0; index < slots; index += 1) {
      const slot = document.createElement("button");
      const command = state.program[index];
      slot.className = "program-slot";
      slot.type = "button";
      slot.dataset.index = index;
      slot.setAttribute("role", "listitem");
      slot.classList.toggle("is-spare", index >= level.par);

      if (command) {
        slot.classList.add("is-filled");
        slot.style.setProperty("--slot-color", commandColors[command]);
        slot.innerHTML = commandIcons[command];
        slot.setAttribute("aria-label", `${COMMAND_LABELS[command]}. Tap to remove.`);
        slot.classList.toggle("is-active", index === activeIndex);
        slot.classList.toggle("is-paired", pairedIndexes.includes(index));
        slot.disabled = state.running;
        slot.addEventListener("click", () => removeCommand(index));
      } else {
        slot.setAttribute("aria-label", index >= level.par
          ? `Spare command slot ${index + 1}. Using it costs a star.`
          : `Empty command slot ${index + 1}`);
        slot.disabled = true;
      }

      programStrip.append(slot);
    }
    updateRepeatAvailability();
  }

  function renderLevelBadge() {
    const level = currentLevel();
    $("#levelBadgeEmoji").textContent = state.story.emoji;
    $("#levelBadgeNumber").textContent = `${level.index + 1} / ${state.story.levels.length}`;
    levelBadge.setAttribute("aria-label", `${state.story.title}, level ${level.index + 1} of ${state.story.levels.length}`);
  }

  function renderAdultStrip() {
    const level = currentLevel();
    adultTitle.textContent = `Level ${level.index + 1}: ${level.title}`;
    adultGoal.textContent = level.goal;
    adultHint.textContent = level.hint;
    adultHint.hidden = true;
  }

  function setControlsDisabled(disabled) {
    playButton.disabled = disabled;
    clearButton.disabled = disabled;
    hintButton.disabled = disabled;
    backButton.disabled = disabled;
    commandButtons.forEach((button) => {
      button.disabled = disabled;
    });
    if (!disabled) updateRepeatAvailability();
  }

  function clearHints() {
    document.querySelectorAll(".is-hinted, .is-wrong").forEach((element) => {
      element.classList.remove("is-hinted", "is-wrong");
    });
  }

  // The lamp is the only way out of a stuck route, so it offers itself after
  // a long pause instead of waiting to be discovered.
  function restartIdleHint() {
    window.clearTimeout(idleHintTimer);
    hintButton.classList.remove("is-idle");
    if (state.screen !== "play" || state.running || successLayer.classList.contains("is-visible")) return;
    idleHintTimer = window.setTimeout(() => {
      if (!state.running) hintButton.classList.add("is-idle");
    }, IDLE_HINT_DELAY);
  }

  function openLevel(story, index) {
    state.story = story;
    state.level = story.levels[index];
    state.program = [];
    state.session = { startedAt: Date.now(), runs: 0, hints: 0 };
    state.pendingSurvey = null;
    worldCard.dataset.theme = story.theme;
    worldCard.dataset.movement = story.movement;
    successLayer.classList.remove("is-visible", "is-final");
    successLayer.setAttribute("aria-hidden", "true");
    confetti.replaceChildren();
    clearHints();
    showScreen("play");
    fitTrack();
    renderTiles();
    renderGoal();
    renderWorldObjects();
    renderAvailableCommands();
    resetWorld();
    renderProgram();
    renderLevelBadge();
    renderAdultStrip();
    setControlsDisabled(false);
    restartIdleHint();
    coach.classList.toggle("is-hidden", index !== 0 || levelStars(state.progress, story, 0) > 0);
    commandButtons.find((button) => !button.hidden)?.focus({ preventScroll: true });
  }

  function addCommand(command) {
    const level = currentLevel();
    if (state.running || state.screen !== "play") return;
    if (!level.commands.includes(command)) return;
    if (state.program.length >= slotCount(level)) return;
    if (command === "repeat" && expandProgram(state.program).filter((step) => !step.invalid).length < 2) return;
    clearHints();
    coach.classList.add("is-hidden");
    state.program.push(command);
    restartIdleHint();
    playTone(330 + state.program.length * 30, 0.08, "triangle", 0.06);
    renderProgram();
  }

  function removeCommand(index) {
    if (state.running) return;
    clearHints();
    state.program.splice(index, 1);
    restartIdleHint();
    playTone(220, 0.08, "triangle", 0.05);
    renderProgram();
  }

  function clearProgram() {
    if (state.running) return;
    state.program = [];
    resetWorld();
    clearHints();
    renderProgram();
    playTone(210, 0.12, "triangle", 0.05);
  }

  function markSlot(index, className) {
    const slot = programStrip.children[index];
    if (slot) slot.classList.add(className);
  }

  function glowPlayButton() {
    playButton.classList.add("is-hinted");
    window.setTimeout(() => playButton.classList.remove("is-hinted"), 1900);
  }

  function suggestNextCommand(fromState) {
    const level = currentLevel();
    const nextCommand = nextHelpfulCommand(level, fromState);
    if (!nextCommand || state.program.length >= slotCount(level)) {
      glowPlayButton();
      return;
    }
    markSlot(state.program.length, "is-hinted");
    commandButtons.find((button) => button.dataset.command === nextCommand)?.classList.add("is-hinted");
  }

  function showHint() {
    if (state.running || state.screen !== "play") return;
    window.clearTimeout(idleHintTimer);
    hintButton.classList.remove("is-idle");
    clearHints();
    state.session.hints += 1;
    adultHint.hidden = false;
    const outcome = simulate(currentLevel(), state.program);

    if (outcome.failedAt >= 0) {
      markSlot(outcome.failedAt, "is-wrong");
      playTone(190, 0.16, "sine", 0.07);
      return;
    }

    if (outcome.complete) {
      glowPlayButton();
    } else {
      suggestNextCommand(outcome.state);
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
    await wait(paceOf(430));
    robot.classList.remove("is-stepping");
  }

  async function animateTurn() {
    playTone(300, 0.07, "triangle", 0.045);
    updateWorld();
    await wait(paceOf(340));
  }

  async function animateSwitch(shape) {
    (switchElements.get(shape) ?? []).forEach((element) => element.classList.add("is-activating"));
    (gateElements.get(shape) ?? []).forEach((element) => element.classList.add("is-opening"));
    updateWorld();
    playTone(420, 0.12, "triangle", 0.07);
    playTone(680, 0.18, "sine", 0.07, 0.1);
    await wait(paceOf(430));
    (switchElements.get(shape) ?? []).forEach((element) => element.classList.remove("is-activating"));
    (gateElements.get(shape) ?? []).forEach((element) => element.classList.remove("is-opening"));
  }

  async function animateCollect(index) {
    const element = targetElements[index];
    if (element) {
      element.classList.remove("is-popping");
      void element.offsetWidth;
      element.classList.add("is-popping");
    }
    playTone(760, 0.15, "triangle", 0.08);
    playTone(1040, 0.18, "sine", 0.06, 0.1);
    await wait(paceOf(360));
  }

  // The skipped battery shakes and the one that must come first glows. The
  // run goes on: passing a battery too early is not a crash.
  async function animateWrongOrder(index, expected) {
    targetElements[index]?.classList.add("is-refused");
    targetElements[expected]?.classList.add("is-expected");
    playTone(190, 0.14, "square", 0.05);
    await wait(paceOf(520));
    targetElements[index]?.classList.remove("is-refused");
  }

  function flashRefusedCell(position) {
    const tile = tiles.querySelector(`.tile[data-x="${position.x}"][data-y="${position.y}"]`);
    if (!tile) return;
    tile.classList.remove("is-refused");
    void tile.offsetWidth;
    tile.classList.add("is-refused");
  }

  function showBlockedGate(position) {
    const level = currentLevel();
    const gate = level.gates.find((candidate) => positionsMatch(candidate, position));
    if (!gate || state.world.openGates.includes(gate.shape)) return;
    (gateElements.get(gate.shape) ?? []).forEach((element) => {
      if (!positionsMatch({ x: Number(element.style.getPropertyValue("--x")), y: Number(element.style.getPropertyValue("--y")) }, position)) return;
      element.classList.remove("is-blocked");
      void element.offsetWidth;
      element.classList.add("is-blocked");
    });
  }

  async function executeCommand(command) {
    const level = currentLevel();
    const result = applyCommand(level, state.world, command);
    if (!result.ok) {
      if (result.reason === "blocked" && result.blockedBy !== "edge") {
        flashRefusedCell(result.blockedAt);
        showBlockedGate(result.blockedAt);
      }
      return result;
    }

    state.world = result.state;
    for (const event of result.events) {
      if (event.type === "step") await animateStep();
      if (event.type === "turn") await animateTurn();
      if (event.type === "switch") await animateSwitch(event.shape);
      if (event.type === "collect") await animateCollect(event.index);
      if (event.type === "wrong-order") await animateWrongOrder(event.index, event.expected);
      if (event.type === "pick") {
        updateWorld();
        playTone(490, 0.1, "sine", 0.07);
        playTone(720, 0.14, "sine", 0.06, 0.08);
        await wait(paceOf(450));
      }
      if (event.type === "drop") {
        updateWorld();
        playTone(760, 0.18, "triangle", 0.08);
        await wait(paceOf(480));
      }
    }
    return result;
  }

  async function showFailure(index, failure) {
    markSlot(index, "is-wrong");
    robot.classList.add("is-confused");
    if (failure.reason === "wrong-station" || failure.reason === "no-station") {
      heldParcel.classList.add("is-mismatch");
      stationElements.get(failure.matchingStationId)?.classList.add("is-match-target");
      if (failure.wrongStationId) stationElements.get(failure.wrongStationId)?.classList.add("is-mismatch");
    }
    playTone(175, 0.18, "sawtooth", 0.045);
    playTone(135, 0.24, "sawtooth", 0.04, 0.14);
    await wait(prefersReducedMotion.matches ? 650 : 900);
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

  function renderResultStars(stars) {
    resultStars.innerHTML = starRow(stars);
    resultStars.setAttribute("aria-label", `${stars} of 3 stars`);
  }

  function isLastLevel() {
    return state.level.index === state.story.levels.length - 1;
  }

  function showNextButton() {
    const toStories = isLastLevel();
    nextButton.classList.toggle("is-home", toStories);
    nextButton.setAttribute("aria-label", toStories
      ? (state.storyJustFinished ? "Finish the story" : "Back to the levels")
      : "Next level");
    nextButton.hidden = false;
    nextButton.focus({ preventScroll: true });
  }

  function showSuccess() {
    const level = currentLevel();
    const stars = starsFor(level, state.program.length);
    const firstTime = levelStars(state.progress, state.story, level.index) === 0;
    recordStars(state.progress, state.story, level.index, stars);
    saveProgress();
    // The story celebration belongs to the run that finished its last level
    // for the first time; a later replay goes back to the list of levels.
    state.storyJustFinished = firstTime && isStoryComplete(state.progress, state.story);

    makeConfetti();
    renderResultStars(stars);
    successLayer.classList.add("is-visible");
    successLayer.setAttribute("aria-hidden", "false");
    playSuccessSound();

    // The one-question survey runs once per level, on the first completion.
    // A replay skips it, so the answers describe the first meeting with a level.
    if (firstTime) {
      state.pendingSurvey = {
        story: state.story.id,
        level: level.index,
        title: level.title,
        stars,
        cards: state.program.length,
        par: level.par,
        runs: state.session.runs,
        hints: state.session.hints,
        seconds: Math.round((Date.now() - state.session.startedAt) / 1000),
      };
      survey.hidden = false;
      nextButton.hidden = true;
      survey.querySelector("button")?.focus({ preventScroll: true });
    } else {
      survey.hidden = true;
      showNextButton();
    }
  }

  function answerSurvey(answer) {
    if (!state.pendingSurvey) return;
    state.survey.push({ ...state.pendingSurvey, answer, at: new Date().toISOString() });
    state.pendingSurvey = null;
    saveSurvey();
    survey.querySelectorAll(".survey-button").forEach((button) => {
      button.classList.toggle("is-chosen", button.dataset.answer === answer);
    });
    playTone(560, 0.1, "sine", 0.06);
    window.setTimeout(() => {
      survey.hidden = true;
      showNextButton();
    }, paceOf(380));
  }

  async function runProgram() {
    if (state.running || state.screen !== "play") return;
    if (state.program.length === 0) {
      showHint();
      return;
    }

    const invalidRepeat = findInvalidRepeat(state.program);
    if (invalidRepeat >= 0) {
      clearHints();
      markSlot(invalidRepeat, "is-wrong");
      playTone(175, 0.18, "sawtooth", 0.045);
      return;
    }

    state.running = true;
    state.session.runs += 1;
    window.clearTimeout(idleHintTimer);
    hintButton.classList.remove("is-idle");
    setControlsDisabled(true);
    clearHints();
    resetWorld();
    renderProgram();
    await wait(paceOf(250));

    let finished = false;
    for (const step of expandProgram(state.program)) {
      renderProgram(step.sourceIndex);
      const result = await executeCommand(step.command);
      if (!result.ok) {
        await showFailure(step.sourceIndex, result);
        finished = true;
        break;
      }
      if (isComplete(currentLevel(), state.world)) {
        await wait(paceOf(200));
        renderProgram();
        showSuccess();
        finished = true;
        break;
      }
    }

    if (!finished) {
      // Every card ran, but the goal is not reached yet. That is an unfinished
      // route, not a mistake, so point at the next step instead of a wrong card.
      const outcome = state.world;
      settleProgram();
      await wait(paceOf(280));
      resetWorld();
      suggestNextCommand(outcome);
    }

    state.running = false;
    setControlsDisabled(false);
    settleProgram();
    restartIdleHint();
  }

  // After a run the slots become tappable again and the running highlight goes,
  // but a wrong or hinted mark stays until the child changes the program.
  function settleProgram() {
    programStrip.querySelectorAll(".program-slot").forEach((slot) => {
      slot.classList.remove("is-active", "is-paired");
      if (slot.classList.contains("is-filled")) slot.disabled = false;
    });
  }

  function advance() {
    const story = state.story;
    if (!isLastLevel()) {
      openLevel(story, state.level.index + 1);
      return;
    }
    if (state.storyJustFinished) {
      state.storyJustFinished = false;
      showStoryDone(story);
      return;
    }
    openStory(story);
  }

  function showStoryDone(story) {
    $("#doneEmoji").textContent = story.emoji;
    $("#doneTitle").textContent = story.title;
    const badge = $("#doneAccessory");
    badge.textContent = ACCESSORIES[story.accessory];
    renderMascot($("#doneMascot"));
    playSuccessSound();
    showScreen("done");
    $("#doneButton").focus({ preventScroll: true });
  }

  function goBack() {
    if (state.running) return;
    if (state.screen === "play") {
      openStory(state.story);
      return;
    }
    if (state.screen === "story") {
      renderStoryMenu();
      showScreen("menu");
    }
  }

  // ---- Panel for an adult ----

  function formatDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  function renderSurveyTable() {
    const rows = [...state.survey].reverse();
    surveyTable.querySelector("tbody").replaceChildren();
    $("#surveyEmpty").hidden = rows.length > 0;
    surveyTable.hidden = rows.length === 0;
    rows.forEach((entry) => {
      const story = STORIES.find((candidate) => candidate.id === entry.story);
      const row = document.createElement("tr");
      const cells = [
        `${story?.emoji ?? ""} ${story?.title ?? entry.story}`,
        String(entry.level + 1),
        { easy: "Easy", normal: "Normal", hard: "Very hard" }[entry.answer],
        String(entry.runs ?? ""),
        String(entry.hints ?? ""),
        entry.cards !== undefined ? `${entry.cards} / ${entry.par}` : "",
        formatDate(entry.at),
      ];
      cells.forEach((text) => {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.append(cell);
      });
      surveyTable.querySelector("tbody").append(row);
    });
    surveyJson.value = JSON.stringify(state.survey, null, 2);
  }

  function openParentPanel() {
    renderSurveyTable();
    copyStatus.textContent = "";
    parentPanel.hidden = false;
    shell.inert = true;
    $("#closeParentButton").focus();
  }

  function closeParentPanel() {
    parentPanel.hidden = true;
    shell.inert = false;
    parentButton.focus();
  }

  async function copySurvey() {
    const text = JSON.stringify(state.survey, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      copyStatus.textContent = "Copied.";
    } catch {
      surveyJson.hidden = false;
      surveyJson.select();
      copyStatus.textContent = "Select the text below and copy it.";
    }
    window.clearTimeout(copyStatusTimer);
    copyStatusTimer = window.setTimeout(() => {
      copyStatus.textContent = "";
    }, 2500);
  }

  function renderSoundButton() {
    soundButton.classList.toggle("is-on", state.soundOn);
    soundButton.setAttribute("aria-label", state.soundOn ? "Turn sound off" : "Turn sound on");
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

  // ---- Wiring ----

  commandButtons.forEach((button) => {
    button.addEventListener("click", () => addCommand(button.dataset.command));
  });
  playButton.addEventListener("click", runProgram);
  clearButton.addEventListener("click", clearProgram);
  hintButton.addEventListener("click", showHint);
  nextButton.addEventListener("click", advance);
  backButton.addEventListener("click", goBack);
  soundButton.addEventListener("click", toggleSound);
  parentButton.addEventListener("click", openParentPanel);
  $("#doneButton").addEventListener("click", () => {
    renderStoryMenu();
    showScreen("menu");
  });
  survey.addEventListener("click", (event) => {
    const button = event.target.closest(".survey-button");
    if (button) answerSurvey(button.dataset.answer);
  });

  parentPanel.addEventListener("click", (event) => {
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "close") closeParentPanel();
    if (action === "copy") copySurvey();
    if (action === "clear-survey") {
      state.survey = [];
      saveSurvey();
      renderSurveyTable();
    }
    if (action === "reset-progress") {
      state.progress = { stories: {} };
      state.storyJustFinished = false;
      saveProgress();
      renderStoryMenu();
      closeParentPanel();
      showScreen("menu");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (!parentPanel.hidden) {
      if (event.key === "Escape") closeParentPanel();
      return;
    }
    if (event.target.closest?.("select, input, textarea")) return;
    if (state.screen !== "play") return;

    const command = KEY_COMMANDS[event.code];
    if (command) {
      if (!currentLevel().commands.includes(command)) return;
      event.preventDefault();
      addCommand(command);
      return;
    }
    if (event.key === "Enter") {
      // Enter always means "run", even while a card or a slot keeps the focus
      // after a click. Other buttons keep their own Enter behavior.
      const focused = event.target.closest?.("button");
      if (focused && !focused.matches(".command-button, .program-slot")) return;
      event.preventDefault();
      runProgram();
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      if (state.program.length > 0) removeCommand(state.program.length - 1);
    }
  });

  if (typeof ResizeObserver === "function") {
    new ResizeObserver(() => {
      if (state.screen === "play") fitTrack();
    }).observe(worldCard);
  } else {
    window.addEventListener("resize", () => {
      if (state.screen === "play") fitTrack();
    });
  }

  renderSoundButton();
  renderStoryMenu();
  showScreen("menu");
}
