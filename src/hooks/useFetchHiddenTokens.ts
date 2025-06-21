import { useQuery } from '@tanstack/react-query';
import { getPreference } from '@/model/preferences';
import { time } from '@/utils';
import { queryClient } from '@/react-query';

export const hiddenTokensQueryKey = ({ address }: { address?: string }) => ['hidden-tokens', address];

const STABLE_ARRAY: string[] = [];

export async function getHidden(address: string) {
  if (!address) return STABLE_ARRAY;

  const previousData = queryClient.getQueryData<string[]>(hiddenTokensQueryKey({ address }));
  const hiddenTokens = await getPreference('hidden', address);
  if (hiddenTokens?.hidden?.ids && hiddenTokens?.hidden?.ids.length > 0) {
    return hiddenTokens.hidden.ids;
  }

  return previousData ?? STABLE_ARRAY;
}

export default function useFetchHiddenTokens({ address }: { address: string }) {
  return useQuery(hiddenTokensQueryKey({ address }), () => getHidden(address), {
    enabled: Boolean(address),
    cacheTime: time.infinity,
    staleTime: time.minutes(10),
  });
}
