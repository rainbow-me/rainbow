import { differenceInDays, differenceInYears } from 'date-fns';
import { findIndex, sumBy, take } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';

const DEFAULT_WEEKLY_LIMIT = 500;
const DEFAULT_YEARLY_LIMIT = 5000;

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

    const firstIndexBeyondThisWeek = findIndex(purchaseTransactions, txn => {
      const txnTimestampInMs = txn.timestamp || txn.minedAt * 1000;
      return differenceInDays(now, txnTimestampInMs) >= 7;
    });

    const weeklyRemainingLimit = findRemainingAmount(
      DEFAULT_WEEKLY_LIMIT,
      purchaseTransactions,
      firstIndexBeyondThisWeek
    );

    const firstIndexBeyondThisYear = findIndex(
      purchaseTransactions,
      txn => {
        const txnTimestampInMs = txn.timestamp || txn.minedAt * 1000;
        return differenceInYears(now, txnTimestampInMs) >= 1;
      },
      Math.max(firstIndexBeyondThisWeek, 0)
    );
    const yearlyRemainingLimit = findRemainingAmount(
      DEFAULT_YEARLY_LIMIT,
      purchaseTransactions,
      firstIndexBeyondThisYear
    );

    return {
      weeklyRemainingLimit: Math.max(weeklyRemainingLimit, 0),
      yearlyRemainingLimit: Math.max(yearlyRemainingLimit, 0),
    };
  }, [purchaseTransactions]);

  return limits;
}
