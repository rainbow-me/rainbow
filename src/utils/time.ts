export const time = {
  seconds: (n: number) => n * 1000,
  minutes: (n: number) => time.seconds(n * 60),
  hours: (n: number) => time.minutes(n * 60),
  days: (n: number) => time.hours(n * 24),
  weeks: (n: number) => time.days(n * 7),
  infinity: Infinity,
  zero: 0,
};
