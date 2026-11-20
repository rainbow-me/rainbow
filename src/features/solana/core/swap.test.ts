import { describe, expect, it } from 'vitest';

import {
  editSwapAmount,
  SOL_FEE_RESERVE,
  SOLANA_SWAP_OUTPUTS,
  SWAP_ASSETS,
  swapInputAmount,
  swapMaxAmount,
  swapPercentageAmount,
  validateSwapReview,
  type SwapReview,
} from './swap';

function trade(inputAsset: SwapReview['inputAsset'] = 'base-eth', outputAsset: SwapReview['outputAsset'] = 'bonk'): SwapReview {
  return {
    inputAsset,
    outputAsset,
    input: 123n,
    prepared: {
      kind: 'route.managed',
      executionId: `0x${'01'.repeat(32)}`,
      review: {
        inputAmount: 123n,
        gasless: inputAsset === 'base-eth',
        sponsorship: 'full',
        expiresAt: BigInt(Math.floor(Date.now() / 1000) + 60),
        output: { asset: SWAP_ASSETS[outputAsset].asset, decimals: SWAP_ASSETS[outputAsset].decimals, amount: 200n, minimumAmount: 190n },
      },
    },
  } as SwapReview;
}

describe('normal Solana swap constraints', () => {
  it('parses exact base units without rounding or float conversion', () => {
    expect(swapInputAmount('0.000000000000000001', 'base-eth')).toBe(1n);
    expect(swapInputAmount('415600.12345', 'bonk')).toBe(41560012345n);
    expect(swapInputAmount('1.', 'sol')).toBe(1000000000n);
    for (const amount of ['0', '-1', 'NaN', '1e5', '.5', '1.0000001', ' 1', '18446744073709551616'])
      expect(() => swapInputAmount(amount, 'usdc')).toThrow();
  });
  it('reserves SOL for Max without reducing token or sponsored Base ETH amounts', () => {
    expect(swapMaxAmount('sol', SOL_FEE_RESERVE - 1n)).toBe('0');
    expect(swapMaxAmount('sol', 3000000n)).toBe('0.002');
    expect(swapMaxAmount('bonk', 123456n)).toBe('1.23456');
    expect(swapMaxAmount('base-eth', 1n)).toBe('0.000000000000000001');
  });
  it('accepts all distinct supported pairs and rejects identity swaps', () => {
    for (const input of ['base-eth', ...SOLANA_SWAP_OUTPUTS] as const)
      for (const output of SOLANA_SWAP_OUTPUTS) {
        if (input === output) continue;
        expect(() => validateSwapReview(trade(input, output))).not.toThrow();
      }
  });
  it.each(SOLANA_SWAP_OUTPUTS)('rejects %s identity swaps', asset => {
    expect(() => validateSwapReview(trade(asset, asset))).toThrow();
  });
  it('rejects changed output identities, decimals, amounts, sponsorship and expired quotes', () => {
    const valid = trade();
    for (const change of [
      { inputAmount: 124n },
      { gasless: false },
      { sponsorship: 'partial' },
      { expiresAt: 1n },
      { output: { ...valid.prepared.review.output, asset: SWAP_ASSETS.usdc.asset } },
      { output: { ...valid.prepared.review.output, asset: { ...SWAP_ASSETS.bonk.asset, cluster: 'devnet' } } },
      { output: { ...valid.prepared.review.output, decimals: 6 } },
      { output: { ...valid.prepared.review.output, minimumAmount: 0n } },
      { output: { ...valid.prepared.review.output, minimumAmount: 201n } },
    ])
      expect(() =>
        validateSwapReview({ ...valid, prepared: { ...valid.prepared, review: { ...valid.prepared.review, ...change } } } as SwapReview)
      ).toThrow();
  });
});

describe('shared swap amount controls', () => {
  it('uses the exact spendable balance at 0, 25, 50, 75 and 100 percent', () => {
    expect([0, 0.25, 0.5, 0.75, 1].map(p => swapPercentageAmount('sol', 1001000000n, p))).toEqual(['0', '0.25', '0.5', '0.75', '1']);
    expect(swapPercentageAmount('sol', 500000n, 1)).toBe('0');
  });
  it('rounds token units down and preserves precision beyond Number safe integers', () => {
    expect(swapPercentageAmount('bonk', 123n, 0.5)).toBe('0.00061');
    expect(swapPercentageAmount('base-eth', 1234567890123456789n, 1)).toBe('1.234567890123456789');
    expect(swapPercentageAmount('base-eth', 1234567890123456789n, 0.5)).toBe('0.617283945061728394');
  });
  it.each([NaN, Infinity, -0.1, 1.1])('rejects invalid percentage %s', percentage => {
    expect(() => swapPercentageAmount('sol', 1000000n, percentage)).toThrow();
  });
  it('keeps typed decimal strings intact and blocks overprecision', () => {
    expect(editSwapAmount('0', '.', 5)).toBe('0.');
    expect(editSwapAmount('0.', 0, 5)).toBe('0.0');
    expect(editSwapAmount('0.0', 1, 5)).toBe('0.01');
    expect(editSwapAmount('1.23456', 7, 5)).toBe('1.23456');
    expect(editSwapAmount('1.23456', 'backspace', 5)).toBe('1.2345');
    expect(editSwapAmount('1', 'backspace', 5)).toBe('0');
    expect(editSwapAmount('1.2', '.', 5)).toBe('1.2');
  });
});
