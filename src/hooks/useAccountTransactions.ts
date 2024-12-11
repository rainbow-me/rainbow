import { useEffect, useMemo } from 'react';
import { buildTransactionsSections } from '../helpers/buildTransactionsSectionsSelector';
import useAccountSettings from './useAccountSettings';
import useContacts from './useContacts';
import { useNavigation } from '@/navigation';
import { useTheme } from '@/theme';
import { useConsolidatedTransactions } from '@/resources/transactions/consolidatedTransactions';
import { RainbowTransaction } from '@/entities';
import { pendingTransactionsStore } from '@/state/pendingTransactions';
import { getSortedWalletConnectRequests } from '@/state/walletConnectRequests';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

export const NOE_PAGE = 30;

export default function useAccountTransactions() {
  const { accountAddress, nativeCurrency } = useAccountSettings();

  const { getPendingTransactionsInReverseOrder } = pendingTransactionsStore.getState();
  const pendingTransactionsMostRecentFirst = getPendingTransactionsInReverseOrder(accountAddress);
  const walletConnectRequests = getSortedWalletConnectRequests();

  const { data, isLoading, fetchNextPage, hasNextPage } = useConsolidatedTransactions({
    address: accountAddress,
    currency: nativeCurrency,
  });

  const pages = data?.pages;

  useEffect(() => {
    if (!data?.pages) return;
    const latestTransactions = data.pages
      .map(p => p.transactions)
      .flat()
      .filter(t => t.from?.toLowerCase() === accountAddress?.toLowerCase())
      .reduce(
        (latestTxMap, currentTx) => {
          const currentChainId = currentTx?.chainId;
          if (currentChainId) {
            const latestTx = latestTxMap.get(currentChainId);
            if (!latestTx) {
              latestTxMap.set(currentChainId, currentTx);
            }
          }
          return latestTxMap;
        },
        new Map(
          useBackendNetworksStore
            .getState()
            .getSupportedChainIds()
            .map(chainId => [chainId, null as RainbowTransaction | null])
        )
      );
    watchForPendingTransactionsReportedByRainbowBackend({
      currentAddress: accountAddress,
      latestTransactions,
    });
  }, [accountAddress, data?.pages]);

  function watchForPendingTransactionsReportedByRainbowBackend({
    currentAddress,
    latestTransactions,
  }: {
    currentAddress: string;
    latestTransactions: Map<ChainId, RainbowTransaction | null>;
  }) {
    const { setPendingTransactions, pendingTransactions: storePendingTransactions } = pendingTransactionsStore.getState();
    const pendingTransactions = storePendingTransactions[currentAddress] || [];

    const updatedPendingTransactions = pendingTransactions?.filter(tx => {
      const txNonce = tx.nonce || 0;
      const latestTx = latestTransactions.get(tx.chainId);
      const latestTxNonce = latestTx?.nonce || 0;
      // still pending or backend is not returning confirmation yet
      // if !latestTx means that is the first tx of the wallet
      return !latestTx || txNonce > latestTxNonce;
    });

    setPendingTransactions({
      address: currentAddress,
      pendingTransactions: updatedPendingTransactions,
    });
  }

  const transactions: RainbowTransaction[] = useMemo(() => pages?.flatMap(p => p.transactions) || [], [pages]);

  const allTransactions = useMemo(
    () => pendingTransactionsMostRecentFirst.concat(transactions),
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
