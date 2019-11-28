import {
  format,
  isThisMonth,
  isThisYear,
  isToday,
  isYesterday,
} from 'date-fns';
import { get, groupBy, isEmpty, map, toLower } from 'lodash';
import { createSelector } from 'reselect';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';

const accountAddressSelector = state => state.accountAddress;
const contactsSelector = state => state.contacts;
const requestsSelector = state => state.requests;
const transactionsSelector = state => state.transactions;

export const buildTransactionUniqueIdentifier = ({ hash, displayDetails }) =>
  hash || get(displayDetails, 'timestampInMs');

const groupTransactionByDate = ({ pending, minedAt }) => {
  if (pending) return 'Pending';

  const timestamp = new Date(parseInt(minedAt, 10) * 1000);

  if (isToday(timestamp)) return 'Today';
  if (isYesterday(timestamp)) return 'Yesterday';
  if (isThisMonth(timestamp)) return 'This Month';

  return format(timestamp, `MMMM${isThisYear(timestamp) ? '' : ' YYYY'}`);
};

const addContactInfo = contacts => txn => {
  const { from, to, status } = txn;
  const isSent = status === TransactionStatusTypes.sent;
  const contactAddress = isSent ? to : from;
  const contact = get(contacts, `${[toLower(contactAddress)]}`, null);
  return {
    ...txn,
    contact,
  };
};

const buildTransactionsSections = (
  accountAddress,
  contacts,
  requests,
  transactions
) => {
  let sectionedTransactions = [];

  const transactionsWithContacts = map(transactions, addContactInfo(contacts));

  if (!isEmpty(transactionsWithContacts)) {
    const transactionsByDate = groupBy(
      transactionsWithContacts,
      groupTransactionByDate
    );

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
    contactsSelector,
    requestsSelector,
    transactionsSelector,
  ],
  buildTransactionsSections
);
