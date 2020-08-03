import { format } from 'date-fns';
import React, { useState } from 'react';
import { useCallbackOne } from 'use-memo-one';
import { Column, Row } from '../layout';
import AnimatedChartSvg, { AnimatedChartStrokeWidth } from './AnimatedChartSvg';
import ChartLoadingState from './ChartLoadingState';
import ChartScrubber from './ChartScrubber';
import GestureWrapper from './GestureWrapper';
import TimestampText from './TimestampText';
import {
  useDimensions,
  useExtremeValuesFromPoints,
  usePathForPoints,
} from '@rainbow-me/hooks';

const canvasHeight = 160;

export default function ValueChart({
  color,
  enableSelect = true,
  isLoading,
  isScrubbing,
  latestChange,
  latestPrice,
  panGestureHandler,
  points,
  scrubberX,
  tapGestureHandler,
  updateChartDataLabels,
}) {
  const { width } = useDimensions();
  const [parsedPath, setParsedPath] = useState(null);
  const path = usePathForPoints({ canvasHeight, latestPrice, points });
  const {
    highestPrice,
    lowestPrice,
    maxValue,
    maxValueDistance,
    minValue,
    minValueDistance,
  } = useExtremeValuesFromPoints(points);

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
    [latestChange, maxValue, minValue, points, updateChartDataLabels, width]
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
