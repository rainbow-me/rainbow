import { formatUrl } from '@/components/DappBrowser/utils';
import { metadataClient } from '@/graphql';
import { RainbowError, logger } from '@/logger';
import { createQueryKey } from '@/react-query';
import { useQuery } from '@tanstack/react-query';
import React, { createContext, useContext } from 'react';

export type Dapp = {
  name: string;
  shortName: string;
  description: string;
  url: string;
  urlDisplay: string;
  iconUrl: string;
  status: string;
  trending: boolean;
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
      try {
        const response = await metadataClient.getdApps();
        if (!response || !response.dApps) {
          return [];
        }

        return response.dApps
          .filter(dapp => dapp && dapp.status !== 'SCAM')
          .map(dapp => {
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
              trending: dapp!.trending || false,
              url: dapp!.url,
              urlDisplay: formatUrl(dapp!.url),
              iconUrl: dapp!.iconURL,
              status: dapp!.status,
              colors: { primary: dapp!.colors.primary, fallback: dapp!.colors.fallback, shadow: dapp!.colors.shadow },
              report: { url: dapp!.report.url },
              search: { normalizedName, normalizedNameTokens, normalizedUrlTokens },
            };
          });
      } catch (e: any) {
        logger.error(new RainbowError('Failed to fetch dApps'), {
          message: e.message,
        });
        return [];
      }
    },
    {
      staleTime: 1000 * 60 * 60 * 24, // 24 hours
      cacheTime: 1000 * 60 * 60 * 24 * 7, // 7 days
      retry: 3,
      keepPreviousData: true,
    }
  );
  return { dapps: query.data ?? [] };
}

interface DappsContextType {
  dapps: Dapp[];
}

const DEFAULT_DAPPS_CONTEXT: DappsContextType = {
  dapps: [],
};

const DappsContext = createContext<DappsContextType>(DEFAULT_DAPPS_CONTEXT);

export const useDappsContext = () => useContext(DappsContext);

export const DappsContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { dapps } = useDapps();
  return <DappsContext.Provider value={{ dapps }}>{children}</DappsContext.Provider>;
};
