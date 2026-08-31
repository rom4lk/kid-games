const assert = require("node:assert/strict");
const {
  RECIPE,
  RECIPES,
  GLADES,
  BACKPACK_SIZE,
  FULLNESS_MARKS,
  DAYLIGHT_STEPS,
  createGameState,
  requiredCount,
  isHungry,
  isDark,
  findNode,
  harvestVerb,
  isNodeReachable,
  collectItem,
  beginHarvest,
  tapHarvest,
  leaveEmergencyBerry,
  feedHero,
  regrowBushes,
  travelTo,
  canBuild,
  startBuild,
  remainingParts,
  placePart,
  lightFire,
} = require("./game.js");

function longEveningState() {
  return createGameState({ longEvening: true });
}

function gather(state, nodeId) {
  assert.equal(beginHarvest(state, nodeId), true, `cannot start on ${nodeId}`);
  const node = findNode(state, nodeId);
  const taps = node.taps || { branch: 1, stone: 2, berry: 3 }[node.kind];
  for (let index = 1; index < taps; index += 1) {
    assert.equal(tapHarvest(state), "progress");
  }
  assert.equal(tapHarvest(state), "collected");
}

function testInitialState() {
  const state = createGameState();
  assert.equal(state.phase, "explore");
  assert.equal(state.glade, "camp");
  assert.deepEqual(state.collectedCounts, { branch: 0, stone: 0, berry: 0 });
  assert.deepEqual(state.placedKinds, []);
  assert.deepEqual(state.built, []);
  assert.equal(state.fireLit, false);
  assert.equal(state.longEvening, false);
  assert.deepEqual(RECIPE, ["branch", "branch", "stone"]);
  assert.equal(requiredCount("branch"), 2);
  assert.equal(requiredCount("stone"), 1);
  assert.equal(requiredCount("berry", "bowl"), 2);
  assert.deepEqual(GLADES, ["berries", "camp", "stones"]);
  assert.equal(RECIPES.length, 3);
}

function testCollectionRules() {
  const state = createGameState();
  assert.equal(collectItem(state, "branch-first", "branch"), true);
  assert.equal(collectItem(state, "branch-first", "branch"), false, "the same item never counts twice");
  assert.equal(collectItem(state, "branch-second", "branch"), true);
  assert.equal(collectItem(state, "stone-camp", "stone"), true);
  assert.equal(state.phase, "explore", "the player decides when to walk home");
  assert.equal(collectItem(state, "leaf", "leaf"), false, "unknown kinds stay out of the backpack");

  // The backpack is shared and holds more than the chapter recipe.
  assert.equal(collectItem(state, "branch-low", "branch"), true);
  assert.equal(collectItem(state, "berry-a", "berry"), true);
  assert.equal(collectItem(state, "berry-b", "berry"), true);
  assert.equal(state.backpack.length, BACKPACK_SIZE);
  assert.equal(collectItem(state, "berry-c", "berry"), false, "a full backpack accepts nothing more");
}

function testGatheringVerbs() {
  const state = createGameState();

  assert.equal(beginHarvest(state, "branch-first"), true);
  assert.equal(state.harvest.required, 1);
  assert.equal(tapHarvest(state), "collected");

  assert.equal(beginHarvest(state, "stone-camp"), true);
  assert.equal(state.harvest.required, 2);
  assert.equal(tapHarvest(state), "progress");
  assert.equal(tapHarvest(state), "collected");

  assert.equal(beginHarvest(state, "bush-camp"), true);
  assert.equal(state.harvest.required, 3);
  assert.equal(tapHarvest(state), "progress");
  assert.equal(tapHarvest(state), "progress");
  assert.equal(tapHarvest(state), "collected");

  assert.deepEqual(state.collectedCounts, { branch: 1, stone: 1, berry: 1 });
  assert.equal(harvestVerb(findNode(state, "branch-second")), "pick");
  assert.equal(harvestVerb(findNode(state, "stone-slope-a")), "dig");
  assert.equal(harvestVerb(findNode(state, "bush-low-a")), "shake");
  assert.equal(state.harvest, null);
  assert.equal(beginHarvest(state, "branch-first"), false, "a taken branch cannot be taken again");
  assert.equal(beginHarvest(state, "stone-slope-a"), false, "another clearing is out of reach");
}

