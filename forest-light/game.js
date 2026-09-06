const KINDS = Object.freeze(["branch", "stone", "berry"]);
const GOAL_RECIPE = "fire";

// Several silhouettes stand at the camp at once, so the player picks the order.
// The campfire is the chapter goal, the other two only change the camp.
const RECIPES = Object.freeze([
  Object.freeze({ id: "fire", parts: Object.freeze(["branch", "branch", "stone"]), goal: true }),
  Object.freeze({ id: "torch", parts: Object.freeze(["branch", "stone"]), goal: false }),
  Object.freeze({ id: "bowl", parts: Object.freeze(["berry", "berry"]), goal: false }),
]);
const RECIPE = RECIPES.find((recipe) => recipe.goal).parts;

// The map is three screens wide. The camp sits in the middle, so both
// neighbours are one step away and the way home is never longer than one move.
const GLADES = Object.freeze(["berries", "camp", "stones"]);
const CAMP_GLADE = "camp";

// Every resource is described here, not in the stylesheet, so a glade can be
// refilled or rearranged without touching the layout rules.
const LAYOUT = Object.freeze([
  { id: "branch-first", glade: "camp", kind: "branch", x: 30, y: 50, tutorial: true },
  { id: "branch-second", glade: "camp", kind: "branch", x: 70, y: 55 },
  { id: "stone-camp", glade: "camp", kind: "stone", x: 78, y: 70 },
  { id: "bush-camp", glade: "camp", kind: "berry", x: 26, y: 70, bush: true },
  { id: "bush-camp-far", glade: "camp", kind: "berry", x: 55, y: 43, bush: true, far: true },

  { id: "bush-low-a", glade: "berries", kind: "berry", x: 30, y: 48, bush: true },
  { id: "bush-low-b", glade: "berries", kind: "berry", x: 58, y: 66, bush: true },
  { id: "bush-low-c", glade: "berries", kind: "berry", x: 76, y: 40, bush: true, far: true },
  { id: "branch-low", glade: "berries", kind: "branch", x: 26, y: 72 },

  { id: "stone-slope-a", glade: "stones", kind: "stone", x: 30, y: 52 },
  { id: "stone-slope-b", glade: "stones", kind: "stone", x: 60, y: 68 },
  { id: "stone-slope-c", glade: "stones", kind: "stone", x: 78, y: 38, far: true },
  { id: "branch-slope", glade: "stones", kind: "branch", x: 24, y: 72 },
]);

// A branch is lifted with one press, a stone is dug out with two, a bush is
// shaken three times. No holding and no double taps.
const HARVEST_TAPS = Object.freeze({ branch: 1, stone: 2, berry: 3 });

// The verb follows the shape of the object, not the kind of the resource: a
// bush is shaken, a stone is dug out, and anything lying on the ground - a
// branch or the berry the firefly left - is simply picked up.
function harvestVerb(node) {
  if (node.bush) return "shake";
  if (node.kind === "stone") return "dig";
  return "pick";
}

const BACKPACK_SIZE = 6;
const FULLNESS_MARKS = 3;
const DAYLIGHT_STEPS = 4;
const ACTIONS_PER_DAYLIGHT_STEP = 2;
const ACTIONS_PER_BERRY_MARK = 3;
const DARK_STAGE = 3;

const HELP_LEVELS = Object.freeze({ A: 0, B: 1, C: 2, D: 3 });
const MOVE_DURATION = 560;
const TRAVEL_DURATION = 640;
const VICTORY_DELAY = 1050;
const HINT_DELAY = 8000;
const PROGRESS_KEY = "forestLightProgressV1";
const SOUND_KEY = "forestLightSoundV1";

const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia
  ? window.matchMedia("(prefers-reduced-motion: reduce)")
  : { matches: false };

function findRecipe(recipeId) {
  return RECIPES.find((recipe) => recipe.id === recipeId) || null;
}

function createGameState(options = {}) {
  return {
    phase: "explore",
    longEvening: Boolean(options.longEvening),
    glade: CAMP_GLADE,
    nodes: LAYOUT.map((node) => ({ ...node, taken: false, empty: false, cycle: 0 })),
    backpack: [],
    collectedIds: [],
    collectedCounts: { branch: 0, stone: 0, berry: 0 },
    harvest: null,
    usefulActions: 0,
    daylight: 1,
    fullness: FULLNESS_MARKS,
    actionsSinceMeal: 0,
    activeRecipe: null,
    placedKinds: [],
    built: [],
    fireLit: false,
  };
}

function requiredCount(kind, recipeId = GOAL_RECIPE) {
  const recipe = findRecipe(recipeId);
  if (!recipe) return 0;
  return recipe.parts.filter((part) => part === kind).length;
}

function isHungry(state) {
  return state.longEvening && state.fullness <= 0;
}

// The far half of the forest sleeps in the dusk. A torch or the campfire opens
// it again, so the darkness is a puzzle and never a dead end: everything the
// chapter goal needs stands close to the hero.
function isDark(state) {
  return state.longEvening
    && state.daylight >= DARK_STAGE
    && !state.fireLit
    && !state.built.includes("torch");
}

function findNode(state, nodeId) {
  return state.nodes.find((node) => node.id === nodeId) || null;
}

function isNodeAvailable(state, node) {
  if (!node) return false;
  if (node.taken || node.empty) return false;
  if (node.far && isDark(state)) return false;
  return true;
}

function isNodeReachable(state, node) {
  return isNodeAvailable(state, node) && node.glade === state.glade;
}

