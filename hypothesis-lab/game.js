const OBJECTS = {
  blueBall: {
    name: "Blue ball",
    shape: "round",
    color: "blue",
    material: "rubber",
    size: "medium",
    category: "toy",
    canRoll: true,
  },
  coin: {
    name: "Silver coin",
    shape: "round",
    color: "silver",
    material: "metal",
    size: "small",
    category: "money",
    canRoll: true,
  },
  redBlock: {
    name: "Red block",
    shape: "square",
    color: "red",
    material: "wood",
    size: "small",
    category: "toy",
    canRoll: false,
  },
  spoon: {
    name: "Silver spoon",
    shape: "long",
    color: "silver",
    material: "metal",
    size: "medium",
    category: "kitchen",
    canRoll: false,
  },
  orangeButton: {
    name: "Orange button",
    shape: "round",
    color: "orange",
    material: "plastic",
    size: "small",
    category: "clothing",
    canRoll: false,
  },
  greenBook: {
    name: "Green book",
    shape: "rectangle",
    color: "green",
    material: "paper",
    size: "medium",
    category: "school",
    canRoll: false,
  },
  redPlate: {
    name: "Red plate",
    shape: "round",
    color: "red",
    material: "ceramic",
    size: "large",
    category: "kitchen",
    canRoll: false,
  },
  woodRing: {
    name: "Wooden ring",
    shape: "round",
    color: "brown",
    material: "wood",
    size: "medium",
    category: "toy",
    canRoll: true,
  },
  steelKey: {
    name: "Gold key",
    shape: "long",
    color: "gold",
    material: "metal",
    size: "small",
    category: "tool",
    canRoll: false,
  },
  silverRibbon: {
    name: "Silver ribbon",
    shape: "wavy",
    color: "silver",
    material: "fabric",
    size: "medium",
    category: "craft",
    canRoll: false,
  },
  plasticFork: {
    name: "Plastic fork",
    shape: "long",
    color: "blue",
    material: "plastic",
    size: "medium",
    category: "kitchen",
    canRoll: false,
  },
  blueCup: {
    name: "Blue cup",
    shape: "cylinder",
    color: "blue",
    material: "plastic",
    size: "medium",
    category: "kitchen",
    canRoll: false,
  },
  redBerry: {
    name: "Red berry",
    shape: "round",
    color: "red",
    material: "organic",
    size: "small",
    category: "food",
    canRoll: false,
  },
  redBook: {
    name: "Red book",
    shape: "rectangle",
    color: "red",
    material: "paper",
    size: "large",
    category: "school",
    canRoll: false,
  },
  blueMarble: {
    name: "Blue marble",
    shape: "round",
    color: "blue",
    material: "glass",
    size: "small",
    category: "toy",
    canRoll: true,
  },
  redSock: {
    name: "Red sock",
    shape: "irregular",
    color: "red",
    material: "fabric",
    size: "small",
    category: "clothing",
    canRoll: false,
  },
  redKey: {
    name: "Red key",
    shape: "long",
    color: "red",
    material: "metal",
    size: "small",
    category: "tool",
    canRoll: false,
  },
  metalBall: {
    name: "Metal ball",
    shape: "round",
    color: "silver",
    material: "metal",
    size: "medium",
    category: "tool",
    canRoll: true,
  },
  woodStar: {
    name: "Wooden star",
    shape: "star",
    color: "brown",
    material: "wood",
    size: "small",
    category: "craft",
    canRoll: false,
  },
  woodSpoon: {
    name: "Wooden spoon",
    shape: "long",
    color: "brown",
    material: "wood",
    size: "medium",
    category: "kitchen",
    canRoll: false,
  },
  shoe: {
    name: "Black shoe",
    shape: "irregular",
    color: "black",
    material: "fabric",
    size: "large",
    category: "clothing",
    canRoll: false,
  },
  blueWheel: {
    name: "Blue wheel",
    shape: "round",
    color: "blue",
    material: "rubber",
    size: "medium",
    category: "tool",
    canRoll: true,
  },
  redWheel: {
    name: "Red wheel",
    shape: "round",
    color: "red",
    material: "rubber",
    size: "medium",
    category: "tool",
    canRoll: true,
  },
  blueBlock: {
    name: "Blue block",
    shape: "square",
    color: "blue",
    material: "wood",
    size: "small",
    category: "toy",
    canRoll: false,
  },
  yellowBall: {
    name: "Yellow ball",
    shape: "round",
    color: "yellow",
    material: "rubber",
    size: "medium",
    category: "toy",
    canRoll: true,
  },
};

