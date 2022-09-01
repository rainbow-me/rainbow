import lang from 'i18n-js';
import React, { useCallback, useState } from 'react';
import { Keyboard } from 'react-native';
import { useNavigation } from '../../navigation/Navigation';
import { magicMemo } from '../../utils';
import ProfileModal from './profile/ProfileModal';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import { maybeSignUri } from '@/handlers/imgix';
import {
  useAccountSettings,
  useContacts,
  useENSAvatar,
  usePersistentDominantColorFromImage,
  useRainbowProfile,
} from '@/hooks';

const ContactProfileState = ({ address, ens, contactNickname }) => {
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const [nickname, setNickname] = useState(contactNickname || ens || '');
  const { goBack } = useNavigation();
  const { onAddOrUpdateContacts } = useContacts();

  const { network } = useAccountSettings();

  const { rainbowProfile } = useRainbowProfile(address);

  const handleAddContact = useCallback(() => {
    onAddOrUpdateContacts({
      address,
      nickname,
      network,
    });
    goBack();
    android && Keyboard.dismiss();
  }, [address, goBack, network, nickname, onAddOrUpdateContacts]);

  const handleCancel = useCallback(() => {
    goBack();
    android && Keyboard.dismiss();
  }, [goBack]);

  const { data: avatar } = useENSAvatar(ens, { enabled: Boolean(ens) });
  const avatarUrl = profilesEnabled ? avatar?.imageUrl : undefined;

  const { result: dominantColor } = usePersistentDominantColorFromImage(
    maybeSignUri(avatarUrl || '') || ''
  );

  const accentColor = dominantColor || rainbowProfile?.color;

  return (
    <ProfileModal
      accentColor={accentColor}
      address={address}
      emojiAvatar={rainbowProfile?.emoji}
      handleCancel={handleCancel}
      handleSubmit={handleAddContact}
      imageAvatar={avatarUrl}
      inputValue={nickname}
      onChange={setNickname}
      placeholder={lang.t('contacts.input_placeholder')}
      profileName={ens}
      submitButtonText={lang.t('contacts.options.add')}
      toggleAvatar
      toggleSubmitButtonIcon={false}
    />
  );
};

export default magicMemo(ContactProfileState, [
  'address',
  'ens',
  'contactNickname',
]);
