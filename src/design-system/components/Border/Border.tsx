import React, { memo, use } from 'react';
import { Platform, View } from 'react-native';

import { ColorModeContext } from '@/design-system/color/ColorMode';
import { type ForegroundColor } from '@/design-system/color/palettes';
import { getColorForTheme, type CustomColor } from '@/design-system/color/useForegroundColor';

export type BorderProps = {
  borderColor?: ForegroundColor | CustomColor;
  borderRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderRightWidth?: number;
  borderTopWidth?: number;

  /** Whether to show the border in light color modes. Defaults to `false`. */
  enableInLightMode?: boolean;
  /** Whether to show the border on Android. Defaults to `true`. */
  enableOnAndroid?: boolean;
} & (
  | { borderBottomRadius?: number; borderLeftRadius?: never; borderRightRadius?: never; borderTopRadius?: number }
  | { borderBottomRadius?: never; borderLeftRadius?: number; borderRightRadius?: number; borderTopRadius?: never }
);

/**
 * Non-interactive border overlay that fills its parent. Defaults
 * to hidden in light mode unless `enableInLightMode` is set.
 */
export const Border = memo(function Border(props: BorderProps) {
  if (Platform.OS === 'android' && props.enableOnAndroid === false) return null;

  const borderColor = props.borderColor ?? 'separatorSecondary';
  const enableInLightMode = props.enableInLightMode ?? false;
  let color: string;

  if (enableInLightMode && typeof borderColor === 'object' && typeof borderColor.custom === 'string') {
    color = borderColor.custom;
  } else {
    const colorMode = use(ColorModeContext).colorMode;
    const isDarkMode = colorMode === 'dark' || colorMode === 'darkTinted';
    if (!isDarkMode && !enableInLightMode) return null;
    color = getColorForTheme(borderColor, colorMode);
  }

  const { borderBottomRadius, borderLeftRadius, borderRadius, borderRightRadius, borderTopRadius, borderWidth = 1 } = props;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        borderBottomLeftRadius: props.borderBottomLeftRadius ?? borderBottomRadius ?? borderLeftRadius ?? borderRadius,
        borderBottomRightRadius: props.borderBottomRightRadius ?? borderBottomRadius ?? borderRightRadius ?? borderRadius,
        borderColor: color,
        borderCurve: 'continuous',
        borderTopLeftRadius: props.borderTopLeftRadius ?? borderTopRadius ?? borderLeftRadius ?? borderRadius,
        borderTopRightRadius: props.borderTopRightRadius ?? borderTopRadius ?? borderRightRadius ?? borderRadius,
        borderBottomWidth: props.borderBottomWidth ?? borderWidth,
        borderLeftWidth: props.borderLeftWidth ?? borderWidth,
        borderRightWidth: props.borderRightWidth ?? borderWidth,
        borderTopWidth: props.borderTopWidth ?? borderWidth,
        overflow: 'hidden',
        zIndex: 100,
      }}
    />
  );
});
