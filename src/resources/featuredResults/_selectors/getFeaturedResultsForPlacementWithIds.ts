import { FeaturedResult } from '@/graphql/__generated__/arc';
import { FeaturedResults } from '@/resources/featuredResults/getFeaturedResults';

export const getFeaturedResultsForPlacementWithIds = (data: FeaturedResults, placement: FeaturedResult['placementSlug']) => {
  return (
    data.featuredResults.items?.reduce((acc, item) => {
      if (item.placementSlug === placement) {
        acc.push(item.id);
      }
      return acc;
    }, [] as string[]) ?? []
  );
};
