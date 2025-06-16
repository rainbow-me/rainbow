import { useQuery } from '@tanstack/react-query';
import useAccountSettings from './useAccountSettings';
import { getHiddenTokens } from '@/handlers/localstorage/accountLocal';
import { getPreference } from '@/model/preferences';
import { time } from '@/utils';

export const hiddenTokensQueryKey = ({ address }: { address?: string }) => ['hidden-tokens', address];

export default function useFetchHiddenTokens({ address }: { address?: string }) {
  const { network } = useAccountSettings();

  return useQuery(
    hiddenTokensQueryKey({ address }),
    async () => {
      if (!address) return [];
      let hiddenTokens = await getHiddenTokens(address, network);
      const hiddenTokensFromCloud = await getPreference('hidden', address);
      if (hiddenTokensFromCloud?.hidden?.ids && hiddenTokensFromCloud?.hidden?.ids.length > 0) {
        hiddenTokens = hiddenTokensFromCloud.hidden.ids;
      }

      return hiddenTokens as string[];
    },
    {
      enabled: Boolean(address),
      cacheTime: time.hours(1),
      staleTime: time.minutes(10),
    }
  );
}
