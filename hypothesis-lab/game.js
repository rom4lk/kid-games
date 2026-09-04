const OBJECTS = {
  blueBall: {
    name: "Blue ball",
    emoji: "🔵",
    shape: "round",
    color: "blue",
    material: "rubber",
    size: "medium",
    category: "toy",
    canRoll: true,
  },
  coin: {
    name: "Silver coin",
    emoji: "🪙",
    shape: "round",
    color: "silver",
    material: "metal",
    size: "small",
    category: "money",
    canRoll: true,
  },
  redBlock: {
    name: "Red block",
    emoji: "🟥",
    shape: "square",
    color: "red",
    material: "wood",
    size: "small",
    category: "toy",
    canRoll: false,
  },
  spoon: {
    name: "Silver spoon",
    emoji: "🥄",
    shape: "long",
    color: "silver",
    material: "metal",
    size: "medium",
    category: "kitchen",
    canRoll: false,
  },
  orangeButton: {
    name: "Orange button",
    emoji: "🟠",
    shape: "round",
    color: "orange",
    material: "plastic",
    size: "small",
    category: "clothing",
    canRoll: false,
  },
  greenBook: {
    name: "Green book",
    emoji: "📗",
    shape: "rectangle",
    color: "green",
    material: "paper",
    size: "medium",
    category: "school",
    canRoll: false,
  },
  redPlate: {
    name: "Red plate",
    emoji: "🍽️",
    shape: "round",
    color: "red",
    material: "ceramic",
    size: "large",
    category: "kitchen",
    canRoll: false,
  },
  woodRing: {
    name: "Wooden ring",
    emoji: "⭕",
    shape: "round",
    color: "brown",
    material: "wood",
    size: "medium",
    category: "toy",
    canRoll: true,
  },
  steelKey: {
    name: "Gold key",
    emoji: "🔑",
    shape: "long",
    color: "gold",
    material: "metal",
    size: "small",
    category: "tool",
    canRoll: false,
  },
  silverRibbon: {
    name: "Silver ribbon",
    emoji: "🎗️",
    shape: "wavy",
    color: "silver",
    material: "fabric",
    size: "medium",
    category: "craft",
    canRoll: false,
  },
  plasticFork: {
    name: "Plastic fork",
    emoji: "🍴",
    shape: "long",
    color: "blue",
    material: "plastic",
    size: "medium",
    category: "kitchen",
    canRoll: false,
  },
  blueCup: {
    name: "Blue cup",
    emoji: "🥤",
    shape: "cylinder",
    color: "blue",
    material: "plastic",
    size: "medium",
    category: "kitchen",
    canRoll: false,
  },
  redBerry: {
    name: "Red berry",
    emoji: "🍓",
    shape: "round",
    color: "red",
    material: "organic",
    size: "small",
    category: "food",
    canRoll: false,
  },
  redBook: {
    name: "Red book",
    emoji: "📕",
    shape: "rectangle",
    color: "red",
    material: "paper",
    size: "large",
    category: "school",
    canRoll: false,
  },
  blueMarble: {
    name: "Blue marble",
    emoji: "🔮",
    shape: "round",
    color: "blue",
    material: "glass",
    size: "small",
    category: "toy",
    canRoll: true,
  },
  redSock: {
    name: "Red sock",
    emoji: "🧦",
    shape: "irregular",
    color: "red",
    material: "fabric",
    size: "small",
    category: "clothing",
    canRoll: false,
  },
  redKey: {
    name: "Red key",
    emoji: "🗝️",
    shape: "long",
    color: "red",
    material: "metal",
    size: "small",
    category: "tool",
    canRoll: false,
  },
  metalBall: {
    name: "Metal ball",
    emoji: "⚙️",
    shape: "round",
    color: "silver",
    material: "metal",
    size: "medium",
    category: "tool",
    canRoll: true,
  },
  woodStar: {
    name: "Wooden star",
    emoji: "⭐",
    shape: "star",
    color: "brown",
    material: "wood",
    size: "small",
    category: "craft",
    canRoll: false,
  },
  woodSpoon: {
    name: "Wooden spoon",
    emoji: "🪵🥄",
    shape: "long",
    color: "brown",
    material: "wood",
    size: "medium",
    category: "kitchen",
    canRoll: false,
  },
  shoe: {
    name: "Black shoe",
    emoji: "👟",
    shape: "irregular",
    color: "black",
    material: "fabric",
    size: "large",
    category: "clothing",
    canRoll: false,
  },
  blueWheel: {
    name: "Blue wheel",
    emoji: "🔵🛞",
    shape: "round",
    color: "blue",
    material: "rubber",
    size: "medium",
    category: "tool",
    canRoll: true,
  },
  redWheel: {
    name: "Red wheel",
    emoji: "🔴🛞",
    shape: "round",
    color: "red",
    material: "rubber",
    size: "medium",
    category: "tool",
    canRoll: true,
  },
  blueBlock: {
    name: "Blue block",
    emoji: "🟦",
    shape: "square",
    color: "blue",
    material: "wood",
    size: "small",
    category: "toy",
    canRoll: false,
  },
  yellowBall: {
    name: "Yellow ball",
    emoji: "🟡",
    shape: "round",
    color: "yellow",
    material: "rubber",
    size: "medium",
    category: "toy",
    canRoll: true,
  },
};

