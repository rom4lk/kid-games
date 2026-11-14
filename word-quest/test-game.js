const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  LEVELS,
  PHRASE_LEVELS,
  STORY_LEVELS,
  SPELL_PACKS,
  CHAPTERS_PER_LEVEL,
  WORDS_PER_CHAPTER,
  chapterProgressValue,
  changingPositions,
  fillTemplate,
  findNextUnsolved,
  hasSyllableSplit,
  longestPart,
  modeStrings,
  packPath,
  pictureLayout,
  sceneLayout,
  sentencesOf,
  shuffle,
  spellPack,
  solvedPrefixLength,
  splitsAtOnce,
  storyLines,
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

// A Russian word of several syllables is shown split from the start; a word
// of one syllable and an English word are not.
function testSplitsAtOnce() {
  assert.equal(splitsAtOnce({ word: "МАШИНА", syllables: "МА-ШИ-НА" }, "ru"), true);
  assert.equal(splitsAtOnce({ word: "КОТ", syllables: "КОТ" }, "ru"), false);
  assert.equal(splitsAtOnce({ word: "BANANA", syllables: "BA-NA-NA" }, "en"), false);
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
      if (PHRASE_LEVELS[count]) {
        assert.equal(pack.mode, "phrase");
        assert.equal(pack.level, PHRASE_LEVELS[count].file);
      } else if (STORY_LEVELS[count]) {
        assert.equal(pack.mode, "story");
        assert.equal(pack.level, STORY_LEVELS[count].file);
      } else {
        assert.equal(pack.letters, count);
      }
      assert.equal(pack.chapters.length, CHAPTERS_PER_LEVEL);
      pack.chapters.forEach((chapter, index) => {
        assert.equal(chapter.tasks.length, WORDS_PER_CHAPTER, `chapter ${index + 1} of ${file}`);
      });
    });
  });

  Object.entries(SPELL_PACKS).forEach(([language, spells]) => {
    spells.forEach((spell) => {
      const file = packPath(language, spell.key);
      assert.ok(fs.existsSync(path.join(CONTENT, path.basename(file))), `${file} is missing`);
      const pack = readPack(path.basename(file));
      assert.equal(pack.language, language);
      assert.equal(pack.letters, spell.letters);
      assert.equal(pack.mode, "spell");
      assert.equal(pack.chapters.length, spell.chapters);
      pack.chapters.forEach((chapter, index) => {
        assert.equal(chapter.tasks.length, WORDS_PER_CHAPTER, `chapter ${index + 1} of ${file}`);
      });
    });
  });

  assert.equal(packPath("en", "spell3"), "content/spell.en.3.json");
  assert.equal(packPath("ru", "spell4"), "content/spell.ru.4.json");
  assert.equal(packPath("ru", 4), "content/words.ru.4.json");
}

// Saved progress is stored under the pack key, so the English key must stay
// "spell3", and a level number must never be taken for a spell pack.
function testSpellPackKeys() {
  assert.deepEqual(SPELL_PACKS.en.map((pack) => pack.key), ["spell3"]);
  assert.deepEqual(SPELL_PACKS.ru.map((pack) => pack.key), ["spell3", "spell4"]);
  SPELL_PACKS.ru.forEach((pack) => assert.equal(pack.chapters, 10, `ru ${pack.key}`));
  Object.entries(SPELL_PACKS).forEach(([language, spells]) => {
    const keys = spells.map((pack) => pack.key);
    assert.equal(new Set(keys).size, keys.length, `${language} spell keys must be unique`);
    // The card shows the rule it advertises: words of the pack's length that
    // differ in exactly one letter.
    spells.forEach((pack) => {
      const where = `${language} ${pack.key} card sample`;
      pack.sample.forEach((word) => assert.equal([...word].length, pack.letters, where));
      assert.equal(new Set(pack.sample).size, pack.sample.length, `${where} repeats a word`);
      assert.equal(changingPositions(pack.sample).size, 1, `${where} must change one letter`);
    });
  });
  assert.equal(spellPack("ru", 3), undefined);
}

