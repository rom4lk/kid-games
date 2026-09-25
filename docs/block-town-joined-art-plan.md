# Block Town: a block filled two cells by two joins into one patch

Status: implementation plan

Supersedes `docs/block-town-clusters-plan.md`, which planned a creature coming to a patch of three
cells. That plan's one open question — "a creature that comes to the patch, or the art of the patch
itself changing?" — is answered by the task below: the art of the patch changes. Deleting that file
is out of scope here; no phase edits it and no phase removes it.

## The task, verbatim

> В игре Блоктаун некоторые блоки меняют свой вид когда рядом есть несколько блоков одного и того же
> типа. например дорога. Нужно сделать так что бы каждый блок когда им заполняешь пространство 2х2
> или больше, менял свой внешний вид. Зайдизайни план этого изменения

(In Block Town some blocks change their look when several blocks of the same kind stand next to each
other, roads for example. Make it so that every block changes its appearance when the child fills a
2 x 2 space or larger with it. Design the plan for this change.)

## The rule

Every one of the thirty blocks changes its look on the stroke that completes a 2 x 2 square of it:
the road already pays out its paving, the water its shore, and from this change the forest grows its
dense canopy and the other twenty-five gain a kerb along the edge where the patch meets a different
kind. Four of those twenty-five — meadow, sand, snow and farm — also draw a joined surface of their
own under the kerb.

## Why it is missing today

Only two of the thirty blocks (`BLOCKS`, game.js:11-42) change their look when the child completes a
2 x 2 square of them, and `cellClasses` (game.js:1383-1412) is the whole of it:

- the roads family gets `road--<shape>`, side, inner-corner and `road--plaza` classes from
  `roadTile` (game.js:588-600), and `road--plaza` is already exactly this task's rule for roads:
  `roadPlaza` (game.js:575-579) returns true when the cell belongs to a filled 2 x 2 of its own
  network (`quadrantMask(..., true)`, game.js:554-561);
- `water` gets shores and fillets from `waterEdges` (game.js:607-624) and `waterInnerCorners`
  (game.js:626-634), and completing a square really does change them: the two end cells of an L lose
  a shore when the fourth cell arrives.
- `forest` gets `forest--0|1|2` from `forestDensity` (game.js:699-707), and this one **does not**
  answer a square. It counts *side* neighbours only: 0 neighbours → `forest--0`, one or two →
  `forest--1`, three or four → `forest--2`. In a 2 x 2 every cell has exactly two forest sides, so all
  four draw `forest--1` — byte for byte the art of a two-cell domino (styles.css:614-620, 643-649) —
  and `forest--2`, the canopy cut by the cell edge that joins the neighbours into one wood
  (`art/forest-dense-*.svg`, styles.css:622-628), is unreachable inside a square. Completing an L of
  three trees into a square changes nothing on screen.

Every other block returns `["cell", "block--<key>"]` and nothing else (game.js:1387, 1411). The
`tile--b` class added afterwards in `renderCell` (game.js:1419-1421) alternates two layouts like a
checkerboard by position, which is not adjacency at all, and `houseDoor`, `windmillTurns` and
`lighthouseBlinks` (game.js:1424-1427) look at a *different* kind next door — a street, a field, the
water — never at the block's own kind.

So meadow, flowers, sand, mountain, snow, rocks, garden, field, orchard, house, tower, farm,
windmill, lighthouse, castle, school, shop, station, playground, lantern, bench, fountain, statue,
flag and snowman — 25 of the 30 blocks — plus the forest as its own case, look the same whether the
child paints one cell or a 5 x 5 block of them.

Everything the change needs already exists and is already tested: `neighborMask` (game.js:509-529),
`diagonalMask` (game.js:531-552), `quadrantMask` (game.js:554-561), the class builder `sideClasses`
(game.js:1373-1375), and `renderCellAndNeighbors` (game.js:1440-1444), which already repaints all
eight neighbours including the diagonals, "because a paved square and every rounded inside corner are
drawn from the diagonal neighbour as well as from the sides" (game.js:1437-1439).

Neither block-town/GAME_DESIGN.md ("Smart blocks", GAME_DESIGN.md:110-123) nor block-town/README.md
("Smart blocks", README.md:53-68) states any rule about a block meeting its own kind beyond the
road, the water and the forest.

## What the child sees

"Joined" is one cell's property: a cell is joined when it is one of the four cells of a **filled
2 x 2 square of its own block**. That is the same question `roadPlaza` already asks, applied to every
block: the cell, one side neighbour, the other side neighbour in the same quadrant, and the diagonal
between them all hold the same block id.

A joined cell of the forest grows the dense canopy it already owns. A joined cell of the other
twenty-five keeps its picture and gains a **kerb**: a soft dark rim drawn inside the cell on every
side where the patch meets a *different* kind, or the edge of the sheet. Between two cells of the
same kind no kerb is ever drawn, so the inside of a patch stays open and the rim reads as the border
of a thick patch of one thing.

