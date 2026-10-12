# Instructions for agents

Before changing the design, the interface or a game mechanic, read and follow the mandatory shared
rules in [GAME_DESIGN.md](GAME_DESIGN.md).

## Documentation language

All Markdown files in this repository are written in English. New documents and edits to existing
ones must stay in English, including headings, tables and code comments inside examples.

This applies to documentation only. In-game text stays in the language chosen for each game: some
games are in Russian, some in English — see the [Language](GAME_DESIGN.md#language) section.

## Commit your changes

Commit your own changes without being asked. This repository opts out of the default of committing
only when the user asks.

- Commit once a change is complete and verified: the `test-game.js` of every game you touched and,
  for word content, `word-quest/tools/validate.py` pass (see [Content checks](README.md#content-checks)).
  A larger task may take several commits, one per logical step.
- Commit on the current branch, `main` included; do not create a branch just to commit. The
  `implement` skill and Archon runs keep their own branch rules.
- Stage only the files you changed, by path; never `git add -A` or `git commit -a`. Other sessions
  share this checkout: if the index already holds changes you did not make, commit yours with
  `git commit --only -- <paths>` and leave theirs staged.
- Messages follow the `git-commit-message` skill.
- Never commit with failing checks. Leave the work uncommitted and say why.
- Do not push, amend, rebase or merge unless asked.
- List the commits you made in your report.
