import React, { useMemo } from 'react';

import { getAddress, type Address } from 'viem';

import { Stack } from '@/design-system';
import { formatAddressForDisplay } from '@/features/address/core/formatAddress';
import { REGISTRATION_MODES } from '@/features/ens/utils/helpers';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useAccountAddress } from '@/state/wallets/walletsStore';

import { useEnsRegistrationStore } from '../../data/stores/registrationStore';
import { useEnsNameStore } from '../../data/useEnsNameStore';
import { ENSConfirmUpdateSheetHeight } from '../../screens/ENSConfirmRegisterSheet';
import { InfoRow, InfoRowSkeleton } from './InfoRow';

export function ConfigurationSection({
  isLoading,
  ownerAddress,
  registrantAddress,
  isLegacy,
  isPrimary,
  isProfilesEnabled,
  isExternal,
  isSetNameEnabled,
  isReadOnlyWallet,
  name,
  externalAvatarUrl,
}: {
  isLoading?: boolean;
  ownerAddress?: Address | null;
  registrantAddress?: string | null;
  isExternal?: boolean;
  isLegacy?: boolean;
  isPrimary?: boolean;
  isProfilesEnabled?: boolean;
  isSetNameEnabled?: boolean;
  isReadOnlyWallet?: boolean;
  name: string;
  externalAvatarUrl?: string | null;
}) {
  const accountAddress = useAccountAddress();
  const { navigate } = useNavigation();

  const registrant = useMemo(() => (registrantAddress ? getAddress(registrantAddress) : null), [registrantAddress]);
  const ownerName = useEnsNameStore(s => s.get(ownerAddress));
  const registrantName = useEnsNameStore(s => s.get(registrant));

  return (
    <Stack space="15px (Deprecated)">
      {isLoading ? (
        <>
          <InfoRowSkeleton />
          <InfoRowSkeleton />
        </>
      ) : (
        <>
          {isProfilesEnabled && !isReadOnlyWallet && !isExternal && isSetNameEnabled ? (
            <InfoRow
              explainSheetType="ens_primary_name"
              label={i18n.t(i18n.l.expanded_state.unique_expanded.set_primary_name)}
              onSwitchChange={() => {
                useEnsRegistrationStore.getState().start(accountAddress, name, REGISTRATION_MODES.SET_NAME);
                navigate(Routes.ENS_CONFIRM_REGISTER_SHEET, {
                  externalAvatarUrl,
                  longFormHeight: ENSConfirmUpdateSheetHeight + (externalAvatarUrl ? 70 : 0),
                  mode: REGISTRATION_MODES.SET_NAME,
                  name,
                });
              }}
              switchValue={isPrimary}
              useAccentColor
            />
          ) : null}

          {registrant ? (
            <InfoRow
              explainSheetType="ens_owner"
              label={i18n.t(i18n.l.expanded_state.unique_expanded.owner)}
              useAccentColor
              value={registrantName || formatAddressForDisplay(registrant, 4, 4) || ''}
            />
          ) : null}

          {ownerAddress ? (
            <InfoRow
              explainSheetType={isLegacy ? 'ens_manager' : 'ens_owner'}
              label={i18n.t(isLegacy ? i18n.l.expanded_state.unique_expanded.manager : i18n.l.expanded_state.unique_expanded.owner)}
              useAccentColor
              value={ownerName || formatAddressForDisplay(ownerAddress, 4, 4) || ''}
            />
          ) : null}
        </>
      )}
    </Stack>
  );
}