| The child paints | What happens |
| --- | --- |
| One cell, or a line of any length one cell wide | Nothing changes. A row of ten houses is still ten houses. |
| An L of three cells | Nothing changes: an L holds no full square. |
| A 2 x 2 square | All four cells are joined. A kerb runs along the whole outside of the four and nowhere between them: the four read as one thick patch instead of four stamps. |
| A 2 x 2 of forest | All four grow into the dense canopy, whose crowns are cut by the cell edge, so the four join into one wood. |
| A 2 x 2 of meadow, sand, snow or farm | The kerb as for every block, and under it the surface itself changes: a striped mown lawn, a smooth beach with long ripples, a snowfield with a sled track, a farmyard of trodden earth and straw. Each pattern runs from edge to edge, so it continues from one cell into the next and the four cells show one surface. |
| A 2 x N strip (N >= 2) | Every cell of the strip is joined — each one sits in some 2 x 2 — so the whole strip is one patch with one rim. |
| A 3 x 3 patch | All nine cells are joined; the middle one carries no kerb at all, the eight around it carry the rim. |
| Two cells touching only by a corner | Nothing: a diagonal touch is not a square. |
| A 2 x 2 with a tail cell hanging off it | The four are a patch. The tail is not joined and gets nothing, and no kerb stands between the patch and the tail, because the kerb marks a meeting with a *different* kind: the rim has an opening there, where the patch runs on into its own thin part. |
| Any irregular blob — a plus, a patch with one-cell tendrils, the normal shape of a child's stroke | Only the parts thick enough to hold a square are rimmed, and the rim opens wherever a thin part of the same block leads out of them. The rim is not a closed ring around every painting; it is the edge between a thick patch and the other kinds around it. |
| A 2 x 2 of road or water | What it does today, unchanged: paving instead of centre lines, a lake whose shore closes up. |
| The fourth cell of a square, and then erasing it again | All four cells change at that one stroke and change back at the next: the flip is immediate and reversible, like every other correction in this game. |

The kerb is a shape, not a colour: the patch gains a rim along its border, which is the same thing a
lake already says with its shore art, so a child who has painted water once reads it without being
told (root GAME_DESIGN.md, "Never carry meaning by color alone"). Apart from the four surfaces of
Phase 4, the inside of a patch is not touched: the `tile--b` checkerboard keeps alternating two
layouts of the block's picture there, which is what stops a big patch reading as one stamp repeated
(renderCell, game.js:1419-1421). Nothing moves, so there is nothing for `prefers-reduced-motion` to
switch off.

## The art budget, and why the look is CSS and not 25 pictures

30 blocks. The road and the water already answer a square and are left alone. The forest answers it
from this change with the dense canopy it already has — no new picture. The 25 others need a new
look.

Three ways to draw it were weighed:

1. **One `<key>-joined.svg` surface per block**: 25 new pictures and 25 new CSS rules (50 with the
   `tile--b` layouts the ground blocks alternate, styles.css:309-356). Highest fidelity, by far the
   biggest cost, and 25 hand-drawn surfaces that all have to look merged is the part of the work most
   likely to come out uneven.
2. **An edge-aware autotile per block**, the way the roads are assembled from corner, edge, line and
   paving pieces (styles.css:392-570): 8-9 pictures per block, 200+ files. Out of the question.
3. **One shared CSS treatment over the existing art**: a kerb on every side where the patch meets
   something else. 0 new pictures.

