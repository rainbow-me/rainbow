import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
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
    <View
      style={[
        style,
        {
          borderRadius,
          overflow: 'hidden',
        },
      ]}
    >
      <LinearGradient colors={borderGradientColors} start={start} end={end} style={StyleSheet.absoluteFill} />
      <View
        style={{
          margin: borderWidth,
          borderRadius: borderRadius - borderWidth,
          backgroundColor,
        }}
      >
        <View style={styles.childrenContainer}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  childrenContainer: {
    height: '100%',
    width: '100%',
  },
});
