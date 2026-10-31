import { createBaseStore, createDerivedStore, type SyncStorageInterface } from '@storesjs/stores';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { time } from '@/framework/core/utils/time';

import { createQueryCollectionStore } from './createQueryCollectionStore';

// ============ Fixtures ======================================================= //

type Input = { name: string; chainId: number };
type Data = string | null;
type Request = PromiseWithResolvers<Data> & { input: Input; signal: AbortSignal | undefined };

const ALICE = { name: 'alice.eth', chainId: 1 };
const BOB = { name: 'bob.eth', chainId: 1 };

beforeEach(() => vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] }));
afterEach(() => vi.useRealTimers());

// ============ Collection Behavior ============================================ //

it('shares requests across consumers while selecting independent values', async () => {
  const { store, requests } = createFixture();
  expect(store.getState().get(ALICE)).toBeUndefined();
  await flush();
  expect(requests).toHaveLength(0);

  const listener = vi.fn();
  const alice = store.subscribe(s => s.get(ALICE), listener);
  const sameAlice = store.subscribe(s => s.get({ ...ALICE }), vi.fn());
  const bob = store.subscribe(s => s.get(BOB), vi.fn());
  await flush();
  expect(requests.map(request => request.input)).toEqual([ALICE, BOB]);
  expect(requests[0].signal).toBe(requests[1].signal);

  requests[0].resolve('alice address');
  requests[1].resolve(null);
  await flush();
  expect(store.getState().get(ALICE)).toBe('alice address');
  expect(store.getState().get(BOB)).toBeNull();
  expect(listener).toHaveBeenCalledTimes(1);

  alice();
  sameAlice();
  bob();
  await flush();
  store.getState().reset();
});

it('fetches only newly demanded members and retains data after readers leave', async () => {
  const { store, requests } = createFixture();
  const alice = store.subscribe(s => s.get(ALICE), vi.fn());
  await flush();
  requests[0].resolve('alice address');
  await flush();

  const bob = store.subscribe(s => s.get(BOB), vi.fn());
  await flush();
  expect(requests.map(request => request.input)).toEqual([ALICE, BOB]);
  expect(store.getState().get(ALICE)).toBe('alice address');
  requests[1].resolve('bob address');
  await flush();

  alice();
  await flush();
  expect(store.getState().inputs).toEqual([BOB]);
  expect(store.getState().get(ALICE)).toBe('alice address');
  expect(requests).toHaveLength(2);
  bob();
  await flush();
  store.getState().reset();
});

it('keeps prior data for failed members while publishing successful refreshes', async () => {
  const { store, requests } = createFixture();
  const alice = store.subscribe(s => s.get(ALICE), vi.fn());
  const bob = store.subscribe(s => s.get(BOB), vi.fn());
  await flush();
  requests[0].resolve('old alice');
  requests[1].resolve('old bob');
  await flush();

  vi.advanceTimersByTime(time.seconds(1));
  await flush();
  requests[2].reject(new Error('Alice failed'));
  requests[3].resolve('new bob');
  await flush();
  expect(store.getState().get(ALICE)).toBe('old alice');
  expect(store.getState().get(BOB)).toBe('new bob');
  expect(store.getState().status).toBe('success');

  alice();
  bob();
  await flush();
  store.getState().reset();
});

it('uses native failure and retry handling when every requested member fails', async () => {
  const { store, requests } = createFixture();
  const alice = store.subscribe(s => s.get(ALICE), vi.fn());
  const bob = store.subscribe(s => s.get(BOB), vi.fn());
  await flush();
  const error = new Error('Alice failed');
  requests[0].reject(error);
  requests[1].reject(new Error('Bob failed'));
  await flush();
  expect(store.getState().status).toBe('error');
  expect(store.getState().error).toBe(error);

  vi.advanceTimersByTime(time.ms(50));
  await flush();
  expect(requests).toHaveLength(4);
  requests[2].resolve(null);
  requests[3].resolve('bob');
  await flush();
  expect(store.getState().get(ALICE)).toBeNull();
  expect(store.getState().get(BOB)).toBe('bob');
  expect(store.getState().error).toBeNull();
  alice();
  bob();
  await flush();
  store.getState().reset();
});

it('refreshes active readers through the native lifecycle and stops when demand ends', async () => {
  const { store, requests } = createFixture();
  const stop = store.subscribe(s => s.get(ALICE), vi.fn());
  await flush();
  requests[0].resolve('first');
  await flush();

  vi.advanceTimersByTime(time.seconds(1));
  await flush();
  expect(requests).toHaveLength(2);
  expect(store.getState().get(ALICE)).toBe('first');
  requests[1].resolve('refreshed');
  await flush();
  expect(store.getState().get(ALICE)).toBe('refreshed');

  stop();
  await flush();
  vi.advanceTimersByTime(time.seconds(1));
  await flush();
  expect(requests).toHaveLength(2);
  store.getState().reset();
});

