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
testPaintingAndPaintOver();
testRefusedInput();
testCompletionAndUnlockLadder();
testFloodFill();
testBridgeOverWater();
testSavedStateNormalization();
testEverySheetCanBeFilled();
console.log("Block Town model tests passed.");
