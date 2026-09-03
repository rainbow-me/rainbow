import {
  createSetComputeUnitLimitInstruction,
  createSetComputeUnitPriceInstruction,
  SOLANA_COMPUTE_BUDGET_PROGRAM_ADDRESS,
} from './computeBudget';

const view = (data: Uint8Array) => new DataView(data.buffer, data.byteOffset, data.byteLength);

describe('createSetComputeUnitLimitInstruction', () => {
  it('encodes discriminator 2 then the limit as a little-endian u32, with no accounts', () => {
    const instruction = createSetComputeUnitLimitInstruction(450);
    expect(instruction.programId).toBe(SOLANA_COMPUTE_BUDGET_PROGRAM_ADDRESS);
    expect(instruction.accounts).toEqual([]);
    expect(instruction.data).toHaveLength(5);
    expect(instruction.data[0]).toBe(2);
    expect(view(instruction.data).getUint32(1, true)).toBe(450);
    expect(Array.from(instruction.data)).toEqual([2, 0xc2, 0x01, 0, 0]);
  });

  it('accepts the boundaries of a u32', () => {
    expect(view(createSetComputeUnitLimitInstruction(0).data).getUint32(1, true)).toBe(0);
    expect(view(createSetComputeUnitLimitInstruction(0xffffffff).data).getUint32(1, true)).toBe(0xffffffff);
  });

  it.each([
    ['a negative limit', -1],
    ['one past a u32', 0x100000000],
    ['a non-integer', 1.5],
  ])('rejects %s', (_label, units) => {
    expect(() => createSetComputeUnitLimitInstruction(units as number)).toThrow();
  });
});

describe('createSetComputeUnitPriceInstruction', () => {
  it('encodes discriminator 3 then the price as a little-endian u64, with no accounts', () => {
    const instruction = createSetComputeUnitPriceInstruction(1_000n);
    expect(instruction.programId).toBe(SOLANA_COMPUTE_BUDGET_PROGRAM_ADDRESS);
    expect(instruction.accounts).toEqual([]);
    expect(instruction.data).toHaveLength(9);
    expect(instruction.data[0]).toBe(3);
    expect(view(instruction.data).getBigUint64(1, true)).toBe(1_000n);
    expect(Array.from(instruction.data)).toEqual([3, 0xe8, 0x03, 0, 0, 0, 0, 0, 0]);
  });

  it('accepts the boundaries of a u64', () => {
    expect(view(createSetComputeUnitPriceInstruction(0n).data).getBigUint64(1, true)).toBe(0n);
    const max = (1n << 64n) - 1n;
    expect(view(createSetComputeUnitPriceInstruction(max).data).getBigUint64(1, true)).toBe(max);
  });

  it.each([
    ['a negative price', -1n],
    ['one past a u64', 1n << 64n],
  ])('rejects %s', (_label, price) => {
    expect(() => createSetComputeUnitPriceInstruction(price as bigint)).toThrow();
  });
});

describe('the two instructions together', () => {
  it('use different discriminators, which is the whole distinction on the wire', () => {
    expect(createSetComputeUnitLimitInstruction(1).data[0]).not.toBe(createSetComputeUnitPriceInstruction(1n).data[0]);
  });

  it('carry a single discriminator byte rather than a four-byte tag, unlike the System Program', () => {
    // The System Program's instructions go through bincode, which writes a four-byte enum
    // tag; these do not. Assuming one encoding for both is the mistake this pins down.
    expect(createSetComputeUnitLimitInstruction(450).data).toHaveLength(1 + 4);
    expect(createSetComputeUnitPriceInstruction(1_000n).data).toHaveLength(1 + 8);
  });
});
