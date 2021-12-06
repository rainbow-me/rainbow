import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { buildTransactionsSectionsSelector } from '../helpers/buildTransactionsSectionsSelector';
import NetworkTypes from '../helpers/networkTypes';
import useContacts from './useContacts';
import useRequests from './useRequests';

export const NOE_PAGE = 30;

export default function useAccountTransactions(initialized, isFocused) {
  const { isLoadingTransactions, network, transactions } = useSelector(
    ({
      data: { isLoadingTransactions, transactions },
      settings: { network },
    }) => ({
      isLoadingTransactions,
      network,
      transactions,
    })
  );

  const [page, setPage] = useState(1);
  const nextPage = useCallback(() => setPage(page => page + 1), []);

  const slicedTransaction = useMemo(
    () => transactions.slice(0, page * NOE_PAGE),
    [transactions, page]
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
    const remainingLength = transactions.length - slicedTransaction.length;
    if (remainingLength === 0) {
      return null;
    }
    if (transactions.length - slicedTransaction.length <= NOE_PAGE) {
      return `Show last ${remainingLength} transactions.`;
    }
    return `Show ${NOE_PAGE} more transactions...`;
  }, [slicedTransaction.length, transactions.length]);

  return {
    isLoadingTransactions:
      network === NetworkTypes.mainnet ? isLoadingTransactions : false,
    nextPage,
    remainingItemsLabel,
    sections,
    transactions: ios ? transactions : slicedTransaction,
    transactionsCount,
  };
}
