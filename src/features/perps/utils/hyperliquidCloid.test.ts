import { isHex } from 'viem';
import { decodeLeverageFromCloid, generateCloid } from '@/features/perps/utils/hyperliquidCloid';

describe('generateCloid', () => {
  it('returns a valid 34-char hex string with rb marker', () => {
    const cloid = generateCloid(10);
    expect(cloid).toHaveLength(34);
    expect(isHex(cloid)).toBe(true);
    expect(cloid.slice(2, 6)).toBe('7262');
  });
});

describe('decodeLeverageFromCloid', () => {
  it('round-trips with generateCloid', () => {
    for (const lev of [1, 1.5, 10, 50]) {
      expect(decodeLeverageFromCloid(generateCloid(lev))).toBe(lev);
    }
  });

  it('decodes a known hardcoded cloid', () => {
    expect(decodeLeverageFromCloid('0x726203e8aabbccddeeff001122334455')).toBe(10);
  });

  it('returns null for invalid input', () => {
    expect(decodeLeverageFromCloid(null)).toBeNull();
    expect(decodeLeverageFromCloid('0x7262')).toBeNull();
    expect(decodeLeverageFromCloid('0xdead03e8aabbccddeeff001122334455')).toBeNull();
  });
});
