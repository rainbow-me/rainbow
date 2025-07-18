import { useAccountProfileInfo, useAccountAddress, useSelectedWallet, updateAccountInfo, getWallets } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme';
import { getNextEmojiWithColor } from '@/utils/profileUtils';
import { useCallback } from 'react';
import { updateWebProfile } from '@/helpers/webData';

export default function useUpdateEmoji() {
  const { accountColor, accountSymbol } = useAccountProfileInfo();
  const selectedWallet = useSelectedWallet();
  const accountAddress = useAccountAddress();
  const { colors } = useTheme();

  const saveInfo = useCallback(
    async ({ color, emoji, name }: { color: number; emoji?: string; name?: string }) => {
      if (!selectedWallet) return;

      updateAccountInfo({
        address: accountAddress,
        color,
        emoji,
        label: name || undefined,
        walletId: selectedWallet.id,
      });

      const nextColor = color !== undefined ? colors.avatarBackgrounds[color || accountColor] : undefined;
      if (nextColor) {
        await updateWebProfile(accountAddress, name || '', nextColor, accountSymbol || null);
      }
    },
    [accountAddress, accountColor, accountSymbol, colors.avatarBackgrounds, selectedWallet]
  );

  const setNextEmoji = useCallback(() => {
    if (!selectedWallet) return;
    const walletId = selectedWallet.id;
    const { emoji: existingEmoji, label } =
      getWallets()?.[walletId]?.addresses.find(
        ({ address }: { address: string }) => address.toLowerCase() === accountAddress.toLowerCase()
      ) || {};
    const maybeEmoji = label?.split(' ')[0] ?? '';
    const { emoji, colorIndex } = getNextEmojiWithColor(existingEmoji || maybeEmoji);
    saveInfo({ color: colorIndex, emoji });
  }, [accountAddress, saveInfo, selectedWallet]);

  return {
    saveInfo,
    setNextEmoji,
  };
}
