import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import ProfileModal from './profile/ProfileModal';
import { removeFirstEmojiFromString } from '@rainbow-me/helpers/emojiHandler';
import { useWalletProfile } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';
import { profileUtils } from '@rainbow-me/utils';

export default function WalletProfileState({
  actionType,
  address,
  isNewProfile,
  onCloseModal,
  profile,
  forceColor,
}) {
  const [nameColor, setNameColor] = useState(null);
  const [nameEmoji, setNameEmoji] = useState(null);
  const { goBack, navigate } = useNavigation();
  const { getWalletProfileMeta } = useWalletProfile();

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
    InteractionManager.runAfterInteractions(() => {
      onCloseModal({
        color:
          typeof nameColor === 'string'
            ? profileUtils.colorHexToIndex(nameColor)
            : nameColor,
        image: profileImage,
        name: nameEmoji ? `${nameEmoji} ${value}` : value,
      });
      goBack();
      if (actionType === 'Create' && isNewProfile) {
        navigate(Routes.CHANGE_WALLET_SHEET);
      }
    });
  }, [
    actionType,
    nameColor,
    goBack,
    isNewProfile,
    nameEmoji,
    navigate,
    onCloseModal,
    profileImage,
    value,
  ]);

  useEffect(() => {
    const getProfile = async () => {
      const { color, emoji } = await getWalletProfileMeta(
        address,
        profile,
        isNewProfile,
        forceColor
      );
      setNameColor(
        color ??
          colors.avatarBackgrounds[
            profileUtils.addressHashedColorIndex(address) || 0
          ]
      );
      setNameEmoji(emoji ?? profileUtils.addressHashedEmoji(address));
    };
    getProfile();
  }, [
    address,
    forceColor,
    getWalletProfileMeta,
    isNewProfile,
    profile,
    setNameColor,
    setNameEmoji,
  ]);

  return (
    <ProfileModal
      accentColor={nameColor}
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
