# Implementation plan: Block Town

This plan turns [GAME_DESIGN.md](GAME_DESIGN.md) into code in small verifiable stages. Every stage
ends with a working game: the earlier sheets stay playable while the later ones are still missing.
The shared rules in [../GAME_DESIGN.md](../GAME_DESIGN.md) apply to every stage.

## File layout

The game follows the repository conventions for standalone games:

| File | Role |
| --- | --- |
| `index.html` | Accessible structure: sheet shelf, canvas, palette, tools, pause |
| `styles.css` | All art drawn in CSS — blocks, autotile variants, creatures, celebration |
| `game.js` | Pure model at the top (exported via `module.exports` for Node), UI below |
| `test-game.js` | Node test over the pure model, run with `node block-town/test-game.js` |
| `translations.json` | English and Russian strings for accessible labels and adult-facing text |
| `README.md` | How to run, the sheets, the controls, the storage keys |

Shared helpers: `../shared/game-sound.js` (`GameSound.tone`), `../shared/game-language.js` +
`../shared/game-language.css` (language picker, `data-translations` on `<body>`).

Served by the root server: `python3 server.py`, then `http://127.0.0.1:4173/block-town/`.

## Architecture

### Pure model (Node-testable, no DOM)

- **Block registry.** `BLOCKS`: id, family (`roads`, `nature`, `water`, `buildings`, `decor`),
  kind, the sheet it unlocks on. Cell values in a grid are small integer block ids; `0` = unpainted.
- **Sheet registry.** `SHEETS`: id (`sheet-1` … `sheet-5`), rows x columns
  (5x10, 8x16, 12x24, 18x36, 24x48), the block ids and tools available on it.
- **State.** `{ currentSheet, unlockedCount, grids: { [sheetId]: number[] }, celebrated: {...} }`.
  Grids are flat arrays (`rows * columns`), JSON-friendly; the biggest is 1152 numbers.
- **Painting.** `paintCell(state, index, blockId)` (paint-over always allowed, returns whether the
  cell changed), `paintStroke` for a list of indices, `floodFill(state, index, blockId)` for the
  bucket (fills the connected same-value region). All of them reject out-of-range input and never
  throw.
- **Progress.** `paintedCount`, `isSheetComplete`, `unlockNextSheet` (only when the current one is
  complete), `normalizeSavedState` (wrong lengths, unknown block ids, blocks not yet unlocked on
  that sheet → empty cell; never crashes on foreign data).
- **Autotiling.** `neighborMask(grid, columns, index, predicate)` → 4-bit mask (N/E/S/W) plus
  helpers per family: `roadTile` (straight / turn / crossing / end / bridge when the cell sits on
  painted water — see below), `waterEdges` (which sides get a shore), `forestDensity` (0–2 from the
  count of forest neighbors).
- **Bridge rule.** A road painted onto a water cell keeps the road id but the model remembers the
  water underneath (`underlay` array parallel to the grid). Painting water back over a bridge
  restores plain water. Only water needs an underlay; every other overwrite simply replaces.
- **World analysis** (feeds the living layer, all pure): `connectedComponents(grid, ids)` and on
  top of it `roadPaths` (walkable ordered cell path per road component, loop detection),
  `lakes` (water components with size), `forestClusters`, `railPaths`. These run debounced after a
  stroke ends, never per cell.

### UI layer

- **DOM grid, incremental rendering.** One `<div role="grid">` of cell elements built once per
  sheet. A paint updates only the touched cell and its four neighbors (their autotile classes may
  change). No full re-render on paint; full rebuild only on sheet switch. Rebuilding all 1152 DOM
  cells per action would not scale.
- **Cell appearance is classes only**: `cell block--road road--ne road--bridge` etc.; `styles.css`
  draws every variant. No inline styles except grid sizing custom properties
  (`--rows`, `--columns`, `--cell-size`).
- **Stroke input.** Pointer events on the grid container with `setPointerCapture`:
  `pointerdown` paints, `pointermove` maps clientX/Y to a cell by arithmetic on the container rect
  (not `elementFromPoint`), paints when the cell index changes. Works for mouse and touch alike.
  A plain click stays a one-cell paint.
