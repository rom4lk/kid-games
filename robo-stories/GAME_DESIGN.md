# Concept: "Robo Stories"

## Who it is for

A six-year-old who does not read yet or reads syllable by syllable, and who has already met the
idea "first build the program, then watch the robot run it". The game targets a tablet, a mouse and a
touch screen. One level takes one to five minutes; one story takes a session or two.

## The main idea

The game is a shelf of short stories. In every story the robot has a job: carry parcels, charge
itself with batteries, gather crystals on Mars, vacuum a room. Every story also has its own way of
moving and its own cards, so a mechanic that would be confusing next to another one gets a story of
its own: arrows in the delivery stories, forward and turns in the lab and on Mars.

Before the run the child fills a strip of visible slots with picture cards. After the green button
the robot performs the cards one by one, and the active card bounces in time with the robot.

## Why the structure suits a preschooler

- All stories are open, so a child who already knows arrows can start with turns or with the repeat
  card, and a story is never a locked door.
- Inside a story the levels open one after another and a new card appears only after the previous
  ones were used, so every level introduces at most one new thing.
- The strip shows exactly how many cards the level needs. The last two slots are drawn as spares:
  using them is allowed, but each one costs a star. The par is visible without a number.
- The goal is always a picture: a parcel, an arrow and a station with the same sign, or the things
  to collect and a sparkle.
- A mistake does not punish: the robot wobbles, the wrong card trembles, the cell that blocked the
  way flashes, and the field returns to the start with the program still in place.
- The light bulb highlights one next useful card from the real state of the field and never plays
  for the child. After a long pause it blinks on its own.
- Sounds confirm a step, a pick-up, a turn, a mistake and a success, and the game is fully playable
  without them.

## The game loop

1. Pick a story on the shelf, then a level in it.
2. Look at the goal picture at the top.
3. Tap the cards and fill the slots from left to right.
4. Press the big green button.
5. Watch the cards light up in time with the robot.
6. Remove the card that failed, or ask the light bulb.
7. Reach the goal, get the star with a face and one to three small stars.
8. Answer one question with a face: easy, normal, very hard.
9. Go to the next level, or back to the story when the last one is done.

## Teaching without text

The first level of every story shows a pulsing finger near the cards; after the first tap it goes
away. The `×2` card stays dim until two cards stand before it, so the rule "repeat needs two" is
shown instead of explained. When the run ends without reaching the goal, the game points at the next
card instead of marking a mistake. When a parcel is put down on the wrong station, the matching
station glows.

The text on the screen is for an adult: the level title and its goal in one sentence under the
cards, the text of the hint, the lock note on a level card, the survey question. It is small, muted
and separated from the child's controls, and the child never needs it.

## The stories

1. **Post Office.** Arrows, pick up, put down, one parcel with a star. Bushes appear on the sixth
   level and the field grows on the last one.
2. **Gate Yard.** The same cards. A floor switch opens the gate of the same shape when the robot
   steps on it. Then parcels get signs, then there are two parcels, then two gates of different
   shapes.
3. **Charging Lab.** A headlight robot: forward, turn left, turn right. Walls, doors by shape,
   batteries with numbers that must be collected in order.
4. **Mars Rover.** Forward and turns plus the `×2` card. Straight roads of four and six steps, then a
   winding canyon, then several crystals.
5. **Clean Room.** Arrows plus `×2`. Rows of dust, furniture to go around, and a final room that does
   not fit into the strip without repeat cards.

## Visual language

- Soft rounded shapes without sharp corners, a warm yellow background, and a calm field whose colors
  change with the story: a meadow, a yard, a lab, Mars, a room.
- Every card has a constant color and picture. Arrows are blue, purple, green and orange; the pick-up
  is yellow and the put-down is coral; the repeat card is teal.
- A parcel and its station repeat the same large sign; their shared color is only a supporting cue.
- A switch and its gate repeat the same shape; the color is only a supporting cue.
- The headlight robot carries a large yellow beam on the side it faces.
- Buttons look like physical toy tiles and press down noticeably. Every control is larger than 54 px.

## What to check in a review with a child

- Whether the child picks a story by its picture and understands that every story is open.
- Whether the locked levels read as locked and the next level reads as the one to play.
- Whether the child understands the goal from the top card without an adult's explanation.
- Whether they tap the cards rather than trying to drag the robot.
- Whether they read the headlight and predict where "forward" goes after a turn.
- Whether they notice the link between the highlighted card and the robot's action.
- Whether they can fix a single mistake after the animation without a spoken hint.
- Whether they understand that the robot, not their finger, presses the floor switch, and that a
  round switch does nothing for a square gate.
- Whether the `×2` card is understood after the first Mars level, and whether the highlighted pair of
  cards helps.
- Whether the spare slots read as "allowed but not free".
- Whether the three faces of the survey are told apart and answered honestly rather than tapped to
  get past the screen.

## The success criterion for a test

After one demonstration by an adult, the child completes the next level of the same story on their
own and can explain with gestures what at least one card is for.

## Boundaries

The current version has five stories with eight levels each. A sixth story that mixes parcels and
batteries on larger fields is planned but not built. The survey answers stay in the browser; there
is no upload anywhere.
