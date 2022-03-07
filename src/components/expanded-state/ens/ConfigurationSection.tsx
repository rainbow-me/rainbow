import lang from 'i18n-js';
import React from 'react';
import InfoRow, { InfoRowSkeleton } from './InfoRow';
import { Stack } from '@rainbow-me/design-system';
import { formatAddressForDisplay } from '@rainbow-me/utils/abbreviations';

export default function ConfigurationSection({
  isLoading,
  owner,
  registrant,
}: {
  isLoading?: boolean;
  owner?: { name?: string; address?: string };
  registrant?: { name?: string; address?: string };
}) {
  return (
    <Stack space="15px">
      {isLoading ? (
        <>
          <InfoRowSkeleton />
          <InfoRowSkeleton />
        </>
      ) : (
        <>
          {owner && (
            <InfoRow
              explainSheetType="ens_owner"
              label={lang.t('expanded_state.unique_expanded.owner')}
              useAccentColor
              value={
                owner.name ||
                formatAddressForDisplay(owner.address || '', 4, 4) ||
                ''
              }
            />
          )}
          {registrant && (
            <InfoRow
              explainSheetType="ens_registrant"
              label={lang.t('expanded_state.unique_expanded.registrant')}
              useAccentColor
              value={
                registrant.name ||
                formatAddressForDisplay(registrant.address || '', 4, 4) ||
                ''
              }
            />
          )}
        </>
      )}
    </Stack>
  );
}
