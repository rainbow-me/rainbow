import {
  format,
  isThisMonth,
  isThisYear,
  isToday,
  isYesterday,
} from 'date-fns';
import { get, groupBy, isEmpty } from 'lodash';
import { createElement } from 'react';
import { sortList } from '../utils';

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

const groupTransactionByDate = transactions => {
  return groupBy(transactions, ({ pending, timestamp: time }) => {
    if (pending) return 'Pending';

    const { ms } = time;
    const timestamp = new Date(parseInt(ms, 10));

    if (isToday(timestamp)) {
      return 'Today';
    } else if (isYesterday(timestamp)) {
      return 'Yesterday';
    } else if (isThisMonth(timestamp)) {
      return 'This Month';
    }

    return format(timestamp, `MMMM${isThisYear(timestamp) ? '' : ' YYYY'}`);
  });
};

const normalizeTransactions = ({ accountAddress, transactions }) =>
  transactions.map(({
    asset,
    native,
    value,
    ...tx
  }) => ({
    ...tx,
    balance: value,
    name: get(asset, 'name'),
    native: { balance: get(native, 'USD.value') },
    status: getTransactionStatus({ accountAddress, ...tx }),
    symbol: get(asset, 'symbol'),
  }));

const renderItemElement = renderItem => renderItemProps => createElement(renderItem, renderItemProps);

export const buildTransactionsSections = ({
  accountAddress,
  requestRenderItem,
  requests,
  transactionRenderItem,
  transactions,
}) => {
  const normalizedTransactions = normalizeTransactions({ accountAddress, transactions });
  const transactionsByDate = groupTransactionByDate(normalizedTransactions);

  const sectionedTransactions = Object.keys(transactionsByDate).map(section => ({
    data: transactionsByDate[section],
    renderItem: renderItemElement(transactionRenderItem),
    title: section,
  }));
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
