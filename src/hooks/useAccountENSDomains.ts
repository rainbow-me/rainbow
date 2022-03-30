import { useQuery } from 'react-query';

import useAccountSettings from './useAccountSettings';
import { EnsAccountRegistratonsData } from '@rainbow-me/apollo/queries';
import { fetchAccountRegistrations } from '@rainbow-me/handlers/ens';

export default function useAccountENSDomains() {
  const { accountAddress } = useAccountSettings();
  return useQuery<
    EnsAccountRegistratonsData['account']['registrations'][number]['domain'][]
  >(['domains', accountAddress], async () => {
    const result = await fetchAccountRegistrations(accountAddress);
    return (
      result.data?.account?.registrations?.map(({ domain }) => domain) || []
    );
  });
}
