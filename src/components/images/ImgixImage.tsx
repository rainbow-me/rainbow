import { FasterImageView, ImageOptions } from '@candlefinance/faster-image';
import * as React from 'react';
import { PixelRatio, StyleSheet } from 'react-native';
import FastImage, { FastImageProps, Source } from 'react-native-fast-image';
import { maybeSignSource } from '../../handlers/imgix';
import { IS_IOS } from '@/env';

export type ImgixImageProps = FastImageProps & {
  Component?: React.ElementType;
  ref?: React.Ref<any>;
  size?: number;
  fm?: string;
  enableFasterImage?: boolean;
  fasterImageConfig?: Omit<ImageOptions, 'borderRadius' | 'url'>;
};

export const DEFAULT_FASTER_IMAGE_CONFIG: Partial<ImageOptions> = {
  cachePolicy: 'discWithCacheControl',
  resizeMode: 'cover',
  showActivityIndicator: false,
  transitionDuration: 0.175,
};

const PIXEL_RATIO = PixelRatio.get();

const ImgixImage = React.memo(function ImgixImage(props: ImgixImageProps) {
  const { Component: maybeComponent, onLoad, onError, ...restProps } = props;

  const shouldUseFasterImage = Boolean(props.enableFasterImage || props.fasterImageConfig);

  const derivedSource = React.useMemo(() => {
    const options = {
      ...(props.fm && { fm: props.fm }),
      ...(props.size && {
        h: props.size,
        w: props.size,
      }),
    };

    if (shouldUseFasterImage) {
      const fasterImageStyle = StyleSheet.flatten(props.style);
      const signedUrl = props.source && typeof props.source === 'object' ? maybeSignSource(props.source, options)?.uri : props.source;

      return {
        ...DEFAULT_FASTER_IMAGE_CONFIG,
        borderRadius:
          !fasterImageStyle?.borderRadius || IS_IOS ? fasterImageStyle?.borderRadius : fasterImageStyle.borderRadius * PIXEL_RATIO,
        resizeMode: props.resizeMode && props.resizeMode !== 'stretch' ? props.resizeMode : DEFAULT_FASTER_IMAGE_CONFIG.resizeMode,
        ...props.fasterImageConfig,
        url: signedUrl,
      };
    } else {
      return props.source && typeof props.source === 'object' ? maybeSignSource(props.source, options) : props.source;
    }
  }, [props.fasterImageConfig, props.fm, props.resizeMode, props.size, props.source, props.style, shouldUseFasterImage]);

  const Component = maybeComponent || (shouldUseFasterImage ? FasterImageView : FastImage);

  if (shouldUseFasterImage) {
    return <Component {...restProps} onError={onError} onLoad={undefined} onSuccess={onLoad} source={derivedSource} />;
  } else {
    return <Component {...restProps} onError={onError} onLoad={onLoad} source={derivedSource} />;
  }
});

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

const { cacheControl, clearDiskCache, clearMemoryCache, priority, resizeMode } = FastImage;

export default Object.assign(ImgixImage, {
  cacheControl,
  clearDiskCache,
  clearMemoryCache,
  preload,
  priority,
  resizeMode,
});
