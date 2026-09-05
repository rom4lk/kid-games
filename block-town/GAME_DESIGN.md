# Concept: "Block Town"

A calm sandbox for a child of about six. The screen shows an empty grid — a sheet of squared paper.
The child picks a block in the palette and paints the world with a finger or the mouse: roads, woods,
water, houses. The world answers every stroke: roads join into crossings, puddles merge into lakes
with shores, houses turn their doors to the street, a little car sets off along a finished road.
There are no tasks, no recipes and no wrong moves. The only goal is to fill the whole world, and the
reward is a town that lives.

The player's main fantasy: "I paint a whole world myself, and it comes alive under my hands."

## Inspiration

The game draws on Minecraft's block-by-block construction, but its closest relative is Townscaper:
no goals, and the joy comes from the world reacting beautifully to every placed block.

| We keep | We leave out |
| --- | --- |
| A grid world changed block by block | Resources, mining, crafting and recipes |
| Free choice of what to build and where | Tasks, blueprints and prepared answers |
| The world visibly reacts to every change | Any evaluation of the result — the child decides what is good |
| More blocks and bigger worlds when they are wanted | Combat, dangers, timers and any way to lose |
| A finished world stays and can be revisited | Camera rotation, 3D and height |

## Who it is for and why

- Age: about 6 years old.
- After one short demonstration by an adult, the child paints on their own.
- The painting path requires no reading; the palette and the tools are pictures. The optional words
  screen is a reading activity shared with an adult.
- A small world takes about 5 minutes; the big worlds are made to be returned to across many days.
- The main emotions: calm, ownership ("my town") and curiosity — "what happens if I paint this here?"

## The main game loop

1. The child picks a block in the palette (a big picture button).
2. They tap a cell — the block appears; they drag across cells — a whole stroke is painted.
3. The world reacts at once: tiles connect, shores appear, small life shows up.
4. Painting over a cell replaces the old block. There is no eraser and there are no mistakes.
5. When every cell of the world is painted, the town celebrates: evening falls, windows and lanterns
   light up, and the world stays open in the evening light.

Painting by dragging is the core mechanic of the game, so the shared rule against dragging does not
apply to the canvas. A single tap always works too.

## Worlds instead of levels

There is no ladder and nothing to unlock. The child makes worlds and keeps them. The pause menu
holds a shelf with a live picture of every world in the order it was made; tapping a picture opens
that world, and the cross under it deletes the world behind a confirmation. A big plus at the end of
the shelf opens the size picker.

| Size | Grid | Cells | Tools |
| --- | --- | --- | --- |
| Small | 5 x 10 | 50 | Brush |
| Medium | 8 x 16 | 128 | Brush |
| Large | 12 x 24 | 288 | Brush, wide brush |
| Very large | 18 x 36 | 648 | Brush, wide brush, fill bucket |
| Huge | 24 x 48 | 1152 | Brush, wide brush, fill bucket |

The five sizes are drawn as growing rectangles of squared paper, so nothing has to be read to choose
one. The first launch makes a small world by itself: the first tap already paints a cell. Deleting
the last world leaves a fresh small one, so the game is never empty.

## The palette an adult sets

Progression is the adult's job now. Every world starts with three blocks — forest, water and road —
and an adult adds more from the shelf page: the gear on the Block Town card opens a list of all
twenty blocks, and tapping one adds it to the palette. A block cannot be removed one by one; the only
way back is a button on the same list that returns the palette to the three starting blocks. Painted
worlds keep every cell after that, so nothing a child has built is lost — the palette only narrows.

Blocks are grouped into families. Up to eight enabled blocks the palette is a flat row of big
buttons; past that a family button opens a short row of its kinds (tap the family, then tap the
kind). Familiar blocks keep the same pictures and the same positions in the palette.

| Family | Kinds | Notes |
| --- | --- | --- |
| Roads | path, asphalt, rails | Painted over water they become a bridge on their own |
| Nature | meadow, forest, flowers, field, sand, mountain | Meadow is the calm filler for empty corners |
| Water | water | One kind; the world itself draws shores, lakes and rivers |
| Buildings | house, tower, farm, windmill, lighthouse, castle | |
| Decorations | lantern, bench, fountain, playground | |

Twenty blocks in all — never all at once unless an adult decides the child is ready for them.

## Words that open blocks

The child can also add blocks from inside the game. A lock button at the end of the palette opens a
list of words, ordered from shortest to longest and then by the block-table order. Forest, water and
road start open and carry their pictures, so the list demonstrates what reading a word will do.

The child taps a locked word and reads it aloud. A small adult-styled control confirms the reading;
the card then reveals the block picture, plays its family sound, speaks the word when sound is on and
offers a large button back to the world. The new block is already selected, so the next tap paints
it. Open words remain in the list as a picture dictionary.

This optional path deliberately needs an adult at the table, unlike the independent painting loop.
The confirmation is visually separated as 15 px adult text so it does not look like the child's
next main action.

## Smart blocks

Autotiling is the heart of the game: it makes any child's painting look right without a single rule
to learn.

- A road looks at its four neighbours and draws itself as a straight, a turn, a crossing or an end.
- Water cells merge: an edge next to land becomes a shore with rounded corners, a big patch reads
  as a lake, a long line as a river. A road painted across water turns into a bridge by itself.
- Road painted two cells wide or more becomes a paved square instead of a tangle of centre lines.
- A lone forest cell is one tree; a cluster grows denser and taller trees inside.
- A house next to a road turns its door and a doorstep path toward the street.
- A field sprouts over time: bare soil, green shoots, ripe ears.

The child never places "a wrong tile" — every combination draws itself as well as it can.

## The living world

