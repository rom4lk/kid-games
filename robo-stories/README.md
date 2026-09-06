# Robo Stories

A browser puzzle game in which the child builds a program out of picture cards and then watches a
robot run it. The game is made of stories: every story has its own robot task, its own way of moving
and its own set of cards, and all stories are open from the start. The levels inside a story open one
after another.

Robo Stories replaces the two earlier games Robo Route and Robot Lab and keeps the best of both: the
picture-only interface, the visible command slots and the hint from the real state of the field come
from Robo Route; turns, switch-and-door pairs, the "repeat two" card, stars for a short program and
the robot reward come from Robot Lab.

## What is in the game

- eight stories with eight levels each, sixty-four levels in total;
- two ways of moving: arrow cards (left, right, up, down) or a headlight robot that walks forward,
  turns left or right and jumps over one cell;
- three kinds of goal: carry every parcel to the station with the same sign, collect everything on
  the field (batteries, crystals, dust, gears, ducks), or roll every snowball onto a mark;
- bushes, crates, walls, craters, furniture, fences and barriers that block cells;
- water that stops a step but not a jump;
- conveyor belts that carry the robot along to the end of the belt;
- snowballs that roll one cell ahead when the robot walks into them;
- floor switches and gates matched by shape and color: a round switch opens round gates, a square
  switch opens square gates; the robot presses a switch by stepping on it;
- numbered batteries that have to be collected in order;
- the `×2` card that repeats the two previous actions;
- a strip of visible command slots: the shortest program plus two spare slots, and every spare slot
  used costs a star;
- three stars for a program no longer than the shortest one, and the shortest length of every level
  is confirmed by a search in the tests;
- a light bulb that highlights the next useful card from the real state of the field;
- a one-question survey after the first completion of every level;
- a panel for parents with the survey answers, a JSON export and a progress reset;
- a robot mascot that earns an accessory for every finished story;
- an English or Russian interface; the text for the child is pictures only, the text for an adult is
  small and visually separated;
- mouse, touch and keyboard controls;
- a responsive layout for a computer and a tablet.

## Running

From the root of the project start the shared local server:

```bash
python3 server.py
```

Open the game at:

```text
http://127.0.0.1:4173/robo-stories/
```

A local server is required: the game loads `translations.json` through `fetch`, which does not work
over `file://`.

## The stories

| # | Story | Moves | Goal | What it teaches |
| --- | --- | --- | --- | --- |
| 1 | Post Office | arrows, pick up, put down | one parcel to one station | the program loop, four directions, going around a bush |
| 2 | Gate Yard | arrows, pick up, put down | parcels to stations | floor switches and gates, signs on parcels, two parcels |
| 3 | Charging Lab | forward, turn left, turn right | batteries | the headlight, turns, walls, doors by shape, batteries in order |
| 4 | Mars Rover | forward, turns, `×2` | crystals | the repeat card on long straight roads |
| 5 | Clean Room | arrows, `×2` | every dusty spot | covering an area with repeat cards |
| 6 | Snow Yard | arrows | snowballs on their marks | pushing: walk into a ball and it rolls, so stand on the far side |
| 7 | Toy Factory | arrows | gears | conveyor belts that carry the robot, with and against the way |
| 8 | Lily Pond | forward, turns, jump | rubber ducks | the jump card over water, lily pads to walk on |

Inside a story a new card appears only after a level where the child has used the previous ones.
The two turn cards arrive together.

## Keyboard controls

The letters are printed in the corner of each card, the way keys are printed on a keyboard.

| Key | Command |
| --- | --- |
| `←` `→` `↑` `↓` | Move left, right, up, down |
| `F` | Forward |
| `L` | Turn left |
| `R` | Turn right |
| `P` | Pick up |
| `D` | Put down |
| `X` | Repeat two |
| `J` | Jump |
| `Enter` | Run the program |
| `Backspace` | Remove the last card |

The shortcuts read the physical key, so they also work on a Russian layout.

## The rules of the field

- A step into the edge of the field, a wall or a closed gate stops the run: the robot bumps, the cell
  it could not enter flashes and the card that failed trembles. The field then returns to the start
  and the program stays, so the child fixes one card and runs again.
- The run stops the moment the goal is reached, so cards after the goal do not spoil the route. They
  still count towards the program length and therefore the stars.
- A parcel can only be put down on the station with the same sign. Putting it down elsewhere stops
  the run and highlights the matching station.