const ATTRIBUTE_ICONS = {
  color: {
    blue: "🔵", silver: "⚪", red: "🔴", orange: "🟠", green: "🟢",
    brown: "🟤", gold: "🟡", black: "⚫", yellow: "🟡",
  },
  shape: {
    round: "⭕", square: "◼", long: "↔️", wavy: "〰️", rectangle: "▭",
    irregular: "✳️", star: "⭐", cylinder: "🥫",
  },
  material: {
    rubber: "🛞", metal: "⚙️", wood: "🪵", plastic: "🧴", paper: "📄",
    ceramic: "🏺", fabric: "🧵", organic: "🌱", glass: "💎",
  },
  size: { small: "🤏", medium: "↔️", large: "🙌" },
  category: {
    toy: "🧸", money: "🪙", kitchen: "🍽️", clothing: "👕",
    school: "📚", tool: "🛠️", craft: "✂️", food: "🍎",
  },
  canRoll: { true: "🎳", false: "⛔" },
};

function getObjectAttributes(object) {
  return [
    { label: "Color", value: object.color, icon: ATTRIBUTE_ICONS.color[object.color] },
    { label: "Shape", value: object.shape, icon: ATTRIBUTE_ICONS.shape[object.shape] },
    { label: "Material", value: object.material, icon: ATTRIBUTE_ICONS.material[object.material] },
    { label: "Size", value: object.size, icon: ATTRIBUTE_ICONS.size[object.size] },
    { label: "Category", value: object.category, icon: ATTRIBUTE_ICONS.category[object.category] },
    {
      label: "Movement",
      value: object.canRoll ? "can roll" : "cannot roll",
      icon: ATTRIBUTE_ICONS.canRoll[object.canRoll],
    },
  ];
}

const RULES = {
  red: {
    icon: "🔴",
    title: "It accepts red objects",
    short: "red",
    test: (object) => object.color === "red",
  },
  round: {
    icon: "⭕",
    title: "It accepts round objects",
    short: "round",
    test: (object) => object.shape === "round",
  },
  metal: {
    icon: "🔧",
    title: "It accepts metal objects",
    short: "metal",
    test: (object) => object.material === "metal",
  },
  small: {
    icon: "🤏",
    title: "It accepts small objects",
    short: "small",
    test: (object) => object.size === "small",
  },
  silver: {
    icon: "🥈",
    title: "It accepts silver objects",
    short: "silver",
    test: (object) => object.color === "silver",
  },
  kitchen: {
    icon: "🍽️",
    title: "It accepts kitchen objects",
    short: "kitchen",
    test: (object) => object.category === "kitchen",
  },
  redAndSmall: {
    icon: "🔴 + 🤏",
    title: "It accepts red and small objects",
    short: "red and small",
    test: (object) => object.color === "red" && object.size === "small",
  },
  nonMetal: {
    icon: "🔧 ✖",
    title: "It accepts non-metal objects",
    short: "not metal",
    test: (object) => object.material !== "metal",
  },
  wood: {
    icon: "🪵",
    title: "It accepts wooden objects",
    short: "wooden",
    test: (object) => object.material === "wood",
  },
  roundAndNotMetal: {
    icon: "⭕ + 🔧 ✖",
    title: "It accepts round, non-metal objects",
    short: "round and not metal",
    test: (object) => object.shape === "round" && object.material !== "metal",
  },
  long: {
    icon: "📏",
    title: "It accepts long objects",
    short: "long",
    test: (object) => object.shape === "long",
  },
  kitchenOrWood: {
    icon: "🍽️ / 🪵",
    title: "It accepts kitchen or wooden objects",
    short: "kitchen or wooden",
    test: (object) => object.category === "kitchen" || object.material === "wood",
  },
  blue: {
    icon: "🔵",
    title: "It accepts blue objects",
    short: "blue",
    test: (object) => object.color === "blue",
  },
  rolls: {
    icon: "🎳",
    title: "It accepts objects that can roll",
    short: "can roll",
    test: (object) => Boolean(object.canRoll),
  },
  blueAndRolls: {
    icon: "🔵 + 🎳",
    title: "It accepts blue objects that can roll",
    short: "blue and rolls",
    test: (object) => object.color === "blue" && object.canRoll,
  },
};

