import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import type { ShadowItem } from './ApplyShadow';

export function AndroidShadow({
  backgroundColor,
  shadows,
}: {
  backgroundColor: ViewStyle['backgroundColor'];
  shadows: ShadowItem[];
}) {
  const elevation = Math.max(...shadows.map(({ radius }) => radius || 0)) / 3;
  const shadowColor = shadows[shadows.length - 1].color;
  const opacity = Math.max(...shadows.map(({ opacity }) => opacity || 0)) * 5;
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor,
          elevation,
          opacity,
          shadowColor,
        },
      ]}
    />
  );
}
