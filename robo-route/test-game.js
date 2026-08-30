const assert = require("node:assert/strict");
const {
  levels,
  SPARE_SLOTS,
  positionsMatch,
  slotCount,
  isBlockedOn,
  simulate,
  nextHelpfulCommand,
} = require("./game.js");

function testReferenceSolutions() {
  levels.forEach((level, index) => {
    const outcome = simulate(level, level.solution);
    assert.equal(outcome.failedAt, -1, `level ${index + 1} solution hits a wall`);
    assert.equal(outcome.delivered, true, `level ${index + 1} solution loses the parcel`);
    assert.ok(
      level.solution.every((command) => level.commands.includes(command)),
      `level ${index + 1} solution uses a command the palette does not offer`,
    );
  });
}

function testSpareSlots() {
  levels.forEach((level) => {
    assert.equal(slotCount(level), level.solution.length + SPARE_SLOTS);
  });
}

// Any legal route wins, not only the stored one: a child who wanders and comes
// back still delivers the parcel.
function testDetourWins() {
  const detour = ["left", "pick", "right", "left", "right", "right", "right", "right", "drop"];
  const outcome = simulate(levels[1], detour);
  assert.equal(outcome.failedAt, -1);
  assert.equal(outcome.delivered, true);
  assert.ok(detour.length <= slotCount(levels[1]), "the detour does not fit into the strip");
}

// A slot is marked wrong only when the command physically cannot run, and the
// reported index is the one the game highlights.
function testImpossibleCommands() {
  assert.equal(simulate(levels[0], ["drop"]).failedAt, 0, "dropping with empty hands");
  assert.equal(simulate(levels[1], ["pick"]).failedAt, 0, "picking away from the parcel");
  assert.equal(simulate(levels[3], ["left"]).failedAt, 0, "stepping off the grid");
  assert.equal(
    simulate(levels[5], ["right", "right", "pick", "right"]).failedAt,
    3,
    "stepping into the obstacle",
  );
}

function testObstacleBlocksOnlyItsCell() {
  const level = levels[5];
  assert.deepEqual(level.obstacles, [{ x: 3, y: 2 }]);
  assert.equal(isBlockedOn(level, { x: 3, y: 2 }), true);
  assert.equal(isBlockedOn(level, { x: 3, y: 1 }), false);
  assert.equal(isBlockedOn(level, { x: 6, y: 1 }), true, "the grid ends at x = 5");
  assert.equal(isBlockedOn(level, { x: 2, y: 3 }), true, "the grid ends at y = 2");
}

// The lamp solves the board from where the robot stands, so following it alone
// finishes every level inside the available slots.
function testHintFinishesEveryLevel() {
  levels.forEach((level, index) => {
    const route = [];
    let outcome = simulate(level, route);

    while (!outcome.delivered && route.length <= slotCount(level)) {
      const command = nextHelpfulCommand(level, outcome);
      assert.ok(command, `level ${index + 1} leaves the hint with nothing to suggest`);
      route.push(command);
      outcome = simulate(level, route);
      assert.equal(outcome.failedAt, -1, `level ${index + 1} hint suggested an illegal command`);
    }

    assert.equal(outcome.delivered, true, `level ${index + 1} is not solved by hints alone`);
    assert.ok(route.length <= slotCount(level), `level ${index + 1} hint route does not fit`);
  });
}

// The hint has to work after the child's own moves, not only from the start.
function testHintAfterAWanderingStart() {
  const level = levels[4];
  const outcome = simulate(level, ["up", "up", "pick", "left", "right"]);
  assert.equal(outcome.failedAt, -1);
  assert.equal(outcome.carrying, true);
  assert.ok(positionsMatch(outcome.robotPosition, { x: 4, y: 0 }));
  assert.equal(nextHelpfulCommand(level, outcome), "left");
}

function testDeliveredBoardAsksForNothing() {
  const level = levels[0];
  const outcome = simulate(level, level.solution);
  assert.equal(nextHelpfulCommand(level, outcome), null);
}

const tests = [
  testReferenceSolutions,
  testSpareSlots,
  testDetourWins,
  testImpossibleCommands,
  testObstacleBlocksOnlyItsCell,
  testHintFinishesEveryLevel,
  testHintAfterAWanderingStart,
  testDeliveredBoardAsksForNothing,
];

tests.forEach((test) => {
  test();
  console.log(`ok ${test.name}`);
});

console.log(`${tests.length} tests passed`);
