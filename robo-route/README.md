# Robo Route

An interactive, no-reading-required game prototype inspired by the programming loop of Human Resource Machine. A child builds a sequence from large picture commands and helps a friendly delivery robot match parcels to stations across thirteen levels.

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

The first two levels use horizontal movement. Later levels introduce up and down commands, turns, and an obstacle that the robot must avoid. Levels seven through nine add a floor button that permanently opens one gate for the current run. The robot activates it by stepping on it; the button is not a UI control and adds no new command card. The last four levels first teach shape matching with one parcel, then introduce two deliveries, crossing routes, and a useful delivery order around an obstacle.

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
that gets every parcel to the station with the same symbol wins, in either delivery order when both
orders fit. The robot carries at most one parcel. The light bulb searches from the full current state:
the robot, the carried parcel, every parcel position and delivery status, and the current gate state.
A closed gate blocks its cell; after the robot reaches the floor button, that gate stays open until the
run ends. A slot is only marked wrong when that command physically cannot run. Each level gives two
spare slots beyond the shortest solution, so one wasted step does not make the level unfinishable.

## Progress

Unlocked and completed levels are stored in `localStorage` under `roboRouteProgressV1`, and the game
reopens on the first unfinished level. The sound switch is stored separately under `roboRouteSoundV1`,
so a muted game stays muted after a reload. A saved game with all six original levels completed
automatically unlocks the first gate level. A saved game with all nine earlier levels completed
automatically unlocks the first symbol-matching level. Neither migration changes completion or sound
records.

## Tests

The level data, the route simulation and the hint solver need no browser and are checked by a script:

```bash
node robo-route/test-game.js
```

The tests confirm that every stored solution wins, that the original six levels keep their behavior,
that invented routes and both parcel orders are accepted, that mismatched stations report the correct
drop card, that only the carried parcel moves, and that the first delivery remains complete during the
second. They also cover obstacles, gates, saved-progress migration, level-data validation, hint-only
completion within the available slots, and the number of states explored by two-parcel hint searches.

## Files

- `index.html` contains the game scene and icon artwork.
- `styles.css` contains the responsive visual system, gate states, and animations.
- `game.js` contains the thirteen levels, command queue, grid simulation, hints, sound, and feedback. The
  part that needs no browser is exported for the tests; the rest runs inside a `document` guard.
- `translations.json` contains the Russian version of every label.
- `test-game.js` contains the logic tests.
- `assets/robo-mascot.png` is the generated mascot artwork.
- `GAME_DESIGN.md` contains the product concept and review checklist.
