import { FeaturedResults } from '@/resources/featuredResults/getFeaturedResults';

export const getFeaturedResultsById = (data: FeaturedResults) => {
  return data.featuredResults.items?.map(item => item.id) ?? [];
};
