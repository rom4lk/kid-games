const STORAGE_KEY = "livingWordsProgressV2";
// The shelf and every game share one language choice under this key.
const LANGUAGE_KEY = "kidGamesLanguageV1";
const SUPPORTED_LANGUAGES = ["en", "ru"];

const LEVELS = { en: [3, 4, 5, 6, 7], ru: [3, 4, 5, 6, 7] };
const CHAPTERS_PER_LEVEL = 20;
const WORDS_PER_CHAPTER = 10;
const WORDS_PER_LEVEL = CHAPTERS_PER_LEVEL * WORDS_PER_CHAPTER;

const SPEECH_LOCALES = { en: "en-US", ru: "ru-RU" };

// A browser can accept start() and then never open the microphone: no start, no
// error, no end. Without this wait the button would light up and say nothing.
const RECOGNITION_START_TIMEOUT = 3000;

const DEFAULT_STATE = {
  language: null,
  completed: {},
  stats: {
    voiceTries: 0,
    helpUses: 0,
    wrongChoices: 0,
  },
  settings: {
    microphone: true,
    sound: true,
  },
};

const elements = Object.fromEntries(
  [...document.querySelectorAll("[id]")].map((element) => [element.id, element]),
);

const screens = [
  elements.startScreen,
  elements.menuScreen,
  elements.chaptersScreen,
  elements.playScreen,
  elements.chapterScreen,
];

let ui;
let activeLanguage = "en";
let state = readState();
const uiCache = new Map();
const packCache = new Map();
let currentPack;
let currentLetters = LEVELS.en[0];
let currentChapterIndex = 0;
let currentTaskIndex = 0;
let currentAttemptCount = 0;
let currentHintUsed = false;
let currentTaskSolved = false;
let solvedTaskIndexes = new Set();
let recognition;
let recognitionStartTimer;
let recognitionAnswered = false;
let microphoneRequested = false;
let audioContext;

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return structuredClone(DEFAULT_STATE);

    return {
      ...structuredClone(DEFAULT_STATE),
      ...saved,
      completed: { ...DEFAULT_STATE.completed, ...saved.completed },
      stats: { ...DEFAULT_STATE.stats, ...saved.stats },
      settings: { ...DEFAULT_STATE.settings, ...saved.settings },
    };
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing modes can refuse writes. Progress stays for this session only.
  }
}

function readSharedLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return SUPPORTED_LANGUAGES.includes(saved) ? saved : null;
  } catch {
    return null;
  }
}

function saveSharedLanguage(language) {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Private browsing modes can refuse writes. The choice stays for this session only.
  }
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
  return response.json();
}

async function getUi(language) {
  if (!uiCache.has(language)) {
    uiCache.set(language, await fetchJson(`content/ui.${language}.json`));
  }
  return uiCache.get(language);
}

async function getPack(language, letters) {
  const key = `${language}-${letters}`;
  if (!packCache.has(key)) {
    packCache.set(key, await fetchJson(`content/words.${language}.${letters}.json`));
  }
  return packCache.get(key);
}

