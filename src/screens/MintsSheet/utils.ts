export function getTimeElapsedFromDate(date: Date) {
  const msElapsed = new Date().getTime() - date.getTime();
  const minutesElapsed = msElapsed / 1000 / 60;
  const hoursElapsed = minutesElapsed / 60;
  const daysElapsed = hoursElapsed / 24;
  const monthsElapsed = daysElapsed / 30;
  const yearsElapsed = monthsElapsed / 12;

  if (yearsElapsed >= 1) {
    return `>1y`;
  } else if (monthsElapsed >= 1) {
    return `${Math.ceil(monthsElapsed)}mo`;
  } else if (daysElapsed >= 1) {
    return `${Math.ceil(daysElapsed)}d`;
  } else if (hoursElapsed >= 1) {
    return `${Math.ceil(hoursElapsed)}h`;
  } else if (minutesElapsed >= 1) {
    return `${Math.ceil(minutesElapsed)}m`;
  } else {
    return '<1m';
  }
}
