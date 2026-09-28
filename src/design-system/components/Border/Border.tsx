import React, { memo, useContext, type ReactElement } from 'react';
import { Platform, View } from 'react-native';

import { ColorModeContext } from '@/design-system/color/ColorMode';
import { getValueForColorMode, type ForegroundColor } from '@/design-system/color/palettes';
import { type CustomColor } from '@/design-system/color/useForegroundColor';

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

export const Border = memo(function Border(props: BorderProps): ReactElement | null {
  if (Platform.OS === 'android' && props.enableOnAndroid === false) return null;

  const { borderColor, enableInLightMode } = props;
  if (enableInLightMode && typeof borderColor === 'object' && typeof borderColor.custom === 'string') {
    return renderBorder(props, borderColor.custom);
  }

  return <ThemedBorder borderProps={props} />;
});

function ThemedBorder({ borderProps }: { borderProps: BorderProps }): ReactElement | null {
  const { colorMode, foregroundColors } = useContext(ColorModeContext);
  const { borderColor = 'separatorSecondary', enableInLightMode } = borderProps;
  const isDarkMode = colorMode === 'dark' || colorMode === 'darkTinted';

  if (!isDarkMode && !enableInLightMode) return null;

  const color = typeof borderColor === 'object' ? getValueForColorMode(borderColor.custom, colorMode) : foregroundColors[borderColor];
  return renderBorder(borderProps, color);
}

function renderBorder(props: BorderProps, color: string): ReactElement {
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
}
