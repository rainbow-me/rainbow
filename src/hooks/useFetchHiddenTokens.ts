import { useQuery } from 'react-query';
import useAccountSettings from './useAccountSettings';
import { getHiddenTokens } from '@rainbow-me/handlers/localstorage/accountLocal';
import { getPreference } from '@rainbow-me/model/preferences';

export const hiddenTokensQueryKey = ({ address }: { address?: string }) => [
  'hidden-tokens',
  address,
];

export default function useFetchHiddenTokens({
  address,
}: {
  address?: string;
}) {
  const { network } = useAccountSettings();

  return useQuery(
    hiddenTokensQueryKey({ address }),
    async () => {
      if (!address) return;
      let hiddenTokens = await getHiddenTokens(address, network);
      const hiddenTokensFromCloud = (await getPreference('hidden', address)) as
        | any
        | undefined;
      if (
        hiddenTokensFromCloud?.hidden?.ids &&
        hiddenTokensFromCloud?.hidden?.ids.length > 0
      ) {
        hiddenTokens = hiddenTokensFromCloud.hidden.ids;
      }

      return hiddenTokens as string[];
    },
    {
      enabled: Boolean(address),
    }
  );
}
