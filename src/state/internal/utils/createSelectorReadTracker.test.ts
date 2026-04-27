import { createBaseStore, type Store } from '@storesjs/stores';

import { createSelectorReadTracker } from './createSelectorReadTracker';

type TestState = {
  tick: () => void;
  read: (key: string) => number;
  subscribedKeys: string[];
  version: number;
};

type NumericTestState = {
  read: (key: number) => number;
  subscribedKeys: number[];
};

describe('createSelectorReadTracker', () => {
  it('ignores reads outside selector subscriptions', () => {
    const store = createTestStore();

    store.getState().read('BTC');

    expect(store.getState().subscribedKeys).toEqual([]);
  });

  it('ignores reads from full-state listeners', () => {
    const store = createTestStore();

    const unsubscribe = store.subscribe(state => {
      state.read('BTC');
    });

    store.getState().tick();

    expect(store.getState().subscribedKeys).toEqual([]);

    unsubscribe();
  });

  it('tracks keys read by selector subscriptions', () => {
    const store = createTestStore();

    const unsubscribe = store.subscribe(
      state => state.read('BTC'),
      () => undefined
    );

    expect(store.getState().subscribedKeys).toEqual(['BTC']);

    unsubscribe();

    expect(store.getState().subscribedKeys).toEqual([]);
  });

  it('counts duplicate reads from one selector once', () => {
    const store = createTestStore();

    const unsubscribe = store.subscribe(
      state => {
        state.read('BTC');
        return state.read('BTC');
      },
      () => undefined
    );

    expect(store.getState().subscribedKeys).toEqual(['BTC']);

    unsubscribe();

    expect(store.getState().subscribedKeys).toEqual([]);
  });

  it('keeps a key active until its last selector subscription is released', () => {
    const store = createTestStore();

    const unsubscribeA = store.subscribe(
      state => state.read('BTC'),
      () => undefined
    );
    const unsubscribeB = store.subscribe(
      state => state.read('BTC'),
      () => undefined
    );

    expect(store.getState().subscribedKeys).toEqual(['BTC']);

    unsubscribeA();

    expect(store.getState().subscribedKeys).toEqual(['BTC']);

    unsubscribeB();

    expect(store.getState().subscribedKeys).toEqual([]);
  });

  it('moves tracked keys when selector reads change', () => {
    const store = createTestStore();
    let key = 'BTC';

    const unsubscribe = store.subscribe(
      state => state.read(key),
      () => undefined
    );

    expect(store.getState().subscribedKeys).toEqual(['BTC']);

    key = 'ETH';
    store.getState().tick();

    expect(store.getState().subscribedKeys).toEqual(['ETH']);

    unsubscribe();

    expect(store.getState().subscribedKeys).toEqual([]);
  });

  it('removes keys when a live selector stops reading them', () => {
    const store = createTestStore();
    let shouldRead = true;

    const unsubscribe = store.subscribe(
      state => (shouldRead ? state.read('BTC') : state.version),
      () => undefined
    );

    expect(store.getState().subscribedKeys).toEqual(['BTC']);

    shouldRead = false;
    store.getState().tick();

    expect(store.getState().subscribedKeys).toEqual([]);

    unsubscribe();
  });

  it('updates multi-key selector reads without disturbing unchanged keys', () => {
    const store = createTestStore();
    let includeEth = true;

    const unsubscribe = store.subscribe(
      state => {
        state.read('BTC');
        if (includeEth) state.read('ETH');
        return state.version;
      },
      () => undefined
    );

    expect(store.getState().subscribedKeys).toEqual(['BTC', 'ETH']);

    includeEth = false;
    store.getState().tick();

    expect(store.getState().subscribedKeys).toEqual(['BTC']);

    unsubscribe();

    expect(store.getState().subscribedKeys).toEqual([]);
  });

  it('tracks zero as a numeric key', () => {
    const reads = createSelectorReadTracker<number>();
    const store = createBaseStore<NumericTestState>(() => ({
      subscribedKeys: [],

      read: key => {
        reads.track(key);
        return key;
      },
    }));

    const trackedStore = reads.install(store, subscribedKeys => store.setState({ subscribedKeys }));

    const unsubscribe = trackedStore.subscribe(
      state => state.read(0),
      () => undefined
    );

    expect(trackedStore.getState().subscribedKeys).toEqual([0]);

    unsubscribe();

    expect(trackedStore.getState().subscribedKeys).toEqual([]);
  });
});

function createTestStore(): Store<TestState> {
  const reads = createSelectorReadTracker<string>();

  const store = createBaseStore<TestState>((set, get) => ({
    subscribedKeys: [],
    version: 0,

    read: key => {
      reads.track(key);
      return get().version;
    },

    tick: () => set(state => ({ version: state.version + 1 })),
  }));

  return reads.install(store, subscribedKeys => store.setState({ subscribedKeys }));
}
