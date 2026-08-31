# Forest Light

The first playable version of a gentle survival game for a six-year-old who cannot read yet. The player explores a forest of three clearings, gathers branches, stones and berries, chooses what to build at the camp, and closes the chapter by lighting the campfire.

The loop is the recognizable one from *Don't Starve* — leave the base, find resources, make something useful, get ready for the night — with the fear taken out: no timers, no defeat, no lost items and no punishment for being slow.

## What is implemented

- an interface with no required text;
- custom pictograms for the branch, the stone, the berries, the bush, the campfire, the torch, the bowl and the actions;
- mouse, touch and keyboard controls;
- three gathering verbs on one contextual button: a branch is picked up with one press, a stone is dug out with two, a berry bush is shaken three times, with a visible row of pips for the count;
- a map of three clearings — the berry hollow, the camp and the stone slope — that scrolls when the hero walks off the side of the screen or presses the edge tab;
- a shared backpack of six slots that shows the kind of every resource;
- three silhouettes at the camp: the campfire (the chapter goal), the torch and the berry bowl, each buildable in any order and from any matching slot;
- the sun's path in four marks that advances only after a useful action and stops on the last one to wait for the player;
- a circle of light that narrows with the dusk and puts the far resources to sleep until a torch or the campfire is lit;
- a fullness meter of three berry marks: an empty meter sits the hero down, slows the walk and makes the stone too heavy, and the firefly leaves an emergency berry when there is nothing left to eat;
- bushes that grow back on every return to the camp, while the stones of a clearing run out and send the player to the neighbouring one;
- pressure meters hidden on the very first run: the sun's path and the fullness meter open once a chapter has been finished;
- a tutorial on the first branch and hints after 8 and 16 seconds;
- a light-bulb button that repeats the voice hint;
- a separate speaker button that turns off sound and speech, with the choice saved to `localStorage`;
- an English and Russian interface selector, with matching voice prompts and a shared saved choice;
- a working pause;
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

### Checking both modes

The first run is a tutorial without the sun's path and without the fullness meter; the long evening opens after one finished chapter. To look at either mode without clearing the saved progress, add a query parameter:

```text
http://127.0.0.1:4173/forest-light/?longEvening=1
```

`?longEvening=0` forces the tutorial mode back.

## Controls

- Tap an object, wait for the hero to arrive and press the big button; the picture on it says what will happen — a hand, a shaking hand or a shovel.
- Press the button as many times as there are pips above it: once for a branch, twice for a stone, three times for a bush.
- Tap an empty spot in the forest to simply walk there.
- Tap the tab on the side of the screen, or walk into the edge, to move to the next clearing. The tab with the tent always leads home.
- At the camp, tap a silhouette that lights up to start building it, then tap the backpack slots that fit.
- When the hero sits down hungry, tap the highlighted berry in the backpack to feed them.
- The arrow keys and `WASD` move the hero, and walking off the side of the screen changes the clearing.
- `Space` performs the available contextual action.
- `Escape` pauses the game and resumes it.
- The light-bulb button repeats the current hint, the speaker button turns sound off.

## Logic check

```bash
node test-game.js
```

The test covers the recipes, protection against collecting the same item twice, the shared backpack and its limit, the three gathering verbs, the sun's path following useful actions, the darkness that a torch takes away, the fullness meter, feeding and the emergency berry, travel between the clearings, bushes growing back while stones do not, the free build order and the impossibility of lighting the campfire before it is ready.

## Files

```text
forest-light/
├── index.html        # the game scene and the pictograms
├── styles.css        # the visual style and responsiveness
├── game.js           # rules, the map, controls, hints, sound and saving
├── content.ru.json   # the voice lines
├── content.en.json   # the English voice lines
├── translations.json # the English and Russian interface text
├── test-game.js      # the game logic test
├── GAME_DESIGN.md    # the agreed design
└── README.md         # running the game and controls
```
