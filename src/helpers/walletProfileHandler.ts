import { returnStringFirstEmoji } from './emojiHandler';
import { EthereumAddress } from '@rainbow-me/entities';
import { profileUtils } from '@rainbow-me/utils';
import { colors } from '@rainbow-me/styles';

export const getWalletProfileMeta = (
  address: EthereumAddress,
  profile: { color?: string; name?: string },
  webProfile: { accountColor?: string; accountSymbol?: string },
  isNewProfile: boolean,
  forceColor?: string
) => ({
  color: getWalletColor(address, profile, webProfile, isNewProfile, forceColor),
  emoji: getWalletEmoji(address, profile, webProfile, isNewProfile),
});

const getWalletEmoji = (
  address: EthereumAddress,
  profile: { color?: string; name?: string },
  webProfile: { accountColor?: string; accountSymbol?: string },
  isNewProfile: boolean
) => {
  const addressHashedEmoji = profileUtils.addressHashedEmoji(address);
  if (!webProfile) return addressHashedEmoji;
  if (webProfile?.accountSymbol) return webProfile?.accountSymbol;
  if (isNewProfile) return addressHashedEmoji;
  return returnStringFirstEmoji(profile?.name) ?? addressHashedEmoji;
};

const getWalletColor = (
  address: EthereumAddress,
  profile: { color?: string; name?: string },
  webProfile: { accountColor?: string; accountSymbol?: string },
  isNewProfile: boolean,
  forceColor?: string
) => {
  const addressHashedColor =
    colors.avatarBackgrounds[
      profileUtils.addressHashedColorIndex(address) || 0
    ];
  if (!webProfile) return forceColor ?? addressHashedColor;
  if (webProfile?.accountColor) return webProfile?.accountColor;
  if (forceColor) return forceColor;
  if (isNewProfile) return addressHashedColor;
  return profile?.color ?? addressHashedColor;
};
