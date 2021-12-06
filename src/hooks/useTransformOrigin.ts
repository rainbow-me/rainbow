import { get } from 'lodash';
import { useCallback, useMemo } from 'react';
import Animated, { Value } from 'react-native-reanimated';
import {
  transformOrigin as transformOriginUtil,
  useValues,
} from 'react-native-redash/src/v1';

const { floor, divide, multiply } = Animated;

export default function useTransformOrigin(
  transformOrigin: any,
  onLayoutProp: any
) {
  const [height, width] = useValues(0, 0);

  const onLayout = useCallback(
    event => {
      if (transformOrigin && !height && !width) {
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'setValue' does not exist on type 'never'... Remove this comment to see the full error message
        height.setValue(get(event, 'nativeEvent.layout.height'));
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'setValue' does not exist on type 'never'... Remove this comment to see the full error message
        width.setValue(get(event, 'nativeEvent.layout.width'));
      }

      if (onLayoutProp) {
        onLayoutProp(event);
      }
    },
    [height, onLayoutProp, transformOrigin, width]
  );

  const { offsetX, offsetY } = useMemo(() => {
    const offsetMultiplier =
      transformOrigin === 'left' || transformOrigin === 'top' ? -1 : 1;

    const offsetX = new Value(0);
    const offsetY = new Value(0);

    if (transformOrigin === 'left' || transformOrigin === 'right') {
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'AnimatedNode<number>' is not ass... Remove this comment to see the full error message
      offsetX.setValue(multiply(floor(divide(width, 2)), offsetMultiplier));
    } else if (transformOrigin === 'bottom' || transformOrigin === 'top') {
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'AnimatedNode<number>' is not ass... Remove this comment to see the full error message
      offsetY.setValue(multiply(floor(divide(height, 2)), offsetMultiplier));
    }
    return { offsetX, offsetY };
  }, [height, transformOrigin, width]);

  const withTransformOrigin = useCallback(
    transform => transformOriginUtil({ x: offsetX, y: offsetY }, transform),
    [offsetX, offsetY]
  );

  return { onLayout, withTransformOrigin };
}
