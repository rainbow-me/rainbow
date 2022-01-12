import React from 'react';
import { StyleSheet, View } from 'react-native';

import AndroidShadow from './AndroidShadow';

const ShadowStack = React.forwardRef(
  (
    {
      backgroundColor,
      borderRadius,
      children,
      height,
      hideShadow,
      overflow = 'hidden',
      shadows,
      width: widthProp,
      ...props
    },
    ref
  ) => {
    const width = typeof widthProp === 'number' ? widthProp : '100%';
    const adjustHeightForRadius = typeof height === 'number';
    const adjustWidthForRadius = typeof width === 'number';
    const radius = Math.max(...shadows.map(shadow => shadow[2]));

    return (
      <View
        {...props}
        borderRadius={borderRadius}
        height={height}
        ref={ref}
        width={width}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              alignItems: 'center',
              // Since shadows are sometimes cut off on Android, we need to
              // account for the shadow radius when setting the size of the element.
              height: adjustHeightForRadius ? height + radius : width,
              justifyContent: 'center',
              marginLeft: adjustWidthForRadius ? -(radius / 2) : undefined,
              marginTop: adjustHeightForRadius ? -(radius / 2) : undefined,
              width: adjustWidthForRadius ? width + radius : width,
            },
          ]}
        >
          <AndroidShadow
            adjustHeightForRadius={adjustHeightForRadius}
            adjustWidthForRadius={adjustWidthForRadius}
            backgroundColor={backgroundColor}
            borderRadius={borderRadius}
            height={height}
            opacity={hideShadow ? 0 : 1}
            radius={radius}
            shadows={shadows}
            width={width}
          />
          <View
            style={{
              borderRadius,
              height,
              width,
            }}
          >
            <View
              {...props}
              borderRadius={borderRadius}
              overflow={overflow}
              style={[{ backgroundColor, borderRadius, height, width }]}
            >
              {children}
            </View>
          </View>
        </View>
      </View>
    );
  }
);

ShadowStack.displayName = 'ShadowStack';

export default ShadowStack;
