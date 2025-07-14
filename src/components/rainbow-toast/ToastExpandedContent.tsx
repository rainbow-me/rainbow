import { Box, Stack, Text } from '@/design-system';
import React, { ReactNode } from 'react';
import { View } from 'react-native';

type Props = {
  icon: ReactNode;
  statusLabel: ReactNode;
  label: ReactNode;
  after?: ReactNode;
  iconWidth?: number;
};

const EXPANDED_ICON_SIZE = 28;

export function ToastExpandedContent({ icon, statusLabel, label, after }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 16,
        alignItems: 'center',
        paddingHorizontal: 26,
        paddingVertical: 16,
      }}
    >
      <View
        style={{
          width: EXPANDED_ICON_SIZE + 12,
          height: EXPANDED_ICON_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ width: EXPANDED_ICON_SIZE, height: EXPANDED_ICON_SIZE }}>{icon}</View>
      </View>

      <Stack space="10px">
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
    </View>
  );
}
