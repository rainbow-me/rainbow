import { useQuery } from 'react-query';
import { web3Provider } from '@rainbow-me/handlers/web3';
import { getFirstTransactionTimestamp } from '@rainbow-me/utils/ethereumUtils';

export default function useFirstTransactionTimestamp({
  ensName,
}: {
  ensName: string;
}) {
  return useQuery(
    ['first-transaction-timestamp', ensName],
    async () => {
      const address = await web3Provider.resolveName(ensName);
      return address ? getFirstTransactionTimestamp(address) : undefined;
    },
    {
      cacheTime: Infinity,
      enabled: Boolean(ensName),
      // First transaction timestamp will obviously never be stale.
      // So we won't fetch / refetch it again.
      staleTime: Infinity,
    }
  );
}
