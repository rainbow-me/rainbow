import lang from 'i18n-js';
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
        <InfoRowSkeleton />
      ) : (
        <>
          {resolver && (
            <InfoRow
              explainSheetType="ens_resolver"
              label={lang.t('expanded_state.unique_expanded.resolver')}
              useAccentColor
              value={upperFirst(resolver.type)}
            />
          )}
        </>
      )}
    </Stack>
  );
}
