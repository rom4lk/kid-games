# Cube Island: 25-Level Campaign Implementation Plan

This document describes how to turn the current five-blueprint prototype into a 25-level building
campaign with growing fields, four materials, four location themes, functional construction rules,
and one to three real-world tasks per level.

The mandatory shared rules in [../GAME_DESIGN.md](../GAME_DESIGN.md) and the game-specific direction
in [GAME_DESIGN.md](GAME_DESIGN.md) apply to every stage.

## 1. Outcome

The finished game must provide:

- 25 sequential levels grouped into five chapters;
- river, snow, canyon, and night-island locations;
- wood, stone, glass, and glow blocks with different rules;
- fields growing from 7 × 3 to 12 × 8 cells;
- stacks up to three blocks high where a level needs height;
- one, two, or three real-world construction tasks per level;
- one newly introduced complication on every level;
- functional validation where the task permits several correct solutions;
- safe correction: every placed block can be returned before completion;
- persistent progress and migration from the existing five-level save;
- English and Russian UI;
- full mouse, touch, and keyboard play;
- no timers, defeat states, resource loss, combat, or irreversible mistakes.

The campaign replaces the current five-level sequence. Mining, crafting, random maps, combat,
multiplayer, and a free-build mode are not part of this implementation. They can be reconsidered
after the 25-level campaign is tested with children.

## 2. Current baseline

The existing implementation already has:

- a 7 × 3 DOM grid;
- five fixed blueprints;
- one wood-plank block type;
- exact inventory counts;
- cell selection followed by one contextual action button;
- placement, removal, hints, pause, sound, language switching, and saving;
- a completion dialog and next-level flow;
- pure game rules exported from game.js for Node tests.

The current model assumes:

- every buildable cell is water;
- every placed block has the same material;
- a cell contains zero or one block;
- completion means that every prepared target cell is filled;
- every level has one task;
- the entire grid is rebuilt after most actions.

Those assumptions must be replaced before adding the campaign content.

## 3. Product rules that must not change

1. The screen shows one clear current action.
2. A level may contain up to three tasks, but only one task is visually dominant at a time.
3. A new mechanic is introduced through one safe example before it is required in a puzzle.
4. Wrong placement never spends a block.
5. A hint identifies only the next useful block or cell.
6. Meaning is never carried by color alone.
7. Every task has a visible real-world result.
8. Several valid constructions are accepted whenever the task is functional rather than pictorial.
9. The child never has to rotate a camera, drag a block, or aim at a small face.
10. Main child-facing text remains at least 20 px and uses short familiar words.

## 4. Target file layout

| File | Responsibility |
| --- | --- |
| index.html | Accessible shell, goal cards, world grid, material hotbar, action button, dialogs |
| styles.css | Location themes, terrain, blocks, stacks, characters, props, feedback, responsive layout |
| level-data.js | Block registry, terrain registry, location themes, and all 25 declarative level definitions |
| game.js | Pure model, placement rules, objective validators, saving, rendering, input, hints, sound |
| test-game.js | Model tests, validator tests, save migration tests, and all-level data validation |
| translations.json | English and Russian visible text and accessible labels |
| README.md | Campaign, controls, storage keys, run instructions, test command |
| GAME_DESIGN.md | Final agreed design after the implementation stabilizes |

level-data.js must work in both the browser and Node without a bundler. In the browser it exposes
one frozen CubeIslandData object. In Node it exports the same object through module.exports.

Do not split the model into additional files until the objective engine becomes difficult to review.
The initial goal is a small data file plus one model/UI file, matching repository conventions.

## 5. Core data model

### 5.1 Block registry

Define four block types in a single registry.

| ID | Visual identity | Placement rule | Functional property |
| --- | --- | --- | --- |
| wood | Horizontal grain, plank seams, warm top face | Land, support, or a short supported span | Walkable, partly transmits light |
| stone | Speckles, heavy bevel, cracked side face | Solid terrain or another stone block | Strong support, blocks light |
| glass | Hollow frame, diagonal shine, visible background | A solid block or marked frame below | Guard rail or wall, transmits light |
| glow | Bright diamond core and four corner marks | Solid support; some tasks require glass protection | Emits light with a configured radius |

