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
  plain: { icon: "🍀", food: 1, wood: 0, idea: 0 },
  forest: { icon: "🌲", food: 0, wood: 2, idea: 0 },
  orchard: { icon: "🍎", food: 2, wood: 0, idea: 0 },
  hill: { icon: "⛰️", food: 0, wood: 1, idea: 1 },
  lake: { icon: "💧", food: 1, wood: 0, idea: 0 },
  ruins: { icon: "🧩", food: 0, wood: 0, idea: 2 },
  village: { icon: "🏡", food: 1, wood: 1, idea: 1 },
  water: { icon: "🌊", food: 1, wood: 0, idea: 0 },
  city: { icon: "🏰", food: 0, wood: 0, idea: 0 },
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

function isAdjacent(first, second) {
  const a = positionOf(first);
  const b = positionOf(second);
  return Math.abs(a.row - b.row) + Math.abs(a.column - b.column) === 1;
}

function adjacentIndexes(index) {
  const { row, column } = positionOf(index);
  const candidates = [
    [row - 1, column],
    [row + 1, column],
    [row, column - 1],
    [row, column + 1],
  ];
  return candidates
    .filter(([nextRow, nextColumn]) => (
      nextRow >= 0
      && nextRow < MAP_HEIGHT
      && nextColumn >= 0
      && nextColumn < MAP_WIDTH
    ))
    .map(([nextRow, nextColumn]) => nextRow * MAP_WIDTH + nextColumn);
}

function revealAround(index) {
  const radius = state.opened.has("spyglass") ? 2 : 1;
  const { row, column } = positionOf(index);
  for (let nextRow = row - radius; nextRow <= row + radius; nextRow += 1) {
    for (let nextColumn = column - radius; nextColumn <= column + radius; nextColumn += 1) {
      const distance = Math.abs(nextRow - row) + Math.abs(nextColumn - column);
      if (distance > radius) continue;
      if (nextRow < 0 || nextRow >= MAP_HEIGHT || nextColumn < 0 || nextColumn >= MAP_WIDTH) continue;
      state.revealed.add(nextRow * MAP_WIDTH + nextColumn);
    }
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

// A tile out of reach answers with the world: it pushes back and the reachable
// neighbours flash, so the message is not the only explanation.
function refuseTile(index) {
  const tile = elements.map.querySelector(`[data-index="${index}"]`);
  if (tile) {
    tile.classList.remove("refused");
    requestAnimationFrame(() => tile.classList.add("refused"));
  }
  elements.map.classList.remove("show-reach");
  requestAnimationFrame(() => elements.map.classList.add("show-reach"));
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
    elements.map.classList.remove("show-reach");
    requestAnimationFrame(() => elements.map.classList.add("show-reach"));
    return;
  }
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
  saveGame();

  if (state.energy === 0) {
    window.setTimeout(() => {
      if (!state.finished && state.energy === 0) setMessage("no-energy");
    }, 1800);
  }
}

function renderMap() {
  const hadFocus = document.activeElement?.classList.contains("map-tile");
  elements.map.replaceChildren();

  state.tiles.forEach((type, index) => {
    const tile = document.createElement("button");
    const isRevealed = state.revealed.has(index);
    const isExplorer = state.explorer === index;
    const isCollected = state.collected.has(index);
    const isDeep = type === "water" && !state.opened.has("boat");
    const isReachable = isRevealed
      && !isExplorer
      && !isDeep
      && state.energy > 0
      && isAdjacent(state.explorer, index);
    tile.type = "button";
    tile.className = "map-tile";
    tile.dataset.index = index;

    const terrain = readText(`tile-${isRevealed ? type : "hidden"}`);
    let stateKey = null;
    if (isExplorer) stateKey = "tile-state-explorer";
    else if (isCollected && isReachable) stateKey = "tile-state-collected-reachable";
    else if (isCollected) stateKey = "tile-state-collected";
    else if (isReachable) stateKey = "tile-state-reachable";
    const label = stateKey ? readText(stateKey).replace("{terrain}", terrain) : terrain;
    tile.setAttribute("aria-label", label);

    if (!isRevealed) {
      tile.classList.add("hidden");
      tile.disabled = true;
    } else {
      tile.classList.add(type);
      tile.textContent = TILE_DATA[type].icon;
      tile.addEventListener("click", () => moveExplorer(index));
    }

    // Deep water is not a broken tile: once the boat exists on the path of
    // discoveries, every water cell carries its sign.
    if (isDeep && isRevealed) {
      tile.classList.add("deep");
      if (state.treeSeen) tile.classList.add("wants-boat");
    }
    if (isCollected) tile.classList.add("collected");
    if (isExplorer) tile.classList.add("explorer");
    if (isReachable) tile.classList.add("reachable");

    elements.map.append(tile);
  });

  if (hadFocus) elements.map.querySelector(`[data-index="${state.explorer}"]`)?.focus();
}

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
  elements.map.classList.toggle("is-teaching", state.coach === "move");

  if (state.opened.has("festival")) return;
  elements.goalText.textContent = goalText(learning);
}

function render() {
  elements.map.classList.remove("show-reach");
  elements.food.textContent = state.food;
  elements.wood.textContent = state.wood;
  elements.idea.textContent = state.idea;
  elements.treeFood.textContent = state.food;
  elements.treeWood.textContent = state.wood;
  elements.treeIdea.textContent = state.idea;
  elements.turn.textContent = state.turn;
  renderEnergy();
  renderMap();
  renderResearchSlot();
  renderScene();
  renderGoalProgress();
  renderCoach();
  if (elements.treeModal.classList.contains("visible")) renderTree();
  elements.endTurn.classList.toggle("is-waiting", state.energy === 0 && !state.finished);
  elements.treeButton.classList.toggle("is-calling", pointedCard !== null);
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
  revealAround(CITY_INDEX);
  setMessage("start");
  hideModals();
  render();
  saveGame();
  // The dialog that had the focus is gone now, so the keyboard is handed the
  // explorer instead of falling back to the top of the page.
  elements.map.querySelector(`[data-index="${state.explorer}"]`)?.focus();
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
