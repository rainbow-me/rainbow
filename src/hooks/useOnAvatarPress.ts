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
import { analytics } from '@/analytics';
import { enableActionsOnReadOnlyWallet, PROFILES, useExperimentalFlag } from '@/config';
import { REGISTRATION_MODES } from '@/helpers/ens';
import { walletsSetSelected, walletsUpdate } from '@/redux/wallets';
import Routes from '@/navigation/routesNames';
import { showActionSheetWithOptions } from '@/utils';
import useAccountAsset from './useAccountAsset';
import { ETH_ADDRESS } from '@/references';
import { isZero } from '@/helpers/utilities';
import { IS_IOS } from '@/env';
import { buildRainbowUrl } from '@/utils/buildRainbowUrl';

type UseOnAvatarPressProps = {
  /** Is the avatar selection being used on the wallet or transaction screen? */
  screenType?: 'wallet' | 'transaction';
};

export default ({ screenType = 'transaction' }: UseOnAvatarPressProps = {}) => {
  const { wallets, selectedWallet, isReadOnlyWallet } = useWallets();
  const dispatch = useDispatch();
  const { navigate } = useNavigation();
  const { accountAddress, accountColor, accountName, accountImage, accountENS } = useAccountProfile();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const accountAsset = useAccountAsset(ETH_ADDRESS);

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

  const onAvatarRemovePhoto = useCallback(async () => {
    const newWallets: typeof wallets = {
      ...wallets,
      [selectedWallet.id]: {
        ...wallets![selectedWallet.id],
        addresses: wallets![selectedWallet.id].addresses.map((account: RainbowAccount) =>
          account.address.toLowerCase() === accountAddress?.toLowerCase() ? { ...account, image: null } : account
        ),
      },
    };

    dispatch(walletsSetSelected(newWallets[selectedWallet.id]));
    await dispatch(walletsUpdate(newWallets));
  }, [dispatch, selectedWallet, accountAddress, wallets]);

  const processPhoto = useCallback(
    (image: ImageOrVideo | null) => {
      const stringIndex = image?.path.indexOf('/tmp');
      const imagePath = ios ? `~${image?.path.slice(stringIndex)}` : image?.path;
      const newWallets: typeof wallets = {
        ...wallets,
        [selectedWallet.id]: {
          ...wallets![selectedWallet.id],
          addresses: wallets![selectedWallet.id].addresses.map((account: RainbowAccount) =>
            account.address.toLowerCase() === accountAddress?.toLowerCase() ? { ...account, image: imagePath } : account
          ),
        },
      };

      dispatch(walletsSetSelected(newWallets[selectedWallet.id]));
      dispatch(walletsUpdate(newWallets));
    },
    [accountAddress, dispatch, selectedWallet.id, wallets]
  );

  const onAvatarPickEmoji = useCallback(() => {
    navigate(screenType === 'wallet' ? Routes.AVATAR_BUILDER_WALLET : Routes.AVATAR_BUILDER, {
      initialAccountColor: accountColor,
      initialAccountName: accountName,
    });
  }, [accountColor, accountName, navigate, screenType]);

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
  const isZeroETH = isZero(accountAsset?.balance?.amount);

  const callback = useCallback(
    async (buttonIndex: number) => {
      if (isENSProfile) {
        if (isReadOnly || isZeroETH) {
          if (buttonIndex === 0) onAvatarViewProfile();
          if (buttonIndex === 1) onAvatarChooseImage();
          if (buttonIndex === 2) IS_IOS ? onAvatarPickEmoji() : setNextEmoji();
        } else {
          if (buttonIndex === 0) onAvatarEditProfile();
          if (buttonIndex === 1) onAvatarViewProfile();
          if (buttonIndex === 2) onAvatarChooseImage();
          if (buttonIndex === 3) IS_IOS ? onAvatarPickEmoji() : setNextEmoji();
        }
      } else {
        if (isReadOnly || isZeroETH) {
          if (buttonIndex === 0) onAvatarChooseImage();
          if (buttonIndex === 1) IS_IOS ? onAvatarPickEmoji() : setNextEmoji();
        } else {
          if (buttonIndex === 0) onAvatarCreateProfile();
          if (buttonIndex === 1) onAvatarChooseImage();
          if (buttonIndex === 2) IS_IOS ? onAvatarPickEmoji() : setNextEmoji();
        }
      }
    },
    [
      isENSProfile,
      isReadOnly,
      isZeroETH,
      onAvatarChooseImage,
      onAvatarCreateProfile,
      onAvatarEditProfile,
      onAvatarPickEmoji,
      onAvatarViewProfile,
      setNextEmoji,
    ]
  );

  const avatarContextMenuConfig = {
    menuTitle: '',
    menuItems: [
      isENSProfile &&
        !isReadOnly &&
        !isZeroETH && {
          actionKey: 'editProfile',
          actionTitle: lang.t('profiles.profile_avatar.edit_profile'),
          icon: {
            iconType: 'SYSTEM',
            iconValue: ios ? 'pencil.circle' : null,
          },
        },
      isENSProfile && {
        actionKey: 'viewProfile',
        actionTitle: lang.t('profiles.profile_avatar.view_profile'),
        icon: {
          iconType: 'SYSTEM',
          iconValue: ios ? 'person.crop.circle' : null,
        },
      },
      !isENSProfile &&
        !isReadOnly &&
        !isZeroETH && {
          actionKey: 'createProfile',
          actionTitle: lang.t('profiles.profile_avatar.create_profile'),
          icon: {
            iconType: 'SYSTEM',
            iconValue: ios ? 'person.crop.circle' : null,
          },
        },
      {
        actionKey: 'chooseFromLibrary',
        actionTitle: lang.t('profiles.profile_avatar.choose_from_library'),
        icon: {
          iconType: 'SYSTEM',
          iconValue: ios ? 'photo.on.rectangle.angled' : null,
        },
      },
      !accountImage
        ? ios
          ? {
              actionKey: 'pickEmoji',
              actionTitle: lang.t('profiles.profile_avatar.pick_emoji'),
              icon: {
                iconType: 'SYSTEM',
                iconValue: 'face.smiling',
              },
            }
          : {
              actionKey: 'shuffleEmoji',
              actionTitle: lang.t('profiles.profile_avatar.shuffle_emoji'),
            }
        : {
            actionKey: 'removePhoto',
            actionTitle: lang.t('profiles.profile_avatar.remove_photo'),
          },
    ].filter(x => x),
  };

  const avatarActionSheetOptions = avatarContextMenuConfig.menuItems.map(item => item.actionTitle).concat(ios ? ['Cancel'] : []);

  const onAvatarPressProfile = useCallback(() => {
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
        (buttonIndex: number) => callback(buttonIndex)
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
