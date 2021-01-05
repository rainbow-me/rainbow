import * as React from 'react';

export function useSafeImageUri(maybeUnsafeUri: string) {
  return React.useMemo(() => {
    if (typeof maybeUnsafeUri === 'string') {
      console.log('need to sign here');
    }
    return maybeUnsafeUri;
  }, [maybeUnsafeUri]);
}
