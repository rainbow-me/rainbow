import { analytics } from '@/analytics';
import { MenuConfig } from '@/components/native-context-menu/contextMenu';
import { enableActionsOnReadOnlyWallet, PROFILES, useExperimentalFlag } from '@/config';
import { IS_IOS } from '@/env';
import { REGISTRATION_MODES } from '@/helpers/ens';
import { isZero } from '@/helpers/utilities';
import Routes from '@/navigation/routesNames';
import { ETH_ADDRESS } from '@/references';
import { useAccountProfileInfo, getIsReadOnlyWallet, useWalletsStore, updateAccountInfo } from '@/state/wallets/walletsStore';
import { showActionSheetWithOptions } from '@/utils';
import { buildRainbowUrl } from '@/utils/buildRainbowUrl';
import { openInBrowser } from '@/utils/openInBrowser';
import * as i18n from '@/languages';
import { useCallback } from 'react';
import { ImagePickerAsset } from 'expo-image-picker';
import { useNavigation } from '../navigation/Navigation';
import useAccountAsset from './useAccountAsset';
import useENSAvatar, { prefetchENSAvatar } from './useENSAvatar';
import { prefetchENSCover } from './useENSCover';
import useENSOwner from './useENSOwner';
import { prefetchENSRecords } from './useENSRecords';
import useENSRegistration from './useENSRegistration';
import useImagePicker from './useImagePicker';
import useUpdateEmoji from './useUpdateEmoji';

type UseOnAvatarPressProps = {
  /** Is the avatar selection being used on the wallet or transaction screen? */
  screenType?: 'wallet' | 'transaction';
};

