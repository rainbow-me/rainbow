import React, { PropsWithChildren } from 'react';
import { Box, Space } from '@/design-system';

type Props = {
  paddingVertical?: Space;
  paddingHorizontal?: Space;
};

export function RewardsSectionCard({
  children,
  paddingVertical = '20px',
  paddingHorizontal = '20px',
}: PropsWithChildren<Props>) {
  return (
    <Box
      background="surfaceSecondaryElevated"
      borderRadius={18}
      paddingVertical={paddingVertical}
      paddingHorizontal={paddingHorizontal}
      shadow="12px"
    >
      {children}
    </Box>
  );
}
