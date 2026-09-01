const assert = require("node:assert/strict");
const {
  EMPTY_CELL,
  WATER_ID,
  BLOCKS,
  WORLD_SIZES,
  DEFAULT_BLOCK_IDS,
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
} = require("./game.js");

const PATH_ID = BLOCKS.find((block) => block.key === "path").id;
const MEADOW_ID = BLOCKS.find((block) => block.key === "meadow").id;
const FOREST_ID = BLOCKS.find((block) => block.key === "forest").id;
const HOUSE_ID = BLOCKS.find((block) => block.key === "house").id;
const FIELD_ID = BLOCKS.find((block) => block.key === "field").id;
const RAILS_ID = BLOCKS.find((block) => block.key === "rails").id;
const WINDMILL_ID = BLOCKS.find((block) => block.key === "windmill").id;
const LIGHTHOUSE_ID = BLOCKS.find((block) => block.key === "lighthouse").id;

const ALL_BLOCK_IDS = BLOCKS.map((block) => block.id);

// Most tests are about painting, not about what an adult has enabled, so they
// start from a state where every block is available.
function openWorld(sizeId = "size-1", enabledBlockIds = ALL_BLOCK_IDS) {
  const state = createGameState(enabledBlockIds);
  createWorld(state, sizeId, 1000);
  return state;
}

function fillWorld(state, blockId) {
  const size = worldSize(currentWorld(state));
  const indices = Array.from({ length: size.cellCount }, (_, index) => index);
  return paintStroke(state, indices, blockId);
}

// A hand-built 5 x 10 grid, written as rows of single characters.
function buildGrid(rows) {
  const legend = {
    ".": 0,
    "m": MEADOW_ID,
    "r": PATH_ID,
    "f": FOREST_ID,
    "w": WATER_ID,
    "h": HOUSE_ID,
  };
  return rows.join("").split("").map((symbol) => legend[symbol]);
}

function testRegistries() {
  const ids = BLOCKS.map((block) => block.id);
  const keys = BLOCKS.map((block) => block.key);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(ids.includes(EMPTY_CELL), false);

  const sizeIds = WORLD_SIZES.map((size) => size.id);
  assert.deepEqual(sizeIds, ["size-1", "size-2", "size-3", "size-4", "size-5"]);
  assert.equal(new Set(sizeIds).size, sizeIds.length);
  assert.deepEqual(WORLD_SIZES.map((size) => size.cellCount), [50, 128, 288, 648, 1152]);
  WORLD_SIZES.forEach((size) => {
    assert.equal(size.cellCount, size.rows * size.columns);
    assert.equal(size.tools.includes("brush"), true);
  });
  // Only a big world is scrolled, and only a big world gets the bucket.
  assert.deepEqual(WORLD_SIZES.map((size) => size.big === true), [false, false, false, true, true]);

  // The blocks a world starts with are real blocks.
  assert.equal(DEFAULT_BLOCK_IDS.length, 3);
  DEFAULT_BLOCK_IDS.forEach((blockId) => {
    assert.equal(ids.includes(blockId), true);
  });
}

function testNeighbors() {
  const size = worldSizeById("size-1");
  assert.deepEqual(neighborIndices(size, 0), [1, 10]);
  assert.deepEqual(neighborIndices(size, 9), [19, 8]);
  assert.deepEqual(neighborIndices(size, 11), [1, 12, 21, 10]);
  assert.deepEqual(neighborIndices(size, 49), [39, 48]);
}

function testStrokeLine() {
  const size = worldSizeById("size-1");
  assert.deepEqual(lineIndices(size, 12, 12), [12]);
  assert.deepEqual(lineIndices(size, 10, 14), [10, 11, 12, 13, 14]);
  assert.deepEqual(lineIndices(size, 5, 35), [5, 15, 25, 35]);
  assert.deepEqual(lineIndices(size, 0, 22), [0, 11, 22]);
  assert.deepEqual(lineIndices(size, 22, 0), [22, 11, 0]);
  assert.deepEqual(lineIndices(size, 0, 99), []);
  assert.deepEqual(lineIndices(size, -1, 4), []);

  // Every step of a line touches a cell next to the previous one.
  const diagonal = lineIndices(size, 0, 49);
  assert.equal(diagonal.at(0), 0);
  assert.equal(diagonal.at(-1), 49);
  diagonal.slice(1).forEach((index, position) => {
    const previous = diagonal[position];
    const rowStep = Math.abs(Math.floor(index / 10) - Math.floor(previous / 10));
    const columnStep = Math.abs((index % 10) - (previous % 10));
    assert.equal(rowStep <= 1 && columnStep <= 1, true);
  });
}

