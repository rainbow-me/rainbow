import React, { memo } from 'react';
import { Cover, useColorMode, useForegroundColor } from '@/design-system';
import { type ForegroundColor } from '@/design-system/color/palettes';
import { type CustomColor } from '@/design-system/color/useForegroundColor';
import { IS_IOS } from '@/env';

export type BorderProps = {
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  borderColor?: ForegroundColor | CustomColor;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderRadius?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderRightWidth?: number;
  borderTopWidth?: number;
  borderWidth?: number;
  enableInLightMode?: boolean;
  enableOnAndroid?: boolean;
} & (
  | {
      borderBottomRadius?: number;
      borderLeftRadius?: never;
      borderRightRadius?: never;
      borderTopRadius?: number;
    }
  | {
      borderBottomRadius?: never;
      borderLeftRadius?: number;
      borderRightRadius?: number;
      borderTopRadius?: never;
    }
);

export const Border = memo(function Border({
  borderBottomLeftRadius,
  borderBottomRadius,
  borderBottomRightRadius,
  borderColor = 'separatorSecondary',
  borderLeftRadius,
  borderRadius,
  borderRightRadius,
  borderTopLeftRadius,
  borderTopRadius,
  borderTopRightRadius,
  borderBottomWidth,
  borderLeftWidth,
  borderRightWidth,
  borderTopWidth,
  borderWidth = 1,
  enableInLightMode,
  enableOnAndroid = true,
}: BorderProps) {
  const { isDarkMode } = useColorMode();

  const color = useForegroundColor(borderColor);

  return (isDarkMode || enableInLightMode) && (IS_IOS || enableOnAndroid) ? (
    <Cover
      style={{
        borderBottomLeftRadius: borderBottomLeftRadius ?? borderBottomRadius ?? borderLeftRadius ?? borderRadius,
        borderBottomRightRadius: borderBottomRightRadius ?? borderBottomRadius ?? borderRightRadius ?? borderRadius,
        borderColor: color,
        borderCurve: 'continuous',
        borderTopLeftRadius: borderTopLeftRadius ?? borderTopRadius ?? borderLeftRadius ?? borderRadius,
        borderTopRightRadius: borderTopRightRadius ?? borderTopRadius ?? borderRightRadius ?? borderRadius,
        borderBottomWidth: borderBottomWidth ?? borderWidth,
        borderLeftWidth: borderLeftWidth ?? borderWidth,
        borderRightWidth: borderRightWidth ?? borderWidth,
        borderTopWidth: borderTopWidth ?? borderWidth,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    />
  ) : null;
});
