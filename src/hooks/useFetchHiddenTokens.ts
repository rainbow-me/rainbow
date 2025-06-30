import { useQuery } from '@tanstack/react-query';
import { getPreference } from '@/model/preferences';
import { time } from '@/utils';
import { useOpenCollectionsStore } from '@/state/nfts/openCollectionsStore';
import { isDataComplete } from '@/state/nfts/utils';
import { useNftsStore } from '@/state/nfts/nfts';

export const hiddenTokensQueryKey = ({ address }: { address: string }) => ['hidden-tokens', address];

const STABLE_ARRAY: string[] = [];

export async function getHidden(address: string, isMigration = false) {
  if (!address) return STABLE_ARRAY;

  const hiddenTokens = await getPreference('hidden', address);
  if (hiddenTokens?.hidden?.ids?.length) {
    const tokens = hiddenTokens.hidden.ids;
    if (!isDataComplete(tokens) && !isMigration) {
      useOpenCollectionsStore.getState(address).setCollectionOpen('hidden', false);

      const tokens = await useNftsStore.getState(address).fetchNftCollection('hidden', true);
      const flattenedTokens = Array.from(tokens.values()).flatMap(collection => Array.from(collection.keys()));

      return flattenedTokens;
    }

    const result = tokens.map((id: string) => id.toLowerCase());
    return result;
  }

  return STABLE_ARRAY;
}

export default function useFetchHiddenTokens({ address }: { address: string }) {
  return useQuery(hiddenTokensQueryKey({ address }), () => getHidden(address), {
    enabled: Boolean(address),
    cacheTime: time.infinity,
    staleTime: time.minutes(10),
  });
}
