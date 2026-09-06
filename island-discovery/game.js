const MAP_WIDTH = 15;
const MAP_HEIGHT = 10;
const CITY_INDEX = 82;
// The river splits the island in two. The far side waits for the boat.
const RIVER_COLUMN = 10;
const STORAGE_KEY = "islandDiscoveryV2";
const LEGACY_STORAGE_KEY = "islandDiscoveryV1";
const SOUND_KEY = "islandDiscoverySoundV1";
const RESOURCE_ORDER = ["food", "wood", "idea"];
const RESOURCE_ICONS = { food: "🍎", wood: "🪵", idea: "💡" };

// Difficulty is one visible thing: how far the explorer walks each day.
const DIFFICULTIES = {
  easy: { energy: 3, dailyFood: 2, dailyWood: 2 },
  normal: { energy: 2, dailyFood: 1, dailyWood: 1 },
  hard: { energy: 1, dailyFood: 1, dailyWood: 1 },
};

// One mechanic at a time: walk, then gather, then open the path of discoveries.
const COACH_ORDER = ["move", "collect", "learn", "done"];

// The path of discoveries. Columns are drawn left to right and a card opens
// only after every card it points back to is open.
const CARDS = {
  garden: { icon: "🌻", column: 0, row: 0, parents: [], cost: { wood: 4 }, place: true },
  workshop: { icon: "🛠️", column: 0, row: 1, parents: [], cost: { food: 4 }, place: true },
  boots: { icon: "👣", column: 0, row: 2, parents: [], cost: { food: 2, wood: 2 } },
  library: { icon: "📚", column: 1, row: 0, parents: ["garden"], cost: { food: 2, wood: 2 }, place: true },
  basket: { icon: "🧺", column: 1, row: 1, parents: ["workshop"], cost: { food: 3, wood: 2 } },
  spyglass: { icon: "🔭", column: 1, row: 2, parents: ["boots"], cost: { wood: 2, idea: 1 } },
  festival: { icon: "🎪", column: 2, row: 0, parents: ["garden", "workshop", "library"], cost: { food: 5, wood: 5, idea: 3 } },
  boat: { icon: "🛶", column: 2, row: 2, parents: ["spyglass"], cost: { wood: 5, idea: 1 } },
};

const CARD_ORDER = Object.keys(CARDS);
const CITY_PLACES = CARD_ORDER.filter((id) => CARDS[id].place);
const COLUMNS = [
  { icon: "🏡", label: "tree-column-home" },
  { icon: "🌳", label: "tree-column-island" },
  { icon: "🌅", label: "tree-column-far" },
];

const TILE_DATA = {
  plain: { icon: "🍀", color: "#a8d67d", food: 1, wood: 0, idea: 0 },
  forest: { icon: "🌲", color: "#71b879", food: 0, wood: 2, idea: 0 },
  orchard: { icon: "🍎", color: "#bee07d", food: 2, wood: 0, idea: 0 },
  hill: { icon: "⛰️", color: "#d3bd8a", food: 0, wood: 1, idea: 1 },
  lake: { icon: "💧", color: "#7fcbd4", food: 1, wood: 0, idea: 0 },
  ruins: { icon: "🧩", color: "#c7b4d8", food: 0, wood: 0, idea: 2 },
  village: { icon: "🏡", color: "#e8c282", food: 1, wood: 1, idea: 1 },
  water: { icon: "🌊", color: "#4f9fd0", food: 1, wood: 0, idea: 0 },
  city: { icon: "🏰", color: "#f4d268", food: 0, wood: 0, idea: 0 },
};

// The pools describe the mix of places, not their number. The far side of the
// river is the reward for the boat, so puzzles and orchards live there twice.
const NEAR_POOL = [
  "forest", "orchard", "plain", "hill", "lake", "forest",
  "village", "orchard", "ruins", "forest", "lake", "plain",
  "orchard", "forest", "village", "plain", "lake", "ruins",
  "plain", "orchard", "hill", "forest", "hill",
];

const FAR_POOL = [
  "orchard", "ruins", "forest", "orchard", "hill", "ruins",
  "village", "orchard", "plain", "ruins", "forest", "orchard",
  "ruins", "hill", "village", "lake", "orchard", "forest",
];

// Pointy-top hexes in odd-r offset layout: odd rows sit half a hex to the right.
const HEX_RADIUS = 34;
const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
const HEX_HEIGHT = 2 * HEX_RADIUS;
const ROW_STEP = 1.5 * HEX_RADIUS;
// The drawn face is a little smaller than the cell, so neighbours keep a gap.
const FACE_RADIUS = HEX_RADIUS - 3;
const MAP_PADDING = 12;
const NEIGHBOURS = [
  [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]],
  [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]],
];

// Every sprite leaves room for the drop shadow below the face.
const SPRITE_PAD = 4;
const SPRITE_SHADOW = 3;
const SPRITE_WIDTH = HEX_WIDTH + SPRITE_PAD * 2;
const SPRITE_HEIGHT = HEX_HEIGHT + SPRITE_PAD * 2 + SPRITE_SHADOW;
const SPRITE_TOP = SPRITE_PAD + HEX_RADIUS;
const MAP_FONT = 'ui-rounded, "Arial Rounded MT Bold", "Trebuchet MS", "Apple Color Emoji", "Segoe UI Emoji", sans-serif';

const WALK_MS = 220;
const CAMERA_MS = 380;
const REFUSE_MS = 260;
const FLASH_MS = 1800;
const FLASH_CYCLE_MS = 900;

// Zoom limits: at the smallest scale a hex is still about 35 px wide and the
// whole island fits the map card; at the largest the explorer fills the hex.
const MIN_SCALE = 0.6;
const MAX_SCALE = 2;
// A mouse wheel notch (about 100 px) zooms by 14%; pinch deltas are tiny, so
// the trackpad pinch (a wheel event with ctrlKey) gets a stronger factor.
const WHEEL_SENSITIVITY = 0.0015;
const PINCH_SENSITIVITY = 0.01;

const state = {
  difficulty: "normal",
  coach: "move",
  food: 2,
  wood: 2,
  idea: 0,
  turn: 1,
  energy: 2,
  explorer: CITY_INDEX,
  tiles: [],
  revealed: new Set(),
  collected: new Set([CITY_INDEX]),
  opened: new Set(),
  researching: null,
  treeSeen: false,
  finished: false,
};

// Hints live for a moment and are never saved: the card the world is pointing
// at, and the road that was lit up by a tap on a locked card.
let pointedCard = null;
let litLinks = [];

// Everything about the picture that is not part of the saved game.
const view = {
  width: 0,
  height: 0,
  dpr: 1,
  camera: { x: 0, y: 0 }, // world point shown at the centre of the canvas
  scale: 1, // screen pixels per world unit
  facing: 1, // 1 when the explorer looks right, -1 when left
  cameraTween: null, // { from, to, start } while the camera travels
  walk: null, // { from, start } while the explorer walks to the new hex
  refused: null, // { index, start } while a refused hex pushes back
  flash: null, // { start } while the reachable ring calls for attention
  reachable: new Set(),
  fringe: new Set(), // hidden hexes next to explored ones, drawn as "?"
  frame: 0, // pending requestAnimationFrame id
};

