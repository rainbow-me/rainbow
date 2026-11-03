import { setImmediate } from 'node:timers/promises';

import { createBaseStore, getQueryKey } from '@storesjs/stores';
import { ethers } from 'ethers';
import { type Address } from 'viem';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type awaitPolygonConfirmation as ConfirmTransaction } from '@/features/polymarket/utils/confirmation';
import { getErc20Balance } from '@/features/token/data/api/erc20Read';

import { type polymarketBalanceActions as BalanceActions, type usePolymarketBalanceStore as BalanceStore } from './polymarketBalanceStore';

let usePolymarketBalanceStore: typeof BalanceStore;
let polymarketBalanceActions: typeof BalanceActions;
let awaitPolygonConfirmation: typeof ConfirmTransaction;

const fetchPositions = vi.hoisted(() => vi.fn());
vi.mock('@/features/polymarket/stores/polymarketPositionsStore', () => ({ polymarketPositionsActions: { fetch: fetchPositions } }));

vi.mock('@/features/polymarket/constants', () => ({
  POLYGON_USDC_ADDRESS: '0x000000000000000000000000000000000000000b',
  POLYGON_USDC_DECIMALS: 6,
  POLYMARKET_PUSD_ADDRESS: '0x000000000000000000000000000000000000000a',
  POLYMARKET_PUSD_DECIMALS: 6,
}));
vi.mock('@/features/polymarket/stores/derived/usePolymarketClients', () => ({ usePolymarketClients: clients }));
vi.mock('@/features/token/data/api/erc20Read', () => ({ getErc20Balance: vi.fn() }));
const provider = vi.hoisted(() => ({ call: vi.fn(), getBlockNumber: vi.fn(), waitForTransaction: vi.fn() }));
vi.mock('@/handlers/web3', () => ({ getProvider: () => provider }));

const proxyWallet: Address = '0x0000000000000000000000000000000000000001';
const otherWallet: Address = '0x0000000000000000000000000000000000000002';
const clients = createBaseStore<{ proxyAddress: Address }>(() => ({ proxyAddress: proxyWallet }));
const queryKey = getQueryKey({ address: proxyWallet });
const baseline = { pusdBalance: '100.000000', usdcBalance: '0.000000' };
const mockBalance = vi.mocked(getErc20Balance);

function backend(pusd: string, usdc = '0') {
  mockBalance.mockImplementation(async ({ tokenAddress }) =>
    ethers.utils.parseUnits(tokenAddress === '0x000000000000000000000000000000000000000a' ? pusd : usdc, 6)
  );
}

function apply(operationId: string, deltaUsd: string) {
  polymarketBalanceActions.applyExpectedBalanceDelta({ baseline, operationId, deltaUsd, proxyWallet });
}

async function refresh() {
  await usePolymarketBalanceStore.getState().fetch({ address: proxyWallet }, { force: true });
}

