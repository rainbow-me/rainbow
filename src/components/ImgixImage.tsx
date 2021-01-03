import * as React from 'react';
import FastImage, { FastImageProps } from 'react-native-fast-image';

import useImgix from '../hooks/useImgix';

export type ImgixImageProps = FastImageProps;

export default function ImgixImage({
  source: maybeDangerousSource,
  ...extras
}: ImgixImageProps): JSX.Element {
  const source = useImgix(maybeDangerousSource);
  return <FastImage {...extras} source={source} />;
}
