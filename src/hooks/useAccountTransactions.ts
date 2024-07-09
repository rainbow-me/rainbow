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
import { RainbowNetworks } from '@/networks';
import { Network } from '@/networks/types';
import { nonceStore } from '@/state/nonces';

export const NOE_PAGE = 30;

export default function useAccountTransactions() {
  const { accountAddress, nativeCurrency } = useAccountSettings();

  const pendingTransactions = usePendingTransactionsStore(state => state.pendingTransactions[accountAddress] || []);

  const { data, fetchNextPage, hasNextPage } = useConsolidatedTransactions({
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
          const currentNetwork = currentTx?.network;
          if (currentNetwork) {
            const latestTx = latestTxMap.get(currentNetwork);
            if (!latestTx) {
              latestTxMap.set(currentNetwork, currentTx);
            }
          }
          return latestTxMap;
        },
        new Map(RainbowNetworks.map(chain => [chain.value, null as RainbowTransaction | null]))
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
    latestTransactions: Map<Network, RainbowTransaction | null>;
  }) {
    const { setNonce } = nonceStore.getState();
    const { setPendingTransactions, pendingTransactions: storePendingTransactions } = pendingTransactionsStore.getState();
    const pendingTransactions = storePendingTransactions[currentAddress] || [];
    const networks = RainbowNetworks.filter(({ enabled, networkType }) => enabled && networkType !== 'testnet');
    for (const network of networks) {
      const latestTxConfirmedByBackend = latestTransactions.get(network.value);
      if (latestTxConfirmedByBackend) {
        const latestNonceConfirmedByBackend = latestTxConfirmedByBackend.nonce || 0;
        const [latestPendingTx] = pendingTransactions.filter(tx => tx?.network === network.value);

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
          network: network.value,
          currentNonce,
          latestConfirmedNonce: latestNonceConfirmedByBackend,
        });
      }
    }

    const updatedPendingTransactions = pendingTransactions?.filter(tx => {
      const txNonce = tx.nonce || 0;
      const latestTx = latestTransactions.get(tx.network);
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
    isLoadingTransactions: !!allTransactions,
    nextPage: fetchNextPage,
    remainingItemsLabel,
    sections,
    transactions: ios ? allTransactions : slicedTransaction,
    transactionsCount: slicedTransaction.length,
  };
}
