// Maze symbols:
//   #  wall               .  cheese crumb      o  big cheese
//   M  the mouse's hole   C  a cat that starts outside the house
//   c  a cat in the house h  the house floor   -  the house door (cats only)
//   (space) an empty path
// A row whose two edge cells are open is a tunnel to the other side.
const LEVELS = [
  {
    name: "Kitchen",
    icon: "🍳",
    cats: 2,
    catSpeed: 3.3,
    map: [
      "###################",
      "#o.......#.......o#",
      "#.##.###.#.###.##.#",
      "#.................#",
      "#.##.#.#####.#.##.#",
      "#....#...#...#....#",
      "####.###.#.###.####",
      "####.#...C...#.####",
      "####.#.##-##.#.####",
      ".......#ccc#.......",
      "####.#.#####.#.####",
      "####.#.......#.####",
      "####.#.#####.#.####",
      "#........#........#",
      "#.##.###.#.###.##.#",
      "#o..#....M....#..o#",
      "###################",
    ],
  },
  {
    name: "Garden",
    icon: "🌻",
    cats: 3,
    catSpeed: 3.5,
    map: [
      "###################",
      "#o...#.......#...o#",
      "#.##.#.#####.#.##.#",
      "#.................#",
      "##.#.###.#.###.#.##",
      "##.#.....#.....#.##",
      "##.#.#.#####.#.#.##",
      "...#.#...C...#.#...",
      "##.#.#.##-##.#.#.##",
      "##.....#ccc#.....##",
      "##.###.#####.###.##",
      "#........#........#",
      "#.##.###.#.###.##.#",
      "#o.#.....M.....#.o#",
      "##.#.#.#####.#.#.##",
      "#....#...#...#....#",
      "###################",
    ],
  },
  {
    name: "Cellar",
    icon: "🕯️",
    cats: 4,
    catSpeed: 3.7,
    map: [
      "###################",
      "#o.....#...#.....o#",
      "#.###.#..#..#.###.#",
      "#.......#.#.......#",
      "#.#.###.....###.#.#",
      "#.#.....#.#.....#.#",
      "#.###.#.#.#.#.###.#",
      ".....#...C...#.....",
      "###.#.###-###.#.###",
      "###.#..#ccc#..#.###",
      "###.#..#####..#.###",
      "#.......#.#.......#",
      "#.##.##.....##.##.#",
      "#o.#.....M.....#.o#",
      "#.##.##.#.#.##.##.#",
      "#.................#",
      "###################",
    ],
  },
];

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
// Ties between equally good turns go to the first direction in this order.
const DIRECTION_ORDER = ["up", "left", "down", "right"];

const SCORES = { crumb: 10, cheese: 50, cat: 200 };

// Speeds are in cells per second. Every cat is slower than the mouse, so a
// child who keeps moving can always get away.
const MOUSE_SPEED = 5;
const SLEEPY_SPEED = 2.2;
const LEAVING_SPEED = 3;
const RETURNING_SPEED = 7;

// Seconds.
const SLEEP_TIME = 7;
const WAKING_TIME = 2;
const CAUGHT_TIME = 1.4;
const HOME_WAIT = 1.5;
const RELEASE_DELAYS = [0, 2, 6, 10];
// Cats take turns between strolling about and following the mouse, which
// leaves the child calm moments to collect cheese.
const PHASES = [
  { mode: "wander", time: 5 },
  { mode: "chase", time: 15 },
];

const CATCH_DISTANCE = 0.6;
const MAX_STEP = 0.02;
const MAX_FRAME = 0.1;

const SYMBOL_CELLS = {
  "#": "wall",
  ".": "path",
  o: "path",
  " ": "path",
  M: "path",
  C: "path",
  c: "house",
  h: "house",
  "-": "door",
};

function cellIndex(maze, col, row) {
  return row * maze.cols + col;
}

function wrapCol(maze, col) {
  return ((col % maze.cols) + maze.cols) % maze.cols;
}

function cellAt(maze, col, row) {
  if (row < 0 || row >= maze.rows) return "wall";
  return maze.cells[cellIndex(maze, wrapCol(maze, col), row)];
}

// The mouse and a roaming cat walk the paths; a cat on its way into or out of
// the house may also use the door and the house floor.
function isOpen(maze, col, row, walker) {
  const cell = cellAt(maze, col, row);
  if (walker === "home") return cell !== "wall";
  return cell === "path";
}