// The sun and the fullness meter move only after a useful action, never by the
// clock, so waiting and thinking cost the player nothing.
function noteUsefulAction(state) {
  state.usefulActions += 1;
  if (!state.longEvening) return;

  state.daylight = Math.min(
    DAYLIGHT_STEPS,
    1 + Math.floor(state.usefulActions / ACTIONS_PER_DAYLIGHT_STEP),
  );

  state.actionsSinceMeal += 1;
  if (state.actionsSinceMeal >= ACTIONS_PER_BERRY_MARK) {
    state.actionsSinceMeal = 0;
    state.fullness = Math.max(0, state.fullness - 1);
  }
}

function collectItem(state, itemId, kind) {
  if (state.phase !== "explore") return false;
  if (!KINDS.includes(kind)) return false;
  if (state.collectedIds.includes(itemId)) return false;
  if (state.backpack.length >= BACKPACK_SIZE) return false;
  if (kind === "stone" && isHungry(state)) return false;

  state.collectedIds.push(itemId);
  state.backpack.push({ id: itemId, kind });
  state.collectedCounts[kind] += 1;
  state.harvest = null;
  noteUsefulAction(state);
  return true;
}

function harvestTaps(node) {
  return node.taps || HARVEST_TAPS[node.kind] || 1;
}

function beginHarvest(state, nodeId) {
  if (state.phase !== "explore") return false;
  const node = findNode(state, nodeId);
  if (!isNodeReachable(state, node)) return false;
  if (state.backpack.length >= BACKPACK_SIZE) return false;
  if (node.kind === "stone" && isHungry(state)) return false;

  state.harvest = {
    nodeId,
    kind: node.kind,
    verb: harvestVerb(node),
    taps: 0,
    required: harvestTaps(node),
  };
  return true;
}

// Every press moves the same gathering forward. Choosing another object simply
// starts a new count; nothing collected is ever lost.
function tapHarvest(state) {
  if (state.phase !== "explore" || !state.harvest) return false;
  const node = findNode(state, state.harvest.nodeId);
  if (!isNodeReachable(state, node)) {
    state.harvest = null;
    return false;
  }
  if (node.kind === "stone" && isHungry(state)) return false;

  state.harvest.taps += 1;
  if (state.harvest.taps < state.harvest.required) return "progress";

  const itemId = node.bush ? `${node.id}@${node.cycle}` : node.id;
  if (!collectItem(state, itemId, node.kind)) return false;
  if (node.bush) {
    node.empty = true;
  } else {
    node.taken = true;
  }
  return "collected";
}

function cancelHarvest(state) {
  state.harvest = null;
}

// The firefly leaves a berry within reach when the hero has run out of food and
// has nothing left to eat. The player still feeds the hero themselves.
function leaveEmergencyBerry(state, x = 50, y = 68) {
  if (!isHungry(state)) return null;
  if (state.backpack.some((item) => item.kind === "berry")) return null;
  if (state.nodes.some((node) => node.kind === "berry" && isNodeReachable(state, node))) return null;

  const node = {
    id: `gift-berry-${state.nodes.length}`,
    glade: state.glade,
    kind: "berry",
    x: Math.max(24, Math.min(78, x)),
    y: Math.max(40, Math.min(72, y)),
    gift: true,
    taps: 1,
    taken: false,
    empty: false,
    cycle: 0,
  };
  state.nodes.push(node);
  return node;
}

function feedHero(state, backpackIndex) {
  if (state.phase !== "explore") return false;
  if (state.fullness >= FULLNESS_MARKS) return false;
  const item = state.backpack[backpackIndex];
  if (!item || item.kind !== "berry") return false;

  state.backpack.splice(backpackIndex, 1);
  state.fullness = FULLNESS_MARKS;
  state.actionsSinceMeal = 0;
  return true;
}

function regrowBushes(state) {
  let regrown = 0;
  state.nodes.forEach((node) => {
    if (node.bush && node.empty) {
      node.empty = false;
      node.cycle += 1;
      regrown += 1;
    }
  });
  return regrown;
}

function travelTo(state, gladeId) {
  if (state.phase !== "explore") return false;
  if (!GLADES.includes(gladeId)) return false;
  if (gladeId === state.glade) return false;

  state.glade = gladeId;
  state.harvest = null;
  if (gladeId === CAMP_GLADE) regrowBushes(state);
  return true;
}

function countKinds(items) {
  return items.reduce((counts, item) => {
    const kind = typeof item === "string" ? item : item.kind;
    counts[kind] = (counts[kind] || 0) + 1;
    return counts;
  }, {});
}

function canBuild(state, recipeId) {
  const recipe = findRecipe(recipeId);
  if (!recipe) return false;
  if (state.built.includes(recipeId)) return false;

  const available = countKinds(state.backpack);
  const needed = countKinds(recipe.parts);
  return Object.keys(needed).every((kind) => (available[kind] || 0) >= needed[kind]);
}

function startBuild(state, recipeId) {
  if (state.phase !== "explore") return false;
  if (state.glade !== CAMP_GLADE) return false;
  if (!canBuild(state, recipeId)) return false;

  state.activeRecipe = recipeId;
  state.placedKinds = [];
  state.harvest = null;
  state.phase = "building";
  return true;
}

function remainingParts(state) {
  const recipe = findRecipe(state.activeRecipe);
  if (!recipe) return [];
  const rest = [...recipe.parts];
  state.placedKinds.forEach((kind) => {
    const index = rest.indexOf(kind);
    if (index !== -1) rest.splice(index, 1);
  });
  return rest;
}

