import { opacity } from '@/__swaps__/utils/swaps';
import ShimmerAnimation from '@/components/animations/ShimmerAnimation';
import { AccentColorProvider } from '@/design-system/color/AccentColorContext';
import { Box } from '@/design-system/components/Box/Box';
import { useBackgroundColor } from '@/design-system/components/BackgroundProvider/BackgroundProvider';
import { useColorMode } from '@/design-system/color/ColorMode';
import React from 'react';
import { DimensionValue } from 'react-native';

export const Skeleton = ({ width, height }: { width: DimensionValue; height: DimensionValue }) => {
  const { isDarkMode } = useColorMode();

  const fill = useBackgroundColor('fill');
  const fillSecondary = useBackgroundColor('fillSecondary');
  const shimmerColor = opacity(fill, isDarkMode ? 0.025 : 0.06);
  const skeletonColor = isDarkMode ? opacity('#191A1C', 0.7) : fillSecondary;

  return (
    <AccentColorProvider color={skeletonColor}>
      <Box background="accent" borderRadius={18} style={{ overflow: 'hidden', width, height }}>
        <ShimmerAnimation color={shimmerColor} gradientColor={shimmerColor} />
      </Box>
    </AccentColorProvider>
  );
};
