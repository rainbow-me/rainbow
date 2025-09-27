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
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { ChainId } from '@/state/backendNetworks/types';
import { opacity } from '@/__swaps__/utils/swaps';

type ShinyCoinIconProps = {
  chainId: ChainId;
  color: string | undefined;
  imageUrl: string;
  symbol: string;
  size?: number;
  disableShadow?: boolean;
};

const DROP_SHADOW_BLUR = 9 / 2;
const DROP_SHADOW_OFFSET_Y = 3;
const DROP_SHADOW_OVERFLOW_BUFFER = DROP_SHADOW_BLUR * 4 + DROP_SHADOW_OFFSET_Y;

export const ShinyCoinIcon = memo(function ShinyCoinIcon({
  chainId,
  imageUrl,
  symbol,
  size = 40,
  color,
  disableShadow,
}: ShinyCoinIconProps) {
  const roundedRect = useMemo(() => {
    return rrect(rect(0, 0, size, size), size / 2, size / 2);
  }, [size]);

  const isImageGif = useMemo(() => imageUrl?.endsWith('.gif'), [imageUrl]);
  const animatedSkiaImage = useAnimatedImageValue(isImageGif ? imageUrl : undefined);
  const skiaImage = useImage(!isImageGif ? imageUrl : undefined);

  const tokenImage: SkImage | null | SharedValue<SkImage | null> = useMemo(() => {
    if (!imageUrl) return null;
    return isImageGif ? animatedSkiaImage : skiaImage;
  }, [animatedSkiaImage, imageUrl, isImageGif, skiaImage]);

  const accentColors = useMemo(() => {
    return {
      opacity30: opacity(color ?? '#000000', 0.3),
    };
  }, [color]);

  if (!tokenImage) return <RainbowCoinIcon color={color || undefined} chainId={chainId} size={size} symbol={symbol} showBadge={false} />;

  return (
    <Canvas style={{ width: size + DROP_SHADOW_OVERFLOW_BUFFER, height: size + DROP_SHADOW_OVERFLOW_BUFFER }}>
      <Group transform={[{ translateX: DROP_SHADOW_OVERFLOW_BUFFER / 2 }, { translateY: DROP_SHADOW_OVERFLOW_BUFFER / 2 }]}>
        {!disableShadow && (
          <SkBox box={roundedRect}>
            <Shadow dx={0} dy={DROP_SHADOW_OFFSET_Y} blur={DROP_SHADOW_BLUR} color={accentColors.opacity30} shadowOnly />
          </SkBox>
        )}
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
