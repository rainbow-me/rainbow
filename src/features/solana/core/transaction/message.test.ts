import { base58Decode, base58Encode, requireSolanaAddress, type SolanaAddress } from '../../address';
import { requireSolanaBlockhash } from './blockhash';
import { type SolanaAccountMeta, type SolanaInstruction } from './instruction';
import { compileSolanaMessage, type SolanaMessage } from './message';

const address = (value: string): SolanaAddress => requireSolanaAddress(value, `fixture ${value}`);
const fromBytes = (bytes: number[]): SolanaAddress => address(base58Encode(Uint8Array.from(bytes)));

const filled = (byte: number): SolanaAddress => fromBytes(new Array(32).fill(byte));

const PAYER = filled(0x11);
const OTHER_SIGNER = filled(0x22);
const WRITABLE = filled(0x33);
const READONLY = filled(0x44);
const PROGRAM = filled(0x55);

const BLOCKHASH = requireSolanaBlockhash('5ev4GFkRqDDK8r1uvS593emEAmFShBV3pMb261idTwiy', 'fixture');

/**
 * Two real addresses whose byte order and base58-string order disagree, found by search.
 * `LOW_BYTES` sorts first by decoded bytes and second as a string, so a compiler that
 * sorted strings would emit them in the other order.
 */
const LOW_BYTES = address('1RmGtB3MAqTHBjT7rRM3xitJ3nGmMXZ2tiqEAPp6Um9');
const HIGH_BYTES = address('12HHpeX83WWMqZCMMZG39tAet9LpJ4af6gAVgVBSHSHR');

const meta = (pubkey: SolanaAddress, isSigner: boolean, isWritable: boolean): SolanaAccountMeta => ({ pubkey, isSigner, isWritable });

const instruction = (programId: SolanaAddress, accounts: SolanaAccountMeta[], data = new Uint8Array([0xaa])): SolanaInstruction => ({
  programId,
  accounts,
  data,
});

const message = (instructions: SolanaInstruction[], version: 'legacy' | 'v0' = 'legacy'): SolanaMessage => ({
  version,
  feePayer: PAYER,
  recentBlockhash: BLOCKHASH,
  instructions,
});

describe('compileSolanaMessage account ordering', () => {
  it('puts the fee payer at index 0 and groups the rest in wire order', () => {
    const compiled = compileSolanaMessage(
      message([
        instruction(PROGRAM, [
          meta(READONLY, false, false),
          meta(WRITABLE, false, true),
          meta(OTHER_SIGNER, true, false),
          meta(PAYER, true, true),
        ]),
      ])
    );

    // writable signers, readonly signers, writable non-signers, readonly non-signers.
    // PROGRAM is a readonly non-signer because being invoked confers neither flag, and
    // READONLY precedes it because 0x44 sorts before 0x55.
    expect(compiled.accountKeys).toEqual([PAYER, OTHER_SIGNER, WRITABLE, READONLY, PROGRAM]);
    expect(compiled.header).toEqual({
      numRequiredSignatures: 2,
      numReadonlySignedAccounts: 1,
      numReadonlyUnsignedAccounts: 2,
    });
  });

  it('puts the fee payer first even when its bytes would sort it last', () => {
    const highPayer = filled(0xff);
    const compiled = compileSolanaMessage({
      version: 'legacy',
      feePayer: highPayer,
      recentBlockhash: BLOCKHASH,
      instructions: [instruction(PROGRAM, [meta(highPayer, true, true), meta(filled(0x01), false, true)])],
    });

    expect(compiled.accountKeys[0]).toBe(highPayer);
  });

  it('forces the fee payer to be a writable signer even if no instruction says so', () => {
    const compiled = compileSolanaMessage(message([instruction(PROGRAM, [meta(PAYER, false, false)])]));

    expect(compiled.accountKeys[0]).toBe(PAYER);
    expect(compiled.header.numRequiredSignatures).toBe(1);
    expect(compiled.header.numReadonlySignedAccounts).toBe(0);
  });

  it('sorts within a group by decoded bytes, not by base58 string', () => {
    // The assertion that separates a correct compiler from a plausible one.
    expect(LOW_BYTES > HIGH_BYTES).toBe(true);
    const lowFirst = base58Decode(LOW_BYTES)![1] < base58Decode(HIGH_BYTES)![1];
    expect(lowFirst).toBe(true);

    const compiled = compileSolanaMessage(message([instruction(PROGRAM, [meta(HIGH_BYTES, false, true), meta(LOW_BYTES, false, true)])]));

    expect(compiled.accountKeys.slice(1, 3)).toEqual([LOW_BYTES, HIGH_BYTES]);
  });

  it('unions the flags of an account named more than once', () => {
    const compiled = compileSolanaMessage(
      message([instruction(PROGRAM, [meta(WRITABLE, false, false)]), instruction(PROGRAM, [meta(WRITABLE, true, true)])])
    );

    // Readonly in one instruction and a writable signer in another: the union wins, so it
    // is a writable signer, and it appears exactly once.
    expect(compiled.accountKeys.filter(key => key === WRITABLE)).toHaveLength(1);
    expect(compiled.accountKeys.slice(0, 2)).toEqual([PAYER, WRITABLE]);
    expect(compiled.header).toEqual({
      numRequiredSignatures: 2,
      numReadonlySignedAccounts: 0,
      numReadonlyUnsignedAccounts: 1,
    });
  });

  it('deduplicates a program that is also named as an account', () => {
    const compiled = compileSolanaMessage(message([instruction(PROGRAM, [meta(PROGRAM, false, true)])]));

    expect(compiled.accountKeys.filter(key => key === PROGRAM)).toHaveLength(1);
    // Named writable, so it is a writable non-signer rather than a readonly one.
    expect(compiled.header.numReadonlyUnsignedAccounts).toBe(0);
  });

  it('rejects a message with no instructions', () => {
    expect(() => compileSolanaMessage(message([]))).toThrow();
  });
});