A shared *picture* is not available, and that is worth stating because it decides the question.
`testEveryBlockHasArt` (test-game.js:1250-1265) reads every `url("art/...")` inside every rule whose
selector names `.block--<key>` and asserts the file name starts with that key, so a shared
`joined-*.svg` may only be used from a selector that names no block — that is, from `.cell.is-joined`.
Such a selector wins on specificity (0-2-0 against `.block--meadow`'s 0-1-0, styles.css:309), so any
`background` it declares would *erase* the block's own art rather than layer under it. Painting over
the art with a pseudo-element is out too: `::before` is already taken by house, tower, school, shop,
station and lantern, and `::after` by forest, orchard, house, tower, windmill, lighthouse, school,
shop, station, playground, fountain and flag (styles.css:634-969), so no pseudo-element is free on
all 25 blocks. What is left, and what is uniform across all 25, is the cell's own `box-shadow`, which
no cell rule uses today (styles.css:218-303; the only cell decoration is the cursor `outline`,
styles.css:299-303).

**Chosen: option 3 for all 25, plus option 1 for four of them.** The kerb costs 0 new pictures,
1 new colour variable and 5 new CSS rules (one shared `.cell.is-joined`, four side rules). On the
user's answer (see User decisions), meadow, sand, snow and farm also draw a joined surface of their
own: 4 new pictures and 4 new CSS rules, one of each per block, on the same `is-joined` class, with no
model change (Phase 4). The per-block rule may name a picture because it names its own block —
`.cell.block--meadow.is-joined` with `url("art/meadow-joined.svg")` is exactly what
`testEveryBlockHasArt` allows.

Total for the change: **4 new SVG files, 1 new CSS variable, 9 new CSS rules.**

## Phases

### Phase 1 — the model answers "is this cell joined", for every block (no visible change)

Outcome: three pure functions, exported and tested; the game looks exactly as before.

Files: `block-town/game.js` (above `module.exports`, game.js:989), `block-town/test-game.js`.

- Next to `roadPlaza` and above `forestDensity`, add the general form of the plaza question. It
  reuses the three existing mask helpers and adds no new traversal:

  ```js
  // A cell is joined when it is one of the four cells of a filled 2 x 2 square
  // of its own block: the cell, two sides that meet at a corner and the
  // diagonal between them. A line, an L of three and a diagonal touch hold no
  // square, so they stay single. This is the question a road already asks
  // itself as `roadPlaza`, asked for every block.
  function joinedSquare(grid, columns, index) {
    const blockId = grid?.[index];
    if (!blockById(blockId)) return false;
    const same = (value) => value === blockId;
    const sides = neighborMask(grid, columns, index, same);
    const diagonals = diagonalMask(grid, columns, index, same);
    return quadrantMask(sides, diagonals, true) !== 0;
  }

  // The sides where a patch meets a different kind, or the edge of the world.
  // Two cells of the same kind never get a kerb between them, even when the
  // neighbour is not in a square itself, so the rim marks the meeting with
  // something else and never cuts across one kind.
  function joinedEdges(grid, columns, index) {
    const blockId = grid?.[index];
    if (!blockById(blockId)) return 0;
    return MASK_ALL & ~neighborMask(grid, columns, index, (value) => value === blockId);
  }

  // Which blocks take the kerb. The road, the water and the forest answer a
  // square with a look of their own, so they keep it.
  function usesJoinedLook(blockId) {
    const block = blockById(blockId);
    if (!block) return false;
    return block.family !== "roads" && block.key !== "water" && block.key !== "forest";
  }
  ```

- Export `joinedSquare`, `joinedEdges`, `usesJoinedLook` and `MASK_ALL` — `MASK_ALL` exists
  (game.js:161) but is not exported today, so it is added to the list at game.js:990-1061 — and import
  them in test-game.js (test-game.js:4-64).

Tests, new functions in `block-town/test-game.js` registered in the run list at its end
(test-game.js:1267-1304), in the style of `testRoadPlaza` (test-game.js:412-445) and
`testForestDensity` (test-game.js:479-492):

- `testJoinedSquare`, with a small helper that paints a 2 x 2 of a given id into a 5 x 10 grid so the
  **every block id** claim is checked for all thirty, not for a sample:
  - for every `BLOCKS` id: the four cells of the square are joined and the untouched cells are not;
  - an L of three of one kind: no cell is joined;
  - a straight line of four: no cell is joined;
  - two cells touching only by a corner: neither is joined;
  - a 2 x 2 whose four cells hold two different kinds: no cell is joined;
  - a 3 x 3: all nine joined; a 2 x 3 strip: all six joined;
  - a 2 x 2 with a tail cell: the tail is not joined;
  - an empty cell never joins — a grid of nothing but `EMPTY_CELL`, and the empty middle of a ring of
    one kind;
  - a square flush against the top-left corner of the world is still joined (the missing outside
    neighbours must not be read as matching), and an index outside the grid, a `columns` of 0 and a
    missing grid all answer `false`.
- `testJoinedEdges`: on a 2 x 2 of meadow the north-west cell has exactly the north and west edges;
  on a 3 x 3 the middle cell has none; a joined cell beside a same-kind tail has no edge toward the
  tail; a square at the world border has an edge toward the border; a cell beside a *different* kind
  has an edge toward it; an empty cell has no edges.
- `testUsesJoinedLook`: the ids that answer `false` are exactly path, asphalt, rails, water and
  forest; the other 25 answer `true`; `EMPTY_CELL` and an unknown id answer `false`. This is the test
  that keeps "every block" true when a thirty-first block is added, and it is the whole of the
  "the smart blocks keep their own rules" check — `testRoadPlaza`, `testRoadInnerCorners`,
  `testWaterEdges` and `testWaterInnerCorners` already pin the road and the water, and this change
  touches neither.

Verify: `node block-town/test-game.js` passes; the browser shows no change at all.

### Phase 2 — a square of forest grows its dense canopy (visible, no new art)

Outcome: completing a 2 x 2 of forest turns all four cells from row trees into the canopy that is cut
by the cell edge, so the four join into one wood — the look the block already owns and could not
reach in a square.

Files: `block-town/game.js` (`forestDensity` only), `block-town/test-game.js`.

- `forestDensity` (game.js:699-707) keeps counting sides and gains the square:

  ```js
  // A lone forest cell is one small tree; with one or two neighbours it is a
  // tree in a row; with three or four, or inside a filled 2 x 2 of forest, the
  // trees close into a canopy that is cut by the cell edge and joins its
  // neighbours into one wood.
  if (neighbors === 0) return 0;
  if (neighbors >= 3 || joinedSquare(grid, columns, index)) return 2;
  return 1;
  ```

- `testForestDensity` (test-game.js:479-492) is updated, not replaced: its grid already holds the
  2 x 2 of forest at cells 4, 5, 14, 15, so the expectation for cell 5 changes from `1` to `2` and
  cells 4 and 15 are added as `2`; cell 0 stays `0` and cell 24 — one neighbour, no square — stays
  `1`. One changed line and two added ones, and the change of expectation is itself the proof that a
  square of forest now looks different.
- Nothing else moves: `forestClusters` and the birds read `connectedComponents` (game.js:709-737,
  827-830) and never look at the density, and `forest--2` already has its art and its still-crown rule
  (styles.css:622-628, 634-649).

Verify: `node block-town/test-game.js`; then in the browser paint an L of three forest cells and
complete the square — the four turn into one dense wood at that stroke, and erasing one turns them
back into row trees.

### Phase 3 — the other twenty-five gain the kerb

Outcome: painting the fourth cell of a square rims all four as one patch; erasing one takes the rim
away.

Files: `block-town/game.js` (`cellClasses` only), `block-town/styles.css`,
`block-town/test-game.js`.

- `cellClasses` (game.js:1383-1412), after the roads, water and forest branches and before the final
  `return classes`:

  ```js
  if (usesJoinedLook(grid[index]) && joinedSquare(grid, size.columns, index)) {
    classes.push("is-joined", ...sideClasses("joined", joinedEdges(grid, size.columns, index)));
  }
  ```

  This is the cheap per-cell reading the design asks for, next to `forestDensity`, not a pass in the
  debounced `analyzeWorld` (game.js:2111): a joined cell costs one `neighborMask`, one `diagonalMask`
  and one more `neighborMask` — twelve array reads, against the thousand-cell worst case of
  `renderAllCells` that the water and road branches already pay.

- The repaint radius is already right and needs no change: the classes of a cell depend on that cell
  and on its eight neighbours and on nothing further away (`joinedSquare` reads the eight,
  `joinedEdges` reads four of them), so a painted cell can only change itself and its eight
  neighbours, which is exactly what `renderCellAndNeighbors` repaints, diagonal included
  (game.js:1440-1444, called per changed cell from `paintTo`, game.js:1968). The fourth cell of a
  square therefore flips all four. This is the reason the kerb marks a meeting with a **different
  kind** rather than with a cell that is not itself joined: the second rule would make a paint reach
  two cells away and force the repaint radius to grow, and it would draw a dark line across the middle
  of one kind. `fillFrom` and `clearWorld` repaint the whole sheet anyway (game.js:1978, 2488).

- The second caller of `cellClasses` is `blockSwatch` (game.js:1666-1679), which builds a palette
  swatch from a one-cell grid, or a three-cell grid for a road. Neither holds a 2 x 2, so
  `joinedSquare` is false and no swatch changes — the palette buttons keep exactly the art they have.

- `styles.css`, one new variable in `:root` next to the ground colours (styles.css:19-28):
  `--kerb: rgb(43 69 53 / 30%)` — the ink of the page, strong enough to read on white snow, pale sand
  and dark forest green alike.

- `styles.css`, five rules after `.cell.is-cursor` (styles.css:299-303) and before the block art
  (styles.css:305), with a comment in the voice of the file:

  ```css
  /* A block filled two cells by two or larger is a patch, not four stamps: a
     kerb runs along every side where the patch meets a different kind, and
     never between two cells of the same kind, so the inside of a patch stays
     open. The kerb is drawn as four inset shadows, which need no
     pseudo-element — every block's own ::before and ::after are already its
     windows, its sails or its crown — and it is never rounded: a rounded
     corner would clip the cell's own art and show paper between two painted
     blocks. */
  .cell.is-joined {
    --kerb-width: max(2px, calc(var(--cell-size) / 10));
    --kerb-n: 0px;
    --kerb-e: 0px;
    --kerb-s: 0px;
    --kerb-w: 0px;

    box-shadow:
      inset 0 var(--kerb-n) 0 0 var(--kerb),
      inset calc(-1 * var(--kerb-e)) 0 0 0 var(--kerb),
      inset 0 calc(-1 * var(--kerb-s)) 0 0 var(--kerb),
      inset var(--kerb-w) 0 0 0 var(--kerb);
  }

  .cell.is-joined.joined--n { --kerb-n: var(--kerb-width); }
  .cell.is-joined.joined--e { --kerb-e: var(--kerb-width); }
  .cell.is-joined.joined--s { --kerb-s: var(--kerb-width); }
  .cell.is-joined.joined--w { --kerb-w: var(--kerb-width); }
  ```

  A zero-width inset shadow paints nothing, so one shared declaration serves all sixteen
  combinations. `--cell-size` is set on the stage and inherits (game.js:1663), and it is the *fitted*
  size, not the preset one — `fitCellSize` (game.js:1654-1658) floors the size to whatever the stage
  can show and clamps only at 1px — so the kerb is floored at 2px with `max()`: it stays visible on a
  dense world in a narrow window, where a cell can be ten pixels wide.

- No `border-radius` anywhere: it would clip the cell's own background (`.cell` is
  `overflow: hidden`, styles.css:218-221) and, in a world the child has filled, punch a
  paper-coloured nick out of the corner between two painted blocks — right when the game is telling
  the child the world is full.
