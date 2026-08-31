# Forest Light

A short game about exploring a forest, gathering supplies and setting up a cozy camp. It keeps the recognizable loop of *Don't Starve* — leave the base, find resources, make something useful, get ready for the night — but replaces the fear of survival with independence, care and discovery.

## Who it is for and why

- Age: 6 years old.
- The child cannot read yet; the whole required path through the game is clear from pictures, motion, sound and demonstration.
- The first tutorial chapter lasts 4–6 minutes, the following ones 10–15 minutes. The whole five-chapter story can be played in small separate sessions.
- The main emotions: curiosity during the day, coziness in the evening, pride in the camp that was built.

The player's main fantasy: "I explored the forest myself and made a safe place in it for my friends."

## What we take from the genre

| We keep | We simplify or remove |
| --- | --- |
| A top-down view and a small open forest | No huge random map |
| Gathering berries, sticks, stones and leaves | No dozens of nearly identical resources |
| Simple recipes and a growing camp | No recipe list, no text, no hidden conditions |
| The change of day, evening and night | No hard timer and no defeat because of the dark |
| Rain, mud and other natural obstacles | No combat, monsters, death or lost items |
| The need to return to the camp | The firefly can always show the way home |

This is not an endless sandbox. Every chapter has one visible goal and a festive ending.

## The game loop

1. The firefly shows the goal in a speech bubble: the finished item and the pictures of the resources it needs.
2. The player picks a visible object in the forest. The hero walks to it along a safe path on their own.
3. The big action button shows exactly what is about to happen: pick up, shake, dig or build.
4. A found item takes a real visual slot in the backpack.
5. Once there are enough resources, their pictures jump and fly into the silhouette of the future build.
6. The player returns to the camp and assembles the item from two or three large parts.
7. A short cozy evening arrives: the camp comes alive, a new friend shows up, the next chapter unlocks.

One "saw a need → found it → made it → saw the result" loop takes 2–4 minutes. The first chapter teaches a single loop, and from the second chapter on the player repeats it three times with a small increase in difficulty.

## Controls

- A tap or a click on the ground — the hero walks to that point.
- A tap or a click on an object — the hero walks up to it and the action button changes its picture.
- One big contextual button is the only required hands-on action.
- On a computer the arrow keys or `WASD` also work, and the action is `Space`.
- No dragging, double clicks, holding or precise gestures.
- Interactive areas are at least 64 × 64 px and are never placed right next to each other.

## A language without reading

### Permanent symbols

| Meaning | Sign | Extra signal |
| --- | --- | --- |
| Food | `🫐` | The hero pats their belly, a soft rumble plays |
| Stick | `🪵` | A brown elongated shape, a dry knock |
| Stone | `🪨` | A gray round shape, a low sound |
| Leaves | `🍃` | A green fan shape, a rustle |
| Go home | `🏕️` | A glowing path to the camp |
| Help needed | `✨` | The firefly shows the action once |

Color never carries meaning on its own: every resource has its own shape, picture, motion and sound.

The emoji in this document and in the screen mockup are only a layout sketch. The prototype needs custom pictograms in a single style: a thin stick instead of a log, a separate empty campfire circle and distinct silhouettes for the action buttons. Before programming starts, the child should match paper cards for "stick", "stone", "campfire" and "home" without hints from an adult.

### How we teach

- There is no separate rules dialog at the start.
- The first stick needed for the campfire lies next to the hero. The firefly flies over to it, and a semi-transparent hand shows the tap once.
- After the tap the camera follows the hero's path and only one available button is highlighted.
- If the player does nothing for 8 seconds, the firefly points at an object. After another 8 seconds it repeats the hand gesture. The firefly never moves the hero, never collects a resource and never presses a button for the player.
- A voice says short phrases like "Let's find two sticks", but the picture fully duplicates the meaning.
- The voice hint can be repeated with the light-bulb button. A separate speaker button turns off sound and
  speech completely; the choice is kept between sessions.

## The game screen

The game world takes up almost the whole screen. During the first tutorial loop the fullness meter and the sun's path are hidden: the child sees only one goal, three shaped slots for resources, the action button, sound and pause.

