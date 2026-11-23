import { createDerivedStore, createQueryStore } from '@storesjs/stores';

import { type SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import { type SolanaBalances } from '@/features/solana/core/balances';
import { useIsSolanaEnabled } from '@/features/solana/hooks/useIsSolanaEnabled';
import { getSolanaAccount, useAccountMetadataStore } from '@/features/wallet/data/stores/accountMetadataStore';
import { time } from '@/framework/core/utils/time';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { useWalletsStore } from '@/state/wallets/walletsStore';

import { fetchSolanaBalances } from './fetchSolanaBalances';

export const useSolanaBalancesAddress = createDerivedStore($ => {
  const enabled = $(useIsSolanaEnabled);
  const anvil = $(useConnectedToAnvilStore, state => state.connectedToAnvil);
  const state = $(useWalletsStore);
  $(useAccountMetadataStore, state => state.accounts);
  if (!enabled || anvil || !state.selected) return null;
  const wallet = state.wallets[state.selected.id];
  if (!state.walletReady || wallet?.type !== EthereumWalletType.mnemonic || wallet.damaged) return null;
  const account = wallet.addresses.find(item => item.address.toLowerCase() === state.accountAddress.toLowerCase());
  return account?.visible ? (getSolanaAccount(wallet.id, account.index)?.address ?? null) : null;
});

type Params = { address: string | null; currency: SupportedCurrencyKey };

export const useSolanaBalancesStore = createQueryStore<SolanaBalances | null, Params>({
  params: {
    address: $ => $(useSolanaBalancesAddress),
    currency: $ => $(userAssetsStoreManager).currency,
  },
  enabled: $ => !!$(useSolanaBalancesAddress),
  fetcher: (params, abortController) => {
    // Manual fetches must obey the same flag/account gate as automatic fetches.
    if (!params.address || params.address !== useSolanaBalancesAddress.getState()) return Promise.resolve(null);
    return fetchSolanaBalances(params.address, params.currency, abortController);
  },
  keepPreviousData: true,
  staleTime: time.seconds(30),
  cacheTime: time.minutes(10),
  retry: 2,
});

// Dependencies are unconditional; retain the query subscription across derived-state updates.
export const useSolanaWalletBalances = createDerivedStore(
  $ => {
    const address = $(useSolanaBalancesAddress);
    const currency = $(userAssetsStoreManager).currency;
    const data = $(useSolanaBalancesStore, state => state.getData());
    const isInitialLoad = $(useSolanaBalancesStore, state => state.getStatus('isInitialLoad'));
    // keepPreviousData preserves failed refreshes, but must never leak another account/currency.
    const current = address && data?.address === address && data.currency === currency ? data : null;
    return { data: current, isLoading: !!address && isInitialLoad, currency };
  },
  { lockDependencies: true }
);

export function refreshSolanaBalances() {
  if (!useSolanaBalancesAddress.getState()) return Promise.resolve(null);
  return useSolanaBalancesStore.getState().fetch(undefined, { force: true });
}
