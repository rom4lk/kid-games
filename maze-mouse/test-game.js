const assert = require("node:assert/strict");
const {
  LEVELS,
  DIRECTION_ORDER,
  SCORES,
  SYMBOL_CELLS,
  CAUGHT_TIME,
  parseMaze,
  cellAt,
  isOpen,
  neighbor,
  tileOf,
  isCentered,
  createGame,
  steer,
  setPaused,
  setCatsEnabled,
  update,
} = require("./game.js");

const FRAME = 1 / 60;

function key({ col, row }) {
  return `${col},${row}`;
}

// Every cell reachable from `start` for the given walker.
function reachable(maze, start, walker) {
  const seen = new Set([key(start)]);
  const queue = [start];
  for (let head = 0; head < queue.length; head += 1) {
    const { col, row } = queue[head];
    DIRECTION_ORDER.forEach((direction) => {
      const next = neighbor(maze, col, row, direction);
      if (!isOpen(maze, next.col, next.row, walker) || seen.has(key(next))) return;
      seen.add(key(next));
      queue.push(next);
    });
  }
  return seen;
}

function testMazes() {
  LEVELS.forEach((level, levelIndex) => {
    const where = `Maze ${levelIndex + 1} "${level.name}"`;
    const width = level.map[0].length;
    level.map.forEach((line, row) => {
      assert.equal(line.length, width, `${where}: row ${row} has the wrong length`);
      [...line].forEach((symbol) => {
        assert.ok(symbol in SYMBOL_CELLS, `${where}: unknown symbol "${symbol}"`);
      });
    });
    const text = level.map.join("");
    assert.equal(text.split("M").length - 1, 1, `${where} needs one mouse hole`);
    assert.equal(text.split("-").length - 1, 1, `${where} needs one house door`);

    const maze = parseMaze(level.map);
    assert.ok(maze.catStarts.length >= level.cats, `${where} has room for too few cats`);
    assert.equal(cellAt(maze, maze.exit.col, maze.exit.row), "path", `${where}: the door must open onto a path`);
    assert.equal(cellAt(maze, maze.home.col, maze.home.row), "house", `${where}: the door must lead into the house`);

    // The top and bottom rows are solid; a side opening has a twin on the other
    // side, so a tunnel never leads into a wall.
    [0, maze.rows - 1].forEach((row) => {
      for (let col = 0; col < maze.cols; col += 1) {
        assert.equal(cellAt(maze, col, row), "wall", `${where}: row ${row} must be a wall`);
      }
    });
    for (let row = 0; row < maze.rows; row += 1) {
      const left = cellAt(maze, 0, row) === "wall";
      const right = cellAt(maze, maze.cols - 1, row) === "wall";
      assert.equal(left, right, `${where}: row ${row} has a tunnel with one end`);
    }

    // The mouse can reach every open cell, so every crumb can be eaten.
    const mouseCells = reachable(maze, maze.mouseStart, "roam");
    for (let row = 0; row < maze.rows; row += 1) {
      for (let col = 0; col < maze.cols; col += 1) {
        if (cellAt(maze, col, row) !== "path") continue;
        assert.ok(mouseCells.has(key({ col, row })), `${where}: path ${col},${row} is cut off`);
      }
    }
    assert.ok(!maze.food.has(maze.mouseStart.row * maze.cols + maze.mouseStart.col),
      `${where}: the mouse hole must be empty`);

    // Every cat start reaches the exit, and every path cell reaches the house.
    maze.catStarts.forEach((start) => {
      assert.ok(Number.isFinite(maze.toExit[start.row * maze.cols + start.col]),
        `${where}: a cat at ${key(start)} cannot leave`);
    });
    mouseCells.forEach((cell) => {
      const [col, row] = cell.split(",").map(Number);
      assert.ok(Number.isFinite(maze.toHome[row * maze.cols + col]), `${where}: ${cell} has no way home`);
    });
  });

  // One more cat in every maze.
  LEVELS.forEach((level, index) => {
    if (index > 0) assert.ok(level.cats > LEVELS[index - 1].cats, "each maze adds a cat");
  });
}

