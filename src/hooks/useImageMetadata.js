import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateImageMetadataCache } from '../redux/imageMetadata';
import { getDominantColorFromImage } from '../utils';
import useDimensions from './useDimensions';
import { position } from '@rainbow-me/styles';

export default function useImageMetadata(imageUrl) {
  const dispatch = useDispatch();

  const { width: deviceWidth } = useDimensions();
  const defaultMetadata = useMemo(
    () => ({
      dimensions: position.sizeAsObject(deviceWidth - 30),
    }),
    [deviceWidth]
  );

  const imageMetadataSelector = useCallback(
    state => state.imageMetadata.imageMetadata[imageUrl],
    [imageUrl]
  );
  const metadata = useSelector(imageMetadataSelector);

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

  return {
    ...(metadata || defaultMetadata),
    isCached,
    onCacheImageMetadata,
  };
}
