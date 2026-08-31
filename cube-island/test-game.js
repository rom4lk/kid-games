const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  BLOCKS,
  LOCATIONS,
  LEVELS,
  VALIDATORS,
  SAVE_VERSION,
  activeObjective,
  advanceLevel,
  allNeighbors,
  applyKnownSolution,
  cellIndex,
  cellPosition,
  computeLightMap,
  createGameState,
  currentLevel,
  evaluateObjective,
  evaluatePlacement,
  getCell,
  migrateLegacyState,
  normalizeSavedState,
  objectiveTargets,
  orthogonalNeighbors,
  placeBlock,
  removeBlock,
  stackHeight,
} = require("./game.js");

function targetBy(level, materialId, height = null) {
  return objectiveTargets(level).find((target) => (
    target.materialId === materialId && (height === null || target.height === height)
  ));
}

function placeTarget(state, target) {
  return placeBlock(state, target.row, target.column, target.materialId);
}

function testRegistriesAndLevelData() {
  assert.deepEqual(Object.keys(BLOCKS), ["wood", "stone", "glass", "glow"]);
  assert.deepEqual(Object.keys(LOCATIONS), ["river", "snow", "canyon", "night"]);
  assert.equal(LEVELS.length, 25);
  assert.deepEqual(LEVELS.map((level) => level.order), Array.from({ length: 25 }, (_, index) => index + 1));
  assert.deepEqual(LEVELS.map((level) => level.chapter), [
    1, 1, 1, 1, 1,
    2, 2, 2, 2, 2,
    3, 3, 3, 3, 3,
    4, 4, 4, 4, 4,
    5, 5, 5, 5, 5,
  ]);
  assert.equal(new Set(LEVELS.map((level) => level.id)).size, 25);

  const knownValidators = new Set([...Object.keys(VALIDATORS), "composite"]);
  LEVELS.forEach((level) => {
    assert.equal(Boolean(LOCATIONS[level.location]), true, `${level.id} has a known location`);
    assert.equal(level.rows >= 3 && level.rows <= 8, true, `${level.id} row limit`);
    assert.equal(level.columns >= 7 && level.columns <= 12, true, `${level.id} column limit`);
    assert.equal(level.terrain.length, level.rows, `${level.id} terrain row count`);
    level.terrain.forEach((row) => assert.equal(row.length, level.columns, `${level.id} terrain width`));
    assert.equal(level.maxHeight >= 1 && level.maxHeight <= 3, true, `${level.id} height limit`);
    assert.equal(level.objectives.length >= 1 && level.objectives.length <= 3, true, `${level.id} task count`);
    assert.equal(level.complication.length > 0, true, `${level.id} complication`);
    assert.equal(level.rewardText.length > 0, true, `${level.id} result`);
    assert.equal(level.solution.length > 0, true, `${level.id} solution fixture`);
    level.availableMaterials.forEach((materialId) => assert.equal(Boolean(BLOCKS[materialId]), true));
    Object.values(level.inventory).forEach((count) => assert.equal(count >= 0, true));
    level.objectives.forEach((objective) => {
      assert.equal(knownValidators.has(objective.validator), true, `${level.id} validator ${objective.validator}`);
      assert.equal(Array.isArray(objective.dependsOn), true);
    });
  });

  assert.equal(LEVELS[0].columns, 7);
  assert.equal(LEVELS[0].rows, 3);
  assert.equal(LEVELS.at(-1).columns, 12);
  assert.equal(LEVELS.at(-1).rows, 8);
}

function testGridHelpers() {
  assert.equal(cellIndex(2, 3, 7), 17);
  assert.deepEqual(cellPosition(17, 7), { row: 2, column: 3 });
  assert.deepEqual(orthogonalNeighbors(4, 3, 3).sort((a, b) => a - b), [1, 3, 5, 7]);
  assert.equal(allNeighbors(4, 3, 3).length, 8);
  assert.equal(allNeighbors(0, 3, 3).length, 3);
}

function testAllKnownSolutionsAndCampaignFlow() {
  const campaign = createGameState();
  LEVELS.forEach((level, index) => {
    assert.equal(campaign.currentLevelIndex, index);
    const result = applyKnownSolution(campaign);
    assert.equal(result.complete, true, `${level.id} known solution completes`);
    assert.deepEqual(result.pending, [], `${level.id} consumes its fixture`);
    assert.equal(campaign.completedLevelIds.includes(level.id), true);
    assert.equal(campaign.completed, index === LEVELS.length - 1);
    if (index < LEVELS.length - 1) assert.equal(advanceLevel(campaign), true);
  });
  assert.equal(advanceLevel(campaign), false);
}

