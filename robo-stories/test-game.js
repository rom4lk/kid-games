const assert = require("node:assert/strict");
const {
  STORIES,
  SPARE_SLOTS,
  MAX_STARS,
  parseMap,
  normalizeStories,
  slotCount,
  starsFor,
  initialState,
  applyCommand,
  expandProgram,
  findInvalidRepeat,
  repeatSources,
  simulate,
  isComplete,
  findShortestCompletion,
  nextHelpfulCommand,
  firstStuckCard,
  normalizeProgress,
  levelStars,
  isLevelUnlocked,
  completedCount,
  isStoryComplete,
  recordStars,
  normalizeSurvey,
} = require("./game.js");

const MAX_EXPLORED_STATES = 20000;

function story(id) {
  const found = STORIES.find((candidate) => candidate.id === id);
  assert.ok(found, `story ${id} exists`);
  return found;
}

function level(storyId, number) {
  return story(storyId).levels[number - 1];
}

function makeLevel(overrides) {
  const base = {
    id: "test",
    title: "Test",
    lead: "",
    emoji: "",
    movement: "arrows",
    theme: "meadow",
    accessory: "cap",
    levels: [{
      title: "Test level",
      goal: "",
      hint: "",
      map: ["s.S"],
      robot: { x: 0, y: 0, facing: "east" },
      commands: ["pick", "right", "drop"],
      solution: ["pick", "right", "right", "drop"],
      ...overrides.level,
    }],
    ...overrides.story,
  };
  return normalizeStories([base])[0].levels[0];
}

function testEveryStoryHasLevels() {
  assert.equal(STORIES.length, 8);
  STORIES.forEach((entry) => {
    assert.ok(entry.levels.length >= 6 && entry.levels.length <= 10, `${entry.title} has 6 to 10 levels`);
    assert.ok(entry.title && entry.lead && entry.emoji && entry.accessory, `${entry.title} has its card texts`);
    entry.levels.forEach((item) => {
      assert.ok(item.title && item.goal && item.hint, `${item.id} has adult texts`);
    });
  });
  const ids = STORIES.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length, "story ids are unique");
}

// The stored solution wins, offers only listed commands and is the shortest
// program the search can find, so `par` is the true minimum and three stars
// are always reachable.
function testReferenceSolutionsAreShortest() {
  STORIES.forEach((entry) => {
    entry.levels.forEach((item) => {
      const outcome = simulate(item, item.solution);
      assert.equal(outcome.failedAt, -1, `${item.id} solution hits something`);
      assert.equal(outcome.complete, true, `${item.id} solution does not finish the level`);
      const shortest = findShortestCompletion(item, initialState(item));
      assert.ok(shortest, `${item.id} has no solution`);
      assert.equal(shortest.commands.length, item.par, `${item.id} par differs from the shortest program`);
      assert.ok(shortest.explored < MAX_EXPLORED_STATES, `${item.id} search explores too many states`);
      assert.equal(slotCount(item), item.par + SPARE_SLOTS);
    });
  });
}

function testCommandsAppearGradually() {
  STORIES.forEach((entry) => {
    entry.levels.forEach((item, index) => {
      if (index === 0) return;
      const previous = entry.levels[index - 1].commands;
      previous.forEach((command) => {
        assert.ok(item.commands.includes(command), `${item.id} takes away the command "${command}"`);
      });
      // The two turn cards arrive together: one without the other is useless.
      const added = item.commands.filter((command) => !previous.includes(command));
      const turnPair = added.length === 2 && added.includes("turnLeft") && added.includes("turnRight");
      assert.ok(added.length <= 1 || turnPair, `${item.id} introduces more than one new command`);
    });
  });
}

function testHintFinishesEveryLevelWithinTheStrip() {
  STORIES.forEach((entry) => {
    entry.levels.forEach((item) => {
      const route = [];
      let outcome = simulate(item, route);
      while (!outcome.complete && route.length <= slotCount(item)) {
        const command = nextHelpfulCommand(item, outcome.state);
        assert.ok(command, `${item.id} leaves the hint with nothing to suggest`);
        route.push(command);
        outcome = simulate(item, route);
        assert.equal(outcome.failedAt, -1, `${item.id} hint suggested an illegal command`);
      }
      assert.equal(outcome.complete, true, `${item.id} is not solved by hints alone`);
      assert.ok(route.length <= item.par, `${item.id} hint route is longer than par`);
    });
  });
}