- **Living layer.** A separate absolutely-positioned overlay above the grid. Sprites (car, train,
  duck, boat, birds) are DOM elements moved cell-to-cell by a single `requestAnimationFrame`
  driver. Under reduced motion the driver parks each sprite at a fixed cell of its component —
  presence without travel.
- **Mini-map and shelf thumbnails.** One tiny `<canvas>` renderer (one pixel block per cell,
  colors from a per-block table) reused for the sheet-shelf thumbnails and the mini-map. It reads
  only the model, so it stays trivial.
- **Sound.** Family → short `GameSound.tone` pattern, throttled during strokes (at most one sound
  per N cells) so painting sounds like a tune, not a rattle.
- **Saving.** Debounced write of the whole state to `blockTownSheetsV1` after every stroke;
  `blockTownSoundV1` for sound; language via the shared switcher (`kidGamesLanguageV1`).

## Stages

Each stage lists its goal and its check. Do not start a stage before the previous check passes.

### Stage 0 — Skeleton and registration

Create `index.html` (topbar with language picker, sound, pause; empty canvas area; palette strip),
`styles.css` shell, `game.js` with an empty model + `initializeGame`, `translations.json`,
`README.md` stub. Register the game everywhere the repository expects it:

- root `index.html`: a shelf card (`data-game="block-town"`, emoji 🏘️, tag `SANDBOX`);
- root `shelf.js`: `"block-town": ["blockTownSheetsV1"]` in `PROGRESS_KEYS`;
- root `README.md`: the game lists and the storage-key table.

**Check:** `python3 server.py` → the card opens `/block-town/`, the page shows the empty shell, the
language picker flips the labels, no console errors.

### Stage 1 — Model core and tests

Implement `BLOCKS`, `SHEETS`, state creation, `paintCell`, `paintStroke`, `floodFill`, progress
and unlock functions, `normalizeSavedState`, the underlay/bridge rule. Write `test-game.js`
covering: painting and paint-over, out-of-range refusal, completion detection, the unlock ladder
(sheet N+1 refuses to unlock while sheet N has holes), flood fill on regions and on the empty
area, bridge over water and back, normalization of garbage saves (wrong length, unknown ids,
blocks from locked sheets).

**Check:** `node block-town/test-game.js` passes; no DOM references above the `module.exports`
line.

### Stage 2 — Sheet 1 painting

Render the 5x10 grid, the palette with the four sheet-1 blocks (meadow, road, forest, water),
tap-to-paint with incremental cell updates, the progress sun, autosave and restore, the pause with
"new sheet" confirmation. Flat single-color block art is enough at this stage.

**Check:** manual run — paint, reload the page, the painting is back; fill all 50 cells, the sun
is full; "new sheet" asks before clearing; `node` test still green.

### Stage 3 — Strokes and sound

Pointer-capture stroke painting, per-family sounds with stroke throttling, the shimmer on
unpainted cells, `prefers-reduced-motion` wiring (shimmer becomes a static dotted outline).

**Check:** a continuous finger/mouse drag paints every crossed cell with no gaps at normal speed;
sound off keeps the game fully playable; with reduced motion nothing travels or pulses.

### Stage 4 — Smart blocks

Autotile CSS for roads (straight, turn, T, crossing, end), water shores, forest density, the
automatic bridge. The UI asks the model for the tile variant of the repainted cell and its four
neighbors only.

**Check:** Node tests for `neighborMask`, `roadTile`, `waterEdges`, `forestDensity` on hand-built
grids (lone cell, line, corner, cross, bridge). Manual: drawing a road loop produces closed
corners; a road across a lake shows a bridge; painting water over the bridge restores water.

### Stage 5 — The living world, first pass

Analysis functions (`roadPaths`, `lakes`, `forestClusters`) in the model with Node tests. Overlay
layer with the car (drives a road component, keeps circling a loop), the duck (lake ≥ 4), birds
(forest cluster ≥ 6). Debounced re-analysis after a stroke ends; sprites honor reduced motion.

