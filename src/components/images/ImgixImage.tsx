import * as React from 'react';
import FastImage, { FastImageProps, Source } from 'react-native-fast-image';

import { maybeSignSource } from '../../handlers/imgix';

export type ImgixImageProps = FastImageProps & {
  readonly Component?: React.ElementType;
};

// Here we're emulating the pattern used in react-native-fast-image:
// https://github.com/DylanVann/react-native-fast-image/blob/0439f7190f141e51a391c84890cdd8a7067c6ad3/src/index.tsx#L146
type HiddenImgixImageProps = { forwardedRef: React.Ref<any> };
type MergedImgixImageProps = ImgixImageProps & HiddenImgixImageProps;

// ImgixImage must be a class Component to support Animated.createAnimatedComponent.
class ImgixImage extends React.PureComponent<MergedImgixImageProps, ImgixImageProps> {
  constructor(props: MergedImgixImageProps) {
    super(props);
    const { source } = props;
    this.state = {
      source:
        !!source && typeof source === 'object'
          ? maybeSignSource(source)
          : source,
    };
  }
  componentDidUpdate(prevProps: ImgixImageProps) {
    const { source: prevSource } = prevProps;
    const { source } = this.props;
    if (prevSource !== source) {
      // If the source has changed and looks signable, attempt to sign it.
      if (!!source && typeof source === 'object') {
        Object.assign(this.state, { source: maybeSignSource(source) });
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

const preload = (sources: Source[]): void => {
  if (sources.length) {
    return FastImage.preload(sources.map(source => maybeSignSource(source)));
  }
  return;
};

const ImgixImageWithForwardRef = React.forwardRef(
  (props: ImgixImageProps, ref: React.Ref<any>) => (
    <ImgixImage forwardedRef={ref} {...props} />
  ),
);

// We want to render using ImgixImage, assign all properties of
// FastImage to ImgixImage, override all properties of FastImage which
// we do not wish to override by FastImage, and finally override the
// preload mechanic.
export default Object.assign(
  ImgixImageWithForwardRef,
  FastImage,
  ImgixImageWithForwardRef,
  { preload },
);