function testStars() {
  const item = level("post", 1);
  assert.equal(item.par, 5);
  assert.equal(starsFor(item, 5), MAX_STARS);
  assert.equal(starsFor(item, 6), 2);
  assert.equal(starsFor(item, 7), 1);
  assert.equal(starsFor(item, 9), 1, "stars never drop below one");
}

function testMapLegend() {
  const parsed = parseMap(["s#S", "o1O", ".qQ"], "legend");
  assert.equal(parsed.width, 3);
  assert.equal(parsed.height, 3);
  assert.deepEqual(parsed.walls, [{ x: 1, y: 0 }]);
  assert.deepEqual(parsed.parcels, [{ id: "star", symbol: "star", x: 0, y: 0 }]);
  assert.deepEqual(parsed.stations, [{ id: "star", symbol: "star", x: 2, y: 0 }]);
  assert.deepEqual(parsed.targets, [{ x: 1, y: 1, order: 1 }]);
  assert.deepEqual(parsed.switches, [{ x: 0, y: 1, shape: "circle" }, { x: 1, y: 2, shape: "square" }]);
  assert.deepEqual(parsed.gates, [{ x: 2, y: 1, shape: "circle" }, { x: 2, y: 2, shape: "square" }]);
  assert.throws(() => parseMap(["..", "..."], "ragged"), /different length/);
  assert.throws(() => parseMap(["z"], "unknown"), /unknown map symbol/);
}

function testLevelValidation() {
  assert.throws(() => makeLevel({ level: { robot: { x: 5, y: 0, facing: "east" } } }), /outside the map/);
  assert.throws(() => makeLevel({ level: { map: ["#.S"] } }), /inside a wall/);
  assert.throws(() => makeLevel({ level: { map: ["*.S"], solution: [] } }), /on a target/);
  assert.throws(() => makeLevel({ level: { map: ["s.C"], solution: [] } }), /without a station of the same sign/);
  assert.throws(() => makeLevel({ level: { map: ["...", ".1*"], solution: [] } }), /mixes numbered/);
  assert.throws(() => makeLevel({ level: { map: ["...", ".13"], solution: [] } }), /with gaps/);
  assert.throws(() => makeLevel({ level: { map: ["..Q", "*.."], solution: [] } }), /without a switch/);
  assert.throws(() => makeLevel({ level: { commands: ["forward"] } }), /which its story does not use/);
  assert.throws(() => makeLevel({ level: { solution: ["up"] } }), /palette does not offer/);
  assert.throws(() => makeLevel({ level: { map: ["..."], solution: [] } }), /nothing to deliver, collect or push/);
  assert.throws(() => makeLevel({ level: { map: ["b.."], robot: { x: 1, y: 0, facing: "east" }, solution: [] } }), /snowballs and 0 marks/);
  assert.throws(() => makeLevel({ level: { map: ["~.S", "s.."], solution: [] } }), /starts the robot in the water/);
  assert.throws(() => makeLevel({ level: { map: [">.S", "s.."], solution: [] } }), /starts the robot on a belt/);
  assert.throws(() => makeLevel({ level: { map: [".>#", "s.S"], solution: [] } }), /runs into something it cannot cross/);
  assert.throws(() => makeLevel({ level: { map: [".>v", ".^<", "s.S"], solution: [] } }), /run in a circle/);
}

function testArrowMovementAndBlocking() {
  const item = level("post", 6);
  assert.equal(simulate(item, ["left"]).reason, "blocked", "the edge blocks");
  assert.equal(simulate(item, ["left"]).blockedBy, "edge");
  const wall = simulate(item, ["right", "right", "right"]);
  assert.equal(wall.failedAt, 2);
  assert.equal(wall.blockedBy, "wall");
  assert.deepEqual(wall.blockedAt, { x: 3, y: 2 });
  assert.equal(simulate(item, ["drop"]).reason, "empty-hands");
  assert.equal(simulate(item, ["pick"]).reason, "no-parcel");
}

function testTurnMovementUsesTheHeadlight() {
  const item = level("charge", 2);
  const turned = simulate(item, ["turnLeft"]);
  assert.equal(turned.state.robot.facing, "north");
  assert.equal(simulate(item, ["turnRight"]).state.robot.facing, "south");
  assert.equal(simulate(item, ["turnLeft", "turnLeft"]).state.robot.facing, "west");
  const walked = simulate(item, ["turnLeft", "forward"]);
  assert.deepEqual([walked.state.robot.x, walked.state.robot.y], [0, 1]);
  assert.equal(simulate(item, ["turnRight", "forward"]).reason, "blocked", "the edge blocks a forward step");
}

