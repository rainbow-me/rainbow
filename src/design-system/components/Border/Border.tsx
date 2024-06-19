import React from 'react';
import { Cover, useColorMode, useForegroundColor } from '@/design-system';
import { ForegroundColor } from '@/design-system/color/palettes';
import { CustomColor } from '@/design-system/color/useForegroundColor';
import { IS_IOS } from '@/env';

export interface BorderProps {
  borderColor?: ForegroundColor | CustomColor;
  borderRadius: number;
  borderWidth?: number;
  enableInLightMode?: boolean;
  enableOnAndroid?: boolean;
}

export const Border = ({
  borderColor = 'separatorSecondary',
  borderRadius,
  borderWidth = 1,
  enableInLightMode,
  enableOnAndroid = true,
}: BorderProps) => {
  const { isDarkMode } = useColorMode();

  const color = useForegroundColor(borderColor);

  return (isDarkMode || enableInLightMode) && (IS_IOS || enableOnAndroid) ? (
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
  ) : null;
};
