const assert = require("node:assert/strict");
const {
  LEVELS,
  OBJECTS,
  ATTRIBUTE_ICONS,
  RULES,
  ruleResult,
  findCounterexample,
  createProofQueue,
  isRuleDisproved,
  sanitizeCompletedLevels,
  getObjectAttributes,
  getObjectAccessibleLabel,
  getLevelAttributeLabels,
  renderObjectArt,
  renderRuleArt,
  evaluateExperiment,
} = require("./game.js");

function subsets(values) {
  return Array.from({ length: 2 ** values.length }, (_, mask) => (
    values.filter((_, index) => mask & (1 << index))
  ));
}

assert.equal(LEVELS.length, 6);
assert.notEqual(ATTRIBUTE_ICONS.shape.long, ATTRIBUTE_ICONS.size.medium);
assert.notEqual(ATTRIBUTE_ICONS.color.gold, ATTRIBUTE_ICONS.color.yellow);

const accessibleObjectLabel = getObjectAccessibleLabel(OBJECTS.redBerry);
assert.match(accessibleObjectLabel, /^Test Red berry\./);
getObjectAttributes(OBJECTS.redBerry).forEach(({ label, value }) => {
  assert.ok(accessibleObjectLabel.includes(`${label}: ${value}`));
});
assert.match(getObjectAccessibleLabel(OBJECTS.redBerry, true), /already tested/);

// Every attribute a mission asks about must be visible, and nothing else may crowd the card.
LEVELS.forEach((level, levelIndex) => {
  const shownLabels = getLevelAttributeLabels(level);
  assert.ok(shownLabels.size < 6, `Level ${levelIndex + 1} must hide unused attributes`);
  level.hypothesisIds.forEach((ruleId) => {
    RULES[ruleId].tokens.forEach((token) => {
      const [kind, value] = token.replace("!", "").split(":");
      const group = kind === "move" ? ATTRIBUTE_ICONS.canRoll : ATTRIBUTE_ICONS[kind];
      assert.ok(
        Object.values(group).includes(token.replace("!", "")),
        `Rule ${ruleId} uses unknown token ${kind}:${value}`,
      );
    });
    const artAttributes = getObjectAttributes(OBJECTS[level.testObjects[0]])
      .filter((attribute) => shownLabels.has(attribute.label));
    assert.ok(artAttributes.length > 0, `Level ${levelIndex + 1} must show at least one attribute`);
  });
});

