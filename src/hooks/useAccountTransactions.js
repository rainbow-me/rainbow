import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { buildTransactionsSectionsSelector } from '../helpers/transactions';
import useContacts from './useContacts';
import useRequests from './useRequests';

export default function useAccountTransactions(initialized, isFocused) {
  const { transactions } = useSelector(({ data: { transactions } }) => ({
    transactions,
  }));

  const transactionsCount = useMemo(() => {
    return transactions.length;
  }, [transactions]);

  const { contacts } = useContacts();
  const { requests } = useRequests();

  const accountState = {
    contacts,
    initialized,
    isFocused,
    requests,
    transactions,
  };

  const { sections } = buildTransactionsSectionsSelector(accountState);

  return {
    sections,
    transactions,
    transactionsCount,
  };
}
