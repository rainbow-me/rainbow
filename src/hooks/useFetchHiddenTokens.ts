import { useQuery } from '@tanstack/react-query';

import { getHiddenTokenIds, hiddenTokensQueryKey, tokenPreferencesQueryOptions } from '@/state/nfts/tokenPreferences';

export default function useFetchHiddenTokens({ address }: { address: string }) {
  return useQuery(hiddenTokensQueryKey({ address }), () => getHiddenTokenIds(address), {
    enabled: Boolean(address),
    ...tokenPreferencesQueryOptions,
  });
}
