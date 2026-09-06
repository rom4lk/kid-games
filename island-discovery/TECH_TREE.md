# Island of Discovery: the path of discoveries

A design for a Civilization V style technology tree, adapted for a six-year-old. It follows the
mandatory rules in [GAME_DESIGN.md](../GAME_DESIGN.md) and the deliberate decisions in
[README.md](README.md).

This design is built. [README.md](README.md) describes what the game does now; this document keeps
the reasoning behind it. Three details were settled during the work and differ from the text below:
a locked card is marked with a lock rather than a closed bud, the chosen card wears the same balloon
as the goal at the top of the island screen, and the boots hand over their extra step on the day
they open instead of the next morning.

## Why the game needs it

Ideas (💡) are almost dead weight today: hills and ruins give them, the library makes one a day, and
the only thing that ever spends them is the festival. The buildings panel is a flat list of three
cards with no order and no future — the child sees everything there is to see in the first minute.

A tech tree fixes both: it gives ideas a real job, and it puts a visible future on the screen. That
future is what makes Civilization hard to put down, and it is the one part of the genre a
six-year-old can enjoy without reading a single word.

## What we take from Civilization V

| We keep | We leave out |
| --- | --- |
| A visible map of the future, drawn left to right | Eighty nodes, four eras and a canvas that scrolls |
| Prerequisite arrows: a card opens only after its parent | Research points per turn and "7 turns left" counters |
| One chosen research target at a time | A research queue that plays the game for you |
| Tapping a far card puts you on the road to it | Losing accumulated progress when the target changes |
| Discoveries unlock buildings, movement and new land | Obsolete units, tech trading, espionage |
| Optional branches that make the ending easier | Any tech race — there are no rivals on this island |

## The core rule: one chosen discovery

The child picks **one** card at a time. That card becomes the goal of the whole screen.

Its cost is drawn as a row of gift pictures — four logs, two apples — not as a number to read. Every
gift collected on the map fills one picture. When the last picture fills, the card **opens by
itself**, the cost is taken from the store, and the city picture changes.

Nothing is spent before that moment. The dots only show `min(have, need)`. So changing the chosen
card costs nothing and loses nothing, and the child can never spend the apples they were saving.

This is Civilization's "choose what to research, then play toward it", with two differences that
matter for this age:

- The progress is not an invisible number ticking each turn. Every filled dot is the direct answer
  to a step the child just took on the map.
- The card completes on its own. There is no second button to remember and no "you had enough for
  ages and did not notice" state.

## What a tap does

Every card is a button, and every tap is answered with something good. There is no refusal.

| Card state | Look | A tap does |
| --- | --- | --- |
| Open | Full colour, a check mark, on a light plate | Says what it gave, with a small bounce |
| Ready (parent open, gifts enough) | Full colour, sparkle in the corner | Opens it immediately |
| Reachable (parent open, gifts short) | Full colour, dot row visible | Makes it the chosen goal |
| Locked (parent still closed) | Dim, grey, a closed-bud sign, no dot row | Lights the arrows toward it and makes the **first missing parent** the chosen goal |

The last row is the Civ V trick — click a distant technology and the game lays the road to it —
turned into a hint that never plays for the child: "you want the boat? then the boots come first,
and that is your goal now."

## The tree

Three columns, eight cards. Each column has a picture and one short word above it: 🏡 Home,
🌳 Island, 🌅 Far away.

| Card | Opens after | Cost | What it changes |
| --- | --- | --- | --- |
| 🌻 Garden | — | 🪵 4 | One apple every day. Flower beds appear in the city picture. |
| 🛠️ Workshop | — | 🍎 4 | One log every day. A workshop roof appears in the city picture. |
| 👣 Boots | — | 🍎 2 🪵 2 | One more step every day — a new pip appears in the STEPS row. |
| 📚 Library | 🌻 Garden | 🍎 2 🪵 2 | One idea every day. A book tower appears in the city picture. |
| 🧺 Basket | 🛠️ Workshop | 🍎 3 🪵 2 | Every new place gives one more of the gift it gives most of. |
| 🔭 Spyglass | 👣 Boots | 🪵 2 💡 1 | The explorer sees two cells around instead of one; fog lifts the moment it opens. |
| 🛶 Boat | 🔭 Spyglass | 🪵 5 💡 1 | Water becomes walkable and the far shore opens. Each water cell gives a fish (🍎 1) once. |
| 🎪 Festival | 🌻 + 🛠️ + 📚 | 🍎 5 🪵 5 💡 3 | The ending, exactly as today. |

