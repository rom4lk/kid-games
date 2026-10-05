(function initializeProgressSync(global) {
  // server.py keeps the progress of every game here, so all computers on the
  // home network share one save.
  const API_PATH = "/api/progress";
  // Both lists belong to this browser only: they are not synced, and a reset
  // on the shelf leaves them alone.
  // The synced keys this browser has already met: until then its own copy wins.
  const SYNCED_LIST_KEY = "kidGamesProgressSyncedV1";
  // The synced keys whose last write the server has not confirmed yet.
  const PENDING_LIST_KEY = "kidGamesProgressPendingV1";
  // Browsers drop a keepalive request once the keepalive bodies in flight pass
  // 64 KiB, so a big Block Town save is sent without it.
  const KEEPALIVE_LIMIT = 60000;
  const { getItem, setItem, removeItem } = global.Storage.prototype;
  let storage;
  let syncedKeys;
  // The number of the latest write per key, so an older answer cannot clear
  // the pending mark of a newer write.
  const writeCounts = new Map();

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
  // Returns null when there is no API at all; throws when the API is failing.
  function loadSaved() {
    if (global.location.protocol === "file:") return null;
    const request = new XMLHttpRequest();
    request.open("GET", API_PATH, false);
    request.send();
    if (request.status === 404 || request.status === 0) return null;
    if (request.status !== 200) throw new Error(`Progress API answered ${request.status}`);
    const saved = JSON.parse(request.responseText);
    const valid = saved && Array.isArray(saved.keys) && saved.progress && typeof saved.progress === "object";
    if (!valid) throw new Error("Progress API sent an unexpected answer");
    return saved;
  }

  // Also synchronous, so a push is either confirmed or retried on the next load.
  function pushNow(key, value) {
    const request = new XMLHttpRequest();
    request.open(value === null ? "DELETE" : "PUT", `${API_PATH}/${key}`, false);
    request.send(value);
    return request.status === 204;
  }

  function reconcile(saved) {
    const reconciled = readList(SYNCED_LIST_KEY);
    const pending = readList(PENDING_LIST_KEY);

    syncedKeys.forEach((key) => {
      const local = getItem.call(storage, key);
      // A key missing from the answer is unknown to the server (a lost file),
      // not reset, so the local copy goes back up. A reset arrives as null.
      const known = Object.prototype.hasOwnProperty.call(saved, key);
      if (pending.has(key) || (local !== null && (!reconciled.has(key) || !known))) {
        try {
          if (!pushNow(key, local)) return;
        } catch {
          return;
        }
        reconciled.add(key);
        pending.delete(key);
        return;
      }

      if (known && saved[key] !== null) {
        setItem.call(storage, key, saved[key]);
      } else if (known) {
        removeItem.call(storage, key);
      }
      reconciled.add(key);
    });

    writeList(SYNCED_LIST_KEY, reconciled);
    writeList(PENDING_LIST_KEY, pending);
  }

  function markPending(key, isPending) {
    const pending = readList(PENDING_LIST_KEY);
    if (isPending) {
      pending.add(key);
    } else {
      pending.delete(key);
    }
    writeList(PENDING_LIST_KEY, pending);
  }

  // The key is pending until the server confirms the write, so a request cut
  // off by closing the page is pushed again on the next load.
  function send(key, value) {
    const write = (writeCounts.get(key) || 0) + 1;
    writeCounts.set(key, write);
    markPending(key, true);
    const options = { method: value === null ? "DELETE" : "PUT" };
    if (value !== null) options.body = value;
    if (value === null || value.length < KEEPALIVE_LIMIT) options.keepalive = true;
    global.fetch(`${API_PATH}/${key}`, options)
      .then((response) => response.ok, () => false)
      .then((ok) => {
        if (ok && writeCounts.get(key) === write) markPending(key, false);
      });
  }

  // Without the API (file://, another static server) the page keeps plain
  // localStorage and says nothing.
  let saved;
  try {
    storage = global.localStorage;
  } catch {
    return;
  }
  try {
    saved = loadSaved();
  } catch {
    // The API is failing (an error status, no connection, a bad answer): the
    // keys this browser has already met still go through send(), so their
    // writes wait in the pending list for the next healthy load.
    saved = undefined;
  }
  if (saved === null) return;
  try {
    // The server names the synced keys, so the list lives in one place.
    syncedKeys = new Set(saved ? saved.keys : readList(SYNCED_LIST_KEY));
    if (saved) reconcile(saved.progress);
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