The interactive screen mockup shows the layout and the main sequence of actions, but it does not replace a test prototype. Before testing with a child it must support pause, voice repeat, the hints after 8 and 16 seconds, and the A/B/C/D help level log.

```text
┌─────────────────────────────────────────────┐
│                                   💡 🔊 Ⅱ │
│                                             │
│  ✨ (🪵 🪵 → 🔥)                            │
│                                             │
│        🌲     🪵       🪨                   │
│              🧒                             │
│                       ◌                     │
│                                             │
│          [🪵] [   ] [   ]          (✋)      │
└─────────────────────────────────────────────┘
```

- The firefly's bubble holds one current goal: here two sticks turn into a campfire.
- A gray shaped slot means "still to be found", a bright item in it means "already have it". What has been found never turns gray again.
- At the bottom there are three backpack slots for the current recipe and one contextual button.
- Once the resources are collected, a glowing path to the empty campfire circle appears. The player chooses the camp themselves, walks to it and moves the resources from the backpack into the build with three large taps.
- The hint, sound and pause icons sit apart from the game actions.

The fullness meter and the sun's path appear only from the second chapter, once moving, gathering and building are mastered. The sun's path advances after a completed action, so the child never loses because they are slow.

## The daily rhythm and safe survival

### Fullness

The hero has three berry marks. One mark is spent only after three useful actions, not by real time. Berries often grow along the way to the goal.

If the meter empties, the hero sits down and shows a berry in a bubble. The firefly leaves an emergency berry nearby, and then the player picks it up and feeds the hero themselves. Nothing is lost.

### Evening and night

The sun moves to the next point after part of the goal is done. The last point does not go out until the player returns to the camp. In the evening the trees turn blue, fireflies light up and calm music plays.

If the player has wandered far away, the fireflies build a path home. There are no enemies at night: it is a short scene of cooking, decorating the camp or playing with forest friends.

### Obstacles

- Mud slows the hero down and leaves funny footprints.
- A thorny bush cannot be crossed, but the firefly shows a way around.
- Rain hides the far part of the forest until a shelter is built.
- The stream can be crossed once a small bridge is assembled from two planks.

An obstacle never takes away health or items. It changes the route and gives a clear new goal.

## The five chapters of the first version

| Chapter | New idea | Main goal | Ending |
| --- | --- | --- | --- |
| 1. The first evening | Walking, gathering, the backpack | `🪵 + 🪵 + 🪨 → 🔥` | The hero and the firefly warm up by the fire |
| 2. A guest with long ears | Food and simple cooking | `🫐 + 🫐 → 🥣` | A rabbit comes to the camp |
| 3. Warm rain | Leaves and a shelter | `🍃 + 🍃 + 🪵 → ⛺` | Everyone listens to the rain under the shelter |
| 4. Across the stream | A composite item | `🪵 + 🪵 → 🌉` | A hedgehog finds the way to the camp |
| 5. The festival of lights | All the skills together | `🥣 + ⛺ + 🏮 → 🎉` | A shared picnic and a firefly dance |

Every chapter uses a small hand-built map. The needed resources are always available, and the ordinary resources that were collected grow back after a return to the camp.

## Crafting items

Instead of a recipe menu, a large semi-transparent silhouette of the current item appears next to the camp. It shows two or three holes with the same shapes as the required resources.

- A missing resource stays gray and sways slightly.
- A found resource is colored and bounces in its slot.
- Once everything is ready, the silhouette pulses and the action button shows a hammer.
- The assembly consists of two or three large taps on the highlighted parts.
- A wrong tap gives a soft sound and a short animation, but does not reset the progress.

## Reward and returning

After every chapter the player gets not a score but a visible change to the camp: a new seat by the fire, a lantern, a drawing on the tent or a new friend. The chapter selection screen looks like a night camp; completed chapters are shown as friends sitting by the fire.

A chapter can be replayed, and one of two patterns can be chosen for the item. That gives a personal choice without tables, coins or a shop.

## Sound and visual style

