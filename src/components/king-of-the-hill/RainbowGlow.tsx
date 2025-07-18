import React from 'react';
import { Canvas, LinearGradient, Circle, vec, Blur, Group, Paint, RadialGradient, Mask, Rect } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';

interface RainbowGlowProps {
  size: number;
}

export const RainbowGlow: React.FC<RainbowGlowProps> = ({ size }) => {
  const glowSize = size * 3.75; // Scaled up 1.5x from 2.5
  const center = glowSize / 2;
  const maskRadius = size * 0.7; // Scaled up proportionally
  
  return (
    <Canvas style={[styles.canvas, { width: glowSize, height: glowSize }]}>
      <Group layer={<Paint><Blur blur={30} /></Paint>}>
        <Mask
          mask={
            <Group>
              <Circle cx={center} cy={center} r={maskRadius}>
                <RadialGradient
                  c={vec(center, center)}
                  r={maskRadius}
                  colors={[
                    'white',           // Center fully visible
                    'white',           // Keep center visible longer
                    'white',           // Keep center visible longer
                    'rgba(255,255,255,0.5)', // Start fading
                    'transparent'      // Fully transparent at edges
                  ]}
                  positions={[0, 0.3, 0.5, 0.7, 1]}
                />
              </Circle>
            </Group>
          }
        >
          <Rect x={0} y={0} width={glowSize} height={glowSize}>
            <LinearGradient
              start={vec(center, 0)}
              end={vec(center, glowSize)}
              colors={[
                'rgba(34, 197, 94, 1)',   // green
                'rgba(250, 204, 21, 1)',  // yellow
                'rgba(239, 68, 68, 1)',   // red
              ]}
              positions={[0, 0.5, 1]}
            />
          </Rect>
        </Mask>
      </Group>
    </Canvas>
  );
};

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
  },
});