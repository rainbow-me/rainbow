import { describe, expect, it } from 'vitest';

import { type PreparedRouteExecution } from '@rainbow-me/solana-sdk';

import { BONK, BUY_AMOUNT, MAX_SELL_AMOUNT, sellAmount, SOLANA_USDC, solanaToken, validateMvpReview } from './mvpRoutes';

const review = () => ({
  gasless: true,
  sponsorship: 'full' as const,
  inputAmount: BUY_AMOUNT,
  expiresAt: BigInt(Math.floor(Date.now() / 1000) + 60),
  output: { asset: solanaToken(BONK), decimals: 5, amount: 100n, minimumAmount: 95n },
});
const prepared = (change = {}): PreparedRouteExecution =>
  ({ kind: 'route.managed', executionId: '0x01', review: { ...review(), ...change } }) as unknown as PreparedRouteExecution;

describe('MVP spending and sponsorship limits', () => {
  it('accepts only the reviewed bounded, fully-sponsored mainnet route', () => {
    expect(() => validateMvpReview('buy', BUY_AMOUNT, prepared())).not.toThrow();
    for (const change of [
      { sponsorship: 'partial' },
      { sponsorship: 'none' },
      { gasless: false },
      { inputAmount: BUY_AMOUNT + 1n },
      { expiresAt: 1n },
      { output: { ...review().output, minimumAmount: undefined } },
      { output: { ...review().output, asset: solanaToken(SOLANA_USDC) } },
      { output: { ...review().output, decimals: 6 } },
    ]) {
      expect(() => validateMvpReview('buy', BUY_AMOUNT, prepared(change))).toThrow();
    }
    expect(() => validateMvpReview('buy', 0n, prepared())).toThrow();
    expect(() => validateMvpReview('sell', MAX_SELL_AMOUNT + 1n, prepared())).toThrow();
  });

  it('bounds the return swap to the available balance and hard cap without floating point', () => {
    expect(() => sellAmount(0n)).toThrow();
    expect(sellAmount(1n)).toBe(1n);
    expect(sellAmount(MAX_SELL_AMOUNT * 2n)).toBe(MAX_SELL_AMOUNT);
  });
});
