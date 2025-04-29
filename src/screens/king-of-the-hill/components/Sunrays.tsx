import React, { memo, useMemo } from 'react';
import { Skia, Group, Path, LinearGradient, vec, Blur } from '@shopify/react-native-skia';

function createConePath({ headWidth, baseWidth, height }: { headWidth: number; baseWidth: number; height: number }) {
  const path = Skia.Path.Make();
  path.moveTo((headWidth - baseWidth) / 2, height);
  path.lineTo((headWidth + baseWidth) / 2, height);
  path.lineTo(headWidth, 0);
  path.lineTo(0, 0);
  path.close();

  return path;
}

interface SunraysProps {
  rayCount: number;
  rayFocalWidth: number;
  rayHeadWidth: number;
  rayHeight: number;
  focalSize: number;
  blur?: number;
}

export const Sunrays = memo(function Sunrays({ rayCount, rayFocalWidth, rayHeadWidth, rayHeight, focalSize, blur }: SunraysProps) {
  const focalRadius = focalSize / 2;
  const size = 2 * (focalRadius + rayHeight);
  const centerX = size / 2;
  const centerY = size / 2;

  const rayPath = useMemo(() => {
    return createConePath({ headWidth: rayHeadWidth, baseWidth: rayFocalWidth, height: rayHeight });
  }, [rayHeadWidth, rayFocalWidth, rayHeight]);

  const rayTransforms = useMemo(() => {
    // Create an array of x cones with equal angle increments
    const rayAngles = Array.from({ length: rayCount }, (_, index) => ({
      angle: (index * Math.PI * 2) / rayCount,
    }));
    return rayAngles.map(cone => {
      // Calculate position on the circle
      const x = centerX + focalRadius * Math.cos(cone.angle);
      const y = centerY + focalRadius * Math.sin(cone.angle);

      // Calculate the angle to point towards center (add 90° to align properly)
      const pointToCenter = cone.angle + Math.PI / 2;

      return [
        { translateX: x },
        { translateY: y },
        // Rotate to point towards center
        { rotate: pointToCenter },
        // Move the cone so its base is at the circle point
        { translateX: -rayHeadWidth / 2 },
        { translateY: -rayHeight },
      ];
    });
  }, [rayCount, centerX, focalRadius, centerY, rayHeadWidth, rayHeight]);

  return (
    <Group>
      {rayTransforms.map((transform, index) => (
        <Group key={index} transform={transform}>
          <Path path={rayPath} />
          <LinearGradient
            start={vec(rayHeadWidth / 2, 0)}
            end={vec(rayHeadWidth / 2, rayHeight)}
            colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.06)']}
          />
        </Group>
      ))}
      {blur && <Blur blur={blur} />}
    </Group>
  );
});
