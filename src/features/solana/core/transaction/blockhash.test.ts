import { base58Encode, isSolanaAddress } from '../../address';
import { requireSolanaBlockhash } from './blockhash';

const REAL_BLOCKHASH = '5ev4GFkRqDDK8r1uvS593emEAmFShBV3pMb261idTwiy';
const REAL_ADDRESS = 'So11111111111111111111111111111111111111111';

describe('requireSolanaBlockhash', () => {
  it('accepts a blockhash a cluster actually returned', () => {
    expect(requireSolanaBlockhash(REAL_BLOCKHASH, 'unused')).toBe(REAL_BLOCKHASH);
  });

  it('accepts the two extremes of the 32-byte range', () => {
    const allZero = base58Encode(new Uint8Array(32));
    const allOnes = base58Encode(new Uint8Array(32).fill(0xff));
    expect(allZero).toHaveLength(32);
    expect(allOnes).toHaveLength(44);
    expect(requireSolanaBlockhash(allZero, 'unused')).toBe(allZero);
    expect(requireSolanaBlockhash(allOnes, 'unused')).toBe(allOnes);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['the empty string', ''],
    ['a 31-byte value', base58Encode(new Uint8Array(31).fill(0x11))],
    ['a 33-byte value', base58Encode(new Uint8Array(33).fill(0x11))],
    ['a 64-byte value, which is a signature', base58Encode(new Uint8Array(64).fill(0x11))],
    ['a non-base58 character', '0OIl' + REAL_BLOCKHASH.slice(4)],
  ])('rejects %s', (_label, value) => {
    expect(() => requireSolanaBlockhash(value, 'rejected')).toThrow('rejected');
  });

  /**
   * The reason this brand exists, asserted rather than described. If this test ever
   * fails, `SolanaAddress` has become able to reject a blockhash and the separate brand
   * could in principle be retired; nothing else about the design would change, because
   * the brand also records provenance.
   */
  it('is indistinguishable from an address by every syntactic check available', () => {
    expect(isSolanaAddress(REAL_BLOCKHASH)).toBe(true);
    expect(isSolanaAddress(REAL_ADDRESS)).toBe(true);
    expect(REAL_BLOCKHASH.length).toBeGreaterThanOrEqual(32);
    expect(REAL_BLOCKHASH.length).toBeLessThanOrEqual(44);
  });
});
