import { formatUsSsnMasked, isValidDateOfBirth, isValidLegalName, isValidUsSsnLast4 } from './cashSetupIdentityService';

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

describe('isValidUsSsnLast4', () => {
  const cases = [
    { input: '6789', expected: true },
    { input: '0001', expected: true },
    { input: '678', expected: false },
    { input: '67890', expected: false },
    { input: '67a9', expected: false },
    { input: '67 9', expected: false },
    { input: '0000', expected: false },
    { input: '', expected: false },
  ];

  it.each(cases)('returns $expected for "$input"', ({ input, expected }) => {
    expect(isValidUsSsnLast4(input)).toBe(expected);
  });
});

describe('formatUsSsnMasked', () => {
  it('masks all but the last 4 digits', () => {
    expect(formatUsSsnMasked('6789')).toBe('*** ** 6789');
  });
});
