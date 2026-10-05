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


validate_ui()
for lang in LANGUAGES:
    for level in LEVELS:
        validate_pack(lang, level)
for (lang, letters), limits in SPELL_PACKS.items():
    validate_spell_pack(lang, letters, limits)

for message in warnings:
    print(f"WARN  {message}")
for message in errors:
    print(f"ERROR {message}")
print("Validation passed." if not errors else f"Validation failed: {len(errors)} error(s).")
sys.exit(0 if not errors else 1)
