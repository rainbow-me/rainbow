import { PerpMarket } from '@/features/perps/types';
import { greaterThanOrEqualToWorklet, mulWorklet } from '@/safe-math/SafeMath';

/**
 * Calculate the applicable max leverage based on margin tiers for a given position size.
 * If the market has margin tiers, finds the tier that applies to the current position value.
 * Falls back to the market's default max leverage if no tiers are available.
 */
export function getApplicableMaxLeverage({
  market,
  amount,
  price,
  leverage,
}: {
  market: PerpMarket;
  amount: string | number;
  price: string | number;
  leverage: number | null;
}): number {
  'worklet';
  if (!market.marginTiers || market.marginTiers.length === 0) {
    return market.maxLeverage;
  }

  const positionValue = mulWorklet(amount, price);
  const applicableTier = market.marginTiers.find(tier => greaterThanOrEqualToWorklet(positionValue, tier.lowerBound));
  return applicableTier?.maxLeverage || market.marginTiers[0]?.maxLeverage || leverage || market.maxLeverage;
}
