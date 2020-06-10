import React, { useCallback } from 'react';
import FastImage from 'react-native-fast-image';
import { useImageDimensionsCache } from '../hooks';

export default function ImageWithCachedDimensions({ id, ...props }) {
  const { onCacheImageDimensions } = useImageDimensionsCache(id);

  const handleLoad = useCallback(
    ({ nativeEvent: { height, width } }) => {
      onCacheImageDimensions({ height, width });
    },
    [onCacheImageDimensions]
  );

  return <FastImage {...props} onLoad={handleLoad} />;
}
