import React, { useLayoutEffect, useState } from 'react';
import Animated, { interpolate, SpringUtils, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { magicMemo } from '../../utils';
import { Centered } from '../layout';
import { Text } from '../text';
import { useTimeout } from '@/hooks';
import styled from '@/styled-thing';
import { borders, position } from '@/styles';

const Container = styled(Animated.View)({
  ...position.centeredAsObject,
  height: ({ size }) => size,
  position: 'absolute',
  right: ({ offset }) => offset * -1,
  top: ({ offset }) => offset * -1,
  zIndex: 1,
});

const Circle = styled(Centered)(({ offset, size, valueLength, theme: { colors } }) => ({
  backgroundColor: colors.appleBlue,
  borderRadius: 15,
  paddingBottom: 3,
  paddingTop: 2,
  ...(valueLength === 1
    ? {
        ...borders.buildCircleAsObject(size),
        paddingLeft: 1,
      }
    : {
        paddingLeft: 5.5,
        paddingRight: 5.5,
        transform: [{ translateX: Math.floor(offset / 2) }],
      }),
}));

const NumberText = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.whiteLabel,
  size: 'smaller',
  weight: 'bold',
}))(android ? { lineHeight: 17 } : {});

const BadgeSpringConfig = SpringUtils.makeConfigFromOrigamiTensionAndFriction({
  ...SpringUtils.makeDefaultConfig(),
  friction: 13,
  tension: 145,
});

const Badge = ({ delay = 1500, isVisible, maxLength = 2, offset = 7, size = 19, value, ...props }) => {
  const [delayedIsVisible, setDelayedIsVisible] = useState(isVisible);
  const [startDelayTimeout] = useTimeout();

  startDelayTimeout(() => setDelayedIsVisible(isVisible), delay);

  const animation = useSharedValue(delayedIsVisible ? 1 : 0);

  useLayoutEffect(() => {
    animation.value = withSpring(delayedIsVisible ? 1 : 0, BadgeSpringConfig);
  }, [delayedIsVisible, animation]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(animation.value, [0, 1], [1, 0], 'extend');

    return {
      transform: [{ scale: animation.value }, { translateY }],
    };
  });

  const valueLength = value.toString().length;

  return (
    <Container {...props} offset={offset} size={size} style={animatedStyle}>
      <Circle offset={offset} size={size} valueLength={valueLength}>
        <NumberText>{valueLength > maxLength ? `${'9'.repeat(maxLength)}+` : value}</NumberText>
      </Circle>
    </Container>
  );
};

export default magicMemo(Badge, ['isVisible', 'value']);
