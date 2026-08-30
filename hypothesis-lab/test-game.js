const assert = require("node:assert/strict");
const {
  LEVELS,
  OBJECTS,
  RULES,
  ruleResult,
  findCounterexample,
  createProofQueue,
  evaluateExperiment,
} = require("./game.js");

assert.equal(LEVELS.length, 6);

LEVELS.forEach((level, levelIndex) => {
  assert.ok(RULES[level.targetRule], `Level ${levelIndex + 1} must have a target rule`);
  assert.ok(level.hypothesisIds.includes(level.targetRule), `Level ${levelIndex + 1} must offer the target rule`);

  const allObjectIds = [...level.initialEvidence, ...level.testObjects];
  assert.equal(new Set(allObjectIds).size, allObjectIds.length, `Level ${levelIndex + 1} object IDs must be unique`);
  allObjectIds.forEach((objectId) => {
    assert.ok(OBJECTS[objectId], `Level ${levelIndex + 1} references missing object ${objectId}`);
  });

  const initialResults = level.initialEvidence.map((objectId) => ruleResult(level.targetRule, objectId));
  assert.ok(initialResults.includes(true), `Level ${levelIndex + 1} needs an accepted demonstration`);
  assert.ok(initialResults.includes(false), `Level ${levelIndex + 1} needs a rejected demonstration`);

  level.hypothesisIds
    .filter((hypothesisId) => hypothesisId !== level.targetRule)
    .forEach((hypothesisId) => {
      const counterexample = findCounterexample(level, hypothesisId);
      assert.ok(counterexample, `Level ${levelIndex + 1} must disprove ${hypothesisId}`);

      // A player can only ever consume testObjects, so at least one counterexample must
      // live in initialEvidence. Otherwise createProofQueue can run out of them and
      // certify a wrong hypothesis.
      assert.ok(
        findCounterexample(level, hypothesisId, level.testObjects),
        `Level ${levelIndex + 1} needs a counterexample for ${hypothesisId} outside testObjects`,
      );
      assert.notEqual(
        ruleResult(level.targetRule, counterexample),
        ruleResult(hypothesisId, counterexample),
        `Counterexample for ${hypothesisId} must separate the rules`,
      );

      const proofQueue = createProofQueue(level, hypothesisId);
      assert.equal(proofQueue.length, 3, `Level ${levelIndex + 1} proof needs three objects`);
      assert.equal(new Set(proofQueue).size, 3, `Level ${levelIndex + 1} proof objects must be unique`);
      assert.equal(proofQueue[0], counterexample, `Level ${levelIndex + 1} proof must start with a counterexample`);
    });

  const correctProofQueue = createProofQueue(level, level.targetRule);
  assert.equal(correctProofQueue.length, 3, `Level ${levelIndex + 1} correct proof needs three objects`);
});

const firstLevel = LEVELS[0];
const correctGuess = evaluateExperiment(firstLevel, "round", "orangeButton", true);
assert.equal(correctGuess.predictionMatches, true);
assert.equal(correctGuess.hypothesisFits, true);

const surprisingResult = evaluateExperiment(firstLevel, "round", "orangeButton", false);
assert.equal(surprisingResult.predictionMatches, false);
assert.equal(surprisingResult.hypothesisFits, true);

const disprovedRule = evaluateExperiment(firstLevel, "red", "orangeButton", true);
assert.equal(disprovedRule.predictionMatches, true);
assert.equal(disprovedRule.hypothesisFits, false);

console.log(`Secret Rule Lab: ${LEVELS.length} missions and all logic checks passed.`);
