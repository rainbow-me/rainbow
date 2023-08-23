import React from 'react';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { BackgroundProvider } from '@/design-system';

export function MintDotFunSheet() {
  return (
    <BackgroundProvider color="surfaceSecondaryElevated">
      {({ backgroundColor }) => (
        <SimpleSheet backgroundColor={backgroundColor as string}></SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
