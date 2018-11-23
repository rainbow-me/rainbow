import FastImage from 'react-native-fast-image';
import { compose, withHandlers } from 'recompact';
import { withImageDimensionsCache } from '../hoc';

export default compose(
  withImageDimensionsCache,
  withHandlers({
    onLoad: ({
      id,
      imageDimensionsCache,
      onLoad,
      updateCache,
    }) => event => {
      event.persist();
      const { nativeEvent: { height, width } } = event;

      if (!imageDimensionsCache[id]) {
        updateCache({
          dimensions: {
            height,
            isSquare: height === width,
            width,
          },
          id,
        });
      }

      if (onLoad) {
        onLoad(event);
      }
    },
  }),
)(FastImage);
