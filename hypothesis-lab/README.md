# Secret Rule Lab

A browser game about scientific thinking. The player studies examples of a sorting robot at work, picks a hypothesis, makes a prediction and checks it with an experiment.

## What is in the game

- six missions with gradually harder rules;
- rules with a single property, with `and` and `or` connectives and with an exception;
- a required prediction before every experiment;
- any prediction is accepted: a mismatch with the selected rule is shown as the result of the experiment
  rather than as an input error, and the rule itself is not crossed out because of it;
- hypotheses are shown with a pictogram and a short word;
- the numbered steps appear one at a time: first the rule, then the object, then the prediction;
- a lab log that separately shows whether the prediction matched and whether the rule still fits;
- a hypothesis contradicted by at least one log entry is crossed out and can no longer be selected;
- three control experiments before a mission is finished;
- badges saved to `localStorage`;
- a persistent English or Russian interface selector, with English as the default;
- a responsive interface for a computer and a tablet;
- mouse, touch and keyboard controls.

## Running

From the root of the project start a local server:

```bash
python3 server.py
```

Open the game:

```text
http://127.0.0.1:4173/hypothesis-lab/
```

No library installation and no build step are required.

## Logic check

```bash
node test-game.js
```

The test checks that all the objects and rules are present, that the initial positive and negative
examples are there, that every wrong hypothesis has a counterexample, and that a prediction result is
kept separate from the result of testing a hypothesis.

## Deliberate decisions

These decisions preserve the core mechanic while following the mandatory shared rules in
[GAME_DESIGN.md](../GAME_DESIGN.md).

- **The core idea is preserved.** Hypothesis, prediction, experiment and contradiction are the essence of the
  game; they must not be simplified into guessing.
- **An adult gives one demonstration.** The adult explains the scientific words and shows one loop before
  the first session. After that, short child-facing prompts, large labels and one visible next step guide the
  child through the same loop without more spoken instructions.
