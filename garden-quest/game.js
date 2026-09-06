const BOARD_SIZE = 8;

const ITEMS = {
  f: { name: "strawberry", icon: "🍓", value: 1 },
  v: { name: "carrot", icon: "🥕", value: 2 },
  a: { name: "apple", icon: "🍎", value: 3 },
  e: { name: "eggplant", icon: "🍆", value: 5 },
  w: { name: "watermelon", icon: "🍉", value: 10 },
};

const LEVELS = [
  {
    name: "First steps",
    moves: 11,
    goals: [10, 18, 23],
    maxScore: 28,
    tip: "The garden is open and friendly. Try to visit the biggest treats.",
    map: [
      "f..v..a.",
      ".e..f..v",
      "..a..f..",
      "v..w...e",
      "...p....",
      ".f..v..a",
      "..e..f..",
      "a..v..w.",
    ],
  },
  {
    name: "Little hedge",
    moves: 12,
    goals: [10, 16, 20],
    maxScore: 23,
    tip: "Trees have appeared. Go around them without wasting a step.",
    map: [
      "f..#..w.",
      ".v.#.a..",
      "..e#..f.",
      "........",
      "#..p..##",
      "v..a..e.",
      ".f...v..",
      "w..a..f.",
    ],
  },
  {
    name: "Orchard turn",
    moves: 13,
    goals: [10, 18, 24],
    maxScore: 28,
    tip: "The best fruit sits on different turns. Plan which corner comes first.",
    map: [
      "..w...f.",
      ".##.v...",
      "a...#..e",
      "..f.#...",
      "...p..w.",
      ".#..a...",
      ".e..##.v",
      "w...f...",
    ],
  },
  {
    name: "Twisty path",
    moves: 14,
    goals: [10, 20, 26],
    maxScore: 30,
    tip: "Some paths are long. Pick a side before you start walking.",
    map: [
      "w.#..f.a",
      "..#v.#..",
      "e.#..#w.",
      "..#..#..",
      "..#p.#..",
      "f....#e.",
      ".###.v..",
      "a..f..w.",
    ],
  },
  {
    name: "Split garden",
    moves: 15,
    goals: [10, 18, 22],
    maxScore: 26,
    tip: "The garden has four sides. Choose carefully when to cross the middle.",
    map: [
      "w..#..e.",
      ".f.#.v..",
      "..a#..w.",
      "........",
      "##.p.###",
      "e..#..f.",
      ".v.#.a..",
      "..w#..e.",
    ],
  },
  {
    name: "Big maze",
    moves: 16,
    goals: [10, 21, 27],
    maxScore: 31,
    tip: "The best prizes are far apart. A short route can win more.",
    map: [
      "w.#f.#.e",
      ".##..#.v",
      "a...##..",
      "###...w.",
      "..fp.#..",
      ".#..a#.e",
      "v#....#.",
      "w..e..f.",
    ],
  },
  {
    name: "Secret passages",
    moves: 17,
    goals: [10, 22, 30],
    maxScore: 34,
    tip: "Small openings connect the garden. Find the route with no backtracking.",
    map: [
      "w.#e..#w",
      "..#..f..",
      "e.##.##.",
      "..v.....",
      "##.p.#w.",
      "a..#....",
      ".#..a#e.",
      "w..f..v.",
    ],
  },
  {
    name: "Garden master",
    moves: 18,
    goals: [10, 24, 34],
    maxScore: 38,
    tip: "Every step matters. Make your whole route before you move.",
    map: [
      "w#f..#e.",
      ".#.#a#.v",
      ".e.#.#..",
      "##.w....",
      "f..p.#.w",
      ".##.a#..",
      "v..#..#e",
      "w.#e..f.",
    ],
  },
  {
    name: "Corner hunt",
    moves: 19,
    goals: [10, 24, 33],
    maxScore: 37,
    tip: "Big prizes pull in opposite directions. Compare routes before moving.",
    map: [
      "w#e..#w.",
      ".#..a#..",
      ".##..#e.",
      "f..#....",
      ".#.p.##w",
      "e#..v...",
      ".#a##.f.",
      "w...e..v",
    ],
  },
  {
    name: "Champion route",
    moves: 20,
    goals: [10, 24, 33],
    maxScore: 37,
    tip: "A perfect route earns three stars plus. Try different paths.",
    map: [
      "w#e..#w.",
      ".#.#a#..",
      ".#...#e.",
      "f..#....",
      ".#.p.##w",
      "e#..v...",
      ".#a#..f.",
      "w...e#.v",
    ],
  },
];

