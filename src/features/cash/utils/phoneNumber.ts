export const US_COUNTRY_CALLING_CODE = '1';

export const NATIONAL_NUMBER_LENGTH = 10;

// Pasted or AutoFilled values may carry the +1 country code on top of the 10 national digits.
export function extractNationalDigits(text: string): string {
  let digits = text.replace(/\D/g, '');
  if (digits.length > NATIONAL_NUMBER_LENGTH && digits.startsWith(US_COUNTRY_CALLING_CODE)) {
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