// The mode stands on one changing letter, and the game highlights it with the
// same function the content is checked with here.
function testSpellChoicesDifferInOneLetter() {
  Object.entries(SPELL_PACKS).forEach(([language, spells]) => {
    spells.forEach((spellMode) => {
      const spell = readPack(path.basename(packPath(language, spellMode.key)));
      spell.chapters.forEach((chapter, chapterIndex) => {
        chapter.tasks.forEach((task, taskIndex) => {
          const where = `${language} ${spellMode.key} chapter ${chapterIndex + 1}, task ${taskIndex + 1}`;
          assert.equal(changingPositions(task.choices).size, 1, `${where} must change one letter`);
          assert.ok(task.choices.includes(task.word), `${where} must offer its own word`);
          assert.equal(hasSyllableSplit(task), false, `${where} has no syllable hint of its own`);
        });
      });
    });
  });
}

// The phrase levels follow the letter levels in their fixed order, and the story
// levels follow them; both languages list all of them.
function testLevelOrder() {
  const full = [3, 4, 5, 6, 7, "phraseA", "phraseB", "phraseC", "storyA", "storyB", "storyC"];
  assert.deepEqual(Object.keys(LEVELS).sort(), ["en", "ru"]);
  Object.entries(LEVELS).forEach(([language, levels]) => {
    assert.deepEqual(levels, full, `${language} levels`);
  });
  assert.equal(packPath("ru", "phraseA"), "content/phrases.ru.a.json");
  assert.equal(packPath("en", "phraseC"), "content/phrases.en.c.json");
  assert.equal(packPath("ru", "storyA"), "content/stories.ru.a.json");
  assert.deepEqual(Object.values(PHRASE_LEVELS).map((level) => level.file), ["a", "b", "c"]);
  assert.deepEqual(Object.values(STORY_LEVELS).map((level) => level.file), ["a", "b", "c"]);
}

// A story card puts each sentence on a line, and the story so far is read back
// the way the card showed it: Russian split, English whole.
function testSentences() {
  assert.deepEqual(sentencesOf("КОТ СПИТ. ПЁС ПОЁТ."), ["КОТ СПИТ.", "ПЁС ПОЁТ."]);
  assert.deepEqual(sentencesOf("КОТ ПЬЁТ МОЛОКО."), ["КОТ ПЬЁТ МОЛОКО."]);
  assert.deepEqual(sentencesOf("THE CAT RUNS! THE DOG SINGS."), ["THE CAT RUNS!", "THE DOG SINGS."]);
  const chapter = {
    tasks: [
      { word: "КОТ ПЬЁТ МОЛОКО.", syllables: "КОТ ПЬЁТ МО-ЛО-КО." },
      { word: "ПЁС СПИТ. КОТ ПОЁТ.", syllables: "ПЁС СПИТ. КОТ ПОЁТ." },
      { word: "МАМА ВАРИТ СУП.", syllables: "МА-МА ВА-РИТ СУП." },
    ],
  };
  assert.deepEqual(storyLines(chapter, 2, "ru"), ["КОТ ПЬЁТ МО-ЛО-КО.", "ПЁС СПИТ.", "КОТ ПОЁТ."]);
  assert.deepEqual(storyLines(chapter, 0, "ru"), []);
  const english = { tasks: [{ word: "THE CAT DRINKS MILK.", syllables: "THE C-A-T DRINKS M-I-L-K." }] };
  assert.deepEqual(storyLines(english, 1, "en"), ["THE CAT DRINKS MILK."]);
}

// The widest panel of the three answers sets the item size: an item counts 1,
// a big item 1.25 and a gap between groups 0.5.
function testSceneLayout() {
  const scene = (...panels) => ({ scene: panels });
  assert.equal(sceneLayout([scene([{ emoji: "🐱" }, { emoji: "🥛" }])]).columns, 2.5);
  assert.equal(sceneLayout([scene([{ emoji: "👴" }, { emoji: "🍎", count: 2 }])]).columns, 3.5);
  assert.equal(sceneLayout([scene([{ emoji: "🐱" }, { emoji: "🐶" }, { emoji: "🥛" }])]).columns, 4);
  assert.equal(sceneLayout([scene([{ emoji: "🐱", size: "big" }, { emoji: "🥛" }])]).columns, 2.75);
  assert.equal(sceneLayout([scene([{ emoji: "🐱", count: 3, badge: "💤" }])]).columns, 3);
  assert.equal(sceneLayout([
    scene([{ emoji: "🐱" }, { emoji: "🥛" }]),
    scene([{ emoji: "🐱" }, { emoji: "🥛" }], [{ emoji: "👴" }, { emoji: "🍎", count: 2 }]),
    scene([{ emoji: "🐶" }, { emoji: "🦴" }]),
  ]).columns, 3.5, "the widest panel of any answer wins");
}

