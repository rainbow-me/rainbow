import { metadataClient } from '@/graphql';
import { createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { DAppStatus, GetdAppsQuery } from '@/graphql/__generated__/metadata';
import { useMemo } from 'react';
import { Trie } from '@/utils/trie';

type Dapp = {
  name: string;
  shortName: string;
  description: string;
  url: string;
  iconUrl: string;
  status: string;
  colors: {
    primary: string;
    fallback?: string | null;
    shadow?: string | null;
  };
  report: { url: string };
};

type X = GetdAppsQuery['dApps'][0];

const QUERY_KEY = createQueryKey('dApps', {}, { persisterVersion: 1 });

export function useDapps(): { dapps: Dapp[] } {
  const query = useQuery<GetdAppsQuery>(QUERY_KEY, async () => await metadataClient.getdApps(), {
    cacheTime: Infinity,
    staleTime: 1000 * 60 * 5,
  });

  const dapps = useMemo(() => query.data?.dApps?.filter(Boolean) ?? [], [query.data?.dApps]);

  return { dapps };
}