// The child reads the picture, not the caption. Every object is drawn from its own
// attributes, so color, shape, material and size can be checked by looking at it.
const ART_COLORS = {
  blue: { fill: "#3a7bd8", edge: "#1d4a91" },
  silver: { fill: "#c6ccd6", edge: "#87909f" },
  red: { fill: "#d94236", edge: "#93231a" },
  orange: { fill: "#ef8d28", edge: "#a55710" },
  green: { fill: "#459751", edge: "#255c30" },
  brown: { fill: "#8f5c2c", edge: "#573517" },
  gold: { fill: "#e0ad2a", edge: "#8f6a10" },
  black: { fill: "#3a4150", edge: "#171b22" },
  yellow: { fill: "#f7d64a", edge: "#b88f1f" },
};

const ART_SHAPES = {
  round: '<circle cx="50" cy="50" r="36" />',
  square: '<rect x="16" y="16" width="68" height="68" rx="7" />',
  rectangle: '<rect x="10" y="29" width="80" height="42" rx="6" />',
  long: '<rect x="6" y="38" width="88" height="24" rx="12" />',
  cylinder: '<path d="M27 28 a23 10 0 0 1 46 0 v44 a23 10 0 0 1 -46 0 z" />',
  wavy: '<path d="M8 44 q11 -17 22 0 t22 0 t22 0 t18 0 v14 q-9 17 -18 0 t-22 0 t-22 0 t-22 0 z" />',
  star: '<path d="M50 10 L61 38 L91 40 L68 59 L76 88 L50 71 L24 88 L32 59 L9 40 L39 38 Z" />',
  irregular: '<path d="M25 24 Q48 8 70 21 Q93 34 85 57 Q78 83 51 85 Q21 87 15 60 Q11 37 25 24 Z" />',
};

// Drawn over the body and clipped to its outline. Metal and wood have to be
// unmistakable: the rules ask about them directly.
const ART_MATERIALS = {
  metal: '<path d="M-20 110 L34 -10 L52 -10 L-2 110 Z" fill="#ffffff" opacity="0.62" />'
    + '<path d="M6 110 L60 -10 L69 -10 L15 110 Z" fill="#ffffff" opacity="0.38" />',
  wood: '<g fill="none" stroke="#3d2410" stroke-opacity="0.42" stroke-width="4" stroke-linecap="round">'
    + '<path d="M-10 30 q30 -9 60 0 t60 0" /><path d="M-10 50 q30 9 60 0 t60 0" />'
    + '<path d="M-10 70 q30 -9 60 0 t60 0" /></g>',
  glass: '<rect x="-10" y="-10" width="120" height="120" fill="#ffffff" opacity="0.4" />'
    + '<path d="M24 74 L60 14 L74 14 L38 74 Z" fill="#ffffff" opacity="0.72" />',
  fabric: '<g stroke="#ffffff" stroke-opacity="0.5" stroke-width="3">'
    + '<path d="M-10 22 H110 M-10 42 H110 M-10 62 H110 M-10 82 H110" />'
    + '<path d="M22 -10 V110 M42 -10 V110 M62 -10 V110 M82 -10 V110" /></g>',
  paper: '<path d="M58 -10 L110 42 L58 42 Z" fill="#ffffff" opacity="0.72" />'
    + '<path d="M58 -10 L58 42 L110 42" fill="none" stroke="#00000033" stroke-width="3" />',
  ceramic: '<ellipse cx="36" cy="34" rx="15" ry="9" fill="#ffffff" opacity="0.6"'
    + ' transform="rotate(-35 36 34)" />',
  plastic: '<ellipse cx="36" cy="32" rx="11" ry="7" fill="#ffffff" opacity="0.8"'
    + ' transform="rotate(-30 36 32)" />',
  rubber: '<g fill="#000000" opacity="0.16"><circle cx="30" cy="34" r="4" /><circle cx="52" cy="26" r="4" />'
    + '<circle cx="68" cy="46" r="4" /><circle cx="40" cy="60" r="4" /><circle cx="62" cy="72" r="4" /></g>',
  organic: '<g fill="#ffffff" opacity="0.45"><circle cx="34" cy="36" r="5" /><circle cx="56" cy="28" r="3" />'
    + '<circle cx="46" cy="56" r="4" /><circle cx="66" cy="60" r="3" /></g>',
};

