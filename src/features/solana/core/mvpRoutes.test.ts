import { parseUnits } from 'viem';
import { describe, expect, it } from 'vitest';

import { type PreparedRouteExecution } from '@rainbow-me/solana-sdk';

import {
  BASE_USDC,
  BONK,
  buyAmount,
  MAX_SELL_AMOUNT,
  sellAmount,
  SOL,
  SOL_TO_BASE_AMOUNT,
  SOLANA_USDC,
  solanaToken,
  validateMvpReview,
} from './mvpRoutes';

const BUY_AMOUNT = parseUnits('0.0005', 18);

const review = () => ({
  gasless: true,
  sponsorship: 'full' as const,
  inputAmount: BUY_AMOUNT,
  expiresAt: BigInt(Math.floor(Date.now() / 1000) + 60),
  output: { asset: SOL, decimals: 9, amount: 100n, minimumAmount: 95n },
});
const prepared = (change = {}): PreparedRouteExecution =>
  ({ kind: 'route.managed', executionId: '0x01', review: { ...review(), ...change } }) as unknown as PreparedRouteExecution;

describe('MVP spending and sponsorship limits', () => {
  it('converts $1 to ETH wei, rounding down and rejecting unavailable prices', () => {
    expect(buyAmount(2000)).toBe(parseUnits('0.0005', 18));
    expect(buyAmount(3000)).toBe(333_333_333_333_333n);
    expect(buyAmount(2000.5)).toBe(499_875_031_242_189n);
    for (const invalid of [undefined, null, 0, -1, NaN, Infinity, 1e20]) {
      expect(() => buyAmount(invalid)).toThrow();
    }
  });

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
      { output: { ...review().output, asset: solanaToken(BONK) } },
      { output: { ...review().output, asset: solanaToken('So11111111111111111111111111111111111111112' as typeof BONK) } },
      { output: { ...review().output, asset: { ...SOL, cluster: 'devnet' } } },
      { output: { ...review().output, decimals: 6 } },
    ]) {
      expect(() => validateMvpReview('buy', BUY_AMOUNT, prepared(change))).toThrow();
    }
    expect(() => validateMvpReview('buy', 0n, prepared())).toThrow();
    expect(() => validateMvpReview('sell', MAX_SELL_AMOUNT + 1n, prepared())).toThrow();
  });

  it('validates the new native SOL to Base USDC route without accepting other assets or amounts', () => {
    const output = { asset: BASE_USDC, decimals: 6, amount: 700_000n, minimumAmount: 650_000n };
    const quote = prepared({ inputAmount: SOL_TO_BASE_AMOUNT, output });
    expect(() => validateMvpReview('solToBase', SOL_TO_BASE_AMOUNT, quote)).not.toThrow();
    expect(() => validateMvpReview('solToBase', SOL_TO_BASE_AMOUNT + 1n, quote)).toThrow();
    for (const asset of [
      SOL,
      { ...BASE_USDC, chainId: 1 },
      { ...BASE_USDC, kind: 'native' },
      { ...BASE_USDC, address: '0x0000000000000000000000000000000000000001' },
    ]) {
      expect(() =>
        validateMvpReview('solToBase', SOL_TO_BASE_AMOUNT, prepared({ inputAmount: SOL_TO_BASE_AMOUNT, output: { ...output, asset } }))
      ).toThrow();
    }
  });

  it.each(['sell', 'solToBase'] as const)('allows source gas for %s but still requires provider sponsorship', route => {
    const input = route === 'solToBase' ? SOL_TO_BASE_AMOUNT : MAX_SELL_AMOUNT;
    const output = { asset: route === 'solToBase' ? BASE_USDC : solanaToken(SOLANA_USDC), decimals: 6, amount: 100n, minimumAmount: 95n };
    expect(() => validateMvpReview(route, input, prepared({ inputAmount: input, output, gasless: false }))).not.toThrow();
    for (const sponsorship of ['none', 'partial']) {
      expect(() => validateMvpReview(route, input, prepared({ inputAmount: input, output, gasless: false, sponsorship }))).toThrow();
    }
  });

  it('bounds the return swap to the available balance and hard cap without floating point', () => {
    expect(() => sellAmount(0n)).toThrow();
    expect(sellAmount(1n)).toBe(1n);
    expect(sellAmount(MAX_SELL_AMOUNT * 2n)).toBe(MAX_SELL_AMOUNT);
  });
});
