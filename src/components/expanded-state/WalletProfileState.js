import * as i18n from '@/languages';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ProfileModal from './profile/ProfileModal';
import { analytics } from '@/analytics';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import { getWalletProfileMeta } from '@/helpers/walletProfileHandler';
import { setCallbackAfterObtainingSeedsFromKeychainOrError } from '@/model/wallet';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { colors } from '@/styles';
import { profileUtils } from '@/utils';
import { getAccountProfileInfo } from '@/state/wallets/walletsStore';
import { isValidHex } from '@/handlers/web3';
import { getWebProfile } from '@/helpers/webData';

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

  const {
    color: nameColor,
    emoji: nameEmoji,
    name,
    profileImage,
  } = useMemo(() => {
    const webProfileData = getWalletProfileMeta(address, profile, webProfile, isNewProfile, forceColor);
    const accountInfo = isValidHex(address) ? getAccountProfileInfo(address) : undefined;
    return {
      color: typeof accountInfo?.accountColor === 'number' ? accountInfo?.accountColor : webProfileData.color || undefined,
      emoji: accountInfo?.accountSymbol || webProfileData.emoji || undefined,
      name: accountInfo?.accountName ?? profile?.name,
      profileImage: accountInfo?.accountImage ?? profile?.image,
    };
  }, [address, forceColor, isNewProfile, profile, webProfile]);

  const [value, setValue] = useState(name ? removeFirstEmojiFromString(name) : '');

  const accentColor = typeof nameColor === 'number' ? colors.avatarBackgrounds[nameColor] : nameColor;

  const handleCancel = useCallback(() => {
    onCancel?.();
    goBack();
    analytics.track(analytics.event.walletProfileCancelled);
    if (actionType === 'Create' && !isFromSettings) {
      navigate(Routes.CHANGE_WALLET_SHEET);
    }
  }, [actionType, goBack, navigate, onCancel, isFromSettings]);

  const handleSubmit = useCallback(async () => {
    analytics.track(analytics.event.walletProfileSubmitted);
    onCloseModal({
      canceled: false,
      color: typeof nameColor === 'string' ? profileUtils.colorHexToIndex(nameColor) : nameColor,
      image: profileImage,
      name: value,
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
  }, [actionType, nameColor, goBack, isNewProfile, navigate, onCloseModal, profileImage, value, isFromSettings]);

  useEffect(() => {
    const getProfile = async () => {
      const profile = await getWebProfile(address);
      setWebProfile(profile ?? {});
    };
    getProfile();
  }, [address]);

  return (
    <ProfileModal
      accentColor={accentColor}
      address={address}
      emojiAvatar={nameEmoji}
      handleCancel={handleCancel}
      handleSubmit={handleSubmit}
      disableChangeAvatar={actionType === 'Switch'}
      imageAvatar={profileImage}
      inputValue={value}
      onChange={setValue}
      placeholder={i18n.t(i18n.l.wallet.new.name_wallet)}
      submitButtonText={
        isNewProfile
          ? actionType === 'Create'
            ? i18n.t(i18n.l.wallet.new.create_wallet)
            : i18n.t(i18n.l.wallet.new.import_wallet)
          : i18n.t(i18n.l.button.done)
      }
      toggleAvatar={!isNewProfile || address}
      toggleSubmitButtonIcon={actionType === 'Create'}
    />
  );
}
