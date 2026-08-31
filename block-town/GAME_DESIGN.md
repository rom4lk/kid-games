# Concept: "Block Town"

A calm sandbox for a child of about six. The screen shows an empty grid — a sheet of squared paper.
The child picks a block in the palette and paints the world with a finger or the mouse: roads, woods,
water, houses. The world answers every stroke: roads join into crossings, puddles merge into lakes
with shores, houses turn their doors to the street, a little car sets off along a finished road.
There are no tasks, no recipes and no wrong moves. The only goal is to fill the whole sheet, and the
reward is a town that lives.

The player's main fantasy: "I paint a whole world myself, and it comes alive under my hands."

## Inspiration

The game grew out of the Minecraft adaptation work in `cube-island/`, but its closest relative is
Townscaper: no goals, and the joy comes from the world reacting beautifully to every placed block.

| We keep | We leave out |
| --- | --- |
| A grid world changed block by block | Resources, mining, crafting and recipes |
| Free choice of what to build and where | Tasks, blueprints and prepared answers |
| The world visibly reacts to every change | Any evaluation of the result — the child decides what is good |
| More blocks and bigger worlds over time | Combat, dangers, timers and any way to lose |
| A finished world stays and can be revisited | Camera rotation, 3D and height |

## Who it is for and why

- Age: about 6 years old.
- After one short demonstration by an adult, the child paints on their own.
- No reading is required anywhere on the child's path; the palette and the tools are pictures.
- One small sheet takes about 5 minutes; the big sheets are made to be returned to across many days.
- The main emotions: calm, ownership ("my town") and curiosity — "what happens if I paint this here?"

## The main game loop

1. The child picks a block in the palette (a big picture button).
2. They tap a cell — the block appears; they drag across cells — a whole stroke is painted.
3. The world reacts at once: tiles connect, shores appear, small life shows up.
4. Painting over a cell replaces the old block. There is no eraser and there are no mistakes.
5. When every cell of the sheet is painted, the town celebrates: evening falls, windows and lanterns
   light up, and the next, bigger sheet unlocks.

Painting by dragging is the core mechanic of the game, so the shared rule against dragging does not
apply to the canvas. A single tap always works too.

## The ladder of sheets

Each sheet is one level. A sheet unlocks when the previous one has been fully painted, and every
unlocked sheet stays available: the child can go back, repaint it or continue at any time.

| Sheet | Grid | Cells | What is new |
| --- | --- | --- | --- |
| 1 | 5 x 10 | 50 | Meadow, road, forest, water |
| 2 | 8 x 16 | 128 | House, field |
| 3 | 12 x 24 | 288 | Flowers, sand; road kinds (path, asphalt); wide brush |
| 4 | 18 x 36 | 648 | Rails, tower, farm; fill bucket; zoom and mini-map |
| 5 | 24 x 48 | 1152 | Mountain, windmill, lighthouse, castle, playground, decorations |

Every sheet introduces one small family of new things and lets the child use it right away. Familiar
blocks keep the same pictures and the same positions in the palette.

## The palette

Blocks are grouped into families. On the small sheets the palette is a flat row of three or four big
buttons; from sheet 3 on, a family button opens a short row of its kinds (tap the family, then tap
the kind). The selected block is shown large on the brush button and as a ghost under the cursor.

| Family | Kinds by the end | Notes |
| --- | --- | --- |
| Roads | path, asphalt, rails | Painted over water they become a bridge on their own |
| Nature | meadow, forest, flowers, field, sand, mountain | Meadow is the calm filler for empty corners |
| Water | water | One kind; the world itself draws shores, lakes and rivers |
| Buildings | house, tower, farm, windmill, lighthouse, castle | |
| Decorations | lantern, bench, fountain, playground | Sheet 5 only |

About eighteen blocks in total by the last sheet — never all at once, and never more than one new
family per sheet.

## Smart blocks

