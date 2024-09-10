import * as i18n from '@/languages';

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30.44);

  if (diffDays === 0) {
    return i18n.t(i18n.l.walletconnect.simulation.formatted_dates.today);
  } else if (diffDays === 1) {
    return `${diffDays} ${i18n.t(i18n.l.walletconnect.simulation.formatted_dates.day_ago)}`;
  } else if (diffDays < 7) {
    return `${diffDays} ${i18n.t(i18n.l.walletconnect.simulation.formatted_dates.days_ago)}`;
  } else if (diffWeeks === 1) {
    return `${diffWeeks} ${i18n.t(i18n.l.walletconnect.simulation.formatted_dates.week_ago)}`;
  } else if (diffDays < 30.44) {
    return `${diffWeeks} ${i18n.t(i18n.l.walletconnect.simulation.formatted_dates.weeks_ago)}`;
  } else if (diffMonths === 1) {
    return `${diffMonths} ${i18n.t(i18n.l.walletconnect.simulation.formatted_dates.month_ago)}`;
  } else if (diffDays < 365.25) {
    return `${diffMonths} ${i18n.t(i18n.l.walletconnect.simulation.formatted_dates.months_ago)}`;
  } else {
    return date.toLocaleString('default', { month: 'short', year: 'numeric' });
  }
};
