import { useMemo } from 'react';
import { buildTransactionsSections } from '../helpers/buildTransactionsSectionsSelector';
import useAccountSettings from './useAccountSettings';
import useContacts from './useContacts';
import useRequests from './useRequests';
import { useNavigation } from '@/navigation';
import { useTheme } from '@/theme';
import { getCachedProviderForNetwork, isHardHat } from '@/handlers/web3';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';
import { useConsolidatedTransactions } from '@/resources/transactions/consolidatedTransactions';
import { RainbowTransaction } from '@/entities';
import { usePendingTransactionsStore } from '@/state/pendingTransactions';

export const NOE_PAGE = 30;

export default function useAccountTransactions() {
  const { network: currentNetwork, accountAddress, nativeCurrency } = useAccountSettings();
  const provider = getCachedProviderForNetwork(currentNetwork);
  const providerUrl = provider?.connection?.url;
  const connectedToHardhat = isHardHat(providerUrl);
  const { data: userAssets } = useUserAssets({
    address: accountAddress,
    currency: nativeCurrency,
    connectedToHardhat,
  });

  const { pendingTransactions: storePendingTransactions } = usePendingTransactionsStore();

  const pendingTransactions = useMemo(() => {
    const txs = storePendingTransactions[accountAddress] || [];
    return txs;
  }, [accountAddress, storePendingTransactions]);

  const { data, fetchNextPage, hasNextPage } = useConsolidatedTransactions({
    address: accountAddress,
    currency: nativeCurrency,
  });

  const pages = data?.pages;

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
    console.log({ hasNextPage });
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
