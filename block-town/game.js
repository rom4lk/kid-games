const STORAGE_KEY = "blockTownSheetsV1";
const SOUND_KEY = "blockTownSoundV1";

// The model grows in the next stage; the shell only needs the storage keys.

function initializeGame() {
  const elements = {
    grid: document.querySelector("#sheet-grid"),
    sunFill: document.querySelector("#progress-sun-fill"),
    status: document.querySelector("#status"),
    sound: document.querySelector("#sound-button"),
    pause: document.querySelector("#pause-button"),
    pauseOverlay: document.querySelector("#pause-overlay"),
    resume: document.querySelector("#resume-button"),
    clear: document.querySelector("#clear-button"),
    confirmClear: document.querySelector("#confirm-clear-button"),
    cancelClear: document.querySelector("#cancel-clear-button"),
  };

  let soundEnabled = loadSoundPreference();
  let paused = false;

  function loadSoundPreference() {
    try {
      return localStorage.getItem(SOUND_KEY) !== "off";
    } catch {
      return true;
    }
  }

  function saveSoundPreference() {
    try {
      localStorage.setItem(SOUND_KEY, soundEnabled ? "on" : "off");
    } catch {
      // Sound stays available for the current session only.
    }
  }

  function renderSound() {
    elements.sound.classList.toggle("is-off", !soundEnabled);
    elements.sound.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
  }

  function showPauseState(state) {
    elements.pauseOverlay.querySelectorAll("[data-state]").forEach((section) => {
      section.hidden = section.dataset.state !== state;
    });
  }

  function openPause() {
    paused = true;
    elements.pauseOverlay.hidden = false;
    showPauseState("menu");
    elements.resume.focus();
  }

  function closePause() {
    paused = false;
    elements.pauseOverlay.hidden = true;
    elements.pause.focus();
  }

  elements.sound.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    saveSoundPreference();
    renderSound();
  });

  elements.pause.addEventListener("click", () => {
    if (paused) closePause();
    else openPause();
  });

  elements.resume.addEventListener("click", closePause);

  elements.clear.addEventListener("click", () => {
    showPauseState("confirm");
    elements.cancelClear.focus();
  });

  elements.cancelClear.addEventListener("click", () => {
    showPauseState("menu");
    elements.clear.focus();
  });

  // Clearing needs a painting to clear; the sheet arrives in the next stage.
  elements.confirmClear.addEventListener("click", closePause);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (paused) closePause();
    else openPause();
  });

  renderSound();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { STORAGE_KEY, SOUND_KEY };
}

if (typeof document !== "undefined") {
  initializeGame();
}
