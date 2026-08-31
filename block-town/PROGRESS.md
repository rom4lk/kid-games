# Implementation progress: Block Town

Tracks the stages of [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). A stage is ticked only after
its check passes and the work is committed.

| Stage | What it covers | Done |
| --- | --- | --- |
| 0 | Skeleton and registration | [x] |
| 1 | Model core and tests | [x] |
| 2 | Sheet 1 painting | [x] |
| 3 | Strokes and sound | [ ] |
| 4 | Smart blocks | [ ] |
| 5 | The living world, first pass | [ ] |
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
- Browser checks in this environment are run against a plain static server started on port 4183
  (`python3 -m http.server`), because the repository server on 4173 serves the main checkout rather
  than this worktree.
