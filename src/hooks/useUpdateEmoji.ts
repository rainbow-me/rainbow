import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import { updateAccountInfo, useAccountAddress, useAccountProfileInfo, useSelectedWallet, useWallets } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme';
import { getNextEmojiWithColor } from '@/utils/profileUtils';
import { useCallback } from 'react';
import { isLowerCaseMatch } from '../utils';
import { useWebData } from './index';

export default function useUpdateEmoji() {
  const { accountColor, accountName } = useAccountProfileInfo();
  const wallets = useWallets();
  const selectedWallet = useSelectedWallet();
  const { updateWebProfile, getWebProfile } = useWebData();
  const accountAddress = useAccountAddress();
  const { colors } = useTheme();

  const saveInfo = useCallback(
    async ({ colorIndex, emoji }: { colorIndex: number; emoji?: string }) => {
      if (!selectedWallet) return;

      const existing = selectedWallet.addresses.find(singleAddress => isLowerCaseMatch(singleAddress.address, accountAddress));
      if (!existing) return;

      updateAccountInfo({
        walletId: selectedWallet.id,
        address: accountAddress,
        emoji,
        color: colorIndex,
        // We need to call this in order to make sure
        // the profile picture is removed in "Remove Photo" flow
        image: null,
      });

      const color = colorIndex !== undefined ? colors.avatarBackgrounds[colorIndex || accountColor] : undefined;
      if (color && emoji) {
        updateWebProfile(accountAddress, emoji, color);
      }
    },
    [accountAddress, accountColor, colors.avatarBackgrounds, selectedWallet, updateWebProfile]
  );

  const setNextEmoji = useCallback(() => {
    if (!selectedWallet || !wallets) return;
    const walletId = selectedWallet.id;
    const account = wallets[walletId].addresses.find(wallet => isLowerCaseMatch(wallet.address, accountAddress));
    if (!account) return;
    const { label } = account;
    const maybeEmoji = removeFirstEmojiFromString(label);
    const { emoji, colorIndex } = getNextEmojiWithColor(maybeEmoji);
    saveInfo({ emoji, colorIndex });
  }, [accountAddress, saveInfo, selectedWallet, wallets]);

  return {
    getWebProfile,
    saveInfo,
    setNextEmoji,
  };
}
