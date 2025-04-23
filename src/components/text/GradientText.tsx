import MaskedView from '@react-native-masked-view/masked-view';
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient, { LinearGradientProps } from 'react-native-linear-gradient';

interface GradientTextProps extends LinearGradientProps {
  bleed?: number;
  children: React.ReactElement;
}

const GradientText = memo(function GradientText({
  children,
  bleed = 0,
  start = { x: 0, y: 0.5 },
  end = { x: 1, y: 0.5 },
  ...linearGradientProps
}: GradientTextProps) {
  return (
    <MaskedView maskElement={children}>
      <View style={styles.text}>{children}</View>
      <LinearGradient
        start={start}
        end={end}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...linearGradientProps}
        style={[styles.gradient, { margin: -bleed }]}
      />
    </MaskedView>
  );
});

const styles = StyleSheet.create({
  gradient: {
    pointerEvents: 'none',
    position: 'absolute',
    // Fixes text clipping
    left: -1,
    right: -1,
    top: -1,
    bottom: -1,
  },
  text: {
    opacity: 0,
  },
});

export default GradientText;
