import { format } from 'date-fns';
import {
  TransactionStatus,
  TransactionStatusTypes,
  TransactionType,
  TransactionTypes,
} from '@/entities';
import { getDateFnsLocale } from '@/languages';

export const buildTransactionUniqueIdentifier = ({
  hash,
  displayDetails,
}: any) => hash || displayDetails?.timestampInMs;

export const calculateTimestampOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const calculateTimestampOfYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const calculateTimestampOfThisMonth = () => {
  const d = new Date();
  d.setDate(0);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const calculateTimestampOfThisYear = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear(), 0, 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const timestampsCalculation = new Date();
export const todayTimestamp = calculateTimestampOfToday();
export const yesterdayTimestamp = calculateTimestampOfYesterday();
export const thisMonthTimestamp = calculateTimestampOfThisMonth();
export const thisYearTimestamp = calculateTimestampOfThisYear();

export function getHumanReadableDate(date: any) {
  const timestamp = new Date(date * 1000);

  // i18n
  return format(
    timestamp,
    // @ts-expect-error ts-migrate(2365) FIXME: Operator '>' cannot be applied to types 'Date' and... Remove this comment to see the full error message
    timestamp > todayTimestamp
      ? `'Today'`
      : // @ts-expect-error ts-migrate(2365) FIXME: Operator '>' cannot be applied to types 'Date' and... Remove this comment to see the full error message
      timestamp > yesterdayTimestamp
      ? `'Yesterday'`
      : // @ts-expect-error ts-migrate(2365) FIXME: Operator '>' cannot be applied to types 'Date' and... Remove this comment to see the full error message
        `'on' MMM d${timestamp > thisYearTimestamp ? '' : ' yyyy'}`,
    { locale: getDateFnsLocale() }
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

/**
 * Returns the `TransactionStatus` that represents completion for a given
 * transaction type.
 *
 * @param type The transaction type.
 * @returns The confirmed status.
 */
export const getConfirmedState = (
  type?: TransactionType
): TransactionStatus => {
  switch (type) {
    case TransactionTypes.authorize:
      return TransactionStatus.approved;
    case TransactionTypes.deposit:
      return TransactionStatus.deposited;
    case TransactionTypes.withdraw:
      return TransactionStatus.withdrew;
    case TransactionTypes.receive:
      return TransactionStatus.received;
    case TransactionTypes.purchase:
      return TransactionStatus.purchased;
    case TransactionTypes.sell:
      return TransactionStatus.sold;
    default:
      return TransactionStatus.sent;
  }
};
