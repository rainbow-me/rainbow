import { divWorklet, greaterThanWorklet, mulWorklet, subWorklet, sumWorklet } from '@/safe-math/SafeMath';

export interface PnLParams {
  /** Entry price of the position */
  entryPrice: string | number;
  /** Exit price (take profit or stop loss) */
  exitPrice: string | number;
  /** Position size (positive for long, negative for short) */
  positionSize: string | number;
  /** Optional: Taker fee rate (e.g., 0.00035 for 0.035%) */
  takerFeeRate?: string | number;
  /** Optional: Maker fee rate (e.g., 0.0002 for 0.02%) */
  makerFeeRate?: string | number;
  /** Optional: Whether the exit order is a maker order (limit) or taker (market) */
  isMakerOrder?: boolean;
}

interface ProfitCalculationResult {
  /** Gross profit/loss before fees */
  grossProfit: string;
  /** Total fees for the trade */
  fees: string;
  /** Net profit/loss after fees */
  netProfit: string;
  /** Return on investment percentage */
  returnPercentage: string;
  /** Price change percentage */
  priceChangePercentage: string;
}

export function calculatePnL(params: PnLParams): ProfitCalculationResult {
  'worklet';

  const {
    entryPrice,
    exitPrice,
    positionSize,
    takerFeeRate = '0.00035', // Default Hyperliquid taker fee
    makerFeeRate = '0.0002', // Default Hyperliquid maker fee
    isMakerOrder = true,
  } = params;

  // Determine if this is a long or short position
  const isLong = greaterThanWorklet(positionSize, '0');

  // Get absolute size
  const absSize = isLong ? positionSize : mulWorklet('-1', positionSize);

  // Calculate price difference
  const priceDiff = subWorklet(exitPrice, entryPrice);

  // Calculate gross profit/loss
  // For long: profit = size * (exit - entry)
  // For short: profit = size * (entry - exit) = -size * (exit - entry)
  const grossProfit = isLong ? mulWorklet(absSize, priceDiff) : mulWorklet(absSize, mulWorklet('-1', priceDiff));

  // Calculate fees
  const entryNotional = mulWorklet(absSize, entryPrice);
  const exitNotional = mulWorklet(absSize, exitPrice);

  // Assuming entry was a taker order and exit is based on isMakerOrder
  const entryFee = mulWorklet(entryNotional, takerFeeRate);
  const exitFee = mulWorklet(exitNotional, isMakerOrder ? makerFeeRate : takerFeeRate);
  const totalFees = sumWorklet(entryFee, exitFee);

  // Calculate net profit/loss
  const netProfit = subWorklet(grossProfit, totalFees);

  // Calculate return percentage (based on margin used)
  const marginUsed = entryNotional; // Simplified - actual margin depends on leverage
  const returnPercentage = mulWorklet(divWorklet(netProfit, marginUsed), '100');

  // Calculate price change percentage
  const priceChangePercentage = mulWorklet(divWorklet(priceDiff, entryPrice), '100');

  return {
    grossProfit,
    fees: totalFees,
    netProfit,
    returnPercentage,
    priceChangePercentage,
  };
}
