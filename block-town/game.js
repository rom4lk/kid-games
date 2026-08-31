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

// The four sides of a cell, as bits of one small mask.
const MASK_NORTH = 1;
const MASK_EAST = 2;
const MASK_SOUTH = 4;
const MASK_WEST = 8;
const MASK_ALL = MASK_NORTH | MASK_EAST | MASK_SOUTH | MASK_WEST;

// How a road with these connected sides draws itself.
const ROAD_SHAPES = {
  0: "lone",
  [MASK_NORTH]: "end",
  [MASK_EAST]: "end",
  [MASK_SOUTH]: "end",
  [MASK_WEST]: "end",
  [MASK_NORTH | MASK_SOUTH]: "straight",
  [MASK_EAST | MASK_WEST]: "straight",
  [MASK_NORTH | MASK_EAST]: "turn",
  [MASK_EAST | MASK_SOUTH]: "turn",
  [MASK_SOUTH | MASK_WEST]: "turn",
  [MASK_WEST | MASK_NORTH]: "turn",
  [MASK_ALL ^ MASK_NORTH]: "tee",
  [MASK_ALL ^ MASK_EAST]: "tee",
  [MASK_ALL ^ MASK_SOUTH]: "tee",
  [MASK_ALL ^ MASK_WEST]: "tee",
  [MASK_ALL]: "cross",
};

function blockById(blockId) {
  return BLOCK_BY_ID.get(blockId) || null;
}

function isRoadBlock(blockId) {
  return blockById(blockId)?.family === "roads";
}

