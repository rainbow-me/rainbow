import { updateWallets, useWalletsStore } from '@/state/wallets/wallets';
import { useTheme } from '@/theme';
import { getNextEmojiWithColor } from '@/utils/profileUtils';
import { useCallback } from 'react';
import { setSelectedWallet } from '../model/wallet';
import { useWebData } from './index';
import useAccountProfile from './useAccountProfile';
import useAccountSettings from './useAccountSettings';

export default function useUpdateEmoji() {
  const { accountColor, accountName } = useAccountProfile();
  const wallets = useWalletsStore(state => state.wallets);
  const selectedWallet = useWalletsStore(state => state.selected);
  const { updateWebProfile, getWebProfile } = useWebData();
  const { accountAddress } = useAccountSettings();
  const { colors } = useTheme();

  const saveInfo = useCallback(
    async (name: string, color: number) => {
      if (!selectedWallet) return;

      const walletId = selectedWallet.id;
      const newWallets = {
        ...wallets,
        [walletId]: {
          ...wallets![walletId],
          addresses: wallets![walletId].addresses.map(singleAddress =>
            singleAddress.address.toLowerCase() === accountAddress.toLowerCase()
              ? {
                  ...singleAddress,
                  ...(name && { label: name }),
                  ...(color !== undefined && { color }),
                  // We need to call this in order to make sure
                  // the profile picture is removed in "Remove Photo" flow
                  image: null,
                }
              : singleAddress
          ),
        },
      };

      setSelectedWallet(newWallets[walletId]);
      updateWallets(newWallets);
      const nextColor = color !== undefined ? colors.avatarBackgrounds[color || accountColor] : undefined;
      if (nextColor) {
        updateWebProfile(accountAddress, name, nextColor);
      }
    },
    [accountAddress, accountColor, colors.avatarBackgrounds, selectedWallet, updateWebProfile, wallets]
  );

  const setNextEmoji = useCallback(() => {
    if (!selectedWallet || !wallets) return;

    const walletId = selectedWallet.id;
    const { label } =
      wallets[walletId].addresses.find(({ address }: { address: string }) => address.toLowerCase() === accountAddress.toLowerCase()) || {};
    const maybeEmoji = label?.split(' ')[0] ?? '';
    const { emoji, colorIndex } = getNextEmojiWithColor(maybeEmoji);
    const name = `${emoji} ${accountName}`;
    saveInfo(name, colorIndex);
  }, [accountAddress, accountName, saveInfo, selectedWallet, wallets]);

  return {
    getWebProfile,
    saveInfo,
    setNextEmoji,
  };
}
