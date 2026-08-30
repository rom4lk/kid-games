# Forest Light

The first playable version of a gentle survival game for a six-year-old who cannot read yet. The player explores a small forest, collects two sticks and a stone, walks back along a glowing path, builds the campfire themselves and closes the chapter with a cozy evening.

## What is implemented

- an interface with no required text;
- custom pictograms for the stick, the stone, the campfire and the actions;
- mouse, touch and keyboard controls;
- a single contextual button that appears once the hero reaches an object;
- a tutorial on the first stick and hints after 8 and 16 seconds;
- a light-bulb button that repeats the voice hint;
- a separate speaker button that turns off sound and speech, with the choice saved to `localStorage`;
- an English and Russian interface selector, with matching voice prompts and a shared saved choice;
- a working pause;
- a free choice of the second route after the tutorial;
- walking back to the camp on the player's own;
- assembling the campfire from three parts in order;
- a safe ending with no defeat and no lost items;
- completions and help levels saved to `localStorage`.

The Russian voice lines are played through the speech synthesis available in the browser. If there is no suitable voice or the browser blocks speech, the musical and visual hints remain.

## Running

From the root of the shared repository:

```bash
python3 server.py
```

Then open:

```text
http://127.0.0.1:4173/forest-light/
```

A local server is needed to load the file with the voice lines. The rest of the game needs no libraries, no build step and no internet access.

## Controls

- Tap an object, wait for the hero to arrive and press the big hand button.
- Tap an empty spot in the forest to simply walk there.
- Once the supplies are collected, tap the glowing campfire circle.
- While building, tap the highlighted backpack slots one by one.
- The arrow keys and `WASD` move the hero.
- `Space` performs the available contextual action.
- `Escape` pauses the game and resumes it.
- The speaker button repeats the current hint.

## Logic check

```bash
node test-game.js
```

The test checks the recipe, protection against collecting the same item twice, the ban on returning too early, the build order and the impossibility of lighting the campfire before it is ready.

## Files

```text
forest-light/
├── index.html        # the game scene and the pictograms
├── styles.css        # the visual style and responsiveness
├── game.js           # rules, controls, hints, sound and saving
├── content.ru.json   # the voice lines
├── content.en.json   # the English voice lines
├── translations.json # the English and Russian interface text
├── test-game.js      # the game logic test
├── GAME_DESIGN.md    # the agreed design
└── README.md         # running the game and controls
```
