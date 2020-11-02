import React from 'react';
import { StyleSheet } from 'react-native';
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
}) => {
  return (
    <ShadowView
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: backgroundColor || '#ffffff',
          borderRadius,
          height,
          opacity,
          width,
          zIndex,
          ...buildShadow(...shadow),
        },
      ]}
    />
  );
};

export default React.memo(ShadowItem);
