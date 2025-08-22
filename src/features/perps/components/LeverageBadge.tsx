import React, { memo, useMemo } from 'react';
import { Box, Text, useColorMode } from '@/design-system';
import { ETH_COLOR, ETH_COLOR_DARK, ETH_COLOR_DARK_ACCENT } from '@/__swaps__/screens/Swap/constants';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

type LeverageBadgeProps = {
  leverage: number;
};

export const LeverageBadge = memo(function LeverageBadge({ leverage }: LeverageBadgeProps) {
  const { isDarkMode } = useColorMode();
  const color = useMemo(() => {
    return opacityWorklet(isDarkMode ? ETH_COLOR_DARK : ETH_COLOR, 0.16);
  }, [isDarkMode]);

  return (
    <Box
      justifyContent="center"
      alignItems="center"
      height={18}
      paddingHorizontal={'6px'}
      borderRadius={10}
      backgroundColor={color}
      borderWidth={1}
      borderColor={{ custom: color }}
    >
      <Text size="11pt" weight="heavy" color={{ custom: ETH_COLOR_DARK_ACCENT }}>
        {`${leverage}x`}
      </Text>
    </Box>
  );
});
