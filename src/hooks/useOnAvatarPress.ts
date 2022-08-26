import lang from 'i18n-js';
import { useCallback, useEffect, useMemo } from 'react';
import { Linking } from 'react-native';
import { ImageOrVideo } from 'react-native-image-crop-picker';
import { useDispatch } from 'react-redux';
import { RainbowAccount } from '../model/wallet';
import { useNavigation } from '../navigation/Navigation';
import useAccountProfile from './useAccountProfile';
import useENSAvatar, { prefetchENSAvatar } from './useENSAvatar';
import { prefetchENSCover } from './useENSCover';
import useENSOwner from './useENSOwner';
import { prefetchENSRecords } from './useENSRecords';
import useENSRegistration from './useENSRegistration';
import useImagePicker from './useImagePicker';
import useUpdateEmoji from './useUpdateEmoji';
import useWallets from './useWallets';
import { analytics } from '@rainbow-me/analytics';
import {
  enableActionsOnReadOnlyWallet,
  PROFILES,
  useExperimentalFlag,
} from '@rainbow-me/config';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
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
  const profileEnabled = Boolean(accountENS);

  const { isOwner } = useENSOwner(accountENS, {
    enabled: profileEnabled && profilesEnabled,
  });

  const { data: avatar } = useENSAvatar(accountENS, {
    enabled: profileEnabled && profilesEnabled,
  });
  const hasENSAvatar = Boolean(avatar?.imageUrl);

  const { openPicker } = useImagePicker();
  const { startRegistration } = useENSRegistration();
  const { setNextEmoji } = useUpdateEmoji();

  useEffect(() => {
    if (accountENS) {
      prefetchENSAvatar(accountENS);
      prefetchENSCover(accountENS);
      prefetchENSRecords(accountENS);
    }
  }, [accountENS]);

  const onAvatarRemovePhoto = useCallback(async () => {
    const newWallets: typeof wallets = {
      ...wallets,
      [selectedWallet.id]: {
        ...wallets![selectedWallet.id],
        addresses: wallets![
          selectedWallet.id
        ].addresses.map((account: RainbowAccount) =>
          account.address.toLowerCase() === accountAddress?.toLowerCase()
            ? { ...account, image: null }
            : account
        ),
      },
    };

    dispatch(walletsSetSelected(newWallets[selectedWallet.id]));
    await dispatch(walletsUpdate(newWallets));
  }, [dispatch, selectedWallet, accountAddress, wallets]);

  const processPhoto = useCallback(
    (image: ImageOrVideo | null) => {
      const stringIndex = image?.path.indexOf('/tmp');
      const imagePath = ios
        ? `~${image?.path.slice(stringIndex)}`
        : image?.path;
      const newWallets: typeof wallets = {
        ...wallets,
        [selectedWallet.id]: {
          ...wallets![selectedWallet.id],
          addresses: wallets![
            selectedWallet.id
          ].addresses.map((account: RainbowAccount) =>
            account.address.toLowerCase() === accountAddress?.toLowerCase()
              ? { ...account, image: imagePath }
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
    if (!image) return;
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

  const onAvatarViewProfile = useCallback(() => {
    analytics.track('Viewed ENS profile', {
      category: 'profiles',
      ens: accountENS,
      from: 'Transaction list',
    });
    navigate(Routes.PROFILE_SHEET, {
      address: accountENS,
      fromRoute: 'ProfileAvatar',
    });
  }, [accountENS, navigate]);

  const onAvatarEditProfile = useCallback(() => {
    startRegistration(accountENS, REGISTRATION_MODES.EDIT);
    navigate(Routes.REGISTER_ENS_NAVIGATOR, {
      ensName: accountENS,
      mode: REGISTRATION_MODES.EDIT,
    });
  }, [accountENS, navigate, startRegistration]);

  const isReadOnly = isReadOnlyWallet && !enableActionsOnReadOnlyWallet;

  const isENSProfile = profilesEnabled && profileEnabled && isOwner;

  const callback = useCallback(
    async (buttonIndex: number) => {
      if (buttonIndex === 0) {
        if (isENSProfile) {
          if (!isReadOnly) {
            onAvatarEditProfile();
          } else {
            onAvatarViewProfile();
          }
        } else {
          if (!isReadOnly) {
            onAvatarCreateProfile();
          } else {
            onAvatarChooseImage();
          }
        }
      } else if (buttonIndex === 1) {
        if (isENSProfile) {
          if (!isReadOnly) {
            onAvatarViewProfile();
          } else {
            if (!hasENSAvatar) {
              onAvatarChooseImage();
            }
          }
        } else {
          if (!isReadOnly) {
            onAvatarChooseImage();
          } else {
            if (!accountImage) {
              if (ios) {
                onAvatarPickEmoji();
              } else {
                setNextEmoji();
              }
            } else {
              onAvatarRemovePhoto();
            }
          }
        }
      } else if (buttonIndex === 2) {
        if (!hasENSAvatar) {
          if (isENSProfile) {
            if (!isReadOnly) {
              onAvatarChooseImage();
            } else {
              if (!accountImage) {
                if (ios) {
                  onAvatarPickEmoji();
                } else {
                  setNextEmoji();
                }
              } else {
                onAvatarRemovePhoto();
              }
            }
          } else {
            if (!isReadOnly) {
              if (!accountImage) {
                if (ios) {
                  onAvatarPickEmoji();
                } else {
                  setNextEmoji();
                }
              } else {
                onAvatarRemovePhoto();
              }
            }
          }
        }
      } else if (buttonIndex === 3) {
        if (!hasENSAvatar && !isReadOnly) {
          if (!accountImage) {
            if (ios) {
              onAvatarPickEmoji();
            } else {
              setNextEmoji();
            }
          } else {
            onAvatarRemovePhoto();
          }
        }
      }
    },
    [
      accountImage,
      hasENSAvatar,
      isENSProfile,
      isReadOnly,
      onAvatarChooseImage,
      onAvatarCreateProfile,
      onAvatarEditProfile,
      onAvatarPickEmoji,
      onAvatarRemovePhoto,
      onAvatarViewProfile,
      setNextEmoji,
    ]
  );

  const avatarActionSheetOptions = (hasENSAvatar
    ? [
        !isReadOnly && lang.t('profiles.profile_avatar.edit_profile'),
        lang.t('profiles.profile_avatar.view_profile'),
      ]
    : [
        isENSProfile &&
          !isReadOnly &&
          lang.t('profiles.profile_avatar.edit_profile'),
        isENSProfile && lang.t('profiles.profile_avatar.view_profile'),
        !isENSProfile &&
          !isReadOnly &&
          lang.t('profiles.profile_avatar.create_profile'),
        lang.t('profiles.profile_avatar.choose_from_library'),
        !accountImage
          ? ios
            ? lang.t('profiles.profile_avatar.pick_emoji')
            : lang.t('profiles.profile_avatar.shuffle_emoji')
          : lang.t('profiles.profile_avatar.remove_photo'),
      ]
  )
    .filter(option => Boolean(option))
    .concat(ios ? ['Cancel'] : []);

  const onAvatarPress = useCallback(() => {
    showActionSheetWithOptions(
      {
        cancelButtonIndex: avatarActionSheetOptions.length - 1,
        destructiveButtonIndex:
          !hasENSAvatar && accountImage
            ? avatarActionSheetOptions.length - 2
            : undefined,
        options: avatarActionSheetOptions,
      },
      (buttonIndex: number) => callback(buttonIndex)
    );
  }, [avatarActionSheetOptions, hasENSAvatar, accountImage, callback]);

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
    avatarActionSheetOptions,
    avatarOptions,
    onAvatarChooseImage,
    onAvatarCreateProfile,
    onAvatarPickEmoji,
    onAvatarPress,
    onAvatarRemovePhoto,
    onAvatarWebProfile,
    onSelectionCallback: callback,
  };
};
