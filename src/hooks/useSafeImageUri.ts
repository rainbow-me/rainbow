import { useMemo } from 'react';

import { maybeSignUri } from '../handlers/imgix';

export default function useSafeImageUri(maybeUnsafeUri: string | undefined, skipCaching: boolean = false): string | undefined {
  return useMemo(() => {
    return maybeSignUri(maybeUnsafeUri, {}, skipCaching);
  }, [maybeUnsafeUri, skipCaching]);
}