Autotiling is the heart of the game: it makes any child's painting look right without a single rule
to learn.

- A road looks at its four neighbours and draws itself as a straight, a turn, a crossing or an end.
- Water cells merge: an edge next to land becomes a shore, a big patch reads as a lake, a long line
  as a river. A road painted across water turns into a bridge by itself.
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
- In the evening (after the sheet is complete) windows and lanterns light up.

All of it is gentle and slow. Under `prefers-reduced-motion` the travel of cars, trains, birds and
boats stops; their presence is kept with static figures, and light and opacity changes stay smooth.

## Painting tools

- **Brush** — the default and the only tool at the start: tap a cell or drag a stroke.
- **Wide brush** (from sheet 3) — paints 2 x 2, for big meadows and lakes.
- **Fill bucket** (from sheet 4) — fills a connected empty area with the chosen block.
- **No eraser and no undo button**: painting over is always the fix, so nothing needs to be undone.
- Tool buttons are big pictures next to the palette; the active tool is framed and enlarged.

## The screen and the controls

The sheet is shown flat from above, the camera never rotates.

- Sheets 1–3 fit the screen whole. Cells there are comfortably large.
- Sheets 4–5 open zoomed in to a comfortable cell size. Two big buttons zoom in and out, panning
  works by dragging the sheet with the second finger or with big edge arrows, and a mini-map in the
  corner shows the whole sheet with the unpainted spots as bright dots. Tapping the mini-map jumps
  there.
- Canvas cells may be smaller than the usual 64 px rule for interactive elements: a stray stroke
  costs nothing and is fixed by painting over, so precision is never required. The palette, the
  tools, the zoom and the pause keep the 64 px minimum.
- Keyboard: the arrow keys or `WASD` move a cursor frame, `Space` paints the current block,
  `Enter` moves focus into the palette and picks a block, `Escape` opens and closes the pause.
- The pause holds sound, the "new sheet" action (with a clear confirmation, because it erases that
  sheet's painting) and the way back to the shelf of sheets.

On the screen at the same time: the sheet, the palette, the tools, the progress sun, the sound
button and the pause. Nothing else.

## Filling the sheet and the celebration

- Progress is shown without numbers: a small sun beside the sheet fills up as cells are painted,
  and unpainted cells shimmer very slightly so they are easy to find.
- When the last cell is painted, the town celebrates: a soft sunset, windows and lanterns light up,
  cars and boats come out together, gentle confetti falls. No flashes, no loud sounds.
- After the celebration the sheet stays open in the evening light and can still be repainted; a
  button leads to the next, bigger sheet.
- The shelf of sheets shows every unlocked sheet as a live thumbnail of its current painting, so the
  child picks by picture, not by number.

## A safe world

- No tasks, no timers, no scores, no failure of any kind.
- Nothing the child paints can be lost except through "new sheet", which asks for a clear
  confirmation in pictures.
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

- `blockTownSheetsV1` holds every sheet's painting and which sheets are unlocked.
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
5. Wants to come back to a finished sheet or to start the next one.

Separately, note the moments where the child looks for an eraser or an undo button, gets lost on the
zoomed sheets 4–5, or stops painting for a long while without looking at the world's reactions.

## The main risks

1. **The big sheets turn into a chore.** Filling 1152 cells must stay pleasant: the wide brush and
   the bucket must arrive before the big sheets, strokes must feel fast, and the shimmer, the sun
   and the mini-map must make the remaining work easy to see. If testing shows fatigue, shrink the
   top sheets — the ladder is data, not architecture.
2. **Zoom and panning on sheets 4–5.** This is the hardest interaction for the age. It must be
   tested with a child early; the fallback is smaller top sheets that fit the screen whole.
3. **Palette overload.** Eighteen blocks are many. The family grouping, one new family per sheet and
   stable button positions carry this; if a family submenu confuses, cut kinds rather than add
   explanations.