function rules() {
  return DIFFICULTIES[state.difficulty] ?? DIFFICULTIES.normal;
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

// CSS animations obey the reduced motion setting on their own; a pause in
// JavaScript has to be shortened by hand or the game just sits still.
function motionDelay(milliseconds) {
  return reducedMotion.matches ? 120 : milliseconds;
}

const elements = {
  map: document.querySelector("#game-map"),
  canvas: document.querySelector("#map-canvas"),
  overlay: document.querySelector("#map-overlay"),
  food: document.querySelector("#food-count"),
  wood: document.querySelector("#wood-count"),
  idea: document.querySelector("#idea-count"),
  treeFood: document.querySelector("#tree-food-count"),
  treeWood: document.querySelector("#tree-wood-count"),
  treeIdea: document.querySelector("#tree-idea-count"),
  turn: document.querySelector("#turn-count"),
  energy: document.querySelector("#energy-pips"),
  status: document.querySelector("#status-message"),
  goalText: document.querySelector("#goal-text"),
  goalProgress: document.querySelector("#goal-progress"),
  endTurn: document.querySelector("#end-turn-button"),
  startModal: document.querySelector("#start-modal"),
  startCancel: document.querySelector("#start-cancel"),
  appShell: document.querySelector(".app-shell"),
  researchPanel: document.querySelector(".research-panel"),
  researchSlot: document.querySelector("#research-slot"),
  treeButton: document.querySelector("#tree-button"),
  treeModal: document.querySelector("#tree-modal"),
  treeBack: document.querySelector("#tree-back"),
  techGrid: document.querySelector("#tech-grid"),
  sceneItems: [...document.querySelectorAll("[data-scene]")],
  victory: document.querySelector("#victory-modal"),
  victoryTurns: document.querySelector("#victory-turns"),
  victoryTiles: document.querySelector("#victory-tiles"),
  energyText: document.querySelector("#energy-text"),
  resources: {
    food: document.querySelector(".food-resource"),
    wood: document.querySelector(".wood-resource"),
    idea: document.querySelector(".idea-resource"),
  },
};

function loadSoundPreference() {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

let soundEnabled = loadSoundPreference();

function readText(id) {
  return document.querySelector(`#${id}`).textContent.trim();
}

function shuffle(values) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

// Hands out places from a pool that reshuffles itself, so the mix stays even
// however many cells a side of the island happens to have.
function poolTaker(pool) {
  let queue = [];
  return () => {
    if (queue.length === 0) queue = shuffle([...pool]);
    return queue.pop();
  };
}

function islandTiles() {
  const takeNear = poolTaker(NEAR_POOL);
  const takeFar = poolTaker(FAR_POOL);
  const tiles = [];
  for (let index = 0; index < MAP_WIDTH * MAP_HEIGHT; index += 1) {
    const column = index % MAP_WIDTH;
    if (index === CITY_INDEX) tiles.push("city");
    else if (column === RIVER_COLUMN) tiles.push("water");
    else if (column < RIVER_COLUMN) tiles.push(takeNear());
    else tiles.push(takeFar());
  }
  return tiles;
}

function positionOf(index) {
  return {
    row: Math.floor(index / MAP_WIDTH),
    column: index % MAP_WIDTH,
  };
}

function adjacentIndexes(index) {
  const { row, column } = positionOf(index);
  return NEIGHBOURS[row & 1]
    .map(([dColumn, dRow]) => [row + dRow, column + dColumn])
    .filter(([nextRow, nextColumn]) => (
      nextRow >= 0
      && nextRow < MAP_HEIGHT
      && nextColumn >= 0
      && nextColumn < MAP_WIDTH
    ))
    .map(([nextRow, nextColumn]) => nextRow * MAP_WIDTH + nextColumn);
}

function isAdjacent(first, second) {
  return adjacentIndexes(first).includes(second);
}

function centerOf(index) {
  const { row, column } = positionOf(index);
  return {
    x: HEX_WIDTH * (column + 0.5 * (row & 1)),
    y: ROW_STEP * row,
  };
}

function hexPath(radius) {
  const path = new Path2D();
  for (let corner = 0; corner < 6; corner += 1) {
    const angle = Math.PI / 6 + corner * Math.PI / 3;
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (corner === 0) path.moveTo(x, y);
    else path.lineTo(x, y);
  }
  path.closePath();
  return path;
}

const FACE_PATH = hexPath(FACE_RADIUS);
const FOCUS_PATH = hexPath(HEX_RADIUS + 1);

// The camera sits at the centre of the canvas; the world grows from there.
function toScreen(world) {
  return {
    x: (world.x - view.camera.x) * view.scale + view.width / 2,
    y: (world.y - view.camera.y) * view.scale + view.height / 2,
  };
}

function toWorld(screen) {
  return {
    x: (screen.x - view.width / 2) / view.scale + view.camera.x,
    y: (screen.y - view.height / 2) / view.scale + view.camera.y,
  };
}

// Screen point → axial coordinates → rounded cube → odd-r index, or null
// outside the map. Exact for the whole hex, not for its bounding box.
function hexAt(screenX, screenY) {
  const { x, y } = toWorld({ x: screenX, y: screenY });
  const q = (Math.sqrt(3) / 3 * x - y / 3) / HEX_RADIUS;
  const r = (2 / 3 * y) / HEX_RADIUS;
  let roundQ = Math.round(q);
  let roundR = Math.round(r);
  const roundS = Math.round(-q - r);
  const diffQ = Math.abs(roundQ - q);
  const diffR = Math.abs(roundR - r);
  const diffS = Math.abs(roundS + q + r);
  if (diffQ > diffR && diffQ > diffS) roundQ = -roundR - roundS;
  else if (diffR > diffS) roundR = -roundQ - roundS;
  const column = roundQ + (roundR - (roundR & 1)) / 2;
  if (roundR < 0 || roundR >= MAP_HEIGHT || column < 0 || column >= MAP_WIDTH) return null;
  return roundR * MAP_WIDTH + column;
}

function mapBounds() {
  return {
    minX: -HEX_WIDTH / 2 - MAP_PADDING,
    maxX: HEX_WIDTH * MAP_WIDTH + MAP_PADDING,
    minY: -HEX_RADIUS - MAP_PADDING,
    maxY: ROW_STEP * (MAP_HEIGHT - 1) + HEX_RADIUS + MAP_PADDING,
  };
}

function clampAxis(value, min, max, size) {
  if (max - min <= size) return (min + max) / 2;
  return Math.min(Math.max(value, min + size / 2), max - size / 2);
}

function clampCamera(point) {
  const bounds = mapBounds();
  return {
    x: clampAxis(point.x, bounds.minX, bounds.maxX, view.width / view.scale),
    y: clampAxis(point.y, bounds.minY, bounds.maxY, view.height / view.scale),
  };
}

function easeOut(progress) {
  return 1 - (1 - progress) ** 3;
}

// The spyglass sees one ring further. Distance is counted in steps, so the
// mist opens in rings of hexes and not in a square.
function revealAround(index) {
  const radius = state.opened.has("spyglass") ? 2 : 1;
  let frontier = [index];
  state.revealed.add(index);
  for (let step = 0; step < radius; step += 1) {
    const next = [];
    frontier.forEach((current) => {
      adjacentIndexes(current).forEach((near) => {
        if (state.revealed.has(near)) return;
        state.revealed.add(near);
        next.push(near);
      });
    });
    frontier = next;
  }
}

function pulseResource(resource) {
  const element = elements.resources[resource];
  element.classList.remove("bump");
  requestAnimationFrame(() => element.classList.add("bump"));
}

function setMessage(messageKey) {
  elements.status.textContent = readText(`message-${messageKey}`);
}

function advanceCoach(step) {
  if (COACH_ORDER.indexOf(step) > COACH_ORDER.indexOf(state.coach)) {
    state.coach = step;
  }
}

function stepsPerDay() {
  return rules().energy + (state.opened.has("boots") ? 1 : 0);
}

function need(id, resource) {
  return CARDS[id].cost[resource] ?? 0;
}

function parentsOpen(id) {
  return CARDS[id].parents.every((parent) => state.opened.has(parent));
}

function affordable(id) {
  return RESOURCE_ORDER.every((resource) => state[resource] >= need(id, resource));
}

function cardState(id) {
  if (state.opened.has(id)) return "open";
  if (!parentsOpen(id)) return "locked";
  if (affordable(id)) return "ready";
  return state.researching === id ? "goal" : "free";
}

// How much of a chosen card is already paid for, counted in gift pictures.
function filledCount(id) {
  if (!id) return 0;
  return RESOURCE_ORDER.reduce(
    (total, resource) => total + Math.min(state[resource], need(id, resource)),
    0,
  );
}

// The first card on the road to a locked one that can be chosen right now.
function firstMissingParent(id) {
  for (const parent of CARDS[id].parents) {
    if (state.opened.has(parent)) continue;
    return parentsOpen(parent) ? parent : firstMissingParent(parent);
  }
  return null;
}

// Every closed link between the frontier and the card that was tapped.
function routeTo(id) {
  const links = [];
  const walk = (card) => {
    CARDS[card].parents.forEach((parent) => {
      if (state.opened.has(parent)) return;
      links.push(`${parent}-${card}`);
      walk(parent);
    });
  };
  walk(id);
  return links;
}

function arrowLinks() {
  const links = [];
  CARD_ORDER.forEach((id) => {
    CARDS[id].parents.forEach((parent) => {
      if (CARDS[parent].row === CARDS[id].row && CARDS[parent].column === CARDS[id].column - 1) {
        links.push({ parent, child: id });
      }
    });
  });
  return links;
}

function saveGame() {
  if (state.finished) {
    clearSavedGame();
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      revealed: [...state.revealed],
      collected: [...state.collected],
      opened: [...state.opened],
    }));
  } catch {
    // Private browsing modes can refuse writes. The game stays for this session only.
  }
}

