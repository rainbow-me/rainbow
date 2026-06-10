import React from 'react';
import { type DimensionValue } from 'react-native';

import ShimmerAnimation from '@/components/animations/ShimmerAnimation';
import { AccentColorProvider, Box, useBackgroundColor, useColorMode } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';

export const Skeleton = ({
  borderRadius = 18,
  height,
  width,
}: {
  borderRadius?: number;
  height: DimensionValue;
  width: DimensionValue;
}) => {
  const { isDarkMode } = useColorMode();

  const fill = useBackgroundColor('fill');
  const fillSecondary = useBackgroundColor('fillSecondary');
  const shimmerColor = opacity(fill, isDarkMode ? 0.025 : 0.06);
  const skeletonColor = isDarkMode ? opacity('#191A1C', 0.7) : fillSecondary;

  return (
    <AccentColorProvider color={skeletonColor}>
      <Box background="accent" borderRadius={borderRadius} style={{ overflow: 'hidden', width, height }}>
        <ShimmerAnimation color={shimmerColor} gradientColor={shimmerColor} />
      </Box>
    </AccentColorProvider>
  );
};
