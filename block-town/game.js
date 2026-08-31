const STORAGE_KEY = "blockTownSheetsV1";
const SOUND_KEY = "blockTownSoundV1";

// A cell holds a small block id; 0 means the cell is still unpainted.
const EMPTY_CELL = 0;

// One row per block: the id stored in a grid, the family that shapes its
// behaviour and its art, and the sheet number that hands it to the player.
const BLOCKS = [
  { id: 1, key: "meadow", family: "nature", sheet: 1 },
  { id: 2, key: "path", family: "roads", sheet: 1 },
  { id: 3, key: "forest", family: "nature", sheet: 1 },
  { id: 4, key: "water", family: "water", sheet: 1 },
  { id: 5, key: "house", family: "buildings", sheet: 2 },
  { id: 6, key: "field", family: "nature", sheet: 2 },
  { id: 7, key: "flowers", family: "nature", sheet: 3 },
  { id: 8, key: "sand", family: "nature", sheet: 3 },
  { id: 9, key: "asphalt", family: "roads", sheet: 3 },
  { id: 10, key: "rails", family: "roads", sheet: 4 },
  { id: 11, key: "tower", family: "buildings", sheet: 4 },
  { id: 12, key: "farm", family: "buildings", sheet: 4 },
  { id: 13, key: "mountain", family: "nature", sheet: 5 },
  { id: 14, key: "windmill", family: "buildings", sheet: 5 },
  { id: 15, key: "lighthouse", family: "buildings", sheet: 5 },
  { id: 16, key: "castle", family: "buildings", sheet: 5 },
  { id: 17, key: "playground", family: "decor", sheet: 5 },
  { id: 18, key: "lantern", family: "decor", sheet: 5 },
  { id: 19, key: "bench", family: "decor", sheet: 5 },
  { id: 20, key: "fountain", family: "decor", sheet: 5 },
];

const BLOCK_BY_ID = new Map(BLOCKS.map((block) => [block.id, block]));
const BLOCK_BY_KEY = new Map(BLOCKS.map((block) => [block.key, block]));
const WATER_ID = BLOCK_BY_KEY.get("water").id;

// The ladder of sheets. Sizes and tools are data, so shrinking a sheet after a
// test with a child never touches the code around them.
const SHEETS = [
  { id: "sheet-1", rows: 5, columns: 10, tools: ["brush"] },
  { id: "sheet-2", rows: 8, columns: 16, tools: ["brush"] },
  { id: "sheet-3", rows: 12, columns: 24, tools: ["brush", "wide"] },
  { id: "sheet-4", rows: 18, columns: 36, tools: ["brush", "wide", "bucket"] },
  { id: "sheet-5", rows: 24, columns: 48, tools: ["brush", "wide", "bucket"] },
].map((sheet, index) => ({
  ...sheet,
  number: index + 1,
  cellCount: sheet.rows * sheet.columns,
  // Every block stays available once it has been introduced.
  blockIds: BLOCKS.filter((block) => block.sheet <= index + 1).map((block) => block.id),
}));

function blockById(blockId) {
  return BLOCK_BY_ID.get(blockId) || null;
}

function isRoadBlock(blockId) {
  return blockById(blockId)?.family === "roads";
}

function sheetById(sheetId) {
  return SHEETS.find((sheet) => sheet.id === sheetId) || null;
}

function sheetIndex(sheetId) {
  return SHEETS.findIndex((sheet) => sheet.id === sheetId);
}

function isBlockOnSheet(sheet, blockId) {
  return Boolean(sheet) && sheet.blockIds.includes(blockId);
}

function createSheetGrid(sheet) {
  return new Array(sheet.cellCount).fill(EMPTY_CELL);
}

function createGameState() {
  const state = {
    currentSheet: SHEETS[0].id,
    unlockedCount: 1,
    grids: {},
    underlays: {},
    celebrated: {},
  };
  SHEETS.forEach((sheet) => {
    state.grids[sheet.id] = createSheetGrid(sheet);
    state.underlays[sheet.id] = createSheetGrid(sheet);
    state.celebrated[sheet.id] = false;
  });
  return state;
}

function currentSheet(state) {
  return sheetById(state?.currentSheet);
}

