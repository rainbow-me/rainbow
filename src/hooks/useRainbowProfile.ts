import { isValidAddress } from 'ethereumjs-util';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/react-query/queryClient';
import { EthereumAddress } from '@rainbow-me/entities';
import {
  getRainbowProfile,
  saveRainbowProfile,
} from '@rainbow-me/handlers/localstorage/rainbowProfiles';
import { QueryConfig, UseQueryData } from '@rainbow-me/react-query/types';
import { colors } from '@rainbow-me/styles';
import { profileUtils } from '@rainbow-me/utils';

import { getPreference } from '../model/preferences';

const STALE_TIME = 10000;
const TIMEOUT_MS = 500;

export const rainbowProfileQueryKey = (address: EthereumAddress) => [
  'rainbow-profiles',
  address,
];

const getWebProfile = async (address: EthereumAddress) => {
  const response: any = address && (await getPreference('profile', address));
  return response?.profile;
};

export const fetchRainbowProfile = async (
  address: EthereumAddress | null | undefined,
  { cacheFirst }: { cacheFirst?: boolean } = {}
) => {
  if (!address || !isValidAddress(address)) return null;
  const cachedProfile = await getRainbowProfile(address);
  if (cachedProfile) {
    queryClient.setQueryData(rainbowProfileQueryKey(address), cachedProfile);
    if (cacheFirst) return cachedProfile;
  }
  const rainbowProfile = await Promise.race([
    getWebProfile(address),
    new Promise(resolve => {
      setTimeout(resolve, TIMEOUT_MS, null);
    }),
  ]);
  saveRainbowProfile(address, rainbowProfile);
  return rainbowProfile;
};

export default function useRainbowProfile(
  address: EthereumAddress | null | undefined,
  config?: QueryConfig<typeof fetchRainbowProfile>,
  fallback = true
) {
  const addressString = address ?? '';

  const addressHashedColor = useMemo(
    () =>
      fallback && addressString
        ? colors.avatarBackgrounds[
            profileUtils.addressHashedColorIndex(addressString) || 0
          ]
        : null,
    [addressString, fallback]
  );
  const addressHashedEmoji = useMemo(
    () =>
      fallback && addressString
        ? profileUtils.addressHashedEmoji(addressString)
        : null,
    [addressString, fallback]
  );

  const { data, isLoading, isSuccess } = useQuery<
    UseQueryData<typeof fetchRainbowProfile>
  >(
    rainbowProfileQueryKey(addressString),
    async () => {
      const cachedProfile = await getRainbowProfile(addressString);
      if (cachedProfile) {
        queryClient.setQueryData(
          rainbowProfileQueryKey(addressString),
          cachedProfile
        );
      }
      const rainbowProfile = await fetchRainbowProfile(addressString);

      rainbowProfile && saveRainbowProfile(addressString, rainbowProfile);
      return (
        rainbowProfile ?? {
          color: addressHashedColor,
          emoji: addressHashedEmoji,
        }
      );
    },
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      enabled: isValidAddress(addressString),
      staleTime: STALE_TIME,
    }
  );

  return { isLoading, isSuccess, rainbowProfile: data };
}