// Steers toward the nearest food along the paths: what a careful child would do.
function nearestFoodDirection(game) {
  const { maze } = game;
  const start = tileOf(maze, game.mouse);
  const first = new Map([[key(start), null]]);
  const queue = [start];
  for (let head = 0; head < queue.length; head += 1) {
    const cell = queue[head];
    if (game.food.has(cell.row * maze.cols + cell.col) && head > 0) return first.get(key(cell));
    for (const direction of DIRECTION_ORDER) {
      const next = neighbor(maze, cell.col, cell.row, direction);
      if (!isOpen(maze, next.col, next.row, "roam") || first.has(key(next))) continue;
      first.set(key(next), first.get(key(cell)) ?? direction);
      queue.push(next);
    }
  }
  return null;
}

function play(game, seconds, onFrame) {
  for (let time = 0; time < seconds && game.state !== "won"; time += FRAME) {
    onFrame?.(game);
    update(game, FRAME);
  }
}

function testCalmModeClearsEveryMaze() {
  LEVELS.forEach((level, index) => {
    const game = createGame(index, { catsEnabled: false });
    const total = game.foodTotal;
    let crumbs = 0;
    game.maze.food.forEach((kind) => { if (kind === "crumb") crumbs += 1; });
    play(game, 400, () => {
      if (isCentered(game.mouse)) {
        const direction = nearestFoodDirection(game);
        if (direction) steer(game, direction);
      }
    });
    assert.equal(game.state, "won", `${level.name}: the calm mode must be finishable`);
    assert.equal(game.food.size, 0);
    assert.equal(game.score, crumbs * SCORES.crumb + (total - crumbs) * SCORES.cheese);
  });
}

