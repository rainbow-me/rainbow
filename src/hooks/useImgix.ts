import * as React from 'react';
import { Source } from 'react-native-fast-image';

import { maybeSignUri, signImageSource } from '../handlers/imgix';

export type ExternalImageUriOrSource = number | Source;

export type useImgixParams = ExternalImageUriOrSource;
export type useImgixResult = ExternalImageUriOrSource;

export const useMaybeSignUri = (uri: string): string => {
  return React.useMemo(() => maybeSignUri(uri), [uri]);
};

export default function useImgix(params: useImgixParams): useImgixResult {
  return React.useMemo((): useImgixResult => {
    if (!params || typeof params === 'number') {
      return params;
    }
    if (typeof params === 'number') {
      /* require */
      return params;
    } else if (!!params && typeof params === 'object') {
      const source = params as Source;
      return signImageSource(source);
    }
    // eslint-disable-next-line no-console
    console.log(
      `[Imgix]: The useImgix hook encountered unexpected an request parameter, ${params}. This will be ignored, but expected Source or number.`
    );
    return params;
  }, [params]);
}
