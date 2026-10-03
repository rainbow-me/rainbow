import { createBaseStore, type BaseStore } from '@storesjs/stores';

import { createSelectorReadTracker } from '@/state/internal/utils/createSelectorReadTracker';

// ============ Types ========================================================== //

/** The latest result, retaining existing data while a refresh is pending or fails. */
export type QueryResult<Data> =
  | { status: 'idle'; data: undefined; error: null }
  | { status: 'loading'; data: Data | undefined; error: null }
  | { status: 'success'; data: Data; error: null }
  | { status: 'error'; data: Data | undefined; error: unknown };

/** Reads and fetches independently keyed data through one store. */
export type QueryCollectionState<Params, Data> = {
  /** Subscribed reads acquire the query; ordinary reads inspect the cache. */
  get: (params: Params) => QueryResult<Data>;
  /** Reuses fresh data or pending work. Force bypasses freshness, but still shares a pending request. */
  fetch: (params: Params, options?: { force?: boolean }) => Promise<Data>;
};

/** Query identity, fetching, and cache lifetimes in milliseconds. */
export type QueryCollectionConfig<Params, Data> = {
  /** Inputs with the same key must identify the same data. No serialization is performed by the collection. */
  key: (params: Params) => string | number;
  fetcher: (params: Params, signal: AbortSignal) => Promise<Data>;
  staleTime: number;
  cacheTime: number;
};

type Request<Data> = {
  controller: AbortController;
  promise: Promise<Data>;
  previous: QueryResult<Data>;
  retained: boolean;
};

type Entry<Params, Data> = {
  params: Params;
  result: QueryResult<Data>;
  updatedAt: number;
  request: Request<Data> | null;
  expiry: ReturnType<typeof setTimeout> | undefined;
};

// ============ Constants ====================================================== //

const IDLE = { status: 'idle', data: undefined, error: null } as const;

// ============ Factory ======================================================== //

/**
 * Shares independent queries through native store selectors and subscriptions.
 *
 * A key becoming observed fetches missing or stale data. Additional readers share
 * that result until the key is released or explicitly refreshed. The last reader
 * cancels pending work unless an imperative fetch needs it. Unobserved results
 * expire after `cacheTime`. There are no automatic retries or polling.
 */
export function createQueryCollectionStore<Params, Data>({
  key: getKey,
  fetcher,
  staleTime,
  cacheTime,
}: QueryCollectionConfig<Params, Data>): BaseStore<QueryCollectionState<Params, Data>> {
  const reads = createSelectorReadTracker<string | number>();
  const entries = new Map<string | number, Entry<Params, Data>>();
  let observed = new Set<string | number>();
  let nextKeys: (string | number)[] = [];
  let scheduled = false;

  const store = createBaseStore<QueryCollectionState<Params, Data>>(() => ({
    get: params => {
      const key = getKey(params);
      const entry = reads.track(key) ? getEntry(key, params) : entries.get(key);
      return entry?.result ?? IDLE;
    },
    fetch: (params, options) => load(getKey(params), params, true, options?.force ?? false),
  }));

  function getEntry(key: string | number, params: Params): Entry<Params, Data> {
    let entry = entries.get(key);
    if (!entry) {
      entry = { params, result: IDLE, updatedAt: 0, request: null, expiry: undefined };
      entries.set(key, entry);
    }
    return entry;
  }

  function publish(entry: Entry<Params, Data>, result: QueryResult<Data>): void {
    entry.result = result;
    store.setState(state => ({ ...state }), true);
  }

  function release(key: string | number, entry: Entry<Params, Data>): void {
    if (observed.has(key) || entry.request?.retained) return;
    if (entry.request) {
      const request = entry.request;
      entry.request = null;
      request.controller.abort();
      publish(entry, request.previous);
    }
    if (entry.expiry !== undefined) return;
    if (cacheTime) {
      entry.expiry = setTimeout(() => entries.delete(key), cacheTime);
    } else entries.delete(key);
  }

  function load(key: string | number, params: Params, retained: boolean, force = false): Promise<Data> {
    const entry = getEntry(key, params);
    clearTimeout(entry.expiry);
    entry.expiry = undefined;
    if (entry.request) {
      if (retained) entry.request.retained = true;
      return entry.request.promise;
    }
    const previous = entry.result;
    if (!force && previous.status === 'success' && Date.now() - entry.updatedAt < staleTime) {
      release(key, entry);
      return Promise.resolve(previous.data);
    }

    const controller = new AbortController();
    const request: Request<Data> = {
      controller,
      previous,
      retained,
      promise: Promise.resolve()
        .then(() => {
          if (controller.signal.aborted) throw new Error('Query cancelled');
          return fetcher(params, controller.signal);
        })
        .then(
          data => {
            if (controller.signal.aborted) throw new Error('Query cancelled');
            entry.request = null;
            entry.updatedAt = Date.now();
            publish(entry, { status: 'success', data, error: null });
            release(key, entry);
            return data;
          },
          (error: unknown) => {
            if (!controller.signal.aborted) {
              entry.request = null;
              publish(entry, { status: 'error', data: entry.result.data, error });
              release(key, entry);
            }
            throw error;
          }
        ),
    };
    entry.request = request;
    publish(entry, { status: 'loading', data: previous.data, error: null });
    return request.promise;
  }

  function flush(): void {
    scheduled = false;
    const previous = observed;
    observed = new Set(nextKeys);
    for (const key of previous) {
      if (observed.has(key)) continue;
      const entry = entries.get(key);
      if (entry) release(key, entry);
    }
    for (const key of observed) {
      if (previous.has(key)) continue;
      const entry = entries.get(key);
      if (entry) void load(key, entry.params, false).catch(() => undefined);
    }
  }

  return reads.install(store, keys => {
    nextKeys = keys;
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(flush);
  });
}
