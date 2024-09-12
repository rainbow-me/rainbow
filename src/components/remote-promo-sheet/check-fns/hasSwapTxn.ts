import type { EthereumAddress, RainbowTransaction } from '@/entities';
import { SUPPORTED_MAINNET_CHAIN_IDS } from '@/chains';
import { queryClient } from '@/react-query/queryClient';
import store from '@/redux/store';
import { consolidatedTransactionsQueryKey } from '@/resources/transactions/consolidatedTransactions';
import { PaginatedTransactions } from '@/resources/transactions/transaction';

// Rainbow Router
const RAINBOW_ROUTER_ADDRESS: EthereumAddress = '0x00000000009726632680fb29d3f7a9734e3010e2';

const isSwapTx = (tx: RainbowTransaction): boolean => tx.to?.toLowerCase() === RAINBOW_ROUTER_ADDRESS;

export const hasSwapTxn = async (): Promise<boolean> => {
  const { accountAddress, nativeCurrency } = store.getState().settings;

  const paginatedTransactionsKey = consolidatedTransactionsQueryKey({
    address: accountAddress,
    currency: nativeCurrency,
    chainIds: SUPPORTED_MAINNET_CHAIN_IDS,
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
