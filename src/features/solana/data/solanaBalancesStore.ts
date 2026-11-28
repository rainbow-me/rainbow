import { createDerivedStore, createQueryStore } from '@storesjs/stores';

import { type SupportedCurrencyKey } from '@/features/currency/supportedCurrencies';
import { type SolanaBalance, type SolanaBalances } from '@/features/solana/core/balances';
import { useIsSolanaEnabled } from '@/features/solana/hooks/useIsSolanaEnabled';
import { getSolanaAccount, useAccountMetadataStore } from '@/features/wallet/data/stores/accountMetadataStore';
import { time } from '@/framework/core/utils/time';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { deepEqual } from '@/worklets/comparisons';

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

export type SolanaBalancesData = Omit<SolanaBalances, 'balances'> & {
  balances: Map<string, SolanaBalance>;
  orderedBalances: Pick<SolanaBalance, 'uniqueId' | 'value'>[];
};

type SolanaBalancesState = {
  balancesByAddress: Record<string, SolanaBalancesData>;
};

export const useSolanaBalancesStore = createQueryStore<
  SolanaBalances | null,
  Params,
  SolanaBalancesState,
  SolanaBalancesData | null,
  SolanaBalancesState
>(
  {
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
    transform: data => {
      if (!data) return null;
      return {
        ...data,
        balances: new Map(data.balances.map(balance => [balance.uniqueId, balance])),
        orderedBalances: data.balances.map(({ uniqueId, value }) => ({ uniqueId, value })),
      };
    },
    setData: ({ data, set }) => {
      if (data) set(state => ({ balancesByAddress: { ...state.balancesByAddress, [data.address]: data } }));
    },
    keepPreviousData: true,
    staleTime: time.minutes(1),
    retry: 2,
  },
  () => ({ balancesByAddress: {} }),
  {
    partialize: state => ({ balancesByAddress: state.balancesByAddress }),
    storageKey: 'solanaBalances',
    version: 1,
  }
);

export const useSolanaWalletBalances = createDerivedStore($ => {
  const address = $(useSolanaBalancesAddress);
  const currency = $(userAssetsStoreManager).currency;
  const data = $(useSolanaBalancesStore, state => (address ? state.balancesByAddress[address] : undefined));
  const isInitialLoad = $(useSolanaBalancesStore, state => state.getStatus('isInitialLoad'));
  // Persisted balances remain visible during refreshes, but must match the current account/currency.
  const current = address && data?.address === address && data.currency === currency ? data : null;
  return { data: current, isLoading: !!address && isInitialLoad, currency };
});

export const useSolanaBalanceList = createDerivedStore<Pick<SolanaBalance, 'uniqueId' | 'value'>[]>(
  $ => $(useSolanaWalletBalances, state => state.data?.orderedBalances) ?? [],
  { equalityFn: deepEqual, lockDependencies: true }
);

export function selectSolanaBalance(state: ReturnType<typeof useSolanaWalletBalances.getState>, uniqueId: string) {
  return state.data?.balances.get(uniqueId);
}
