(function initializeProgressSync(global) {
  // server.py keeps the progress of every game here, so all computers on the
  // home network share one save.
  const API_PATH = "/api/progress";
  // Both lists belong to this browser only: they are not synced, and a reset
  // on the shelf leaves them alone.
  // The synced keys this browser has already met: until then its own copy wins.
  const SYNCED_LIST_KEY = "kidGamesProgressSyncedV1";
  // The synced keys whose last write never reached the server.
  const PENDING_LIST_KEY = "kidGamesProgressPendingV1";
  // Browsers drop a keepalive request once the keepalive bodies in flight pass
  // 64 KiB, so a big Block Town save is sent without it.
  const KEEPALIVE_LIMIT = 60000;
  const { getItem, setItem, removeItem } = global.Storage.prototype;
  let storage;
  let syncedKeys;

  function readList(name) {
    try {
      const list = JSON.parse(getItem.call(storage, name));
      return new Set(Array.isArray(list) ? list : []);
    } catch {
      return new Set();
    }
  }

  function writeList(name, set) {
    setItem.call(storage, name, JSON.stringify([...set]));
  }

  // Synchronous on purpose: the games read their saves as soon as they load,
  // so the server's copy has to be in localStorage before their scripts run.
  function loadSaved() {
    const request = new XMLHttpRequest();
    request.open("GET", API_PATH, false);
    request.send();
    if (request.status !== 200) return null;
    const saved = JSON.parse(request.responseText);
    return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : null;
  }

  // Also synchronous, so a push is either confirmed or retried on the next load.
  function pushNow(key, value) {
    const request = new XMLHttpRequest();
    request.open(value === null ? "DELETE" : "PUT", `${API_PATH}/${key}`, false);
    request.send(value);
    return request.status === 204;
  }

  function reconcile(saved) {
    // An empty answer means the file is gone, not that every game was reset,
    // so it must not wipe the copies kept in the browser.
    const serverEmpty = Object.values(saved).every((value) => value === null);
    const reconciled = readList(SYNCED_LIST_KEY);
    const pending = readList(PENDING_LIST_KEY);

    syncedKeys.forEach((key) => {
      const local = getItem.call(storage, key);
      if (pending.has(key) || (!reconciled.has(key) && local !== null)) {
        try {
          if (!pushNow(key, local)) return;
        } catch {
          return;
        }
        reconciled.add(key);
        pending.delete(key);
        return;
      }

      if (saved[key] !== null) {
        setItem.call(storage, key, saved[key]);
      } else if (!serverEmpty) {
        removeItem.call(storage, key);
      }
      reconciled.add(key);
    });

    writeList(SYNCED_LIST_KEY, reconciled);
    writeList(PENDING_LIST_KEY, pending);
  }

  function markPending(key, failed) {
    const pending = readList(PENDING_LIST_KEY);
    if (failed) {
      pending.add(key);
    } else {
      pending.delete(key);
    }
    writeList(PENDING_LIST_KEY, pending);
  }

  function send(key, value) {
    const options = { method: value === null ? "DELETE" : "PUT" };
    if (value !== null) options.body = value;
    if (value === null || value.length < KEEPALIVE_LIMIT) options.keepalive = true;
    global.fetch(`${API_PATH}/${key}`, options)
      .then((response) => response.ok, () => false)
      .then((ok) => markPending(key, !ok));
  }

  // Without the API (file://, another static server) the page keeps plain
  // localStorage and says nothing.
  try {
    storage = global.localStorage;
    const saved = loadSaved();
    if (!saved) return;
    // The server names the synced keys, so the list lives in one place.
    syncedKeys = new Set(Object.keys(saved));
    reconcile(saved);
  } catch {
    return;
  }

  // The prototype, not the instance: assigning localStorage.setItem would
  // store an item named "setItem".
  global.Storage.prototype.setItem = function setSyncedItem(key, value) {
    setItem.call(this, key, value);
    if (this === storage && syncedKeys.has(String(key))) send(String(key), String(value));
  };

  global.Storage.prototype.removeItem = function removeSyncedItem(key) {
    removeItem.call(this, key);
    if (this === storage && syncedKeys.has(String(key))) send(String(key), null);
  };
}(window));
