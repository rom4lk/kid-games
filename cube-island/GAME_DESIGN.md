# Cube Island Game Design

## Product promise

Cube Island is a calm construction game for a child around age six. It borrows Minecraft's useful
fantasy of changing a block world, but removes survival, combat, camera control, recipes, item loss,
and endless exploration. Every build solves a recognizable problem: cross water, protect a camp,
repair a road, light a path, or connect a town.

After one demonstration, the child should be able to choose a material, choose a large cell, place a
block, correct a mistake, and understand the world's reaction without adult explanation.

## Core loop

1. The goal panel presents the current real-world task with a diagram or functional symbol.
2. The player chooses one of four stable material slots.
3. The player chooses a large world cell.
4. One contextual button offers Place, Place up, Take, or Check.
5. The world, task card, count, and available inventory update immediately.
6. Completed tasks stay in the world and unlock the next task.
7. The finished construction produces a visible result and opens the next level.

An incorrect action never spends a block, removes progress, restarts a task, or creates a defeat
state. Before level completion, removal always returns the exact top material to the hotbar.

## Campaign structure

The campaign contains exactly 25 sequential levels in five chapters.

| Chapter | Location | New design focus |
| --- | --- | --- |
| 1. River | Grass banks and water | Guided wood building becomes functional route building |
| 2. Snow | Snow and thin ice | Stone support, material choice, dependencies, symmetry |
| 3. Canyon | Rock floors and gaps | Protected space, height, supports, guard edges, route width |
| 4. Night Island | Dark grass and water | Glow cubes, transmission, coverage, line of sight, layers |
| 5. Night Island Town | A larger connected settlement | Networks and combinations of every familiar rule |

Fields grow from 7 × 3 to 12 × 8. A level has one to three ordered tasks and introduces one documented
complication. A new mechanic first appears in a safe example and later returns in combinations.

## Materials

The hotbar always uses this order: Wood, Stone, Glass, Glow.

| Material | Visual identity | Functional identity |
| --- | --- | --- |
| Wood | Horizontal grain and plank seams | Walkable and allowed across configured spans |
| Stone | Speckles, heavy border, dark side | Strong support that blocks light |
| Glass | Hollow center, frame, diagonal shine | Safety wall that transmits light |
| Glow | Diamond center, corner points, halo | Supported light source with a configured radius |

Unavailable materials remain visible and locked. Empty materials remain visible with a zero count.
Shape, texture, label, position, and state communicate identity; color is supplementary.

## Building rules

- Stone needs solid terrain, a foundation anchor, or another stone block.
- Glass needs solid ground, a supporting block, or an explicitly allowed guard-edge position.
- Glow cubes need support and can be required at the top of a structure or behind glass.
- Wood uses each level's supported-span rule and may cross water or gaps only when the level permits.
- A cell holds a stack of zero to three blocks. The whole cell remains the pointer target.
- The active objective controls the current build zone. Later objective cells remain locked.
- Protected and access cells show a persistent refusal symbol when they must stay empty.

The rules return a reason before any state changes. The interface maps that reason to a static icon,
short accessible label, and gentle sound.

## Task validation

Level data refers to reusable validator ids and never embeds level-specific completion functions.
The validator library covers:

- exact targets and shape matching;
- connected and minimum-width routes;
- supported spans, foundations, stack patterns, and enclosures;
- glass guard edges, protected clear space, and symmetry;
- light coverage, line of sight, and protected lights;
- material zones, shared budgets, and composite rules.

Functional tasks accept alternate builds when they meet the same requirement. For example, Mill Path
accepts any connected row through its build zone. Picture-copy tasks remain exact when recognizing the
shape is the intended challenge.

## Light

Every glow block starts a deterministic orthogonal light search. Empty cells and glass transmit the
remaining range, wood adds attenuation, and stone stops propagation. Rendering and completion use the
same light map. Static dark, dim, and lit states remain understandable when animation is disabled.

## Interface and controls

The screen keeps one dominant instruction and one large contextual action. The goal panel contains:

- chapter, location, and level count;
- one large current instruction;
- one to three compact objective cards;
- a blueprint or a functional-route symbol;
- numerical progress.

Only the current task uses full contrast. Completed tasks show a checkmark; future dependent tasks show
a lock. The world is always shown in full, with no panning, pinch zoom, camera rotation, or narrow block
face targeting.

Mouse and touch select a hotbar slot and a cell. Keyboard controls are arrow keys or `WASD`, `Enter`,
`Space`, number keys `1`–`4`, and `Escape`. Focus moves to the next-level control after completion and
returns to the world when the next level opens.

## Help and accessibility

- Manual and automatic hints identify only one next useful cell or action.
- Meaning never depends on color, motion, or sound alone.
- Refusal icons remain visible long enough to inspect and remain static under reduced motion.
- Material, terrain, landmark, stack height, task state, count, and action have accessible names.
- The English and Russian interfaces use the same layout and shared language preference.
- Decorative cloud, character, celebration, and hint motion stops or becomes nearly instant under
  `prefers-reduced-motion`.

## Persistence and safety

The versioned V2 save stores the current level, normalized stacks, inventory, objective state,
selection, completed levels, and celebration state. Completion is always recomputed from the level
rules when a save is loaded. Unknown ids, excessive stacks, impossible inventory, foreign cells, and
malformed JSON cannot create a dead end.

The old five-level save unlocks the equivalent point in the new campaign but does not import obsolete
cell layouts. The V2 save is written before the old key is removed. Restarting the campaign preserves
the shared sound and language preferences.

## Testing with a child

An adult demonstrates selecting one marked cell and pressing the action button once. After that, record
whether the child can:

1. repeat the select-and-place loop without explanation;
2. choose a newly introduced material from its stable slot;
3. understand and correct a refused placement;
4. distinguish the current task from completed and locked tasks;
5. complete a functional route without copying one hidden answer;
6. take back a block and reuse it;
7. finish several levels without trying to drag or rotate the world.

Three repeated unavailable selections, more than eight seconds without identifying an action, or an
attempt to move the camera is treated as an interface problem rather than player failure.

## Out of scope

Mining, crafting, procedural maps, combat, health, hunger, tools that break, multiplayer, redstone,
camera movement, and free-build mode are not part of this campaign. They should be reconsidered only
after the 25-level building loop is tested successfully with children.
