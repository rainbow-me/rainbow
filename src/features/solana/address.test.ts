import { base58Decode, base58Encode, isSolanaAddress, requireSolanaAddress, SOLANA_ADDRESS_BYTE_LENGTH } from './address';

/**
 * Every address below is a value one of Rainbow's own contracts documents: the
 * account and mint examples come from the balances schema and the native reference
 * from the shared CAIP definitions.
 */
const SOLANA_ACCOUNT = '7nYabs9dUhvxYwdTnrWVBL9MYviKSfrEbdWCUbcarwQj';
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const NATIVE_SOL_REFERENCE = 'So11111111111111111111111111111111111111111';
const SOLANA_CAIP2_REFERENCE = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';

describe('base58Decode', () => {
  it('decodes Rainbow-documented Solana addresses to 32 bytes', () => {
    expect(base58Decode(SOLANA_ACCOUNT)).toHaveLength(SOLANA_ADDRESS_BYTE_LENGTH);
    expect(base58Decode(USDC_MINT)).toHaveLength(SOLANA_ADDRESS_BYTE_LENGTH);
    expect(base58Decode(NATIVE_SOL_REFERENCE)).toHaveLength(SOLANA_ADDRESS_BYTE_LENGTH);
  });

  it('decodes a leading 1 to a leading zero byte', () => {
    expect(base58Decode('1'.repeat(32))).toEqual(new Uint8Array(32));
    expect(base58Decode('12')).toEqual(new Uint8Array([0, 1]));
  });

  it('returns null for characters outside the base58 alphabet', () => {
    for (const excluded of ['0', 'O', 'I', 'l']) {
      expect(base58Decode(`${excluded}${SOLANA_ACCOUNT.slice(1)}`)).toBeNull();
    }
    expect(base58Decode('')).toBeNull();
  });

  it('decodes known byte sequences', () => {
    expect(base58Decode('2g')).toEqual(new Uint8Array([97]));
    expect(base58Decode('StV1DL6CwTryKyV')).toEqual(new Uint8Array([...Buffer.from('hello world')]));
  });
});

describe('base58Encode', () => {
  /**
   * The System Program address is 32 zero bytes, and it is the one input where an
   * off-by-one in the leading-zero handling is invisible everywhere else: an
   * accumulator seeded with a single zero digit produces 33 characters instead of
   * 32. Every native SOL transfer names this address, so the case is load-bearing
   * rather than a curiosity.
   */
  const SYSTEM_PROGRAM = '1'.repeat(32);

  it('round-trips Rainbow-documented Solana addresses', () => {
    for (const address of [SOLANA_ACCOUNT, USDC_MINT, NATIVE_SOL_REFERENCE]) {
      expect(base58Encode(base58Decode(address) as Uint8Array)).toBe(address);
    }
  });

  it('encodes 32 zero bytes as the 32-character System Program address', () => {
    expect(base58Encode(new Uint8Array(32))).toBe(SYSTEM_PROGRAM);
    expect(base58Encode(new Uint8Array(32))).toHaveLength(32);
  });

  it('encodes each leading zero byte as one leading 1', () => {
    expect(base58Encode(new Uint8Array([0]))).toBe('1');
    expect(base58Encode(new Uint8Array([0, 0]))).toBe('11');
    expect(base58Encode(new Uint8Array([0, 1]))).toBe('12');
  });

  it('encodes known byte sequences', () => {
    expect(base58Encode(new Uint8Array([97]))).toBe('2g');
    expect(base58Encode(new Uint8Array([...Buffer.from('hello world')]))).toBe('StV1DL6CwTryKyV');
  });

  it('encodes empty input as empty, which base58Decode then rejects', () => {
    expect(base58Encode(new Uint8Array())).toBe('');
    expect(base58Decode('')).toBeNull();
  });

  it('round-trips every byte value in both leading and trailing position', () => {
    for (let byte = 0; byte < 256; byte++) {
      const leading = new Uint8Array([byte, 0x2a, 0xff]);
      const trailing = new Uint8Array([0x2a, 0xff, byte]);
      expect(base58Decode(base58Encode(leading))).toEqual(leading);
      expect(base58Decode(base58Encode(trailing))).toEqual(trailing);
    }
  });
});

