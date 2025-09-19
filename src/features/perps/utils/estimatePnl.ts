import { HYPERLIQUID_MAKER_FEE_BIPS, HYPERLIQUID_TAKER_FEE_BIPS, RAINBOW_FEE_BIPS } from '@/features/perps/constants';
import { calculateTradingFee } from '@/features/perps/utils/calculateTradingFee';
import { divWorklet, mulWorklet, subWorklet, sumWorklet } from '@/safe-math/SafeMath';

// TODO (kane): name this something better to make it clear it's only for non opened positions
// This function allows us to estimate the PnL for a position that has not yet been opened
// Passing in the margin and leverage when we do not yet have a real position size
export function estimatePnl(params: {
  entryPrice: string;
  exitPrice: string;
  margin: string;
  leverage: string | number;
  isLong: boolean;
  takerFeeBips?: number;
  makerFeeBips?: number;
  /** Optional: Whether the exit order is a maker order (limit) or taker (market) */
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

  const notionalValue = mulWorklet(margin, leverage);
  const positionSize = divWorklet(notionalValue, entryPrice);
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
