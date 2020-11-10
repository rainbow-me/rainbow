import ImgixClient from 'imgix-core-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { IMGIX_DOMAIN, IMGIX_TOKEN } from 'react-native-dotenv';
import FastImage from 'react-native-fast-image';
import { useImageMetadata } from '../hooks';
import { ImgixCache } from '../utils';

const ImageWithCachedMetadata = (
  { cache = FastImage.cacheControl.web, imageUrl, onLoad, ...props },
  ref
) => {
  const [safeUrl, setSafeUrl] = useState(null);

  useEffect(() => {
    // Check on cache first
    if (ImgixCache.cache[imageUrl]) {
      // cache hit
      setSafeUrl(ImgixCache.cache[imageUrl]);
    } else {
      // cache miss
      let client = new ImgixClient({
        domain: IMGIX_DOMAIN,
        secureURLToken: IMGIX_TOKEN,
      });
      const options = {};
      if (props.width) {
        options.w = props.width;
      }
      if (props.height) {
        options.h = props.height;
      }
      const imgixUrl = client.buildURL(imageUrl, options);
      setSafeUrl(imgixUrl);
      // store on cache
      ImgixCache.cache[imageUrl] = imgixUrl;
    }
  }, [imageUrl, props.height, props.width]);

  const { onCacheImageMetadata } = useImageMetadata(safeUrl);
  const source = useMemo(() => ({ cache, uri: safeUrl }), [cache, safeUrl]);

  const handleLoad = useCallback(
    event => {
      onCacheImageMetadata(event?.nativeEvent);
      if (onLoad) {
        onLoad(event);
      }
    },
    [onCacheImageMetadata, onLoad]
  );

  if (!safeUrl) return null;
  return <FastImage {...props} onLoad={handleLoad} ref={ref} source={source} />;
};

export default React.forwardRef(ImageWithCachedMetadata);
