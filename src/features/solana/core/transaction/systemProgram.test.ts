import { requireSolanaAddress } from '../../address';
import { createSolanaTransferInstruction, SOLANA_SYSTEM_PROGRAM_ADDRESS } from './systemProgram';

const FROM = requireSolanaAddress('84bv3nsFUgyUrJFFe7nJSa574LSRc7nKYAN4x6NQPdia', 'fixture');
const TO = requireSolanaAddress('4UBMKcTxthsPv4ha7ijmk3CA1aadnCdpBrnCjQcktyLL', 'fixture');

const readU32LE = (data: Uint8Array, offset: number) => new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(offset, true);
const readU64LE = (data: Uint8Array, offset: number) =>
  new DataView(data.buffer, data.byteOffset, data.byteLength).getBigUint64(offset, true);

describe('SOLANA_SYSTEM_PROGRAM_ADDRESS', () => {
  it('is 32 zero bytes, which encode to 32 ones', () => {
    expect(SOLANA_SYSTEM_PROGRAM_ADDRESS).toBe('11111111111111111111111111111111');
    expect(SOLANA_SYSTEM_PROGRAM_ADDRESS).toHaveLength(32);
  });
});

describe('createSolanaTransferInstruction', () => {
  const instruction = createSolanaTransferInstruction({ from: FROM, to: TO, lamports: 1_234_567n });

  it('targets the System Program', () => {
    expect(instruction.programId).toBe(SOLANA_SYSTEM_PROGRAM_ADDRESS);
  });

  it('names the funding account as a writable signer and the recipient as writable only', () => {
    // Fixed by the program, not chosen here: `0. [WRITE, SIGNER] Funding account`,
    // `1. [WRITE] Recipient account`.
    expect(instruction.accounts).toEqual([
      { pubkey: FROM, isSigner: true, isWritable: true },
      { pubkey: TO, isSigner: false, isWritable: true },
    ]);
  });

  it('encodes twelve bytes: a four-byte variant tag of 2, then the lamports as a little-endian u64', () => {
    // The tag width is the property primary source does not settle and that a localnet
    // transfer settled empirically: a wrong width would have produced
    // `InvalidInstructionData` rather than a lamport movement.
    expect(instruction.data).toHaveLength(12);
    expect(readU32LE(instruction.data, 0)).toBe(2);
    expect(readU64LE(instruction.data, 4)).toBe(1_234_567n);
    expect(Array.from(instruction.data)).toEqual([2, 0, 0, 0, 0x87, 0xd6, 0x12, 0, 0, 0, 0, 0]);
  });

  it('encodes zero and the largest u64', () => {
    expect(readU64LE(createSolanaTransferInstruction({ from: FROM, to: TO, lamports: 0n }).data, 4)).toBe(0n);
    const max = (1n << 64n) - 1n;
    expect(readU64LE(createSolanaTransferInstruction({ from: FROM, to: TO, lamports: max }).data, 4)).toBe(max);
  });

  it.each([
    ['a negative amount', -1n],
    ['one past the largest u64', 1n << 64n],
  ])('rejects %s', (_label, lamports) => {
    expect(() => createSolanaTransferInstruction({ from: FROM, to: TO, lamports: lamports as bigint })).toThrow();
  });

  it('does not validate the recipient beyond syntax', () => {
    // Sending to the sender, and sending to the System Program itself, are both things
    // the runtime permits and this builder must not silently prevent. A recipient gate is
    // a network call or it does not exist, and it belongs in front of the user.
    expect(() => createSolanaTransferInstruction({ from: FROM, to: FROM, lamports: 1n })).not.toThrow();
    expect(() => createSolanaTransferInstruction({ from: FROM, to: SOLANA_SYSTEM_PROGRAM_ADDRESS, lamports: 1n })).not.toThrow();
  });
});
