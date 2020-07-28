import React from 'react';
import Animated, { Easing, Value } from 'react-native-reanimated';
import { getPointAtLength, withTimingTransition } from 'react-native-redash';
import styled from 'styled-components/primitives';
import { useCallbackOne, useMemoOne } from 'use-memo-one';
import { useDimensions } from '@rainbow-me/hooks';
import { borders, colors, position, shadow } from '@rainbow-me/styles';

const {
  call,
  cond,
  Extrapolate,
  interpolate,
  multiply,
  onChange,
  sub,
  useCode,
} = Animated;

export const ChartScrubberSize = 16;
const magneticPadding = 50;

const CenterDot = styled.View`
  ${borders.buildCircle(6)};
  background-color: ${colors.white};
`;

const Scrubber = styled(Animated.View)`
  ${borders.buildCircle(ChartScrubberSize)};
  ${position.centered};
  ${shadow.build(0, 3, 9, colors.dark, 0.2)};
  background-color: ${({ color }) => color};
  margin-top: ${({ offsetY }) => offsetY};
  position: absolute;
  z-index: 10;
`;

export default function ChartScrubber({
  color,
  isScrubbing,
  offsetY,
  onScrub,
  parsedPath,
  scrubberX,
}) {
  const { width } = useDimensions();

  const opacity = withTimingTransition(isScrubbing, {
    duration: 150,
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  });

  const magneticPanGesturePosition = useMemoOne(
    () =>
      interpolate(scrubberX, {
        extrapolate: Extrapolate.CLAMP,
        inputRange: [
          magneticPadding / 2,
          magneticPadding,
          width - magneticPadding,
          width - magneticPadding / 2,
        ],
        outputRange: [0, magneticPadding, width - magneticPadding, width],
      }),
    [scrubberX, width]
  );

  const { translateX, translateY } = useMemoOne(() => {
    let scrubberPosition = {
      x: new Value(width),
      y: new Value(0),
    };

    if (parsedPath) {
      // this is what ties the Scrubbers position to the chart's path
      scrubberPosition = getPointAtLength(
        parsedPath,
        interpolate(magneticPanGesturePosition, {
          extrapolate: Extrapolate.CLAMP,
          inputRange: parsedPath.p0x,
          outputRange: parsedPath.start,
        })
      );
    }

    return {
      translateX: sub(scrubberPosition.x, ChartScrubberSize / 2),
      translateY: multiply(scrubberPosition.y, -1),
    };
  }, [magneticPanGesturePosition, parsedPath, width]);

  useCode(
    useCallbackOne(
      () =>
        onChange(
          translateX,
          cond(isScrubbing, call([translateX, translateY], onScrub))
        ),
      [isScrubbing, onScrub, translateX, translateY]
    )
  );

  const scrubberStyle = useMemoOne(
    () => ({
      opacity,
      transform: [
        { translateX, translateY },
        {
          scale: interpolate(opacity, {
            extrapolate: Extrapolate.EXTEND,
            inputRange: [0, 1],
            outputRange: [2, 1],
          }),
        },
      ],
    }),
    [opacity, translateX, translateY]
  );

  return (
    <Scrubber color={color} offsetY={offsetY} style={scrubberStyle}>
      <CenterDot />
    </Scrubber>
  );
}
