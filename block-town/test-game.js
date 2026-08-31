const assert = require("node:assert/strict");
const {
  EMPTY_CELL,
  WATER_ID,
  BLOCKS,
  SHEETS,
  sheetById,
  isBlockOnSheet,
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
} = require("./game.js");

const PATH_ID = BLOCKS.find((block) => block.key === "path").id;
const MEADOW_ID = BLOCKS.find((block) => block.key === "meadow").id;
const FOREST_ID = BLOCKS.find((block) => block.key === "forest").id;
const HOUSE_ID = BLOCKS.find((block) => block.key === "house").id;

function fillSheet(state, sheetId, blockId) {
  const sheet = sheetById(sheetId);
  selectSheet(state, sheetId);
  const indices = Array.from({ length: sheet.cellCount }, (_, index) => index);
  return paintStroke(state, indices, blockId);
}

// A hand-built 5 x 10 grid, written as rows of single characters.
function buildGrid(rows) {
  const legend = { ".": 0, "m": MEADOW_ID, "r": PATH_ID, "f": FOREST_ID, "w": WATER_ID };
  return rows.join("").split("").map((symbol) => legend[symbol]);
}

function testRegistries() {
  const ids = BLOCKS.map((block) => block.id);
  const keys = BLOCKS.map((block) => block.key);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(ids.includes(EMPTY_CELL), false);

  assert.deepEqual(SHEETS.map((sheet) => sheet.id), [
    "sheet-1",
    "sheet-2",
    "sheet-3",
    "sheet-4",
    "sheet-5",
  ]);
  assert.deepEqual(SHEETS.map((sheet) => sheet.cellCount), [50, 128, 288, 648, 1152]);

  // A block never disappears once a sheet has introduced it.
  SHEETS.forEach((sheet, index) => {
    assert.equal(sheet.cellCount, sheet.rows * sheet.columns);
    if (index === 0) return;
    SHEETS[index - 1].blockIds.forEach((blockId) => {
      assert.equal(isBlockOnSheet(sheet, blockId), true);
    });
  });
  assert.equal(isBlockOnSheet(SHEETS[0], HOUSE_ID), false);
  assert.equal(isBlockOnSheet(SHEETS[1], HOUSE_ID), true);
}

function testNeighbors() {
  const sheet = sheetById("sheet-1");
  assert.deepEqual(neighborIndices(sheet, 0), [1, 10]);
  assert.deepEqual(neighborIndices(sheet, 9), [19, 8]);
  assert.deepEqual(neighborIndices(sheet, 11), [1, 12, 21, 10]);
  assert.deepEqual(neighborIndices(sheet, 49), [39, 48]);
}

