import { memo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

/**
 * Renders an efficient iOS shadow underlay.
 *
 * An opaque background lets React Native calculate `shadowPath` from the
 * view's bounds and corner radius, avoiding expensive image-based shadows.
 * Applying `opacity` to the whole view fades both the shadow and its
 * background, avoiding rounded-corner artifacts from stacked opaque fills.
 */
export const SurfaceShadow = memo(function SurfaceShadow({
  backdropColor,
  borderRadius,
  color,
  opacity,
  radius,
  y = 0,
}: {
  /** Opaque color matching the surface beneath this layer. */
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
