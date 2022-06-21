import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import { toLower } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';
import { Linking } from 'react-native';
import { useDispatch } from 'react-redux';
import { RainbowAccount } from '../model/wallet';
import { useNavigation } from '../navigation/Navigation';
import useAccountProfile from './useAccountProfile';
import useENSProfile from './useENSProfile';
import { prefetchENSProfileImages } from './useENSProfileImages';
import { prefetchENSProfileRecords } from './useENSProfileRecords';
import useENSRegistration from './useENSRegistration';
import useImagePicker from './useImagePicker';
import useWallets from './useWallets';
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
  const ensProfile = useENSProfile(accountENS, {
    enabled: profileEnabled && profilesEnabled,
  });
  const hasENSAvatar = Boolean(ensProfile?.data?.images?.avatarUrl);
  const { openPicker } = useImagePicker();
  const { startRegistration } = useENSRegistration();

  useEffect(() => {
    if (accountENS) {
      prefetchENSProfileRecords(accountENS);
    }
  }, [accountENS]);

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

  const onAvatarPress = useCallback(() => {
    const isENSProfile =
      profilesEnabled && profileEnabled && ensProfile?.isOwner;

    if (isENSProfile) {
      // Prefetch profile images
      prefetchENSProfileImages({ name: accountENS });
    }

    const avatarActionSheetOptions = (!isReadOnly
      ? [
          ...(isENSProfile
            ? [
                ...(!hasENSAvatar
                  ? [
                      lang.t('profiles.profile_avatar.choose_from_library'),
                      !accountImage
                        ? lang.t(`profiles.profile_avatar.pick_emoji`)
                        : lang.t(`profiles.profile_avatar.remove_photo`),
                    ]
                  : []),
                lang.t('profiles.profile_avatar.view_profile'),
                lang.t('profiles.profile_avatar.edit_profile'),
              ]
            : [
                lang.t('profiles.profile_avatar.choose_from_library'),
                !accountImage
                  ? lang.t(`profiles.profile_avatar.pick_emoji`)
                  : lang.t(`profiles.profile_avatar.remove_photo`),
                profilesEnabled &&
                  lang.t('profiles.profile_avatar.create_profile'),
              ]),
        ]
      : [isENSProfile && lang.t('profiles.profile_avatar.view_profile')]
    ).filter(option => Boolean(option));

    if (ios && avatarActionSheetOptions.length) {
      avatarActionSheetOptions.push('Cancel');
    }

    const callback = async (buttonIndex: Number) => {
      switch (buttonIndex) {
        case 0:
          if (isReadOnly) {
            if (isENSProfile) {
              onAvatarViewProfile();
            }
          } else {
            if (hasENSAvatar) {
              onAvatarViewProfile();
            } else {
              onAvatarChooseImage();
            }
          }
          break;
        case 1:
          if (!isReadOnly) {
            if (isENSProfile && hasENSAvatar) {
              onAvatarEditProfile();
            } else {
              if (accountImage) {
                onAvatarRemovePhoto();
              } else {
                onAvatarPickEmoji();
              }
            }
          }
          break;
        case 2:
          if (!isReadOnly) {
            if (isENSProfile) {
              if (!hasENSAvatar) {
                onAvatarViewProfile();
              }
            } else {
              onAvatarCreateProfile();
            }
          }
          break;
        case 3:
          if (!isReadOnly) {
            if (isENSProfile && !hasENSAvatar) {
              onAvatarEditProfile();
            }
          }
          break;
        default:
          break;
      }
    };

    if (avatarActionSheetOptions.length) {
      showActionSheetWithOptions(
        {
          cancelButtonIndex: avatarActionSheetOptions.length - 1,
          destructiveButtonIndex:
            !isReadOnly && !hasENSAvatar && accountImage ? 1 : undefined,
          options: avatarActionSheetOptions,
        },
        (buttonIndex: Number) => callback(buttonIndex)
      );
    }
  }, [
    ensProfile,
    profileEnabled,
    profilesEnabled,
    isReadOnly,
    accountImage,
    accountENS,
    hasENSAvatar,
    onAvatarChooseImage,
    onAvatarRemovePhoto,
    onAvatarPickEmoji,
    onAvatarCreateProfile,
    onAvatarEditProfile,
    onAvatarViewProfile,
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
