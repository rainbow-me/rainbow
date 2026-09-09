import { formatNormalizedPercentChange, parseNormalizedPercentChange } from './formatPriceChange';

describe('formatNormalizedPercentChange', () => {
  it('formats a positive percent string', () => {
    expect(formatNormalizedPercentChange('5.23')).toBe('5.23%');
  });

  it('formats zero as 0.00%', () => {
    expect(formatNormalizedPercentChange('0')).toBe('0.00%');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatNormalizedPercentChange('5.239')).toBe('5.24%');
  });

  it('returns 0.00% for empty string', () => {
    expect(formatNormalizedPercentChange('')).toBe('0.00%');
  });

  it('returns 0.00% for NaN string', () => {
    expect(formatNormalizedPercentChange('NaN')).toBe('0.00%');
  });

  it('uses absolute value for negatives (arrow conveys direction)', () => {
    expect(formatNormalizedPercentChange('-3.5')).toBe('3.50%');
  });

  it('accepts a number argument', () => {
    expect(formatNormalizedPercentChange(7.1)).toBe('7.10%');
  });

  it('handles numeric zero', () => {
    expect(formatNormalizedPercentChange(0)).toBe('0.00%');
  });
});

describe('parseNormalizedPercentChange', () => {
  it('strips % and returns a number', () => {
    expect(parseNormalizedPercentChange('5.23%')).toBe(5.23);
  });

  it('handles string without % suffix', () => {
    expect(parseNormalizedPercentChange('5.23')).toBe(5.23);
  });

  it('returns 0 for empty string', () => {
    expect(parseNormalizedPercentChange('')).toBe(0);
  });
});
