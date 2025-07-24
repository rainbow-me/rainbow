/**
 * Get a cached instance of Intl.NumberFormat. For best performance keep option keys sorted.
 */
export function getNumberFormatter(locale?: string, options: Intl.NumberFormatOptions = {}): Intl.NumberFormat {
  'worklet';

  // In worklets we cannot use closure variables so use globalThis to store the cache.
  const g = globalThis as typeof globalThis & { __numberFormatterCache?: Record<string, Intl.NumberFormat> };
  g.__numberFormatterCache = g.__numberFormatterCache || {};

  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = g.__numberFormatterCache[key];
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    g.__numberFormatterCache[key] = formatter;
  }

  return formatter;
}

/**
 * Get a cached instance of Intl.DateTimeFormat. For best performance keep option keys sorted.
 */
export function getDateFormatter(locale?: string, options: Intl.DateTimeFormatOptions = {}): Intl.DateTimeFormat {
  'worklet';

  // In worklets we cannot use closure variables so use globalThis to store the cache.
  const g = globalThis as typeof globalThis & { __dateFormatterCache?: Record<string, Intl.DateTimeFormat> };
  g.__dateFormatterCache = g.__dateFormatterCache || {};

  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = g.__dateFormatterCache[key];
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    g.__dateFormatterCache[key] = formatter;
  }

  return formatter;
}