describe('compileSolanaMessage serialization', () => {
  it('lays a legacy message out as header, keys, blockhash, instructions', () => {
    const data = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    const compiled = compileSolanaMessage(message([instruction(PROGRAM, [meta(WRITABLE, false, true)], data)]));

    const expected = [
      1,
      0,
      1, // header: one signature, no readonly signers, one readonly unsigned (the program)
      3, // compact-u16: three account keys
      ...base58Decode(PAYER)!,
      ...base58Decode(WRITABLE)!,
      ...base58Decode(PROGRAM)!,
      ...base58Decode(BLOCKHASH)!,
      1, // compact-u16: one instruction
      2, // program id index
      1, // compact-u16: one account index
      1, // that index
      4, // compact-u16: four data bytes
      ...data,
    ];

    expect(Array.from(compiled.bytes)).toEqual(expected);
  });

  it('prefixes a v0 message with 0x80 and appends an empty lookup-table array', () => {
    const instructions = [instruction(PROGRAM, [meta(WRITABLE, false, true)])];
    const legacy = compileSolanaMessage(message(instructions, 'legacy'));
    const v0 = compileSolanaMessage(message(instructions, 'v0'));

    expect(v0.bytes[0]).toBe(0x80);
    expect(Array.from(v0.bytes.slice(1, -1))).toEqual(Array.from(legacy.bytes));
    expect(v0.bytes[v0.bytes.length - 1]).toBe(0);
    expect(v0.bytes.length).toBe(legacy.bytes.length + 2);
  });

  it('produces the same account table on the interface as it encoded in the bytes', () => {
    // The reason `CompiledSolanaMessage` returns the table: signature *i* belongs to
    // `accountKeys[i]`, so a caller placing a signature must see the compiler's ordering
    // rather than re-derive it.
    const compiled = compileSolanaMessage(message([instruction(PROGRAM, [meta(WRITABLE, false, true)])]));
    const keyCountOffset = 3;
    expect(compiled.bytes[keyCountOffset]).toBe(compiled.accountKeys.length);

    compiled.accountKeys.forEach((key, index) => {
      const start = keyCountOffset + 1 + index * 32;
      expect(Array.from(compiled.bytes.slice(start, start + 32))).toEqual(Array.from(base58Decode(key)!));
    });
  });

  it('is deterministic: the same message compiles to the same bytes', () => {
    const build = () => compileSolanaMessage(message([instruction(PROGRAM, [meta(WRITABLE, false, true), meta(READONLY, false, false)])]));
    expect(Array.from(build().bytes)).toEqual(Array.from(build().bytes));
  });
});