function testDaylightFollowsUsefulActions() {
  const tutorial = createGameState();
  gather(tutorial, "branch-first");
  gather(tutorial, "branch-second");
  assert.equal(tutorial.daylight, 1, "the first run keeps the sun still");
  assert.equal(tutorial.fullness, FULLNESS_MARKS, "the first run hides the fullness meter");

  const state = longEveningState();
  assert.equal(state.daylight, 1);
  gather(state, "branch-first");
  assert.equal(state.daylight, 1, "one action is not a whole step");
  gather(state, "branch-second");
  assert.equal(state.daylight, 2);
  gather(state, "stone-camp");
  assert.equal(state.daylight, 2);
  gather(state, "bush-camp");
  assert.equal(state.daylight, 3);
  assert.equal(isDark(state), true, "the third mark puts the far forest to sleep");

  const far = findNode(state, "bush-camp-far");
  assert.equal(isNodeReachable(state, far), false);
  assert.equal(beginHarvest(state, "bush-camp-far"), false);

  // Travelling never moves the sun, only gathering and building do.
  const before = state.daylight;
  travelTo(state, "stones");
  assert.equal(state.daylight, before);

  gather(state, "stone-slope-a");
  gather(state, "stone-slope-b");
  assert.equal(state.daylight, DAYLIGHT_STEPS);

  // The last mark waits for the player: more useful actions never push past it.
  travelTo(state, "camp");
  assert.equal(startBuild(state, "torch"), true);
  assert.equal(placePart(state, state.backpack.findIndex((item) => item.kind === "branch")), true);
  assert.equal(placePart(state, state.backpack.findIndex((item) => item.kind === "stone")), true);
  assert.equal(state.usefulActions, 8);
  assert.equal(state.daylight, DAYLIGHT_STEPS, "the last mark waits for the player");
}

function testTorchOpensTheDarkForest() {
  const state = longEveningState();
  gather(state, "branch-first");
  gather(state, "stone-camp");
  gather(state, "branch-second");
  gather(state, "bush-camp");
  assert.equal(isDark(state), true);

  assert.equal(canBuild(state, "torch"), true);
  assert.equal(startBuild(state, "torch"), true);
  assert.equal(placePart(state, state.backpack.findIndex((item) => item.kind === "branch")), true);
  assert.equal(placePart(state, state.backpack.findIndex((item) => item.kind === "stone")), true);
  assert.deepEqual(state.built, ["torch"]);
  assert.equal(state.phase, "explore", "a bonus build hands the forest back to the player");
  assert.equal(isDark(state), false, "the torch wakes the far forest up again");
  assert.equal(isNodeReachable(state, findNode(state, "bush-camp-far")), true);
}

function testFullnessAndFeeding() {
  const state = longEveningState();
  gather(state, "bush-camp");
  gather(state, "branch-first");
  gather(state, "branch-second");
  assert.equal(state.fullness, FULLNESS_MARKS - 1, "one mark goes after three useful actions");

  state.fullness = 1;
  state.actionsSinceMeal = 2;
  gather(state, "bush-camp-far");
  assert.equal(state.fullness, 0);
  assert.equal(isHungry(state), true);

  assert.equal(beginHarvest(state, "stone-camp"), false, "a hungry hero cannot lift the stone");
  assert.equal(collectItem(state, "stone-camp", "stone"), false);

  const berryIndex = state.backpack.findIndex((item) => item.kind === "berry");
  assert.equal(feedHero(state, berryIndex + 100), false, "an empty slot feeds nobody");
  assert.equal(feedHero(state, state.backpack.findIndex((item) => item.kind === "branch")), false);
  assert.equal(feedHero(state, berryIndex), true);
  assert.equal(state.fullness, FULLNESS_MARKS);
  assert.equal(isHungry(state), false);
  assert.equal(feedHero(state, state.backpack.findIndex((item) => item.kind === "berry")), false, "a full hero refuses more");
  assert.equal(beginHarvest(state, "stone-camp"), true, "a fed hero lifts the stone again");
}

function testEmergencyBerry() {
  const state = longEveningState();
  state.fullness = 0;
  state.nodes.filter((node) => node.kind === "berry").forEach((node) => { node.empty = true; });

  const gift = leaveEmergencyBerry(state, 50, 60);
  assert.notEqual(gift, null);
  assert.equal(gift.glade, state.glade);
  assert.equal(gift.taps, 1, "the emergency berry is picked up with one press");
  assert.equal(harvestVerb(gift), "pick", "a berry on the ground is lifted, not shaken");
  assert.equal(leaveEmergencyBerry(state, 50, 60), null, "one berry is enough");

  gather(state, gift.id);
  assert.equal(feedHero(state, state.backpack.findIndex((item) => item.kind === "berry")), true);
  assert.equal(state.fullness, FULLNESS_MARKS);
}

