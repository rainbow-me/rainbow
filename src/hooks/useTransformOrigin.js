import { get } from 'lodash';
import { useCallback, useMemo, useState } from 'react';
import { useMemoOne } from 'use-memo-one';
import {
  transformOrigin as transformOriginUtil,
  useValues,
} from 'react-native-redash';
import Animated from 'react-native-reanimated';

const { floor, divide, multiply, Value } = Animated;

export default function useTransformOrigin(transformOrigin, onLayoutProp) {
  const [height, width] = useValues([0, 0], []);

  // const [height, setHeight] = useState(0);
  // const [width, setWidth] = useState(0);

  const onLayout = useCallback(
    event => {
      if (transformOrigin && !height && !width) {
        height.setValue(get(event, 'nativeEvent.layout.height'));
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
      offsetX.setValue(multiply(floor(divide(width, 2)), offsetMultiplier));
    } else if (transformOrigin === 'bottom' || transformOrigin === 'top') {
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
