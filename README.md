# Games for kids

Small browser games with no libraries, no build step and no internet access. Every game lives in its
own folder, built around `index.html`, `styles.css` and `game.js`; a game adds its own data files next
to them — a `translations.json`, or a whole `content/` folder.

## Running

A single server started from the repository root serves every game:

```bash
python3 server.py
```

Then open `http://127.0.0.1:4173/` — that page links to the games. Other computers on the home
network open `http://<name>.local:4173/`, where `<name>` is this computer's name; the server prints
both addresses when it starts.

Port 4173 serves the child's shared progress to every computer, so development and verification
play uses the preview on port 4174 or another spare port, never 4173.

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

### Starting with the Mac

`com.kovalev.kid-games.plist` is a LaunchAgent that runs the server whenever the user is logged in,
restarts it if it stops, and writes its output to `.server/server.log`. Install it from the
repository root:

```bash
mkdir -p .server
ln -s "$PWD/com.kovalev.kid-games.plist" ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.kovalev.kid-games.plist
```

The plist names the absolute path of this checkout and `/opt/homebrew/bin/python3`; edit it if
either differs. After a change to `server.py`, restart the server with
`launchctl kickstart -k gui/$(id -u)/com.kovalev.kid-games`. To remove the agent, run
`launchctl bootout gui/$(id -u)/com.kovalev.kid-games` and delete the link in
`~/Library/LaunchAgents/`.

The agent's server writes no pid file, so `status` and `stop` report "Not running" and `start` fails
on the busy port; use the `launchctl` commands instead. Before the first `bootstrap`, stop a server
started with `start`, otherwise the agent keeps restarting against a busy port. While the agent is
loaded, do not run `start` or the foreground `python3 server.py` either: if one of them takes port
4173 while the agent restarts, the agent retries every ten seconds and appends a traceback to the log
each time. To recover, stop that server and run `launchctl kickstart -k` as above.

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
| `robo-stories/` | Robo Stories | Building programs out of picture cards across eight robot stories: parcels, gates, batteries, a rover, a room, snowballs, conveyor belts and a pond | Russian, English |
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

Every game keeps its rules apart from the screen it draws, and each one has a test that runs them
without a browser:

```bash
node hypothesis-lab/test-game.js   # the six missions and the rule logic
node block-town/test-game.js       # the world model, the shelf's copy of the block table, the art
node robo-stories/test-game.js     # the levels, the simulator, the hint search, the progress rules
node forest-light/test-game.js     # gathering, building and the evening
node garden-quest/test-game.js     # the ten gardens: every star and the perfect route are reachable
node island-discovery/test-game.js # the hex map, the fog, the path of discoveries
node word-quest/test-game.js       # the reading rules and the shape of the word packs
```

## Saved progress

Every game writes its progress to `localStorage` under its own key:

| Game | Key |
| --- | --- |
| `word-quest` | `livingWordsProgressV2` |
| `island-discovery` | `islandDiscoveryV2` |
| `forest-light` | `forestLightProgressV1` |
| `robo-stories` | `roboStoriesProgressV1`, `roboStoriesSurveyV1` |
| `garden-quest` | `gardenQuestBestScoresV3`, `gardenQuestUnlockedV1` |
| `hypothesis-lab` | `secretRuleLabCompletedV1` |
| `block-town` | `blockTownWorldsV1` |

When the games are opened from `server.py`, the progress is shared between computers, as described
below. Pages opened over `file://` or from another static server keep progress in the browser only.

Every card on the home page has a settings button in its corner: it opens a small panel for an adult
that resets the progress of that game after a confirmation. The reset removes only the keys listed
above, so the sound and language settings stay as they were.

The Block Town panel holds one more screen, "Blocks": a list of all thirty blocks, where an adult
adds the ones the child may paint with. That choice lives under `blockTownBlocksV1`, is written by
the home page and by the words screen inside the game, and a reset of progress keeps it — like sound
and language, it is a setting.

### Shared progress

`server.py` keeps the progress keys in `saves/progress.json` next to itself (ignored by git), and
`shared/progress-sync.js`, the first script on every page, copies them between that file and the
browser's `localStorage`. The synced keys are `SYNCED_KEYS` in `server.py`: the table above plus
`blockTownBlocksV1`. Sound and language stay per device, except that Word Quest keeps its own sound
switch and language inside `livingWordsProgressV2`, so those two travel with its progress. The last
write wins per key.

The first time a browser meets a key, its own copy, if it has one, goes to the server and replaces
what is there; after that the server's copy wins on every page load. So a browser or address that
still holds old progress (another browser on the Mac, or `localhost:4173`) pushes it on its first
visit: open the games only from browsers whose progress is wanted. A write that fails because the
server is unreachable is kept in the browser and sent on the next page load.

Back up the progress by copying `saves/progress.json`. Reset one game from the settings panel on the
home page as before: the server keeps the reset key as `null`, and every computer removes its copy.
A key missing from the file is not a reset, so if the file is lost, each browser pushes its copies
back on its next page load. Deleting the file therefore does not reset anything. The two marker keys `kidGamesProgressSyncedV1` and `kidGamesProgressPendingV1` belong to each
browser and are never synced.

## Shared principles

The mandatory rules for every existing and new game are described in [GAME_DESIGN.md](GAME_DESIGN.md).
