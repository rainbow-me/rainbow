import React from 'react';

import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import supportedUriExtensions from '@rainbow-me/helpers/supportedUriExtensions';

export type useUniqueTokenResult = {
  readonly supports3d: boolean;
  readonly supportsAudio: boolean;
  readonly supportsVideo: boolean;
};

const fallbackResult: useUniqueTokenResult = {
  supports3d: false,
  supportsAudio: false,
  supportsVideo: false,
};

export default function useUniqueToken(
  maybeUniqueToken: Record<string, any>
): useUniqueTokenResult {
  return React.useMemo((): useUniqueTokenResult => {
    if (typeof maybeUniqueToken === 'object' && !!maybeUniqueToken) {
      const { animation_url, image_url } = maybeUniqueToken;
      const assetUrl = animation_url || image_url;
      const supports3d = isSupportedUriExtension(
        assetUrl,
        supportedUriExtensions.SUPPORTED_3D_EXTENSIONS
      );
      const supportsAudio = isSupportedUriExtension(
        assetUrl,
        supportedUriExtensions.SUPPORTED_AUDIO_EXTENSIONS
      );
      const supportsVideo = isSupportedUriExtension(
        assetUrl,
        supportedUriExtensions.SUPPORTED_VIDEO_EXTENSIONS
      );
      return { supports3d, supportsAudio, supportsVideo };
    }
    return fallbackResult;
  }, [maybeUniqueToken]);
}
