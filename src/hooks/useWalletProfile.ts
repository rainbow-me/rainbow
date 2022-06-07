import useUpdateEmoji from './useUpdateEmoji';
import { EthereumAddress } from '@rainbow-me/entities';
import { colors } from '@rainbow-me/styles';
import { profileUtils } from '@rainbow-me/utils';

export default function useWalletProfile() {
  const { getWebProfile } = useUpdateEmoji();

  const fetchWalletProfileMeta = async (
    address: EthereumAddress,
    forceColor?: string,
    timeoutMs = 500
  ) => {
    const { accountColor, accountSymbol } = await Promise.race([
      getWebProfile(address),
      new Promise(resolve => {
        setTimeout(resolve, timeoutMs, {
          accountColor: null,
          accountSymbol: null,
        });
      }),
    ]);

    const addressHashedColor =
      colors.avatarBackgrounds[
        profileUtils.addressHashedColorIndex(address) || 0
      ];
    const addressHashedEmoji = profileUtils.addressHashedEmoji(address);

    return {
      color: accountColor ?? forceColor ?? addressHashedColor,
      emoji: accountSymbol ?? addressHashedEmoji,
    };
  };
  return { fetchWalletProfileMeta };
}
