import { FasterImageProps } from '@candlefinance/faster-image';
import React from 'react';
import { ImageStyle, StyleProp } from 'react-native';
import { AnimatedStyle, useAnimatedProps } from 'react-native-reanimated';
import { DEFAULT_FASTER_IMAGE_CONFIG } from '@/components/images/ImgixImage';
import { SharedOrDerivedValueText } from '@/design-system/components/Text/AnimatedText';
import { IS_ANDROID } from '@/env';
import { PIXEL_RATIO } from '@/utils/deviceUtils';
import { AnimatedFasterImage } from './AnimatedFasterImage';

/**
 * Allows rendering an animated image via `FasterImage`. Accepts a Shared Value for the `url` prop.
 * If you have a string URL and only need to apply an animated style, use `AnimatedFasterImage` directly.
 *
 * @param borderRadius - The border radius of the image.
 * @param style - `ImageStyle` to apply to the image. Can be an animated style or a mixed style array.
 * @param url - The image URL to load.
 */
export const AnimatedImage = ({
  borderRadius,
  style,
  url,
}: {
  borderRadius?: number;
  style?: StyleProp<AnimatedStyle<ImageStyle>>;
  url: SharedOrDerivedValueText;
}) => {
  const animatedIconSource = useAnimatedProps<{ source: FasterImageProps['source'] }>(() => ({
    source: {
      ...DEFAULT_FASTER_IMAGE_CONFIG,
      borderRadius: borderRadius ? (IS_ANDROID ? borderRadius * PIXEL_RATIO : borderRadius) : undefined,
      url: url.value || '',
    },
  }));

  // @ts-expect-error: Doesn't pick up that it's getting a source prop via animatedProps
  return <AnimatedFasterImage animatedProps={animatedIconSource} style={style} />;
};
