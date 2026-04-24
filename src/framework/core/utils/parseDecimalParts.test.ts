import { parseDecimalParts } from './parseDecimalParts';

const testCases = [
  { value: '123', expected: { whole: '123', fractionalSuffix: '' } },
  { value: '-123', expected: { whole: '-123', fractionalSuffix: '' } },
  { value: '123.45', expected: { whole: '123', fractionalSuffix: '.45' } },
  { value: '-123.45', expected: { whole: '-123', fractionalSuffix: '.45' } },
  { value: '.45', expected: { whole: '', fractionalSuffix: '.45' } },
  { value: '123.', expected: { whole: '123', fractionalSuffix: '.' } },
  { value: '1.2.3', expected: { whole: '1.2', fractionalSuffix: '.3' } },
];

describe('parseDecimalParts', () => {
  testCases.forEach(({ value, expected }) => {
    it(`parses ${value}`, () => {
      expect(parseDecimalParts(value)).toEqual(expected);
    });
  });
});
