/**
 * Normalizes Go timestamps to JavaScript-parseable ISO-8601 format.
 * Returns undefined for Go's zero time value (time.Time{}) which starts with "0001-01-".
 *
 * Converts: "2018-11-24 21:45:52 +0000 UTC" → "2018-11-24T21:45:52+00:00"
 */
export function normalizeDate(value: string | Date | undefined): string | undefined {
  if (!value) return undefined;

  const str = value instanceof Date ? value.toISOString() : value;

  // Check for Go zero time (time.Time{})
  if (str.startsWith('0001-01-')) return undefined;

  // Already normalized if it's from a Date object
  if (value instanceof Date) return str;

  // Normalize Go format to JS-parseable ISO-8601
  return (
    str
      // Remove the literal "UTC" zone name
      .replace(' UTC', '')
      // Replace first space with T separator
      .replace(' ', 'T')
      // Remove space before offset
      .replace(' +', '+')
      .replace(' -', '-')
      // Add colon to offset: +0000 → +00:00
      .replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
  );
}
