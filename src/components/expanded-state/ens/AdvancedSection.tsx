import { upperFirst } from 'lodash';
import React from 'react';
import InfoRow, { InfoRowSkeleton } from './InfoRow';
import { Stack } from '@rainbow-me/design-system';

export default function AdvancedSection({
  isLoading,
  resolver,
}: {
  isLoading?: boolean;
  resolver?: { address?: string; type?: string };
}) {
  return (
    <Stack space="15px">
      {isLoading ? (
        <>
          <InfoRowSkeleton />
        </>
      ) : (
        <>
          {resolver && (
            <InfoRow
              label="Resolver"
              useAccentColor
              value={upperFirst(resolver.type)}
            />
          )}
        </>
      )}
    </Stack>
  );
}
