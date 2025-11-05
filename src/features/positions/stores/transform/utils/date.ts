/**
 * Normalizes Go timestamps to JavaScript-parseable ISO-8601 format.
 * Returns undefined for Go's zero time value (time.Time{}) which starts with "0001-01-".
 *
 * Converts: "2018-11-24 21:45:52 +0000 UTC" → "2018-11-24T21:45:52+00:00"
 */
export function normalizeDate(value: string | undefined): string | undefined {
  if (!value) return undefined;

  // Check for Go zero time (time.Time{})
  if (value.startsWith('0001-01-')) return undefined;

  // Normalize Go format to JS-parseable ISO-8601
  return (
    value
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

/**
 * Normalizes Go timestamp strings and returns its timestamp.
 * Returns undefined for invalid dates or Go's zero time.
 */
export function normalizeDateTime(value: string | undefined): number | undefined {
  if (!value) return undefined;

  const normalized = normalizeDate(value);
  if (!normalized) return undefined;

  const date = new Date(normalized);
  const time = date.getTime();
  return isNaN(time) ? undefined : time;
}
