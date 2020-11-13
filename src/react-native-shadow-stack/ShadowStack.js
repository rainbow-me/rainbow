import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import ShadowItem from './ShadowItem';

const ShadowStack = React.forwardRef(
  (
    {
      backgroundColor,
      borderRadius,
      children,
      height,
      hideShadow,
      shadows,
      style,
      width,
      ...props
    },
    ref
  ) => {
    const renderItem = useCallback(
      (shadow, index) => (
        <ShadowItem
          backgroundColor={backgroundColor}
          borderRadius={borderRadius}
          height={ios ? height : height || 0}
          key={`${shadow.join('-')}${index}`}
          opacity={hideShadow ? 0 : 1}
          shadow={shadow}
          width={ios ? width : width || 0}
          zIndex={index + 2}
        />
      ),
      [backgroundColor, borderRadius, height, hideShadow, width]
    );

    return (
      <View
        {...props}
        backgroundColor="transparent"
        borderRadius={borderRadius}
        height={height}
        ref={ref}
        style={style}
        width={width}
        zIndex={1}
      >
        {shadows?.map(renderItem)}
        <View
          {...props}
          borderRadius={borderRadius}
          height={height}
          overflow="hidden"
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
