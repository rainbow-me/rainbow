import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

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
    <View style={[style, { backgroundColor, borderRadius, position: 'relative' }]}>
      <MaskedView
        maskElement={<View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderWidth, borderRadius }]} />}
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient start={start} end={end} style={StyleSheet.absoluteFill} colors={borderGradientColors} pointerEvents="none" />
      </MaskedView>
      {children}
    </View>
  );
}