- No new animation, so the `prefers-reduced-motion` block needs no edit; no new picture, so
  `testEveryBlockHasArt` is untouched; `drawThumbnail` paints one flat `BLOCK_COLORS` pixel per cell
  and never reads a cell class (game.js:1468-1485), so the shelf thumbnails are unaffected; the
  `aria-label` is still the block name (game.js:1429).

Test: `cellClasses` lives inside the `initializeGame` closure (game.js:1124, 1383) and is not
exported, so Node cannot call it and a typo in a class name would fail silently in the browser. Pin
the names from the other end, the way the repo already pins its art: `testJoinedLookStyles` reads
`styles.css` as text (the technique of `testEveryBlockHasArt`, test-game.js:1250-1265) and asserts it
contains `.cell.is-joined` and each of `.cell.is-joined.joined--n|e|s|w`, built from the same
`["n", "e", "s", "w"]` list the model's `SIDE_CLASSES` uses, and that the new block declares
`box-shadow` and no `url("art/`.

Verify: `node block-town/test-game.js` passes; then `python3 server.py` from the repository root and,
at `http://127.0.0.1:4173/block-town/` with every block enabled from the shelf gear:

- paint three cells of meadow in an L (nothing changes), then the fourth (all four gain one rim at
  that stroke), then erase one (all four go back to plain) — the flip is what proves the repaint
  radius;
