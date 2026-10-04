import { createQueryStore, queryParam, type QueryStore } from '@storesjs/stores';

import { createSelectorReadTracker } from '@/state/internal/utils/createSelectorReadTracker';

// ============ Types ========================================================== //

type Key = string | number;
type CollectionParams<Params> = { inputs: Params[] };
type Entry<Params, Data> = {
  /** Retained while a consumer requests this entry. */
  input: Params | undefined;
  data: Data | undefined;
  expiresAt: number;
  failure: PromiseRejectedResult | undefined;
};

/** Extends query state with consumer-selected inputs and keyed data access. */
export type QueryCollectionState<Params, Data> = {
  inputs: Params[];
  /** Reads retained data and, in a subscribed selector, requests this input. */
  get: (params: Params) => Data | undefined;
  /** Reads the last failure for this input. A successful fetch clears it. */
  getFailure: (params: Params) => PromiseRejectedResult | undefined;
};

/** Defines how a collection identifies, loads, and retains its values. */
export type QueryCollectionConfig<Params, Data> = {
  /** Inputs with the same key must identify the same data. */
  key: (params: Params) => Key;
  /** Loads one member of the requested batch using the query store's cancellation signal. */
  fetcher: (params: Params, signal: AbortSignal | undefined) => Promise<Data>;
  /** How long a batch stays fresh before active readers refresh it, in milliseconds. */
  staleTime: number;
  /** Maximum age of unused data, in milliseconds. Active values stay available during refresh. */
  cacheTime: number;
};

// ============ Factory ======================================================== //

/**
 * Creates one query store whose inputs follow its consumers' keyed reads.
 * Each batch saves successful results and keeps previous data for failed members.
 * The query store owns cancellation, retries, and automatic refresh.
 *
 * `getFailure` reports an individual failure; native status describes the batch.
 * Native `fetch` returns settled outcomes for completed requests; cache hits and
 * cancellations may return null. With `throwOnError`, an entirely failed batch rejects.
 */
export function createQueryCollectionStore<Params, Data>({
  key: getKey,
  fetcher,
  staleTime,
  cacheTime,
}: QueryCollectionConfig<Params, Data>): QueryStore<
  PromiseSettledResult<Data>[],
  CollectionParams<Params>,
  QueryCollectionState<Params, Data>
> {
  const reads = createSelectorReadTracker<Key>();
  const entries = new Map<Key, Entry<Params, Data>>();
  let demandedKeys: Key[] = [];
  let demandUpdatePending = false;

  const store = createQueryStore<
    PromiseSettledResult<Data>[],
    CollectionParams<Params>,
    QueryCollectionState<Params, Data>,
    PromiseSettledResult<Data>[]
  >(
    {
      params: {
        inputs: queryParam(($, store) => $(store, s => s.inputs), { key: inputs => inputs.map(getKey).sort() }),
      },
      enabled: ($, store) => $(store, s => s.inputs.length > 0),
      fetcher: async ({ inputs }, controller) => {
        const results = await Promise.allSettled(
          inputs.map(input => {
            try {
              return fetcher(input, controller?.signal);
            } catch (reason) {
              return Promise.reject(reason);
            }
          })
        );
        if (results.length && results.every(result => result.status === 'rejected')) throw new CollectionFetchError(results);
        return results;
      },
      setData: ({ data, params }) => updateEntries(params.inputs, data),
      onError: ({ error, params }) => {
        if (!(error instanceof CollectionFetchError)) return;
        updateEntries(params.inputs, error.results);
        store.setState(s => ({ ...s }));
      },
      staleTime,
      cacheTime,
    },
    () => ({
      inputs: [],
      get: params => readEntry(params)?.data,
      getFailure: params => readEntry(params)?.failure,
    })
  );

  function readEntry(input: Params): Entry<Params, Data> | undefined {
    const key = getKey(input);
    let entry = entries.get(key);
    if (entry && entry.input === undefined && Date.now() >= entry.expiresAt) {
      entries.delete(key);
      entry = undefined;
    }
    if (reads.track(key)) {
      if (entry) entry.input = input;
      else {
        entry = { input, data: undefined, expiresAt: 0, failure: undefined };
        entries.set(key, entry);
      }
    }
    return entry;
  }

  function updateEntries(inputs: Params[], results: PromiseSettledResult<Data>[]): void {
    const now = Date.now();
    for (let i = 0; i < results.length; i++) {
      const key = getKey(inputs[i]);
      let entry = entries.get(key);
      if (!entry) {
        entry = { input: undefined, data: undefined, expiresAt: 0, failure: undefined };
        entries.set(key, entry);
      }
      const result = results[i];
      if (result.status === 'fulfilled') {
        entry.data = result.value;
        entry.expiresAt = now + cacheTime;
        entry.failure = undefined;
      } else entry.failure = result;
    }
    if (!demandUpdatePending) pruneEntries(now);
  }

  function pruneEntries(now: number): void {
    entries.forEach((entry, key) => {
      if (entry.input === undefined && now >= entry.expiresAt) entries.delete(key);
    });
  }

  function updateDemand(): void {
    demandUpdatePending = false;
    const now = Date.now();
    const inputs: Params[] = [];
    for (let i = 0; i < demandedKeys.length; i++) {
      const key = demandedKeys[i];
      const entry = entries.get(key);
      if (entry?.input === undefined) continue;
      inputs.push(entry.input);
    }
    entries.forEach(entry => {
      entry.input = undefined;
    });
    for (let i = 0; i < inputs.length; i++) {
      const entry = entries.get(getKey(inputs[i]));
      if (entry) entry.input = inputs[i];
    }
    pruneEntries(now);
    store.setState({ inputs });
  }

  return reads.install(store, keys => {
    demandedKeys = keys;
    if (demandUpdatePending) return;
    demandUpdatePending = true;
    queueMicrotask(updateDemand);
  });
}

// ============ Errors ========================================================= //

/** Carries individual failures through the query store's error callback. */
class CollectionFetchError extends Error {
  constructor(readonly results: PromiseRejectedResult[]) {
    const reason: unknown = results[0]?.reason;
    super(reason instanceof Error ? reason.message : 'Every collection read failed');
  }
}
