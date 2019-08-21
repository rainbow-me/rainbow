import { determinePrecisionToDisplay } from '../utilities';

test('determinePrecisionToDisplay', () => {
  const result = determinePrecisionToDisplay('0.123456789', '3.00');
  expect(result).toBe('0.123');
});

test('determinePrecisionToDisplay', () => {
  const result = determinePrecisionToDisplay('0.123456789', '32.04');
  expect(result).toBe('0.1235');
});

test('determinePrecisionToDisplay', () => {
  const result = determinePrecisionToDisplay('0.123456789', '132.00');
  expect(result).toBe('0.12346');
});

test('determinePrecisionToDisplay', () => {
  const result = determinePrecisionToDisplay('0.123456789', '1320.00');
  expect(result).toBe('0.123457');
});

