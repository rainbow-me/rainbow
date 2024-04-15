import { metadataClient } from '@/graphql';
import { createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import { GetdAppsQuery } from '@/graphql/__generated__/metadata';
import { useMemo } from 'react';
import { Trie } from '@/utils/trie';

const QUERY_KEY = createQueryKey('dApps', {}, { persisterVersion: 1 });

export function useDapps() {
  const query = useQuery<GetdAppsQuery>(QUERY_KEY, async () => await metadataClient.getdApps(), {
    cacheTime: Infinity,
    staleTime: 1000 * 60 * 5,
  });

  const dappsTrie = useMemo(() => {
    const trie = new Trie();
    query.data?.dApps?.forEach(dapp => {
      const cleanUrl = dapp!.url.replace(/(^\w+:|^)\/\//, '');
      const urlTokens = cleanUrl.split(/\/|\?|&|=|\./);
      const nameTokens = dapp!.name.split(' ');
      const tokens = [...nameTokens, ...urlTokens];
      tokens.forEach(token => {
        trie.insert(token.toLowerCase(), dapp, dapp!.url);
      });
    });
    return trie;
  }, [query.data?.dApps]);

  return { dapps: query.data?.dApps || [], dappsTrie };
}