- do the same with a house, a lantern and a snowman: the rim appears for every one of them;
- paint a 3 x 3 of sand: one rim round the nine, nothing across the middle;
- paint a 2 x 2 of sand and hang a fifth sand cell off it: no kerb between the patch and the tail, and
  the rim has an opening there — check this looks like an opening and not like a mistake;
- paint an irregular blob with a thin tendril and look at the whole outline: the rim covers the thick
  part and stops where the tendril leads out;
- paint two different blocks in 2 x 2 patches side by side: both rims read and the doubled line
  between them is not too heavy;
- check the kerb reads on the extremes — snow, the fountain, the dark orchard, the yellow lantern —
  and at the smallest and the largest cell size from the size picker, and on a dense world in a
  narrow window, where the fitted cell falls to about ten pixels;
- fill a world to the celebration: no paper-coloured nick anywhere, and the rims still read under the
  evening light (`.sheet-stage.is-evening::before`, styles.css:185-193);
- switch on Reduce Motion in macOS System Settings: the patches look identical, because nothing here
  moves.

### Phase 4 — meadow, sand, snow and farm draw a joined surface

Outcome: a 2 x 2 of any of these four keeps the kerb from Phase 3 and, under it, shows a surface of
its own that runs from one cell into the next.

Files: `block-town/art/meadow-joined.svg`, `sand-joined.svg`, `snow-joined.svg`, `farm-joined.svg`
(new), `block-town/styles.css`, `block-town/test-game.js`. No change to `game.js`: `usesJoinedLook`
already answers `true` for all four, and the `is-joined` class from Phase 3 is the only hook the
surfaces need.

**One picture per block, not two.** Meadow, sand and snow alternate an `a` and a `b` layout today
(styles.css:309-347) because their pictures carry *placed* motifs — tufts, grains, sparkles — that
would repeat as a stamp. The joined surfaces carry no placed motif: each is a pattern whose period
divides the 64-unit cell and which meets itself at the cell edges, so neighbouring cells continue each
other and there is nothing for a checkerboard to vary. That seamless run is also the whole point: the
four cells show *one* surface. The farm has never had a `tile--b` (styles.css:746-748); its barn is the
motif, and it stays one per cell.

The pictures, drawn in the style of the files beside them: `viewBox="0 0 64 64"`, a full-cell ground
`<rect width="64" height="64">` first, flat fills and round-capped strokes, only colours the existing
art already uses, a one-line comment saying what the picture is, nothing that moves.

- `art/meadow-joined.svg` — **a mown lawn.** Ground `#a9dc88` as in `meadow-a.svg`. Two broad
  horizontal bands, `y` 0-16 and 32-48, filled `#5aa25f` at `fill-opacity=".18"`: the stripes of a
  mown lawn, each running the full width, so a patch shows long even stripes across all its cells (the
  period, 32, divides the cell, so stacked cells continue the rhythm). Along the lower edge of each
  band, short upright grass ticks (`#5aa25f`, width 2, round caps) every 16 units starting at `x` 8, so
  they too run on. No tufts: the lawn is the thing that changed.
- `art/sand-joined.svg` — **a smooth beach.** Ground `#f0dfae` as in `sand-a.svg`. Two long ripples,
  `M0 16q8-5 16 0t16 0t16 0t16 0` and the same at `y` 48, stroked `#cfb277`, width 2.5, round caps:
  they start and end at the same height and slope, so they continue unbroken into the next cell, and
  the spacing of 32 keeps them even across rows. No grains: the loose grains of a single cell give way
  to one combed beach.
