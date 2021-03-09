import { useMemo } from 'react';

import { maybeSignUri } from '../handlers/imgix';

export default function useSafeImageUri(
  maybeUnsafeUri: string | undefined
): string | undefined {
  return useMemo(() => {
    return maybeSignUri(maybeUnsafeUri);
  }, [maybeUnsafeUri]);
}
