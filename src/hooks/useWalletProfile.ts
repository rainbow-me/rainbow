import { returnStringFirstEmoji } from '../helpers/emojiHandler';
import useUpdateEmoji from './useUpdateEmoji';
import { EthereumAddress } from '@rainbow-me/entities';
import { colors } from '@rainbow-me/styles';
import { profileUtils } from '@rainbow-me/utils';

export default function useWalletProfile() {
  const { getWebProfile } = useUpdateEmoji();

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

  const getWalletProfileMeta = async (
    address: EthereumAddress,
    profile: { color?: string; name?: string },
    isNewProfile: boolean,
    forceColor?: string
  ) => {
    const webProfile = await getWebProfile(address);

    return {
      color: getWalletColor(
        address,
        profile,
        webProfile,
        isNewProfile,
        forceColor
      ),
      emoji: getWalletEmoji(address, profile, webProfile, isNewProfile),
    };
  };
  return { getWalletProfileMeta };
}
