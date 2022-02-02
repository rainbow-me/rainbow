import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import type { AndroidShadowItem } from './ApplyShadow';

export function AndroidShadow({
  backgroundColor,
  shadow,
}: {
  backgroundColor: ViewStyle['backgroundColor'];
  shadow: AndroidShadowItem;
}) {
  const { color, elevation = 0, opacity } = shadow;
  return (
    <>
      <View
        style={[
          StyleSheet.absoluteFill,
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