Small life is the reward that replaces tasks. It appears on its own when the painting makes it
possible, and each reaction is visible without sound or reading:

- A car drives along a connected road; on a closed loop it keeps driving round.
- A train runs along connected rails.
- A duck lands on a lake of four or more cells; a boat sails on a lake of ten or more.
- Birds circle over a forest cluster of six or more cells.
- Fields ripen, a windmill turns when a field is near, a lighthouse blinks when it stands by water.
- In the evening (after the world is complete) windows and lanterns light up.

All of it is gentle and slow. Under `prefers-reduced-motion` the travel of cars, trains, birds and
boats stops; their presence is kept with static figures, and light and opacity changes stay smooth.

## Painting tools

- **Brush** — the default and the only tool at the start: tap a cell or drag a stroke.
- **Wide brush** (from the large world on) — paints 2 x 2, for big meadows and lakes.
- **Fill bucket** (on the two big worlds) — fills a connected empty area with the chosen block.
- **No eraser and no undo button**: painting over is always the fix, so nothing needs to be undone.
- Tool buttons are big pictures next to the palette; the active tool is framed and enlarged.

## The screen and the controls

The world is shown flat from above on a sheet of squared paper, and the camera never rotates.

- The three smaller sizes fit the screen whole. Cells there are comfortably large.
- The two big sizes open zoomed in to a comfortable cell size. Two big buttons zoom in and out,
  panning works by dragging the sheet with the second finger or with big edge arrows, and a mini-map
  in the corner shows the whole world with the unpainted spots as bright dots. Tapping the mini-map
  jumps there.
- Canvas cells may be smaller than the usual 64 px rule for interactive elements: a stray stroke
  costs nothing and is fixed by painting over, so precision is never required. The palette, the
  tools, the zoom and the pause keep the 64 px minimum.
- Keyboard: the arrow keys or `WASD` move a cursor frame, `Space` paints the current block,
  `Enter` moves focus into the palette and picks a block, `Escape` opens the pause and then walks
  back through its screens. The shelf of worlds and the size picker are walked with the left and
  right arrows.
- The pause holds the shelf of worlds with the size picker, and the "clear this world" action, which
  asks for a confirmation because it erases that world's painting. Deleting a world asks separately.

On the screen at the same time: the sheet, the palette, the tools, the progress sun, the sound
button and the pause. Nothing else.

## Filling a world and the celebration

- Progress is shown without numbers: a small sun beside the sheet fills up as cells are painted,
  and unpainted cells shimmer very slightly so they are easy to find.
- When the last cell is painted, the town celebrates: a soft sunset, windows and lanterns light up,
  cars and boats come out together, gentle confetti falls. No flashes, no loud sounds. It happens
  once per world.
- After the celebration the world stays open in the evening light and can still be repainted. There
  is nothing to move on to: the next world is made when the child wants one.
- The shelf shows every world as a live thumbnail of its current painting, so the child picks by
  picture, not by name — worlds have no names, and none has to be read.

## A safe world

- No tasks, no timers, no scores, no failure of any kind.
- Nothing the child paints can be lost except through "clear this world" or deleting a world, and
  both ask for a clear confirmation in pictures with "keep it" focused first.
- Every stroke is saved at once; closing the game and coming back returns the town exactly as it was.
- All creatures are friendly; night never falls by itself — evening is only the completion reward.

## Visual language and sound

- Block families differ by silhouette and surface pattern, never by color alone: roads are flat with
  a drawn edge, forests are round crowns, water has a wave pattern, buildings have doors and windows.
- The active palette button is framed, enlarged and marked with a checkmark.
- Each family has its own short placement sound: a soft plop for water, a rustle for forest, a tap
  for road, a knock for a house. Painting a stroke becomes a little tune. The game is fully playable
  with the sound off.
- The style is friendly and calm: rounded corners, soft daylight colors, clear little faces on the
  creatures, no harsh effects.

## Saving

- `blockTownWorldsV1` holds every world — its size and its painting — and which world is open.
- `blockTownBlocksV1` holds the blocks an adult has enabled. The shelf page writes it, the game only
  reads it, and resetting progress keeps it.
- `blockTownSoundV1` holds the sound choice.
- `kidGamesLanguageV1` holds the shared English or Russian choice used for accessible labels and the
  adult-facing texts; the child's path itself needs no reading.

## Testing with a child

The adult shows once: pick a block, tap a cell, drag a stroke. After that they do not help and only
watch.

The design counts as working if the child:

1. Paints their own strokes and switches blocks without being told.
2. Notices at least one world reaction and experiments with it on purpose.
3. Fixes a cell by painting over it, without asking how to erase.
4. Finds the unpainted cells at the end on their own (by the shimmer, the sun or the mini-map).
5. Wants to come back to a finished world or to make a new one, and finds both on the shelf without
   help.

Separately, note the moments where the child looks for an eraser or an undo button, gets lost on the
two zoomed sizes, or stops painting for a long while without looking at the world's reactions.

## The main risks

1. **The big worlds turn into a chore.** Filling 1152 cells must stay pleasant: the big sizes carry
   the wide brush and the bucket, strokes must feel fast, and the shimmer, the sun and the mini-map
   must make the remaining work easy to see. If testing shows fatigue, shrink the big sizes — the
   table of sizes is data, not architecture. A child who picks a size too big can also simply make a
   smaller world instead.
2. **Zoom and panning on the two big sizes.** This is the hardest interaction for the age. It must
   be tested with a child early; the fallback is smaller big sizes that fit the screen whole.
3. **Palette overload.** Twenty blocks are many, and now an adult decides how many arrive at once.
   The three starting blocks, the family grouping past eight and stable button positions carry this;
   if a family submenu confuses, cut kinds rather than add explanations.
