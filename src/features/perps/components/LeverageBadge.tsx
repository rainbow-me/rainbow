import React, { memo, useMemo } from 'react';
import { Bleed, Box, Text, useColorMode } from '@/design-system';
import { ETH_COLOR_DARK, ETH_COLOR_DARK_ACCENT } from '@/__swaps__/screens/Swap/constants';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

type LeverageBadgeProps = {
  leverage: number;
};

export const LeverageBadge = memo(function LeverageBadge({ leverage }: LeverageBadgeProps) {
  const { isDarkMode } = useColorMode();
  const color = useMemo(() => {
    if (isDarkMode) return opacityWorklet(ETH_COLOR_DARK, 0.16);
    return opacityWorklet('#09111F', 0.04);
  }, [isDarkMode]);

  return (
    <Bleed vertical="6px">
      <Box
        justifyContent="center"
        alignItems="center"
        height={18}
        paddingHorizontal={{ custom: 5.5 }}
        borderRadius={10}
        backgroundColor={color}
        borderWidth={1}
        borderColor={{ custom: color }}
      >
        <Text align="center" size="11pt" weight="heavy" color={isDarkMode ? { custom: ETH_COLOR_DARK_ACCENT } : 'labelTertiary'}>
          {`${leverage}x`}
        </Text>
      </Box>
    </Bleed>
  );
});