function clearSavedGame() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

function whole(value, fallback) {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
}

// A saved game is text the player can edit, so every part of it is filtered
// down to values the rest of the code already knows how to draw.
function knownTile(value) {
  return typeof value === "string" && Object.hasOwn(TILE_DATA, value);
}

function tileIndexes(value, limit) {
  return Array.isArray(value)
    ? value.filter((index) => Number.isInteger(index) && index >= 0 && index < limit)
    : [];
}

function loadGame() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
  if (
    !saved
    || !Array.isArray(saved.tiles)
    || saved.tiles.length !== MAP_WIDTH * MAP_HEIGHT
    || !saved.tiles.every(knownTile)
  ) {
    return false;
  }

  const tileCount = saved.tiles.length;
  Object.assign(state, saved, {
    revealed: new Set(tileIndexes(saved.revealed, tileCount)),
    collected: new Set(tileIndexes(saved.collected, tileCount)),
    opened: new Set(Array.isArray(saved.opened)
      ? saved.opened.filter((card) => CARD_ORDER.includes(card))
      : []),
    treeSeen: saved.treeSeen === true,
    finished: false,
  });
  if (!DIFFICULTIES[state.difficulty]) state.difficulty = "normal";
  if (!COACH_ORDER.includes(state.coach)) state.coach = "done";
  if (!CARD_ORDER.includes(state.researching) || state.opened.has(state.researching)) {
    state.researching = null;
  }
  state.food = whole(state.food, 0);
  state.wood = whole(state.wood, 0);
  state.idea = whole(state.idea, 0);
  state.turn = Math.max(whole(state.turn, 1), 1);
  state.energy = Math.min(whole(state.energy, 0), stepsPerDay());
  if (!Number.isInteger(state.explorer) || state.explorer < 0 || state.explorer >= state.tiles.length) {
    state.explorer = CITY_INDEX;
  }
  return true;
}

// The basket makes the biggest gift of a place bigger. Ties go to apples,
// then logs, then ideas, so the answer never depends on the order of a loop.
function biggestGift(reward) {
  if (!state.opened.has("basket")) return null;
  let best = null;
  RESOURCE_ORDER.forEach((resource) => {
    if (reward[resource] > 0 && (best === null || reward[resource] > reward[best])) best = resource;
  });
  return best;
}

function collectTile(index) {
  const type = state.tiles[index];
  if (state.collected.has(index)) {
    setMessage(type === "city" ? "city" : "empty");
    return false;
  }

  const reward = TILE_DATA[type];
  const bonus = biggestGift(reward);
  RESOURCE_ORDER.forEach((resource) => {
    const amount = reward[resource] + (resource === bonus ? 1 : 0);
    state[resource] += amount;
    if (amount > 0) pulseResource(resource);
  });
  state.collected.add(index);

  setMessage(type);
  return true;
}

function startFlash() {
  view.flash = { start: performance.now() };
}

// A hex out of reach answers with the world: it pushes back and the reachable
// neighbours flash, so the message is not the only explanation.
function refuseTile(index) {
  view.refused = { index, start: performance.now() };
  startFlash();
  scheduleDraw();
}

// The same world reaction as refuseTile(), for a card or button instead of a tile.
function shakeRefusal(element) {
  element.classList.remove("refuse-shake");
  requestAnimationFrame(() => element.classList.add("refuse-shake"));
  window.setTimeout(() => element.classList.remove("refuse-shake"), 500);
}

// Something on the island needs a discovery, so the way into the tree calls
// for attention and the card itself is marked once the tree is open. The
// button is touched directly: a full render would rebuild the map and take
// away the tile that is in the middle of answering the tap.
function pointAt(id) {
  pointedCard = id;
  elements.treeButton.classList.toggle("is-calling", id !== null);
}

