import React from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import type { AndroidShadowItem } from './ApplyShadow';

export function AndroidShadow({
  backgroundColor,
  shadow,
  style,
}: {
  backgroundColor: ViewStyle['backgroundColor'];
  shadow: AndroidShadowItem;
  style: StyleProp<ViewStyle>;
}) {
  const { color, elevation = 0, opacity } = shadow;
  return (
    <>
      <View
        style={[
          StyleSheet.absoluteFill,
          style,
          {
            backgroundColor,
            elevation: elevation / 2,
            opacity,
            shadowColor: color,
          },
        ]}
      />
    </>
  );
}
