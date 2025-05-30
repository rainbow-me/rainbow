import { FasterImageView, type FasterImageProps, clearCache, prefetch } from '@candlefinance/faster-image';
import { Image, View, ViewStyle, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { memoFn } from '../utils/memoFn';
import { coerceToArray } from '../helpers/coerceToArray';
import { ImgixImage } from './images';

prefetch;
Image.prefetch;
FastImage.preload;

clearCache;

/**
 * Image component that tries to be fast
 *
 * @param props - source URL and other image properties
 */
export const RainbowImage = ({ containerStyle, ...props }: FasterImageProps & { containerStyle?: ViewStyle }) => {
  const imageElement = (() => {
    const extension = getImageType(props.source.url);

    console.log('??', extension, props.source);

    // if (extension === 'png' || extension === 'jpg' || extension === 'jpeg') {
    //   return <FasterImageView {...props} style={[{ flex: 1 }, ...coerceToArray(props.style)]} />;
    // }

    // if (extension === 'imgix') {
    return <ImgixImage size={200} {...props} />;
    // }

    if (
      extension === 'png' ||
      extension === 'jpg' ||
      extension === 'jpeg' ||
      extension === 'bmp' ||
      extension === 'webp' ||
      extension === 'gif' ||
      extension === 'avif'
    ) {
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

const getImageType = memoFn((path: string): 'imgix' | FastImageExtensions | 'unknown' => {
  if (path.includes('imgix.net')) {
    return 'imgix';
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
