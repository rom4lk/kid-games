# Robo Route

An interactive, no-reading-required game prototype inspired by the programming loop of Human Resource Machine. A child builds a sequence from large picture commands and helps a friendly delivery robot move a parcel to its station across six levels.

## Run locally

The shared server started from the repository root serves this game too:

```bash
python3 server.py
```

Then open `http://127.0.0.1:4173/robo-route/`. A local server is required: the game loads
`translations.json` through `fetch`, which does not work over `file://`.

## Prototype controls

- Tap a colored picture command to add it to the route.
- Tap a filled route slot to remove that command.
- Tap the green triangle to run the route.
- Tap the light bulb to highlight the next useful action.
- Tap the eraser or home icon to reset.
- Tap an unlocked dot on the field to revisit that level.

The first two levels use horizontal movement. Later levels introduce up and down commands, turns, and an obstacle that the robot must avoid.

The visible child-facing interface contains no written instructions. The only visible words belong to
the language picker in the top corner, which is addressed to an adult; everything the child touches is
a picture. The rest of the text lives in browser metadata and accessibility labels.

## Language

The game has a language picker and opens in English by default. The choice is shared with the home
page and the other games through `localStorage` under `kidGamesLanguageV1`. The text is written in
English in the HTML, and the Russian version comes from `translations.json` through the shared
`shared/game-language.js`.

## Route checking

The route is judged by simulating it, not by comparing it against a stored answer. Any legal route
that gets the parcel to the station wins, and the light bulb solves the board from wherever the robot
currently stands, so a child who invents their own path still gets a useful next step. A slot is only
marked wrong when that command physically cannot run. Each level gives two spare slots beyond the
shortest solution, so one wasted step does not make the level unfinishable.

## Progress

Unlocked and completed levels are stored in `localStorage` under `roboRouteProgressV1`, and the game
reopens on the first unfinished level. The sound switch is stored separately under `roboRouteSoundV1`,
so a muted game stays muted after a reload.

## Tests

The level data, the route simulation and the hint solver need no browser and are checked by a script:

```bash
node robo-route/test-game.js
```

The tests confirm that every stored solution wins, that an invented detour wins too, that an
impossible command is reported at the right position, and that following the light bulb alone
finishes every level within the available slots.

## Files

- `index.html` contains the game scene and icon artwork.
- `styles.css` contains the responsive visual system and animations.
- `game.js` contains the six levels, command queue, grid simulation, hints, sound, and feedback. The
  part that needs no browser is exported for the tests; the rest runs inside a `document` guard.
- `translations.json` contains the Russian version of every label.
- `test-game.js` contains the logic tests.
- `assets/robo-mascot.png` is the generated mascot artwork.
- `GAME_DESIGN.md` contains the product concept and review checklist.
