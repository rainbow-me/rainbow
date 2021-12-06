import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// @ts-expect-error ts-migrate(2732) FIXME: Cannot find module '../references/meta/tokens-meta... Remove this comment to see the full error message
import OfflineMetadata from '../references/meta/tokens-metadata.json';
import useDimensions from './useDimensions';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/imageMetadat... Remove this comment to see the full error message
import { updateImageMetadataCache } from '@rainbow-me/redux/imageMetadata';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { getDominantColorFromImage } from '@rainbow-me/utils';

export default function useImageMetadata(imageUrl: any) {
  const dispatch = useDispatch();
  const { width: deviceWidth } = useDimensions();

  const imageMetadataSelector = useCallback(
    state => state.imageMetadata.imageMetadata[imageUrl],
    [imageUrl]
  );

  const selectorMeta = useSelector(imageMetadataSelector);
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
