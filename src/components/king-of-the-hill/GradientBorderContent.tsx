import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { useBackgroundColor, useColorMode } from '@/design-system';
import React, { ReactNode } from 'react';

export const GradientBorderContent = ({
  children,
  height,
  borderRadius = 20,
}: {
  children: ReactNode;
  height: number;
  borderRadius?: number;
}) => {
  const { isDarkMode } = useColorMode();
  const fillTertiaryColor = useBackgroundColor('fillTertiary');

  return (
    <GradientBorderView
      borderGradientColors={[fillTertiaryColor, 'transparent']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      borderRadius={borderRadius}
      backgroundColor={isDarkMode ? 'rgba(245, 248, 255, 0.05)' : 'rgba(9, 17, 31, 0.05)'}
      style={{ height }}
    >
      {children}
    </GradientBorderView>
  );
};