const LEVELS = [
  {
    title: "Find the First Rule",
    brief: "Look at the examples. Find the bot's rule.",
    targetRule: "round",
    hypothesisIds: ["red", "round", "metal", "small"],
    initialEvidence: ["coin", "redBlock", "greenBook"],
    testObjects: ["spoon", "orangeButton", "blueBall", "redPlate", "woodRing"],
  },
  {
    title: "Color or Material?",
    brief: "Find what matters: color or material.",
    targetRule: "metal",
    hypothesisIds: ["silver", "metal", "kitchen", "small"],
    initialEvidence: ["coin", "steelKey", "silverRibbon", "redKey"],
    testObjects: ["spoon", "orangeButton", "plasticFork", "blueCup", "metalBall"],
  },
  {
    title: "Two Clues",
    brief: "This rule has two parts.",
    targetRule: "redAndSmall",
    hypothesisIds: ["red", "small", "round", "redAndSmall"],
    initialEvidence: ["redBerry", "redBlock", "redBook", "redPlate"],
    testObjects: ["redSock", "blueMarble", "orangeButton", "redKey", "greenBook"],
  },
  {
    title: "Special Case",
    brief: "Round is not enough. Find what else matters.",
    targetRule: "roundAndNotMetal",
    hypothesisIds: ["round", "nonMetal", "roundAndNotMetal", "wood"],
    initialEvidence: ["blueBall", "coin", "woodRing", "redPlate"],
    testObjects: ["metalBall", "redBlock", "woodStar", "blueWheel", "spoon"],
  },
  {
    title: "Two Ways",
    brief: "An object can fit in two different ways.",
    targetRule: "kitchenOrWood",
    hypothesisIds: ["kitchen", "wood", "kitchenOrWood", "long"],
    initialEvidence: ["spoon", "blueBall", "shoe", "blueCup"],
    testObjects: ["woodSpoon", "redBlock", "woodStar", "steelKey", "greenBook"],
  },
  {
    title: "Final Rule",
    brief: "Use color and movement together.",
    targetRule: "blueAndRolls",
    hypothesisIds: ["blue", "rolls", "round", "blueAndRolls"],
    initialEvidence: ["blueWheel", "redWheel", "steelKey", "yellowBall"],
    testObjects: ["blueBall", "blueMarble", "metalBall", "blueCup", "blueBlock"],
  },
];

function ruleResult(ruleId, objectId) {
  return RULES[ruleId].test(OBJECTS[objectId]);
}

function findCounterexample(level, hypothesisId, excludedIds = []) {
  const excluded = new Set(excludedIds);
  return [...level.testObjects, ...level.initialEvidence].find(
    (objectId) => !excluded.has(objectId)
      && ruleResult(level.targetRule, objectId) !== ruleResult(hypothesisId, objectId),
  );
}