// A mode only renames what it has to: a key it lacks falls back to the levels,
// and every key of its own still wins.
function testModeStrings() {
  const texts = {
    play: { mission: "Word", listen: "Hear the word", next: "Next word", readInstruction: "Read the word", wrongFirst: "Look" },
    spell: { readInstruction: "What is it?", hint: "Compare", wrongFirst: "Letters" },
    phrase: { readInstruction: "Read the words", listen: "Hear the words", wrongFirst: "Every word" },
    story: { readInstruction: "Read it", mission: "Step", listen: "Hear it", next: "Next" },
  };
  const spell = modeStrings(texts, "spell");
  assert.equal(spell.mission, "Word");
  assert.equal(spell.listen, "Hear the word");
  assert.equal(spell.next, "Next word");
  Object.entries(texts.spell).forEach(([key, value]) => assert.equal(spell[key], value, `spell ${key}`));
  assert.equal(modeStrings(texts, "phrase").listen, "Hear the words");
  assert.equal(modeStrings(texts, "phrase").mission, "Word");
  const story = modeStrings(texts, "story");
  assert.equal(story.mission, "Step");
  assert.equal(story.wrongFirst, "Every word", "a story takes the first mistake line from the phrases");
  assert.equal(story.readInstruction, "Read it");
  assert.equal(modeStrings(texts, undefined), texts.play, "a word pack has no mode");
}

// Counts stand in rows of five, and a phone stacks the answers whenever three
// side by side would make the items too small to count or compare.
function testPictureLayout() {
  const counts = (...values) => values.map((count) => (count === undefined ? {} : { count }));
  assert.deepEqual(pictureLayout(counts(2, 3, undefined)), { perRow: 3, rows: 1, stacked: false });
  assert.deepEqual(pictureLayout(counts(4, 5, 3)), { perRow: 5, rows: 1, stacked: true });
  assert.deepEqual(pictureLayout(counts(7, 8, 2)), { perRow: 5, rows: 2, stacked: true });
  assert.deepEqual(pictureLayout(counts(undefined, undefined, undefined)), { perRow: 1, rows: 1, stacked: false });
  assert.equal(pictureLayout([{ size: "big", count: 3 }, { size: "small", count: 3 }, { size: "big", count: 1 }]).stacked, true);
  assert.equal(pictureLayout([{ size: "big" }, { size: "small" }, { size: "big" }]).stacked, false);
  assert.equal(pictureLayout([{ badge: "💤", count: 2 }, { badge: "🎵", count: 2 }, { badge: "💤", count: 1 }]).stacked, true);
  // A caption word too long for a third of a phone stacks the task, whichever answer holds it.
  const labels = (...values) => values.map((label) => ({ label }));
  assert.equal(pictureLayout(labels("большой пёс", "маленький пёс", "большой кот")).stacked, true);
  assert.equal(pictureLayout(labels("мама танцует", "папа танцует", "мама поёт")).stacked, false);
  assert.equal(pictureLayout(labels("цыплёнок поёт", "медведь поёт", "цыплёнок спит")).stacked, true);
}

// A phrase card is sized by its longest word, and the split follows the rules
// of the levels: Russian at once, English on demand.
function testPhraseCardText() {
  assert.equal(longestPart("ДВА КО-ТА"), 5);
  assert.equal(longestPart("R-E-D C-A-T"), 5);
  assert.equal(longestPart("КИТ СПИТ"), 4);
  assert.equal(splitsAtOnce({ word: "ДВА КОТА", syllables: "ДВА КО-ТА" }, "ru"), true);
  assert.equal(splitsAtOnce({ word: "КИТ СПИТ", syllables: "КИТ СПИТ" }, "ru"), false);
  const redCat = { word: "RED CAT", syllables: "R-E-D C-A-T" };
  assert.equal(splitsAtOnce(redCat, "en"), false);
  assert.equal(hasSyllableSplit(redCat), true);
}

