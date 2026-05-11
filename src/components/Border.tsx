import React from 'react';
import { Platform } from 'react-native';

import { Cover, useColorMode, useForegroundColor } from '@/design-system';
import { type ForegroundColor } from '@/design-system/color/palettes';

export const Border = ({
  borderColor = 'separatorTertiary',
  borderRadius,
  borderWidth = 1,
  enableInLightMode,
  enableOnAndroid,
}: {
  borderColor?: ForegroundColor;
  borderRadius: number;
  borderWidth?: number;
  enableInLightMode?: boolean;
  enableOnAndroid?: boolean;
}) => {
  const { isDarkMode } = useColorMode();

  const color = useForegroundColor(borderColor);

  return (
    (isDarkMode || enableInLightMode) &&
    (Platform.OS === 'ios' || enableOnAndroid) && (
      <Cover
        style={{
          borderColor: color,
          borderCurve: 'continuous',
          borderRadius,
          borderWidth,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      />
    )
  );
};