function testNeighborMask() {
  const grid = buildGrid([
    ".r........",
    "rrr.......",
    ".r........",
    "..........",
    "..........",
  ]);
  const isRoad = (value) => value === PATH_ID;
  assert.equal(neighborMask(grid, 10, 11, isRoad), MASK_NORTH | MASK_EAST | MASK_SOUTH | MASK_WEST);
  assert.equal(neighborMask(grid, 10, 1, isRoad), MASK_SOUTH);
  assert.equal(neighborMask(grid, 10, 10, isRoad), MASK_EAST);
  assert.equal(neighborMask(grid, 10, 12, isRoad), MASK_WEST);
  assert.equal(neighborMask(grid, 10, 44, isRoad), 0);
  // Nothing outside the world ever counts as a neighbour.
  assert.equal(neighborMask(grid, 10, 99, isRoad), 0);
  assert.equal(neighborMask(null, 10, 0, isRoad), 0);
}

function testRoadTile() {
  const lone = buildGrid([
    "r.........",
    "..........",
    "..........",
    "..........",
    "..........",
  ]);
  assert.equal(roadTile(lone, [], 10, 0).shape, "lone");
  assert.equal(roadTile(lone, [], 10, 1), null);

  const line = buildGrid([
    "rrrr......",
    "..........",
    "..........",
    "..........",
    "..........",
  ]);
  assert.equal(roadTile(line, [], 10, 0).shape, "end");
  assert.equal(roadTile(line, [], 10, 1).shape, "straight");
  assert.equal(roadTile(line, [], 10, 3).shape, "end");
  assert.equal(roadTile(line, [], 10, 1).mask, MASK_EAST | MASK_WEST);

  const corner = buildGrid([
    "rr........",
    "r.........",
    "..........",
    "..........",
    "..........",
  ]);
  assert.equal(roadTile(corner, [], 10, 0).shape, "turn");
  assert.equal(roadTile(corner, [], 10, 0).mask, MASK_EAST | MASK_SOUTH);

  const cross = buildGrid([
    ".r........",
    "rrr.......",
    ".r........",
    "..........",
    "..........",
  ]);
  assert.equal(roadTile(cross, [], 10, 11).shape, "cross");
  assert.equal(roadTile(cross, [], 10, 1).shape, "end");

  const tee = buildGrid([
    "rrr.......",
    ".r........",
    "..........",
    "..........",
    "..........",
  ]);
  assert.equal(roadTile(tee, [], 10, 1).shape, "tee");

  // A road on top of remembered water is a bridge.
  const underlay = new Array(50).fill(0);
  underlay[1] = WATER_ID;
  assert.equal(roadTile(line, underlay, 10, 1).bridge, true);
  assert.equal(roadTile(line, underlay, 10, 2).bridge, false);

  // Rails and roads are separate networks.
  assert.equal(roadGroup(PATH_ID), "road");
  assert.equal(roadGroup(MEADOW_ID), null);
}

