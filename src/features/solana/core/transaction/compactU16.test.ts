import { COMPACT_U16_MAX, encodeCompactU16 } from './compactU16';

const bytes = (value: number) => Array.from(encodeCompactU16(value));

/**
 * An independent reader, written without reference to the encoder: accumulate seven bits
 * at a time from the low end, stopping at the first byte whose top bit is clear.
 */
function decodeCompactU16(input: Uint8Array): { value: number; length: number } {
  let value = 0;
  let shift = 0;
  for (let index = 0; index < input.length; index++) {
    value |= (input[index] & 0x7f) << shift;
    if ((input[index] & 0x80) === 0) return { value, length: index + 1 };
    shift += 7;
  }
  throw new Error('unterminated compact-u16');
}

describe('encodeCompactU16', () => {
  // The byte sequences are the specification's, not this implementation's output
  // recorded after the fact: each one is derivable by hand from the rule in
  // `short-vec/src/lib.rs:26-33`, which is why the boundaries are named.
  it.each([
    ['zero', 0, [0x00]],
    ['one', 1, [0x01]],
    ['the largest single byte', 0x7f, [0x7f]],
    ['the first two-byte value', 0x80, [0x80, 0x01]],
    ['the largest two-byte value', 0x3fff, [0xff, 0x7f]],
    ['the first three-byte value', 0x4000, [0x80, 0x80, 0x01]],
    ['the largest value the encoding can carry', 0xffff, [0xff, 0xff, 0x03]],
  ])('encodes %s', (_label, value, expected) => {
    expect(bytes(value as number)).toEqual(expected);
  });

  it('never exceeds three bytes', () => {
    for (let value = 0; value <= COMPACT_U16_MAX; value += 7) {
      expect(encodeCompactU16(value).length).toBeLessThanOrEqual(3);
    }
  });

  it('sets the continuation bit on every byte but the last', () => {
    for (const value of [0x80, 0x3fff, 0x4000, 0xffff]) {
      const encoded = encodeCompactU16(value);
      encoded.forEach((byte, index) => {
        const isLast = index === encoded.length - 1;
        expect((byte & 0x80) !== 0).toBe(!isLast);
      });
    }
  });

  it("never sets more than the third byte's two least-significant bits", () => {
    // This is the bound that makes the encoding a u16 rather than a 21-bit value, and
    // the part most secondary write-ups omit. Every value at or above
    // 0x4000 needs fifteen bits and so always occupies all three bytes, which is why the
    // assertion needs no condition.
    for (let value = 0x4000; value <= COMPACT_U16_MAX; value += 13) {
      const encoded = encodeCompactU16(value);
      expect(encoded).toHaveLength(3);
      expect(encoded[2] & ~0x03).toBe(0);
    }
  });

  it('round-trips through an independent decoder across the whole range', () => {
    for (let value = 0; value <= COMPACT_U16_MAX; value += 11) {
      const encoded = encodeCompactU16(value);
      expect(decodeCompactU16(encoded)).toEqual({ value, length: encoded.length });
    }
  });

  it.each([
    ['a negative value', -1],
    ['one past the maximum', 0x10000],
    ['a non-integer', 1.5],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('rejects %s', (_label, value) => {
    expect(() => encodeCompactU16(value as number)).toThrow();
  });
});
