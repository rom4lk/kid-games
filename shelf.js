(function initializeShelfSettings(global) {
  // What "reset progress" clears for every game. Sound and language are
  // preferences, not progress, so a reset keeps them.
  const PROGRESS_KEYS = {
    "word-quest": ["livingWordsProgressV2"],
    "island-discovery": ["islandDiscoveryV1"],
    "forest-light": ["forestLightProgressV1"],
    "cube-island": ["cubeIslandLevelsV1"],
    "robo-route": ["roboRouteProgressV1"],
    "garden-quest": ["gardenQuestUnlockedV1", "gardenQuestBestScoresV2"],
    "hypothesis-lab": ["secretRuleLabCompletedV1"],
  };
  const DONE_MESSAGE_MS = 2200;

  let openPanel = null;

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

  function buildPanel(item, title) {
    const panel = document.createElement("div");
    panel.className = "settings-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.innerHTML = `
      <p class="settings-panel-title"></p>
      <div data-state="menu">
        <p class="settings-panel-note">Progress is stored in this browser.</p>
        <button type="button" class="settings-danger" data-action="reset">Reset progress</button>
        <button type="button" data-action="close">Close</button>
      </div>
      <div data-state="confirm" hidden>
        <p class="settings-panel-note">Reset progress for this game? This cannot be undone.</p>
        <button type="button" class="settings-danger" data-action="confirm">Yes, reset</button>
        <button type="button" data-action="cancel">Cancel</button>
      </div>
      <div data-state="done" hidden>
        <p class="settings-done">Progress reset. The game starts from the beginning.</p>
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

    const panel = buildPanel(item, title);

    button.addEventListener("click", () => {
      if (openPanel?.panel === panel) closePanel();
      else openPanelFor(panel, button);
    });

    panel.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (!action) return;
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