function neighbor(maze, col, row, direction) {
  const step = DIRECTIONS[direction];
  return { col: wrapCol(maze, col + step.x), row: row + step.y };
}

function canGo(maze, col, row, direction, walker) {
  const next = neighbor(maze, col, row, direction);
  return isOpen(maze, next.col, next.row, walker);
}

// Steps from every cell to `target` along cells a cat may use on its way home.
function distanceMap(maze, target) {
  const distances = new Array(maze.rows * maze.cols).fill(Infinity);
  distances[cellIndex(maze, target.col, target.row)] = 0;
  const queue = [target];
  for (let head = 0; head < queue.length; head += 1) {
    const { col, row } = queue[head];
    const here = distances[cellIndex(maze, col, row)];
    DIRECTION_ORDER.forEach((direction) => {
      const next = neighbor(maze, col, row, direction);
      if (!isOpen(maze, next.col, next.row, "home")) return;
      const index = cellIndex(maze, next.col, next.row);
      if (distances[index] <= here + 1) return;
      distances[index] = here + 1;
      queue.push(next);
    });
  }
  return distances;
}

function parseMaze(map) {
  const rows = map.length;
  const cols = map[0].length;
  const maze = { rows, cols, cells: [], food: new Map(), outsideCats: [], houseCats: [] };

  map.forEach((line, row) => {
    [...line].forEach((symbol, col) => {
      maze.cells.push(SYMBOL_CELLS[symbol] ?? "wall");
      const index = row * cols + col;
      if (symbol === ".") maze.food.set(index, "crumb");
      if (symbol === "o") maze.food.set(index, "cheese");
      if (symbol === "M") maze.mouseStart = { col, row };
      if (symbol === "C") maze.outsideCats.push({ col, row });
      if (symbol === "c") maze.houseCats.push({ col, row });
      if (symbol === "-") maze.door = { col, row };
    });
  });

  // Cats that start outside go first, so the first cat is out from the start.
  maze.catStarts = [...maze.outsideCats, ...maze.houseCats];
  if (maze.door) {
    maze.exit = { col: maze.door.col, row: maze.door.row - 1 };
    maze.home = { col: maze.door.col, row: maze.door.row + 1 };
    maze.toExit = distanceMap(maze, maze.exit);
    maze.toHome = distanceMap(maze, maze.home);
  }
  return maze;
}

// A tiny seeded random generator, so a test can replay the same game.
function createRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createCats(game) {
  const { maze, level } = game;
  return maze.catStarts.slice(0, level.cats).map((start, index) => {
    const outside = cellAt(maze, start.col, start.row) === "path";
    return {
      index,
      x: start.col,
      y: start.row,
      dir: null,
      state: outside ? "roam" : "home",
      wait: RELEASE_DELAYS[index] ?? 0,
      sleepy: false,
    };
  });
}

function resetActors(game) {
  const { mouseStart } = game.maze;
  game.mouse = { x: mouseStart.col, y: mouseStart.row, dir: null, facing: "left" };
  game.desired = null;
  game.cats = createCats(game);
  game.sleepyTime = 0;
  game.phaseIndex = 0;
  game.phaseTime = PHASES[0].time;
}

function createGame(levelIndex, { catsEnabled = true, seed = 1 } = {}) {
  const level = LEVELS[levelIndex];
  const maze = parseMaze(level.map);
  const game = {
    levelIndex,
    level,
    maze,
    food: new Map(maze.food),
    foodTotal: maze.food.size,
    score: 0,
    state: "ready",
    catsEnabled,
    caughtTime: 0,
    random: createRandom(seed),
    events: [],
  };
  resetActors(game);
  return game;
}

function isCentered(actor) {
  return Math.abs(actor.x - Math.round(actor.x)) < 1e-6 && Math.abs(actor.y - Math.round(actor.y)) < 1e-6;
}

function tileOf(maze, actor) {
  return { col: wrapCol(maze, Math.round(actor.x)), row: Math.round(actor.y) };
}

