import { useQuery, useQueryClient } from 'react-query';
import { EthereumAddress } from '@rainbow-me/entities';
import {
  getRainbowProfile,
  saveRainbowProfile,
} from '@rainbow-me/handlers/localstorage/rainbowProfiles';
import { fetchRainbowProfile } from '@rainbow-me/handlers/rainbowProfiles';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';

const queryKey = (address: EthereumAddress) => ['wallet-profiles', address];

const STALE_TIME = 10000;

export default function useRainbowProfile(
  address: EthereumAddress,
  config?: QueryConfig<typeof fetchRainbowProfile>
) {
  const queryClient = useQueryClient();
  const { data, isLoading, isSuccess } = useQuery<
    UseQueryData<typeof fetchRainbowProfile>
  >(
    queryKey(address),
    async () => {
      const cachedProfile = await getRainbowProfile(address);
      if (cachedProfile) {
        queryClient.setQueryData(queryKey(address), cachedProfile);
      }
      const rainbowProfile = await fetchRainbowProfile(address);
      saveRainbowProfile(address, rainbowProfile);
      return rainbowProfile;
    },
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      staleTime: STALE_TIME,
    }
  );

  return { data, isLoading, isSuccess };
}
