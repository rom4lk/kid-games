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
3. The path of discoveries appears only after three visited places — the city counts as one — or
   after the first new day, and it opens itself once to introduce the tree.
4. Every later card is met alone, at the moment the player chose it.

## The path of discoveries

The buildings are gone; in their place is a small technology tree in the manner of Civilization V.
It lives on a screen of its own, opened by the green button and closed by the back arrow or Escape.
Three columns, eight cards, and a card opens only after everything it points back to is open. The
whole tree is visible from the first day: locked cards stand dim with a lock and the pictures of
what has to come first.

| Card | Opens after | Cost | What it changes |
| --- | --- | --- | --- |
| 🌻 Garden | — | 🪵 4 | One apple every day |
| 🛠️ Workshop | — | 🍎 4 | One log every day |
| 👣 Boots | — | 🍎 2 🪵 2 | One more step every day, from the day it opens |
| 📚 Library | 🌻 Garden | 🍎 2 🪵 2 | One idea every day |
| 🧺 Basket | 🛠️ Workshop | 🍎 3 🪵 2 | Every new place gives one more of the gift it gives most of |
| 🔭 Spyglass | 👣 Boots | 🪵 2 💡 1 | Sees two cells around instead of one; the fog lifts at once |
| 🛶 Boat | 🔭 Spyglass | 🪵 5 💡 1 | The river becomes walkable and the far side of the island opens |
| 🎪 Festival | 🌻 🛠️ 📚 | 🍎 5 🪵 5 💡 3 | The ending |

The player chooses one card at a time. Its cost is a row of gift pictures, one per apple, log and
idea, and every gift collected on the map fills one of them. When the last one fills, the card opens
by itself. **Nothing is spent until that moment**, so changing the chosen card costs nothing and
loses nothing.

Every tap on a card is answered with something good, and there is no refusal:

| Card state | A tap does |
| --- | --- |
| Open | Says so, and nothing is lost |
| Ready — the gifts are already there | Opens it at once |
| Reachable but short of gifts | Makes it the goal and closes the tree |
| Locked | Lights the road to it and hands the goal to the first card that has to come first |

Garden, workshop and library also show up in the city picture, and the boat with them, so the city
grows through the session. The goal card at the top of the island screen repeats the chosen
discovery and counts the three friendly places the festival waits for.

## The river

Column 10 of the map is a river of ten water cells with no gap to walk around. Until the boat is
open the explorer is turned back at the bank and the way into the tree calls for attention; the
water cells carry a small boat sign as soon as the tree has been seen once. After the boat they
become ordinary places, each with a fish on it.

The near side holds many times what the whole tree costs, so the far side — where puzzles and
orchards live twice as often — is never a requirement, only a destination.

## The game loop

1. The explorer takes their steps to neighboring cells.
2. New cells give apples, logs and ideas. A new day starts only once every step is spent, so
   supplies are earned by walking and not by pressing the button.
3. The player picks a discovery; the gifts collected on the map fill its cost.
4. The card opens by itself, and the tree opens to ask what comes next.
5. Every new day the garden, the workshop and the library produce extra resources.
6. After the three friendly places the player throws a festival and wins.

If resources run short, a new day always brings basic supplies. That is why a session can never
reach a dead end and why any chosen card is finished sooner or later.

The session is saved to `localStorage` under the key `islandDiscoveryV2` after every move, new day
and discovery. A game saved by the older version under `islandDiscoveryV1` is dropped rather than
repaired: the island changed shape. The circular arrow button starts over and asks about the
difficulty again — the running session is kept until a difficulty is picked, so "Keep playing" in
that dialog gives it back untouched. The note button next to it switches the sound off and on.

The start dialog and the main screen both provide an English or Russian interface selector. The shared
choice is saved under `kidGamesLanguageV1`, and English is used when no choice has been saved yet. The
text of the game is written in English in `index.html`, and the Russian version comes from
`translations.json` through the shared `../shared/game-language.js`.

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
- the chosen difficulty sets the steps per turn, and the boots add one more;
- a session of roughly 10–15 minutes;
- no defeat, no combat and no time limit;
- every action gives clear feedback;
- the interface targets a computer.

## Deliberate decisions

These decisions were made on purpose and take precedence over the shared rules in
[GAME_DESIGN.md](../GAME_DESIGN.md).

- **The game targets a computer.** A layout for a small screen is not required: the map and the buildings
  panel do not have to fit into one mobile screen.
