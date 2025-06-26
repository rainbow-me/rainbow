import {
  setSelectedWallet,
  updateWallets,
  useAccountProfileInfo,
  useAccountAddress,
  useWallets,
  useSelectedWallet,
} from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme';
import { getNextEmojiWithColor } from '@/utils/profileUtils';
import { useCallback } from 'react';
import { useWebData } from './index';
import { isLowerCaseMatch } from '../utils';

export default function useUpdateEmoji() {
  const { accountColor, accountName } = useAccountProfileInfo();
  const wallets = useWallets();
  const selectedWallet = useSelectedWallet();
  const { updateWebProfile, getWebProfile } = useWebData();
  const accountAddress = useAccountAddress();
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
            isLowerCaseMatch(singleAddress.address, accountAddress)
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

      await setSelectedWallet(newWallets[walletId], accountAddress, newWallets);
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
