import { useQuery } from '@tanstack/react-query';

import { time } from '@/framework/core/utils/time';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { getPreference } from '@/model/preferences';
import { queryClient } from '@/react-query';
import { useNftsStore } from '@/state/nfts/nfts';
import { isDataComplete } from '@/state/nfts/utils';
import { getWalletWithAccount } from '@/state/wallets/walletsStore';

export const hiddenTokensQueryKey = ({ address }: { address: string }) => ['hidden-tokens', address];

const STABLE_ARRAY: string[] = [];
const STALE_TIME = time.minutes(10);
const CACHE_TIME = time.infinity;

export async function getHidden(address: string, isMigration = false) {
  if (!address) return STABLE_ARRAY;

  const hiddenTokens = await getPreference('hidden', address);
  if (hiddenTokens?.hidden?.ids?.length) {
    const tokens = hiddenTokens.hidden.ids;
    if (!isDataComplete(tokens) && !isMigration) {
      const isReadOnlyWallet = getWalletWithAccount(address)?.type === EthereumWalletType.readOnly;
      if (isReadOnlyWallet) return STABLE_ARRAY;

      const { fetch } = useNftsStore.getState(address);

      const data = await fetch(
        { collectionId: 'hidden', isMigration: true },
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
          fetchedCollections: { ...state.fetchedCollections, ['hidden']: now },
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

export async function fetchHiddenTokens({ address }: { address: string }) {
  return queryClient.fetchQuery({
    queryKey: hiddenTokensQueryKey({ address }),
    queryFn: () => getHidden(address),
    cacheTime: CACHE_TIME,
    staleTime: STALE_TIME,
  });
}

export default function useFetchHiddenTokens({ address }: { address: string }) {
  return useQuery(hiddenTokensQueryKey({ address }), () => getHidden(address), {
    enabled: Boolean(address),
    cacheTime: CACHE_TIME,
    staleTime: STALE_TIME,
  });
}
