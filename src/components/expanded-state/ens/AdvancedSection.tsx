import { upperFirst } from 'lodash';
import React from 'react';
import InfoRow from './InfoRow';
import { Stack } from '@rainbow-me/design-system';

export default function AdvancedSection({
  resolver,
}: {
  resolver?: { address?: string; type?: string };
}) {
  return (
    <Stack space="15px">
      {resolver && (
        <InfoRow
          label="Resolver"
          useAccentColor
          value={upperFirst(resolver.type)}
        />
      )}
    </Stack>
  );
}
