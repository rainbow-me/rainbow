import { type createBaseStore } from '@storesjs/stores';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { type SolanaBalance, type SolanaBalances } from '@/features/solana/core/balances';
import { useIsSolanaEnabled } from '@/features/solana/hooks/useIsSolanaEnabled';
import { useAccountMetadataStore } from '@/features/wallet/data/stores/accountMetadataStore';
import { EncryptionType, type RainbowWallet } from '@/features/wallet/types';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { shallowEqual } from '@/worklets/comparisons';

import { fetchSolanaBalances } from './fetchSolanaBalances';
import {
  refreshSolanaBalances,
  selectSolanaBalance,
  selectSolanaBalanceIds,
  useSolanaBalancesAddress,
  useSolanaBalancesStore,
  useSolanaWalletBalances,
} from './solanaBalancesStore';

const controls = vi.hoisted(() => ({ storeInstall: false }));
vi.mock('@/env', () => ({
  IS_DEV: false,
  IS_TEST: true,
  IS_PROD: false,
  get IS_STORE_INSTALL() {
    return controls.storeInstall;
  },
}));
vi.mock('@/features/solana/hooks/useIsSolanaEnabled', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { useIsSolanaEnabled: createBaseStore(() => true) };
});
vi.mock('@/state/wallets/walletsStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { useWalletsStore: createBaseStore(() => ({ wallets: {}, selected: null, walletReady: false, accountAddress: '' })) };
});
vi.mock('./fetchSolanaBalances', () => ({ fetchSolanaBalances: vi.fn() }));

const evm = '0x0000000000000000000000000000000000000001';
const address = 'EXzw16qKGtrWTaTd5gGG29FWSUDrTEDheh5ber156MNS';
const wallet: RainbowWallet = {
  id: 'balances-test',
  type: EthereumWalletType.mnemonic,
  name: 'Test',
  color: 0,
  imported: true,
  primary: true,
  encryptionType: EncryptionType.keychain,
  addresses: [{ address: evm, index: 0, label: 'Test', avatar: null, color: 0, visible: true }],
};
const flags = useIsSolanaEnabled as unknown as ReturnType<typeof createBaseStore<boolean>>;
const data: SolanaBalances = { address, currency: 'USD', total: '1.25', balances: [] };
let unsubscribe: () => void;

beforeEach(() => {
  controls.storeInstall = false;
  flags.setState(true, true);
  userAssetsStoreManager.setState({ currency: 'USD' });
  useWalletsStore.setState({ wallets: { [wallet.id]: structuredClone(wallet) }, selected: wallet, walletReady: true, accountAddress: evm });
  useAccountMetadataStore.setState({
    accounts: {
      '["balances-test",0]': {
        walletId: wallet.id,
        index: 0,
        sourceEvmAddress: evm,
        namespace: 'solana',
        address,
        version: 1,
      },
    },
  });
  vi.mocked(fetchSolanaBalances).mockReset().mockResolvedValue(data);
  unsubscribe = useSolanaWalletBalances.subscribe(() => undefined);
});
afterEach(() => {
  unsubscribe();
});

