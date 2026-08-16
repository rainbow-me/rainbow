import { useQuery } from '@tanstack/react-query';

import { getShowcaseTokenIds, showcaseTokensQueryKey, tokenPreferencesQueryOptions } from '@/state/nfts/tokenPreferences';

export default function useFetchShowcaseTokens({ address }: { address: string }) {
  return useQuery<string[]>(showcaseTokensQueryKey({ address }), () => getShowcaseTokenIds(address), {
    enabled: Boolean(address),
    ...tokenPreferencesQueryOptions,
  });
}
