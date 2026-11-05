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
const mockBalance = vi.mocked(getErc20Balance);

function backend(pusd: string, usdc = '0') {
  mockBalance.mockImplementation(async ({ tokenAddress }) =>
    ethers.utils.parseUnits(tokenAddress === '0x000000000000000000000000000000000000000a' ? pusd : usdc, 6)
  );
}

function apply(deltaUsd: string) {
  const update = polymarketBalanceActions.beginUpdate(proxyWallet);
  update.apply(deltaUsd);
  return update;
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
    apply('-5.12');
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
    const buy = apply('-5');
    apply('3');
    buy.apply('-5');
    expect(polymarketBalanceActions.getBalance()).toBe('98.00');
    buy.discard();
    expect(polymarketBalanceActions.getBalance()).toBe('103.00');
  });

  it('preserves an earlier fee correction while another submission is pending', async () => {
    const buy = apply('-5');
    const nextBuy = polymarketBalanceActions.beginUpdate(proxyWallet);
    expect(polymarketBalanceActions.getBalance()).toBe('95.00');

    backend('95.10');
    buy.finalize('0.10');
    await polymarketBalanceActions.refresh(proxyWallet);
    expect(polymarketBalanceActions.getBalance()).toBe('95.10');

    nextBuy.apply('-7');
    await refresh();
    expect(polymarketBalanceActions.getBalance()).toBe('88.10');

    backend('88.123456');
    nextBuy.finalize();
    await polymarketBalanceActions.refresh(proxyWallet);
    expect(usePolymarketBalanceStore.getState().getData()?.pusdBalance).toBe('88.123456');
  });

  it.each(['settled', 'untracked', 'another trade pending'])('reads each collateral token once on final refresh: %s', async scenario => {
    const { refetchPolymarketStores } = await import('@/features/polymarket/utils/refetchPolymarketStores');
    const buy = scenario === 'untracked' ? undefined : apply('-5');
    if (scenario === 'another trade pending') apply('3');
    backend('95.03');
    mockBalance.mockClear();
    fetchPositions.mockClear();

    buy?.finalize();
    await refetchPolymarketStores(proxyWallet);

    expect(mockBalance).toHaveBeenCalledTimes(2);
    expect(fetchPositions).toHaveBeenCalledOnce();
    expect(polymarketBalanceActions.getBalance()).toBe(scenario === 'another trade pending' ? '98.00' : '95.03');
  });

  it('keeps a cash-out balance at or beyond the confirmed fee block', async () => {
    const { getErc20Balance: readBalance } = await vi.importActual<typeof import('@/features/token/data/api/erc20Read')>(
      '@/features/token/data/api/erc20Read'
    );
    const beforeBuy = { pusdBalance: '27.255288', usdcBalance: '0.000000' };
    backend(beforeBuy.pusdBalance);
    await refresh();

    const buy = apply('-5.496825');
    const sell = apply('4.8457');
    expect(polymarketBalanceActions.getBalance()).toBe('26.60');

    mockBalance.mockImplementation(readBalance);
    provider.call.mockImplementation(async ({ to }, blockNumber) => {
      const balance = to === '0x000000000000000000000000000000000000000b' ? '0' : blockNumber >= 100 ? '26.604524' : '26.758118';
      return ethers.utils.hexZeroPad(ethers.utils.parseUnits(balance, 6).toHexString(), 32);
    });
    provider.waitForTransaction.mockResolvedValue({ status: 1, blockNumber: 100 });
    await awaitPolygonConfirmation('0xfee');

    buy.finalize('0.000095');
    sell.finalize('0.000106');
    await polymarketBalanceActions.refresh(proxyWallet);
    expect(usePolymarketBalanceStore.getState().getData()?.pusdBalance).toBe('26.604524');

    await refresh();
    expect(usePolymarketBalanceStore.getState().getData()?.pusdBalance).toBe('26.604524');

    provider.getBlockNumber.mockResolvedValue(101);
    provider.call.mockImplementation(async ({ to }, blockNumber) => {
      const balance = to === '0x000000000000000000000000000000000000000b' ? '0' : blockNumber === 101 ? '27.604524' : '26.604524';
      return ethers.utils.hexZeroPad(ethers.utils.parseUnits(balance, 6).toHexString(), 32);
    });
    await refresh();
    expect(usePolymarketBalanceStore.getState().getData()?.pusdBalance).toBe('27.604524');
  });

  it.each([
    { account: 'active', selectedWallet: proxyWallet },
    { account: 'inactive', selectedWallet: otherWallet },
  ])('drains a pre-settlement read for the $account account before releasing its estimate', async ({ selectedWallet }) => {
    const buy = apply('-5.12');
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
    buy.finalize();
    const settlement = polymarketBalanceActions.refresh(proxyWallet);
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

    const buy = apply('-5');
    const pendingRead = refresh();
    buy.finalize();
    const completion = refetchPolymarketStores(proxyWallet);

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
    const buy = apply('-5');
    const held = Promise.withResolvers<void>();
    mockBalance.mockImplementation(async ({ tokenAddress }) => {
      await held.promise;
      return ethers.utils.parseUnits(tokenAddress === '0x000000000000000000000000000000000000000a' ? '95' : '0', 6);
    });
    buy.finalize();
    const settlement = polymarketBalanceActions.refresh(proxyWallet);
    const nextBuy = apply('-2');
    held.resolve();
    await settlement;
    expect(polymarketBalanceActions.getBalance()).toBe('93.00');
    backend('93.01');
    nextBuy.finalize();
    await polymarketBalanceActions.refresh(proxyWallet);
    expect(polymarketBalanceActions.getBalance()).toBe('93.01');
  });

  it('retains the estimate when the settlement balance read fails, then accepts a later read', async () => {
    const buy = apply('-5');
    mockBalance.mockRejectedValue(new Error('offline'));
    buy.finalize();
    await expect(polymarketBalanceActions.refresh(proxyWallet)).rejects.toThrow();
    expect(polymarketBalanceActions.getBalance()).toBe('95.00');
    backend('95.03');
    await refresh();
    expect(polymarketBalanceActions.getBalance()).toBe('95.03');
  });

  it.each(['cancelled', 'result-only'])('keeps the settled estimate when a %s RPC finishes without publishing', async mode => {
    const buy = apply('-5');
    mockBalance.mockRejectedValue(new Error('offline'));
    buy.finalize();
    await expect(polymarketBalanceActions.refresh(proxyWallet)).rejects.toThrow();

    backend('95.03');
    const block = Promise.withResolvers<number>();
    provider.getBlockNumber.mockReturnValueOnce(block.promise);

    const read = usePolymarketBalanceStore
      .getState()
      .fetch({ address: proxyWallet }, { force: true, skipStoreUpdates: mode === 'result-only' });
    if (mode === 'cancelled') {
      await usePolymarketBalanceStore.getState().fetch({ address: otherWallet }, { force: true, updateQueryKey: true });
      await read;
    }

    block.resolve(99);
    const expected = mode === 'cancelled' ? null : { pusdBalance: '95.030000', usdcBalance: '0.000000' };
    await expect(read).resolves.toEqual(expected);
    await setImmediate();

    apply('-2');
    expect(polymarketBalanceActions.getBalance(proxyWallet)).toBe('93.00');
  });

  it('releases unresolved estimates after the bounded conflict window', async () => {
    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const buy = apply('-5');
    vi.mocked(Date.now).mockReturnValue(now + 120_001);
    backend('99');
    await refresh();
    expect(polymarketBalanceActions.getBalance()).toBe('99.00');
    buy.apply('-7');
    buy.finalize('1');
    buy.discard();
    expect(polymarketBalanceActions.getBalance()).toBe('99.00');
  });

  it('does not invent a starting balance for an unhydrated account', () => {
    usePolymarketBalanceStore.setState({ queryCache: {} });
    apply('-5');
    expect(usePolymarketBalanceStore.getState().getData()).toBeNull();
  });
});
