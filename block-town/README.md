# Block Town

A calm sandbox for a child of about six. The screen is an empty sheet of squared paper. The child
picks a block in the palette and paints the world — roads, woods, water, houses — and the world
answers every stroke: roads join into crossings, water merges into a lake with shores, a house turns
its door toward the street, a little car sets off along a finished road. There are no tasks, no
timers and no wrong moves. The only goal is to fill the sheet, and the reward is a town that lives.

The full design is in [GAME_DESIGN.md](GAME_DESIGN.md), the build order in
[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) and the state of the work in
[PROGRESS.md](PROGRESS.md).

## Running

A single server started from the root of the repository serves every game:

```bash
python3 server.py
```

Then open `http://127.0.0.1:4173/block-town/`. A local server is required: the game loads
`translations.json` through `fetch`, which does not work over `file://`.

## The sheets

A sheet unlocks when the previous one has been fully painted, and every unlocked sheet stays open:
the child can go back, repaint it or carry on at any time.

| Sheet | Grid | Cells | What is new |
| --- | --- | --- | --- |
| 1 | 5 x 10 | 50 | Meadow, road, forest, water |
| 2 | 8 x 16 | 128 | House, field |
| 3 | 12 x 24 | 288 | Flowers, sand, asphalt; the palette groups by family; the wide brush |
| 4 | 18 x 36 | 648 | Rails, tower, farm; the fill bucket; zoom, edge arrows and the mini-map |
| 5 | 24 x 48 | 1152 | Mountain, windmill, lighthouse, castle, playground, lantern, bench, fountain |

Sheets 1 to 3 fit the screen whole. Sheets 4 and 5 open at a comfortable cell size and scroll; two
zoom buttons, four big edge arrows and a mini-map carry the movement around them. On the mini-map
the cells still waiting are the bright ones.

## Smart blocks

Nothing here has to be learned: every block looks at its neighbours and draws itself.

- A road becomes a straight, a turn, a T, a crossing or an end.
- A road painted across water becomes a bridge, and painting water back over it gives the water
  back. The lake underneath stays one lake.
- Water draws a shore on every side where it meets something else.
- A lone forest cell is one small tree; inside a cluster the trees grow taller and denser.
- A house turns its door toward the street next to it.
- A field goes from bare soil to green shoots to ripe ears while the sheet is open.
- Rails are a separate network: a car never drives onto them and a train never leaves them.

## The living world

Small life appears on its own as soon as the painting allows it, and disappears when the painting no
longer does. A car drives a road of three cells or more and keeps circling a closed loop; a train
runs the rails; a duck lands on a lake of four cells, a boat sails one of ten; birds glide over a
wood of six. A windmill turns beside a field and a lighthouse blinks beside water. When the sheet is
full, evening falls and the windows and lanterns come on.

## Controls

- Tap a cell to paint it, or drag to paint a whole stroke. Painting over is the only correction —
  there is no eraser and no undo.
- The palette holds the blocks. From sheet 3 a family button opens a short row of its kinds.
- The tools appear when there is more than one: the brush, the wide brush (2 x 2) and the fill
  bucket.
- The sun beside the sheet fills up as cells are painted, and unpainted cells shimmer.
- `Escape` opens the pause, which holds the shelf of sheets and the only reset, "new sheet", behind
  a confirmation.
- Keyboard: the arrow keys or `WASD` move the frame, `Space` paints, `Enter` steps into the palette
  and the left and right arrows walk along it, `Escape` returns to the sheet.

The child's path needs no reading: the palette, the tools and the pause are pictures.

## Logic check

```bash
node block-town/test-game.js
```

The test covers the block and sheet registries, painting and painting over, refused input, the
stroke line filler, the autotile helpers, the world analysis, the house door, the field stages, the
wide brush, rail paths, the bucket on a full sheet, the unlock ladder, the compact save and the
normalization of a damaged save.

## Saving

- `blockTownSheetsV1` holds every sheet's painting, its bridges and sown fields, and which sheets
  are unlocked. A save with all five sheets painted is under six kilobytes.
- `blockTownSoundV1` holds the sound choice.
- `kidGamesLanguageV1` holds the shared English or Russian interface choice used by every localized game.

## Files

- `index.html` holds the accessible structure of the sheet, the palette, the mini-map and the pause.
- `styles.css` draws every block, creature and celebration without external images.
- `game.js` holds the pure model above `module.exports` and the interface below it.
- `translations.json` holds the English and Russian interface text.
- `test-game.js` checks the model in Node.js.

The sound is played through the shared `../shared/game-sound.js`, the interface language through
`../shared/game-language.js`, and the way back to the shelf through `../shared/game-home.js`.
