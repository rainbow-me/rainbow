import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import ShadowItem from './ShadowItem';

const ShadowStack = React.forwardRef(
  (
    { backgroundColor, borderRadius, children, elevation = 0, height, hideShadow, overflow = 'hidden', shadows, style, width, ...props },
    ref
  ) => {
    const renderItem = useCallback(
      (shadow, index) => (
        <ShadowItem
          backgroundColor={backgroundColor}
          borderRadius={borderRadius}
          elevation={elevation}
          height={height}
          key={`${shadow.join('-')}${index}`}
          opacity={hideShadow ? 0 : 1}
          shadow={shadow}
          width={width}
          zIndex={index + 2}
        />
      ),
      [backgroundColor, borderRadius, elevation, height, hideShadow, width]
    );

    return (
      <View
        {...props}
        backgroundColor="transparent"
        borderRadius={borderRadius}
        height={ios ? height : height || 0}
        ref={ref}
        style={style}
        width={width}
        zIndex={1}
      >
        {ios && shadows?.map(renderItem)}
        <View
          {...props}
          borderRadius={borderRadius}
          elevation={shadows.reduce((acc, curr) => acc + Math.min(6, curr[2]), 0)}
          height={height}
          overflow={overflow}
          style={[StyleSheet.absoluteFill, { backgroundColor }]}
          width={width}
          zIndex={shadows?.length + 2 || 0}
        >
          {children}
        </View>
      </View>
    );
  }
);

ShadowStack.displayName = 'ShadowStack';

export default ShadowStack;
