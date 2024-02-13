import lang from 'i18n-js';
import React, { useCallback, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
import { useNavigation } from '../../navigation/Navigation';
import { useTheme } from '../../theme/ThemeContext';
import { magicMemo } from '../../utils';
import ProfileModal from './profile/ProfileModal';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { useAccountSettings, useContacts, useENSAvatar } from '@/hooks';
import { addressHashedColorIndex, addressHashedEmoji } from '@/utils/profileUtils';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';

const ContactProfileState = ({ address, color, contact, ens, nickname }) => {
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const contactNickname = contact?.nickname || nickname;
  const { goBack } = useNavigation();
  const { onAddOrUpdateContacts } = useContacts();
  const { colors } = useTheme();

  const [value, setValue] = useState(profilesEnabled ? contactNickname : removeFirstEmojiFromString(contactNickname));

  const emoji = useMemo(() => returnStringFirstEmoji(contactNickname) || addressHashedEmoji(address), [address, contactNickname]);

  const colorIndex = useMemo(() => color || addressHashedColorIndex(address) || 0, [address, color]);

  const { network } = useAccountSettings();

  const handleAddContact = useCallback(() => {
    const nickname = profilesEnabled ? value : (emoji ? `${emoji} ${value}` : value).trim();
    if (value?.length > 0) {
      onAddOrUpdateContacts(address, nickname, colors.avatarBackgrounds[colorIndex || 0], network, ens);
      goBack();
    }
    android && Keyboard.dismiss();
  }, [address, colorIndex, colors.avatarBackgrounds, emoji, ens, goBack, network, onAddOrUpdateContacts, profilesEnabled, value]);

  const handleCancel = useCallback(() => {
    goBack();
    android && Keyboard.dismiss();
  }, [goBack]);

  const { data: avatar } = useENSAvatar(ens, { enabled: Boolean(ens) });
  const avatarUrl = profilesEnabled ? avatar?.imageUrl : undefined;

  const dominantColor = usePersistentDominantColorFromImage(avatarUrl);

  const accentColor = dominantColor || color || colors.avatarBackgrounds[colorIndex || 0];

  return (
    <ProfileModal
      accentColor={accentColor}
      address={address}
      emojiAvatar={emoji}
      handleCancel={handleCancel}
      handleSubmit={handleAddContact}
      imageAvatar={avatarUrl}
      inputValue={value}
      onChange={setValue}
      placeholder={lang.t('contacts.input_placeholder')}
      profileName={ens}
      submitButtonText={lang.t('contacts.options.add')}
      toggleAvatar
      toggleSubmitButtonIcon={false}
    />
  );
};

export default magicMemo(ContactProfileState, ['address', 'color', 'contact']);
