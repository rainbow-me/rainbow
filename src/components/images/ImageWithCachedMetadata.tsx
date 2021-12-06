import React, { useCallback, useMemo } from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ImgixImage' was resolved to '/Users/nick... Remove this comment to see the full error message
import ImgixImage from './ImgixImage';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useImageMetadata } from '@rainbow-me/hooks';

const ImageWithCachedMetadata = (
  { cache = ImgixImage.cacheControl.web, imageUrl, onLoad, ...props }: any,
  ref: any
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ImgixImage {...props} onLoad={handleLoad} ref={ref} source={source} />
  );
};

export default React.forwardRef(ImageWithCachedMetadata);
