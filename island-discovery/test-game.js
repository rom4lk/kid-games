const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  MAP_WIDTH,
  MAP_HEIGHT,
  CITY_INDEX,
  RIVER_COLUMN,
  DIFFICULTIES,
  CARDS,
  CARD_ORDER,
  CITY_PLACES,
  TILE_DATA,
  state,
  view,
  positionOf,
  adjacentIndexes,
  isAdjacent,
  centerOf,
  hexAt,
  islandTiles,
  revealRings,
  stepsPerDay,
  cardState,
  firstMissingParent,
  routeTo,
} = require("./game.js");

const CELLS = MAP_WIDTH * MAP_HEIGHT;
const RESOURCES = ["food", "wood", "idea"];

function testHexNeighbours() {
  for (let index = 0; index < CELLS; index += 1) {
    const near = adjacentIndexes(index);
    assert.equal(new Set(near).size, near.length, `hex ${index} lists a neighbour twice`);
    assert.ok(near.length >= 2 && near.length <= 6, `hex ${index} has ${near.length} neighbours`);
    assert.ok(!near.includes(index), `hex ${index} is its own neighbour`);
    near.forEach((neighbour) => {
      assert.ok(neighbour >= 0 && neighbour < CELLS, `hex ${index} reaches off the map`);
      // A step that can be walked one way has to be walkable back.
      assert.ok(isAdjacent(neighbour, index), `hex ${index} and ${neighbour} disagree about being neighbours`);
      const here = positionOf(index);
      const there = positionOf(neighbour);
      assert.ok(Math.abs(here.row - there.row) <= 1, `hex ${index} reaches two rows away`);
    });
  }
}

// The canvas finds the hex under a finger by arithmetic, not by hit boxes, so
// the centre of every hex has to come back as that hex.
function testHexUnderAPoint() {
  view.width = 0;
  view.height = 0;
  view.scale = 1;
  view.camera = { x: 0, y: 0 };

  for (let index = 0; index < CELLS; index += 1) {
    const { x, y } = centerOf(index);
    assert.equal(hexAt(x, y), index, `the point at the centre of hex ${index} finds another hex`);
  }
  assert.equal(hexAt(centerOf(0).x, centerOf(0).y - 1000), null, "a point above the map is no hex");
}

// The bug this guards: walking the rings over `revealed` instead of its own
// visited set stopped the spyglass at the edge of what was already open.
function testRevealRings() {
  const middle = 5 * MAP_WIDTH + 7;
  const one = revealRings(new Set(), middle, 1);
  assert.deepEqual([...one].sort((a, b) => a - b), [middle, ...adjacentIndexes(middle)].sort((a, b) => a - b));

  const two = revealRings(new Set(), middle, 2);
  const expected = new Set([middle]);
  adjacentIndexes(middle).forEach((near) => {
    expected.add(near);
    adjacentIndexes(near).forEach((far) => expected.add(far));
  });
  assert.deepEqual([...two].sort((a, b) => a - b), [...expected].sort((a, b) => a - b));

  // The same two rings, asked for on ground that is already open.
  const explored = revealRings(new Set(), middle, 1);
  const again = revealRings(explored, middle, 2);
  assert.deepEqual([...again].sort((a, b) => a - b), [...expected].sort((a, b) => a - b),
    "the spyglass must open the far ring even where the near one was already known");
}

function testIslandTiles() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const tiles = islandTiles();
    assert.equal(tiles.length, CELLS);
    assert.equal(tiles[CITY_INDEX], "city", "the city stands where the explorer starts");
    tiles.forEach((tile, index) => {
      assert.ok(TILE_DATA[tile], `tile ${index} is the unknown kind "${tile}"`);
      const { column } = positionOf(index);
      if (index === CITY_INDEX) return;
      if (column === RIVER_COLUMN) assert.equal(tile, "water", `the river breaks at ${index}`);
      else assert.notEqual(tile, "water", `open water outside the river at ${index}`);
    });
  }
}

