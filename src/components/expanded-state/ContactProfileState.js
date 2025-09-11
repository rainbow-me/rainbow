import * as i18n from '@/languages';
import React, { useCallback, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
import { useNavigation } from '../../navigation/Navigation';
import { useTheme } from '../../theme/ThemeContext';
import { magicMemo } from '../../utils';
import ProfileModal from './profile/ProfileModal';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { useContacts, useENSAvatar } from '@/hooks';
import { addressHashedColorIndex, addressHashedEmoji } from '@/utils/profileUtils';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { IS_ANDROID } from '@/env';

const ContactProfileState = ({ address, color, contact, ens, nickname }) => {
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const contactNickname = contact?.nickname || nickname;
  const { goBack } = useNavigation();
  const { onAddOrUpdateContacts } = useContacts();
  const { colors } = useTheme();

  const [value, setValue] = useState(profilesEnabled ? contactNickname : removeFirstEmojiFromString(contactNickname));

  const emoji = useMemo(() => returnStringFirstEmoji(contactNickname) || addressHashedEmoji(address), [address, contactNickname]);

  const colorIndex = useMemo(() => color || addressHashedColorIndex(address) || 0, [address, color]);

  const handleAddContact = useCallback(() => {
    const nickname = profilesEnabled ? value : (emoji ? `${emoji} ${value}` : value).trim();
    if (value?.length > 0) {
      // Android: dismiss keyboard first to avoid racing with modal animation
      IS_ANDROID && Keyboard.dismiss();
      onAddOrUpdateContacts(address, nickname, colors.avatarBackgrounds[colorIndex || 0], ens);
      // Android: wait for keyboard to close before navigating back
      setTimeout(() => goBack(), IS_ANDROID ? 100 : 0);
    }
  }, [address, colorIndex, colors.avatarBackgrounds, emoji, ens, goBack, onAddOrUpdateContacts, profilesEnabled, value]);

  const handleCancel = useCallback(() => {
    // Android: dismiss keyboard first to avoid racing with modal animation
    IS_ANDROID && Keyboard.dismiss();
    // Android: wait for keyboard to close before navigating back
    setTimeout(() => goBack(), IS_ANDROID ? 100 : 0);
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
      placeholder={i18n.t(i18n.l.contacts.input_placeholder)}
      profileName={ens}
      submitButtonText={i18n.t(i18n.l.contacts.options.add)}
      toggleAvatar
      toggleSubmitButtonIcon={false}
    />
  );
};

export default magicMemo(ContactProfileState, ['address', 'color', 'contact']);
