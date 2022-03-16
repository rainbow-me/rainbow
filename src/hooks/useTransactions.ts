import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from '@rainbow-me/redux/store';
import { ethereumUtils } from '@rainbow-me/utils';

export default function useTransactions() {
  const transactions = useSelector(({ data }: AppState) => data.transactions);

  const getTransactionByHash = useCallback(
    (transactionHash: string) =>
      transactions.find(
        transaction => ethereumUtils.getHash(transaction) === transactionHash
      ),
    [transactions]
  );

  return {
    getTransactionByHash,
  };
}
