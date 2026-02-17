import { getPercentageDifferenceWorklet, mulWorklet, toFixedWorklet } from '@/framework/core/safeMath';

export function calculateTradePnlPercentage({
  entryPrice,
  markPrice,
  isLong,
  leverage,
}: {
  entryPrice: string;
  markPrice: string;
  isLong: boolean;
  leverage: number;
}) {
  const priceChangePercent = getPercentageDifferenceWorklet(entryPrice, markPrice);
  const directionalChangePercent = isLong ? priceChangePercent : mulWorklet(priceChangePercent, '-1');
  const leveragedChangePercent = mulWorklet(directionalChangePercent, leverage);

  return Number(toFixedWorklet(leveragedChangePercent, 2));
}
