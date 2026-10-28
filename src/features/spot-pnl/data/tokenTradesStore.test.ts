import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { useChartsStore } from '@/features/charts/stores/chartsStore';
import type { Token } from '@/features/charts/types';
import { SPOT_PNL } from '@/features/config/constants/experimental';
import { useExperimentalConfigStore } from '@/features/config/stores/experimentalConfigStore';
import { logger } from '@/logger';
import { externalTokenQueryFunction } from '@/resources/assets/externalAssetsQuery';
import { setExternalTokenType } from '@/resources/assets/testing/mockExternalTokenTypes';
import { useUserAssetsStore } from '@/state/assets/userAssets';

import { useTokenTradesStore, type TokenTradesParams } from './tokenTradesStore';

const account = vi.hoisted(() => ({ address: '0xwallet' }));

vi.mock('@/features/config/stores/remoteConfig');
vi.mock('@/react-query/queryClient');
vi.mock('@/resources/assets/externalAssetsQuery');
vi.mock('@/state/wallets/walletsStore', () => ({ getAccountAddress: () => account.address, useAccountAddress: () => account.address }));
vi.mock('@/state/assets/positionsSync', () => ({ setupPositionsAssetsSync: () => undefined }));
vi.mock('@/state/assets/createUserAssetsStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { createUserAssetsStore: () => createBaseStore(() => ({ userAssets: new Map<string, ParsedSearchAsset>() })) };
});

const PARAMS: TokenTradesParams = { walletAddress: '0xwallet', codexTokenId: '0xtoken:8453', heldBalance: '10' };
const subscriptions: (() => void)[] = [];

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
}

function respondWith(body: unknown) {
  vi.mocked(fetch).mockResolvedValueOnce(jsonResponse(body));
}

function tradesResponse(trades: object, wallet = '0xwallet') {
  return { data: { filterTokenWallets: { results: [{ address: wallet, ...trades }] } } };
}

function respondWithAcquisition(trades: object) {
  respondWith(tradesResponse(trades));
}

function fetchTrades() {
  return useTokenTradesStore.getState().fetch(PARAMS, { force: true, throwOnError: true });
}

// With nothing else subscribed to the changed stores, as here, derived stores re-derive in a microtask, so each change settles before the query store is read
async function viewToken(token: Token) {
  useChartsStore.getState().setToken(token);
  await settle();
}

async function setHeldBalance(address: string, amount: string) {
  const asset = { balance: { amount, display: amount } } as ParsedSearchAsset;
  useUserAssetsStore.setState({ userAssets: new Map([[`${address}_8453`, asset]]) });
  await settle();
}

function subscribe() {
  const unsubscribe = useTokenTradesStore.subscribe(() => undefined);
  subscriptions.push(unsubscribe);
  return unsubscribe;
}

function hangUntilAborted(_url: RequestInfo | URL, init?: RequestInit) {
  return new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
  });
}

async function switchWallet(address: string) {
  account.address = address;
  useUserAssetsStore.getState();
  await settle();
}

function settle() {
  return new Promise(resolve => {
    setTimeout(resolve, 10);
  });
}

async function viewAcquisition(expected: unknown) {
  const unsubscribe = subscribe();
  await vi.waitFor(() => expect(useTokenTradesStore.getState().getData()).toEqual(expected));
  unsubscribe();
}

