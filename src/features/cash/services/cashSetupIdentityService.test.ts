import { isValidDateOfBirth, isValidLegalName } from './cashSetupIdentityService';

const TODAY = new Date(2026, 6, 13);

describe('isValidLegalName', () => {
  const cases = [
    { input: 'Ada', expected: true },
    { input: 'Jean-Luc', expected: true },
    { input: "O'Connor", expected: true },
    { input: 'María José', expected: true },
    { input: '  Ada  ', expected: true },
    { input: '', expected: false },
    { input: ' ', expected: false },
    { input: '-Ada', expected: false },
    { input: 'Ada-', expected: false },
    { input: 'Ada  Lovelace', expected: false },
    { input: 'Ada--Lovelace', expected: false },
    { input: 'Ada2', expected: false },
    { input: 'A'.repeat(101), expected: false },
  ];

  it.each(cases)('returns $expected for "$input"', ({ input, expected }) => {
    expect(isValidLegalName(input)).toBe(expected);
  });
});

describe('isValidDateOfBirth', () => {
  const cases = [
    { input: { year: 1990, month: 1, day: 2 }, expected: true },
    { input: { year: 2024, month: 2, day: 29 }, expected: true },
    { input: { year: 2023, month: 2, day: 29 }, expected: false },
    { input: { year: 2000, month: 4, day: 31 }, expected: false },
    { input: { year: 2000, month: 0, day: 1 }, expected: false },
    { input: { year: 2026, month: 7, day: 13 }, expected: false },
    { input: { year: 2026, month: 7, day: 14 }, expected: false },
  ];

  it.each(cases)('returns $expected for $input', ({ input, expected }) => {
    expect(isValidDateOfBirth(input, TODAY)).toBe(expected);
  });
});
