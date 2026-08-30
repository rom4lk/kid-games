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
`island-discovery` and `forest-light` load translations and voice content the same way. That does not
work when a file is opened directly over `file://`.

## The games

| Folder | Title | What it is about | Interface language |
| --- | --- | --- | --- |
| `word-quest/` | Living Words | Reading a word and picking a picture, levels by word length | Russian, English |
| `island-discovery/` | Island of Discovery | A first strategy game: exploring the map, resources, buildings | Russian, English |
| `forest-light/` | Forest Light | Gathering supplies, returning home and building a campfire | Russian, English |

Details about a game loop and its deliberate design decisions are in the README of the game:
[word-quest/README.md](word-quest/README.md), [island-discovery/README.md](island-discovery/README.md),
[forest-light/README.md](forest-light/README.md).

## Language

The home page has a language picker and opens in English by default. The choice is stored in
`localStorage` under `kidGamesLanguageV1` and is shared with the games: a language picked on the home
page is the one a game opens in, and a language picked inside a game is the one the home page shows.

The text is written in English in the HTML, and the Russian version comes from a `translations.json`
next to it through the shared `shared/game-language.js`. The home page, `island-discovery` and `forest-light`
work this way; `word-quest` carries its own two-language content in `word-quest/content/`.

## Content checks

The word packs and the UI strings live in `word-quest/content/` and are validated by a script:

```bash
python3 word-quest/tools/validate.py
```

Add `--all` to require every expected pack to exist — that is the final check before the content is
considered complete.

## Saved progress

Every game writes its progress to `localStorage` under its own key:

| Game | Key |
| --- | --- |
| `word-quest` | `livingWordsProgressV2` |
| `island-discovery` | `islandDiscoveryV1` |
| `forest-light` | `forestLightProgressV1` |

Progress is tied to the browser and the address, is not synchronized between devices and is erased when
site data is cleared.

## Shared principles

The mandatory rules for every existing and new game are described in [GAME_DESIGN.md](GAME_DESIGN.md).
