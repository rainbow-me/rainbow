import { RainbowError } from '@/logger';

/**
 * The largest value the encoding can carry. Three bytes hold 7 + 7 + 2 bits,
 * because the third byte may only set its two least-significant bits before the
 * value overflows a u16.
 */
export const COMPACT_U16_MAX = 0xffff;

/**
 * Encodes a length prefix in Solana's `ShortU16` form: one to three bytes, seven
 * value bits per byte from least significant upward, with the top bit set on every
 * byte but the last.
 *
 * Every variable-length array in a Solana message and transaction is prefixed this
 * way — account keys, an instruction's account indexes, its data, the signature
 * list — so a wrong prefix does not corrupt one field, it desynchronises the whole
 * remaining parse.
 *
 * Read from `anza-xyz/solana-sdk@58ca02e8` `short-vec/src/lib.rs:26-33` for the
 * documented bound and `:44-57` for the loop this reproduces. The two-bit ceiling on
 * the third byte is the part most secondary write-ups omit, so it is recorded here
 * explicitly.
 */
export function encodeCompactU16(value: number): Uint8Array {
  if (!Number.isInteger(value) || value < 0 || value > COMPACT_U16_MAX) {
    throw new RainbowError(`[solana/compactU16]: length must be an integer in [0, ${COMPACT_U16_MAX}], received ${value}`);
  }

  const bytes: number[] = [];
  let remaining = value;

  for (;;) {
    const element = remaining & 0x7f;
    remaining >>>= 7;
    if (remaining === 0) {
      bytes.push(element);
      break;
    }
    bytes.push(element | 0x80);
  }

  return new Uint8Array(bytes);
}
