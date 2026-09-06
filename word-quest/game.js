const STORAGE_KEY = "livingWordsProgressV2";
// The shelf and every game share one language choice under this key. The shared
// game-language.js module is not used here: it translates a static DOM through
// translations.json, while this game renders every string from ui.<lang>.json.
const LANGUAGE_KEY = "kidGamesLanguageV1";
const SUPPORTED_LANGUAGES = ["en", "ru"];

const LEVELS = { en: [3, 4, 5, 6, 7], ru: [3, 4, 5, 6, 7] };
const CHAPTERS_PER_LEVEL = 20;
const WORDS_PER_CHAPTER = 10;
const WORDS_PER_LEVEL = CHAPTERS_PER_LEVEL * WORDS_PER_CHAPTER;

const SPEECH_LOCALES = { en: "en-US", ru: "ru-RU" };

const DEFAULT_STATE = {
  language: null,
  completed: {},
  stats: {
    helpUses: 0,
    wrongChoices: 0,
  },
  settings: {
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
let speakTimer;

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return structuredClone(DEFAULT_STATE);

    return {
      ...structuredClone(DEFAULT_STATE),
      ...saved,
      completed: { ...DEFAULT_STATE.completed, ...saved.completed },
      stats: {
        helpUses: saved.stats?.helpUses ?? DEFAULT_STATE.stats.helpUses,
        wrongChoices: saved.stats?.wrongChoices ?? DEFAULT_STATE.stats.wrongChoices,
      },
      settings: {
        sound: saved.settings?.sound ?? DEFAULT_STATE.settings.sound,
      },
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

// Both caches hold the promise, not the resolved value, so concurrent calls
// share one request. A failed request is evicted so a retry can fetch again.
function getUi(language) {
  if (!uiCache.has(language)) {
    const request = fetchJson(`content/ui.${language}.json`).catch((error) => {
      uiCache.delete(language);
      throw error;
    });
    uiCache.set(language, request);
  }
  return uiCache.get(language);
}

function getPack(language, letters) {
  const key = `${language}-${letters}`;
  if (!packCache.has(key)) {
    const request = fetchJson(`content/words.${language}.${letters}.json`).catch((error) => {
      packCache.delete(key);
      throw error;
    });
    packCache.set(key, request);
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

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: reducedMotionQuery.matches ? "auto" : "smooth" });
}

function showScreen(target) {
  stopSpeaking();
  screens.forEach((screen) => {
    screen.hidden = screen !== target;
  });

  const isStart = target === elements.startScreen;
  elements.homeButton.hidden = isStart;
  elements.headerActions.hidden = isStart;

  // The pressed button just went hidden with its old screen; without a new
  // focus target the keyboard tab order would restart from the page top.
  const heading = target.querySelector('[tabindex="-1"]');
  (heading || target).focus({ preventScroll: true });
  scrollToTop();
}

function showLoading() {
  elements.loadingState.classList.remove("error");
  setText("loadingText", ui ? ui.loading : elements.loadingText.textContent);
  elements.loadingRetryButton.hidden = true;
  elements.loadingState.hidden = false;
}

function hideLoading() {
  elements.loadingState.hidden = true;
}

function showLoadingError(error) {
  elements.loadingState.classList.add("error");
  setText("loadingText", ui?.loadingError || error.message);
  if (ui) setText("loadingRetryButton", ui.loadingRetry);
  elements.loadingRetryButton.hidden = false;
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
  setText("hintLabel", ui.play.hint);
  setText("listenLabel", ui.play.listen);
  setText("choiceInstruction", ui.play.choiceInstruction);

  setText("parentEyebrow", ui.parent.eyebrow);
  setText("parentTitle", ui.parent.title);
  setText("parentLead", ui.parent.lead);
  setText("readWordsLabel", ui.parent.readWords);
  setText("helpUsesLabel", ui.parent.helpUses);
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
  elements.listenButton.addEventListener("click", speakCurrentWord);
  elements.nextButton.addEventListener("click", advanceTask);
  elements.chapterButton.addEventListener("click", leaveChapterCelebration);
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
  // A corrupted stored value must not reach the progress bars as NaN.
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), WORDS_PER_CHAPTER);
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
  const wordCount = getLanguageWordCount();
  setText("sparkCount", wordCount);
  setText("sparkTotal", wordCount);
  updateSoundControls();
}

function showMenu() {
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
  // The loop never lands back on fromIndex: when the current word is the only
  // unsolved one there is nothing to skip to, and the answer is -1.
  for (let step = 1; step < chapter.tasks.length; step += 1) {
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
  setText("feedbackStatus", ui.play.skipped);
  playTone("hint");
  scrollToTop();
}

function renderTask() {
  stopSpeaking();
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
  setText("feedbackStatus", "");
  setText("successTitle", ui.play.successTitle);
  setText("successText", task.success);
  setText("missionLabel", fillTemplate(ui.play.mission, {
    current: currentTaskIndex + 1,
    total: chapter.tasks.length,
  }));

  elements.wordCard.classList.remove("show-syllables");
  elements.wordSyllables.hidden = true;
  elements.successPanel.hidden = true;
  elements.skipButton.disabled = nextUnsolvedTaskIndex(currentTaskIndex) === -1;
  elements.choiceGrid.hidden = false;
  elements.choiceGrid.innerHTML = "";

  renderMissionProgress(chapter);

  shuffle([...task.choices]).forEach((choice, choiceIndex) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.type = "button";
    button.dataset.choice = choice.id;
    // The caption must not reach the DOM or the accessible name before the
    // correct answer, so a screen reader or find-in-page cannot reveal it.
    button.setAttribute("aria-label", fillTemplate(ui.play.choiceLabel, {
      number: choiceIndex + 1,
    }));
    button.innerHTML = `<span aria-hidden="true">${choice.emoji}</span>`;
    button.addEventListener("click", () => handleChoice(button, choice));
    elements.choiceGrid.appendChild(button);
  });

  const isLastTask = currentTaskIndex === chapter.tasks.length - 1;
  setText("nextButton", isLastTask ? ui.play.finish : ui.play.next);
  renderHeader();
}