function testWaterEdges() {
  const grid = buildGrid([
    "..........",
    ".www......",
    ".www......",
    "..........",
    "..........",
  ]);
  const underlay = new Array(50).fill(0);
  // The middle of a lake has no shore at all.
  assert.equal(waterEdges(grid, underlay, 10, 11), MASK_NORTH | MASK_WEST);
  assert.equal(waterEdges(grid, underlay, 10, 12), MASK_NORTH);
  assert.equal(waterEdges(grid, underlay, 10, 22), MASK_SOUTH);
  assert.equal(waterEdges(grid, underlay, 10, 0), 0);

  // A lone puddle keeps a shore on every side.
  const puddle = buildGrid([
    "..........",
    "....w.....",
    "..........",
    "..........",
    "..........",
  ]);
  assert.equal(waterEdges(puddle, underlay, 10, 14), MASK_NORTH | MASK_EAST | MASK_SOUTH | MASK_WEST);

  // Water under a bridge still belongs to the lake.
  const bridged = buildGrid([
    "..........",
    ".wrw......",
    "..........",
    "..........",
    "..........",
  ]);
  const bridgeUnderlay = new Array(50).fill(0);
  bridgeUnderlay[12] = WATER_ID;
  assert.equal(waterEdges(bridged, bridgeUnderlay, 10, 11) & MASK_EAST, 0);
  assert.equal(waterEdges(bridged, bridgeUnderlay, 10, 13) & MASK_WEST, 0);
}

function testForestDensity() {
  const grid = buildGrid([
    "f...ff....",
    "....ff....",
    "....f.....",
    "..........",
    "..........",
  ]);
  assert.equal(forestDensity(grid, 10, 0), 0);
  assert.equal(forestDensity(grid, 10, 5), 1);
  assert.equal(forestDensity(grid, 10, 14), 2);
  assert.equal(forestDensity(grid, 10, 24), 1);
  assert.equal(forestDensity(grid, 10, 1), 0);
}

function assertContinuous(path, loop) {
  const steps = loop ? path.length : path.length - 1;
  for (let position = 0; position < steps; position += 1) {
    const from = path[position];
    const to = path[(position + 1) % path.length];
    const rowStep = Math.abs(Math.floor(to / 10) - Math.floor(from / 10));
    const columnStep = Math.abs((to % 10) - (from % 10));
    assert.equal(rowStep + columnStep, 1, `${from} does not touch ${to}`);
  }
}

function testConnectedComponents() {
  const grid = buildGrid([
    "ff...f....",
    "f.........",
    "..........",
    "....ww....",
    "..........",
  ]);
  const forests = connectedComponents(grid, 10, [FOREST_ID]);
  assert.equal(forests.length, 2);
  assert.deepEqual(forests[0], [0, 1, 10]);
  assert.deepEqual(forests[1], [5]);
  assert.deepEqual(connectedComponents(grid, 10, [WATER_ID]), [[34, 35]]);
  assert.deepEqual(connectedComponents(null, 10, [FOREST_ID]), []);
}

function testRoadPaths() {
  const loop = buildGrid([
    "..........",
    ".rrr......",
    ".r.r......",
    ".rrr......",
    "..........",
  ]);
  const loopRoads = roadPaths(loop, 10);
  assert.equal(loopRoads.length, 1);
  assert.equal(loopRoads[0].loop, true);
  assert.equal(loopRoads[0].path.length, 8);
  assertContinuous(loopRoads[0].path, true);

  const branch = buildGrid([
    "rrrr......",
    "..r.......",
    "..r.......",
    "..........",
    "....r.....",
  ]);
  const roads = roadPaths(branch, 10);
  assert.equal(roads.length, 2);
  const [big, lone] = roads.sort((left, right) => right.cells.length - left.cells.length);
  assert.equal(big.loop, false);
  assert.equal(lone.cells.length, 1);
  assert.deepEqual(lone.path, [44]);
  // A branching road is still walked without a single jump.
  assert.equal(new Set(big.path).size, big.cells.length);
  assertContinuous(big.path, true);

  // Rails are a separate network and no road path picks them up.
  assert.deepEqual(railPaths(loop, 10), []);
}

