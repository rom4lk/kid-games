const MAP_WIDTH = 6;
const MAP_HEIGHT = 4;
const CITY_INDEX = 14;
const STORAGE_KEY = "islandDiscoveryV1";

// Difficulty is one visible thing: how far the explorer walks each day.
const DIFFICULTIES = {
  easy: { energy: 3, dailyFood: 2, dailyWood: 2 },
  normal: { energy: 2, dailyFood: 1, dailyWood: 1 },
  hard: { energy: 1, dailyFood: 1, dailyWood: 1 },
};

// One mechanic at a time: walk, then gather, then build.
const COACH_ORDER = ["move", "collect", "build", "done"];

// A pause carries no meaning when motion is reduced, so it is dropped there.
const REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)");

const STANDARD_BUILDINGS = ["garden", "workshop", "library"];
const BUILDINGS = [...STANDARD_BUILDINGS, "festival"];

const TILE_DATA = {
  plain: { icon: "🍀", food: 1, wood: 0, idea: 0 },
  forest: { icon: "🌲", food: 0, wood: 2, idea: 0 },
  orchard: { icon: "🍎", food: 2, wood: 0, idea: 0 },
  hill: { icon: "⛰️", food: 0, wood: 1, idea: 1 },
  lake: { icon: "💧", food: 1, wood: 0, idea: 0 },
  ruins: { icon: "🧩", food: 0, wood: 0, idea: 2 },
  village: { icon: "🏡", food: 1, wood: 1, idea: 1 },
  city: { icon: "🏰", food: 0, wood: 0, idea: 0 },
};

const TILE_POOL = [
  "forest", "orchard", "plain", "hill", "lake", "forest",
  "village", "orchard", "ruins", "forest", "lake", "plain",
  "orchard", "forest", "village", "plain", "lake", "ruins",
  "plain", "orchard", "hill", "forest", "hill",
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
  buildings: new Set(),
  finished: false,
};

function rules() {
  return DIFFICULTIES[state.difficulty] ?? DIFFICULTIES.normal;
}

const elements = {
  map: document.querySelector("#game-map"),
  food: document.querySelector("#food-count"),
  wood: document.querySelector("#wood-count"),
  idea: document.querySelector("#idea-count"),
  turn: document.querySelector("#turn-count"),
  energy: document.querySelector("#energy-pips"),
  status: document.querySelector("#status-message"),
  goalText: document.querySelector("#goal-text"),
  goalProgress: document.querySelector("#goal-progress"),
  endTurn: document.querySelector("#end-turn-button"),
  startModal: document.querySelector("#start-modal"),
  startCancel: document.querySelector("#start-cancel"),
  appShell: document.querySelector(".app-shell"),
  buildingList: document.querySelector(".building-list"),
  victory: document.querySelector("#victory-modal"),
  victoryTurns: document.querySelector("#victory-turns"),
  victoryTiles: document.querySelector("#victory-tiles"),
  buildingButtons: [...document.querySelectorAll(".building-card")],
  resources: {
    food: document.querySelector(".food-resource"),
    wood: document.querySelector(".wood-resource"),
    idea: document.querySelector(".idea-resource"),
  },
};

let soundEnabled = true;

function readText(id) {
  return document.querySelector(`#${id}`).textContent.trim();
}

function shuffledTiles() {
  const pool = [...TILE_POOL];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }
  pool.splice(CITY_INDEX, 0, "city");
  return pool;
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
  state.revealed.add(index);
  adjacentIndexes(index).forEach((nextIndex) => state.revealed.add(nextIndex));
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

function renderCoach() {
  const building = COACH_ORDER.indexOf(state.coach) >= COACH_ORDER.indexOf("build");
  elements.buildingList.classList.toggle("is-locked", !building);
  elements.map.classList.toggle("is-teaching", state.coach === "move");

  if (state.buildings.has("festival")) return;
  if (standardBuildingCount() === 3) {
    elements.goalText.textContent = readText("goal-festival");
    return;
  }
  elements.goalText.textContent = readText(`coach-${building ? "build" : state.coach}`);
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
      buildings: [...state.buildings],
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
    buildings: new Set(Array.isArray(saved.buildings)
      ? saved.buildings.filter((building) => BUILDINGS.includes(building))
      : []),
    finished: false,
  });
  if (!DIFFICULTIES[state.difficulty]) state.difficulty = "normal";
  if (!COACH_ORDER.includes(state.coach)) state.coach = "done";
  state.food = whole(state.food, 0);
  state.wood = whole(state.wood, 0);
  state.idea = whole(state.idea, 0);
  state.turn = Math.max(whole(state.turn, 1), 1);
  state.energy = Math.min(whole(state.energy, 0), rules().energy);
  if (!Number.isInteger(state.explorer) || state.explorer < 0 || state.explorer >= state.tiles.length) {
    state.explorer = CITY_INDEX;
  }
  return true;
}

