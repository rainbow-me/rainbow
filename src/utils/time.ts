type TimeInMs = number;
type TimeUtils = {
  /** Returns the input value unchanged, in milliseconds */
  ms: (ms: number) => TimeInMs;
  /** Converts seconds to milliseconds */
  seconds: (seconds: number) => TimeInMs;
  /** Converts minutes to milliseconds */
  minutes: (minutes: number) => TimeInMs;
  /** Converts hours to milliseconds */
  hours: (hours: number) => TimeInMs;
  /** Converts days to milliseconds */
  days: (days: number) => TimeInMs;
  /** Converts weeks to milliseconds */
  weeks: (weeks: number) => TimeInMs;
  /** Represents infinite time */
  infinity: typeof Infinity;
  /** Represents zero time */
  zero: 0;
};

/**
 * Worklet-compatible utility object for defining time values.
 *
 * All methods convert the input unit to milliseconds.
 *
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
  ms: ms => {
    'worklet';
    return ms;
  },
  seconds: seconds => {
    'worklet';
    return seconds * 1000;
  },
  minutes: minutes => {
    'worklet';
    return time.seconds(minutes * 60);
  },
  hours: hours => {
    'worklet';
    return time.minutes(hours * 60);
  },
  days: days => {
    'worklet';
    return time.hours(days * 24);
  },
  weeks: weeks => {
    'worklet';
    return time.days(weeks * 7);
  },
  infinity: Infinity,
  zero: 0,
};
