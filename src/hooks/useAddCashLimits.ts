import { differenceInDays, differenceInYears } from 'date-fns';
import { findIndex, sumBy, take } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { TransactionStatusTypes } from '@rainbow-me/entities';

const DEFAULT_WEEKLY_LIMIT = 500;
const DEFAULT_YEARLY_LIMIT = 5000;

const findRemainingAmount = (
  limit: any,
  purchaseTransactions: any,
  index: any
) => {
  const transactionsInTimeline =
    index >= 0 ? take(purchaseTransactions, index) : purchaseTransactions;
  const purchasedAmount = sumBy(transactionsInTimeline, txn =>
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    txn.status === TransactionStatusTypes.failed
      ? 0
      : // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
      txn.sourceAmount
      ? // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
        Number(txn.sourceAmount)
      : 0
  );
  return limit - purchasedAmount;
};

export default function useAddCashLimits() {
  const purchaseTransactions = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'addCash' does not exist on type 'Default... Remove this comment to see the full error message
    ({ addCash: { purchaseTransactions } }) => purchaseTransactions
  );

  const limits = useMemo(() => {
    const now = Date.now();

    const firstIndexBeyondThisWeek = findIndex(purchaseTransactions, txn => {
      // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
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
        // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
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
