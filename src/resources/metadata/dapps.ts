import { formatUrl } from '@/components/DappBrowser/utils';
import { metadataClient } from '@/graphql';
import { createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';

export type Dapp = {
  name: string;
  shortName: string;
  description: string;
  url: string;
  urlDisplay: string;
  iconUrl: string;
  status: string;
  colors: {
    primary: string;
    fallback?: string | null;
    shadow?: string | null;
  };
  report: { url: string };
  search: {
    normalizedName: string;
    normalizedNameTokens: string[];
    normalizedUrlTokens: string[];
  };
};

const QUERY_KEY = createQueryKey('dApps', {}, { persisterVersion: 1 });

export function useDapps(): { dapps: Dapp[] } {
  const query = useQuery<Dapp[]>(
    QUERY_KEY,
    async () => {
      const dapps = (await metadataClient.getdApps())?.dApps?.filter(Boolean) ?? [];
      const processedDapps = dapps.map(dapp => {
        const normalizedName = dapp!.name.toLowerCase();
        const normalizedNameTokens = normalizedName.split(' ').filter(Boolean);
        const normalizedUrlTokens = dapp!.url
          .toLowerCase()
          .replace(/(^\w+:|^)\/\//, '') // Remove the protocol (like http:, https:) from the URL
          .split(/\/|\?|&|=|\./) // Split the URL into tokens by delimiters like /, ?, &, =, and .
          .filter(Boolean);

        return {
          name: dapp!.name,
          shortName: dapp!.shortName,
          description: dapp!.description,
          url: dapp!.url,
          urlDisplay: formatUrl(dapp!.url),
          iconUrl: dapp!.iconURL,
          status: dapp!.status,
          colors: { primary: dapp!.colors.primary, fallback: dapp!.colors.fallback, shadow: dapp!.colors.shadow },
          report: { url: dapp!.report.url },
          search: { normalizedName, normalizedNameTokens, normalizedUrlTokens },
        };
      });
      return processedDapps;
    },
    {
      cacheTime: Infinity,
      staleTime: 1000 * 60 * 5,
      retry: 3,
    }
  );
  return { dapps: query.data ?? [] };
}
