import { RainbowTransaction } from '@/entities';
import { useConsolidatedTransactions } from '@/resources/transactions/consolidatedTransactions';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { pendingTransactionsStore, usePendingTransactionsStore } from '@/state/pendingTransactions';
import { getSortedWalletConnectRequests } from '@/state/walletConnectRequests';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme';
import { useEffect, useMemo } from 'react';
import { buildTransactionsSections } from '../helpers/buildTransactionsSectionsSelector';
import useContacts from './useContacts';

export const NOE_PAGE = 30;

export default function useAccountTransactions() {
  const accountState = useLatestAccountTransactions();
  const { hasNextPage, isLoading, fetchNextPage, transactions } = accountState;

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
    transactions: transactions,
    transactionsCount: transactions.length,
  };
}

export const useLatestAccountTransactions = () => {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const accountAddress = useAccountAddress();

  const pendingTransactionsMostRecentFirst = usePendingTransactionsStore(state =>
    state.getPendingTransactionsInReverseOrder(accountAddress)
  );

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
      .filter(t => t.from?.toLowerCase() === accountAddress?.toLowerCase() && !t.isMocked)
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
    // if you don't do this it updates constantly
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify([pendingTransactionsMostRecentFirst, transactions])]
  );

  const { contacts } = useContacts();
  const theme = useTheme();

  return {
    accountAddress,
    contacts,
    requests: walletConnectRequests,
    theme,
    transactions: allTransactions,
    nativeCurrency,
    isLoading,
    fetchNextPage,
    hasNextPage,
  };
};
