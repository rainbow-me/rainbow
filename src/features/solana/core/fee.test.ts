import { SOLANA_LAMPORTS_PER_SIGNATURE, SOLANA_MAX_COMPUTE_UNIT_LIMIT, solanaTransactionFeeLamports } from './fee';

const fee = (signatureCount: number, computeUnitLimit: number, computeUnitPriceMicroLamports: bigint) =>
  solanaTransactionFeeLamports({ signatureCount, feeParams: { computeUnitLimit, computeUnitPriceMicroLamports } });

describe('solanaTransactionFeeLamports', () => {
  it('charges the base fee per signature when there is no priority fee', () => {
    expect(fee(1, 450, 0n)).toBe(SOLANA_LAMPORTS_PER_SIGNATURE);
    expect(fee(2, 450, 0n)).toBe(SOLANA_LAMPORTS_PER_SIGNATURE * 2n);
    expect(fee(3, 0, 0n)).toBe(15_000n);
  });

  it('reproduces the fee a real validator charged an exercised transfer', () => {
    // Observed rather than constructed: `getFeeForMessage` quoted 5001 for this exact
    // message, the transaction's own meta reported `fee: 5001`, and the sender's balance
    // fell by the transfer plus 5001 to the lamport.
    expect(fee(1, 450, 1_000n)).toBe(5_001n);
  });

  it('rounds the priority component up, never down', () => {
    // 450 units at 1,000 micro-lamports is 450,000 micro-lamports, which is 0.45 lamports.
    // Rounding down would make the priority fee free for any small transaction.
    expect(fee(1, 450, 1_000n) - SOLANA_LAMPORTS_PER_SIGNATURE).toBe(1n);
    expect(fee(1, 1, 1n) - SOLANA_LAMPORTS_PER_SIGNATURE).toBe(1n);
    expect(fee(1, 1_000_000, 1n) - SOLANA_LAMPORTS_PER_SIGNATURE).toBe(1n);
    expect(fee(1, 1_000_000, 2n) - SOLANA_LAMPORTS_PER_SIGNATURE).toBe(2n);
  });

  it('charges nothing extra when either factor is zero', () => {
    expect(fee(1, 0, 1_000_000n)).toBe(SOLANA_LAMPORTS_PER_SIGNATURE);
    expect(fee(1, 1_400_000, 0n)).toBe(SOLANA_LAMPORTS_PER_SIGNATURE);
  });

  it('charges on the requested limit rather than on consumption', () => {
    // The property that inverts the EVM intuition: raising the limit raises the fee even
    // if the transaction consumes nothing more, because nothing is refunded.
    const modest = fee(1, 450, 10_000n);
    const generous = fee(1, 1_400_000, 10_000n);
    expect(generous).toBeGreaterThan(modest);
    expect(generous - SOLANA_LAMPORTS_PER_SIGNATURE).toBe(14_000n);
  });

  it('stays exact past 2^53, where a float would not', () => {
    // 2^53 + 1 is the smallest positive integer a double cannot represent, so a fee
    // computed in floating point would already be wrong here.
    const price = 9_007_199_254_740_993n;
    const computed = fee(1, 1_000_000, price);

    expect(computed).toBe(SOLANA_LAMPORTS_PER_SIGNATURE + price);
    expect(computed).toBeGreaterThan(BigInt(Number.MAX_SAFE_INTEGER));
    expect(BigInt(Number(computed))).not.toBe(computed);
    expect(BigInt(Number(price))).not.toBe(price);
  });

  it.each([
    ['zero signatures', 0],
    ['a negative signature count', -1],
    ['a non-integer signature count', 1.5],
  ])('rejects %s', (_label, signatureCount) => {
    expect(() => fee(signatureCount as number, 450, 0n)).toThrow();
  });
});

describe('the clamp at the runtime limit', () => {
  it('prices the clamped limit rather than the requested one', () => {
    // agave caps a request at MAX_COMPUTE_UNIT_LIMIT and prices the capped value
    // (`program-runtime/src/execution_budget.rs:26`, applied at
    // `runtime-transaction/src/transaction_meta.rs:170`). Pricing the raw request instead
    // over-estimates by 40% at four million units, and the instruction builder accepts
    // values that high because a u32 does. Measured against a live cluster: a request of
    // 4,000,000 at price 1,000 is quoted 6,400, not 9,000.
    expect(SOLANA_MAX_COMPUTE_UNIT_LIMIT).toBe(1_400_000);
    expect(fee(1, 4_000_000, 1_000n)).toBe(6_400n);
    expect(fee(1, SOLANA_MAX_COMPUTE_UNIT_LIMIT, 1_000n)).toBe(6_400n);
  });

  it('leaves any limit at or below the cap priced as requested', () => {
    expect(fee(1, 1_399_999, 1_000n)).toBe(5_000n + 1_400n);
    expect(fee(1, 450, 1_000n)).toBe(5_001n);
  });

  it('validates the same ranges the instruction builders enforce', () => {
    expect(() => fee(1, -1, 0n)).toThrow();
    expect(() => fee(1, 0x100000000, 0n)).toThrow();
    expect(() => fee(1, 1.5, 0n)).toThrow();
    expect(() => fee(1, 450, -1n)).toThrow();
    expect(() => fee(1, 450, 1n << 64n)).toThrow();
  });
});
