import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import useAccountProfile from './useAccountProfile';
import useAccountSettings from './useAccountSettings';
import { useWallets, useWebData } from './index';
import { walletsSetSelected, walletsUpdate } from '@rainbow-me/redux/wallets';
import { getNextEmojiWithColor } from '@rainbow-me/utils/profileUtils';

export default function useUpdateAvatar() {
  const { accountSymbol } = useAccountProfile();
  const { wallets, selectedWallet } = useWallets();
  const { updateWebProfile } = useWebData();
  const { accountAddress } = useAccountSettings();
  const dispatch = useDispatch();
  const saveInfo = useCallback(
    async (color, emoji) => {
      if (!color && !emoji) return;
      const walletId = selectedWallet.id;
      const newWallets = {
        ...wallets,
        [walletId]: {
          ...wallets[walletId],
          addresses: wallets[walletId].addresses.map(
            (singleAddress: { address: string }) =>
              singleAddress.address.toLowerCase() ===
              accountAddress.toLowerCase()
                ? {
                    ...singleAddress,
                    color,
                    emoji,
                  }
                : singleAddress
          ),
        },
      };

      await dispatch(walletsSetSelected(newWallets[walletId]));
      await dispatch(walletsUpdate(newWallets));
      updateWebProfile(accountAddress, color, emoji);
    },
    [accountAddress, dispatch, selectedWallet.id, updateWebProfile, wallets]
  );

  const setNextEmoji = useCallback(() => {
    const { emoji, color } = getNextEmojiWithColor(accountSymbol);
    saveInfo(color, emoji);
  }, [accountSymbol, saveInfo]);

  return { saveInfo, setNextEmoji };
}
