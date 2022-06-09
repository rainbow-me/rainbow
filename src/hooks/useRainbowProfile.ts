import { useMemo } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { EthereumAddress } from '@rainbow-me/entities';
import {
  getRainbowProfile,
  saveRainbowProfile,
} from '@rainbow-me/handlers/localstorage/rainbowProfiles';
import { fetchRainbowProfile } from '@rainbow-me/handlers/rainbowProfiles';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';
import { colors } from '@rainbow-me/styles';
import { profileUtils } from '@rainbow-me/utils';

const queryKey = (address: EthereumAddress) => ['wallet-profiles', address];

const STALE_TIME = 10000;

export default function useRainbowProfile(
  address: EthereumAddress,
  config?: QueryConfig<typeof fetchRainbowProfile>
) {
  const addressHashedColor = useMemo(
    () =>
      colors.avatarBackgrounds[
        profileUtils.addressHashedColorIndex(address) || 0
      ],
    [address]
  );
  const addressHashedEmoji = useMemo(
    () => profileUtils.addressHashedEmoji(address),
    [address]
  );

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
      const rainbowProfile = (await fetchRainbowProfile(address)) ?? {
        color: addressHashedColor,
        emoji: addressHashedEmoji,
      };

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
