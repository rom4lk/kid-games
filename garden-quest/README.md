# Garden Quest

A simple browser game for a six-year-old. The player controls Pip the gardener, walks across an 8×8 field and collects fruit and vegetables within a limited number of steps.

## Rules

- Every level gives a limited number of steps.
- A fruit or vegetable is collected when Pip steps onto its cell.
- The goal is to score as many points as possible and earn up to three stars.
- Trees cannot be walked through.
- An attempt to step into a tree or off the edge of the field does not spend a step.

Item values:

| Item | Points |
| --- | ---: |
| 🍓 Strawberry | 1 |
| 🥕 Carrot | 2 |
| 🍎 Apple | 3 |
| 🍆 Eggplant | 5 |
| 🍉 Watermelon | 10 |

## Levels

Levels unlock one at a time: the next garden appears after at least one star on the current one.
An unlocked level stays available forever.

The game has ten levels. The first level has an open field and more steps. Later levels add more trees, the routes get harder and the number of available steps goes down.

All the maps are fixed: the child can replay a level, remember where the items are and improve their route.

The star thresholds are tuned to the exact maximum score of each map:

- one star is easy to get if you reach at least one watermelon;
- two stars require planning a good route in advance;
- three stars are given only for the mathematically optimal score, which is reachable on every level.

## Running

The shared server is started from the root of the repository:

```bash
python3 server.py
```

Then open:

```text
http://127.0.0.1:4173/garden-quest/
```

The game loads `translations.json` through `fetch`, so opening `index.html` over `file://` leaves the
interface without a language switch.

## Controls

- The arrow keys on the keyboard.
- The `W`, `A`, `S`, `D` keys.
- Large arrow buttons on the screen.
- The `Show a step` button highlights one useful direction and cell, but does not move for the player.
- The `Start again` button restarts the current level.
- The speaker button turns the sounds on or off.

## Saved scores

The best score of every level is automatically saved to the browser's `localStorage` under the key `gardenQuestBestScoresV2`, and the number of the last unlocked level under the key `gardenQuestUnlockedV1`.

The saved object looks like this:

```json
{
  "0": 18,
  "1": 24
}
```

The object key is the level index and the value is the best score. A new score is written only when it is higher than the previous one. The number of stars is derived from the score and is not stored separately.

The scores are tied to the browser and the site address. They are not synchronized between devices and will be removed when site data is cleared.

The sound on or off choice is saved under `gardenQuestSoundV1` and survives a page reload.

The English or Russian interface choice is shared with the other localized games and saved under
`kidGamesLanguageV1`. English is used when no choice has been saved yet.

## Structure

```text
garden-quest/
├── index.html   # The game interface
├── styles.css   # Styling and adaptation to different screens
├── game.js      # Maps, rules, controls and score saving
├── translations.json # English and Russian interface text
└── README.md    # Documentation
```

The game requires no library installation and no build step.

## Deliberate decisions

These decisions were made on purpose and take precedence over the shared rules in
[GAME_DESIGN.md](../GAME_DESIGN.md).

- **Steps run out, and the level ends there.** The limited supply of steps is the foundation of the game,
  not a punishment: the map does not change, the level stays unlocked forever, and it can be restarted
  right away.
- **Three stars are given only for the optimal route.** The third star's threshold deliberately matches the
  mathematical maximum of the map; one and two stars stay reachable without any calculation.
