import React, { useMemo } from 'react';
import {
  Canvas,
  Group,
  Image,
  Box as SkBox,
  Shadow,
  rrect,
  rect,
  SkImage,
  useAnimatedImageValue,
  useImage,
} from '@shopify/react-native-skia';
import { SharedValue } from 'react-native-reanimated';

type ShinyCoinIconProps = {
  imageUrl: string;
  size?: number;
  color?: string;
};

export function ShinyCoinIcon({ imageUrl, size = 40, color }: ShinyCoinIconProps) {
  const shadowOverflowBuffer = 0;
  const roundedRect = useMemo(() => {
    return rrect(rect(0, 0, size, size), size / 2, size / 2);
  }, [size]);

  const isImageGif = useMemo(() => imageUrl?.endsWith('.gif'), [imageUrl]);
  const animatedSkiaImage = useAnimatedImageValue(isImageGif ? imageUrl : undefined);
  const skiaImage = useImage(!isImageGif ? imageUrl : undefined);

  const tokenImage: SkImage | null | SharedValue<SkImage | null> = useMemo(() => {
    if (isImageGif) {
      return animatedSkiaImage;
    }
    return skiaImage;
  }, [animatedSkiaImage, isImageGif, skiaImage]);

  const accentColors = useMemo(() => {
    return {
      opacity30: color ?? '#000000',
      opacity12: color ?? '#000000',
    };
  }, [color]);

  return (
    <Canvas style={{ width: size + shadowOverflowBuffer, height: size + shadowOverflowBuffer }}>
      <Group transform={[{ translateX: shadowOverflowBuffer / 2 }, { translateY: shadowOverflowBuffer / 2 }]}>
        {/* <SkBox box={roundedRect}>
          <Shadow dx={0} dy={4} blur={12 / 2} color={accentColors.opacity30} />
          <Shadow dx={0} dy={0} blur={20 / 2} color={accentColors.opacity12} />
        </SkBox> */}
        <Image clip={roundedRect} x={0} y={0} width={size} height={size} image={tokenImage} fit="cover" />
        <SkBox box={roundedRect}>
          <Shadow dx={0} dy={0.7} blur={3.52 / 2} color={'rgba(255, 255, 255, 1)'} inner shadowOnly />
        </SkBox>
        <SkBox box={roundedRect} blendMode={'darken'}>
          <Shadow dx={0} dy={-1.41} blur={2.81 / 2} color={'rgba(0, 0, 0, 0.4)'} inner shadowOnly />
        </SkBox>
      </Group>
    </Canvas>
  );
}
