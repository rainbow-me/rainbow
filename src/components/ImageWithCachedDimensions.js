import React, { useCallback } from 'react';
import FastImage from 'react-native-fast-image';
import { useDispatch, useSelector } from 'react-redux';
import { updateImageDimensionsCache } from '../redux/imageDimensionsCache';

export default function ImageWithCachedDimensions({ id, onLoad, ...props }) {
  const dispatch = useDispatch();
  const imageDimensions = useSelector(
    ({ imageDimensionsCache }) => imageDimensionsCache
  );

  const isCached = imageDimensions[id];

  const handleLoad = useCallback(
    event => {
      const {
        nativeEvent: { height, width },
      } = event;

      if (!isCached) {
        dispatch(
          updateImageDimensionsCache({
            dimensions: {
              height,
              isSquare: height === width,
              width,
            },
            id,
          })
        );
      }

      if (onLoad) {
        onLoad(event);
      }
    },
    [dispatch, id, isCached, onLoad]
  );

  return <FastImage {...props} onLoad={handleLoad} />;
}
