import MaskedView from '@react-native-masked-view/masked-view';
import React, { memo } from 'react';
import { StyleSheet, Text as NativeText } from 'react-native';
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
      <NativeText style={styles.ghostText}>{children}</NativeText>
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
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  ghostText: {
    opacity: 0,
  },
});

export default GradientText;
