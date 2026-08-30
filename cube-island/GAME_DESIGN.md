# Concept: "Cube Island"

A short, gentle game for a child of about six, inspired by Minecraft. The player gathers large blocks, turns them into new materials and builds useful things in a small cubic world.

The player's main fantasy: "I take parts of the world myself and build something real out of them."

## What we keep from Minecraft

| We keep | We simplify or remove |
| --- | --- |
| A world of blocks that can be taken and placed | Small hand-built islands instead of an endless random world |
| The "find → mine → craft → build" loop | One current goal and one recipe instead of a long item list |
| A free choice of where and in what order to build | Only a few large available cells in the first chapter |
| A build immediately changes the world and opens a path | No destruction of important builds and no irreversible mistakes |
| Tools unlock new materials | No more than one new tool or material per chapter |
| Exploring and coming back to a familiar place | No dark labyrinths, no need to memorize the way, no huge distances |
| A garden, animals and simple machines | No combat, weapons, monsters, death, hunger or lost items |
| A creative mode after the tutorial | No complex inventory, no rare resources, no hidden recipes |

The adaptation keeps not the look of Minecraft but its main action: the player takes a part of the world, transforms it and uses it to change the space in a meaningful way.

## Who it is for and why

- Age: about 6 years old.
- After one short demonstration by an adult, the child plays on their own.
- The required path is clear from the shape of the blocks, the goal pictures and the world's reaction; reading is not required.
- One chapter takes 5–8 minutes.
- The main emotions: curiosity, calm experimenting and pride in a build that works.

## The main game loop

The loop as it is built now:

1. The goal panel shows a picture of the finished structure, and the river lights up the cells it needs.
2. The player picks a lit cell, and the big button offers to place a block.
3. The block appears in the cell and one slot of the tray empties.
4. A block in a wrong place can be picked again and taken back into the tray.
5. Once every lit cell is filled, the structure is finished, the island celebrates and the next level opens.

The planned loop adds the two steps in front of it: the player picks a tree, the hero walks up to it on
their own, a big hand button turns the wood cube into a resource and a recipe turns the resource into
planks. The full "found it → made a material → built → saw the result" loop should fit into the first
chapter.

## The screen and the controls

The world is shown from above at a slight angle. The camera is fixed, so the child does not have to move, rotate the view and pick a block all at once.

- A tap or a click on an object selects a target, and then the hero walks to it on their own.
- One big contextual button performs the available action: mine, craft or place.
- When building, the player first picks a large picture of a block and then an available cell of the world.
- Dragging, holding, double taps and precise aiming are not used.
- On the keyboard the arrow keys or `WASD` work, the choice is `Enter` or `Space`, and cancel is `Escape`.
- Interactive areas are at least 64 × 64 px and are clearly separated from each other.

Only the world, the picture of the current goal, three large resource slots, the contextual button, the hint, the sound and the pause are on the screen at the same time.

## Freedom of building

**Built now.** Every level has a blueprint: a fixed set of cells in the river is lit up, and the level is
finished once a block stands in each of them. The order of the placements does not matter and a block
can be taken back at any time, but a cell outside the blueprint is refused. The game therefore checks a
prepared answer, not the function of the build.

