import { useQuery } from '@tanstack/react-query';
import { getPreference } from '@/model/preferences';
import { time } from '@/utils';
import { queryClient } from '@/react-query';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';
import { isDataComplete } from '@/state/nfts/utils';
import { useNftsStore } from '@/state/nfts/nfts';

export const showcaseTokensQueryKey = ({ address }: { address: string }) => ['showcase-tokens', address];

const STABLE_ARRAY: string[] = [];

export async function getShowcase(address: string, isMigratingShowcase = false) {
  if (!address) {
    return STABLE_ARRAY;
  }

  const showcaseTokens = await getPreference('showcase', address);

  if (showcaseTokens?.showcase?.ids?.length) {
    const tokens = showcaseTokens.showcase.ids;

    if (!isDataComplete(tokens) && !isMigratingShowcase) {
      const previousOpenState = useOpenCollectionsStore.getState().openCollections['showcase'] ?? false;

      // first, close the showcase collection so we don't show an empty collection to the user
      useOpenCollectionsStore.getState().setCollectionOpen('showcase', false);

      const tokens = await useNftsStore.getState(address).fetchNftCollection('showcase', true);
      const flattenedTokens = Array.from(tokens.values()).flatMap(collection => Array.from(collection.keys()));
      if (previousOpenState) {
        useOpenCollectionsStore.getState().setCollectionOpen('showcase', previousOpenState);
      }

      return flattenedTokens;
    }

    const result = tokens.map((id: string) => id.toLowerCase());
    return result;
  }

  const previousData = queryClient.getQueryData<string[]>(showcaseTokensQueryKey({ address }));

  const fallbackResult = previousData?.map(id => id.toLowerCase()) ?? STABLE_ARRAY;
  return fallbackResult;
}

export async function fetchShowcaseTokens({ address }: { address: string }) {
  return queryClient.fetchQuery({
    queryKey: showcaseTokensQueryKey({ address }),
    queryFn: () => getShowcase(address),
  });
}

export default function useFetchShowcaseTokens({ address }: { address: string }) {
  return useQuery<string[]>(showcaseTokensQueryKey({ address }), () => getShowcase(address), {
    enabled: Boolean(address),
    cacheTime: time.infinity,
    staleTime: time.minutes(10),
    keepPreviousData: true,
  });
}