function testLakesAndForests() {
  const grid = buildGrid([
    "www.......",
    "..........",
    ".....wwwww",
    "..........",
    "fffff.f...",
    ]);
  const underlay = new Array(50).fill(0);
  const found = lakes(grid, underlay, 10).sort((left, right) => right.size - left.size);
  assert.equal(found.length, 2);
  assert.deepEqual(found.map((lake) => lake.size), [5, 3]);
  // Only the lake of four or more cells is big enough for a duck.
  assert.equal(found.filter((lake) => lake.size >= 4).length, 1);

  const clusters = forestClusters(grid, 10).sort((left, right) => right.size - left.size);
  assert.deepEqual(clusters.map((cluster) => cluster.size), [5, 1]);
  assert.equal(clusters.filter((cluster) => cluster.size >= 6).length, 0);
  assertContinuous(clusters[0].path, true);

  // A bridge keeps the lake underneath in one piece.
  const split = buildGrid([
    "..........",
    "wwrww.....",
    "..........",
    "..........",
    "..........",
  ]);
  const bridgeUnderlay = new Array(50).fill(0);
  bridgeUnderlay[12] = WATER_ID;
  const joined = lakes(split, bridgeUnderlay, 10);
  assert.equal(joined.length, 1);
  assert.equal(joined[0].size, 5);
}

function testHouseDoor() {
  const grid = buildGrid([
    "h.rh......",
    "..........",
    ".r........",
    ".h........",
    "..........",
  ]);
  // With no street at all the door faces the reader.
  assert.equal(houseDoor(grid, 10, 0), "s");
  // A road to the west turns the door west.
  assert.equal(houseDoor(grid, 10, 3), "w");
  // A road to the north turns the door north.
  assert.equal(houseDoor(grid, 10, 31), "n");
  assert.equal(houseDoor(grid, 10, 1), null);

  // The street below wins over the street above: the door faces the reader.
  const between = buildGrid([
    "r.........",
    "h.........",
    "r.........",
    "..........",
    "..........",
  ]);
  assert.equal(houseDoor(between, 10, 10), "s");
}

function testFieldStages() {
  const state = openWorld("size-2");
  const world = currentWorld(state);

  assert.equal(paintCell(state, 5, FIELD_ID, 1000), true);
  assert.equal(world.planted[5], 1000);
  assert.equal(fieldStage(state, 5, 1000), 0);
  assert.equal(fieldStage(state, 5, 1000 + FIELD_SHOOT_MS - 1), 0);
  assert.equal(fieldStage(state, 5, 1000 + FIELD_SHOOT_MS), 1);
  assert.equal(fieldStage(state, 5, 1000 + FIELD_RIPE_MS), 2);
  assert.equal(fieldStage(state, 5, 1000 + FIELD_RIPE_MS * 5), 2);
  // A cell that holds no field has no stage.
  assert.equal(fieldStage(state, 6, 5000), -1);

  // Painting over a field forgets when it was sown; sowing again starts over.
  assert.equal(paintCell(state, 5, MEADOW_ID, 2000), true);
  assert.equal(world.planted[5], undefined);
  assert.equal(paintCell(state, 5, FIELD_ID, 90000), true);
  assert.equal(fieldStage(state, 5, 90000), 0);

  assert.equal(clearWorld(state), true);
  assert.deepEqual(currentWorld(state).planted, {});
}

function testWideBrush() {
  const size = worldSizeById("size-1");
  assert.deepEqual(brushCells(size, 0, 1), [0]);
  assert.deepEqual(brushCells(size, 11, 2), [11, 12, 21, 22]);
  // The square is clipped where the world ends.
  assert.deepEqual(brushCells(size, 9, 2), [9, 19]);
  assert.deepEqual(brushCells(size, 45, 2), [45, 46]);
  assert.deepEqual(brushCells(size, 49, 2), [49]);
  assert.deepEqual(brushCells(size, 99, 2), []);
  assert.deepEqual(brushCells(size, 0, 0), []);
}

function testRailPathsAndBigBucket() {
  const state = openWorld("size-5");
  const world = currentWorld(state);
  const size = worldSize(world);
  const grid = world.grid;

  // A railway line across the world, with a road crossing it.
  const railRow = 4;
  const rail = Array.from({ length: 20 }, (_, step) => railRow * size.columns + 3 + step);
  assert.equal(paintStroke(state, rail, RAILS_ID), 20);
  const road = Array.from({ length: 6 }, (_, step) => (railRow - 3 + step) * size.columns + 8);
  paintStroke(state, road.filter((index) => index !== rail[5]), PATH_ID);

  const rails = railPaths(grid, size.columns);
  assert.equal(rails.length, 1);
  assert.equal(rails[0].cells.length, 20);
  assert.equal(rails[0].loop, false);
  // The road never joins the railway, so the train and the car stay apart.
  const roads = roadPaths(grid, size.columns);
  assert.equal(roads.every((track) => !track.cells.some((cell) => rail.includes(cell))), true);

  // The bucket fills the rest of the world in one go.
  const painted = paintedCount(state);
  const filled = floodFill(state, size.cellCount - 1, MEADOW_ID);
  assert.equal(filled, size.cellCount - painted);
  assert.equal(isWorldComplete(state), true);
}

