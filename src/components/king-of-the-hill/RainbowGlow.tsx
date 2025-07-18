import React from 'react';
import { Canvas, RadialGradient, Rect, vec, Blur } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';

interface RainbowGlowProps {
  size: number;
}

export const RainbowGlow: React.FC<RainbowGlowProps> = ({ size }) => {
  const glowSize = size * 2; // Glow extends beyond the token
  const center = glowSize / 2;
  
  return (
    <Canvas style={[styles.canvas, { width: glowSize, height: glowSize }]}>
      <Rect x={0} y={0} width={glowSize} height={glowSize}>
        <RadialGradient
          c={vec(center, center)}
          r={glowSize / 2}
          colors={[
            'rgba(34, 197, 94, 0.8)',   // green
            'rgba(34, 197, 94, 0.6)',   // green
            'rgba(250, 204, 21, 0.6)',  // yellow
            'rgba(239, 68, 68, 0.6)',   // red
            'rgba(239, 68, 68, 0.0)',   // red transparent
          ]}
          positions={[0, 0.3, 0.5, 0.7, 1]}
        />
        <Blur blur={20} />
      </Rect>
    </Canvas>
  );
};

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
  },
});