import { updatePrecisionToDisplay } from '../utilities';

test('updatePrecisionToDisplay', () => {
  const result = updatePrecisionToDisplay('0.17987196800000002', '0.17987196800000002');
  expect(result).toBe('0.18');
});

test('updatePrecisionToDisplay', () => {
  const result = updatePrecisionToDisplay('0.123456789', '3.001');
  expect(result).toBe('0.123');
});

test('updatePrecisionToDisplay', () => {
  const result = updatePrecisionToDisplay('0.123456789', '32.0412');
  expect(result).toBe('0.1235');
});

test('updatePrecisionToDisplay', () => {
  const result = updatePrecisionToDisplay('0.123456789', '132.0051');
  expect(result).toBe('0.12346');
});

test('updatePrecisionToDisplay', () => {
  const result = updatePrecisionToDisplay('0.123456789', '1320.0112');
  expect(result).toBe('0.123457');
});

