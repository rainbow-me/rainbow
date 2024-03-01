// lower number = higher precedence
import { UniqueAssetTrait } from '../entities/uniqueAssets';

const displayTypeRanks: Record<string, number> = {
  boost_number: 1,
  boost_percentage: 2,
  date: 3,
} as const;

/**
 * Comparator function for comparing two NFT traits by looking at their display type.
 * This sorting mimics how OpenSea displays traits separated by display type
 */
export default function uniqueAssetTraitDisplayTypeCompareFunction(a: UniqueAssetTrait, b: UniqueAssetTrait): number {
  const aTypeRank = displayTypeRanks?.[a.display_type] ?? 0;
  const bTypeRank = displayTypeRanks?.[b.display_type] ?? 0;
  if (aTypeRank < bTypeRank) {
    return -1;
  } else if (aTypeRank > bTypeRank) {
    return 1;
  } else {
    return 0;
  }
}
