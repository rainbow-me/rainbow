import * as React from 'react';
import FastImage, { FastImageProps, Source } from 'react-native-fast-image';

import { ImgOptions, maybeSignSource } from '../../handlers/imgix';

export type TransformationImageProps = FastImageProps & {
  readonly Component?: React.ElementType;
  readonly size?: Number;
};

// Here we're emulating the pattern used in react-native-fast-image:
// https://github.com/DylanVann/react-native-fast-image/blob/0439f7190f141e51a391c84890cdd8a7067c6ad3/src/index.tsx#L146
type HiddenTransformationImageProps = {
  forwardedRef: React.Ref<any>;
  maxRetries?: number;
  retryOnError?: boolean;
  size?: Number;
  fm?: String;
};
type MergedTransformationImageProps = TransformationImageProps &
  HiddenTransformationImageProps;

// TransformationImage must be a class Component to support Animated.createAnimatedComponent.
class TransformationImage extends React.PureComponent<
  MergedTransformationImageProps,
  TransformationImageProps & { retryCount: number }
> {
  static getDerivedStateFromProps(props: MergedTransformationImageProps) {
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
          ? maybeSignSource(source, options as ImgOptions)
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

const preload = (sources: Source[], size?: Number, fm?: String): void => {
  if (sources.length) {
    const options = {
      ...(fm && { fm: fm }),
      ...(size && {
        h: size,
        w: size,
      }),
    } as ImgOptions;
    return FastImage.preload(
      sources.map(source => maybeSignSource(source, options))
    );
  }
  return;
};

const getCachePath = (source: Source) =>
  FastImage.getCachePath(maybeSignSource(source));

const TransformationImageWithForwardRef = React.forwardRef(
  (props: TransformationImageProps, ref: React.Ref<any>) => (
    <TransformationImage forwardedRef={ref} {...props} />
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

export default Object.assign(TransformationImageWithForwardRef, {
  cacheControl,
  clearDiskCache,
  clearMemoryCache,
  contextTypes,
  getCachePath,
  preload,
  priority,
  resizeMode,
});
