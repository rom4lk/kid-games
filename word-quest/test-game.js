const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  LEVELS,
  SPELL_MODE,
  CHAPTERS_PER_LEVEL,
  WORDS_PER_CHAPTER,
  chapterProgressValue,
  changingPositions,
  fillTemplate,
  findNextUnsolved,
  hasSyllableSplit,
  packPath,
  shuffle,
  solvedPrefixLength,
} = require("./game.js");

const CONTENT = path.join(__dirname, "content");
const readPack = (file) => JSON.parse(fs.readFileSync(path.join(CONTENT, file), "utf8"));

// A word of one syllable is written the same way split and whole, so the parts
// hint has nothing to show and must not be offered at all.
function testSyllableSplit() {
  assert.equal(hasSyllableSplit({ word: "КОТ", syllables: "КОТ" }), false);
  assert.equal(hasSyllableSplit({ word: "МАШИНА", syllables: "МА-ШИ-НА" }), true);
  assert.equal(hasSyllableSplit({ word: "CAT" }), false, "a task with no parts offers no hint");
}

function testChangingPositions() {
  assert.deepEqual([...changingPositions(["CAT", "COT", "CUT"])], [1]);
  assert.deepEqual([...changingPositions(["CAT", "CAT", "CAT"])], []);
  assert.deepEqual([...changingPositions(["BAT", "BAG", "BAD"])], [2]);
}

function testTemplates() {
  assert.equal(fillTemplate("Word {current} of {total}", { current: 3, total: 10 }), "Word 3 of 10");
  assert.equal(fillTemplate("{a} and {a}", { a: "x" }), "x and x", "a name may be used twice");
  assert.equal(fillTemplate("plain", {}), "plain");
}

// Progress is the run of solved words from the start, so setting a word aside
// never moves the bar past it.
function testSolvedPrefix() {
  assert.equal(solvedPrefixLength(new Set()), 0);
  assert.equal(solvedPrefixLength(new Set([0, 1, 2])), 3);
  assert.equal(solvedPrefixLength(new Set([0, 2, 3])), 1, "a skipped word stops the run");
}

function testSkipOrder() {
  const solved = new Set([0, 1]);
  assert.equal(findNextUnsolved(1, 5, solved), 2);
  // The search wraps round to the words that were set aside earlier.
  assert.equal(findNextUnsolved(4, 5, new Set([0, 1, 3, 4])), 2);
  // The last unsolved word has nothing to skip to, and never lands on itself.
  assert.equal(findNextUnsolved(2, 5, new Set([0, 1, 3, 4])), -1);
  assert.equal(findNextUnsolved(0, 1, new Set()), -1);
}

function testStoredProgressIsClamped() {
  assert.equal(chapterProgressValue(undefined), 0);
  assert.equal(chapterProgressValue("broken"), 0);
  assert.equal(chapterProgressValue(-4), 0);
  assert.equal(chapterProgressValue(7), 7);
  assert.equal(chapterProgressValue(WORDS_PER_CHAPTER + 5), WORDS_PER_CHAPTER);
}

function testShuffleKeepsEveryChoice() {
  const source = ["a", "b", "c", "d", "e"];
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const mixed = shuffle([...source]);
    assert.deepEqual([...mixed].sort(), [...source].sort(), "a shuffle must lose nothing");
  }
}

function testPackPaths() {
  Object.entries(LEVELS).forEach(([language, letters]) => {
    letters.forEach((count) => {
      const file = packPath(language, count);
      assert.ok(fs.existsSync(path.join(CONTENT, path.basename(file))), `${file} is missing`);
      const pack = readPack(path.basename(file));
      assert.equal(pack.language, language);
      assert.equal(pack.letters, count);
      assert.equal(pack.chapters.length, CHAPTERS_PER_LEVEL);
      pack.chapters.forEach((chapter, index) => {
        assert.equal(chapter.tasks.length, WORDS_PER_CHAPTER, `chapter ${index + 1} of ${file}`);
      });
    });
  });

  const spell = readPack(path.basename(packPath(SPELL_MODE.language, SPELL_MODE.key)));
  assert.equal(spell.mode, "spell");
  assert.equal(spell.chapters.length, SPELL_MODE.chapters);
}

// The mode stands on one changing letter, and the game highlights it with the
// same function the content is checked with here.
function testSpellChoicesDifferInOneLetter() {
  const spell = readPack(path.basename(packPath(SPELL_MODE.language, SPELL_MODE.key)));
  spell.chapters.forEach((chapter, chapterIndex) => {
    chapter.tasks.forEach((task, taskIndex) => {
      const where = `spell chapter ${chapterIndex + 1}, task ${taskIndex + 1}`;
      assert.equal(changingPositions(task.choices).size, 1, `${where} must change one letter`);
      assert.ok(task.choices.includes(task.word), `${where} must offer its own word`);
      assert.equal(hasSyllableSplit(task), false, `${where} has no syllable hint of its own`);
    });
  });
}

testSyllableSplit();
testChangingPositions();
testTemplates();
testSolvedPrefix();
testSkipOrder();
testStoredProgressIsClamped();
testShuffleKeepsEveryChoice();
testPackPaths();
testSpellChoicesDifferInOneLetter();
console.log("Living Words: reading rules and word packs passed.");
