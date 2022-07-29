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

export default function useAccountTransactions(
  initialized: any,
  isFocused: any
) {
  const {
    accountAssetsData,
    isLoadingTransactions,
    network,
    pendingTransactions,
    transactions,
  } = useSelector(
    ({
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
      data: {
        isLoadingTransactions,
        pendingTransactions,
        transactions,
        accountAssetsData,
      },
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'settings' does not exist on type 'Defaul... Remove this comment to see the full error message
      settings: { network },
    }) => ({
      accountAssetsData,
      isLoadingTransactions,
      network,
      pendingTransactions,
      transactions,
    })
  );

  const allTransactions = useMemo(
    () => pendingTransactions.concat(transactions),
    [pendingTransactions, transactions]
  );

  const [page, setPage] = useState(1);
  const nextPage = useCallback(() => setPage(page => page + 1), []);

  const slicedTransaction: any[] = useMemo(
    () => allTransactions.slice(0, page * NOE_PAGE),
    [allTransactions, page]
  );

  const mainnetAddresses = useMemo(
    () =>
      accountAssetsData
        ? slicedTransaction.reduce((acc, txn) => {
            acc[`${txn.address}_${txn.network}`] =
              accountAssetsData[
                `${txn.address}_${txn.network}`
              ]?.mainnet_address;

            return acc;
          }, {})
        : [],
    [accountAssetsData, slicedTransaction]
  );

  const { contacts } = useContacts();
  const { requests } = useRequests();
  const { accountAddress } = useAccountSettings();
  const theme = useTheme();
  const { navigate } = useNavigation();
  const onTransactionPress = useCallback(
    transactionPressBuilder({ navigate }),
    [navigate]
  );

  const accountState = {
    accountAddress,
    contacts,
    initialized,
    isFocused,
    mainnetAddresses,
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
    transactionsCount: slicedTransaction.length,
  };
}
