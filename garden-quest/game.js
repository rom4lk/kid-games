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
    moves: 22,
    goals: [10, 28, 44],
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
    moves: 19,
    goals: [10, 22, 33],
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
    moves: 18,
    goals: [10, 23, 33],
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
    moves: 17,
    goals: [10, 22, 31],
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
    moves: 16,
    goals: [10, 18, 26],
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
    moves: 15,
    goals: [10, 21, 30],
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
    moves: 15,
    goals: [10, 22, 31],
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
    moves: 14,
    goals: [10, 24, 34],
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
    moves: 14,
    goals: [10, 21, 29],
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
    moves: 13,
    goals: [10, 21, 29],
    tip: "Only the sharpest route earns three stars. Test every good-looking path.",
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

const UNLOCK_KEY = "gardenQuestUnlockedV1";
const SOUND_KEY = "gardenQuestSoundV1";

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
const soundButton = document.querySelector("#soundButton");

let currentLevelIndex = 0;
let boardState = [];
let playerPosition = { row: 0, column: 0 };
let score = 0;
let movesLeft = 0;
let gameFinished = false;
let soundEnabled = readSoundSetting();

function readBestScores() {
  try {
    return JSON.parse(localStorage.getItem("gardenQuestBestScoresV2")) ?? {};
  } catch {
    return {};
  }
}

function writeBestScore(levelIndex, value) {
  const bestScores = readBestScores();
  bestScores[levelIndex] = value;
  try {
    localStorage.setItem("gardenQuestBestScoresV2", JSON.stringify(bestScores));
  } catch {
    // Private browsing modes can refuse writes. Scores stay for this session only.
  }
}

function readUnlockedLevel() {
  try {
    return Math.min(Number(localStorage.getItem(UNLOCK_KEY)) || 0, LEVELS.length - 1);
  } catch {
    return 0;
  }
}

function unlockLevel(levelIndex) {
  if (levelIndex <= readUnlockedLevel()) return;
  try {
    localStorage.setItem(UNLOCK_KEY, String(Math.min(levelIndex, LEVELS.length - 1)));
  } catch {
    // Private browsing modes can refuse writes. Levels stay open for this session only.
  }
}

// Gardens open one at a time so the newest one is always the current goal.
function renderLevelPicker() {
  const unlocked = readUnlockedLevel();
  levelPickerElement.innerHTML = LEVELS.map((level, index) => {
    const open = index <= unlocked;
    return `
      <button class="level-button" type="button" data-level="${index}" ${open ? "" : "disabled"}
        aria-label="Level ${index + 1}: ${open ? level.name : "locked"}">
        <span>${open ? index + 1 : "🔒"}</span>
        <small>${open ? level.name : "Locked"}</small>
      </button>
    `;
  }).join("");

  levelPickerElement.querySelectorAll(".level-button").forEach((button) => {
    button.addEventListener("click", () => startLevel(Number(button.dataset.level)));
  });
}

function createBoardState(level) {
  return level.map.map((row, rowIndex) =>
    [...row].map((symbol, columnIndex) => {
      if (symbol === "p") {
        playerPosition = { row: rowIndex, column: columnIndex };
        return ".";
      }
      return symbol;
    }),
  );
}

function startLevel(levelIndex) {
  if (levelIndex > readUnlockedLevel()) return;
  currentLevelIndex = levelIndex;
  const level = LEVELS[currentLevelIndex];
  boardState = createBoardState(level);
  score = 0;
  movesLeft = level.moves;
  gameFinished = false;
  levelDialogElement.hidden = true;

  document.querySelector("#levelLabel").textContent = `Level ${currentLevelIndex + 1}`;
  document.querySelector("#levelName").textContent = level.name;
  document.querySelector("#levelTip").textContent = level.tip;
  document.querySelector("#goalOne").textContent = level.goals[0];
  document.querySelector("#goalTwo").textContent = level.goals[1];
  document.querySelector("#goalThree").textContent = level.goals[2];
  gameMessageElement.textContent = "Use the arrow keys or the big buttons.";

  renderLevelPicker();
  document.querySelectorAll(".level-button").forEach((button, index) => {
    button.classList.toggle("active", index === currentLevelIndex);
    button.setAttribute("aria-current", index === currentLevelIndex ? "true" : "false");
  });

  updateStats();
  renderBoard();
}

