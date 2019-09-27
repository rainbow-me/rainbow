import { updatePrecisionToDisplay } from '../utilities';

test('updatePrecisionToDisplay', () => {
  const result = updatePrecisionToDisplay('0.00000000123', '0.1234987234');
  expect(result).toBe('0.000000001');
});

test('updatePrecisionToDisplay', () => {
  const result = updatePrecisionToDisplay('0.17987196800000002', '0.1234987234');
  expect(result).toBe('0.179');
});

test('updatePrecisionToDisplay', () => {
  const result = updatePrecisionToDisplay('0.123456789', '3.001');
  expect(result).toBe('0.123');
});

test('updatePrecisionToDisplay', () => {
  const result = updatePrecisionToDisplay('0.123456789', '32.0412');
  expect(result).toBe('0.1234');
});

test('updatePrecisionToDisplay', () => {
  const result = updatePrecisionToDisplay('0.123456789', '132.0051');
  expect(result).toBe('0.12345');
});

test('updatePrecisionToDisplay', () => {
  const result = updatePrecisionToDisplay('0.123456789', '1320.0112');
  expect(result).toBe('0.123456');
});
