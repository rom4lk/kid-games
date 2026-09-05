const assert = require("node:assert/strict");
const {
  levels,
  SPARE_SLOTS,
  ORIGINAL_LEVEL_COUNT,
  PREVIOUS_LEVEL_COUNT,
  positionsMatch,
  slotCount,
  isBlockedOn,
  validateLevel,
  validateLevels,
  normalizeProgress,
  simulate,
  findShortestCompletion,
  nextHelpfulCommand,
} = require("./game.js");

const SYMBOL_MATCH_LEVEL_INDEX = 9;
const TWO_NEARBY_LEVEL_INDEX = 10;
const CROSSING_LEVEL_INDEX = 11;
const USEFUL_ORDER_LEVEL_INDEX = 12;

const originalLevels = [
  {
    robot: { x: 1, y: 1 },
    parcel: { x: 1, y: 1 },
    station: { x: 4, y: 1 },
    obstacles: [],
    commands: ["pick", "right", "drop"],
    solution: ["pick", "right", "right", "right", "drop"],
  },
  {
    robot: { x: 2, y: 1 },
    parcel: { x: 1, y: 1 },
    station: { x: 5, y: 1 },
    obstacles: [],
    commands: ["left", "pick", "right", "drop"],
    solution: ["left", "pick", "right", "right", "right", "right", "drop"],
  },
  {
    robot: { x: 1, y: 2 },
    parcel: { x: 1, y: 1 },
    station: { x: 4, y: 1 },
    obstacles: [],
    commands: ["left", "pick", "right", "drop", "up"],
    solution: ["up", "pick", "right", "right", "right", "drop"],
  },
  {
    robot: { x: 0, y: 2 },
    parcel: { x: 2, y: 2 },
    station: { x: 4, y: 0 },
    obstacles: [],
    commands: ["left", "pick", "right", "drop", "up"],
    solution: ["right", "right", "pick", "up", "up", "right", "right", "drop"],
  },
  {
    robot: { x: 4, y: 2 },
    parcel: { x: 4, y: 0 },
    station: { x: 0, y: 2 },
    obstacles: [],
    commands: ["left", "pick", "right", "drop", "up", "down"],
    solution: [
      "up",
      "up",
      "pick",
      "left",
      "left",
      "left",
      "left",
      "down",
      "down",
      "drop",
    ],
  },
  {
    robot: { x: 0, y: 2 },
    parcel: { x: 2, y: 2 },
    station: { x: 4, y: 0 },
    obstacles: [{ x: 3, y: 2 }],
    commands: ["left", "pick", "right", "drop", "up", "down"],
    solution: ["right", "right", "pick", "up", "right", "right", "up", "drop"],
  },
];

function parcelState(outcome, id) {
  return outcome.parcelStates.find((parcel) => parcel.id === id);
}

function asLegacyLevel(level) {
  const parcel = level.parcels[0];
  const station = level.stations.find((candidate) => candidate.id === parcel.stationId);
  const { parcels, stations, ...unchanged } = level;
  return {
    ...unchanged,
    parcel: parcel.position,
    station: station.position,
  };
}

