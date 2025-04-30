import React, { useMemo, memo } from 'react';
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
import { opacity } from '@/__swaps__/utils/swaps';

type ShinyCoinIconProps = {
  imageUrl: string;
  size?: number;
  color?: string;
};

const DROP_SHADOW_BLUR = 9 / 2;
const DROP_SHADOW_OFFSET_Y = 3;
const DROP_SHADOW_OVERFLOW_BUFFER = DROP_SHADOW_BLUR * 4 + DROP_SHADOW_OFFSET_Y;

export const ShinyCoinIcon = memo(function ShinyCoinIcon({ imageUrl, size = 40, color }: ShinyCoinIconProps) {
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
      opacity30: opacity(color ?? '#000000', 0.3),
    };
  }, [color]);

  return (
    <Canvas style={{ width: size + DROP_SHADOW_OVERFLOW_BUFFER, height: size + DROP_SHADOW_OVERFLOW_BUFFER }}>
      <Group transform={[{ translateX: DROP_SHADOW_OVERFLOW_BUFFER / 2 }, { translateY: DROP_SHADOW_OVERFLOW_BUFFER / 2 }]}>
        <SkBox box={roundedRect}>
          <Shadow dx={0} dy={DROP_SHADOW_OFFSET_Y} blur={DROP_SHADOW_BLUR} color={accentColors.opacity30} shadowOnly />
        </SkBox>
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
});
