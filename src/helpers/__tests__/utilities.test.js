import {
  convertBipsToPercentage,
  handleSignificantDecimals,
  updatePrecisionToDisplay,
} from '../utilities';

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

it('convertBipsToPercentage', () => {
  const result = convertBipsToPercentage('12.34567', 2);
  expect(result).toBe('0.12');
});

it('updatePrecisionToDisplay1', () => {
  const result = updatePrecisionToDisplay('0.00000000123', '0.1234987234');
  expect(result).toBe('0.000000001');
});

it('updatePrecisionToDisplay2', () => {
  const result = updatePrecisionToDisplay(
    '0.17987196800000002',
    '0.1234987234'
  );
  expect(result).toBe('0.179');
});

it('updatePrecisionToDisplay3', () => {
  const result = updatePrecisionToDisplay('0.123456789', '3.001');
  expect(result).toBe('0.123');
});

it('updatePrecisionToDisplay4', () => {
  const result = updatePrecisionToDisplay('0.123456789', '32.0412');
  expect(result).toBe('0.1234');
});

it('updatePrecisionToDisplay5', () => {
  const result = updatePrecisionToDisplay('0.123456789', '132.0051');
  expect(result).toBe('0.12345');
});

it('updatePrecisionToDisplay6', () => {
  const result = updatePrecisionToDisplay('0.123456789', '1320.0112');
  expect(result).toBe('0.123456');
});
