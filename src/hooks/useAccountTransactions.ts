import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { buildTransactionsSectionsSelector } from '../helpers/buildTransactionsSectionsSelector';
import NetworkTypes from '../helpers/networkTypes';
import useContacts from './useContacts';
import useRequests from './useRequests';

export const NOE_PAGE = 30;

export default function useAccountTransactions(
  initialized: any,
  isFocused: any
) {
  const {
    isLoadingTransactions,
    network,
    pendingTransactions,
    transactions,
  } = useSelector(
    ({
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
      data: { isLoadingTransactions, pendingTransactions, transactions },
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'settings' does not exist on type 'Defaul... Remove this comment to see the full error message
      settings: { network },
    }) => ({
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

  const accountState = {
    contacts,
    initialized,
    isFocused,
    requests,
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
