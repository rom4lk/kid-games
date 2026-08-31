const assert = require("node:assert/strict");
const {
  LEVELS,
  expandProgram,
  findInvalidRepeat,
  getMotionDelay,
  simulateProgram,
} = require("./game.js");

assert.equal(getMotionDelay(330, false), 330);
assert.equal(getMotionDelay(330, true), 20);

assert.deepEqual(
  expandProgram(["forward", "forward", "repeat"]),
  [
    { command: "forward", sourceIndex: 0 },
    { command: "forward", sourceIndex: 1 },
    { command: "forward", sourceIndex: 2 },
    { command: "forward", sourceIndex: 2 },
  ],
);

assert.equal(findInvalidRepeat(["forward", "repeat"]), 1);
assert.equal(findInvalidRepeat(["forward", "forward", "repeat"]), -1);

LEVELS.forEach((level, index) => {
  const result = simulateProgram(level, level.solution);
  assert.equal(result.complete, true, `Level ${index + 1} solution should complete the mission`);
  assert.equal(result.error, null, `Level ${index + 1} solution should not hit an obstacle`);
  assert.ok(level.solution.length <= level.limit, `Level ${index + 1} solution should fit the command limit`);
  assert.equal(level.solution.length, level.par, `Level ${index + 1} solution should match par`);
});

const blockedResult = simulateProgram(LEVELS[1], ["forward", "forward"]);
assert.equal(blockedResult.complete, false);
assert.equal(blockedResult.error, "A wall blocks the robot.");

const closedDoorResult = simulateProgram(LEVELS[2], ["forward", "right", "forward", "forward", "left", "forward", "forward"]);
assert.equal(closedDoorResult.complete, false);
assert.equal(closedDoorResult.error, "The red door is still closed.");

console.log(`Robot Lab: ${LEVELS.length} levels and all logic checks passed.`);
