import * as React from 'react';
import FastImage, { FastImageProps, Source } from 'react-native-fast-image';

import { maybeSignSource } from '../../handlers/imgix';

export type ImgixImageProps = FastImageProps & {
  readonly Component?: React.ElementType;
  readonly size: number;
};

// Here we're emulating the pattern used in react-native-fast-image:
// https://github.com/DylanVann/react-native-fast-image/blob/0439f7190f141e51a391c84890cdd8a7067c6ad3/src/index.tsx#L146
type HiddenImgixImageProps = {
  forwardedRef: React.Ref<any>;
  maxRetries?: number;
  retryOnError?: boolean;
  size: number;
  fm?: string;
};
type MergedImgixImageProps = ImgixImageProps & HiddenImgixImageProps;

// ImgixImage must be a class Component to support Animated.createAnimatedComponent.
class ImgixImage extends React.PureComponent<
  MergedImgixImageProps,
  ImgixImageProps & { retryCount: number }
> {
  static getDerivedStateFromProps(props: MergedImgixImageProps) {
    const { source, size, fm } = props;
    const options = {
      ...(fm && { fm: fm }),
      ...(size && {
        h: size,
        w: size,
      }),
    };

    return {
      retryCount: 0,
      source:
        !!source && typeof source === 'object'
          ? maybeSignSource(source, options)
          : source,
    };
  }

  handleError = (err: any) => {
    const { onError, retryOnError, maxRetries = 5 } = this.props;
    const { retryCount } = this.state;
    // We don't want to retry if there is a 404.
    const isNotFound =
      err.nativeEvent.statusCode === 404 ||
      err.nativeEvent.message?.includes('404');
    const shouldRetry = retryOnError && !isNotFound;

    if (shouldRetry && retryCount < maxRetries) {
      this.setState(({ retryCount }) => ({ retryCount: retryCount + 1 }));
    } else {
      // @ts-expect-error
      onError?.(err);
    }
  };

  render() {
    const { Component: maybeComponent, ...props } = this.props;
    // Use the local state as the signing source, as opposed to the prop directly.
    // (The source prop may point to an untrusted URL.)
    const { retryCount, source } = this.state;
    const Component = maybeComponent || FastImage;
    return (
      <Component
        {...props}
        key={retryCount}
        onError={this.handleError}
        source={source}
      />
    );
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
    return FastImage.preload(
      sources.map(source => maybeSignSource(source, options))
    );
  }
  return;
};

const getCachePath = (source: Source) =>
  FastImage.getCachePath(maybeSignSource(source));

const ImgixImageWithForwardRef = React.forwardRef(
  (props: ImgixImageProps, ref: React.Ref<any>) => (
    <ImgixImage forwardedRef={ref} {...props} />
  )
);

const {
  cacheControl,
  clearDiskCache,
  clearMemoryCache,
  contextTypes,
  priority,
  resizeMode,
} = FastImage;

export default Object.assign(ImgixImageWithForwardRef, {
  cacheControl,
  clearDiskCache,
  clearMemoryCache,
  contextTypes,
  getCachePath,
  preload,
  priority,
  resizeMode,
});
