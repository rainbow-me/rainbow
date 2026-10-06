import { memo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

/**
 * Renders a shadow behind its parent surface on iOS.
 */
export const SurfaceShadow = memo(function SurfaceShadow({
  backdropColor,
  borderRadius,
  color,
  opacity,
  radius,
  y = 0,
}: {
  /** Opaque color beneath the surface. */
  backdropColor: string;
  borderRadius: number;
  color: string;
  opacity: number;
  radius: number;
  y?: number;
}) {
  if (Platform.OS === 'android') return null;

  return (
    <View
      style={[
        styles.shadow,
        {
          backgroundColor: backdropColor,
          borderRadius,
          opacity,
          shadowColor: color,
          shadowOffset: { width: 0, height: y },
          shadowRadius: radius,
        },
      ]}
    />
  );
});

const styles = StyleSheet.create({
  shadow: {
    ...StyleSheet.absoluteFillObject,
    borderCurve: 'continuous',
    shadowOpacity: 1,
  },
});
