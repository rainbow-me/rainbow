import { toLower } from 'lodash';
import { useCallback, useMemo } from 'react';
import { Linking } from 'react-native';
import { useDispatch } from 'react-redux';
import { RainbowAccount } from '../model/wallet';
import { useNavigation } from '../navigation/Navigation';
import useAccountProfile from './useAccountProfile';
import useENSProfile from './useENSProfile';
import useImagePicker from './useImagePicker';
import useWallets from './useWallets';
import {
  enableActionsOnReadOnlyWallet,
  PROFILES,
  useExperimentalFlag,
} from '@rainbow-me/config';
import { walletsSetSelected, walletsUpdate } from '@rainbow-me/redux/wallets';
import Routes from '@rainbow-me/routes';
import { buildRainbowUrl, showActionSheetWithOptions } from '@rainbow-me/utils';

export default () => {
  const { wallets, selectedWallet, isReadOnlyWallet } = useWallets();
  const dispatch = useDispatch();
  const { navigate } = useNavigation();
  const {
    accountAddress,
    accountColor,
    accountName,
    accountImage,
    accountENS,
  } = useAccountProfile();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const ensProfile = useENSProfile(accountENS, {
    enabled: Boolean(accountENS),
  });
  const { openPicker } = useImagePicker();

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

  const onAvatarChooseImage = useCallback(async () => {
    const image = await openPicker({
      cropperCircleOverlay: true,
      cropping: true,
    });
    processPhoto(image);
  }, [openPicker, processPhoto]);

  const onAvatarCreateProfile = useCallback(() => {
    navigate(Routes.REGISTER_ENS_NAVIGATOR);
  }, [navigate]);

  const onAvatarWebProfile = useCallback(() => {
    const rainbowURL = buildRainbowUrl(null, accountENS, accountAddress);
    if (rainbowURL) {
      Linking.openURL(rainbowURL);
    }
  }, [accountAddress, accountENS]);

  const onAvatarPress = useCallback(() => {
    const isENSProfile = profilesEnabled && ensProfile?.isOwner;

    const avatarActionSheetOptions = (isENSProfile
      ? [
          'View Profile',
          ...(!isReadOnlyWallet || enableActionsOnReadOnlyWallet
            ? ['Edit Profile']
            : []),
        ]
      : [
          'Choose from Library',
          ...(!accountImage ? ['Pick an Emoji'] : []),
          ...(accountImage ? ['Remove Photo'] : []),
          ...(!isReadOnlyWallet || enableActionsOnReadOnlyWallet
            ? ['Create your Profile']
            : []),
        ]
    ).concat(ios ? ['Cancel'] : []);

    const callback = async (buttonIndex: Number) => {
      if (isENSProfile) {
        if (buttonIndex === 0) {
          navigate(Routes.PROFILE_SHEET, {
            address: accountENS,
          });
        } else if (buttonIndex === 1 && !isReadOnlyWallet) {
          navigate(Routes.REGISTER_ENS_NAVIGATOR, {
            ensName: accountENS,
            mode: 'edit',
          });
        }
      } else {
        if (buttonIndex === 0) {
          onAvatarChooseImage();
        } else if (buttonIndex === 1) {
          if (!accountImage) {
            onAvatarPickEmoji();
          }
          if (accountImage) {
            onAvatarRemovePhoto();
          }
        } else if (buttonIndex === 2) {
          onAvatarCreateProfile();
        }
      }
    };
    showActionSheetWithOptions(
      {
        cancelButtonIndex: avatarActionSheetOptions.length - 1,
        destructiveButtonIndex:
          !isENSProfile && accountImage
            ? avatarActionSheetOptions.length - 2
            : undefined,
        options: avatarActionSheetOptions,
      },
      (buttonIndex: Number) => callback(buttonIndex)
    );
  }, [
    profilesEnabled,
    ensProfile?.isOwner,
    isReadOnlyWallet,
    accountImage,
    navigate,
    accountENS,
    onAvatarChooseImage,
    onAvatarCreateProfile,
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
    onAvatarCreateProfile,
    onAvatarPickEmoji,
    onAvatarPress,
    onAvatarRemovePhoto,
    onAvatarWebProfile,
  };
};
