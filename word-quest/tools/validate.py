#!/usr/bin/env python3
"""Validates the word packs and the UI string files of Living Words.

Usage: python3 tools/validate.py [--all]
  --all  Require every expected pack to exist (final check).
"""

import json
import re
import sys
from pathlib import Path

CONTENT_DIR = Path(__file__).resolve().parent.parent / "content"
LANGUAGES = ["en", "ru"]
LEVELS = [3, 4, 5, 6, 7]
CHAPTERS_PER_LEVEL = 20
WORDS_PER_CHAPTER = 10

# A level is two hundred readings, not two hundred different words: there are
# not two hundred short nouns a six-year-old knows and a picture can tell apart,
# least of all at three letters. Repetition is deliberate, but it has a floor,
# so a new pack cannot quietly become a handful of words said over and over.
MIN_UNIQUE_WORDS = 35
MAX_WORD_REPEATS = 8

# A "Find the word" pack has its own floor and cap. English repeats nothing.
# The Russian packs repeat on purpose: few short words have two real partners
# that differ from them in one letter, and in the same column. The four-letter
# floor is higher because that pack draws on the larger pool.
# (language, letters) -> (chapters, minimum unique answer words, maximum repeats per word)
SPELL_PACKS = {
    ("en", 3): (5, 50, 1),
    ("ru", 3): (10, 20, 6),
    ("ru", 4): (10, 25, 5),
}
MAX_SAME_SPELL_TASK = 2
MAX_FIRST_LETTER_SHARE = 0.3

WORD_ALPHABETS = {
    "en": re.compile(r"^[A-Z]+$"),
    "ru": re.compile(r"^[А-ЯЁЙЬЪ]+$"),
}
TEXT_LETTERS = re.compile(r"[A-Za-zА-Яа-яЁё0-9]")

# Phrase levels: phrases.<lang>.<a|b|c>.json, two or three words read together.
# level -> words per phrase and, per language, (min letters, max letters, longest word allowed,
# at least one word of this many letters). Letters exclude spaces. Russian A and B overlap at
# 11-12 letters on purpose: B needs a long word, A does not.
PHRASE_LEVELS = {
    "a": (2, {"en": (5, 8, 7, 0), "ru": (5, 12, 9, 0)}),
    "b": (2, {"en": (9, 14, 7, 0), "ru": (11, 18, 10, 7)}),
    "c": (3, {"en": (7, 18, 7, 0), "ru": (9, 22, 10, 0)}),
}
PHRASE_ALPHABETS = {"en": re.compile(r"^[A-Z]+( [A-Z]+)+$"), "ru": re.compile(r"^[А-ЯЁ]+( [А-ЯЁ]+)+$")}

# A phrase level is two hundred readings too, with the same kind of floor and
# cap as the word levels, and every kind of phrase gets real practice.
MIN_UNIQUE_PHRASES = 100
MAX_PHRASE_REPEATS = 3
MIN_KIND_TASKS = 30          # per kind per level; a level C task counts for both its kinds
MAX_NOUN_SHARE = 0.1         # warning
MAX_UNCHANGED_SHARE = 0.5    # warning, level C: the word both distractors leave alone

# In a row of five, big and small items, or items with a badge, stop looking different.
MAX_COUNT_WITH_SIZE = 3
MAX_COUNT_WITH_BADGE = 3

NUMBER_SLUGS = {
    "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
}
NUMBER_WORDS = {
    "en": {"ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4, "FIVE": 5,
           "SIX": 6, "SEVEN": 7, "EIGHT": 8, "NINE": 9, "TEN": 10},
    "ru": {"ОДИН": 1, "ОДНА": 1, "ОДНО": 1, "ДВА": 2, "ДВЕ": 2, "ТРИ": 3, "ЧЕТЫРЕ": 4,
           "ПЯТЬ": 5, "ШЕСТЬ": 6, "СЕМЬ": 7, "ВОСЕМЬ": 8, "ДЕВЯТЬ": 9, "ДЕСЯТЬ": 10},
}
SIZE_SLUGS = {"big", "small"}
COLOR_SLUGS = {"red", "orange", "yellow", "green", "blue", "purple", "brown", "black", "white", "pink"}
# Sleeping and singing are drawn as the subject's own picture with this badge in the corner.
BADGE_VERBS = {"sleep": "💤", "sing": "🎵"}
# (subject, verb) -> the emoji that shows that subject doing it; every non-badge verb lives here.
VERB_PICTURES = {
    ("mom", "run"): "🏃‍♀️", ("dad", "run"): "🏃‍♂️",
    ("mom", "walk"): "🚶‍♀️", ("dad", "walk"): "🚶‍♂️",
    ("mom", "swim"): "🏊‍♀️", ("dad", "swim"): "🏊‍♂️",
    ("mom", "ride"): "🚴‍♀️", ("dad", "ride"): "🚴‍♂️",
    ("mom", "climb"): "🧗‍♀️", ("dad", "climb"): "🧗‍♂️",
    ("mom", "dance"): "💃", ("dad", "dance"): "🕺",
    ("mom", "row"): "🚣‍♀️", ("dad", "row"): "🚣‍♂️",
    ("mom", "cook"): "👩‍🍳", ("dad", "cook"): "👨‍🍳",
    ("mom", "paint"): "👩‍🎨", ("dad", "paint"): "👨‍🎨",
    ("mom", "stand"): "🧍‍♀️", ("dad", "stand"): "🧍‍♂️",
    ("mom", "play"): "⛹️‍♀️", ("dad", "play"): "⛹️‍♂️",
    ("mom", "juggle"): "🤹‍♀️", ("dad", "juggle"): "🤹‍♂️",
    ("cat", "cry"): "😿", ("cat", "laugh"): "😹", ("cat", "kiss"): "😽",
    ("kitten", "cry"): "😿", ("kitten", "laugh"): "😹", ("kitten", "kiss"): "😽",
}
VERB_SLUGS = set(BADGE_VERBS) | {verb for _, verb in VERB_PICTURES}
# (color, noun) -> the one emoji that genuinely shows that noun in that color (Apple Color Emoji).
COLOR_PICTURES = {
    ("red", "heart"): "❤️", ("orange", "heart"): "🧡", ("yellow", "heart"): "💛",
    ("green", "heart"): "💚", ("blue", "heart"): "💙", ("purple", "heart"): "💜",
    ("brown", "heart"): "🤎", ("black", "heart"): "🖤", ("white", "heart"): "🤍",
    ("pink", "heart"): "🩷",
    ("red", "circle"): "🔴", ("orange", "circle"): "🟠", ("yellow", "circle"): "🟡",
    ("green", "circle"): "🟢", ("blue", "circle"): "🔵", ("purple", "circle"): "🟣",
    ("brown", "circle"): "🟤", ("black", "circle"): "⚫", ("white", "circle"): "⚪",
    ("red", "square"): "🟥", ("orange", "square"): "🟧", ("yellow", "square"): "🟨",
    ("green", "square"): "🟩", ("blue", "square"): "🟦", ("purple", "square"): "🟪",
    ("brown", "square"): "🟫", ("black", "square"): "⬛", ("white", "square"): "⬜",
    ("red", "book"): "📕", ("orange", "book"): "📙", ("green", "book"): "📗", ("blue", "book"): "📘",
    ("orange", "ball"): "🏀", ("yellow", "ball"): "🥎", ("white", "ball"): "⚾", ("brown", "ball"): "🏈",
    ("red", "flower"): "🌹", ("yellow", "flower"): "🌻", ("pink", "flower"): "🌸",
    ("purple", "flower"): "🪻", ("white", "flower"): "💮",
    ("red", "flag"): "🚩", ("white", "flag"): "🏳️", ("black", "flag"): "🏴",
    ("red", "car"): "🚗", ("blue", "car"): "🚙", ("yellow", "car"): "🚕",
    ("red", "apple"): "🍎", ("green", "apple"): "🍏",
    ("green", "leaf"): "🍃", ("red", "leaf"): "🍁",
    ("brown", "bear"): "🐻", ("white", "bear"): "🐻‍❄️",
    ("black", "bird"): "🐦‍⬛", ("white", "bird"): "🕊️",
    ("red", "pepper"): "🌶️", ("green", "pepper"): "🫑",
    ("orange", "diamond"): "🔶", ("blue", "diamond"): "🔷",
    # Nouns that come in one color only.
    ("red", "balloon"): "🎈", ("red", "strawberry"): "🍓", ("red", "tomato"): "🍅",
    ("red", "ladybug"): "🐞", ("red", "crab"): "🦀", ("red", "firetruck"): "🚒",
    ("orange", "carrot"): "🥕", ("orange", "tangerine"): "🍊", ("orange", "fox"): "🦊",
    ("orange", "pumpkin"): "🎃",
    ("yellow", "lemon"): "🍋", ("yellow", "banana"): "🍌", ("yellow", "star"): "⭐",
    ("yellow", "chick"): "🐤", ("yellow", "cheese"): "🧀",
    ("green", "frog"): "🐸", ("green", "cucumber"): "🥒", ("green", "broccoli"): "🥦",
    ("green", "fir"): "🌲", ("green", "cactus"): "🌵",
    ("blue", "blueberry"): "🫐",
    ("purple", "grapes"): "🍇", ("purple", "eggplant"): "🍆",
    ("brown", "chocolate"): "🍫", ("brown", "chestnut"): "🌰", ("brown", "log"): "🪵",
    ("black", "hat"): "🎩", ("black", "cat"): "🐈‍⬛",
    ("white", "swan"): "🦢", ("white", "sheep"): "🐑", ("white", "egg"): "🥚",
    ("white", "snowman"): "⛄", ("white", "cloud"): "☁️", ("white", "milk"): "🥛",
    ("pink", "pig"): "🐷", ("pink", "flamingo"): "🦩",
}
CLOSE_COLORS = {frozenset(pair) for pair in [("red", "orange"), ("red", "pink"), ("orange", "yellow"),
                ("orange", "brown"), ("blue", "purple"), ("purple", "pink"), ("black", "brown")]}
