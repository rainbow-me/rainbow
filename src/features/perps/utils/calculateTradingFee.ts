import { HYPERLIQUID_MAKER_FEE_BIPS, HYPERLIQUID_TAKER_FEE_BIPS, RAINBOW_FEE_BIPS } from '@/features/perps/constants';
import { mulWorklet } from '@/safe-math/SafeMath';

/**
 * Calculate trading fee for a given size and price.
 * @param size Size of the position
 * @param price Price at entry / exit
 * @param feeBips Fee rate as bips (e.g., 5 for 0.05%)
 * @returns Trading fee amount
 */
export function calculateTradingFee({ size, price, feeBips }: { size: string; price: string; feeBips: number }): string {
  'worklet';
  const notional = mulWorklet(size, price);
  return mulWorklet(notional, feeBips / 10_000);
}

export function calculateTakerFee({
  size,
  price,
  feeBips = HYPERLIQUID_TAKER_FEE_BIPS,
}: {
  size: string;
  price: string;
  feeBips?: number;
}): string {
  'worklet';
  return calculateTradingFee({ size, price, feeBips: feeBips + RAINBOW_FEE_BIPS });
}

export function calculateMakerFee({
  size,
  price,
  feeBips = HYPERLIQUID_MAKER_FEE_BIPS,
}: {
  size: string;
  price: string;
  feeBips?: number;
}): string {
  'worklet';
  return calculateTradingFee({ size, price, feeBips: feeBips + RAINBOW_FEE_BIPS });
}
