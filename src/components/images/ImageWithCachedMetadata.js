import React, { useCallback, useMemo } from 'react';
import { useImageMetadata } from '@/hooks';
import FastImage from 'react-native-fast-image';

const ImageWithCachedMetadata = ({ cache = FastImage.cacheControl.web, imageUrl, onLoad, ...props }, ref) => {
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

  return <FastImage {...props} onLoad={handleLoad} ref={ref} source={source} />;
};

export default React.forwardRef(ImageWithCachedMetadata);
