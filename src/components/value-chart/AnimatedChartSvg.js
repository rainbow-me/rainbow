import { interpolatePath } from 'd3-interpolate-path';
import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { parsePath } from 'react-native-redash';
import Svg, { Path } from 'react-native-svg';
import styled from 'styled-components/primitives';
import {
  useAnimatedListener,
  useDimensions,
  useTimeout,
} from '@rainbow-me/hooks';

const AnimatedChartDuration = 300;
export const AnimatedChartStrokeWidth = 3.25;

const Container = styled.View`
  position: absolute;
  top: -10;
  transform: rotateX(180deg);
`;

export default function AnimatedChartSvg({ color, onParsePath, path }) {
  const { width } = useDimensions();

  const pathRef = useRef();
  const prevPathRef = useRef();
  const shouldAnimate = useRef();

  const [
    animation,
    startAnimationListener,
    stopAnimationListener,
  ] = useAnimatedListener();

  const [startAnimatePathTimeout, stopAnimatePathTimeout] = useTimeout();
  const [startSetPathTimeout, stopSetPathTimeout] = useTimeout();

  const stopPreviousAnimations = useCallback(() => {
    stopAnimatePathTimeout();
    stopAnimationListener();
    stopSetPathTimeout();
  }, [stopAnimatePathTimeout, stopAnimationListener, stopSetPathTimeout]);

  const handleAnimation = useCallback(
    parsedPath => {
      Animated.timing(animation, {
        duration: AnimatedChartDuration,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        toValue: shouldAnimate.current ? 0 : 1,
      }).start(() => {
        shouldAnimate.current = !shouldAnimate.current;
        onParsePath?.(parsedPath);
      });
    },
    [animation, onParsePath]
  );

  useEffect(() => {
    if (path) {
      let a, b;
      if (prevPathRef.current !== path) {
        if (prevPathRef.current) {
          if (shouldAnimate.current) {
            a = path;
            b = prevPathRef.current;
          } else {
            a = prevPathRef.current;
            b = path;
          }
        } else {
          a = path;
          b = path;
        }
      }

      prevPathRef.current = path;
      const pathInterpolate = interpolatePath(a, b);
      const parsedPath = parsePath(path);

      stopPreviousAnimations();
      startAnimationListener(({ value }) => {
        pathRef.current?.setNativeProps({
          d: pathInterpolate(value),
        });
      });

      startAnimatePathTimeout(() => {
        handleAnimation(parsedPath);
        startSetPathTimeout(() => {
          pathRef.current?.setNativeProps({
            d: pathInterpolate(shouldAnimate.current ? 1 : 0),
          });
        }, AnimatedChartDuration + 100);
      }, 200);
    }
  }, [
    handleAnimation,
    path,
    startAnimatePathTimeout,
    startAnimationListener,
    startSetPathTimeout,
    stopPreviousAnimations,
  ]);

  return (
    <Container>
      <Svg height={200} viewBox={`0 -20 ${width} 200`} width={width}>
        <Path
          ref={pathRef}
          stroke={color}
          strokeWidth={AnimatedChartStrokeWidth}
        />
      </Svg>
    </Container>
  );
}
