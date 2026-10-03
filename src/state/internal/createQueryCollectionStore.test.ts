import { createBaseStore, createDerivedStore, type BaseStore } from '@storesjs/stores';

import { createQueryCollectionStore, type QueryCollectionState } from './createQueryCollectionStore';

type Input = { name: string; chainId: number };
type Data = string | null;
type Request = PromiseWithResolvers<Data> & { input: Input; signal: AbortSignal };
type Fixture = { store: BaseStore<QueryCollectionState<Input, Data>>; requests: Request[] };

const ALICE = { name: 'alice.eth', chainId: 1 };
const BOB = { name: 'bob.eth', chainId: 1 };

beforeEach(() => jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'setImmediate'] }));
afterEach(() => jest.useRealTimers());

it('shares one request per key and keeps each result independent', async () => {
  const { store, requests } = createFixture();
  expect(store.getState().get(ALICE).status).toBe('idle');
  await flush();
  expect(requests).toHaveLength(0);

  const aliceListener = jest.fn();
  const alice = store.subscribe(s => s.get(ALICE), aliceListener);
  const sameAlice = store.subscribe(s => s.get({ ...ALICE }), jest.fn());
  const bob = store.subscribe(s => s.get(BOB), jest.fn());
  await flush();
  expect(requests.map(request => request.input)).toEqual([ALICE, BOB]);

  const failure = new Error('Resolver failed');
  requests[0].reject(failure);
  requests[1].resolve(null);
  await flush();
  expect(store.getState().get(ALICE)).toEqual({ status: 'error', data: undefined, error: failure });
  expect(store.getState().get(BOB)).toEqual({ status: 'success', data: null, error: null });
  expect(aliceListener).toHaveBeenCalledTimes(2);

  alice();
  sameAlice();
  bob();
});

it('releases only the last reader and rejects late results from cancelled work', async () => {
  const { store, requests } = createFixture({ cacheTime: 0 });
  const first = store.subscribe(s => s.get(ALICE), jest.fn());
  const second = store.subscribe(s => s.get(ALICE), jest.fn());
  await flush();

  first();
  await flush();
  expect(requests[0].signal.aborted).toBe(false);
  second();
  await flush();
  expect(requests[0].signal.aborted).toBe(true);

  const next = store.subscribe(s => s.get(ALICE), jest.fn());
  await flush();
  requests[1].resolve('current');
  await flush();
  requests[0].resolve('cancelled');
  await flush();
  expect(store.getState().get(ALICE).data).toBe('current');
  next();
});

it.each(['success', 'error'] as const)('keeps a derived %s result without refetching during dependency rebinding', async outcome => {
  const { store, requests } = createFixture({ staleTime: 0 });
  const input = createBaseStore(() => ({ chainId: 1 }));
  const derived = createDerivedStore($ => {
    const chainId = $(input, s => s.chainId);
    return $(store, s => s.get({ ...ALICE, chainId }));
  });
  const stop = derived.subscribe(jest.fn());
  await flush();

  if (outcome === 'success') requests[0].resolve('first chain');
  else requests[0].reject(new Error('Failed read'));
  await flush();
  expect(requests).toHaveLength(1);
  expect(derived.getState().status).toBe(outcome);

  input.setState({ chainId: 10 });
  await flush();
  expect(requests.map(request => request.input.chainId)).toEqual([1, 10]);
  expect(derived.getState().data).toBeUndefined();
  requests[1].resolve('second chain');
  await flush();
  expect(derived.getState().data).toBe('second chain');
  stop();
});

it('keeps a request needed by an imperative caller after its last subscriber leaves', async () => {
  const { store, requests } = createFixture();
  const stop = store.subscribe(s => s.get(ALICE), jest.fn());
  await flush();
  const result = store.getState().fetch(ALICE);
  expect(store.getState().fetch(ALICE)).toBe(result);

  stop();
  await flush();
  expect(requests[0].signal.aborted).toBe(false);
  requests[0].resolve('address');
  await expect(result).resolves.toBe('address');
});

it('reuses fresh data across observed lifetimes, refreshes stale data, and expires inactive entries', async () => {
  const { store, requests } = createFixture({ staleTime: 100, cacheTime: 1000 });
  const fetched = store.getState().fetch(ALICE);
  await flush();
  requests[0].resolve('cached');
  await fetched;

  const first = store.subscribe(s => s.get(ALICE), jest.fn());
  await flush();
  expect(requests).toHaveLength(1);
  first();
  await flush();
  jest.advanceTimersByTime(100);

  const second = store.subscribe(s => s.get(ALICE), jest.fn());
  await flush();
  expect(requests).toHaveLength(2);
  expect(store.getState().get(ALICE)).toEqual({ status: 'loading', data: 'cached', error: null });
  requests[1].resolve('updated');
  await flush();
  second();
  await flush();
  jest.advanceTimersByTime(1000);
  expect(store.getState().get(ALICE).status).toBe('idle');
});

it('retains a completed result when its listener immediately unsubscribes', async () => {
  const { store, requests } = createFixture();
  const stop = store.subscribe(
    s => s.get(ALICE),
    result => {
      if (result.status === 'success') stop();
    }
  );
  await flush();
  requests[0].resolve('completed');
  await flush();

  await expect(store.getState().fetch(ALICE)).resolves.toBe('completed');
  expect(requests).toHaveLength(1);
});

function createFixture({ staleTime = 1000, cacheTime = 5000 }: { staleTime?: number; cacheTime?: number } = {}): Fixture {
  const requests: Request[] = [];
  const store = createQueryCollectionStore({
    key: ({ name, chainId }: Input) => `${chainId}:${name}`,
    fetcher: (input, signal) => {
      const request = { ...Promise.withResolvers<Data>(), input, signal };
      requests.push(request);
      return request.promise;
    },
    staleTime,
    cacheTime,
  });
  return { store, requests };
}

function flush(): Promise<void> {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
}
