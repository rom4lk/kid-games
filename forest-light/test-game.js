const assert = require("node:assert/strict");
const {
  RECIPE,
  createGameState,
  collectItem,
  arriveAtCamp,
  placeRecipeItem,
  lightFire,
  requiredCount,
} = require("./game.js");

function testInitialState() {
  const state = createGameState();
  assert.equal(state.phase, "explore");
  assert.deepEqual(state.collectedCounts, { branch: 0, stone: 0 });
  assert.deepEqual(state.placedKinds, []);
  assert.equal(state.fireLit, false);
  assert.deepEqual(RECIPE, ["branch", "branch", "stone"]);
  assert.equal(requiredCount("branch"), 2);
  assert.equal(requiredCount("stone"), 1);
}

function testCollectionRules() {
  const state = createGameState();
  assert.equal(arriveAtCamp(state), false);
  assert.equal(collectItem(state, "branch-a", "branch"), true);
  assert.equal(collectItem(state, "branch-a", "branch"), false);
  assert.equal(collectItem(state, "branch-b", "branch"), true);
  assert.equal(collectItem(state, "branch-c", "branch"), false);
  assert.equal(state.phase, "explore");
  assert.equal(collectItem(state, "stone-a", "stone"), true);
  assert.equal(state.phase, "returning");
  assert.equal(collectItem(state, "stone-b", "stone"), false);
}

function testBuildSequence() {
  const state = createGameState();
  collectItem(state, "branch-a", "branch");
  collectItem(state, "stone-a", "stone");
  collectItem(state, "branch-b", "branch");

  assert.equal(lightFire(state), false);
  assert.equal(arriveAtCamp(state), true);
  assert.equal(state.phase, "building");
  assert.equal(placeRecipeItem(state, 1), false);
  assert.equal(placeRecipeItem(state, 0), true);
  assert.equal(placeRecipeItem(state, 0), false);
  assert.equal(placeRecipeItem(state, 1), true);
  assert.equal(placeRecipeItem(state, 2), true);
  assert.equal(state.phase, "ready");
  assert.deepEqual(state.placedKinds, ["branch", "branch", "stone"]);
  assert.equal(lightFire(state), true);
  assert.equal(state.phase, "evening");
  assert.equal(state.fireLit, true);
  assert.equal(lightFire(state), false);
}

testInitialState();
testCollectionRules();
testBuildSequence();
console.log("Forest Light logic tests passed.");
