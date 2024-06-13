import { FasterImageView, ImageOptions } from '@candlefinance/faster-image';
import * as React from 'react';
import { PixelRatio, StyleSheet } from 'react-native';
import FastImage, { FastImageProps, Source } from 'react-native-fast-image';
import { maybeSignSource } from '../../handlers/imgix';
import { IS_IOS } from '@/env';

export type ImgixImageProps = FastImageProps & {
  readonly Component?: React.ElementType;
  readonly size: number;
};

export const DEFAULT_FASTER_IMAGE_CONFIG: Partial<ImageOptions> = {
  cachePolicy: 'discWithCacheControl',
  resizeMode: 'cover',
  showActivityIndicator: false,
  transitionDuration: 0.175,
};

// Here we're emulating the pattern used in react-native-fast-image:
// https://github.com/DylanVann/react-native-fast-image/blob/0439f7190f141e51a391c84890cdd8a7067c6ad3/src/index.tsx#L146
type HiddenImgixImageProps = {
  forwardedRef?: React.Ref<any>;
  maxRetries?: number;
  retryOnError?: boolean;
  size: number;
  fm?: string;
  enableFasterImage?: boolean;
  fasterImageConfig?: Omit<ImageOptions, 'borderRadius' | 'url'>;
};
type MergedImgixImageProps = ImgixImageProps & HiddenImgixImageProps;

const PIXEL_RATIO = PixelRatio.get();

// ImgixImage must be a class Component to support Animated.createAnimatedComponent.
class ImgixImage extends React.PureComponent<MergedImgixImageProps, ImgixImageProps & { retryCount: number }> {
  static getDerivedStateFromProps(props: MergedImgixImageProps) {
    const { resizeMode, source, size, style, fm, enableFasterImage, fasterImageConfig } = props;
    const options = {
      ...(fm && { fm: fm }),
      ...(size && {
        h: size,
        w: size,
      }),
    };

    const shouldUseFasterImage = enableFasterImage || fasterImageConfig;
    const fasterImageStyle = shouldUseFasterImage ? StyleSheet.flatten(style) : undefined;

    return {
      ...(shouldUseFasterImage
        ? {
            source: {
              ...DEFAULT_FASTER_IMAGE_CONFIG,
              borderRadius:
                !fasterImageStyle?.borderRadius || IS_IOS ? fasterImageStyle?.borderRadius : fasterImageStyle.borderRadius * PIXEL_RATIO,
              resizeMode: resizeMode && resizeMode !== 'stretch' ? resizeMode : DEFAULT_FASTER_IMAGE_CONFIG.resizeMode,
              ...fasterImageConfig,
              url: !!source && typeof source === 'object' ? maybeSignSource(source, options)?.uri : source,
            },
            style: [
              {
                borderCurve: 'continuous',
                height: fasterImageStyle?.height || size || '100%',
                overflow: 'hidden',
                width: fasterImageStyle?.width || size || '100%',
              },
              fasterImageStyle,
            ],
          }
        : { retryCount: 0, source: !!source && typeof source === 'object' ? maybeSignSource(source, options) : source }),
    };
  }

  handleError = (err: any) => {
    const { onError, retryOnError, maxRetries = 5 } = this.props;
    const { retryCount } = this.state;
    // We don't want to retry if there is a 404.
    const isNotFound = err?.nativeEvent?.statusCode === 404 || err?.nativeEvent?.message?.includes('404');
    const shouldRetry = retryOnError && !isNotFound;

    if (shouldRetry && retryCount < maxRetries) {
      this.setState(({ retryCount }) => ({ retryCount: retryCount + 1 }));
    } else {
      // @ts-expect-error
      onError?.(err?.nativeEvent?.error);
    }
  };

  render() {
    const { Component: maybeComponent, ...props } = this.props;
    // Use the local state as the signing source, as opposed to the prop directly.
    // (The source prop may point to an untrusted URL.)
    const { retryCount, source } = this.state;

    const shouldUseFasterImage = props.enableFasterImage || props.fasterImageConfig;

    const Component = maybeComponent || (shouldUseFasterImage ? FasterImageView : FastImage);

    const conditionalProps = shouldUseFasterImage
      ? {
          key: `${typeof source === 'object' && source.uri ? source.uri : ''}` || undefined,
          onError: this.props.onError,
          onLoad: undefined,
          onSuccess: this.props.onLoad,
        }
      : {
          key: `${typeof source === 'object' && source.uri ? source.uri : JSON.stringify(source)}-${retryCount}`,
          onError: this.handleError,
        };

    return <Component {...props} {...conditionalProps} source={source} />;
  }
}

const preload = (sources: Source[], size?: number, fm?: string): void => {
  if (sources.length) {
    const options = {
      ...(fm && { fm: fm }),
      ...(size && {
        h: size,
        w: size,
      }),
    };
    return FastImage.preload(sources.map(source => maybeSignSource(source, options)));
  }
  return;
};

const ImgixImageWithForwardRef = React.forwardRef((props: MergedImgixImageProps, ref: React.Ref<any>) => (
  <ImgixImage forwardedRef={ref} {...props} />
));

const { cacheControl, clearDiskCache, clearMemoryCache, contextTypes, priority, resizeMode } = FastImage;

export default Object.assign(ImgixImageWithForwardRef, {
  cacheControl,
  clearDiskCache,
  clearMemoryCache,
  contextTypes,
  preload,
  priority,
  resizeMode,
});
