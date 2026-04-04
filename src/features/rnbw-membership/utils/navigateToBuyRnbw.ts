import { navigateToSwaps } from '@/__swaps__/screens/Swap/navigateToSwaps';
import { buildSyntheticRnbwSourceAsset } from '@/features/rnbw-staking/utils/syntheticRnbwSourceAsset';

export function navigateToBuyRnbw() {
  const outputAsset = buildSyntheticRnbwSourceAsset();
  if (!outputAsset) return;

  navigateToSwaps({ outputAsset });
}
