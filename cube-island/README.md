# Cube Island

A gentle building game for a child of about six. Five short levels in a row: the river shows bright
empty spots, the player puts plank blocks into them and a bridge, a dock, a raft, river steps and a
river base appear one after another. Nothing can be lost and a wrongly placed block can always be
taken back.

## Running

A single server started from the root of the repository serves every game:

```bash
python3 server.py
```

Then open `http://127.0.0.1:4173/cube-island/`. A local server is required: the game loads
`translations.json` through `fetch`, which does not work over `file://`.

## The levels

| Level | Goal | Blocks |
| --- | --- | --- |
| 1 | Build a bridge | 3 |
| 2 | Build a dock | 4 |
| 3 | Build a raft | 4 |
| 4 | Build river steps | 3 |
| 5 | Build a river base | 5 |

The friend on the far bank appears on the levels where the build makes a crossing — the bridge and
the river steps. The trees on the left bank are scenery: they are not mined and are not part of the
loop.

## Controls

- Pick a bright spot in the river and press the big action button to place a block.
- A block that has already been placed can be picked again and taken back, without losing progress.
- The light-bulb button shows only the next useful step.
- The arrow keys or `WASD` move the selection frame, `Enter` picks a cell, `Space` performs the action.
- `Escape` opens and closes the pause.

The path through the game needs no reading. All visible game commands are carried by pictures, shape,
position and motion.

## Logic check

```bash
node cube-island/test-game.js
```

The test checks the five level blueprints, placing and taking a block back, refusing a cell outside
the blueprint and a repeated block in the same cell, walking through all five levels in order, and
restoring a save with duplicated or foreign cells in it.

## Saving

- `cubeIslandLevelsV1` holds the current level and the blocks placed in it.
- `cubeIslandSoundV1` holds the sound choice.
- `kidGamesLanguageV1` holds the shared English or Russian interface choice used by every localized game.

## Files

- `index.html` holds the accessible structure of the scene and the buttons.
- `styles.css` draws the world, the blocks and the characters without external images.
- `game.js` holds the pure rules, the interface, the hints, the sound and the saving.
- `translations.json` holds the English and Russian interface text.
- `test-game.js` checks the game model in Node.js.
- `GAME_DESIGN.md` describes the agreed design of the adaptation.
- `ORIGINAL_GAME.md` describes the mechanics of the original Minecraft.

The sound is played through the shared `../shared/game-sound.js`, and the interface language through
the shared `../shared/game-language.js`.
