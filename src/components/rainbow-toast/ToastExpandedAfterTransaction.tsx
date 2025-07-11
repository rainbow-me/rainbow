import { Stack, Text } from '@/design-system';
import React from 'react';
import { useToastColors } from './useToastColors';

export function ToastExpandedAfterTransaction({ topLabel, bottomLabel }: { topLabel: string; bottomLabel: string }) {
  const colors = useToastColors();

  return (
    <Stack space="4px" alignHorizontal="right">
      <Text color={{ custom: colors.foregroundDim }} size="13pt" weight="medium">
        {topLabel}
      </Text>
      <Text color="label" size="15pt" weight="bold">
        {bottomLabel}
      </Text>
    </Stack>
  );
}
