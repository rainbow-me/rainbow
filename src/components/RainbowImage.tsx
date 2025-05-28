import { FasterImageView, type FasterImageProps } from '@candlefinance/faster-image';
import { Image, View, ViewStyle, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';
import { memoFn } from '../utils/memoFn';
import { coerceToArray } from '../helpers/coerceToArray';

/**
 * Image component that tries to be fast
 *
 * @param props - source URL and other image properties
 */
export const RainbowImage = ({ containerStyle, ...props }: FasterImageProps & { containerStyle?: ViewStyle }) => {
  const imageElement = (() => {
    const extension = getImageType(props.source.url);

    if (extension === 'png' || extension === 'jpg' || extension === 'jpeg') {
      return <FasterImageView {...props} style={[{ flex: 1 }, ...coerceToArray(props.style)]} />;
    }

    if (extension === 'bmp' || extension === 'webp' || extension === 'gif' || extension === 'avif') {
      return (
        <FastImage
          source={props.source}
          // @ts-expect-error fast-image defines a custom style that's a superset and a bit odd, but this should work
          style={props.style}
          onError={() => props.onError?.({ nativeEvent: { error: 'Error loading image' } })}
          onLoad={e =>
            props.onSuccess?.({
              nativeEvent: {
                width: e.nativeEvent.width,
                height: e.nativeEvent.height,
                source: props.source.url,
              },
            })
          }
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

const getImageType = memoFn((path: string): string => {
  try {
    const url = new URL(path);

    // we get urls like this from imgix:
    // https://rainbow.imgix.net/https%3A%2F%2Fnft-cdn.alchemy.com%2Fblast-mainnet%2Ffb32114137151ee7ce0ad2a6cf8c8e21?w=525&fm=png&s=4ea01b89e4edd862e7fe7567b1af77fd
    if (url.hostname.includes('imgix')) {
      const fmParam = url.searchParams.get('fm');
      if (fmParam) {
        return fmParam.toLowerCase();
      }
    }

    const pathname = url.pathname;
    const extension = pathname.split('.').pop()?.toLowerCase() || '';
    return extension;
  } catch {
    return 'unknown';
  }
});