const ART_SIZES = { small: 0.6, medium: 0.8, large: 1 };

// One picture for "no": a red bar across the token. Negated rules and the object that
// cannot roll share it, so the child learns a single sign for a crossed-out idea.
const ART_STRIKE = '<line x1="14" y1="86" x2="86" y2="14" stroke="#ffffff" stroke-width="17"'
  + ' stroke-linecap="round" opacity="0.85" />'
  + '<line x1="14" y1="86" x2="86" y2="14" stroke="#c0271c" stroke-width="9" stroke-linecap="round" />';

const TOKEN_NEUTRAL = { fill: "#dbe0e8", edge: "#6b7688" };

const MATERIAL_TOKEN_COLORS = {
  wood: ART_COLORS.brown,
  metal: ART_COLORS.silver,
  organic: ART_COLORS.green,
  glass: { fill: "#cfe6f5", edge: "#7297ad" },
  paper: { fill: "#f2ece0", edge: "#a2957e" },
  fabric: { fill: "#c9a2c6", edge: "#8a6188" },
  rubber: { fill: "#6f7681", edge: "#3f454e" },
  plastic: { fill: "#7fc9c2", edge: "#3f857e" },
  ceramic: { fill: "#f0e2d2", edge: "#ac9075" },
};

const TOKEN_ATTRIBUTE_LABELS = {
  color: "Color",
  shape: "Shape",
  material: "Material",
  size: "Size",
  category: "Category",
  move: "Movement",
};

const ATTRIBUTE_ICONS = {
  color: {
    blue: "color:blue", silver: "color:silver", red: "color:red", orange: "color:orange",
    green: "color:green", brown: "color:brown", gold: "color:gold", black: "color:black",
    yellow: "color:yellow",
  },
  shape: {
    round: "shape:round", square: "shape:square", long: "shape:long", wavy: "shape:wavy",
    rectangle: "shape:rectangle", irregular: "shape:irregular", star: "shape:star",
    cylinder: "shape:cylinder",
  },
  material: {
    rubber: "material:rubber", metal: "material:metal", wood: "material:wood",
    plastic: "material:plastic", paper: "material:paper", ceramic: "material:ceramic",
    fabric: "material:fabric", organic: "material:organic", glass: "material:glass",
  },
  size: { small: "size:small", medium: "size:medium", large: "size:large" },
  category: {
    toy: "category:toy", money: "category:money", kitchen: "category:kitchen",
    clothing: "category:clothing", school: "category:school", tool: "category:tool",
    craft: "category:craft", food: "category:food",
  },
  canRoll: { true: "move:roll", false: "move:still" },
};

// A category is the one attribute a drawing cannot show, so it keeps a pictogram.
const CATEGORY_EMOJI = {
  toy: "🧸", money: "🪙", kitchen: "🍽️", clothing: "👕",
  school: "📚", tool: "🛠️", craft: "✂️", food: "🍎",
};

let artInstanceCount = 0;

function renderObjectArt(object) {
  const clipId = `object-art-${(artInstanceCount += 1)}`;
  const color = ART_COLORS[object.color];
  const shape = ART_SHAPES[object.shape];
  const material = ART_MATERIALS[object.material] || "";
  const bodyOpacity = object.material === "glass" ? ' opacity="0.72"' : "";
  return `
    <svg class="object-art" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs><clipPath id="${clipId}">${shape}</clipPath></defs>
      <g transform="translate(50 50) scale(${ART_SIZES[object.size]}) translate(-50 -50)">
        <g fill="${color.fill}" stroke="${color.edge}" stroke-width="5"
          stroke-linejoin="round"${bodyOpacity}>${shape}</g>
        <g clip-path="url(#${clipId})">${material}</g>
        <g fill="none" stroke="${color.edge}" stroke-width="5" stroke-linejoin="round">${shape}</g>
      </g>
    </svg>
  `;
}

