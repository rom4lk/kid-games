const RECIPE = Object.freeze(["branch", "branch", "stone"]);
const HELP_LEVELS = Object.freeze({ A: 0, B: 1, C: 2, D: 3 });
const MOVE_DURATION = 560;
const VICTORY_DELAY = 1050;
const HINT_DELAY = 8000;
const PROGRESS_KEY = "forestLightProgressV1";
const SOUND_KEY = "forestLightSoundV1";

const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia
  ? window.matchMedia("(prefers-reduced-motion: reduce)")
  : { matches: false };

function createGameState() {
  return {
    phase: "explore",
    collectedIds: [],
    collectedCounts: { branch: 0, stone: 0 },
    placedKinds: [],
    fireLit: false,
  };
}

function requiredCount(kind) {
  return RECIPE.filter((recipeKind) => recipeKind === kind).length;
}

function collectItem(state, itemId, kind) {
  if (state.phase !== "explore") return false;
  if (!RECIPE.includes(kind)) return false;
  if (state.collectedIds.includes(itemId)) return false;
  if (state.collectedCounts[kind] >= requiredCount(kind)) return false;

  state.collectedIds.push(itemId);
  state.collectedCounts[kind] += 1;

  if (state.collectedIds.length === RECIPE.length) {
    state.phase = "returning";
  }
  return true;
}

function arriveAtCamp(state) {
  if (state.phase !== "returning") return false;
  state.phase = "building";
  return true;
}

function placeRecipeItem(state, slotIndex) {
  if (state.phase !== "building") return false;
  if (slotIndex !== state.placedKinds.length) return false;

  state.placedKinds.push(RECIPE[slotIndex]);
  if (state.placedKinds.length === RECIPE.length) {
    state.phase = "ready";
  }
  return true;
}

function lightFire(state) {
  if (state.phase !== "ready") return false;
  state.phase = "evening";
  state.fireLit = true;
  return true;
}

