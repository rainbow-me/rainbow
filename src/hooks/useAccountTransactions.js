import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { buildTransactionsSectionsSelector } from '../helpers/buildTransactionsSectionsSelector';
import NetworkTypes from '../helpers/networkTypes';
import useAccountSettings from './useAccountSettings';
import useContacts from './useContacts';
import useRequests from './useRequests';
import { transactionPressBuilder } from '@rainbow-me/helpers/transactionPressHandler';
import { useNavigation } from '@rainbow-me/navigation';
import { useTheme } from '@rainbow-me/theme';

export const NOE_PAGE = 30;

export default function useAccountTransactions(initialized, isFocused) {
  const {
    accountAssetsData,
    isLoadingTransactions,
    network,
    pendingTransactions,
    transactions,
  } = useSelector(
    ({
      data: {
        isLoadingTransactions,
        pendingTransactions,
        transactions,
        accountAssetsData,
      },
      settings: { network },
    }) => ({
      accountAssetsData,
      isLoadingTransactions,
      network,
      pendingTransactions,
      transactions,
    })
  );

  const allTransactions = pendingTransactions.concat(transactions);
  const [page, setPage] = useState(1);
  const nextPage = useCallback(() => setPage(page => page + 1), []);

  const slicedTransaction = useMemo(
    () => allTransactions.slice(0, page * NOE_PAGE),
    [allTransactions, page]
  );

  const transactionsCount = useMemo(() => {
    return slicedTransaction.length;
  }, [slicedTransaction]);

  const { contacts } = useContacts();
  const { requests } = useRequests();
  const { accountAddress } = useAccountSettings();
  const theme = useTheme();
  const { navigate } = useNavigation();
  const onTransactionPress = useCallback(transactionPressBuilder(navigate), [
    navigate,
  ]);

  const accountState = {
    accountAddress,
    accountAssetsData,
    contacts,
    initialized,
    isFocused,
    onTransactionPress,
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
    nextPage,
    remainingItemsLabel,
    sections,
    transactions: ios ? allTransactions : slicedTransaction,
    transactionsCount,
  };
}
