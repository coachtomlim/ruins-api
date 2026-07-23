const DB_NAME = "camelot-legends-web";
const STORE_NAME = "saves";
const SAVE_KEY = "demo-save";
const FALLBACK_KEY = "camelot-legends-demo-save";

function openDb() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveGame(state) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(state, SAVE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    localStorage.setItem(`${FALLBACK_KEY}:meta`, state.updatedAt || "");
    return "Saved to IndexedDB.";
  } catch (error) {
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(state));
    return `IndexedDB unavailable; saved fallback to localStorage (${error.message}).`;
  }
}

export async function loadGame() {
  try {
    const db = await openDb();
    const state = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(SAVE_KEY);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
    if (state) return state;
  } catch {
    // Fall through to localStorage fallback.
  }

  const fallback = localStorage.getItem(FALLBACK_KEY);
  return fallback ? JSON.parse(fallback) : null;
}

export async function resetSave() {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(SAVE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Local fallback is still cleared below.
  }
  localStorage.removeItem(FALLBACK_KEY);
  localStorage.removeItem(`${FALLBACK_KEY}:meta`);
}