function testWindmillAndLighthouse() {
  const columns = 10;
  const grid = new Array(50).fill(0);
  const underlay = new Array(50).fill(0);
  grid[11] = WINDMILL_ID;
  grid[31] = WINDMILL_ID;
  grid[21] = FIELD_ID;
  assert.equal(windmillTurns(grid, columns, 11), true);
  assert.equal(windmillTurns(grid, columns, 31), true);
  grid[21] = MEADOW_ID;
  assert.equal(windmillTurns(grid, columns, 11), false);
  assert.equal(windmillTurns(grid, columns, 12), false);

  grid[5] = LIGHTHOUSE_ID;
  assert.equal(lighthouseBlinks(grid, underlay, columns, 5), false);
  grid[6] = WATER_ID;
  assert.equal(lighthouseBlinks(grid, underlay, columns, 5), true);
  // Water hidden under a bridge still counts as the sea.
  grid[6] = PATH_ID;
  underlay[6] = WATER_ID;
  assert.equal(lighthouseBlinks(grid, underlay, columns, 5), true);
}

function testWorldShelf() {
  const state = createGameState(ALL_BLOCK_IDS);
  assert.deepEqual(state.worlds, []);
  assert.equal(state.currentWorldId, null);
  assert.equal(currentWorld(state), null);

  const first = createWorld(state, "size-1", 1000);
  assert.equal(first.grid.length, 50);
  assert.equal(first.underlay.length, 50);
  assert.equal(first.createdAt, 1000);
  assert.equal(state.currentWorldId, first.id);

  const second = createWorld(state, "size-5", 2000);
  assert.equal(second.grid.length, 1152);
  // A new world goes to the end of the shelf and opens at once.
  assert.deepEqual(state.worlds.map((world) => world.id), [first.id, second.id]);
  assert.equal(state.currentWorldId, second.id);
  assert.notEqual(first.id, second.id);

  // An unknown size makes no world at all.
  assert.equal(createWorld(state, "size-9", 3000), null);
  assert.equal(state.worlds.length, 2);
  assert.equal(state.currentWorldId, second.id);

  assert.equal(selectWorld(state, first.id), true);
  assert.equal(currentWorld(state).id, first.id);
  assert.equal(selectWorld(state, "w-nothing"), false);
  assert.equal(state.currentWorldId, first.id);

  // Deleting the open world opens the one that is left.
  assert.equal(deleteWorld(state, "w-nothing"), false);
  assert.equal(deleteWorld(state, first.id), true);
  assert.equal(state.currentWorldId, second.id);
  assert.equal(worldById(state, first.id), null);

  // Deleting the last world leaves an empty shelf.
  assert.equal(deleteWorld(state, second.id), true);
  assert.deepEqual(state.worlds, []);
  assert.equal(state.currentWorldId, null);
  // Painting with no world open is refused, not an error.
  assert.equal(paintCell(state, 0, MEADOW_ID), false);
  assert.equal(floodFill(state, 0, MEADOW_ID), 0);
  assert.equal(clearWorld(state), false);
  assert.equal(isWorldComplete(state), false);
}

