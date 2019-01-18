import { supportedNativeCurrencies } from 'balance-common';
import {
  format,
  isThisMonth,
  isThisYear,
  isToday,
  isYesterday,
} from 'date-fns';
import { get, groupBy, isEmpty } from 'lodash';
import { createElement } from 'react';

export const TransactionStatusTypes = {
  failed: 'failed',
  received: 'received',
  receiving: 'receiving',
  self: 'self',
  sending: 'sending',
  sent: 'sent',
};

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

const normalizeTransactions = ({ accountAddress, nativeCurrency, transactions }) =>
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
  }));

const renderItemElement = renderItem => renderItemProps => createElement(renderItem, renderItemProps);

export const buildTransactionsSections = ({
  accountAddress,
  nativeCurrency,
  requestRenderItem,
  requests,
  transactionRenderItem,
  transactions,
}) => {
  let sectionedTransactions = [];

  if (transactions) {
    const normalizedTransactions = normalizeTransactions({
      accountAddress,
      nativeCurrency,
      transactions,
    });

    const transactionsByDate = groupBy(normalizedTransactions, groupTransactionByDate);

    sectionedTransactions = Object.keys(transactionsByDate).map(section => ({
      data: transactionsByDate[section],
      renderItem: renderItemElement(transactionRenderItem),
      title: section,
    }));
  }


  let requestsToApprove = [];
  if (!isEmpty(requests)) {
    requestsToApprove = [{
      data: requests,
      renderItem: renderItemElement(requestRenderItem),
      title: 'Requests',
    }];
  }

  return [
    ...requestsToApprove,
    ...sectionedTransactions,
  ];
};
