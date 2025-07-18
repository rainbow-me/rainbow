import * as i18n from '@/languages';
import { deepFreeze } from '@/utils/deepFreeze';

// ============ Types ======================================================== //

export type FormatTimestampOptions = {
  /**
   * The case of the date string.
   * - `'normal'` - `"2:30 PM Jan 15"`
   * - `'uppercase'` - `"2:30 PM JAN 15"`
   * - `'lowercase'` - `"2:30 PM jan 15"`
   * @default 'normal'
   */
  case?: 'lowercase' | 'normal' | 'uppercase';
  /**
   * Whether to prefix single-digit numbers with a zero.
   * @default true
   */
  prefixSingleDigitsWithZero?: boolean;
  /**
   * Whether to use `'today'` and `'yesterday'` in place of dates.
   * @default true
   */
  useTodayYesterday?: boolean;
};

// ============ Date Constants ================================================= //

const I18N = deepFreeze({
  months: [
    i18n.t(i18n.l.expanded_state.chart.date.months.month_00),
    i18n.t(i18n.l.expanded_state.chart.date.months.month_01),
    i18n.t(i18n.l.expanded_state.chart.date.months.month_02),
    i18n.t(i18n.l.expanded_state.chart.date.months.month_03),
    i18n.t(i18n.l.expanded_state.chart.date.months.month_04),
    i18n.t(i18n.l.expanded_state.chart.date.months.month_05),
    i18n.t(i18n.l.expanded_state.chart.date.months.month_06),
    i18n.t(i18n.l.expanded_state.chart.date.months.month_07),
    i18n.t(i18n.l.expanded_state.chart.date.months.month_08),
    i18n.t(i18n.l.expanded_state.chart.date.months.month_09),
    i18n.t(i18n.l.expanded_state.chart.date.months.month_10),
    i18n.t(i18n.l.expanded_state.chart.date.months.month_11),
  ],

  today: {
    lowercase: i18n.t(i18n.l.time.today),
    normal: i18n.t(i18n.l.time.today_caps),
    uppercase: i18n.t(i18n.l.time.today).toUpperCase(),
  },

  yesterday: {
    lowercase: i18n.t(i18n.l.time.yesterday),
    normal: i18n.t(i18n.l.time.yesterday_caps),
    uppercase: i18n.t(i18n.l.time.yesterday).toUpperCase(),
  },
});

const CURRENT_YEAR = new Date().getFullYear();
const IS_24H_TIME_ENABLED = !(new Intl.DateTimeFormat(undefined, { hour: '2-digit' }).resolvedOptions().hour12 ?? true);

// ============ Internal Helpers =============================================== //

/**
 * Formats a number as a string, optionally padding with a leading zero.
 * @param value The number to format
 * @param prefixWithZero Whether to prefix single-digit numbers with a zero
 * @returns The formatted string
 */
function formatDateDigits(value: number, prefixWithZero: boolean): string {
  'worklet';
  return prefixWithZero && value < 10 ? `0${value}` : `${value}`;
}

// ============ Timestamp Formatter ============================================ //

export function formatTimestamp(
  timestamp: number,
  { case: caseOption = 'normal', prefixSingleDigitsWithZero = true, useTodayYesterday = true }: FormatTimestampOptions = {}
): string {
  'worklet';
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const prefixWithZero = prefixSingleDigitsWithZero ?? true;
  const paddedMinutes = formatDateDigits(minutes, true);

  let timeString: string;

  if (IS_24H_TIME_ENABLED) {
    const paddedHours = formatDateDigits(hours, prefixWithZero);
    timeString = `${paddedHours}:${paddedMinutes}`;
  } else {
    const h = hours % 12;
    const displayHours = h === 0 ? 12 : h;
    const paddedHours = formatDateDigits(displayHours, prefixWithZero);
    const period = hours < 12 ? 'AM' : 'PM';
    timeString = `${paddedHours}:${paddedMinutes} ${period}`;
  }

  if (useTodayYesterday) {
    if (date.toDateString() === now.toDateString()) {
      return `${timeString} ${I18N.today[caseOption]}`;
    }
    now.setDate(now.getDate() - 1);
    if (date.toDateString() === now.toDateString()) {
      return `${timeString} ${I18N.yesterday[caseOption]}`;
    }
  }

  let dateString = I18N.months[date.getMonth()] + ' ';

  if (caseOption === 'uppercase') dateString = dateString.toUpperCase();
  else if (caseOption === 'lowercase') dateString = dateString.toLowerCase();

  const d = date.getDate();
  dateString += formatDateDigits(d, prefixWithZero);

  const y = date.getFullYear();
  if (y !== CURRENT_YEAR) dateString += ', ' + y;

  return `${timeString} ${dateString}`;
}

export function toUnixTime(date: string): number {
  'worklet';
  return new Date(date).getTime() / 1000;
}
