import { getPreference } from '../model/preferences';
import { EthereumAddress } from '@rainbow-me/entities';

const TIMEOUT_MS = 500;

const getWebProfile = async (address: EthereumAddress) => {
  const response: any = address && (await getPreference('profile', address));
  return response?.profile;
};

export const fetchRainbowProfile = async (address: EthereumAddress) => {
  const rainbowProfile = await Promise.race([
    getWebProfile(address),
    new Promise(resolve => {
      setTimeout(resolve, TIMEOUT_MS, null);
    }),
  ]);

  return rainbowProfile
    ? {
        color: rainbowProfile.accountColor,
        emoji: rainbowProfile.accountSymbol,
      }
    : null;
};
