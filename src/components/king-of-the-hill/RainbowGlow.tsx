import { Blur, Canvas, Circle, Group, LinearGradient, Mask, Paint, RadialGradient, Rect, vec } from '@shopify/react-native-skia';
import React, { memo } from 'react';

type RainbowGlowProps = {
  // glow size = size of content its glowing around
  // we expand it out a from there proportionally
  size: number;
};

export const RainbowGlow = memo(function RainbowGlow({ size }: RainbowGlowProps) {
  const glowSize = size * 4;
  const center = glowSize / 2;
  const maskRadius = size * 0.9;

  return (
    <Canvas style={{ width: glowSize, height: glowSize }}>
      <Group
        layer={
          <Paint>
            <Blur blur={15} />
          </Paint>
        }
        // move it downwards and skew it wider at the bottom
        transform={[{ scaleX: 1.1 }, { scaleY: 1.16 }, { skewX: 0.15 }, { translateY: -15 }, { translateX: -15 }]}
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
              // for some reason 0.4 and 0.4 as starting values gets the green/yellow to look visually right
              positions={[0.4, 0.4, 0.6, 0]}
            />
          </Rect>
        </Mask>
      </Group>
    </Canvas>
  );
});
