import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateImageDimensionsCache } from '../redux/imageDimensionsCache';
import useDimensions from './useDimensions';
import { position } from '@rainbow-me/styles';

export default function useImageDimensionsCache(imageUrl) {
  const dispatch = useDispatch();

  const { width: deviceWidth } = useDimensions();
  const fallbackDimensions = useMemo(
    () => position.sizeAsObject(deviceWidth - 30),
    [deviceWidth]
  );

  const imageDimensionsCache = useSelector(state => state.imageDimensionsCache);
  const imageDimensions = imageDimensionsCache[imageUrl];
  const isCached = !!imageDimensions;

  const onCacheImageDimensions = useCallback(
    ({ height, width }) => {
      if (!isCached) {
        dispatch(
          updateImageDimensionsCache({
            dimensions: {
              height,
              isSquare: height === width,
              width,
            },
            id: imageUrl,
          })
        );
      }
    },
    [dispatch, imageUrl, isCached]
  );

  return {
    imageDimensions: imageDimensions || fallbackDimensions,
    onCacheImageDimensions,
  };
}
