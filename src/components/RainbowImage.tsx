import { FasterImageView, ImageOptions, type FasterImageProps } from '@candlefinance/faster-image';
import React from 'react';
import { Image, RegisteredStyle, View, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';
import { coerceToArray } from '../helpers/coerceToArray';
import { withStaticProperties } from '../helpers/withStaticProperties';
import { memoFn } from '../utils/memoFn';

export type RainbowImageProps = {
  source: ImageOptions;
  onError?: FasterImageProps['onError'];
  onSuccess?: FasterImageProps['onSuccess'];
  style?: FasterImageProps['style'];
  containerStyle?: ViewStyle | RegisteredStyle<ViewStyle>;
};

/**
 * Image component that tries to be fast
 *
 * faster-image takes a more limited set of style props, so adding a containerStyle
 * that makes them appear more consistently and easier to control.
 *
 * @param props - source URL and other image properties
 */
const RainbowImageInternal = ({ containerStyle, ...props }: RainbowImageProps) => {
  const imageElement = (() => {
    const extension = getImageType(props.source.url);
    const handler = getHandlerFromType(extension);

    if (handler === 'faster-image') {
      return <FasterImageView {...props} style={[{ flex: 1 }, ...coerceToArray(props.style || [])]} />;
    }

    if (handler === 'fast-image') {
      return (
        <FastImage
          source={{
            uri: props.source.url,
            headers: props.source.headers,
            // for next version of react native faster image
            // priority: props.source.priority === 'veryLow' ? 'low' : props.source.priority === 'veryHigh' ? 'high' : props.source.priority,
          }}
          // @ts-expect-error fast-image defines a custom style that's a superset and a bit odd, but this should work
          style={[{ flex: 1 }, ...coerceToArray(props.style)]}
          onError={() => {
            props.onError?.({ nativeEvent: { error: 'Error loading image' } });
          }}
          onLoad={e => {
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

const getImageType = memoFn((path: string): DetectedImageExtension => {
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
