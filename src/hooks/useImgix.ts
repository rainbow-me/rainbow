import * as React from 'react';
import { Source } from 'react-native-fast-image';

import {
  canSignUriWithImgix,
  signImageSource,
  signUriWithImgix,
} from '../handlers/imgix';

export type ExternalImageUriOrSource = string | Source;
export type IgnoredImageSources = null | undefined | number;

export type useImgixParams = ExternalImageUriOrSource | IgnoredImageSources;
export type useImgixResult = ExternalImageUriOrSource | IgnoredImageSources;

export default function useImgix(params: useImgixParams): useImgixResult {
  return React.useMemo((): useImgixResult => {
    if (!params || typeof params === 'number') {
      return params;
    }
    if (typeof params === 'string') {
      const externalImageUri = params as string;
      return canSignUriWithImgix({ externalImageUri })
        ? signUriWithImgix({ externalImageUri })
        : externalImageUri;
    }
    const source = params as Source;
    return signImageSource(source);
  }, [params]);
}
