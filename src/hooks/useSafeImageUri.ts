import * as React from 'react';

import { maybeSignUri } from '../handlers/imgix';

export default function useSafeImageUri(
  maybeUnsafeUri: string | undefined
): string | undefined {
  return React.useMemo(() => {
    return maybeSignUri(maybeUnsafeUri);
  }, [maybeUnsafeUri]);
}