function moveExplorer(index) {
  if (state.finished) return;
  if (index === state.explorer) {
    startFlash();
    scheduleDraw();
    return;
  }
  // The mist beyond the "?" ring is not a place yet, so a tap there does nothing.
  if (!state.revealed.has(index) && !view.fringe.has(index)) return;
  if (!isAdjacent(state.explorer, index)) {
    setMessage("far");
    refuseTile(index);
    return;
  }
  if (state.energy <= 0) {
    setMessage("no-energy");
    refuseTile(index);
    return;
  }
  if (state.tiles[index] === "water" && !state.opened.has("boat")) {
    setMessage("no-boat");
    refuseTile(index);
    pointAt("boat");
    return;
  }

  if (!reducedMotion.matches) view.walk = { from: state.explorer, start: performance.now() };
  const stride = centerOf(index).x - centerOf(state.explorer).x;
  if (stride !== 0) view.facing = Math.sign(stride);
  state.explorer = index;
  state.energy -= 1;
  revealAround(index);
  const before = filledCount(state.researching);
  const gained = collectTile(index);
  advanceCoach(gained ? "collect" : "move");
  if (state.collected.size >= 3) unlockTree();
  const opened = settleResearch();
  if (!opened && filledCount(state.researching) > before) playSound("progress", before);
  render();
  moveCamera(centerOf(index), true);
  saveGame();

  if (state.energy === 0) {
    window.setTimeout(() => {
      if (!state.finished && state.energy === 0) setMessage("no-energy");
    }, 1800);
  }
}

// --- Map view -------------------------------------------------------------

// Water without a boat is not a place the explorer can step on yet.
function isDeep(index) {
  return state.tiles[index] === "water" && !state.opened.has("boat");
}

function computeReach() {
  const canStep = state.energy > 0;
  view.reachable = new Set(canStep
    ? adjacentIndexes(state.explorer)
      .filter((index) => state.revealed.has(index) && !isDeep(index))
    : []);
  const fringe = new Set();
  state.revealed.forEach((index) => {
    adjacentIndexes(index).forEach((near) => {
      if (!state.revealed.has(near)) fringe.add(near);
    });
  });
  view.fringe = fringe;
}

function tileLabel(index) {
  const terrain = readText(`tile-${state.revealed.has(index) ? state.tiles[index] : "hidden"}`);
  const isExplorer = state.explorer === index;
  const isCollected = state.collected.has(index);
  const isReachable = view.reachable.has(index);
  let stateKey = null;
  if (isExplorer) stateKey = "tile-state-explorer";
  else if (isCollected && isReachable) stateKey = "tile-state-collected-reachable";
  else if (isCollected) stateKey = "tile-state-collected";
  else if (isReachable) stateKey = "tile-state-reachable";
  return stateKey ? readText(stateKey).replace("{terrain}", terrain) : terrain;
}

// Invisible buttons over the explorer and the reachable hexes carry the
// keyboard, the focus and the accessible names. The canvas draws everything.
function syncOverlay() {
  const hadFocus = elements.overlay.contains(document.activeElement);
  elements.overlay.replaceChildren();

  [state.explorer, ...view.reachable].forEach((index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hex-button";
    button.dataset.index = index;
    button.style.width = `${HEX_WIDTH}px`;
    button.style.height = `${HEX_HEIGHT}px`;
    button.setAttribute("aria-label", tileLabel(index));
    button.addEventListener("click", () => moveExplorer(index));
    elements.overlay.append(button);
  });

  if (hadFocus) focusExplorer();
  positionOverlay();
}

function focusExplorer() {
  elements.overlay.querySelector(`[data-index="${state.explorer}"]`)?.focus();
}

function positionOverlay() {
  for (const button of elements.overlay.children) {
    const { x, y } = toScreen(centerOf(Number(button.dataset.index)));
    const left = x - (HEX_WIDTH / 2) * view.scale;
    const top = y - (HEX_HEIGHT / 2) * view.scale;
    button.style.transform = `translate(${left}px, ${top}px) scale(${view.scale})`;
  }
}

// Zoom keeps the explorer where it is on the screen: the world grows and
// shrinks around the figure, never around a corner of the map.
function setScale(nextScale) {
  const scale = Math.min(Math.max(nextScale, MIN_SCALE), MAX_SCALE);
  if (scale === view.scale) return;
  const explorer = centerOf(state.explorer);
  const anchor = toScreen(explorer);
  view.scale = scale;
  view.cameraTween = null;
  view.camera = clampCamera({
    x: explorer.x - (anchor.x - view.width / 2) / scale,
    y: explorer.y - (anchor.y - view.height / 2) / scale,
  });
  scheduleDraw();
}

// Wheel deltas arrive in pixels, lines or pages depending on the device.
function wheelPixels(event) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * view.height;
  return event.deltaY;
}

function moveCamera(target, animate) {
  const to = clampCamera(target);
  if (animate && !reducedMotion.matches) {
    view.cameraTween = { from: { ...view.camera }, to, start: performance.now() };
  } else {
    view.camera = to;
    view.cameraTween = null;
  }
  scheduleDraw();
}

function resizeCanvas() {
  const rect = elements.map.getBoundingClientRect();
  view.width = rect.width;
  view.height = rect.height;
  view.dpr = window.devicePixelRatio || 1;
  elements.canvas.width = Math.round(view.width * view.dpr);
  elements.canvas.height = Math.round(view.height * view.dpr);
  view.cameraTween = null;
  if (state.tiles.length) view.camera = clampCamera(centerOf(state.explorer));
  scheduleDraw();
}

function scheduleDraw() {
  if (!view.frame) view.frame = requestAnimationFrame(draw);
}

// --- Sprites --------------------------------------------------------------

const sprites = new Map();

// Sprites are rasterised for the zoom rounded up to a quarter step, so a frame
// only ever shrinks them a little and a wheel gesture does not redraw them.
function spriteDensity() {
  return view.dpr * Math.ceil(view.scale * 4) / 4;
}

