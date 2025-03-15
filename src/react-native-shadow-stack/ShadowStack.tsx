import React, { useCallback, forwardRef, ReactNode } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, Platform, DimensionValue } from 'react-native';
import ShadowItem from './ShadowItem';

// [offsetX, offsetY, blur, color, opacity?]
export type Shadow = [number, number, number, string, number?];

export interface ShadowStackProps {
  backgroundColor?: string;
  borderRadius?: number;
  children?: ReactNode;
  elevation?: number;
  height?: DimensionValue;
  hideShadow?: boolean;
  overflow?: 'visible' | 'hidden' | 'scroll';
  shadows: Shadow[];
  style?: StyleProp<ViewStyle>;
  width?: DimensionValue;
  [key: string]: any; // For additional props
}

const ShadowStack = forwardRef<View, ShadowStackProps>(
  (
    {
      backgroundColor,
      borderRadius,
      children,
      elevation = 0,
      height,
      hideShadow = false,
      overflow = 'hidden',
      shadows = [],
      style,
      width,
      ...props
    },
    ref
  ) => {
    const isIOS = Platform.OS === 'ios';

    const renderItem = useCallback(
      (shadow: Shadow, index: number) => (
        <ShadowItem
          backgroundColor={backgroundColor}
          borderRadius={borderRadius}
          elevation={elevation}
          height={height}
          key={`${shadow.join('-')}-${index}`}
          opacity={hideShadow ? 0 : 1}
          shadow={shadow}
          width={width}
          zIndex={index + 2}
          shadowProps={{}} // Empty object for any additional shadow props
        />
      ),
      [backgroundColor, borderRadius, elevation, height, hideShadow, width]
    );

    // Calculate the total elevation for Android
    const totalElevation = shadows.reduce((acc: number, curr: Shadow) => acc + Math.min(6, curr[2]), 0);

    return (
      <View
        style={[
          style,
          {
            backgroundColor: 'transparent',
            borderRadius,
            height: isIOS ? height : height || 0,
            width,
            zIndex: 1,
          },
        ]}
        ref={ref}
        {...props}
      >
        {isIOS && shadows.map(renderItem)}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor,
              borderRadius,
              overflow,
              height,
              width,
              zIndex: shadows.length + 2 || 0,
              ...(Platform.OS === 'android' ? { elevation: totalElevation } : {}),
            },
          ]}
        >
          {children}
        </View>
      </View>
    );
  }
);

ShadowStack.displayName = 'ShadowStack';

export default ShadowStack;