function testRefusalsNeverSpendBlocks() {
  const state = createGameState(5);
  const level = currentLevel(state);
  const thinIceIndex = cellIndex(0, 3, level.columns);
  const before = state.currentLevelState.inventory.stone;
  const refusal = evaluatePlacement(state, level, "stone", thinIceIndex);
  assert.equal(refusal.allowed, false);
  assert.equal(refusal.reason, "objective-locked");
  assert.equal(placeBlock(state, 0, 3, "stone"), false);
  assert.equal(state.currentLevelState.inventory.stone, before);

  const target = targetBy(level, "stone");
  const allowed = evaluatePlacement(state, level, "stone", cellIndex(target.row, target.column, level.columns));
  assert.equal(allowed.allowed, true);
  assert.equal(placeTarget(state, target), true);
  assert.equal(state.currentLevelState.inventory.stone, before - 1);
  assert.equal(removeBlock(state, target.row, target.column), true);
  assert.equal(state.currentLevelState.inventory.stone, before);
}

function testMaterialSupportAndStacks() {
  const windState = createGameState(6);
  const windLevel = currentLevel(windState);
  const glassTarget = targetBy(windLevel, "glass", 1);
  assert.equal(
    evaluatePlacement(windState, windLevel, "glass", cellIndex(glassTarget.row, glassTarget.column, windLevel.columns)).allowed,
    false,
  );
  const stoneBelow = objectiveTargets(windLevel).find((target) => (
    target.materialId === "stone" && target.row === glassTarget.row && target.column === glassTarget.column
  ));
  assert.equal(placeTarget(windState, stoneBelow), true);
  assert.equal(placeTarget(windState, glassTarget), true);
  assert.equal(stackHeight(getCell(windState.currentLevelState, glassTarget.row, glassTarget.column)), 2);
  assert.equal(removeBlock(windState, glassTarget.row, glassTarget.column), true);
  assert.equal(topInventory(windState, "glass"), windLevel.inventory.glass);

  const bridgeState = createGameState(11);
  const bridgeLevel = currentLevel(bridgeState);
  const voidWood = objectiveTargets(bridgeLevel).find((target) => target.materialId === "wood" && target.height === 0);
  assert.equal(
    evaluatePlacement(bridgeState, bridgeLevel, "wood", cellIndex(voidWood.row, voidWood.column, bridgeLevel.columns)).reason,
    "objective-locked",
  );
  objectiveTargets(bridgeLevel, bridgeLevel.objectives[0]).forEach((target) => placeTarget(bridgeState, target));
  assert.equal(activeObjective(bridgeState.currentLevelState, bridgeLevel).id, "bridge-deck");
  assert.equal(placeTarget(bridgeState, voidWood), true);
}

function topInventory(state, materialId) {
  return state.currentLevelState.inventory[materialId];
}

function testObjectiveDependencies() {
  const state = createGameState(7);
  const level = currentLevel(state);
  assert.equal(activeObjective(state.currentLevelState, level).id, "house-base");
  const windowTarget = targetBy(level, "glass");
  const locked = evaluatePlacement(state, level, "glass", cellIndex(windowTarget.row, windowTarget.column, level.columns));
  assert.equal(locked.allowed, false);
  assert.equal(["objective-locked", "wrong-material"].includes(locked.reason), true);
  objectiveTargets(level, level.objectives[0]).forEach((target) => placeTarget(state, target));
  assert.equal(activeObjective(state.currentLevelState, level).id, "house-window");
}

function testAlternateFunctionalRoute() {
  [1, 2, 3].forEach((row) => {
    const state = createGameState(3);
    const level = currentLevel(state);
    for (let column = 2; column <= 5; column += 1) {
      assert.equal(placeBlock(state, row, column, "wood"), true);
    }
    assert.equal(state.phase, "level-complete");
    assert.equal(evaluateObjective(state.currentLevelState, level, level.objectives[0]).complete, true);
  });
}