function createProofQueue(level, hypothesisId, excludedIds = []) {
  const allObjects = [...level.testObjects, ...level.initialEvidence];
  const knownIds = [...new Set([...level.initialEvidence, ...excludedIds])];
  const counterexample = findCounterexample(level, hypothesisId, knownIds);
  const queue = counterexample ? [counterexample] : [];

  level.testObjects.forEach((objectId) => {
    if (queue.length < 3 && !queue.includes(objectId) && !knownIds.includes(objectId)) {
      queue.push(objectId);
    }
  });

  allObjects.forEach((objectId) => {
    if (queue.length < 3 && !queue.includes(objectId)) queue.push(objectId);
  });

  return queue.slice(0, 3);
}

function isRuleDisproved(level, ruleId, records = []) {
  const evidence = [
    ...level.initialEvidence.map((objectId) => ({
      objectId,
      result: ruleResult(level.targetRule, objectId),
    })),
    ...records,
  ];
  return evidence.some((record) => ruleResult(ruleId, record.objectId) !== record.result);
}

function sanitizeCompletedLevels(saved) {
  if (!Array.isArray(saved)) return new Set();
  return new Set(saved.filter(
    (index) => Number.isInteger(index) && index >= 0 && index < LEVELS.length,
  ));
}

function evaluateExperiment(level, hypothesisId, objectId, prediction) {
  const expected = ruleResult(hypothesisId, objectId);
  const actual = ruleResult(level.targetRule, objectId);
  return {
    actual,
    expected,
    hypothesisFits: expected === actual,
    predictionMatches: prediction === actual,
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    OBJECTS,
    ATTRIBUTE_ICONS,
    RULES,
    LEVELS,
    ruleResult,
    findCounterexample,
    createProofQueue,
    isRuleDisproved,
    sanitizeCompletedLevels,
    getObjectAttributes,
    evaluateExperiment,
  };
}

