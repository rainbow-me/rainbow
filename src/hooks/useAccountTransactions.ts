import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { buildTransactionsSectionsSelector } from '../helpers/buildTransactionsSectionsSelector';
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

export const NOE_PAGE = 30;

export default function useAccountTransactions(
  initialized: boolean,
  isFocused: boolean
) {
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

  const { isLoadingTransactions, network, pendingTransactions } = useSelector(
    ({
      data: { isLoadingTransactions, pendingTransactions, transactions },
      settings: { network },
    }: AppState) => ({
      isLoadingTransactions,
      network,
      pendingTransactions,
      transactions,
    })
  );

  const { data, fetchNextPage } = useConsolidatedTransactions({
    address: accountAddress,
    currency: nativeCurrency,
  });
  const pages = data?.pages;

  const transactions: RainbowTransaction[] = useMemo(
    () => pages?.flatMap(p => p.transactions) || [],
    [pages]
  );
  console.log({ transactions });

  const allTransactions = useMemo(
    () => pendingTransactions.concat(transactions),
    [pendingTransactions, transactions]
  );

  const slicedTransaction: any[] = useMemo(() => allTransactions, [
    allTransactions,
  ]);

  const mainnetAddresses = useMemo(
    () =>
      userAssets
        ? slicedTransaction.reduce((acc, txn) => {
            acc[`${txn.address}_${txn.network}`] =
              userAssets[`${txn.address}_${txn.network}`]?.mainnet_address;

            return acc;
          }, {})
        : [],
    [userAssets, slicedTransaction]
  );

  const { contacts } = useContacts();
  const { requests } = useRequests();
  const theme = useTheme();
  const { navigate } = useNavigation();

  const accountState = {
    accountAddress,
    contacts,
    initialized,
    isFocused,
    mainnetAddresses,
    navigate,
    requests,
    theme,
    transactions: slicedTransaction,
  };

  const { sections } = buildTransactionsSectionsSelector(accountState);

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
    isLoadingTransactions:
      network === NetworkTypes.mainnet ? isLoadingTransactions : false,
    nextPage: fetchNextPage,
    remainingItemsLabel,
    sections,
    transactions: ios ? allTransactions : slicedTransaction,
    transactionsCount: slicedTransaction.length,
  };
}
