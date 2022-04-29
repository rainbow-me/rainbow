import { useNavigation } from '@react-navigation/core';
import lang from 'i18n-js';
import React from 'react';
import { ENSConfirmUpdateSheetHeight } from '../../../screens/ENSConfirmRegisterSheet';
import InfoRow, { InfoRowSkeleton } from './InfoRow';
import { Stack } from '@rainbow-me/design-system';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import { useENSRegistration } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { formatAddressForDisplay } from '@rainbow-me/utils/abbreviations';

export default function ConfigurationSection({
  isLoading,
  owner,
  registrant,
  isPrimary,
  isOwner,
  name,
}: {
  isLoading?: boolean;
  owner?: { name?: string; address?: string };
  registrant?: { name?: string; address?: string };
  isPrimary?: boolean;
  isOwner?: boolean;
  name: string;
}) {
  const { startRegistration } = useENSRegistration();
  const { navigate } = useNavigation();

  return (
    <Stack space="15px">
      {isLoading ? (
        <>
          <InfoRowSkeleton />
          <InfoRowSkeleton />
        </>
      ) : (
        <>
          <InfoRow
            explainSheetType="ens_primary_name"
            label={lang.t('expanded_state.unique_expanded.set_primary_name')}
            onSwitchChange={() => {
              startRegistration(name, REGISTRATION_MODES.SET_NAME);
              navigate(Routes.ENS_CONFIRM_REGISTER_SHEET, {
                longFormHeight: ENSConfirmUpdateSheetHeight,
                mode: REGISTRATION_MODES.SET_NAME,
                name,
              });
            }}
            switchDisabled={!isOwner}
            switchValue={isPrimary}
            useAccentColor
          />
          {registrant && (
            <InfoRow
              explainSheetType="ens_registrant"
              label={lang.t('expanded_state.unique_expanded.owner')}
              useAccentColor
              value={
                registrant.name ||
                formatAddressForDisplay(registrant.address || '', 4, 4) ||
                ''
              }
            />
          )}
          {owner && (
            <InfoRow
              explainSheetType="ens_owner"
              label={lang.t('expanded_state.unique_expanded.manager')}
              useAccentColor
              value={
                owner.name ||
                formatAddressForDisplay(owner.address || '', 4, 4) ||
                ''
              }
            />
          )}
        </>
      )}
    </Stack>
  );
}
