import { createBaseStore } from '@storesjs/stores';
import { describe, expect, it, vi } from 'vitest';

import { useWalletsStore } from '@/state/wallets/walletsStore';

import { nftsStoreActions, useNftsStore } from './nfts';

const requests = vi.hoisted(() => ({ fetch: vi.fn(async (params: { walletAddress: string }) => ({ address: params.walletAddress })) }));

vi.mock('@/state/wallets/walletsStore', () => ({
  useWalletsStore: createBaseStore(() => ({ accountAddress: '0x0000000000000000000000000000000000000001' })),
}));

vi.mock('./createNftsStore', async () => {
  const { createQueryStore } = await import('@storesjs/stores');
  return {
    createNftsStore: (address: string) =>
      createQueryStore({
        params: { walletAddress: address },
        enabled: false,
        fetcher: requests.fetch,
      }),
  };
});

const A = '0x0000000000000000000000000000000000000001';
const B = '0x0000000000000000000000000000000000000002';

describe('account-bound NFT state', () => {
  it('routes native virtual actions across A → B → A using fresh factory parameters', async () => {
    const snapshots: string[] = [];
    const stop = useNftsStore.subscribe(state => snapshots.push(state.queryKey));
    expect(useNftsStore.getState(A)).toBe(useNftsStore.getState());
    await nftsStoreActions.fetch(undefined, { force: true });

    useWalletsStore.setState({ accountAddress: B });
    expect(useNftsStore.getState(B)).toBe(useNftsStore.getState());
    await nftsStoreActions.fetch(undefined, { force: true });
    await useNftsStore.getState(A).fetch(undefined, { force: true });
    expect(useNftsStore.getState().getData()).toEqual({ address: B });

    useWalletsStore.setState({ accountAddress: A });
    await nftsStoreActions.fetch(undefined, { force: true });
    expect(requests.fetch.mock.calls.map(([params]) => params.walletAddress)).toEqual([A, B, A, A]);
    expect(useNftsStore.getState().getData()).toEqual({ address: A });
    expect(snapshots.length).toBeGreaterThan(1);
    stop();
  });
});
