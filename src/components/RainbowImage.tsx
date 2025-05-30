import { clearCache, FasterImageView, prefetch, type FasterImageProps } from '@candlefinance/faster-image';
import React from 'react';
import { Image, View, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';
import { coerceToArray } from '../helpers/coerceToArray';
import { withStaticProperties } from '../helpers/withStaticProperties';
import { memoFn } from '../utils/memoFn';

prefetch;
Image.prefetch;
FastImage.preload;

clearCache;

/**
 * Image component that tries to be fast
 *
 * @param props - source URL and other image properties
 */
const RainbowImageInternal = ({ containerStyle, ...props }: FasterImageProps & { containerStyle?: ViewStyle }) => {
  const imageElement = (() => {
    const extension = getImageType(props.source.url);
    const handler = getHandlerFromType(extension);

    if (handler === 'faster-image') {
      return <FasterImageView {...props} style={[{ flex: 1 }, ...coerceToArray(props.style)]} />;
    }

    if (handler === 'fast-image') {
      return (
        <FastImage
          source={props.source}
          // @ts-expect-error fast-image defines a custom style that's a superset and a bit odd, but this should work
          style={[{ flex: 1 }, ...coerceToArray(props.style)]}
          onError={() => {
            console.log('err??');
            props.onError?.({ nativeEvent: { error: 'Error loading image' } });
          }}
          onLoad={e => {
            console.log('???????????????');
            props.onSuccess?.({
              nativeEvent: {
                width: e.nativeEvent.width,
                height: e.nativeEvent.height,
                source: props.source.url,
              },
            });
          }}
        />
      );
    }

    // slowest but supports svg, data:, etc
    return (
      <Image
        style={props.style}
        source={{ uri: props.source.url }}
        onError={props.onError}
        onLoad={e =>
          props.onSuccess?.({
            nativeEvent: {
              width: e.nativeEvent.source.width,
              height: e.nativeEvent.source.height,
              source: props.source.url,
            },
          })
        }
      />
    );
  })();

  if (containerStyle) {
    return <View style={containerStyle}>{imageElement}</View>;
  }

  return imageElement;
};

export const RainbowImage = withStaticProperties(RainbowImageInternal, {
  preload() {
    // todo
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

const getImageType = memoFn((path: string): DetectedImageExtension => {
  if (path.includes('imgix.net')) {
    const [type = 'png'] = path.match(/fm=[a-z]+/) || [];
    return fastImageExtension[type as FastImageExtensions] || 'unknown';
  }
  try {
    const url = new URL(path);
    const pathname = url.pathname;
    const extension = pathname.split('.').pop()?.toLowerCase() || '';
    return fastImageExtension[extension as FastImageExtensions] || 'unknown';
  } catch {
    return 'unknown';
  }
});
