# Block Town

A calm sandbox for a child of about six. The screen is an empty sheet of squared paper. The child
picks a block in the palette and paints a world — roads, woods, water, houses — and the world
answers every stroke: roads join into crossings, water merges into a lake with shores, a house turns
its door toward the street, a little car sets off along a finished road. There are no tasks, no
timers and no wrong moves. The only goal is to fill the world, and the reward is a town that lives.

The full design is in [GAME_DESIGN.md](GAME_DESIGN.md), the original build order in
[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), the rework into worlds in
[WORLDS_PLAN.md](WORLDS_PLAN.md) and the state of the work in [PROGRESS.md](PROGRESS.md).

## Running

A single server started from the root of the repository serves every game:

```bash
python3 server.py
```

Then open `http://127.0.0.1:4173/block-town/`. A local server is required: the game loads
`translations.json` through `fetch`, which does not work over `file://`.

## The worlds

There is no ladder of levels. The child makes worlds and keeps them: the pause menu holds a shelf
with a live picture of every world, and a big plus at the end opens a picker of five sizes. Tapping
a picture opens that world; the cross under it deletes the world behind a confirmation. The first
launch makes a small world by itself, so the very first tap already paints a cell, and deleting the
last world leaves a fresh small one in its place.

| Size | Grid | Cells | Tools |
| --- | --- | --- | --- |
| Small | 5 x 10 | 50 | Brush |
| Medium | 8 x 16 | 128 | Brush |
| Large | 12 x 24 | 288 | Brush, wide brush |
| Very large | 18 x 36 | 648 | Brush, wide brush, fill bucket |
| Huge | 24 x 48 | 1152 | Brush, wide brush, fill bucket |

The first three sizes fit the screen whole. The two big ones open at a comfortable cell size and
scroll; two zoom buttons, four big edge arrows and a mini-map carry the movement around them. On the
mini-map the cells still waiting are the bright ones.

## The palette an adult sets

Every world starts with three blocks — forest, water and road — and an adult widens the palette from
the shelf page: the gear on the Block Town card opens the settings panel, and its "Blocks" screen
lists all twenty blocks. Tapping one adds it for good; a block can never be taken away, which is
what keeps every saved world paintable. Past eight enabled blocks the palette folds into families,
and a family button opens a short row of its kinds. Enabling a block in one tab reaches an open game
in another without a reload.

## Smart blocks

Nothing here has to be learned: every block looks at its neighbours and draws itself.

- A road becomes a straight, a turn, a T, a crossing or an end.
- A road painted across water becomes a bridge, and painting water back over it gives the water
  back. The lake underneath stays one lake.
- Water draws a shore on every side where it meets something else.
- A lone forest cell is one small tree; inside a cluster the trees grow taller and denser.
- A house turns its door toward the street next to it.
- A field goes from bare soil to green shoots to ripe ears while the world is open.
- Rails are a separate network: a car never drives onto them and a train never leaves them.

## The living world

Small life appears on its own as soon as the painting allows it, and disappears when the painting no
longer does. A car drives a road of three cells or more and keeps circling a closed loop; a train
runs the rails; a duck lands on a lake of four cells, a boat sails one of ten; birds glide over a
wood of six. A windmill turns beside a field and a lighthouse blinks beside water. When the world is
full, evening falls and the windows and lanterns come on.

## Controls

- Tap a cell to paint it, or drag to paint a whole stroke. Painting over is the only correction —
  there is no eraser and no undo.
- The palette holds the blocks. Past eight of them a family button opens a short row of its kinds.
- The tools appear when there is more than one: the brush, the wide brush (2 x 2) and the fill
  bucket. Which of them a world offers follows its size.
- The sun beside the sheet fills up as cells are painted, and unpainted cells shimmer.
- `Escape` opens the pause, which holds the shelf of worlds, the size picker and the only reset,
  "clear this world", behind a confirmation. `Escape` then walks back one pause screen at a time.
- Keyboard: the arrow keys or `WASD` move the frame, `Space` paints, `Enter` steps into the palette
  and the left and right arrows walk along it, `Escape` returns to the sheet. The shelf of worlds
  and the size picker are walked with the same left and right arrows.

The child's path needs no reading: the palette, the tools and the pause are pictures.

## Logic check

```bash
node block-town/test-game.js
```

The test covers the block and size registries, making, opening and deleting worlds, painting and
painting over, a block an adult has not enabled, refused input, the stroke line filler, the autotile
helpers, the world analysis, the house door, the field stages, the wide brush, rail paths, the
bucket on a full world, the compact save and the normalization of a damaged save.

## Saving

- `blockTownWorldsV1` holds every world — its size, painting, bridges and sown fields — and which
  world is open. A shelf with one world of every size painted full is under nine kilobytes, so the
  number of worlds needs no cap. The old `blockTownSheetsV1` save of the level ladder is neither
  read nor migrated.
- `blockTownBlocksV1` holds the blocks an adult has enabled. It is written by the shelf page only,
  and "Reset progress" keeps it: like sound and language, it is a setting, not progress.
- `blockTownSoundV1` holds the sound choice.
- `kidGamesLanguageV1` holds the shared English or Russian interface choice used by every localized game.

## Files

- `index.html` holds the accessible structure of the sheet, the palette, the mini-map and the pause
  with its shelf of worlds, size picker and two confirmations.
- `styles.css` draws every block, creature and celebration without external images.
- `game.js` holds the pure model above `module.exports` and the interface below it.
- `translations.json` holds the English and Russian interface text.
- `test-game.js` checks the model in Node.js.

The sound is played through the shared `../shared/game-sound.js`, the interface language through
`../shared/game-language.js`, and the way back to the shelf through `../shared/game-home.js`.
