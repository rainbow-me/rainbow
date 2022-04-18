type Matcher = [boolean, any];

export default function match(defaultValue: any, ...matchers: Matcher[]): any {
  for (const [condition, value] of matchers) {
    if (condition) {
      return value;
    }
  }

  return defaultValue;
}