EN_IRREGULAR_PLURALS = {"MICE", "SHEEP", "FISH", "GEESE", "TEETH", "FEET", "CHILDREN", "MEN", "WOMEN", "DEER"}
EN_SINGULAR_S = {"BUS", "DRESS", "GLASS", "CACTUS", "OCTOPUS"}   # singular nouns that end in S
# Russian forms that are always spelled with Ё; their Е spelling is an error in a phrase pack.
RU_YO_WORDS = {
    stem + ending
    for stem in ("ЗЕЛЁН", "ЖЁЛТ", "ЧЁРН", "ВЕСЁЛ", "ТЁПЛ")
    for ending in ("ЫЙ", "АЯ", "ОЕ", "ЫЕ", "ЫХ", "ОГО", "ОЙ", "УЮ", "ЫМ", "ЫМИ", "ОМУ", "ОМ")
} - {"ТЁПЛОМ"} | {
    "ИДЁТ", "ПЛЫВЁТ", "ПОЁТ", "ГРЕБЁТ", "СМЕЁТСЯ", "ЖИВЁТ", "НЕСЁТ", "ВЕДЁТ", "ЗОВЁТ", "ПЬЁТ", "ЖУЁТ",
    "ПРИШЁЛ", "НАШЁЛ", "ПОШЁЛ", "УШЁЛ", "ПЁС", "ЁЖ", "ЁЖИК", "КОТЁНОК", "КОТЁНКА", "ЦЫПЛЁНОК",
    "ЦЫПЛЁНКА", "ПОРОСЁНОК", "ПОРОСЁНКА", "ЛИСЁНОК", "СЛОНЁНОК", "УТЁНОК", "ЛЁД", "ЁЛКА", "ЁЛКИ",
    "ЕЩЁ", "ЕЁ", "САМОЛЁТ", "МЁД", "ОРЁЛ", "КЛЁН", "БЕРЁЗА", "ПЧЁЛКА", "ЗВЁЗД", "ЗВЁЗДОЧКА",
    # Forms the stories need. A form whose Е spelling is another word (ВСЁ, ПОЁМ) never goes here.
    "ДАЁТ", "ВСТАЁТ", "ЛЁГ", "ПРИНЁС", "ГРЫЗЁТ", "ИДЁМ", "ЁЖИКА", "ЁЖИКУ", "ЖДЁТ", "КЛЮЁТ", "ПЕЧЁТ",
    "НЁС", "КЛАДЁТ", "ВЕЗЁТ", "ЁЛКУ", "ШЬЁТ", "ЛЬЁТ", "ДНЁМ", "ДОСТАЁТ", "РВЁТ", "УНЁС", "ПОЙДЁТ",
}
RU_YO_AS_E = {word.replace("Ё", "Е"): word for word in RU_YO_WORDS}
PHRASE_ID = re.compile(r"^[a-z]+(-[a-z]+)*$")
PHRASE_KINDS = ("color", "number", "size", "action")
MODIFIER_ORDER = ["number", "size", "color"]

# Story levels: stories.<lang>.<a|b|c>.json, a chapter is one story of short sentences read in order.
# level -> sentences per task and, per language, (min words, max words, longest word) per sentence.
# English articles do not count as words: THE CAT DRINKS MILK is a three-word sentence.
STORY_LEVELS = {
    "a": (1, {"en": (3, 3, 7), "ru": (3, 3, 9)}),
    "b": (1, {"en": (4, 5, 8), "ru": (4, 5, 10)}),
    "c": (2, {"en": (3, 5, 8), "ru": (3, 5, 10)}),
}
STORY_ALPHABETS = {
    "en": re.compile(r"^[A-Z]+( [A-Z]+)*[.!]( [A-Z]+( [A-Z]+)*[.!])*$"),
    "ru": re.compile(r"^[А-ЯЁ]+( [А-ЯЁ]+)*[.!]( [А-ЯЁ]+( [А-ЯЁ]+)*[.!])*$"),
}
STORY_ID = re.compile(r"^[a-z]+(-[a-z]+)*(\.[a-z]+(-[a-z]+)*)*$")
EN_ARTICLES = {"A", "AN", "THE"}
MAX_SPLIT_WORD = 12          # characters of a split word on the card, its final full stop included
# A story level is two hundred tasks too; a sentence may come back once, never in the same chapter.
MIN_UNIQUE_SENTENCES = {"a": 170, "b": 170, "c": 340}
MAX_SENTENCE_REPEATS = 2
# Most verbs have no picture and are read but never checked, so the tasks that change a pictured
# verb have a floor of their own, as do the number, size and color changes in levels B and C.
MIN_VERB_TASKS = {"a": 20, "b": 20, "c": 20}
MIN_MODIFIER_TASKS = 30      # levels b and c
# A panel is a scene of 2-3 emoji: a badge is not counted, every counted copy is.
MIN_SCENE_EMOJI = 2
MAX_SCENE_EMOJI = 3
MAX_SCENE_UNITS = 4.5        # layout units per panel: an item 1, a big item 1.25, a gap 0.5
MAX_PHRASE_LIKE_SHARE = 0.2  # warning: sentences with no glue word, a phrase with a full stop
MAX_CONTEXT_GIVEAWAY_SHARE = 0.3   # warning: tasks the story so far answers without reading
# Pictures a child takes for each other: a wrong answer never swaps them (close colors likewise).
LOOKALIKE_NOUNS = {frozenset(pair) for pair in [("teddy", "bear"), ("mom", "girl"), ("horse", "carousel"),
                                                  ("boat", "sailboat"), ("island", "beach")]}
# The intro check compares words, so the case forms of the recurring cast count as one word there.
# A table, not a stemmer; English possessives (TOM'S) already split into TOM and S.
CAST_FORMS = {
    form: name
    for name, forms in {
        "ПЕТЯ": "ПЕТИ ПЕТЕ ПЕТЮ ПЕТЕЙ ПЕТИН ПЕТИНА ПЕТИНО ПЕТИНЫ ПЕТИНУ ПЕТИНОЙ",
        "МАША": "МАШИ МАШЕ МАШУ МАШЕЙ",   # not МАШИН...: those are forms of МАШИНА, a car
        "МАМА": "МАМЫ МАМЕ МАМУ МАМОЙ МАМИН МАМИНА МАМИНО МАМИНЫ МАМИНУ МАМИНОЙ",
        "ПАПА": "ПАПЫ ПАПЕ ПАПУ ПАПОЙ ПАПИН ПАПИНА ПАПИНО ПАПИНЫ ПАПИНУ ПАПИНОЙ",
        "ДЕД": "ДЕДА ДЕДУ ДЕДОМ ДЕДЕ",
        "БАБУШКА": "БАБУШКИ БАБУШКЕ БАБУШКУ БАБУШКОЙ БАБУШКИН БАБУШКИНА БАБУШКИНО БАБУШКИНЫ",
        "КОТ": "КОТА КОТУ КОТОМ КОТЕ",
        "ПЁС": "ПСА ПСУ ПСОМ ПСЕ",
    }.items()
    for form in [name, *forms.split()]
}
# The 🎵 badge on a correct sentence: only subjects that really sing in that language. ПЕТУХ ПОЁТ is
# idiomatic Russian; ROOSTER SINGS is not English.
SINGING_SUBJECTS = {
    "en": {"mom", "dad", "grandma", "grandpa", "boy", "girl", "baby", "clown", "bird"},
    "ru": {"mom", "dad", "grandma", "grandpa", "boy", "girl", "baby", "clown", "bird", "rooster"},
}
PRONOUN_SLUGS = {"he", "she", "it", "they", "him", "her", "them"}
# The people of a story: a wrong answer of a two-sentence task may swap one that both sentences name.
STORY_PEOPLE = {"mom", "dad", "grandma", "grandpa", "boy", "girl", "baby"}
# Glue words are read but never drawn, and a wrong answer never changes them. English never splits
# the function words among them.
FUNCTION_SLUGS = PRONOUN_SLUGS | {
    # prepositions
    "on", "in", "under", "to", "from", "with", "by", "behind", "over", "along", "for",
    # possession: У, HAS
    "have",
    # articles
    "the", "a",
    "and",
}
GLUE_SLUGS = FUNCTION_SLUGS | {
    # adverbs
    "here", "there", "now", "again", "too", "fast", "very",
    # verbs with no picture; drive is riding in a vehicle, toy is playing with something
    "drink", "eat", "gnaw", "read", "carry", "give", "drive", "toy", "see", "find", "look", "like",
    "want", "take", "hold", "bring", "catch", "build", "wash", "open", "hide", "wake", "sit", "lie",
    "live", "fly", "jump", "go", "seek", "knit", "call", "wait", "lick", "sniff", "roll", "hug",
    "pick", "throw", "chase", "feed", "pull", "dig", "buy", "put", "make", "meet", "sew", "fix",
    "plant", "rock", "stroke", "peck", "drag", "lose", "hear", "grow", "knock", "pour",
    "scare", "wear", "cut", "wipe", "warm", "kick", "praise", "lead", "light", "snuff",
    # the verb ПОЛИВАЕТ and the noun ВОДА, which is never drawn either
    "water",
    # places and times with no emoji of their own
    "forest", "park", "garden", "field", "river", "yard", "street", "town",
    "morning", "day", "evening", "night",
} | {verb for _, verb in VERB_PICTURES}   # glue for a subject that has no picture of them

require_all = "--all" in sys.argv
errors: list[str] = []
warnings: list[str] = []


def load_json(file_name: str):
    with open(CONTENT_DIR / file_name, encoding="utf-8") as handle:
        return json.load(handle)


def key_paths(value, prefix=""):
    if isinstance(value, dict):
        for key, child in value.items():
            yield from key_paths(child, f"{prefix}.{key}" if prefix else key)
    else:
        yield prefix


def validate_ui():
    en = load_json("ui.en.json")
    ru = load_json("ui.ru.json")
    en_keys = set(key_paths(en))
    ru_keys = set(key_paths(ru))
    for key in en_keys - ru_keys:
        errors.append(f'ui.ru.json: missing key "{key}"')
    for key in ru_keys - en_keys:
        errors.append(f'ui.en.json: missing key "{key}"')