function fillTemplate(template, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function setText(id, value) {
  elements[id].textContent = value;
}

function showScreen(target) {
  screens.forEach((screen) => {
    screen.hidden = screen !== target;
  });

  const isStart = target === elements.startScreen;
  elements.homeButton.hidden = isStart;
  elements.headerActions.hidden = isStart;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showLoading() {
  elements.loadingState.classList.remove("error");
  elements.loadingState.textContent = ui ? ui.loading : elements.loadingState.textContent;
  elements.loadingState.hidden = false;
}

function hideLoading() {
  elements.loadingState.hidden = true;
}

function showLoadingError(error) {
  elements.loadingState.classList.add("error");
  elements.loadingState.textContent = ui?.loadingError || error.message;
  elements.loadingState.hidden = false;
}

async function setLanguage(language, { persist }) {
  activeLanguage = language;
  if (persist) {
    state.language = language;
    saveState();
    saveSharedLanguage(language);
  }
  ui = await getUi(language);
  document.documentElement.lang = ui.htmlLang;
  document.title = ui.documentTitle;
  initializeStaticContent();
}

function updateLanguageCards() {
  [elements.languageEn, elements.languageRu].forEach((card) => {
    card.setAttribute("aria-pressed", String(card.dataset.lang === activeLanguage));
  });
}

function initializeStaticContent() {
  setText("brandLabel", ui.brand);
  setText("startEyebrow", ui.start.eyebrow);
  setText("startTitle", ui.start.title);
  setText("startLead", ui.start.lead);
  setText("languageTitle", ui.start.languageTitle);
  setText("heroLetterOne", ui.start.heroLetters[0]);
  setText("heroLetterTwo", ui.start.heroLetters[1]);
  setText("heroLetterThree", ui.start.heroLetters[2]);
  setText("heroWordOne", ui.start.heroWords[0]);
  setText("heroWordTwo", ui.start.heroWords[1]);
  setText("startButton", ui.start.button);
  updateLanguageCards();

  setText("menuEyebrow", ui.menu.eyebrow);
  setText("menuTitle", ui.menu.title);
  setText("menuLead", ui.menu.lead);
  setText("readerBadgeLabel", ui.menu.readerLabel);
  setText("menuLanguageName", ui.languages[activeLanguage]);
  elements.menuLanguageButton.setAttribute("aria-label", ui.start.changeLanguage);

  setText("chaptersEyebrow", ui.chapters.eyebrow);
  setText("chaptersLead", ui.chapters.lead);
  setText("chaptersProgressLabel", ui.menu.readerLabel);
  setText("finalEyebrow", ui.chapters.finalEyebrow);
  setText("finalTitle", ui.chapters.finalTitle);
  setText("finalText", ui.chapters.finalText);
  setText("replayLevelButton", ui.chapters.replay);

  setText("skipLabel", ui.play.skip);
  setText("backLabel", ui.play.back);
  setText("readingInstruction", ui.play.readInstruction);
  setText("tapHint", ui.play.tapHint);
  setText("microphoneLabel", ui.play.microphone);
  setText("hintLabel", ui.play.hint);
  setText("choiceInstruction", ui.play.choiceInstruction);

  setText("parentEyebrow", ui.parent.eyebrow);
  setText("parentTitle", ui.parent.title);
  setText("parentLead", ui.parent.lead);
  setText("readWordsLabel", ui.parent.readWords);
  setText("voiceTriesLabel", ui.parent.voiceTries);
  setText("helpUsesLabel", ui.parent.helpUses);
  setText("microphoneSettingLabel", ui.parent.microphoneLabel);
  setText("microphoneSettingHelp", ui.parent.microphoneHelp);
  setText("soundSettingLabel", ui.parent.soundLabel);
  setText("soundSettingHelp", ui.parent.soundHelp);
  setText("resetButton", ui.parent.reset);
  setText("resetDialogText", ui.parent.resetConfirm);
  setText("resetCancel", ui.parent.resetConfirmNo);
  setText("resetConfirm", ui.parent.resetConfirmYes);

  elements.parentButton.setAttribute("aria-label", ui.parent.buttonLabel);
  elements.homeButton.setAttribute("aria-label", ui.brand);
  updateSoundControls();
}

function bindEvents() {
  elements.languageEn.addEventListener("click", () => chooseLanguage("en"));
  elements.languageRu.addEventListener("click", () => chooseLanguage("ru"));
  elements.startButton.addEventListener("click", confirmLanguage);
  elements.menuLanguageButton.addEventListener("click", () => showScreen(elements.startScreen));
  elements.homeButton.addEventListener("click", showMenu);
  elements.backButton.addEventListener("click", () => showChapters(currentLetters));
  elements.replayLevelButton.addEventListener("click", () => startChapter(0, true));
  elements.skipButton.addEventListener("click", skipTask);
  elements.parentButton.addEventListener("click", openParentDialog);
  elements.soundButton.addEventListener("click", toggleSound);
  elements.wordCard.addEventListener("click", revealHint);
  elements.hintButton.addEventListener("click", revealHint);
  elements.microphoneButton.addEventListener("click", startRecognition);
  elements.nextButton.addEventListener("click", advanceTask);
  elements.chapterButton.addEventListener("click", leaveChapterCelebration);
  elements.microphoneSetting.addEventListener("change", updateMicrophoneSetting);
  elements.soundSetting.addEventListener("change", updateSoundSetting);
  elements.resetButton.addEventListener("click", resetProgress);
  elements.resetDialog.addEventListener("close", applyReset);
}

async function chooseLanguage(language) {
  if (language === activeLanguage && state.language === language) return;
  try {
    await setLanguage(language, { persist: true });
  } catch (error) {
    showLoadingError(error);
  }
}

function confirmLanguage() {
  if (!state.language) {
    state.language = activeLanguage;
    saveState();
    saveSharedLanguage(activeLanguage);
  }
  showMenu();
}

function activeLevels() {
  return LEVELS[activeLanguage];
}

function levelKey(letters) {
  return `${activeLanguage}-${letters}`;
}

function getChapterProgress(letters, chapterIndex) {
  const level = state.completed[levelKey(letters)];
  const value = Number(level?.[chapterIndex] || 0);
  return Math.min(value, WORDS_PER_CHAPTER);
}

function setChapterProgress(letters, chapterIndex, value) {
  const key = levelKey(letters);
  state.completed[key] = { ...state.completed[key], [chapterIndex]: value };
  saveState();
}

function isChapterUnlocked(letters, chapterIndex) {
  if (chapterIndex === 0) return true;
  return getChapterProgress(letters, chapterIndex - 1) >= WORDS_PER_CHAPTER;
}

function getLevelProgress(letters) {
  let total = 0;
  for (let index = 0; index < CHAPTERS_PER_LEVEL; index += 1) {
    total += getChapterProgress(letters, index);
  }
  return total;
}

function isLevelComplete(letters) {
  return getLevelProgress(letters) >= WORDS_PER_LEVEL;
}

function getLanguageWordCount() {
  return activeLevels().reduce(
    (total, letters) => total + getLevelProgress(letters),
    0,
  );
}

function renderHeader() {
  setText("sparkCount", getLanguageWordCount());
  setText("sparkTotal", getLanguageWordCount());
  updateSoundControls();
}

function showMenu() {
  stopRecognition();
  renderHeader();
  renderMenu();
  showScreen(elements.menuScreen);
}

function renderMenu() {
  elements.levelGrid.innerHTML = "";

  activeLevels().forEach((letters) => {
    const done = getLevelProgress(letters);
    const progressText = fillTemplate(ui.menu.progress, {
      done,
      total: WORDS_PER_LEVEL,
    });
    const button = document.createElement("button");

    button.className = "level-card";
    button.type = "button";
    button.setAttribute(
      "aria-label",
      `${ui.menu.levelNames[letters]}. ${progressText}`,
    );
    button.innerHTML = `
      <span class="level-number" aria-hidden="true">${letters}</span>
      <span class="level-name">${ui.menu.levelNames[letters]}</span>
      <span class="level-sample">${ui.menu.levelSamples[letters]}</span>
      <span class="world-progress">
        <span class="world-progress-track"><span style="width: ${(done / WORDS_PER_LEVEL) * 100}%"></span></span>
        <strong>${progressText}</strong>
      </span>
    `;
    button.addEventListener("click", () => openLevel(letters));
    elements.levelGrid.appendChild(button);
  });
}

async function openLevel(letters) {
  showLoading();
  try {
    await showChapters(letters);
  } catch (error) {
    showLoadingError(error);
    return;
  }
  hideLoading();
}

async function showChapters(letters) {
  stopRecognition();
  currentLetters = letters;
  currentPack = await getPack(activeLanguage, letters);
  renderHeader();
  setText("chaptersTitle", ui.chapters.titles[letters]);
  setText(
    "chaptersProgressValue",
    fillTemplate(ui.chapters.progress, {
      done: getLevelProgress(letters),
      total: WORDS_PER_LEVEL,
    }),
  );
  renderChapters();
  showScreen(elements.chaptersScreen);
}

function renderChapters() {
  elements.chapterGrid.innerHTML = "";

  currentPack.chapters.forEach((chapter, index) => {
    const completed = getChapterProgress(currentLetters, index);
    const unlocked = isChapterUnlocked(currentLetters, index);
    const progressText = fillTemplate(ui.chapters.progress, {
      done: completed,
      total: chapter.tasks.length,
    });
    const button = document.createElement("button");

    button.className = "chapter-card";
    button.type = "button";
    button.disabled = !unlocked;
    button.style.setProperty("--world-glow", chapter.colors[0]);
    button.setAttribute("aria-label", `${chapter.title}. ${progressText}`);
    button.innerHTML = `
      <span class="chapter-top">
        <span class="chapter-card-emoji" aria-hidden="true">${chapter.emoji}</span>
        ${unlocked ? "" : '<span class="world-lock" aria-hidden="true">●</span>'}
      </span>
      <span class="world-number">${fillTemplate(ui.chapters.chapterNumber, { number: index + 1 })}</span>
      <h2>${chapter.title}</h2>
      ${unlocked ? "" : `<p>${ui.chapters.locked}</p>`}
      <span class="world-progress">
        <span class="world-progress-track"><span style="width: ${(completed / chapter.tasks.length) * 100}%"></span></span>
        <strong>${completed}/${chapter.tasks.length}</strong>
      </span>
    `;

    if (unlocked) {
      button.addEventListener("click", () => startChapter(index));
    }

    elements.chapterGrid.appendChild(button);
  });

  elements.finalBanner.hidden = !isLevelComplete(currentLetters);
}

function startChapter(chapterIndex, forceFirst = false) {
  currentChapterIndex = chapterIndex;
  const chapter = currentPack.chapters[currentChapterIndex];
  const stored = getChapterProgress(currentLetters, currentChapterIndex);
  // A finished chapter starts over as a replay; stored progress is kept.
  const progress = forceFirst || stored >= chapter.tasks.length ? 0 : stored;
  solvedTaskIndexes = new Set(
    Array.from({ length: progress }, (_, index) => index),
  );
  currentTaskIndex = Math.min(progress, chapter.tasks.length - 1);
  renderTask();
  showScreen(elements.playScreen);
}

// A word can be set aside, so progress is the run of solved words from the
// start rather than the highest index reached.
function solvedPrefixLength() {
  let length = 0;
  while (solvedTaskIndexes.has(length)) length += 1;
  return length;
}

function nextUnsolvedTaskIndex(fromIndex) {
  const chapter = currentPack.chapters[currentChapterIndex];
  for (let step = 1; step <= chapter.tasks.length; step += 1) {
    const index = (fromIndex + step) % chapter.tasks.length;
    if (!solvedTaskIndexes.has(index)) return index;
  }
  return -1;
}

function skipTask() {
  if (currentTaskSolved) return;
  const nextIndex = nextUnsolvedTaskIndex(currentTaskIndex);
  if (nextIndex === -1) return;
  currentTaskIndex = nextIndex;
  renderTask();
  setText("recognitionStatus", ui.play.skipped);
  playTone("hint");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderTask() {
  stopRecognition();
  const chapter = currentPack.chapters[currentChapterIndex];
  const task = chapter.tasks[currentTaskIndex];
  currentAttemptCount = 0;
  currentHintUsed = false;
  currentTaskSolved = false;

  elements.adventureScene.style.setProperty("--scene-a", chapter.colors[0]);
  elements.adventureScene.style.setProperty("--scene-b", chapter.colors[1]);
  setText("sceneCharacter", chapter.character);
  elements.sceneCharacter.classList.remove("celebrate");
  setText("storyPrompt", task.prompt);
  setText("wordMain", task.word);
  setText("wordSyllables", task.syllables);
  setText("recognitionStatus", "");
  setText("successTitle", ui.play.successTitle);
  setText("successText", task.success);
  setText("missionLabel", fillTemplate(ui.play.mission, {
    current: currentTaskIndex + 1,
    total: chapter.tasks.length,
  }));

  elements.wordCard.classList.remove("show-syllables");
  elements.wordSyllables.hidden = true;
  elements.successPanel.hidden = true;
  elements.skipButton.disabled = false;
  elements.choiceGrid.hidden = false;
  elements.choiceGrid.innerHTML = "";

  const progress = ((currentTaskIndex + 1) / chapter.tasks.length) * 100;
  elements.missionProgress.setAttribute("aria-valuemin", "0");
  elements.missionProgress.setAttribute("aria-valuemax", String(chapter.tasks.length));
  elements.missionProgress.setAttribute("aria-valuenow", String(currentTaskIndex + 1));
  elements.missionProgressFill.style.width = `${progress}%`;

  shuffle([...task.choices]).forEach((choice) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.type = "button";
    button.dataset.choice = choice.id;
    button.setAttribute("aria-label", choice.label);
    button.innerHTML = `
      <span aria-hidden="true">${choice.emoji}</span>
      <span class="choice-label">${choice.label}</span>
    `;
    button.addEventListener("click", () => handleChoice(button, choice.id));
    elements.choiceGrid.appendChild(button);
  });

  const isLastTask = currentTaskIndex === chapter.tasks.length - 1;
  setText("nextButton", isLastTask ? ui.play.finish : ui.play.next);
  configureMicrophoneButton();
  renderHeader();
}

function shuffle(values) {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[swapIndex]] = [values[swapIndex], values[index]];
  }
  return values;
}

