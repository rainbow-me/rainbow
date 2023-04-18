// lower number = higher precedence
import { NFTTrait } from '@/resources/nfts/types';

const displayTypeRanks: Record<string, number> = {
  boost_number: 1,
  boost_percentage: 2,
  date: 3,
} as const;

/**
 * Comparator function for comparing two NFT traits by looking at their display type.
 * This sorting mimics how OpenSea displays traits separated by display type
 */
export default function uniqueAssetTraitDisplayTypeCompareFunction(
  a: NFTTrait,
  b: NFTTrait
): number {
  const aTypeRank = a.displayType ? displayTypeRanks?.[a.displayType] ?? 0 : 0;
  const bTypeRank = b.displayType ? displayTypeRanks?.[b.displayType] ?? 0 : 0;
  if (aTypeRank < bTypeRank) {
    return -1;
  } else if (aTypeRank > bTypeRank) {
    return 1;
  } else {
    return 0;
  }
}
