import { createQueryStore, shallowEqual, type SetDataParams } from '@storesjs/stores';
import { type Address } from 'viem';

import type { NativeCurrencyKey } from '@/features/currency/types';
import { getVisibleWalletAddresses } from '@/features/wallet/utils/visibleWalletAddresses';
import { time } from '@/framework/core/utils/time';
import { getAddysHttpClient } from '@/resources/addys/client';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useWalletsStore } from '@/state/wallets/walletsStore';

// Each address in a /summary request costs a backend balances lookup, so only the selected
// address follows the store's staleTime; the rest are requested once their entry is this old.
const OWNED_ADDRESS_MAX_AGE = time.hours(1);
const WATCHED_ADDRESS_MAX_AGE = time.days(1);

type WalletSummaryBalance = {
  assetValue: number | null;
  positionsValue: number | null;
  claimablesValue: number | null;
  transactions: number;
};

type WalletSummaryEntry = {
  /** When the last successful request including this address was sent. */
  fetchedAt: number;
  /** `null` when no response has returned this address yet. */
  balance: WalletSummaryBalance | null;
};

/** Keyed by lowercase address. */
export type WalletSummaryEntries = Record<string, WalletSummaryEntry>;

export type WalletSummaryArgs = {
  currency: NativeCurrencyKey;
  selectedAddress: string | null;
  ownedAddresses: string[];
  watchedAddresses: string[];
};

type FetchedWalletSummary = {
  requestedAt: number;
  requestedAddresses: string[];
  addresses: WalletSummaryResponse['data']['addresses'];
};

type WalletSummaryState = {
  entries: Partial<Record<NativeCurrencyKey, WalletSummaryEntries>>;
};

/** Whether every given address has been included in a successful request for this currency. */
export function hasFetchedAddresses(entries: WalletSummaryEntries | undefined, addresses: string[]): boolean {
  return addresses.every(address => entries?.[address] !== undefined);
}

function selectAddressesToFetch(entries: WalletSummaryEntries | undefined, params: WalletSummaryArgs, now: number): string[] {
  // An address no response has returned yet stays due, so its row doesn't wait a full max age to show a balance.
  const isDue = (address: string, maxAge: number) => {
    const entry = entries?.[address];
    if (!entry?.balance) return true;
    const age = now - entry.fetchedAt;
    return age < 0 || age >= maxAge;
  };

  const addresses = new Set<string>();
  if (params.selectedAddress) addresses.add(params.selectedAddress);
  for (const address of params.ownedAddresses) if (isDue(address, OWNED_ADDRESS_MAX_AGE)) addresses.add(address);
  for (const address of params.watchedAddresses) if (isDue(address, WATCHED_ADDRESS_MAX_AGE)) addresses.add(address);

  return [...addresses];
}

async function fetchWalletSummary(params: WalletSummaryArgs, abortController: AbortController | null): Promise<FetchedWalletSummary> {
  const requestedAt = Date.now();
  const requestedAddresses = selectAddressesToFetch(useWalletSummaryQueryStore.getState().entries[params.currency], params, requestedAt);
  if (!requestedAddresses.length) return { requestedAt, requestedAddresses, addresses: {} };

  const { data } = await getAddysHttpClient().post<WalletSummaryResponse>(
    `/summary`,
    JSON.stringify({
      currency: params.currency,
      addresses: requestedAddresses,
      enableThirdParty: true,
    }),
    { signal: abortController?.signal }
  );

  return { requestedAt, requestedAddresses, addresses: data.data.addresses };
}

function setWalletSummary({ data, params, set }: SetDataParams<FetchedWalletSummary, WalletSummaryArgs, WalletSummaryState>): void {
  set(state => {
    // Removing a wallet that shares a secret phrase with others only hides its account, so prune against visible accounts.
    const { accountAddress, wallets } = useWalletsStore.getState();
    const { owned, watched } = getVisibleWalletAddresses(wallets);
    const walletAddresses = new Set([...owned, ...watched, accountAddress.toLowerCase()]);
    const entries: WalletSummaryState['entries'] = {};

    for (const [currency, currencyEntries] of Object.entries(state.entries) as [NativeCurrencyKey, WalletSummaryEntries][]) {
      entries[currency] = Object.fromEntries(Object.entries(currencyEntries).filter(([address]) => walletAddresses.has(address)));
    }

    const currencyEntries = { ...entries[params.currency] };
    for (const address of data.requestedAddresses) {
      if (!walletAddresses.has(address)) continue;
      const result = data.addresses[address as Address];
      currencyEntries[address] = {
        fetchedAt: data.requestedAt,
        balance: result ? toWalletSummaryBalance(result) : (currencyEntries[address]?.balance ?? null),
      };
    }
    entries[params.currency] = currencyEntries;

    return { entries };
  });
}

function toWalletSummaryBalance({ meta, summary }: WalletSummaryResponseAddress): WalletSummaryBalance {
  return {
    assetValue: summary.asset_value,
    positionsValue: summary.positions_value,
    claimablesValue: summary.claimables_value,
    transactions: meta.rainbow?.transactions ?? 0,
  };
}

export const useWalletSummaryEntries = (): WalletSummaryEntries | undefined => {
  const currency = userAssetsStoreManager(state => state.currency);
  return useWalletSummaryQueryStore(state => state.entries[currency]);
};

export const refetchWalletSummary = () => {
  return useWalletSummaryQueryStore.getState().fetch(undefined, { force: true });
};

export const useWalletSummaryQueryStore = createQueryStore<FetchedWalletSummary, WalletSummaryArgs, WalletSummaryState>(
  {
    fetcher: fetchWalletSummary,
    setData: setWalletSummary,
    params: {
      currency: $ => $(userAssetsStoreManager).currency,
      selectedAddress: $ => $(useWalletsStore, state => state.accountAddress?.toLowerCase() || null),
      ownedAddresses: $ => $(useWalletsStore, state => getVisibleWalletAddresses(state.wallets).owned, shallowEqual),
      watchedAddresses: $ => $(useWalletsStore, state => getVisibleWalletAddresses(state.wallets).watched, shallowEqual),
    },
    cacheTime: time.zero,
    keepPreviousData: true,
    retry: 10,
    staleTime: time.minutes(2),
  },

  () => ({ entries: {} }),

  {
    storageKey: 'walletSummaryStore',
    version: 1,
    migrate: () => ({ entries: {} }),
  }
);

type WalletSummaryResponseAddress = {
  meta: {
    rainbow?: {
      transactions: number;
    };
  };
  summary: {
    asset_value: number | null;
    claimables_value: number | null;
    positions_value: number | null;
  };
};

type WalletSummaryResponse = {
  data: {
    addresses: Partial<Record<Address, WalletSummaryResponseAddress>>;
  };
};