def validate_task(file_name, pack, chapter, task, task_index, seen_words):
    where = f'{file_name}: chapter "{chapter.get("id")}", task {task_index + 1}'
    alphabet = WORD_ALPHABETS[pack["language"]]

    for field in ("word", "syllables", "prompt", "success", "correct"):
        if not isinstance(task.get(field), str) or not task[field].strip():
            errors.append(f'{where}: field "{field}" is missing or empty')
            return

    word = task["word"]
    if len(word) != pack["letters"]:
        errors.append(f'{where}: word "{word}" has {len(word)} letters, expected {pack["letters"]}')
    if not alphabet.match(word):
        errors.append(f'{where}: word "{word}" has characters outside the {pack["language"]} uppercase alphabet')
    if task["syllables"].replace("-", "") != word:
        errors.append(f'{where}: syllables "{task["syllables"]}" do not spell the word "{word}"')
    if word in seen_words:
        errors.append(f'{where}: word "{word}" repeats inside the chapter')
    seen_words.add(word)

    choices = task.get("choices")
    if not isinstance(choices, list) or len(choices) != 3:
        errors.append(f"{where}: expected exactly 3 choices")
        return

    ids, emojis, labels = set(), set(), set()
    for choice in choices:
        if not choice.get("id") or not choice.get("emoji") or not choice.get("label"):
            errors.append(f"{where}: a choice is missing id, emoji or label")
            continue
        if TEXT_LETTERS.search(choice["emoji"]):
            errors.append(f'{where}: choice "{choice["id"]}" emoji "{choice["emoji"]}" contains letters or digits')
        ids.add(choice["id"])
        emojis.add(choice["emoji"])
        labels.add(choice["label"].lower())
    if len(ids) != 3:
        errors.append(f"{where}: choice ids are not unique")
    if len(emojis) != 3:
        errors.append(f"{where}: choice emojis are not unique")
    if len(labels) != 3:
        errors.append(f"{where}: choice labels are not unique")
    if task["correct"] not in ids:
        errors.append(f'{where}: correct id "{task["correct"]}" is not among the choices')

    correct_choice = next((choice for choice in choices if choice.get("id") == task["correct"]), None)
    if correct_choice and correct_choice["label"].upper() != word:
        errors.append(
            f'{where}: label of the correct choice "{correct_choice["label"]}" does not match the word "{word}"'
        )


