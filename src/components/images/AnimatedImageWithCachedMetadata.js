import React, { useCallback, useMemo } from 'react';
import { useImageMetadata } from '@/hooks';
import FastImage from 'react-native-fast-image';

const AnimatedImageWithCachedMetadata = ({ cache = FastImage.cacheControl.web, imageUrl, onLoad, ...props }, ref) => {
  const onCacheImageMetadata = useCallback(
    async ({ height, width }) => {
      if (isCached || !imageUrl) return;

      dispatch(
        updateImageMetadataCache({
          id: imageUrl,
          metadata: {
            dimensions: {
              height,
              isSquare: height === width,
              width,
            },
          },
        })
      );
    },
    [dispatch, imageUrl, isCached]
  );

  const source = useMemo(() => ({ cache, uri: imageUrl }), [cache, imageUrl]);

  const handleLoad = useCallback(
    event => {
      onCacheImageMetadata(event?.nativeEvent);
      if (onLoad) {
        onLoad(event);
      }
    },
    [onCacheImageMetadata, onLoad]
  );

  return <FastImage {...props} onLoad={handleLoad} ref={ref} source={source} />;
};

export default React.forwardRef(AnimatedImageWithCachedMetadata);
