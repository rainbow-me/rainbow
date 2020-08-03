import { maxBy, minBy } from 'lodash';
import { useCallback, useMemo } from 'react';
import useAccountSettings from '../useAccountSettings';
import useDimensions from '../useDimensions';
import { convertAmountToNativeDisplay } from '@rainbow-me/helpers/utilities';

const emptyVector = { x: 0, y: 0 };

export default function useExtremeValuesFromPoints(points) {
  const { nativeCurrency } = useAccountSettings();
  const { width } = useDimensions();

  const checkBoundaries = useCallback(
    value =>
      Math.abs(value) > width / 2 - 45
        ? value > 0
          ? value - 45
          : value + 45
        : value,
    [width]
  );

  return useMemo(() => {
    let maxValue = emptyVector,
      maxValueDistance = 999,
      minValue = emptyVector,
      minValueDistance = 999,
      timePeriod = 0;

    if (points && points.length > 0) {
      maxValue = maxBy(points, 'y');
      minValue = minBy(points, 'y');
      timePeriod = points[points.length - 1].x - points[0].x;

      maxValueDistance = checkBoundaries(
        ((maxValue.x - points[0].x) / timePeriod) * width - width / 2
      );
      minValueDistance = checkBoundaries(
        ((minValue.x - points[0].x) / timePeriod) * width - width / 2
      );
    }

    return {
      highestPrice: convertAmountToNativeDisplay(maxValue.y, nativeCurrency),
      lowestPrice: convertAmountToNativeDisplay(minValue.y, nativeCurrency),
      maxValue,
      maxValueDistance,
      minValue,
      minValueDistance,
    };
  }, [checkBoundaries, nativeCurrency, points, width]);
}