// The bar shows how many words are solved, not how far the child has jumped:
// skipping ahead must not move it.
function renderMissionProgress(chapter) {
  const solved = solvedTaskIndexes.size;
  elements.missionProgress.setAttribute("aria-label", ui.menu.readerLabel);
  elements.missionProgress.setAttribute("aria-valuemin", "0");
  elements.missionProgress.setAttribute("aria-valuemax", String(chapter.tasks.length));
  elements.missionProgress.setAttribute("aria-valuenow", String(solved));
  elements.missionProgressFill.style.width = `${(solved / chapter.tasks.length) * 100}%`;
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
  setText("feedbackStatus", fillTemplate(ui.play.hintUsed, {
    syllables: task.syllables,
  }));

  if (!currentHintUsed) {
    currentHintUsed = true;
    state.stats.helpUses += 1;
    saveState();
  }

  playTone("hint");
}

function handleChoice(button, choice) {
  if (currentTaskSolved) return;
  const chapter = currentPack.chapters[currentChapterIndex];
  const task = chapter.tasks[currentTaskIndex];

  if (choice.id !== task.correct) {
    currentAttemptCount += 1;
    state.stats.wrongChoices += 1;
    saveState();
    button.classList.remove("wrong");
    void button.offsetWidth;
    button.classList.add("wrong");
    window.setTimeout(() => button.classList.remove("wrong"), 450);

    if (currentAttemptCount === 1) {
      setText("feedbackStatus", ui.play.wrongFirst);
    } else {
      revealHint();
      setText("feedbackStatus", fillTemplate(ui.play.wrongAgain, {
        syllables: task.syllables,
      }));
    }

    playTone("wrong");
    return;
  }

  currentTaskSolved = true;
  elements.skipButton.disabled = true;
  button.classList.add("correct");
  // Only now may the caption appear: in the DOM and in the accessible name.
  const caption = document.createElement("span");
  caption.className = "choice-label";
  caption.textContent = choice.label;
  button.appendChild(caption);
  button.setAttribute("aria-label", choice.label);
  elements.choiceGrid.querySelectorAll("button").forEach((choiceButton) => {
    choiceButton.disabled = true;
  });

  solvedTaskIndexes.add(currentTaskIndex);
  renderMissionProgress(chapter);
  setChapterProgress(
    currentLetters,
    currentChapterIndex,
    Math.max(
      getChapterProgress(currentLetters, currentChapterIndex),
      solvedPrefixLength(),
    ),
  );

  setText("storyPrompt", task.success);
  setText("feedbackStatus", "");
  elements.sceneCharacter.classList.add("celebrate");
  elements.successPanel.hidden = false;
  elements.listenButton.hidden = !canSpeak();
  elements.nextButton.focus({ preventScroll: true });
  renderHeader();
  playTone("success");

  if (canSpeak()) {
    // Let the success jingle finish before the voice starts.
    speakTimer = window.setTimeout(() => speakWord(task.word), 400);
  }
}

function advanceTask() {
  const nextIndex = nextUnsolvedTaskIndex(currentTaskIndex);

  if (nextIndex !== -1) {
    currentTaskIndex = nextIndex;
    renderTask();
    scrollToTop();
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

function speechLocale() {
  return SPEECH_LOCALES[activeLanguage] || SPEECH_LOCALES.en;
}

function canSpeak() {
  return state.settings.sound && "speechSynthesis" in window;
}

function speakWord(word) {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  // Words are stored in upper case; some voices spell capitals letter by letter.
  const utterance = new SpeechSynthesisUtterance(word.toLocaleLowerCase(speechLocale()));
  utterance.lang = speechLocale();
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function speakCurrentWord() {
  const task = currentPack.chapters[currentChapterIndex].tasks[currentTaskIndex];
  speakWord(task.word);
}

function stopSpeaking() {
  window.clearTimeout(speakTimer);
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function openParentDialog() {
  setText("readWordsValue", getLanguageWordCount());
  setText("helpUsesValue", state.stats.helpUses);
  elements.soundSetting.checked = state.settings.sound;
  elements.parentDialog.showModal();
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

// The audio wiring lives in shared/game-sound.js; this game only keeps its own
// note vocabulary.
const TONES = {
  start: { frequency: 440, duration: 0.16 },
  hint: { frequency: 520, duration: 0.12 },
  wrong: { frequency: 190, duration: 0.12, wave: "triangle" },
  success: { frequency: 660, duration: 0.28, bendTo: 990 },
  chapter: { frequency: 520, duration: 0.42, bendTo: 780 },
};

function playTone(type) {
  if (!state.settings.sound) return;

  try {
    window.GameSound.tone(TONES[type] || TONES.start);
  } catch {
    // A refused AudioContext mutes this one tone; the setting stays untouched.
  }
}

function resetProgress() {
  elements.resetDialog.returnValue = "cancel";
  elements.resetDialog.showModal();
}

async function applyReset() {
  if (elements.resetDialog.returnValue !== "confirm") return;
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
  // Bound before anything can fail, so the error overlay always offers a way out.
  elements.loadingRetryButton.addEventListener("click", () => window.location.reload());

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
