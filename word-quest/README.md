# Living Words

A browser game that turns reading into a way of steering a story. The child reads a word out loud and
then picks the matching picture out of three. A correct answer moves the story forward and opens the
next word.

## What is in the game

- two reading languages, English and Russian, chosen on the start screen and remembered afterwards;
- levels by word length, from 3 to 7 letters, in both languages;
- 20 chapters in every level, 10 words in every chapter — 200 words per level;
- every level is open from the menu, while the chapters inside a level unlock one after another;
- a comprehension check through a choice of one picture out of three, with the captions hidden until
  the answer is correct;
- optional speech recognition through the microphone;
- splitting a word into parts through a separate button, a tap on the word card, or automatically
  after a second mistake;
- the option to set a word aside and come back to it later in the same chapter;
- gentle feedback with no penalties and no timer;
- automatic saving of the progress and the statistics;
- a panel for an adult with the progress and the settings;
- adaptation for a computer, a tablet and a phone.

The microphone is used only as an extra effect. Even if the browser does not support speech
recognition or access is denied, every chapter can be completed by reading out loud and picking a
picture.

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
which does not work over `file://`. It also makes the microphone behave more predictably. For speech
recognition it is better to use an up-to-date version of Chrome or Edge and to allow the site access
to the microphone.

## The game loop

1. The child picks the reading language, then a level by word length, then a chapter.
2. The chapter screen shows the situation and a large word.
3. The child reads the word themselves or presses the microphone button.
4. If needed, opens the split into parts, or sets the word aside for later.
5. Picks the matching picture; the caption appears only on the correct answer.
6. After a correct answer, sees the result inside the story and moves on.
7. Ten words finish a chapter and unlock the next one; twenty chapters finish the level.

## Stored progress

The progress is saved to `localStorage` under the key `livingWordsProgressV2`. It holds:

- the chosen language;
- the number of words solved in each chapter of each language and level;
- the number of microphone attempts, opened hints and wrong choices;
- the microphone and sound settings.

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
│   └── words.<lang>.<letters>.json
│                         # A word pack: 20 chapters of 10 tasks
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

The rules the content has to follow — the word length, the alphabet, the parts spelling the word back,
exactly three unique choices, the caption of the correct choice matching the word, and no letter Ё in
the Russian files — are checked by the validator:

```bash
python3 word-quest/tools/validate.py
```

Add `--all` to require every expected pack to exist. Missing packs are only a warning without that
flag, because the levels are written one at a time.

## Adding a level

The list of playable levels lives in the `LEVELS` constant at the top of [game.js](game.js). All ten
packs — levels 3 to 7 in both languages — are written and listed. To add another level, write its
pack, run the validator, add the level number to `LEVELS` and add its strings to both `ui.*.json`
files.

## Deliberate decisions

These decisions were made on purpose and take precedence over the shared rules in
[GAME_DESIGN.md](../GAME_DESIGN.md).

- **The instructions and the story lines are addressed to an adult.** They do not have to be large and short.
  The child only reads the word on the card itself.
- **By default a word is shown in full.** Splitting it into parts stays a separate action, otherwise the
  reading task loses its point. The button for that action must be understandable to the child without reading.
- **The captions under the pictures stay hidden until the answer is correct.** Otherwise the child reads
  the caption instead of the word.
