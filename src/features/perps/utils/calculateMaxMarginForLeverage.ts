import { PerpMarket } from '@/features/perps/types';
import { divWorklet } from '@/safe-math/SafeMath';

export function calculateMaxMarginForLeverage({
  marginTiers,
  leverage,
}: {
  marginTiers: PerpMarket['marginTiers'];
  leverage: number;
}): string | null {
  'worklet';

  if (!marginTiers || marginTiers.length === 0) {
    return null;
  }

  const sortedTiers = [...marginTiers].sort((a, b) => b.maxLeverage - a.maxLeverage);

  let maxPositionSize: string | null = null;

  for (let i = 0; i < sortedTiers.length; i++) {
    const tier = sortedTiers[i];

    if (leverage <= tier.maxLeverage) {
      const nextTier = sortedTiers.find(t => t.maxLeverage < tier.maxLeverage);

      if (nextTier) {
        maxPositionSize = nextTier.lowerBound;
      }
      break;
    }
  }

  if (maxPositionSize !== null) {
    return divWorklet(maxPositionSize, leverage);
  }

  return null;
}
