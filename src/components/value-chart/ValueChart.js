import * as shape from 'd3-shape';
import { format } from 'date-fns';
import { maxBy, minBy } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useCallbackOne } from 'use-memo-one';
import { convertAmountToNativeDisplay } from '../../helpers/utilities';
import { Column, Row } from '../layout';
import AnimatedChartSvg, { AnimatedChartStrokeWidth } from './AnimatedChartSvg';
import ChartLoadingState from './ChartLoadingState';
import ChartScrubber from './ChartScrubber';
import GestureWrapper from './GestureWrapper';
import TimestampText from './TimestampText';
import simplifyChartData from './simplifyChartData';
import { useChartGestures, useDimensions } from '@rainbow-me/hooks';

const additionalChartPadding = 999999;
const canvasHeight = 160;
const emptyVector = { x: 0, y: 0 };

function useExtremeValuesFromPoints(points) {
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
      maxValue,
      maxValueDistance,
      minValue,
      minValueDistance,
    };
  }, [checkBoundaries, points, width]);
}

function usePathForPoints({ currentValue, points }) {
  const { width } = useDimensions();
  return useMemo(() => {
    if (!points) return null;
    let path = points;
    path[path.length - 1].y = currentValue;

    const minX = path[0].x;
    const maxX = path[path.length - 1].x;
    const minY = minBy(path, 'y').y;
    const maxY = maxBy(path, 'y').y;

    const buildLine = shape
      .line()
      .curve(shape.curveBasis)
      .x(d => (d.x - minX) / ((maxX - minX) / width))
      .y(d => (d.y - minY) / ((maxY - minY) / canvasHeight));

    return buildLine([
      {
        x: path[0].x - additionalChartPadding,
        y: path[0].y,
      },
      ...path,
      {
        x: path[path.length - 1].x + additionalChartPadding,
        y: path[path.length - 1].y,
      },
    ]);
  }, [currentValue, points, width]);
}

function usePointsFromChartData({ amountOfPathPoints, data }) {
  const simplify = useCallback(
    chartData => simplifyChartData(chartData, amountOfPathPoints),
    [amountOfPathPoints]
  );
  return useMemo(() => data.map(simplify)?.[0]?.points, [data, simplify]);
}

export default function ValueChart({
  /* amount of points that data is simplified to. */
  /* to make animation between charts possible we need to have fixed amount of points in each chart */
  /* if provided data doesn't have perfect amount of points we can simplify it to fixed value */
  amountOfPathPoints,
  chartDateRef,
  chartPriceRef,
  color,
  currentValue,
  data,
  enableSelect = true,
  isLoading,
  nativeCurrency,
}) {
  const { width } = useDimensions();

  const points = usePointsFromChartData({ amountOfPathPoints, data });
  const path = usePathForPoints({ currentValue, points });
  const [parsedPath, setParsedPath] = useState(null);
  const {
    maxValue,
    maxValueDistance,
    minValue,
    minValueDistance,
  } = useExtremeValuesFromPoints(points);

  const updateChartDataLabels = useCallbackOne(
    scrubberTextValues => {
      const date = scrubberTextValues?.date || 'Today';
      const price = scrubberTextValues?.price || currentValue;

      chartDateRef.current?.setNativeProps({
        text: date,
      });
      chartPriceRef.current?.setNativeProps({
        text: convertAmountToNativeDisplay(price, nativeCurrency),
      });
    },
    [chartDateRef, chartPriceRef, currentValue, nativeCurrency]
  );

  const {
    isScrubbing,
    panGestureHandler,
    scrubberX,
    tapGestureHandler,
  } = useChartGestures(updateChartDataLabels);

  useEffect(() => {
    // 🏃️ immediately take control of Chart Data Label elements, and
    // set them to their default values. 👌️🤠️
    updateChartDataLabels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScrub = useCallbackOne(
    ([x, y]) => {
      if (points && x && x !== width) {
        const maxDate = Date.now();
        const minDate = points[0].x * 1000;
        const multiplierX = (maxDate - minDate) / width;
        const multiplierY = (maxValue.y - minValue.y) / canvasHeight;
        const date = new Date(x * multiplierX + minDate);
        let price = -y * multiplierY + minValue.y;
        if (price > maxValue.y) {
          price = maxValue.y;
        } else if (price < minValue.y) {
          price = minValue.y;
        }
        updateChartDataLabels({
          date: format(date, 'MMM dd hh:mm aa'),
          price,
        });
      }
    },
    [updateChartDataLabels, maxValue, minValue, points, width]
  );

  const { highestPrice, lowestPrice } = useMemo(
    () => ({
      highestPrice: convertAmountToNativeDisplay(maxValue.y, nativeCurrency),
      lowestPrice: convertAmountToNativeDisplay(minValue.y, nativeCurrency),
    }),
    [maxValue, minValue, nativeCurrency]
  );

  return (
    <GestureWrapper
      enabled={enableSelect}
      panGestureHandler={panGestureHandler}
      tapGestureHandler={tapGestureHandler}
    >
      <TimestampText translateX={maxValueDistance} value={highestPrice} />
      <Column>
        <AnimatedChartSvg
          color={color}
          onParsePath={setParsedPath}
          path={path}
        />
      </Column>
      <Row height={180}>
        <ChartScrubber
          color={color}
          isScrubbing={isScrubbing}
          offsetY={canvasHeight + AnimatedChartStrokeWidth / 2}
          onScrub={handleScrub}
          parsedPath={parsedPath}
          scrubberX={scrubberX}
        />
      </Row>
      <TimestampText translateX={minValueDistance} value={lowestPrice} />
      <ChartLoadingState color={color} isVisible={!parsedPath || isLoading} />
    </GestureWrapper>
  );
}