describe('polymarketBalanceStore', () => {
  beforeEach(async () => {
    clients.setState({ proxyAddress: proxyWallet });
    vi.resetModules();
    ({ usePolymarketBalanceStore, polymarketBalanceActions } = await import('./polymarketBalanceStore'));
    ({ awaitPolygonConfirmation } = await import('@/features/polymarket/utils/confirmation'));

    mockBalance.mockReset();
    provider.call.mockReset();
    provider.getBlockNumber.mockResolvedValue(99);
    provider.waitForTransaction.mockReset();
    usePolymarketBalanceStore.setState({ queryKey, queryCache: {} });
    backend('100');
    await refresh();
  });
  afterEach(() => {
    usePolymarketBalanceStore.getState().reset(true);
    vi.restoreAllMocks();
  });

  it('holds an accepted estimate over stale reads without moving the active account', async () => {
    usePolymarketBalanceStore.setState({ queryKey: getQueryKey({ address: otherWallet }) });
    apply('buy', '-5.12');
    backend('0');
    await usePolymarketBalanceStore.getState().fetch({ address: otherWallet }, { force: true });
    expect(polymarketBalanceActions.getBalance(proxyWallet)).toBe('94.88');

    backend('100');
    await refresh();
    expect(polymarketBalanceActions.getBalance(proxyWallet)).toBe('94.88');
    expect(usePolymarketBalanceStore.getState().queryKey).toBe(getQueryKey({ address: otherWallet }));
    expect(polymarketBalanceActions.getBalance()).toBe('0.00');
  });

  it('combines buys and sales once and rolls back only the failed operation', () => {
    apply('buy', '-5');
    apply('sell', '3');
    apply('buy', '-5');
    expect(polymarketBalanceActions.getBalance()).toBe('98.00');
    polymarketBalanceActions.discardExpectedBalanceDelta({ operationId: 'buy', proxyWallet });
    expect(polymarketBalanceActions.getBalance()).toBe('103.00');
  });

  it('keeps the estimate until all concurrent operations settle', async () => {
    apply('buy', '-5.12');
    apply('sell', '3');
    backend('94.9');
    await polymarketBalanceActions.finalizeExpectedBalanceDelta({ operationId: 'buy', adjustmentUsd: '0.02', proxyWallet });
    await refresh();
    expect(polymarketBalanceActions.getBalance()).toBe('97.90');
    backend('97.923456');
    await polymarketBalanceActions.finalizeExpectedBalanceDelta({ operationId: 'sell', proxyWallet });
    expect(polymarketBalanceActions.getBalanceSnapshot()?.pusdBalance).toBe('97.923456');
  });

  it.each(['settled', 'untracked', 'another trade pending'] as const)(
    'reads each collateral token once on final refresh: %s',
    async scenario => {
      const { refetchPolymarketStores } = await import('@/features/polymarket/utils/refetchPolymarketStores');
      if (scenario !== 'untracked') apply('buy', '-5');
      if (scenario === 'another trade pending') apply('sell', '3');
      backend('95.03');
      mockBalance.mockClear();
      fetchPositions.mockClear();

      const settlementRead = polymarketBalanceActions.finalizeExpectedBalanceDelta({ operationId: 'buy', proxyWallet });
      await refetchPolymarketStores(proxyWallet, settlementRead);

      expect(mockBalance).toHaveBeenCalledTimes(2);
      expect(fetchPositions).toHaveBeenCalledOnce();
      expect(polymarketBalanceActions.getBalance()).toBe(scenario === 'another trade pending' ? '98.00' : '95.03');
    }
  );

  it('keeps a cash-out balance at or beyond the confirmed fee block', async () => {
    const { getErc20Balance: readBalance } = await vi.importActual<typeof import('@/features/token/data/api/erc20Read')>(
      '@/features/token/data/api/erc20Read'
    );
    const beforeBuy = { pusdBalance: '27.255288', usdcBalance: '0.000000' };
    backend(beforeBuy.pusdBalance);
    await refresh();

    polymarketBalanceActions.applyExpectedBalanceDelta({ baseline: beforeBuy, deltaUsd: '-5.496825', operationId: 'buy', proxyWallet });
    polymarketBalanceActions.applyExpectedBalanceDelta({
      baseline: { pusdBalance: '21.758463', usdcBalance: '0.000000' },
      deltaUsd: '4.8457',
      operationId: 'sell',
      proxyWallet,
    });
    expect(polymarketBalanceActions.getBalance()).toBe('26.60');

    mockBalance.mockImplementation(readBalance);
    provider.call.mockImplementation(async ({ to }, blockNumber) => {
      const balance = to === '0x000000000000000000000000000000000000000b' ? '0' : blockNumber >= 100 ? '26.604524' : '26.758118';
      return ethers.utils.hexZeroPad(ethers.utils.parseUnits(balance, 6).toHexString(), 32);
    });
    provider.waitForTransaction.mockResolvedValue({ status: 1, blockNumber: 100 });
    await awaitPolygonConfirmation('0xfee');

    await polymarketBalanceActions.finalizeExpectedBalanceDelta({ operationId: 'buy', adjustmentUsd: '0.000095', proxyWallet });
    await polymarketBalanceActions.finalizeExpectedBalanceDelta({ operationId: 'sell', adjustmentUsd: '0.000106', proxyWallet });
    expect(polymarketBalanceActions.getBalanceSnapshot()?.pusdBalance).toBe('26.604524');

    await refresh();
    expect(polymarketBalanceActions.getBalanceSnapshot()?.pusdBalance).toBe('26.604524');

    provider.getBlockNumber.mockResolvedValue(101);
    provider.call.mockImplementation(async ({ to }, blockNumber) => {
      const balance = to === '0x000000000000000000000000000000000000000b' ? '0' : blockNumber === 101 ? '27.604524' : '26.604524';
      return ethers.utils.hexZeroPad(ethers.utils.parseUnits(balance, 6).toHexString(), 32);
    });
    await refresh();
    expect(polymarketBalanceActions.getBalanceSnapshot()?.pusdBalance).toBe('27.604524');
  });

  it.each([
    { account: 'active', selectedWallet: proxyWallet },
    { account: 'inactive', selectedWallet: otherWallet },
  ])('drains a pre-settlement read for the $account account before releasing its estimate', async ({ selectedWallet }) => {
    apply('buy', '-5.12');
    usePolymarketBalanceStore.setState({ queryKey: getQueryKey({ address: selectedWallet }) });
    const held = Promise.withResolvers<void>();
    const readStarted = Promise.withResolvers<void>();
    mockBalance.mockImplementation(async ({ tokenAddress }) => {
      readStarted.resolve();
      await held.promise;
      return ethers.utils.parseUnits(tokenAddress === '0x000000000000000000000000000000000000000a' ? '100' : '0', 6);
    });

    const staleRead = refresh();
    await readStarted.promise;
    backend('95.03');
    const settlement = polymarketBalanceActions.finalizeExpectedBalanceDelta({ operationId: 'buy', proxyWallet });
    await Promise.resolve();
    held.resolve();
    await Promise.all([staleRead, settlement]);
    expect(polymarketBalanceActions.getBalance(proxyWallet)).toBe('95.03');
    expect(usePolymarketBalanceStore.getState().queryKey).toBe(getQueryKey({ address: selectedWallet }));
  });

  it('refreshes the captured wallet if its post-settlement read is cancelled', async () => {
    const { refetchPolymarketStores } = await import('@/features/polymarket/utils/refetchPolymarketStores');
    const pendingBlock = Promise.withResolvers<number>();
    const settledBlock = Promise.withResolvers<number>();
    const retryStarted = Promise.withResolvers<void>();
    provider.getBlockNumber.mockReturnValueOnce(pendingBlock.promise).mockImplementationOnce(() => {
      retryStarted.resolve();
      return settledBlock.promise;
    });

    apply('buy', '-5');
    const pendingRead = refresh();
    const settlement = polymarketBalanceActions.finalizeExpectedBalanceDelta({ operationId: 'buy', proxyWallet });
    const completion = refetchPolymarketStores(proxyWallet, settlement);

    pendingBlock.resolve(99);
    await pendingRead;
    await retryStarted.promise;

    backend('95.03');
    clients.setState({ proxyAddress: otherWallet });
    await usePolymarketBalanceStore.getState().fetch({ address: otherWallet }, { force: true });
    settledBlock.resolve(99);
    await completion;

    expect(polymarketBalanceActions.getBalance(proxyWallet)).toBe('95.03');
    expect(usePolymarketBalanceStore.getState().queryKey).toBe(getQueryKey({ address: otherWallet }));
  });

  it('does not retire a new operation that arrives during a settlement read', async () => {
    apply('buy', '-5');
    let release!: () => void;
    const held = new Promise<void>(resolve => {
      release = resolve;
    });
    mockBalance.mockImplementation(async ({ tokenAddress }) => {
      await held;
      return ethers.utils.parseUnits(tokenAddress === '0x000000000000000000000000000000000000000a' ? '95' : '0', 6);
    });
    const settlement = polymarketBalanceActions.finalizeExpectedBalanceDelta({ operationId: 'buy', proxyWallet });
    apply('next-buy', '-2');
    release();
    await settlement;
    expect(polymarketBalanceActions.getBalance()).toBe('93.00');
    backend('93.01');
    await polymarketBalanceActions.finalizeExpectedBalanceDelta({ operationId: 'next-buy', proxyWallet });
    expect(polymarketBalanceActions.getBalance()).toBe('93.01');
  });

  it('retains the estimate when the settlement balance read fails, then accepts a later read', async () => {
    apply('buy', '-5');
    mockBalance.mockRejectedValue(new Error('offline'));
    await expect(polymarketBalanceActions.finalizeExpectedBalanceDelta({ operationId: 'buy', proxyWallet })).rejects.toThrow();
    expect(polymarketBalanceActions.getBalance()).toBe('95.00');
    backend('95.03');
    await refresh();
    expect(polymarketBalanceActions.getBalance()).toBe('95.03');
  });

  it.each(['cancelled', 'result-only'] as const)('keeps the settled estimate when a %s RPC finishes without publishing', async mode => {
    apply('buy', '-5');
    mockBalance.mockRejectedValue(new Error('offline'));
    await expect(polymarketBalanceActions.finalizeExpectedBalanceDelta({ operationId: 'buy', proxyWallet })).rejects.toThrow();

    backend('95.03');
    const block = Promise.withResolvers<number>();
    provider.getBlockNumber.mockReturnValueOnce(block.promise);

    const read = usePolymarketBalanceStore
      .getState()
      .fetch({ address: proxyWallet }, { force: true, skipStoreUpdates: mode === 'result-only' });
    if (mode === 'cancelled') {
      await usePolymarketBalanceStore.getState().fetch({ address: otherWallet }, { force: true, updateQueryKey: true });
      await expect(read).resolves.toBeNull();
    }

    block.resolve(99);
    if (mode === 'result-only') {
      await expect(read).resolves.toMatchObject({ pusdBalance: '95.030000' });
    }
    await setImmediate();

    apply('next-buy', '-2');
    expect(polymarketBalanceActions.getBalance(proxyWallet)).toBe('93.00');
  });

  it('releases unresolved estimates after the bounded conflict window', async () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    apply('buy', '-5');
    vi.mocked(Date.now).mockReturnValue(now + 120_001);
    backend('99');
    await refresh();
    expect(polymarketBalanceActions.getBalance()).toBe('99.00');
  });

  it('does not invent a starting balance for an unhydrated account', () => {
    usePolymarketBalanceStore.setState({ queryCache: {} });
    apply('buy', '-5');
    expect(polymarketBalanceActions.getBalanceSnapshot()).toBeUndefined();
  });
});
