import React from 'react';
import { Box, Space } from '@/design-system';

type Props = {
  paddingVertical?: Space;
  paddingHorizontal?: Space;
};
export const RewardsSectionCard: React.FC<Props> = ({
  children,
  paddingVertical = '20px',
  paddingHorizontal = '20px',
}) => {
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
};