function testActorsStayOnTheirCells() {
  LEVELS.forEach((level, index) => {
    const game = createGame(index, { seed: 7 + index });
    const random = (() => { let s = 99 + index; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    const everLeft = new Set();
    play(game, 120, () => {
      if (game.state === "ready") steer(game, "left");
      if (isCentered(game.mouse) && random() < 0.3) steer(game, DIRECTION_ORDER[Math.floor(random() * 4)]);
      const mouseTile = tileOf(game.maze, game.mouse);
      assert.equal(cellAt(game.maze, mouseTile.col, mouseTile.row), "path", `${level.name}: mouse left the paths`);
      game.cats.forEach((cat) => {
        const tile = tileOf(game.maze, cat);
        const walker = cat.state === "roam" ? "roam" : "home";
        assert.ok(isOpen(game.maze, tile.col, tile.row, walker),
          `${level.name}: a ${cat.state} cat stands in ${cellAt(game.maze, tile.col, tile.row)}`);
        if (cat.state === "roam") everLeft.add(cat.index);
      });
    });
    assert.equal(everLeft.size, level.cats, `${level.name}: every cat must leave the house`);
  });
}

function roamingCatAt(game, x, y, dir = null) {
  const cat = game.cats[0];
  Object.assign(cat, { x, y, dir, state: "roam", sleepy: false });
  return cat;
}

function testCaughtKeepsTheCheese() {
  const game = createGame(0);
  const { mouseStart } = game.maze;
  steer(game, "left");
  play(game, 1);
  const foodLeft = game.food.size;
  const score = game.score;
  assert.ok(foodLeft < game.foodTotal, "the mouse ate something on its way");

  roamingCatAt(game, game.mouse.x, game.mouse.y);
  update(game, FRAME);
  assert.equal(game.state, "caught");
  assert.ok(game.events.includes("caught"));
  assert.equal(game.food.size, foodLeft, "a catch must not give the cheese back");
  assert.equal(game.score, score, "a catch must not cost points");

  steer(game, "right");
  assert.equal(game.state, "caught", "the short pause cannot be skipped by mistake");
  update(game, CAUGHT_TIME + 0.1);
  assert.equal(game.state, "ready", "the mouse waits for the next arrow");
  assert.deepEqual({ x: game.mouse.x, y: game.mouse.y }, { x: mouseStart.col, y: mouseStart.row });
  assert.equal(game.food.size, foodLeft);
  steer(game, "right");
  assert.equal(game.state, "playing");
}

function testBigCheeseMakesCatsSleepy() {
  const game = createGame(0);
  const cheese = [...game.food].find(([, kind]) => kind === "cheese")[0];
  const col = cheese % game.maze.cols;
  const row = Math.floor(cheese / game.maze.cols);
  Object.assign(game.mouse, { x: col, y: row, dir: null });
  // Row 3 of the kitchen is one long corridor; the cat is between two cells.
  const cat = roamingCatAt(game, 5.5, 3, "right");
  game.cats[1].state = "home";
  game.cats[1].wait = 100;
  steer(game, "right");
  update(game, FRAME);
  assert.ok(cat.sleepy, "big cheese makes roaming cats sleepy");
  assert.equal(cat.dir, "left", "a sleepy cat turns around");

  const score = game.score;
  Object.assign(cat, { x: game.mouse.x, y: game.mouse.y });
  update(game, FRAME);
  assert.equal(game.state, "playing", "a sleepy cat never catches the mouse");
  assert.equal(cat.state, "returning");
  assert.equal(game.score, score + SCORES.cat);

  // The cat walks home on its own and comes out again later.
  Object.assign(game.mouse, { x: 1, y: 1, dir: null });
  game.desired = null;
  const seen = new Set();
  for (let time = 0; time < 20 && game.state === "playing"; time += FRAME) {
    update(game, FRAME);
    seen.add(cat.state);
  }
  assert.ok(seen.has("home") && seen.has("leaving"), `the cat went ${[...seen].join(", ")}`);
}

function testCatsCanBeSwitchedOff() {
  const game = createGame(2);
  steer(game, "left");
  setCatsEnabled(game, false);
  roamingCatAt(game, game.mouse.x, game.mouse.y);
  update(game, FRAME);
  assert.equal(game.state, "playing", "no cats, no catching");

  setCatsEnabled(game, true);
  assert.equal(game.cats.length, LEVELS[2].cats, "switched back on, the cats start over");
  roamingCatAt(game, game.mouse.x, game.mouse.y);
  update(game, FRAME);
  assert.equal(game.state, "caught");
  setCatsEnabled(game, false);
  assert.equal(game.state, "ready", "switching the cats off ends a catch at once");
}

function testStartNeedsAnOpenWay() {
  LEVELS.forEach((level, index) => {
    const game = createGame(index);
    const { col, row } = game.maze.mouseStart;
    const openWays = DIRECTION_ORDER.filter((direction) => {
      const next = neighbor(game.maze, col, row, direction);
      return isOpen(game.maze, next.col, next.row, "roam");
    });
    assert.ok(openWays.includes("left") && openWays.includes("right"),
      `${level.name}: the mouse hole opens to both sides`);
    const blocked = DIRECTION_ORDER.find((direction) => !openWays.includes(direction));
    if (blocked) {
      steer(game, blocked);
      assert.equal(game.state, "ready", `${level.name}: an arrow into a wall does not start the cats`);
    }
    steer(game, "left");
    assert.equal(game.state, "playing");
  });
}

function testPause() {
  const game = createGame(0);
  steer(game, "left");
  play(game, 0.5);
  setPaused(game, true);
  const before = { ...game.mouse };
  update(game, 1);
  assert.equal(game.mouse.x, before.x, "nothing moves while paused");
  steer(game, "left");
  assert.equal(game.state, "playing", "an arrow continues the game");
}

testMazes();
testCalmModeClearsEveryMaze();
testActorsStayOnTheirCells();
testCaughtKeepsTheCheese();
testBigCheeseMakesCatsSleepy();
testCatsCanBeSwitchedOff();
testStartNeedsAnOpenWay();
testPause();
console.log("maze-mouse: all checks passed");