The registry should contain only stable properties:

- id;
- translation key;
- icon class;
- maximum stack height;
- whether the block is walkable;
- whether it supports blocks above;
- whether it transmits or blocks light;
- default light radius;
- sound pattern id.

Level-specific exceptions belong in the level definition, not in the block registry.

### 5.2 Terrain registry

Use a small terrain set:

- grass;
- water;
- bank;
- snow;
- thin-ice;
- rock;
- canyon-floor;
- gap;
- night-grass;
- road-start;
- road-end;
- protected;
- blocked.

Terrain determines the background and the default support rule. Task-specific meanings such as
"school entrance" or "well clearance" should use landmark metadata instead of new terrain ids.

### 5.3 Grid representation

Represent the field as a flat array of cells. Each cell contains:

- terrainId;
- stack, an array of zero to three block ids from bottom to top;
- optional landmarkId;
- optional locked flag for scenery that cannot be changed.

Flat arrays keep saving and testing simple:

    index = row * columns + column

Provide pure helpers:

- cellIndex(row, column, columns);
- cellPosition(index, columns);
- getCell(levelState, row, column);
- topBlock(cell);
- stackHeight(cell);
- orthogonalNeighbors(index, rows, columns);
- allNeighbors(index, rows, columns).

### 5.4 Level definition

Every level definition must contain:

    id
    chapter
    order
    location
    titleKey
    storyKey
    rows
    columns
    maxHeight
    terrain
    landmarks
    initialBlocks
    inventory
    availableMaterials
    guidance
    objectives
    reward
    complicationKey

terrain is an array of short strings using a documented character legend. A data-normalization step
converts it to cells. This keeps maps readable in code review.

guidance controls how much help is visible:

- fieldTargets: "all" for the tutorial;
- fieldTargets: "next" for one next target;
- fieldTargets: "none" for functional tasks;
- blueprint: "full", "partial", or "none";
- autoHintDelay;
- examplePlacement, optional for the first use of a mechanic.

### 5.5 Objective definition

Each level contains one to three ordered objectives:

    id
    titleKey
    icon
    validator
    params
    dependsOn
    completionEffect

The UI shows all objective icons, but only the first incomplete objective is active. Later objectives
use a lock icon until their dependencies are complete.

Do not add custom JavaScript functions inside level data. Objectives refer to validator ids and
serializable parameters.

### 5.6 Campaign state

Use a versioned state:

    version
    currentLevelIndex
    completedLevelIds
    currentLevelState
    selectedMaterialId
    selectedCell
    selectedHeight
    phase
    celebratedLevelIds

currentLevelState contains:

- normalized cell stacks;
- current inventory counts;
- completed objective ids;
- current active objective id.

Sound and language remain in their existing shared keys.

## 6. Placement engine

Create one pure placement function:

    evaluatePlacement(state, level, blockId, cellIndex)

It returns a result without mutating state:

    allowed
    reason
    targetHeight
    consumedBlock
    changedCells

Possible refusal reasons:

- not-buildable;
- needs-solid-ground;
- needs-stone-support;
- needs-any-support;
- stack-full;
- wrong-material;
- must-stay-clear;
- objective-locked;
- needs-glass-protection;
- span-too-long.

The UI maps each reason to:

- a static pictogram;
- a short accessible label;
- a gentle sound;
- a temporary ghost block showing the correct height or material.

Only after an allowed result should placeBlock mutate state and decrement inventory.

removeBlock removes only the top block. It restores the exact material to inventory and re-evaluates
all objectives. Completed levels remain frozen after the completion dialog opens.

### 6.1 Wood span rule

Wood may extend from a support over water or a gap. A level parameter defines the maximum unsupported
run:

- first river levels: effectively unlimited inside marked tutorial cells;
- canyon levels: one unsupported cell between stone supports;
- final levels: configurable per route.