function testSymbolMatching() {
  const item = level("gates", 4);
  const wrong = simulate(item, ["pick", "right", "drop"]);
  assert.equal(wrong.failedAt, 2);
  assert.equal(wrong.reason, "wrong-station");
  assert.equal(wrong.carriedId, "star");
  assert.equal(wrong.matchingStationId, "star");
  assert.equal(wrong.wrongStationId, "circle");
  const nowhere = simulate(item, ["pick", "drop"]);
  assert.equal(nowhere.reason, "no-station");
  assert.equal(nowhere.wrongStationId, null);
}

function testTwoParcelsInEitherOrder() {
  const item = level("gates", 5);
  const circleFirst = ["down", "pick", "right", "drop", "left", "up", "up", "pick", "right", "drop"];
  assert.equal(simulate(item, item.solution).complete, true);
  assert.equal(simulate(item, circleFirst).complete, true);
  const halfway = simulate(item, ["up", "pick", "right", "drop"]);
  assert.equal(halfway.complete, false);
  assert.equal(halfway.state.parcels.find((parcel) => parcel.id === "star").delivered, true);
  assert.equal(simulate(item, ["up", "pick", "down", "down", "pick"]).reason, "hands-full");
}

function testSwitchesOpenGatesOfTheirShape() {
  const item = level("gates", 8);
  const closed = simulate(item, ["pick", "right", "right", "right"]);
  assert.equal(closed.reason, "blocked");
  assert.equal(closed.blockedBy, "gate");
  const roundOpen = simulate(item, ["pick", "up", "right"]);
  assert.deepEqual(roundOpen.state.openGates, ["circle"]);
  const squareStillClosed = simulate(item, ["pick", "up", "right", "right", "down", "down", "right"]);
  assert.equal(squareStillClosed.reason, "blocked");
  assert.equal(squareStillClosed.blockedBy, "gate");
  assert.equal(simulate(item, item.solution).complete, true);
  assert.deepEqual(initialState(item).openGates, [], "a fresh run closes every gate again");
}

function testOrderedTargetsAreSoft() {
  const item = level("charge", 5);
  const early = simulate(item, ["forward", "forward", "forward", "forward", "turnLeft", "forward", "forward", "forward"]);
  assert.equal(early.complete, true, "the reference order works");
  const state = initialState(item);
  const walkedOver = applyCommand(item, { ...state, robot: { x: 4, y: 2, facing: "north" } }, "forward");
  assert.equal(walkedOver.ok, true, "passing battery 2 first is not a crash");
  assert.deepEqual(walkedOver.state.collected, [false, false], "battery 2 stays where it is");
  const firstBattery = item.targets.findIndex((target) => target.order === 1);
  assert.equal(walkedOver.events.find((event) => event.type === "wrong-order")?.expected, firstBattery);
}

function testUnorderedTargetsInAnyOrder() {
  const item = level("clean", 3);
  const clockwise = ["down", "down", "left", "left", "repeat", "left", "up", "up", "right", "right", "repeat", "down"];
  const outcome = simulate(item, clockwise);
  assert.equal(outcome.complete, true, "the loop works the other way round too");
  assert.ok(clockwise.length > item.par, "the other direction is longer");
  assert.ok(clockwise.length <= slotCount(item), "but it still fits into the strip");
}

function testRepeatSemantics() {
  assert.deepEqual(
    expandProgram(["forward", "turnLeft", "repeat"]),
    [
      { command: "forward", sourceIndex: 0 },
      { command: "turnLeft", sourceIndex: 1 },
      { command: "forward", sourceIndex: 2 },
      { command: "turnLeft", sourceIndex: 2 },
    ],
  );
  assert.deepEqual(
    expandProgram(["forward", "forward", "repeat", "repeat"]).map((step) => step.sourceIndex),
    [0, 1, 2, 2, 3, 3],
  );
  assert.equal(findInvalidRepeat(["forward", "repeat"]), 1);
  assert.equal(findInvalidRepeat(["forward", "forward", "repeat"]), -1);
  assert.deepEqual(repeatSources(["forward", "forward", "repeat"], 2), [0, 1]);
  assert.deepEqual(repeatSources(["forward", "forward", "repeat", "repeat"], 3), [0, 1]);
  assert.deepEqual(repeatSources(["forward", "turnLeft", "forward", "repeat"], 3), [1, 2]);

  const item = level("rover", 1);
  const invalid = simulate(item, ["forward", "repeat"]);
  assert.equal(invalid.failedAt, 1);
  assert.equal(invalid.reason, "repeat-needs-two");
  const finished = simulate(item, ["forward", "forward", "repeat"]);
  assert.equal(finished.complete, true);
  assert.equal(finished.completedAt, 2);
}

