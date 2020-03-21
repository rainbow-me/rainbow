import { format } from 'date-fns';
import { get, groupBy, isEmpty, map, toLower } from 'lodash';
import { createSelector } from 'reselect';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';

const contactsSelector = state => state.contacts;
const requestsSelector = state => state.requests;
const transactionsSelector = state => state.transactions;
const focusedSelector = state => state.isFocused;

export const buildTransactionUniqueIdentifier = ({ hash, displayDetails }) =>
  hash || get(displayDetails, 'timestampInMs');

const calculateTimestampOfToday = () => {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const calculateTimestampOfYesterday = () => {
  var d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const calculateTimestampOfThisMonth = () => {
  var d = new Date();
  d.setDate(0);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const calculateTimestampOfThisYear = () => {
  var d = new Date();
  d.setFullYear(d.getFullYear, 1, 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

let timestampsCalculation = new Date();

let todayTimestamp = calculateTimestampOfToday();
let yesterdayTimestamp = calculateTimestampOfYesterday();
let thisMonthTimestamp = calculateTimestampOfThisMonth();
let thisYearTimestamp = calculateTimestampOfThisYear();

const getTimestamps = () => {
  const now = new Date();
  // When the day / month changes, we need to recalculate timestamps
  if (
    timestampsCalculation.getDate() !== now.getDate() ||
    timestampsCalculation.getMonth() !== now.getMonth()
  ) {
    todayTimestamp = calculateTimestampOfToday();
    yesterdayTimestamp = calculateTimestampOfYesterday();
    thisMonthTimestamp = calculateTimestampOfThisMonth();
    thisYearTimestamp = calculateTimestampOfThisYear();
  }
  return {
    thisMonthTimestamp,
    thisYearTimestamp,
    todayTimestamp,
    yesterdayTimestamp,
  };
};

const groupTransactionByDate = ({ pending, minedAt }) => {
  if (pending) return 'Pending';
  const {
    todayTimestamp,
    yesterdayTimestamp,
    thisMonthTimestamp,
    thisYearTimestamp,
  } = getTimestamps();

  const ts = parseInt(minedAt, 10) * 1000;

  if (ts > todayTimestamp) return 'Today';
  if (ts > yesterdayTimestamp) return 'Yesterday';
  if (ts > thisMonthTimestamp) return 'This Month';

  return format(ts, `MMMM${ts > thisYearTimestamp ? '' : ' yyyy'}`);
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

let wasInitialized = false;

// Automatically initialize
// After 10 seconds
setTimeout(() => {
  wasInitialized = true;
}, 10000);

const buildTransactionsSections = (
  contacts,
  requests,
  transactions,
  isFocused
) => {
  if (!wasInitialized && !isFocused) {
    return { sections: [] };
  }
  wasInitialized = true;
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
  [contactsSelector, requestsSelector, transactionsSelector, focusedSelector],
  buildTransactionsSections
);