The validator checks the connected wood component and the distance to a supporting bank or stone
column.

### 6.2 Stone support rule

Stone can be placed on solid terrain or another stone block. It cannot be placed directly on water,
thin ice, or a gap unless the level marks a foundation anchor.

### 6.3 Glass rule

Glass requires a solid block or a marked frame below. Guard-rail objectives may allow glass beside
a platform at the same height through a level option.

### 6.4 Glow rule

A glow block requires support. Some objectives additionally require:

- glass on four sides;
- direct line of sight to water;
- placement at the top of a structure;
- a minimum or maximum number of lights.

## 7. Objective validator library

Implement reusable pure validators. Every validator returns:

    complete
    progress
    missingCells
    problemCells
    nextSuggestion

Required validators:

| Validator | Purpose |
| --- | --- |
| fill-targets | Tutorial blueprints and exact material patterns |
| match-shape | Shape matching with optional translation, reflection, or rotation |
| connected-route | Any walkable route between named landmarks |
| route-width | A connected route with a minimum width |
| supported-span | A bridge deck with valid support distances |
| foundation | Required footprint made from a specific material |
| stack-pattern | A multi-layer structure with material rules per layer |
| enclosure | Walls around a protected area with allowed door gaps |
| guard-edges | Glass along every exposed platform edge |
| keep-clear | Protected cells and access corridors remain empty |
| symmetry | Mirrored structure around a configured axis |
| light-coverage | Required cells are inside light radius |
| line-of-sight | Light reaches a landmark without opaque blocks |
| protected-light | Glow block is enclosed by the requested glass pattern |
| material-zone | Exposed or risk-marked cells use the required material |
| shared-budget | All tasks fit within the provided combined inventory |

Composite objectives combine validators through data:

- all: every child rule must pass;
- any: at least one child rule must pass;
- count: a configured number of child rules must pass.

This avoids a special completion function for every level.

## 8. Light simulation

Use a small deterministic breadth-first search from every glow block.

Rules:

- default radius is configured per level;
- glass transmits the full remaining range;
- empty cells transmit light;
- wood reduces remaining range by one extra step;
- stone stops propagation;
- terrain does not affect light unless the level explicitly says so.

Return an integer light value per cell. Rendering maps it to three static states:

- dark;
- dim;
- lit.

The completion rule reads the same light map. Animation is decorative only and never carries required
information.

The largest field has 96 cells, so a full light recomputation after a placement is inexpensive.

## 9. Large-field rendering

The largest planned field is 12 × 8. Keep the full map visible rather than adding camera movement.

Use CSS variables:

- --columns;
- --rows;
- --cell-size;
- --stack-offset;
- --block-depth.

Cell size tiers:

| Largest dimension | Target cell size |
| --- | --- |
| Up to 7 | 76–90 px |
| 8–9 | 66–76 px |
| 10 | 58–68 px |
| 11–12 | 52–62 px |

On a tablet, the game may use landscape layout with the goal panel on the left and hotbar below.
Do not require pinch zoom or panning.

Build the DOM grid once when a level starts. After placement, update:

- the selected cell;
- changed stack faces;
- affected neighbors;
- objective markers;
- light-state classes.

Do not rebuild all 96 cells after every action. A full rebuild is allowed on level change, language
change, restart, and save restore.

### 9.1 Stack interaction

The entire cell remains the input target. The player never has to tap a narrow block face.

When the active task needs height:

- the cell shows a large upward arrow;
- selecting the cell previews the next block above the stack;
- the contextual button says "Place up";
- removal always takes the top block.

## 10. UI changes

### 10.1 Goal panel

Replace the current single goal copy with:

- chapter and level number;
- location icon;
- one large current instruction;
- one to three objective cards;
- compact blueprint or functional diagram;
- progress such as "2 of 4".

Only the active objective has full contrast. Completed objectives show a checkmark. Locked objectives
show a lock shape and no detailed instruction.

### 10.2 Material hotbar