- `art/snow-joined.svg` — **a snowfield with a sled track.** Ground `#e4ecf7` as in `snow-a.svg`. One
  long soft drift band across the full width, `y` 40-56, filled `#e3ebf4`, and above it a sled track:
  two parallel lines `M0 26h64` and `M0 34h64`, stroked `#cfdceb`, width 2. The track runs through
  the whole patch in a row and reads as one slope; no sparkles or loose drifts.
- `art/farm-joined.svg` — **a farmyard.** A copy of `farm.svg` with every barn element at exactly the
  same coordinates, so the barn does not move when the square completes. Only the ground changes: the
  meadow `#a9dc88` becomes trodden earth `#e2d2ab` (the colour of the road's ground and of the
  doorstep in `house-s.svg`), with short straw strokes `#c4a93e` (the ripe field's furrow colour),
  width 2, round caps, in a band along the bottom edge (`y` 60-62, every 8 units) and the top edge
  (`y` 3-5), so the yard continues into the cells above and below. Four barns then stand on one yard
  instead of four lawns — a change of ground *and* texture, not of colour alone, next to the kerb.

The rules, one per block, after that block's own rules in `styles.css` (meadow after
styles.css:313-315, sand after 329-331, snow after 345-347, farm after 746-748):

```css
/* A meadow filled two by two is one mown lawn: the stripes run on from cell
   to cell, so the patch shows one surface. */
.cell.block--meadow.is-joined {
  background-image: url("art/meadow-joined.svg");
}
```

and the same for `sand`, `snow` and `farm`. The selector carries `.cell` on purpose: at 0-3-0 it beats
both `.block--meadow` (0-1-0) and `.block--meadow.tile--b` (0-2-0), so one rule covers both layouts of
the checkerboard regardless of where it sits in the file, and it never needs a `.tile--b` twin. Only
`background-image` is set: the size, the position and the ground colour of the block's own rule stay.

**The kerb stays on top of the surface.** `box-shadow` is painted over the element's background, so
the kerb from Phase 3 lies on the new picture with no extra rule. Keeping it means the rule the child
sees stays one rule — every thick patch gets its rim — and the four surfaces only add to it; replacing
it would need an exception in `cellClasses` or the stylesheet for four blocks and would leave these
four without a border where the lawn meets the meadow's neighbour.

Test (new `testJoinedSurfaces` in `block-town/test-game.js`, in the style of `testEveryBlockHasArt`,
test-game.js:1250-1265): for each of `["meadow", "sand", "snow", "farm"]`,
`art/<key>-joined.svg` exists, and `styles.css` holds a rule whose selector contains
`.block--<key>.is-joined` and whose body references `url("art/<key>-joined.svg")`. The existing
`testEveryBlockHasArt` covers the naming: the new rules name their block and their pictures start with
its key, so it stays green.

Verify: `node block-town/test-game.js`; then in the browser:

- paint an L of three meadow cells (plain), complete the square (the lawn stripes and the kerb appear
  on all four at that stroke, including the two `tile--b` cells of the checkerboard), erase one (all
  four go back);
- paint a 3 x 4 of sand, of snow and of farm: the ripples, the sled track and the yard run unbroken
  across every cell edge in the patch, with no seam and no repeated stamp;
- paint a single meadow cell next to the lawn: it keeps its tufts, so the lawn is visibly a different
  surface from a lone meadow cell;
- look from across the room at the default cell size: the four patches must read as changed without
  leaning in; if the lawn stripes are too faint, raise the band opacity, not the colour.

### Phase 5 — the rule is written down

Outcome: both documents state the rule in English (AGENTS.md), so the next change keeps it.

Files: `block-town/GAME_DESIGN.md`, `block-town/README.md`.

- `GAME_DESIGN.md`, "Smart blocks" (GAME_DESIGN.md:110-123): one bullet after the paved-square bullet
  (GAME_DESIGN.md:118) — any block filled two cells by two or larger reads as one patch: the forest
  closes into its dense canopy; meadow, sand, snow and farm turn into one surface of their own — a
  mown lawn, a smooth beach, a snowfield with a sled track, a farmyard; and every block other than the
  road, the water and the forest gains a kerb along the side where the patch meets a different kind,
  never between two cells of the same kind. Amend the forest bullet (GAME_DESIGN.md:119) so it says a
  square of forest is dense too.
- `README.md`, "Smart blocks" (README.md:53-68): the same rule next to the paved square
  (README.md:63-64), naming the four blocks that draw a surface and saying the rest carry the kerb,
  and the forest line (README.md:65) amended the same way.
- `README.md`, "Logic check" (README.md:110-123): add the new tests to the sentence listing what the
  test covers — the joined square for every block, the edges of a patch, which blocks take the kerb,
  the stylesheet rules that draw it, and the four joined surfaces with their pictures.
