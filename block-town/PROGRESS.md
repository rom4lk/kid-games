# Implementation progress: Block Town

Tracks the stages of [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). A stage is ticked only after
its check passes and the work is committed.

| Stage | What it covers | Done |
| --- | --- | --- |
| 0 | Skeleton and registration | [x] |
| 1 | Model core and tests | [x] |
| 2 | Sheet 1 painting | [x] |
| 3 | Strokes and sound | [x] |
| 4 | Smart blocks | [x] |
| 5 | The living world, first pass | [x] |
| 6 | Completion, celebration, sheet shelf | [x] |
| 7 | Sheets 2 and 3 | [x] |
| 8 | Sheets 4 and 5 | [x] |
| 9 | Accessibility, language, polish | [x] |
| 10 | Final verification | [ ] |

## Notes

- Stage 0: the shell renders, the language picker flips every label, the pause opens and confirms,
  and the shelf card opens `/block-town/`. No console errors.
- Stage 1: the block and sheet registries, painting, flood fill, progress, the unlock ladder, the
  bridge underlay and save normalization live in `game.js` above `module.exports`; `test-game.js`
  covers them and is green.
- Stage 2: sheet 1 paints cell by cell with incremental updates, the palette holds the four sheet-1
  blocks, the sun fills to 100% on the last cell, the painting survives a reload, and "new sheet"
  asks before it clears.
- Stage 3: a captured pointer paints an unbroken line (`lineIndices` fills the cells between two
  pointer reports), each family has its own note throttled to one per three cells, and the shimmer
  of the unpainted cells is one animated custom property that reduced motion swaps for a dashed
  frame.
- Stage 4: `neighborMask`, `roadTile`, `waterEdges` and `forestDensity` decide the variant, and the
  UI only rewrites the class list of the painted cell and its four neighbours. A road loop closes its
  corners, a road across a lake becomes a plank bridge, and water painted back over a bridge is
  plain water again.
- Stage 5: `connectedComponents`, `roadPaths`, `lakes` and `forestClusters` feed one overlay of
  sprites driven by a single animation frame loop. A car takes a road of three cells or more, a duck
  a lake of four, birds a wood of six. Breaking a road mid-drive moves the car onto what is left
  without an error.
- Stage 6: a finished sheet keeps its evening light, the confetti and the card come once per fresh
  completion (`celebrated`), the next sheet unlocks, and the pause holds a shelf of live canvas
  thumbnails. Both sheets keep their paintings across a reload. House and field art was added here
  as well, so the newly reachable sheet 2 has no invisible blocks.
- Stage 7: houses turn their door toward the street, fields go from soil to shoots to ears on an
  injected clock, flowers, sand and asphalt joined the palette, and from sheet 3 the palette groups
  its blocks by family with a kinds row. The wide brush paints 2x2 and clips at the edges. The fill
  bucket was wired here too, since sheets 4 and 5 already list it as a tool.
- Stage 8: rails with a train, the remaining buildings and decorations, a boat on a big lake, a
  windmill that turns beside a field and a lighthouse that blinks beside water. Big sheets open at a
  comfortable 40px cell, scroll, and carry zoom buttons, edge arrows and a mini-map whose bright
  spots are the cells still waiting. Tapping the mini-map jumps there.
- Stage 9: the whole loop runs from the keyboard — arrows or WASD move a frame the grid points at
  through `aria-activedescendant`, Space paints, Enter walks into the palette and back, Escape
  opens the pause. Choosing a block, a tool or a sheet is announced in the live region. Every
  animation was walked through: only the lighthouse light keeps breathing under reduced motion,
  because it is opacity alone. All 59 visible strings have a Russian pair.
- Browser checks in this environment are run against a plain static server started on port 4183
  (`python3 -m http.server`), because the repository server on 4173 serves the main checkout rather
  than this worktree.
- The Browser pane in this session is never displayed, so `document.hidden` stays true and
  `requestAnimationFrame` is paused. Sprite motion was checked by shimming `requestAnimationFrame`
  with timers inside the page; nothing in the game was changed for it. For the same reason
  `scrollBy({ behavior: "smooth" })` does not move in this pane; the edge arrows were checked by
  reading the values they pass to it.