function renderBoard() {
  const fragment = document.createDocumentFragment();
  boardElement.innerHTML = "";

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      const cell = document.createElement("div");
      const symbol = boardState[row][column];
      const isPlayer = row === playerPosition.row && column === playerPosition.column;
      const shade = (row + column) % 2 === 0 ? "light" : "dark";

      cell.className = `cell ${shade}`;
      cell.setAttribute("role", "gridcell");
      cell.dataset.row = row;
      cell.dataset.column = column;

      if (isPlayer) {
        cell.classList.add("player");
        cell.setAttribute("aria-label", "Pip the gardener");
        cell.innerHTML = '<span class="piece" aria-hidden="true">🧑‍🌾</span>';
      } else if (symbol === "#") {
        cell.classList.add("rock");
        cell.setAttribute("aria-label", "Tree, path blocked");
        cell.innerHTML = '<span class="piece" aria-hidden="true">🌳</span>';
      } else if (ITEMS[symbol]) {
        const item = ITEMS[symbol];
        cell.setAttribute("aria-label", `${item.name}, ${item.value} points`);
        cell.innerHTML = `
          <span class="piece" aria-hidden="true">${item.icon}</span>
          <span class="point-badge" aria-hidden="true">${item.value}</span>
        `;
      } else {
        cell.setAttribute("aria-label", "Empty garden square");
      }

      fragment.appendChild(cell);
    }
  }

  boardElement.appendChild(fragment);
}

function updateStats() {
  const bestScore = readBestScores()[currentLevelIndex];
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

  document.querySelectorAll(".move-button.hinted, .cell.hinted").forEach((element) => {
    element.classList.remove("hinted");
  });
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

  if (movesLeft === 0 || countRemainingItems() === 0) {
    gameFinished = true;
    window.setTimeout(finishLevel, 340);
  }
}

function collectItem(symbol, position) {
  const item = ITEMS[symbol];
  score += item.value;
  boardState[position.row][position.column] = ".";
  gameMessageElement.textContent = `${item.icon} Great! ${item.name} is worth ${item.value} points.`;
  showScorePop(item.value, position);
  playCollectSound(item.value);
}

function shakeTree(position) {
  const cell = boardElement.querySelector(
    `[data-row="${position.row}"][data-column="${position.column}"]`,
  );
  if (!cell) return;
  cell.classList.remove("wobble");
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

function countRemainingItems() {
  return boardState.flat().filter((symbol) => ITEMS[symbol]).length;
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

  document.querySelectorAll(".move-button.hinted").forEach((button) => {
    button.classList.remove("hinted");
  });
  boardElement.querySelectorAll(".cell.hinted").forEach((cell) => {
    cell.classList.remove("hinted");
  });

  if (!hint) {
    gameMessageElement.textContent = "No prize is close enough. Start again when you like.";
    playTone(230, 0.12, "sine", 0.03);
    return;
  }

  document.querySelector(`.move-button[data-direction="${hint.first}"]`).classList.add("hinted");
  const cell = boardElement.querySelector(
    `[data-row="${hint.target.row}"][data-column="${hint.target.column}"]`,
  );
  if (cell) cell.classList.add("hinted");
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

function finishLevel() {
  const level = LEVELS[currentLevelIndex];
  const previousBest = readBestScores()[currentLevelIndex] ?? 0;
  const isNewBest = score > previousBest;
  const stars = getStars(score, level.goals);

  if (isNewBest) writeBestScore(currentLevelIndex, score);
  if (stars > 0) unlockLevel(currentLevelIndex + 1);

  document.querySelector("#resultTitle").textContent = stars > 0 ? "Great harvest!" : "Good try, Pip!";
  document.querySelector("#resultStars").textContent = stars > 0 ? "⭐".repeat(stars) : "🌱";
  document.querySelector("#resultStars").setAttribute("aria-label", `${stars} stars earned`);
  document.querySelector("#resultScore").textContent = score;
  document.querySelector("#resultBest").textContent = isNewBest ? "A new best score!" : `Best score: ${previousBest}`;

  const nextButton = document.querySelector("#nextButton");
  if (currentLevelIndex === LEVELS.length - 1) {
    nextButton.textContent = "Level 1 →";
  } else {
    nextButton.textContent = "Next level →";
  }

  updateStats();
  renderLevelPicker();
  levelDialogElement.hidden = false;
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
document.querySelector("#nextButton").addEventListener("click", () => {
  const nextIndex = (currentLevelIndex + 1) % LEVELS.length;
  startLevel(nextIndex <= readUnlockedLevel() ? nextIndex : currentLevelIndex);
});

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  saveSoundSetting();
  renderSoundButton();
  if (soundEnabled) playTone(440, 0.09, "sine", 0.03);
});

window.addEventListener("keydown", (event) => {
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

renderSoundButton();
renderLevelPicker();
startLevel(0);
