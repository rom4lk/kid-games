# Block Town

A calm sandbox for a child of about six. The screen is an empty sheet of squared paper. The child
picks a block in the palette and paints a world — roads, woods, water, houses — and the world
answers every stroke: roads join into crossings, water merges into a lake with shores, a house turns
its door toward the street, a little car sets off along a finished road. There are no tasks, no
timers and no wrong moves. The only goal is to fill the world, and the reward is a town that lives.

The full design is in [GAME_DESIGN.md](GAME_DESIGN.md).

## Running

A single server started from the root of the repository serves every game:

```bash
python3 server.py
```

Then open `http://127.0.0.1:4173/block-town/`. A local server is required: the game loads
`translations.json` through `fetch`, which does not work over `file://`.

## The worlds

There is no ladder of levels. The child makes worlds and keeps them: the pause menu holds a shelf
with a live picture of every world, and a big plus at the end opens a picker of five cell sizes.
Tapping a picture opens that world; the cross under it deletes the world behind a confirmation. The
first launch makes a world with the largest cells by itself, so the very first tap already paints a
cell, and deleting the last world leaves a fresh one in its place.

| Cell choice | Target size | Example grid at 1280 x 800 | Tools |
| --- | --- | --- | --- |
| Largest | 120 px | 5 x 10 | Brush, eraser |
| Large | 80 px | 7 x 15 | Brush, eraser |
| Medium | 56 px | 10 x 22 | Brush, wide brush, eraser |
| Small | 40 px | 15 x 31 | Brush, wide brush, fill bucket, eraser |
| Smallest | 28 px | 21 x 45 | Brush, wide brush, fill bucket, eraser |

The chosen size is a target rather than a fixed grid. A new world fills the available stage with
cells close to that size and saves its resulting rows and columns. The whole grid always remains on
screen: opening it in a smaller window makes every cell smaller, with no page or grid scrolling.

## The palette an adult sets

Every world starts with three blocks — forest, water and road — and an adult widens the palette from
the shelf page: the gear on the Block Town card opens the settings panel, and its "Blocks" screen
lists all twenty blocks. Tapping one adds it for good; a block can never be taken away, which is
what keeps every saved world paintable. Past eight enabled blocks the palette folds into families,
and a family button opens a short row of its kinds. Enabling a block in one tab reaches an open game
in another without a reload. The child can also open the lock button at the end of the palette,
read a word aloud and have an adult confirm it; the matching block appears and returns to the world
already selected.

## Smart blocks

Nothing here has to be learned: every block looks at its neighbours and draws itself.

- A road becomes a straight, a turn, a T, a crossing or an end.
- A road painted across water becomes a bridge, and painting water back over it gives the water
  back. The lake underneath stays one lake.
- Water draws a shore on every side where it meets something else, rounds the corners of a lake
  and puts a fillet in every inside corner where the lake bends.
- Road painted two cells wide or more becomes a paved square: the centre line stops and the paving
  shows, so a plaza reads as a plaza and not as a frame of lines.
- A lone forest cell is one small tree; inside a cluster the trees grow taller and denser.
- A house turns its door toward the street next to it.
- A field goes from bare soil to green shoots to ripe ears while the world is open.
- Rails are a separate network: a car never drives onto them and a train never leaves them.

## The living world

Small life appears on its own as soon as the painting allows it, and disappears when the painting no
longer does. A car drives a road of three cells or more and keeps circling a closed loop; a road of
two cells brings a walker who strolls along the roadside; a train runs the rails; a duck bobs on a
lake of four cells, a boat rocks on one of ten; birds flap over a wood of six. A windmill turns
beside a field and a lighthouse blinks beside water. A street painted past a house starts its
chimney smoking, at most six chimneys spread over the town; erasing the street stops it.

The painting itself breathes too, slowly and by a little: the crowns of lone and row trees sway,
the waves of a lake drift, ripe ears bend in the wind, a fountain splashes, a swing rocks, and
cloud shadows pass over the whole sheet. When the world is full, evening falls, the windows and
lanterns come on and fireflies come out over the sheet.

Under `prefers-reduced-motion` the creatures stand at their first cell in their first frame, one
still puff marks a chimney, the crowns, waves and ears keep still, the clouds are gone and the
fireflies stay lit at one brightness.

