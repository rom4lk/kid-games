const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  BOARD_SIZE,
  ITEMS,
  LEVELS,
  DIRECTIONS,
  createBoardState,
  pointsLabel,
  isInsideBoard,
  getStars,
} = require("./game.js");

const SYMBOLS = new Set([".", "#", "p", ...Object.keys(ITEMS)]);

function testBoards() {
  LEVELS.forEach((level, index) => {
    const where = `Level ${index + 1} "${level.name}"`;
    assert.equal(level.map.length, BOARD_SIZE, `${where} needs ${BOARD_SIZE} rows`);
    level.map.forEach((row) => {
      assert.equal(row.length, BOARD_SIZE, `${where} has a row of the wrong length`);
      [...row].forEach((symbol) => {
        assert.ok(SYMBOLS.has(symbol), `${where} uses the unknown symbol "${symbol}"`);
      });
    });

    const starts = level.map.join("").split("").filter((symbol) => symbol === "p");
    assert.equal(starts.length, 1, `${where} must place Pip exactly once`);

    const { board, start } = createBoardState(level);
    assert.ok(isInsideBoard(start), `${where} starts Pip outside the board`);
    assert.equal(board[start.row][start.column], ".", `${where} must clear the square Pip stands on`);
  });
}

function testGoals() {
  LEVELS.forEach((level, index) => {
    const where = `Level ${index + 1} "${level.name}"`;
    assert.equal(level.goals.length, 3, `${where} needs three goals`);
    // One star is the same everywhere: it is the bar that opens the next garden.
    assert.equal(level.goals[0], 10, `${where} must keep the shared one-star bar`);
    assert.ok(level.goals[0] < level.goals[1], `${where} goals must rise`);
    assert.ok(level.goals[1] < level.goals[2], `${where} goals must rise`);
    assert.ok(level.goals[2] < level.maxScore, `${where} must leave room above three stars`);
    assert.ok(level.moves > 0, `${where} needs steps`);
  });

  assert.equal(getStars(0, [10, 20, 30]), 0);
  assert.equal(getStars(10, [10, 20, 30]), 1);
  assert.equal(getStars(20, [10, 20, 30]), 2);
  assert.equal(getStars(31, [10, 20, 30]), 3);
  assert.equal(pointsLabel(1), "1 point");
  assert.equal(pointsLabel(2), "2 points");
}

// Every harvest a route of `moves` steps can bring home. Walking onto a square
// takes what lies there, so a route is worth the set of squares it visited and
// the search only has to remember that set.
function reachableScores(level) {
  const { board, start } = createBoardState(level);
  const items = [];
  board.forEach((row, rowIndex) => row.forEach((symbol, columnIndex) => {
    if (ITEMS[symbol]) items.push({ row: rowIndex, column: columnIndex, value: ITEMS[symbol].value });
  }));
  assert.ok(items.length <= 30, "the search keeps one bit per item");

  const bitOf = new Map(items.map((item, index) => [`${item.row},${item.column}`, index]));
  const scoreOf = (mask) => items.reduce(
    (total, item, index) => total + ((mask >> index) & 1 ? item.value : 0),
    0,
  );

  const key = (position, mask) => (position.row * BOARD_SIZE + position.column) * 2 ** items.length + mask;
  let states = new Map([[key(start, 0), { position: start, mask: 0 }]]);
  const scores = new Set([0]);

  for (let step = 0; step < level.moves; step += 1) {
    const next = new Map();
    states.forEach(({ position, mask }) => {
      Object.values(DIRECTIONS).forEach((direction) => {
        const moved = { row: position.row + direction.row, column: position.column + direction.column };
        if (!isInsideBoard(moved)) return;
        if (board[moved.row][moved.column] === "#") return;
        const bit = bitOf.get(`${moved.row},${moved.column}`);
        const movedMask = bit === undefined ? mask : mask | (1 << bit);
        const movedKey = key(moved, movedMask);
        if (!next.has(movedKey)) next.set(movedKey, { position: moved, mask: movedMask });
      });
    });
    states = next;
    states.forEach(({ mask }) => scores.add(scoreOf(mask)));
  }

  return scores;
}

// The three stars and the plus have to be reachable, and `maxScore` has to be
// the real ceiling: a promise of a perfect route no route can reach would keep
// the plus off the screen for good.
function testEveryGoalIsReachable() {
  const bests = LEVELS.map((level, index) => {
    const scores = reachableScores(level);
    const best = Math.max(...scores);
    const where = `Level ${index + 1} "${level.name}"`;
    assert.equal(best, level.maxScore, `${where} declares a perfect score of ${level.maxScore}, but ${best} is the most a route can bring home`);
    level.goals.forEach((goal, star) => {
      assert.ok([...scores].some((score) => score >= goal), `${where} cannot reach ${star + 1} stars`);
    });
    return best;
  });

  // The last garden is the hardest one: it must not offer a lower ceiling than
  // the garden before it while handing out one more step.
  const last = LEVELS.length - 1;
  assert.ok(
    bests[last] > bests[last - 1],
    `the last garden tops out at ${bests[last]}, no higher than the ${bests[last - 1]} of the one before it`,
  );
  assert.ok(
    LEVELS[last].goals[2] > LEVELS[last - 1].goals[2],
    "the last garden must ask more for three stars than the one before it",
  );
}

function testTranslations() {
  const file = path.join(__dirname, "translations.json");
  const translations = JSON.parse(fs.readFileSync(file, "utf8"));
  const english = new Set(translations.pairs.map(([source]) => source));

  LEVELS.forEach((level, index) => {
    assert.ok(english.has(level.name), `translations.json has no name for level ${index + 1}`);
    assert.ok(english.has(level.tip), `translations.json has no tip for level ${index + 1}`);
  });
  Object.values(ITEMS).forEach((item) => {
    assert.ok(english.has(item.name), `translations.json has no name for "${item.name}"`);
  });
}

testBoards();
testGoals();
testEveryGoalIsReachable();
testTranslations();
console.log(`Garden Quest: ${LEVELS.length} gardens and all reachability checks passed.`);
