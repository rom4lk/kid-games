(function initializeShelfSettings(global) {
  // What "reset progress" clears for every game. Sound and language are
  // preferences, not progress, so a reset keeps them.
  const PROGRESS_KEYS = {
    "word-quest": ["livingWordsProgressV2"],
    "island-discovery": ["islandDiscoveryV1", "islandDiscoveryV2"],
    "forest-light": ["forestLightProgressV1"],
    "robo-stories": ["roboStoriesProgressV1", "roboStoriesSurveyV1"],
    "garden-quest": ["gardenQuestUnlockedV1", "gardenQuestBestScoresV3"],
    "hypothesis-lab": ["secretRuleLabCompletedV1"],
    "block-town": ["blockTownWorldsV1"],
  };
  const DONE_MESSAGE_MS = 2200;

  // Block Town keeps the blocks a child may paint with outside its own save,
  // so an adult widens the palette from here and a reset never narrows it.
  // The shelf must not load the game, so this small table is a copy of the
  // game's block list: the same ids, the same order and the same colors.
  const BLOCK_TOWN_KEY = "blockTownBlocksV1";
  const BLOCK_TOWN_DEFAULTS = ["forest", "water", "path"];
  const BLOCK_TOWN_BLOCKS = [
    { id: 1, key: "meadow", name: "Meadow", color: "#a9dc88" },
    { id: 2, key: "path", name: "Road", color: "#e2d2ab" },
    { id: 3, key: "forest", name: "Forest", color: "#4f9b5f" },
    { id: 4, key: "water", name: "Water", color: "#82c9e8" },
    { id: 5, key: "house", name: "House", color: "#e58f6a" },
    { id: 6, key: "field", name: "Field", color: "#d8c057" },
    { id: 7, key: "flowers", name: "Flowers", color: "#e78cbb" },
    { id: 8, key: "sand", name: "Sand", color: "#f0dfae" },
    { id: 9, key: "asphalt", name: "Asphalt road", color: "#9aa2a6" },
    { id: 10, key: "rails", name: "Rails", color: "#8b7a63" },
    { id: 11, key: "tower", name: "Tower", color: "#b58bd0" },
    { id: 12, key: "farm", name: "Farm", color: "#c97f52" },
    { id: 13, key: "mountain", name: "Mountain", color: "#9d9a92" },
    { id: 14, key: "windmill", name: "Windmill", color: "#efe3c4" },
    { id: 15, key: "lighthouse", name: "Lighthouse", color: "#e5645f" },
    { id: 16, key: "castle", name: "Castle", color: "#b9b3a6" },
    { id: 17, key: "playground", name: "Playground", color: "#f2a63e" },
    { id: 18, key: "lantern", name: "Lantern", color: "#ffd45c" },
    { id: 19, key: "bench", name: "Bench", color: "#c09a6a" },
    { id: 20, key: "fountain", name: "Fountain", color: "#7fd3d0" },
  ];

  let openPanel = null;

  // The three blocks every world starts with, plus everything an adult has
  // added, in the order of the table. Garbage reads as no setting at all.
  function readEnabledBlocks() {
    let saved = null;
    try {
      saved = JSON.parse(global.localStorage.getItem(BLOCK_TOWN_KEY));
    } catch {
      // A refused or broken read is the same as an empty setting.
    }
    const enabled = new Set(BLOCK_TOWN_BLOCKS
      .filter((block) => BLOCK_TOWN_DEFAULTS.includes(block.key))
      .map((block) => block.id));
    if (Array.isArray(saved)) {
      saved.forEach((blockId) => {
        if (BLOCK_TOWN_BLOCKS.some((block) => block.id === blockId)) enabled.add(blockId);
      });
    }
    return BLOCK_TOWN_BLOCKS.filter((block) => enabled.has(block.id)).map((block) => block.id);
  }

  // Adding a block never touches anything a child has painted.
  function enableBlock(blockId) {
    const enabled = readEnabledBlocks();
    if (enabled.includes(blockId)) return;
    try {
      global.localStorage.setItem(BLOCK_TOWN_KEY, JSON.stringify([...enabled, blockId]));
    } catch {
      // Private browsing modes refuse storage, so the palette stays as it was.
    }
  }

  // Back to the three starting blocks. Painted worlds keep their cells; only
  // the palette narrows.
  function resetBlocks() {
    try {
      global.localStorage.removeItem(BLOCK_TOWN_KEY);
    } catch {
      // Private browsing modes refuse storage, so the palette stays as it was.
    }
  }

  function renderBlockChips(panel) {
    const list = panel.querySelector(".settings-blocks");
    const enabled = new Set(readEnabledBlocks());
    list.textContent = "";
    BLOCK_TOWN_BLOCKS.forEach((block) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "settings-chip";
      chip.dataset.block = String(block.id);
      const on = enabled.has(block.id);
      chip.setAttribute("aria-pressed", on ? "true" : "false");
      // An enabled block only goes away with the reset below, so its chip
      // stops reacting.
      if (on) chip.setAttribute("aria-disabled", "true");

      const swatch = document.createElement("span");
      swatch.className = "settings-chip-swatch";
      swatch.style.background = block.color;
      swatch.setAttribute("aria-hidden", "true");
      const name = document.createElement("span");
      name.className = "settings-chip-name";
      name.textContent = block.name;
      const mark = document.createElement("span");
      mark.className = "settings-chip-mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = on ? "✓" : "";

      chip.append(swatch, name, mark);
      list.append(chip);
    });
  }

  function clearProgress(game) {
    PROGRESS_KEYS[game].forEach((key) => {
      try {
        global.localStorage.removeItem(key);
      } catch {
        // Private browsing modes refuse storage access, so nothing was saved.
      }
    });
  }

  // A card in the bottom row has no room below it, so the panel flips upwards.
  function placePanel(panel) {
    panel.classList.remove("settings-panel--above");
    if (panel.getBoundingClientRect().bottom > global.innerHeight - 8) {
      panel.classList.add("settings-panel--above");
    }
  }

  function showState(panel, state) {
    panel.querySelectorAll("[data-state]").forEach((section) => {
      section.hidden = section.dataset.state !== state;
    });
    // The list of blocks needs more room than the rest of the panel.
    panel.classList.toggle("settings-panel--blocks", state === "blocks");
    placePanel(panel);
  }

  function closePanel({ restoreFocus = true } = {}) {
    if (!openPanel) return;
    const { panel, button, timer } = openPanel;
    global.clearTimeout(timer);
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
    openPanel = null;
    if (restoreFocus) button.focus();
  }

  function openPanelFor(panel, button) {
    closePanel({ restoreFocus: false });
    panel.hidden = false;
    showState(panel, "menu");
    button.setAttribute("aria-expanded", "true");
    openPanel = { panel, button, timer: 0 };
    panel.querySelector("[data-action='reset']").focus();
  }

  function buildPanel(item, title, game) {
    const panel = document.createElement("div");
    const titleId = `settings-title-${game}`;
    panel.className = "settings-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    // A dialog needs a name, and the name it should carry is the game it is for.
    panel.setAttribute("aria-labelledby", titleId);
    // The reset leaves a message and no button; the panel itself then holds the
    // focus until it closes, so the keyboard never lands on nothing.
    panel.tabIndex = -1;
    // Only Block Town hands the choice of blocks to an adult.
    const blocksButton = game === "block-town"
      ? '<button type="button" data-action="blocks">Blocks</button>'
      : "";
    panel.innerHTML = `
      <p class="settings-panel-title" id="${titleId}"></p>
      <div data-state="menu">
        <p class="settings-panel-note">Progress is stored in this browser.</p>
        <button type="button" class="settings-danger" data-action="reset">Reset progress</button>
        ${blocksButton}
        <button type="button" data-action="close">Close</button>
      </div>
      <div data-state="confirm" hidden>
        <p class="settings-panel-note">Reset progress for this game? This cannot be undone.</p>
        <button type="button" class="settings-danger" data-action="confirm">Yes, reset</button>
        <button type="button" data-action="cancel">Cancel</button>
      </div>
      <div data-state="done" hidden>
        <p class="settings-done" role="status">Progress reset. The game starts from the beginning.</p>
      </div>
      <div data-state="blocks" hidden>
        <p class="settings-panel-note">Tap a block to add it to the palette.</p>
        <div class="settings-blocks"></div>
        <button type="button" class="settings-danger" data-action="reset-blocks">Back to the three starting blocks</button>
        <button type="button" data-action="back">Back</button>
      </div>
    `;
    panel.querySelector(".settings-panel-title").textContent = title;
    item.append(panel);
    return panel;
  }

  function buildItem(item) {
    const game = item.dataset.game;
    if (!PROGRESS_KEYS[game]) return;

    const title = item.querySelector("h2")?.textContent.trim() ?? "";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "settings-button";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", `Settings: ${title}`);
    button.innerHTML = '<span aria-hidden="true">⚙️</span>';
    item.append(button);

    const panel = buildPanel(item, title, game);

    button.addEventListener("click", () => {
      if (openPanel?.panel === panel) closePanel();
      else openPanelFor(panel, button);
    });

    panel.addEventListener("click", (event) => {
      const chip = event.target.closest(".settings-chip");
      if (chip) {
        // An enabled chip is there to be read, not pressed.
        if (chip.getAttribute("aria-disabled") === "true") return;
        enableBlock(Number(chip.dataset.block));
        renderBlockChips(panel);
        panel.querySelector(`.settings-chip[data-block="${chip.dataset.block}"]`)?.focus();
        return;
      }

      const action = event.target.closest("[data-action]")?.dataset.action;
      if (!action) return;
      if (action === "blocks") {
        renderBlockChips(panel);
        showState(panel, "blocks");
        panel.querySelector("[data-action='back']").focus();
        return;
      }
      if (action === "reset-blocks") {
        resetBlocks();
        renderBlockChips(panel);
        return;
      }
      if (action === "back") {
        showState(panel, "menu");
        panel.querySelector("[data-action='blocks']").focus();
        return;
      }
      if (action === "reset") {
        showState(panel, "confirm");
        panel.querySelector("[data-action='cancel']").focus();
        return;
      }
      if (action === "cancel") {
        showState(panel, "menu");
        panel.querySelector("[data-action='reset']").focus();
        return;
      }
      if (action === "confirm") {
        clearProgress(game);
        showState(panel, "done");
        // The button that was pressed is hidden now, so the panel takes the
        // focus and keeps it until the message has been read and the panel
        // hands it back to the settings button.
        panel.focus();
        openPanel.timer = global.setTimeout(closePanel, DONE_MESSAGE_MS);
        return;
      }
      closePanel();
    });
  }

  document.querySelectorAll(".shelf-item").forEach(buildItem);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closePanel();
  });

  global.addEventListener("resize", () => {
    if (openPanel) placePanel(openPanel.panel);
  });

  document.addEventListener("pointerdown", (event) => {
    if (!openPanel) return;
    const item = openPanel.panel.parentElement;
    if (!item.contains(event.target)) closePanel({ restoreFocus: false });
  });
}(window));
