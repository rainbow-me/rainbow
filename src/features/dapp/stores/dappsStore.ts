import { createQueryStore } from '@storesjs/stores';

import { formatUrl } from '@/features/dapp-browser/utils/browserUtils';
import { time } from '@/framework/core/utils/time';
import { metadataClient } from '@/graphql';

export type Dapp = {
  colors: {
    fallback?: string | null;
    primary: string;
    shadow?: string | null;
  };
  iconUrl: string;
  isDirect?: boolean;
  name: string;
  report: { url: string };
  search: {
    normalizedName: string;
    normalizedNameTokens: string[];
    normalizedUrlTokens: string[];
  };
  shortName: string;
  status: string;
  trending: boolean;
  url: string;
  urlDisplay: string;
};

type DappsState = {
  dapps: Dapp[];
  findDappByHostname: (hostname: string) => Dapp | undefined;
};

export const useDappsStore = createQueryStore<Dapp[], never, DappsState>(
  {
    fetcher: fetchDapps,
    setData: ({ data, set }) => set({ dapps: data }),
    cacheTime: time.weeks(1),
    keepPreviousData: true,
    staleTime: time.minutes(30),
  },

  (_, get) => ({
    dapps: [],
    findDappByHostname: (hostname: string) => get().dapps.find(dapp => dapp.urlDisplay === hostname),
  }),

  { storageKey: 'browserDapps' }
);

async function fetchDapps(): Promise<Dapp[]> {
  const response = await metadataClient.getdApps();

  if (!response || !response.dApps) return [];

  return response.dApps
    .filter((dapp): dapp is NonNullable<typeof dapp> => !!dapp && dapp.status !== 'SCAM')
    .map(dapp => ({
      colors: { primary: dapp.colors.primary, fallback: dapp.colors.fallback, shadow: dapp.colors.shadow },
      iconUrl: dapp.iconURL,
      name: dapp.name,
      report: { url: dapp.report.url },
      search: {
        normalizedName: dapp.name.toLowerCase().split(' ').filter(Boolean).join(' '),
        normalizedNameTokens: dapp.name.toLowerCase().split(' ').filter(Boolean),
        normalizedUrlTokens: dapp.url
          .toLowerCase()
          .replace(/(^\w+:|^)\/\//, '') // Remove protocol from URL
          .split(/\/|\?|&|=|\./) // Split the URL into tokens
          .filter(Boolean),
      },
      shortName: dapp.shortName,
      status: dapp.status,
      trending: dapp.trending || false,
      url: dapp.url,
      urlDisplay: formatUrl(dapp.url),
    }));
}