**Planned.** Checking the result instead of the blueprint: several possible rows for the bridge, success
decided by a connected path between the banks, and in the later chapters any structure that meets a
clear condition — it gives a path, covers the friend with a roof or brings water to a garden bed. This
is the first thing to widen, see [The main risk](#the-main-risk).

**Planned.** A calm playground after a chapter, with an unlimited supply of the already familiar blocks
and no required goal, where the work can be freely rebuilt.

## Mining and crafting

Planned; none of it is built yet. The current build has no mining and no recipes: the plank blocks are
already in the tray at the start of a level, and the trees on the bank are scenery.

- The required resource is visible in the world before the action starts.
- One meaningful press is enough to mine; repeated fast tapping is not required.
- A resource takes a slot with the same shape as the picture in the recipe.
- At any moment only the recipe of the current goal is available, with one, two or three components.
- A new item appears through a short, visible transformation: a wood cube unfolds into a stack of planks.
- A tool does not break and does not disappear.
- Ordinary resources are restored after a chapter is finished, so the world cannot be driven into a dead end.

## Mistakes and help

- An unsuitable cell shows a sign of support or of an obstacle; the block gently returns to the chosen slot.
- A mistake does not spend a resource, does not destroy previous blocks and does not reset progress.
- If the build does not work yet, the friend shows the needed direction and the edge of the unfinished path gets a visible outline.
- After 8 seconds with no useful action the helper points only at the next object.
- After another 8 seconds a single example gesture appears. The helper never mines or places a block for the child.
- Any correct arrangement of blocks is accepted, even if it differs from the example.

## A safe world

- No health, hunger, combat, weapons, monsters, lava, falling into the void or death.
- Water does no harm: the hero stops at the edge and shows that a path is needed.
- The evening arrives only after the goal is finished and works as a short reward, not as a timer.
- Items cannot be lost, a finished important build cannot be broken and the hero cannot be locked in.
- Pause is available with one press, and progress is saved after every finished build.

## Chapters

Planned. The current build has five short levels inside the first chapter instead — a bridge, a dock, a
raft, river steps and a river base — and none of the later chapters exist.

| Chapter | New idea | One goal | Reward |
| --- | --- | --- | --- |
| 1. A friend across the river | Mining, turning wood into planks, placing blocks | Build any continuous bridge | The friend comes to the first island |
| 2. A house in the rain | Stone and the support condition | Put up walls and a roof over the friend | A warm lantern lights up in the house |
| 3. The cubic garden | Soil, seeds and water | Bring water to three garden beds | Big flowers and vegetables grow |
| 4. The bright mine | A pickaxe and a new layer of material | Find three visible crystals | The crystals light up the square |
| 5. The festival of islands | The familiar blocks again | Connect three islands and decorate the square | All the friends gather together |

Every chapter introduces only one new idea. Familiar actions keep the same pictures, shapes and element positions.

## Visual language and sound

- Blocks have different silhouettes, surface patterns and pictograms; color is never used as the only marker.
- A cell available for building shows a static outline of a matching shape.
- A selected block gets a frame and a large checkmark.
- Mining, crafting and placing have different short sounds, but every state is clear without sound.
- The style is friendly: rounded edges, clear faces on the characters, calm light and no harsh flashes.
- Under `prefers-reduced-motion` the movement and flight of items become nearly instant, while the outlines, checkmarks and opacity changes remain.

## What is built

- one screen with two banks, a three-column river and trees as scenery on the left bank;
- five levels in a row — a bridge, a dock, a raft, river steps and a river base — each with its own
  blueprint of three to five lit cells;
- a tray that holds exactly the blocks the current blueprint still needs;
- picking a cell and one contextual button that places a block or takes it back;
- the friend on the far bank on the two levels where the build makes a crossing;
- hints on demand, sound, pause, restart and saving the current level with the blocks in it;
- the English and Russian interface through the shared language switcher.

Not built: mining, recipes, the free playground, the connectivity check, the later chapters, a large
inventory, changing weather, redstone, multiplayer and random map generation.

## Testing with a child

The adult shows once how to pick a lit cell and press the big button. After that they do not explain the actions and record the help level.

The build is ready to grow if the child:

1. Puts the next block into a lit cell on their own.
2. Understands from the goal picture what is being built.
3. Finishes a level without waiting for the hint.
4. Tries again right away after choosing a wrong cell, without getting upset.
5. Takes a block back and puts it somewhere else at least once.
6. Finishes several levels in a row without reading and without spoken help from an adult.

Separately, note the moments where the child does not understand the next step for more than 8 seconds, picks an unavailable cell three times or tries to rotate the camera and drag the character.

## The main risk

Simplifying too much can turn Minecraft into a linear puzzle. The current build has gone exactly that
way: the lit blueprint tells the child where every block goes, so the game asks them to repeat an
answer rather than to invent a build. The next step is therefore to widen the freedom of placement —
several valid rows and a check of the function of the build — and only after that to add new resources
and recipes.
