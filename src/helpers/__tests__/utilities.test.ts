import {
  addDisplay,
  convertAmountFromNativeValue,
  convertBipsToPercentage,
  handleSignificantDecimals,
  updatePrecisionToDisplay,
} from '../utilities';

it('convertAmountFromNativeValue', () => {
  const result = convertAmountFromNativeValue('1', '40.00505', 5);
  expect(result).toBe('0.02499');
});

it('convertAmountFromNativeValue with trailing zeros', () => {
  const result = convertAmountFromNativeValue('1', '1', 5);
  expect(result).toBe('1');
});

it('handleSignificantDecimals greater than 1, decimals 2', () => {
  const result = handleSignificantDecimals('5.123', 2);
  expect(result).toBe('5.12');
});

it('handleSignificantDecimals greater than 1, decimals 18', () => {
  const result = handleSignificantDecimals('5.1234', 18);
  expect(result).toBe('5.123');
});

it('handleSignificantDecimals greater than 1, decimals 18, long trail', () => {
  const result = handleSignificantDecimals('5.00001234', 18);
  expect(result).toBe('5.00');
});

it('handleSignificantDecimals less than 1 and few decimals', () => {
  const result = handleSignificantDecimals('0.012344', 2);
  expect(result).toBe('0.0123');
});

it('handleSignificantDecimals less than 1 and many decimals', () => {
  const result = handleSignificantDecimals('0.00000000123', 18);
  expect(result).toBe('0.00');
});

it('convertBipsToPercentage, 2 decimal places', () => {
  const result = convertBipsToPercentage('1', 2);
  expect(result).toBe('0.01');
});

it('convertBipsToPercentage, 1 decimal place', () => {
  const result = convertBipsToPercentage('1', 1);
  expect(result).toBe('0.0');
});

it('convertBipsToPercentage, 10 bips to 1 decimal', () => {
  const result = convertBipsToPercentage('10', 1);
  expect(result).toBe('0.1');
});

it('convertBipsToPercentage, returns 0 when given nullish value', () => {
  const result = convertBipsToPercentage(null, 1);
  expect(result).toBe('0');
});

it('convertBipsToPercentage', () => {
  const result = convertBipsToPercentage('12.34567', 2);
  expect(result).toBe('0.12');
});

it('updatePrecisionToDisplay1', () => {
  const result = updatePrecisionToDisplay('0.00000000123', '0.1234987234');
  expect(result).toBe('0.000000001');
});

it('updatePrecisionToDisplay1RoundUp', () => {
  const result = updatePrecisionToDisplay('0.00000000123', '0.1234987234', true);
  expect(result).toBe('0.000000002');
});

it('updatePrecisionToDisplay2', () => {
  const result = updatePrecisionToDisplay('0.17987196800000002', '0.1234987234');
  expect(result).toBe('0.179');
});

it('updatePrecisionToDisplay2RoundUp', () => {
  const result = updatePrecisionToDisplay('0.17987196800000002', '0.1234987234', true);
  expect(result).toBe('0.18');
});

it('updatePrecisionToDisplay3', () => {
  const result = updatePrecisionToDisplay('0.123456789', '3.001');
  expect(result).toBe('0.123');
});

it('updatePrecisionToDisplay3RoundUp', () => {
  const result = updatePrecisionToDisplay('0.123456789', '3.001', true);
  expect(result).toBe('0.124');
});

it('updatePrecisionToDisplay4', () => {
  const result = updatePrecisionToDisplay('0.123456789', '32.0412');
  expect(result).toBe('0.1234');
});

it('updatePrecisionToDisplay4RoundUp', () => {
  const result = updatePrecisionToDisplay('0.123456789', '32.0412', true);
  expect(result).toBe('0.1235');
});

it('updatePrecisionToDisplay5', () => {
  const result = updatePrecisionToDisplay('0.123456789', '132.0051');
  expect(result).toBe('0.12345');
});

it('updatePrecisionToDisplay5RoundUp', () => {
  const result = updatePrecisionToDisplay('0.123456789', '132.0051', true);
  expect(result).toBe('0.12346');
});

it('updatePrecisionToDisplay6', () => {
  const result = updatePrecisionToDisplay('0.123456789', '1320.0112');
  expect(result).toBe('0.123456');
});

it('updatePrecisionToDisplay6RoundUp', () => {
  const result = updatePrecisionToDisplay('0.123456789', '1320.0112', true);
  expect(result).toBe('0.123457');
});

it('addDisplay', () => {
  const result = addDisplay('$150.50', '$912.21');
  expect(result).toBe('$1,062.71');
});

it('addDisplay with left-aligned currency', () => {
  const result = addDisplay('A$150.50', 'A$912.21');
  expect(result).toBe('A$1,062.71');
});

it('addDisplay with right-aligned currency', () => {
  const result = addDisplay('150.50₽', '912.21₽');
  expect(result).toBe('1,062.71₽');
});
