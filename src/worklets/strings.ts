/**
 * Generates a short string with sufficient randomness for use as a unique ID.
 */
export function generateUniqueId(): string {
  'worklet';
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).slice(2, 7);
  return `${timestamp}${randomString}`;
}

/**
 * Returns a pluralized (by default: `word` + `'s'`) string based on the count.
 *
 * `word` should be provided in singular form.
 */
export function pluralize(word: string, count: number, pluralSuffix = 's'): string {
  'worklet';
  return count === 1 ? word : `${word}${pluralSuffix}`;
}
