import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { useAccountProfile, useWallets, useWebData } from './index';
import { walletsSetSelected, walletsUpdate } from '@rainbow-me/redux/wallets';
import { RainbowAccount } from '@rainbow-me/model/wallet';

export default function useUpdateAvatar() {
  const { wallets, selectedWallet } = useWallets();
  const { updateWebProfile } = useWebData();
  const { accountAddress } = useAccountSettings();
  const { accountColor, accountImage, accountSymbol } = useAccountProfile();
  const dispatch = useDispatch();

  const saveInfo = useCallback(
    async (color, emoji, image, shouldRemoveImage = false) => {
      if (!color && !emoji && !(image || shouldRemoveImage)) return;
      const newColor = color || accountColor;
      const newEmoji = emoji || accountSymbol;
      const newImage = shouldRemoveImage ? null : image || accountImage;
      const walletId = selectedWallet.id;
      const newWallets = {
        ...wallets,
        [selectedWallet.id]: {
          ...wallets[selectedWallet.id],
          addresses: wallets[selectedWallet.id].addresses.map(
            (account: RainbowAccount) =>
              account.address.toLowerCase() === accountAddress.toLowerCase()
                ? {
                    ...account,
                    color: newColor,
                    emoji: newEmoji,
                    image: newImage,
                  }
                : account
          ),
        },
      };

      await dispatch(walletsSetSelected(newWallets[walletId]));
      await dispatch(walletsUpdate(newWallets));
      updateWebProfile(accountAddress, newColor, newEmoji, newImage);
    },
    [
      accountAddress,
      accountColor,
      accountImage,
      accountSymbol,
      dispatch,
      selectedWallet.id,
      updateWebProfile,
      wallets,
    ]
  );

  return { saveInfo };
}
