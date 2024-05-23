import React from 'react';

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

export default function useUniqueToken(maybeUniqueToken: Record<string, any>): useUniqueTokenResult {
  return React.useMemo((): useUniqueTokenResult => {
    if (typeof maybeUniqueToken === 'object' && !!maybeUniqueToken) {
      const supports3d = !!maybeUniqueToken?.model_url;
      const supportsAudio = !!maybeUniqueToken?.audio_url;
      const supportsVideo = !!maybeUniqueToken?.video_url;
      return { supports3d, supportsAudio, supportsVideo };
    }
    return fallbackResult;
  }, [maybeUniqueToken]);
}
