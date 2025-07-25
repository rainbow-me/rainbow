import { Blur, Canvas, Circle, Group, LinearGradient, Mask, Paint, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import React, { memo } from 'react';

type RainbowGlowProps = {
  // glow size = size of content its glowing around
  // we expand it out a from there proportionally
  size: number;
};

export const RainbowGlow = memo(function RainbowGlow({ size }: RainbowGlowProps) {
  const glowSize = size * 3.75;
  const center = glowSize / 2;
  const maskRadius = size * 0.8;

  return (
    <Canvas style={{ width: glowSize, height: glowSize }}>
      <Group
        layer={
          <Paint>
            <Blur blur={20} />
          </Paint>
        }
        // skew it downwards
        transform={[{ scaleY: 1.15 }, { skewX: 0.08 }]}
      >
        <Mask
          mask={
            <Circle cx={center} cy={center} r={maskRadius}>
              <RadialGradient
                c={vec(center, center)}
                r={maskRadius}
                colors={['white', 'white', 'white', 'rgba(255,255,255,0.5)', 'transparent']}
                positions={[0, 0.3, 0.5, 0.7, 1]}
              />
            </Circle>
          }
        >
          <Rect x={0} y={0} width={glowSize} height={glowSize}>
            <LinearGradient
              start={vec(center, 0)}
              end={vec(center, glowSize)}
              colors={[
                'rgba(34, 197, 94, 1)', // green
                'rgba(250, 204, 21, 1)', // yellow
                'rgba(239, 68, 68, 1)', // red
                'rgba(168, 85, 247, 1)', // purple
              ]}
              positions={[0, 0.3, 0.6, 0]}
            />
          </Rect>
        </Mask>
      </Group>
    </Canvas>
  );
});
