import { type FeaturedResult } from '@/graphql/__generated__/arc';
import { type FeaturedResults } from '@/resources/featuredResults/getFeaturedResults';

export const getFeaturedResultsForPlacement = (data: FeaturedResults, placement: FeaturedResult['placementSlug']) => {
  return data.featuredResults.items?.filter(item => item.placementSlug === placement) ?? [];
};
