import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import type { ShadowItem } from './ApplyShadow';

export function IOSShadow({
  backgroundColor,
  shadows,
  style,
}: {
  backgroundColor: ViewStyle['backgroundColor'];
  shadows: ShadowItem[];
  style: StyleProp<ViewStyle>;
}) {
  return (
    <>
      {shadows.map((shadow, i) => (
        <View
          key={i}
          style={[
            StyleSheet.absoluteFill,
            style,
            {
              backgroundColor,
              shadowColor: shadow.color,
              shadowOffset: shadow.offset,
              shadowOpacity: shadow.opacity,
              shadowRadius: (shadow.radius || 0) / 2,
            },
          ]}
        />
      ))}
    </>
  );
}