function startGame() {
  const state = createGameState();
  const world = document.querySelector("#world");
  const player = document.querySelector("#player");
  const resources = [...document.querySelectorAll(".resource")];
  const goalSockets = [...document.querySelectorAll(".goal-socket")];
  const inventorySlots = [...document.querySelectorAll(".inventory-slot")];
  const campTargets = [...document.querySelectorAll(".camp-target")];
  const camp = document.querySelector("#camp");
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

  let selectedResource = null;
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

  function playTone(frequency, delay, duration, volume = 0.055) {
    if (!soundOn) return;
    window.GameSound?.tone({ frequency, delay, duration, volume });
  }

  function playSound(kind) {
    if (kind === "collect") {
      playTone(440, 0, 0.13);
      playTone(660, 0.11, 0.16);
    } else if (kind === "place") {
      playTone(260, 0, 0.1, 0.045);
      playTone(350, 0.09, 0.13, 0.045);
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
  }

  // Walking away by tap or by key drops the current choice, so the hint has to
  // stop pointing at an action that is no longer available and go back to the
  // resource that is still missing.
  function cancelSelection() {
    movementSequence += 1;
    selectedResource = null;
    resources.forEach((resource) => resource.classList.remove("is-selected"));
    action.disabled = true;
    setHintTarget(
      nextResourceTarget(),
      state.collectedIds.length === 0 ? "findFirstBranch" : "findMore",
    );
  }

  function movePlayerToPoint(clientX, clientY) {
    const rect = world.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    cancelSelection();
    updatePlayerPosition(x, y);
  }

  async function movePlayerToElement(element) {
    const worldRect = world.getBoundingClientRect();
    const targetRect = element.getBoundingClientRect();
    const x = ((targetRect.left - worldRect.left + targetRect.width / 2) / worldRect.width) * 100;
    const y = ((targetRect.top - worldRect.top + targetRect.height * 0.78) / worldRect.height) * 100;
    updatePlayerPosition(x, y);
    await safeDelay(moveDuration());
  }

  function updateGoal(kind) {
    const socket = goalSockets.find((candidate) => candidate.dataset.kind === kind && !candidate.classList.contains("is-found"));
    if (socket) socket.classList.add("is-found");
  }

  function fillInventory(kind) {
    const slot = inventorySlots.find((candidate) => candidate.dataset.kind === kind && candidate.classList.contains("is-missing"));
    if (!slot) return;
    slot.classList.remove("is-missing");
    slot.classList.add("is-filled");
    slot.setAttribute("aria-label", kind === "branch" ? "Branch collected" : "Stone collected");
  }

  function unlockRemainingResources() {
    resources.filter((resource) => !resource.classList.contains("is-collected")).forEach((resource) => {
      resource.disabled = false;
      resource.classList.add("is-unlocked");
      window.setTimeout(() => resource.classList.remove("is-unlocked"), 500);
    });
  }

  function nextResourceTarget() {
    const missingBranch = state.collectedCounts.branch < requiredCount("branch");
    if (missingBranch) {
      return resources.find((resource) => resource.dataset.kind === "branch" && !resource.classList.contains("is-collected"));
    }
    return resources.find((resource) => resource.dataset.kind === "stone" && !resource.classList.contains("is-collected"));
  }

  async function selectResource(resource) {
    if (paused || state.phase !== "explore" || resource.disabled) return;
    window.GameSound?.audioContext();
    recordAssistance(`choose-${resource.dataset.kind}`);
    clearHintTimers();
    if (currentHintTarget) currentHintTarget.classList.remove("is-hint-target");
    hideHintHand();

    movementSequence += 1;
    const currentMovement = movementSequence;
    selectedResource = resource;
    resources.forEach((candidate) => candidate.classList.toggle("is-selected", candidate === resource));
    action.disabled = true;
    setStatus("Walking to the selected item.");
    await movePlayerToElement(resource);

    if (currentMovement !== movementSequence || selectedResource !== resource) return;
    action.disabled = false;
    action.focus({ preventScroll: true });
    setStatus("The item is ready to pick up.");
    setHintTarget(action, "collect");
  }

  function collectSelectedResource() {
    if (!selectedResource || state.phase !== "explore") return;
    const resource = selectedResource;
    const kind = resource.dataset.kind;
    recordAssistance(`collect-${kind}`);
    if (!collectItem(state, resource.id, kind)) return;

    resource.classList.remove("is-selected", "is-hint-target");
    resource.classList.add("is-collected");
    resource.disabled = true;
    updateGoal(kind);
    fillInventory(kind);
    playSound("collect");
    selectedResource = null;
    action.disabled = true;
    setStatus("The item is in the backpack.");

    if (state.collectedIds.length === 1) {
      unlockRemainingResources();
    }

    if (state.phase === "returning") {
      world.classList.add("is-returning");
      camp.disabled = false;
      camp.focus({ preventScroll: true });
      setStatus("The glowing path leads home.");
      setHintTarget(camp, "goHome");
      return;
    }

    const nextResource = nextResourceTarget();
    setHintTarget(nextResource, "findMore");
  }

  function activateNextInventorySlot() {
    const slotIndex = state.placedKinds.length;
    const slot = inventorySlots[slotIndex];
    if (!slot) return;
    slot.disabled = false;
    slot.classList.add("is-next");
    slot.focus({ preventScroll: true });
    slot.setAttribute("aria-label", slot.dataset.kind === "branch" ? "Put down the branch" : "Put down the stone");
    setHintTarget(slot, "build");
  }

  async function returnToCamp() {
    if (paused || state.phase !== "returning") return;
    recordAssistance("return-home");
    clearHintTimers();
    hideHintHand();
    camp.disabled = true;
    setStatus("Returning to camp.");
    movementSequence += 1;
    await movePlayerToElement(camp);
    if (!arriveAtCamp(state)) return;

    world.classList.remove("is-returning");
    world.classList.add("is-building");
    setStatus("Put each item into the matching spot.");
    activateNextInventorySlot();
  }

  function placeInventoryItem(slot, slotIndex) {
    if (paused || state.phase !== "building" || !slot.classList.contains("is-next")) return;
    recordAssistance(`place-${slot.dataset.kind}`);
    if (!placeRecipeItem(state, slotIndex)) return;

    const target = campTargets[slotIndex];
    target.classList.add("is-placed");
    slot.disabled = true;
    slot.classList.remove("is-filled", "is-next", "is-hint-target");
    slot.classList.add("is-placed");
    slot.setAttribute("aria-label", "Item in place");
    playSound("place");

    if (state.phase === "ready") {
      world.classList.add("is-ready");
      action.disabled = false;
      action.focus({ preventScroll: true });
      action.setAttribute("aria-label", "Light the campfire");
      setStatus("The campfire is ready to light.");
      setHintTarget(action, "light");
      return;
    }
    activateNextInventorySlot();
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
    };

    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    } catch {
      setStatus("A cozy evening.");
    }
  }

  function finishChapter() {
    if (paused || state.phase !== "ready") return;
    recordAssistance("light-fire");
    if (!lightFire(state)) return;
    clearHintTimers();
    hideHintHand();
    world.classList.remove("is-building", "is-ready");
    world.classList.add("is-evening");
    action.disabled = true;
    playSound("fire");
    saveProgress();
    setStatus("The campfire is glowing. Chapter complete.");

    window.setTimeout(() => {
      victoryOverlay.classList.add("is-visible");
      victoryOverlay.setAttribute("aria-hidden", "false");
      restartButton.focus();
    }, 1050);
  }

  function handleMainAction() {
    if (state.phase === "explore") {
      collectSelectedResource();
    } else if (state.phase === "ready") {
      finishChapter();
    }
  }

  function setPaused(nextPaused) {
    if (state.phase === "evening") return;
    paused = nextPaused;
    world.classList.toggle("is-paused", paused);
    pauseOverlay.classList.toggle("is-visible", paused);
    pauseOverlay.setAttribute("aria-hidden", String(!paused));
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

  resources.forEach((resource) => {
    resource.addEventListener("click", (event) => {
      event.stopPropagation();
      selectResource(resource);
    });
  });

  inventorySlots.forEach((slot, slotIndex) => {
    slot.addEventListener("click", (event) => {
      event.stopPropagation();
      placeInventoryItem(slot, slotIndex);
    });
  });

  world.addEventListener("pointerdown", (event) => {
    if (paused || state.phase !== "explore") return;
    if (event.target.closest("button, .hud, .action-bar")) return;
    movePlayerToPoint(event.clientX, event.clientY);
    setStatus("Walking through the forest.");
  });

  action.addEventListener("click", handleMainAction);
  camp.addEventListener("click", returnToCamp);
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
      || (state.phase === "ready" && activeElement?.classList.contains("inventory-slot"))
    );
    if (event.code === "Space" && shouldRunContextAction && !action.disabled) {
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
    const key = event.code;
    if (steps[key]) {
      event.preventDefault();
      movementSequence += 1;
      selectedResource = null;
      action.disabled = true;
      updatePlayerPosition(playerPosition.x + steps[key][0], playerPosition.y + steps[key][1]);
    }
  });

  loadVoicePrompts();
  window.GameLanguage?.onChange(loadVoicePrompts);
  renderSoundButton();
  requestAnimationFrame(() => {
    setHintTarget(document.querySelector("#branch-first"), "findFirstBranch", true);
    setStatus("Choose the nearby branch.");
  });
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    RECIPE,
    createGameState,
    collectItem,
    arriveAtCamp,
    placeRecipeItem,
    lightFire,
    requiredCount,
  };
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", startGame);
}
