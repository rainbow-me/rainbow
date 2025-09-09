import { PerpsPosition } from '@/features/perps/types';
import { calculateTradingFee } from '@/features/perps/utils/calculateTradingFee';
import { mulWorklet, sumWorklet, isPositive, subWorklet } from '@/safe-math/SafeMath';

export function estimateReturnOnMarketClose({
  position,
  exitPrice,
  feeBips = 0,
}: {
  position: PerpsPosition;
  exitPrice: string;
  feeBips?: number;
}) {
  'worklet';
  const { size, entryPrice, marginUsed } = position;
  const isLong = isPositive(size);
  const exitFee = calculateTradingFee({ size, price: entryPrice, feeBips });
  const priceDiff = subWorklet(exitPrice, entryPrice);
  const grossProfit = isLong ? mulWorklet(size, priceDiff) : mulWorklet(size, mulWorklet('-1', priceDiff));

  return subWorklet(sumWorklet(marginUsed, grossProfit), exitFee);
}
