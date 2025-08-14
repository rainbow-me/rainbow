import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type GradientBorderViewProps = {
  children: React.ReactNode;
  borderGradientColors: string[];
  borderWidth?: number;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  borderRadius?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function GradientBorderView({
  children,
  borderGradientColors,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  borderWidth = THICK_BORDER_WIDTH,
  borderRadius = 9999,
  style,
  backgroundColor = 'transparent',
}: GradientBorderViewProps) {
  return (
    <View style={[styles.baseStyle, style, { backgroundColor, borderRadius }]}>
      <MaskedView
        maskElement={<View style={[StyleSheet.absoluteFill, { borderWidth, borderRadius }]} />}
        style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}
      >
        <LinearGradient start={start} end={end} style={StyleSheet.absoluteFill} colors={borderGradientColors} pointerEvents="none" />
      </MaskedView>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  baseStyle: {
    position: 'relative',
    pointerEvents: 'none',
  },
});
