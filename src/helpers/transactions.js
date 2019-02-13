import {
  format,
  isThisMonth,
  isThisYear,
  isToday,
  isYesterday,
} from 'date-fns';
import {
  get,
  groupBy,
  isEmpty,
} from 'lodash';
import { supportedNativeCurrencies } from '@rainbow-me/rainbow-common';
import { createElement } from 'react';
import { createSelector } from 'reselect';
import TransactionStatusTypes from './transactionStatusTypes';

const accountAddressSelector = state => state.accountAddress;
const nativeCurrencySelector = state => state.nativeCurrency;
const requestsSelector = state => state.requests;
const transactionsSelector = state => state.transactions;

export const getTransactionStatus = ({
  accountAddress,
  error,
  from,
  pending,
  to,
}) => {
  const isFromAccount = from.toLowerCase() === accountAddress.toLowerCase();
  const isToAccount = to.toLowerCase() === accountAddress.toLowerCase();

  if (pending && isFromAccount) return TransactionStatusTypes.sending;
  if (pending && isToAccount) return TransactionStatusTypes.receiving;

  if (error) return TransactionStatusTypes.failed;

  if (isFromAccount && isToAccount) return TransactionStatusTypes.self;

  if (isFromAccount) return TransactionStatusTypes.sent;
  if (isToAccount) return TransactionStatusTypes.received;

  return undefined;
};

const groupTransactionByDate = ({ pending, timestamp: time }) => {
  if (pending) return 'Pending';

  const { ms } = time;
  const timestamp = new Date(parseInt(ms, 10));

  if (isToday(timestamp)) return 'Today';
  if (isYesterday(timestamp)) return 'Yesterday';
  if (isThisMonth(timestamp)) return 'This Month';

  return format(timestamp, `MMMM${isThisYear(timestamp) ? '' : ' YYYY'}`);
};

const normalizeTransactions = ({ accountAddress, nativeCurrency, transactions }) => (
  transactions.map(({
    asset,
    native,
    value,
    ...tx
  }) => ({
    ...tx,
    balance: value,
    name: get(asset, 'name'),
    native: {
      ...supportedNativeCurrencies[nativeCurrency],
      balance: get(native, `${nativeCurrency}.value`),
    },
    status: getTransactionStatus({ accountAddress, ...tx }),
    symbol: get(asset, 'symbol'),
  }))
);

const renderItemElement = renderItem => renderItemProps => createElement(renderItem, renderItemProps);

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