// One picture per terrain and state, drawn once per pixel density. Emoji
// text is the slow part of a frame, so a frame only copies these pictures.
function sprite(kind, collected, deep, wantsBoat) {
  const density = spriteDensity();
  const key = `${kind}|${collected ? "done" : "new"}|${deep ? "deep" : "open"}|${wantsBoat ? "boat" : "quiet"}|${density}`;
  let image = sprites.get(key);
  if (image) return image;

  image = document.createElement("canvas");
  image.width = Math.ceil(SPRITE_WIDTH * density);
  image.height = Math.ceil(SPRITE_HEIGHT * density);
  const brush = image.getContext("2d");
  brush.scale(density, density);
  brush.translate(SPRITE_WIDTH / 2, SPRITE_TOP);
  brush.textAlign = "center";
  brush.textBaseline = "middle";

  if (kind === "hidden") {
    brush.fillStyle = "#87a59c";
    brush.fill(FACE_PATH);
    brush.save();
    brush.clip(FACE_PATH);
    brush.lineWidth = 4;
    brush.strokeStyle = "rgba(255, 255, 255, 0.17)";
    brush.stroke(FACE_PATH);
    brush.restore();
    brush.fillStyle = "#233743";
    brush.font = `900 23px ${MAP_FONT}`;
    brush.fillText("?", 0, 1);
  } else {
    const tile = TILE_DATA[kind];
    brush.save();
    brush.translate(0, SPRITE_SHADOW);
    brush.fillStyle = "rgba(72, 97, 73, 0.14)";
    brush.fill(FACE_PATH);
    brush.restore();
    brush.fillStyle = tile.color;
    brush.fill(FACE_PATH);
    // A darker rim along the two lower edges stands in for the bevel.
    brush.save();
    brush.clip(FACE_PATH);
    brush.beginPath();
    brush.moveTo(-FACE_RADIUS * Math.sqrt(3) / 2, FACE_RADIUS / 2);
    brush.lineTo(0, FACE_RADIUS);
    brush.lineTo(FACE_RADIUS * Math.sqrt(3) / 2, FACE_RADIUS / 2);
    brush.lineWidth = 10;
    brush.lineJoin = "round";
    brush.strokeStyle = "rgba(52, 72, 51, 0.12)";
    brush.stroke();
    brush.restore();
    brush.font = `32px ${MAP_FONT}`;
    brush.fillText(tile.icon, 0, 2);
    if (collected) {
      brush.save();
      brush.clip(FACE_PATH);
      brush.fillStyle = "rgba(255, 255, 255, 0.3)";
      brush.fillRect(-HEX_WIDTH / 2, -HEX_RADIUS, HEX_WIDTH, HEX_HEIGHT);
      brush.restore();
      brush.fillStyle = "#2f6b4f";
      brush.font = `900 17px ${MAP_FONT}`;
      brush.shadowColor = "rgba(255, 255, 255, 0.85)";
      brush.shadowOffsetY = 1;
      brush.fillText("✓", -FACE_RADIUS * 0.42, -FACE_RADIUS * 0.5);
      brush.shadowColor = "transparent";
      brush.shadowOffsetY = 0;
    }
    // Water without a boat is not broken, it is waiting: it lies deeper, and
    // once the path of discoveries is known it carries its sign.
    if (deep) {
      brush.save();
      brush.clip(FACE_PATH);
      brush.fillStyle = "rgba(35, 60, 80, 0.16)";
      brush.fillRect(-HEX_WIDTH / 2, -HEX_RADIUS, HEX_WIDTH, HEX_HEIGHT);
      brush.restore();
      if (wantsBoat) {
        brush.font = `15px ${MAP_FONT}`;
        brush.fillText("🛶", FACE_RADIUS * 0.4, FACE_RADIUS * 0.5);
      }
    }
  }

  sprites.set(key, image);
  return image;
}

function tileSprite(index) {
  if (!state.revealed.has(index)) return sprite("hidden", false, false, false);
  const deep = isDeep(index);
  return sprite(state.tiles[index], state.collected.has(index), deep, deep && state.treeSeen);
}

// --- Drawing --------------------------------------------------------------

// The refused hex dips and shrinks, then settles: the same keyframes as the
// old CSS animation, sampled by progress.
function refuseFrame(progress) {
  const frames = [
    [0, 0, 1],
    [0.3, 3, 0.95],
    [0.65, 0, 1.02],
    [1, 0, 1],
  ];
  for (let step = 1; step < frames.length; step += 1) {
    const [end, dy, scale] = frames[step];
    if (progress <= end) {
      const [begin, fromDy, fromScale] = frames[step - 1];
      const part = (progress - begin) / (end - begin);
      return { dy: fromDy + (dy - fromDy) * part, scale: fromScale + (scale - fromScale) * part };
    }
  }
  return { dy: 0, scale: 1 };
}

function ringStyle(now) {
  if (!view.flash) return { width: 4, color: "rgba(255, 226, 99, 0.92)" };
  // Reduced motion keeps a steady, wider ring instead of a pulse.
  if (reducedMotion.matches) return { width: 7, color: "rgba(255, 196, 60, 0.95)" };
  const cycle = ((now - view.flash.start) % FLASH_CYCLE_MS) / FLASH_CYCLE_MS;
  const pulse = Math.sin(Math.PI * cycle);
  return {
    width: 4 + 5 * pulse,
    color: `rgba(255, ${Math.round(226 - 30 * pulse)}, ${Math.round(99 - 39 * pulse)}, 0.94)`,
  };
}

function visibleRange() {
  const topLeft = toWorld({ x: 0, y: 0 });
  const bottomRight = toWorld({ x: view.width, y: view.height });
  return {
    rowMin: Math.max(0, Math.floor((topLeft.y - HEX_RADIUS) / ROW_STEP) - 1),
    rowMax: Math.min(MAP_HEIGHT - 1, Math.ceil((bottomRight.y + HEX_RADIUS) / ROW_STEP) + 1),
    columnMin: Math.max(0, Math.floor(topLeft.x / HEX_WIDTH) - 2),
    columnMax: Math.min(MAP_WIDTH - 1, Math.ceil(bottomRight.x / HEX_WIDTH) + 1),
  };
}

function drawTile(context, index, now, lift = 0) {
  const { x, y } = centerOf(index);
  const image = tileSprite(index);
  context.save();
  context.translate(x, y - lift);
  if (view.refused?.index === index && !reducedMotion.matches) {
    const { dy, scale } = refuseFrame((now - view.refused.start) / REFUSE_MS);
    context.translate(0, dy);
    context.scale(scale, scale);
  }
  context.drawImage(image, -SPRITE_WIDTH / 2, -SPRITE_TOP, SPRITE_WIDTH, SPRITE_HEIGHT);
  context.restore();
}

// A reachable hex is lifted above its neighbours with a yellow ring, like the
// old lifted tile with its box-shadow.
function drawReachable(context, index, now) {
  const { x, y } = centerOf(index);
  const ring = ringStyle(now);
  context.save();
  context.translate(x, y - 3);
  context.lineWidth = ring.width * 2;
  context.lineJoin = "round";
  context.strokeStyle = ring.color;
  context.stroke(FACE_PATH);
  context.restore();
  drawTile(context, index, now, 3);
}

