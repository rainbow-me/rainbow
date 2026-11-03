import React, { useCallback } from 'react';

import { REGISTRATION_MODES } from '@/features/ens/types/registration';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useAccountAddress } from '@/state/wallets/walletsStore';

import { useEnsRegistrationStore } from '../../../data/stores/registrationStore';
import { ActionButton } from './ActionButton';

export function EditButton({ ensName }: { ensName?: string }) {
  const { navigate } = useNavigation();
  const accountAddress = useAccountAddress();

  const handlePressEdit = useCallback(() => {
    if (ensName) {
      useEnsRegistrationStore.getState().start(accountAddress, ensName, REGISTRATION_MODES.EDIT);
      navigate(Routes.REGISTER_ENS_NAVIGATOR, {
        ensName,
        mode: REGISTRATION_MODES.EDIT,
      });
    }
  }, [ensName, navigate, accountAddress]);

  return (
    <ActionButton onPress={handlePressEdit} testID="edit-profile-button" variant="outlined">
      {i18n.t(i18n.l.profiles.actions.edit_profile)}
    </ActionButton>
  );
}
