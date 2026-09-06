const assert = require("node:assert/strict");
const {
  EMPTY_CELL,
  WATER_ID,
  BLOCKS,
  WORLD_SIZES,
  DEFAULT_BLOCK_IDS,
  worldSizeById,
  worldSize,
  gridDimensionsForCellSize,
  normalizeEnabledBlocks,
  enableBlock,
  lockedBlockIds,
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
  roadPlaza,
  roadInnerCorners,
  waterEdges,
  waterInnerCorners,
  CORNER_NE,
  CORNER_SE,
  CORNER_SW,
  CORNER_NW,
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
  houseHasStreet,
  spreadPick,
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
function openWorld(sizeId = "size-1", enabledBlockIds = ALL_BLOCK_IDS, dimensions) {
  const state = createGameState(enabledBlockIds);
  createWorld(state, sizeId, 1000, dimensions);
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
  assert.deepEqual(WORLD_SIZES.map((size) => size.cellSize), [120, 80, 56, 40, 28]);
  // The fixed dimensions are only the fallback for saves made before worlds
  // recorded their own screen-derived geometry.
  assert.deepEqual(WORLD_SIZES.map((size) => size.cellCount), [50, 128, 288, 648, 1152]);
  WORLD_SIZES.forEach((size) => {
    assert.equal(size.cellCount, size.rows * size.columns);
    assert.equal(size.tools.includes("brush"), true);
  });
  assert.deepEqual(WORLD_SIZES.map((size) => size.tools.includes("bucket")), [false, false, false, true, true]);

  // The blocks a world starts with are real blocks.
  assert.equal(DEFAULT_BLOCK_IDS.length, 3);
  DEFAULT_BLOCK_IDS.forEach((blockId) => {
    assert.equal(ids.includes(blockId), true);
  });
}

function testGridDimensions() {
  assert.deepEqual(gridDimensionsForCellSize("size-1", 1260, 608), { rows: 5, columns: 10 });
  assert.deepEqual(gridDimensionsForCellSize("size-2", 1260, 608), { rows: 7, columns: 15 });
  assert.deepEqual(gridDimensionsForCellSize("size-3", 1260, 608), { rows: 10, columns: 22 });
  assert.deepEqual(gridDimensionsForCellSize("size-4", 1260, 608), { rows: 15, columns: 31 });
  assert.deepEqual(gridDimensionsForCellSize("size-5", 1260, 608), { rows: 21, columns: 45 });
  assert.deepEqual(gridDimensionsForCellSize("size-1", 40, 20), { rows: 1, columns: 1 });
  // However large the screen, one world stays a world.
  assert.deepEqual(gridDimensionsForCellSize("size-5", 100000, 100000), { rows: 100, columns: 200 });
  assert.equal(gridDimensionsForCellSize("size-9", 1260, 608), null);
  assert.equal(gridDimensionsForCellSize("size-1", 0, 608), null);
  assert.equal(gridDimensionsForCellSize("size-1", 1260, Number.NaN), null);
}

// A world carries its own rows and columns. What a save cannot tell is filled
// in from the fixed size of its cell-size choice, so a painting is never lost
// to a damaged number.
function testSavedGeometry() {
  const fixed = worldSizeById("size-2");
  assert.deepEqual(worldSize({ sizeId: "size-2", rows: 7, columns: 15 }), {
    ...fixed,
    rows: 7,
    columns: 15,
    cellCount: 105,
  });
  assert.equal(worldSize({ sizeId: "size-2" }), fixed);
  assert.equal(worldSize({ sizeId: "size-2", rows: 7 }), fixed);
  assert.equal(worldSize({ sizeId: "size-2", columns: 15 }), fixed);
  assert.equal(worldSize({ sizeId: "size-2", rows: 0, columns: 16 }), fixed);
  assert.equal(worldSize({ sizeId: "size-2", rows: 8.5, columns: 16 }), fixed);
  assert.equal(worldSize({ sizeId: "size-2", rows: "8", columns: 16 }), fixed);
  assert.equal(worldSize({ sizeId: "size-2", rows: 101, columns: 16 }), fixed);
  assert.equal(worldSize({ sizeId: "size-2", rows: 8, columns: 201 }), fixed);
  assert.equal(worldSize({ sizeId: "size-2", rows: 100, columns: 200 }).cellCount, 20000);
  // Only a size that does not exist has no answer at all.
  assert.equal(worldSize({ sizeId: "size-9", rows: 5, columns: 10 }), null);

  // Without a measurement a new world falls back to the fixed grid.
  const state = createGameState(ALL_BLOCK_IDS);
  const world = createWorld(state, "size-5", 1000, null);
  assert.equal(world.rows, 24);
  assert.equal(world.columns, 48);
  assert.equal(world.grid.length, 1152);
  assert.equal(world.underlay.length, 1152);
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
  assert.equal(roadTile(line, [], 10, 1).plaza, false);

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

function testWaterInnerCorners() {
  // Where the lake bends, the cell at the bend gets an inside corner toward
  // the land in the diagonal; a straight shore and a lone puddle get none.
  const bend = buildGrid([
    "..........",
    ".ww.......",
    ".www......",
    ".www......",
    "..........",
  ]);
  const underlay = new Array(50).fill(0);
  assert.equal(waterInnerCorners(bend, underlay, 10, 22), CORNER_NE);
  assert.equal(waterInnerCorners(bend, underlay, 10, 11), 0);
  assert.equal(waterInnerCorners(bend, underlay, 10, 23), 0);
  assert.equal(waterInnerCorners(bend, underlay, 10, 32), 0);
  assert.equal(waterInnerCorners(bend, underlay, 10, 0), 0);

  // A hole in the middle of a lake gives all four cells around it a corner.
  const ring = buildGrid([
    "..........",
    ".www......",
    ".w.w......",
    ".www......",
    "..........",
  ]);
  assert.equal(waterInnerCorners(ring, underlay, 10, 11), CORNER_SE);
  assert.equal(waterInnerCorners(ring, underlay, 10, 13), CORNER_SW);
  assert.equal(waterInnerCorners(ring, underlay, 10, 31), CORNER_NE);
  assert.equal(waterInnerCorners(ring, underlay, 10, 33), CORNER_NW);

  // A bridge in the diagonal is still water, so the bend stays smooth.
  const bridged = buildGrid([
    "..........",
    ".wr.......",
    ".www......",
    "..........",
    "..........",
  ]);
  const bridgeUnderlay = new Array(50).fill(0);
  bridgeUnderlay[12] = WATER_ID;
  assert.equal(waterInnerCorners(bridged, bridgeUnderlay, 10, 21), 0);
  assert.equal(waterInnerCorners(bridged, underlay, 10, 21), CORNER_NE);
}

function testRoadPlaza() {
  // Every cell of a 2 x 2 block of road is part of a square; the tail that
  // hangs off it is not, and neither is a plain line.
  const square = buildGrid([
    "..........",
    ".rr.......",
    ".rr.......",
    ".r........",
    "..........",
  ]);
  [11, 12, 21, 22].forEach((index) => assert.equal(roadPlaza(square, 10, index), true));
  assert.equal(roadPlaza(square, 10, 31), false);
  assert.equal(roadPlaza(square, 10, 0), false);
  assert.equal(roadTile(square, [], 10, 11).plaza, true);
  assert.equal(roadTile(square, [], 10, 31).plaza, false);

  const line = buildGrid([
    "..........",
    ".rrrr.....",
    "..........",
    "..........",
    "..........",
  ]);
  assert.equal(roadPlaza(line, 10, 12), false);

  // Rails next to a path are another network: no square across the two.
  const mixed = buildGrid([
    "..........",
    ".rr.......",
    ".rr.......",
    "..........",
    "..........",
  ]);
  mixed[21] = RAILS_ID;
  mixed[22] = RAILS_ID;
  assert.equal(roadPlaza(mixed, 10, 11), false);
  assert.equal(roadPlaza(mixed, 10, 21), false);
}

function testRoadInnerCorners() {
  // A T of single roads has an inside corner on each side of the branch; a
  // straight line and a lone cell have none.
  const tee = buildGrid([
    "..........",
    "..r.......",
    ".rrr......",
    "..........",
    "..........",
  ]);
  assert.equal(roadInnerCorners(tee, 10, 22), CORNER_NE | CORNER_NW);
  assert.equal(roadInnerCorners(tee, 10, 12), 0);
  assert.equal(roadInnerCorners(tee, 10, 21), 0);
  assert.equal(roadTile(tee, [], 10, 22).inner, CORNER_NE | CORNER_NW);

  // Where a line joins a square, the cell at the join fills its corner.
  const join = buildGrid([
    "..........",
    "...rr.....",
    ".rrrr.....",
    "..........",
    "..........",
  ]);
  assert.equal(roadInnerCorners(join, 10, 23), CORNER_NW);
  assert.equal(roadInnerCorners(join, 10, 24), 0);
  assert.equal(roadInnerCorners(join, 10, 0), 0);
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

// Two cells next to each other in a path must be next to each other on the
// world. With `loop` the wrap from the last cell back to the first is checked
// too: the sprite loop takes that step like any other.
function assertContinuous(path, loop, columns = 10) {
  const steps = loop ? path.length : path.length - 1;
  for (let position = 0; position < steps; position += 1) {
    const from = path[position];
    const to = path[(position + 1) % path.length];
    const rowStep = Math.abs(Math.floor(to / columns) - Math.floor(from / columns));
    const columnStep = Math.abs((to % columns) - (from % columns));
    assert.equal(rowStep + columnStep, 1, `${from} does not touch ${to}`);
  }
}

// The two ways a track is ordered, on shapes big enough to be interesting.
function testWalkAndLoopOrder() {
  // A ring of sixteen cells, far bigger than the smallest one that closes.
  const ring = buildGrid([
    ".rrrrrr...",
    ".r....r...",
    ".r....r...",
    ".rrrrrr...",
    "..........",
  ]);
  const [loop] = roadPaths(ring, 10);
  assert.equal(loop.loop, true);
  assert.equal(loop.cells.length, 16);
  // The ring is walked once round: every cell, each of them once.
  assert.equal(loop.path.length, 16);
  assert.deepEqual([...loop.path].sort((left, right) => left - right), loop.cells);
  assertContinuous(loop.path, true);

  // A comb: three teeth on a spine, so the walk has to step back down a tooth
  // before it can go on to the next one.
  const comb = buildGrid([
    ".r.r.r....",
    ".r.r.r....",
    ".rrrrr....",
    "..........",
    "..........",
  ]);
  const [walk] = roadPaths(comb, 10);
  assert.equal(walk.loop, false);
  // Every cell of the comb is reached; stepping back over one is allowed.
  assert.deepEqual(new Set(walk.path), new Set(walk.cells));
  // The walk never stands still, and it comes back next to where it started.
  assert.notEqual(walk.path.at(-1), walk.path[0]);
  assertContinuous(walk.path, true);
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
  const found = lakes(grid, 10).sort((left, right) => right.size - left.size);
  assert.equal(found.length, 2);
  assert.deepEqual(found.map((lake) => lake.size), [5, 3]);
  // Only the lake of four or more cells is big enough for a duck.
  assert.equal(found.filter((lake) => lake.size >= 4).length, 1);

  const clusters = forestClusters(grid, 10).sort((left, right) => right.size - left.size);
  assert.deepEqual(clusters.map((cluster) => cluster.size), [5, 1]);
  assert.equal(clusters.filter((cluster) => cluster.size >= 6).length, 0);
  assertContinuous(clusters[0].path, true);

  // A bridge stands on the water, so a duck and a boat cannot travel under it:
  // the swim is cut in two and neither half ever runs along the road.
  const split = buildGrid([
    "..........",
    "wwrww.....",
    "..........",
    "..........",
    "..........",
  ]);
  const bridgeUnderlay = new Array(50).fill(0);
  bridgeUnderlay[12] = WATER_ID;
  const cut = lakes(split, 10).sort((left, right) => right.size - left.size);
  assert.deepEqual(cut.map((lake) => lake.size), [2, 2]);
  assert.ok(cut.every((lake) => !lake.path.includes(12)));
  // The water under the bridge is still water, so the lake keeps its shores.
  assert.equal(waterEdges(split, bridgeUnderlay, 10, 12) & (MASK_EAST | MASK_WEST), 0);
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

function testHouseHasStreet() {
  // A road on each of the four sides counts; a lone house does not.
  const grid = buildGrid([
    ".r........",
    "rhr.......",
    ".r........",
    "....h.....",
    "..........",
  ]);
  assert.equal(houseHasStreet(grid, 10, 11), true);
  assert.equal(houseHasStreet(grid, 10, 34), false);
  assert.equal(houseHasStreet(grid, 10, 1), false);
  // One road on one side is enough, whichever side it is.
  [
    [".r.", ".h.", "..."],
    ["...", ".hr", "..."],
    ["...", ".h.", ".r."],
    ["...", "rh.", "..."],
  ].forEach((rows) => assert.equal(houseHasStreet(buildGrid(rows), 3, 4), true));

  // Rails next to a house are not a street.
  const rails = buildGrid(["...", ".h.", "..."]);
  rails[5] = RAILS_ID;
  assert.equal(houseHasStreet(rails, 3, 4), false);
  assert.equal(houseHasStreet(rails, 3, 5), false);
}

function testSpreadPick() {
  const twelve = [...Array(12)].map((_, index) => index * 10);
  assert.deepEqual(spreadPick(twelve, 3), [0, 40, 80]);
  assert.deepEqual(spreadPick([7, 9], 3), [7, 9]);
  assert.deepEqual(spreadPick(twelve, 12), twelve);
  assert.deepEqual(spreadPick(twelve, 0), []);
  assert.deepEqual(spreadPick(null, 3), []);
  // The same list always gives the same picks.
  assert.deepEqual(spreadPick(twelve, 5), spreadPick(twelve, 5));
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

function testEraser() {
  const state = openWorld("size-1");
  const world = currentWorld(state);

  // Erasing an empty cell changes nothing; erasing a painted one empties it.
  assert.equal(paintCell(state, 3, EMPTY_CELL), false);
  assert.equal(paintCell(state, 3, FIELD_ID, 1000), true);
  assert.equal(paintCell(state, 3, EMPTY_CELL), true);
  assert.equal(world.grid[3], EMPTY_CELL);
  assert.equal(world.planted[3], undefined);
  assert.equal(paintedCount(state), 0);

  // A bridge erased takes the water underneath with it.
  assert.equal(paintCell(state, 4, WATER_ID), true);
  assert.equal(paintCell(state, 4, PATH_ID), true);
  assert.equal(world.underlay[4], WATER_ID);
  assert.equal(paintCell(state, 4, EMPTY_CELL), true);
  assert.equal(world.underlay[4], EMPTY_CELL);

  // The bucket never erases.
  assert.equal(paintCell(state, 0, FOREST_ID), true);
  assert.equal(floodFill(state, 0, EMPTY_CELL), 0);

  // Every size offers the eraser.
  WORLD_SIZES.forEach((size) => {
    assert.equal(size.tools.includes("eraser"), true);
  });
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

  const second = createWorld(state, "size-5", 2000, { rows: 21, columns: 45 });
  assert.equal(second.grid.length, 945);
  assert.deepEqual(worldSize(second), {
    ...WORLD_SIZES[4],
    rows: 21,
    columns: 45,
    cellCount: 945,
  });
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

  // Enabling it makes the very same paint work and keeps table order.
  assert.equal(enableBlock(state, HOUSE_ID), true);
  assert.deepEqual(
    state.enabledBlockIds,
    [...state.enabledBlockIds].sort((left, right) => left - right),
  );
  const enabledOnce = [...state.enabledBlockIds];
  assert.equal(enableBlock(state, HOUSE_ID), false);
  assert.deepEqual(state.enabledBlockIds, enabledOnce);
  assert.equal(enableBlock(state, 999), false);
  assert.deepEqual(state.enabledBlockIds, enabledOnce);
  assert.equal(paintCell(state, 0, HOUSE_ID), true);
  assert.equal(paintedCount(state), 1);

  const fresh = createGameState(null);
  const locked = lockedBlockIds(fresh);
  assert.equal(locked.length, 17);
  DEFAULT_BLOCK_IDS.forEach((blockId) => {
    assert.equal(locked.includes(blockId), false);
  });
  BLOCKS.forEach((block) => enableBlock(fresh, block.id));
  assert.deepEqual(lockedBlockIds(fresh), []);
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
  const big = createWorld(state, "size-4", 2000, { rows: 15, columns: 31 });
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
    // Sowing times reach storage in whole seconds, so they come back rounded
    // down to the second. A field ripens over twenty, so nothing is lost.
    assert.deepEqual(world.planted, secondsOnly(state.worlds[index].planted));
    assert.equal(world.celebrated, state.worlds[index].celebrated);
    assert.equal(world.sizeId, state.worlds[index].sizeId);
    assert.equal(world.rows, state.worlds[index].rows);
    assert.equal(world.columns, state.worlds[index].columns);
    assert.equal(world.createdAt, state.worlds[index].createdAt);
  });

  // A shelf of finished worlds still writes only a few kilobytes. The worlds
  // are painted through paintCell, so the sowing times are counted in too.
  const mixed = fullShelfBytes((cell) => ALL_BLOCK_IDS[cell % ALL_BLOCK_IDS.length]);
  assert.equal(mixed < 8000, true, `a full shelf is ${mixed} bytes`);

  // Only a field keeps the moment it was sown, so a shelf of nothing but
  // fields is the largest save the game can write.
  const fields = fullShelfBytes(() => FIELD_ID);
  assert.equal(fields < 28000, true, `a shelf of fields is ${fields} bytes`);
}

function secondsOnly(planted) {
  return Object.fromEntries(
    Object.entries(planted).map(([index, time]) => [index, Math.floor(time / 1000) * 1000]),
  );
}

// One world of every size, painted cell by cell a second apart, the way a save
// really grows.
function fullShelfBytes(blockFor) {
  const shelf = createGameState(ALL_BLOCK_IDS);
  const start = Date.now();
  WORLD_SIZES.forEach((size) => {
    createWorld(shelf, size.id, start);
    for (let cell = 0; cell < size.cellCount; cell += 1) {
      paintCell(shelf, cell, blockFor(cell), start + cell * 1000);
    }
  });
  return JSON.stringify(serializeState(shelf)).length;
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
  assert.equal(world.rows, 5);
  assert.equal(world.columns, 10);
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

  // Geometry that cannot be read keeps the world and the fixed size of its
  // cell-size choice; only a world without a readable size is dropped.
  const invalidDimensions = normalizeSavedState({
    worlds: [
      { id: "w-flat", sizeId: "size-2", rows: 0, columns: 16, grid: [MEADOW_ID] },
      { id: "w-lost", sizeId: "size-9", rows: 5, columns: 10, grid: [MEADOW_ID] },
    ],
  }, ALL_BLOCK_IDS);
  assert.deepEqual(invalidDimensions.worlds.map((world) => world.id), ["w-flat"]);
  assert.equal(invalidDimensions.worlds[0].rows, 8);
  assert.equal(invalidDimensions.worlds[0].columns, 16);
  assert.equal(invalidDimensions.worlds[0].grid.length, 128);
  assert.equal(invalidDimensions.worlds[0].grid[0], MEADOW_ID);

  const oversized = normalizeSavedState({
    worlds: [{ id: "w-big", sizeId: "size-1", grid: new Array(500).fill(MEADOW_ID) }],
  }, ALL_BLOCK_IDS);
  assert.equal(oversized.worlds[0].grid.length, 50);
  assert.equal(paintedCount(oversized, "w-big"), 50);

  // A save written before the sowing times were shrunk holds a full epoch in
  // milliseconds and no base at all. It is still read exactly as it stands.
  const millisecondEpoch = 1700000000000;
  const older = normalizeSavedState({
    worlds: [{
      id: "w-old",
      sizeId: "size-1",
      grid: [FIELD_ID, FIELD_ID],
      planted: { 0: millisecondEpoch, 1: millisecondEpoch - 30000 },
    }],
  }, ALL_BLOCK_IDS, millisecondEpoch + 1000);
  assert.deepEqual(older.worlds[0].planted, {
    0: millisecondEpoch,
    1: millisecondEpoch - 30000,
  });

  // A sowing time in the future cannot be real: a clock that moved, or a
  // damaged write. A field sown in the future would never ripen, so the time is
  // dropped and the field simply shows as grown.
  const ahead = normalizeSavedState({
    worlds: [{
      id: "w-ahead",
      sizeId: "size-1",
      grid: [FIELD_ID, FIELD_ID],
      plantedBase: 1700,
      planted: { 0: 0, 1: 900 },
    }],
  }, ALL_BLOCK_IDS, 1700500);
  assert.deepEqual(ahead.worlds[0].planted, { 0: 1700000 });
  assert.equal(fieldStage(ahead, 1, 1700500), 2);

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
  const adaptive = createWorld(state, "size-5", 100, { rows: 21, columns: 45 });
  assert.equal(fillWorld(state, MEADOW_ID), 945);
  assert.equal(isWorldComplete(state, adaptive.id), true);
  assert.equal(state.worlds.length, WORLD_SIZES.length + 1);
}

testRegistries();
testGridDimensions();
testSavedGeometry();
testNeighbors();
testStrokeLine();
testNeighborMask();
testRoadTile();
testWaterEdges();
testWaterInnerCorners();
testRoadPlaza();
testRoadInnerCorners();
testForestDensity();
testConnectedComponents();
testRoadPaths();
testWalkAndLoopOrder();
testLakesAndForests();
testHouseDoor();
testHouseHasStreet();
testSpreadPick();
testFieldStages();
testEraser();
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
