# Cube Island

A gentle block-building campaign for children around age six. The player completes 25 useful
construction projects across a river, snowfields, a canyon, and a night island. Tasks grow from one
guided wooden bridge to a three-part island town built with wood, stone, glass, and glow cubes.

## Running

Start the shared server from the repository root:

```bash
python3 server.py
```

Open `http://127.0.0.1:4173/cube-island/`. A local server is required because the shared language
system loads `translations.json` through `fetch`.

## Campaign

| Chapter | Levels | Location | Main ideas |
| --- | --- | --- | --- |
| 1 | 1–5 | River | Wood, blueprints, exact budgets, alternate routes, ordered tasks |
| 2 | 6–10 | Snow | Stone support, glass, dependencies, symmetry, safe passages |
| 3 | 11–15 | Canyon | Protected space, stacks, bridge supports, guard edges, wide roads |
| 4 | 16–20 | Night Island | Glow cubes, light coverage, protection, line of sight, three layers |
| 5 | 21–25 | Night Island Town | Networks, accessibility, material zones, shared multi-task budgets |

Fields grow from 7 × 3 to 12 × 8 cells. A level has one to three ordered real-world tasks. Wrong
placements never consume a block, and the top block of any unfinished stack can be returned to the
hotbar.

## Materials

- Wood is walkable and can cross configured short spans.
- Stone is a strong support and normally needs solid ground or stone below it.
- Glass transmits light and forms windows, walls, and guard edges.
- Glow cubes emit deterministic light and may need support or glass protection.

The four hotbar slots always stay in the same order. Texture, outline, count, and state distinguish
materials without relying on color alone.

## Controls

- Select a material, select a large world cell, and press the contextual action button.
- Select a built stack to return its top block.
- Use the hint button to reveal one next useful cell or action.
- Use arrow keys or `WASD` to move the world cursor, `Enter` to select, and `Space` to act.
- Use number keys `1`–`4` to select a material and `Escape` to pause or resume.

Mouse, touch, and keyboard use the same model. No camera movement, dragging, timer, defeat state, or
resource loss is required.

## Testing

```bash
node cube-island/test-game.js
```

The test validates all 25 level definitions and known solutions, placement refusals, material
support, stack removal, objective dependencies, an alternate functional route, deterministic light,
save normalization, migration, and the complete campaign sequence.

## Saving

- `cubeIslandCampaignV2` stores versioned campaign progress, cell stacks, inventory, and objectives.
- `cubeIslandLevelsV1` is read once only when V2 is absent, then converted to an equivalent unlock.
- `cubeIslandSoundV1` stores the sound choice.
- `kidGamesLanguageV1` stores the shared English or Russian language choice.

Malformed or impossible V2 data is normalized against the current level definition. Campaign reset
does not change the shared sound or language preferences.

## Files

- `index.html` contains the accessible game shell and controls.
- `styles.css` draws all locations, terrain, materials, stacks, feedback, and responsive states.
- `level-data.js` contains registries and all 25 declarative levels.
- `game.js` contains pure rules, validators, saving, rendering, input, hints, and sound.
- `translations.json` contains English and Russian UI and accessible labels.
- `test-game.js` validates the model and campaign in Node.js.
- `redisign.md` is the detailed implementation plan.
- `GAME_DESIGN.md` records the final product rules and interaction design.