## Controls

- Tap a cell to paint it, or drag to paint a whole stroke. Painting over or erasing is the only
  correction — there is no undo.
- The palette holds the blocks. Past eight of them a family button opens a short row above the
  dock; choosing a kind, tapping the family again or tapping the sheet closes it.
- The lock button after the palette opens the optional words screen. `Escape` returns from a word
  card to the word list, then from the list to the world.
- The tools sit next to the palette: the brush, the wide brush (2 x 2), the fill bucket and the
  eraser. Which of them a world offers follows its cell-size choice; the brush and the eraser are
  always there.
- The sun beside the sheet fills up as cells are painted, and unpainted cells shimmer.
- `Escape` opens the pause, which holds the shelf of worlds, the cell-size picker and the only reset,
  "clear this world", behind a confirmation. `Escape` then walks back one pause screen at a time.
- Keyboard: the arrow keys or `WASD` move the frame, `Space` paints, `Enter` steps into the palette
  and the left and right arrows walk along it, `Escape` returns to the sheet. The shelf of worlds
  and the cell-size picker are walked with the same left and right arrows.

The painting path needs no reading: the palette, the tools and the pause are pictures. Reading is
used only in the optional words screen with an adult.

## Logic check

```bash
node block-town/test-game.js
```

The test covers the block and cell-size registries, screen-derived grid dimensions, legacy save
compatibility, enabling blocks and listing locked blocks, making, opening and deleting worlds,
painting and painting over, a block an adult has not enabled, refused input, the stroke line filler,
the autotile helpers, the inside corners of a lake, the paved square, the world analysis, the order
of a walked track and of a closed loop, the house door, the street by a house and the even spread of
the chimneys, the field stages, the wide brush, rail paths, the bucket on a full world, the size of a
full save and the normalization of a damaged save.

## Saving

- `blockTownWorldsV1` holds every world — its cell-size choice, saved rows and columns, painting,
  bridges and sown fields — and which world is open. Worlds saved before rows and columns were added,
  and worlds whose saved numbers cannot be read, keep the fixed dimensions of their cell-size
  choice. Only a field keeps the moment it was sown, and it keeps it
  in whole seconds counted from the first sowing of its world; a save still holding full millisecond
  epochs is read as it stands. The old `blockTownSheetsV1` save of the level ladder is neither read
  nor migrated.
- `blockTownBlocksV1` holds the blocks an adult has enabled. It is written by the shelf page and by
  the words screen, and "Reset progress" keeps it: like sound and language, it is a setting, not
  progress.
- `blockTownSoundV1` holds the sound choice.
- `kidGamesLanguageV1` holds the shared English or Russian interface choice used by every localized game.

## Files

- `index.html` holds the accessible structure of the three play zones — the sky, the world stage
  and the dock, all on one sheet of squared paper — plus the words overlay and the pause with its shelf, cell-size picker and
  confirmations.
- `styles.css` lays out the three edge-to-edge zones and every block from the pictures in `art/`,
  then draws the creatures, the cloud shadows, the fireflies and the celebration. What a block does
  on its own — the sails of a windmill, the lamp of a lighthouse, the windows of a house in the
  evening, the crown of a tree, the splash of a fountain, the swing of a playground — is a
  pseudo-element the stylesheet animates. Motion that many cells share (the ears, the waves, the
  crowns) reads three stepped clocks animated once on the grid, so a thousand cells cost about what
  fifty do.
- `art/` holds the SVG pictures, one file per piece: a shore, a rounded corner, a dashed centre
  line, a tree, a whole house. Each is a 64 x 64 drawing that `styles.css` layers and scales to the
  cell; the pieces that only differ by their side are the same drawing turned. The creatures are
  sprite sheets `sprite-*.svg` of 128 x 64 with frame A on the left and frame B on the right (the
  smoke, 192 x 128, has three frames two cells tall); `field-2.svg` and `fountain-splash.svg` are
  two-frame sheets of the same shape.
- `game.js` holds the pure model above `module.exports` and the interface below it.
- `translations.json` holds the English and Russian interface text.
- `test-game.js` checks the model in Node.js.

The sound is played through the shared `../shared/game-sound.js`, the interface language through
`../shared/game-language.js`, and the way back to the shelf through `../shared/game-home.js`.
