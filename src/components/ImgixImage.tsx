import * as React from 'react';
import FastImage, { FastImageProps, Source } from 'react-native-fast-image';

export type ImgixImageProps = FastImageProps & {
  readonly Component?: React.ElementType;
};

// ImgixImage must be a class Component to support
// Animated.createAnimatedComponent. We cannot render an AnimatedFastImage
// instead because this introduces a non-conform interface to callers,
// resulting in rendering issues (specifically on the SavingsListHeader).
class ImgixImage extends React.PureComponent<ImgixImageProps> {
  render() {
    const { Component: maybeComponent, source, ...props } = this.props;
    const Component = maybeComponent || FastImage;
    return <Component {...props} source={source} />;
  }
}

//let priority = ImgixImage.priority[isTopFold ? 'high' : 'normal'];

const preload = (sources: Source[]): void => {
  if (sources.length) {
    console.log('[Imgix]: Should preload ', ...sources);
  }
  return;
};

export default Object.assign(ImgixImage, FastImage, ImgixImage, {
  preload,
});
