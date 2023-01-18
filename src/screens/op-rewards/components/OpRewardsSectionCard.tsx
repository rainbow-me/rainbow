import React from 'react';
import { Box } from '@/design-system';

export const OpRewardsSectionCard: React.FC = ({ children }) => {
  return (
    <Box background="surfaceSecondaryElevated" borderRadius={18} padding="20px">
      {children}
    </Box>
  );
};
