# Concept: "Robo Route"

## Who it is for

A six-year-old who does not read yet or reads syllable by syllable. The game targets a tablet, a mouse and a touch screen. One session takes 3–7 minutes.

## The main idea

The child helps a friendly robot deliver unusual parcels. Before starting the run they build a chain of actions from large picture cards. After the green button is pressed, the robot performs the cards one by one.

This keeps the main pleasure of Human Resource Machine — first come up with a program, then watch it run — but removes the text, the office theme and the difficult abstractions. In the final three levels, the robot can step on a floor button to open a gate for the rest of that run.

## Why this mechanic suits a preschooler

- Only three commands on the first level: pick up, step right, put down. The step left appears on the second.
- Every command has a constant color, shape and animation.
- The goal is always shown as a picture: a parcel, an arrow, a house.
- The active command bounces at the same moment as the robot's action.
- A mistake does not punish: the robot wobbles funnily, the wrong card trembles, the board returns to the start.
- The light bulb highlights one next useful command, without solving the whole task at once.
- Sounds confirm a step, a pick-up, a mistake and a success, but the game works fully without sound.
- The floor button uses a footprint instead of looking tappable. Pressing it lowers its shape and lifts the barred gate out of the path.

## The game loop

1. Look at the goal picture.
2. Tap the action cards and fill the route.
3. Press the big green start button.
4. Compare the commands with the robot's movement.
5. Remove the card that did not work or use the light bulb.
6. Deliver the parcel and get a big star.

## Teaching without text

The first screen shows a pulsing finger near the commands. After the first tap the hint disappears. If the child runs an empty program, the light bulb highlights the first suitable sign and the first free slot. When the chain is correct but too short, the game shows the next step. When the chain is wrong, the wrong card and a suitable replacement are highlighted.

## Prototype levels

1. The parcel is right under the robot: reinforce the pick-up and a delivery to the right with the shortest chain.
2. The parcel is to the left of the robot: unlock the step left.
3. The parcel is above the robot: unlock the move up command.
4. A route with a turn: combine horizontal and vertical steps.
5. A delivery from the top edge to the bottom one: unlock moving down and hold a long chain.
6. A bush blocks the direct path: notice the obstacle and build a way around.
7. A floor button sits directly before a gate on the natural route, so the robot opens it safely while carrying the parcel.
8. The button is one turn away from the direct route, introducing a short detour before the closed gate.
9. The button is away from the parcel, making opening the route an explicit planning step before pick-up.

A new command appears only after a level where the child has already mastered the previous set of actions. The gate reuses movement commands and does not add a direct interaction or a new card. Nine dots on the field show the progress without numbers; unlocked levels can be replayed.

## Visual language

- Soft rounded shapes without sharp corners.
- A warm yellow background and a calm blue playing field.
- Moving left is blue, moving right is purple, the pick-up is yellow, the drop-off is coral.
- Buttons look like physical toy tiles and press down noticeably.
- All interactive elements are larger than 54 px.

## What to check in a review with a child

- Whether the child understands the goal from the top card without an adult's explanation.
- Whether they tap the commands rather than trying to drag the robot with a finger.
- Whether they tell the yellow pick-up command from the coral drop-off command.
- Whether they notice the link between the highlighted card and the robot's action.
- Whether they can fix a single mistake after the animation without a spoken hint.
- Whether a chain of five actions looks too long for the first level.
- Whether they understand that the robot, not their finger, presses the floor button.
- Whether they connect the lowered button with the gate lifting out of the path.
- Whether they independently plan the button detour on the next level.
- Whether a closed-gate mistake is clear and easy to retry.

## The success criterion for a test

After one demonstration by an adult, the child completes the level a second time on their own and can explain with gestures what at least one command card is for.

## Prototype boundaries

The current version has nine interactive levels, gradual unlocking of commands, a choice among already unlocked levels, an obstacle, a floor button and gate, hints, sounds, a responsive layout, feedback on mistakes and progress saved between sessions. The light bulb starts blinking on its own after a long pause with no action, and completing all nine levels gives a separate final reward. Localization for parents and analytics were deliberately left out until the basic mechanic is tested.
