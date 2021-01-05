import * as React from 'react';
import { Source } from 'react-native-fast-image';

import { maybeSignSource, maybeSignUri } from '../handlers/imgix';

export function useSafeImageUri(
  maybeUnsafeUri: string | undefined
): string | undefined {
  return React.useMemo(() => {
    return maybeSignUri(maybeUnsafeUri);
  }, [maybeUnsafeUri]);
}

export default function useImgix(source: Source): Source {
  return React.useMemo(() => {
    if (!!source && typeof source === 'object') {
      return maybeSignSource(source);
    }
    return source;
  }, [source]);
}
