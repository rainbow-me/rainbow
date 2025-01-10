type TimeInMs = number;
type TimeUtils = {
  /** Convert seconds to milliseconds */
  seconds: (seconds: number) => TimeInMs;
  /** Convert minutes to milliseconds */
  minutes: (minutes: number) => TimeInMs;
  /** Convert hours to milliseconds */
  hours: (hours: number) => TimeInMs;
  /** Convert days to milliseconds */
  days: (days: number) => TimeInMs;
  /** Convert weeks to milliseconds */
  weeks: (weeks: number) => TimeInMs;
  /** Represents infinite time */
  infinity: typeof Infinity;
  /** Represents zero time */
  zero: 0;
};

/**
 * Utility object for time conversions and helpers.
 * All methods convert the input unit to milliseconds.
 * @example
 * time.seconds(5) // 5 seconds
 * time.minutes(2) // 2 minutes
 * time.hours(1) // 1 hour
 * time.days(5) // 5 days
 * time.weeks(2) // 2 weeks
 * ––
 * time.infinity // Infinity
 * time.zero // 0
 */
export const time: TimeUtils = {
  seconds: seconds => seconds * 1000,
  minutes: minutes => time.seconds(minutes * 60),
  hours: hours => time.minutes(hours * 60),
  days: days => time.hours(days * 24),
  weeks: weeks => time.days(weeks * 7),
  infinity: Infinity,
  zero: 0,
};
