import { toLower } from 'lodash';
import { useCallback, useMemo } from 'react';
import { Linking } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { useDispatch } from 'react-redux';
import { RainbowAccount } from '../model/wallet';
import { useNavigation } from '../navigation/Navigation';
import useAccountProfile from './useAccountProfile';
import useWallets from './useWallets';
import { walletsSetSelected, walletsUpdate } from '@rainbow-me/redux/wallets';
import Routes from '@rainbow-me/routes';
import { buildRainbowUrl, showActionSheetWithOptions } from '@rainbow-me/utils';

export default () => {
  const { wallets, selectedWallet } = useWallets();
  const dispatch = useDispatch();
  const { navigate } = useNavigation();
  const {
    accountAddress,
    accountColor,
    accountName,
    accountImage,
    accountENS,
  } = useAccountProfile();

  const onAvatarRemovePhoto = useCallback(async () => {
    const newWallets = {
      ...wallets,
      [selectedWallet.id]: {
        ...wallets[selectedWallet.id],
        addresses: wallets[
          selectedWallet.id
        ].addresses.map((account: RainbowAccount) =>
          toLower(account.address) === toLower(accountAddress)
            ? { ...account, image: null }
            : account
        ),
      },
    };

    dispatch(walletsSetSelected(newWallets[selectedWallet.id]));
    await dispatch(walletsUpdate(newWallets));
  }, [dispatch, selectedWallet, accountAddress, wallets]);

  const processPhoto = useCallback(
    (image: any) => {
      const stringIndex = image?.path.indexOf('/tmp');
      const newWallets = {
        ...wallets,
        [selectedWallet.id]: {
          ...wallets[selectedWallet.id],
          addresses: wallets[
            selectedWallet.id
          ].addresses.map((account: RainbowAccount) =>
            toLower(account.address) === toLower(accountAddress)
              ? { ...account, image: `~${image?.path.slice(stringIndex)}` }
              : account
          ),
        },
      };

      dispatch(walletsSetSelected(newWallets[selectedWallet.id]));
      dispatch(walletsUpdate(newWallets));
    },
    [accountAddress, dispatch, selectedWallet.id, wallets]
  );

  const onAvatarPickEmoji = useCallback(() => {
    navigate(Routes.AVATAR_BUILDER, {
      initialAccountColor: accountColor,
      initialAccountName: accountName,
    });
  }, [accountColor, accountName, navigate]);

  const onAvatarChooseImage = useCallback(() => {
    ImagePicker.openPicker({
      cropperCircleOverlay: true,
      cropping: true,
    }).then(processPhoto);
  }, [processPhoto]);

  const onAvatarWebProfile = useCallback(() => {
    const rainbowURL = buildRainbowUrl(null, accountENS, accountAddress);
    if (rainbowURL) {
      Linking.openURL(rainbowURL);
    }
  }, [accountAddress, accountENS]);

  const onAvatarPress = useCallback(() => {
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
      async (buttonIndex: Number) => {
        if (buttonIndex === 0) {
          onAvatarChooseImage();
        } else if (buttonIndex === 1) {
          if (!accountImage) {
            onAvatarPickEmoji();
          }
          if (accountImage) {
            onAvatarRemovePhoto();
          }
        }
      }
    );
  }, [
    accountImage,
    onAvatarChooseImage,
    onAvatarPickEmoji,
    onAvatarRemovePhoto,
  ]);

  const avatarOptions = useMemo(
    () => [
      {
        id: 'newimage',
        label: 'Choose from Library',
        uiImage: 'photo',
      },
      ...(!accountImage
        ? [
            {
              id: 'newemoji',
              label: 'Pick an Emoji',
              uiImage: 'face.smiling',
            },
          ]
        : []),
      ...(accountImage
        ? [
            {
              id: 'removeimage',
              label: 'Remove Photo',
              uiImage: 'trash',
            },
          ]
        : []),
      {
        id: 'webprofile',
        label: 'View Web Profile',
        uiImage: 'safari',
      },
    ],
    [accountImage]
  );

  return {
    avatarOptions,
    onAvatarChooseImage,
    onAvatarPickEmoji,
    onAvatarPress,
    onAvatarRemovePhoto,
    onAvatarWebProfile,
  };
};
