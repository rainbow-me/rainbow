import { getPreference } from '../model/preferences';
import { EthereumAddress } from '@rainbow-me/entities';
import { colors } from '@rainbow-me/styles';
import { profileUtils } from '@rainbow-me/utils';

export const fetchRainbowProfile = async (
  address: EthereumAddress,
  timeoutMs = 500
) => {
  const getWebProfile = async (address: EthereumAddress) => {
    const response: any = address && (await getPreference('profile', address));
    return response?.profile;
  };

  const rainbowProfile = await Promise.race([
    getWebProfile(address),
    new Promise(resolve => {
      setTimeout(resolve, timeoutMs, null);
    }),
  ]);

  const addressHashedColor =
    colors.avatarBackgrounds[
      profileUtils.addressHashedColorIndex(address) || 0
    ];
  const addressHashedEmoji = profileUtils.addressHashedEmoji(address);

  return {
    color: rainbowProfile?.accountColor ?? addressHashedColor,
    emoji: rainbowProfile?.accountSymbol ?? addressHashedEmoji,
  };
};
