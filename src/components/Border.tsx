import React from 'react';
import { Cover, useColorMode, useForegroundColor } from '@/design-system';
import { ForegroundColor } from '@/design-system/color/palettes';
import { IS_IOS } from '@/env';

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
    (IS_IOS || enableOnAndroid) && (
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
