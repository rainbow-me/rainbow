import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateImageMetadataCache } from '../redux/imageMetadata';
import { getDominantColorFromImage } from '../utils';
import useDimensions from './useDimensions';
import { position } from '@rainbow-me/styles';

export function useImagesColors(imageUrls) {
  const imageColorSelector = useCallback(
    ({ imageMetadata }) =>
      imageUrls.map(imageUrl => imageMetadata.imageMetadata[imageUrl]?.color),
    [imageUrls]
  );

  return useSelector(imageColorSelector);
}

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
            color: color || colorFromImage,
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