export default ({ screenType = 'transaction' }: UseOnAvatarPressProps = {}) => {
  const { navigate } = useNavigation();
  const { accountAddress, accountColor, accountName, accountImage, accountENS } = useAccountProfileInfo();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const accountAsset = useAccountAsset(ETH_ADDRESS);

  const profileEnabled = Boolean(accountENS);

  const { isOwner } = useENSOwner(accountENS || '', {
    enabled: !!accountENS && profileEnabled && profilesEnabled,
  });

  const { data: avatar } = useENSAvatar(accountENS || '', {
    enabled: !!accountENS && profileEnabled && profilesEnabled,
  });
  const hasENSAvatar = Boolean(avatar?.imageUrl);

  const { openPicker } = useImagePicker();
  const { startRegistration } = useENSRegistration();
  const { setNextEmoji } = useUpdateEmoji();

  const onAvatarRemovePhoto = useCallback(async () => {
    const { selected: selectedWallet, wallets } = useWalletsStore.getState();
    if (!selectedWallet || !wallets) return;

    updateAccountInfo({
      address: accountAddress,
      image: null,
      walletId: selectedWallet.id,
    });
  }, [accountAddress]);

  const processPhoto = useCallback(
    (image: ImagePickerAsset) => {
      const { selected: selectedWallet, wallets } = useWalletsStore.getState();
      if (!selectedWallet || !wallets) return;

      updateAccountInfo({
        address: accountAddress,
        image: image.uri,
        walletId: selectedWallet.id,
      });
    },
    [accountAddress]
  );

  const onAvatarPickEmoji = useCallback(() => {
    navigate(screenType === 'wallet' ? Routes.AVATAR_BUILDER_WALLET : Routes.AVATAR_BUILDER, {
      initialAccountColor: accountColor,
      initialAccountName: accountName || '',
    });
  }, [accountColor, accountName, navigate, screenType]);

  const onAvatarChooseImage = useCallback(async () => {
    const image = await openPicker({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!image) return;
    processPhoto(image);
  }, [openPicker, processPhoto]);

  const onAvatarCreateProfile = useCallback(() => {
    navigate(Routes.REGISTER_ENS_NAVIGATOR);
  }, [navigate]);

  const onAvatarWebProfile = useCallback(() => {
    const rainbowURL = buildRainbowUrl(null, accountENS || '', accountAddress);
    if (rainbowURL) {
      openInBrowser(rainbowURL);
    }
  }, [accountAddress, accountENS]);

  const onAvatarViewProfile = useCallback(() => {
    analytics.track(analytics.event.viewedEnsProfile, {
      category: 'profiles',
      ens: accountENS || '',
      from: 'Transaction list',
    });
    navigate(Routes.PROFILE_SHEET, {
      address: accountENS || '',
      fromRoute: 'ProfileAvatar',
    });
  }, [accountENS, navigate]);

  const onAvatarEditProfile = useCallback(() => {
    startRegistration(accountENS || '', REGISTRATION_MODES.EDIT);
    navigate(Routes.REGISTER_ENS_NAVIGATOR, {
      ensName: accountENS,
      mode: REGISTRATION_MODES.EDIT,
    });
  }, [accountENS, navigate, startRegistration]);

  const isReadOnly = getIsReadOnlyWallet() && !enableActionsOnReadOnlyWallet;

  const isENSProfile = profilesEnabled && profileEnabled && isOwner;
  const isZeroETH = isZero(accountAsset?.balance?.amount || 0);

  const callback = useCallback(
    async (buttonIndex: number) => {
      if (isENSProfile) {
        if (isReadOnly || isZeroETH) {
          if (buttonIndex === 0) onAvatarViewProfile();
          if (buttonIndex === 1) onAvatarChooseImage();
          if (buttonIndex === 2) {
            if (accountImage) {
              onAvatarRemovePhoto();
            } else {
              IS_IOS ? onAvatarPickEmoji() : setNextEmoji();
            }
          }
        } else {
          if (buttonIndex === 0) onAvatarEditProfile();
          if (buttonIndex === 1) onAvatarViewProfile();
          if (buttonIndex === 2) onAvatarChooseImage();
          if (buttonIndex === 3) {
            if (accountImage) {
              onAvatarRemovePhoto();
            } else {
              IS_IOS ? onAvatarPickEmoji() : setNextEmoji();
            }
          }
        }
      } else {
        if (isReadOnly || isZeroETH) {
          if (buttonIndex === 0) onAvatarChooseImage();
          if (buttonIndex === 1) {
            if (accountImage) {
              onAvatarRemovePhoto();
            } else {
              IS_IOS ? onAvatarPickEmoji() : setNextEmoji();
            }
          }
        } else {
          if (buttonIndex === 0) onAvatarCreateProfile();
          if (buttonIndex === 1) onAvatarChooseImage();
          if (buttonIndex === 2) {
            if (accountImage) {
              onAvatarRemovePhoto();
            } else {
              IS_IOS ? onAvatarPickEmoji() : setNextEmoji();
            }
          }
        }
      }
    },
    [
      accountImage,
      isENSProfile,
      isReadOnly,
      isZeroETH,
      onAvatarChooseImage,
      onAvatarCreateProfile,
      onAvatarEditProfile,
      onAvatarPickEmoji,
      onAvatarRemovePhoto,
      onAvatarViewProfile,
      setNextEmoji,
    ]
  );

  const avatarContextMenuConfig: MenuConfig = {
    menuTitle: '',
    menuItems: [
      isENSProfile &&
        !isReadOnly &&
        !isZeroETH && {
          actionKey: 'editProfile',
          actionTitle: i18n.t(i18n.l.profiles.profile_avatar.edit_profile),
          ...(ios && { icon: { iconType: 'SYSTEM', iconValue: 'pencil.circle' } }),
        },
      isENSProfile && {
        actionKey: 'viewProfile',
        actionTitle: i18n.t(i18n.l.profiles.profile_avatar.view_profile),
        ...(ios && { icon: { iconType: 'SYSTEM', iconValue: 'person.crop.circle' } }),
      },
      !isENSProfile &&
        !isReadOnly &&
        !isZeroETH && {
          actionKey: 'createProfile',
          actionTitle: i18n.t(i18n.l.profiles.profile_avatar.create_profile),
          ...(ios && { icon: { iconType: 'SYSTEM', iconValue: 'person.crop.circle' } }),
        },
      {
        actionKey: 'chooseFromLibrary',
        actionTitle: i18n.t(i18n.l.profiles.profile_avatar.choose_from_library),
        ...(ios && { icon: { iconType: 'SYSTEM', iconValue: 'photo.on.rectangle.angled' } }),
      },
      !accountImage
        ? ios
          ? {
              actionKey: 'pickEmoji',
              actionTitle: i18n.t(i18n.l.profiles.profile_avatar.pick_emoji),
              icon: {
                iconType: 'SYSTEM',
                iconValue: 'face.smiling',
              },
            }
          : {
              actionKey: 'shuffleEmoji',
              actionTitle: i18n.t(i18n.l.profiles.profile_avatar.shuffle_emoji),
            }
        : {
            actionKey: 'removePhoto',
            actionTitle: i18n.t(i18n.l.profiles.profile_avatar.remove_photo),
          },
    ].filter(Boolean),
  };

  const avatarActionSheetOptions = avatarContextMenuConfig.menuItems
    .map(item => item && item.actionTitle)
    .concat(ios ? ['Cancel'] : [])
    .filter(Boolean) as string[];

  const onAvatarPressProfile = useCallback(() => {
    if (!accountENS) return;
    navigate(Routes.PROFILE_SHEET, {
      address: accountENS,
      fromRoute: 'ProfileAvatar',
    });
  }, [accountENS, navigate]);

  const onAvatarPress = useCallback(() => {
    if (accountENS) {
      prefetchENSAvatar(accountENS);
      prefetchENSCover(accountENS);
      prefetchENSRecords(accountENS);
    }

    if (hasENSAvatar && accountENS) {
      onAvatarPressProfile();
    } else {
      showActionSheetWithOptions(
        {
          cancelButtonIndex: avatarActionSheetOptions.length - 1,
          destructiveButtonIndex: !hasENSAvatar && accountImage ? avatarActionSheetOptions.length - 2 : undefined,
          options: avatarActionSheetOptions,
        },
        buttonIndex => {
          if (buttonIndex === undefined) return;
          callback(buttonIndex);
        }
      );
    }
  }, [hasENSAvatar, accountENS, onAvatarPressProfile, avatarActionSheetOptions, accountImage, callback]);

  return {
    avatarContextMenuConfig,
    avatarActionSheetOptions,
    hasENSProfile: hasENSAvatar && accountENS,
    onAvatarChooseImage,
    onAvatarCreateProfile,
    onAvatarPickEmoji,
    onAvatarPress,
    onAvatarPressProfile: hasENSAvatar && accountENS ? onAvatarPressProfile : undefined,
    onAvatarRemovePhoto,
    onAvatarWebProfile,
    onSelectionCallback: callback,
  };
};
