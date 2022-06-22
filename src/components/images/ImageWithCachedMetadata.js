import React, { useCallback, useMemo } from 'react';
import TransformationImage from './TransformationImage';
import { useImageMetadata } from '@rainbow-me/hooks';

const ImageWithCachedMetadata = (
  { cache = TransformationImage.cacheControl.web, imageUrl, onLoad, ...props },
  ref
) => {
  const { onCacheImageMetadata } = useImageMetadata(imageUrl);

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

  return (
    <TransformationImage
      {...props}
      onLoad={handleLoad}
      ref={ref}
      source={source}
    />
  );
};

export default React.forwardRef(ImageWithCachedMetadata);
