import { normalizeDappName } from '../../../../stores/transform/utils/dapp';

describe('normalizeDappName', () => {
  it('should remove version suffix with lowercase v', () => {
    expect(normalizeDappName('Uniswap v3')).toBe('Uniswap');
    expect(normalizeDappName('Aave v2')).toBe('Aave');
    expect(normalizeDappName('Compound v1')).toBe('Compound');
  });

  it('should remove version suffix with uppercase V', () => {
    expect(normalizeDappName('Uniswap V3')).toBe('Uniswap');
    expect(normalizeDappName('Aave V2')).toBe('Aave');
    expect(normalizeDappName('Compound V10')).toBe('Compound');
  });

  it('should handle multiple spaces before version', () => {
    expect(normalizeDappName('Uniswap   v3')).toBe('Uniswap');
    expect(normalizeDappName('Aave     V2')).toBe('Aave');
    expect(normalizeDappName('Compound  v1')).toBe('Compound');
  });

  it('should preserve names without version suffix', () => {
    expect(normalizeDappName('Uniswap')).toBe('Uniswap');
    expect(normalizeDappName('Aave')).toBe('Aave');
    expect(normalizeDappName('Compound')).toBe('Compound');
    expect(normalizeDappName('1inch')).toBe('1inch');
  });

  it('should not remove v in the middle of the name', () => {
    expect(normalizeDappName('Curve')).toBe('Curve');
    expect(normalizeDappName('Convex')).toBe('Convex');
    expect(normalizeDappName('Harvest Finance')).toBe('Harvest Finance');
  });

  it('should handle edge cases', () => {
    expect(normalizeDappName('')).toBe('');
    expect(normalizeDappName(' ')).toBe('');
    expect(normalizeDappName('v3')).toBe('v3'); // Just version, no name
    expect(normalizeDappName('V3')).toBe('V3');
  });

  it('should trim spaces and handle versions correctly', () => {
    // Spaces are trimmed, but version suffix only removed if at the very end before trim
    expect(normalizeDappName('  Uniswap v3  ')).toBe('Uniswap v3'); // Spaces prevent version detection
    expect(normalizeDappName('  Aave  ')).toBe('Aave');
    expect(normalizeDappName('  Compound V2   ')).toBe('Compound V2'); // Spaces prevent version detection

    // Version suffix is removed when it's truly at the end of the string
    expect(normalizeDappName('Uniswap v3')).toBe('Uniswap');
    expect(normalizeDappName('  Uniswap v3')).toBe('Uniswap'); // Leading spaces don't matter
    expect(normalizeDappName('  Compound V2')).toBe('Compound');
  });

  it('should handle multiple digit versions', () => {
    expect(normalizeDappName('Protocol v10')).toBe('Protocol');
    expect(normalizeDappName('DApp V999')).toBe('DApp');
    expect(normalizeDappName('Contract v1234567890')).toBe('Contract');
  });

  it('should only remove version at the end', () => {
    expect(normalizeDappName('v3 Protocol')).toBe('v3 Protocol');
    expect(normalizeDappName('V2 Lending')).toBe('V2 Lending');
    expect(normalizeDappName('Version v1 Protocol v2')).toBe('Version v1 Protocol');
  });

  it('should preserve case in the name', () => {
    expect(normalizeDappName('UniSwap v3')).toBe('UniSwap');
    expect(normalizeDappName('AAVE V2')).toBe('AAVE');
    expect(normalizeDappName('compound v1')).toBe('compound');
  });

  it('should handle special characters in names', () => {
    expect(normalizeDappName('1inch v2')).toBe('1inch');
    expect(normalizeDappName('0x Protocol v4')).toBe('0x Protocol');
    expect(normalizeDappName('Yearn.Finance v2')).toBe('Yearn.Finance');
    expect(normalizeDappName('Mai-Finance v3')).toBe('Mai-Finance');
  });

  it('should not be affected by case sensitivity in version prefix', () => {
    expect(normalizeDappName('Protocol v3')).toBe('Protocol');
    expect(normalizeDappName('Protocol V3')).toBe('Protocol');
    expect(normalizeDappName('Protocol vV3')).toBe('Protocol vV3'); // Weird case, but should handle it
  });
});