// Moves an actor `distance` cells along its direction. Each time it reaches the
// middle of a cell, `choose` picks the next direction or stops it there.
function advance(maze, actor, distance, choose) {
  let left = distance;
  for (let guard = 0; left > 1e-9 && guard < 8; guard += 1) {
    const centered = isCentered(actor);
    if (centered) {
      actor.x = wrapCol(maze, Math.round(actor.x));
      actor.y = Math.round(actor.y);
      actor.dir = choose(actor);
    }
    if (!actor.dir) return;

    const step = DIRECTIONS[actor.dir];
    const axis = step.x !== 0 ? "x" : "y";
    const sign = step.x + step.y;
    const position = actor[axis];
    let target;
    if (centered) target = position + sign;
    else target = sign > 0 ? Math.ceil(position) : Math.floor(position);
    const toTarget = Math.abs(target - position);
    const move = Math.min(left, toTarget);
    left -= move;
    if (move >= toTarget - 1e-9) {
      actor[axis] = target;
      actor.x = wrapCol(maze, actor.x);
    } else {
      actor[axis] = position + sign * move;
    }
  }
}

// Turning back never waits for the middle of a cell, so the mouse answers at once.
function steer(game, direction) {
  if (!DIRECTIONS[direction]) return;
  if (game.state === "won" || game.state === "caught") return;
  // The cats wait until the mouse can really set off.
  if (game.state === "ready") {
    const { col, row } = tileOf(game.maze, game.mouse);
    if (!canGo(game.maze, col, row, direction, "roam")) return;
  }
  game.desired = direction;
  if (game.state === "ready" || game.state === "paused") game.state = "playing";
  if (game.mouse.dir === OPPOSITE[direction]) {
    game.mouse.dir = direction;
    game.mouse.facing = direction;
  }
}

function setPaused(game, paused) {
  if (paused && game.state === "playing") game.state = "paused";
  else if (!paused && game.state === "paused") game.state = "playing";
}

// The cats leave or come back at once; eaten cheese and the score stay.
function setCatsEnabled(game, enabled) {
  game.catsEnabled = enabled;
  game.cats = createCats(game);
  game.sleepyTime = 0;
  if (!enabled && game.state === "caught") {
    resetActors(game);
    game.state = "ready";
  }
}

function distanceBetween(maze, a, b) {
  let dx = Math.abs(a.x - b.x);
  dx = Math.min(dx, maze.cols - dx);
  return Math.hypot(dx, a.y - b.y);
}

// Where a roaming cat heads. Null means "pick any turn": the cats stroll
// instead of guarding a corner, so the last crumbs are never fenced off.
function catTarget(game, cat) {
  const { maze, mouse } = game;
  if (PHASES[game.phaseIndex].mode === "wander") return null;
  const mouseTile = tileOf(maze, mouse);
  if (cat.index === 0) return mouseTile;
  if (cat.index === 1) {
    const step = DIRECTIONS[mouse.facing];
    return { col: mouseTile.col + step.x * 3, row: mouseTile.row + step.y * 3 };
  }
  if (cat.index === 2) return distanceBetween(maze, cat, mouse) > 6 ? mouseTile : null;
  return null;
}

function stepDownhill(maze, col, row, distances) {
  const here = distances[cellIndex(maze, col, row)];
  return DIRECTION_ORDER.find((direction) => {
    const next = neighbor(maze, col, row, direction);
    if (!isOpen(maze, next.col, next.row, "home")) return false;
    return distances[cellIndex(maze, next.col, next.row)] === here - 1;
  }) ?? null;
}

function chooseRoamDirection(game, cat, col, row) {
  const { maze } = game;
  let options = DIRECTION_ORDER.filter((direction) =>
    direction !== OPPOSITE[cat.dir] && canGo(maze, col, row, direction, "roam"));
  if (options.length === 0) {
    options = DIRECTION_ORDER.filter((direction) => canGo(maze, col, row, direction, "roam"));
  }
  if (options.length === 0) return null;

  const target = cat.sleepy ? null : catTarget(game, cat);
  if (!target) return options[Math.floor(game.random() * options.length)];

  let best = options[0];
  let bestDistance = Infinity;
  options.forEach((direction) => {
    const next = neighbor(maze, col, row, direction);
    const distance = (next.col - target.col) ** 2 + (next.row - target.row) ** 2;
    if (distance < bestDistance) {
      best = direction;
      bestDistance = distance;
    }
  });
  return best;
}

