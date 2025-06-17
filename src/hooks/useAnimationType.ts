import { UniqueAsset } from '@/entities';
import React from 'react';

type AnimationType = '3d' | 'video' | 'audio';

export default function useAnimationType(uniqueAsset: UniqueAsset) {
  return React.useMemo((): AnimationType | undefined => {
    if (!uniqueAsset.images.animatedMimeType || !uniqueAsset.images.animatedUrl) return undefined;
    if (uniqueAsset.images.animatedMimeType.includes('video')) return 'video';
    if (uniqueAsset.images.animatedMimeType.includes('audio')) return 'audio';
    if (uniqueAsset.images.animatedMimeType.includes('model')) return '3d';
  }, [uniqueAsset.images.animatedMimeType, uniqueAsset.images.animatedUrl]);
}
