# Island of Discovery

A small browser strategy game for a six-year-old. The game borrows understandable ideas from grand strategy games — exploring the map, gathering resources, growing a town and reaching a common goal — but drops wars, complex tables, timers and punishment for mistakes.

## Difficulty levels

The first screen asks one question: how many steps the explorer takes per day.

| Choice | Steps per day | Supplies on a new day |
| --- | ---: | --- |
| 🐣 Three steps | 3 | 2 apples and 2 logs |
| 🙂 Two steps | 2 | 1 apple and 1 log |
| 🦉 One step | 1 | 1 apple and 1 log |

## Learning the game

There is no separate rules dialog. The mechanics open up one at a time right on the map:

1. At first only the map is visible, and the reachable cells blink — with `prefers-reduced-motion`
   they hold a steady ring instead. The goal: take the first step.
2. After the first collected gift the goal changes to gathering supplies.
3. The buildings panel appears only after three visited places — the city counts as one — or
   after the first new day.
4. The "Festival" card appears only after three buildings.

## The game loop

1. The explorer takes their steps to neighboring cells.
2. New cells give apples, logs and ideas. A new day starts only once every step is spent, so
   supplies are earned by walking and not by pressing the button.
3. The player builds a garden, a workshop and a library.
4. Every new day the buildings produce extra resources.
5. After three buildings the player throws a festival and wins.

If resources run short, a new day always brings basic supplies. That is why a session can never reach a dead end.

The session is saved to `localStorage` under the key `islandDiscoveryV1` after every move, new day and
building. The circular arrow button starts over and asks about the difficulty again — the running
session is kept until a difficulty is picked, so "Keep playing" in that dialog gives it back
untouched. The note button next to it switches the sound off and on.

The start dialog and the main screen both provide an English or Russian interface selector. The shared
choice is saved under `kidGamesLanguageV1`, and English is used when no choice has been saved yet. The
text of the game is written in English in `index.html`, and the Russian version comes from
`translations.json` through the shared `game-language.js`.

## Running

The shared server is started from the root of the repository:

```bash
python3 server.py
```

Then open:

```text
http://127.0.0.1:4173/island-discovery/
```

The game loads `translations.json` through `fetch`, so opening `index.html` over `file://` leaves the
interface without a language switch.

## Principles for the child

- large buttons and a reliance on pictures;
- one goal on the screen;
- the chosen difficulty sets the steps per turn;
- a session of roughly 10–15 minutes;
- no defeat, no combat and no time limit;
- every action gives clear feedback;
- the interface targets a computer.

## Deliberate decisions

These decisions were made on purpose and take precedence over the shared rules in
[GAME_DESIGN.md](../GAME_DESIGN.md).

- **The game targets a computer.** A layout for a small screen is not required: the map and the buildings
  panel do not have to fit into one mobile screen.
