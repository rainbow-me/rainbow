import { differenceInDays, differenceInYears } from 'date-fns';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionStatusTypes } from '@rainbow-me/entities';

const DEFAULT_WEEKLY_LIMIT = 500;
const DEFAULT_YEARLY_LIMIT = 5000;

const findRemainingAmount = (
  limit: any,
  purchaseTransactions: any,
  index: any
) => {
  const transactionsInTimeline =
    index >= 0 ? purchaseTransactions.slice(0, index) : purchaseTransactions;

  const purchasedAmount = transactionsInTimeline.reduce(
    (acc: number, txn: any) => {
      const amount =
        txn.status === TransactionStatusTypes.failed
          ? 0
          : txn.sourceAmount
          ? Number(txn.sourceAmount)
          : 0;
      return acc + amount;
    },
    0
  );

  return limit - purchasedAmount;
};

export default function useAddCashLimits() {
  const purchaseTransactions = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'addCash' does not exist on type 'Default... Remove this comment to see the full error message
    ({ addCash: { purchaseTransactions = [] } }) => purchaseTransactions
  );

  const limits = useMemo(() => {
    const now = Date.now();

    const firstIndexBeyondThisWeek = purchaseTransactions.findIndex(
      (txn: any) => {
        const txnTimestampInMs = txn.timestamp || txn.minedAt * 1000;
        return differenceInDays(now, txnTimestampInMs) >= 7;
      }
    );

    const weeklyRemainingLimit = findRemainingAmount(
      DEFAULT_WEEKLY_LIMIT,
      purchaseTransactions,
      firstIndexBeyondThisWeek
    );
    const startFilteringIndex = Math.max(firstIndexBeyondThisWeek, 0);
    const firstIndexBeyondThisYear = purchaseTransactions.findIndex(
      (txn: any, index: number) => {
        if (index < startFilteringIndex) return false;
        const txnTimestampInMs = txn.timestamp || txn.minedAt * 1000;
        return differenceInYears(now, txnTimestampInMs) >= 1;
      }
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
