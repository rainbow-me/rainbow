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
    return minutes * 60 * 1000;
  },
  hours: hours => {
    'worklet';
    return hours * 60 * 60 * 1000;
  },
  days: days => {
    'worklet';
    return days * 24 * 60 * 60 * 1000;
  },
  weeks: weeks => {
    'worklet';
    return weeks * 7 * 24 * 60 * 60 * 1000;
  },
  infinity: Infinity,
  zero: 0,
};
