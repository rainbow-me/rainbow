import { toLower } from 'lodash';
import { useCallback } from 'react';
import ImagePicker from 'react-native-image-crop-picker';
import { useDispatch } from 'react-redux';
import useAccountProfile from './useAccountProfile';
import useWallets from './useWallets';
import { useNavigation } from '@rainbow-me/navigation/Navigation';
import { walletsSetSelected, walletsUpdate } from '@rainbow-me/redux/wallets';
import Routes from '@rainbow-me/routes';
import { showActionSheetWithOptions } from '@rainbow-me/utils';

export default () => {
  const { wallets, selectedWallet } = useWallets();
  const dispatch = useDispatch();
  const { navigate } = useNavigation();
  const {
    accountAddress,
    accountColor,
    accountName,
    accountImage,
  } = useAccountProfile();

  const onRemovePhoto = useCallback(async () => {
    const newWallets = {
      ...wallets,
      [selectedWallet.id]: {
        ...wallets[selectedWallet.id],
        addresses: wallets[selectedWallet.id].addresses.map(account =>
          toLower(account.address) === toLower(accountAddress)
            ? { ...account, image: null }
            : account
        ),
      },
    };

    dispatch(walletsSetSelected(newWallets[selectedWallet.id]));
    await dispatch(walletsUpdate(newWallets));
  }, [dispatch, selectedWallet, accountAddress, wallets]);

  return useCallback(() => {
    const processPhoto = image => {
      const stringIndex = image?.path.indexOf('/tmp');
      const newWallets = {
        ...wallets,
        [selectedWallet.id]: {
          ...wallets[selectedWallet.id],
          addresses: wallets[selectedWallet.id].addresses.map(account =>
            toLower(account.address) === toLower(accountAddress)
              ? { ...account, image: `~${image?.path.slice(stringIndex)}` }
              : account
          ),
        },
      };

      dispatch(walletsSetSelected(newWallets[selectedWallet.id]));
      dispatch(walletsUpdate(newWallets));
    };

    const avatarActionSheetOptions = [
      'Choose from Library',
      ...(!accountImage ? ['Pick an Emoji'] : []),
      ...(accountImage ? ['Remove Photo'] : []),
      ...(ios ? ['Cancel'] : []),
    ];

    showActionSheetWithOptions(
      {
        cancelButtonIndex: avatarActionSheetOptions.length - 1,
        destructiveButtonIndex: accountImage
          ? avatarActionSheetOptions.length - 2
          : undefined,
        options: avatarActionSheetOptions,
      },
      async buttonIndex => {
        if (buttonIndex === 0) {
          ImagePicker.openPicker({
            cropperCircleOverlay: true,
            cropping: true,
          }).then(processPhoto);
        } else if (buttonIndex === 1) {
          if (!accountImage) {
            navigate(Routes.AVATAR_BUILDER, {
              initialAccountColor: accountColor,
              initialAccountName: accountName,
            });
          }
          if (accountImage) {
            onRemovePhoto();
          }
        }
      }
    );
  }, [
    accountAddress,
    accountColor,
    accountImage,
    accountName,
    dispatch,
    navigate,
    onRemovePhoto,
    selectedWallet.id,
    wallets,
  ]);
};
