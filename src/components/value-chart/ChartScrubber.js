import React from 'react';
import Animated, { Easing, Value } from 'react-native-reanimated';
import { getPointAtLength, withTimingTransition } from 'react-native-redash';
import styled from 'styled-components/primitives';
import { useCallbackOne, useMemoOne } from 'use-memo-one';
import { interpolate as interpolateProc } from '../animations';
import { useDimensions } from '@rainbow-me/hooks';
import { borders, colors, position, shadow } from '@rainbow-me/styles';

const {
  call,
  Extrapolate,
  interpolate,
  multiply,
  onChange,
  sub,
  useCode,
} = Animated;

export const ChartScrubberSize = 16;

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
  panGesturePosition,
  parsedPath,
}) {
  const { width } = useDimensions();

  const opacity = withTimingTransition(isScrubbing, {
    duration: 150,
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  });

  const { translateX, translateY } = useMemoOne(() => {
    let scrubberPosition = {
      x: new Value(width),
      y: new Value(0),
    };

    if (parsedPath) {
      const magneticPadding = 50;
      const magneticPanGesturePosition = interpolateProc(panGesturePosition.x, {
        extrapolate: Extrapolate.CLAMP,
        inputRange: [
          magneticPadding / 2,
          magneticPadding,
          width - magneticPadding,
          width - magneticPadding / 2,
        ],
        outputRange: [0, magneticPadding, width - magneticPadding, width],
      });

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
  }, [parsedPath, panGesturePosition.x, width]);

  useCode(
    useCallbackOne(
      () =>
        onChange(
          panGesturePosition.x,
          call([panGesturePosition.x, translateY], onScrub)
        ),
      [onScrub, translateY, panGesturePosition.x]
    )
  );

  const scrubberStyle = useMemoOne(
    () => ({
      opacity,
      transform: [{ translateX }, { translateY }],
    }),
    [opacity, translateX, translateY]
  );

  return (
    <Scrubber color={color} offsetY={offsetY} style={scrubberStyle}>
      <CenterDot />
    </Scrubber>
  );
}