// Any slot that still fits the silhouette is accepted, so there is no single
// prepared order to guess. A slot that does not fit simply does nothing.
function placePart(state, backpackIndex) {
  if (state.phase !== "building") return false;
  const item = state.backpack[backpackIndex];
  if (!item) return false;
  if (!remainingParts(state).includes(item.kind)) return false;

  state.backpack.splice(backpackIndex, 1);
  state.placedKinds.push(item.kind);
  noteUsefulAction(state);

  if (remainingParts(state).length === 0) {
    state.built.push(state.activeRecipe);
    if (state.activeRecipe === GOAL_RECIPE) {
      state.phase = "ready";
    } else {
      state.activeRecipe = null;
      state.placedKinds = [];
      state.phase = "explore";
    }
  }
  return true;
}

function lightFire(state) {
  if (state.phase !== "ready") return false;
  state.phase = "evening";
  state.fireLit = true;
  return true;
}

const RESOURCE_LABELS = Object.freeze({
  branch: "Branch",
  stone: "Stone",
  bush: "Berry bush",
  berry: "Berries",
});

const COLLECTED_LABELS = Object.freeze({
  branch: "Branch collected",
  stone: "Stone collected",
  berry: "Berries collected",
});

const PLACE_LABELS = Object.freeze({
  branch: "Put down the branch",
  stone: "Put down the stone",
  berry: "Put down the berries",
});

const VERB_LABELS = Object.freeze({
  pick: "Pick up the item",
  dig: "Dig out the stone",
  shake: "Shake the bush",
  light: "Light the campfire",
});

const BUILD_LABELS = Object.freeze({
  fire: "Build the campfire",
  torch: "Build the torch",
  bowl: "Build the berry bowl",
});

const GLADE_LABELS = Object.freeze({
  berries: "Go to the berry hollow",
  camp: "Go back to the camp",
  stones: "Go to the stone slope",
});

