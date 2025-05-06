import { analytics } from '@/analytics';
import { MenuConfig } from '@/components/native-context-menu/contextMenu';
import { enableActionsOnReadOnlyWallet, PROFILES, useExperimentalFlag } from '@/config';
import { IS_IOS } from '@/env';
import { REGISTRATION_MODES } from '@/helpers/ens';
import { isZero } from '@/helpers/utilities';
import Routes from '@/navigation/routesNames';
import { ETH_ADDRESS } from '@/references';
import { setSelectedWallet, updateWallets, useAccountProfileInfo, useWalletsStore } from '@/state/wallets/walletsStore';
import { isLowerCaseMatch, showActionSheetWithOptions } from '@/utils';
import { buildRainbowUrl } from '@/utils/buildRainbowUrl';
import { openInBrowser } from '@/utils/openInBrowser';
import lang from 'i18n-js';
import { useCallback } from 'react';
import { ImageOrVideo } from 'react-native-image-crop-picker';
import { RainbowAccount } from '../model/wallet';
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
  const wallets = useWalletsStore(state => state.wallets);
  const selectedWallet = useWalletsStore(state => state.selected);
  const isReadOnlyWallet = useWalletsStore(state => state.getIsReadOnlyWallet());
  const { navigate } = useNavigation();
  const { accountAddress, accountColor, accountName, accountImage, accountENS } = useAccountProfileInfo();
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const accountAsset = useAccountAsset(ETH_ADDRESS);

  const profileEnabled = Boolean(accountENS);

  const { isOwner } = useENSOwner(accountENS || '', {
    enabled: profileEnabled && profilesEnabled,
  });

  const { data: avatar } = useENSAvatar(accountENS || '', {
    enabled: profileEnabled && profilesEnabled,
  });
  const hasENSAvatar = Boolean(avatar?.imageUrl);

  const { openPicker } = useImagePicker();
  const { startRegistration } = useENSRegistration();
  const { setNextEmoji } = useUpdateEmoji();

  const onAvatarRemovePhoto = useCallback(async () => {
    if (!selectedWallet || !wallets) return;

    const newWallets: typeof wallets = {
      ...wallets,
      [selectedWallet.id]: {
        ...wallets[selectedWallet.id],
        addresses: wallets[selectedWallet.id].addresses.map((account: RainbowAccount) =>
          isLowerCaseMatch(account.address, accountAddress) ? { ...account, image: null } : account
        ),
      },
    };

    setSelectedWallet(newWallets[selectedWallet.id]);
    updateWallets(newWallets);
  }, [selectedWallet, accountAddress, wallets]);

  const processPhoto = useCallback(
    (image: ImageOrVideo | null) => {
      if (!selectedWallet || !wallets) return;

      const stringIndex = image?.path.indexOf('/tmp');
      const imagePath = ios ? `~${image?.path.slice(stringIndex)}` : image?.path;
      const newWallets: typeof wallets = {
        ...wallets,
        [selectedWallet.id]: {
          ...wallets[selectedWallet.id],
          addresses: wallets[selectedWallet.id].addresses.map((account: RainbowAccount) =>
            isLowerCaseMatch(account.address, accountAddress) ? { ...account, image: imagePath } : account
          ),
        },
      };

      const { setSelectedWallet, updateWallets } = useWalletsStore.getState();
      setSelectedWallet(newWallets[selectedWallet.id]);
      updateWallets(newWallets);
    },
    [accountAddress, selectedWallet, wallets]
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
    if (!accountENS) return;

    const rainbowURL = buildRainbowUrl(null, accountENS, accountAddress);
    if (rainbowURL) {
      openInBrowser(rainbowURL);
    }
  }, [accountAddress, accountENS]);

  const onAvatarViewProfile = useCallback(() => {
    if (!accountENS) return;

    analytics.track(analytics.event.viewedEnsProfile, {
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
    if (!accountENS) return;

    startRegistration(accountENS, REGISTRATION_MODES.EDIT);
    navigate(Routes.REGISTER_ENS_NAVIGATOR, {
      ensName: accountENS,
      mode: REGISTRATION_MODES.EDIT,
    });
  }, [accountENS, navigate, startRegistration]);

  const isReadOnly = isReadOnlyWallet && !enableActionsOnReadOnlyWallet;

  const isENSProfile = profilesEnabled && profileEnabled && isOwner;
  const isZeroETH = isZero(accountAsset?.balance?.amount || 0);

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

  const avatarContextMenuConfig: MenuConfig = {
    menuTitle: '',
    menuItems: [
      isENSProfile &&
        !isReadOnly &&
        !isZeroETH && {
          actionKey: 'editProfile',
          actionTitle: lang.t('profiles.profile_avatar.edit_profile'),
          ...(ios && { icon: { iconType: 'SYSTEM', iconValue: 'pencil.circle' } }),
        },
      isENSProfile && {
        actionKey: 'viewProfile',
        actionTitle: lang.t('profiles.profile_avatar.view_profile'),
        ...(ios && { icon: { iconType: 'SYSTEM', iconValue: 'person.crop.circle' } }),
      },
      !isENSProfile &&
        !isReadOnly &&
        !isZeroETH && {
          actionKey: 'createProfile',
          actionTitle: lang.t('profiles.profile_avatar.create_profile'),
          ...(ios && { icon: { iconType: 'SYSTEM', iconValue: 'person.crop.circle' } }),
        },
      {
        actionKey: 'chooseFromLibrary',
        actionTitle: lang.t('profiles.profile_avatar.choose_from_library'),
        ...(ios && { icon: { iconType: 'SYSTEM', iconValue: 'photo.on.rectangle.angled' } }),
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
    ].filter(Boolean),
  };

  const avatarActionSheetOptions = avatarContextMenuConfig.menuItems
    .map(item => item && item.actionTitle)
    .concat(ios ? ['Cancel'] : [])
    .filter(Boolean) as string[];

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
