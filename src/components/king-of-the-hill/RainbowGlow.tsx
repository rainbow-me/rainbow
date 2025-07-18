import React from 'react';
import { Canvas, LinearGradient, Circle, vec, Blur, Group, Paint, RadialGradient, Mask, Rect } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';

interface RainbowGlowProps {
  size: number;
}

export const RainbowGlow: React.FC<RainbowGlowProps> = ({ size }) => {
  const glowSize = size * 1.8; // Even smaller container
  const center = glowSize / 2;
  const maskRadius = glowSize / 3; // Much smaller mask radius
  
  return (
    <Canvas style={[styles.canvas, { width: glowSize, height: glowSize }]}>
      <Group layer={<Paint><Blur blur={25} /></Paint>}>
        <Mask
          mask={
            <Group>
              <Circle cx={center} cy={center} r={maskRadius}>
                <RadialGradient
                  c={vec(center, center)}
                  r={maskRadius}
                  colors={[
                    'white',           // Center fully visible (0-40%)
                    'white',           // Keep center visible
                    'rgba(255,255,255,0.9)', // Slight fade
                    'rgba(255,255,255,0.4)', // Heavy fade
                    'transparent'      // Fully transparent at 70% radius
                  ]}
                  positions={[0, 0.4, 0.5, 0.7, 1]}
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