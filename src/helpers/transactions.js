import {
  format,
  isThisMonth,
  isThisYear,
  isToday,
  isYesterday,
} from 'date-fns';
import { get, groupBy } from 'lodash';
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
  const isFromAccount = from === accountAddress;
  const isToAccount = to === accountAddress;

  if (pending && isFromAccount) return TransactionStatusTypes.sending;
  if (pending && isToAccount) return TransactionStatusTypes.receiving;

  if (error) return TransactionStatusTypes.failed;

  if (isFromAccount && isToAccount) return TransactionStatusTypes.self;

  if (isFromAccount) return TransactionStatusTypes.sent;
  if (isToAccount) return TransactionStatusTypes.received;

  return undefined;
};

const groupTransactionByDate = transactions => {
  const sortedChronologically = sortList(transactions, 'timestamp.ms').reverse();

  return groupBy(sortedChronologically, ({ pending, timestamp: { ms } }) => {
    if (pending) return 'Pending';

    const timestamp = new Date(parseInt(ms, 10));

    if (isToday(timestamp)) {
      return 'Today';
    } else if (isYesterday(timestamp)) {
      return 'Yesterday';
    } else if (isThisMonth(timestamp)) {
      return 'This month';
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

export const buildTransactionsSections = ({ accountAddress, renderItem, transactions }) => {
  const normalizedTransactions = normalizeTransactions({ accountAddress, transactions });
  const transactionsByDate = groupTransactionByDate(normalizedTransactions);

  return Object.keys(transactionsByDate).map((section) => ({
    data: transactionsByDate[section],
    renderItem: renderItemProps => createElement(renderItem, renderItemProps),
    title: section,
  }));
};