function testGladesAndRegrowth() {
  const state = createGameState();
  assert.equal(travelTo(state, "camp"), false, "the hero is already here");
  assert.equal(travelTo(state, "swamp"), false, "there is no such clearing");

  gather(state, "bush-camp");
  assert.equal(findNode(state, "bush-camp").empty, true);

  assert.equal(travelTo(state, "berries"), true);
  assert.equal(state.glade, "berries");
  assert.equal(findNode(state, "bush-camp").empty, true, "bushes wait for the walk home");

  gather(state, "bush-low-a");
  assert.equal(travelTo(state, "camp"), true);
  assert.equal(findNode(state, "bush-camp").empty, false, "the bushes grow back at the camp");
  assert.equal(findNode(state, "bush-low-a").empty, false);
  assert.equal(regrowBushes(state), 0, "nothing to grow back twice");

  // The same bush hands out a new berry after it has grown back.
  gather(state, "bush-camp");
  assert.equal(state.collectedCounts.berry, 3);
}

function testStonesAreFinite() {
  const state = createGameState();
  const campStones = state.nodes.filter((node) => node.kind === "stone" && node.glade === "camp");
  assert.equal(campStones.length, 1, "the camp holds a single stone");
  gather(state, "stone-camp");
  assert.equal(state.nodes.some((node) => node.kind === "stone" && isNodeReachable(state, node)), false);

  travelTo(state, "camp");
  assert.equal(findNode(state, "stone-camp").taken, true, "stones never grow back");

  assert.equal(travelTo(state, "stones"), true);
  gather(state, "stone-slope-a");
  assert.equal(state.collectedCounts.stone, 2);
}

function testRecipeChoiceAndBuilding() {
  const state = createGameState();
  assert.equal(canBuild(state, "fire"), false);
  assert.equal(startBuild(state, "fire"), false);

  gather(state, "bush-camp");
  travelTo(state, "berries");
  gather(state, "bush-low-a");
  assert.equal(canBuild(state, "bowl"), true);
  assert.equal(startBuild(state, "bowl"), false, "a build only happens at the camp");

  travelTo(state, "camp");
  assert.equal(startBuild(state, "bowl"), true);
  assert.equal(state.phase, "building");
  assert.equal(placePart(state, 99), false, "an empty slot fits nowhere");
  assert.equal(placePart(state, 0), true);
  assert.equal(placePart(state, 0), true);
  assert.deepEqual(state.built, ["bowl"]);
  assert.equal(state.phase, "explore");
  assert.equal(canBuild(state, "bowl"), false, "the camp keeps one bowl");
}

function testGoalBuildAndFire() {
  const state = createGameState();
  gather(state, "branch-first");
  gather(state, "stone-camp");
  gather(state, "branch-second");

  assert.equal(lightFire(state), false, "the campfire cannot be lit before it is built");
  assert.equal(canBuild(state, "fire"), true);
  assert.equal(startBuild(state, "fire"), true);
  assert.equal(state.phase, "building");

  const berryOnly = createGameState();
  gather(berryOnly, "bush-camp");
  assert.equal(canBuild(berryOnly, "fire"), false);

  // Any slot that still fits the silhouette is accepted, in any order.
  const stoneIndex = state.backpack.findIndex((item) => item.kind === "stone");
  assert.equal(placePart(state, stoneIndex), true);
  assert.deepEqual(remainingParts(state), ["branch", "branch"]);
  assert.equal(placePart(state, 0), true);
  assert.equal(placePart(state, 0), true);

  assert.equal(state.phase, "ready");
  assert.deepEqual(state.placedKinds, ["stone", "branch", "branch"]);
  assert.equal(state.backpack.length, 0);
  assert.equal(lightFire(state), true);
  assert.equal(state.phase, "evening");
  assert.equal(state.fireLit, true);
  assert.equal(lightFire(state), false, "the chapter ends once");
  assert.equal(collectItem(state, "branch-low", "branch"), false, "the evening stops the gathering");
}

function testWrongPartIsRefusedWithoutLoss() {
  const state = createGameState();
  gather(state, "branch-first");
  gather(state, "bush-camp");
  gather(state, "branch-second");
  gather(state, "stone-camp");

  assert.equal(startBuild(state, "fire"), true);
  const berryIndex = state.backpack.findIndex((item) => item.kind === "berry");
  assert.equal(placePart(state, berryIndex), false, "a berry does not fit the campfire");
  assert.equal(state.backpack.length, 4, "a refused part stays in the backpack");
  assert.equal(state.placedKinds.length, 0);
}

testInitialState();
testCollectionRules();
testGatheringVerbs();
testDaylightFollowsUsefulActions();
testTorchOpensTheDarkForest();
testFullnessAndFeeding();
testEmergencyBerry();
testGladesAndRegrowth();
testStonesAreFinite();
testRecipeChoiceAndBuilding();
testGoalBuildAndFire();
testWrongPartIsRefusedWithoutLoss();
console.log("Forest Light logic tests passed.");
