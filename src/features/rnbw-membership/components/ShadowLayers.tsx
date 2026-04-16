import { memo, type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type ShadowStyle = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
};

type ShadowLayersProps = {
  shadows: readonly ShadowStyle[];
  borderRadius: number;
  backgroundColor: string;
  children: ReactNode;
  outerGlowLayer?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

function getShadowLayerStyle(shadowStyle: ShadowStyle): ViewStyle {
  const elevation = Math.max(1, Math.round((shadowStyle.shadowRadius + Math.max(0, shadowStyle.shadowOffset.height)) / 2));

  if (Platform.OS === 'android') {
    return {
      elevation,
      opacity: shadowStyle.shadowOpacity,
      shadowColor: shadowStyle.shadowColor,
    };
  }

  return shadowStyle;
}

export const ShadowLayers = memo(function ShadowLayers({
  shadows,
  borderRadius,
  backgroundColor,
  children,
  outerGlowLayer,
  style,
}: ShadowLayersProps) {
  return (
    <View style={[styles.container, style]}>
      {outerGlowLayer}
      {shadows.map((shadowStyle, index) => (
        <View
          key={`${shadowStyle.shadowColor}-${index}`}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.layer, { borderRadius, backgroundColor }, getShadowLayerStyle(shadowStyle)]}
        />
      ))}
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
  },
  layer: {
    borderCurve: 'continuous',
  },
});