Show up to four stable material slots:

    Wood | Stone | Glass | Glow

Familiar slots never move between levels. Unavailable materials remain visible but closed until their
introduction, then remain in the same position.

Each slot needs:

- material texture;
- distinct outline shape;
- count of remaining blocks;
- selected frame;
- keyboard shortcut;
- accessible name.

### 10.3 Contextual action

Keep one large action button. Its icon and label can be:

- Place;
- Place up;
- Take;
- Check;
- Next.

Selection follows:

1. choose a material;
2. choose a large world cell;
3. press the action button.

The tutorial may preselect wood. Later levels remember the last useful material but never select a
locked or empty slot.

### 10.4 Task results

Each objective changes the world:

- a character crosses;
- a boat docks;
- a building lights up;
- a wind screen calms the campsite;
- a cart reaches the depot;
- plants become visible;
- a lighthouse beam appears;
- town characters start using the completed network.

These results need a static completed state in addition to motion and sound.

## 11. Visual system

### 11.1 Locations

| Location | Palette and terrain | Calm decorative layer | Completion reward |
| --- | --- | --- | --- |
| River | Green grass, blue water, light wood banks | Clouds and water bands | Boats and animals move safely |
| Snow | White ground, blue shadows, frosted blocks | Square snowflakes | Warm windows and cleared paths |
| Canyon | Orange rock, deep blue-gray gaps, dusty stone | Slow dust squares | Cart, lift, or signal starts |
| Night island | Indigo sky, dark teal grass, star points | Fireflies and water shine | Light spreads across the island |

All decorative loops stop under reduced motion.

### 11.2 Material distinction

Materials must be recognizable in grayscale:

- wood: horizontal stripes and seams;
- stone: irregular square speckles and a heavy lower face;
- glass: empty center, bright diagonal edge, thin frame;
- glow: diamond center, four corner marks, outer halo.

### 11.3 Error language

Use persistent shapes during the refusal:

- support icon under a floating block;
- stone icon below glass that needs a base;
- open-door icon on a cell that must stay empty;
- blocked-ray icon when stone stops light;
- double-line icon when a road must be two cells wide.

Do not rely on a shake alone.

## 12. The 25-level data plan

Field size is listed as columns × rows.

### Chapter 1 — River

| Level | Size | Materials | Objectives | New complication | Main validators |
| --- | --- | --- | --- | --- | --- |
| 1. Bunny Bridge | 7 × 3 | Wood | Build one bridge | Full field targets; safe first placement | fill-targets |
| 2. Fishing Dock | 7 × 4 | Wood | Build one dock | Blueprint only; no field targets | match-shape |
| 3. Supply Raft | 8 × 4 | Wood | Build one raft | Exact inventory with no spare block | match-shape, shared-budget |
| 4. Mill Path | 8 × 5 | Wood | Connect bank to mill | Several correct routes | connected-route |
| 5. Flood Repair | 9 × 5 | Wood | Repair bridge; add boat platform | Existing blocks and two ordered tasks | connected-route, fill-targets |

Implementation notes:

- Level 1 preselects wood and marks all three cells.
- Level 2 teaches reading the compact blueprint.
- Level 3 teaches inventory count without punishment.
- Level 4 is the first functional validator and must accept every connected walkable path.
- Level 5 introduces objective cards and preserves the repaired blocks between tasks.

### Chapter 2 — Snow

| Level | Size | Materials | Objectives | New complication | Main validators |
| --- | --- | --- | --- | --- | --- |
| 6. Ice Path | 8 × 5 | Stone | Build a safe path | Stone requires solid foundation | connected-route, placement support |
| 7. Wind Screen | 8 × 5 | Stone, glass | Build one wind screen | Select between two materials | foundation, fill-targets |
| 8. Snow House | 9 × 6 | Stone, glass | Build base; add window | Task dependency | foundation, fill-targets |
| 9. Greenhouse | 9 × 6 | Stone, glass | Build base; add walls; leave entrance | Partial blueprint and symmetry | foundation, symmetry, keep-clear |
| 10. Snow Safety | 10 × 6 | Stone | Build snow wall; build safe passage | Neighboring height may differ by at most one | material-zone, connected-route |

