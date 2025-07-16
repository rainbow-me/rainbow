import { useQuery } from '@tanstack/react-query';
import { getPreference } from '@/model/preferences';
import { time } from '@/utils';
import { queryClient } from '@/react-query';
import { isDataComplete } from '@/state/nfts/utils';
import { useNftsStore } from '@/state/nfts/nfts';

export const showcaseTokensQueryKey = ({ address }: { address: string }) => ['showcase-tokens', address];

const STABLE_ARRAY: string[] = [];

export async function getShowcase(address: string, isMigration = false) {
  if (!address) {
    return STABLE_ARRAY;
  }

  const showcaseTokens = await getPreference('showcase', address);
  if (showcaseTokens?.showcase?.ids?.length) {
    const tokens = showcaseTokens.showcase.ids;
    if (!isDataComplete(tokens) && !isMigration) {
      const { fetch } = useNftsStore.getState(address);

      const data = await fetch(
        { collectionId: 'showcase', isMigration: true },
        {
          force: true,
          updateQueryKey: false,
          cacheTime: time.infinity,
          staleTime: time.infinity,
        }
      );

      if (!data) return tokens;

      useNftsStore.setState(state => {
        const now = Date.now();
        return {
          ...state,
          nftsByCollection: new Map([...state.nftsByCollection, ...data.nftsByCollection]),
          fetchedCollections: { ...state.fetchedCollections, ['showcase']: now },
        };
      });

      const flattenedTokens = Array.from(data.nftsByCollection.values()).flatMap(collection => Array.from(collection.keys()));
      return flattenedTokens;
    }

    const result = tokens.map((id: string) => id.toLowerCase());
    return result;
  }

  return STABLE_ARRAY;
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
  });
}
