import useUpdateEmoji from './useUpdateEmoji';
import { EthereumAddress } from '@rainbow-me/entities';
import { colors } from '@rainbow-me/styles';
import { profileUtils } from '@rainbow-me/utils';

export default function useWalletProfile() {
  const { getWebProfile } = useUpdateEmoji();

  const fetchWalletProfileMeta = async (
    address: EthereumAddress,
    forceColor?: string
  ) => {
    const webProfile = await getWebProfile(address);

    const addressHashedColor =
      colors.avatarBackgrounds[
        profileUtils.addressHashedColorIndex(address) || 0
      ];
    const addressHashedEmoji = profileUtils.addressHashedEmoji(address);

    return {
      color: webProfile?.accountColor ?? forceColor ?? addressHashedColor,
      emoji: webProfile?.accountSymbol ?? addressHashedEmoji,
    };
  };
  return { fetchWalletProfileMeta };
}