function testCardPath() {
  assert.deepEqual(CITY_PLACES, CARD_ORDER.filter((id) => CARDS[id].place));

  CARD_ORDER.forEach((id) => {
    const card = CARDS[id];
    assert.ok(typeof card.icon === "string" && card.icon !== "", `${id} needs a picture`);
    card.parents.forEach((parent) => {
      assert.ok(CARDS[parent], `${id} points back at the unknown card ${parent}`);
      // Columns are drawn left to right, so a card never waits for one beside
      // or behind it and the path can have no cycle.
      assert.ok(CARDS[parent].column < card.column, `${id} waits for ${parent}, which is not earlier`);
    });
    const costs = Object.entries(card.cost);
    assert.ok(costs.length > 0, `${id} has to cost something`);
    costs.forEach(([resource, amount]) => {
      assert.ok(RESOURCES.includes(resource), `${id} costs the unknown resource ${resource}`);
      assert.ok(Number.isInteger(amount) && amount > 0, `${id} has a strange price for ${resource}`);
    });
  });

  // The festival is the goal: it waits for every friendly place and for nothing
  // that cannot be reached.
  assert.ok(CARDS.festival.place === undefined || CARDS.festival.place === false);
  CITY_PLACES.filter((id) => id !== "festival").forEach((id) => {
    assert.ok(CARDS.festival.parents.includes(id), `the festival must wait for ${id}`);
  });
}

function testCardStateAndRoute() {
  state.opened = new Set();
  state.researching = null;
  RESOURCES.forEach((resource) => { state[resource] = 0; });

  assert.equal(cardState("garden"), "free", "a card nobody is saving for is free");
  assert.equal(cardState("festival"), "locked", "the festival waits for the places");

  // A locked card hands the goal to the first card on the road that can be
  // chosen right now.
  const next = firstMissingParent("festival");
  assert.ok(CARDS[next], "a locked card must name a card to open first");
  assert.ok(CARDS[next].parents.every((parent) => state.opened.has(parent)),
    "the named card must be openable at once");

  const links = routeTo("festival");
  assert.ok(links.length > 0, "a locked card lights the road to it");
  links.forEach((link) => {
    const [parent, child] = link.split("-");
    assert.ok(CARDS[parent] && CARDS[child], `the lit road holds the odd link "${link}"`);
    assert.ok(!state.opened.has(parent), "an open card needs no lit road");
  });

  state.wood = CARDS.garden.cost.wood;
  assert.equal(cardState("garden"), "ready", "a card that is paid for is ready");
  state.opened = new Set(["garden"]);
  assert.equal(cardState("garden"), "open");
  // With the garden open the library is no longer waiting for anything, only
  // for the gifts it costs.
  assert.equal(cardState("library"), "free");
  RESOURCES.forEach((resource) => { state[resource] = CARDS.library.cost[resource] ?? 0; });
  assert.equal(cardState("library"), "ready");
}

function testDifficultyAndBoots() {
  Object.entries(DIFFICULTIES).forEach(([name, rule]) => {
    assert.ok(Number.isInteger(rule.energy) && rule.energy > 0, `${name} must allow a step`);
    assert.ok(rule.dailyFood > 0 && rule.dailyWood > 0, `${name} must feed the day`);
  });

  state.opened = new Set();
  state.difficulty = "normal";
  const plain = stepsPerDay();
  state.opened = new Set(["boots"]);
  assert.equal(stepsPerDay(), plain + 1, "boots are one more step a day");
}

function testTranslations() {
  const translations = JSON.parse(fs.readFileSync(path.join(__dirname, "translations.json"), "utf8"));
  const english = new Set(translations.pairs.map(([source]) => source));
  const markup = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

  // The game reads its text out of hidden nodes on the page, so every card and
  // every kind of place needs one to read.
  CARD_ORDER.forEach((id) => {
    ["card-name", "card-effect"].forEach((prefix) => {
      assert.ok(markup.includes(`id="${prefix}-${id}"`), `index.html has no ${prefix} for ${id}`);
    });
  });
  Object.keys(TILE_DATA).forEach((tile) => {
    assert.ok(markup.includes(`id="tile-${tile}"`), `index.html has no name for the ${tile} tile`);
  });
  assert.ok(english.size > 0, "translations.json must hold the Russian side");
}

testHexNeighbours();
testHexUnderAPoint();
testRevealRings();
testIslandTiles();
testCardPath();
testCardStateAndRoute();
testDifficultyAndBoots();
testTranslations();
console.log(`Island of Discovery: ${CARD_ORDER.length} discoveries and all map checks passed.`);
