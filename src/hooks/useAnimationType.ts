import React from 'react';

import type { UniqueAsset } from '@/entities/uniqueAssets';

type AnimationType = '3d' | 'video';

export default function useAnimationType(uniqueAsset: UniqueAsset) {
  return React.useMemo((): AnimationType | undefined => {
    if (!uniqueAsset.images.animatedMimeType || !uniqueAsset.images.animatedUrl) return undefined;
    if (uniqueAsset.images.animatedMimeType.includes('video')) return 'video';
    if (uniqueAsset.images.animatedMimeType.includes('model')) return '3d';
  }, [uniqueAsset.images.animatedMimeType, uniqueAsset.images.animatedUrl]);
}