function revealHint() {
  if (currentTaskSolved) return;
  const task = currentPack.chapters[currentChapterIndex].tasks[currentTaskIndex];
  elements.wordCard.classList.add("show-syllables");
  elements.wordSyllables.hidden = false;
  setText("recognitionStatus", fillTemplate(ui.play.hintUsed, {
    syllables: task.syllables,
  }));

  if (!currentHintUsed) {
    currentHintUsed = true;
    state.stats.helpUses += 1;
    saveState();
  }

  playTone("hint");
}

function handleChoice(button, choiceId) {
  if (currentTaskSolved) return;
  const chapter = currentPack.chapters[currentChapterIndex];
  const task = chapter.tasks[currentTaskIndex];

  if (choiceId !== task.correct) {
    currentAttemptCount += 1;
    state.stats.wrongChoices += 1;
    saveState();
    button.classList.remove("wrong");
    void button.offsetWidth;
    button.classList.add("wrong");
    window.setTimeout(() => button.classList.remove("wrong"), 450);

    if (currentAttemptCount === 1) {
      setText("recognitionStatus", ui.play.wrongFirst);
    } else {
      revealHint();
      setText("recognitionStatus", fillTemplate(ui.play.wrongAgain, {
        syllables: task.syllables,
      }));
    }

    playTone("wrong");
    return;
  }

  currentTaskSolved = true;
  elements.skipButton.disabled = true;
  stopRecognition();
  button.classList.add("correct");
  elements.choiceGrid.querySelectorAll("button").forEach((choiceButton) => {
    choiceButton.disabled = true;
  });

  solvedTaskIndexes.add(currentTaskIndex);
  setChapterProgress(
    currentLetters,
    currentChapterIndex,
    Math.max(
      getChapterProgress(currentLetters, currentChapterIndex),
      solvedPrefixLength(),
    ),
  );

  setText("storyPrompt", task.success);
  setText("recognitionStatus", "");
  elements.sceneCharacter.classList.add("celebrate");
  elements.successPanel.hidden = false;
  elements.nextButton.focus({ preventScroll: true });
  renderHeader();
  playTone("success");
}