function testEnabledBlocks() {
  // Garbage in, the three starting blocks out.
  assert.deepEqual(normalizeEnabledBlocks(null), DEFAULT_BLOCK_IDS);
  assert.deepEqual(normalizeEnabledBlocks("blocks"), DEFAULT_BLOCK_IDS);
  assert.deepEqual(normalizeEnabledBlocks([]), DEFAULT_BLOCK_IDS);
  assert.deepEqual(normalizeEnabledBlocks([999, "house", null, 0]), DEFAULT_BLOCK_IDS);
  // The starting blocks are there even when the saved list forgot them.
  assert.deepEqual(normalizeEnabledBlocks([HOUSE_ID]).includes(HOUSE_ID), true);
  DEFAULT_BLOCK_IDS.forEach((blockId) => {
    assert.equal(normalizeEnabledBlocks([HOUSE_ID]).includes(blockId), true);
  });
  // The palette always follows the order of the block table.
  const enabled = normalizeEnabledBlocks([HOUSE_ID, HOUSE_ID, MEADOW_ID]);
  assert.deepEqual(enabled, [...enabled].sort((left, right) => left - right));

  const state = createGameState(null);
  createWorld(state, "size-1", 1000);
  assert.equal(isBlockEnabled(state, FOREST_ID), true);
  assert.equal(isBlockEnabled(state, HOUSE_ID), false);
  assert.equal(isBlockEnabled(state, EMPTY_CELL), false);

  // A block an adult has not enabled cannot be painted.
  assert.equal(paintCell(state, 0, HOUSE_ID), false);
  assert.equal(floodFill(state, 0, HOUSE_ID), 0);
  assert.equal(paintedCount(state), 0);

  // Enabling it makes the very same paint work.
  state.enabledBlockIds = normalizeEnabledBlocks([HOUSE_ID]);
  assert.equal(paintCell(state, 0, HOUSE_ID), true);
  assert.equal(paintedCount(state), 1);
}

function testPaintingAndPaintOver() {
  const state = openWorld();
  assert.equal(paintCell(state, 0, MEADOW_ID), true);
  assert.equal(paintCell(state, 0, MEADOW_ID), false);
  assert.equal(paintCell(state, 0, FOREST_ID), true);
  assert.equal(currentWorld(state).grid[0], FOREST_ID);
  assert.equal(paintedCount(state), 1);

  assert.equal(paintStroke(state, [1, 2, 3], PATH_ID), 3);
  assert.equal(paintStroke(state, [1, 2, 3], PATH_ID), 0);
  assert.equal(paintStroke(state, "not a list", PATH_ID), 0);
  assert.equal(paintedCount(state), 4);
}

function testRefusedInput() {
  const state = openWorld();
  assert.equal(paintCell(state, -1, MEADOW_ID), false);
  assert.equal(paintCell(state, 50, MEADOW_ID), false);
  assert.equal(paintCell(state, 1.5, MEADOW_ID), false);
  assert.equal(paintCell(state, "3", MEADOW_ID), false);
  assert.equal(paintCell(state, 0, EMPTY_CELL), false);
  assert.equal(paintCell(state, 0, 999), false);
  assert.equal(paintedCount(state), 0);
}

function testCompletion() {
  const state = openWorld();
  assert.equal(isWorldComplete(state), false);

  // One hole left is not a finished world.
  const indices = Array.from({ length: 49 }, (_, index) => index);
  assert.equal(paintStroke(state, indices, MEADOW_ID), 49);
  assert.equal(isWorldComplete(state), false);

  assert.equal(paintCell(state, 49, MEADOW_ID), true);
  assert.equal(isWorldComplete(state), true);

  // A finished world keeps its painting when another world is cleared.
  const finished = currentWorld(state).id;
  const fresh = createWorld(state, "size-1", 2000);
  assert.equal(paintCell(state, 0, FOREST_ID), true);
  assert.equal(clearWorld(state, fresh.id), true);
  assert.equal(paintedCount(state, fresh.id), 0);
  assert.equal(paintedCount(state, finished), 50);
  assert.equal(isWorldComplete(state, finished), true);
}

function testFloodFill() {
  const state = openWorld();
  // A lake of three cells inside an otherwise empty world.
  paintStroke(state, [11, 12, 13], WATER_ID);

  assert.equal(floodFill(state, 12, FOREST_ID), 3);
  assert.equal(currentWorld(state).grid[11], FOREST_ID);
  assert.equal(currentWorld(state).grid[13], FOREST_ID);
  assert.equal(paintedCount(state), 3);

  // The empty area around it is one connected region too.
  assert.equal(floodFill(state, 0, MEADOW_ID), 47);
  assert.equal(isWorldComplete(state), true);

  assert.equal(floodFill(state, 0, MEADOW_ID), 0);
  assert.equal(floodFill(state, -1, MEADOW_ID), 0);
  assert.equal(floodFill(state, 0, 999), 0);
}

