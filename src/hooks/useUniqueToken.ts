import React from 'react';

import isSupportedUriExtension from '@/helpers/isSupportedUriExtension';
import supportedUriExtensions from '@/helpers/supportedUriExtensions';

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
      const {
        videoUrl,
        images: { fullResUrl },
      } = maybeUniqueToken;
      const assetUrl = videoUrl || fullResUrl;
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