function testAlternateFinalTownSolution() {
  const state = createGameState(24);
  const level = currentLevel(state);
  const alternateNetwork = [
    ...Array.from({ length: 10 }, (_, index) => ({ row: 6, column: index + 1, materialId: "stone" })),
    { row: 5, column: 8, materialId: "stone" },
    { row: 4, column: 8, materialId: "stone" },
    ...Array.from({ length: 6 }, (_, index) => ({ row: 3, column: index + 5, materialId: "stone" })),
  ];
  alternateNetwork.forEach((target) => assert.equal(placeTarget(state, target), true));
  assert.equal(activeObjective(state.currentLevelState, level).id, "port-bridge");
  level.objectives.slice(1).forEach((objective) => {
    [...objective.params.targets]
      .sort((a, b) => a.height - b.height)
      .forEach((target) => assert.equal(placeTarget(state, target), true));
  });
  assert.equal(state.phase, "level-complete");
  assert.equal(state.completed, true);
}

function testLightSimulation() {
  const state = createGameState(15);
  const level = currentLevel(state);
  assert.equal(computeLightMap(state.currentLevelState, level).every((value) => value === 0), true);
  assert.equal(placeTarget(state, level.solution[0]), true);
  const first = computeLightMap(state.currentLevelState, level);
  const second = computeLightMap(state.currentLevelState, level);
  assert.deepEqual(first, second);
  assert.equal(first.some((value) => value > 0), true);
}

function testSaveNormalization() {
  const original = createGameState(19);
  const level = currentLevel(original);
  for (const target of level.solution.slice(0, 4)) {
    if (stackHeight(getCell(original.currentLevelState, target.row, target.column)) === target.height) {
      placeTarget(original, target);
    }
  }
  const saved = JSON.parse(JSON.stringify(original));
  saved.currentLevelState.cells.push({ stack: ["unknown"] });
  saved.currentLevelState.inventory.stone = 999;
  saved.currentLevelState.cells[0].stack = ["unknown", "stone", "stone", "stone"];
  saved.completedLevelIds = ["unknown", "night-16-light-path", "night-16-light-path"];
  const restored = normalizeSavedState(saved);
  assert.equal(restored.version, SAVE_VERSION);
  assert.equal(restored.currentLevelIndex, 19);
  assert.equal(restored.currentLevelState.cells.length, level.rows * level.columns);
  assert.equal(restored.currentLevelState.cells.every((cell) => cell.stack.length <= level.maxHeight), true);
  assert.equal(restored.currentLevelState.cells.every((cell) => cell.stack.every((id) => Boolean(BLOCKS[id]))), true);
  assert.equal(restored.currentLevelState.inventory.stone <= level.inventory.stone, true);
  assert.deepEqual(restored.completedLevelIds, LEVELS.slice(0, 19).map((item) => item.id));

  assert.doesNotThrow(() => normalizeSavedState(null));
  assert.doesNotThrow(() => normalizeSavedState({ version: SAVE_VERSION, currentLevelIndex: 999 }));
}

function testLegacyMigration() {
  const unfinished = migrateLegacyState({ levelIndex: 2, phase: "build", placedCells: [{ row: 1, column: 3 }] });
  assert.equal(unfinished.currentLevelIndex, 2);
  assert.equal(unfinished.currentLevelState.cells.every((cell) => cell.stack.length === 0), true);
  assert.equal(unfinished.migratedFromV1, true);

  const finished = migrateLegacyState({ levelIndex: 4, phase: "level-complete", completed: true });
  assert.equal(finished.currentLevelIndex, 5);
  assert.equal(finished.completedLevelIds.length, 5);
}

function testCampaignTranslations() {
  const translations = JSON.parse(fs.readFileSync(path.join(__dirname, "translations.json"), "utf8"));
  const translated = new Set(translations.pairs.map(([english]) => english));
  Object.values(BLOCKS).forEach((block) => assert.equal(translated.has(block.name), true, block.name));
  Object.values(LOCATIONS).forEach((location) => assert.equal(translated.has(location.name), true, location.name));
  LEVELS.forEach((level) => {
    assert.equal(translated.has(level.title), true, level.title);
    assert.equal(translated.has(level.rewardText), true, level.rewardText);
    level.objectives.forEach((objective) => assert.equal(translated.has(objective.title), true, objective.title));
  });
}

testRegistriesAndLevelData();
testGridHelpers();
testAllKnownSolutionsAndCampaignFlow();
testRefusalsNeverSpendBlocks();
testMaterialSupportAndStacks();
testObjectiveDependencies();
testAlternateFunctionalRoute();
testAlternateFinalTownSolution();
testLightSimulation();
testSaveNormalization();
testLegacyMigration();
testCampaignTranslations();
console.log("Cube Island campaign tests passed for all 25 levels.");
