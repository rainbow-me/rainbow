import * as React from 'react';
import parse from 'url-parse';

export type use3dResult = {
  readonly is3dUri: (uri: string) => boolean;
};

export default function use3d(): use3dResult {
  const is3dUri = React.useCallback((uri: string) => {
    try {
      const { href, pathname } = parse(uri || '');
      return href === uri && pathname.toLowerCase().endsWith('.glb');
    } catch (e) {
      return false;
    }
  }, []);
  return React.useMemo(
    () => ({
      is3dUri,
    }),
    [is3dUri]
  );
}
