import { destroyStore, type BaseStore } from '@storesjs/stores';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getVisibleWalletAddresses } from '@/features/wallet/utils/visibleWalletAddresses';
import { time } from '@/framework/core/utils/time';
import { rainbowStorage } from '@/state/internal/rainbowStorage';

import type * as SummaryStoreModule from './useWalletSummaryStore';

const post = vi.hoisted(() => vi.fn());
vi.mock('@/resources/addys/client', () => ({ getAddysHttpClient: () => ({ post }) }));

vi.mock('@/state/assets/userAssetsStoreManager', async () => ({
  userAssetsStoreManager: (await import('@storesjs/stores')).createBaseStore(() => ({ currency: 'USD' })),
}));

vi.mock('@/state/wallets/walletsStore', async () => ({
  useWalletsStore: (await import('@storesjs/stores')).createBaseStore(() => ({ accountAddress: '', wallets: null })),
  getWalletAddresses: (wallets: Record<string, { addresses: { address: string }[] }> | null) =>
    Object.values(wallets || {}).flatMap(wallet => wallet.addresses.map(account => account.address)),
}));

const SELECTED = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa';
const OWNED = '0xBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBbBb';
const HIDDEN = '0xCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCcCc';
const WATCHED = '0xDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDdDd';
const lower = (address: string) => address.toLowerCase();

const WALLETS = {
  owned: {
    id: 'owned',
    type: 'mnemonic',
    addresses: [
      { address: SELECTED, visible: true },
      { address: OWNED, visible: true },
      { address: HIDDEN, visible: false },
    ],
  },
  watched: { id: 'watched', type: 'readOnly', addresses: [{ address: WATCHED, visible: true }] },
};

type WalletsState = { accountAddress: string; wallets: typeof WALLETS | null };

let store: typeof SummaryStoreModule.useWalletSummaryQueryStore;
let summary: typeof SummaryStoreModule;
let wallets: BaseStore<WalletsState>;
let currencyStore: BaseStore<{ currency: string }>;
let unsubscribe: (() => void) | undefined;
let omit: string[] = [];

function respondWithValue(value: (currency: string) => number) {
  post.mockImplementation(async (_url: string, body: string) => {
    const { addresses, currency } = JSON.parse(body) as { addresses: string[]; currency: string };
    return {
      data: {
        data: {
          addresses: Object.fromEntries(
            addresses
              .filter(address => !omit.includes(address))
              .map(address => [
                address,
                {
                  meta: { rainbow: { transactions: 3 } },
                  summary: { asset_value: value(currency), positions_value: null, claimables_value: null },
                },
              ])
          ),
        },
      },
    };
  });
}

function requestedAddresses(call = -1): string[] {
  const body = post.mock.calls.at(call)?.[1] as string;
  return (JSON.parse(body) as { addresses: string[] }).addresses.toSorted();
}

const sorted = (...addresses: string[]) => addresses.map(lower).toSorted();

async function loadStore() {
  // Module resets also reload @storesjs/stores, so reconnect it to one storage that outlives them.
  (await import('@storesjs/stores')).configureStores({ storage: rainbowStorage });
  ({ useWalletsStore: wallets } = (await import('@/state/wallets/walletsStore')) as unknown as {
    useWalletsStore: BaseStore<WalletsState>;
  });
  ({ userAssetsStoreManager: currencyStore } = (await import('@/state/assets/userAssetsStoreManager')) as unknown as {
    userAssetsStoreManager: BaseStore<{ currency: string }>;
  });
  wallets.setState({ accountAddress: SELECTED, wallets: WALLETS });
  currencyStore.setState({ currency: 'USD' });
  summary = await import('./useWalletSummaryStore');
  store = summary.useWalletSummaryQueryStore;
  unsubscribe = store.subscribe(() => undefined);
  await vi.advanceTimersByTimeAsync(0);
}

async function refresh() {
  await summary.refetchWalletSummary();
}

