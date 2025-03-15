import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, DimensionValue, Platform } from 'react-native';
import { Shadow } from './ShadowStack';

export interface ShadowItemProps {
  backgroundColor?: string;
  borderRadius?: number;
  elevation?: number;
  height?: DimensionValue;
  opacity?: number;
  shadow: Shadow;
  width?: DimensionValue;
  zIndex?: number;
  shadowProps?: any;
}

const ShadowItem: React.FC<ShadowItemProps> = ({
  backgroundColor,
  borderRadius,
  elevation,
  height,
  opacity = 1,
  shadow,
  width,
  zIndex,
  shadowProps = {},
}) => {
  const [offsetX, offsetY, blur, color, shadowOpacity] = shadow;
  const isIOS = Platform.OS === 'ios';

  const effectiveOpacity = shadowOpacity !== undefined ? shadowOpacity : opacity;

  const shadowStyle: ViewStyle = isIOS
    ? {
        shadowColor: color,
        shadowOffset: {
          width: offsetX,
          height: offsetY,
        },
        shadowOpacity: effectiveOpacity,
        shadowRadius: blur,
      }
    : {
        elevation: Math.min(24, elevation || 0),
      };

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor,
          borderRadius,
          height,
          opacity: isIOS ? 1 : effectiveOpacity,
          width,
          zIndex,
          ...shadowStyle,
        },
        shadowProps?.style,
      ]}
      {...shadowProps}
    />
  );
};

export default ShadowItem;