function collectTile(index) {
  const type = state.tiles[index];
  if (state.collected.has(index)) {
    setMessage(type === "city" ? "city" : "empty");
    return false;
  }

  const reward = TILE_DATA[type];
  state.food += reward.food;
  state.wood += reward.wood;
  state.idea += reward.idea;
  state.collected.add(index);

  if (reward.food > 0) pulseResource("food");
  if (reward.wood > 0) pulseResource("wood");
  if (reward.idea > 0) pulseResource("idea");
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

function moveExplorer(index) {
  if (state.finished) return;
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

  state.explorer = index;
  state.energy -= 1;
  revealAround(index);
  const gained = collectTile(index);
  advanceCoach(gained ? "collect" : "move");
  if (state.collected.size >= 3) advanceCoach("build");
  render();
  saveGame();

  if (state.energy === 0) {
    window.setTimeout(() => {
      if (!state.finished && state.energy === 0) setMessage("no-energy");
    }, REDUCED_MOTION.matches ? 0 : 700);
  }
}

function renderMap() {
  const hadFocus = document.activeElement?.classList.contains("map-tile");
  elements.map.replaceChildren();

  state.tiles.forEach((type, index) => {
    const tile = document.createElement("button");
    const isRevealed = state.revealed.has(index);
    tile.type = "button";
    tile.className = "map-tile";
    tile.dataset.index = index;
    tile.setAttribute("aria-label", readText(`tile-${isRevealed ? type : "hidden"}`));

    if (!isRevealed) {
      tile.classList.add("hidden");
      tile.disabled = true;
    } else {
      tile.classList.add(type);
      tile.textContent = TILE_DATA[type].icon;
      tile.addEventListener("click", () => moveExplorer(index));
    }

    if (state.collected.has(index)) tile.classList.add("collected");
    if (state.explorer === index) tile.classList.add("explorer");
    if (
      isRevealed
      && state.energy > 0
      && isAdjacent(state.explorer, index)
    ) {
      tile.classList.add("reachable");
    }

    elements.map.append(tile);
  });

  if (hadFocus) elements.map.querySelector(`[data-index="${state.explorer}"]`)?.focus();
}

function renderEnergy() {
  elements.energy.replaceChildren();
  for (let index = 0; index < rules().energy; index += 1) {
    const pip = document.createElement("span");
    pip.className = `energy-pip${index >= state.energy ? " used" : ""}`;
    elements.energy.append(pip);
  }
}

function canAfford(button) {
  return (
    state.food >= Number(button.dataset.food)
    && state.wood >= Number(button.dataset.wood)
    && state.idea >= Number(button.dataset.idea)
  );
}

function standardBuildingCount() {
  return STANDARD_BUILDINGS.filter((building) => state.buildings.has(building)).length;
}

function renderBuildings() {
  const completed = standardBuildingCount();

  elements.buildingButtons.forEach((button) => {
    const building = button.dataset.building;
    const built = state.buildings.has(building);

    button.classList.toggle("built", built);
    button.disabled = built;
    // The festival is a mechanic that only matters once, at the end.
    if (building === "festival") {
      button.hidden = completed !== 3;
      button.classList.toggle("ready", !built);
    }
  });

  elements.goalProgress.textContent = completed === 3 ? "🎪" : `${completed} / 3`;
}

function render() {
  elements.map.classList.remove("show-reach");
  elements.food.textContent = state.food;
  elements.wood.textContent = state.wood;
  elements.idea.textContent = state.idea;
  elements.turn.textContent = state.turn;
  renderEnergy();
  renderMap();
  renderBuildings();
  renderCoach();
  elements.endTurn.classList.toggle("is-waiting", state.energy === 0 && !state.finished);
}

function endTurn() {
  if (state.finished) return;
  if (state.energy > 0) {
    setMessage("steps-left");
    return;
  }
  state.turn += 1;
  state.energy = rules().energy;
  state.food += rules().dailyFood + (state.buildings.has("garden") ? 1 : 0);
  state.wood += rules().dailyWood + (state.buildings.has("workshop") ? 1 : 0);
  state.idea += state.buildings.has("library") ? 1 : 0;
  advanceCoach("build");
  setMessage("new-day");
  pulseResource("food");
  pulseResource("wood");
  if (state.buildings.has("library")) pulseResource("idea");
  render();
  saveGame();
}

function build(button) {
  if (state.finished) return;
  const building = button.dataset.building;
  const isFestival = building === "festival";

  if (!canAfford(button)) {
    setMessage("cannot-build");
    return;
  }

  state.food -= Number(button.dataset.food);
  state.wood -= Number(button.dataset.wood);
  state.idea -= Number(button.dataset.idea);
  state.buildings.add(building);

  if (isFestival) {
    state.finished = true;
    elements.victoryTurns.textContent = state.turn;
    elements.victoryTiles.textContent = state.revealed.size;
    showModal(elements.victory);
    playSound("victory");
  } else {
    setMessage(standardBuildingCount() === 3 ? "festival-ready" : "built");
    playSound("build");
  }
  advanceCoach("done");
  render();
  saveGame();
}

function playSound(type) {
  if (!soundEnabled) return;
  const notes = type === "victory" ? [523, 659, 784, 1047] : [440, 554, 659];
  notes.forEach((frequency, index) => {
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
  state.energy = rules().energy;
  state.explorer = CITY_INDEX;
  state.tiles = shuffledTiles();
  state.revealed = new Set();
  state.collected = new Set([CITY_INDEX]);
  state.buildings = new Set();
  state.finished = false;
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
  elements.startModal.classList.toggle("visible", modal === elements.startModal);
  elements.victory.classList.toggle("visible", modal === elements.victory);
  elements.appShell.inert = true;
  modal.querySelector("[data-autofocus]").focus();
}

function hideModals() {
  elements.startModal.classList.remove("visible");
  elements.victory.classList.remove("visible");
  elements.appShell.inert = false;
}

// The saved game is kept until a new one starts, so a restart tapped by
// mistake is undone by "Keep playing".
function askDifficulty() {
  elements.startCancel.hidden = state.finished || state.tiles.length === 0;
  showModal(elements.startModal);
}

elements.endTurn.addEventListener("click", endTurn);
elements.buildingButtons.forEach((button) => {
  button.addEventListener("click", () => build(button));
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
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.textContent = soundEnabled ? "♪" : "×";
  soundButton.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
  if (soundEnabled) playSound("build");
});

setMessage("start");
renderCoach();

if (loadGame()) {
  hideModals();
  render();
} else {
  showModal(elements.startModal);
}
