import { isExists, startOfDay } from 'date-fns';

export type CashSetupDateOfBirth = {
  year: number;
  month: number;
  day: number;
};

export type CashSetupIdentity = {
  firstName: string;
  lastName: string;
  dateOfBirth: CashSetupDateOfBirth;
};

export type CashSetupIdentityDraft = Omit<CashSetupIdentity, 'dateOfBirth'> & {
  dateOfBirth: CashSetupDateOfBirth | null;
};

export type CashSetupGovernmentIdKind = 'GOVERNMENT_ID_KIND_SSN_LAST4';

declare const cashSetupUsSsnLast4Brand: unique symbol;

export type CashSetupUsSsnLast4 = string & { readonly [cashSetupUsSsnLast4Brand]: true };

export type CashSetupGovernmentId = {
  countryCode: 'US';
  kind: CashSetupGovernmentIdKind;
  value: CashSetupUsSsnLast4;
};

const MAX_LEGAL_NAME_LENGTH = 100;
const LEGAL_NAME_PATTERN = /^\p{L}+(?:[ '-]\p{L}+)*$/u;

export function isValidLegalName(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length <= MAX_LEGAL_NAME_LENGTH && LEGAL_NAME_PATTERN.test(trimmed);
}

export function createCashSetupIdentity({ firstName, lastName, dateOfBirth }: CashSetupIdentityDraft): CashSetupIdentity | null {
  if (!isValidLegalName(firstName) || !isValidLegalName(lastName) || !dateOfBirth || !isValidDateOfBirth(dateOfBirth)) return null;
  return { firstName: firstName.trim(), lastName: lastName.trim(), dateOfBirth };
}

export function isValidDateOfBirth(dateOfBirth: CashSetupDateOfBirth, today = new Date()): boolean {
  const { year, month, day } = dateOfBirth;
  return isExists(year, month - 1, day) && toDate(dateOfBirth) < startOfDay(today);
}

export function toDate(dateOfBirth: CashSetupDateOfBirth): Date {
  return new Date(dateOfBirth.year, dateOfBirth.month - 1, dateOfBirth.day);
}

export function toDateOfBirth(date: Date): CashSetupDateOfBirth {
  return {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

export function formatDateOfBirth({ year, month, day }: CashSetupDateOfBirth): string {
  return `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`;
}

export const US_COUNTRY_CODE = 'US';

const US_SSN_LAST4_PATTERN = /^\d{4}$/;

export function isValidUsSsnLast4(value: string): value is CashSetupUsSsnLast4 {
  // An SSN serial of 0000 is never issued.
  return US_SSN_LAST4_PATTERN.test(value) && value !== '0000';
}

export function formatUsSsnMasked(last4: string): string {
  return `*** ** ${last4}`;
}

export function createUsSsnLast4GovernmentId(last4: CashSetupUsSsnLast4): CashSetupGovernmentId {
  return { countryCode: US_COUNTRY_CODE, kind: 'GOVERNMENT_ID_KIND_SSN_LAST4', value: last4 };
}