```
🌻 Garden ───► 📚 Library ──┐
🌻 Garden ──────────────────┼──► 🎪 Festival
🛠️ Workshop ────────────────┘
🛠️ Workshop ──► 🧺 Basket
👣 Boots ──► 🔭 Spyglass ──► 🛶 Boat
```

The winning path is unchanged: garden, workshop, library, festival, at today's prices. Boots,
basket, spyglass and boat are the optional branch — they make the island richer and the walking
easier, and a child who ignores them finishes in the usual ten to fifteen minutes. That optional
branch is where the replay value lives, and it is the honest Civ V texture: most of the tree is a
choice, not a requirement.

On an island of 150 cells the scarce thing is not apples and logs — it is days and steps. The
explorer will never walk the whole map in one session. That is why the costs stay small, why 👣 Boots
is the strongest card in the tree, and why 🔭 Spyglass is worth a slot: both of them buy the only
resource the child cannot gather.

Ties for the basket ("gives most of") are broken in the order apples, logs, ideas, so a hill gives
an extra log. The rule is never written down for the child — they see the gift grow.

## The far shore

The boat needs something to reach. The island is 15 x 10 cells and the city stands at column 7,
row 5, so there is room for a real barrier: **column 10 becomes a river** of ten water cells running
the full height of the map, with no gap to walk around.

| Part | Cells | What is there |
| --- | --- | --- |
| Near side | Columns 0 to 9 — the city and 99 places | The ordinary mix of places the game uses today |
| River | Column 10 — 10 water cells | Impassable until the boat; a fish (🍎 1) on each cell after it |
| Far side | Columns 11 to 14 — 40 places | A richer mix: ruins and orchards twice as often |

At two steps a day the explorer meets the water around the third day, while the session is still
young, so the boat card has a visible reason to exist long before it can be afforded.

The near side alone holds many times what the whole tree costs, so the far side is never a
requirement — it is a destination. That is the Civ V feel: the technology does not save you, it
shows you a place you could not go before.

Water is never a broken level. Before the boat is visible in the tree, water cells are drawn as deep
water with a wave. Once the boat card exists, every water cell carries a small boat sign, and
tapping one lights that card in the tree instead of only pushing back. After the boat opens, the
river cells become ordinary walkable places with a fish on them.

This is the only part of the design that touches existing content. If it has to be cut, cut the boat
and the river together: the tree still works with seven cards and the third column holding only the
festival.

## Where it lives on the screen

Civilization keeps its tree on a separate screen and shows only the current research in the main
interface. That is the right shape here too — the map stays big and the screen keeps one goal.

- **Main screen.** The aside stops being a list. Its heading becomes "WHAT ARE WE LEARNING?" and it
  holds exactly one large card: the chosen discovery with its dot rows filling. Under it, one big
  button with a 💡 opens the tree. The city picture above it gains a new detail for every opened
  card, so the city visibly grows through the session.
- **The goal card** at the top mirrors the chosen discovery, so the main screen always answers "what
  are we gathering for". The `0 / 3` counter is replaced by three small pictures — 🌻 🛠️ 📚 — that
  take a check mark one by one. Position and shape carry the meaning, not a number.
- **The tree sheet** is a full-screen dialog like the start and victory dialogs: the same backdrop,
  the same `inert` shell behind it, one large back arrow, Escape closes it. Cards are at least
  120 px wide with 16 px between them; arrows are drawn behind the cards and light up when both ends
  are open.

The sheet opens by itself at the two moments it is wanted: the first time the tree unlocks, and
every time a card completes. So the child never has to remember that the button exists.

## How it opens up

One mechanic at a time, exactly as the game does now. The coach order becomes
**move → collect → learn → done**.

1. Days one and two: no tree, no button. Walk, then gather — unchanged.
2. After three visited places or after the first new day, the 💡 button appears with a pulse and the
   sheet opens once on its own. Only the Home column is bright; Island and Far away are dim shapes.
   A pulsing finger points at the cheapest reachable card, and goes away after the first pick.
3. A pick closes the sheet. The goal card now shows that discovery.
4. When it completes, the city changes, the sheet reopens, and the cards that just became reachable
   sparkle.

So the spyglass, the basket and the boat are each introduced alone, at the moment the child chose
them — a new mechanic is never shown before it is needed.

## Never a dead end

- Nothing is deducted until a card opens, so no choice can be regretted and none can be undone
  wrongly.
- A new day always brings basic supplies, so any chosen card completes eventually even if the island
  has been picked clean and every building was skipped.
- The festival never requires the far shore, the boat or any optional card.
- There is no card that makes another card impossible, and no card ever becomes unavailable.

## Reading, numbers and colour

- The child reads only card names of one short word: Garden, Workshop, Boots, Library, Basket,
  Spyglass, Boat, Festival. Nothing on a card has to be read to play it — the picture and the dot
  row are enough.
