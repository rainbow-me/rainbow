import { FasterImageView, type FasterImageProps } from '@candlefinance/faster-image';
import { Image, View, ViewStyle } from 'react-native';
import FastImage from 'react-native-fast-image';
import { memoFn } from '../utils/memoFn';

/**
 * A faster image component that uses three libraries, from fastest to slowest
 * based on what they support.
 *
 * @param props - source URL and other image properties
 */
export const RainbowImage = ({ containerStyle, ...props }: FasterImageProps & { containerStyle?: ViewStyle }) => {
  const imageElement = (() => {
    const extension = getExtension(props.source.url);

    if (extension === 'png' || extension === 'jpg' || extension === 'jpeg') {
      return <FasterImageView {...props} />;
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

// memoized as it will certainly be called many times over and over with same values
// but probably not ever be called with > 10k or so, so wont pollute memory too much
const getExtension = memoFn((path: string) => {
  return path.split('.').pop()?.toLowerCase() || '';
});
