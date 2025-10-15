import { getDateFormatter } from '@/helpers/intl';
import i18n from '@/languages';

export const formatDate = (dateString: string, precision: 'hours' | 'minutes' | 'days' = 'days') => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30.44);
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const useHours = precision === 'hours' || precision === 'minutes';
  const useMinutes = precision === 'minutes';

  if (diffDays <= 1) {
    if (useHours) {
      if (diffHours === 0) {
        if (useMinutes) {
          return `${diffMinutes} ${i18n.walletconnect.simulation.formatted_dates.minutes_ago()}`;
        } else {
          return `${diffHours} ${i18n.walletconnect.simulation.formatted_dates.hours_ago()}`;
        }
      } else {
        return `${diffHours} ${diffHours === 1 ? i18n.walletconnect.simulation.formatted_dates.hour_ago() : i18n.walletconnect.simulation.formatted_dates.hours_ago()}`;
      }
    } else {
      return i18n.walletconnect.simulation.formatted_dates.today();
    }
  } else if (diffDays === 1) {
    return `${diffDays} ${i18n.walletconnect.simulation.formatted_dates.day_ago()}`;
  } else if (diffDays < 7) {
    return `${diffDays} ${i18n.walletconnect.simulation.formatted_dates.days_ago()}`;
  } else if (diffWeeks === 1) {
    return `${diffWeeks} ${i18n.walletconnect.simulation.formatted_dates.week_ago()}`;
  } else if (diffDays < 30.44) {
    return `${diffWeeks} ${i18n.walletconnect.simulation.formatted_dates.weeks_ago()}`;
  } else if (diffMonths === 1) {
    return `${diffMonths} ${i18n.walletconnect.simulation.formatted_dates.month_ago()}`;
  } else if (diffDays < 365.25) {
    return `${diffMonths} ${i18n.walletconnect.simulation.formatted_dates.months_ago()}`;
  } else {
    return getDateFormatter(undefined, { month: 'short', year: 'numeric' }).format(date);
  }
};