function testStrokeLine() {
  const sheet = sheetById("sheet-1");
  assert.deepEqual(lineIndices(sheet, 12, 12), [12]);
  assert.deepEqual(lineIndices(sheet, 10, 14), [10, 11, 12, 13, 14]);
  assert.deepEqual(lineIndices(sheet, 5, 35), [5, 15, 25, 35]);
  assert.deepEqual(lineIndices(sheet, 0, 22), [0, 11, 22]);
  assert.deepEqual(lineIndices(sheet, 22, 0), [22, 11, 0]);
  assert.deepEqual(lineIndices(sheet, 0, 99), []);
  assert.deepEqual(lineIndices(sheet, -1, 4), []);

  // Every step of a line touches a cell next to the previous one.
  const diagonal = lineIndices(sheet, 0, 49);
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
  // Nothing outside the sheet ever counts as a neighbour.
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

function testPaintingAndPaintOver() {
  const state = createGameState();
  assert.equal(paintCell(state, 0, MEADOW_ID), true);
  assert.equal(paintCell(state, 0, MEADOW_ID), false);
  assert.equal(paintCell(state, 0, FOREST_ID), true);
  assert.equal(state.grids["sheet-1"][0], FOREST_ID);
  assert.equal(paintedCount(state), 1);

  assert.equal(paintStroke(state, [1, 2, 3], PATH_ID), 3);
  assert.equal(paintStroke(state, [1, 2, 3], PATH_ID), 0);
  assert.equal(paintStroke(state, "not a list", PATH_ID), 0);
  assert.equal(paintedCount(state), 4);
}

function testRefusedInput() {
  const state = createGameState();
  assert.equal(paintCell(state, -1, MEADOW_ID), false);
  assert.equal(paintCell(state, 50, MEADOW_ID), false);
  assert.equal(paintCell(state, 1.5, MEADOW_ID), false);
  assert.equal(paintCell(state, "3", MEADOW_ID), false);
  assert.equal(paintCell(state, 0, EMPTY_CELL), false);
  assert.equal(paintCell(state, 0, 999), false);
  // A block that belongs to a later sheet cannot be painted here yet.
  assert.equal(paintCell(state, 0, HOUSE_ID), false);
  assert.equal(paintedCount(state), 0);
}

function testCompletionAndUnlockLadder() {
  const state = createGameState();
  assert.equal(isSheetComplete(state), false);
  assert.equal(unlockNextSheet(state), false);

  // One hole left keeps the next sheet locked.
  const indices = Array.from({ length: 49 }, (_, index) => index);
  assert.equal(paintStroke(state, indices, MEADOW_ID), 49);
  assert.equal(isSheetComplete(state), false);
  assert.equal(unlockNextSheet(state), false);
  assert.equal(state.unlockedCount, 1);
  assert.equal(selectSheet(state, "sheet-2"), false);

  assert.equal(paintCell(state, 49, MEADOW_ID), true);
  assert.equal(isSheetComplete(state), true);
  assert.equal(unlockNextSheet(state), true);
  assert.equal(state.unlockedCount, 2);
  assert.equal(unlockNextSheet(state), false);

  assert.equal(selectSheet(state, "sheet-2"), true);
  assert.equal(state.currentSheet, "sheet-2");
  assert.equal(paintCell(state, 0, HOUSE_ID), true);
  assert.equal(unlockNextSheet(state), false);
  assert.equal(state.unlockedCount, 2);

  // A finished sheet keeps its painting when another sheet is cleared.
  assert.equal(clearSheet(state, "sheet-2"), true);
  assert.equal(paintedCount(state, "sheet-2"), 0);
  assert.equal(paintedCount(state, "sheet-1"), 50);
}

function testFloodFill() {
  const state = createGameState();
  // A lake of three cells inside an otherwise empty sheet.
  paintStroke(state, [11, 12, 13], WATER_ID);

  assert.equal(floodFill(state, 12, FOREST_ID), 3);
  assert.equal(state.grids["sheet-1"][11], FOREST_ID);
  assert.equal(state.grids["sheet-1"][13], FOREST_ID);
  assert.equal(paintedCount(state), 3);

  // The empty area around it is one connected region too.
  assert.equal(floodFill(state, 0, MEADOW_ID), 47);
  assert.equal(isSheetComplete(state), true);

  assert.equal(floodFill(state, 0, MEADOW_ID), 0);
  assert.equal(floodFill(state, -1, MEADOW_ID), 0);
  assert.equal(floodFill(state, 0, HOUSE_ID), 0);
}

function testBridgeOverWater() {
  const state = createGameState();
  assert.equal(paintCell(state, 5, WATER_ID), true);
  assert.equal(state.underlays["sheet-1"][5], EMPTY_CELL);

  // A road over water keeps the road on top and the water underneath.
  assert.equal(paintCell(state, 5, PATH_ID), true);
  assert.equal(state.grids["sheet-1"][5], PATH_ID);
  assert.equal(state.underlays["sheet-1"][5], WATER_ID);
  assert.equal(paintCell(state, 5, PATH_ID), false);

  // Water painted over a bridge gives plain water back.
  assert.equal(paintCell(state, 5, WATER_ID), true);
  assert.equal(state.grids["sheet-1"][5], WATER_ID);
  assert.equal(state.underlays["sheet-1"][5], EMPTY_CELL);

  // Anything that is not a road simply replaces the water.
  assert.equal(paintCell(state, 5, FOREST_ID), true);
  assert.equal(state.underlays["sheet-1"][5], EMPTY_CELL);

  // A road on dry land is not a bridge.
  assert.equal(paintCell(state, 6, PATH_ID), true);
  assert.equal(state.underlays["sheet-1"][6], EMPTY_CELL);

  // A forest over a bridge forgets the water for good.
  paintCell(state, 7, WATER_ID);
  paintCell(state, 7, PATH_ID);
  assert.equal(state.underlays["sheet-1"][7], WATER_ID);
  assert.equal(paintCell(state, 7, FOREST_ID), true);
  assert.equal(state.underlays["sheet-1"][7], EMPTY_CELL);
}

function testSavedStateNormalization() {
  const empty = normalizeSavedState(null);
  assert.equal(empty.currentSheet, "sheet-1");
  assert.equal(empty.unlockedCount, 1);
  assert.equal(paintedCount(empty), 0);
  assert.equal(normalizeSavedState("broken").unlockedCount, 1);

  const restored = normalizeSavedState({
    currentSheet: "sheet-2",
    unlockedCount: 2,
    grids: {
      // Too short, and with an unknown id, a locked block and junk inside it.
      "sheet-1": [MEADOW_ID, 999, HOUSE_ID, "water", null, PATH_ID],
      "sheet-2": [HOUSE_ID],
    },
    underlays: { "sheet-1": [WATER_ID, WATER_ID, 0, 0, 0, WATER_ID] },
    celebrated: { "sheet-1": true, "sheet-2": "yes" },
  });

  assert.equal(restored.grids["sheet-1"].length, 50);
  assert.deepEqual(restored.grids["sheet-1"].slice(0, 6), [
    MEADOW_ID,
    EMPTY_CELL,
    EMPTY_CELL,
    EMPTY_CELL,
    EMPTY_CELL,
    PATH_ID,
  ]);
  // Water is remembered only under a road, never under a meadow.
  assert.equal(restored.underlays["sheet-1"][0], EMPTY_CELL);
  assert.equal(restored.underlays["sheet-1"][5], WATER_ID);
  assert.equal(restored.grids["sheet-2"][0], HOUSE_ID);
  assert.equal(restored.celebrated["sheet-1"], true);
  assert.equal(restored.celebrated["sheet-2"], false);
  assert.equal(restored.currentSheet, "sheet-2");

  // A sheet that is not unlocked cannot be the current one.
  const locked = normalizeSavedState({ currentSheet: "sheet-5", unlockedCount: 2 });
  assert.equal(locked.currentSheet, "sheet-1");
  const overflow = normalizeSavedState({ unlockedCount: 99 });
  assert.equal(overflow.unlockedCount, SHEETS.length);
  const longGrid = normalizeSavedState({
    grids: { "sheet-1": new Array(500).fill(MEADOW_ID) },
  });
  assert.equal(longGrid.grids["sheet-1"].length, 50);
  assert.equal(paintedCount(longGrid), 50);
}

function testEverySheetCanBeFilled() {
  const state = createGameState();
  SHEETS.forEach((sheet, index) => {
    assert.equal(fillSheet(state, sheet.id, MEADOW_ID), sheet.cellCount);
    assert.equal(isSheetComplete(state, sheet.id), true);
    assert.equal(unlockNextSheet(state), index < SHEETS.length - 1);
  });
  assert.equal(state.unlockedCount, SHEETS.length);
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
testPaintingAndPaintOver();
testRefusedInput();
testCompletionAndUnlockLadder();
testFloodFill();
testBridgeOverWater();
testSavedStateNormalization();
testEverySheetCanBeFilled();
console.log("Block Town model tests passed.");
