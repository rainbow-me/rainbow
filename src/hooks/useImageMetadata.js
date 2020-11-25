import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useDimensions from './useDimensions';
import { updateImageMetadataCache } from '@rainbow-me/redux/imageMetadata';
import { position } from '@rainbow-me/styles';
import { getDominantColorFromImage } from '@rainbow-me/utils';

export default function useImageMetadata(imageUrl) {
  const dispatch = useDispatch();
  const { width: deviceWidth } = useDimensions();

  const imageMetadataSelector = useCallback(
    state => state.imageMetadata.imageMetadata[imageUrl],
    [imageUrl]
  );

  const metadata = useSelector(imageMetadataSelector);
  const defaultMetadata = useMemo(
    () => ({
      dimensions: position.sizeAsObject(deviceWidth - 30),
    }),
    [deviceWidth]
  );

  const isCached = !!metadata && !!metadata?.color;
  const onCacheImageMetadata = useCallback(
    async ({ color, height, width }) => {
      if (isCached || !imageUrl) return;

      const colorFromImage = await getDominantColorFromImage(imageUrl);

      dispatch(
        updateImageMetadataCache({
          id: imageUrl,
          metadata: {
            ...(color || colorFromImage
              ? { color: color || colorFromImage }
              : {}),
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

  return useMemo(
    () => ({
      ...(metadata || defaultMetadata),
      isCached,
      onCacheImageMetadata,
    }),
    [defaultMetadata, isCached, metadata, onCacheImageMetadata]
  );
}
