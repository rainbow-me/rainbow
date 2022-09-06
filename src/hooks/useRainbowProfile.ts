import { isValidAddress } from 'ethereumjs-util';
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
const TIMEOUT_MS = 5000;

export const rainbowProfileQueryKey = (address: EthereumAddress) => [
  'rainbow-profiles',
  address,
];

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

  const webData = await Promise.race([
    getPreference('profile', address),
    new Promise(resolve => {
      setTimeout(resolve, TIMEOUT_MS, null);
    }),
  ]);
  const profile = webData?.profile;

  const rainbowProfile = {
    color:
      profile?.accountColor ||
      colors.avatarBackgrounds[
        profileUtils.addressHashedColorIndex(address) || 0
      ],
    emoji: profile?.accountSymbol || profileUtils.addressHashedEmoji(address),
  };

  saveRainbowProfile(address, rainbowProfile);
  return rainbowProfile;
};

export async function prefetchRainbowProfile(
  address: EthereumAddress | null | undefined,
  { cacheFirst }: { cacheFirst?: boolean } = {}
) {
  if (!address || !isValidAddress(address)) return;

  queryClient.prefetchQuery(
    rainbowProfileQueryKey(address),
    async () => fetchRainbowProfile(address, { cacheFirst }),
    { staleTime: STALE_TIME }
  );
}

export default function useRainbowProfile(
  address: EthereumAddress | null | undefined,
  config?: QueryConfig<typeof fetchRainbowProfile>
) {
  const addressString = address ?? '';
  const isValid = isValidAddress(addressString);

  const { data, isLoading, isSuccess } = useQuery<
    UseQueryData<typeof fetchRainbowProfile>
  >(
    rainbowProfileQueryKey(addressString),
    async () => fetchRainbowProfile(addressString),
    {
      ...config,
      // Data will be stale for 10s to avoid dupe queries
      enabled: isValid,
      staleTime: STALE_TIME,
    }
  );

  return { isLoading, isSuccess, rainbowProfile: data };
}
