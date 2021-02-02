import * as React from 'react';

import isSupportedUriExtension from '../helpers/isSupportedUriExtension';
import supportedUriExtensions from '../helpers/supportedUriExtensions';

export type useUniqueTokenResult = {
  readonly supports3d: boolean;
  readonly supportsAudio: boolean;
  readonly supportsVideo: boolean;
};

const fallbackResult: useUniqueTokenResult = Object.freeze({
  supports3d: false,
  supportsAudio: false,
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
        supportedUriExtensions.SUPPORTED_3D_EXTENSIONS
      );
      const supportsAudio = isSupportedUriExtension(
        animation_url,
        supportedUriExtensions.SUPPORTED_AUDIO_EXTENSIONS
      );
      const supportsVideo = isSupportedUriExtension(
        animation_url,
        supportedUriExtensions.SUPPORTED_VIDEO_EXTENSIONS
      );
      return Object.freeze({ supports3d, supportsAudio, supportsVideo });
    }
    return fallbackResult;
  }, [maybeUniqueToken]);
}