describe('useWalletSummaryQueryStore', () => {
  beforeEach(() => {
    // Persistence is debounced on performance.now(), which is not faked by default.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'] });
    vi.resetModules();
    rainbowStorage.delete('walletSummaryStore');
    post.mockReset();
    omit = [];
    respondWithValue(currency => (currency === 'USD' ? 100 : 90));
  });

  afterEach(() => {
    unsubscribe?.();
    unsubscribe = undefined;
    destroyStore(store);
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('requests every visible wallet first, then only the selected one every 2 minutes', async () => {
    await loadStore();

    expect(requestedAddresses()).toEqual(sorted(SELECTED, OWNED, WATCHED));
    expect(store.getState().entries.USD?.[lower(OWNED)]?.balance?.assetValue).toBe(100);

    await vi.advanceTimersByTimeAsync(time.minutes(2));

    expect(post).toHaveBeenCalledTimes(2);
    expect(requestedAddresses()).toEqual(sorted(SELECTED));
  });

  it('adds owned wallets after an hour and watched wallets after a day', async () => {
    await loadStore();
    const start = Date.now();

    vi.setSystemTime(start + time.hours(1) - 1);
    await refresh();
    expect(requestedAddresses()).toEqual(sorted(SELECTED));

    vi.setSystemTime(start + time.hours(1));
    await refresh();
    expect(requestedAddresses()).toEqual(sorted(SELECTED, OWNED));

    vi.setSystemTime(start + time.days(1) - 1);
    await refresh();
    expect(requestedAddresses()).toEqual(sorted(SELECTED, OWNED));

    vi.setSystemTime(start + time.days(1));
    await refresh();
    expect(requestedAddresses()).toEqual(sorted(SELECTED, WATCHED));
  });

  it('requests only the newly selected wallet on a switch, including a hidden one', async () => {
    await loadStore();

    wallets.setState({ accountAddress: OWNED });
    await vi.advanceTimersByTimeAsync(0);
    expect(requestedAddresses()).toEqual(sorted(OWNED));

    wallets.setState({ accountAddress: HIDDEN });
    await vi.advanceTimersByTimeAsync(0);
    expect(requestedAddresses()).toEqual(sorted(HIDDEN));
    expect(store.getState().entries.USD?.[lower(HIDDEN)]?.balance?.assetValue).toBe(100);
  });

  it('keeps each currency in its own cache', async () => {
    await loadStore();

    currencyStore.setState({ currency: 'EUR' });
    await vi.advanceTimersByTimeAsync(0);
    expect(requestedAddresses()).toEqual(sorted(SELECTED, OWNED, WATCHED));

    currencyStore.setState({ currency: 'USD' });
    await vi.advanceTimersByTimeAsync(0);
    expect(requestedAddresses()).toEqual(sorted(SELECTED));

    const { entries } = store.getState();
    expect(entries.USD?.[lower(WATCHED)]?.balance?.assetValue).toBe(100);
    expect(entries.EUR?.[lower(WATCHED)]?.balance?.assetValue).toBe(90);
  });

  it('ignores a response that arrives after the currency changed', async () => {
    await loadStore();
    const pending: { currency: string; addresses: string[]; resolve: (response: unknown) => void }[] = [];
    post.mockImplementation(
      (_url: string, body: string) =>
        new Promise(resolve => {
          pending.push({ ...(JSON.parse(body) as { currency: string; addresses: string[] }), resolve });
        })
    );
    const respond = (index: number, value: number) => {
      const { addresses, resolve } = pending[index];
      resolve({
        data: {
          data: {
            addresses: Object.fromEntries(
              addresses.map(address => [
                address,
                { meta: { rainbow: { transactions: 1 } }, summary: { asset_value: value, positions_value: null, claimables_value: null } },
              ])
            ),
          },
        },
      });
    };

    const usdRefresh = refresh().catch(() => undefined);
    currencyStore.setState({ currency: 'EUR' });
    await vi.advanceTimersByTimeAsync(0);
    expect(pending.map(request => request.currency)).toEqual(['USD', 'EUR']);

    respond(1, 90);
    await vi.advanceTimersByTimeAsync(0);
    respond(0, 101);
    await usdRefresh;
    await vi.advanceTimersByTimeAsync(0);

    expect(store.getState().entries.EUR?.[lower(SELECTED)]?.balance?.assetValue).toBe(90);
    expect(store.getState().entries.USD?.[lower(SELECTED)]?.balance?.assetValue).toBe(100);
  });

  it('keeps the previous balance of an omitted address and waits until it is due again', async () => {
    await loadStore();
    const start = Date.now();

    omit = [lower(OWNED)];
    vi.setSystemTime(start + time.hours(1));
    await refresh();
    expect(requestedAddresses()).toEqual(sorted(SELECTED, OWNED));
    expect(store.getState().entries.USD?.[lower(OWNED)]).toEqual({
      fetchedAt: start + time.hours(1),
      balance: expect.objectContaining({ assetValue: 100 }),
    });

    vi.setSystemTime(start + time.hours(1) + time.minutes(2));
    await refresh();
    expect(requestedAddresses()).toEqual(sorted(SELECTED));
  });

  it('keeps asking for an address until a response returns it, and counts it as loaded meanwhile', async () => {
    omit = [lower(OWNED)];
    await loadStore();

    const { owned } = getVisibleWalletAddresses(wallets.getState().wallets as never);
    expect(owned).toEqual(sorted(SELECTED, OWNED));
    expect(store.getState().entries.USD?.[lower(OWNED)]?.balance).toBeNull();
    expect(summary.hasFetchedAddresses(store.getState().entries.USD, owned)).toBe(true);
    expect(summary.hasFetchedAddresses(store.getState().entries.EUR, owned)).toBe(false);

    omit = [];
    await refresh();
    expect(requestedAddresses()).toEqual(sorted(SELECTED, OWNED));
    expect(store.getState().entries.USD?.[lower(OWNED)]?.balance?.assetValue).toBe(100);
  });

  it('treats entries fetched in the future as due after the clock moves back', async () => {
    await loadStore();

    vi.setSystemTime(Date.now() - time.minutes(5));
    await refresh();

    expect(requestedAddresses()).toEqual(sorted(SELECTED, OWNED, WATCHED));
  });

  it('drops cached entries of removed wallets in every currency', async () => {
    await loadStore();
    currencyStore.setState({ currency: 'EUR' });
    await vi.advanceTimersByTimeAsync(0);

    wallets.setState({ wallets: { owned: WALLETS.owned, watched: { ...WALLETS.watched, addresses: [] } } });
    await refresh();

    const { entries } = store.getState();
    expect(entries.USD?.[lower(WATCHED)]).toBeUndefined();
    expect(entries.EUR?.[lower(WATCHED)]).toBeUndefined();
    expect(entries.USD?.[lower(OWNED)]).toBeDefined();
  });

  it('refreshes only due wallets after a restart', async () => {
    await loadStore();
    // Flushes the debounced persist write.
    await vi.advanceTimersByTimeAsync(time.seconds(10));
    unsubscribe?.();
    post.mockClear();

    vi.resetModules();
    await loadStore();

    expect(post).toHaveBeenCalledTimes(1);
    expect(requestedAddresses()).toEqual(sorted(SELECTED));
    expect(store.getState().entries.USD?.[lower(WATCHED)]?.balance?.assetValue).toBe(100);
  });

  it('discards the previous persisted summary format', async () => {
    await loadStore();
    const { name, storage } = store.persist.getOptions();
    if (!name || !storage) throw new Error('store persistence is not configured');

    await storage.setItem(name, { summary: { data: { addresses: {} } } } as never, 0);
    await vi.advanceTimersByTimeAsync(time.seconds(10));
    await store.persist.rehydrate();

    expect(store.getState().entries).toEqual({});
    expect(store.getState()).not.toHaveProperty('summary');
  });
});