function testPhrasePacksShape() {
  Object.entries(LEVELS).forEach(([language, levels]) => {
    levels.filter((key) => PHRASE_LEVELS[key]).forEach((key) => {
      const pack = readPack(path.basename(packPath(language, key)));
      pack.chapters.forEach((chapter, chapterIndex) => {
        chapter.tasks.forEach((task, taskIndex) => {
          const where = `${language} ${key} chapter ${chapterIndex + 1}, task ${taskIndex + 1}`;
          assert.equal(task.word.split(" ").length, PHRASE_LEVELS[key].words, `${where} word count`);
          task.choices.forEach((choice) => {
            assert.ok(
              choice.count === undefined || (Number.isInteger(choice.count) && choice.count >= 1 && choice.count <= 10),
              `${where} count`,
            );
            assert.ok([undefined, "big", "small"].includes(choice.size), `${where} size`);
          });
          const pictures = task.choices.map((choice) => [choice.emoji, choice.count ?? 1, choice.size ?? "", choice.badge ?? ""].join("|"));
          assert.equal(new Set(pictures).size, 3, `${where} pictures must differ`);
          const { perRow } = pictureLayout(task.choices);
          assert.ok(perRow >= 1 && perRow <= 5, `${where} row length`);
          if (language === "en") {
            assert.equal(splitsAtOnce(task, "en"), false, `${where} must not arrive split`);
          }
        });
      });
    });
  });
}

function testStoryPacksShape() {
  Object.entries(LEVELS).forEach(([language, levels]) => {
    levels.filter((key) => STORY_LEVELS[key]).forEach((key) => {
      const pack = readPack(path.basename(packPath(language, key)));
      pack.chapters.forEach((chapter, chapterIndex) => {
        assert.ok(typeof chapter.intro === "string" && chapter.intro.trim(), `${language} ${key} chapter ${chapterIndex + 1} intro`);
        chapter.tasks.forEach((task, taskIndex) => {
          const where = `${language} ${key} chapter ${chapterIndex + 1}, task ${taskIndex + 1}`;
          assert.equal(sentencesOf(task.word).length, STORY_LEVELS[key].sentences, `${where} sentence count`);
          assert.equal(task.prompt, undefined, `${where} has no prompt`);
          assert.equal(task.success, undefined, `${where} has no success line`);
          task.choices.forEach((choice) => {
            assert.equal(choice.scene.length, STORY_LEVELS[key].sentences, `${where} panels`);
            choice.scene.forEach((groups) => {
              const emoji = groups.reduce((sum, group) => sum + (group.count ?? 1), 0);
              assert.ok(emoji >= 2 && emoji <= 3, `${where} a panel draws ${emoji} emoji`);
            });
          });
          assert.ok(sceneLayout(task.choices).columns <= 4.5, `${where} scene width`);
          assert.equal(new Set(task.choices.map((choice) => JSON.stringify(choice.scene))).size, 3, `${where} scenes must differ`);
          if (language === "en") {
            const split = task.syllables.split(" ");
            assert.equal(split.length, task.word.split(" ").length, `${where} split word count`);
            split.forEach((part) => {
              if (["A", "AN", "THE"].includes(part.replace(/-/g, "").replace(/[.!]$/, ""))) {
                assert.ok(!part.includes("-"), `${where} article "${part}" is split`);
              }
            });
          }
        });
      });
    });
  });
}

testSyllableSplit();
testSplitsAtOnce();
testChangingPositions();
testTemplates();
testSolvedPrefix();
testSkipOrder();
testStoredProgressIsClamped();
testShuffleKeepsEveryChoice();
testPackPaths();
testSpellPackKeys();
testSpellChoicesDifferInOneLetter();
testLevelOrder();
testSentences();
testSceneLayout();
testModeStrings();
testPictureLayout();
testPhraseCardText();
testPhrasePacksShape();
testStoryPacksShape();
console.log("Living Words: reading rules and word packs passed.");