function advanceTask() {
  const nextIndex = nextUnsolvedTaskIndex(currentTaskIndex);

  if (nextIndex !== -1) {
    currentTaskIndex = nextIndex;
    renderTask();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  showChapterComplete();
}

function showChapterComplete() {
  const chapter = currentPack.chapters[currentChapterIndex];
  const isLastChapter = currentChapterIndex === currentPack.chapters.length - 1;

  setText("chapterEmblem", chapter.emoji);
  setText("chapterEyebrow", ui.chapter.eyebrow);
  setText("chapterTitle", ui.chapter.title);
  setText("chapterText", chapter.completeText);
  setText("chapterButton", isLastChapter ? ui.chapter.final : ui.chapter.next);
  showScreen(elements.chapterScreen);
  playTone("chapter");
}

function leaveChapterCelebration() {
  const isLastChapter = currentChapterIndex === currentPack.chapters.length - 1;

  if (isLastChapter) {
    showChapters(currentLetters);
    return;
  }

  startChapter(currentChapterIndex + 1);
}

// Brave ships the recognition API, but its speech service is switched off on
// purpose, so every session dies right away with a "network" error.
function speechRecognitionAvailable() {
  return (
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
    && window.isSecureContext
    && !navigator.brave
  );
}

function configureMicrophoneButton() {
  const supported = speechRecognitionAvailable();
  const enabled = state.settings.microphone;
  elements.microphoneButton.disabled = !enabled || !supported;
  elements.microphoneButton.classList.remove("active");
  setText("microphoneLabel", enabled ? ui.play.microphone : ui.play.microphoneDisabled);

  // The explanation appears as a tooltip over the dead button, not as a
  // permanent line under the word.
  if (enabled && !supported) {
    elements.microphoneButton.dataset.tooltip = ui.play.microphoneUnsupported;
  } else {
    delete elements.microphoneButton.dataset.tooltip;
  }
}

function speechLocale() {
  return SPEECH_LOCALES[activeLanguage] || SPEECH_LOCALES.en;
}

async function startRecognition() {
  if (currentTaskSolved || !state.settings.microphone) return;

  // A second press stops listening. Starting again while the previous session is
  // still closing makes the browser drop the new one without a single event.
  if (recognition) {
    stopRecognition();
    setText("recognitionStatus", "");
    return;
  }

  if (!speechRecognitionAvailable()) {
    setText("recognitionStatus", ui.play.microphoneUnsupported);
    return;
  }
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // The request for access is still waiting for an answer.
  if (microphoneRequested) return;

  const task = currentTaskOf();
  showListeningButton();
  microphoneRequested = true;
  const allowed = await requestMicrophoneAccess();
  microphoneRequested = false;

  if (!allowed) {
    resetMicrophoneButton();
    setText("recognitionStatus", ui.play.microphonePermission);
    return;
  }

  // Asking for access takes as long as the child needs to answer the browser,
  // so the word on the screen can already be a different one.
  if (recognition || currentTaskSolved || currentTaskOf() !== task) {
    resetMicrophoneButton();
    return;
  }

  const listener = new Recognition();
  recognition = listener;
  recognitionAnswered = false;
  listener.lang = speechLocale();
  listener.interimResults = false;
  listener.maxAlternatives = 3;

  listener.onstart = () => {
    clearRecognitionTimer();
    showListeningButton();
    setText("recognitionStatus", ui.play.microphoneListening);
    state.stats.voiceTries += 1;
    saveState();
  };

  listener.onresult = (event) => {
    recognitionAnswered = true;
    const alternatives = [...event.results[0]].map((result) => result.transcript.trim());
    const target = normalizeSpeech(task.word);
    const matched = alternatives.some((transcript) => {
      const normalized = normalizeSpeech(transcript);
      return normalized === target || normalized.split(" ").includes(target);
    });
    const transcript = alternatives[0] || "";

    if (matched) {
      setText("recognitionStatus", fillTemplate(ui.play.heardSuccess, {
        word: task.word.toLocaleLowerCase(speechLocale()),
      }));
      playTone("voice");
    } else {
      setText("recognitionStatus", fillTemplate(ui.play.heardMismatch, {
        transcript,
      }));
    }
  };

  listener.onnomatch = () => {
    recognitionAnswered = true;
    setText("recognitionStatus", ui.play.microphoneError);
  };

  listener.onerror = (event) => {
    recognitionAnswered = true;
    // "aborted" only means the game itself stopped listening.
    if (event.error === "aborted") return;

    const permissionErrors = new Set(["not-allowed", "service-not-allowed", "audio-capture"]);
    let message = ui.play.microphoneError;
    if (permissionErrors.has(event.error)) {
      message = ui.play.microphonePermission;
    } else if (event.error === "network" || event.error === "language-not-supported") {
      // The browser has no speech service behind the API.
      message = ui.play.microphoneUnsupported;
    }
    setText("recognitionStatus", message);
  };

  listener.onend = () => {
    clearRecognitionTimer();
    recognition = undefined;
    resetMicrophoneButton();

    // A session that ends with no result and no error must still answer the press.
    if (!recognitionAnswered) {
      setText("recognitionStatus", ui.play.microphoneError);
    }
  };

  recognitionStartTimer = window.setTimeout(() => {
    recognitionStartTimer = undefined;
    if (recognition !== listener) return;
    stopRecognition();
    setText("recognitionStatus", ui.play.microphoneUnsupported);
  }, RECOGNITION_START_TIMEOUT);

  try {
    listener.start();
  } catch {
    stopRecognition();
    setText("recognitionStatus", ui.play.microphoneError);
  }
}

// The speech prompt of the browser is easy to miss, and a prompt that stays
// unanswered kills the session silently. A plain request for the microphone gives
// a clear answer and, once it is granted, speech recognition starts right away.
async function requestMicrophoneAccess() {
  if (!navigator.mediaDevices?.getUserMedia) return true;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

function currentTaskOf() {
  return currentPack?.chapters[currentChapterIndex]?.tasks[currentTaskIndex];
}

function showListeningButton() {
  elements.microphoneButton.classList.add("active");
  setText("microphoneLabel", ui.play.microphoneListening);
}

function resetMicrophoneButton() {
  elements.microphoneButton.classList.remove("active");

  if (ui) {
    setText("microphoneLabel", ui.play.microphone);
  }
}

function clearRecognitionTimer() {
  if (recognitionStartTimer === undefined) return;
  window.clearTimeout(recognitionStartTimer);
  recognitionStartTimer = undefined;
}

function stopRecognition() {
  clearRecognitionTimer();
  resetMicrophoneButton();
  if (!recognition) return;

  recognition.onend = null;
  recognition.abort();
  recognition = undefined;
}

function normalizeSpeech(value) {
  return value
    .toLocaleLowerCase(speechLocale())
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\s-]/gu, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function openParentDialog() {
  setText("readWordsValue", getLanguageWordCount());
  setText("voiceTriesValue", state.stats.voiceTries);
  setText("helpUsesValue", state.stats.helpUses);
  elements.microphoneSetting.checked = state.settings.microphone;
  elements.soundSetting.checked = state.settings.sound;
  elements.parentDialog.showModal();
}

function updateMicrophoneSetting() {
  state.settings.microphone = elements.microphoneSetting.checked;
  saveState();
  configureMicrophoneButton();
}

function updateSoundSetting() {
  state.settings.sound = elements.soundSetting.checked;
  saveState();
  updateSoundControls();

  if (state.settings.sound) {
    playTone("start");
  }
}

function toggleSound() {
  state.settings.sound = !state.settings.sound;
  saveState();
  updateSoundControls();

  if (state.settings.sound) {
    playTone("start");
  }
}

function updateSoundControls() {
  if (!ui) return;
  const label = state.settings.sound ? ui.parent.soundOn : ui.parent.soundOff;
  elements.soundButton.setAttribute("aria-label", label);
  elements.soundButton.querySelector("span").textContent = state.settings.sound ? "♪" : "×";
  elements.soundSetting.checked = state.settings.sound;
}

function playTone(type) {
  if (!state.settings.sound) return;

  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const frequencies = {
      start: 440,
      hint: 520,
      wrong: 190,
      success: 660,
      voice: 780,
      chapter: 520,
    };
    const durations = {
      wrong: 0.12,
      hint: 0.12,
      start: 0.16,
      success: 0.28,
      voice: 0.2,
      chapter: 0.42,
    };
    const duration = durations[type] || 0.16;

    oscillator.type = type === "wrong" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequencies[type] || 440, now);

    if (type === "success" || type === "chapter") {
      oscillator.frequency.exponentialRampToValueAtTime((frequencies[type] || 440) * 1.5, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  } catch {
    state.settings.sound = false;
    saveState();
    updateSoundControls();
  }
}

function resetProgress() {
  elements.resetDialog.returnValue = "cancel";
  elements.resetDialog.showModal();
}

async function applyReset() {
  if (elements.resetDialog.returnValue !== "confirm") return;
  stopRecognition();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
  state = structuredClone(DEFAULT_STATE);
  solvedTaskIndexes = new Set();
  elements.parentDialog.close();
  await setLanguage(readSharedLanguage() || "en", { persist: false });
  updateSoundControls();
  showScreen(elements.startScreen);
}

async function initialize() {
  try {
    const sharedLanguage = readSharedLanguage();
    // A language picked on the shelf wins over the one saved with the progress.
    if (sharedLanguage && state.language && sharedLanguage !== state.language) {
      state.language = sharedLanguage;
      saveState();
    }

    await setLanguage(sharedLanguage || state.language || "en", { persist: false });
    bindEvents();
    elements.app.setAttribute("aria-busy", "false");
    hideLoading();

    if (state.language) {
      showMenu();
    } else {
      showScreen(elements.startScreen);
    }
  } catch (error) {
    showLoadingError(error);
  }
}

initialize();
