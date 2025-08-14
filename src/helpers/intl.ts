/* eslint-disable no-var */

declare global {
  /* In worklets we cannot use closure variables, so we use globalThis to store the cache. */
  var _dateFormatterCache: Partial<Record<string, Intl.DateTimeFormat>> | undefined;
  var _numberFormatterCache: Partial<Record<string, Intl.NumberFormat>> | undefined;
}

function getStableKey(locale: string | undefined, options: Intl.DateTimeFormatOptions | Intl.NumberFormatOptions | undefined): string {
  'worklet';
  if (!options) return `${locale ?? ''}|{}`;

  const sorted: Record<string, unknown> = Object.create(null);

  for (const key of Object.keys(options).sort()) {
    const value = options[key as keyof typeof options];
    if (value !== undefined) sorted[key] = value;
  }
  return `${locale ?? ''}|${JSON.stringify(sorted)}`;
}

/**
 * Get a cached instance of `Intl.DateTimeFormat`.
 */
export function getDateFormatter(locale?: string, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  'worklet';
  globalThis._dateFormatterCache ??= {};

  const key = getStableKey(locale, options);
  let formatter = globalThis._dateFormatterCache[key];

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    globalThis._dateFormatterCache[key] = formatter;
  }
  return formatter;
}

/**
 * Get a cached instance of `Intl.NumberFormat`.
 */
export function getNumberFormatter(locale?: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  'worklet';
  globalThis._numberFormatterCache ??= {};

  const key = getStableKey(locale, options);
  let formatter = globalThis._numberFormatterCache[key];

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    globalThis._numberFormatterCache[key] = formatter;
  }
  return formatter;
}
