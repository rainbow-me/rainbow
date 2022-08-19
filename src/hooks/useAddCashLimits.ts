import { differenceInDays, differenceInYears } from 'date-fns';
import { sumBy, take } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionStatusTypes } from '@/entities';
import { AppState } from '@rainbow-me/redux/store';

const DEFAULT_WEEKLY_LIMIT = 500;
const DEFAULT_YEARLY_LIMIT = 5000;

const findRemainingAmount = (
  limit: number,
  purchaseTransactions: AppState['addCash']['purchaseTransactions'],
  index: number
) => {
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
    ({ addCash: { purchaseTransactions = [] } }: AppState) =>
      purchaseTransactions
  );

  const limits = useMemo(() => {
    const now = Date.now();

    const firstIndexBeyondThisWeek = purchaseTransactions.findIndex(txn => {
      const txnTimestampInMs = txn.timestamp || txn.minedAt! * 1000;
      return differenceInDays(now, txnTimestampInMs) >= 7;
    });

    const weeklyRemainingLimit = findRemainingAmount(
      DEFAULT_WEEKLY_LIMIT,
      purchaseTransactions,
      firstIndexBeyondThisWeek
    );
    const startFilteringIndex = Math.max(firstIndexBeyondThisWeek, 0);
    const firstIndexBeyondThisYear = purchaseTransactions.findIndex(
      (txn: any, index: number) => {
        if (index < startFilteringIndex) return false;
        const txnTimestampInMs = txn.timestamp || txn.minedAt! * 1000;
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
