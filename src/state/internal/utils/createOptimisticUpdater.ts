// ============ Types ========================================================== //

/** One accepted local write that may temporarily supersede stale backend data. */
export type OptimisticUpdate<Data, Id extends string | number> = {
  apply: (data: Data) => Data;
  id: Id;
  /** Returns true while backend data is still stale for this local update. */
  shouldIgnoreBackend?: (backendData: Data) => boolean;
};

type TrackedUpdate<Update> = {
  expiresAt: number;
  update: Update;
};

type OptimisticUpdater<Key extends string | number, Id extends string | number, Data, Update extends OptimisticUpdate<Data, Id>> = {
  clear: (key: Key) => void;
  discard: (key: Key, id: Id) => void;
  getUpdate: (key: Key, id: Id) => Update | undefined;
  mergeBackendData: (key: Key, backendData: Data) => Data;
  track: (key: Key, update: Update) => void;
};

// ============ Factory ======================================================== //

/**
 * Tracks accepted local writes over eventually consistent backend snapshots.
 *
 * Each key owns independent subjects. A new write for the same subject replaces
 * the old one, while different subjects are merged in write order.
 */
export function createOptimisticUpdater<
  Key extends string | number,
  Id extends string | number,
  Data,
  Update extends OptimisticUpdate<Data, Id>,
>(conflictWindow: number): OptimisticUpdater<Key, Id, Data, Update> {
  const updatesByKey = new Map<Key, Map<Id, TrackedUpdate<Update>>>();

  function clear(key: Key): void {
    updatesByKey.delete(key);
  }

  function discard(key: Key, id: Id): void {
    const updates = updatesByKey.get(key);
    if (!updates) return;

    updates.delete(id);
    if (!updates.size) updatesByKey.delete(key);
  }

  function track(key: Key, update: Update): void {
    pruneExpired();
    if (conflictWindow <= 0) return;

    const updates = updatesByKey.get(key) ?? new Map<Id, TrackedUpdate<Update>>();
    updates.delete(update.id);
    updates.set(update.id, { expiresAt: Date.now() + conflictWindow, update });
    updatesByKey.set(key, updates);
  }

  function getUpdate(key: Key, id: Id): Update | undefined {
    pruneExpired();
    return updatesByKey.get(key)?.get(id)?.update;
  }

  function mergeBackendData(key: Key, backendData: Data): Data {
    pruneExpired();

    const updates = updatesByKey.get(key);
    if (!updates) return backendData;

    let nextData = backendData;
    for (const [id, entry] of updates) {
      if (entry.update.shouldIgnoreBackend?.(backendData) ?? true) {
        nextData = entry.update.apply(nextData);
      } else {
        updates.delete(id);
      }
    }

    if (!updates.size) updatesByKey.delete(key);
    return nextData;
  }

  function pruneExpired(now = Date.now()): void {
    for (const [key, updates] of updatesByKey) {
      for (const [id, entry] of updates) {
        if (now >= entry.expiresAt) updates.delete(id);
      }
      if (!updates.size) updatesByKey.delete(key);
    }
  }

  return { clear, discard, getUpdate, mergeBackendData, track };
}
