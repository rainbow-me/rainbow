import { useNavigation } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback } from 'react';
import ActionButton from './ActionButton';
import { REGISTRATION_MODES } from '@/helpers/ens';
import { useENSRegistration } from '@/hooks';
import Routes from '@/navigation/routesNames';

export default function WatchButton({ ensName }: { ensName?: string }) {
  const { navigate } = useNavigation();
  const { startRegistration } = useENSRegistration();

  const handlePressEdit = useCallback(() => {
    if (ensName) {
      startRegistration(ensName, REGISTRATION_MODES.EDIT);
      navigate(Routes.REGISTER_ENS_NAVIGATOR, {
        ensName,
        mode: REGISTRATION_MODES.EDIT,
      });
    }
  }, [ensName, navigate, startRegistration]);

  return (
    <ActionButton onPress={handlePressEdit} testID="edit-profile-button" variant="outlined">
      {lang.t('profiles.actions.edit_profile')}
    </ActionButton>
  );
}
