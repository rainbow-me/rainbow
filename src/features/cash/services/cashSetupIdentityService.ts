import { isExists, startOfDay } from 'date-fns';

import { type CashSetupDateOfBirth } from '../stores/cashSetupSessionStore';

const MAX_LEGAL_NAME_LENGTH = 100;
const LEGAL_NAME_PATTERN = /^\p{L}+(?:[ '-]\p{L}+)*$/u;

export function isValidLegalName(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length <= MAX_LEGAL_NAME_LENGTH && LEGAL_NAME_PATTERN.test(trimmed);
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
