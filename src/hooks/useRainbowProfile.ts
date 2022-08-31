import { isValidAddress } from 'ethereumjs-util';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/react-query/queryClient';
import { EthereumAddress } from '@rainbow-me/entities';
import {
  getRainbowProfile,
  saveRainbowProfile,
} from '@rainbow-me/handlers/localstorage/rainbowProfiles';
import { fetchRainbowProfile } from '@rainbow-me/handlers/rainbowProfiles';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';
import { colors } from '@rainbow-me/styles';
import { profileUtils } from '@rainbow-me/utils';

const STALE_TIME = 10000;

export const rainbowProfileQueryKey = (address: EthereumAddress) => [
  'rainbow-profiles',
  address,
];

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

  const { data, isLoading, isSuccess } = useQuery<
    UseQueryData<typeof fetchRainbowProfile>
  >(
    rainbowProfileQueryKey(address),
    async () => {
      const cachedProfile = await getRainbowProfile(address);
      if (cachedProfile) {
        queryClient.setQueryData(
          rainbowProfileQueryKey(address),
          cachedProfile
        );
      }
      const rainbowProfile = await fetchRainbowProfile(address);

      rainbowProfile && saveRainbowProfile(address, rainbowProfile);
      return (
        rainbowProfile || {
          color: addressHashedColor,
          emoji: addressHashedEmoji,
        }
      );
    },
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      enabled: isValidAddress(address),
      staleTime: STALE_TIME,
    }
  );

  return { isLoading, isSuccess, rainbowProfile: data };
}
