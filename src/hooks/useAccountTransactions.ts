import { useMemo } from 'react';
import { RainbowTransaction } from '@/entities';
import { useNavigation } from '@/navigation';
import { useConsolidatedTransactions } from '@/resources/transactions/consolidatedTransactions';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';
import { getSortedWalletConnectRequests } from '@/state/walletConnectRequests';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme';
import { shallowEqual } from '@/worklets/comparisons';
import { buildTransactionsSections } from '../helpers/buildTransactionsSectionsSelector';
import useContacts from './useContacts';

export const NOE_PAGE = 30;

export default function useAccountTransactions() {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const accountAddress = useAccountAddress();

  const pendingTransactionsMostRecentFirst = usePendingTransactionsStore(
    state => state.getPendingTransactionsInReverseOrder(accountAddress),
    shallowEqual
  );

  const walletConnectRequests = getSortedWalletConnectRequests();

  const { data, isLoading, fetchNextPage, hasNextPage } = useConsolidatedTransactions({
    address: accountAddress,
    currency: nativeCurrency,
  });

  const pages = data?.pages;

  const transactions: RainbowTransaction[] = useMemo(() => pages?.flatMap(p => p.transactions) || [], [pages]);

  const allTransactions = useMemo(
    () =>
      pendingTransactionsMostRecentFirst
        .filter(pendingTx => !transactions.some(tx => tx.hash === pendingTx.hash && tx.chainId === pendingTx.chainId))
        .concat(transactions),
    [pendingTransactionsMostRecentFirst, transactions]
  );

  const slicedTransaction = useMemo(() => allTransactions, [allTransactions]);

  const { contacts } = useContacts();
  const theme = useTheme();
  const { navigate } = useNavigation();

  const accountState = {
    accountAddress,
    contacts,
    navigate,
    requests: walletConnectRequests,
    theme,
    transactions: slicedTransaction,
    nativeCurrency,
  };

  const { sections } = buildTransactionsSections(accountState);

  const remainingItemsLabel = useMemo(() => {
    if (!hasNextPage) {
      return null;
    }
    return `Show ${NOE_PAGE} more transactions...`;
  }, [hasNextPage]);

  return {
    isLoadingTransactions: isLoading,
    nextPage: fetchNextPage,
    remainingItemsLabel,
    sections,
    transactions: ios ? allTransactions : slicedTransaction,
    transactionsCount: slicedTransaction.length,
  };
}