describe('isolated Solana balances lifecycle', () => {
  it('fetches the enabled address, keeps failed refresh data, and does not turn failure into zero', async () => {
    await refreshSolanaBalances();
    expect(fetchSolanaBalances).toHaveBeenCalledWith(address, 'USD', expect.any(AbortController));
    expect(useSolanaWalletBalances.getState().data?.total).toBe('1.25');
    const callsBeforeFailure = vi.mocked(fetchSolanaBalances).mock.calls.length;
    vi.mocked(fetchSolanaBalances).mockRejectedValue(new Error('upstream failed'));
    await refreshSolanaBalances();
    expect(useSolanaWalletBalances.getState().data?.total).toBe('1.25');
    expect(useSolanaWalletBalances.getState().isLoading).toBe(false);
    expect(useSolanaBalancesStore.getState().status).toBe('error');
    expect(fetchSolanaBalances).toHaveBeenCalledTimes(callsBeforeFailure + 1);
  });
  it('reports initial loading and stops loading after an initial failure', async () => {
    let rejectRequest: (error: Error) => void = () => undefined;
    const pending = new Promise<SolanaBalances>((_, reject) => {
      rejectRequest = reject;
    });
    vi.mocked(fetchSolanaBalances).mockReturnValue(pending);
    useSolanaBalancesStore.setState({ queryCache: {}, lastFetchedAt: null });
    const request = refreshSolanaBalances();
    expect(useSolanaWalletBalances.getState().isLoading).toBe(true);
    expect(useSolanaWalletBalances.getState().data).toBeNull();
    rejectRequest(new Error('upstream failed'));
    await request;
    expect(useSolanaWalletBalances.getState().isLoading).toBe(false);
    expect(useSolanaWalletBalances.getState().data).toBeNull();
  });
  it('ignores an in-flight response after the selected account changes', async () => {
    let complete: (value: SolanaBalances) => void = () => undefined;
    vi.mocked(fetchSolanaBalances).mockImplementationOnce(
      () =>
        new Promise(resolve => {
          complete = resolve;
        })
    );
    const request = refreshSolanaBalances();
    await vi.waitFor(() => expect(fetchSolanaBalances).toHaveBeenCalled());
    useWalletsStore.setState({ accountAddress: '0x0000000000000000000000000000000000000002' });
    complete(data);
    await request;
    expect(useSolanaWalletBalances.getState().data).toBeNull();
  });
  it('hides old results immediately on account or currency changes', async () => {
    await refreshSolanaBalances();
    useWalletsStore.setState({ accountAddress: '0x0000000000000000000000000000000000000002' });
    expect(useSolanaBalancesAddress.getState()).toBeNull();
    expect(useSolanaWalletBalances.getState().data).toBeNull();
    useWalletsStore.setState({ accountAddress: evm });
    userAssetsStoreManager.setState({ currency: 'EUR' });
    expect(useSolanaWalletBalances.getState().data).toBeNull();
  });
  it('makes no requests while flag-off, even through manual fetch, and clears visible holdings', async () => {
    await refreshSolanaBalances();
    flags.setState(false, true);
    vi.mocked(fetchSolanaBalances).mockClear();
    await refreshSolanaBalances();
    await useSolanaBalancesStore.getState().fetch({ address, currency: 'USD' }, { force: true });
    expect(fetchSolanaBalances).not.toHaveBeenCalled();
    expect(useSolanaWalletBalances.getState().data).toBeNull();
    expect(useSolanaWalletBalances.getState().isLoading).toBe(false);
  });
  it('allows store installs only while the Solana flag is enabled', async () => {
    controls.storeInstall = true;
    useWalletsStore.setState({ wallets: { [wallet.id]: { ...wallet } } });
    expect(useSolanaBalancesAddress.getState()).toBe(address);
    await refreshSolanaBalances();
    expect(fetchSolanaBalances).toHaveBeenCalledWith(address, 'USD', expect.any(AbortController));
    flags.setState(false, true);
    vi.mocked(fetchSolanaBalances).mockClear();
    await refreshSolanaBalances();
    expect(fetchSolanaBalances).not.toHaveBeenCalled();
    expect(useSolanaBalancesAddress.getState()).toBeNull();
  });
  it('disables removed mappings and damaged wallets', async () => {
    useWalletsStore.setState({ wallets: { [wallet.id]: { ...wallet, damaged: true } } });
    expect(useSolanaBalancesAddress.getState()).toBeNull();
    useWalletsStore.setState({ wallets: { [wallet.id]: { ...wallet } } });
    useAccountMetadataStore.setState({ accounts: {} });
    expect(useSolanaBalancesAddress.getState()).toBeNull();
  });
});

it('notifies only the changed asset and updates list subscribers only for membership or order', async () => {
  await refreshSolanaBalances();
  const sol: SolanaBalance = { assetId: 'sol', name: 'Solana', symbol: 'SOL', amount: '1', rawUnits: false, value: '100' };
  const bonk: SolanaBalance = { assetId: 'bonk', name: 'Bonk', symbol: 'BONK', amount: '1000', rawUnits: false, value: '1' };
  async function publish(balances: SolanaBalance[]) {
    vi.mocked(fetchSolanaBalances).mockResolvedValue({ ...data, balances });
    await refreshSolanaBalances();
  }
  await publish([sol, bonk]);
  const listChanged = vi.fn();
  const solChanged = vi.fn();
  const bonkChanged = vi.fn();
  const stops = [
    useSolanaWalletBalances.subscribe(selectSolanaBalanceIds, listChanged, { equalityFn: shallowEqual }),
    useSolanaWalletBalances.subscribe(state => selectSolanaBalance(state, 'sol'), solChanged, { equalityFn: shallowEqual }),
    useSolanaWalletBalances.subscribe(state => selectSolanaBalance(state, 'bonk'), bonkChanged, { equalityFn: shallowEqual }),
  ];
  try {
    await publish([{ ...sol }, { ...bonk }]);
    expect(listChanged).not.toHaveBeenCalled();
    expect(solChanged).not.toHaveBeenCalled();
    expect(bonkChanged).not.toHaveBeenCalled();

    const updatedBonk = { ...bonk, amount: '2000', value: '2' };
    await publish([{ ...sol }, updatedBonk]);
    expect(listChanged).not.toHaveBeenCalled();
    expect(solChanged).not.toHaveBeenCalled();
    expect(bonkChanged).toHaveBeenCalledTimes(1);

    await publish([{ ...updatedBonk }, { ...sol }]);
    expect(listChanged).toHaveBeenCalledTimes(1);
    expect(solChanged).not.toHaveBeenCalled();
    expect(bonkChanged).toHaveBeenCalledTimes(1);

    await publish([{ ...sol }]);
    expect(listChanged).toHaveBeenCalledTimes(2);
    expect(solChanged).not.toHaveBeenCalled();
    expect(bonkChanged).toHaveBeenLastCalledWith(undefined, updatedBonk);

    flags.setState(false, true);
    expect(selectSolanaBalanceIds(useSolanaWalletBalances.getState())).toEqual([]);
    await vi.waitFor(() => expect(solChanged).toHaveBeenLastCalledWith(undefined, sol));
  } finally {
    stops.forEach(stop => stop());
  }
});