const DIRECTIONS = {
  up: { row: -1, column: 0 },
  down: { row: 1, column: 0 },
  left: { row: 0, column: -1 },
  right: { row: 0, column: 1 },
};

const BEST_KEY = "gardenQuestBestScoresV3";
const UNLOCK_KEY = "gardenQuestUnlockedV1";
const SOUND_KEY = "gardenQuestSoundV1";

// The result dialog waits for the last step to be seen. Reduced motion keeps the
// pause, but shortens it to almost nothing.
const FINISH_DELAY = 340;
const FINISH_DELAY_REDUCED = 20;

const prefersReducedMotion = window.matchMedia
  ? window.matchMedia("(prefers-reduced-motion: reduce)")
  : { matches: false };

const boardElement = document.querySelector("#board");
const levelPickerElement = document.querySelector("#levelPicker");
const scoreElement = document.querySelector("#scoreValue");
const movesElement = document.querySelector("#movesValue");
const bestElement = document.querySelector("#bestValue");
const gameMessageElement = document.querySelector("#gameMessage");
const scorePopElement = document.querySelector("#scorePop");
const levelDialogElement = document.querySelector("#levelDialog");
const gameShellElement = document.querySelector(".game-shell");
const soundButton = document.querySelector("#soundButton");

let currentLevelIndex = 0;
let boardState = [];
let cellElements = [];
let playerPosition = { row: 0, column: 0 };
let score = 0;
let movesLeft = 0;
let gameFinished = false;
let finishTimer = 0;
let bestScores = readBestScores();
let unlockedLevel = readUnlockedLevel();
let soundEnabled = readSoundSetting();

// Saved progress is read once and kept in memory, so a move never waits for
// localStorage.
function readBestScores() {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY)) ?? {};
  } catch {
    return {};
  }
}

function writeBestScore(levelIndex, value) {
  bestScores[levelIndex] = value;
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(bestScores));
  } catch {
    // Private browsing modes can refuse writes. Scores stay for this session only.
  }
}

// A stored value outside the level range would leave every garden locked, so it
// is clamped from both sides.
function readUnlockedLevel() {
  try {
    const saved = Number(localStorage.getItem(UNLOCK_KEY)) || 0;
    return Math.min(Math.max(saved, 0), LEVELS.length - 1);
  } catch {
    return 0;
  }
}

function unlockLevel(levelIndex) {
  const opened = Math.min(levelIndex, LEVELS.length - 1);
  if (opened <= unlockedLevel) return;
  unlockedLevel = opened;
  try {
    localStorage.setItem(UNLOCK_KEY, String(opened));
  } catch {
    // Private browsing modes can refuse writes. Levels stay open for this session only.
  }
}

// Gardens open one at a time so the newest one is always the current goal.
function renderLevelPicker() {
  levelPickerElement.innerHTML = LEVELS.map((level, index) => {
    const open = index <= unlockedLevel;
    const current = index === currentLevelIndex;
    return `
      <button class="level-button${current ? " active" : ""}" type="button" data-level="${index}"
        ${open ? "" : "disabled"} aria-current="${current ? "true" : "false"}"
        aria-label="Level ${index + 1}: ${open ? level.name : "locked"}">
        <span>${open ? index + 1 : "🔒"}</span>
      </button>
    `;
  }).join("");

  levelPickerElement.querySelectorAll(".level-button").forEach((button) => {
    button.addEventListener("click", () => startLevel(Number(button.dataset.level)));
  });
}

// The result dialog is modal, so the board and the controls behind it stop
// answering the keyboard while it is open.
function showResultDialog(open) {
  levelDialogElement.hidden = !open;
  gameShellElement.inert = open;
}

function createBoardState(level) {
  let start = { row: 0, column: 0 };
  const board = level.map.map((row, rowIndex) =>
    [...row].map((symbol, columnIndex) => {
      if (symbol === "p") {
        start = { row: rowIndex, column: columnIndex };
        return ".";
      }
      return symbol;
    }),
  );
  return { board, start };
}

// One point reads badly in English, and the Russian text needs its own form too.
function pointsLabel(value) {
  return value === 1 ? "1 point" : `${value} points`;
}

// A hint arrow and a bumped tree both stay on screen until something changes.
function clearFeedback() {
  document.querySelectorAll(".move-button.hinted").forEach((button) => {
    button.classList.remove("hinted");
  });
  boardElement.querySelectorAll(".hinted, .wobble").forEach((cell) => {
    cell.classList.remove("hinted", "wobble");
  });
}

