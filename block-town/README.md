# Block Town

A calm sandbox for a child of about six. The screen is an empty sheet of squared paper. The child
picks a block in the palette and paints the world — roads, woods, water, houses — and the world
answers every stroke. There are no tasks and no wrong moves; the only goal is to fill the sheet.

The full design is in [GAME_DESIGN.md](GAME_DESIGN.md), and the build order in
[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). The current state of the work is tracked in
[PROGRESS.md](PROGRESS.md).

## Running

A single server started from the root of the repository serves every game:

```bash
python3 server.py
```

Then open `http://127.0.0.1:4173/block-town/`. A local server is required: the game loads
`translations.json` through `fetch`, which does not work over `file://`.

## Saving

- `blockTownSheetsV1` holds every sheet's painting and which sheets are unlocked.
- `blockTownSoundV1` holds the sound choice.
- `kidGamesLanguageV1` holds the shared English or Russian interface choice used by every localized game.

## Files

- `index.html` holds the accessible structure of the sheet, the palette and the pause.
- `styles.css` draws the blocks and the world without external images.
- `game.js` holds the pure model and the interface on top of it.
- `translations.json` holds the English and Russian interface text.
