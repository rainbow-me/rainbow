import { useQuery } from '@tanstack/react-query';
import { getPreference } from '@/model/preferences';
import { time } from '@/utils';
import { queryClient } from '@/react-query';

export const showcaseTokensQueryKey = ({ address, network }: { address?: string; network?: string }) => [
  'showcase-tokens',
  address,
  network,
];

const STABLE_ARRAY: string[] = [];

export async function getShowcase(address: string) {
  if (!address) return STABLE_ARRAY;

  const showcaseTokens = await getPreference('showcase', address);
  if (showcaseTokens?.showcase?.ids && showcaseTokens?.showcase?.ids.length > 0) {
    return showcaseTokens.showcase.ids;
  }

  const previousData = queryClient.getQueryData<string[]>(showcaseTokensQueryKey({ address }));
  return previousData ?? STABLE_ARRAY;
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