function startLevel(levelIndex) {
  if (levelIndex > unlockedLevel) return;
  // A level can be restarted inside the pause before the result dialog.
  window.clearTimeout(finishTimer);
  currentLevelIndex = levelIndex;
  const level = LEVELS[currentLevelIndex];
  const { board, start } = createBoardState(level);
  boardState = board;
  playerPosition = start;
  score = 0;
  movesLeft = level.moves;
  gameFinished = false;
  showResultDialog(false);
  clearFeedback();

  document.querySelector("#levelLabel").textContent = `Level ${currentLevelIndex + 1}`;
  document.querySelector("#levelName").textContent = level.name;
  document.querySelector("#levelTip").textContent = level.tip;
  document.querySelector("#goalOne").textContent = level.goals[0];
  document.querySelector("#goalTwo").textContent = level.goals[1];
  document.querySelector("#goalThree").textContent = level.goals[2];
  document.querySelector("#goalPerfect").textContent = level.maxScore;
  gameMessageElement.textContent = "Use the arrow keys or the big buttons.";

  renderLevelPicker();
  updateStats();
  renderBoard();
}

// Rows are real grid rows, so the board is a valid grid for a screen reader.
function buildBoard() {
  const fragment = document.createDocumentFragment();

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    const rowElement = document.createElement("div");
    const cells = [];
    rowElement.className = "board-row";
    rowElement.setAttribute("role", "row");

    for (let column = 0; column < BOARD_SIZE; column += 1) {
      const cell = document.createElement("div");
      cell.setAttribute("role", "gridcell");
      cell.dataset.row = row;
      cell.dataset.column = column;
      rowElement.appendChild(cell);
      cells.push(cell);
    }

    cellElements.push(cells);
    fragment.appendChild(rowElement);
  }

  boardElement.appendChild(fragment);
}

// The squares are updated in place: a move rewrites the two squares that
// changed instead of all sixty-four, so the reading position stays on the board.
function renderBoard() {
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      const cell = cellElements[row][column];
      const symbol = boardState[row][column];
      const isPlayer = row === playerPosition.row && column === playerPosition.column;
      const shade = (row + column) % 2 === 0 ? "light" : "dark";
      const item = ITEMS[symbol];
      const piece = isPlayer ? "player" : symbol === "#" ? "rock" : item ? symbol : "empty";
      const className = `cell ${shade}${isPlayer ? " player" : ""}${symbol === "#" ? " rock" : ""}`;

      if (cell.className !== className) cell.className = className;
      if (cell.dataset.piece === piece) continue;
      cell.dataset.piece = piece;

      if (isPlayer) {
        cell.setAttribute("aria-label", "Pip the gardener");
        cell.innerHTML = '<span class="piece" aria-hidden="true">🧑‍🌾</span>';
      } else if (symbol === "#") {
        cell.setAttribute("aria-label", "Tree, path blocked");
        cell.innerHTML = '<span class="piece" aria-hidden="true">🌳</span>';
      } else if (item) {
        cell.setAttribute("aria-label", `${item.name}, ${pointsLabel(item.value)}`);
        cell.innerHTML = `
          <span class="piece" aria-hidden="true">${item.icon}</span>
          <span class="point-badge" aria-hidden="true">${item.value}</span>
        `;
      } else {
        cell.setAttribute("aria-label", "Empty garden square");
        cell.innerHTML = "";
      }
    }
  }
}

function updateStats() {
  const bestScore = bestScores[currentLevelIndex];
  scoreElement.textContent = score;
  movesElement.textContent = movesLeft;
  bestElement.textContent = bestScore === undefined ? "—" : bestScore;
}

