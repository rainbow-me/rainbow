import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import useAccountProfile from './useAccountProfile';
import useAccountSettings from './useAccountSettings';
import { useWallets, useWebData } from './index';
import { useTheme } from '@rainbow-me/context';
import { walletsSetSelected, walletsUpdate } from '@rainbow-me/redux/wallets';
import { getNextEmojiWithColor } from '@rainbow-me/utils/profileUtils';

export default function useUpdateEmoji() {
  const { accountColor, accountName } = useAccountProfile();
  const { wallets, selectedWallet } = useWallets();
  const { updateWebProfile } = useWebData();
  const { accountAddress } = useAccountSettings();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const saveInfo = useCallback(
    async (name, color) => {
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
                    ...(name && { label: name }),
                    ...(color !== undefined && { color }),
                  }
                : singleAddress
          ),
        },
      };

      await dispatch(walletsSetSelected(newWallets[walletId]));
      await dispatch(walletsUpdate(newWallets));
      updateWebProfile(
        accountAddress,
        name,
        (color !== undefined && colors.avatarBackgrounds[color]) || accountColor
      );
    },
    [
      accountAddress,
      accountColor,
      colors.avatarBackgrounds,
      dispatch,
      selectedWallet.id,
      updateWebProfile,
      wallets,
    ]
  );

  const setRandomEmoji = useCallback(() => {
    const walletId = selectedWallet.id;
    const { color } =
      wallets[walletId].addresses.find(
        ({ address }: { address: string }) =>
          address.toLowerCase() === accountAddress.toLowerCase()
      ) || {};
    const { emoji, colorIndex } = getNextEmojiWithColor(color);
    const name = `${emoji} ${accountName}`;
    saveInfo(name, colorIndex);
  }, [accountAddress, accountName, saveInfo, selectedWallet.id, wallets]);

  return {
    saveInfo,
    setRandomEmoji,
  };
}
