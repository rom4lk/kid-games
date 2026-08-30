(function initializeGameHome(global) {
  // Every game lives one folder below the shelf page.
  const HOME_PAGE = "../index.html";

  // event.code names the physical key, so the shortcut also works on a Russian
  // layout, where the same key types "р".
  function isHomeShortcut(event) {
    if (!event.shiftKey || event.altKey) return false;
    if (!event.metaKey && !event.ctrlKey) return false;
    if (event.code) return event.code === "KeyH";
    return typeof event.key === "string" && "hр".includes(event.key.toLowerCase());
  }

  // Capture, because a game may stop the event on its way to the document.
  global.addEventListener("keydown", (event) => {
    if (!isHomeShortcut(event)) return;
    event.preventDefault();
    global.location.href = HOME_PAGE;
  }, true);
}(window));
