import React from 'react';
import { useTheme } from '@/theme';
import { AccentColorProvider, Box, useBackgroundColor } from '@/design-system';
import { ShimmerAnimation } from '@/components/animations';

export const Skeleton = ({ width, height }: { width: number; height: number }) => {
  const { isDarkMode, colors } = useTheme();

  const surfaceSecondaryElevated = useBackgroundColor('surfaceSecondaryElevated');
  const surfaceSecondary = useBackgroundColor('surfaceSecondary');

  const skeletonColor = isDarkMode ? surfaceSecondaryElevated : surfaceSecondary;

  return (
    <AccentColorProvider color={skeletonColor}>
      <Box background="accent" height={{ custom: height }} width={{ custom: width }} borderRadius={18} style={{ overflow: 'hidden' }}>
        <ShimmerAnimation
          color={colors.alpha(colors.blueGreyDark, 0.06)}
          width={width}
          // @ts-ignore
          gradientColor={colors.alpha(colors.blueGreyDark, 0.06)}
        />
      </Box>
    </AccentColorProvider>
  );
};
