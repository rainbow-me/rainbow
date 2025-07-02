import { analytics } from '@/analytics';
import { isValidHex } from '@/handlers/web3';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { getWalletProfileMeta } from '@/helpers/walletProfileHandler';
import { setCallbackAfterObtainingSeedsFromKeychainOrError } from '@/model/wallet';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { getAccountProfileInfo } from '@/state/wallets/walletsStore';
import { colors } from '@/styles';
import { profileUtils } from '@/utils';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useUpdateEmoji from '../../../src/hooks/useUpdateEmoji';
import ProfileModal from './profile/ProfileModal';

export default function WalletProfileState(props) {
  const { actionType, address, isNewProfile, onCancel, onCloseModal, profile, forceColor, isFromSettings = true } = props;
  const [webProfile, setWebProfile] = useState(null);
  const { goBack, navigate } = useNavigation();
  const { getWebProfile } = useUpdateEmoji();

  const {
    color: nameColor,
    emoji: nameEmoji,
    name,
    profileImage,
  } = useMemo(() => {
    const webProfileData = getWalletProfileMeta(address, profile, webProfile, isNewProfile, forceColor);
    const accountInfo = isValidHex(address) ? getAccountProfileInfo({ address }) : undefined;

    const nameIn = profile?.name ?? accountInfo?.accountName;
    const emoji = returnStringFirstEmoji(nameIn);
    const name = removeFirstEmojiFromString(nameIn);

    return {
      color: profile?.color ?? accountInfo?.accountColor ?? webProfileData.color,
      emoji: emoji || (accountInfo?.accountSymbol ?? webProfileData.emoji),
      name,
      profileImage: profile?.image ?? accountInfo?.accountImage,
    };
  }, [address, forceColor, isNewProfile, profile, webProfile]);

  const [value, setValue] = useState(name);

  const accentColor = colors.avatarBackgrounds[nameColor];

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
      name: value === '' ? name : `${nameEmoji} ${value}`,
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
  }, [onCloseModal, nameColor, profileImage, value, name, nameEmoji, actionType, goBack, isNewProfile, isFromSettings, navigate]);

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