// Two objects that differ only in an attribute the rules use must not draw the same picture.
assert.notEqual(renderObjectArt(OBJECTS.redBlock), renderObjectArt(OBJECTS.blueBlock));
assert.notEqual(renderObjectArt(OBJECTS.redBerry), renderObjectArt(OBJECTS.redPlate));
assert.notEqual(renderRuleArt("red"), renderRuleArt("round"));
assert.match(renderRuleArt("nonMetal"), /#c0271c/);
assert.match(renderRuleArt("kitchenOrWood"), /rule-joiner">or</);
assert.match(renderRuleArt("redAndSmall"), /rule-joiner">and</);

LEVELS.forEach((level, levelIndex) => {
  assert.ok(RULES[level.targetRule], `Level ${levelIndex + 1} must have a target rule`);
  assert.ok(level.hypothesisIds.includes(level.targetRule), `Level ${levelIndex + 1} must offer the target rule`);

  const allObjectIds = [...level.initialEvidence, ...level.testObjects];
  assert.equal(new Set(allObjectIds).size, allObjectIds.length, `Level ${levelIndex + 1} object IDs must be unique`);
  allObjectIds.forEach((objectId) => {
    assert.ok(OBJECTS[objectId], `Level ${levelIndex + 1} references missing object ${objectId}`);
    ["shape", "color", "material", "size", "category", "canRoll"].forEach((property) => {
      assert.notEqual(
        OBJECTS[objectId][property],
        undefined,
        `Object ${objectId} must define ${property}`,
      );
    });
    assert.equal(typeof OBJECTS[objectId].canRoll, "boolean", `Object ${objectId} canRoll must be boolean`);
    const attributes = getObjectAttributes(OBJECTS[objectId]);
    assert.equal(attributes.length, 6, `Object ${objectId} must show all six attributes`);
    attributes.forEach((attribute) => {
      assert.ok(attribute.icon, `Object ${objectId} ${attribute.label} must have an icon`);
    });
  });

  const initialResults = level.initialEvidence.map((objectId) => ruleResult(level.targetRule, objectId));
  assert.ok(initialResults.includes(true), `Level ${levelIndex + 1} needs an accepted demonstration`);
  assert.ok(initialResults.includes(false), `Level ${levelIndex + 1} needs a rejected demonstration`);

  const wrongHypotheses = level.hypothesisIds.filter((hypothesisId) => hypothesisId !== level.targetRule);
  const initiallyOpenWrongHypotheses = wrongHypotheses.filter(
    (hypothesisId) => !isRuleDisproved(level, hypothesisId),
  );
  assert.ok(
    initiallyOpenWrongHypotheses.length > 0,
    `Level ${levelIndex + 1} must leave a wrong hypothesis to test`,
  );
  assert.ok(
    initiallyOpenWrongHypotheses.length < wrongHypotheses.length,
    `Level ${levelIndex + 1} initial evidence must eliminate at least one wrong hypothesis`,
  );
  assert.equal(isRuleDisproved(level, level.targetRule), false, `Level ${levelIndex + 1} target must stay open`);

  wrongHypotheses.forEach((hypothesisId) => {
    const counterexample = findCounterexample(level, hypothesisId);
    assert.ok(counterexample, `Level ${levelIndex + 1} must disprove ${hypothesisId}`);
    assert.notEqual(
      ruleResult(level.targetRule, counterexample),
      ruleResult(hypothesisId, counterexample),
      `Counterexample for ${hypothesisId} must separate the rules`,
    );
  });

  subsets(level.testObjects).forEach((testedIds) => {
    const records = testedIds.map((objectId) => ({
      objectId,
      result: ruleResult(level.targetRule, objectId),
    }));

    level.hypothesisIds.forEach((hypothesisId) => {
      if (isRuleDisproved(level, hypothesisId, records)) return;

      const proofQueue = createProofQueue(level, hypothesisId, testedIds);
      assert.equal(proofQueue.length, 3, `Level ${levelIndex + 1} proof needs three objects`);
      assert.equal(new Set(proofQueue).size, 3, `Level ${levelIndex + 1} proof objects must be unique`);

      const untestedIds = level.testObjects.filter((objectId) => !testedIds.includes(objectId));
      assert.ok(
        proofQueue.slice(0, Math.min(3, untestedIds.length))
          .every((objectId) => untestedIds.includes(objectId)),
        `Level ${levelIndex + 1} proof must prefer untested objects`,
      );

      if (hypothesisId !== level.targetRule) {
        assert.notEqual(
          ruleResult(level.targetRule, proofQueue[0]),
          ruleResult(hypothesisId, proofQueue[0]),
          `Level ${levelIndex + 1} must reject selectable wrong rule ${hypothesisId} first`,
        );
      }
    });
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

[
  [LEVELS[2], "redAndSmall", "redBook", false],
  [LEVELS[3], "roundAndNotMetal", "redPlate", true],
  [LEVELS[4], "kitchenOrWood", "redBlock", true],
  [LEVELS[5], "blueAndRolls", "blueBlock", false],
].forEach(([level, ruleId, objectId, prediction]) => {
  const evaluation = evaluateExperiment(level, ruleId, objectId, prediction);
  assert.equal(evaluation.predictionMatches, true, `${ruleId} prediction must match`);
  assert.equal(evaluation.hypothesisFits, true, `${ruleId} must fit its target evidence`);
});

assert.deepEqual([...sanitizeCompletedLevels([0, 1, 1, 6, -1, "2", 3.5])], [0, 1]);
assert.deepEqual([...sanitizeCompletedLevels(null)], []);

console.log(`Secret Rule Lab: ${LEVELS.length} missions and all logic checks passed.`);
