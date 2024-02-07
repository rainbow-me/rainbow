import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import useAccountProfile from './useAccountProfile';
import useAccountSettings from './useAccountSettings';
import { useWallets, useWebData } from './index';
import { walletsSetSelected, walletsUpdate } from '@/redux/wallets';
import { useTheme } from '@/theme';
import { getNextEmojiWithColor } from '@/utils/profileUtils';

export default function useUpdateEmoji() {
  const { accountColor, accountName } = useAccountProfile();
  const { wallets, selectedWallet } = useWallets();
  const { updateWebProfile, getWebProfile } = useWebData();
  const { accountAddress } = useAccountSettings();
  const { colors } = useTheme();
  const dispatch = useDispatch();
  const saveInfo = useCallback(
    async (name: string, color: number) => {
      const walletId = selectedWallet.id;
      const newWallets: typeof wallets = {
        ...wallets,
        [walletId]: {
          ...wallets![walletId],
          addresses: wallets![walletId].addresses.map((singleAddress: { address: string }) =>
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

      await dispatch(walletsSetSelected(newWallets[walletId]));
      await dispatch(walletsUpdate(newWallets));
      updateWebProfile(accountAddress, name, (color !== undefined && colors.avatarBackgrounds[color]) || accountColor);
    },
    [accountAddress, accountColor, colors.avatarBackgrounds, dispatch, selectedWallet.id, updateWebProfile, wallets]
  );

  const setNextEmoji = useCallback(() => {
    const walletId = selectedWallet.id;
    const { label } =
      wallets![walletId].addresses.find(({ address }: { address: string }) => address.toLowerCase() === accountAddress.toLowerCase()) || {};
    const maybeEmoji = label?.split(' ')[0] ?? '';
    const { emoji, colorIndex } = getNextEmojiWithColor(maybeEmoji);
    const name = `${emoji} ${accountName}`;
    saveInfo(name, colorIndex);
  }, [accountAddress, accountName, saveInfo, selectedWallet.id, wallets]);

  return {
    getWebProfile,
    saveInfo,
    setNextEmoji,
  };
}
