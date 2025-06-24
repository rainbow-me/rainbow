import * as i18n from '@/languages';

const MONTHS = [
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
];

export function formatTimestamp(timestamp: number): string {
  'worklet';

  const date = new Date(timestamp * 1000);
  const now = new Date();

  let res = MONTHS[date.getMonth()] + ' ';

  const d = date.getDate();
  if (d < 10) {
    res += '0';
  }
  res += d;

  const y = date.getFullYear();
  const yCurrent = now.getFullYear();
  if (y !== yCurrent) {
    res += ', ' + y;
    return res;
  }

  const h = date.getHours() % 12;
  if (h === 0) {
    res += ' 12:';
  } else {
    if (h < 10) {
      res += ' 0' + h + ':';
    } else {
      res += ' ' + h + ':';
    }
  }

  const m = date.getMinutes();
  if (m < 10) {
    res += '0';
  }
  res += m + ' ';

  if (date.getHours() < 12) {
    res += 'AM';
  } else {
    res += 'PM';
  }

  return res;
}

export function toUnixTime(date: string): number {
  'worklet';
  return new Date(date).getTime() / 1000;
}
