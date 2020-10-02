import { useMemo } from 'react';
import NetworkTypes from '../helpers/networkTypes';
import { buildTransactionsSectionsSelector } from '../helpers/transactions';
import useContacts from './useContacts';
import useRequests from './useRequests';
import { useSelector } from '@rainbow-me/react-redux';

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
    isLoadingTransactions:
      network === NetworkTypes.mainnet ? isLoadingTransactions : false,
    sections,
    transactions,
    transactionsCount,
  };
}