function testRunStopsAtTheGoal() {
  const item = level("post", 1);
  const extra = [...item.solution, "right", "right", "right", "right"];
  const outcome = simulate(item, extra);
  assert.equal(outcome.complete, true, "cards after the goal do not spoil the route");
  assert.equal(outcome.completedAt, item.solution.length - 1);
  assert.equal(starsFor(item, extra.length), 1, "but they still cost stars");
}

function testHintFromTheChildsRealState() {
  const item = level("post", 5);
  const wandering = simulate(item, ["up", "up", "pick", "left", "right"]);
  assert.equal(wandering.failedAt, -1);
  assert.equal(nextHelpfulCommand(item, wandering.state), "left");
  assert.equal(nextHelpfulCommand(item, simulate(item, item.solution).state), null);
  const turnLevel = level("charge", 3);
  assert.equal(nextHelpfulCommand(turnLevel, initialState(turnLevel)), "forward");
  const rover = level("rover", 1);
  const twoSteps = simulate(rover, ["forward", "forward"]);
  assert.equal(nextHelpfulCommand(rover, twoSteps.state), "repeat", "the hint uses the repeat card when it is shortest");
}

function testProgressRules() {
  const empty = normalizeProgress(null);
  assert.deepEqual(empty, { stories: {} });
  const post = story("post");
  assert.equal(isLevelUnlocked(empty, post, 0), true);
  assert.equal(isLevelUnlocked(empty, post, 1), false);
  recordStars(empty, post, 0, 2);
  assert.equal(levelStars(empty, post, 0), 2);
  assert.equal(isLevelUnlocked(empty, post, 1), true);
  recordStars(empty, post, 0, 1);
  assert.equal(levelStars(empty, post, 0), 2, "a worse replay keeps the best stars");
  assert.equal(completedCount(empty, post), 1);
  assert.equal(isStoryComplete(empty, post), false);
  post.levels.forEach((item) => recordStars(empty, post, item.index, 3));
  assert.equal(isStoryComplete(empty, post), true);

  const garbage = normalizeProgress({ stories: { post: { 0: 7, 1: "x", 2: 3 }, nope: { 0: 3 } } });
  assert.deepEqual(garbage, { stories: { post: { 2: 3 } } });
  assert.equal(isLevelUnlocked(garbage, post, 1), false, "invalid stars do not unlock anything");
}

function testSurveyRecords() {
  assert.deepEqual(normalizeSurvey(null), []);
  const kept = normalizeSurvey([
    { story: "post", level: 0, answer: "easy", runs: 1 },
    { story: "post", level: 1, answer: "impossible" },
    { story: 3, level: 0, answer: "hard" },
    "text",
  ]);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].answer, "easy");
}

function testSnowballsRollAndGetStuck() {
  const item = level("snow", 1);
  const pushed = applyCommand(item, initialState(item), "right");
  assert.equal(pushed.ok, true);
  assert.deepEqual([pushed.state.robot.x, pushed.state.balls[0].x], [1, 2], "the robot takes the ball's cell and the ball rolls ahead");
  assert.equal(pushed.events[0].type, "push");
  assert.equal(pushed.events[0].placed, false);
  const done = simulate(item, item.solution);
  assert.equal(done.complete, true);
  assert.equal(done.completedAt, 2, "the run stops when the last ball reaches its mark");

  const fence = level("snow", 6);
  const intoFence = simulate(fence, ["right", "right"]);
  assert.equal(intoFence.reason, "blocked");
  assert.equal(intoFence.blockedBy, "snowball", "a ball against a fence does not move");
  assert.deepEqual(intoFence.blockedAt, { x: 3, y: 1 });
  assert.equal(intoFence.ballId, 0);

  const two = level("snow", 7);
  const collision = simulate(two, ["up", "right", "right", "right", "down", "right", "down", "right"]);
  assert.equal(collision.reason, "blocked");
  assert.equal(collision.blockedBy, "edge", "a ball cannot leave the field");

  // A ball rolled to the edge column can never come back to a mark in the
  // middle, so the hint blames the card that rolled it there.
  const detour = level("snow", 4);
  const stuck = ["up", "right", "right", "right"];
  const outcome = simulate(detour, stuck);
  assert.equal(outcome.failedAt, -1, "rolling a ball to the edge is not a crash");
  assert.equal(nextHelpfulCommand(detour, outcome.state), null);
  assert.equal(firstStuckCard(detour, stuck), 3);
  assert.equal(firstStuckCard(detour, ["up", "right"]), -1, "one push to the right can still be undone");
  assert.equal(firstStuckCard(detour, detour.solution), -1);
}

