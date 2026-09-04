# Robot Lab

A browser puzzle game in which the player first builds a program out of cards and then runs the robot. The game gradually introduces planning, turns, conditions in the environment, the order of actions and the reuse of commands.

## What is in the game

- eight levels with gradually growing difficulty;
- commands for moving, turning, pressing a switch and repeating two actions;
- walls, switches and doors: color is always duplicated by shape — a round switch opens a door with a
  round sign, a square one opens a door with a square sign;
- batteries that sometimes have to be collected in order;
- a highlight on the command where the program hit an obstacle, and an answer from the world itself: the robot
  bumps into it and the cell ahead flashes;
- when the run stops, the "×2" card highlights the two commands it repeats;
- the `par` of every level equals the length of the shortest possible program, so three stars are given
  only for an optimal solution;
- a reward in the form of a robot assembled piece by piece;
- completed levels saved to `localStorage` under `robotLabCompletedV1`;
- a sound switch whose choice is saved separately under `robotLabSoundV1`;
- a persistent English or Russian interface selector, with English as the default;
- mouse, touch and keyboard controls;
- a responsive layout for a computer and a tablet.

## Running

From the root of the project start the shared local server:

```bash
python3 server.py
```

Open the game at:

```text
http://127.0.0.1:4173/robot-lab/
```

No library installation and no build step are required.

## Keyboard controls

| Key | Command |
| --- | --- |
| `F` | Forward |
| `L` | Turn left |
| `R` | Turn right |
| `P` | Press |
| `X` | Repeat two |
| `Enter` | Run program |
| `Backspace` | Undo |

## The Repeat Two rule

The `Repeat Two` card repeats the last two executed actions. For example, the program `Forward, Forward, Repeat Two` moves the robot four cells while taking only three slots in the program.

## Checking the solutions

Every level stores a short reference solution. A breadth-first search over the game state also confirms
that each level's `par` equals the true minimum number of cards needed to win, not just the length of the
reference solution. Both can be checked from the root of the project with:

```bash
node robot-lab/test-game.js
```

## Deliberate decisions

These decisions were made on purpose and take precedence over the shared rules in
[GAME_DESIGN.md](../GAME_DESIGN.md).

- **Three stars are given only for a program no longer than `par`.** The level itself counts as completed with
  any working solution — the stars stay an optional layer. The decision follows the star thresholds in
  [Garden Quest](../garden-quest/README.md).