Implementation notes:

- Level 6 introduces stone with one marked solid cell and one refused thin-ice example.
- Level 7 introduces the stable four-slot hotbar.
- Level 8 introduces sequential tasks without showing the second instruction too early.
- Level 9 shows half a structure in the blueprint and a clear mirror-axis marker.
- Level 10 introduces height two and uses large step markers.

### Chapter 3 — Canyon

| Level | Size | Materials | Objectives | New complication | Main validators |
| --- | --- | --- | --- | --- | --- |
| 11. Well Yard | 9 × 6 | Stone | Build a service platform | Well and access lane must remain clear | fill-targets, keep-clear |
| 12. High Bridge | 10 × 6 | Stone, wood | Build supports; add deck | Wood span requires stone below | supported-span, connected-route |
| 13. Lookout | 10 × 7 | Stone, glass | Build platform; guard edges | Every exposed edge needs glass | foundation, guard-edges |
| 14. Mine Road | 10 × 7 | Stone | Repair road; connect depot | Walkable route must be two cells wide | route-width, connected-route |
| 15. Rescue Station | 11 × 7 | Stone, wood, glass | Build bridge; shelter; cargo pad | One exact budget across three tasks | Composite validators, shared-budget |

Implementation notes:

- Level 11 introduces protected world space rather than a new material.
- Level 12 introduces stacks and support columns.
- Level 13 teaches safety edges with visible warning marks.
- Level 14 accepts different routes but enforces width.
- Level 15 is the first three-task level; the task bar must remain compact and clear.

### Chapter 4 — Night Island

| Level | Size | Materials | Objectives | New complication | Main validators |
| --- | --- | --- | --- | --- | --- |
| 16. Light Path | 9 × 6 | Glow | Light the route to the house | Light reveals nearby cells | light-coverage |
| 17. Night Stop | 9 × 6 | Stone, glass, glow | Build shelter; protect light | Glow must be inside glass | enclosure, protected-light |
| 18. Harbor Lights | 10 × 7 | Wood, stone, glow | Repair dock; add two signals | Signals need line of sight to water | connected-route, line-of-sight |
| 19. Night Greenhouse | 10 × 7 | Stone, glass, glow | Build greenhouse; light plants | Cover an area with minimum lights | enclosure, light-coverage |
| 20. Lighthouse | 11 × 7 | Stone, glass, glow | Build base; lantern room; top light | Three vertical layers | stack-pattern, protected-light |

Implementation notes:

- Level 16 starts with one demonstrated glow placement.
- Level 17 teaches that glass transmits light.
- Level 18 teaches that stone blocks light.
- Level 19 checks coverage, not a prepared arrangement.
- Level 20 uses a side mini-diagram for the three layers.

### Chapter 5 — Night Island Town

| Level | Size | Materials | Objectives | New complication | Main validators |
| --- | --- | --- | --- | --- | --- |
| 21. School Crossing | 10 × 7 | Stone, wood, glow | Build crossing; light entrances | Accessible route has no steep step | connected-route, light-coverage |
| 22. Clinic Route | 11 × 7 | Stone, glass, glow | Build road; shelter; light | One branching network serves three landmarks | Graph connectivity plus task validators |
| 23. Market Square | 11 × 8 | Stone, glass, glow | Build plaza; stalls; center light | Preserve a clear symmetric center | symmetry, keep-clear, light-coverage |
| 24. Storm Defense | 11 × 8 | Stone, wood, glow | Build sea wall; escape bridge; light route | Exposed zones require stone | material-zone, supported-span, light-coverage |
| 25. Island Town | 12 × 8 | All four | Connect homes; bridge to port; start lighthouse | Plan three dependent systems with one budget | Composite functional validators |

Implementation notes:

