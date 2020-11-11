import { format } from 'date-fns';
import { get } from 'lodash';
import TransactionStatusTypes from '../helpers/transactionStatusTypes';
import TransactionTypes from '../helpers/transactionTypes';

export const buildTransactionUniqueIdentifier = ({ hash, displayDetails }) =>
  hash || get(displayDetails, 'timestampInMs');

export const calculateTimestampOfToday = () => {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const calculateTimestampOfYesterday = () => {
  var d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const calculateTimestampOfThisMonth = () => {
  var d = new Date();
  d.setDate(0);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const calculateTimestampOfThisYear = () => {
  var d = new Date();
  d.setFullYear(d.getFullYear(), 0, 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export let timestampsCalculation = new Date();
export let todayTimestamp = calculateTimestampOfToday();
export let yesterdayTimestamp = calculateTimestampOfYesterday();
export let thisMonthTimestamp = calculateTimestampOfThisMonth();
export let thisYearTimestamp = calculateTimestampOfThisYear();

export function getHumanReadableDate(date) {
  const timestamp = new Date(date * 1000);

  return format(
    timestamp,
    timestamp > todayTimestamp
      ? `'Today'`
      : timestamp > yesterdayTimestamp
      ? `'Yesterday'`
      : `'on' MMM d${timestamp > thisYearTimestamp ? '' : ' yyyy'}`
  );
}

export function hasAddableContact(status, type) {
  if (
    (status === TransactionStatusTypes.received &&
      type !== TransactionTypes.trade) ||
    status === TransactionStatusTypes.receiving ||
    status === TransactionStatusTypes.sending ||
    status === TransactionStatusTypes.sent
  ) {
    return true;
  }
  return false;
}
