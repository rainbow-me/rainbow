import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import ShadowItem from './ShadowItem';

const ShadowStack = React.forwardRef(
  (
    {
      backgroundColor,
      backgroundColorShadow = backgroundColor,
      borderRadius,
      children,
      elevation = 0,
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
          backgroundColor={backgroundColorShadow}
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
      [
        backgroundColorShadow,
        borderRadius,
        elevation,
        height,
        hideShadow,
        width,
      ]
    );

    const topStyle =
      typeof backgroundColor === 'function' || backgroundColor.value
        ? // eslint-disable-next-line react-hooks/rules-of-hooks
          useAnimatedStyle(() => {
            return {
              backgroundColor: backgroundColor.value,
            };
          })
        : { backgroundColor };

    return (
      <Animated.View
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
        <Animated.View
          {...props}
          borderRadius={borderRadius}
          elevation={shadows.reduce(
            (acc, curr) => acc + Math.min(6, curr[2]),
            0
          )}
          height={height}
          overflow="hidden"
          style={[StyleSheet.absoluteFill, topStyle]}
          width={ios ? width : width || 0}
          zIndex={shadows?.length + 2 || 0}
        >
          {children}
        </Animated.View>
      </Animated.View>
    );
  }
);

ShadowStack.displayName = 'ShadowStack';

export default ShadowStack;