function renderTokenBody(kind, value) {
  if (kind === "color") {
    const color = ART_COLORS[value];
    return `<circle cx="50" cy="50" r="34" fill="${color.fill}" stroke="${color.edge}" stroke-width="8" />`;
  }
  if (kind === "shape") {
    return `<g fill="${TOKEN_NEUTRAL.fill}" stroke="${TOKEN_NEUTRAL.edge}" stroke-width="7"
      stroke-linejoin="round">${ART_SHAPES[value]}</g>`;
  }
  if (kind === "material") {
    const color = MATERIAL_TOKEN_COLORS[value];
    const clipId = `token-art-${(artInstanceCount += 1)}`;
    const body = ART_SHAPES.square;
    return `<defs><clipPath id="${clipId}">${body}</clipPath></defs>
      <g fill="${color.fill}" stroke="${color.edge}" stroke-width="7" stroke-linejoin="round">${body}</g>
      <g clip-path="url(#${clipId})">${ART_MATERIALS[value] || ""}</g>
      <g fill="none" stroke="${color.edge}" stroke-width="7" stroke-linejoin="round">${body}</g>`;
  }
  if (kind === "size") {
    return `<rect x="7" y="7" width="86" height="86" rx="14" fill="none" stroke="#b9c0cc"
        stroke-width="5" stroke-dasharray="9 8" />
      <circle cx="50" cy="50" r="${(34 * ART_SIZES[value]).toFixed(1)}"
        fill="${TOKEN_NEUTRAL.fill}" stroke="${TOKEN_NEUTRAL.edge}" stroke-width="8" />`;
  }
  // Movement: a ball with speed lines behind it. "Cannot roll" is the same ball crossed out.
  return `<g fill="none" stroke="${TOKEN_NEUTRAL.edge}" stroke-width="8" stroke-linecap="round">
      <path d="M6 32 h20" /><path d="M6 58 h13" /></g>
    <circle cx="60" cy="52" r="30" fill="${TOKEN_NEUTRAL.fill}" stroke="${TOKEN_NEUTRAL.edge}"
      stroke-width="8" />
    <path d="M48 40 a17 17 0 0 1 22 6" fill="none" stroke="${TOKEN_NEUTRAL.edge}" stroke-width="7"
      stroke-linecap="round" />`;
}

function renderAttributeToken(tokenId, negated = false) {
  const [kind, value] = tokenId.split(":");
  const struck = negated || tokenId === "move:still";
  const body = kind === "category"
    ? `<text x="50" y="52" text-anchor="middle" dominant-baseline="central"
        font-size="74">${CATEGORY_EMOJI[value]}</text>`
    : renderTokenBody(kind, value === "still" ? "roll" : value);
  return `<svg class="token-art" viewBox="0 0 100 100" aria-hidden="true"
    focusable="false">${body}${struck ? ART_STRIKE : ""}</svg>`;
}

function renderRuleArt(ruleId) {
  const rule = RULES[ruleId];
  const joiner = rule.connective === "or" ? "or" : "and";
  return rule.tokens.map((token, index) => {
    const negated = token.startsWith("!");
    const art = renderAttributeToken(negated ? token.slice(1) : token, negated);
    return index === 0 ? art : `<span class="rule-joiner">${joiner}</span>${art}`;
  }).join("");
}

// Only the attributes the mission's rules actually ask about. Six icons on every card
// is noise a six-year-old cannot filter.
function getLevelAttributeLabels(level) {
  const labels = new Set();
  level.hypothesisIds.forEach((ruleId) => {
    RULES[ruleId].tokens.forEach((token) => {
      labels.add(TOKEN_ATTRIBUTE_LABELS[token.replace("!", "").split(":")[0]]);
    });
  });
  return labels;
}

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

function getObjectAccessibleLabel(object, tested = false) {
  const attributes = getObjectAttributes(object)
    .map((attribute) => `${attribute.label}: ${attribute.value}`)
    .join(". ");
  return `Test ${object.name}${tested ? ", already tested" : ""}. ${attributes}.`;
}

