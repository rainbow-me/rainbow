import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { buildTransactionsSections } from '../helpers/buildTransactionsSectionsSelector';
import NetworkTypes from '../helpers/networkTypes';
import useAccountSettings from './useAccountSettings';
import useContacts from './useContacts';
import useRequests from './useRequests';
import { useNavigation } from '@/navigation';
import { AppState } from '@/redux/store';
import { useTheme } from '@/theme';
import { getCachedProviderForNetwork, isHardHat } from '@/handlers/web3';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';
import { useConsolidatedTransactions } from '@/resources/transactions/consolidatedTransactions';
import { RainbowTransaction } from '@/entities';
import { usePendingTransactionsStore } from '@/state/pendingTransactionsStore';

export const NOE_PAGE = 30;

export default function useAccountTransactions() {
  const {
    network: currentNetwork,
    accountAddress,
    nativeCurrency,
  } = useAccountSettings();
  const provider = getCachedProviderForNetwork(currentNetwork);
  const providerUrl = provider?.connection?.url;
  const connectedToHardhat = isHardHat(providerUrl);
  const { data: userAssets } = useUserAssets({
    address: accountAddress,
    currency: nativeCurrency,
    connectedToHardhat,
  });

  const { pendingTransactions: storePendingTransactions } =
    usePendingTransactionsStore();

  const pendingTransactions = useMemo(() => {
    const txs = storePendingTransactions[accountAddress] || [];
    console.log('PENDING: ', txs);
    return txs;
  }, [accountAddress, storePendingTransactions]);

  const { data, fetchNextPage } = useConsolidatedTransactions({
    address: accountAddress,
    currency: nativeCurrency,
  });
  const pages = data?.pages;

  const transactions: RainbowTransaction[] = useMemo(
    () => pages?.flatMap(p => p.transactions) || [],
    [pages]
  );

  const allTransactions = useMemo(
    () => pendingTransactions.concat(transactions),
    [pendingTransactions, transactions]
  );

  const slicedTransaction = useMemo(() => allTransactions, [allTransactions]);

  const mainnetAddresses = useMemo(
    () =>
      userAssets
        ? slicedTransaction.reduce(
            (acc: { [key: string]: string }, txn: RainbowTransaction) => {
              if (txn?.network && txn?.address) {
                const asset =
                  userAssets[`${txn.address}_${txn.network}`]?.mainnet_address;
                if (asset) {
                  acc[`${txn.address}_${txn.network}`] = asset;
                }
              }

              return acc;
            },
            {}
          )
        : {},
    [userAssets, slicedTransaction]
  );

  const { contacts } = useContacts();
  const { requests } = useRequests();
  const theme = useTheme();
  const { navigate } = useNavigation();

  const accountState = {
    accountAddress,
    contacts,
    mainnetAddresses,
    navigate,
    requests,
    theme,
    transactions: slicedTransaction,
  };

  const { sections } = buildTransactionsSections(accountState);

  const remainingItemsLabel = useMemo(() => {
    const remainingLength = allTransactions.length - slicedTransaction.length;
    if (remainingLength === 0) {
      return null;
    }
    if (remainingLength <= NOE_PAGE) {
      return `Show last ${remainingLength} transactions.`;
    }
    return `Show ${NOE_PAGE} more transactions...`;
  }, [slicedTransaction.length, allTransactions.length]);

  return {
    isLoadingTransactions: !!allTransactions,
    nextPage: fetchNextPage,
    remainingItemsLabel,
    sections,
    transactions: ios ? allTransactions : slicedTransaction,
    transactionsCount: slicedTransaction.length,
  };
}