function chooseCatDirection(game, cat) {
  const { maze } = game;
  const { col, row } = tileOf(maze, cat);
  if (cat.state === "leaving") {
    if (col === maze.exit.col && row === maze.exit.row) {
      cat.state = "roam";
      cat.dir = null;
    } else {
      return stepDownhill(maze, col, row, maze.toExit);
    }
  }
  if (cat.state === "returning") {
    if (col === maze.home.col && row === maze.home.row) {
      cat.state = "home";
      cat.wait = HOME_WAIT;
      return null;
    }
    return stepDownhill(maze, col, row, maze.toHome);
  }
  if (cat.state === "roam") return chooseRoamDirection(game, cat, col, row);
  return null;
}

function catSpeed(game, cat) {
  if (cat.state === "leaving") return LEAVING_SPEED;
  if (cat.state === "returning") return RETURNING_SPEED;
  return cat.sleepy ? SLEEPY_SPEED : game.level.catSpeed;
}

function eatAtMouse(game) {
  const { maze, mouse } = game;
  const { col, row } = tileOf(maze, mouse);
  const index = cellIndex(maze, col, row);
  const kind = game.food.get(index);
  if (!kind) return;
  game.food.delete(index);
  game.score += SCORES[kind];
  game.events.push(kind);
  if (kind === "cheese" && game.catsEnabled) {
    game.sleepyTime = SLEEP_TIME;
    game.cats.forEach((cat) => {
      if (cat.state !== "roam") return;
      cat.sleepy = true;
      if (cat.dir) cat.dir = OPPOSITE[cat.dir];
    });
  }
}

function updateCats(game, dt) {
  if (game.sleepyTime > 0) {
    game.sleepyTime -= dt;
    if (game.sleepyTime <= 0) {
      game.sleepyTime = 0;
      game.cats.forEach((cat) => { cat.sleepy = false; });
    }
  }
  game.phaseTime -= dt;
  if (game.phaseTime <= 0) {
    game.phaseIndex = (game.phaseIndex + 1) % PHASES.length;
    game.phaseTime = PHASES[game.phaseIndex].time;
  }

  game.cats.forEach((cat) => {
    if (cat.state === "home") {
      cat.wait -= dt;
      if (cat.wait <= 0) cat.state = "leaving";
      return;
    }
    advance(game.maze, cat, catSpeed(game, cat) * dt, () => chooseCatDirection(game, cat));
  });

  for (const cat of game.cats) {
    if (cat.state !== "roam") continue;
    if (distanceBetween(game.maze, cat, game.mouse) >= CATCH_DISTANCE) continue;
    if (cat.sleepy) {
      cat.sleepy = false;
      cat.state = "returning";
      game.score += SCORES.cat;
      game.events.push("cat");
    } else {
      game.state = "caught";
      game.caughtTime = CAUGHT_TIME;
      game.events.push("caught");
      return;
    }
  }
}

function tick(game, dt) {
  const { maze, mouse } = game;
  advance(maze, mouse, MOUSE_SPEED * dt, () => {
    const { col, row } = tileOf(maze, mouse);
    if (game.desired && canGo(maze, col, row, game.desired, "roam")) {
      mouse.facing = game.desired;
      return game.desired;
    }
    if (mouse.dir && canGo(maze, col, row, mouse.dir, "roam")) return mouse.dir;
    return null;
  });
  eatAtMouse(game);
  if (game.food.size === 0) {
    game.state = "won";
    game.events.push("won");
    return;
  }
  if (game.catsEnabled) updateCats(game, dt);
}

function update(game, seconds) {
  if (game.state === "caught") {
    game.caughtTime -= seconds;
    if (game.caughtTime <= 0) {
      resetActors(game);
      game.state = "ready";
    }
    return;
  }
  if (game.state !== "playing") return;
  let left = Math.min(seconds, MAX_FRAME);
  while (left > 1e-9 && game.state === "playing") {
    const step = Math.min(left, MAX_STEP);
    tick(game, step);
    left -= step;
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    LEVELS,
    DIRECTIONS,
    OPPOSITE,
    DIRECTION_ORDER,
    SCORES,
    MOUSE_SPEED,
    SLEEP_TIME,
    CAUGHT_TIME,
    SYMBOL_CELLS,
    parseMaze,
    cellAt,
    isOpen,
    canGo,
    neighbor,
    tileOf,
    isCentered,
    createGame,
    steer,
    setPaused,
    setCatsEnabled,
    update,
  };
}

