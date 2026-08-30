# Games for kids

A small browser game with no libraries, no build step and no internet access. The game lives in its
own folder and consists of `index.html`, `styles.css` and `game.js`.

## Running

A single server started from the repository root serves the game:

```bash
python3 server.py
```

Then open `http://127.0.0.1:4173/` — that page links to the game.

Without a command the server runs in the foreground and is stopped with `Ctrl+C`. It can also run in
the background:

| Command | What it does |
| --- | --- |
| `python3 server.py start` | Starts the server in the background |
| `python3 server.py stop` | Stops the background server |
| `python3 server.py restart` | Stops the server and starts it again |
| `python3 server.py status` | Reports whether the server runs |

`start` writes the process id to `.server.pid` and the output of the server to `server.log`; both
files are ignored by git. The commands only see a server that was started with `start`, not one
running in the foreground.

The home page includes a local server restart button. The custom server keeps static file serving as
simple as `python -m http.server` and adds only the health and restart endpoints needed by that button.

A local server is required: `word-quest` loads its text and word packs through `fetch`, and that does
not work when a file is opened directly over `file://`.

## The game

| Folder | Title | What it is about | Interface language |
| --- | --- | --- | --- |
| `word-quest/` | Living Words | Reading a word and picking a picture, levels by word length | Russian, English |

Details about the game loop and its deliberate design decisions are in
[word-quest/README.md](word-quest/README.md).

## Language

The home page has a language picker and opens in English by default. The choice is stored in
`localStorage` under `kidGamesLanguageV1` and is shared with the games: a language picked on the home
page is the one `word-quest` opens in, and a language picked inside `word-quest` is the one the home
page shows.

The text of the home page is written in English in `index.html`, and the Russian version comes from
`translations.json` through the shared `game-language.js`.

## Content checks

The word packs and the UI strings live in `word-quest/content/` and are validated by a script:

```bash
python3 word-quest/tools/validate.py
```

Add `--all` to require every expected pack to exist — that is the final check before the content is
considered complete.

## Saved progress

The game writes its progress to `localStorage` under its own key:

| Game | Key |
| --- | --- |
| `word-quest` | `livingWordsProgressV2` |

Progress is tied to the browser and the address, is not synchronized between devices and is erased when
site data is cleared.

## Shared principles

The mandatory rules for every existing and new game are described in [GAME_DESIGN.md](GAME_DESIGN.md).
