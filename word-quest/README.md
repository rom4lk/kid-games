# Living Words

A browser game that turns reading into a way of steering a story. The child reads a word out loud and
then picks the matching picture out of three. A correct answer moves the story forward and opens the
next word.

## What is in the game

- two reading languages, English and Russian, chosen on the start screen and remembered afterwards;
- levels by word length, from 3 to 7 letters, in both languages;
- phrase levels after the 7-letter level, in three steps: two short words, two longer words and
  three words. A phrase is a color, a number or a size with a noun, or a subject with an action
  (КРАСНЫЙ ФЛАГ, ДВА ШАРА, МАЛЕНЬКИЙ ПЁС, КОТ СПИТ). Each wrong picture changes one word of the
  phrase and the two change different words, so the child has to read every word. Russian
  phrases come split into syllables at once, English phrases whole with the parts on demand,
  exactly as in the letter levels;
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

1. The child picks the reading language, then a level by word length or a phrase level, then a
   chapter.
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

## Phrase levels

The phrase levels give more reading out of the same pictures: a few dozen nouns combined with
colors, numbers, sizes and actions make hundreds of different phrases. There are three steps, and
the menu card of each shows one bar per word instead of a number:

| Level | Words | English letters (no spaces) | Russian letters | Longest word | Long word required |
| --- | --- | --- | --- | --- | --- |
| A, two short words | 2 | 5–8 | 5–12 | en 7, ru 9 | no |
| B, two longer words | 2 | 9–14 | 11–18 | en 7, ru 10 | ru: one word of 7+ letters |
| C, three words | 3 | 7–18 | 9–22 | en 7, ru 10 | no |

Only the correct phrase counts, because the wrong answers are pictures. Russian A and B overlap at
11–12 letters on purpose: a phrase there belongs in B only if it has a word of seven letters or
more. Russian A allows МАЛЕНЬКИЙ (9 letters), because there is no shorter natural word for
"small" and a size phrase only teaches reading when both size words can be the answer.

Every level mixes four kinds of phrase, and each kind has one way to be drawn:

- **Color + noun** (КРАСНЫЙ ФЛАГ): an emoji that genuinely has that color, such as ❤️ 💙 🟢 📕
  🍏 🐻‍❄️.
- **Number + noun** (ДВА ШАРА): the emoji repeated that many times, in rows of five like a ten
  frame, with one item size for the whole task so a count never reads as big or small.
- **Size + noun** (МАЛЕНЬКИЙ ПЁС): the same emoji scaled up or down inside its card.
- **Subject + action** (КОТ СПИТ, ПАПА ИДЁТ): a sleeping or singing subject is its own emoji with
  a small 💤 or 🎵 in the corner; other actions are the gendered people emoji with МАМА/ПАПА
  (🏃‍♀️ 🏃‍♂️, 💃 🕺) and the cat faces 😿 😹 😽 for crying, laughing and kissing.

A level C phrase combines two of them, such as a number and a color, or a number and an action.

The two wrong pictures each change exactly one word of the phrase, and they change different
words. For КРАСНЫЙ ФЛАГ the wrong answers are БЕЛЫЙ ФЛАГ and КРАСНЫЙ ЛИСТ: a child who reads only
the noun, or only the color, cannot tell the right picture from a wrong one. A changed word keeps
its kind, so a color is swapped for a color and a noun for a noun. Colors that are easy to confuse,
such as red and orange, are not swapped for each other.

The pictures come from fixed tables in [tools/validate.py](tools/validate.py) rather than from the
author's choice in each task: `COLOR_PICTURES` maps a color and a noun to the one emoji that shows
that noun in that color, and `VERB_PICTURES` maps a subject and an action to its emoji. Colors are
judged on Apple Color Emoji, which the family's Mac and tablet use, up to Emoji 15.0. There is no
recoloring and no custom drawing, so a "blue balloon" cannot exist, because 🎈 only comes in red.
Each meaning has one picture across both languages: `cat` is 🐱 in Russian and in English.

A level has floors and caps, held by the validator as errors:

- at least 100 different phrases across the 200 tasks, and no phrase more than 3 times;
- at least 30 tasks of each of the four kinds; a level C task counts for both of its kinds;
- a number with a size, or a number with a 💤 or 🎵 badge, goes up to 3 items at most, because in
  a row of five the big and small items or the badges stop looking different.

