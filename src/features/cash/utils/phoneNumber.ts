export const US_COUNTRY_CALLING_CODE = '1';

export const NATIONAL_NUMBER_LENGTH = 10;

/**
 * Returns up to 10 digits from a US phone number, removing a leading
 * country code from longer input.
 */
export function extractNationalDigits(text: string): string {
  const trimmedText = text.trimStart();
  const hasCountryCallingCodePrefix =
    trimmedText.startsWith(US_COUNTRY_CALLING_CODE) || trimmedText.startsWith(`+${US_COUNTRY_CALLING_CODE}`);

  let digits = text.replace(/\D/g, '');
  if (digits.length > NATIONAL_NUMBER_LENGTH && hasCountryCallingCodePrefix) {
    digits = digits.slice(US_COUNTRY_CALLING_CODE.length);
  }

  return digits.slice(0, NATIONAL_NUMBER_LENGTH);
}

export function formatNationalNumber(digits: string): string {
  if (!digits) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
