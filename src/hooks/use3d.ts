import * as React from 'react';

import isSupportedUriExtension from '../helpers/isSupportedUriExtension';

const SUPPORTED_3D_EXTENSIONS = Object.freeze(['.glb']) as readonly string[];

export type use3dResult = {
  readonly is3dUri: (uri: string) => boolean;
};

export default function use3d(): use3dResult {
  const is3dUri = React.useCallback(
    (uri: string) => isSupportedUriExtension(uri, SUPPORTED_3D_EXTENSIONS),
    []
  );
  return React.useMemo(
    () => ({
      is3dUri,
    }),
    [is3dUri]
  );
}
