import React, { useCallback, useMemo } from 'react';
import ImgixImage from './ImgixImage';
import { useImageMetadata } from '@/hooks';
import FastImgixImage from './FastImgixImage';

const ImageWithCachedMetadata = ({ cache = ImgixImage.cacheControl.web, imageUrl, onLoad, ...props }, ref) => {
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

  return <FastImgixImage {...props} onLoad={handleLoad} ref={ref} source={source} />;
};

export default React.forwardRef(ImageWithCachedMetadata);
