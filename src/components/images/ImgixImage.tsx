import * as React from 'react';
import FastImage, { FastImageProps, Source } from 'react-native-fast-image';

import { maybeSignSource } from '../../handlers/imgix';

export type ImgixImageProps = FastImageProps & {
  readonly Component?: React.ElementType;
  readonly size?: Number;
};

// Here we're emulating the pattern used in react-native-fast-image:
// https://github.com/DylanVann/react-native-fast-image/blob/0439f7190f141e51a391c84890cdd8a7067c6ad3/src/index.tsx#L146
type HiddenImgixImageProps = {
  forwardedRef: React.Ref<any>;
  size?: Number;
  fm?: String;
};
type MergedImgixImageProps = ImgixImageProps & HiddenImgixImageProps;

// ImgixImage must be a class Component to support Animated.createAnimatedComponent.
class ImgixImage extends React.PureComponent<
  MergedImgixImageProps,
  ImgixImageProps
> {
  constructor(props: MergedImgixImageProps) {
    super(props);
    const { source, size, fm } = props;
    const options = {
      ...(fm && { fm: fm }),
      ...(size && {
        h: size,
        w: size,
      }),
    };
    this.state = {
      source:
        !!source && typeof source === 'object'
          ? maybeSignSource(source, options)
          : source,
    };
  }
  componentDidUpdate(prevProps: ImgixImageProps) {
    const { source: prevSource } = prevProps;
    const { source, size, fm } = this.props;
    if (prevSource !== source) {
      // If the source has changed and looks signable, attempt to sign it.
      if (!!source && typeof source === 'object') {
        const options = {
          ...(fm && { fm: fm }),
          ...(size && {
            h: size,
            w: size,
          }),
        };
        Object.assign(this.state, {
          source: maybeSignSource(source, options),
        });
      } else {
        // Else propagate the source as normal.
        Object.assign(this.state, { source });
      }
    }
  }
  render() {
    const { Component: maybeComponent, ...props } = this.props;
    // Use the local state as the signing source, as opposed to the prop directly.
    // (The source prop may point to an untrusted URL.)
    const { source } = this.state;
    const Component = maybeComponent || FastImage;
    return <Component {...props} source={source} />;
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
    };
    return FastImage.preload(
      sources.map(source => maybeSignSource(source, options))
    );
  }
  return;
};

const ImgixImageWithForwardRef = React.forwardRef(
  (props: ImgixImageProps, ref: React.Ref<any>) => (
    <ImgixImage forwardedRef={ref} {...props} />
  )
);

const { cacheControl, contextTypes, priority, resizeMode } = FastImage;

export default Object.assign(ImgixImageWithForwardRef, {
  cacheControl,
  contextTypes,
  preload,
  priority,
  resizeMode,
});
