import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useUpdateEmoji from '../../../src/hooks/useUpdateEmoji';
import ProfileModal from './profile/ProfileModal';
import { analytics } from '@/analytics';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import { getWalletProfileMeta } from '@/helpers/walletProfileHandler';
import { setCallbackAfterObtainingSeedsFromKeychainOrError } from '@/model/wallet';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { colors } from '@/styles';
import { profileUtils } from '@/utils';

export default function WalletProfileState({
  actionType,
  address,
  isNewProfile,
  onCancel,
  onCloseModal,
  profile,
  forceColor,
  isFromSettings = true,
}) {
  const [webProfile, setWebProfile] = useState(null);
  const { goBack, navigate } = useNavigation();
  const { getWebProfile } = useUpdateEmoji();

  const { color: nameColor, emoji: nameEmoji } = useMemo(
    () => getWalletProfileMeta(address, profile, webProfile, isNewProfile, forceColor),
    [address, forceColor, isNewProfile, profile, webProfile]
  );

  const [value, setValue] = useState(profile?.name ? removeFirstEmojiFromString(profile.name) : '');

  const accentColor = colors.avatarBackgrounds[nameColor];
  const profileImage = profile.image;

  const handleCancel = useCallback(() => {
    onCancel?.();
    goBack();
    analytics.track('Tapped "Cancel" on Wallet Profile modal');
    if (actionType === 'Create' && !isFromSettings) {
      navigate(Routes.CHANGE_WALLET_SHEET);
    }
  }, [actionType, goBack, navigate, onCancel, isFromSettings]);

  const handleSubmit = useCallback(async () => {
    analytics.track('Tapped "Submit" on Wallet Profile modal');
    onCloseModal({
      color: typeof nameColor === 'string' ? profileUtils.colorHexToIndex(nameColor) : nameColor,
      image: profileImage,
      name: nameEmoji ? `${nameEmoji} ${value}` : value,
    });
    const callback = async () => {
      goBack();
      if (actionType === 'Create' && isNewProfile && !isFromSettings) {
        navigate(Routes.CHANGE_WALLET_SHEET);
      }
    };

    if (actionType !== 'Create') {
      callback();
    } else {
      setCallbackAfterObtainingSeedsFromKeychainOrError(callback);
    }
  }, [actionType, nameColor, goBack, isNewProfile, nameEmoji, navigate, onCloseModal, profileImage, value, isFromSettings]);

  useEffect(() => {
    const getProfile = async () => {
      const profile = await getWebProfile(address);
      setWebProfile(profile ?? {});
    };
    getProfile();
  }, [address, getWebProfile]);

  return (
    <ProfileModal
      accentColor={accentColor}
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
