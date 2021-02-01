import * as React from 'react';

import use3d from './use3d';

export type useUniqueTokenResult = {
  readonly supports3d: boolean;
};

const fallbackResult: useUniqueTokenResult = Object.freeze({
  supports3d: false,
});

export default function useUniqueToken(
  maybeUniqueToken: Record<string, any>
): useUniqueTokenResult {
  const { is3dUri } = use3d();
  return React.useMemo((): useUniqueTokenResult => {
    if (typeof maybeUniqueToken === 'object' && !!maybeUniqueToken) {
      const { animation_url } = maybeUniqueToken;
      const supports3d = is3dUri(animation_url);
      return Object.freeze({ supports3d });
    }
    return fallbackResult;
  }, [maybeUniqueToken, is3dUri]);
}