- Stepping on a numbered battery too early does not stop the run: the battery shakes, the one that
  comes first glows, and the robot walks on.
- The `×2` card lights up only after two cards stand before it, and it repeats the two actions that
  were executed last, so `forward, forward, ×2, ×2` is six steps.
- Walking into a snowball rolls it one cell ahead in the same direction. If that cell is the edge, a
  fence or another ball, the ball shakes, the cell behind it flashes and the run stops. A ball on a
  mark becomes a snowman; the level is done when every mark has one.
- A step or a jump that lands on a belt starts a ride: the belt carries the robot one cell in its
  direction, and a belt there carries it further, until the robot lands on plain floor. Riding is
  not a card and costs nothing. A belt that points at a wall stops the ride without a crash, and a
  belt running against the robot carries it back to where it came from.
- Water stops a step like a wall does and the water splashes. The jump card flies over the next cell,
  whatever it is, and lands on the cell after it; that cell has to be walkable. The cell the robot
  flies over is untouched, so a duck there is not collected.
- Any program that reaches the goal wins. The stored solution is only used by the tests.

## The hint

The light bulb searches from the real state of the field: the robot, the direction it faces, the
parcel in its hands, every parcel, battery and gate, and the two last actions for the `×2` card. It
highlights the next useful card and the slot it goes into. If the program already contains a card
that cannot run, the bulb marks that card instead. If the goal can no longer be reached at all,
which only happens when a snowball has been rolled where it cannot come back from, the bulb marks
the card that rolled it there. After a long pause with no action the bulb starts blinking on its
own. The bulb never performs the action for the child.

For an adult the light bulb also shows a one-sentence route in the text strip under the cards.

## The survey

After the first completion of every level the success screen asks one question, how hard the level
was, with three faces to choose from: easy, normal, very hard. The answer is stored together with the
level, the stars, the number of cards and the shortest length, the number of runs and hints and the
seconds spent. A replay does not ask again.

The panel for parents behind the gear button in the top corner lists the answers and copies them as
JSON, so they can be used to tune the levels.

## Progress

Progress is stored in `localStorage`:

| Key | What it holds |
| --- | --- |
| `roboStoriesProgressV1` | the best stars for every finished level, grouped by story |
| `roboStoriesSurveyV1` | the survey answers |
| `roboStoriesSoundV1` | the sound switch |

A level opens when the previous level of its story is finished. A story counts as finished when
every level has at least one star; the robot on the story menu then wears one more accessory.

## Tests

The level data, the simulation, the search and the progress rules need no browser and are checked
by a script:

```bash
node robo-stories/test-game.js
```

The tests confirm that every stored solution wins and is the shortest program the search can find,
that cards appear one at a time, that hints alone finish every level with three stars, and they cover
the map legend, level validation, movement in both modes, symbol matching, gates, numbered
batteries, the repeat card, snowballs and stuck detection, belts, water and jumps, stars, saved
progress and the survey records.

## Files

- `index.html` contains the three screens, the success layer and the panel for parents.
- `styles.css` contains the visual system, the eight field themes and the animations.
- `levels.js` contains the stories and their levels as small text maps.
- `game.js` contains the level parser, the simulator, the search, the progress rules and the
  interface. The part that needs no browser is exported for the tests.
- `translations.json` contains the Russian version of every label and every adult text.
- `test-game.js` contains the logic tests.
- `assets/robo-mascot.png` is the mascot artwork.
- `GAME_DESIGN.md` contains the concept and the review checklist.

## Deliberate decisions

These decisions were made on purpose and take precedence over the shared rules in
[GAME_DESIGN.md](../GAME_DESIGN.md).

- **Three stars are given only for a program no longer than the shortest one.** The level itself
  counts as completed with any working program; the stars stay an optional layer, as in Garden Quest
  and Robot Lab before it.
- **The keyboard letters are printed on the cards.** They are 15px, low-contrast and sit in the corner
  like the letters on a keycap, so the child does not need them and an adult finds them at once.
- **The adult text is on the play screen.** The level title, its goal and the text of the hint stand
  under the cards in a muted 15px strip. The child never needs it: the goal is shown as pictures at
  the top, and the hint highlights cards.
- **The survey is asked once per level.** A second answer for the same level would describe a replay,
  not the first meeting with it, and would make the data harder to read.
