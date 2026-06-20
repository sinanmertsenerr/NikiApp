// Token storage — WEB.
// expo-secure-store has no browser implementation, so we back the same async API
// with localStorage, degrading to an in-memory store when localStorage is
// unavailable (Safari Private Mode, blocked third-party storage). Reads/writes
// NEVER throw, so a storage failure cannot trigger the token-clearing catch in
// api.ts's refresh interceptor (which would otherwise log the user out).

const memoryStore = new Map<string, string>();

function makeStorage() {
  try {
    const probe = '__niki_storage_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return {
      get: (k: string) => window.localStorage.getItem(k),
      set: (k: string, v: string) => window.localStorage.setItem(k, v),
      remove: (k: string) => window.localStorage.removeItem(k),
    };
  } catch {
    return {
      get: (k: string) => (memoryStore.has(k) ? (memoryStore.get(k) as string) : null),
      set: (k: string, v: string) => {
        memoryStore.set(k, v);
      },
      remove: (k: string) => {
        memoryStore.delete(k);
      },
    };
  }
}

const storage = makeStorage();

export const getItemAsync = async (key: string): Promise<string | null> => {
  try {
    return storage.get(key);
  } catch {
    return null;
  }
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  try {
    storage.set(key, value);
  } catch {
    /* ignore quota / security errors — session simply won't persist */
  }
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  try {
    storage.remove(key);
  } catch {
    /* ignore */
  }
};
