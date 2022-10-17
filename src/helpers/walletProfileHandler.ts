import { returnStringFirstEmoji } from './emojiHandler';
import { EthereumAddress } from '@/entities';
import { profileUtils } from '@/utils';

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
  if (!webProfile) return null;
  if (webProfile?.accountSymbol) return webProfile?.accountSymbol;
  const addressHashedEmoji = profileUtils.addressHashedEmoji(address);
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
  if (!webProfile) return null;
  if (webProfile?.accountColor) return webProfile?.accountColor;
  if (forceColor) return forceColor;
  const addressHashedColor = profileUtils.addressHashedColorIndex(address);
  if (isNewProfile) return addressHashedColor;
  return profile?.color ?? addressHashedColor;
};
