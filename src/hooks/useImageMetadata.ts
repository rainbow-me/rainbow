import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useDimensions from './useDimensions';
import { ImageMetadata, updateImageMetadataCache } from '@/redux/imageMetadata';
import { AppState } from '@/redux/store';
import { position } from '@/styles';
import { getDominantColorFromImage } from '@/utils';

export default function useImageMetadata(imageUrl: string | null) {
  const dispatch = useDispatch();
  const { width: deviceWidth } = useDimensions();

  const imageMetadataSelector = useCallback(
    (state: AppState) => state.imageMetadata.imageMetadata[imageUrl!],
    [imageUrl]
  );

  const selectorMeta = useSelector(imageMetadataSelector);
  const metadata = selectorMeta || null;
  const defaultMetadata = useMemo(
    () => ({
      dimensions: position.sizeAsObject(deviceWidth - 30),
    }),
    [deviceWidth]
  );

  const isCached = !!metadata && !!(metadata as ImageMetadata)?.color;
  const onCacheImageMetadata = useCallback(
    async ({ color, height, width }) => {
      if (isCached || !imageUrl) return;
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 2 arguments, but got 1.
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