- Level 21 combines familiar rules but adds accessible height.
- Level 22 validates a network rather than a single path.
- Level 23 combines symmetry with protected empty space.
- Level 24 uses a visible exposure map and requires strong material only where needed.
- Level 25 accepts multiple solutions and uses every material. It must be divided into three clearly
  announced stages even though the player can inspect the whole map.

## 13. Progression and saving

Use a new storage key:

    cubeIslandCampaignV2

Save after:

- every accepted placement;
- every removal;
- every objective completion;
- every level completion;
- material selection only if it affects restore clarity.

Normalization must:

- clamp level index;
- reject unknown level, terrain, landmark, and material ids;
- reject stacks above the level maximum;
- reject materials not available on that level;
- deduplicate completed level and objective ids;
- recompute objective completion rather than trusting saved booleans;
- restore impossible inventory totals from level data;
- never throw on malformed JSON.

### 13.1 Migration from the current save

Read cubeIslandLevelsV1 only when V2 does not exist.

Suggested mapping:

- old level 1 complete unlocks new level 2;
- old level 2 complete unlocks new level 3;
- old level 3 complete unlocks new level 4;
- old level 4 complete unlocks new level 5;
- old campaign complete unlocks new level 6.

Do not import old placed-cell layouts because the new terrain and rules differ. Show a one-time
adult-facing note that prior progress unlocked the equivalent campaign point.

Write V2 successfully before removing V1. Sound and language keys remain unchanged.

## 14. Implementation stages

Each stage ends with a playable build and a specific check. Do not start the next stage until the
check passes.

### Stage 0 — Baseline capture

Work:

- run current Node tests;
- record the current five-level flow in the browser;
- record desktop and tablet screenshots;
- list current storage behavior and translation keys;
- add no mechanics.

Check:

- current tests pass;
- browser console has no warnings or errors;
- baseline screenshots are available for comparison.

### Stage 1 — Declarative data and V2 state

Work:

- add level-data.js;
- move the current five level definitions into the new schema;
- implement terrain parsing;
- implement new cells and stacks with maximum height one;
- add V2 state creation, normalization, save, and migration;
- keep only wood and the existing exact-blueprint behavior.

Check:

- the first five levels still look and play like the current game;
- save, reload, removal, restart, and next-level flow work;
- V1 migration tests pass;
- no DOM references appear in the pure-model section.

### Stage 2 — Block registry and material hotbar

Work:

- add stone, glass, and glow registry entries;
- replace the plank-only tray with four stable material slots;
- implement selection, counts, empty and locked states;
- add material-specific CSS block art and sounds;
- keep campaign levels 1–5 using only wood.

Check:

- materials are distinguishable without color;
- mouse, touch, and keyboard can select a slot;
- empty and locked slots cannot become selected;
- inventory unit tests pass.

### Stage 3 — Placement support engine

Work:

- implement evaluatePlacement;
- implement stone foundation, glass support, glow support, and wood span rules;
- implement refusal reasons and ghost previews;
- restore material on top-block removal;
- add pure tests for every allowed and refused combination.

Check:

- no refused action changes inventory or grid state;
- every refusal leaves a static explanatory icon;
- removing a block restores the correct material;
- reduced motion does not hide the reason.

### Stage 4 — Objective engine

Work:

- implement objective registry and active-objective selection;
- implement objective cards and dependencies;
- implement the first validator group: fill-targets, match-shape, connected-route, foundation, and
  keep-clear;
- replace hard-coded completion checks.

Check:

- the first five levels are validated through the registry;
- level 4 accepts at least three different correct routes;
- a two-objective fixture unlocks the second task only after the first;
- no level definition contains an inline function.

### Stage 5 — Adaptive fields and incremental rendering

Work:

- support per-level rows and columns;
- support fields up to 12 × 8;
- build the grid once per level;
- update only changed cells and affected neighbors;
- implement cell-size tiers and tablet landscape layout;
- verify input targets remain large.

Check:

- test maps at 7 × 3, 9 × 6, and 12 × 8 fit without panning;
- grid updates do not rebuild all cells after a placement;
- keyboard navigation clips correctly at every edge;
- pointer selection remains accurate after resize.

