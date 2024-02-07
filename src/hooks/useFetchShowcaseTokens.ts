import { useQuery } from '@tanstack/react-query';
import useAccountSettings from './useAccountSettings';
import { getShowcaseTokens } from '@/handlers/localstorage/accountLocal';
import { getPreference } from '@/model/preferences';

export const showcaseTokensQueryKey = ({ address }: { address?: string }) => ['showcase-tokens', address];

export default function useFetchShowcaseTokens({ address }: { address?: string }) {
  const { network } = useAccountSettings();

  return useQuery<string[]>(
    showcaseTokensQueryKey({ address }),
    async () => {
      if (!address) return [];

      let showcaseTokens = await getShowcaseTokens(address, network);
      const showcaseTokensFromCloud = (await getPreference('showcase', address)) as any | undefined;
      if (showcaseTokensFromCloud?.showcase?.ids && showcaseTokensFromCloud?.showcase?.ids.length > 0) {
        showcaseTokens = showcaseTokensFromCloud.showcase.ids;
      }

      return showcaseTokens;
    },
    {
      enabled: Boolean(address),
    }
  );
}
