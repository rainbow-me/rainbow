import * as React from 'react';

import isSupportedUriExtension from '../helpers/isSupportedUriExtension';

const SUPPORTED_3D_EXTENSIONS = Object.freeze(['.glb']) as readonly string[];
const SUPPORTED_VIDEO_EXTENSIONS = Object.freeze(['.mp4']) as readonly string[];

export type useUniqueTokenResult = {
  readonly supports3d: boolean;
  readonly supportsVideo: boolean;
};

const fallbackResult: useUniqueTokenResult = Object.freeze({
  supports3d: false,
  supportsVideo: false,
});

export default function useUniqueToken(
  maybeUniqueToken: Record<string, any>
): useUniqueTokenResult {
  return React.useMemo((): useUniqueTokenResult => {
    if (typeof maybeUniqueToken === 'object' && !!maybeUniqueToken) {
      const { animation_url } = maybeUniqueToken;
      const supports3d = isSupportedUriExtension(
        animation_url,
        SUPPORTED_3D_EXTENSIONS
      );
      const supportsVideo = isSupportedUriExtension(
        animation_url,
        SUPPORTED_VIDEO_EXTENSIONS
      );
      return Object.freeze({ supports3d, supportsVideo });
    }
    return fallbackResult;
  }, [maybeUniqueToken]);
}