describe('useTokenTradesStore', () => {
  beforeEach(async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Unexpected request'));
    vi.spyOn(logger, 'error').mockImplementation(() => undefined);
    useExperimentalConfigStore.getState().setFlag(SPOT_PNL, true);
    await switchWallet('0xwallet');
  });

  afterEach(() => {
    subscriptions.splice(0).forEach(unsubscribe => unsubscribe());
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches the viewed token for the current wallet once subscribed', async () => {
    const trades = {
      purchasedTokenBalance: '10',
      tokenAcquisitionCostUsd: '100',
      tokenAmountSold1y: '2',
      amountSoldUsd1y: '30',
      realizedProfitUsd1y: '10',
      lastTransactionAt: 1790000000,
      tokenBalanceLive: '12',
    };
    await viewToken({ address: '0xviewed', chainId: 8453 });
    respondWithAcquisition(trades);

    await viewAcquisition(trades);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body)).variables).toEqual({
      wallets: ['0xwallet'],
      tokenId: '0xviewed:8453',
      limit: 1,
    });
  });

  it('does not request Codex for a stablecoin', async () => {
    setExternalTokenType('0xstable', 'stablecoin');
    await viewToken({ address: '0xstable', chainId: 8453 });
    subscribe();
    await settle();

    expect(externalTokenQueryFunction).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining([expect.objectContaining({ address: '0xstable' })]) })
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refetches the cost basis when the held balance changes', async () => {
    const beforeBuy = { purchasedTokenBalance: '10', tokenAcquisitionCostUsd: '100' };
    const afterBuy = { purchasedTokenBalance: '20', tokenAcquisitionCostUsd: '300' };
    await viewToken({ address: '0xbought', chainId: 8453 });
    await setHeldBalance('0xbought', '10');
    respondWithAcquisition(beforeBuy);
    await viewAcquisition(beforeBuy);

    await setHeldBalance('0xbought', '20');
    respondWithAcquisition(afterBuy);
    await viewAcquisition(afterBuy);

    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('follows a wallet switch', async () => {
    const firstWallet = { purchasedTokenBalance: '10', tokenAcquisitionCostUsd: '100' };
    const secondWallet = { purchasedTokenBalance: '5', tokenAcquisitionCostUsd: '40' };
    await viewToken({ address: '0xswitched', chainId: 8453 });
    await setHeldBalance('0xswitched', '10');
    respondWithAcquisition(firstWallet);
    subscribe();
    await vi.waitFor(() => expect(useTokenTradesStore.getState().getData()).toEqual(firstWallet));

    // The new wallet's balance arrives after the switch, so every request from here on answers for the new wallet
    vi.mocked(fetch).mockImplementation(async () => jsonResponse(tradesResponse(secondWallet, '0xother')));
    await switchWallet('0xother');
    await setHeldBalance('0xswitched', '5');
    await vi.waitFor(() => expect(useTokenTradesStore.getState().getData()).toEqual(secondWallet));

    expect(JSON.parse(String(vi.mocked(fetch).mock.lastCall?.[1]?.body)).variables.wallets).toEqual(['0xother']);
  });

  it.each([
    { name: 'a perps market is viewed', token: 'BTC', enabled: true },
    { name: 'spot P&L is disabled', token: { address: '0xdisabled', chainId: 8453 }, enabled: false },
  ] as const)('does not fetch when $name', async ({ token, enabled }) => {
    useExperimentalConfigStore.getState().setFlag(SPOT_PNL, enabled);
    await viewToken(token);

    subscribe()();
    await settle();

    expect(fetch).not.toHaveBeenCalled();
  });

  it('cancels the request without logging when the store aborts it', async () => {
    let requestSignal: AbortSignal | null | undefined;
    await viewToken({ address: '0xcancelled', chainId: 8453 });
    vi.mocked(fetch).mockImplementationOnce((url, init) => {
      requestSignal = init?.signal;
      return hangUntilAborted(url, init);
    });

    const unsubscribe = subscribe();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    unsubscribe();
    await settle();

    expect(requestSignal?.aborted).toBe(true);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs a request that times out', async () => {
    await viewToken({ address: '0xslow', chainId: 8453 });
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation(hangUntilAborted);

    subscribe();
    await vi.advanceTimersByTimeAsync(15_000);

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ cause: expect.objectContaining({ name: 'AbortError' }) }),
      expect.anything()
    );
  });

  it('returns null when Codex has no trades', async () => {
    respondWith({ data: { filterTokenWallets: { results: [] } } });
    await expect(fetchTrades()).resolves.toBeNull();
  });

  it('fails and logs when the GraphQL envelope carries errors', async () => {
    respondWith({ errors: [{ message: 'Field "filterTokenWallets" is not allowed' }] });
    await expect(fetchTrades()).rejects.toThrow('not allowed');
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