function movePlayer(directionName) {
  if (gameFinished) return;

  const direction = DIRECTIONS[directionName];
  const nextPosition = {
    row: playerPosition.row + direction.row,
    column: playerPosition.column + direction.column,
  };

  if (!isInsideBoard(nextPosition)) {
    gameMessageElement.textContent = "That is the edge of the garden.";
    playTone(150, 0.09, "sine", 0.03);
    bumpBoard();
    return;
  }

  if (boardState[nextPosition.row][nextPosition.column] === "#") {
    gameMessageElement.textContent = "A tree is in the way. Try another path!";
    playTone(115, 0.08, "square", 0.035);
    shakeTree(nextPosition);
    return;
  }

  clearFeedback();
  playerPosition = nextPosition;
  movesLeft -= 1;
  const collectedSymbol = boardState[nextPosition.row][nextPosition.column];

  if (ITEMS[collectedSymbol]) {
    collectItem(collectedSymbol, nextPosition);
  } else {
    gameMessageElement.textContent = movesLeft === 1 ? "One step left. Make it count!" : "Keep looking for a tasty prize.";
    playTone(250, 0.045, "sine", 0.018);
  }

  updateStats();
  renderBoard();

  if (movesLeft === 0) {
    gameFinished = true;
    const delay = prefersReducedMotion.matches ? FINISH_DELAY_REDUCED : FINISH_DELAY;
    finishTimer = window.setTimeout(finishLevel, delay);
  }
}

function collectItem(symbol, position) {
  const item = ITEMS[symbol];
  score += item.value;
  boardState[position.row][position.column] = ".";
  gameMessageElement.textContent = item.value === 1
    ? `${item.icon} Great! ${item.name} is worth 1 point.`
    : `${item.icon} Great! ${item.name} is worth ${item.value} points.`;
  showScorePop(item.value, position);
  playCollectSound(item.value);
}

function shakeTree(position) {
  const cell = cellElements[position.row]?.[position.column];
  if (!cell) return;
  // Only the tree that was just bumped carries the mark.
  boardElement.querySelectorAll(".wobble").forEach((other) => other.classList.remove("wobble"));
  void cell.offsetWidth;
  cell.classList.add("wobble");
}

function isInsideBoard(position) {
  return (
    position.row >= 0 &&
    position.row < BOARD_SIZE &&
    position.column >= 0 &&
    position.column < BOARD_SIZE
  );
}

function showScorePop(value, position) {
  const boardRect = boardElement.getBoundingClientRect();
  const wrapRect = boardElement.parentElement.getBoundingClientRect();
  const cellWidth = boardRect.width / BOARD_SIZE;
  const cellHeight = boardRect.height / BOARD_SIZE;
  const x = boardRect.left - wrapRect.left + (position.column + 0.5) * cellWidth;
  const y = boardRect.top - wrapRect.top + (position.row + 0.5) * cellHeight;

  scorePopElement.textContent = `+${value}`;
  scorePopElement.style.left = `${x}px`;
  scorePopElement.style.top = `${y}px`;
  scorePopElement.classList.remove("show");
  void scorePopElement.offsetWidth;
  scorePopElement.classList.add("show");
}

// Points to one useful next step: the first move of the best route the player
// can still afford. It never moves Pip.
function findHintStep() {
  const start = `${playerPosition.row},${playerPosition.column}`;
  const seen = new Map([[start, { steps: 0, first: null }]]);
  const queue = [{ position: playerPosition, steps: 0, first: null }];
  let best = null;

  while (queue.length > 0) {
    const node = queue.shift();
    if (node.steps >= movesLeft) continue;

    for (const [name, direction] of Object.entries(DIRECTIONS)) {
      const next = {
        row: node.position.row + direction.row,
        column: node.position.column + direction.column,
      };
      if (!isInsideBoard(next)) continue;
      if (boardState[next.row][next.column] === "#") continue;

      const key = `${next.row},${next.column}`;
      if (seen.has(key)) continue;

      const steps = node.steps + 1;
      const first = node.first ?? name;
      seen.set(key, { steps, first });
      queue.push({ position: next, steps, first });

      const item = ITEMS[boardState[next.row][next.column]];
      if (!item) continue;
      const worth = item.value / steps;
      if (!best || worth > best.worth) best = { worth, first, target: next };
    }
  }

  return best;
}

function showHint() {
  if (gameFinished) return;
  const hint = findHintStep();
  clearFeedback();

  if (!hint) {
    gameMessageElement.textContent = "No prize is close enough. Start again when you like.";
    playTone(230, 0.12, "sine", 0.03);
    return;
  }

  document.querySelector(`.move-button[data-direction="${hint.first}"]`).classList.add("hinted");
  cellElements[hint.target.row][hint.target.column].classList.add("hinted");
  gameMessageElement.textContent = "Try this way first.";
  playTone(560, 0.1, "sine", 0.03);
}

function bumpBoard() {
  if (prefersReducedMotion.matches) return;
  boardElement.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-4px)" },
      { transform: "translateX(4px)" },
      { transform: "translateX(0)" },
    ],
    { duration: 170, easing: "ease-out" },
  );
}

