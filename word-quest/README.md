# Living Words

A browser game that turns reading into a way of steering a story. The child reads a word out loud and
then picks the matching picture out of three. A correct answer moves the story forward and opens the
next word.

## What is in the game

- two reading languages, English and Russian, chosen on the start screen and remembered afterwards;
- levels by word length, from 3 to 7 letters, in both languages;
- a second mode, "Find the word": a picture and three written words that differ in one letter, in
  both languages, with one pack per word length;
- 20 chapters in every level, 10 words in every chapter — 200 readings per level, drawn from a
  smaller set of words: there are not 200 short nouns a six-year-old knows and a picture can
  tell apart, so a word comes back several times on purpose;
- every level is open from the menu, while the chapters inside a level unlock one after another;
- a comprehension check through a choice of one picture out of three, with the captions hidden until
  the answer is correct;
- splitting a word into parts through a separate button, a tap on the word card, or automatically
  after a second mistake — a word of one syllable has no parts to show, so the button and the
  card stay quiet there instead of answering with no change;
- a Russian word of several syllables is shown split from the start, so the button and the card
  stay quiet there too: there is nothing left to reveal;
- the option to set a word aside and come back to it later in the same chapter;
- gentle feedback with no penalties and no timer;
- automatic saving of the progress and the statistics;
- a panel for an adult with the progress and the settings;
- adaptation for a computer, a tablet and a phone.

## Running

From the root folder of the project:

```bash
python3 server.py
```

Then open:

```text
http://127.0.0.1:4173/word-quest/
```

A local server is needed because the interface strings and the word packs are loaded through `fetch`,
which does not work over `file://`.

## The game loop

1. The child picks the reading language, then a level by word length, then a chapter.
2. The chapter screen shows the situation and a large word.
3. The child reads the word themselves.
4. If needed, opens the split into parts, or sets the word aside for later.
5. Picks the matching picture; the caption appears only on the correct answer.
6. After a correct answer, sees the result inside the story and moves on.
7. Ten words finish a chapter and unlock the next one; twenty chapters finish the level.

## The "Find the word" mode

The levels ask the child to read a word and pick the picture. This mode turns the task around: the
card shows a picture and the three answers are written words that differ in exactly one letter -
CAT, COT, CUT. Guessing by the first letter stops working, because in most tasks the first letter is
the one that is the same everywhere.

- the mode is a card under the levels on the main menu, one card per pack: English has one pack of
  3-letter words in five stories, Russian has a 3-letter and a 4-letter pack in ten stories each,
  and every pack keeps its own progress;
- every letter sits in a box of the same width, so the three words line up in columns and the letter
  that changes stands in a column of its own;
- the hint highlights that column in all three words instead of splitting a word into parts. It
  shows where to look and never says which word is the right one;
- the same hint opens by itself after a second wrong answer, exactly like the syllables do in the
  levels;
- all fifty words of the English pack are different. The Russian packs repeat answer words on
  purpose, under a floor and a cap, for the same reason the levels do: few short words a child knows
  have two real partners that differ from them in one letter. Every distractor is a real word of its
  language.

## Stored progress

The progress is saved to `localStorage` under the key `livingWordsProgressV2`. It holds:

- the chosen language;
- the number of words solved in each chapter of each language and level;
- the number of words solved in each chapter of each "Find the word" pack, under the keys
  `en-spell3`, `ru-spell3` and `ru-spell4`;
- the number of opened hints and wrong choices;
- the sound setting.

The data can be reset from the panel for an adult, which erases the progress for both languages.

## Structure

```text
word-quest/
├── index.html            # Semantic interface structure
├── styles.css            # Responsive visual design and animation
├── game.js               # Game state, progression, speech, and sound
├── content/
│   ├── ui.en.json        # English interface strings
│   ├── ui.ru.json        # Russian interface strings
│   ├── words.<lang>.<letters>.json
│   │                     # A word pack: 20 chapters of 10 tasks
│   └── spell.<lang>.<letters>.json
│                         # A "Find the word" pack: 5 or 10 chapters of 10 tasks
├── tools/
│   └── validate.py       # Content checks for the packs and the UI files
└── README.md             # Product and launch notes
```

