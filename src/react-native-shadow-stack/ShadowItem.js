import React from 'react';
import { StyleSheet } from 'react-native';
import { useAnimatedStyle } from 'react-native-reanimated';
import ShadowView from './ShadowView';

const buildShadow = (
  width = 0,
  height = 0,
  radius,
  shadowColor = '#000000',
  shadowOpacity = 0.4
) => ({
  shadowColor,
  shadowOffset: {
    height,
    width,
  },
  shadowOpacity,
  shadowRadius: radius / 2,
});

const ShadowItem = ({
  backgroundColor,
  borderRadius,
  height,
  opacity,
  shadow,
  width,
  zIndex,
  shadowProps,
  elevation,
}) => {
  const topStyle =
    typeof backgroundColor === 'function' || backgroundColor.value
      ? useAnimatedStyle(() => {
          return {
            backgroundColor: backgroundColor.value || '#ffffff',
          };
        })
      : { backgroundColor };
  return (
    <ShadowView
      elevation={elevation}
      shadowProps={shadowProps}
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius,
          elevation,
          height,
          opacity,
          width,
          zIndex,
          ...buildShadow(...shadow),
        },
        topStyle,
      ]}
    />
  );
};

export default React.memo(ShadowItem);
