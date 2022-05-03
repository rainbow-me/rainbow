import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { getRandomColor } from '../../styles/colors';
import ProfileModal from './ProfileModal';
import {
  removeFirstEmojiFromString,
  returnStringFirstEmoji,
} from '@rainbow-me/helpers/emojiHandler';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { profileUtils } from '@rainbow-me/utils';

export default function WalletProfileState({
  actionType,
  address,
  isNewProfile,
  onCloseModal,
  profile,
  forceColor,
}) {
  const nameEmoji =
    isNewProfile && !forceColor
      ? profileUtils.addressHashedEmoji(address)
      : returnStringFirstEmoji(profile?.name) ||
        profileUtils.addressHashedEmoji(address);

  const { goBack, navigate } = useNavigation();
  const { colors } = useTheme();

  const indexOfForceColor = colors.avatarBackgrounds.indexOf(forceColor);
  const color = forceColor
    ? forceColor
    : isNewProfile && address
    ? profileUtils.addressHashedColorIndex(address)
    : profile.color !== null
    ? profile.color
    : isNewProfile
    ? null
    : (indexOfForceColor !== -1 && indexOfForceColor) || getRandomColor();

  const [value, setValue] = useState(
    profile?.name ? removeFirstEmojiFromString(profile.name) : ''
  );

  const profileImage = profile.image;

  const handleCancel = useCallback(() => {
    goBack();
    analytics.track('Tapped "Cancel" on Wallet Profile modal');
    if (actionType === 'Create') {
      navigate(Routes.CHANGE_WALLET_SHEET);
    }
  }, [actionType, goBack, navigate]);

  const handleSubmit = useCallback(() => {
    analytics.track('Tapped "Submit" on Wallet Profile modal');
    onCloseModal({
      color:
        typeof color === 'string' ? profileUtils.colorHexToIndex(color) : color,
      image: profileImage,
      name: nameEmoji ? `${nameEmoji} ${value}` : value,
    });
    goBack();
    if (actionType === 'Create' && isNewProfile) {
      navigate(Routes.CHANGE_WALLET_SHEET);
    }
  }, [
    actionType,
    color,
    goBack,
    isNewProfile,
    nameEmoji,
    navigate,
    onCloseModal,
    profileImage,
    value,
  ]);

  return (
    <ProfileModal
      accentColor={color}
      address={address}
      emojiAvatar={nameEmoji}
      handleCancel={handleCancel}
      handleSubmit={handleSubmit}
      imageAvatar={profileImage}
      inputValue={value}
      onChange={setValue}
      placeholder={lang.t('wallet.new.name_wallet')}
      submitButtonText={
        isNewProfile
          ? actionType === 'Create'
            ? lang.t('wallet.new.create_wallet')
            : lang.t('wallet.new.import_wallet')
          : lang.t('button.done')
      }
      toggleAvatar={!isNewProfile || address}
      toggleSubmitButtonIcon={actionType === 'Create'}
    />
  );
}