// Rails carry a train and roads carry a car, so the two never join up. Every
// other road kind is one network.
function roadGroup(blockId) {
  const block = blockById(blockId);
  if (block?.family !== "roads") return null;
  return block.key === "rails" ? "rails" : "road";
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

// Every cell on the straight line between two cells, both ends included. A fast
// stroke reports far apart points, and this keeps the painted line unbroken.
function lineIndices(sheet, fromIndex, toIndex) {
  if (!isCellIndex(sheet, fromIndex) || !isCellIndex(sheet, toIndex)) return [];

  let row = Math.floor(fromIndex / sheet.columns);
  let column = fromIndex % sheet.columns;
  const lastRow = Math.floor(toIndex / sheet.columns);
  const lastColumn = toIndex % sheet.columns;
  const deltaRow = Math.abs(lastRow - row);
  const deltaColumn = Math.abs(lastColumn - column);
  const stepRow = Math.sign(lastRow - row);
  const stepColumn = Math.sign(lastColumn - column);
  let error = deltaColumn - deltaRow;

  const path = [fromIndex];
  while (row !== lastRow || column !== lastColumn) {
    const doubled = error * 2;
    if (doubled > -deltaRow) {
      error -= deltaRow;
      column += stepColumn;
    }
    if (doubled < deltaColumn) {
      error += deltaColumn;
      row += stepRow;
    }
    path.push(row * sheet.columns + column);
  }
  return path;
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

// Which of the four neighbours answer the question, as one 4-bit mask. Cells
// outside the sheet never count.
function neighborMask(grid, columns, index, predicate) {
  if (!Array.isArray(grid) || !Number.isInteger(columns) || columns <= 0) return 0;
  if (!Number.isInteger(index) || index < 0 || index >= grid.length) return 0;

  const rows = Math.floor(grid.length / columns);
  const row = Math.floor(index / columns);
  const column = index % columns;
  let mask = 0;
  if (row > 0 && predicate(grid[index - columns])) mask |= MASK_NORTH;
  if (column < columns - 1 && predicate(grid[index + 1])) mask |= MASK_EAST;
  if (row < rows - 1 && predicate(grid[index + columns])) mask |= MASK_SOUTH;
  if (column > 0 && predicate(grid[index - 1])) mask |= MASK_WEST;
  return mask;
}

// A road draws itself from the sides it connects to, and remembers whether it
// stands on water, which makes it a bridge.
function roadTile(grid, underlay, columns, index) {
  const group = roadGroup(grid?.[index]);
  if (!group) return null;
  const mask = neighborMask(grid, columns, index, (value) => roadGroup(value) === group);
  return {
    mask,
    shape: ROAD_SHAPES[mask],
    bridge: underlay?.[index] === WATER_ID,
  };
}

function isWaterCell(grid, underlay, index) {
  return grid?.[index] === WATER_ID || underlay?.[index] === WATER_ID;
}

// The sides of a water cell that meet something else: those get a shore. Water
// under a bridge still counts as water, so a lake keeps its shape.
function waterEdges(grid, underlay, columns, index) {
  if (!isWaterCell(grid, underlay, index)) return 0;
  const columnsAreValid = Number.isInteger(columns) && columns > 0;
  if (!columnsAreValid) return 0;

  const rows = Math.floor(grid.length / columns);
  const row = Math.floor(index / columns);
  const column = index % columns;
  let edges = 0;
  if (row === 0 || !isWaterCell(grid, underlay, index - columns)) edges |= MASK_NORTH;
  if (column === columns - 1 || !isWaterCell(grid, underlay, index + 1)) edges |= MASK_EAST;
  if (row === rows - 1 || !isWaterCell(grid, underlay, index + columns)) edges |= MASK_SOUTH;
  if (column === 0 || !isWaterCell(grid, underlay, index - 1)) edges |= MASK_WEST;
  return edges;
}

// A lone forest cell is one small tree; inside a cluster the trees grow.
function forestDensity(grid, columns, index) {
  const forestId = BLOCK_BY_KEY.get("forest").id;
  if (grid?.[index] !== forestId) return 0;
  const mask = neighborMask(grid, columns, index, (value) => value === forestId);
  const neighbors = [MASK_NORTH, MASK_EAST, MASK_SOUTH, MASK_WEST]
    .filter((side) => (mask & side) !== 0).length;
  if (neighbors === 0) return 0;
  return neighbors < 3 ? 1 : 2;
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
    lineIndices,
    MASK_NORTH,
    MASK_EAST,
    MASK_SOUTH,
    MASK_WEST,
    roadGroup,
    neighborMask,
    roadTile,
    waterEdges,
    forestDensity,
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

// The sheet is fitted to the card, never scaled below a comfortable finger size.
const MIN_CELL_SIZE = 22;
const MAX_CELL_SIZE = 92;
const SAVE_DELAY_MS = 250;

// A stroke should sound like a tune, not a rattle, so only every few painted
// cells gets a note.
const STROKE_SOUND_EVERY = 3;

// Each family has its own short note: a tap for a road, a plop for water, a
// rustle for the meadow and the wood, a knock for a house, a ding for decor.
const FAMILY_SOUNDS = {
  roads: [[300, 0, 0.06, "square"]],
  nature: [[430, 0, 0.08, "triangle"], [540, 0.05, 0.07, "triangle"]],
  water: [[250, 0, 0.14, "sine", 150]],
  buildings: [[200, 0, 0.06, "square"], [155, 0.06, 0.09, "square"]],
  decor: [[660, 0, 0.09, "sine"], [880, 0.07, 0.11, "sine"]],
};

function initializeGame() {
  const elements = {
    card: document.querySelector(".sheet-card"),
    stage: document.querySelector("#sheet-stage"),
    grid: document.querySelector("#sheet-grid"),
    palette: document.querySelector("#palette"),
    progressPanel: document.querySelector("#progress-panel"),
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

  const BLOCK_NAMES = {
    meadow: "Meadow",
    path: "Road",
    forest: "Forest",
    water: "Water",
    house: "House",
    field: "Field",
    flowers: "Flowers",
    sand: "Sand",
    asphalt: "Asphalt road",
    rails: "Rails",
    tower: "Tower",
    farm: "Farm",
    mountain: "Mountain",
    windmill: "Windmill",
    lighthouse: "Lighthouse",
    castle: "Castle",
    playground: "Playground",
    lantern: "Lantern",
    bench: "Bench",
    fountain: "Fountain",
  };

  let state = loadGame();
  let selectedBlockId = currentSheet(state).blockIds[0];
  let cells = [];
  let saveTimer = 0;
  let soundEnabled = loadSoundPreference();
  let paused = false;
  let strokeActive = false;
  let strokeLastIndex = -1;
  let cellsSinceSound = STROKE_SOUND_EVERY;

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
      // The painting stays on screen even when storage refuses to keep it.
    }
  }

  // Strokes paint many cells in a row, so the write waits for the stroke to end.
  function scheduleSave() {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(saveGame, SAVE_DELAY_MS);
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
      // Sound stays available for the current session only.
    }
  }

  function playSound(family) {
    if (!soundEnabled) return;
    (FAMILY_SOUNDS[family] || []).forEach(([frequency, delay, duration, wave, bendTo]) => {
      window.GameSound?.tone({ frequency, delay, duration, wave, bendTo, volume: 0.05 });
    });
  }

  function announce(message) {
    elements.status.textContent = "";
    window.requestAnimationFrame(() => {
      elements.status.textContent = message;
    });
  }

  function blockName(blockId) {
    const block = blockById(blockId);
    return block ? BLOCK_NAMES[block.key] : "Empty cell";
  }

  const SIDE_CLASSES = [
    [MASK_NORTH, "n"],
    [MASK_EAST, "e"],
    [MASK_SOUTH, "s"],
    [MASK_WEST, "w"],
  ];

  function sideClasses(prefix, mask) {
    return SIDE_CLASSES.filter(([side]) => (mask & side) !== 0).map(([, name]) => `${prefix}--${name}`);
  }

  // The look of a cell is nothing but class names; styles.css draws every
  // variant. The model decides which variant this cell is.
  function cellClasses(sheet, grid, underlay, index) {
    const block = blockById(grid[index]);
    if (!block) return ["cell", "is-empty"];

    const classes = ["cell", `block--${block.key}`];
    if (block.family === "roads") {
      const tile = roadTile(grid, underlay, sheet.columns, index);
      classes.push("cell--road", `road--${tile.shape}`, ...sideClasses("road", tile.mask));
      if (tile.bridge) {
        classes.push("road--bridge");
        // The deck follows the direction the road runs in.
        const alongRows = (tile.mask & (MASK_NORTH | MASK_SOUTH)) !== 0;
        if (alongRows) classes.push("road--bridge-vertical");
      }
      return classes;
    }
    if (block.key === "water") {
      return classes.concat(sideClasses("shore", waterEdges(grid, underlay, sheet.columns, index)));
    }
    if (block.key === "forest") {
      classes.push(`forest--${forestDensity(grid, sheet.columns, index)}`);
    }
    return classes;
  }

  function renderCell(index) {
    const element = cells[index];
    if (!element) return;
    const sheet = currentSheet(state);
    const grid = state.grids[sheet.id];
    const underlay = state.underlays[sheet.id];
    element.className = cellClasses(sheet, grid, underlay, index).join(" ");
    element.setAttribute("aria-label", blockName(grid[index]));
  }

  // A painted cell can change the look of its four neighbours and nothing else.
  function renderCellAndNeighbors(index) {
    const sheet = currentSheet(state);
    renderCell(index);
    neighborIndices(sheet, index).forEach(renderCell);
  }

  function renderAllCells() {
    for (let index = 0; index < cells.length; index += 1) renderCell(index);
  }

  function renderProgress() {
    const sheet = currentSheet(state);
    const painted = paintedCount(state);
    const share = Math.round((painted / sheet.cellCount) * 100);
    elements.sunFill.style.height = `${share}%`;
    elements.progressPanel.setAttribute(
      "aria-label",
      `Painted ${painted} cells of ${sheet.cellCount}`,
    );
  }

  // The sheet is rebuilt only when the sheet itself changes; a paint touches
  // one cell element, never the whole grid.
  function buildSheet() {
    const sheet = currentSheet(state);
    elements.stage.style.setProperty("--rows", String(sheet.rows));
    elements.stage.style.setProperty("--columns", String(sheet.columns));
    elements.grid.textContent = "";
    cells = new Array(sheet.cellCount);

    for (let row = 0; row < sheet.rows; row += 1) {
      const rowElement = document.createElement("div");
      rowElement.className = "sheet-row";
      rowElement.setAttribute("role", "row");
      for (let column = 0; column < sheet.columns; column += 1) {
        const index = row * sheet.columns + column;
        const cell = document.createElement("div");
        cell.className = "cell is-empty";
        cell.setAttribute("role", "gridcell");
        cell.dataset.index = String(index);
        cells[index] = cell;
        rowElement.append(cell);
      }
      elements.grid.append(rowElement);
    }

    renderAllCells();
    fitSheet();
  }

  function fitSheet() {
    const sheet = currentSheet(state);
    const style = window.getComputedStyle(elements.card);
    const box = elements.card.getBoundingClientRect();
    const width = box.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = box.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const size = Math.floor(Math.min(width / sheet.columns, height / sheet.rows));
    const fitted = Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, size));
    elements.stage.style.setProperty("--cell-size", `${fitted}px`);
  }

  function renderPalette() {
    const sheet = currentSheet(state);
    elements.palette.textContent = "";
    sheet.blockIds.forEach((blockId) => {
      const block = blockById(blockId);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "palette-button";
      button.dataset.block = String(blockId);
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", blockId === selectedBlockId ? "true" : "false");
      button.setAttribute("aria-label", BLOCK_NAMES[block.key]);
      // A one-cell sheet gives the swatch the same art the grid would draw.
      const art = cellClasses({ columns: 1 }, [blockId], [EMPTY_CELL], 0).join(" ");
      button.innerHTML = `<span class="palette-swatch ${art}" aria-hidden="true"></span>`;
      elements.palette.append(button);
    });
  }

  function selectBlock(blockId) {
    if (!isBlockOnSheet(currentSheet(state), blockId)) return;
    selectedBlockId = blockId;
    elements.palette.querySelectorAll(".palette-button").forEach((button) => {
      const active = Number(button.dataset.block) === blockId;
      button.setAttribute("aria-checked", active ? "true" : "false");
    });
  }

  // Paints from the last cell of the stroke up to this one, so no cell between
  // two pointer reports is skipped.
  function paintTo(index) {
    const sheet = currentSheet(state);
    const path = strokeLastIndex < 0
      ? [index]
      : lineIndices(sheet, strokeLastIndex, index).slice(1);
    strokeLastIndex = index;

    let changed = 0;
    path.forEach((cell) => {
      if (!paintCell(state, cell, selectedBlockId)) return;
      renderCellAndNeighbors(cell);
      changed += 1;
    });
    if (changed === 0) return;

    renderProgress();
    scheduleSave();

    cellsSinceSound += changed;
    if (cellsSinceSound < STROKE_SOUND_EVERY) return;
    cellsSinceSound = 0;
    playSound(blockById(selectedBlockId)?.family);
  }

  // The cell under a point is found by arithmetic on the grid rectangle: during
  // a stroke the pointer is captured and no longer reports a cell element.
  function cellIndexFromPoint(clientX, clientY) {
    const sheet = currentSheet(state);
    const box = elements.grid.getBoundingClientRect();
    const width = elements.grid.clientWidth;
    const height = elements.grid.clientHeight;
    if (width <= 0 || height <= 0) return -1;

    const column = Math.floor(((clientX - box.left - elements.grid.clientLeft) / width) * sheet.columns);
    const row = Math.floor(((clientY - box.top - elements.grid.clientTop) / height) * sheet.rows);
    if (row < 0 || row >= sheet.rows || column < 0 || column >= sheet.columns) return -1;
    return row * sheet.columns + column;
  }

  function renderSound() {
    elements.sound.classList.toggle("is-off", !soundEnabled);
    elements.sound.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
  }

  function showPauseState(name) {
    elements.pauseOverlay.querySelectorAll("[data-state]").forEach((section) => {
      section.hidden = section.dataset.state !== name;
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

  function endStroke(event) {
    if (!strokeActive) return;
    strokeActive = false;
    strokeLastIndex = -1;
    if (elements.grid.hasPointerCapture(event.pointerId)) {
      elements.grid.releasePointerCapture(event.pointerId);
    }
  }

  elements.grid.addEventListener("pointerdown", (event) => {
    const index = cellIndexFromPoint(event.clientX, event.clientY);
    if (index < 0) return;
    event.preventDefault();
    elements.grid.setPointerCapture(event.pointerId);
    strokeActive = true;
    strokeLastIndex = -1;
    // The first cell of a stroke always sounds.
    cellsSinceSound = STROKE_SOUND_EVERY;
    paintTo(index);
  });

  elements.grid.addEventListener("pointermove", (event) => {
    if (!strokeActive) return;
    const index = cellIndexFromPoint(event.clientX, event.clientY);
    if (index < 0 || index === strokeLastIndex) return;
    paintTo(index);
  });

  elements.grid.addEventListener("pointerup", endStroke);
  elements.grid.addEventListener("pointercancel", endStroke);

  elements.palette.addEventListener("click", (event) => {
    const button = event.target.closest(".palette-button");
    if (!button) return;
    selectBlock(Number(button.dataset.block));
  });

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

  elements.confirmClear.addEventListener("click", () => {
    clearSheet(state);
    renderAllCells();
    renderProgress();
    saveGame();
    closePause();
    announce("The sheet is empty again.");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (paused) closePause();
    else openPause();
  });

  window.addEventListener("resize", fitSheet);

  renderSound();
  renderPalette();
  buildSheet();
  renderProgress();
}

if (typeof document !== "undefined") {
  initializeGame();
}