- The root `GAME_DESIGN.md` is not touched: it holds the rules shared by every game, and this is one
  game's autotiling.

Verify: both files are English; the wording matches what `joinedSquare`, `usesJoinedLook` and
`forestDensity` actually answer and with the four surfaces drawn after Phases 1-4; `node block-town/test-game.js` passes.

## Decisions

1. **One shared CSS kerb, not one joined picture per block.** Cheapest thing that reads as one patch
   from across the room, and the only thing that can be shared at all: `testEveryBlockHasArt` forbids
   a shared picture inside a `.block--<key>` rule, a shared `.cell.is-joined` rule would overpower and
   erase the block's own `background`, and no pseudo-element is free on all 25 blocks. Rejected:
   25 `<key>-joined.svg` surfaces (25-50 rules, the largest and least predictable part of the work)
   for all 25 and a per-block autotile (200+ files). The model's classes are the same either way, so
   a drawn surface is added on top for any single block — which Phase 4 does for four of them, on the
   user's answer.
2. **For 21 blocks the look changes at the border of the patch, not inside it.** Their inside is
   left exactly as it is drawn today, including the `tile--b` checkerboard that keeps a big patch from
   reading as one stamp repeated; the eye reads a shape by its outline. The four blocks of Phase 4
   change their inside too.
   Rejected: an edge-aware corner/edge/inner/line set per block, which is the road's design and the
   road's price.
3. **A filled 2 x 2, exactly as the task says.** No cell of an L of three or of a line is joined,
   however long the line. Rejected: three touching cells (the reading of the superseded plan), which
   would turn every stroke corner into a patch, and a per-family threshold, which the child cannot see
   and the doc has to explain twice.
4. **The kerb marks a meeting with a different kind, not with a cell that is not joined.** Two cells
   of one block never have a kerb between them. This keeps the classes of a cell dependent on its
   eight neighbours only — exactly the radius `renderCellAndNeighbors` already repaints — and it keeps
   the rim off the middle of a uniform region. The price, named in the table and checked in the
   browser, is that the rim of an irregular blob is not a closed ring: it opens wherever a thin part
   of the same block leads out of the thick part. Rejected: the rim as the exact outline of the joined
   cells, which closes every ring but draws a dark line across two identical-looking cells and pushes
   the repaint radius from nine cells to twenty-five.
5. **The forest is fixed in its own idiom instead of taking the kerb.** It is the one block whose
   own-kind rule missed the square: a 2 x 2 drew the same row trees as a domino. Making it dense
   inside a square costs one line and no picture, and the dense canopy — crowns cut by the cell edge —
   is a *stronger* "these joined" than a rim. Rejected: dropping `forest` from `usesJoinedLook` and
   giving it the kerb, which would put a rim round a wood that has art for exactly this and leave
   `forest--2` still unreachable in a square.
6. **The road and the water keep their own look and get no kerb.** Both already change when the fourth
   cell lands — the road by this very 2 x 2 rule, the water by closing its shore — and a rim over a
   lake's shore would fight the art it already has. `usesJoinedLook` states the five exceptions and a
   test pins the list.
7. **No rounded corners.** The first draft rounded the outer corners of a patch; `border-radius`
   clips the cell's own background, so in a filled world — the game's only goal — every outer corner
   would show a nick of paper between two painted blocks, and four of them meeting would read as an
   unpainted cell. Rejected also: rounding only where the neighbours are empty, which would quietly
   take the effect away exactly as the world fills up.
8. **The computation lives in `cellClasses`, per cell, not in `analyzeWorld`.** The debounced analysis
   (320 ms) is for the living world; a look that must flip on the stroke that completes the square
   cannot wait 320 ms. Twelve array reads per cell is the same order as the water and road branches
   beside it.
9. **`box-shadow` on the cell itself, no pseudo-element and no extra DOM.** Forced by the
   pseudo-elements the blocks already spend on windows, sails, crowns and lamps. Also the cheapest: no
   layout change and no background resizing (a real `border` would shrink the art's positioning area
   and break its alignment with the neighbour).
10. **The kerb width is floored at 2px.** `--cell-size` is fitted to the stage, not taken from the
    preset, and has no lower bound but 1px, so a proportional-only kerb would vanish on the densest
    saved worlds — the feature would silently do nothing exactly where a patch is hardest to see.
11. **Nothing moves.** No animation is added, so `prefers-reduced-motion` needs no new branch and the
    state is fully readable without motion, as the shared rules require.
12. **No `joinedCorners` helper.** With the rounding gone it had no caller; the edges alone drive the
    four side classes.
