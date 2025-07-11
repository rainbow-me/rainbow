import { UniqueAsset } from '@/entities';
import React from 'react';

type AnimationType = '3d' | 'video' | 'audio';

export default function useAnimationType(uniqueAsset: UniqueAsset) {
  return React.useMemo((): AnimationType | undefined => {
    if (!uniqueAsset.images.animatedMimeType || !uniqueAsset.images.animatedUrl) return undefined;
    if (uniqueAsset.images.animatedMimeType.includes('video')) return 'video';
    if (uniqueAsset.images.animatedMimeType.includes('model')) return '3d';
    // Current support for Audio in prod is not working
    // ticketed here: https://linear.app/rainbow/issue/APP-2784/follow-up-audio-nfts-are-sometimes-displayed-in-a-broken-state
    // FIXME: Uncomment below to support audio in prod
    // if (uniqueAsset.images.animatedMimeType.includes('audio')) return 'audio';
  }, [uniqueAsset.images.animatedMimeType, uniqueAsset.images.animatedUrl]);
}
