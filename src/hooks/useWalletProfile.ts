import useUpdateEmoji from './useUpdateEmoji';
import { EthereumAddress } from '@rainbow-me/entities';
import { colors } from '@rainbow-me/styles';
import { profileUtils } from '@rainbow-me/utils';

export default function useWalletProfile() {
  const { getWebProfile } = useUpdateEmoji();

  const fetchWalletProfileMeta = async (
    address: EthereumAddress,
    timeoutMs = 500
  ) => {
    if (!address) return { color: null, emoji: null };

    const addressHashedColor =
      colors.avatarBackgrounds[
        profileUtils.addressHashedColorIndex(address) || 0
      ];
    const addressHashedEmoji = profileUtils.addressHashedEmoji(address);

    const walletProfile = await Promise.race([
      getWebProfile(address),
      new Promise(resolve => {
        setTimeout(resolve, timeoutMs, null);
      }),
    ]);

    return {
      color: walletProfile?.accountColor ?? addressHashedColor,
      emoji: walletProfile?.accountSymbol ?? addressHashedEmoji,
    };
  };
  return { fetchWalletProfileMeta };
}
