import { HYPERLIQUID_MAKER_FEE_BIPS, HYPERLIQUID_TAKER_FEE_BIPS, RAINBOW_FEE_BIPS } from '@/features/perps/constants';
import { calculateTradingFee } from '@/features/perps/utils/calculateTradingFee';
import { calculatePositionSize } from '@/features/perps/utils/orders';
import { mulWorklet, subWorklet, sumWorklet } from '@/safe-math/SafeMath';

/**
 * Estimates the PnL for a hypothetical position that has not yet been opened.
 * Useful for previewing PnL based on margin and leverage before an actual position exists.
 */
export function estimatePnl(params: {
  entryPrice: string;
  exitPrice: string;
  margin: string;
  leverage: number;
  isLong: boolean;
  takerFeeBips?: number;
  makerFeeBips?: number;
  // Whether the exit order is a maker order (limit) or taker (market)
  isMakerOrder?: boolean;
  includeFees?: boolean;
}): string {
  'worklet';

  const {
    entryPrice,
    exitPrice,
    margin,
    leverage,
    isLong,
    takerFeeBips = HYPERLIQUID_TAKER_FEE_BIPS,
    makerFeeBips = HYPERLIQUID_MAKER_FEE_BIPS,
    isMakerOrder = false,
    includeFees = true,
  } = params;

  const positionSize = calculatePositionSize({ marginAmount: margin, entryPrice, leverage });
  const priceDiff = subWorklet(exitPrice, entryPrice);
  const grossProfit = isLong ? mulWorklet(positionSize, priceDiff) : mulWorklet(positionSize, mulWorklet('-1', priceDiff));

  if (!includeFees) return grossProfit;

  // Fees are taken on both the entry and exit
  const feeBips = (isMakerOrder ? makerFeeBips : takerFeeBips) + RAINBOW_FEE_BIPS;
  const entryFee = calculateTradingFee({ size: positionSize, price: entryPrice, feeBips });
  const exitFee = calculateTradingFee({ size: positionSize, price: exitPrice, feeBips });
  const totalFees = sumWorklet(entryFee, exitFee);

  return subWorklet(grossProfit, totalFees);
}