if (typeof document !== "undefined") {
  const elements = {
    missionCounter: document.querySelector("#missionCounter"),
    progressFill: document.querySelector("#progressFill"),
    badgeCount: document.querySelector("#badgeCount"),
    missionLabel: document.querySelector("#missionLabel"),
    missionTitle: document.querySelector("#missionTitle"),
    missionBrief: document.querySelector("#missionBrief"),
    factCount: document.querySelector("#factCount"),
    evidenceList: document.querySelector("#evidenceList"),
    hypothesisGrid: document.querySelector("#hypothesisGrid"),
    objectGrid: document.querySelector("#objectGrid"),
    testsLeft: document.querySelector("#testsLeft"),
    selectedObject: document.querySelector("#selectedObject"),
    experimentLabel: document.querySelector("#experimentLabel"),
    experimentTitle: document.querySelector("#experimentTitle"),
    experimentPrompt: document.querySelector("#experimentPrompt"),
    feedback: document.querySelector("#feedback"),
    feedbackText: document.querySelector("#feedbackText"),
    proveButton: document.querySelector("#proveButton"),
    phasePill: document.querySelector("#phasePill"),
    notebookStatus: document.querySelector("#notebookStatus"),
    notebookEmpty: document.querySelector("#notebookEmpty"),
    recordList: document.querySelector("#recordList"),
    notebookBody: document.querySelector("#notebookBody"),
    successDialog: document.querySelector("#successDialog"),
    badgeShelf: document.querySelector("#badgeShelf"),
    testSection: document.querySelector("#testSection"),
    experimentPanel: document.querySelector("#experimentPanel"),
    successCopy: document.querySelector("#successCopy"),
    nextButton: document.querySelector("#nextButton"),
    soundButton: document.querySelector("#soundButton"),
    restartButton: document.querySelector("#restartButton"),
    instructionText: document.querySelector("#instructionText"),
    gameShell: document.querySelector("#gameShell"),
    topbar: document.querySelector("#topbar"),
    successTitle: document.querySelector("#successTitle"),
  };

  let currentLevelIndex = 0;
  let selectedHypothesisId = null;
  let selectedObjectId = null;
  let testedObjectIds = [];
  let records = [];
  let proofQueue = [];
  let proofIndex = 0;
  let phase = "explore";
  let completedLevels = readCompletedLevels();
  let soundEnabled = readSoundSetting();
  let focusBeforeDialog = null;
  let showingCompletionSummary = false;

  const firstIncompleteLevel = LEVELS.findIndex((_, index) => !completedLevels.has(index));
  currentLevelIndex = firstIncompleteLevel === -1 ? 0 : firstIncompleteLevel;

  function readCompletedLevels() {
    try {
      const saved = JSON.parse(localStorage.getItem("secretRuleLabCompletedV1"));
      return sanitizeCompletedLevels(saved);
    } catch {
      return new Set();
    }
  }

  function readSoundSetting() {
    try {
      return localStorage.getItem("secretRuleLabSoundV1") !== "off";
    } catch {
      return true;
    }
  }

  function saveSetting(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Private browsing modes can refuse writes. Progress stays for this session only.
    }
  }

  function playTone(frequency, duration = 0.08) {
    if (!soundEnabled) return;
    window.GameSound?.tone({ frequency, duration, volume: 0.07 });
  }

  function isDisproved(ruleId) {
    return isRuleDisproved(LEVELS[currentLevelIndex], ruleId, records);
  }

  function renderAttributeStrip(object) {
    return `
      <span class="attribute-strip">
        ${getObjectAttributes(object).map((attribute) => `
          <span
            class="attribute-icon"
            role="img"
            aria-label="${attribute.label}: ${attribute.value}"
            title="${attribute.label}: ${attribute.value}"
          >${attribute.icon}</span>
        `).join("")}
      </span>
    `;
  }

  function activeFocusSelector() {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement)) return null;
    if (active.dataset.rule) return `[data-rule="${active.dataset.rule}"]`;
    if (active.dataset.object) return `[data-object="${active.dataset.object}"]`;
    if (active.dataset.prediction) return `[data-prediction="${active.dataset.prediction}"]`;
    return active.id ? `#${active.id}` : null;
  }

  function canReceiveFocus(element) {
    return element && !element.disabled && !element.closest("[hidden]") && !element.closest("[inert]");
  }

  function focusNextAction() {
    let next;
    if (!selectedHypothesisId) {
      next = elements.hypothesisGrid.querySelector("button:not(:disabled)");
    } else if (phase === "proof" || selectedObjectId) {
      next = elements.experimentPanel.querySelector("button:not(:disabled)");
    } else {
      next = elements.objectGrid.querySelector("button:not(:disabled)")
        || (!elements.proveButton.hidden ? elements.proveButton : null);
    }
    next?.focus();
  }

  function restoreFocus(selector) {
    if (!selector) return;
    const target = document.querySelector(selector);
    if (canReceiveFocus(target)) target.focus();
    else focusNextAction();
  }

  function setFeedback(message, tone = "neutral") {
    elements.feedback.dataset.tone = tone;
    elements.feedbackText.textContent = message;
    elements.feedback.querySelector(".feedback-icon").textContent = tone === "success" ? "✓" : tone === "warning" ? "!" : "i";
  }

  function renderProgress() {
    elements.missionCounter.textContent = `Mission ${currentLevelIndex + 1} of ${LEVELS.length}`;
    elements.badgeCount.textContent = completedLevels.size;
    elements.progressFill.style.width = `${(completedLevels.size / LEVELS.length) * 100}%`;
    elements.soundButton.textContent = soundEnabled ? "♪" : "×";
    elements.soundButton.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
  }

  function renderEvidence() {
    const level = LEVELS[currentLevelIndex];
    const evidenceIds = [...new Set([...level.initialEvidence, ...testedObjectIds])];
    elements.factCount.textContent = `${evidenceIds.length} examples`;
    elements.evidenceList.innerHTML = evidenceIds.map((objectId) => {
      const object = OBJECTS[objectId];
      const accepted = ruleResult(level.targetRule, objectId);
      return `
        <article class="evidence-item">
          <span class="evidence-emoji" aria-hidden="true">${object.emoji}</span>
          <span class="evidence-copy">
            <strong>${object.name}</strong>
            <small>${level.initialEvidence.includes(objectId) ? "Bot example" : "Your test"}</small>
            ${renderAttributeStrip(object)}
          </span>
          <span class="result-tag ${accepted ? "accepted" : "rejected"}">${accepted ? "Fits" : "Does not fit"}</span>
        </article>
      `;
    }).join("");
  }

  function renderHypotheses() {
    const level = LEVELS[currentLevelIndex];
    elements.hypothesisGrid.innerHTML = level.hypothesisIds.map((ruleId) => {
      const disproved = isDisproved(ruleId);
      return `
      <button
        class="hypothesis-button ${selectedHypothesisId === ruleId ? "selected" : ""} ${disproved ? "disproved" : ""}"
        type="button"
        data-rule="${ruleId}"
        aria-pressed="${selectedHypothesisId === ruleId}"
        aria-label="${RULES[ruleId].title}"
        title="${RULES[ruleId].title}"
        ${phase === "proof" || disproved ? "disabled" : ""}
      >
        <span class="hypothesis-icon" aria-hidden="true">${RULES[ruleId].icon}</span>
        <strong>${RULES[ruleId].short}</strong>
        ${disproved ? '<small>Rule is out</small>' : ""}
      </button>
    `;
    }).join("");
  }

  function renderObjects() {
    const level = LEVELS[currentLevelIndex];
    const remaining = level.testObjects.filter((objectId) => !testedObjectIds.includes(objectId));
    elements.testsLeft.textContent = `${remaining.length} left`;
    elements.objectGrid.innerHTML = level.testObjects.map((objectId) => {
      const object = OBJECTS[objectId];
      const tested = testedObjectIds.includes(objectId);
      return `
        <button
          class="object-button ${selectedObjectId === objectId ? "selected" : ""} ${tested ? "tested" : ""}"
          type="button"
          data-object="${objectId}"
          ${tested || phase === "proof" ? "disabled" : ""}
          aria-pressed="${selectedObjectId === objectId}"
          aria-label="Test ${object.name}${tested ? ", already tested" : ""}"
        >
          <span class="emoji" aria-hidden="true">${object.emoji}</span>
          <span class="name">${object.name}</span>
          ${renderAttributeStrip(object)}
          ${tested ? '<span class="tested-mark" aria-hidden="true">✓</span>' : ""}
        </button>
      `;
    }).join("");
  }

  function renderExperiment() {
    const objectId = phase === "proof" ? proofQueue[proofIndex] : selectedObjectId;
    const object = objectId ? OBJECTS[objectId] : null;
    const buttons = document.querySelectorAll("[data-prediction]");

    if (!object) {
      elements.selectedObject.innerHTML = '<span class="selected-placeholder">?</span>';
      elements.experimentLabel.textContent = "Your guess";
      elements.experimentTitle.textContent = "What will the bot do?";
      elements.experimentPrompt.textContent = "Pick an object first.";
    } else {
      elements.selectedObject.textContent = object.emoji;
      elements.experimentLabel.textContent = phase === "proof"
        ? `Proof trial ${proofIndex + 1} of ${proofQueue.length}`
        : "Your guess";
      elements.experimentTitle.textContent = `Will the ${object.name.toLowerCase()} fit?`;
      const isKnown = phase === "proof"
        && (LEVELS[currentLevelIndex].initialEvidence.includes(objectId) || testedObjectIds.includes(objectId));
      elements.experimentPrompt.textContent = isKnown
        ? "You know this one. Say it again."
        : "What will the bot do?";
    }

    buttons.forEach((button) => {
      button.disabled = !object || !selectedHypothesisId;
    });
  }

  function renderNotebook() {
    elements.notebookStatus.textContent = records.length === 0 ? "No tests yet" : `Tests: ${records.length}`;
    elements.notebookEmpty.hidden = records.length > 0;
    elements.recordList.hidden = records.length === 0;
    elements.notebookBody.innerHTML = records.map((record) => {
      return `
        <article class="record-card ${record.hypothesisFits ? "record-supports" : "record-contradicts"}">
          <span class="record-object" aria-hidden="true">${OBJECTS[record.objectId].emoji}</span>
          <span class="record-line">
            <b>${RULES[record.hypothesisId].icon}</b>
            <small>${RULES[record.hypothesisId].short}</small>
          </span>
          <span class="record-step">
            <small>Your guess</small>
            <b aria-label="${record.prediction ? "Fits" : "Does not fit"}">${record.prediction ? "✓" : "×"}</b>
          </span>
          <span class="record-step">
            <small>Bot did</small>
            <b aria-label="${record.result ? "Fits" : "Does not fit"}">${record.result ? "✓" : "×"}</b>
          </span>
          <span class="record-guess-verdict ${record.predictionMatches ? "matched" : "different"}">
            ${record.predictionMatches ? "Guess matched" : "Different result"}
          </span>
          <span class="record-verdict">${record.hypothesisFits ? "Rule fits" : "Rule is out"}</span>
        </article>
      `;
    }).join("");
  }

  function renderSteps() {
    const hasHypothesis = Boolean(selectedHypothesisId);
    const hasObject = Boolean(phase === "proof" ? proofQueue[proofIndex] : selectedObjectId);
    elements.hypothesisGrid.closest(".research-card").dataset.step = !hasHypothesis
      ? "1"
      : !hasObject ? "2" : "3";
    elements.testSection.hidden = !hasHypothesis || phase === "proof";
    elements.experimentPanel.hidden = !hasObject;
    elements.proveButton.hidden = !canProve();
    if (!hasHypothesis) {
      elements.instructionText.textContent = "Look at the examples. Pick the rule you think fits.";
    } else if (phase === "proof") {
      elements.instructionText.textContent = "Keep this rule. Guess what the bot will do.";
    } else if (hasObject) {
      elements.instructionText.textContent = "Guess what the bot will do.";
    } else {
      elements.instructionText.textContent = "Pick an object to test your rule.";
    }
  }

  function canProve() {
    return phase !== "proof" && Boolean(selectedHypothesisId) && testedObjectIds.length >= 2;
  }

  function renderBadges() {
    elements.badgeShelf.replaceChildren();
    LEVELS.forEach((level, index) => {
      const badge = document.createElement("span");
      badge.className = `badge${completedLevels.has(index) ? " earned" : ""}`;
      badge.textContent = completedLevels.has(index) ? "◆" : "◇";
      elements.badgeShelf.append(badge);
    });
  }

  function render() {
    const focusSelector = activeFocusSelector();
    const level = LEVELS[currentLevelIndex];
    elements.missionLabel.textContent = `Mission ${String(currentLevelIndex + 1).padStart(2, "0")}`;
    elements.missionTitle.textContent = level.title;
    elements.missionBrief.textContent = level.brief;
    elements.phasePill.textContent = phase === "proof" ? "Check rule" : "Explore";
    elements.proveButton.disabled = !canProve();
    renderProgress();
    renderEvidence();
    renderHypotheses();
    renderObjects();
    renderExperiment();
    renderNotebook();
    renderSteps();
    restoreFocus(focusSelector);
  }

  function selectHypothesis(ruleId) {
    selectedHypothesisId = ruleId;
    selectedObjectId = null;
    setFeedback(`Rule: ${RULES[ruleId].short}. Now pick an object.`, "neutral");
    render();
  }

  function selectObject(objectId) {
    if (!selectedHypothesisId) {
      setFeedback("Pick a rule first.", "warning");
      return;
    }
    if (testedObjectIds.includes(objectId)) {
      setFeedback("You already tested this object.", "warning");
      return;
    }

    selectedObjectId = objectId;
    setFeedback(`Will the ${OBJECTS[objectId].name.toLowerCase()} fit?`, "neutral");
    render();
  }

  function addRecord(objectId, prediction, evaluation) {
    records.unshift({
      hypothesisId: selectedHypothesisId,
      objectId,
      prediction,
      result: evaluation.actual,
      hypothesisFits: evaluation.hypothesisFits,
      predictionMatches: evaluation.predictionMatches,
    });
    if (!testedObjectIds.includes(objectId)) testedObjectIds.push(objectId);
  }

  function runPrediction(prediction) {
    const level = LEVELS[currentLevelIndex];
    const objectId = phase === "proof" ? proofQueue[proofIndex] : selectedObjectId;
    if (!objectId || !selectedHypothesisId) return;

    const evaluation = evaluateExperiment(level, selectedHypothesisId, objectId, prediction);
    addRecord(objectId, prediction, evaluation);
    selectedObjectId = null;

    // The rule and the guess are judged separately: a wrong guess does not
    // disprove a rule that the bot just agreed with.
    if (!evaluation.hypothesisFits) {
      phase = "explore";
      proofQueue = [];
      proofIndex = 0;
      selectedHypothesisId = null;
      setFeedback(
        "This rule does not fit. Pick another rule.",
        "warning",
      );
      playTone(190, 0.14);
      render();
      return;
    }

    if (!evaluation.predictionMatches) {
      setFeedback(
        phase === "proof"
          ? "The bot surprised you, but the rule still fits. Try this trial again."
          : "The bot surprised you, but the rule still fits. Pick another object.",
        "warning",
      );
      playTone(300);
      render();
      return;
    }

    playTone(520);
    if (phase === "proof") {
      proofIndex += 1;
      if (proofIndex === proofQueue.length) {
        completeLevel();
        return;
      }
      setFeedback("Yes! Try the next object.", "success");
    } else {
      setFeedback("Your guess matched. Try one more object.", "success");
    }
    render();
  }

  function startProof() {
    const level = LEVELS[currentLevelIndex];
    phase = "proof";
    proofIndex = 0;
    proofQueue = createProofQueue(level, selectedHypothesisId, testedObjectIds);
    setFeedback("Keep this rule. Guess three results.", "neutral");
    render();
  }

  function completeLevel() {
    completedLevels.add(currentLevelIndex);
    saveSetting("secretRuleLabCompletedV1", JSON.stringify([...completedLevels]));
    elements.successTitle.textContent = "Badge earned!";
    elements.successCopy.textContent = `The rule was: ${RULES[LEVELS[currentLevelIndex].targetRule].short}.`;
    elements.nextButton.textContent = currentLevelIndex < LEVELS.length - 1 ? "Next mission" : "Play from the start";
    showingCompletionSummary = false;
    render();
    openSuccessDialog();
    playTone(660, 0.18);
    window.setTimeout(() => playTone(880, 0.22), 120);
  }

  function setGameInert(value) {
    elements.topbar.inert = value;
    elements.gameShell.inert = value;
  }

  function openSuccessDialog() {
    renderBadges();
    focusBeforeDialog = document.activeElement;
    elements.successDialog.hidden = false;
    setGameInert(true);
    elements.nextButton.focus();
  }

  function closeSuccessDialog() {
    elements.successDialog.hidden = true;
    setGameInert(false);
  }

  function showCompletionSummary() {
    showingCompletionSummary = true;
    elements.successTitle.textContent = "All rules checked!";
    elements.successCopy.textContent = "You earned every badge.";
    elements.nextButton.textContent = "Play from the start";
    openSuccessDialog();
  }

  function resetMission() {
    selectedHypothesisId = null;
    selectedObjectId = null;
    testedObjectIds = [];
    records = [];
    proofQueue = [];
    proofIndex = 0;
    phase = "explore";
    closeSuccessDialog();
    setFeedback("Look at the bot's examples. Then pick a rule.", "neutral");
    render();
  }

  function continueGame() {
    const startsNewRun = showingCompletionSummary || completedLevels.size === LEVELS.length;
    if (startsNewRun) {
      completedLevels.clear();
      saveSetting("secretRuleLabCompletedV1", "[]");
      currentLevelIndex = 0;
    } else if (currentLevelIndex < LEVELS.length - 1) {
      currentLevelIndex += 1;
    } else {
      currentLevelIndex = 0;
    }
    resetMission();
    const firstHypothesis = elements.hypothesisGrid.querySelector("button:not(:disabled)");
    (firstHypothesis || focusBeforeDialog)?.focus();
    focusBeforeDialog = null;
    showingCompletionSummary = false;
  }

  document.addEventListener("click", (event) => {
    const hypothesisButton = event.target.closest("[data-rule]");
    const objectButton = event.target.closest("[data-object]");
    const predictionButton = event.target.closest("[data-prediction]");

    if (hypothesisButton) selectHypothesis(hypothesisButton.dataset.rule);
    if (objectButton) selectObject(objectButton.dataset.object);
    if (predictionButton) runPrediction(predictionButton.dataset.prediction === "accept");
  });

  elements.restartButton.addEventListener("click", resetMission);
  elements.proveButton.addEventListener("click", startProof);
  elements.nextButton.addEventListener("click", continueGame);
  elements.soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    saveSetting("secretRuleLabSoundV1", soundEnabled ? "on" : "off");
    renderProgress();
    if (soundEnabled) playTone(540);
  });

  elements.successDialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      continueGame();
      return;
    }
    if (event.key !== "Tab") return;
    event.preventDefault();
    elements.nextButton.focus();
  });

  render();
  if (firstIncompleteLevel === -1) showCompletionSummary();
}
