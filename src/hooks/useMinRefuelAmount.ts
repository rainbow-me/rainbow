import { useQuery } from '@tanstack/react-query';
import { ChainId, getMinRefuelAmount } from '@rainbow-me/swaps';
import { QueryConfigDeprecated, UseQueryData } from '@/react-query';

interface MinRefuelAmountParams {
  chainId: ChainId;
  toChainId: ChainId;
}

export const minRefuelAmountKey = ({ chainId, toChainId }: MinRefuelAmountParams) => ['min-refuel-amount', chainId, toChainId];

const STALE_TIME = 10000;

export default function useMinRefuelAmount(
  { chainId, toChainId }: MinRefuelAmountParams,
  config?: QueryConfigDeprecated<typeof getMinRefuelAmount>
) {
  return useQuery<UseQueryData<typeof getMinRefuelAmount>>(
    minRefuelAmountKey({ chainId, toChainId }),
    async () => getMinRefuelAmount({ chainId, toChainId }),
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      staleTime: STALE_TIME,
    }
  );
}
