import { createBaseStore, createDerivedStore, type QueryStore } from '@storesjs/stores';

import { createQueryCollectionStore, type QueryCollectionState } from './createQueryCollectionStore';

type Input = { name: string; chainId: number };
type Request = PromiseWithResolvers<string | null> & { input: Input; signal: AbortSignal | undefined };

const ALICE = { name: 'alice.eth', chainId: 1 };
const BOB = { name: 'bob.eth', chainId: 1 };

beforeEach(() => jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'setImmediate'] }));
afterEach(() => jest.useRealTimers());

it('shares a batch across readers and publishes independent keyed values', async () => {
  const { store, requests } = createFixture();
  expect(store.getState().get(ALICE)).toBeUndefined();
  await flush();
  expect(requests).toHaveLength(0);

  const aliceListener = jest.fn();
  const alice = store.subscribe(s => s.get(ALICE), aliceListener);
  const sameAlice = store.subscribe(s => s.get({ ...ALICE }), jest.fn());
  const bob = store.subscribe(s => s.get(BOB), jest.fn());
  await flush();
  expect(requests.map(request => request.input)).toEqual([ALICE, BOB]);
  expect(requests[0].signal).toBe(requests[1].signal);

  requests[0].resolve('alice address');
  requests[1].resolve(null);
  await flush();
  expect(store.getState().get(ALICE)).toBe('alice address');
  expect(store.getState().get(BOB)).toBeNull();
  expect(aliceListener).toHaveBeenCalledTimes(1);

  alice();
  sameAlice();
  bob();
});

it('changes the requested batch with demand while retaining previous values', async () => {
  const { store, requests } = createFixture();
  const alice = store.subscribe(s => s.get(ALICE), jest.fn());
  await flush();
  requests[0].resolve('alice address');
  await flush();

  const bob = store.subscribe(s => s.get(BOB), jest.fn());
  alice();
  await flush();
  expect(requests.map(request => request.input)).toEqual([ALICE, BOB]);
  expect(store.getState().get(ALICE)).toBe('alice address');
  requests[1].resolve('bob address');
  await flush();
  expect(store.getState().get(BOB)).toBe('bob address');
  bob();
});

it('refreshes active consumers through the query store and stops when demand ends', async () => {
  const { store, requests } = createFixture();
  const stop = store.subscribe(s => s.get(ALICE), jest.fn());
  await flush();
  requests[0].resolve('first');
  await flush();

  jest.advanceTimersByTime(1000);
  await flush();
  expect(requests).toHaveLength(2);
  expect(store.getState().get(ALICE)).toBe('first');
  requests[1].resolve('refreshed');
  await flush();
  expect(store.getState().get(ALICE)).toBe('refreshed');

  stop();
  await flush();
  jest.advanceTimersByTime(1000);
  await flush();
  expect(requests).toHaveLength(2);
});

it('reuses a fresh batch and expires unused data without another query', async () => {
  const { store, requests } = createFixture();
  const stop = store.subscribe(s => s.get(ALICE), jest.fn());
  await flush();
  requests[0].resolve('cached');
  await flush();
  stop();
  await flush();

  const next = store.subscribe(s => s.get(ALICE), jest.fn());
  await flush();
  expect(requests).toHaveLength(1);
  expect(store.getState().get(ALICE)).toBe('cached');
  next();
  await flush();
  jest.advanceTimersByTime(5000);
  expect(store.getState().get(ALICE)).toBeUndefined();
});

it.each([0, 5000])('does not revive a returning reader’s expired value with retention %i', async cacheTime => {
  const { store, requests } = createFixture(cacheTime);
  const stop = store.subscribe(s => s.get(ALICE), jest.fn());
  await flush();
  requests[0].resolve('expired');
  await flush();
  stop();
  await flush();
  jest.advanceTimersByTime(cacheTime);

  const returning = store.subscribe(s => s.get(ALICE), jest.fn());
  expect(store.getState().get(ALICE)).toBeUndefined();
  await flush();
  expect(store.getState().get(ALICE)).toBeUndefined();
  requests[1].resolve('new');
  await flush();
  expect(store.getState().get(ALICE)).toBe('new');
  returning();
});

it('lets the query store cancel replaced work and rejects its late result', async () => {
  const { store, requests } = createFixture();
  const alice = store.subscribe(s => s.get(ALICE), jest.fn());
  await flush();
  const bob = store.subscribe(s => s.get(BOB), jest.fn());
  alice();
  await flush();
  expect(requests[0].signal?.aborted).toBe(true);

  requests[1].resolve('current');
  requests[0].resolve('cancelled');
  await flush();
  expect(store.getState().get(ALICE)).toBeUndefined();
  expect(store.getState().get(BOB)).toBe('current');
  bob();
});

it('supports derived consumers without creating another request lifecycle', async () => {
  const { store, requests } = createFixture();
  const input = createBaseStore(() => ({ chainId: 1 }));
  const derived = createDerivedStore($ => {
    const chainId = $(input, s => s.chainId);
    return $(store, s => s.get({ ...ALICE, chainId }));
  });
  const stop = derived.subscribe(jest.fn());
  await flush();
  requests[0].resolve('first chain');
  await flush();
  expect(requests).toHaveLength(1);
  expect(derived.getState()).toBe('first chain');

  input.setState({ chainId: 10 });
  await flush();
  expect(requests.map(request => request.input.chainId)).toEqual([1, 10]);
  expect(derived.getState()).toBeUndefined();
  requests[1].resolve('second chain');
  await flush();
  expect(derived.getState()).toBe('second chain');
  stop();
});

function createFixture(cacheTime = 5000): {
  store: QueryStore<(string | null)[], { inputs: Input[] }, QueryCollectionState<Input, string | null>>;
  requests: Request[];
} {
  const requests: Request[] = [];
  const store = createQueryCollectionStore({
    key: ({ name, chainId }: Input) => `${chainId}:${name}`,
    fetcher: (input, signal) => {
      const request = { ...Promise.withResolvers<string | null>(), input, signal };
      requests.push(request);
      return request.promise;
    },
    staleTime: cacheTime === 0 ? 0 : 1000,
    cacheTime,
  });
  return { store, requests };
}

function flush(): Promise<void> {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
}
