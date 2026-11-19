# Mouse Maze

A maze chase for a six-year-old. The mouse runs through a maze, collects every crumb of cheese and
keeps away from the cats. It is a game of the maze-chase genre with its own mazes, characters and
look, not a copy of any existing game.

## Rules

- The mouse keeps running in the chosen direction until it meets a wall. An arrow pressed early is
  remembered and used at the next turn, so the child does not have to time the press.
- A crumb gives 10 points, a big cheese 50.
- A big cheese makes the cats sleepy for seven seconds: they turn pale blue with 💤 and wander
  slowly. In the last two seconds their circle flickers back to their own color. A mouse that touches
  a sleepy cat sends it home for 200 points.
- A cat that catches the mouse does not end the game. After a short pause the mouse goes back to its
  hole and the cats go home; eaten cheese and points stay. The game waits for the next arrow.
- The maze is finished when all the cheese is eaten.

## Switching the cats off

The "Cats" button in the header removes the cats at once, in the middle of a maze too: the game
becomes a calm walk where the mouse only collects cheese. Switched back on, the cats start from their
house. The choice is kept per device under `mazeMouseCatsV1`, and the sound switch under
`mazeMouseSoundV1`. The game saves no progress.

## Mazes

| Maze | Cats | Cat speed |
| --- | ---: | ---: |
| 🍳 Kitchen | 2 | 3.3 cells/s |
| 🌻 Garden | 3 | 3.5 cells/s |
| 🕯️ Cellar | 4 | 3.7 cells/s |

The mouse runs at 5 cells per second, faster than any cat. All three mazes are open from the start;
after a finished maze, the dialog offers the next one.

The cats take turns strolling about for five seconds and following the mouse for fifteen. Each cat
follows in its own way: one heads for the mouse, one for a spot ahead of it, one follows only from
afar, and one always strolls. While strolling they pick turns at random, so no cat guards the last
crumbs in a corner.

## Controls

- Arrow keys or WASD; Space or P pauses.
- The big arrow buttons next to the maze.
- On a tablet, a swipe across the maze, or a tap on the side of the mouse it should run to.

The game pauses itself when the tab is hidden.

## Checks

```bash
node maze-mouse/test-game.js
```

The test checks that every maze is well formed and fully reachable, that the calm mode can finish
every maze, that the mouse and the cats never stand inside walls, that every cat leaves the house,
that a catch keeps the cheese and the points, that a sleepy cat goes home, and that the cats switch
off and on.
