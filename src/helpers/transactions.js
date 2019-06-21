import {
  format,
  isThisMonth,
  isThisYear,
  isToday,
  isYesterday,
} from 'date-fns';
import { get, groupBy, isEmpty } from 'lodash';
import { createSelector } from 'reselect';
import TransactionStatusTypes from './transactionStatusTypes';
import { isLowerCaseMatch } from '../utils';

const accountAddressSelector = state => state.accountAddress;
const nativeCurrencySelector = state => state.nativeCurrency;
const requestsSelector = state => state.requests;
const transactionsSelector = state => state.transactions;

export const buildTransactionUniqueIdentifier = ({ hash, displayDetails }) => (
  hash || get(displayDetails, 'timestampInMs')
);

export const getTransactionStatus = ({
  accountAddress,
  from,
  pending,
  status,
  to,
}) => {
  const isFromAccount = isLowerCaseMatch(from, accountAddress);
  const isToAccount = isLowerCaseMatch(to, accountAddress);

  if (pending && isFromAccount) return TransactionStatusTypes.sending;
  if (pending && isToAccount) return TransactionStatusTypes.receiving;

  if (status === 'failed') return TransactionStatusTypes.failed;

  if (isFromAccount && isToAccount) return TransactionStatusTypes.self;

  if (isFromAccount) return TransactionStatusTypes.sent;
  if (isToAccount) return TransactionStatusTypes.received;

  return undefined;
};

const groupTransactionByDate = ({ pending, mined_at: time }) => {
  if (pending) return 'Pending';

  const timestamp = new Date(parseInt(time, 10) * 1000);

  if (isToday(timestamp)) return 'Today';
  if (isYesterday(timestamp)) return 'Yesterday';
  if (isThisMonth(timestamp)) return 'This Month';

  return format(timestamp, `MMMM${isThisYear(timestamp) ? '' : ' YYYY'}`);
};

const normalizeTransactions = ({ accountAddress, nativeCurrency, transactions }) => (
  transactions.map(({
    asset,
    ...tx
  }) => ({
    ...tx,
    name: get(asset, 'name', ''),
    status: getTransactionStatus({ accountAddress, ...tx }),
    symbol: get(asset, 'symbol', ''),
  }))
);

const buildTransactionsSections = (
  accountAddress,
  nativeCurrency,
  requests,
  transactions,
) => {
  let sectionedTransactions = [];

  if (!isEmpty(transactions)) {
    const normalizedTransactions = normalizeTransactions({
      accountAddress,
      nativeCurrency,
      transactions,
    });

    const transactionsByDate = groupBy(normalizedTransactions, groupTransactionByDate);

    sectionedTransactions = Object.keys(transactionsByDate).map(section => ({
      data: transactionsByDate[section],
      title: section,
    }));
  }

  let requestsToApprove = [];
  if (!isEmpty(requests)) {
    requestsToApprove = [{
      data: requests,
      title: 'Requests',
    }];
  }

  return {
    sections: [
      ...requestsToApprove,
      ...sectionedTransactions,
    ],
  };
};

export const buildTransactionsSectionsSelector = createSelector(
  [
    accountAddressSelector,
    nativeCurrencySelector,
    requestsSelector,
    transactionsSelector,
  ],
  buildTransactionsSections,
);
