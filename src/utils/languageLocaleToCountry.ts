import { Language } from '@/languages';

/**
 * Converts a language locale to a country code.
 * @param languageLocale - The language locale to convert.
 * @returns The country code.
 */
export const languageLocaleToCountry = (languageLocale: keyof typeof Language) => {
  const [languageCode, countryCode] = languageLocale.split('_');

  // e.g. - ES_419 we want to return ES instead of 419
  if (Number(countryCode)) {
    return languageCode;
  }
  return countryCode;
};
