const STORAGE_KEY = "blockTownWorldsV1";
const BLOCKS_KEY = "blockTownBlocksV1";
const SOUND_KEY = "blockTownSoundV1";

// A cell holds a small block id; 0 means the cell is still unpainted.
const EMPTY_CELL = 0;

// One row per block: the id stored in a grid and the family that shapes its
// behaviour and its art. Which blocks a child may paint with is decided by an
// adult on the shelf page, not by the game.
const BLOCKS = [
  { id: 1, key: "meadow", family: "nature" },
  { id: 2, key: "path", family: "roads" },
  { id: 3, key: "forest", family: "nature" },
  { id: 4, key: "water", family: "water" },
  { id: 5, key: "house", family: "buildings" },
  { id: 6, key: "field", family: "nature" },
  { id: 7, key: "flowers", family: "nature" },
  { id: 8, key: "sand", family: "nature" },
  { id: 9, key: "asphalt", family: "roads" },
  { id: 10, key: "rails", family: "roads" },
  { id: 11, key: "tower", family: "buildings" },
  { id: 12, key: "farm", family: "buildings" },
  { id: 13, key: "mountain", family: "nature" },
  { id: 14, key: "windmill", family: "buildings" },
  { id: 15, key: "lighthouse", family: "buildings" },
  { id: 16, key: "castle", family: "buildings" },
  { id: 17, key: "playground", family: "decor" },
  { id: 18, key: "lantern", family: "decor" },
  { id: 19, key: "bench", family: "decor" },
  { id: 20, key: "fountain", family: "decor" },
];

// How long a field needs before it shows shoots and then ripe ears. The model
// never reads the clock itself: the time is always passed in.
const FIELD_SHOOT_MS = 20000;
const FIELD_RIPE_MS = 60000;

const BLOCK_BY_ID = new Map(BLOCKS.map((block) => [block.id, block]));
const BLOCK_BY_KEY = new Map(BLOCKS.map((block) => [block.key, block]));
const WATER_ID = BLOCK_BY_KEY.get("water").id;
const FIELD_ID = BLOCK_BY_KEY.get("field").id;
const HOUSE_ID = BLOCK_BY_KEY.get("house").id;
const WINDMILL_ID = BLOCK_BY_KEY.get("windmill").id;
const LIGHTHOUSE_ID = BLOCK_BY_KEY.get("lighthouse").id;

// The blocks every child starts with. An adult adds more from the shelf page,
// and a block once added is never taken away.
const DEFAULT_BLOCK_KEYS = ["forest", "water", "path"];
// Kept in the order of the block table, the same order the palette shows.
const DEFAULT_BLOCK_IDS = BLOCKS
  .filter((block) => DEFAULT_BLOCK_KEYS.includes(block.key))
  .map((block) => block.id);

