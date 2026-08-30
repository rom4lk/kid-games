# Shared game design rules

These rules are mandatory for every existing and every new game in the repository.

## The player and clarity

- The main player is a child of about six years old. The main path through the game must be clear without help from an adult and, where possible, without reading (but reading is not forbidden).
- Any text the child has to read must use a large, clearly legible font, and words must be split into syllables. Avoid long and complicated words; replace them with short ones the child already knows.
- The screen must show one clear current goal and one obvious next action. Do not reveal a mechanic before it is needed.
- Teach through a safe first action. Introduce new mechanics one at a time and let the player use each one right away.

## Mistakes and help

- Do not use timers, sudden defeat, loss of progress or punishment for experimenting.
- A mistake must be explained by the reaction of the game world and must allow an immediate retry.
- A hint shows only the next useful step and never performs the action for the player.
- If a mechanic allows several solutions, accept any correct one, not only the prepared answer.

## Visual language and feedback

- Every action must get a noticeable visual response immediately; success ends with a short, clear reward.
- Never carry meaning by color alone. Duplicate it with shape, pictogram, position or motion.
- Sound and speech only add to visual information. The game must be fully playable without sound, and sound must be switchable off.
- Keep a friendly, calm visual tone without frightening imagery or harsh effects.

## Controls and accessibility

- Make interactive elements large and well separated. Do not require precise gestures, dragging, holding or double taps unless that is the core mechanic.
- Support mouse, touch and keyboard. The interface must stay understandable on a computer, a tablet and a small screen.
- Respect `prefers-reduced-motion`; important state must be readable without animation.

## Clarifications

These clarifications extend the rules above and take precedence over them.

### The adult's role

- An adult picks and opens the game from the shelf, so an exit from a game back to the shared page is not needed.
- An adult may explain the rules once before the first session. The rule "clear without help from an
  adult" applies to what happens after that explanation: from there on the child plays alone.
- Text addressed to an adult (instructions, story framing, a settings panel) does not have to be
  large and does not have to consist of short words. But it must be visually separated from the text
  the child reads.

### Language

- Some games are in Russian and some are in English — that is intentional.
- Some games require reading and some do not — that is intentional too.
- There is a single requirement for the text the child reads: simple familiar words and short constructions.

### Font size

- Text the child reads is no smaller than 20px, and the main instruction on a screen is larger than that.
- Text for an adult is no smaller than 15px.
- Never use labels smaller than 15px anywhere.

### Target device

- By default a game must work on a computer and a tablet; support for small screens and mobile devices is optional.

### Animation and `prefers-reduced-motion`

Reduced motion does not mean "no motion at all". What must be switched off is travel, flight,
shaking, rotation and scaling — not the appearance of color and opacity.

- Decorative background loops (clouds, fireflies, confetti) — stop them completely.
- Motion that carries meaning (the robot walking across cells, an error card trembling) — shorten it
  to nearly instant, but keep a static sign of the state: an outline, an icon, a checkmark.
- Keep color and opacity transitions smooth.
- The rule must also hold in JavaScript: `element.animate()` and `setTimeout` pauses do not obey CSS.
  Read `matchMedia("(prefers-reduced-motion: reduce)")` and shorten the delays, otherwise the game
  freezes with no motion at all.

A global override through `*` with `!important` does not solve the problem and must not be used.

## Design check

The design counts as clear if, after one short demonstration, the child can repeat the game loop on their own, understand the result of a mistake and finish the task without spoken instructions from an adult.