### Stage 6 — River chapter

Work:

- implement levels 1–5 from final map data;
- add river landmarks, mill, boat, and flood obstacles;
- implement full, blueprint-only, and no-target guidance modes;
- implement shared-budget display for level 3;
- add river completion effects.

Check:

- all five levels can be completed from a fresh state;
- level 4 accepts several paths;
- level 5 restores both tasks after reload;
- a child can complete level 1 after one demonstration.

### Stage 7 — Snow chapter

Work:

- implement levels 6–10;
- add snow, thin ice, frosted stone, and glass visuals;
- implement task dependencies, symmetry, and height-difference checks;
- add partial-blueprint rendering;
- add snow location effects respecting reduced motion.

Check:

- stone refusal on thin ice is clear;
- level 9 accepts any correct mirrored result;
- the greenhouse entrance cannot be accidentally blocked;
- level 10 accepts alternate safe passages.

### Stage 8 — Canyon chapter and height

Work:

- implement height up to three;
- render block stacks with top and side faces;
- add supported-span, guard-edges, and route-width;
- implement levels 11–15;
- add canyon landmarks and completion effects.

Check:

- placing and removing from a stack is unambiguous;
- bridge decks fail only when support rules truly fail;
- level 13 identifies every missing guard edge;
- level 14 accepts multiple two-cell-wide roads;
- level 15 is solvable with the exact shared budget.

### Stage 9 — Light engine and night chapter

Work:

- implement light propagation;
- render dark, dim, and lit cells;
- add light-coverage, line-of-sight, and protected-light;
- implement levels 16–20;
- add static light feedback for reduced motion.

Check:

- light maps have deterministic unit tests;
- glass transmits, wood weakens, and stone blocks;
- level 19 accepts different minimum-light layouts;
- level 20 restores all three layers after reload.

### Stage 10 — Final town chapter

Work:

- implement graph and network validation;
- add material-zone and final composite rules;
- implement levels 21–25;
- add town landmarks and multi-part completion effects;
- implement final campaign celebration and replay.

Check:

- every level has at most three objectives;
- every objective produces a visible world result;
- level 25 has at least two verified correct solutions;
- final completion persists and replay starts at level 1 safely.

### Stage 11 — Language, accessibility, and help

Work:

- add all English and Russian strings;
- simplify visible child instructions;
- add accessible names for materials, terrain, landmarks, tasks, stack height, and refusal reasons;
- finish keyboard behavior;
- audit focus movement through completion and pause dialogs;
- audit every CSS and JavaScript animation for reduced motion;
- tune automatic and manual hints for every level.

Check:

- no untranslated keys appear in either language;
- the campaign is playable with keyboard only;
- the active objective is announced after every transition;
- screen-reader output does not repeat the whole field after one placement;
- no required text is smaller than 20 px.

### Stage 12 — Data validation and complete QA

Work:

- add a level-data validator run from test-game.js;
- run every level through at least one known solution;
- add alternate-solution fixtures for functional levels;
- test desktop and tablet breakpoints;
- test reload during each objective of a three-task level;
- inspect console logs after a full 25-level browser run;
- update README and GAME_DESIGN.

Check:

- Node tests pass;
- all 25 levels load and complete;
- every data-defined level is solvable;
- no level has more than three objectives;
- no level introduces more than one unfamiliar rule without a safe example;
- browser console has no errors or warnings;
- save migration, restart, language change, pause, sound, and reduced motion all pass.

## 15. Automated test plan

### 15.1 Data validation

For every level assert:

- unique id and order;
- known location and materials;
- rows and columns match terrain data;
- field is no larger than 12 × 8;
- maximum stack height is between one and three;
- one to three objectives;
- known validator ids;
- valid landmark references;
- non-negative inventory;
- at least one known solution fixture;
- the fixture completes every objective without exceeding inventory.

### 15.2 Placement tests

Cover:

