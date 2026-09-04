const assert = require("node:assert/strict");
const {
  LEVELS,
  createLevelState,
  applyCommand,
  isLevelComplete,
  expandProgram,
  findInvalidRepeat,
  getMotionDelay,
  simulateProgram,
} = require("./game.js");

// Breadth-first search over (row, column, direction, open doors, collected
// batteries, last two expanded actions) to find the true minimum number of
// program cards that can win a level, so `par` can be checked against it
// instead of only against the hand-written `solution`.
function stateKey(state, lastTwo) {
  return JSON.stringify({
    row: state.position.row,
    column: state.position.column,
    direction: state.direction,
    doors: [...state.openDoors].sort(),
    collected: [...state.collected].sort((a, b) => a - b),
    lastTwo,
  });
}

function cloneLevelState(state) {
  return {
    position: { ...state.position },
    direction: state.direction,
    openDoors: new Set(state.openDoors),
    collected: new Set(state.collected),
  };
}

function minimumCardCount(level) {
  const start = createLevelState(level);
  if (isLevelComplete(level, start)) return 0;

  const visited = new Set([stateKey(start, [])]);
  let frontier = [{ state: start, lastTwo: [] }];

  for (let cards = 1; frontier.length > 0; cards += 1) {
    const next = [];

    for (const node of frontier) {
      for (const command of level.available) {
        if (command === "repeat") {
          if (node.lastTwo.length < 2) continue;
          const [first, second] = node.lastTwo;

          const afterFirst = cloneLevelState(node.state);
          if (!applyCommand(level, afterFirst, first).ok) continue;
          if (isLevelComplete(level, afterFirst)) return cards;

          const afterSecond = cloneLevelState(afterFirst);
          if (!applyCommand(level, afterSecond, second).ok) continue;
          if (isLevelComplete(level, afterSecond)) return cards;

          const key = stateKey(afterSecond, node.lastTwo);
          if (visited.has(key)) continue;
          visited.add(key);
          next.push({ state: afterSecond, lastTwo: node.lastTwo });
        } else {
          const afterState = cloneLevelState(node.state);
          if (!applyCommand(level, afterState, command).ok) continue;
          if (isLevelComplete(level, afterState)) return cards;

          const lastTwo = [...node.lastTwo, command].slice(-2);
          const key = stateKey(afterState, lastTwo);
          if (visited.has(key)) continue;
          visited.add(key);
          next.push({ state: afterState, lastTwo });
        }
      }
    }

    frontier = next;
  }

  return Infinity;
}

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

  const startCell = level.map[level.start.row][level.start.column];
  assert.ok(!/[1-9]/.test(startCell), `Level ${index + 1} should not start on a battery cell`);

  const batteryDigits = level.map.flatMap((row) => [...row]).filter((cell) => /[1-9]/.test(cell));
  assert.equal(new Set(batteryDigits).size, batteryDigits.length, `Level ${index + 1} battery digits should be unique`);

  assert.equal(minimumCardCount(level), level.par, `Level ${index + 1} par should match the true minimum program length`);
});

const blockedResult = simulateProgram(LEVELS[1], ["forward", "forward"]);
assert.equal(blockedResult.complete, false);
assert.equal(blockedResult.error, "A wall blocks the robot.");

const closedDoorResult = simulateProgram(LEVELS[2], ["forward", "right", "forward", "forward", "left", "forward", "forward"]);
assert.equal(closedDoorResult.complete, false);
assert.equal(closedDoorResult.error, "The red door is still closed.");

console.log(`Robot Lab: ${LEVELS.length} levels and all logic checks passed.`);
