import {
  format,
  isThisMonth,
  isThisYear,
  isToday,
  isYesterday,
} from 'date-fns';
import { get, groupBy, isEmpty } from 'lodash';
import { createSelector } from 'reselect';

const accountAddressSelector = state => state.accountAddress;
const requestsSelector = state => state.requests;
const transactionsSelector = state => state.transactions;

export const buildTransactionUniqueIdentifier = ({ hash, displayDetails }) =>
  hash || get(displayDetails, 'timestampInMs');

const groupTransactionByDate = ({ pending, mined_at: time }) => {
  if (pending) return 'Pending';

  const timestamp = new Date(parseInt(time, 10) * 1000);

  if (isToday(timestamp)) return 'Today';
  if (isYesterday(timestamp)) return 'Yesterday';
  if (isThisMonth(timestamp)) return 'This Month';

  return format(timestamp, `MMMM${isThisYear(timestamp) ? '' : ' YYYY'}`);
};

const buildTransactionsSections = (
  accountAddress,
  requests,
  transactions
) => {
  let sectionedTransactions = [];

  if (!isEmpty(transactions)) {
    const transactionsByDate = groupBy(transactions, groupTransactionByDate);

    sectionedTransactions = Object.keys(transactionsByDate).map(section => ({
      data: transactionsByDate[section],
      title: section,
    }));
  }

  let requestsToApprove = [];
  if (!isEmpty(requests)) {
    requestsToApprove = [
      {
        data: requests,
        title: 'Requests',
      },
    ];
  }

  return {
    sections: [...requestsToApprove, ...sectionedTransactions],
  };
};

export const buildTransactionsSectionsSelector = createSelector(
  [
    accountAddressSelector,
    requestsSelector,
    transactionsSelector,
  ],
  buildTransactionsSections
);
