import { HYPERLIQUID_MAKER_FEE_RATE, HYPERLIQUID_TAKER_FEE_RATE } from '@/features/perps/constants';
import { divWorklet, mulWorklet, subWorklet, sumWorklet } from '@/safe-math/SafeMath';

// TODO (kane): cleanup
export interface PnlParams {
  entryPrice: string | number;
  exitPrice: string | number;
  /** Margin amount in USD */
  margin: string | number;
  /** Leverage multiplier */
  leverage: string | number;
  /** Whether this is a long position (true) or short (false) */
  isLong: boolean;
  /** Optional: Taker fee rate (e.g., 0.00035 for 0.035%) */
  takerFeeRate?: string | number;
  /** Optional: Maker fee rate (e.g., 0.0002 for 0.02%) */
  makerFeeRate?: string | number;
  /** Optional: Whether the exit order is a maker order (limit) or taker (market) */
  isMakerOrder?: boolean;
}

export function estimatePnl({
  entryPrice,
  exitPrice,
  margin,
  leverage,
  isLong,
  takerFeeRate = HYPERLIQUID_TAKER_FEE_RATE,
  makerFeeRate = HYPERLIQUID_MAKER_FEE_RATE,
  isMakerOrder = true,
}: {
  entryPrice: string | number;
  exitPrice: string | number;
  margin: string | number;
  leverage: string | number;
  isLong: boolean;
  takerFeeRate?: string | number;
  makerFeeRate?: string | number;
  isMakerOrder?: boolean;
}): string {
  'worklet';

  const notionalValue = mulWorklet(margin, leverage);
  const positionSize = divWorklet(notionalValue, entryPrice);

  const priceDiff = subWorklet(exitPrice, entryPrice);

  // For long: profit = size * (exit - entry)
  // For short: profit = size * (entry - exit) = -size * (exit - entry)
  const grossProfit = isLong ? mulWorklet(positionSize, priceDiff) : mulWorklet(positionSize, mulWorklet('-1', priceDiff));

  const entryNotional = mulWorklet(positionSize, entryPrice);
  const exitNotional = mulWorklet(positionSize, exitPrice);

  const entryFee = mulWorklet(entryNotional, takerFeeRate);
  const exitFee = mulWorklet(exitNotional, isMakerOrder ? makerFeeRate : takerFeeRate);
  const totalFees = sumWorklet(entryFee, exitFee);

  return subWorklet(grossProfit, totalFees);
}