**Check:** Node tests on crafted grids (a loop road → cycle detected, two lakes of sizes 3 and 5 →
only one duck). Manual: erase a piece of road mid-drive — the car settles onto the remaining
component without errors.

### Stage 6 — Completion, celebration, sheet shelf

Full-sheet celebration (sunset tint, windows and lanterns light, gentle confetti — respecting
reduced motion), unlock of the next sheet, the sheet shelf with live canvas thumbnails, switching
sheets, per-sheet persistence. Celebration fires once per fresh completion (`celebrated` flag,
cleared by "new sheet").

**Check:** fill sheet 1 → celebration plays once, sheet 2 appears on the shelf; repainting a cell
and completing again does not replay the full celebration; reload keeps both sheets' paintings.

### Stage 7 — Sheets 2 and 3

New blocks: house (door turns toward an adjacent road — an autotile variant), field with timed
growth stages, flowers, sand; the road family submenu (path/asphalt) and the wide 2x2 brush.
Palette grouping UI: a family button opens its kinds row; positions of familiar buttons do not
move.

**Check:** Node tests for house orientation and field stage progression (time injected, not
`Date.now` in the model). Manual: sheet 2 palette shows exactly the design's set; the wide brush
paints 2x2 and clips at the edges.

### Stage 8 — Sheets 4 and 5

Rails and the train, tower, farm, mountain, windmill (turns near a field), lighthouse (blinks near
water), castle, playground, decorations; the fill bucket; zoom (two buttons, CSS
`--cell-size` switch), panning (native scroll of the sheet container + big edge arrows), the
mini-map with bright unpainted dots and tap-to-jump.

**Check:** Node tests for rail paths and the bucket on large regions. Manual on a tablet-sized
window: sheets 4–5 open zoomed to comfortable cells, the mini-map matches the sheet and jumps
correctly, filling the last cells via the mini-map is findable without help.

### Stage 9 — Accessibility, language, polish

Keyboard path (arrows/WASD cursor, `Space` paints, `Enter` into the palette, `Escape` pause),
`aria` roles and labels for the grid and the palette, status announcements via a live region,
full `translations.json` pass (English and Russian), a final `prefers-reduced-motion` audit of
every animation including JS timers, font-size rules for adult-facing text.

**Check:** the whole loop — paint, switch blocks, complete a sheet, move to the next — works with
the keyboard only and reads sensibly with a screen reader; both languages show no raw keys.

### Stage 10 — Final verification

- `node block-town/test-game.js` green.
- The design-check list from [GAME_DESIGN.md](GAME_DESIGN.md#testing-with-a-child) walked through
  manually.
- Performance sanity on sheet 5: a fast stroke across 24x48 stays smooth (no full-grid re-renders
  in the profiler), the saved state stays under a few kilobytes.
- README.md finished (run instructions, sheets table, controls, storage keys).

## Decisions already made (do not re-open during implementation)

- DOM + CSS art, no image files, no `<canvas>` for the world itself (canvas only for the
  mini-map/thumbnails), matching the rest of the repository.
- Incremental cell updates; a full-rebuild-on-render pattern does not scale to 1152 cells.
- No undo stack and no eraser anywhere — paint-over is the only correction, "new sheet" is the only
  reset and always confirms.
- One shared model/UI file `game.js` with `module.exports`, mirroring the other games, so the Node
  test needs no bundler.
- Sheet sizes and palettes are data in `SHEETS`/`BLOCKS`; risk mitigations in the design (shrinking
  the top sheets, cutting kinds) must stay data-only changes.

## Open questions for the implementation session

- Exact color/pattern set per block — decide in CSS while eyeballing contrast; families must differ
  by pattern and silhouette, not color alone.
- Sound vocabulary per family — pick frequencies while listening, keep the volume at the quiet
  levels the other games use.
- Whether sheet 5 needs a second zoom step — decide on a real tablet after Stage 8.
