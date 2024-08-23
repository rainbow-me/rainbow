import { FeaturedResult } from '@/graphql/__generated__/arc';
import { FeaturedResults } from '@/resources/featuredResults/getFeaturedResults';

export const getFeaturedResultById = (data: FeaturedResults, id: FeaturedResult['id']): FeaturedResult | undefined => {
  return data.featuredResults.items?.find(item => item.id === id);
};