function testBridgeOverWater() {
  const state = openWorld();
  const world = currentWorld(state);
  assert.equal(paintCell(state, 5, WATER_ID), true);
  assert.equal(world.underlay[5], EMPTY_CELL);

  // A road over water keeps the road on top and the water underneath.
  assert.equal(paintCell(state, 5, PATH_ID), true);
  assert.equal(world.grid[5], PATH_ID);
  assert.equal(world.underlay[5], WATER_ID);
  assert.equal(paintCell(state, 5, PATH_ID), false);

  // Water painted over a bridge gives plain water back.
  assert.equal(paintCell(state, 5, WATER_ID), true);
  assert.equal(world.grid[5], WATER_ID);
  assert.equal(world.underlay[5], EMPTY_CELL);

  // Anything that is not a road simply replaces the water.
  assert.equal(paintCell(state, 5, FOREST_ID), true);
  assert.equal(world.underlay[5], EMPTY_CELL);

  // A road on dry land is not a bridge.
  assert.equal(paintCell(state, 6, PATH_ID), true);
  assert.equal(world.underlay[6], EMPTY_CELL);

  // A forest over a bridge forgets the water for good.
  paintCell(state, 7, WATER_ID);
  paintCell(state, 7, PATH_ID);
  assert.equal(world.underlay[7], WATER_ID);
  assert.equal(paintCell(state, 7, FOREST_ID), true);
  assert.equal(world.underlay[7], EMPTY_CELL);
}

function testSaveRoundTrip() {
  const state = createGameState(ALL_BLOCK_IDS);
  const small = createWorld(state, "size-1", 1000);
  paintCell(state, 4, WATER_ID);
  paintCell(state, 4, PATH_ID);
  paintCell(state, 5, FIELD_ID, 4200);
  const big = createWorld(state, "size-4", 2000);
  paintCell(state, 9, WATER_ID);
  paintCell(state, 9, PATH_ID);
  paintCell(state, 10, MEADOW_ID);
  big.celebrated = true;
  selectWorld(state, small.id);

  const saved = JSON.parse(JSON.stringify(serializeState(state)));
  assert.deepEqual(saved.worlds.map((world) => world.id), [small.id, big.id]);
  assert.deepEqual(saved.worlds[0].bridges, [4]);
  assert.deepEqual(saved.worlds[1].bridges, [9]);
  // The parallel underlay array never reaches storage.
  assert.equal(saved.worlds[0].underlay, undefined);
  // Enabled blocks belong to the adult's settings, not to the save.
  assert.equal(saved.enabledBlockIds, undefined);

  const restored = normalizeSavedState(saved, ALL_BLOCK_IDS);
  assert.equal(restored.currentWorldId, small.id);
  assert.deepEqual(restored.worlds.map((world) => world.id), [small.id, big.id]);
  restored.worlds.forEach((world, index) => {
    assert.deepEqual(world.grid, state.worlds[index].grid);
    assert.deepEqual(world.underlay, state.worlds[index].underlay);
    assert.deepEqual(world.planted, state.worlds[index].planted);
    assert.equal(world.celebrated, state.worlds[index].celebrated);
    assert.equal(world.sizeId, state.worlds[index].sizeId);
    assert.equal(world.createdAt, state.worlds[index].createdAt);
  });

  // A shelf of finished worlds still writes only a few kilobytes.
  const full = createGameState(ALL_BLOCK_IDS);
  WORLD_SIZES.forEach((size, index) => {
    const world = createWorld(full, size.id, index);
    world.grid = Array.from(
      { length: size.cellCount },
      (_, cell) => ALL_BLOCK_IDS[cell % ALL_BLOCK_IDS.length],
    );
  });
  const bytes = JSON.stringify(serializeState(full)).length;
  assert.equal(bytes < 9000, true, `a full save is ${bytes} bytes`);
}

