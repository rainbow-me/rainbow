import React from 'react';
import { Box } from '@/design-system';
import { useTheme } from '@/theme';

export const OpRewardsProgressBar: React.FC = () => {
  const { colors } = useTheme();
  return (
    <Box
      width="full"
      borderRadius={8}
      height={{ custom: 20 }}
      padding="2px"
      style={{
        backgroundColor: colors.alpha(colors.networkColors.optimism, 0.16),
      }}
    >
      <Box
        width={{ custom: 100 }}
        height="full"
        borderRadius={6}
        style={{
          backgroundColor: colors.networkColors.optimism,
        }}
      />
    </Box>
  );
};
