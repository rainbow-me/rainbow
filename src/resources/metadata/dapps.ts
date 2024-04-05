import { metadataClient } from '@/graphql';
import { createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { GetdAppsQuery } from '@/graphql/__generated__/metadata';

const QUERY_KEY = createQueryKey('dApps', {}, { persisterVersion: 1 });

export function useDapps() {
  return useQuery<GetdAppsQuery>(QUERY_KEY, async () => await metadataClient.getdApps(), {
    cacheTime: Infinity,
    staleTime: 1000 * 60 * 5,
  });
}
