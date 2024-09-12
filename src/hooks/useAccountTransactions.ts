import { useEffect, useMemo } from 'react';
import { buildTransactionsSections } from '../helpers/buildTransactionsSectionsSelector';
import useAccountSettings from './useAccountSettings';
import useContacts from './useContacts';
import useRequests from './useRequests';
import { useNavigation } from '@/navigation';
import { useTheme } from '@/theme';
import { useConsolidatedTransactions } from '@/resources/transactions/consolidatedTransactions';
import { RainbowTransaction } from '@/entities';
import { pendingTransactionsStore, usePendingTransactionsStore } from '@/state/pendingTransactions';
import { nonceStore } from '@/state/nonces';
import { ChainId } from '@/chains/types';
import { SUPPORTED_CHAIN_IDS, SUPPORTED_MAINNET_CHAIN_IDS } from '@/chains';

export const NOE_PAGE = 30;

export default function useAccountTransactions() {
  const { accountAddress, nativeCurrency } = useAccountSettings();

  const pendingTransactions = usePendingTransactionsStore(state => state.pendingTransactions[accountAddress] || []);

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
        new Map(SUPPORTED_CHAIN_IDS.map(chainId => [chainId, null as RainbowTransaction | null]))
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
    const { setNonce } = nonceStore.getState();
    const { setPendingTransactions, pendingTransactions: storePendingTransactions } = pendingTransactionsStore.getState();
    const pendingTransactions = storePendingTransactions[currentAddress] || [];
    for (const chainId of SUPPORTED_MAINNET_CHAIN_IDS) {
      const latestTxConfirmedByBackend = latestTransactions.get(chainId);
      if (latestTxConfirmedByBackend) {
        const latestNonceConfirmedByBackend = latestTxConfirmedByBackend.nonce || 0;
        const [latestPendingTx] = pendingTransactions.filter(tx => tx?.chainId === chainId);

        let currentNonce;
        if (latestPendingTx) {
          const latestPendingNonce = latestPendingTx?.nonce || 0;
          const latestTransactionIsPending = latestPendingNonce > latestNonceConfirmedByBackend;
          currentNonce = latestTransactionIsPending ? latestPendingNonce : latestNonceConfirmedByBackend;
        } else {
          currentNonce = latestNonceConfirmedByBackend;
        }

        setNonce({
          address: currentAddress,
          chainId: chainId,
          currentNonce,
          latestConfirmedNonce: latestNonceConfirmedByBackend,
        });
      }
    }

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

  const allTransactions = useMemo(() => pendingTransactions.concat(transactions), [pendingTransactions, transactions]);

  const slicedTransaction = useMemo(() => allTransactions, [allTransactions]);

  const { contacts } = useContacts();
  const { requests } = useRequests();
  const theme = useTheme();
  const { navigate } = useNavigation();

  const accountState = {
    accountAddress,
    contacts,
    navigate,
    requests,
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
