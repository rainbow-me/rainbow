import * as React from 'react';
import { Animated } from 'react-native';
import FastImage, { FastImageProps, Source } from 'react-native-fast-image';

import { preload as safelyPreloadImages } from '../handlers/imgix';
import useImgix from '../hooks/useImgix';

export * from 'react-native-fast-image';

export type ImgixImageProps = FastImageProps & {
  readonly Component?: React.ElementType;
};

// This is used to override FastImage's default implementation of preload.
// This is because it's unsafe to directly cache image urls without passing
// the requested sources through Imgix first.
export const preload = (sources: readonly Source[]): void => {
  return safelyPreloadImages(sources);
};

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

function ImgixImage({
  Component: maybeComponent,
  source: maybeDangerousSource,
  ...extras
}: ImgixImageProps): JSX.Element {
  const Component = maybeComponent || AnimatedFastImage;
  const source = useImgix(maybeDangerousSource);
  return <Component {...extras} source={source} />;
}

export default Object.assign(ImgixImage, FastImage);
