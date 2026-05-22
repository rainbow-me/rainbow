type SportsEventsDayBoundaries = {
  startOfToday: Date;
  startOfTomorrow: Date;
  startOfDayAfterTomorrow: Date;
  startOfNextWeek: Date;
};

type SportsEventsStartTimeRange = {
  minStartTime: string;
  maxStartTime: string;
};

export function getSportsEventsDayBoundaries(referenceDate: Date = new Date()): SportsEventsDayBoundaries {
  const startOfToday = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfDayAfterTomorrow = new Date(startOfToday);
  startOfDayAfterTomorrow.setDate(startOfDayAfterTomorrow.getDate() + 2);
  const startOfNextWeek = new Date(startOfToday);
  startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

  return { startOfToday, startOfTomorrow, startOfDayAfterTomorrow, startOfNextWeek };
}

export function getSportsEventsStartTimeRange(referenceDate: Date = new Date()): SportsEventsStartTimeRange {
  const { startOfToday, startOfNextWeek } = getSportsEventsDayBoundaries(referenceDate);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  return {
    minStartTime: startOfYesterday.toISOString(),
    maxStartTime: startOfNextWeek.toISOString(),
  };
}