The words and the story lines are separated from the logic. To change a theme or a task it is enough
to edit a file in `content/` without touching the game code.

## Content format

A word pack declares its language and word length and then lists the chapters:

```json
{
  "language": "en",
  "letters": 3,
  "chapters": [
    {
      "id": "en3-01",
      "title": "Morning on the Farm",
      "emoji": "🐔",
      "character": "🐔",
      "colors": ["#4f3b8f", "#225b57"],
      "completeText": "The farm is awake and a big summer trip is coming soon.",
      "tasks": [
        {
          "word": "SUN",
          "syllables": "S-U-N",
          "prompt": "The farm is still dark and sleepy. Read the word to light up the sky.",
          "success": "The sun climbs up and the whole farm wakes.",
          "choices": [
            { "id": "sun", "emoji": "☀️", "label": "sun" },
            { "id": "moon", "emoji": "🌙", "label": "moon" },
            { "id": "star", "emoji": "⭐", "label": "star" }
          ],
          "correct": "sun"
        }
      ]
    }
  ]
}
```

A task of the "Find the word" mode carries a picture instead of the parts, and its choices are plain
words. The word itself is the correct answer, so no separate `correct` field is needed:

```json
{
  "word": "CAT",
  "emoji": "🐱",
  "prompt": "The tag machine wakes up. Its first customer purrs and waits.",
  "success": "CAT. The tag clips on and the purring gets louder.",
  "choices": ["CAT", "COT", "CUT"]
}
```

The rules the content has to follow — the word length, the alphabet, the parts spelling the word back,
exactly three unique choices and the caption of the correct choice matching the word — are checked by
the validator. Russian text spells Ё wherever the word has it. For the mode it also checks that the word is among
the choices, that the choices are words of the same length, and that they differ in exactly one letter
position:

```bash
python3 word-quest/tools/validate.py
```

Add `--all` to require every expected pack to exist. Missing packs are only a warning without that
flag, because the levels are written one at a time.

The validator also holds the floor under the repetition described above: a level must carry at least
35 different words, and no word may appear more than 8 times in it. Both are errors, so a new pack
cannot quietly shrink to a handful of words said over and over.

A "Find the word" pack has its own floor and cap, also errors:

- English: 50 different words, each used once;
- Russian, 3 letters: at least 20 different words, each used up to 6 times;
- Russian, 4 letters: at least 25 different words, each used up to 5 times.

Two more signals are warnings: the same word coming back with the same three choices more than
twice, and the first letter changing in more than 30% of the tasks of a pack. The Russian packs keep
the first letter under that share, so a word whose only real partners differ in a later letter
comes back with the same pair, and the validator lists those words.

## Adding a level

The list of playable levels lives in the `LEVELS` constant at the top of [game.js](game.js). All ten
packs — levels 3 to 7 in both languages — are written and listed. To add another level, write its
pack, run the validator, add the level number to `LEVELS` and add its strings to both `ui.*.json`
files. A "Find the word" pack is listed in `SPELL_PACKS` in [game.js](game.js) and in `SPELL_PACKS`
in [tools/validate.py](tools/validate.py).

## Deliberate decisions

These decisions were made on purpose and take precedence over the shared rules in
[GAME_DESIGN.md](../GAME_DESIGN.md).

- **The instructions and the story lines are addressed to an adult.** They do not have to be large and short.
  The child only reads the word on the card itself.
- **By default a word is shown in full.** Splitting it into parts stays a separate action, otherwise the
  reading task loses its point. The button for that action must be understandable to the child without reading.
- **The captions under the pictures stay hidden until the answer is correct.** Otherwise the child reads
  the caption instead of the word.
- **In the "Find the word" mode the three answers are visible from the start.** They are the reading
  task itself, so there is nothing to hide. Their letters are marked only when the hint is opened.
- **The mode exists for 3-letter English words and for 3- and 4-letter Russian words only.** Longer
  words have too few minimal pairs a child knows, and English stays at five stories.
- **Russian words in the "Find the word" mode are shown whole, not split into syllables.** The three
  words must line up letter by letter in columns, and a split would break the columns the hint relies
  on. This overrides the syllable rule in GAME_DESIGN.md and the way the Russian levels show a word
  split at once.