- Soft rounded shapes, large silhouettes and the warm palette of the campfire against a cool forest.
- The forest is a little mysterious, but the characters' faces and the music are always friendly.
- Every resource has its own short sound; a successful chain of three actions adds up to a small melody.
- Important events come with motion, sound and a change of picture at the same time.
- No harsh flashes, screen shake, loud signals or frightening shadows.
- Sound and speech are switched off with one button right on the game screen, without an adult menu.

## Protective rules

- No death, combat, chase, destruction of the camp or loss of what has been collected.
- No ads, purchases, daily rewards or endless attention hooks.
- No punishment for pausing or acting slowly.
- Pause is available with one tap at any moment.
- The game is saved after every item that has been built.
- The adult menu opens by holding the pause icon for three seconds; reading is required only there.

## Scope of the first prototype

The first chapter is enough to test the idea:

- a map of three hand-built clearings — the berry hollow, the camp and the stone slope — that scrolls when the hero walks off the side of the screen;
- the hero, the firefly, the camp silhouettes, sticks, stones, berry bushes and trees;
- moving to a point and one contextual button;
- three gathering verbs on that button: a stick is picked up with one press, a stone is dug out with two, a bush is shaken three times, with a visible count of the presses;
- two visible sticks in different directions, so that after the tutorial the child picks the next route themselves;
- a shared backpack of six slots that shows the kind of every resource instead of a position in one recipe;
- three recipes standing side by side at the camp: the campfire of two sticks and a stone as the chapter goal, and the torch and the berry bowl as bonuses that change the camp;
- bushes that grow back on every return to the camp, and stones that run out on a clearing and send the player to the neighbouring one;
- the glowing way home, choosing the camp on the player's own and a separate assembly of every item from its large parts;
- sound, voice hints and a separate sound-off button;
- a working pause and voice repeat, the hint machine at 8 and 16 seconds and a record of the help level for every action;
- saving the completed chapter.

### The long evening

The fullness meter and the sun's path are part of the prototype, but they stay switched off on the very first run: the tutorial still shows one goal, the gathering and the build, and nothing else. The long evening opens on the next run, once `completions` in the saved progress reaches one, and it adds three things at the same time:

- the sun's four marks, which move only after a useful action and stop on the last one to wait for the player;
- a circle of light that narrows with every mark and puts the far resources to sleep until a torch or the campfire is lit;
- the three berry marks of fullness, an empty meter that sits the hero down, and the emergency berry the firefly leaves nearby.

Both modes are complete and can be finished; the tutorial is a short 4–6 minute run, and the long evening is the fuller version of the same chapter.

The prototype does not include the tent, rain, the bridge, decoration choices, the free mode or the remaining chapters.

## How to test the prototype with a child

The adult starts the game and does not explain the controls. The observer only steps in when the child is clearly upset, and records the help level for every action:

- **A:** the child did it alone, before the first hint;
- **B:** did it after the firefly pointed at the object;
- **C:** did it after the repeated hand gesture or the voice hint;
- **D:** an adult's explanation was needed.

The prototype is ready for further development if the child:

1. Starts moving at level A or B within 30 seconds.
2. Picks and collects the second resource on their own at level A.
3. Understands from the pictures what the campfire is still missing.
4. Chooses the camp themselves, walks back along the visual path and moves three parts into the build.
5. Finishes the chapter without reading and without level D help.
6. Can show, after the ending, that they want to do it again.

Separately, note the places where the child stares at the screen for more than 8 seconds without acting, taps the wrong spot three times in a row or asks an adult to read the interface out loud.

## The main risks

- **Too many signals.** The highlight, the voice and the firefly must not call to different places at once.
- **Automatic movement takes away independence.** The hero finds the path themselves, but the destination is always chosen by the child.
- **The evening feels like a punishment.** The light changes only after useful actions, and the last stage waits for the player.
- **The recipe pictures are unclear.** Test the custom pictograms separately on paper cards before programming; do not use emoji for that test.
- **The helper solves the task for the player.** The firefly only points at an object and repeats the tap gesture; moving, gathering and building are always started by the child.

## The development decision

First we build a vertical slice of the first chapter and test it with a child. We move on to the remaining chapters only after three things are confirmed: the child understands the goal from the pictures on their own, does not confuse an action with movement, and perceives the arrival of the evening as a reward rather than a threat.
