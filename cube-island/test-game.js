const assert = require("node:assert/strict");
const {
  LEVELS,
  createGameState,
  isRiverCell,
  isTargetCell,
  isLevelComplete,
  placePlank,
  removePlank,
  advanceLevel,
  normalizeSavedState,
} = require("./game.js");

function fillCurrentLevel(state) {
  LEVELS[state.levelIndex].targetCells.forEach((cell) => {
    assert.equal(placePlank(state, cell.row, cell.column), true);
  });
}

function testLevelBlueprints() {
  assert.equal(LEVELS.length, 5);
  assert.deepEqual(LEVELS.map((level) => level.id), ["bridge", "dock", "raft", "steps", "base"]);

  LEVELS.forEach((level) => {
    const keys = level.targetCells.map((cell) => `${cell.row}:${cell.column}`);
    assert.equal(new Set(keys).size, keys.length);
    level.targetCells.forEach((cell) => {
      assert.equal(isRiverCell(cell.row, cell.column), true);
      assert.equal(isTargetCell(level, cell.row, cell.column), true);
    });
  });
}

function testSafeBuildingAndUndo() {
  const state = createGameState();
  assert.equal(state.levelIndex, 0);
  assert.equal(state.phase, "build");

  assert.equal(placePlank(state, 0, 2), false);
  assert.equal(placePlank(state, 1, 2), true);
  assert.equal(placePlank(state, 1, 2), false);
  assert.equal(removePlank(state, 1, 2), true);
  assert.equal(removePlank(state, 1, 2), false);
  assert.deepEqual(state.placedCells, []);
}

function testAllFiveLevels() {
  const state = createGameState();

  LEVELS.forEach((level, levelIndex) => {
    assert.equal(state.levelIndex, levelIndex);
    assert.equal(isLevelComplete(level, state.placedCells), false);
    fillCurrentLevel(state);
    assert.equal(state.phase, "level-complete");
    assert.equal(state.completed, levelIndex === LEVELS.length - 1);

    if (levelIndex < LEVELS.length - 1) {
      assert.equal(advanceLevel(state), true);
      assert.equal(state.phase, "build");
      assert.deepEqual(state.placedCells, []);
    }
  });

  assert.equal(advanceLevel(state), false);
  assert.equal(removePlank(state, 1, 3), false);
}

function testSavedStateNormalization() {
  const state = normalizeSavedState({
    levelIndex: 1,
    phase: "build",
    placedCells: [
      { row: 1, column: 2 },
      { row: 1, column: 2 },
      { row: 0, column: 2 },
      { row: 0, column: 3 },
    ],
  });

  assert.equal(state.levelIndex, 1);
  assert.equal(state.phase, "build");
  assert.deepEqual(state.placedCells, [
    { row: 1, column: 2 },
    { row: 0, column: 3 },
  ]);

  const finalState = normalizeSavedState({
    levelIndex: 99,
    placedCells: LEVELS.at(-1).targetCells,
  });
  assert.equal(finalState.levelIndex, LEVELS.length - 1);
  assert.equal(finalState.phase, "level-complete");
  assert.equal(finalState.completed, true);
}

testLevelBlueprints();
testSafeBuildingAndUndo();
testAllFiveLevels();
testSavedStateNormalization();
console.log("Cube Island level tests passed.");
