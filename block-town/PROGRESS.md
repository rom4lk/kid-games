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
| 6 | Completion, celebration, sheet shelf | [ ] |
| 7 | Sheets 2 and 3 | [ ] |
| 8 | Sheets 4 and 5 | [ ] |
| 9 | Accessibility, language, polish | [ ] |
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
- Browser checks in this environment are run against a plain static server started on port 4183
  (`python3 -m http.server`), because the repository server on 4173 serves the main checkout rather
  than this worktree.
- The Browser pane in this session is never displayed, so `document.hidden` stays true and
  `requestAnimationFrame` is paused. Sprite motion was checked by shimming `requestAnimationFrame`
  with timers inside the page; nothing in the game was changed for it.
