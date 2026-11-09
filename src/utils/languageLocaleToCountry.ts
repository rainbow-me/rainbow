import { type Language } from '@/languages/types';

/**
 * Converts a language locale to a country code.
 * @param languageLocale - The language locale to convert.
 * @returns The country code.
 */
export const languageLocaleToCountry = (languageLocale: Language) => {
  const [languageCode, countryCode] = languageLocale.split('_');

  // For es_419, use 'es' rather than the numeric region.
  if (Number(countryCode)) {
    return languageCode;
  }
  return countryCode;
};
