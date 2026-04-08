import MaskedView from '@react-native-masked-view/masked-view';
import React, { memo } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient, type LinearGradientProps } from 'expo-linear-gradient';
import { THICK_BORDER_WIDTH } from '@/styles/constants';

const DEFAULT_START = { x: 0, y: 0 };
const DEFAULT_END = { x: 1, y: 1 };
const DEFAULT_BORDER_RADIUS = 9999;
const DEFAULT_BACKGROUND_COLOR = 'transparent';

type GradientBorderViewProps = {
  children: React.ReactNode;
  borderGradientColors: LinearGradientProps['colors'];
  locations?: LinearGradientProps['locations'];
  borderWidth?: number;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  borderRadius?: number;
  borderTopLeftRadius?: number;
  borderTopRightRadius?: number;
  borderBottomLeftRadius?: number;
  borderBottomRightRadius?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
};

export const GradientBorderView = memo(function GradientBorderView({
  children,
  borderGradientColors,
  locations,
  start = DEFAULT_START,
  end = DEFAULT_END,
  borderWidth = THICK_BORDER_WIDTH,
  borderRadius = DEFAULT_BORDER_RADIUS,
  borderTopLeftRadius,
  borderTopRightRadius,
  borderBottomLeftRadius,
  borderBottomRightRadius,
  style,
  backgroundColor = DEFAULT_BACKGROUND_COLOR,
}: GradientBorderViewProps) {
  const radiusStyle = {
    borderTopLeftRadius: borderTopLeftRadius ?? borderRadius,
    borderTopRightRadius: borderTopRightRadius ?? borderRadius,
    borderBottomLeftRadius: borderBottomLeftRadius ?? borderRadius,
    borderBottomRightRadius: borderBottomRightRadius ?? borderRadius,
  };

  return (
    <View style={[styles.baseStyle, style, { backgroundColor }, radiusStyle]}>
      <MaskedView
        maskElement={<View style={[styles.maskElement, { borderWidth }, radiusStyle]} />}
        style={styles.maskView}
        pointerEvents="none"
      >
        <LinearGradient start={start} end={end} style={StyleSheet.absoluteFill} colors={borderGradientColors} locations={locations} />
      </MaskedView>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  baseStyle: {
    borderCurve: 'continuous',
    position: 'relative',
    overflow: 'hidden',
  },
  maskElement: {
    ...StyleSheet.absoluteFillObject,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  maskView: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
});