function testSavedStateNormalization() {
  const empty = normalizeSavedState(null, ALL_BLOCK_IDS);
  assert.deepEqual(empty.worlds, []);
  assert.equal(empty.currentWorldId, null);
  assert.deepEqual(normalizeSavedState("broken", null).enabledBlockIds, DEFAULT_BLOCK_IDS);
  assert.deepEqual(normalizeSavedState({ worlds: "none" }, null).worlds, []);

  const restored = normalizeSavedState({
    currentWorldId: "w-gone",
    worlds: [
      {
        id: "w-one",
        sizeId: "size-1",
        // Too short, and with an unknown id and junk inside it.
        grid: [MEADOW_ID, 999, "water", null, EMPTY_CELL, PATH_ID],
        bridges: [0, 5, 900, "x"],
        planted: { 0: 4200, 1: 900, 7: "soon" },
        celebrated: "yes",
        createdAt: "long ago",
      },
      // A world without a readable size, grid or id is dropped.
      { id: "w-two", sizeId: "size-9", grid: [] },
      { id: "w-three", sizeId: "size-1", grid: "painting" },
      { sizeId: "size-1", grid: [] },
      "not a world",
      null,
      // The same id twice keeps only the first world.
      { id: "w-one", sizeId: "size-2", grid: [] },
    ],
  }, ALL_BLOCK_IDS);

  assert.deepEqual(restored.worlds.map((world) => world.id), ["w-one"]);
  const world = restored.worlds[0];
  assert.equal(world.grid.length, 50);
  assert.deepEqual(world.grid.slice(0, 6), [
    MEADOW_ID,
    EMPTY_CELL,
    EMPTY_CELL,
    EMPTY_CELL,
    EMPTY_CELL,
    PATH_ID,
  ]);
  // Water is remembered only under a road, never under a meadow.
  assert.equal(world.underlay[0], EMPTY_CELL);
  assert.equal(world.underlay[5], WATER_ID);
  // A sowing time survives only where a field really stands.
  assert.deepEqual(world.planted, {});
  assert.equal(world.celebrated, false);
  assert.equal(world.createdAt, 0);
  // An unknown open world falls back to the first world on the shelf.
  assert.equal(restored.currentWorldId, "w-one");

  const oversized = normalizeSavedState({
    worlds: [{ id: "w-big", sizeId: "size-1", grid: new Array(500).fill(MEADOW_ID) }],
  }, ALL_BLOCK_IDS);
  assert.equal(oversized.worlds[0].grid.length, 50);
  assert.equal(paintedCount(oversized, "w-big"), 50);

  // The old ladder save is never read: it holds no worlds at all.
  const ladder = normalizeSavedState({
    currentSheet: "sheet-2",
    unlockedCount: 3,
    grids: { "sheet-1": new Array(50).fill(MEADOW_ID) },
  }, ALL_BLOCK_IDS);
  assert.deepEqual(ladder.worlds, []);
  assert.equal(ladder.currentWorldId, null);
}

function testEverySizeCanBeFilled() {
  const state = createGameState(ALL_BLOCK_IDS);
  WORLD_SIZES.forEach((size, index) => {
    const world = createWorld(state, size.id, index);
    assert.equal(fillWorld(state, MEADOW_ID), size.cellCount);
    assert.equal(isWorldComplete(state, world.id), true);
  });
  assert.equal(state.worlds.length, WORLD_SIZES.length);
}

testRegistries();
testNeighbors();
testStrokeLine();
testNeighborMask();
testRoadTile();
testWaterEdges();
testForestDensity();
testConnectedComponents();
testRoadPaths();
testLakesAndForests();
testHouseDoor();
testFieldStages();
testWideBrush();
testRailPathsAndBigBucket();
testWindmillAndLighthouse();
testWorldShelf();
testEnabledBlocks();
testPaintingAndPaintOver();
testRefusedInput();
testCompletion();
testFloodFill();
testBridgeOverWater();
testSaveRoundTrip();
testSavedStateNormalization();
testEverySizeCanBeFilled();
console.log("Block Town model tests passed.");