describe('isSolanaAddress', () => {
  it('accepts 32-byte base58 values', () => {
    expect(isSolanaAddress(SOLANA_ACCOUNT)).toBe(true);
    expect(isSolanaAddress(USDC_MINT)).toBe(true);
  });

  it('rejects the CAIP-2 chain reference, which is a truncated genesis hash rather than an address', () => {
    expect(isSolanaAddress(SOLANA_CAIP2_REFERENCE)).toBe(false);
  });

  it('rejects hex addresses and short or long base58', () => {
    expect(isSolanaAddress('0x1234567890123456789012345678901234567890')).toBe(false);
    expect(isSolanaAddress(SOLANA_ACCOUNT.slice(0, 20))).toBe(false);
    expect(isSolanaAddress(SOLANA_ACCOUNT + SOLANA_ACCOUNT)).toBe(false);
  });

  it('is case sensitive, so a lowercased Solana address stops being one', () => {
    expect(isSolanaAddress(SOLANA_ACCOUNT.toLowerCase())).toBe(false);
  });

  /**
   * 32 bytes encode to between 32 and 44 base58 characters, so anything outside that
   * range is refused on length. This is what keeps the guard cheap: decoding is
   * quadratic in the input length, and this function is the natural gate for a
   * pasted recipient address of arbitrary length.
   */
  it('rejects on length before decoding, so a hostile paste cannot block the thread', () => {
    const hostile = 'z'.repeat(100_000);
    const startedAt = Date.now();
    expect(isSolanaAddress(hostile)).toBe(false);
    /*
     * A budget rather than a measurement. Decoding this input takes seconds, so any
     * threshold well under a second distinguishes "rejected on length" from
     * "decoded"; 200 ms leaves room for a loaded machine while staying two orders of
     * magnitude below the cost this guards against.
     */
    expect(Date.now() - startedAt).toBeLessThan(200);
  });

  it('accepts both ends of the length range a 32-byte value can encode to', () => {
    const shortest = base58Encode(new Uint8Array(32));
    const longest = base58Encode(new Uint8Array(32).fill(0xff));
    expect(shortest).toHaveLength(32);
    expect(longest).toHaveLength(44);
    expect(isSolanaAddress(shortest)).toBe(true);
    expect(isSolanaAddress(longest)).toBe(true);
  });

  /**
   * A character outside Latin-1 must be refused rather than skipped. `base-x`, which
   * `bs58` wraps, indexes a 256-entry table by UTF-16 code unit and treats the
   * out-of-bounds `undefined` as valid, so it silently drops the character: prefixing
   * a homoglyph to the wrapped SOL mint yields a 44-character string that decodes to
   * the mint's own key. Rainbow's codec must not, and the case is pinned here so a
   * future change of the underlying library cannot reintroduce it quietly.
   */
  it('rejects a homoglyph-prefixed address that a skipping decoder would accept', () => {
    const cyrillicA = 'А';
    const forged = `${cyrillicA}${NATIVE_SOL_REFERENCE}`;
    expect(forged).toHaveLength(44);
    expect(isSolanaAddress(forged)).toBe(false);
    expect(base58Decode(forged)).toBeNull();
  });

  it('rejects a zero-width space and an emoji inside an otherwise valid address', () => {
    expect(base58Decode(`​${NATIVE_SOL_REFERENCE}`)).toBeNull();
    expect(base58Decode(`${SOLANA_ACCOUNT.slice(0, 20)}\u{1f600}${SOLANA_ACCOUNT.slice(20)}`)).toBeNull();
  });
});

describe('requireSolanaAddress', () => {
  it('returns the address when it is valid', () => {
    expect(requireSolanaAddress(SOLANA_ACCOUNT, 'invalid')).toBe(SOLANA_ACCOUNT);
  });

  it('throws the supplied message for empty, missing and malformed values', () => {
    expect(() => requireSolanaAddress(undefined, 'invalid address')).toThrow('invalid address');
    expect(() => requireSolanaAddress('', 'invalid address')).toThrow('invalid address');
    expect(() => requireSolanaAddress('0x1234567890123456789012345678901234567890', 'invalid address')).toThrow('invalid address');
  });
});