On a phone three answers side by side leave about 100px each. A task whose answers hold four or
more items, a size or a badge with two or more items, or a caption word longer than seven letters
stacks its answers in one column there. The third answer may then need a scroll. The phone is
best-effort, as in [GAME_DESIGN.md](../GAME_DESIGN.md#target-device); a computer and a tablet keep
the three answers side by side on one screen.

## Stored progress

The progress is saved to `localStorage` under the key `livingWordsProgressV2`. It holds:

- the chosen language;
- the number of words solved in each chapter of each language and level, the phrase levels
  included under the keys `<lang>-phraseA`, `<lang>-phraseB` and `<lang>-phraseC`;
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
│   ├── phrases.<lang>.<a|b|c>.json
│   │                     # A phrase pack: 20 chapters of 10 phrase tasks
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

A phrase pack is a word pack with three differences: the file name, the header and the picture
fields on the choices. The file is `phrases.<lang>.<a|b|c>.json`, and the header names the mode and
the level instead of the letters:

```json
{
  "language": "ru",
  "mode": "phrase",
  "level": "a",
  "chapters": []
}
```

The chapters carry the same fields as in a word pack, with ids such as `ru-a-01`. A phrase task
from [content/phrases.ru.a.json](content/phrases.ru.a.json):

```json
{
  "word": "ДВА ШАРА",
  "syllables": "ДВА ША-РА",
  "prompt": "Из фургона выпрыгивает клоун Бим. Прочитай, что он принёс.",
  "success": "Два шара рвутся в небо, и Бим смеётся.",
  "choices": [
    { "id": "two-balloon", "emoji": "🎈", "count": 2, "label": "два шара" },
    { "id": "five-balloon", "emoji": "🎈", "count": 5, "label": "пять шаров" },
    { "id": "two-ball", "emoji": "⚽", "count": 2, "label": "два мяча" }
  ],
  "correct": "two-balloon"
}
```

The fields that differ from a word task:

| Field | Rule |
| --- | --- |
| `word` | Upper-case words separated by single spaces: 2 words in levels A and B, 3 in level C. |
| `syllables` | Each word split exactly as a word of that length is split in the levels, words joined by single spaces. Russian: by syllables, a one-syllable word whole. English: 3–4 letters letter by letter (`R-E-D C-A-T`), 5+ letters by syllables, a one-syllable word whole. With the hyphens removed it spells `word`. |
| `choices[].id` | The meaning of the phrase as English slugs, one per word, in word order, joined by `-`. A slug names the meaning, not the form: красный, красное and красных are all `red`, and кота and котов are both `cat`. The two languages share the slugs. The validator checks distractors against these slugs. |
| `choices[].emoji` | One emoji, the picture of one item. It is fixed by the validator's tables: color + noun → `COLOR_PICTURES`, people and cat-face verbs → `VERB_PICTURES`, and the noun's own picture otherwise. |
| `choices[].count` | Optional integer 1–10, present exactly when the phrase has a number word. The item is drawn that many times. |
| `choices[].size` | Optional, `"big"` or `"small"`, present exactly when the phrase has a size word. |
| `choices[].badge` | `"💤"` for sleep, `"🎵"` for sing. Required on every sleep or sing phrase, and allowed nowhere else. A small second emoji in the corner of each item. |
| `choices[].label` | Required for every choice: the lower-case phrase of that choice. Only the correct one is ever shown, after the answer. The distractor labels feed the form checks. |

Word levels are untouched: their choices never carry `count`, `size` or `badge`.

For a phrase pack the validator checks the shape first: the word count, the letter limits of the
level, the parts spelling the phrase back, three choices with distinct pictures, and ids with one
slug per word. Then it checks the meaning. The correct phrase has to be a modifier and a noun or a
noun and a known verb, with modifiers in the order number, size, color. Each distractor has to
change exactly one slug, the two have to change different words, and a changed slug has to keep its
kind. The picture has to match the words: the count is the number, the size and the badge are
present exactly when the words call for them, and a color or an action uses the emoji from the
table. One meaning keeps one picture across all six phrase packs. The prompt may not contain a word
that a distractor changes, just as a "Find the word" prompt may not name its answer.

The form checks catch inconsistent spellings, not wrong grammar. The validator remembers how each
slug was written in each context, a noun by its number class or a color by its noun, and reports a
second spelling, so КОТА in one task and КОТЫ in another after ДВА is an error. It does not know
that one of them is wrong. English also gets a plural check after a number and the -S of the verb.
Russian text has to spell Ё in the words that always have it, such as ЗЕЛЁНЫЙ, ПОЁТ and ПЁС. The
grammar itself is checked by reading every correct label before a pack lands.

The phrase floors and caps are listed under [Phrase levels](#phrase-levels). The warnings are a noun
in more than 10% of the tasks, the same task with the same distractors more than once, a close pair
of colors swapped, and, in level C, one word position left alone by both distractors in more than
half of the tasks. The validator prints a summary line for every phrase pack with its unique
phrases, the largest repeat, the mean letters per phrase and the tasks of each kind, so packs that
overlap can be compared.

## Adding a level

The list of playable levels lives in the `LEVELS` constant at the top of [game.js](game.js). All ten
packs — levels 3 to 7 in both languages — are written and listed. To add another level, write its
pack, run the validator, add the level number to `LEVELS` and add its strings to both `ui.*.json`
files. A "Find the word" pack is listed in `SPELL_PACKS` in [game.js](game.js) and in `SPELL_PACKS`
in [tools/validate.py](tools/validate.py).

A phrase pack is listed by appending its key, `phraseA`, `phraseB` or `phraseC`, to `LEVELS` once
its file passes the validator. `PHRASE_LEVELS` in [game.js](game.js) and `PHRASE_LEVELS` in
[tools/validate.py](tools/validate.py) must agree on the three levels. The strings of all three
phrase levels are already in both `ui.*.json` files. Listed now: Russian levels A, B and C, and
English levels A and B. The last phrase pack, English level C, is still to be written.

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
- **Color phrases carry meaning by color.** In КРАСНОЕ СЕРДЦЕ against СИНЕЕ СЕРДЦЕ the color is the
  content being read. This overrides "never carry meaning by color alone" in GAME_DESIGN.md for
  this content only, and close color pairs are not swapped for each other.
- **Each wrong picture changes one word, and the two change different words.** Otherwise one word
  of the phrase could stay unread.
- **A sleeping or singing subject is drawn as its emoji with a small 💤 or 🎵 in the corner.** No
  emoji shows a sleeping cat, and one drawing per action keeps a verb from having two pictures.
- **Russian phrases come split, English phrases whole.** The same as the letter levels.
