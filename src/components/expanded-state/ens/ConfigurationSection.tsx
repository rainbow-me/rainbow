import React from 'react';
import InfoRow from './InfoRow';
import { Stack } from '@rainbow-me/design-system';
import { formatAddressForDisplay } from '@rainbow-me/utils/abbreviations';

export default function ConfigurationSection({
  owner,
  registrant,
}: {
  owner?: { name?: string; address?: string };
  registrant?: { name?: string; address?: string };
}) {
  return (
    <Stack space="15px">
      {owner && (
        <InfoRow
          label="Owner"
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
          label="Registrant"
          useAccentColor
          value={
            registrant.name ||
            formatAddressForDisplay(registrant.address || '', 4, 4) ||
            ''
          }
        />
      )}
    </Stack>
  );
}
