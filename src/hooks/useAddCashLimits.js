import { differenceInHours, differenceInYears } from 'date-fns';
import { findIndex, sumBy, take } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';

const DEFAULT_DAILY_LIMIT = 250;
const DEFAULT_YEARLY_LIMIT = 1500;

const findRemainingAmount = (limit, purchaseTransactions, index) => {
  const transactionsInTimeline =
    index >= 0 ? take(purchaseTransactions, index) : purchaseTransactions;
  const purchasedAmount = sumBy(transactionsInTimeline, txn =>
    txn.status === TransactionStatusTypes.failed
      ? 0
      : txn.sourceAmount
      ? Number(txn.sourceAmount)
      : 0
  );
  return limit - purchasedAmount;
};

export default function useAddCashLimits() {
  const purchaseTransactions = useSelector(
    ({ addCash: { purchaseTransactions } }) => purchaseTransactions
  );

  const limits = useMemo(() => {
    const now = Date.now();

    const firstIndexBeyondToday = findIndex(purchaseTransactions, txn => {
      const txnTimestampInMs = txn.timestamp || txn.minedAt * 1000;
      return differenceInHours(now, txnTimestampInMs) >= 24;
    });

    const dailyRemainingLimit = findRemainingAmount(
      DEFAULT_DAILY_LIMIT,
      purchaseTransactions,
      firstIndexBeyondToday
    );

    const firstIndexBeyondThisYear = findIndex(
      purchaseTransactions,
      txn => {
        const txnTimestampInMs = txn.timestamp || txn.minedAt * 1000;
        return differenceInYears(now, txnTimestampInMs) >= 1;
      },
      Math.max(firstIndexBeyondToday, 0)
    );
    const yearlyRemainingLimit = findRemainingAmount(
      DEFAULT_YEARLY_LIMIT,
      purchaseTransactions,
      firstIndexBeyondThisYear
    );

    return {
      dailyRemainingLimit: Math.max(dailyRemainingLimit, 0),
      yearlyRemainingLimit: Math.max(yearlyRemainingLimit, 0),
    };
  }, [purchaseTransactions]);

  return limits;
}