const RULES = {
  red: {
    tokens: ["color:red"],
    title: "It accepts red objects",
    short: "red",
    test: (object) => object.color === "red",
  },
  round: {
    tokens: ["shape:round"],
    title: "It accepts round objects",
    short: "round",
    test: (object) => object.shape === "round",
  },
  metal: {
    tokens: ["material:metal"],
    title: "It accepts metal objects",
    short: "metal",
    test: (object) => object.material === "metal",
  },
  small: {
    tokens: ["size:small"],
    title: "It accepts small objects",
    short: "small",
    test: (object) => object.size === "small",
  },
  silver: {
    tokens: ["color:silver"],
    title: "It accepts silver objects",
    short: "silver",
    test: (object) => object.color === "silver",
  },
  kitchen: {
    tokens: ["category:kitchen"],
    title: "It accepts kitchen objects",
    short: "kitchen",
    test: (object) => object.category === "kitchen",
  },
  redAndSmall: {
    tokens: ["color:red", "size:small"],
    connective: "and",
    title: "It accepts red and small objects",
    short: "red and small",
    test: (object) => object.color === "red" && object.size === "small",
  },
  nonMetal: {
    tokens: ["!material:metal"],
    title: "It accepts non-metal objects",
    short: "not metal",
    test: (object) => object.material !== "metal",
  },
  wood: {
    tokens: ["material:wood"],
    title: "It accepts wooden objects",
    short: "wooden",
    test: (object) => object.material === "wood",
  },
  roundAndNotMetal: {
    tokens: ["shape:round", "!material:metal"],
    connective: "and",
    title: "It accepts round, non-metal objects",
    short: "round and not metal",
    test: (object) => object.shape === "round" && object.material !== "metal",
  },
  long: {
    tokens: ["shape:long"],
    title: "It accepts long objects",
    short: "long",
    test: (object) => object.shape === "long",
  },
  kitchenOrWood: {
    tokens: ["category:kitchen", "material:wood"],
    connective: "or",
    title: "It accepts kitchen or wooden objects",
    short: "kitchen or wooden",
    test: (object) => object.category === "kitchen" || object.material === "wood",
  },
  blue: {
    tokens: ["color:blue"],
    title: "It accepts blue objects",
    short: "blue",
    test: (object) => object.color === "blue",
  },
  rolls: {
    tokens: ["move:roll"],
    title: "It accepts objects that can roll",
    short: "can roll",
    test: (object) => Boolean(object.canRoll),
  },
  blueAndRolls: {
    tokens: ["color:blue", "move:roll"],
    connective: "and",
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
    getObjectAccessibleLabel,
    getLevelAttributeLabels,
    renderObjectArt,
    renderRuleArt,
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
    const shownLabels = getLevelAttributeLabels(LEVELS[currentLevelIndex]);
    return `
      <span class="attribute-strip">
        ${getObjectAttributes(object)
          .filter((attribute) => shownLabels.has(attribute.label))
          .map((attribute) => `
          <span
            class="attribute-icon"
            role="img"
            aria-label="${attribute.label}: ${attribute.value}"
            title="${attribute.label}: ${attribute.value}"
          >${renderAttributeToken(attribute.icon)}</span>
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
          <span class="evidence-art">${renderObjectArt(object)}</span>
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
        title="${RULES[ruleId].title}"
        ${phase === "proof" || disproved ? "disabled" : ""}
      >
        <span class="hypothesis-icon" aria-hidden="true">${renderRuleArt(ruleId)}</span>
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
          aria-label="${getObjectAccessibleLabel(object, tested)}"
        >
          <span class="object-art-slot">${renderObjectArt(object)}</span>
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
      elements.selectedObject.innerHTML = renderObjectArt(object);
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
          <span class="record-object">${renderObjectArt(OBJECTS[record.objectId])}</span>
          <span class="record-line">
            <b class="record-rule" aria-hidden="true">${renderRuleArt(record.hypothesisId)}</b>
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

  function dismissSuccessDialog() {
    if (!showingCompletionSummary && completedLevels.size < LEVELS.length) {
      continueGame();
      return;
    }
    closeSuccessDialog();
    focusBeforeDialog?.focus();
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
      dismissSuccessDialog();
      return;
    }
    if (event.key !== "Tab") return;
    event.preventDefault();
    elements.nextButton.focus();
  });

  render();
  if (firstIncompleteLevel === -1) showCompletionSummary();
}
