import React from 'react';
import { ShimmerAnimation } from '@/components/animations';
import { AccentColorProvider, Box, useBackgroundColor, useColorMode } from '@/design-system';
import { opacity } from '@/__swaps__/utils/swaps';

export const Skeleton = ({ width, height }: { width: number; height: number }) => {
  const { isDarkMode } = useColorMode();

  const fill = useBackgroundColor('fill');
  const fillSecondary = useBackgroundColor('fillSecondary');
  const shimmerColor = opacity(fill, isDarkMode ? 0.025 : 0.06);
  const skeletonColor = isDarkMode ? opacity('#191A1C', 0.7) : fillSecondary;

  return (
    <AccentColorProvider color={skeletonColor}>
      <Box background="accent" height={{ custom: height }} width={{ custom: width }} borderRadius={18} style={{ overflow: 'hidden' }}>
        <ShimmerAnimation color={shimmerColor} width={width} gradientColor={shimmerColor} />
      </Box>
    </AccentColorProvider>
  );
};