function fillRoundedRect(context, x, y, width, height, radius, color) {
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function drawCompass(context, x, y, radius) {
  context.save();
  context.translate(x, y);
  context.fillStyle = "#fffaf0";
  context.strokeStyle = "#233743";
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.lineWidth = 2;
  context.strokeStyle = "#e0523d";
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(0, -radius + 2);
  context.stroke();
  context.strokeStyle = "#3b5ba5";
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(0, radius - 2);
  context.stroke();
  context.restore();
}

// A small explorer in a safari hat, with a backpack and a compass in hand.
// The figure faces the way it last walked and hops while walking; the ground
// shadow stays on the hex so the hop reads as a jump, not a slide.
function drawExplorerFigure(context, x, y, facing, hop) {
  context.save();
  context.translate(x, y + 6);
  context.fillStyle = "rgba(35, 55, 67, 0.18)";
  context.beginPath();
  context.ellipse(0, 18, 13, 4.5, 0, 0, Math.PI * 2);
  context.fill();
  context.scale(facing, 1);
  context.translate(0, -hop);
  context.lineJoin = "round";
  context.lineCap = "round";

  fillRoundedRect(context, -15, -7, 10, 16, 4, "#a86d3a"); // backpack
  fillRoundedRect(context, -8, 6, 6, 10, 3, "#3b5ba5"); // legs
  fillRoundedRect(context, 2, 6, 6, 10, 3, "#3b5ba5");
  fillRoundedRect(context, -9, 13, 8, 5, 2.5, "#6b4a2b"); // shoes
  fillRoundedRect(context, 1, 13, 9, 5, 2.5, "#6b4a2b");
  fillRoundedRect(context, -10, -8, 20, 17, 6, "#4c9a5f"); // shirt

  context.strokeStyle = "#f6c9a0"; // arm reaching forward
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(8, -3);
  context.lineTo(16, 2);
  context.stroke();
  drawCompass(context, 18, 4, 4.5);

  context.fillStyle = "#f6c9a0"; // head
  context.beginPath();
  context.arc(0, -17, 9, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "#233743"; // eyes
  context.beginPath();
  context.arc(2, -18, 1.4, 0, Math.PI * 2);
  context.arc(6.5, -18, 1.4, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = "rgba(238, 136, 70, 0.4)"; // cheek
  context.beginPath();
  context.arc(-1, -14, 2.2, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#8a4a2b"; // smile
  context.lineWidth = 1.5;
  context.beginPath();
  context.arc(4.5, -14.5, 3, 0.15 * Math.PI, 0.85 * Math.PI);
  context.stroke();

  context.fillStyle = "#d9b46a"; // hat brim
  context.beginPath();
  context.ellipse(0, -23, 14, 4, 0, 0, Math.PI * 2);
  context.fill();
  fillRoundedRect(context, -8, -33, 16, 11, 5, "#e5c67f"); // hat crown
  fillRoundedRect(context, -8, -26, 16, 3, 1, "#e0523d"); // hat band
  context.restore();
}

function drawExplorer(context, now) {
  let { x, y } = centerOf(state.explorer);
  let hop = 0;
  if (view.walk) {
    const progress = Math.min((now - view.walk.start) / WALK_MS, 1);
    const eased = easeOut(progress);
    const from = centerOf(view.walk.from);
    x = from.x + (x - from.x) * eased;
    y = from.y + (y - from.y) * eased;
    hop = Math.sin(progress * Math.PI) * 8;
  }
  drawExplorerFigure(context, x, y, view.facing, hop);
}

// The keyboard focus lives on an invisible button, so its ring is painted here.
function drawFocus(context) {
  const focused = elements.overlay.querySelector(":focus-visible");
  if (!focused) return;
  const { x, y } = centerOf(Number(focused.dataset.index));
  context.save();
  context.translate(x, y);
  context.lineWidth = 3;
  context.lineJoin = "round";
  context.strokeStyle = "#307157";
  context.stroke(FOCUS_PATH);
  context.restore();
}

function draw(now) {
  view.frame = 0;
  const context = elements.canvas.getContext("2d");
  let animating = false;

  if (view.cameraTween) {
    const progress = Math.min((now - view.cameraTween.start) / CAMERA_MS, 1);
    const eased = easeOut(progress);
    const { from, to } = view.cameraTween;
    view.camera = { x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased };
    if (progress >= 1) view.cameraTween = null;
    else animating = true;
  }
  if (view.walk && now - view.walk.start >= WALK_MS) view.walk = null;
  if (view.refused && now - view.refused.start >= REFUSE_MS) view.refused = null;
  if (view.flash && now - view.flash.start >= FLASH_MS) view.flash = null;
  if (view.walk || view.refused || view.flash) animating = true;

  context.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
  context.clearRect(0, 0, view.width, view.height);

  context.save();
  context.translate(view.width / 2, view.height / 2);
  context.scale(view.scale, view.scale);
  context.translate(-view.camera.x, -view.camera.y);

  const range = visibleRange();
  for (let row = range.rowMin; row <= range.rowMax; row += 1) {
    for (let column = range.columnMin; column <= range.columnMax; column += 1) {
      const index = row * MAP_WIDTH + column;
      if (!state.revealed.has(index) && !view.fringe.has(index)) continue;
      if (view.reachable.has(index)) continue;
      drawTile(context, index, now);
    }
  }
  view.reachable.forEach((index) => drawReachable(context, index, now));
  drawExplorer(context, now);
  drawFocus(context);
  context.restore();

  positionOverlay();
  if (animating) scheduleDraw();
}

// --- Panels ---------------------------------------------------------------

function renderEnergy() {
  const steps = stepsPerDay();
  elements.energy.replaceChildren();
  for (let index = 0; index < steps; index += 1) {
    const pip = document.createElement("span");
    pip.className = `energy-pip${index >= state.energy ? " used" : ""}`;
    elements.energy.append(pip);
  }
  elements.energyText.textContent = `${state.energy} of ${steps} steps left`;
}

function cardStateText(id, status) {
  const name = readText(`card-name-${id}`);
  if (status === "locked") {
    const parent = CARDS[id].parents.find((item) => !state.opened.has(item));
    return readText("card-state-locked")
      .replace("{card}", name)
      .replace("{parent}", readText(`card-name-${parent}`));
  }
  return readText(`card-state-${status}`).replace("{card}", name);
}

// The cost is a row of gifts, one picture per apple, log and idea, so it can
// be counted instead of read. The numbers go to the screen reader only.
function costRows(id) {
  const wrap = document.createElement("span");
  wrap.className = "tech-cost";
  RESOURCE_ORDER.forEach((resource) => {
    const amount = need(id, resource);
    if (amount === 0) return;
    const have = Math.min(state[resource], amount);

    const row = document.createElement("span");
    row.className = "cost-row";
    const spoken = document.createElement("span");
    spoken.className = "sr-only";
    spoken.textContent = readText(`card-need-${resource}`)
      .replace("{count}", have)
      .replace("{need}", amount);
    row.append(spoken);

    for (let index = 0; index < amount; index += 1) {
      const chip = document.createElement("span");
      chip.className = `cost-chip${index < have ? " filled" : ""}`;
      chip.setAttribute("aria-hidden", "true");
      chip.textContent = RESOURCE_ICONS[resource];
      row.append(chip);
    }
    wrap.append(row);
  });
  return wrap;
}

// A locked card shows what has to open before it, with a check on the parts
// that are ready. The arrows repeat the same thing for the wide screen.
function parentRow(id) {
  const row = document.createElement("span");
  row.className = "tech-parents";
  CARDS[id].parents.forEach((parent) => {
    const chip = document.createElement("span");
    chip.className = `parent-chip${state.opened.has(parent) ? " done" : ""}`;
    chip.setAttribute("aria-hidden", "true");
    chip.textContent = CARDS[parent].icon;
    row.append(chip);
  });
  return row;
}

const CARD_MARKS = { open: "✓", ready: "✨", goal: "🎈", locked: "🔒", free: "" };

function createCard(id) {
  const status = cardState(id);
  const button = document.createElement("button");
  button.type = "button";
  button.className = `tech-card is-${status}`;
  button.dataset.card = id;
  if (pointedCard === id && status !== "open") button.classList.add("is-pointed");

  const icon = document.createElement("span");
  icon.className = "tech-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = CARDS[id].icon;

  const copy = document.createElement("span");
  copy.className = "tech-copy";
  const title = document.createElement("strong");
  title.textContent = readText(`card-name-${id}`);
  const effect = document.createElement("small");
  effect.textContent = readText(`card-effect-${id}`);
  const spoken = document.createElement("span");
  spoken.className = "sr-only";
  spoken.textContent = cardStateText(id, status);
  copy.append(title, effect, spoken);
  if (status === "locked") copy.append(parentRow(id));
  if (status !== "open") copy.append(costRows(id));

  const mark = document.createElement("span");
  mark.className = "tech-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = CARD_MARKS[status];

  button.append(icon, copy, mark);
  return button;
}

function renderTree() {
  elements.techGrid.replaceChildren();

  // A column and the cards standing in it are written out together, so that a
  // narrow screen, where the tree becomes one column, still reads as three
  // parts of a road instead of three headings and a heap of cards.
  COLUMNS.forEach((column, index) => {
    const head = document.createElement("div");
    head.className = "tech-column-head";
    head.style.gridArea = `1 / ${index * 2 + 1}`;
    const icon = document.createElement("span");
    icon.className = "tech-column-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = column.icon;
    const text = document.createElement("span");
    text.textContent = readText(column.label);
    head.append(icon, text);
    elements.techGrid.append(head);

    CARD_ORDER.filter((id) => CARDS[id].column === index).forEach((id) => {
      const button = createCard(id);
      button.style.gridArea = `${CARDS[id].row + 2} / ${index * 2 + 1}`;
      button.addEventListener("click", () => pickCard(id));
      elements.techGrid.append(button);
    });
  });

  arrowLinks().forEach(({ parent, child }) => {
    const arrow = document.createElement("span");
    arrow.className = "tech-arrow";
    if (state.opened.has(parent)) arrow.classList.add("is-open");
    if (litLinks.includes(`${parent}-${child}`)) arrow.classList.add("is-lit");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "➜";
    arrow.style.gridArea = `${CARDS[child].row + 2} / ${CARDS[parent].column * 2 + 2}`;
    elements.techGrid.append(arrow);
  });
}

function renderResearchSlot() {
  elements.researchSlot.replaceChildren();

  if (state.researching) {
    const card = createCard(state.researching);
    card.classList.add("is-slot");
    card.addEventListener("click", openTree);
    elements.researchSlot.append(card);
    return;
  }

  const invite = document.createElement("button");
  invite.type = "button";
  invite.className = "research-invite";
  const icon = document.createElement("span");
  icon.className = "research-invite-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "💡";
  const text = document.createElement("strong");
  text.textContent = readText("coach-learn");
  invite.append(icon, text);
  invite.addEventListener("click", openTree);
  elements.researchSlot.append(invite);
}

function renderScene() {
  elements.sceneItems.forEach((item) => {
    item.hidden = !state.opened.has(item.dataset.scene);
  });
}

// The three friendly places the festival waits for, as pictures instead of a
// score: position and a check mark carry the meaning, not colour.
function renderGoalProgress() {
  elements.goalProgress.replaceChildren();
  if (state.opened.has("festival")) {
    elements.goalProgress.textContent = "🎪";
    return;
  }

  const ready = CITY_PLACES.filter((id) => state.opened.has(id)).length;
  const spoken = document.createElement("span");
  spoken.className = "sr-only";
  spoken.textContent = readText("goal-places").replace("{count}", ready);
  elements.goalProgress.append(spoken);

  CITY_PLACES.forEach((id) => {
    const pill = document.createElement("span");
    pill.className = `goal-pill${state.opened.has(id) ? " done" : ""}`;
    pill.setAttribute("aria-hidden", "true");
    pill.textContent = CARDS[id].icon;
    elements.goalProgress.append(pill);
  });
}

function goalText(learning) {
  if (!learning) return readText(`coach-${state.coach}`);
  if (state.researching) {
    return readText("goal-gathering")
      .replace("{card}", readText(`card-name-${state.researching}`));
  }
  if (parentsOpen("festival")) return readText("goal-festival");
  return readText("coach-learn");
}

function renderCoach() {
  const learning = COACH_ORDER.indexOf(state.coach) >= COACH_ORDER.indexOf("learn");
  elements.researchPanel.classList.toggle("is-locked", !learning);

  if (state.opened.has("festival")) return;
  elements.goalText.textContent = goalText(learning);
}

function render() {
  view.flash = null;
  elements.food.textContent = state.food;
  elements.wood.textContent = state.wood;
  elements.idea.textContent = state.idea;
  elements.treeFood.textContent = state.food;
  elements.treeWood.textContent = state.wood;
  elements.treeIdea.textContent = state.idea;
  elements.turn.textContent = state.turn;
  renderEnergy();
  computeReach();
  syncOverlay();
  renderResearchSlot();
  renderScene();
  renderGoalProgress();
  renderCoach();
  if (elements.treeModal.classList.contains("visible")) renderTree();
  elements.endTurn.classList.toggle("is-waiting", state.energy === 0 && !state.finished);
  elements.treeButton.classList.toggle("is-calling", pointedCard !== null);
  // While the first step is being taught, the reachable ring keeps calling.
  if (state.coach === "move") startFlash();
  scheduleDraw();
}

function endTurn() {
  if (state.finished) return;
  if (state.energy > 0) {
    setMessage("steps-left");
    shakeRefusal(elements.endTurn);
    return;
  }
  state.turn += 1;
  state.energy = stepsPerDay();
  state.food += rules().dailyFood + (state.opened.has("garden") ? 1 : 0);
  state.wood += rules().dailyWood + (state.opened.has("workshop") ? 1 : 0);
  state.idea += state.opened.has("library") ? 1 : 0;
  unlockTree();
  setMessage("new-day");
  pulseResource("food");
  pulseResource("wood");
  if (state.opened.has("library")) pulseResource("idea");
  settleResearch();
  render();
  saveGame();
}

// The tree is a mechanic of its own, so it waits until walking and gathering
// are understood, and then introduces itself once.
function unlockTree() {
  const isFirst = COACH_ORDER.indexOf(state.coach) < COACH_ORDER.indexOf("learn");
  advanceCoach("learn");
  if (!isFirst || state.treeSeen) return;
  state.treeSeen = true;
  window.setTimeout(() => {
    if (!state.finished) openTree();
  }, motionDelay(700));
}

// Nothing is spent until the last gift is in place, so a chosen card cannot be
// regretted and the child never has to press a second button to finish it.
function settleResearch() {
  const id = state.researching;
  if (!id || !parentsOpen(id) || !affordable(id)) return false;
  openCard(id);
  return true;
}

function openCard(id) {
  RESOURCE_ORDER.forEach((resource) => {
    state[resource] -= need(id, resource);
  });
  state.opened.add(id);
  if (state.researching === id) state.researching = null;
  if (pointedCard === id) pointedCard = null;
  litLinks = [];
  advanceCoach("done");

  // A new discovery is felt at once: one more step today, and the fog lifting
  // around the explorer where it stands.
  if (id === "boots") state.energy += 1;
  if (id === "spyglass") revealAround(state.explorer);

  if (id === "festival") {
    state.finished = true;
    elements.victoryTurns.textContent = state.turn;
    elements.victoryTiles.textContent = state.revealed.size;
    showModal(elements.victory);
    playSound("victory");
    render();
    saveGame();
    return;
  }

  // The third friendly place is the moment the festival becomes possible, and
  // it is worth its own line.
  const placesReady = CARDS[id].place && CITY_PLACES.every((place) => state.opened.has(place));
  if (placesReady) setMessage("festival-ready");
  else setMessage(CARDS[id].place ? "built" : "learned");
  playSound("build");
  render();
  saveGame();
  askNextCard();
}

// The question "what now?" is answered by the tree itself, so the child never
// has to remember that the button exists.
function askNextCard() {
  if (state.finished || CARD_ORDER.every((id) => state.opened.has(id))) return;
  window.setTimeout(() => {
    if (!state.finished && !state.researching) openTree();
  }, motionDelay(900));
}

function lightRoute(id) {
  litLinks = routeTo(id);
  window.setTimeout(() => {
    litLinks = [];
    if (elements.treeModal.classList.contains("visible")) renderTree();
  }, motionDelay(2200));
}

// Every tap on a card is answered with something good: it opens, or it becomes
// the goal, or it hands the goal to the card that has to come first.
function pickCard(id) {
  if (state.finished) return;
  const status = cardState(id);
  pointedCard = null;

  if (status === "open") {
    setMessage("already-open");
    render();
    return;
  }

  if (status === "locked") {
    state.researching = firstMissingParent(id);
    setMessage("parent-first");
    playSound("pick");
    lightRoute(id);
    advanceCoach("done");
    if (!settleResearch()) {
      render();
      saveGame();
    }
    return;
  }

  if (status === "ready") {
    openCard(id);
    return;
  }

  state.researching = id;
  setMessage("goal-set");
  playSound("pick");
  advanceCoach("done");
  render();
  saveGame();
  closeTree();
}

function playSound(type, step = 0) {
  if (!soundEnabled) return;
  if (type === "progress") {
    window.GameSound?.tone({
      frequency: 587 + Math.min(step, 6) * 45,
      duration: 0.14,
      volume: 0.09,
    });
    return;
  }
  const notes = { victory: [523, 659, 784, 1047], pick: [523, 698], build: [440, 554, 659] };
  (notes[type] ?? notes.build).forEach((frequency, index) => {
    window.GameSound?.tone({ frequency, delay: index * 0.11, duration: 0.2, volume: 0.12 });
  });
}

function startGame(difficulty) {
  state.difficulty = difficulty;
  state.coach = "move";
  state.food = 2;
  state.wood = 2;
  state.idea = 0;
  state.turn = 1;
  state.explorer = CITY_INDEX;
  state.tiles = islandTiles();
  state.revealed = new Set();
  state.collected = new Set([CITY_INDEX]);
  state.opened = new Set();
  state.researching = null;
  state.treeSeen = false;
  state.finished = false;
  state.energy = stepsPerDay();
  pointedCard = null;
  litLinks = [];
  view.walk = null;
  view.refused = null;
  view.facing = 1;
  revealAround(CITY_INDEX);
  setMessage("start");
  hideModals();
  render();
  moveCamera(centerOf(CITY_INDEX), false);
  saveGame();
  // The dialog that had the focus is gone now, so the keyboard is handed the
  // explorer instead of falling back to the top of the page.
  focusExplorer();
}

// A dialog covers the whole screen, so the board behind it must stop being
// reachable by keyboard and the first control has to take the focus.
function showModal(modal) {
  [elements.startModal, elements.victory, elements.treeModal].forEach((item) => {
    item.classList.toggle("visible", item === modal);
  });
  elements.appShell.inert = true;
  modal.querySelector("[data-autofocus]").focus();
}

function hideModals() {
  [elements.startModal, elements.victory, elements.treeModal].forEach((item) => {
    item.classList.remove("visible");
  });
  elements.appShell.inert = false;
}

function openTree() {
  if (state.finished) return;
  state.treeSeen = true;
  renderTree();
  showModal(elements.treeModal);
  saveGame();
}

function closeTree() {
  if (!elements.treeModal.classList.contains("visible")) return;
  hideModals();
  render();
  elements.treeButton.focus();
}

// The saved game is kept until a new one starts, so a restart tapped by
// mistake is undone by "Keep playing".
function askDifficulty() {
  elements.startCancel.hidden = state.finished || state.tiles.length === 0;
  showModal(elements.startModal);
}

function hexAtEvent(event) {
  const rect = elements.canvas.getBoundingClientRect();
  return hexAt(event.clientX - rect.left, event.clientY - rect.top);
}

// A tap counts only when the finger goes down and up on the same hex, so a
// swipe across the map does not move the explorer. The reachable hexes are
// covered by overlay buttons and never reach the canvas.
let pressedIndex = null;
elements.canvas.addEventListener("pointerdown", (event) => {
  pressedIndex = hexAtEvent(event);
});
elements.canvas.addEventListener("pointerup", (event) => {
  const index = hexAtEvent(event);
  if (index !== null && index === pressedIndex) moveExplorer(index);
  pressedIndex = null;
});
elements.canvas.addEventListener("pointercancel", () => {
  pressedIndex = null;
});
// The whole map card zooms, including the overlay buttons that cover the
// reachable hexes. A wheel over the map never scrolls the page.
elements.map.addEventListener("wheel", (event) => {
  if (state.tiles.length === 0) return;
  event.preventDefault();
  const sensitivity = event.ctrlKey ? PINCH_SENSITIVITY : WHEEL_SENSITIVITY;
  setScale(view.scale * Math.exp(-wheelPixels(event) * sensitivity));
}, { passive: false });
elements.overlay.addEventListener("focusin", scheduleDraw);
elements.overlay.addEventListener("focusout", scheduleDraw);
new ResizeObserver(resizeCanvas).observe(elements.map);

elements.endTurn.addEventListener("click", endTurn);
elements.treeButton.addEventListener("click", openTree);
elements.treeBack.addEventListener("click", closeTree);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeTree();
});
document.querySelectorAll(".difficulty-card").forEach((button) => {
  button.addEventListener("click", () => startGame(button.dataset.difficulty));
});
document.querySelector("#restart-button").addEventListener("click", askDifficulty);
const restartTop = document.querySelector("#restart-button-top");
restartTop.addEventListener("click", askDifficulty);
elements.startCancel.addEventListener("click", () => {
  hideModals();
  restartTop.focus();
});

const soundButton = document.querySelector("#sound-button");
soundButton.textContent = soundEnabled ? "♪" : "×";
soundButton.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  try {
    localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off");
  } catch {
    // Private browsing modes can refuse writes. The choice stays for this session only.
  }
  soundButton.textContent = soundEnabled ? "♪" : "×";
  soundButton.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
  if (soundEnabled) playSound("build");
});

// The island changed shape when the path of discoveries arrived, so a game
// saved by the older version is dropped instead of being repaired.
try {
  localStorage.removeItem(LEGACY_STORAGE_KEY);
} catch {
  // Nothing to clear when storage is unavailable.
}

renderCoach();

if (loadGame()) {
  // A card that was already paid for when the tab closed finishes on the spot
  // instead of waiting for one more step.
  if (!settleResearch()) setMessage(state.energy > 0 ? "start" : "no-energy");
  if (!state.finished) hideModals();
  render();
} else {
  setMessage("start");
  showModal(elements.startModal);
}