it('explicitly refreshes fresh data and resolves after its publication', async () => {
  const { store, requests } = createFixture();
  const stop = store.subscribe(s => s.get(ALICE), vi.fn());
  await flush();
  requests[0].resolve(null);
  await flush();

  const refreshed = store.getState().refresh(ALICE);
  await flush();
  expect(requests).toHaveLength(2);
  expect(store.getState().get(ALICE)).toBeNull();
  requests[1].resolve('new name');
  expect(await refreshed).toBe('new name');
  expect(store.getState().get(ALICE)).toBe('new name');
  stop();
  await flush();
  store.getState().reset();
});

it('persists each resource once and restores its data without restoring consumer demand', async () => {
  const storage = createMemoryStorage();
  const first = createFixture(storage);
  const stop = first.store.subscribe(s => s.get(ALICE), vi.fn());
  await flush();
  first.requests[0].resolve('saved');
  await flush();

  const persisted = JSON.parse(storage.get('collection') ?? 'null');
  expect(persisted.state.inputs).toBeUndefined();
  expect(Object.values(first.store.getState().queryCache).filter(entry => entry?.data)).toHaveLength(1);
  stop();
  await flush();
  first.store.getState().reset();

  const restored = createFixture(storage);
  expect(restored.store.getState().inputs).toEqual([]);
  expect(restored.store.getState().get(ALICE)).toBe('saved');
  const alice = restored.store.subscribe(s => s.get(ALICE), vi.fn());
  const bob = restored.store.subscribe(s => s.get(BOB), vi.fn());
  await flush();
  expect(restored.requests.map(request => request.input)).toEqual([BOB]);
  restored.requests[0].resolve('bob');
  await flush();
  alice();
  bob();
  await flush();
  restored.store.getState().reset();
});

it('discards a cancelled batch when the requested resource changes', async () => {
  const { store, requests } = createFixture();
  const alice = store.subscribe(s => s.get(ALICE), vi.fn());
  await flush();
  const bob = store.subscribe(s => s.get(BOB), vi.fn());
  alice();
  await flush();
  expect(requests[0].signal?.aborted).toBe(true);

  requests[1].resolve('current');
  requests[0].resolve('cancelled');
  await flush();
  expect(store.getState().get(ALICE)).toBeUndefined();
  expect(store.getState().get(BOB)).toBe('current');
  bob();
  await flush();
  store.getState().reset();
});

it('tracks derived consumers without adding another request lifecycle', async () => {
  const { store, requests } = createFixture();
  const input = createBaseStore(() => ({ chainId: 1 }));
  const derived = createDerivedStore($ => {
    const chainId = $(input, s => s.chainId);
    return $(store, s => s.get({ ...ALICE, chainId }));
  });
  const stop = derived.subscribe(vi.fn());
  await flush();
  requests[0].resolve('first chain');
  await flush();
  expect(derived.getState()).toBe('first chain');

  input.setState({ chainId: 10 });
  await flush();
  expect(requests.map(request => request.input.chainId)).toEqual([1, 10]);
  expect(derived.getState()).toBeUndefined();
  requests[1].resolve('second chain');
  await flush();
  expect(derived.getState()).toBe('second chain');
  stop();
  derived.destroy();
  await flush();
  store.getState().reset();
});

// ============ Helpers ======================================================== //

function createFixture(storage?: SyncStorageInterface): {
  store: ReturnType<typeof createQueryCollectionStore<Input, Data>>;
  requests: Request[];
} {
  const requests: Request[] = [];
  const store = createQueryCollectionStore(
    {
      key: ({ name, chainId }: Input) => `${chainId}:${name}`,
      fetcher: (input, signal) => {
        const request = { ...Promise.withResolvers<Data>(), input, signal };
        requests.push(request);
        return request.promise;
      },
      staleTime: time.seconds(1),
      cacheTime: time.seconds(5),
      retry: 1,
      retryDelay: time.ms(50),
    },
    storage ? { storageKey: 'collection', storage, persistThrottleMs: 0 } : undefined
  );
  return { store, requests };
}

function createMemoryStorage(): SyncStorageInterface<string> {
  const values = new Map<string, string>();
  return {
    clearAll: () => values.clear(),
    contains: key => values.has(key),
    delete: key => values.delete(key),
    get: key => values.get(key),
    getAllKeys: () => [...values.keys()],
    set: (key, value) => values.set(key, value),
  };
}

function flush(): Promise<void> {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
}