// The four neighbours in a fixed north, east, south, west order, without
// wrapping around the edges of the sheet.
function neighborIndices(sheet, index) {
  const row = Math.floor(index / sheet.columns);
  const column = index % sheet.columns;
  const neighbors = [];
  if (row > 0) neighbors.push(index - sheet.columns);
  if (column < sheet.columns - 1) neighbors.push(index + 1);
  if (row < sheet.rows - 1) neighbors.push(index + sheet.columns);
  if (column > 0) neighbors.push(index - 1);
  return neighbors;
}

function isCellIndex(sheet, index) {
  return Boolean(sheet) && Number.isInteger(index) && index >= 0 && index < sheet.cellCount;
}

// Paints one cell of the current sheet. Painting over is always allowed, and
// nothing here ever throws: a refused paint simply reports no change.
function paintCell(state, index, blockId) {
  const sheet = currentSheet(state);
  if (!isCellIndex(sheet, index) || !isBlockOnSheet(sheet, blockId)) return false;

  const grid = state.grids[sheet.id];
  const underlay = state.underlays[sheet.id];
  if (!Array.isArray(grid) || !Array.isArray(underlay)) return false;

  // A road painted onto water becomes a bridge: the water waits underneath and
  // comes back as soon as water is painted over the bridge again.
  const overWater = grid[index] === WATER_ID || underlay[index] === WATER_ID;
  const nextUnderlay = isRoadBlock(blockId) && overWater ? WATER_ID : EMPTY_CELL;

  if (grid[index] === blockId && underlay[index] === nextUnderlay) return false;
  grid[index] = blockId;
  underlay[index] = nextUnderlay;
  return true;
}

function paintStroke(state, indices, blockId) {
  if (!Array.isArray(indices)) return 0;
  return indices.reduce((changed, index) => changed + (paintCell(state, index, blockId) ? 1 : 0), 0);
}

// Fills the connected region that shares the value of the tapped cell, so the
// bucket works on an empty area and on a finished lake alike.
function floodFill(state, index, blockId) {
  const sheet = currentSheet(state);
  if (!isCellIndex(sheet, index) || !isBlockOnSheet(sheet, blockId)) return 0;

  const grid = state.grids[sheet.id];
  if (!Array.isArray(grid)) return 0;

  const target = grid[index];
  if (target === blockId) return 0;

  const region = [];
  const seen = new Set([index]);
  const queue = [index];
  while (queue.length > 0) {
    const cell = queue.pop();
    region.push(cell);
    neighborIndices(sheet, cell).forEach((neighbor) => {
      if (seen.has(neighbor) || grid[neighbor] !== target) return;
      seen.add(neighbor);
      queue.push(neighbor);
    });
  }
  return paintStroke(state, region, blockId);
}

function paintedCount(state, sheetId = state?.currentSheet) {
  const grid = state?.grids?.[sheetId];
  if (!Array.isArray(grid)) return 0;
  return grid.reduce((count, value) => count + (value !== EMPTY_CELL ? 1 : 0), 0);
}

function isSheetComplete(state, sheetId = state?.currentSheet) {
  const sheet = sheetById(sheetId);
  if (!sheet) return false;
  return paintedCount(state, sheet.id) === sheet.cellCount;
}

// The next sheet appears only once the current one has no holes left.
function unlockNextSheet(state) {
  const index = sheetIndex(state?.currentSheet);
  if (index < 0 || !isSheetComplete(state, state.currentSheet)) return false;
  if (index + 1 >= SHEETS.length || state.unlockedCount > index + 1) return false;
  state.unlockedCount = index + 2;
  return true;
}

function selectSheet(state, sheetId) {
  const index = sheetIndex(sheetId);
  if (!state || index < 0 || index >= state.unlockedCount) return false;
  state.currentSheet = sheetId;
  return true;
}

// The only reset in the game. It clears one sheet and never touches the others.
function clearSheet(state, sheetId = state?.currentSheet) {
  const sheet = sheetById(sheetId);
  if (!state || !sheet) return false;
  state.grids[sheet.id] = createSheetGrid(sheet);
  state.underlays[sheet.id] = createSheetGrid(sheet);
  state.celebrated[sheet.id] = false;
  return true;
}