function testReferenceSolutions() {
  levels.forEach((level, index) => {
    const outcome = simulate(level, level.solution);
    const shortest = findShortestCompletion(level, simulate(level, []));
    assert.equal(outcome.failedAt, -1, `level ${index + 1} solution hits a wall`);
    assert.equal(outcome.delivered, true, `level ${index + 1} solution loses a parcel`);
    assert.equal(
      level.solution.length,
      shortest.commands.length,
      `level ${index + 1} reference route is not shortest`,
    );
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

function testDetourWins() {
  const detour = ["left", "pick", "right", "left", "right", "right", "right", "right", "drop"];
  const outcome = simulate(levels[1], detour);
  assert.equal(outcome.failedAt, -1);
  assert.equal(outcome.delivered, true);
  assert.ok(detour.length <= slotCount(levels[1]), "the detour does not fit into the strip");
}

function testImpossibleCommands() {
  assert.equal(simulate(levels[0], ["drop"]).failedAt, 0, "dropping with empty hands");
  assert.equal(simulate(levels[1], ["pick"]).failedAt, 0, "picking away from a parcel");
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

function testOriginalLevelsPreserveTheirBehavior() {
  assert.equal(ORIGINAL_LEVEL_COUNT, originalLevels.length);
  assert.deepEqual(
    levels.slice(0, ORIGINAL_LEVEL_COUNT).map(asLegacyLevel),
    originalLevels,
  );
  levels.slice(0, ORIGINAL_LEVEL_COUNT).forEach((level) => {
    assert.equal(level.parcels.length, 1);
    assert.equal(level.stations.length, 1);
    assert.equal(level.parcels[0].symbol, "star");
  });
}

function testLevelValidation() {
  assert.equal(validateLevels(levels), true);
  const base = {
    robot: { x: 0, y: 0 },
    parcels: [
      { id: "one", symbol: "star", position: { x: 0, y: 1 }, stationId: "home" },
      { id: "two", symbol: "circle", position: { x: 1, y: 1 }, stationId: "other" },
    ],
    stations: [
      { id: "home", symbol: "star", position: { x: 4, y: 1 } },
      { id: "other", symbol: "circle", position: { x: 5, y: 1 } },
    ],
    obstacles: [],
    commands: ["pick", "right", "drop"],
    solution: [],
  };

  assert.throws(
    () => validateLevel({ ...base, parcels: [base.parcels[0], base.parcels[0]] }, 0),
    /duplicate parcel IDs/,
  );
  assert.throws(
    () => validateLevel({
      ...base,
      parcels: [base.parcels[0], { ...base.parcels[1], position: { x: 0, y: 1 } }],
    }, 0),
    /sharing a starting cell/,
  );
  assert.throws(
    () => validateLevel({
      ...base,
      parcels: [{ ...base.parcels[0], stationId: "missing" }],
    }, 0),
    /without a matching station/,
  );
}

function testClosedAndOpenGateBlocking() {
  const level = levels[7];
  assert.equal(isBlockedOn(level, level.gate, false), true, "a closed gate blocks its cell");
  assert.equal(isBlockedOn(level, level.gate, true), false, "an open gate allows entry");
  assert.equal(isBlockedOn(level, { x: 3, y: 0 }, false), false, "nearby cells stay open");
}

function testButtonOpensGatePermanentlyForRun() {
  const level = levels[6];
  const onButton = simulate(level, ["pick", "right", "right"]);
  assert.equal(onButton.failedAt, -1);
  assert.equal(onButton.carryingParcelId, "parcel-star", "the button works while carrying");
  assert.equal(onButton.gateOpen, true, "stepping on the button opens the gate");
  assert.ok(positionsMatch(parcelState(onButton, "parcel-star").position, level.button));

  const afterGate = simulate(level, ["pick", "right", "right", "right", "right"]);
  assert.equal(afterGate.failedAt, -1);
  assert.equal(afterGate.gateOpen, true, "the gate stays open after later commands");

  const freshRun = simulate(level, []);
  assert.equal(freshRun.gateOpen, false, "a new simulation restores the initial gate state");
}

function testClosedGateReportsCommandIndex() {
  const outcome = simulate(levels[7], ["right", "right", "right"]);
  assert.equal(outcome.failedAt, 2);
  assert.equal(outcome.gateOpen, false);
  assert.ok(positionsMatch(outcome.robotPosition, { x: 2, y: 1 }));
}

function testCompletedProgressUnlocksAddedLevels() {
  const completedOriginal = Array.from({ length: ORIGINAL_LEVEL_COUNT }, (_, index) => index);
  const originalMigration = normalizeProgress({
    maxUnlockedLevel: ORIGINAL_LEVEL_COUNT - 1,
    completedLevels: completedOriginal,
  });
  assert.equal(originalMigration.maxUnlockedLevel, ORIGINAL_LEVEL_COUNT);
  assert.deepEqual(originalMigration.completedLevels, completedOriginal);

  const incomplete = normalizeProgress({
    maxUnlockedLevel: ORIGINAL_LEVEL_COUNT - 1,
    completedLevels: completedOriginal.slice(0, -1),
  });
  assert.equal(incomplete.maxUnlockedLevel, ORIGINAL_LEVEL_COUNT - 1);

  const completedPrevious = Array.from({ length: PREVIOUS_LEVEL_COUNT }, (_, index) => index);
  const previousMigration = normalizeProgress({
    maxUnlockedLevel: PREVIOUS_LEVEL_COUNT - 1,
    completedLevels: completedPrevious,
  });
  assert.equal(previousMigration.maxUnlockedLevel, PREVIOUS_LEVEL_COUNT);
  assert.deepEqual(previousMigration.completedLevels, completedPrevious);
}

function testSymbolMatchingIntroduction() {
  const level = levels[SYMBOL_MATCH_LEVEL_INDEX];
  assert.equal(level.parcels.length, 1);
  assert.equal(level.stations.length, 2);
  const outcome = simulate(level, ["pick", "right", "drop"]);
  assert.equal(outcome.failedAt, 2);
  assert.equal(outcome.failureReason, "wrong-station");
  assert.equal(outcome.carryingParcelId, "parcel-star");
  assert.equal(outcome.matchingStationId, "station-star");
  assert.equal(outcome.wrongStationId, "station-circle");
  assert.equal(outcome.delivered, false);
}

function testEitherDeliveryOrderCompletesLevel() {
  const level = levels[TWO_NEARBY_LEVEL_INDEX];
  const starFirst = level.solution;
  const circleFirst = [
    "down", "pick", "right", "drop", "left", "up", "up", "pick", "right", "drop",
  ];

  for (const route of [starFirst, circleFirst]) {
    const outcome = simulate(level, route);
    assert.equal(outcome.failedAt, -1);
    assert.equal(outcome.delivered, true);
    assert.ok(outcome.parcelStates.every((parcel) => parcel.delivered));
    assert.ok(route.length <= slotCount(level));
  }
}

function testOneDeliveryDoesNotCompleteLevel() {
  const outcome = simulate(
    levels[TWO_NEARBY_LEVEL_INDEX],
    ["up", "pick", "right", "drop"],
  );
  assert.equal(outcome.failedAt, -1);
  assert.equal(outcome.delivered, false);
  assert.equal(parcelState(outcome, "parcel-star").delivered, true);
  assert.equal(parcelState(outcome, "parcel-circle").delivered, false);
}

function testRobotCannotPickSecondParcelWithFullHands() {
  const outcome = simulate(
    levels[TWO_NEARBY_LEVEL_INDEX],
    ["up", "pick", "down", "down", "pick"],
  );
  assert.equal(outcome.failedAt, 4);
  assert.equal(outcome.failureReason, "hands-full");
  assert.equal(outcome.carryingParcelId, "parcel-star");
}

function testMovementUpdatesOnlyCarriedParcel() {
  const level = levels[TWO_NEARBY_LEVEL_INDEX];
  const outcome = simulate(level, ["up", "pick", "right"]);
  assert.ok(positionsMatch(parcelState(outcome, "parcel-star").position, { x: 2, y: 0 }));
  assert.ok(positionsMatch(
    parcelState(outcome, "parcel-circle").position,
    level.parcels.find((parcel) => parcel.id === "parcel-circle").position,
  ));
}

function testDeliveredParcelStaysDelivered() {
  const level = levels[TWO_NEARBY_LEVEL_INDEX];
  const partial = ["up", "pick", "right", "drop", "left", "down", "down", "pick"];
  const halfway = simulate(level, partial);
  assert.equal(halfway.failedAt, -1);
  assert.equal(parcelState(halfway, "parcel-star").delivered, true);
  assert.equal(halfway.carryingParcelId, "parcel-circle");

  const finished = simulate(level, [...partial, "right", "drop"]);
  assert.equal(finished.delivered, true);
  assert.equal(parcelState(finished, "parcel-star").delivered, true);
  assert.equal(parcelState(finished, "parcel-circle").delivered, true);
}

function testCrossingRoutesAllowBothOrders() {
  const level = levels[CROSSING_LEVEL_INDEX];
  const circleFirst = [
    "down", "pick", "right", "right", "up", "up", "drop",
    "left", "left", "pick", "right", "right", "down", "down", "drop",
  ];
  assert.equal(simulate(level, level.solution).delivered, true);
  assert.equal(simulate(level, circleFirst).delivered, true);
  assert.equal(circleFirst.length, level.solution.length);
}

function testUsefulOrderLevelAcceptsBothOrders() {
  const level = levels[USEFUL_ORDER_LEVEL_INDEX];
  const longerStarFirst = [
    "down", "right", "right", "up", "pick", "right", "drop",
    "down", "left", "left", "pick", "left", "drop",
  ];
  assert.equal(simulate(level, level.solution).delivered, true);
  assert.equal(simulate(level, longerStarFirst).delivered, true);
  assert.equal(longerStarFirst.length, level.solution.length + 2);
  assert.ok(longerStarFirst.length <= slotCount(level));
}

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

function testTwoParcelSearchStaysSmall() {
  levels.slice(TWO_NEARBY_LEVEL_INDEX).forEach((level, offset) => {
    const result = findShortestCompletion(level, simulate(level, []));
    assert.ok(result, `level ${TWO_NEARBY_LEVEL_INDEX + offset + 1} has no solution`);
    assert.ok(
      result.exploredStates < 5000,
      `level ${TWO_NEARBY_LEVEL_INDEX + offset + 1} explores too many states`,
    );
    assert.ok(result.commands.length <= slotCount(level));
  });
}

function testHintAfterAWanderingStart() {
  const level = levels[4];
  const outcome = simulate(level, ["up", "up", "pick", "left", "right"]);
  assert.equal(outcome.failedAt, -1);
  assert.equal(outcome.carryingParcelId, "parcel-star");
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
  testOriginalLevelsPreserveTheirBehavior,
  testLevelValidation,
  testClosedAndOpenGateBlocking,
  testButtonOpensGatePermanentlyForRun,
  testClosedGateReportsCommandIndex,
  testCompletedProgressUnlocksAddedLevels,
  testSymbolMatchingIntroduction,
  testEitherDeliveryOrderCompletesLevel,
  testOneDeliveryDoesNotCompleteLevel,
  testRobotCannotPickSecondParcelWithFullHands,
  testMovementUpdatesOnlyCarriedParcel,
  testDeliveredParcelStaysDelivered,
  testCrossingRoutesAllowBothOrders,
  testUsefulOrderLevelAcceptsBothOrders,
  testHintFinishesEveryLevel,
  testTwoParcelSearchStaysSmall,
  testHintAfterAWanderingStart,
  testDeliveredBoardAsksForNothing,
];

tests.forEach((test) => {
  test();
  console.log(`ok ${test.name}`);
});

console.log(`${tests.length} tests passed`);
