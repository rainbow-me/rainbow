import type { EthereumAddress, RainbowTransaction } from '@/entities';
import { queryClient } from '@/react-query/queryClient';
import { consolidatedTransactionsQueryKey } from '@/resources/transactions/consolidatedTransactions';
import { PaginatedTransactions } from '@/resources/transactions/transaction';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getAccountAddress } from '@/state/wallets/walletsStore';
import { settingsStore } from '@/state/settings/settingsStore';

// Rainbow Router
const RAINBOW_ROUTER_ADDRESS: EthereumAddress = '0x00000000009726632680fb29d3f7a9734e3010e2';

const isSwapTx = (tx: RainbowTransaction): boolean => tx.to?.toLowerCase() === RAINBOW_ROUTER_ADDRESS;

export const hasSwapTxn = async (): Promise<boolean> => {
  const accountAddress = getAccountAddress();
  const nativeCurrency = settingsStore.getState().nativeCurrency;

  const paginatedTransactionsKey = consolidatedTransactionsQueryKey({
    address: accountAddress,
    currency: nativeCurrency,
    chainIds: useBackendNetworksStore.getState().getSupportedMainnetChainIds(),
  });
  const queryData = queryClient.getQueryData<PaginatedTransactions>(paginatedTransactionsKey);
  const pages = queryData?.pages || [];

  if (!pages) return false;
  for (const page of pages) {
    const tx = page.transactions.find(isSwapTx);
    if (tx) {
      return true;
    }
  }

  return false;
};