- Costs are pictures first. The small numeral pill stays for the adult and is never below 15 px; no
  cost is above six pictures of one kind, so the row stays countable.
- Card state is never colour alone: open has a check mark on a light plate, ready has a sparkle,
  reachable has its dot row, locked is dim with a closed-bud sign and no dots. Column membership is
  carried by position and by the header picture.
- Arrows are shape, not colour: a dim arrow for a closed link, a solid arrow with a filled head for
  an open one.

## Motion, sound and keyboard

- `prefers-reduced-motion`: dots fill by colour and opacity with no flight from the map; the sheet
  appears instead of sliding; the pulsing finger becomes a steady ring; the sparkle becomes a static
  star. The JavaScript delays must be shortened as well, as the shared rules require.
- Sound adds only: a soft rising tone per filled dot, a chord when a card opens, the existing
  fanfare for the festival. Everything is readable with sound off, and the existing ♪ button
  switches it.
- Keyboard: arrow keys move between cards inside the sheet, Enter picks, Escape closes, the back
  arrow is in the tab order first, and the shell behind stays `inert`.
- Every card carries an `aria-label` with its name, its state, its cost and its parent, for example
  "Boat, locked, opens after the spyglass, five logs and one idea".

## Saving

The save key becomes `islandDiscoveryV2`. `buildings` is replaced by `opened` (the list of opened
card ids) plus `researching` (one card id or nothing). Old saves under `islandDiscoveryV1` are
ignored and removed on first load — progress from the previous version is not migrated.

## Text to add

| English | Russian |
| --- | --- |
| WHAT ARE WE LEARNING? | ЧТО ИЗУЧАЕМ? |
| The path of discoveries | Путь открытий |
| Home | Дом |
| Island | Остров |
| Far away | Даль |
| Pick what to learn | Выбери, что изучить |
| Boots | Сапоги |
| One more step every day | Ещё один шаг каждый день |
| Basket | Корзина |
| Every place gives one more gift | Каждое место дарит на один подарок больше |
| Spyglass | Подзорная труба |
| The explorer sees farther | Исследователь видит дальше |
| Boat | Лодка |
| The explorer can cross the water | Исследователь может плыть по воде |
| This is your new goal! | Вот твоя новая цель! |
| First open this one | Сначала открой вот это |
| The boat is not ready yet | Лодка ещё не готова |
| Back to the island | Назад на остров |

## Alternatives considered and rejected

- **A tree next to the buildings panel.** Two lists, two questions, two goals on one screen. It
  breaks the "one clear goal" rule, and the child would have to work out which panel matters.
  Absorbing the buildings into the tree keeps one panel and one question.
- **Research over days, Civ V style.** A card takes N days and fills from the ideas produced each
  day. It is the authentic mechanic, but the feedback moves away from the child's actions to a
  number ticking while they watch, and it introduces waiting with nothing to do. Filling the dots
  from gifts collected on the map keeps the same decision and gives immediate feedback.
- **The whole tree tappable, with the prerequisites bought automatically.** Civ V does queue the
  road for you. Here it would spend resources the child did not agree to spend, and it hides the
  cause of everything that then happens. Lighting the road and setting the first missing parent as
  the goal gives the same convenience and keeps every purchase a choice.
- **Costs in ideas only, as in Civ V.** Apples and logs would lose their point and the map would
  become a hunt for two tile types. A mixed cost keeps every kind of place worth visiting.

## What to check with a child

- Whether they understand that the card they tapped is now the goal, without being told.
- Whether they connect a gift picked up on the map with a dot filling on the goal card.
- Whether the card opening by itself reads as a reward, or as something that happened without them.
- Whether a dim card reads as "later" rather than as "broken".
- Whether tapping a dim card and getting its parent as the new goal is understood, or feels like the
  game refused.
- Whether they find the way back from the tree sheet without help.
- Whether the growing city picture is noticed at all.
- Whether the river reads as "I need something to cross it" before the boat is open.
- Whether they ever choose the optional branch, or always go straight for the festival.
- Whether the session still fits into ten to fifteen minutes on the short path.

## Risks

- **A second screen.** The tree is a place to get lost in. It is answered by one large back arrow,
  by Escape, by the sheet opening itself only at the right moments, and by the goal card repeating
  the choice on the main screen.
- **Two systems at once.** A child who is still learning to walk the map should not be shown a tree.
  The staging above holds it back until the third place or the first new day.
- **A longer session.** The optional branch can double the length. The winning path keeps today's
  prices so the short route stays short, and the sheet never nags about unopened cards.
- **The river.** It is the one change that can make an existing, working map feel worse. It is the
  first thing to cut if testing goes badly.
