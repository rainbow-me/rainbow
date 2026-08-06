import { base58Encode } from '../../address';
import { isSolanaTransactionSignature, requireSolanaTransactionSignature, SOLANA_SIGNATURE_BYTE_LENGTH } from './signature';

const REAL_SIGNATURE = '2E2FuiUF2yUu9X8QpDhvQ3ZY1kzwJXH1NFGvmWbkB92EC21z2tVPfJ1mvRGe6Ryb6GTmHoGQbBhtLqJUD6dojiPX';

describe('isSolanaTransactionSignature', () => {
  it('accepts a signature a cluster actually returned', () => {
    expect(isSolanaTransactionSignature(REAL_SIGNATURE)).toBe(true);
  });

  it('accepts the two extremes of the 64-byte range', () => {
    const allZero = base58Encode(new Uint8Array(SOLANA_SIGNATURE_BYTE_LENGTH));
    const allOnes = base58Encode(new Uint8Array(SOLANA_SIGNATURE_BYTE_LENGTH).fill(0xff));
    expect(allZero).toHaveLength(64);
    expect(allOnes).toHaveLength(88);
    expect(isSolanaTransactionSignature(allZero)).toBe(true);
    expect(isSolanaTransactionSignature(allOnes)).toBe(true);
  });

  it('rejects a 32-byte value, which is what an address or a blockhash is', () => {
    expect(isSolanaTransactionSignature(base58Encode(new Uint8Array(32).fill(0x11)))).toBe(false);
  });

  it.each([
    ['a 63-byte value', 63],
    ['a 65-byte value', 65],
  ])('rejects %s', (_label, byteLength) => {
    expect(isSolanaTransactionSignature(base58Encode(new Uint8Array(byteLength as number).fill(0x11)))).toBe(false);
  });

  it('rejects the empty string and non-base58 characters', () => {
    expect(isSolanaTransactionSignature('')).toBe(false);
    expect(isSolanaTransactionSignature('0OIl' + REAL_SIGNATURE.slice(4))).toBe(false);
  });

  it('bounds length before decoding, so a huge paste cannot cost a quadratic decode', () => {
    const started = Date.now();
    expect(isSolanaTransactionSignature('1'.repeat(200_000))).toBe(false);
    expect(Date.now() - started).toBeLessThan(50);
  });
});

describe('requireSolanaTransactionSignature', () => {
  it('returns the signature it validated', () => {
    expect(requireSolanaTransactionSignature(REAL_SIGNATURE, 'unused')).toBe(REAL_SIGNATURE);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['the empty string', ''],
    ['a 32-byte value', base58Encode(new Uint8Array(32).fill(0x11))],
  ])('throws the caller message for %s', (_label, value) => {
    expect(() => requireSolanaTransactionSignature(value, 'rejected')).toThrow('rejected');
  });
});
