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

it('publishes successful members and preserves each rejected outcome', async () => {
  const { store, requests } = createFixture();
  const alice = store.subscribe(s => s.get(ALICE), jest.fn());
  const bob = store.subscribe(s => s.getFailure(BOB), jest.fn());
  await flush();
  const reason = new Error('Bob failed');
  requests[0].resolve(null);
  requests[1].reject(reason);
  await flush();
  expect(store.getState().status).toBe('success');
  expect(store.getState().get(ALICE)).toBeNull();
  expect(store.getState().getFailure(ALICE)).toBeUndefined();
  expect(store.getState().get(BOB)).toBeUndefined();
  expect(store.getState().getFailure(BOB)).toEqual({ status: 'rejected', reason });
  alice();
  bob();
});

it('retains a failed refresh’s data without extending its retention', async () => {
  const { store, requests } = createFixture();
  const alice = store.subscribe(s => s.get(ALICE), jest.fn());
  const bob = store.subscribe(s => s.get(BOB), jest.fn());
  await flush();
  requests[0].resolve('old');
  requests[1].resolve('bob');
  await flush();

  jest.advanceTimersByTime(1000);
  await flush();
  requests[2].reject(new Error('Refresh failed'));
  requests[3].resolve('updated bob');
  await flush();
  expect(store.getState().get(ALICE)).toBe('old');
  expect(store.getState().get(BOB)).toBe('updated bob');
  expect(store.getState().getFailure(ALICE)?.status).toBe('rejected');
  alice();
  bob();
  await flush();
  jest.advanceTimersByTime(4000);
  expect(store.getState().get(ALICE)).toBeUndefined();
  expect(store.getState().get(BOB)).toBe('updated bob');
});

it('uses native failure and retry handling when every member rejects', async () => {
  const { store, requests } = createFixture();
  const aliceListener = jest.fn();
  const alice = store.subscribe(s => s.getFailure(ALICE), aliceListener);
  const bob = store.subscribe(s => s.getFailure(BOB), jest.fn());
  await flush();
  requests[0].reject(undefined);
  const reason = new Error('Bob failed');
  requests[1].reject(reason);
  await flush();
  expect(store.getState().status).toBe('error');
  expect(store.getState().getFailure(ALICE)).toEqual({ status: 'rejected', reason: undefined });
  expect(aliceListener).toHaveBeenCalledTimes(1);
  expect(aliceListener.mock.calls[0][0]).toEqual({ status: 'rejected', reason: undefined });
  expect(store.getState().getFailure(BOB)).toEqual({ status: 'rejected', reason });

  jest.advanceTimersByTime(30_000);
  await flush();
  expect(requests).toHaveLength(4);
  requests[2].resolve('alice');
  requests[3].resolve('bob');
  await flush();
  expect(store.getState().get(ALICE)).toBe('alice');
  expect(store.getState().getFailure(ALICE)).toBeUndefined();
  expect(store.getState().getFailure(BOB)).toBeUndefined();
  alice();
  bob();
});

it('isolates a synchronous fetcher throw and accepts an empty explicit batch', async () => {
  const reason = new Error('Invalid input');
  const store = createQueryCollectionStore({
    key: (input: string) => input,
    fetcher: input => {
      if (input === 'bad') throw reason;
      return Promise.resolve(input);
    },
    staleTime: 1000,
    cacheTime: 5000,
  });
  const good = store.subscribe(s => s.get('good'), jest.fn());
  const bad = store.subscribe(s => s.getFailure('bad'), jest.fn());
  await flush();
  expect(store.getState().get('good')).toBe('good');
  expect(store.getState().getFailure('bad')).toEqual({ status: 'rejected', reason });
  good();
  bad();
  await flush();
  await expect(store.getState().fetch({ inputs: [] }, { force: true })).resolves.toEqual([]);
});

it('keeps continuous zero-retention demand through a synchronous conditional-read change', async () => {
  const { store, requests } = createFixture(0);
  let enabled = true;
  const stop = store.subscribe(s => (enabled ? s.get(ALICE) : undefined), jest.fn());
  await flush();
  requests[0].resolve('continuous');
  await flush();

  enabled = false;
  store.setState(s => ({ ...s }));
  enabled = true;
  store.setState(s => ({ ...s }));
  await flush();
  expect(store.getState().get(ALICE)).toBe('continuous');
  expect(requests).toHaveLength(1);
  stop();
});

it('releases reads removed before demand is published', async () => {
  const { store, requests } = createFixture(0);
  const stop = store.subscribe(s => s.get(ALICE), jest.fn());
  stop();
  await flush();
  expect(requests).toHaveLength(0);

  const pending = store.getState().fetch({ inputs: [ALICE] }, { force: true });
  await flush();
  requests[0].resolve('unobserved');
  await pending;
  expect(store.getState().get(ALICE)).toBeUndefined();
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

it('discards every outcome of a cancelled batch, including late rejections', async () => {
  const { store, requests } = createFixture();
  const alice = store.subscribe(s => s.get(ALICE), jest.fn());
  const bob = store.subscribe(s => s.getFailure(BOB), jest.fn());
  await flush();
  alice();
  bob();
  await flush();
  expect(requests[0].signal?.aborted).toBe(true);
  requests[0].resolve('cancelled');
  requests[1].reject(new Error('Cancelled failure'));
  await flush();
  expect(store.getState().get(ALICE)).toBeUndefined();
  expect(store.getState().getFailure(BOB)).toBeUndefined();
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
  store: QueryStore<PromiseSettledResult<string | null>[], { inputs: Input[] }, QueryCollectionState<Input, string | null>>;
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