def validate_pack(language, letters):
    file_name = f"words.{language}.{letters}.json"
    if not (CONTENT_DIR / file_name).exists():
        (errors if require_all else warnings).append(f"{file_name}: file is missing")
        return

    pack = load_json(file_name)
    if pack.get("language") != language:
        errors.append(f'{file_name}: language "{pack.get("language")}" does not match the file name')
    if pack.get("letters") != letters:
        errors.append(f'{file_name}: letters {pack.get("letters")} do not match the file name')
    chapters = pack.get("chapters")
    if not isinstance(chapters, list) or len(chapters) != CHAPTERS_PER_LEVEL:
        errors.append(f"{file_name}: expected {CHAPTERS_PER_LEVEL} chapters, found {len(chapters or [])}")
        return

    chapter_ids = set()
    word_counts: dict[str, int] = {}
    unsplit_words = 0
    split_words = 0
    letter_split_words = 0

    for chapter_index, chapter in enumerate(chapters):
        where = f"{file_name}: chapter {chapter_index + 1}"
        for field in ("id", "title", "emoji", "character", "completeText"):
            if not isinstance(chapter.get(field), str) or not chapter[field].strip():
                errors.append(f'{where}: field "{field}" is missing or empty')
        if chapter.get("id") in chapter_ids:
            errors.append(f'{where}: duplicate chapter id "{chapter.get("id")}"')
        chapter_ids.add(chapter.get("id"))
        colors = chapter.get("colors")
        if (
            not isinstance(colors, list)
            or len(colors) != 2
            or not all(isinstance(color, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", color) for color in colors)
        ):
            errors.append(f"{where}: colors must be two hex values")
        tasks = chapter.get("tasks")
        if not isinstance(tasks, list) or len(tasks) != WORDS_PER_CHAPTER:
            errors.append(f"{where}: expected {WORDS_PER_CHAPTER} tasks, found {len(tasks or [])}")
            continue

        seen_words: set[str] = set()
        for task_index, task in enumerate(tasks):
            validate_task(file_name, pack, chapter, task, task_index, seen_words)
            word = task.get("word")
            if word:
                word_counts[word] = word_counts.get(word, 0) + 1
                syllables = task.get("syllables") or ""
                if syllables == word:
                    unsplit_words += 1
                elif "-" in syllables:
                    split_words += 1
                    if all(len(part) == 1 for part in syllables.split("-")):
                        letter_split_words += 1

    max_repeat = max(word_counts.values(), default=0)
    print(f"{file_name}: {len(word_counts)} unique words, max repeats per word: {max_repeat}")

    # Content quality signals. Warnings only: the packs are playable as they
    # are, but these weaken the hint mechanic or the promises in the texts.
    total_words = sum(word_counts.values())
    if unsplit_words:
        warnings.append(
            f"{file_name}: {unsplit_words} of {total_words} tasks have syllables identical to the"
            " word, so the game offers no parts hint on them at all"
        )
    if word_counts:
        top_word, top_count = max(word_counts.items(), key=lambda item: item[1])
        if len(word_counts) < MIN_UNIQUE_WORDS:
            errors.append(
                f"{file_name}: only {len(word_counts)} unique words across {total_words} tasks,"
                f" fewer than the {MIN_UNIQUE_WORDS} a level has to hold"
            )
        if top_count > MAX_WORD_REPEATS:
            errors.append(
                f'{file_name}: "{top_word}" is repeated {top_count} times, more than the'
                f" {MAX_WORD_REPEATS} times one word may appear in a level"
            )
    if split_words and split_words == letter_split_words:
        warnings.append(
            f"{file_name}: every split is letter by letter, not by syllables, while the UI"
            " labels the parts the same way as in the syllable packs"
        )


def validate_spell_task(file_name, pack, chapter, task, task_index, seen_words):
    where = f'{file_name}: chapter "{chapter.get("id")}", task {task_index + 1}'
    alphabet = WORD_ALPHABETS[pack["language"]]

    for field in ("word", "emoji", "prompt", "success"):
        if not isinstance(task.get(field), str) or not task[field].strip():
            errors.append(f'{where}: field "{field}" is missing or empty')
            return

    word = task["word"]
    if len(word) != pack["letters"]:
        errors.append(f'{where}: word "{word}" has {len(word)} letters, expected {pack["letters"]}')
    if not alphabet.match(word):
        errors.append(f'{where}: word "{word}" has characters outside the {pack["language"]} uppercase alphabet')
    if word in seen_words:
        errors.append(f'{where}: word "{word}" repeats inside the chapter')
    seen_words.add(word)
    if TEXT_LETTERS.search(task["emoji"]):
        errors.append(f'{where}: emoji "{task["emoji"]}" contains letters or digits')
    if re.search(rf"\b{re.escape(word)}\b", task["prompt"], re.IGNORECASE):
        errors.append(f'{where}: the prompt gives away the answer "{word}"')

    choices = task.get("choices")
    if not isinstance(choices, list) or len(choices) != 3:
        errors.append(f"{where}: expected exactly 3 choices")
        return
    if len(set(choices)) != 3:
        errors.append(f"{where}: choices are not unique")
        return
    if word not in choices:
        errors.append(f'{where}: the word "{word}" is not among the choices')
    for choice in choices:
        if not isinstance(choice, str) or len(choice) != len(word) or not alphabet.match(choice):
            errors.append(f'{where}: choice "{choice}" is not a {len(word)}-letter word of the same alphabet')
            return

    # The whole point of the mode: the three words differ in exactly one letter,
    # and always in the same place, so the child has one column to compare.
    changing = [index for index in range(len(word)) if len({choice[index] for choice in choices}) > 1]
    if len(changing) != 1:
        errors.append(
            f'{where}: choices {choices} differ in {len(changing)} letter positions, expected exactly 1'
        )


def validate_spell_pack(language, letters, limits):
    chapters_per_pack, min_unique_words, max_word_repeats = limits
    file_name = f"spell.{language}.{letters}.json"
    if not (CONTENT_DIR / file_name).exists():
        (errors if require_all else warnings).append(f"{file_name}: file is missing")
        return

    pack = load_json(file_name)
    if pack.get("language") != language:
        errors.append(f'{file_name}: language "{pack.get("language")}" does not match the file name')
    if pack.get("letters") != letters:
        errors.append(f'{file_name}: letters {pack.get("letters")} do not match the file name')
    if pack.get("mode") != "spell":
        errors.append(f'{file_name}: mode "{pack.get("mode")}" is not "spell"')
    chapters = pack.get("chapters")
    if not isinstance(chapters, list) or len(chapters) != chapters_per_pack:
        errors.append(f"{file_name}: expected {chapters_per_pack} chapters, found {len(chapters or [])}")
        return

    chapter_ids = set()
    word_counts: dict[str, int] = {}
    task_counts: dict[tuple, int] = {}
    first_letter_tasks = 0

    for chapter_index, chapter in enumerate(chapters):
        where = f"{file_name}: chapter {chapter_index + 1}"
        for field in ("id", "title", "emoji", "character", "completeText"):
            if not isinstance(chapter.get(field), str) or not chapter[field].strip():
                errors.append(f'{where}: field "{field}" is missing or empty')
        if chapter.get("id") in chapter_ids:
            errors.append(f'{where}: duplicate chapter id "{chapter.get("id")}"')
        chapter_ids.add(chapter.get("id"))
        colors = chapter.get("colors")
        if (
            not isinstance(colors, list)
            or len(colors) != 2
            or not all(isinstance(color, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", color) for color in colors)
        ):
            errors.append(f"{where}: colors must be two hex values")
        tasks = chapter.get("tasks")
        if not isinstance(tasks, list) or len(tasks) != WORDS_PER_CHAPTER:
            errors.append(f"{where}: expected {WORDS_PER_CHAPTER} tasks, found {len(tasks or [])}")
            continue

        seen_words: set[str] = set()
        for task_index, task in enumerate(tasks):
            validate_spell_task(file_name, pack, chapter, task, task_index, seen_words)
            word = task.get("word")
            if word:
                word_counts[word] = word_counts.get(word, 0) + 1
            choices = task.get("choices")
            if (
                isinstance(choices, list)
                and choices
                and all(isinstance(choice, str) and choice for choice in choices)
            ):
                if word:
                    same_task = (word, tuple(sorted(choices)))
                    task_counts[same_task] = task_counts.get(same_task, 0) + 1
                if len({choice[0] for choice in choices}) > 1:
                    first_letter_tasks += 1

    max_repeat = max(word_counts.values(), default=0)
    print(f"{file_name}: {len(word_counts)} unique words, max repeats per word: {max_repeat}")

    total_words = sum(word_counts.values())
    if word_counts:
        top_word, top_count = max(word_counts.items(), key=lambda item: item[1])
        if len(word_counts) < min_unique_words:
            errors.append(
                f"{file_name}: only {len(word_counts)} unique words across {total_words} tasks,"
                f" fewer than the {min_unique_words} this pack has to hold"
            )
        if top_count > max_word_repeats:
            errors.append(
                f'{file_name}: "{top_word}" is repeated {top_count} times, more than the'
                f" {max_word_repeats} times one word may appear in this pack"
            )

    # Content quality signals. Warnings only, like the ones for the levels.
    for (word, choices), count in task_counts.items():
        if count > MAX_SAME_SPELL_TASK:
            warnings.append(
                f'{file_name}: "{word}" comes back {count} times with the same choices {list(choices)},'
                f" more than {MAX_SAME_SPELL_TASK}; a repeated word should get new distractors"
            )
    if total_words and first_letter_tasks / total_words > MAX_FIRST_LETTER_SHARE:
        warnings.append(
            f"{file_name}: {first_letter_tasks} of {total_words} tasks change the first letter, more than"
            f" {MAX_FIRST_LETTER_SHARE:.0%}, so guessing by the first letter works too often"
        )


def validate_chapter_header(where, chapter, chapter_ids):
    for field in ("id", "title", "emoji", "character", "completeText"):
        if not isinstance(chapter.get(field), str) or not chapter[field].strip():
            errors.append(f'{where}: field "{field}" is missing or empty')
    if chapter.get("id") in chapter_ids:
        errors.append(f'{where}: duplicate chapter id "{chapter.get("id")}"')
    chapter_ids.add(chapter.get("id"))
    colors = chapter.get("colors")
    if (
        not isinstance(colors, list)
        or len(colors) != 2
        or not all(isinstance(color, str) and re.fullmatch(r"#[0-9a-fA-F]{6}", color) for color in colors)
    ):
        errors.append(f"{where}: colors must be two hex values")


# Registries shared by the phrase packs. Meaning -> picture spans both languages;
# the forms and the splits are kept per language.
phrase_pictures: dict[tuple, tuple] = {}
phrase_forms: dict[tuple, tuple] = {}
phrase_splits: dict[tuple, tuple] = {}
word_pack_splits_cache: dict[str, dict] = {}


def word_pack_splits(language):
    if language not in word_pack_splits_cache:
        splits: dict[str, set] = {}
        for letters in LEVELS:
            file_name = f"words.{language}.{letters}.json"
            if not (CONTENT_DIR / file_name).exists():
                continue
            for chapter in load_json(file_name).get("chapters") or []:
                for task in chapter.get("tasks") or []:
                    if isinstance(task.get("word"), str) and isinstance(task.get("syllables"), str):
                        splits.setdefault(task["word"], set()).add(task["syllables"])
        word_pack_splits_cache[language] = splits
    return word_pack_splits_cache[language]


def slug_class(slug):
    if slug in NUMBER_SLUGS:
        return "number"
    if slug in SIZE_SLUGS:
        return "size"
    if slug in COLOR_SLUGS:
        return "color"
    if slug in VERB_SLUGS:
        return "verb"
    return "noun"


def phrase_pattern_error(classes):
    """Returns why the word classes do not form a phrase, or None when they do."""
    if classes[-1] == "verb":
        modifiers, subject = classes[:-2], classes[-2]
        if subject != "noun":
            return "the word before the verb is not a noun"
    elif classes[-1] == "noun":
        modifiers = classes[:-1]
    else:
        return "the phrase ends neither in a noun nor in a known verb"
    if any(kind not in MODIFIER_ORDER for kind in modifiers):
        return (
            "a word before the noun is neither a number, a size or a color nor a known verb"
            f" (known verbs: {', '.join(sorted(VERB_SLUGS))})"
        )
    order = [MODIFIER_ORDER.index(kind) for kind in modifiers]
    if order != sorted(set(order)):
        return "the modifiers must come in the order number, size, color, each kind once"
    return None


def number_class(value):
    if value is None or value == 1:
        return "one"
    return "2-4" if value <= 4 else "5-10"


def register_form(language, key, form, where, what):
    known = phrase_forms.get((language, key))
    if known is None:
        phrase_forms[(language, key)] = (form, where)
    elif known[0] != form:
        errors.append(f'{where}: {what} is "{form}" here but "{known[0]}" in {known[1]}')


def register_picture(key, picture, where):
    known = phrase_pictures.get(key)
    if known is None:
        phrase_pictures[key] = (picture, where)
    elif known[0] != picture:
        errors.append(
            f'{where}: "{"-".join(key)}" is drawn as {"".join(picture)} here but as'
            f' {"".join(known[0])} in {known[1]}'
        )


def phrase_tokens(text):
    return [token.upper() for token in re.findall(r"[A-Za-zА-Яа-яЁё]+", text)]


def check_yo(where, field, text):
    if field == "syllables":
        text = text.replace("-", "")
    for token in phrase_tokens(text):
        if token in RU_YO_AS_E:
            errors.append(f'{where}: {field} spells "{token}" without Ё, write "{RU_YO_AS_E[token]}"')


def check_phrase_choice(where, language, choice, slugs, classes, label_words):
    """Checks that the picture of one choice matches its words and records its forms."""
    choice_id = choice["id"]
    noun_position = classes.index("noun")
    noun = slugs[noun_position]
    number = next((slug for slug, kind in zip(slugs, classes) if kind == "number"), None)
    size = next((slug for slug, kind in zip(slugs, classes) if kind == "size"), None)
    color = next((slug for slug, kind in zip(slugs, classes) if kind == "color"), None)
    verb = slugs[-1] if classes[-1] == "verb" else None
    value = NUMBER_SLUGS[number] if number else None
    count = choice.get("count")
    valid_count = isinstance(count, int) and not isinstance(count, bool) and 1 <= count <= 10

    if number is None and "count" in choice:
        errors.append(f'{where}: choice "{choice_id}" has a count but no number word')
    if number is not None:
        if "count" not in choice:
            errors.append(f'{where}: choice "{choice_id}" has the number "{number}" but no count')
        elif not valid_count:
            errors.append(f'{where}: choice "{choice_id}" count {count!r} is not an integer from 1 to 10')
        elif count != value:
            errors.append(f'{where}: choice "{choice_id}" count {count} does not match the number "{number}"')
        numeral = label_words[classes.index("number")].upper()
        if NUMBER_WORDS[language].get(numeral) != value:
            errors.append(f'{where}: choice "{choice_id}" label word "{numeral}" is not the number {value}')

    if size is None and "size" in choice:
        errors.append(f'{where}: choice "{choice_id}" has a size but no size word')
    if size is not None:
        if choice.get("size") != size:
            errors.append(f'{where}: choice "{choice_id}" size must be "{size}", found {choice.get("size")!r}')
        if valid_count and count > MAX_COUNT_WITH_SIZE:
            errors.append(
                f'{where}: choice "{choice_id}" has a size and a count of {count},'
                f" more than {MAX_COUNT_WITH_SIZE}"
            )

    badge = BADGE_VERBS.get(verb) if verb else None
    if badge is None and "badge" in choice:
        errors.append(f'{where}: choice "{choice_id}" has a badge, which only a sleep or sing phrase may carry')
    if badge is not None:
        if choice.get("badge") != badge:
            errors.append(f'{where}: choice "{choice_id}" must carry the badge {badge}')
        if valid_count and count > MAX_COUNT_WITH_BADGE:
            errors.append(
                f'{where}: choice "{choice_id}" has a badge and a count of {count},'
                f" more than {MAX_COUNT_WITH_BADGE}"
            )
    if verb and badge is None:
        picture = VERB_PICTURES.get((noun, verb))
        if picture is None:
            errors.append(f'{where}: choice "{choice_id}": VERB_PICTURES has no picture of "{noun}" doing "{verb}"')
        elif choice["emoji"] != picture:
            errors.append(f'{where}: choice "{choice_id}" must be drawn as {picture}, found {choice["emoji"]}')
    if color:
        picture = COLOR_PICTURES.get((color, noun))
        if picture is None:
            errors.append(
                f'{where}: choice "{choice_id}": COLOR_PICTURES has no {color} {noun}; the emoji must'
                " genuinely have that color"
            )
        elif choice["emoji"] != picture:
            errors.append(f'{where}: choice "{choice_id}" must be drawn as {picture}, found {choice["emoji"]}')

    # Meaning -> picture: the words without the number and the size always look the same, and a
    # badge sits on the subject's own picture.
    meaning = tuple(slug for slug, kind in zip(slugs, classes) if kind not in ("number", "size"))
    register_picture(meaning, (choice["emoji"], choice.get("badge") or ""), where)
    if badge is not None:
        register_picture(meaning[:-1], (choice["emoji"], ""), where)

    # Form consistency: one spelling per slug and context. A typo check, not a grammar check.
    amount = number_class(value)
    for slug, kind, form in zip(slugs, classes, (word.upper() for word in label_words)):
        if kind == "noun":
            register_form(language, ("noun", slug, amount), form, where, f'the noun "{slug}" with {amount}')
        elif kind in ("color", "size"):
            register_form(language, (kind, slug, noun, amount), form, where, f'"{slug}" with "{noun}", {amount}')
        elif kind == "number":
            register_form(language, ("number", slug, noun), form, where, f'the number "{slug}" with "{noun}"')
        else:
            plural = "plural" if value and value > 1 else "singular"
            register_form(language, ("verb", slug, plural), form, where, f'the {plural} verb "{slug}"')

    if language == "en":
        noun_word = label_words[noun_position].upper()
        if value is not None and value > 1:
            if not noun_word.endswith("S") and noun_word not in EN_IRREGULAR_PLURALS:
                errors.append(f'{where}: choice "{choice_id}" noun "{noun_word}" is not plural after {number}')
        elif value == 1:
            if noun_word in EN_IRREGULAR_PLURALS or (noun_word.endswith("S") and noun_word not in EN_SINGULAR_S):
                errors.append(f'{where}: choice "{choice_id}" noun "{noun_word}" is not singular after one')
        if verb:
            verb_word = label_words[-1].upper()
            if value is not None and value > 1:
                if verb_word.endswith("S") and not verb_word.endswith("SS"):
                    errors.append(f'{where}: choice "{choice_id}" verb "{verb_word}" takes no -S after a plural')
            elif not verb_word.endswith("S"):
                errors.append(f'{where}: choice "{choice_id}" verb "{verb_word}" needs -S after a singular')


def validate_phrase_task(file_name, language, level, chapter, task, task_index, seen_phrases):
    """Checks one phrase task; returns what the pack-level checks need, or None if it is broken."""
    where = f'{file_name}: chapter "{chapter.get("id")}", task {task_index + 1}'
    word_count, limits = PHRASE_LEVELS[level]
    min_letters, max_letters, longest_word, long_word = limits[language]

    for field in ("word", "syllables", "prompt", "success", "correct"):
        if not isinstance(task.get(field), str) or not task[field].strip():
            errors.append(f'{where}: field "{field}" is missing or empty')
            return None

    word = task["word"]
    if not PHRASE_ALPHABETS[language].match(word):
        errors.append(f'{where}: phrase "{word}" is not {language} upper-case words separated by single spaces')
        return None
    words = word.split(" ")
    if len(words) != word_count:
        errors.append(f'{where}: phrase "{word}" has {len(words)} words, expected {word_count}')
    letters = len(word.replace(" ", ""))
    if not min_letters <= letters <= max_letters:
        errors.append(f'{where}: phrase "{word}" has {letters} letters, expected {min_letters}-{max_letters}')
    if max(len(part) for part in words) > longest_word:
        errors.append(f'{where}: phrase "{word}" has a word longer than {longest_word} letters')
    if long_word and max(len(part) for part in words) < long_word:
        errors.append(f'{where}: phrase "{word}" needs a word of at least {long_word} letters')
    if word in seen_phrases:
        errors.append(f'{where}: phrase "{word}" repeats inside the chapter')
    seen_phrases.add(word)

    syllables = task["syllables"]
    split_words = syllables.split(" ")
    if syllables.replace("-", "") != word or len(split_words) != len(words):
        errors.append(f'{where}: syllables "{syllables}" do not spell the phrase "{word}"')
    elif any(part == "" for split in split_words for part in split.split("-")):
        errors.append(f'{where}: syllables "{syllables}" have an empty part')
    else:
        pack_splits = word_pack_splits(language)
        for phrase_word, split in zip(words, split_words):
            known = phrase_splits.get((language, phrase_word))
            if known is None:
                phrase_splits[(language, phrase_word)] = (split, where)
            elif known[0] != split:
                errors.append(f'{where}: "{phrase_word}" is split "{split}" here but "{known[0]}" in {known[1]}')
            if phrase_word in pack_splits and split not in pack_splits[phrase_word]:
                warnings.append(
                    f'{where}: "{phrase_word}" is split "{split}", but the word packs split it'
                    f' {" or ".join(sorted(pack_splits[phrase_word]))}'
                )

    choices = task.get("choices")
    if not isinstance(choices, list) or len(choices) != 3:
        errors.append(f"{where}: expected exactly 3 choices")
        return None
    for choice in choices:
        if not isinstance(choice, dict) or not all(
            isinstance(choice.get(field), str) and choice[field].strip() for field in ("id", "emoji", "label")
        ):
            errors.append(f"{where}: a choice is missing id, emoji or label")
            return None

    ids = {choice["id"] for choice in choices}
    if len(ids) != 3:
        errors.append(f"{where}: choice ids are not unique")
        return None
    if len({choice["label"].lower() for choice in choices}) != 3:
        errors.append(f"{where}: choice labels are not unique")
    pictures = set()
    for choice in choices:
        for field in ("emoji", "badge"):
            if isinstance(choice.get(field), str) and TEXT_LETTERS.search(choice[field]):
                errors.append(f'{where}: choice "{choice["id"]}" {field} "{choice[field]}" contains letters or digits')
        count = choice.get("count")
        pictures.add((choice["emoji"], repr(count if count is not None else 1), repr(choice.get("size") or ""),
                      repr(choice.get("badge") or "")))
    if len(pictures) != 3:
        errors.append(f"{where}: two choices have the same picture")
    if task["correct"] not in ids:
        errors.append(f'{where}: correct id "{task["correct"]}" is not among the choices')
        return None

    parsed = {}
    for choice in choices:
        if not PHRASE_ID.match(choice["id"]) or len(choice["id"].split("-")) != len(words):
            errors.append(f'{where}: choice id "{choice["id"]}" is not {len(words)} slugs joined by "-"')
            return None
        label_words = choice["label"].split(" ")
        if len(label_words) != len(words):
            errors.append(f'{where}: choice label "{choice["label"]}" does not have {len(words)} words')
            return None
        slugs = choice["id"].split("-")
        parsed[choice["id"]] = (choice, slugs, [slug_class(slug) for slug in slugs], label_words)

    correct_choice, correct_slugs, correct_classes, correct_words = parsed[task["correct"]]
    pattern_error = phrase_pattern_error(correct_classes)
    if pattern_error:
        errors.append(f'{where}: "{task["correct"]}": {pattern_error}')
        return None
    if correct_choice["label"].upper() != word:
        errors.append(f'{where}: label of the correct choice "{correct_choice["label"]}" does not match "{word}"')

    distractors = [entry for choice_id, entry in parsed.items() if choice_id != task["correct"]]
    changed_positions = []
    giveaways = set()
    for choice, slugs, classes, label_words in distractors:
        changed = [index for index in range(len(words)) if slugs[index] != correct_slugs[index]]
        if len(changed) != 1:
            errors.append(f'{where}: distractor "{choice["id"]}" changes {len(changed)} words, expected exactly 1')
            continue
        position = changed[0]
        changed_positions.append(position)
        if classes[position] != correct_classes[position]:
            errors.append(
                f'{where}: distractor "{choice["id"]}" turns a {correct_classes[position]}'
                f" into a {classes[position]}"
            )
            continue
        giveaways.update({correct_words[position].upper(), label_words[position].upper()})
        if classes[position] == "color" and frozenset((slugs[position], correct_slugs[position])) in CLOSE_COLORS:
            warnings.append(
                f'{where}: distractor "{choice["id"]}" swaps {correct_slugs[position]} for'
                f" {slugs[position]}, a close pair"
            )
    if len(changed_positions) == 2 and changed_positions[0] == changed_positions[1]:
        errors.append(f"{where}: both distractors change word {changed_positions[0] + 1}; they must change different words")

    for choice, slugs, classes, label_words in parsed.values():
        if phrase_pattern_error(classes) is None:
            check_phrase_choice(where, language, choice, slugs, classes, label_words)

    for token in phrase_tokens(task["prompt"]):
        if token in giveaways:
            errors.append(f'{where}: the prompt gives away the changed word "{token}"')

    kinds = {kind for kind in ("color", "number", "size") if kind in correct_classes}
    if correct_classes[-1] == "verb":
        kinds.add("action")
    return {
        "phrase": word,
        "letters": letters,
        "kinds": kinds,
        "noun": correct_slugs[correct_classes.index("noun")],
        "unchanged": [index for index in range(len(words)) if index not in changed_positions],
        "task": (word, tuple(sorted(choice["id"] for choice, *_ in distractors))),
    }


def validate_phrase_pack(language, level):
    file_name = f"phrases.{language}.{level}.json"
    if not (CONTENT_DIR / file_name).exists():
        (errors if require_all else warnings).append(f"{file_name}: file is missing")
        return

    pack = load_json(file_name)
    if pack.get("language") != language:
        errors.append(f'{file_name}: language "{pack.get("language")}" does not match the file name')
    if pack.get("mode") != "phrase":
        errors.append(f'{file_name}: mode "{pack.get("mode")}" is not "phrase"')
    if pack.get("level") != level:
        errors.append(f'{file_name}: level {pack.get("level")!r} does not match the file name')
    chapters = pack.get("chapters")
    if not isinstance(chapters, list):
        errors.append(f"{file_name}: chapters must be a list")
        return
    # A pack is written five chapters at a time, so a short pack still gets its task checks.
    if len(chapters) != CHAPTERS_PER_LEVEL:
        errors.append(f"{file_name}: expected {CHAPTERS_PER_LEVEL} chapters, found {len(chapters)}")

    chapter_ids = set()
    infos = []
    for chapter_index, chapter in enumerate(chapters):
        where = f"{file_name}: chapter {chapter_index + 1}"
        validate_chapter_header(where, chapter, chapter_ids)
        if language == "ru":
            for field in ("title", "completeText"):
                if isinstance(chapter.get(field), str):
                    check_yo(where, field, chapter[field])
        tasks = chapter.get("tasks")
        if not isinstance(tasks, list):
            errors.append(f"{where}: tasks must be a list")
            continue
        if len(tasks) != WORDS_PER_CHAPTER:
            errors.append(f"{where}: expected {WORDS_PER_CHAPTER} tasks, found {len(tasks)}")
        seen_phrases: set[str] = set()
        for task_index, task in enumerate(tasks):
            if not isinstance(task, dict):
                errors.append(f"{where}, task {task_index + 1}: a task must be an object")
                continue
            info = validate_phrase_task(file_name, language, level, chapter, task, task_index, seen_phrases)
            if info:
                infos.append(info)
            if language == "ru":
                task_where = f'{file_name}: chapter "{chapter.get("id")}", task {task_index + 1}'
                for field in ("word", "syllables", "prompt", "success"):
                    if isinstance(task.get(field), str):
                        check_yo(task_where, field, task[field])
                for choice in task.get("choices") or []:
                    if isinstance(choice, dict) and isinstance(choice.get("label"), str):
                        check_yo(task_where, "label", choice["label"])

    phrase_counts: dict[str, int] = {}
    kind_counts = {kind: 0 for kind in PHRASE_KINDS}
    noun_counts: dict[str, int] = {}
    task_counts: dict[tuple, int] = {}
    unchanged_counts: dict[int, int] = {}
    for info in infos:
        phrase_counts[info["phrase"]] = phrase_counts.get(info["phrase"], 0) + 1
        for kind in info["kinds"]:
            kind_counts[kind] += 1
        noun_counts[info["noun"]] = noun_counts.get(info["noun"], 0) + 1
        task_counts[info["task"]] = task_counts.get(info["task"], 0) + 1
        for position in info["unchanged"]:
            unchanged_counts[position] = unchanged_counts.get(position, 0) + 1

    total = len(infos)
    max_repeat = max(phrase_counts.values(), default=0)
    mean_letters = sum(info["letters"] for info in infos) / total if total else 0
    print(
        f"{file_name}: {len(phrase_counts)} unique phrases, max repeats {max_repeat},"
        f" mean {mean_letters:.1f} letters; "
        + ", ".join(f"{kind} {kind_counts[kind]}" for kind in PHRASE_KINDS)
    )

    if len(phrase_counts) < MIN_UNIQUE_PHRASES:
        errors.append(
            f"{file_name}: only {len(phrase_counts)} unique phrases across {total} tasks,"
            f" fewer than the {MIN_UNIQUE_PHRASES} a level has to hold"
        )
    for phrase, count in phrase_counts.items():
        if count > MAX_PHRASE_REPEATS:
            errors.append(
                f'{file_name}: "{phrase}" is used {count} times, more than the {MAX_PHRASE_REPEATS}'
                " times one phrase may appear in a level"
            )
    for kind in PHRASE_KINDS:
        if kind_counts[kind] < MIN_KIND_TASKS:
            errors.append(f"{file_name}: only {kind_counts[kind]} {kind} tasks, fewer than {MIN_KIND_TASKS}")

    # Content quality signals. Warnings only, like the ones for the word levels.
    for noun, count in sorted(noun_counts.items()):
        if total and count / total > MAX_NOUN_SHARE:
            warnings.append(
                f'{file_name}: the noun "{noun}" is in {count} of {total} tasks, more than {MAX_NOUN_SHARE:.0%}'
            )
    for (phrase, distractor_ids), count in task_counts.items():
        if count > 1:
            warnings.append(
                f'{file_name}: "{phrase}" comes back {count} times with the same distractors {list(distractor_ids)}'
            )
    if PHRASE_LEVELS[level][0] == 3:
        for position, count in sorted(unchanged_counts.items()):
            if total and count / total > MAX_UNCHANGED_SHARE:
                warnings.append(
                    f"{file_name}: word {position + 1} is left alone by both distractors in {count} of"
                    f" {total} tasks, more than {MAX_UNCHANGED_SHARE:.0%}"
                )


# Registries of the story packs. Picture -> noun spans both languages and is seeded from the phrase
# packs; form -> slug is kept per language. Russian puts one noun in several cases (КОТ, КОТА, КОТУ),
# so a story checks that one form always means one slug, the other way round from the phrases.
story_nouns: dict[str, tuple] = {}
story_forms: dict[tuple, tuple] = {}


def story_error(message):
    # The sentence a distractor leaves alone is drawn three times, so the same fault would repeat.
    if message not in errors:
        errors.append(message)


def seed_story_nouns():
    for meaning, (picture, where) in phrase_pictures.items():
        noun = next((slug for slug in meaning if slug_class(slug) == "noun"), None)
        if noun:
            story_nouns.setdefault(picture[0], (noun, where))


def sentences_of(text):
    return re.split(r"(?<=[.!]) ", text)


def bare_word(word):
    return word.rstrip(".!").upper()


def counted_words(language, words):
    return [word for word in words if not (language == "en" and bare_word(word) in EN_ARTICLES)]


def show_scene(panels):
    def show_group(group):
        text = group.get("emoji") or "?"
        if group.get("badge"):
            text += f'+{group["badge"]}'
        if "count" in group:
            text += f'x{group["count"]}'
        if group.get("size"):
            text += f'({group["size"]})'
        return f"[{text}]"
    return " / ".join(" ".join(show_group(group) for group in panel) for panel in panels)


def panel_units(groups):
    items = sum((group.get("count") or 1) * (1.25 if group.get("size") == "big" else 1) for group in groups)
    return items + 0.5 * (len(groups) - 1)


def story_scene(language, slugs, words, where):
    """Draws one sentence from its slugs.

    Returns (groups, classes, has_glue), where every group carries its picture fields and, under
    "meaning", "noun" and "position", what the registries need; or None after reporting why not.
    """
    groups, classes, pending = [], [], []
    has_glue = joined = False
    for position, slug in enumerate(slugs):
        kind = slug_class(slug)
        if kind in MODIFIER_ORDER:
            if pending and MODIFIER_ORDER.index(kind) <= MODIFIER_ORDER.index(pending[-1][0]):
                story_error(f"{where}: the modifiers must come in the order number, size, color, each kind once")
                return None
            pending.append((kind, slug, position))
            classes.append(kind)
            continue
        if kind == "verb" and classes and classes[-1] == "noun":
            group = groups[-1]
            if slug in BADGE_VERBS or (group["noun"], slug) in VERB_PICTURES:
                if group["joined"]:
                    story_error(f'{where}: "{slug}" is drawn, so a pictured verb needs one noun subject right before it')
                    return None
                group["verb"] = slug
                classes.append("verb")
                continue
        if pending and (kind == "verb" or slug in GLUE_SLUGS):
            story_error(f"{where}: a number, a size or a color must stand right before its noun")
            return None
        if kind == "verb" and (slug in BADGE_VERBS or (classes and slugs[position - 1] in PRONOUN_SLUGS)):
            story_error(f'{where}: "{slug}" is drawn, so a pictured verb needs one noun subject right before it')
            return None
        if kind == "verb" or slug in GLUE_SLUGS:
            joined = joined or (slug == "and" and bool(classes) and classes[-1] == "noun")
            has_glue = True
            classes.append("glue")
            continue
        modifiers = {value_kind: (value, value_position) for value_kind, value, value_position in pending}
        groups.append({
            "noun": slug, "position": position, "joined": joined,
            "number": modifiers.get("number", (None, None))[0],
            "number_position": modifiers.get("number", (None, None))[1],
            "size": modifiers.get("size", (None, None))[0],
            "color": modifiers.get("color", (None, None))[0],
            "verb": None,
        })
        classes.append("noun")
        pending, joined = [], False
    if pending:
        story_error(f"{where}: a number, a size or a color must stand right before its noun")
        return None

    drawn = []
    for group in groups:
        noun, color, verb = group["noun"], group["color"], group["verb"]
        badge = BADGE_VERBS.get(verb) if verb else None
        if verb and not badge:
            if color:
                story_error(f'{where}: "{color} {noun} {verb}" would need a color and an action in one picture')
                return None
            emoji = VERB_PICTURES[(noun, verb)]
        elif color:
            emoji = COLOR_PICTURES.get((color, noun))
            if emoji is None:
                story_error(
                    f'{where}: COLOR_PICTURES has no {color} {noun}; the emoji must genuinely have that color'
                )
                return None
        else:
            # A noun drawn for the first time takes the picture its choice gives and registers it.
            known = phrase_pictures.get((noun,))
            emoji = known[0][0] if known else None
        picture = {"emoji": emoji}
        if group["number"]:
            picture["count"] = NUMBER_SLUGS[group["number"]]
        if group["size"]:
            picture["size"] = group["size"]
        if badge:
            picture["badge"] = badge
        meaning = tuple(slug for slug in (color, noun, verb) if slug)
        drawn.append({**picture, "meaning": meaning, "noun": noun, "position": group["position"],
                      "value": NUMBER_SLUGS.get(group["number"]), "number_position": group["number_position"],
                      "verb": verb})

    emoji_count = sum(group.get("count", 1) for group in drawn)
    if not MIN_SCENE_EMOJI <= emoji_count <= MAX_SCENE_EMOJI:
        story_error(
            f"{where}: the sentence draws {emoji_count} emoji, a scene needs {MIN_SCENE_EMOJI}-{MAX_SCENE_EMOJI}"
        )
        return None
    if panel_units(drawn) > MAX_SCENE_UNITS:
        story_error(f"{where}: the scene is wider than {MAX_SCENE_UNITS} layout units")
        return None

    # English number agreement, the phrase checks applied per group. A drawn noun is drawn once
    # unless a number says otherwise, so without a number it has to be singular.
    if language == "en":
        for group in drawn:
            noun_word = bare_word(words[group["position"]])
            value = group["value"]
            if value is not None and value > 1:
                if not noun_word.endswith("S") and noun_word not in EN_IRREGULAR_PLURALS:
                    story_error(f'{where}: noun "{noun_word}" is not plural after a number above one')
            elif noun_word in EN_IRREGULAR_PLURALS or (noun_word.endswith("S") and noun_word not in EN_SINGULAR_S):
                story_error(f'{where}: noun "{noun_word}" is drawn once, so it has to be singular')
            if group["verb"]:
                verb_word = bare_word(words[group["position"] + 1])
                if value is not None and value > 1:
                    if verb_word.endswith("S") and not verb_word.endswith("SS"):
                        story_error(f'{where}: verb "{verb_word}" takes no -S after a plural')
                elif not verb_word.endswith("S"):
                    story_error(f'{where}: verb "{verb_word}" needs -S after a singular')
    for group in drawn:
        if group["value"] is not None:
            numeral = bare_word(words[group["number_position"]])
            if NUMBER_WORDS[language].get(numeral) != group["value"]:
                story_error(f'{where}: word "{numeral}" is not the number {group["value"]}')
    return drawn, classes, has_glue


def register_story_group(where, group):
    """Meaning -> picture as in the phrases, and picture -> noun across the story packs."""
    register_picture(group["meaning"], (group["emoji"], group.get("badge") or ""), where)
    if group.get("badge"):
        register_picture(group["meaning"][:-1], (group["emoji"], ""), where)
    known = story_nouns.get(group["emoji"])
    if known is None:
        story_nouns[group["emoji"]] = (group["noun"], where)
    elif known[0] != group["noun"]:
        story_error(
            f'{where}: {group["emoji"]} is drawn for "{group["noun"]}" here but for "{known[0]}" in {known[1]};'
            " one picture names one noun"
        )


def validate_story_task(file_name, language, level, chapter, task, task_index, seen_sentences):
    """Checks one story task; returns what the pack-level checks need, or None if it is broken."""
    where = f'{file_name}: chapter "{chapter.get("id")}", task {task_index + 1}'
    sentence_count, limits = STORY_LEVELS[level]
    min_words, max_words, longest_word = limits[language]

    for field in ("word", "syllables", "correct"):
        if not isinstance(task.get(field), str) or not task[field].strip():
            errors.append(f'{where}: field "{field}" is missing or empty')
            return None
    for field in ("prompt", "success"):
        if field in task:
            errors.append(f'{where}: a story task has no "{field}"; the sentences are the story')

    word = task["word"]
    if not STORY_ALPHABETS[language].match(word):
        errors.append(
            f'{where}: "{word}" is not {language} upper-case sentences, each ending in "." or "!",'
            " separated by single spaces"
        )
        return None
    sentences = sentences_of(word)
    if len(sentences) != sentence_count:
        errors.append(f'{where}: "{word}" has {len(sentences)} sentences, expected {sentence_count}')
        return None
    for sentence in sentences:
        sentence_words = sentence.split(" ")
        count = len(counted_words(language, sentence_words))
        if not min_words <= count <= max_words:
            expected = f"{min_words}" if min_words == max_words else f"{min_words}-{max_words}"
            errors.append(f'{where}: sentence "{sentence}" has {count} words, expected {expected}')
        if max(len(bare_word(part)) for part in sentence_words) > longest_word:
            errors.append(f'{where}: sentence "{sentence}" has a word longer than {longest_word} letters')
        if sentence in seen_sentences:
            errors.append(f'{where}: sentence "{sentence}" repeats inside the chapter')
        seen_sentences.add(sentence)

    syllables = task["syllables"]
    word_tokens, split_tokens = word.split(" "), syllables.split(" ")
    split_ok = False
    if len(split_tokens) != len(word_tokens) or any(
        split.replace("-", "") != token for split, token in zip(split_tokens, word_tokens)
    ):
        errors.append(f'{where}: syllables "{syllables}" do not spell "{word}"')
    elif any(part == "" for split in split_tokens for part in split.split("-")):
        errors.append(f'{where}: syllables "{syllables}" have an empty part')
    else:
        split_ok = True
        for split in split_tokens:
            if len(split) > MAX_SPLIT_WORD:
                errors.append(f'{where}: "{split}" is longer than {MAX_SPLIT_WORD} characters on the card')
        pack_splits = word_pack_splits(language)
        for token, split in zip(word_tokens, split_tokens):
            bare, bare_split = bare_word(token), split.rstrip(".!")
            known = phrase_splits.get((language, bare))
            if known is None:
                phrase_splits[(language, bare)] = (bare_split, where)
            elif known[0] != bare_split:
                errors.append(f'{where}: "{bare}" is split "{bare_split}" here but "{known[0]}" in {known[1]}')
            if bare in pack_splits and bare_split not in pack_splits[bare]:
                warnings.append(
                    f'{where}: "{bare}" is split "{bare_split}", but the word packs split it'
                    f' {" or ".join(sorted(pack_splits[bare]))}'
                )

    choices = task.get("choices")
    if not isinstance(choices, list) or len(choices) != 3:
        errors.append(f"{where}: expected exactly 3 choices")
        return None
    for choice in choices:
        if not (
            isinstance(choice, dict)
            and all(isinstance(choice.get(field), str) and choice[field].strip() for field in ("id", "label"))
            and isinstance(choice.get("scene"), list)
        ):
            errors.append(f"{where}: a choice is missing id, scene or label")
            return None
    ids = {choice["id"] for choice in choices}
    if len(ids) != 3:
        errors.append(f"{where}: choice ids are not unique")
        return None
    if len({choice["label"].lower() for choice in choices}) != 3:
        errors.append(f"{where}: choice labels are not unique")
    for choice in choices:
        for panel in choice["scene"]:
            for group in panel if isinstance(panel, list) else []:
                for field in ("emoji", "badge"):
                    if isinstance(group, dict) and isinstance(group.get(field), str) and TEXT_LETTERS.search(group[field]):
                        errors.append(f'{where}: choice "{choice["id"]}" {field} "{group[field]}" contains letters or digits')
    if len({json.dumps(choice["scene"], sort_keys=True, ensure_ascii=False) for choice in choices}) != 3:
        errors.append(f"{where}: two choices have the same scene")
    if task["correct"] not in ids:
        errors.append(f'{where}: correct id "{task["correct"]}" is not among the choices')
        return None

    parsed = {}
    for choice in choices:
        choice_id, label = choice["id"], choice["label"]
        parts = choice_id.split(".")
        if not STORY_ID.match(choice_id) or len(parts) != sentence_count:
            errors.append(
                f'{where}: choice id "{choice_id}" is not {sentence_count} part(s) of slugs joined by "-",'
                ' the parts joined by "."'
            )
            return None
        if not STORY_ALPHABETS[language].match(label.upper()) or len(sentences_of(label)) != sentence_count:
            errors.append(f'{where}: choice label "{label}" is not {sentence_count} sentence(s) like the word')
            return None
        slugs_per = [part.split("-") for part in parts]
        words_per = [sentence.split(" ") for sentence in sentences_of(label)]
        if any(len(slugs) != len(words) for slugs, words in zip(slugs_per, words_per)):
            errors.append(f'{where}: choice "{choice_id}" does not have one slug per word of its label "{label}"')
            return None
        parsed[choice_id] = (choice, slugs_per, words_per)

    correct_choice, correct_slugs, correct_words = parsed[task["correct"]]
    if correct_choice["label"].upper() != word:
        errors.append(f'{where}: label of the correct choice "{correct_choice["label"]}" does not match "{word}"')

    # English never splits a function word, an article or a word of one or two letters.
    if language == "en" and split_ok:
        position = 0
        for slugs, sentence in zip(correct_slugs, sentences):
            for slug, token in zip(slugs, sentence.split(" ")):
                bare = bare_word(token)
                if "-" in split_tokens[position] and (len(bare) <= 2 or bare in EN_ARTICLES or slug in FUNCTION_SLUGS):
                    errors.append(f'{where}: "{bare}" is a function word and stays whole, found "{split_tokens[position]}"')
                position += 1

    classes_by_choice = {}
    glue_by_sentence = None
    for choice_id, (choice, slugs_per, words_per) in parsed.items():
        drawn_panels, classes_per = [], []
        for index, (slugs, words) in enumerate(zip(slugs_per, words_per)):
            context = f'{where}: choice "{choice_id}"' + (f", sentence {index + 1}" if sentence_count > 1 else "")
            result = story_scene(language, slugs, words, context)
            if result is None:
                break
            drawn, classes, has_glue = result
            drawn_panels.append(drawn)
            classes_per.append(classes)
            if choice_id == task["correct"]:
                glue_by_sentence = (glue_by_sentence or []) + [has_glue]
                for group in drawn:
                    if group["verb"] == "sing" and group["noun"] not in SINGING_SUBJECTS[language]:
                        story_error(f'{context}: "{group["noun"]}" does not sing in {language}; give the 🎵 to a person or a songbird')
        if len(classes_per) != sentence_count:
            continue
        classes_by_choice[choice_id] = classes_per

        # Form -> slug: one written form of a drawn word always means one slug. A typo check.
        for slugs, words, classes in zip(slugs_per, words_per, classes_per):
            for slug, form, kind in zip(slugs, (bare_word(word) for word in words), classes):
                if kind == "glue":
                    continue
                known = story_forms.get((language, form))
                if known is None:
                    story_forms[(language, form)] = (slug, where)
                elif known[0] != slug:
                    story_error(f'{where}: "{form}" means "{slug}" here but "{known[0]}" in {known[1]}')

        scene = choice["scene"]
        shaped = len(scene) == sentence_count and all(
            isinstance(panel, list) and len(panel) == len(drawn)
            and all(isinstance(group, dict) for group in panel)
            for panel, drawn in zip(scene, drawn_panels)
        )
        if shaped:
            for panel, drawn in zip(scene, drawn_panels):
                for group, expected in zip(panel, drawn):
                    if expected["emoji"] is None and isinstance(group.get("emoji"), str) and group["emoji"]:
                        expected["emoji"] = group["emoji"]
        if any(group["emoji"] is None for drawn in drawn_panels for group in drawn):
            errors.append(f'{where}: choice "{choice_id}" draws a noun with no emoji')
            continue
        expected_scene = [
            [{field: group[field] for field in ("emoji", "count", "size", "badge") if field in group} for group in drawn]
            for drawn in drawn_panels
        ]
        if scene != expected_scene:
            errors.append(
                f'{where}: choice "{choice_id}" scene {show_scene(scene) if shaped else json.dumps(scene, ensure_ascii=False)}'
                f" does not match its words, expected {show_scene(expected_scene)}"
            )
            continue
        for drawn in drawn_panels:
            for group in drawn:
                register_story_group(where, group)

    # Distractors: one picturable word changed, a different word for each wrong answer, and in a
    # two-sentence task a different sentence.
    flat_correct = [(index, position, slug) for index, slugs in enumerate(correct_slugs) for position, slug in enumerate(slugs)]
    changes = []
    for choice_id, (choice, slugs_per, words_per) in parsed.items():
        if choice_id == task["correct"]:
            continue
        if [len(slugs) for slugs in slugs_per] != [len(slugs) for slugs in correct_slugs]:
            errors.append(
                f'{where}: distractor "{choice_id}" has a different number of words than the correct answer;'
                " it must change one word, not add or drop one"
            )
            continue
        changed = [(index, position) for index, position, slug in flat_correct if slugs_per[index][position] != slug]
        if len(changed) != 1:
            errors.append(f'{where}: distractor "{choice_id}" changes {len(changed)} words, expected exactly 1')
            continue
        index, position = changed[0]
        old_slug, new_slug = correct_slugs[index][position], slugs_per[index][position]
        old_classes, new_classes = classes_by_choice.get(task["correct"]), classes_by_choice.get(choice_id)
        if old_classes and new_classes:
            old_kind, new_kind = old_classes[index][position], new_classes[index][position]
            if "glue" in (old_kind, new_kind):
                errors.append(
                    f'{where}: distractor "{choice_id}" changes "{old_slug}" to "{new_slug}", a glue word that is'
                    " never drawn, so a wrong answer may not change it"
                )
                continue
            if old_kind != new_kind:
                errors.append(f'{where}: distractor "{choice_id}" turns a {old_kind} into a {new_kind}')
                continue
            if frozenset((old_slug, new_slug)) in CLOSE_COLORS | LOOKALIKE_NOUNS:
                errors.append(f'{where}: distractor "{choice_id}" swaps {old_slug} for {new_slug}, which look alike')
                continue
            # A subject swap that draws the verb for one subject only: the one picture of the action
            # settles the check without reading. Badge verbs are drawn for every subject.
            sentence_slugs = correct_slugs[index]
            verb = sentence_slugs[position + 1] if position + 1 < len(sentence_slugs) else None
            if old_kind == "noun" and verb in VERB_SLUGS and verb not in BADGE_VERBS and (
                ((old_slug, verb) in VERB_PICTURES) != ((new_slug, verb) in VERB_PICTURES)
            ):
                errors.append(
                    f'{where}: distractor "{choice_id}" swaps {old_slug} for {new_slug}, and "{verb}" is drawn for'
                    " only one of them; the picture of the action gives the answer away"
                )
                continue
        else:
            old_kind = None
        changes.append({
            "sentence": index, "position": position, "kind": old_kind, "old": old_slug, "new": new_slug,
            "forms": {bare_word(correct_words[index][position]), bare_word(words_per[index][position])},
        })
    if len(changes) == 2:
        first, second = changes
        if sentence_count == 1 and first["position"] == second["position"]:
            errors.append(f'{where}: both distractors change word {first["position"] + 1}; they must change different words')
        if sentence_count > 1 and first["sentence"] == second["sentence"]:
            errors.append(
                f'{where}: both distractors change sentence {first["sentence"] + 1}; they must change words in'
                " different sentences"
            )
    # Words the other sentence of the pair names too; the chapter decides which of them are characters.
    # A noun counted differently there (РЫБУ against ДВЕ РЫБЫ) is another thing of the same kind.
    correct_classes = classes_by_choice.get(task["correct"]) or []

    def number_before(index, position):
        while position > 0 and correct_classes[index][position - 1] in MODIFIER_ORDER:
            position -= 1
            if correct_classes[index][position] == "number":
                return correct_slugs[index][position]
        return None

    back_references = []
    if sentence_count > 1 and len(correct_classes) == sentence_count:
        for change in changes:
            index, other = change["sentence"], 1 - change["sentence"]
            if change["kind"] not in ("noun", "number", "size", "color") or change["old"] not in correct_slugs[other]:
                continue
            if change["kind"] == "noun" and all(
                number_before(other, position) != number_before(index, change["position"])
                for position, slug in enumerate(correct_slugs[other]) if slug == change["old"]
            ):
                continue
            back_references.append((where, index, change["old"]))
    subjects = {
        next((slug for slug, kind in zip(slugs, classes) if kind == "noun"), None)
        for slugs, classes in zip(correct_slugs, correct_classes)
    } - {None}

    return {
        "sentences": sentences,
        "words": [len(counted_words(language, sentence.split(" "))) for sentence in sentences],
        "kinds": {change["kind"] for change in changes if change["kind"]},
        "noun_changes": [(change["old"], change["new"]) for change in changes if change["kind"] == "noun"],
        "slugs": {slug for slugs in correct_slugs for slug in slugs},
        "glue": glue_by_sentence or [],
        "giveaways": {form for change in changes for form in change["forms"]},
        "scene": json.dumps(correct_choice["scene"], sort_keys=True, ensure_ascii=False),
        "scenes": frozenset(json.dumps(choice["scene"], sort_keys=True, ensure_ascii=False) for choice in choices),
        "back_references": back_references,
        "subjects": subjects,
    }


def validate_story_pack(language, level):
    file_name = f"stories.{language}.{level}.json"
    if not (CONTENT_DIR / file_name).exists():
        (errors if require_all else warnings).append(f"{file_name}: file is missing")
        return

    pack = load_json(file_name)
    if pack.get("language") != language:
        errors.append(f'{file_name}: language "{pack.get("language")}" does not match the file name')
    if pack.get("mode") != "story":
        errors.append(f'{file_name}: mode "{pack.get("mode")}" is not "story"')
    if pack.get("level") != level:
        errors.append(f'{file_name}: level {pack.get("level")!r} does not match the file name')
    chapters = pack.get("chapters")
    if not isinstance(chapters, list):
        errors.append(f"{file_name}: chapters must be a list")
        return
    # A pack is written five chapters at a time, so a short pack still gets its task checks.
    if len(chapters) != CHAPTERS_PER_LEVEL:
        errors.append(f"{file_name}: expected {CHAPTERS_PER_LEVEL} chapters, found {len(chapters)}")

    chapter_ids = set()
    infos = []
    giveaway_tasks = 0
    for chapter_index, chapter in enumerate(chapters):
        where = f"{file_name}: chapter {chapter_index + 1}"
        validate_chapter_header(where, chapter, chapter_ids)
        intro = chapter.get("intro")
        if not isinstance(intro, str) or not intro.strip():
            errors.append(f'{where}: field "intro" is missing or empty')
        if language == "ru":
            for field in ("title", "intro", "completeText"):
                if isinstance(chapter.get(field), str):
                    check_yo(where, field, chapter[field])
        tasks = chapter.get("tasks")
        if not isinstance(tasks, list):
            errors.append(f"{where}: tasks must be a list")
            continue
        if len(tasks) != WORDS_PER_CHAPTER:
            errors.append(f"{where}: expected {WORDS_PER_CHAPTER} tasks, found {len(tasks)}")
        seen_sentences: set[str] = set()
        chapter_infos = []
        for task_index, task in enumerate(tasks):
            if not isinstance(task, dict):
                errors.append(f"{where}, task {task_index + 1}: a task must be an object")
                continue
            chapter_infos.append(
                validate_story_task(file_name, language, level, chapter, task, task_index, seen_sentences)
            )
            if language == "ru":
                task_where = f'{file_name}: chapter "{chapter.get("id")}", task {task_index + 1}'
                for field in ("word", "syllables"):
                    if isinstance(task.get(field), str):
                        check_yo(task_where, field, task[field])
                for choice in task.get("choices") or []:
                    if isinstance(choice, dict) and isinstance(choice.get("label"), str):
                        check_yo(task_where, "label", choice["label"])

        # The intro is read before task 1, so it may not name a word a distractor of task 1 changes,
        # the cast in any case form.
        if isinstance(intro, str) and chapter_infos and chapter_infos[0]:
            giveaways = {CAST_FORMS.get(form, form) for form in chapter_infos[0]["giveaways"]}
            for token in phrase_tokens(intro):
                if CAST_FORMS.get(token, token) in giveaways:
                    errors.append(f'{where}: the intro gives away the changed word "{token}" of task 1')
        # The chapter card is tapped right before task 1, so its emoji may not tell the correct scene
        # of task 1 from a wrong one.
        if chapter_infos and chapter_infos[0] and isinstance(chapter.get("emoji"), str):
            def scene_emoji(choice):
                return {group["emoji"].replace("\ufe0f", "") for panel in choice["scene"] for group in panel}
            first = tasks[0]
            correct_emoji = next(scene_emoji(choice) for choice in first["choices"] if choice["id"] == first["correct"])
            chapter_emoji = chapter["emoji"].replace("\ufe0f", "")
            if any(chapter_emoji in correct_emoji ^ scene_emoji(choice)
                   for choice in first["choices"] if choice["id"] != first["correct"]):
                errors.append(f'{where}: the chapter emoji {chapter["emoji"]} is in some scenes of task 1 and not in others')

        # The child would tap the picture he tapped before: a correct scene comes back in the chapter.
        shown: dict[str, tuple] = {}
        for task_index, info in enumerate(chapter_infos):
            if not info:
                continue
            earlier_task = shown.get(info["scene"])
            if earlier_task is None:
                shown[info["scene"]] = (task_index, info["scenes"])
            elif earlier_task[1] == info["scenes"]:
                errors.append(
                    f"{where}: task {task_index + 1} shows the same three scenes as task {earlier_task[0] + 1}"
                    " with the same correct one"
                )
            else:
                warnings.append(f"{where}: task {task_index + 1} has the same correct scene as task {earlier_task[0] + 1}")

        # A two-sentence task whose wrong answer changes a word the other sentence also names reads as a
        # pair that contradicts itself, so that sentence settles the check. Characters are left alone: the
        # people, and any noun that is the subject of a correct sentence of the chapter, since swapping
        # one of them gives a pair that still makes sense. A warning: some repeated places and objects
        # still make a coherent wrong pair.
        characters = STORY_PEOPLE.union(*(info["subjects"] for info in chapter_infos if info))
        for info in chapter_infos:
            for task_where, sentence_index, old in (info or {}).get("back_references", []):
                if old not in characters:
                    warnings.append(
                        f'{task_where}: a distractor changes "{old}" in sentence {sentence_index + 1}, which'
                        f" sentence {2 - sentence_index} also names; that sentence settles the check"
                    )

        # A context giveaway: the story has met the correct noun, and the wrong one never appears in it.
        chapter_slugs = set().union(*(info["slugs"] for info in chapter_infos if info))
        earlier: set[str] = set()
        for info in chapter_infos:
            if not info:
                continue
            if any(old in earlier and new not in chapter_slugs for old, new in info["noun_changes"]):
                giveaway_tasks += 1
            earlier |= info["slugs"]
            infos.append(info)

    sentence_counts: dict[str, int] = {}
    kind_counts = {kind: 0 for kind in ("noun", "number", "size", "color", "verb")}
    word_counts = []
    phrase_like = 0
    for info in infos:
        for sentence in info["sentences"]:
            sentence_counts[sentence] = sentence_counts.get(sentence, 0) + 1
        word_counts.extend(info["words"])
        phrase_like += sum(1 for has_glue in info["glue"] if not has_glue)
        for kind in info["kinds"]:
            kind_counts[kind] += 1

    total = len(infos)
    max_repeat = max(sentence_counts.values(), default=0)
    mean_words = sum(word_counts) / len(word_counts) if word_counts else 0
    print(
        f"{file_name}: {len(sentence_counts)} unique sentences, max repeats {max_repeat},"
        f" mean {mean_words:.1f} words; changed "
        + ", ".join(f"{kind} {count}" for kind, count in kind_counts.items())
        + f"; context giveaways {giveaway_tasks} of {total}"
    )

    if len(sentence_counts) < MIN_UNIQUE_SENTENCES[level]:
        errors.append(
            f"{file_name}: only {len(sentence_counts)} unique sentences, fewer than the"
            f" {MIN_UNIQUE_SENTENCES[level]} a level has to hold"
        )
    for sentence, count in sentence_counts.items():
        if count > MAX_SENTENCE_REPEATS:
            errors.append(
                f'{file_name}: "{sentence}" is used {count} times, more than the {MAX_SENTENCE_REPEATS}'
                " times one sentence may appear in a level"
            )
    if kind_counts["verb"] < MIN_VERB_TASKS[level]:
        errors.append(f"{file_name}: only {kind_counts['verb']} tasks change a verb, fewer than {MIN_VERB_TASKS[level]}")
    modifier_tasks = sum(1 for info in infos if info["kinds"] & {"number", "size", "color"})
    if level in ("b", "c") and modifier_tasks < MIN_MODIFIER_TASKS:
        errors.append(
            f"{file_name}: only {modifier_tasks} tasks change a number, a size or a color, fewer than"
            f" {MIN_MODIFIER_TASKS}"
        )

    # Content quality signals. Warnings only, like the ones for the phrase levels.
    if word_counts and phrase_like / len(word_counts) > MAX_PHRASE_LIKE_SHARE:
        warnings.append(
            f"{file_name}: {phrase_like} of {len(word_counts)} sentences have no glue word, more than"
            f" {MAX_PHRASE_LIKE_SHARE:.0%}; they read as a phrase with a full stop"
        )
    if total and giveaway_tasks / total > MAX_CONTEXT_GIVEAWAY_SHARE:
        warnings.append(
            f"{file_name}: in {giveaway_tasks} of {total} tasks the story so far rules out a wrong answer, more"
            f" than {MAX_CONTEXT_GIVEAWAY_SHARE:.0%}"
        )


validate_ui()
for lang in LANGUAGES:
    for level in LEVELS:
        validate_pack(lang, level)
for (lang, letters), limits in SPELL_PACKS.items():
    validate_spell_pack(lang, letters, limits)
for lang in LANGUAGES:
    for level in PHRASE_LEVELS:
        validate_phrase_pack(lang, level)
# The story packs come after the phrase packs, so the shared registries are filled.
seed_story_nouns()
for lang in LANGUAGES:
    for level in STORY_LEVELS:
        validate_story_pack(lang, level)

for message in warnings:
    print(f"WARN  {message}")
for message in errors:
    print(f"ERROR {message}")
print("Validation passed." if not errors else f"Validation failed: {len(errors)} error(s).")
sys.exit(0 if not errors else 1)
