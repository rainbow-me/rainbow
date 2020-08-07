import { invert } from 'lodash';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import Animated from 'react-native-reanimated';
import { useValue } from 'react-native-redash';
import { useMemoOne } from 'use-memo-one';
import useAccountSettings from '../useAccountSettings';
import useExperimentalFlag, {
  RED_GREEN_PRICE_CHANGE,
} from '@rainbow-me/config/experimentalHooks';
import ChartTypes from '@rainbow-me/helpers/chartTypes';
import {
  convertAmountToNativeDisplay,
  greaterThan,
  lessThan,
  toFixedDecimals,
} from '@rainbow-me/helpers/utilities';
import { colors } from '@rainbow-me/styles';

const formatPercentChange = (change = 0) => toFixedDecimals(change, 2);

const getPercentChangeDirection = change => {
  if (greaterThan(change, 0)) return 1;
  if (lessThan(change, 0)) return -1;
  return 0;
};

function useColorForPercentChange({ animation, fallbackColor }) {
  const shouldUseRedGreenColors = useExperimentalFlag(RED_GREEN_PRICE_CHANGE);
  return useMemoOne(
    () =>
      shouldUseRedGreenColors
        ? Animated.interpolateColors(animation, {
            inputRange: [-1, 0, 1],
            outputColorRange: [
              // negative percent changed
              colors.alpha(colors.red, 1),
              // 0 percent changed (unchanged)
              colors.alpha(colors.blueGreyDark, 0.8),
              // positive percent changed
              colors.alpha(colors.green, 1),
            ],
          })
        : fallbackColor,
    [animation, fallbackColor, shouldUseRedGreenColors]
  );
}

export default function useChartDataLabels({
  asset,
  chartType,
  color,
  points,
}) {
  const { nativeCurrency } = useAccountSettings();

  const changeDirection = useValue(1);
  const colorForPriceChange = useColorForPercentChange({
    animation: changeDirection,
    fallbackColor: color,
  });

  const changeRef = useRef();
  const dateRef = useRef();
  const priceRef = useRef();

  const latestPrice = asset?.native?.price.amount;

  const defaultDateLabel = useMemo(() => {
    if (chartType === ChartTypes.day) return 'Today';
    if (chartType === ChartTypes.max) return 'All time';
    return `Past ${invert(ChartTypes)[chartType]}`;
  }, [chartType]);

  const getPercentChangeForPrice = useCallback(
    startPrice => {
      const endPrice = points?.[points.length - 1].y || latestPrice;
      const percent = ((endPrice - startPrice) / startPrice) * -100;
      return formatPercentChange(percent);
    },
    [latestPrice, points]
  );

  const latestChange = useMemo(
    () =>
      !points || chartType === ChartTypes.day
        ? formatPercentChange(asset?.price?.relative_change_24h)
        : getPercentChangeForPrice(points[0].y),
    [asset, chartType, getPercentChangeForPrice, points]
  );

  const updateChartDataLabels = useCallback(
    newChartData => {
      const date = newChartData?.date || defaultDateLabel;
      const price = newChartData?.price || latestPrice;
      const change = newChartData?.price
        ? getPercentChangeForPrice(newChartData.price)
        : latestChange;

      changeDirection.setValue(getPercentChangeDirection(change));

      changeRef?.current?.setNativeProps?.({
        text: `${Math.abs(change)}%`,
      });
      dateRef?.current?.setNativeProps?.({
        text: date,
      });
      priceRef?.current?.setNativeProps?.({
        text: convertAmountToNativeDisplay(price, nativeCurrency),
      });
    },
    [
      changeDirection,
      changeRef,
      dateRef,
      defaultDateLabel,
      getPercentChangeForPrice,
      latestChange,
      latestPrice,
      nativeCurrency,
      priceRef,
    ]
  );

  // 🏃️ immediately take control of Chart Data Label elements, and
  // set them to their default values.
  useEffect(() => {
    updateChartDataLabels();
    // 💁‍♂️️ we only want to trigger this when the user has just changed timeframes
    // or the component's default values have changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultDateLabel, latestChange]);

  return {
    changeDirection,
    changeRef,
    colorForPriceChange,
    dateRef,
    latestChange,
    latestPrice,
    priceRef,
    updateChartDataLabels,
  };
}