// The sizes a new world can have. Sizes and tools are data, so shrinking a
// world after a test with a child never touches the code around them.
const WORLD_SIZES = [
  { id: "size-1", rows: 5, columns: 10, tools: ["brush"] },
  { id: "size-2", rows: 8, columns: 16, tools: ["brush"] },
  { id: "size-3", rows: 12, columns: 24, tools: ["brush", "wide"] },
  // A big world no longer fits the screen: it opens zoomed in and brings the
  // zoom buttons, the edge arrows and the mini-map with it.
  { id: "size-4", rows: 18, columns: 36, tools: ["brush", "wide", "bucket"], big: true },
  { id: "size-5", rows: 24, columns: 48, tools: ["brush", "wide", "bucket"], big: true },
].map((size, index) => ({
  ...size,
  number: index + 1,
  cellCount: size.rows * size.columns,
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

function worldSizeById(sizeId) {
  return WORLD_SIZES.find((size) => size.id === sizeId) || null;
}

function worldSize(world) {
  return worldSizeById(world?.sizeId);
}

// Garbage, a missing setting and an old list all give the same answer: the
// known ids that were saved, plus the three blocks every world starts with.
function normalizeEnabledBlocks(saved) {
  const enabled = new Set(DEFAULT_BLOCK_IDS);
  if (Array.isArray(saved)) {
    saved.forEach((blockId) => {
      if (BLOCK_BY_ID.has(blockId)) enabled.add(blockId);
    });
  }
  return BLOCKS.filter((block) => enabled.has(block.id)).map((block) => block.id);
}

function isBlockEnabled(state, blockId) {
  return Array.isArray(state?.enabledBlockIds) && state.enabledBlockIds.includes(blockId);
}

function createGrid(size) {
  return new Array(size.cellCount).fill(EMPTY_CELL);
}

// Worlds are told apart by the moment they were made, so the order on the
// shelf never changes; the suffix keeps two worlds made in the same
// millisecond apart.
function newWorldId(now) {
  const stamp = Number.isFinite(now) ? Math.floor(now) : 0;
  return `w-${stamp.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createGameState(enabledBlockIds) {
  return {
    currentWorldId: null,
    worlds: [],
    // Not part of the save: an adult keeps this list on the shelf page.
    enabledBlockIds: normalizeEnabledBlocks(enabledBlockIds),
  };
}

function worldById(state, worldId) {
  return state?.worlds?.find((world) => world.id === worldId) || null;
}

function currentWorld(state) {
  return worldById(state, state?.currentWorldId);
}

// A new world goes to the end of the shelf and opens at once.
function createWorld(state, sizeId, now = 0) {
  const size = worldSizeById(sizeId);
  if (!state || !Array.isArray(state.worlds) || !size) return null;
  const world = {
    id: newWorldId(now),
    sizeId: size.id,
    grid: createGrid(size),
    underlay: createGrid(size),
    // Only the cells that hold a field are listed here, by the moment they
    // were sown, so the saved state stays small.
    planted: {},
    celebrated: false,
    createdAt: Number.isFinite(now) ? now : 0,
  };
  state.worlds.push(world);
  state.currentWorldId = world.id;
  return world;
}

// Deleting the open world opens the first one that is left; deleting the last
// world leaves an empty shelf.
function deleteWorld(state, worldId) {
  const index = state?.worlds?.findIndex((world) => world.id === worldId) ?? -1;
  if (index < 0) return false;
  state.worlds.splice(index, 1);
  if (state.currentWorldId === worldId) {
    state.currentWorldId = state.worlds[0]?.id ?? null;
  }
  return true;
}

function selectWorld(state, worldId) {
  if (!worldById(state, worldId)) return false;
  state.currentWorldId = worldId;
  return true;
}

// The four neighbours in a fixed north, east, south, west order, without
// wrapping around the edges of the world.
function gridNeighbors(cellCount, columns, index) {
  const rows = Math.floor(cellCount / columns);
  const row = Math.floor(index / columns);
  const column = index % columns;
  const neighbors = [];
  if (row > 0) neighbors.push(index - columns);
  if (column < columns - 1) neighbors.push(index + 1);
  if (row < rows - 1) neighbors.push(index + columns);
  if (column > 0) neighbors.push(index - 1);
  return neighbors;
}

function neighborIndices(size, index) {
  return gridNeighbors(size.cellCount, size.columns, index);
}

function isCellIndex(size, index) {
  return Boolean(size) && Number.isInteger(index) && index >= 0 && index < size.cellCount;
}

// Every cell on the straight line between two cells, both ends included. A fast
// stroke reports far apart points, and this keeps the painted line unbroken.
function lineIndices(size, fromIndex, toIndex) {
  if (!isCellIndex(size, fromIndex) || !isCellIndex(size, toIndex)) return [];

  let row = Math.floor(fromIndex / size.columns);
  let column = fromIndex % size.columns;
  const lastRow = Math.floor(toIndex / size.columns);
  const lastColumn = toIndex % size.columns;
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
    path.push(row * size.columns + column);
  }
  return path;
}

// Paints one cell of the open world. Painting over is always allowed, and
// nothing here ever throws: a refused paint simply reports no change.
function paintCell(state, index, blockId, now = 0) {
  const world = currentWorld(state);
  const size = worldSize(world);
  if (!isCellIndex(size, index) || !isBlockEnabled(state, blockId)) return false;

  const { grid, underlay } = world;
  if (!Array.isArray(grid) || !Array.isArray(underlay)) return false;

  // A road painted onto water becomes a bridge: the water waits underneath and
  // comes back as soon as water is painted over the bridge again.
  const overWater = grid[index] === WATER_ID || underlay[index] === WATER_ID;
  const nextUnderlay = isRoadBlock(blockId) && overWater ? WATER_ID : EMPTY_CELL;

  if (grid[index] === blockId && underlay[index] === nextUnderlay) return false;
  grid[index] = blockId;
  underlay[index] = nextUnderlay;

  if (blockId === FIELD_ID) world.planted[index] = now;
  else delete world.planted[index];
  return true;
}

function paintStroke(state, indices, blockId, now = 0) {
  if (!Array.isArray(indices)) return 0;
  return indices.reduce(
    (changed, index) => changed + (paintCell(state, index, blockId, now) ? 1 : 0),
    0,
  );
}

// The cells one press of the brush covers. The wide brush paints a square and
// simply loses the part that falls off the world.
function brushCells(size, index, span = 1) {
  if (!isCellIndex(size, index) || !Number.isInteger(span) || span < 1) return [];
  const row = Math.floor(index / size.columns);
  const column = index % size.columns;
  const cells = [];
  for (let rowStep = 0; rowStep < span; rowStep += 1) {
    for (let columnStep = 0; columnStep < span; columnStep += 1) {
      const nextRow = row + rowStep;
      const nextColumn = column + columnStep;
      if (nextRow >= size.rows || nextColumn >= size.columns) continue;
      cells.push(nextRow * size.columns + nextColumn);
    }
  }
  return cells;
}

// Fills the connected region that shares the value of the tapped cell, so the
// bucket works on an empty area and on a finished lake alike.
function floodFill(state, index, blockId, now = 0) {
  const world = currentWorld(state);
  const size = worldSize(world);
  if (!isCellIndex(size, index) || !isBlockEnabled(state, blockId)) return 0;

  const { grid } = world;
  if (!Array.isArray(grid)) return 0;

  const target = grid[index];
  if (target === blockId) return 0;

  const region = [];
  const seen = new Set([index]);
  const queue = [index];
  while (queue.length > 0) {
    const cell = queue.pop();
    region.push(cell);
    neighborIndices(size, cell).forEach((neighbor) => {
      if (seen.has(neighbor) || grid[neighbor] !== target) return;
      seen.add(neighbor);
      queue.push(neighbor);
    });
  }
  return paintStroke(state, region, blockId, now);
}

// Which of the four neighbours answer the question, as one 4-bit mask. Cells
// outside the world never count.
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

// A house turns its door toward the nearest street. Facing the reader is the
// friendliest default when no road has been painted yet.
const DOOR_SIDES = [
  [MASK_SOUTH, "s"],
  [MASK_EAST, "e"],
  [MASK_WEST, "w"],
  [MASK_NORTH, "n"],
];

function houseDoor(grid, columns, index) {
  if (grid?.[index] !== HOUSE_ID) return null;
  const mask = neighborMask(grid, columns, index, (value) => roadGroup(value) === "road");
  return DOOR_SIDES.find(([side]) => (mask & side) !== 0)?.[1] ?? "s";
}

// Bare soil, then shoots, then ripe ears. The caller passes the current time.
function fieldStage(state, index, now = 0) {
  const world = currentWorld(state);
  if (!world || world.grid?.[index] !== FIELD_ID) return -1;
  const sown = world.planted?.[index];
  const age = now - (Number.isFinite(sown) ? sown : 0);
  if (age < FIELD_SHOOT_MS) return 0;
  return age < FIELD_RIPE_MS ? 1 : 2;
}

// A windmill only turns when there is a field to work for.
function windmillTurns(grid, columns, index) {
  if (grid?.[index] !== WINDMILL_ID) return false;
  return neighborMask(grid, columns, index, (value) => value === FIELD_ID) !== 0;
}

// A lighthouse only blinks when it stands by the water.
function lighthouseBlinks(grid, underlay, columns, index) {
  if (grid?.[index] !== LIGHTHOUSE_ID) return false;
  const rows = Math.floor(grid.length / columns);
  const row = Math.floor(index / columns);
  const column = index % columns;
  const sides = [
    row > 0 ? index - columns : -1,
    column < columns - 1 ? index + 1 : -1,
    row < rows - 1 ? index + columns : -1,
    column > 0 ? index - 1 : -1,
  ];
  return sides.some((side) => side >= 0 && isWaterCell(grid, underlay, side));
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

// Every group of touching cells that holds one of the wanted blocks.
function connectedComponents(grid, columns, ids) {
  if (!Array.isArray(grid) || !Number.isInteger(columns) || columns <= 0) return [];
  const wanted = new Set(Array.isArray(ids) ? ids : [ids]);
  const seen = new Set();
  const components = [];

  grid.forEach((value, start) => {
    if (!wanted.has(value) || seen.has(start)) return;
    const cells = [];
    const queue = [start];
    seen.add(start);
    while (queue.length > 0) {
      const index = queue.pop();
      cells.push(index);
      gridNeighbors(grid.length, columns, index).forEach((neighbor) => {
        if (seen.has(neighbor) || !wanted.has(grid[neighbor])) return;
        seen.add(neighbor);
        queue.push(neighbor);
      });
    }
    cells.sort((left, right) => left - right);
    components.push(cells);
  });

  return components;
}

function buildAdjacency(cells, cellCount, columns) {
  const members = new Set(cells);
  const adjacency = new Map();
  cells.forEach((index) => {
    adjacency.set(index, gridNeighbors(cellCount, columns, index).filter((n) => members.has(n)));
  });
  return adjacency;
}

// A ring of cells where every cell has exactly two neighbours.
function isClosedLoop(cells, adjacency) {
  if (cells.length < 4) return false;
  return cells.every((index) => adjacency.get(index).length === 2);
}

function loopOrder(cells, adjacency) {
  const start = cells[0];
  const order = [start];
  let previous = -1;
  let current = start;
  while (true) {
    const next = adjacency.get(current).find((neighbor) => neighbor !== previous);
    if (next === undefined || next === start) break;
    order.push(next);
    previous = current;
    current = next;
  }
  return order;
}

// A continuous walk that covers every cell of the component and comes back:
// where the walk cannot go on it steps back the way it came, so two cells next
// to each other in the result are always next to each other on the world.
function walkOrder(cells, adjacency) {
  const start = cells.reduce(
    (best, index) => (adjacency.get(index).length < adjacency.get(best).length ? index : best),
    cells[0],
  );
  const visited = new Set([start]);
  const walk = [start];
  const stack = [start];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const next = adjacency.get(current).find((neighbor) => !visited.has(neighbor));
    if (next === undefined) {
      stack.pop();
      if (stack.length > 0) walk.push(stack[stack.length - 1]);
      continue;
    }
    visited.add(next);
    stack.push(next);
    walk.push(next);
  }

  // The walk ends where it started; keeping both would be a step in place.
  if (walk.length > 1 && walk.at(-1) === walk[0]) walk.pop();
  return walk;
}

function componentTrack(cells, cellCount, columns) {
  const adjacency = buildAdjacency(cells, cellCount, columns);
  const loop = isClosedLoop(cells, adjacency);
  return {
    cells,
    loop,
    path: loop ? loopOrder(cells, adjacency) : walkOrder(cells, adjacency),
  };
}

// One walkable track per connected road network. Rails are their own group, so
// a car never drives onto a railway.
function roadPaths(grid, columns, group = "road") {
  const ids = BLOCKS.filter((block) => roadGroup(block.id) === group).map((block) => block.id);
  return connectedComponents(grid, columns, ids)
    .map((cells) => componentTrack(cells, grid.length, columns));
}

function railPaths(grid, columns) {
  return roadPaths(grid, columns, "rails");
}

// Water under a bridge belongs to the lake, so a bridge never splits it in two.
function lakes(grid, underlay, columns) {
  if (!Array.isArray(grid)) return [];
  const water = grid.map((value, index) => (isWaterCell(grid, underlay, index) ? WATER_ID : EMPTY_CELL));
  return connectedComponents(water, columns, [WATER_ID])
    .map((cells) => ({ ...componentTrack(cells, grid.length, columns), size: cells.length }));
}

function forestClusters(grid, columns) {
  const forestId = BLOCK_BY_KEY.get("forest").id;
  return connectedComponents(grid, columns, [forestId])
    .map((cells) => ({ ...componentTrack(cells, grid.length, columns), size: cells.length }));
}

function paintedCount(state, worldId = state?.currentWorldId) {
  const grid = worldById(state, worldId)?.grid;
  if (!Array.isArray(grid)) return 0;
  return grid.reduce((count, value) => count + (value !== EMPTY_CELL ? 1 : 0), 0);
}

function isWorldComplete(state, worldId = state?.currentWorldId) {
  const world = worldById(state, worldId);
  const size = worldSize(world);
  if (!size) return false;
  return paintedCount(state, world.id) === size.cellCount;
}

// The only reset in the game. It clears one world and never touches the others.
function clearWorld(state, worldId = state?.currentWorldId) {
  const world = worldById(state, worldId);
  const size = worldSize(world);
  if (!size) return false;
  world.grid = createGrid(size);
  world.underlay = createGrid(size);
  world.planted = {};
  world.celebrated = false;
  return true;
}

function normalizeGrid(size, saved) {
  const grid = createGrid(size);
  if (!Array.isArray(saved)) return grid;
  const length = Math.min(saved.length, size.cellCount);
  for (let index = 0; index < length; index += 1) {
    // Unknown ids and anything that is not a block become empty cells.
    if (BLOCK_BY_ID.has(saved[index])) grid[index] = saved[index];
  }
  return grid;
}

function normalizeUnderlay(size, savedBridges, grid) {
  const underlay = createGrid(size);
  if (!Array.isArray(savedBridges)) return underlay;
  savedBridges.forEach((index) => {
    // Only water hides under a block, and only under a road: that is a bridge.
    if (isCellIndex(size, index) && isRoadBlock(grid[index])) underlay[index] = WATER_ID;
  });
  return underlay;
}

// Sowing times are kept only for cells that really hold a field.
function normalizePlanted(size, saved, grid) {
  const planted = {};
  if (!saved || typeof saved !== "object") return planted;
  Object.entries(saved).forEach(([key, time]) => {
    const index = Number(key);
    if (!isCellIndex(size, index) || grid[index] !== FIELD_ID) return;
    if (Number.isFinite(time)) planted[index] = time;
  });
  return planted;
}

// What gets written to storage. The underlay is a whole parallel array in
// memory, but only the few bridge cells are worth keeping, so the save of a
// shelf full of worlds stays small.
function serializeState(state) {
  return {
    currentWorldId: state.currentWorldId,
    worlds: state.worlds.map((world) => ({
      id: world.id,
      sizeId: world.sizeId,
      grid: world.grid,
      bridges: world.underlay.reduce((list, value, index) => {
        if (value === WATER_ID) list.push(index);
        return list;
      }, []),
      planted: world.planted,
      celebrated: world.celebrated,
      createdAt: world.createdAt,
    })),
  };
}

// Saved data may come from an older version, a different game or a broken
// write. A world that cannot be read is dropped, and anything unexpected
// inside a readable world turns into an empty cell instead of an error.
function normalizeSavedWorld(saved) {
  if (!saved || typeof saved !== "object") return null;
  if (typeof saved.id !== "string" || saved.id === "") return null;
  const size = worldSizeById(saved.sizeId);
  if (!size || !Array.isArray(saved.grid)) return null;

  const grid = normalizeGrid(size, saved.grid);
  return {
    id: saved.id,
    sizeId: size.id,
    grid,
    underlay: normalizeUnderlay(size, saved.bridges, grid),
    planted: normalizePlanted(size, saved.planted, grid),
    celebrated: saved.celebrated === true,
    createdAt: Number.isFinite(saved.createdAt) ? saved.createdAt : 0,
  };
}

function normalizeSavedState(value, enabledBlockIds) {
  const state = createGameState(enabledBlockIds);
  if (!value || typeof value !== "object" || !Array.isArray(value.worlds)) return state;

  const seen = new Set();
  value.worlds.forEach((saved) => {
    const world = normalizeSavedWorld(saved);
    if (!world || seen.has(world.id)) return;
    seen.add(world.id);
    state.worlds.push(world);
  });

  const open = worldById(state, value.currentWorldId);
  state.currentWorldId = open ? open.id : (state.worlds[0]?.id ?? null);
  return state;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    STORAGE_KEY,
    BLOCKS_KEY,
    SOUND_KEY,
    EMPTY_CELL,
    WATER_ID,
    BLOCKS,
    WORLD_SIZES,
    DEFAULT_BLOCK_IDS,
    blockById,
    isRoadBlock,
    worldSizeById,
    worldSize,
    normalizeEnabledBlocks,
    isBlockEnabled,
    neighborIndices,
    lineIndices,
    MASK_NORTH,
    MASK_EAST,
    MASK_SOUTH,
    MASK_WEST,
    roadGroup,
    gridNeighbors,
    connectedComponents,
    roadPaths,
    railPaths,
    lakes,
    forestClusters,
    neighborMask,
    roadTile,
    waterEdges,
    forestDensity,
    windmillTurns,
    lighthouseBlinks,
    createGameState,
    createWorld,
    deleteWorld,
    selectWorld,
    worldById,
    currentWorld,
    paintCell,
    paintStroke,
    brushCells,
    floodFill,
    houseDoor,
    fieldStage,
    FIELD_SHOOT_MS,
    FIELD_RIPE_MS,
    paintedCount,
    isWorldComplete,
    clearWorld,
    serializeState,
    normalizeSavedState,
  };
}


// The sheet is fitted to the card, never scaled below a comfortable finger size.
const MIN_CELL_SIZE = 22;
const MAX_CELL_SIZE = 92;

// The steps of the zoom on a big sheet, and the smallest cell that still feels
// comfortable under a finger.
const ZOOM_LEVELS = [24, 32, 40, 54, 72];
const COMFORT_CELL_SIZE = 40;
const PAN_SHARE = 0.6;
const SAVE_DELAY_MS = 250;

// A stroke should sound like a tune, not a rattle, so only every few painted
// cells gets a note.
const STROKE_SOUND_EVERY = 3;

// Each family has its own short note: a tap for a road, a plop for water, a
// rustle for the meadow and the wood, a knock for a house, a ding for decor.
// The living world. Each creature needs a painting big enough to hold it, and
// the sheet never shows more than a few of one kind.
const ANALYSIS_DELAY_MS = 320;
const MAX_SPRITES_PER_KIND = 3;
const SPRITE_KINDS = [
  { kind: "car", minCells: 3, stepMs: 620 },
  { kind: "train", minCells: 3, stepMs: 520 },
  { kind: "duck", minCells: 4, stepMs: 1500 },
  { kind: "boat", minCells: 10, stepMs: 1900 },
  { kind: "bird", minCells: 6, stepMs: 900 },
];

// The thumbnail and the mini-map draw one pixel per cell, so every block needs
// one flat color next to its full art in styles.css.
const BLOCK_COLORS = {
  meadow: "#a9dc88",
  path: "#e2d2ab",
  forest: "#4f9b5f",
  water: "#82c9e8",
  house: "#e58f6a",
  field: "#d8c057",
  flowers: "#e78cbb",
  sand: "#f0dfae",
  asphalt: "#9aa2a6",
  rails: "#8b7a63",
  tower: "#b58bd0",
  farm: "#c97f52",
  mountain: "#9d9a92",
  windmill: "#efe3c4",
  lighthouse: "#e5645f",
  castle: "#b9b3a6",
  playground: "#f2a63e",
  lantern: "#ffd45c",
  bench: "#c09a6a",
  fountain: "#7fd3d0",
};
const THUMBNAIL_EMPTY = "#fffdf4";
const MINIMAP_EMPTY = "#ffd45c";

// From this sheet on the palette groups its blocks by family, and the families
// always keep the same order and the same places.
const GROUPED_FROM_SHEET = 3;
const FAMILY_ORDER = ["nature", "roads", "water", "buildings", "decor"];
const TOOL_SIZES = { brush: 1, wide: 2 };
// Fields ripen slowly, so the sheet is looked over only now and then.
const FIELD_TICK_MS = 4000;
const CONFETTI_COUNT = 16;

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
    living: document.querySelector("#living-layer"),
    celebration: document.querySelector("#celebration"),
    confetti: document.querySelector("#confetti"),
    nextSheet: document.querySelector("#next-sheet-button"),
    stay: document.querySelector("#stay-button"),
    sheetShelf: document.querySelector("#sheet-shelf"),
    sheetScroll: document.querySelector("#sheet-scroll"),
    zoomButtons: document.querySelector("#zoom-buttons"),
    zoomIn: document.querySelector("#zoom-in"),
    zoomOut: document.querySelector("#zoom-out"),
    edgeArrows: document.querySelector("#edge-arrows"),
    minimap: document.querySelector("#minimap"),
    minimapCanvas: document.querySelector("#minimap-canvas"),
    minimapView: document.querySelector("#minimap-view"),
    shelf: document.querySelector("#shelf-button"),
    shelfBack: document.querySelector("#shelf-back-button"),
    palette: document.querySelector("#palette"),
    paletteKinds: document.querySelector("#palette-kinds"),
    tools: document.querySelector("#tools"),
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

  const FAMILY_NAMES = {
    nature: "Nature",
    roads: "Roads",
    water: "Water",
    buildings: "Houses",
    decor: "Decorations",
  };

  const TOOL_NAMES = {
    brush: "Brush",
    wide: "Wide brush",
    bucket: "Fill",
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
  let selectedTool = "brush";
  let zoomIndex = ZOOM_LEVELS.indexOf(COMFORT_CELL_SIZE);
  let cursorIndex = 0;
  let openFamily = null;
  let fieldTimer = 0;
  let cells = [];
  let saveTimer = 0;
  let soundEnabled = loadSoundPreference();
  let paused = false;
  let strokeActive = false;
  let strokeLastIndex = -1;
  let cellsSinceSound = STROKE_SOUND_EVERY;
  let sprites = [];
  let analysisTimer = 0;
  let driverHandle = 0;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = motionQuery.matches;

  function loadGame() {
    try {
      return normalizeSavedState(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch {
      return createGameState();
    }
  }

  function saveGame() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(state)));
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

  function renderCell(index, now = Date.now()) {
    const element = cells[index];
    if (!element) return;
    const sheet = currentSheet(state);
    const grid = state.grids[sheet.id];
    const underlay = state.underlays[sheet.id];
    const classes = cellClasses(sheet, grid, underlay, index);
    // Repainting a cell must not drop the keyboard frame that stands on it.
    if (index === cursorIndex) classes.push("is-cursor");
    if (grid[index] === HOUSE_ID) classes.push(`door--${houseDoor(grid, sheet.columns, index)}`);
    if (grid[index] === FIELD_ID) classes.push(`field--${fieldStage(state, index, now)}`);
    if (windmillTurns(grid, sheet.columns, index)) classes.push("is-turning");
    if (lighthouseBlinks(grid, underlay, sheet.columns, index)) classes.push("is-blinking");
    element.className = classes.join(" ");
    element.setAttribute("aria-label", blockName(grid[index]));
  }

  // A painted cell can change the look of its four neighbours and nothing else.
  function renderCellAndNeighbors(index, now = Date.now()) {
    const sheet = currentSheet(state);
    renderCell(index, now);
    neighborIndices(sheet, index).forEach((neighbor) => renderCell(neighbor, now));
  }

  function renderAllCells() {
    const now = Date.now();
    for (let index = 0; index < cells.length; index += 1) renderCell(index, now);
  }

  // Fields ripen while the sheet is open, so they are looked over on a slow
  // timer instead of being redrawn on every paint.
  function watchFields() {
    window.clearInterval(fieldTimer);
    const sheet = currentSheet(state);
    if (!isBlockOnSheet(sheet, FIELD_ID)) return;
    fieldTimer = window.setInterval(() => {
      const now = Date.now();
      Object.keys(state.planted[sheet.id]).forEach((key) => renderCell(Number(key), now));
    }, FIELD_TICK_MS);
  }

  // One pixel per cell. The sheet shelf and, later, the mini-map both read the
  // model through this and nothing else.
  function drawThumbnail(canvas, sheet, { markEmpty = false } = {}) {
    canvas.width = sheet.columns;
    canvas.height = sheet.rows;
    const context = canvas.getContext("2d");
    if (!context) return;
    // On the mini-map the cells still waiting are the bright ones, so the last
    // empty corner is easy to find.
    context.fillStyle = markEmpty ? MINIMAP_EMPTY : THUMBNAIL_EMPTY;
    context.fillRect(0, 0, sheet.columns, sheet.rows);
    state.grids[sheet.id].forEach((value, index) => {
      const block = blockById(value);
      if (!block) return;
      context.fillStyle = BLOCK_COLORS[block.key];
      context.fillRect(index % sheet.columns, Math.floor(index / sheet.columns), 1, 1);
    });
  }

  // The mini-map shows the whole sheet and where the window on it sits.
  function updateMinimapView() {
    const scroll = elements.sheetScroll;
    if (!currentSheet(state).big || scroll.scrollWidth === 0) return;
    const view = elements.minimapView.style;
    view.left = `${(scroll.scrollLeft / scroll.scrollWidth) * 100}%`;
    view.top = `${(scroll.scrollTop / scroll.scrollHeight) * 100}%`;
    view.width = `${Math.min(100, (scroll.clientWidth / scroll.scrollWidth) * 100)}%`;
    view.height = `${Math.min(100, (scroll.clientHeight / scroll.scrollHeight) * 100)}%`;
  }

  function drawMinimap() {
    const sheet = currentSheet(state);
    if (!sheet.big) return;
    drawThumbnail(elements.minimapCanvas, sheet, { markEmpty: true });
    updateMinimapView();
  }

  function panBy(direction) {
    const scroll = elements.sheetScroll;
    const behavior = reduceMotion ? "auto" : "smooth";
    const stepX = scroll.clientWidth * PAN_SHARE;
    const stepY = scroll.clientHeight * PAN_SHARE;
    const moves = {
      up: { top: -stepY },
      down: { top: stepY },
      left: { left: -stepX },
      right: { left: stepX },
    };
    scroll.scrollBy({ ...moves[direction], behavior });
  }

  function renderSheetShelf() {
    elements.shelf.hidden = state.unlockedCount < 2;
    elements.sheetShelf.textContent = "";
    SHEETS.slice(0, state.unlockedCount).forEach((sheet) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "sheet-choice";
      button.dataset.sheet = sheet.id;
      button.setAttribute("role", "listitem");
      button.setAttribute("aria-current", sheet.id === state.currentSheet ? "true" : "false");
      button.setAttribute("aria-label", `Sheet ${sheet.number}`);
      // A bigger sheet gets a bigger picture, so the ladder is visible.
      button.style.setProperty("--thumb-width", `${52 + sheet.number * 14}px`);
      const canvas = document.createElement("canvas");
      canvas.className = "sheet-thumbnail";
      button.append(canvas);
      elements.sheetShelf.append(button);
      drawThumbnail(canvas, sheet);
    });
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
        cell.id = `cell-${index}`;
        cell.setAttribute("role", "gridcell");
        cell.dataset.index = String(index);
        cells[index] = cell;
        rowElement.append(cell);
      }
      elements.grid.append(rowElement);
    }

    renderAllCells();
    fitSheet();
    cursorIndex = Math.min(cursorIndex, sheet.cellCount - 1);
    showCursor({ scroll: false });
  }

  // The keyboard cursor. It is the same frame the screen reader follows, so
  // both ways of playing point at one cell.
  function showCursor({ scroll = true } = {}) {
    cells.forEach((cell) => cell.classList.remove("is-cursor"));
    const cell = cells[cursorIndex];
    if (!cell) return;
    cell.classList.add("is-cursor");
    elements.grid.setAttribute("aria-activedescendant", cell.id);
    if (!scroll) return;
    cell.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  function moveCursor([rowStep, columnStep]) {
    const sheet = currentSheet(state);
    const row = Math.floor(cursorIndex / sheet.columns) + rowStep;
    const column = (cursorIndex % sheet.columns) + columnStep;
    if (row < 0 || row >= sheet.rows || column < 0 || column >= sheet.columns) return;
    cursorIndex = row * sheet.columns + column;
    showCursor();
  }

  // Arrow keys come from the key, WASD from the physical key, so the letters
  // also work on a Russian layout.
  function cursorStep(event) {
    const byKey = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    };
    const byCode = {
      KeyW: [-1, 0],
      KeyS: [1, 0],
      KeyA: [0, -1],
      KeyD: [0, 1],
    };
    return byKey[event.key] || byCode[event.code] || null;
  }

  function focusPalette() {
    const open = elements.paletteKinds.hidden ? elements.palette : elements.paletteKinds;
    const button = open.querySelector('[aria-checked="true"]') || open.querySelector("button");
    button?.focus();
  }

  // The largest cell at which the whole sheet still fits the card.
  function fitCellSize(sheet) {
    const style = window.getComputedStyle(elements.card);
    const box = elements.card.getBoundingClientRect();
    const width = box.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const height = box.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    const size = Math.floor(Math.min(width / sheet.columns, height / sheet.rows));
    return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, size));
  }

  // A big sheet opens at a comfortable cell size even when that means scrolling.
  function defaultZoomIndex(sheet) {
    const fit = fitCellSize(sheet);
    const fitting = ZOOM_LEVELS.filter((size) => size <= fit);
    const best = fitting.length > 0 ? fitting[fitting.length - 1] : ZOOM_LEVELS[0];
    return ZOOM_LEVELS.indexOf(Math.max(best, COMFORT_CELL_SIZE));
  }

  function fitSheet() {
    const sheet = currentSheet(state);
    const size = sheet.big ? ZOOM_LEVELS[zoomIndex] : fitCellSize(sheet);
    elements.stage.style.setProperty("--cell-size", `${size}px`);
    elements.zoomIn.disabled = zoomIndex >= ZOOM_LEVELS.length - 1;
    elements.zoomOut.disabled = zoomIndex <= 0;
    updateMinimapView();
  }

  function renderSheetControls() {
    const big = currentSheet(state).big === true;
    elements.zoomButtons.hidden = !big;
    elements.edgeArrows.hidden = !big;
    elements.minimap.hidden = !big;
  }

  function setZoom(step) {
    const next = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, zoomIndex + step));
    if (next === zoomIndex) return;
    zoomIndex = next;
    fitSheet();
  }

  function blockButton(blockId, { checked, family }) {
    const block = blockById(blockId);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "palette-button";
    button.dataset.block = String(blockId);
    if (family) button.dataset.family = family;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", checked ? "true" : "false");
    button.setAttribute("aria-label", family ? FAMILY_NAMES[family] : BLOCK_NAMES[block.key]);
    // A one-cell sheet gives the swatch the same art the grid would draw.
    const art = cellClasses({ columns: 1 }, [blockId], [EMPTY_CELL], 0);
    // On a button a field is shown ripe: that is what the block is for.
    if (blockId === FIELD_ID) art.push("field--2");
    button.innerHTML = `<span class="palette-swatch ${art.join(" ")}" aria-hidden="true"></span>`;
    return button;
  }

  function familiesOnSheet(sheet) {
    return FAMILY_ORDER
      .map((family) => ({
        family,
        blockIds: sheet.blockIds.filter((blockId) => blockById(blockId).family === family),
      }))
      .filter((group) => group.blockIds.length > 0);
  }

  // Which kind of a family is on its button. It stays what the child chose
  // last, so a familiar picture never moves or changes on its own.
  const chosenKind = new Map();

  function kindOf(group) {
    const chosen = chosenKind.get(group.family);
    return group.blockIds.includes(chosen) ? chosen : group.blockIds[0];
  }

  function renderPalette() {
    const sheet = currentSheet(state);
    const grouped = sheet.number >= GROUPED_FROM_SHEET;
    elements.palette.textContent = "";

    if (!grouped) {
      sheet.blockIds.forEach((blockId) => {
        elements.palette.append(blockButton(blockId, { checked: blockId === selectedBlockId }));
      });
      closeKinds();
      return;
    }

    familiesOnSheet(sheet).forEach((group) => {
      const kind = kindOf(group);
      const checked = group.blockIds.includes(selectedBlockId);
      elements.palette.append(blockButton(checked ? selectedBlockId : kind, {
        checked,
        family: group.family,
      }));
    });
    renderKinds();
  }

  function closeKinds() {
    openFamily = null;
    elements.paletteKinds.hidden = true;
    elements.paletteKinds.textContent = "";
  }

  // Tapping a family opens a short row with its kinds, and tapping a kind
  // chooses it and closes the row again.
  function renderKinds() {
    const sheet = currentSheet(state);
    const group = familiesOnSheet(sheet).find((entry) => entry.family === openFamily);
    if (!group || group.blockIds.length < 2) {
      closeKinds();
      return;
    }
    elements.paletteKinds.hidden = false;
    elements.paletteKinds.textContent = "";
    group.blockIds.forEach((blockId) => {
      elements.paletteKinds.append(blockButton(blockId, { checked: blockId === selectedBlockId }));
    });
  }

  function selectBlock(blockId) {
    if (!isBlockOnSheet(currentSheet(state), blockId)) return;
    selectedBlockId = blockId;
    chosenKind.set(blockById(blockId).family, blockId);
    closeKinds();
    renderPalette();
    announce(BLOCK_NAMES[blockById(blockId).key]);
  }

  function renderTools() {
    const sheet = currentSheet(state);
    if (sheet.tools.length < 2) {
      elements.tools.hidden = true;
      elements.tools.textContent = "";
      selectedTool = "brush";
      return;
    }
    elements.tools.hidden = false;
    elements.tools.textContent = "";
    if (!sheet.tools.includes(selectedTool)) selectedTool = sheet.tools[0];
    sheet.tools.forEach((tool) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `tool-button tool--${tool}`;
      button.dataset.tool = tool;
      button.setAttribute("role", "radio");
      button.setAttribute("aria-checked", tool === selectedTool ? "true" : "false");
      button.setAttribute("aria-label", TOOL_NAMES[tool]);
      button.innerHTML = '<span class="tool-mark" aria-hidden="true"></span>';
      elements.tools.append(button);
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

    const size = TOOL_SIZES[selectedTool] ?? 1;
    const now = Date.now();
    let changed = 0;
    path.flatMap((cell) => brushCells(sheet, cell, size)).forEach((cell) => {
      if (!paintCell(state, cell, selectedBlockId, now)) return;
      renderCellAndNeighbors(cell, now);
      changed += 1;
    });
    afterPainting(changed);
  }

  // The bucket is a single tap: it fills the whole area the cell belongs to.
  function fillFrom(index) {
    const changed = floodFill(state, index, selectedBlockId, Date.now());
    if (changed === 0) return;
    renderAllCells();
    afterPainting(changed);
  }

  function afterPainting(changed) {
    if (changed === 0) return;
    renderProgress();
    scheduleSave();
    scheduleAnalysis();
    checkCompletion();

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

  function cellSizePx() {
    const sheet = currentSheet(state);
    return elements.grid.clientWidth / sheet.columns;
  }

  function createSprite(kind, track) {
    const element = document.createElement("span");
    element.className = `sprite sprite--${kind}`;
    // The inner element carries the drawing, so it can be mirrored without
    // disturbing the position of the sprite.
    element.innerHTML = "<i></i>";
    elements.living.append(element);
    return { element, path: track.path, stepMs: kindStep(kind), phase: Math.random() };
  }

  function kindStep(kind) {
    return SPRITE_KINDS.find((entry) => entry.kind === kind)?.stepMs ?? 800;
  }

  function placeSprite(sprite, position, size) {
    const columns = currentSheet(state).columns;
    const step = Math.floor(position);
    const from = sprite.path[step % sprite.path.length];
    const to = sprite.path[(step + 1) % sprite.path.length];
    const share = position - step;
    const fromColumn = from % columns;
    const toColumn = to % columns;
    const x = (fromColumn + (toColumn - fromColumn) * share) * size;
    const fromRow = Math.floor(from / columns);
    const y = (fromRow + (Math.floor(to / columns) - fromRow) * share) * size;
    sprite.element.style.transform = `translate(${x}px, ${y}px)`;
    // Creatures look the way they travel.
    if (toColumn !== fromColumn) {
      sprite.element.classList.toggle("is-mirrored", toColumn < fromColumn);
    }
  }

  // Under reduced motion the creatures keep their place on the sheet: present,
  // but never travelling.
  function parkSprites() {
    const size = cellSizePx();
    sprites.forEach((sprite) => placeSprite(sprite, 0, size));
  }

  function driveSprites(timestamp) {
    driverHandle = 0;
    const size = cellSizePx();
    sprites.forEach((sprite) => {
      placeSprite(sprite, timestamp / sprite.stepMs + sprite.phase * sprite.path.length, size);
    });
    if (sprites.length > 0) driverHandle = window.requestAnimationFrame(driveSprites);
  }

  function startDriver() {
    if (driverHandle) {
      window.cancelAnimationFrame(driverHandle);
      driverHandle = 0;
    }
    if (sprites.length === 0) return;
    if (reduceMotion) {
      parkSprites();
      return;
    }
    driverHandle = window.requestAnimationFrame(driveSprites);
  }

  function tracksFor(kind, sheet, grid, underlay) {
    if (kind === "car") return roadPaths(grid, sheet.columns);
    if (kind === "train") return railPaths(grid, sheet.columns);
    if (kind === "duck" || kind === "boat") return lakes(grid, underlay, sheet.columns);
    return forestClusters(grid, sheet.columns);
  }

  // The world is read once a stroke has settled, never cell by cell.
  function analyzeWorld() {
    const sheet = currentSheet(state);
    const grid = state.grids[sheet.id];
    const underlay = state.underlays[sheet.id];

    elements.living.textContent = "";
    sprites = SPRITE_KINDS.flatMap(({ kind, minCells }) =>
      tracksFor(kind, sheet, grid, underlay)
        .filter((track) => track.cells.length >= minCells)
        .sort((left, right) => right.cells.length - left.cells.length)
        .slice(0, MAX_SPRITES_PER_KIND)
        .map((track) => createSprite(kind, track)));

    startDriver();
    drawMinimap();
  }

  function scheduleAnalysis() {
    window.clearTimeout(analysisTimer);
    analysisTimer = window.setTimeout(analyzeWorld, ANALYSIS_DELAY_MS);
  }

  function playCelebrationSound() {
    if (!soundEnabled) return;
    [[392, 0, 0.16], [523, 0.14, 0.18], [659, 0.3, 0.22], [784, 0.48, 0.34]]
      .forEach(([frequency, delay, duration]) => {
        window.GameSound?.tone({ frequency, delay, duration, volume: 0.05 });
      });
  }

  function fillConfetti() {
    elements.confetti.textContent = "";
    for (let piece = 0; piece < CONFETTI_COUNT; piece += 1) {
      const flake = document.createElement("span");
      flake.style.setProperty("--left", `${(piece + 0.5) * (100 / CONFETTI_COUNT)}%`);
      flake.style.setProperty("--delay", `${(piece % 5) * 220}ms`);
      flake.style.setProperty("--drift", `${piece % 2 === 0 ? 1 : -1}`);
      // Where the piece rests when motion is switched off.
      flake.style.setProperty("--top", `${10 + (piece % 5) * 17}%`);
      elements.confetti.append(flake);
    }
  }

  // Evening light stays on a finished sheet; the confetti and the card come
  // only the first time it is finished.
  function renderEvening() {
    elements.stage.classList.toggle("is-evening", isSheetComplete(state));
  }

  function openCelebration(hasNextSheet) {
    fillConfetti();
    elements.celebration.hidden = false;
    elements.nextSheet.hidden = !hasNextSheet;
    playCelebrationSound();
    (hasNextSheet ? elements.nextSheet : elements.stay).focus();
    announce("The whole sheet is painted!");
  }

  function closeCelebration() {
    elements.celebration.hidden = true;
    elements.confetti.textContent = "";
  }

  function checkCompletion() {
    renderEvening();
    if (!isSheetComplete(state)) return;

    const sheet = currentSheet(state);
    const unlocked = unlockNextSheet(state);
    const hasNextSheet = sheetIndex(sheet.id) + 1 < state.unlockedCount;
    if (unlocked) renderSheetShelf();
    if (state.celebrated[sheet.id]) return;

    state.celebrated[sheet.id] = true;
    saveGame();
    openCelebration(hasNextSheet);
  }

  function openSheet(sheetId) {
    if (!selectSheet(state, sheetId)) return;
    closeCelebration();
    renderPalette();
    renderTools();
    renderSheetControls();
    zoomIndex = defaultZoomIndex(currentSheet(state));
    cursorIndex = 0;
    buildSheet();
    elements.sheetScroll.scrollTo(0, 0);
    watchFields();
    renderProgress();
    renderEvening();
    renderSheetShelf();
    analyzeWorld();
    saveGame();
    announce(`Sheet ${currentSheet(state).number}`);
    elements.grid.focus();
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
    renderSheetShelf();
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
    if (selectedTool === "bucket") {
      cellsSinceSound = STROKE_SOUND_EVERY;
      fillFrom(index);
      return;
    }
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

  elements.grid.addEventListener("keydown", (event) => {
    const step = cursorStep(event);
    if (step) {
      event.preventDefault();
      moveCursor(step);
      return;
    }
    if (event.key === " ") {
      event.preventDefault();
      cellsSinceSound = STROKE_SOUND_EVERY;
      if (selectedTool === "bucket") {
        fillFrom(cursorIndex);
        return;
      }
      strokeLastIndex = -1;
      paintTo(cursorIndex);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      focusPalette();
    }
  });

  // Left and right walk along a row of buttons; Escape goes back to the sheet.
  function bindButtonRow(container, selector) {
    container.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        elements.grid.focus();
        return;
      }
      const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
      if (!step) return;
      const buttons = [...container.querySelectorAll(selector)];
      const position = buttons.indexOf(document.activeElement);
      if (position < 0) return;
      event.preventDefault();
      buttons[(position + step + buttons.length) % buttons.length].focus();
    });
  }

  bindButtonRow(elements.palette, ".palette-button");
  bindButtonRow(elements.paletteKinds, ".palette-button");
  bindButtonRow(elements.tools, ".tool-button");

  // A click made with the keyboard has no pointer behind it; the focus then
  // moves on by itself, so the player never has to hunt for it.
  function cameFromKeyboard(event) {
    return event.detail === 0;
  }

  elements.palette.addEventListener("click", (event) => {
    const button = event.target.closest(".palette-button");
    if (!button) return;
    const family = button.dataset.family;
    // A family with several kinds opens its row; a single kind is chosen at once.
    if (family && family !== openFamily) {
      const group = familiesOnSheet(currentSheet(state)).find((entry) => entry.family === family);
      if (group.blockIds.length > 1) {
        openFamily = family;
        renderKinds();
        if (cameFromKeyboard(event)) focusPalette();
        return;
      }
    }
    closeKinds();
    selectBlock(Number(button.dataset.block));
    if (cameFromKeyboard(event)) elements.grid.focus();
  });

  elements.paletteKinds.addEventListener("click", (event) => {
    const button = event.target.closest(".palette-button");
    if (!button) return;
    selectBlock(Number(button.dataset.block));
    if (cameFromKeyboard(event)) elements.grid.focus();
  });

  elements.tools.addEventListener("click", (event) => {
    const button = event.target.closest(".tool-button");
    if (!button) return;
    selectedTool = button.dataset.tool;
    renderTools();
    announce(TOOL_NAMES[selectedTool]);
    if (cameFromKeyboard(event)) elements.grid.focus();
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
    renderEvening();
    analyzeWorld();
    saveGame();
    closePause();
    announce("The sheet is empty again.");
  });

  elements.shelf.addEventListener("click", () => {
    showPauseState("sheets");
    elements.shelfBack.focus();
  });

  elements.shelfBack.addEventListener("click", () => {
    showPauseState("menu");
    elements.shelf.focus();
  });

  elements.sheetShelf.addEventListener("click", (event) => {
    const button = event.target.closest(".sheet-choice");
    if (!button) return;
    openSheet(button.dataset.sheet);
    closePause();
  });

  elements.nextSheet.addEventListener("click", () => {
    const next = SHEETS[sheetIndex(state.currentSheet) + 1];
    if (next) openSheet(next.id);
  });

  elements.stay.addEventListener("click", () => {
    closeCelebration();
    elements.pause.focus();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!elements.celebration.hidden) {
      closeCelebration();
      return;
    }
    if (paused) closePause();
    else openPause();
  });

  elements.zoomIn.addEventListener("click", () => setZoom(1));
  elements.zoomOut.addEventListener("click", () => setZoom(-1));

  elements.edgeArrows.addEventListener("click", (event) => {
    const direction = event.target.closest("[data-pan]")?.dataset.pan;
    if (direction) panBy(direction);
  });

  elements.sheetScroll.addEventListener("scroll", updateMinimapView);

  elements.minimap.addEventListener("click", (event) => {
    const box = elements.minimapCanvas.getBoundingClientRect();
    const scroll = elements.sheetScroll;
    const acrossShare = (event.clientX - box.left) / box.width;
    const downShare = (event.clientY - box.top) / box.height;
    scroll.scrollLeft = acrossShare * scroll.scrollWidth - scroll.clientWidth / 2;
    scroll.scrollTop = downShare * scroll.scrollHeight - scroll.clientHeight / 2;
  });

  window.addEventListener("resize", () => {
    fitSheet();
    if (reduceMotion) parkSprites();
  });

  motionQuery.addEventListener("change", (event) => {
    reduceMotion = event.matches;
    startDriver();
  });

  renderSound();
  renderPalette();
  renderTools();
  renderSheetControls();
  zoomIndex = defaultZoomIndex(currentSheet(state));
  buildSheet();
  watchFields();
  renderProgress();
  renderEvening();
  renderSheetShelf();
  analyzeWorld();
}

if (typeof document !== "undefined") {
  initializeGame();
}
