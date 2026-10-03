import { createQueryStore, queryParam, type QueryStore } from '@storesjs/stores';

import { createSelectorReadTracker } from '@/state/internal/utils/createSelectorReadTracker';

// ============ Types ========================================================== //

type Key = string | number;
type CollectionParams<Params> = { inputs: Params[] };
type Entry<Data> = { data: Data; fetchedAt: number };

/** Keyed data and tracked reads added to the query store. */
export type QueryCollectionState<Params, Data> = {
  demand: ReadonlyMap<Key, Params>;
  entries: ReadonlyMap<Key, Entry<Data>>;
  /** Reads cached data. Subscribed reads also include this input in the store's query. */
  get: (params: Params) => Data | undefined;
};

/** Defines how a collection identifies, loads, and retains its values. */
export type QueryCollectionConfig<Params, Data> = {
  /** Inputs with the same key must identify the same data. */
  key: (params: Params) => Key;
  /** Loads one member of the requested batch, using the query store's cancellation signal. */
  fetcher: (params: Params, signal: AbortSignal | undefined) => Promise<Data>;
  /** How long a batch stays fresh before active readers refresh it, in milliseconds. */
  staleTime: number;
  /** Maximum age of unused data, in milliseconds. Active values stay available during refresh. */
  cacheTime: number;
};

// ============ Factory ======================================================== //

/**
 * Creates one query store whose requested inputs follow its consumers' keyed reads.
 * The query store fetches and refreshes the batch; each selector reads its own value.
 * Successful batches merge into retained data, so changing demand does not erase it.
 * A failed member fails the batch; retries and status belong to the query store.
 *
 * Read values through `get`; query status and errors describe the active batch.
 * The native `fetch({ inputs }, options)` method also supports explicit requests.
 */
export function createQueryCollectionStore<Params, Data>({
  key: getKey,
  fetcher,
  staleTime,
  cacheTime,
}: QueryCollectionConfig<Params, Data>): QueryStore<Data[], CollectionParams<Params>, QueryCollectionState<Params, Data>> {
  const reads = createSelectorReadTracker<Key>();
  const inputsByKey = new Map<Key, Params>();
  let demandedKeys: Key[] = [];
  let demandUpdatePending = false;

  const store = createQueryStore<Data[], CollectionParams<Params>, QueryCollectionState<Params, Data>, Data[]>(
    {
      params: {
        inputs: queryParam(($, store) => [...$(store, s => s.demand).values()], { key: inputs => inputs.map(getKey).sort() }),
      },
      enabled: ($, store) => $(store, s => s.demand.size > 0),
      fetcher: ({ inputs }, controller) => Promise.all(inputs.map(input => fetcher(input, controller?.signal))),
      setData: ({ data, params, set }) => {
        set(s => {
          const now = Date.now();
          const entries = new Map(s.entries);
          for (const [key, entry] of entries) {
            if (!s.demand.has(key) && now - entry.fetchedAt >= cacheTime) entries.delete(key);
          }
          params.inputs.forEach((input, index) => entries.set(getKey(input), { data: data[index], fetchedAt: now }));
          return { entries };
        });
      },
      staleTime,
      cacheTime,
    },
    (_, get) => ({
      demand: new Map(),
      entries: new Map(),
      get: params => {
        const key = getKey(params);
        const state = get();
        const entry = state.entries.get(key);
        const data = entry && (state.demand.has(key) || Date.now() - entry.fetchedAt < cacheTime) ? entry.data : undefined;
        if (reads.track(key) && !inputsByKey.has(key)) inputsByKey.set(key, params);
        return data;
      },
    })
  );

  function updateDemand(): void {
    demandUpdatePending = false;
    const demand = new Map<Key, Params>();
    const demanded = new Set(demandedKeys);
    for (const [key, input] of inputsByKey) {
      if (demanded.has(key)) demand.set(key, input);
      else inputsByKey.delete(key);
    }
    store.setState(s => {
      const now = Date.now();
      let entries: Map<Key, Entry<Data>> | undefined;
      for (const [key, entry] of s.entries) {
        if ((!s.demand.has(key) || !demand.has(key)) && now - entry.fetchedAt >= cacheTime) {
          entries ??= new Map(s.entries);
          entries.delete(key);
        }
      }
      return { demand, entries: entries ?? s.entries };
    });
  }

  return reads.install(store, keys => {
    demandedKeys = keys;
    if (demandUpdatePending) return;
    demandUpdatePending = true;
    queueMicrotask(updateDemand);
  });
}
