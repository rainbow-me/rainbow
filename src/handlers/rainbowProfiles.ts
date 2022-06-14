import { getPreference } from '../model/preferences';
import { EthereumAddress } from '@rainbow-me/entities';

const TIMEOUT_MS = 500;

const getWebProfile = async (address: EthereumAddress) => {
  const response: any = address && (await getPreference('profile', address));
  console.log('getting response');
  console.log(response);
  return response?.profile;
};

export const fetchRainbowProfile = async (address: EthereumAddress) => {
  const rainbowProfile = await Promise.race([
    getWebProfile(address),
    new Promise(resolve => {
      setTimeout(resolve, TIMEOUT_MS, null);
    }),
  ]);
  console.log('fetched');
  console.log(rainbowProfile);

  return rainbowProfile
    ? {
        color: rainbowProfile.accountColor,
        emoji: rainbowProfile.accountSymbol,
        image: rainbowProfile.accountImage,
      }
    : null;
};