13. **The four surfaces are meadow, sand, snow and farm — the farm instead of the field.** The field
    was in the default list, but its art is the wrong kind of candidate: it grows through three stages
    by time (`field-0`, `field-1`, and `field-2`, a two-frame 128 x 64 sheet on the shared clock,
    styles.css:369-383), so a joined field is three pictures and three stage rules, one of them
    animated; and its furrows already run on from cell to cell (`field-0.svg`: "furrows that run on
    into the next cell"), so a square of field *already* reads as one field and a new surface would
    barely show. The farm costs what a ground block costs — one picture, no `tile--b`, no door
    variants and no `::before`/`::after` (styles.css:746-748) — and turning four barns on four lawns
    into four barns on one yard is a change of the ground under a big red building, which a
    six-year-old sees from across the room. Rejected: the house, the user-facing example of "a paved
    yard", because it has four door pictures (`house-n|e|s|w.svg`, styles.css:676-691) that would all
    need a joined twin, and window pseudo-elements pinned to its geometry (styles.css:695-713) — four
    times the art for the same idea. The field carries the kerb like the other 21.
14. **One picture per surface, and the kerb stays on top.** Argued in Phase 4: the surfaces are
    seamless patterns with no placed motif, so a checkerboard twin would add nothing, and the kerb
    keeps one rule for every thick patch.

## Open questions

None. The only question, kerb or drawn surfaces, is answered under User decisions.

## Out of scope

- The creature that comes to a patch, from the superseded `docs/block-town-clusters-plan.md`, and
  deleting that file: no phase touches it.
- Any change to the road and the water, to `analyzeWorld` and the living world, to the palette, the
  families, the blocks themselves, the sounds, the saves, the thumbnails or the shelf.
- Joined pictures for any block beyond meadow, sand, snow and farm; each is one picture and one rule
  on the same class if wanted later.
- The root `GAME_DESIGN.md`: no shared rule changes.

## Review decisions

1. Accepted (high) — verified: `forestDensity` counts sides, so all four cells of a 2 x 2 draw
   `forest--1`, the same art as a domino. Phase 2 is new: a joined forest cell returns `2` and grows
   the dense canopy it already has art for, `testForestDensity` is updated (cell 5 moves from `1` to
   `2`), and the wrong table row, the wrong "Why it is missing today" bullet and Decision 5 are
   rewritten. The forest stays out of `usesJoinedLook`: its own canopy says "joined" better than a rim
   and costs one line.
2. Accepted (high) — verified: `.cell` is `overflow: hidden`, so `border-radius` clips the cell's own
   art and shows `.sheet-grid`'s paper between two painted blocks in a filled world. All four corner
   rules, the corner classes and `joinedCorners` are gone; the kerb alone carries the reading and is
   strengthened to compensate (Decision 7 records the choice and why "round only next to empty cells"
   was rejected too).
3. Accepted — the kerb is widened and darkened (`max(2px, calc(var(--cell-size) / 10))` at 30 %
   instead of `/14` at 22 %), the overstated "stop reading as separate stamps" claim is corrected —
   the `tile--b` checkerboard inside a patch is now named as deliberate — and Open question 1 is
   restated as a gate to settle before Phase 3 rather than after it.
4. Accepted — Phase 3 gains `testJoinedLookStyles`, which reads `styles.css` as text the way
   `testEveryBlockHasArt` does and asserts `.cell.is-joined`, the four `.joined--n|e|s|w` selectors
   built from the same side list the model uses, a `box-shadow` and no `url("art/`.
5. Accepted — verified `fitCellSize` clamps only at 1px; the width is floored with `max(2px, ...)`,
   Decision 10 records why, and the browser pass now checks a dense world in a narrow window.
6. Accepted as written (the fix asked for documentation, not a different rule): the partial rim on an
   irregular blob has its own table row, a browser check, and Decision 4 now states the trade against
   the alternative — a closed ring would draw a line across two identical cells and push the repaint
   radius from nine cells to twenty-five.
7. Accepted — verified the specificity (0-2-0 against 0-1-0); the reason is restated as "a shared
   rule would overpower and erase the block's own `background`", and the pseudo-element argument,
   which does hold, is kept.
8. Accepted — `testSmartBlocksKeepTheirOwnRules` is dropped; `testUsesJoinedLook` is named as the
   whole of that check, since the existing road and water tests already pin those functions and the
   forest's one changed expectation lives in `testForestDensity`.
9. Accepted — `joinedCorners` no longer exists: with the rounding dropped it had no caller.
10. Accepted — verified `blockSwatch` (game.js:1666-1679) calls `cellClasses` with a one-cell and a
    three-cell grid; Phase 3 names it and states why no swatch changes.
11. Accepted — the header and "Out of scope" now say plainly that deleting
    `docs/block-town-clusters-plan.md` is not part of this plan.
12. Accepted — `houseDoor`/`windmillTurns`/`lighthouseBlinks` are cited as game.js:1424-1427,
    `tile--b` as game.js:1419-1421, and the export step says `MASK_ALL` is not exported today and has
    to be added.

## User decisions

1. Open question 1 ("the kerb, or drawn joined surfaces for some blocks?") — the user answered "для
   3–4 блоков нарисовать свою слитую поверхность" (draw their own joined surface for 3-4 blocks). The
   kerb stays for every block that takes it; Phase 4 draws surfaces for four blocks. The user did not
   name them: the default was meadow, sand, snow and field, and the field is swapped for the farm for
   the reasons in Decision 13.
