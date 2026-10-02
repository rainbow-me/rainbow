export const US_COUNTRY_CALLING_CODE = '1';

export const NATIONAL_NUMBER_LENGTH = 10;

const PHONE_FORMATTING = /[\s().-]/g;
const COUNTRY_CODE_PREFIX = /^\s*(?:1|\(\s*1\s*\))/;
const DIGITS_ONLY = /^\d*$/;

/**
 * Normalizes edits for the +1 phone field, preserving incomplete numbers.
 * Returns null for unsupported input or excess national digits.
 */
export function extractNationalDigits(text: string): string | null {
  let input = text.replace(PHONE_FORMATTING, '');

  if (input.startsWith('+1')) {
    input = input.slice(2);
  } else if (input.length === NATIONAL_NUMBER_LENGTH + 1 && COUNTRY_CODE_PREFIX.test(text)) {
    input = input.slice(1);
  }

  return input.length <= NATIONAL_NUMBER_LENGTH && DIGITS_ONLY.test(input) ? input : null;
}

export function formatNationalNumber(digits: string): string {
  if (!digits) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
