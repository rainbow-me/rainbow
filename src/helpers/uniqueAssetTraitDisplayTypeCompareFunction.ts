import { UniqueAsset } from '@rainbow-me/entities';

type Trait = UniqueAsset['traits'][number];
type ReturnType = -1 | 0 | 1;

// lower number = higher precedence
const displayTypeRanks = new Map<string | undefined | null, number>([
  [undefined, 0],
  [null, 0],
  ['number', 0],
  ['boost_number', 1],
  ['boost_percentage', 1],
  ['date', 2],
]);

/**
 * Comparator function for comparing two NFT traits by looking at their display type.
 * The intent of this sorting is to mimic how OpenSea displays traits separated by display type.
 */
export default function uniqueAssetTraitDisplayTypeCompareFunction(
  a: Trait,
  b: Trait
): ReturnType {
  const aTypeRank = displayTypeRanks.get(a.display_type) ?? 99;
  const bTypeRank = displayTypeRanks.get(b.display_type) ?? 100;
  if (aTypeRank < bTypeRank) {
    return -1;
  } else if (aTypeRank > bTypeRank) {
    return 1;
  } else {
    return 0;
  }
}
