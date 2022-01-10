import { format } from 'date-fns';
import { get } from 'lodash';
import { TransactionStatusTypes, TransactionTypes } from '@rainbow-me/entities';

export const buildTransactionUniqueIdentifier = ({
  hash,
  displayDetails,
}: any) => hash || get(displayDetails, 'timestampInMs');

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

export function getHumanReadableDate(date: any) {
  const timestamp = new Date(date * 1000);

  return format(
    timestamp,
    // @ts-expect-error ts-migrate(2365) FIXME: Operator '>' cannot be applied to types 'Date' and... Remove this comment to see the full error message
    timestamp > todayTimestamp
      ? `'Today'`
      : // @ts-expect-error ts-migrate(2365) FIXME: Operator '>' cannot be applied to types 'Date' and... Remove this comment to see the full error message
      timestamp > yesterdayTimestamp
      ? `'Yesterday'`
      : // @ts-expect-error ts-migrate(2365) FIXME: Operator '>' cannot be applied to types 'Date' and... Remove this comment to see the full error message
        `'on' MMM d${timestamp > thisYearTimestamp ? '' : ' yyyy'}`
  );
}

export function hasAddableContact(status: any, type: any) {
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