function getStars(value, goals) {
  if (value >= goals[2]) return 3;
  if (value >= goals[1]) return 2;
  if (value >= goals[0]) return 1;
  return 0;
}

// The next garden opens only after a star, so the button has to say what it
// really does.
function nextLevelIndex() {
  const nextIndex = (currentLevelIndex + 1) % LEVELS.length;
  return nextIndex <= unlockedLevel ? nextIndex : currentLevelIndex;
}

function finishLevel() {
  const level = LEVELS[currentLevelIndex];
  const previousBest = bestScores[currentLevelIndex];
  const isNewBest = score > (previousBest ?? 0);
  const stars = getStars(score, level.goals);
  const isPerfect = score >= level.maxScore;

  if (isNewBest) writeBestScore(currentLevelIndex, score);
  if (stars > 0) unlockLevel(currentLevelIndex + 1);

  document.querySelector("#resultTitle").textContent = stars > 0 ? "Great harvest!" : "Good try, Pip!";
  document.querySelector("#resultStars").textContent = stars > 0
    ? `${"⭐".repeat(stars)}${isPerfect ? "+" : ""}`
    : "🌱";
  document.querySelector("#resultStars").setAttribute(
    "aria-label",
    isPerfect ? "Three stars plus earned" : `${stars} stars earned`,
  );
  document.querySelector("#resultScore").textContent = score;
  // Nothing is shown before a level has a saved best, so "Best score: 0" cannot
  // appear on a first attempt.
  document.querySelector("#resultBest").textContent = isNewBest
    ? "A new best score!"
    : previousBest === undefined ? "" : `Best score: ${previousBest}`;

  const nextButton = document.querySelector("#nextButton");
  const nextIndex = nextLevelIndex();
  if (nextIndex === currentLevelIndex) {
    nextButton.textContent = "Try again";
  } else if (nextIndex === 0) {
    nextButton.textContent = "Level 1 →";
  } else {
    nextButton.textContent = "Next level →";
  }

  updateStats();
  renderLevelPicker();
  showResultDialog(true);
  nextButton.focus();
  playFinishSound(stars);
}

function readSoundSetting() {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

function saveSoundSetting() {
  try {
    localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off");
  } catch {
    // Private browsing modes can refuse writes. The choice stays for this session only.
  }
}

function renderSoundButton() {
  soundButton.querySelector("span").textContent = soundEnabled ? "\u{1F50A}" : "\u{1F507}";
  soundButton.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
}

function playTone(frequency, duration, type = "sine", volume = 0.03, delay = 0) {
  if (!soundEnabled) return;
  window.GameSound?.tone({ frequency, delay, duration, volume, wave: type });
}

function playCollectSound(value) {
  const baseFrequency = 330 + value * 18;
  playTone(baseFrequency, 0.09, "sine", 0.035);
  playTone(baseFrequency * 1.3, 0.12, "sine", 0.025, 0.07);
}

function playFinishSound(stars) {
  const notes = stars > 0 ? [392, 523, 659] : [330, 392];
  notes.forEach((note, index) => playTone(note, 0.16, "triangle", 0.035, index * 0.12));
}

document.querySelectorAll(".move-button").forEach((button) => {
  button.addEventListener("click", () => movePlayer(button.dataset.direction));
});

document.querySelector("#hintButton").addEventListener("click", showHint);
document.querySelector("#restartButton").addEventListener("click", () => startLevel(currentLevelIndex));
document.querySelector("#replayButton").addEventListener("click", () => startLevel(currentLevelIndex));
document.querySelector("#nextButton").addEventListener("click", () => startLevel(nextLevelIndex()));

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  saveSoundSetting();
  renderSoundButton();
  if (soundEnabled) playTone(440, 0.09, "sine", 0.03);
});

window.addEventListener("keydown", (event) => {
  // Browser and system shortcuts keep their meaning, and a focused control keeps
  // its own arrow keys — otherwise the language picker cannot be used.
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (!levelDialogElement.hidden) return;
  const focused = document.activeElement;
  if (focused && ["SELECT", "INPUT", "TEXTAREA"].includes(focused.tagName)) return;

  const keyDirections = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    KeyW: "up",
    KeyS: "down",
    KeyA: "left",
    KeyD: "right",
  };
  const direction = keyDirections[event.code];

  if (direction) {
    event.preventDefault();
    movePlayer(direction);
  }
});

buildBoard();
renderSoundButton();
startLevel(0);
