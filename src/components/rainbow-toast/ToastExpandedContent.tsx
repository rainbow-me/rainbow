import React, { ReactNode } from 'react';
import { Box, Inline, Stack, Text } from '@/design-system';

type Props = {
  icon: ReactNode;
  statusLabel: ReactNode;
  label: string;
  after: ReactNode;
};

export function ToastExpandedContent({ icon, statusLabel, label, after }: Props) {
  return (
    <Inline alignVertical="center" space="12px">
      {icon}
      <Stack space="4px">
        <Text color="labelTertiary" size="13pt" weight="medium">
          {statusLabel}
        </Text>
        <Text color="label" size="17pt" weight="bold">
          {label}
        </Text>
      </Stack>
      <Box flexGrow={1} alignItems="flex-end">
        {after}
      </Box>
    </Inline>
  );
}
