import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import OfflineMetadata from '../references/meta/tokens-metadata.json';
import useDimensions from './useDimensions';
import { updateImageMetadataCache } from '@rainbow-me/redux/imageMetadata';
import { position } from '@rainbow-me/styles';
import { getDominantColorFromImage } from '@rainbow-me/utils';

export default function useImageMetadata(imageUrl: any) {
  const dispatch = useDispatch();
  const { width: deviceWidth } = useDimensions();

  const imageMetadataSelector = useCallback(
    state => state.imageMetadata.imageMetadata[imageUrl],
    [imageUrl]
  );

  const selectorMeta = useSelector(imageMetadataSelector);
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  const metadata = imageUrl ? OfflineMetadata[imageUrl] || selectorMeta : null;
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
