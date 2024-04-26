import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useDimensions from './useDimensions';
import { ImageMetadata, updateImageMetadataCache } from '@/redux/imageMetadata';
import { AppState } from '@/redux/store';
import { position } from '@/styles';
import { DerivedValue } from 'react-native-reanimated';

export default function useImageMetadata(imageUrl: DerivedValue<string | undefined>) {
  const dispatch = useDispatch();
  const { width: deviceWidth } = useDimensions();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const imageMetadataSelector = useCallback((state: AppState) => state.imageMetadata.imageMetadata[imageUrl.value!], []);

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
    async ({ height, width }: { width: number; height: number }) => {
      if (isCached || !imageUrl) return;

      dispatch(
        updateImageMetadataCache({
          id: imageUrl.value!,
          metadata: {
            dimensions: {
              height,
              isSquare: height === width,
              width,
            },
          },
        })
      );
    },
    [dispatch, isCached]
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