function startGame() {
  const state = createGameState({ longEvening: readLongEvening() });
  const world = document.querySelector("#world");
  const player = document.querySelector("#player");
  const gladeHosts = new Map(GLADES.map((glade) => [
    glade,
    document.querySelector(`.glade[data-glade="${glade}"] .glade-resources`),
  ]));
  const goalSockets = [...document.querySelectorAll(".goal-socket")];
  const inventorySlots = [...document.querySelectorAll(".inventory-slot")];
  const buildSpots = [...document.querySelectorAll(".build-spot")];
  const sunMarks = [...document.querySelectorAll(".sun-mark")];
  const fullnessMarks = [...document.querySelectorAll(".fullness-mark")];
  const edgeButtons = [...document.querySelectorAll(".glade-edge")];
  const actionPips = [...document.querySelectorAll(".action-pip")];
  const action = document.querySelector("#main-action");
  const hintHand = document.querySelector("#hint-hand");
  const hintButton = document.querySelector("#hint-button");
  const soundButton = document.querySelector("#sound-button");
  const pauseButton = document.querySelector("#pause-button");
  const pauseOverlay = document.querySelector("#pause-overlay");
  const resumeButton = document.querySelector("#resume-button");
  const victoryOverlay = document.querySelector("#victory-overlay");
  const restartButton = document.querySelector("#restart-button");
  const liveStatus = document.querySelector("#live-status");

  const resourceButtons = new Map();
  let selectedNodeId = null;
  let movementSequence = 0;
  let paused = false;
  let currentHintTarget = null;
  let currentPromptKey = "findFirstBranch";
  let currentHelpLevel = "A";
  let hintTimers = [];
  let voicePrompts = {};
  let voicePromptsRequest = 0;
  let soundOn = readSoundSetting();
  let runStartedAt = Date.now();
  let assistanceLog = [];
  let playerPosition = readStartPosition();

  function setStatus(message) {
    liveStatus.textContent = message;
  }

  // CSS shortens the walk and the campfire to nothing under reduced motion, so
  // every wait that covers an animation has to shrink with it. Otherwise the
  // game freezes in place with nothing moving.
  function shortened(duration) {
    return prefersReducedMotion.matches ? 1 : duration;
  }

  // A hungry hero walks slower. The delay has to follow the CSS duration,
  // otherwise the action button wakes up before the hero has arrived.
  function walkDuration() {
    return isHungry(state) ? Math.round(MOVE_DURATION * 1.7) : MOVE_DURATION;
  }

  // The start position lives in the stylesheet next to the rest of the layout,
  // so the first keyboard step continues from where the hero is really drawn.
  function readStartPosition() {
    const styles = window.getComputedStyle(player);
    return {
      x: Number.parseFloat(styles.getPropertyValue("--player-x")),
      y: Number.parseFloat(styles.getPropertyValue("--player-y")),
    };
  }

  function safeDelay(duration) {
    return new Promise((resolve) => window.setTimeout(resolve, duration));
  }

  // Switching the language twice in a row starts two requests, and the slower
  // one must not be allowed to land on top of the newer answer.
  function loadVoicePrompts() {
    const language = window.GameLanguage?.getLanguage() === "ru" ? "ru" : "en";
    voicePromptsRequest += 1;
    const request = voicePromptsRequest;
    window.fetch(`content.${language}.json`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : {}))
      .then((content) => {
        if (request === voicePromptsRequest) voicePrompts = content;
      })
      .catch(() => {
        if (request === voicePromptsRequest) voicePrompts = {};
      });
  }

  function readSoundSetting() {
    try {
      return window.localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      return true;
    }
  }

  // The pressure meters wait for the second chapter. The query parameter only
  // exists so both modes can be checked without clearing the saved progress.
  function readLongEvening() {
    const requested = new URLSearchParams(window.location.search).get("longEvening");
    if (requested === "1") return true;
    if (requested === "0") return false;
    try {
      const saved = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || "{}");
      return Number(saved.completions || 0) >= 1;
    } catch {
      return false;
    }
  }

  function playTone(frequency, delay, duration, volume = 0.055) {
    if (!soundOn) return;
    window.GameSound?.tone({ frequency, delay, duration, volume });
  }

  function playSound(kind) {
    if (kind === "collect") {
      playTone(440, 0, 0.13);
      playTone(660, 0.11, 0.16);
    } else if (kind === "progress") {
      playTone(520, 0, 0.08, 0.04);
    } else if (kind === "place") {
      playTone(260, 0, 0.1, 0.045);
      playTone(350, 0.09, 0.13, 0.045);
    } else if (kind === "eat") {
      playTone(330, 0, 0.12, 0.05);
      playTone(494, 0.1, 0.18, 0.05);
    } else if (kind === "travel") {
      playTone(392, 0, 0.1, 0.04);
      playTone(294, 0.09, 0.14, 0.04);
    } else if (kind === "refuse") {
      playTone(233, 0, 0.16, 0.04);
    } else if (kind === "fire") {
      playTone(392, 0, 0.22);
      playTone(523, 0.12, 0.28);
      playTone(659, 0.24, 0.34);
    } else {
      playTone(740, 0, 0.12, 0.04);
      playTone(880, 0.13, 0.16, 0.04);
    }
  }

  function speakPrompt() {
    if (!soundOn) return;
    const prompt = voicePrompts[currentPromptKey];
    if (!prompt || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(prompt);
    utterance.lang = window.GameLanguage?.getLanguage() === "ru" ? "ru-RU" : "en-US";
    utterance.rate = 0.88;
    utterance.pitch = 1.08;
    window.speechSynthesis.speak(utterance);
  }

  function clearHintTimers() {
    hintTimers.forEach((timer) => window.clearTimeout(timer));
    hintTimers = [];
  }

  function hideHintHand() {
    hintHand.classList.remove("is-visible");
  }

  function positionHintHand(target) {
    if (!target) return;
    const worldRect = world.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const handWidth = hintHand.getBoundingClientRect().width || 58;
    const left = targetRect.left - worldRect.left + targetRect.width / 2 - handWidth / 2;
    const top = targetRect.top - worldRect.top - Math.min(45, targetRect.height * 0.5);
    hintHand.style.left = `${Math.max(5, Math.min(worldRect.width - handWidth - 5, left))}px`;
    hintHand.style.top = `${Math.max(88, top)}px`;
  }

  function showHint(level) {
    if (paused || !currentHintTarget || state.phase === "evening") return;
    if (HELP_LEVELS[level] > HELP_LEVELS[currentHelpLevel]) {
      currentHelpLevel = level;
    }
    currentHintTarget.classList.add("is-hint-target");
    positionHintHand(currentHintTarget);
    if (level === "C") {
      hintHand.classList.add("is-visible");
      playSound("hint");
      speakPrompt();
    }
  }

  function scheduleHintTimers() {
    clearHintTimers();
    if (paused || !currentHintTarget || state.phase === "evening") return;

    if (currentHelpLevel === "A") {
      hintTimers.push(window.setTimeout(() => showHint("B"), HINT_DELAY));
      hintTimers.push(window.setTimeout(() => showHint("C"), HINT_DELAY * 2));
    } else if (currentHelpLevel === "B") {
      hintTimers.push(window.setTimeout(() => showHint("C"), HINT_DELAY));
    }
  }

  function setHintTarget(target, promptKey, showInitialHand = false) {
    if (target === currentHintTarget && promptKey === currentPromptKey && !showInitialHand) return;
    clearHintTimers();
    if (currentHintTarget) currentHintTarget.classList.remove("is-hint-target");
    hideHintHand();
    currentHintTarget = target;
    currentPromptKey = promptKey;
    currentHelpLevel = "A";

    scheduleHintTimers();
    if (showInitialHand && target) {
      positionHintHand(target);
      hintHand.classList.add("is-visible");
      hintTimers.push(window.setTimeout(hideHintHand, 2600));
    }
  }

  function repeatHint() {
    window.GameSound?.audioContext();
    showHint("C");
  }

  function renderSoundButton() {
    soundButton.classList.toggle("is-muted", !soundOn);
    soundButton.setAttribute("aria-label", soundOn ? "Turn sound off" : "Turn sound on");
  }

  function toggleSound() {
    soundOn = !soundOn;
    if (!soundOn) window.speechSynthesis?.cancel();
    try {
      window.localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off");
    } catch {
      // Private browsing modes can refuse writes. The choice stays for this session only.
    }
    renderSoundButton();
    if (soundOn) playSound("hint");
  }

  function recordAssistance(actionName) {
    assistanceLog.push({
      action: actionName,
      level: currentHelpLevel,
      elapsedMs: Date.now() - runStartedAt,
    });
  }

  function updatePlayerPosition(x, y) {
    playerPosition = {
      x: Math.max(4, Math.min(96, x)),
      y: Math.max(18, Math.min(84, y)),
    };
    player.style.setProperty("--player-x", `${playerPosition.x}%`);
    player.style.setProperty("--player-y", `${playerPosition.y}%`);
    world.style.setProperty("--light-x", `${playerPosition.x}%`);
    world.style.setProperty("--light-y", `${playerPosition.y}%`);
  }

  function iconNameFor(node) {
    if (node.kind === "branch") return "branch";
    if (node.kind === "stone") return "stone";
    return node.bush ? "bush" : "berry";
  }

  function buildResourceButtons() {
    state.nodes.forEach(createResourceButton);
  }

  function createResourceButton(node) {
    const host = gladeHosts.get(node.glade);
    if (!host) return;
    const icon = iconNameFor(node);
    const button = document.createElement("button");
    button.type = "button";
    button.id = `node-${node.id}`;
    button.className = `resource resource-${icon}`;
    if (node.far) button.classList.add("is-far");
    if (node.gift) button.classList.add("is-gift");
    button.dataset.node = node.id;
    button.dataset.kind = node.kind;
    button.style.left = `${node.x}%`;
    button.style.top = `${node.y}%`;
    button.setAttribute("aria-label", RESOURCE_LABELS[icon]);
    button.innerHTML = `<span class="resource-shadow"></span>`
      + `<svg viewBox="0 0 64 64"><use href="#icon-${icon}"></use></svg>`
      + `<span class="resource-crumbs" aria-hidden="true"><i></i><i></i><i></i></span>`;
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      selectResource(node.id);
    });
    host.appendChild(button);
    resourceButtons.set(node.id, button);
  }

  function neighbourGlade(direction) {
    const index = GLADES.indexOf(state.glade) + direction;
    return GLADES[index] || null;
  }

  // The chapter goal always has a home somewhere. This tells the player which
  // side to walk to when the current glade has nothing useful left.
  function gladeWithKind(kind) {
    const node = state.nodes.find((candidate) => (
      candidate.kind === kind && isNodeAvailable(state, candidate) && candidate.glade !== state.glade
    ));
    return node ? node.glade : null;
  }

  function missingGoalKinds() {
    const owned = countKinds(state.backpack);
    const needed = countKinds(RECIPE);
    return Object.keys(needed).filter((kind) => (owned[kind] || 0) < needed[kind]);
  }

  function edgeButtonFor(gladeId) {
    const direction = GLADES.indexOf(gladeId) - GLADES.indexOf(state.glade);
    return edgeButtons.find((button) => Number(button.dataset.direction) === Math.sign(direction)) || null;
  }

  function firstBerrySlotIndex() {
    return state.backpack.findIndex((item) => item.kind === "berry");
  }

  // One target at a time: the firefly, the highlight and the voice must never
  // point at three different places.
  function nextHintTarget() {
    if (state.phase === "ready") return { target: action, prompt: "light" };
    if (state.phase === "building") {
      const rest = remainingParts(state);
      const index = state.backpack.findIndex((item) => rest.includes(item.kind));
      return { target: inventorySlots[index] || null, prompt: "build" };
    }

    if (isHungry(state)) {
      const berryIndex = firstBerrySlotIndex();
      if (berryIndex !== -1) return { target: inventorySlots[berryIndex], prompt: "hungry" };
      const berryNode = state.nodes.find((node) => node.kind === "berry" && isNodeReachable(state, node));
      if (berryNode) return { target: resourceButtons.get(berryNode.id) || null, prompt: "hungry" };
      const berryGlade = gladeWithKind("berry");
      if (berryGlade) return { target: edgeButtonFor(berryGlade), prompt: "travel" };
    }

    if (state.harvest) return { target: action, prompt: "collect" };

    if (canBuild(state, GOAL_RECIPE)) {
      if (state.glade === CAMP_GLADE) {
        const spot = buildSpots.find((candidate) => candidate.dataset.recipe === GOAL_RECIPE);
        return { target: spot || null, prompt: "build" };
      }
      return { target: edgeButtonFor(CAMP_GLADE), prompt: "goHome" };
    }

    const missing = missingGoalKinds();
    const wanted = missing[0];
    const node = state.nodes.find((candidate) => (
      candidate.kind === wanted && isNodeReachable(state, candidate)
    ));
    if (node) {
      const promptKey = state.collectedIds.length === 0 ? "findFirstBranch" : "findMore";
      return { target: resourceButtons.get(node.id) || null, prompt: promptKey };
    }

    const glade = gladeWithKind(wanted);
    if (glade) return { target: edgeButtonFor(glade), prompt: "travel" };
    return { target: null, prompt: "findMore" };
  }

  function refreshHint(showInitialHand = false) {
    const { target, prompt } = nextHintTarget();
    setHintTarget(target, prompt, showInitialHand);
  }

  function renderWorldState() {
    world.dataset.glade = state.glade;
    world.dataset.daylight = String(state.daylight);
    world.style.setProperty("--glade-index", String(GLADES.indexOf(state.glade)));
    world.classList.toggle("is-long-evening", state.longEvening);
    world.classList.toggle("is-dark", isDark(state));
    world.classList.toggle("is-hungry", isHungry(state));
    world.classList.toggle("is-building", state.phase === "building");
    world.classList.toggle("is-ready", state.phase === "ready");
    world.classList.toggle("is-evening", state.phase === "evening");
    world.classList.toggle("has-torch", state.built.includes("torch"));
    world.classList.toggle("has-bowl", state.built.includes("bowl"));
    player.style.setProperty("--walk-ms", `${walkDuration()}ms`);
  }

  function renderMeters() {
    sunMarks.forEach((mark, index) => {
      const step = index + 1;
      mark.classList.toggle("is-past", step < state.daylight);
      mark.classList.toggle("is-current", step === state.daylight);
    });
    fullnessMarks.forEach((mark, index) => {
      mark.classList.toggle("is-spent", index >= state.fullness);
    });
  }

  function renderGoal() {
    const owned = countKinds(state.backpack);
    const placed = countKinds(state.placedKinds);
    const seen = { branch: 0, stone: 0, berry: 0 };
    goalSockets.forEach((socket) => {
      const kind = socket.dataset.kind;
      seen[kind] += 1;
      const held = (owned[kind] || 0) + (state.built.includes(GOAL_RECIPE) ? requiredCount(kind) : placed[kind] || 0);
      socket.classList.toggle("is-found", held >= seen[kind]);
    });
  }

  function renderInventory() {
    const rest = state.phase === "building" ? remainingParts(state) : [];
    const feedIndex = isHungry(state) ? firstBerrySlotIndex() : -1;
    inventorySlots.forEach((slot, index) => {
      const item = state.backpack[index];
      const icon = item ? (item.kind === "berry" ? "berry" : item.kind) : "pocket";
      slot.querySelector("use").setAttribute("href", `#icon-${icon}`);
      slot.classList.toggle("is-empty", !item);
      slot.classList.toggle("is-filled", Boolean(item));

      const canPlace = Boolean(item) && rest.includes(item.kind);
      const canFeed = Boolean(item) && item.kind === "berry"
        && state.phase === "explore" && state.fullness < FULLNESS_MARKS;
      slot.classList.toggle("is-next", canPlace);
      // Only an empty meter is allowed to call the player, and only through one
      // berry. Feeding a hero who is merely peckish stays possible, but it
      // never competes with the goal for attention.
      slot.classList.toggle("is-feed", canFeed && index === feedIndex);
      slot.disabled = !canPlace && !canFeed;

      if (!item) {
        slot.setAttribute("aria-label", "Empty pocket");
      } else if (canPlace) {
        slot.setAttribute("aria-label", PLACE_LABELS[item.kind]);
      } else if (canFeed) {
        slot.setAttribute("aria-label", "Feed the hero");
      } else {
        slot.setAttribute("aria-label", COLLECTED_LABELS[item.kind]);
      }
    });
  }

  function renderBuildSpots() {
    buildSpots.forEach((spot) => {
      const recipeId = spot.dataset.recipe;
      const recipe = findRecipe(recipeId);
      const done = state.built.includes(recipeId);
      const active = state.activeRecipe === recipeId && state.phase === "building";
      const ready = state.phase === "explore" && state.glade === CAMP_GLADE && canBuild(state, recipeId);

      spot.classList.toggle("is-done", done);
      spot.classList.toggle("is-active", active);
      spot.classList.toggle("is-ready", ready);
      spot.disabled = !ready;
      spot.setAttribute("aria-label", BUILD_LABELS[recipeId]);

      const placed = active ? countKinds(state.placedKinds) : {};
      const seen = {};
      [...spot.querySelectorAll(".build-socket")].forEach((socket, index) => {
        const kind = recipe.parts[index];
        seen[kind] = (seen[kind] || 0) + 1;
        socket.classList.toggle("is-placed", done || (placed[kind] || 0) >= seen[kind]);
      });
    });
  }

  function renderEdges() {
    edgeButtons.forEach((button) => {
      const target = neighbourGlade(Number(button.dataset.direction));
      const usable = Boolean(target) && state.phase === "explore";
      button.hidden = !target;
      button.disabled = !usable;
      if (!target) return;
      button.dataset.target = target;
      button.classList.toggle("is-home", target === CAMP_GLADE);
      button.setAttribute("aria-label", GLADE_LABELS[target]);
      button.querySelector(".glade-edge-icon use")
        .setAttribute("href", `#icon-${target === CAMP_GLADE ? "tent" : target === "berries" ? "bush" : "stone"}`);
    });
  }

  function renderResources() {
    state.nodes.forEach((node) => {
      const button = resourceButtons.get(node.id);
      if (!button) return;
      const gone = node.taken || node.empty;
      button.classList.toggle("is-collected", gone);
      button.classList.toggle("is-asleep", Boolean(node.far) && isDark(state) && !gone);
      button.classList.toggle("is-selected", node.id === selectedNodeId);
      button.disabled = gone || !isNodeReachable(state, node) || state.phase !== "explore";
    });
  }

  function renderAction() {
    const verb = state.phase === "ready"
      ? "light"
      : state.harvest ? state.harvest.verb : null;

    action.dataset.verb = verb || "none";
    action.disabled = !verb || paused;
    action.setAttribute("aria-label", VERB_LABELS[verb] || "Pick up the item");

    const required = state.harvest ? state.harvest.required : 0;
    const taps = state.harvest ? state.harvest.taps : 0;
    action.classList.toggle("has-progress", required > 1);
    actionPips.forEach((pip, index) => {
      pip.hidden = index >= required || required <= 1;
      pip.classList.toggle("is-done", index < taps);
    });
  }

  function render() {
    renderWorldState();
    renderMeters();
    renderGoal();
    renderInventory();
    renderBuildSpots();
    renderEdges();
    renderResources();
    renderAction();
  }

  function movePlayerToPoint(clientX, clientY) {
    const rect = world.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    clearSelection();
    updatePlayerPosition(x, y);
  }

  function clearSelection() {
    movementSequence += 1;
    selectedNodeId = null;
    cancelHarvest(state);
    render();
    refreshHint();
  }

  async function movePlayerToElement(element) {
    const worldRect = world.getBoundingClientRect();
    const targetRect = element.getBoundingClientRect();
    const x = ((targetRect.left - worldRect.left + targetRect.width / 2) / worldRect.width) * 100;
    const y = ((targetRect.top - worldRect.top + targetRect.height * 0.78) / worldRect.height) * 100;
    updatePlayerPosition(x, y);
    await safeDelay(shortened(walkDuration()));
  }

  function refuse(promptKey) {
    playSound("refuse");
    world.classList.add("is-refusing");
    window.setTimeout(() => world.classList.remove("is-refusing"), 360);
    if (promptKey) setStatus(promptKey);
  }

  async function selectResource(nodeId) {
    if (paused || state.phase !== "explore") return;
    const node = findNode(state, nodeId);
    if (!isNodeReachable(state, node)) return;

    window.GameSound?.audioContext();
    recordAssistance(`choose-${node.kind}`);
    clearHintTimers();
    if (currentHintTarget) currentHintTarget.classList.remove("is-hint-target");
    hideHintHand();

    if (node.kind === "stone" && isHungry(state)) {
      refuse("The hero is too hungry to lift the stone.");
      refreshHint();
      return;
    }
    if (state.backpack.length >= BACKPACK_SIZE) {
      refuse("The backpack is full.");
      refreshHint();
      return;
    }

    movementSequence += 1;
    const currentMovement = movementSequence;
    selectedNodeId = nodeId;
    cancelHarvest(state);
    render();
    setStatus("Walking to the selected item.");

    const button = resourceButtons.get(nodeId);
    await movePlayerToElement(button);
    if (currentMovement !== movementSequence || selectedNodeId !== nodeId) return;

    if (!beginHarvest(state, nodeId)) {
      refreshHint();
      render();
      return;
    }
    render();
    action.focus({ preventScroll: true });
    setStatus("The item is ready to pick up.");
    setHintTarget(action, "collect");
  }

  function harvestSelected() {
    const harvest = state.harvest;
    if (!harvest) return;
    const node = findNode(state, harvest.nodeId);
    const button = resourceButtons.get(harvest.nodeId);
    const result = tapHarvest(state);

    // A refused tap has to say why: a hungry hero, a full backpack, or an item
    // that is simply not there any more, which needs no words of its own.
    if (result === false) {
      if (node && node.kind === "stone" && isHungry(state)) {
        refuse("The hero is too hungry to lift the stone.");
      } else if (state.backpack.length >= BACKPACK_SIZE) {
        refuse("The backpack is full.");
      } else {
        refuse(null);
      }
      render();
      refreshHint();
      return;
    }

    if (result === "progress") {
      recordAssistance(`work-${node.kind}`);
      playSound("progress");
      button.classList.add("is-worked");
      window.setTimeout(() => button.classList.remove("is-worked"), shortened(320));
      render();
      return;
    }

    recordAssistance(`collect-${node.kind}`);
    selectedNodeId = null;
    playSound("collect");
    setStatus("The item is in the backpack.");
    afterUsefulAction();
  }

  // The firefly steps in only when the hero has nothing left to eat, and it
  // stops at leaving the berry: the player still feeds the hero themselves.
  function offerEmergencyBerry() {
    const node = leaveEmergencyBerry(state, playerPosition.x + 14, playerPosition.y);
    if (!node) return;
    createResourceButton(node);
    setStatus("The firefly leaves a berry nearby.");
  }

  function afterUsefulAction() {
    offerEmergencyBerry();
    render();
    refreshHint();
  }

  function feedFromSlot(index) {
    if (!feedHero(state, index)) {
      refuse("The hero is not hungry yet.");
      return;
    }
    recordAssistance("feed-hero");
    playSound("eat");
    setStatus("The hero ate the berries.");
    render();
    refreshHint();
  }

  async function travelToGlade(gladeId) {
    if (paused || !gladeId) return;
    const direction = Math.sign(GLADES.indexOf(gladeId) - GLADES.indexOf(state.glade));
    if (!travelTo(state, gladeId)) return;

    recordAssistance(`travel-${gladeId}`);
    clearHintTimers();
    hideHintHand();
    selectedNodeId = null;
    playSound("travel");
    updatePlayerPosition(direction > 0 ? 14 : 86, playerPosition.y);
    render();
    setStatus(gladeId === CAMP_GLADE ? "Returning to camp." : "Walking to the next clearing.");
    await safeDelay(shortened(TRAVEL_DURATION));
    afterUsefulActionWithoutSun();
  }

  // Walking between glades costs no daylight, only gathering and building do.
  function afterUsefulActionWithoutSun() {
    offerEmergencyBerry();
    render();
    refreshHint();
  }

  async function chooseBuild(spot) {
    if (paused) return;
    const recipeId = spot.dataset.recipe;
    recordAssistance(`choose-build-${recipeId}`);
    await movePlayerToElement(spot);
    if (!startBuild(state, recipeId)) {
      refreshHint();
      return;
    }
    render();
    setStatus("Put each item into the matching spot.");
    refreshHint();
    const { target } = nextHintTarget();
    target?.focus({ preventScroll: true });
  }

  function placeFromSlot(index) {
    const item = state.backpack[index];
    if (!item) return;
    const wasGoal = state.activeRecipe === GOAL_RECIPE;
    if (!placePart(state, index)) {
      refuse("This part does not fit here.");
      return;
    }
    recordAssistance(`place-${item.kind}`);
    playSound("place");
    render();

    if (state.phase === "ready") {
      setStatus("The campfire is ready to light.");
      action.focus({ preventScroll: true });
      setHintTarget(action, "light");
      return;
    }
    if (wasGoal || state.activeRecipe) {
      setStatus("Put each item into the matching spot.");
    } else {
      setStatus("The camp has a new thing.");
    }
    offerEmergencyBerry();
    render();
    refreshHint();
  }

  function handleSlot(index) {
    if (paused) return;
    if (state.phase === "building") {
      placeFromSlot(index);
      return;
    }
    if (state.phase === "explore") feedFromSlot(index);
  }

  function saveProgress() {
    let previous = {};
    try {
      previous = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || "{}");
    } catch {
      previous = {};
    }

    const runHelpLevel = assistanceLog.reduce((highest, entry) => (
      HELP_LEVELS[entry.level] > HELP_LEVELS[highest] ? entry.level : highest
    ), "A");
    const bestHelpLevel = previous.bestHelpLevel && HELP_LEVELS[previous.bestHelpLevel] <= HELP_LEVELS[runHelpLevel]
      ? previous.bestHelpLevel
      : runHelpLevel;

    const progress = {
      completed: true,
      completions: Number(previous.completions || 0) + 1,
      bestHelpLevel,
      lastAssistanceLog: assistanceLog,
      lastRunBuilt: state.built,
    };

    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      // Private browsing modes can refuse writes. The chapter still ends the
      // same way; only the count of finished chapters is lost.
    }
  }

  function finishChapter() {
    if (paused || state.phase !== "ready") return;
    recordAssistance("light-fire");
    if (!lightFire(state)) return;
    clearHintTimers();
    hideHintHand();
    playSound("fire");
    saveProgress();
    render();
    setStatus("The campfire is glowing. Chapter complete.");

    window.setTimeout(() => {
      victoryOverlay.classList.add("is-visible");
      victoryOverlay.setAttribute("aria-hidden", "false");
      restartButton.focus();
    }, shortened(VICTORY_DELAY));
  }

  function handleMainAction() {
    if (paused) return;
    if (state.phase === "ready") {
      finishChapter();
      return;
    }
    if (state.phase === "explore" && state.harvest) harvestSelected();
  }

  function setPaused(nextPaused) {
    if (state.phase === "evening") return;
    paused = nextPaused;
    pauseOverlay.classList.toggle("is-visible", paused);
    pauseOverlay.setAttribute("aria-hidden", String(!paused));
    render();
    if (paused) {
      clearHintTimers();
      window.speechSynthesis?.cancel();
      resumeButton.focus();
      setStatus("Game paused.");
    } else {
      scheduleHintTimers();
      pauseButton.focus();
      setStatus("Game resumed.");
    }
  }

  inventorySlots.forEach((slot, index) => {
    slot.addEventListener("click", (event) => {
      event.stopPropagation();
      handleSlot(index);
    });
  });

  buildSpots.forEach((spot) => {
    spot.addEventListener("click", (event) => {
      event.stopPropagation();
      chooseBuild(spot);
    });
  });

  edgeButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      travelToGlade(neighbourGlade(Number(button.dataset.direction)));
    });
  });

  world.addEventListener("pointerdown", (event) => {
    if (paused || state.phase !== "explore") return;
    if (event.target.closest("button, .hud, .action-bar")) return;
    movePlayerToPoint(event.clientX, event.clientY);
    setStatus("Walking through the forest.");
  });

  action.addEventListener("click", handleMainAction);
  hintButton.addEventListener("click", repeatHint);
  soundButton.addEventListener("click", toggleSound);
  pauseButton.addEventListener("click", () => setPaused(true));
  resumeButton.addEventListener("click", () => setPaused(false));
  restartButton.addEventListener("click", () => window.location.reload());

  window.addEventListener("resize", () => positionHintHand(currentHintTarget));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setPaused(!paused);
      return;
    }
    if (paused) return;
    const activeElement = document.activeElement;
    const shouldRunContextAction = (
      activeElement === action
      || activeElement === document.body
      || activeElement?.classList.contains("resource")
    );
    if ((event.code === "Space" || event.key === " ") && shouldRunContextAction && !action.disabled) {
      event.preventDefault();
      handleMainAction();
      return;
    }
    if (state.phase !== "explore") return;
    if (document.activeElement?.tagName === "BUTTON") return;

    const steps = {
      ArrowUp: [0, -4],
      KeyW: [0, -4],
      ArrowDown: [0, 4],
      KeyS: [0, 4],
      ArrowLeft: [-4, 0],
      KeyA: [-4, 0],
      ArrowRight: [4, 0],
      KeyD: [4, 0],
    };
    // Some browsers and remote keyboards leave `code` empty; `key` still names
    // the arrow, and falling back keeps walking available.
    const step = steps[event.code] || steps[event.key];
    if (!step) return;
    event.preventDefault();

    // Walking off the side of the screen is the same door as the edge button.
    const nextX = playerPosition.x + step[0];
    if (step[0] < 0 && playerPosition.x <= 6) {
      travelToGlade(neighbourGlade(-1));
      return;
    }
    if (step[0] > 0 && playerPosition.x >= 94) {
      travelToGlade(neighbourGlade(1));
      return;
    }
    clearSelection();
    updatePlayerPosition(nextX, playerPosition.y + step[1]);
  });

  buildResourceButtons();
  updatePlayerPosition(playerPosition.x, playerPosition.y);
  render();
  loadVoicePrompts();
  window.GameLanguage?.onChange(loadVoicePrompts);
  renderSoundButton();
  requestAnimationFrame(() => {
    refreshHint(true);
    setStatus("Choose the nearby branch.");
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    RECIPE,
    RECIPES,
    GOAL_RECIPE,
    KINDS,
    GLADES,
    LAYOUT,
    HARVEST_TAPS,
    harvestVerb,
    BACKPACK_SIZE,
    FULLNESS_MARKS,
    DAYLIGHT_STEPS,
    ACTIONS_PER_DAYLIGHT_STEP,
    ACTIONS_PER_BERRY_MARK,
    DARK_STAGE,
    createGameState,
    requiredCount,
    isHungry,
    isDark,
    findNode,
    isNodeAvailable,
    isNodeReachable,
    collectItem,
    beginHarvest,
    tapHarvest,
    cancelHarvest,
    leaveEmergencyBerry,
    feedHero,
    regrowBushes,
    travelTo,
    canBuild,
    startBuild,
    remainingParts,
    placePart,
    lightFire,
  };
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", startGame);
}
