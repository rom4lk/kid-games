# Games for kids

Small browser games with no libraries, no build step and no internet access. Every game lives in its
own folder, built around `index.html`, `styles.css` and `game.js`; a game adds its own data files next
to them — a `translations.json`, or a whole `content/` folder.

## Running

A single server started from the repository root serves every game:

```bash
python3 server.py
```

Then open `http://127.0.0.1:4173/` — that page links to the games.

Without a command the server runs in the foreground and is stopped with `Ctrl+C`. It can also run in
the background:

| Command | What it does |
| --- | --- |
| `python3 server.py start` | Starts the server in the background |
| `python3 server.py stop` | Stops the background server |
| `python3 server.py restart` | Stops the server and starts it again |
| `python3 server.py status` | Reports whether the server runs |

`start` writes the process id to `.server/server.pid` and the output of the server to
`.server/server.log`; the whole `.server/` folder is ignored by git. The commands only see a server
that was started with `start`, not one running in the foreground.

A local server is required: `word-quest` loads its text and word packs through `fetch`, while
`island-discovery`, `forest-light`, `robo-stories`, `garden-quest`, `hypothesis-lab` and
`block-town` load translations or other content the same way. That does not work when a file is
opened directly over `file://`.

## The games

| Folder | Title | What it is about | Interface language |
| --- | --- | --- | --- |
| `word-quest/` | Living Words | Reading a word and picking a picture, levels by word length | Russian, English |
| `island-discovery/` | Island of Discovery | A first strategy game: exploring the map, resources, buildings | Russian, English |
| `forest-light/` | Forest Light | Gathering supplies, returning home and building a campfire | Russian, English |
| `robo-stories/` | Robo Stories | Building programs out of picture cards across five robot stories: parcels, gates, batteries, a rover and a room | Russian, English |
| `garden-quest/` | Garden Quest | Collecting a harvest on a fixed board within a limited number of steps | Russian, English |
| `hypothesis-lab/` | Secret Rule Lab | Forming a hypothesis, predicting a result and testing a secret sorting rule | Russian, English |
| `block-town/` | Block Town | Painting a town on squared paper, where roads, water and houses connect themselves | Russian, English |

Details about a game loop and its deliberate design decisions are in the README of the game:
[word-quest/README.md](word-quest/README.md), [island-discovery/README.md](island-discovery/README.md),
[forest-light/README.md](forest-light/README.md), [robo-stories/README.md](robo-stories/README.md),
[garden-quest/README.md](garden-quest/README.md),
[hypothesis-lab/README.md](hypothesis-lab/README.md), [block-town/README.md](block-town/README.md).

## Returning to the shelf

Every game goes back to the home page on `Cmd + Shift + H`, and on `Ctrl + Shift + H` on Windows and
Linux. The shortcut is meant for an adult: nothing on the screen announces it, so it does not become
another button the child has to understand.

The shortcut reads the physical key instead of the typed letter, so it also works on a Russian
layout, where that key types "р". A plain `Cmd + H` is deliberately not used: macOS keeps it for
hiding the application, and a web page never receives it.

The whole shortcut is `shared/game-home.js`, and every game loads that file next to the other shared
scripts.

## Language

The home page has a language picker and opens in English by default. The choice is stored in
`localStorage` under `kidGamesLanguageV1` and is shared with the games: a language picked on the home
page is the one a game opens in, and a language picked inside a game is the one the home page shows.

The text is written in English in the HTML, and the Russian version comes from a `translations.json`
next to it through the shared `shared/game-language.js`. The home page, `island-discovery`,
`forest-light`, `robo-stories`, `garden-quest`, `hypothesis-lab` and `block-town` work this way;
`word-quest` carries its own two-language content in `word-quest/content/`.

## Content checks

The word packs and the UI strings live in `word-quest/content/` and are validated by a script:

```bash
python3 word-quest/tools/validate.py
```

Add `--all` to require every expected pack to exist — that is the final check before the content is
considered complete.

The Secret Rule Lab logic is checked separately:

```bash
node hypothesis-lab/test-game.js
```

So is the Block Town model:

```bash
node block-town/test-game.js
```

The Robo Stories levels, simulator, hint search and progress rules are checked with:

```bash
node robo-stories/test-game.js
```

## Saved progress

Every game writes its progress to `localStorage` under its own key:

| Game | Key |
| --- | --- |
| `word-quest` | `livingWordsProgressV2` |
| `island-discovery` | `islandDiscoveryV1` |
| `forest-light` | `forestLightProgressV1` |
| `robo-stories` | `roboStoriesProgressV1`, `roboStoriesSurveyV1` |
| `garden-quest` | `gardenQuestBestScoresV3`, `gardenQuestUnlockedV1` |
| `hypothesis-lab` | `secretRuleLabCompletedV1` |
| `block-town` | `blockTownWorldsV1` |

Progress is tied to the browser and the address, is not synchronized between devices and is erased when
site data is cleared.

Every card on the home page has a settings button in its corner: it opens a small panel for an adult
that resets the progress of that game after a confirmation. The reset removes only the keys listed
above, so the sound and language settings stay as they were.

The Block Town panel holds one more screen, "Blocks": a list of all twenty blocks, where an adult
adds the ones the child may paint with. That choice lives under `blockTownBlocksV1`, is written only
by the home page, and a reset of progress keeps it — like sound and language, it is a setting.

## Shared principles

The mandatory rules for every existing and new game are described in [GAME_DESIGN.md](GAME_DESIGN.md).