function testBeltsCarryTheRobot() {
  const item = level("factory", 1);
  const ride = applyCommand(item, initialState(item), "right");
  assert.deepEqual(
    ride.events.map((event) => event.type),
    ["step", "ride", "ride", "ride", "collect"],
    "one card walks onto the belt and the belt does the rest",
  );
  assert.deepEqual([ride.state.robot.x, ride.state.robot.y], [4, 1]);
  assert.equal(isComplete(item, ride.state), true);

  const corner = level("factory", 3);
  const chain = simulate(corner, ["right", "down"]);
  assert.equal(chain.complete, true, "a belt hands over to a belt of another direction");

  const wrongWay = level("factory", 4);
  const back = simulate(wrongWay, ["left"]);
  assert.equal(back.failedAt, -1, "a belt running the wrong way is not a crash");
  assert.deepEqual([back.state.robot.x, back.state.robot.y], [5, 2], "it carries the robot back to where it came from");
  assert.equal(simulate(wrongWay, wrongWay.solution).complete, true);
}

function testJumpsCrossWater() {
  const item = level("pond", 2);
  assert.equal(simulate(item, ["forward", "forward"]).blockedBy, "water", "walking into water stops the run");
  assert.equal(simulate(item, ["jump"]).blockedBy, "water", "landing in water stops the run too");
  assert.deepEqual(simulate(item, ["jump"]).blockedAt, { x: 2, y: 1 });
  const across = simulate(item, ["forward", "jump"]);
  assert.deepEqual([across.state.robot.x, across.state.robot.y], [3, 1], "a jump lands two cells ahead");
  assert.equal(across.state.robot.facing, "east");
  assert.equal(simulate(level("pond", 1), ["turnLeft", "jump"]).blockedBy, "edge");

  const overDuck = makeLevel({
    story: { movement: "turns", theme: "pond" },
    level: { map: [".*.*"], commands: ["jump", "forward"], solution: ["jump", "forward"] },
  });
  const flown = simulate(overDuck, ["jump"]);
  assert.deepEqual(flown.state.collected, [false, false], "the cell the robot flies over is untouched");
  assert.equal(simulate(overDuck, ["forward", "jump"]).complete, true);
  assert.throws(() => makeLevel({ level: { map: ["s.S"], commands: ["jump", "right"], solution: ["right"] } }), /which its story does not use/);
}

function testSearchIgnoresFacingWhenArrowsMove() {
  const item = level("post", 1);
  const start = initialState(item);
  const stepped = applyCommand(item, start, "right");
  assert.equal(stepped.state.robot.facing, "east");
  const first = findShortestCompletion(item, start);
  const turned = findShortestCompletion(item, { ...start, robot: { ...start.robot, facing: "west" } });
  assert.equal(first.commands.length, turned.commands.length);
  assert.equal(isComplete(item, simulate(item, item.solution).state), true);
}

const tests = [
  testEveryStoryHasLevels,
  testReferenceSolutionsAreShortest,
  testCommandsAppearGradually,
  testHintFinishesEveryLevelWithinTheStrip,
  testStars,
  testMapLegend,
  testLevelValidation,
  testArrowMovementAndBlocking,
  testTurnMovementUsesTheHeadlight,
  testSymbolMatching,
  testTwoParcelsInEitherOrder,
  testSwitchesOpenGatesOfTheirShape,
  testOrderedTargetsAreSoft,
  testUnorderedTargetsInAnyOrder,
  testRepeatSemantics,
  testRunStopsAtTheGoal,
  testHintFromTheChildsRealState,
  testProgressRules,
  testSurveyRecords,
  testSnowballsRollAndGetStuck,
  testBeltsCarryTheRobot,
  testJumpsCrossWater,
  testSearchIgnoresFacingWhenArrowsMove,
];

tests.forEach((test) => {
  test();
  console.log(`ok ${test.name}`);
});

const levelCount = STORIES.reduce((sum, entry) => sum + entry.levels.length, 0);
console.log(`${tests.length} tests passed, ${STORIES.length} stories, ${levelCount} levels`);