// Everything below draws the maze and reads the controls. The rules above are
// the model, and test-game.js checks them without a browser.
if (typeof document !== "undefined") {
  const SOUND_KEY = "mazeMouseSoundV1";
  const CATS_KEY = "mazeMouseCatsV1";
  const THEMES = [
    { wall: "#c98a55", wallEdge: "#a76a3b", path: "#fff4dc", house: "#ffe3ea" },
    { wall: "#6fae5c", wallEdge: "#4f8c41", path: "#f6f8e2", house: "#ffe9d6" },
    { wall: "#8f857c", wallEdge: "#71675f", path: "#f6eee2", house: "#efe4f7" },
  ];
  const CAT_COLORS = ["#f28b50", "#8b76b7", "#4aa3b8", "#e56b8f"];
  const SLEEPY_COLOR = "#cfe3ff";
  const EMOJI_FONT = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  const SWIPE_DISTANCE = 24;

  const prefersReducedMotion = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

  const canvas = document.querySelector("#board");
  const context = canvas.getContext("2d");
  const boardWrap = document.querySelector("#boardWrap");
  const overlay = document.querySelector("#boardOverlay");
  const overlayIcon = document.querySelector("#overlayIcon");
  const overlayText = document.querySelector("#overlayText");
  const mazePicker = document.querySelector("#mazePicker");
  const cheeseMeter = document.querySelector("#cheeseMeter");
  const cheeseFill = document.querySelector("#cheeseFill");
  const cheeseCount = document.querySelector("#cheeseCount");
  const scoreValue = document.querySelector("#scoreValue");
  const tipText = document.querySelector("#tipText");
  const pauseButton = document.querySelector("#pauseButton");
  const catsButton = document.querySelector("#catsButton");
  const soundButton = document.querySelector("#soundButton");
  const winDialog = document.querySelector("#winDialog");
  const gameShell = document.querySelector(".game-shell");

  let soundEnabled = readSetting(SOUND_KEY) !== "off";
  let catsEnabled = readSetting(CATS_KEY) !== "off";
  let game;
  let tile = 20;
  let mazeLayer = null;
  let lastFrame = 0;
  let clock = 0;
  let shownState = "";
  let shownTip = "";
  let shownScore = -1;
  let shownFood = -1;
  let pointerStart = null;

  function readSetting(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeSetting(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Private browsing modes can refuse writes. The choice stays for this session only.
    }
  }

  // ---- Sound -------------------------------------------------------------

  function playNotes(notes, { wave = "sine", volume = 0.03, gap = 0.1, duration = 0.14 } = {}) {
    if (!soundEnabled) return;
    notes.forEach((frequency, index) => {
      window.GameSound?.tone({ frequency, delay: index * gap, duration, volume, wave });
    });
  }

  let crumbNote = 0;
  const SOUNDS = {
    crumb() {
      crumbNote = 1 - crumbNote;
      playNotes([crumbNote ? 660 : 740], { volume: 0.018, duration: 0.05 });
    },
    cheese: () => playNotes([523, 659, 784], { wave: "triangle" }),
    cat: () => playNotes([784, 988], { wave: "triangle", gap: 0.08 }),
    caught: () => playNotes([440, 370, 330], { wave: "triangle", gap: 0.14, duration: 0.18 }),
    won: () => playNotes([523, 659, 784, 1046], { wave: "triangle", gap: 0.13, duration: 0.2 }),
  };

  function renderSoundButton() {
    soundButton.querySelector("span").textContent = soundEnabled ? "\u{1F50A}" : "\u{1F507}";
    soundButton.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
  }

  function renderCatsButton() {
    catsButton.setAttribute("aria-pressed", catsEnabled ? "true" : "false");
    catsButton.querySelector(".cats-text").textContent = catsEnabled ? "Cats: on" : "Cats: off";
  }

  // ---- Levels and the screen around the maze ----------------------------

  function renderMazePicker() {
    const hadFocus = mazePicker.contains(document.activeElement);
    mazePicker.textContent = "";
    LEVELS.forEach((level, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "maze-button";
      button.setAttribute("aria-current", index === game.levelIndex ? "true" : "false");
      const icon = document.createElement("span");
      icon.className = "maze-button-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = level.icon;
      const name = document.createElement("span");
      name.className = "maze-button-name";
      name.textContent = level.name;
      button.append(icon, name);
      button.addEventListener("click", () => startLevel(index));
      mazePicker.append(button);
    });
    if (hadFocus) mazePicker.children[game.levelIndex]?.focus();
  }

  function startLevel(levelIndex) {
    game = createGame(levelIndex, { catsEnabled, seed: Date.now() % 100000 });
    showWinDialog(false);
    shownState = "";
    shownScore = -1;
    shownFood = -1;
    renderMazePicker();
    resizeBoard();
    renderHud();
  }

  function showWinDialog(open) {
    winDialog.hidden = !open;
    gameShell.inert = open;
    if (!open) return;
    document.querySelector("#resultScore").textContent = `Score: ${game.score}`;
    document.querySelector("#nextButton").focus();
  }

  function currentTip() {
    if (!game.catsEnabled) return "No cats today. Take your time!";
    if (game.sleepyTime > 0) return "💤 The cats are sleepy. Catch them!";
    return "Run from the cats!";
  }

  function renderHud() {
    const eaten = game.foodTotal - game.food.size;
    if (eaten !== shownFood) {
      shownFood = eaten;
      const percent = Math.round((eaten / game.foodTotal) * 100);
      cheeseFill.style.width = `${percent}%`;
      cheeseMeter.setAttribute("aria-valuenow", String(percent));
      cheeseCount.textContent = `Cheese: ${eaten} of ${game.foodTotal}`;
    }
    if (game.score !== shownScore) {
      shownScore = game.score;
      scoreValue.textContent = String(game.score);
    }
    const tip = currentTip();
    if (tip !== shownTip) {
      shownTip = tip;
      tipText.textContent = tip;
    }
    if (game.state !== shownState) {
      const firstStart = shownState === "";
      shownState = game.state;
      renderOverlay(firstStart);
      const paused = game.state === "paused";
      document.querySelector("#pauseIcon").textContent = paused ? "▶" : "⏸";
      document.querySelector("#pauseText").textContent = paused ? "Go on" : "Pause";
    }
  }

  function renderOverlay(firstStart) {
    const views = {
      ready: ["← ↑ ↓ →", firstStart ? "Press an arrow" : "Press an arrow to go on"],
      paused: ["⏸", "Pause"],
      caught: ["🐭💫", "Oops! Back to the hole!"],
    };
    const view = views[game.state];
    overlay.hidden = !view;
    if (!view) return;
    overlayIcon.textContent = view[0];
    overlayText.textContent = view[1];
  }

  // ---- Drawing -----------------------------------------------------------

  // The tile size follows the room left for the maze, so the whole maze is
  // always on screen. The walls are drawn once per size into their own layer.
  function resizeBoard() {
    const { maze } = game;
    const width = boardWrap.clientWidth;
    const height = boardWrap.clientHeight;
    tile = Math.max(8, Math.floor(Math.min(width / maze.cols, height / maze.rows)));
    const ratio = window.devicePixelRatio || 1;
    canvas.style.width = `${tile * maze.cols}px`;
    canvas.style.height = `${tile * maze.rows}px`;
    canvas.width = Math.round(tile * maze.cols * ratio);
    canvas.height = Math.round(tile * maze.rows * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    mazeLayer = drawMazeLayer(ratio);
    draw();
  }

  function roundedRect(target, x, y, width, height, radius) {
    target.beginPath();
    if (target.roundRect) target.roundRect(x, y, width, height, radius);
    else target.rect(x, y, width, height);
    target.fill();
  }

  function drawMazeLayer(ratio) {
    const { maze } = game;
    const theme = THEMES[game.levelIndex % THEMES.length];
    const layer = document.createElement("canvas");
    layer.width = canvas.width;
    layer.height = canvas.height;
    const paint = layer.getContext("2d");
    paint.setTransform(ratio, 0, 0, ratio, 0, 0);
    paint.fillStyle = theme.wall;
    paint.fillRect(0, 0, tile * maze.cols, tile * maze.rows);

    // Corridors are rounded cells joined to their open neighbours, so the
    // walls read as soft shelves, hedges and stones between them.
    const inset = tile * 0.1;
    for (let row = 0; row < maze.rows; row += 1) {
      for (let col = 0; col < maze.cols; col += 1) {
        const cell = cellAt(maze, col, row);
        if (cell === "wall") continue;
        paint.fillStyle = cell === "path" ? theme.path : theme.house;
        const x = col * tile;
        const y = row * tile;
        roundedRect(paint, x + inset, y + inset, tile - inset * 2, tile - inset * 2, tile * 0.28);
        if (col + 1 < maze.cols && cellAt(maze, col + 1, row) !== "wall") {
          paint.fillRect(x + tile / 2, y + inset, tile, tile - inset * 2);
        }
        if (cellAt(maze, col, row + 1) !== "wall") {
          paint.fillRect(x + inset, y + tile / 2, tile - inset * 2, tile);
        }
        // Four open cells in a square leave no wall crumb in their middle.
        if (col + 1 < maze.cols && cellAt(maze, col + 1, row) !== "wall"
          && cellAt(maze, col, row + 1) !== "wall" && cellAt(maze, col + 1, row + 1) !== "wall") {
          paint.fillRect(x + tile / 2, y + tile / 2, tile, tile);
        }
        // A tunnel opens to the edge of the maze.
        if (col === 0 || col === maze.cols - 1) {
          paint.fillRect(col === 0 ? x : x + tile / 2, y + inset, tile / 2, tile - inset * 2);
        }
      }
    }

    // The house door is a striped gate only cats go through.
    const { door } = maze;
    paint.fillStyle = theme.wallEdge;
    paint.fillRect(door.col * tile, door.row * tile + tile * 0.38, tile, tile * 0.24);
    paint.fillStyle = "#e98aa6";
    for (let stripe = 0; stripe < 3; stripe += 1) {
      paint.fillRect(door.col * tile + tile * (0.1 + stripe * 0.3), door.row * tile + tile * 0.38, tile * 0.2, tile * 0.24);
    }
    return layer;
  }

  function drawEmoji(symbol, x, y, size, alpha = 1) {
    context.globalAlpha = alpha;
    context.font = `${Math.round(size)}px ${EMOJI_FONT}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(symbol, x, y);
    context.globalAlpha = 1;
  }

  function drawDisc(x, y, radius, color) {
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  // A walker halfway through a tunnel shows on both sides of the maze.
  function eachPlace(actor, callback) {
    const { cols } = game.maze;
    const y = (actor.y + 0.5) * tile;
    callback((actor.x + 0.5) * tile, y);
    if (actor.x > cols - 1) callback((actor.x - cols + 0.5) * tile, y);
    if (actor.x < 0) callback((actor.x + cols + 0.5) * tile, y);
  }

  function drawFood() {
    const { cols } = game.maze;
    const pulse = prefersReducedMotion.matches ? 1 : 1 + Math.sin(clock * 5) * 0.08;
    game.food.forEach((kind, index) => {
      const x = (index % cols + 0.5) * tile;
      const y = (Math.floor(index / cols) + 0.5) * tile;
      if (kind === "cheese") {
        drawEmoji("🧀", x, y, tile * 0.8 * pulse);
      } else {
        context.fillStyle = "#f6c443";
        context.strokeStyle = "#b98a1c";
        context.lineWidth = Math.max(1, tile * 0.04);
        context.beginPath();
        context.arc(x, y, tile * 0.12, 0, Math.PI * 2);
        context.fill();
        context.stroke();
      }
    });
  }

  function drawCats() {
    if (!game.catsEnabled) return;
    game.cats.forEach((cat) => {
      eachPlace(cat, (x, y) => {
        if (cat.state === "returning") {
          drawEmoji("🐾", x, y, tile * 0.6, 0.75);
          return;
        }
        // In the last seconds of a nap the cat's circle flickers back to its
        // collar color: a sign that it is waking up.
        const waking = game.sleepyTime < WAKING_TIME && Math.floor(clock * 4) % 2 === 0;
        const asleep = cat.sleepy && !waking;
        drawDisc(x, y, tile * 0.48, cat.sleepy ? (waking ? CAT_COLORS[cat.index] : SLEEPY_COLOR) : CAT_COLORS[cat.index]);
        drawEmoji("🐱", x, y + tile * 0.03, tile * 0.78, asleep ? 0.55 : 1);
        if (cat.sleepy) drawEmoji("💤", x + tile * 0.38, y - tile * 0.4, tile * 0.42);
      });
    });
  }

  function drawMouse() {
    eachPlace(game.mouse, (x, y) => {
      drawEmoji("🐭", x, y + tile * 0.03, tile * 0.92);
      if (game.state === "caught") drawEmoji("💫", x, y - tile * 0.55, tile * 0.6);
    });
  }

  function draw() {
    if (!mazeLayer) return;
    const { maze } = game;
    context.clearRect(0, 0, tile * maze.cols, tile * maze.rows);
    context.drawImage(mazeLayer, 0, 0, tile * maze.cols, tile * maze.rows);
    drawFood();
    drawCats();
    drawMouse();
  }

  // ---- The loop ----------------------------------------------------------

  function handleEvents() {
    game.events.forEach((event) => {
      SOUNDS[event]?.();
      if (event === "won") window.setTimeout(() => showWinDialog(true), prefersReducedMotion.matches ? 20 : 500);
    });
    game.events.length = 0;
  }

  function frame(now) {
    const seconds = lastFrame ? Math.min((now - lastFrame) / 1000, MAX_FRAME) : 0;
    lastFrame = now;
    clock += seconds;
    update(game, seconds);
    handleEvents();
    renderHud();
    draw();
    window.requestAnimationFrame(frame);
  }

  function steerMouse(direction) {
    if (!winDialog.hidden) return;
    steer(game, direction);
    const button = document.querySelector(`.move-button[data-direction="${direction}"]`);
    button?.classList.add("pressed");
    window.setTimeout(() => button?.classList.remove("pressed"), 140);
  }

  function togglePause() {
    setPaused(game, game.state === "playing");
  }

  // ---- Controls ----------------------------------------------------------

  document.querySelectorAll(".move-button").forEach((button) => {
    button.addEventListener("click", () => steerMouse(button.dataset.direction));
  });

  pauseButton.addEventListener("click", togglePause);

  catsButton.addEventListener("click", () => {
    catsEnabled = !catsEnabled;
    writeSetting(CATS_KEY, catsEnabled ? "on" : "off");
    setCatsEnabled(game, catsEnabled);
    renderCatsButton();
  });

  soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    writeSetting(SOUND_KEY, soundEnabled ? "on" : "off");
    renderSoundButton();
    if (soundEnabled) playNotes([523]);
  });

  document.querySelector("#replayButton").addEventListener("click", () => startLevel(game.levelIndex));
  document.querySelector("#nextButton").addEventListener("click", () => {
    startLevel((game.levelIndex + 1) % LEVELS.length);
  });

  window.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (!winDialog.hidden) return;
    const focused = document.activeElement;
    if (focused && ["SELECT", "INPUT", "TEXTAREA"].includes(focused.tagName)) return;

    const keyDirections = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      KeyW: "up",
      KeyS: "down",
      KeyA: "left",
      KeyD: "right",
    };
    const direction = keyDirections[event.code];
    if (direction) {
      event.preventDefault();
      steerMouse(direction);
      return;
    }
    // Space on a focused button presses that button instead.
    if (event.code === "KeyP" || (event.code === "Space" && focused?.tagName !== "BUTTON")) {
      event.preventDefault();
      togglePause();
    }
  });

  // A swipe on the maze steers; so does a tap, toward the side of the mouse it
  // lands on. Neither needs precision.
  boardWrap.addEventListener("pointerdown", (event) => {
    pointerStart = { x: event.clientX, y: event.clientY };
  });

  boardWrap.addEventListener("pointerup", (event) => {
    if (!pointerStart) return;
    let dx = event.clientX - pointerStart.x;
    let dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.hypot(dx, dy) < SWIPE_DISTANCE) {
      const box = canvas.getBoundingClientRect();
      dx = event.clientX - (box.left + (game.mouse.x + 0.5) * tile);
      dy = event.clientY - (box.top + (game.mouse.y + 0.5) * tile);
      if (Math.hypot(dx, dy) < tile * 0.5) return;
    }
    if (Math.abs(dx) > Math.abs(dy)) steerMouse(dx > 0 ? "right" : "left");
    else steerMouse(dy > 0 ? "down" : "up");
  });

  boardWrap.addEventListener("pointercancel", () => { pointerStart = null; });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) setPaused(game, true);
  });

  new ResizeObserver(() => resizeBoard()).observe(boardWrap);

  renderSoundButton();
  renderCatsButton();
  startLevel(0);
  window.requestAnimationFrame(frame);
}
