import { useMemo } from 'react';

import { type RainbowTransaction } from '@/entities/transactions';
import { useConsolidatedTransactions } from '@/resources/transactions/consolidatedTransactions';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { useAccountAddress } from '@/state/wallets/walletsStore';

import { buildTransactionsSections } from '../helpers/buildTransactionsSections';
import useContacts from './useContacts';

export const NOE_PAGE = 30;

const EMPTY_TRANSACTIONS: RainbowTransaction[] = [];

export default function useAccountTransactions() {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const accountAddress = useAccountAddress();

  const transactionOverlaysMostRecentFirst = usePendingTransactionsStore(state => state.getTransactionsInReverseOrder(accountAddress));

  const { data, isLoading, fetchNextPage, hasNextPage } = useConsolidatedTransactions({
    address: accountAddress,
    currency: nativeCurrency,
  });

  const pages = data?.pages;
  const backendTransactions: RainbowTransaction[] = useMemo(() => pages?.flatMap(page => page.transactions) || EMPTY_TRANSACTIONS, [pages]);

  const transactions = useMemo(
    () =>
      transactionOverlaysMostRecentFirst
        .filter(overlayTx => !backendTransactions.some(tx => tx.hash === overlayTx.hash && tx.chainId === overlayTx.chainId))
        .concat(backendTransactions),
    [backendTransactions, transactionOverlaysMostRecentFirst]
  );

  const { contacts } = useContacts();
  const sections = buildTransactionsSections({ contacts, transactions });

  return {
    isLoadingTransactions: isLoading,
    nextPage: fetchNextPage,
    remainingItemsLabel: hasNextPage ? `Show ${NOE_PAGE} more transactions...` : null,
    sections,
    transactions,
    transactionsCount: transactions.length,
  };
}
