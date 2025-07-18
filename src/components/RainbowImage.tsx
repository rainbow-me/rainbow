import { FasterImageView, ImageOptions, type FasterImageProps } from '@candlefinance/faster-image';
import React from 'react';
import { Image } from 'react-native';
import FastImage from 'react-native-fast-image';
import { withStaticProperties } from '../helpers/withStaticProperties';
import { memoFn } from '../utils/memoFn';

export type RainbowImageProps = {
  source: ImageOptions;
  onError?: FasterImageProps['onError'];
  onSuccess?: FasterImageProps['onSuccess'];
  style?: FasterImageProps['style'];
};

/**
 * Image component that tries to be fast
 *
 * faster-image takes a more limited set of style props, so adding a containerStyle
 * that makes them appear more consistently and easier to control.
 *
 * @param props - source URL and other image properties
 */
const RainbowImageInternal = ({ style, source, onError, onSuccess }: RainbowImageProps) => {
  const extension = getImageType(source.url);
  const handler = getHandlerFromType(extension);

  if (handler === 'faster-image') {
    return (
      <FasterImageView
        onError={onError}
        onSuccess={onSuccess}
        source={
          typeof source === 'number'
            ? source
            : {
                // aligns default resizeMode to match fast-image and RN Image
                resizeMode: 'cover',
                ...source,
              }
        }
        style={style || []}
      />
    );
  }

  if (handler === 'fast-image') {
    return (
      <FastImage
        source={{
          uri: source.url,
          headers: source.headers,
          // for next version of react native faster image
          // priority: source.priority === 'veryLow' ? 'low' : source.priority === 'veryHigh' ? 'high' : source.priority,
        }}
        // @ts-expect-error so fast-image defines their own weird ImageStyle, it's mostly a subset and should be fine
        // we should replace fast-image with something like expo-image as it's no longer maintained and that will fix this
        style={style}
        onError={() => {
          onError?.({ nativeEvent: { error: 'Error loading image' } });
        }}
        onLoad={e => {
          onSuccess?.({
            nativeEvent: {
              width: e.nativeEvent.width,
              height: e.nativeEvent.height,
              source: source.url,
            },
          });
        }}
      />
    );
  }

  // slowest but supports svg, data:, etc
  return (
    <Image
      style={style}
      source={{ uri: source.url }}
      onError={onError}
      onLoad={e =>
        onSuccess?.({
          nativeEvent: {
            width: e.nativeEvent.source.width,
            height: e.nativeEvent.source.height,
            source: source.url,
          },
        })
      }
    />
  );
};

export const RainbowImage = withStaticProperties(RainbowImageInternal, {
  preload(...sources: string[]) {
    for (const source of sources) {
      const handler = getHandlerFromType(getImageType(source));
      switch (handler) {
        case 'faster-image': {
          // 1.7 has prefetch
          // prefetch([source]);
          break;
        }
        case 'fast-image': {
          FastImage.preload([{ uri: source }]);
          break;
        }
        case 'image': {
          Image.prefetch(source);
          break;
        }
      }
    }
  },
});

const fastImageExtension = {
  png: 'png',
  jpg: 'jpg',
  jpeg: 'jpeg',
  bmp: 'bmp',
  webp: 'webp',
  gif: 'gif',
  avif: 'avif',
} as const;

type FastImageExtensions = keyof typeof fastImageExtension;
type DetectedImageExtension = FastImageExtensions | 'unknown';
type ImageHandler = 'faster-image' | 'fast-image' | 'image';

const getHandlerFromType = (extension: DetectedImageExtension): ImageHandler => {
  if (extension === 'png' || extension === 'jpg' || extension === 'jpeg') {
    return 'faster-image';
  }
  if (extension === 'bmp' || extension === 'webp' || extension === 'gif' || extension === 'avif') {
    return 'fast-image';
  }
  return 'image';
};

const getImageType = memoFn((path: string | number): DetectedImageExtension => {
  if (typeof path === 'number') {
    return 'png';
  }

  try {
    const url = new URL(path);
    if (url.host.includes('imgix.net')) {
      const [type = 'png'] = path.match(/fm=[a-z]+/) || [];
      return fastImageExtension[type as FastImageExtensions] || 'unknown';
    }
    const pathname = url.pathname;
    const extension = pathname.split('.').pop()?.toLowerCase() || '';
    return fastImageExtension[extension as FastImageExtensions] || 'unknown';
  } catch {
    return 'unknown';
  }
});