function normalizeGrid(sheet, saved) {
  const grid = createSheetGrid(sheet);
  if (!Array.isArray(saved)) return grid;
  const length = Math.min(saved.length, sheet.cellCount);
  for (let index = 0; index < length; index += 1) {
    // Unknown ids and blocks the sheet does not offer become empty cells.
    if (isBlockOnSheet(sheet, saved[index])) grid[index] = saved[index];
  }
  return grid;
}

function normalizeUnderlay(sheet, saved, grid) {
  const underlay = createSheetGrid(sheet);
  if (!Array.isArray(saved)) return underlay;
  const length = Math.min(saved.length, sheet.cellCount);
  for (let index = 0; index < length; index += 1) {
    // Only water hides under a block, and only under a road: that is a bridge.
    if (saved[index] === WATER_ID && isRoadBlock(grid[index])) underlay[index] = WATER_ID;
  }
  return underlay;
}

// Saved data may come from an older version, a different game or a broken
// write. Anything unexpected turns into an empty cell instead of an error.
function normalizeSavedState(value) {
  const state = createGameState();
  if (!value || typeof value !== "object") return state;

  const unlockedCount = Number.isInteger(value.unlockedCount) ? value.unlockedCount : 1;
  state.unlockedCount = Math.max(1, Math.min(SHEETS.length, unlockedCount));

  SHEETS.forEach((sheet) => {
    state.grids[sheet.id] = normalizeGrid(sheet, value.grids?.[sheet.id]);
    state.underlays[sheet.id] = normalizeUnderlay(
      sheet,
      value.underlays?.[sheet.id],
      state.grids[sheet.id],
    );
    state.celebrated[sheet.id] = value.celebrated?.[sheet.id] === true;
  });

  const index = sheetIndex(value.currentSheet);
  const unlocked = index >= 0 && index < state.unlockedCount;
  state.currentSheet = unlocked ? value.currentSheet : SHEETS[0].id;
  return state;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    STORAGE_KEY,
    SOUND_KEY,
    EMPTY_CELL,
    WATER_ID,
    BLOCKS,
    SHEETS,
    blockById,
    isRoadBlock,
    sheetById,
    sheetIndex,
    isBlockOnSheet,
    neighborIndices,
    createGameState,
    paintCell,
    paintStroke,
    floodFill,
    paintedCount,
    isSheetComplete,
    unlockNextSheet,
    selectSheet,
    clearSheet,
    normalizeSavedState,
  };
}

function initializeGame() {
  const elements = {
    grid: document.querySelector("#sheet-grid"),
    sunFill: document.querySelector("#progress-sun-fill"),
    status: document.querySelector("#status"),
    sound: document.querySelector("#sound-button"),
    pause: document.querySelector("#pause-button"),
    pauseOverlay: document.querySelector("#pause-overlay"),
    resume: document.querySelector("#resume-button"),
    clear: document.querySelector("#clear-button"),
    confirmClear: document.querySelector("#confirm-clear-button"),
    cancelClear: document.querySelector("#cancel-clear-button"),
  };

  let soundEnabled = loadSoundPreference();
  let paused = false;

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
      // Sound stays available for the current session only.
    }
  }

  function renderSound() {
    elements.sound.classList.toggle("is-off", !soundEnabled);
    elements.sound.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
  }

  function showPauseState(state) {
    elements.pauseOverlay.querySelectorAll("[data-state]").forEach((section) => {
      section.hidden = section.dataset.state !== state;
    });
  }

  function openPause() {
    paused = true;
    elements.pauseOverlay.hidden = false;
    showPauseState("menu");
    elements.resume.focus();
  }

  function closePause() {
    paused = false;
    elements.pauseOverlay.hidden = true;
    elements.pause.focus();
  }

  elements.sound.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    saveSoundPreference();
    renderSound();
  });

  elements.pause.addEventListener("click", () => {
    if (paused) closePause();
    else openPause();
  });

  elements.resume.addEventListener("click", closePause);

  elements.clear.addEventListener("click", () => {
    showPauseState("confirm");
    elements.cancelClear.focus();
  });

  elements.cancelClear.addEventListener("click", () => {
    showPauseState("menu");
    elements.clear.focus();
  });

  // Clearing needs a painting to clear; the sheet arrives in the next stage.
  elements.confirmClear.addEventListener("click", closePause);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (paused) closePause();
    else openPause();
  });

  renderSound();
}

if (typeof document !== "undefined") {
  initializeGame();
}