- wood over land, water, supported gap, and unsupported gap;
- stone on solid terrain, thin ice, water, stone, and wood;
- glass on foundation, without foundation, and as a guard edge;
- glow on support and without support;
- maximum stack height;
- removal from every stack height;
- inventory unchanged after refusal;
- normalization of impossible saved stacks.

### 15.3 Validator tests

Each validator needs:

- one smallest valid example;
- one nearly complete example;
- one false-positive trap;
- one alternate valid solution when freedom is intended;
- a useful nextSuggestion;
- stable results regardless of placement order.

### 15.4 Campaign tests

Cover:

- 25-level order;
- chapter boundaries;
- objective dependencies;
- save and restore on each chapter;
- V1-to-V2 migration;
- final completion;
- replay;
- restart on an unfinished task;
- language and sound keys unaffected by campaign reset.

## 16. Manual and child testing

### 16.1 Internal manual pass

For every level record:

- time to identify the first action;
- number of hints used;
- every refused placement;
- whether the refusal reason was understood without text;
- whether the world result clearly matched the real-world task;
- whether an alternate reasonable construction was accepted.

### 16.2 Child test gates

Test after levels 1–5, 10, 15, 20, and 25 are available.

The next chapter should not be implemented until a child can:

- repeat the main loop after one demonstration;
- select the introduced material without help;
- correct a refused block without becoming stuck;
- understand which of two or three tasks is current;
- complete a functional task without copying a hidden prepared answer.

If the child chooses an unavailable cell three times, waits more than eight seconds, or repeatedly
tries to drag the camera, treat it as an interface failure rather than a player failure.

## 17. Performance limits

- Maximum field: 96 cells.
- Maximum stack: three blocks.
- Maximum rendered block count: 288 plus terrain.
- Maximum objectives: three.
- Maximum materials: four.
- Light recomputation: full field after one placement is acceptable.
- Route and objective analysis: full field after one placement is acceptable.
- DOM rendering: incremental during play, full rebuild only on level transitions.
- Saved state should remain well below 100 KB.

No worker, canvas world renderer, spatial index, or framework is needed at this scale.

## 18. Definition of done

The redesign is complete only when:

1. All 25 levels exist as data and have passing solution fixtures.
2. Every level introduces the documented complication.
3. Every level has one to three real-world tasks.
4. Functional levels accept multiple correct constructions.
5. All four materials have distinct rules and visual identities.
6. All four locations have distinct terrain, feedback, and completion results.
7. The largest field works on a computer and tablet without precise gestures.
8. Refused actions never consume inventory or erase progress.
9. Save migration and malformed-save normalization are tested.
10. Mouse, touch, keyboard, both languages, sound off, pause, and reduced motion work.
11. Node tests pass and a complete browser run has no console errors.
12. The child-testing criteria from [GAME_DESIGN.md](GAME_DESIGN.md#testing-with-a-child) pass.

## 19. Decisions to keep fixed during implementation

- The campaign has exactly 25 levels.
- A level has no more than three tasks.
- Maximum field size is 12 × 8.
- Maximum stack height is three.
- Materials stay in stable hotbar positions.
- No timer, defeat, combat, item loss, or irreversible destruction.
- World art remains DOM and CSS; no game framework or bundler is introduced.
- Level maps and objectives are declarative data.
- Validators are reusable pure functions.
- The game checks function instead of one prepared answer whenever the task allows freedom.
- Mining and crafting remain out of scope until the building campaign is validated.

## 20. Open implementation questions

Resolve these during the named stage, not before:

- exact terrain maps and landmark positions: during each chapter stage;
- final block colors and textures: during Stage 2 visual review;
- whether level 10 needs height two or can use slope terrain only: during Stage 7;
- exact glow radius and attenuation values: during Stage 9 playtesting;
- exact material budget for levels 15, 24, and 25: after solution fixtures exist;
- whether 12 × 8 needs a slightly smaller tablet cell tier: during Stage 12 device testing.

These questions may change data and CSS values. They must not require a new architecture.
