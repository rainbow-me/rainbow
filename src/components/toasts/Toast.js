import React, { Fragment } from 'react';
import Animated from 'react-native-reanimated';
import { bin, useSpringTransition } from 'react-native-redash';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import { colors, padding, shadow } from '../../styles';
import { interpolate } from '../animations';
import { Icon } from '../icons';
import { Centered, RowWithMargins } from '../layout';
import { Text } from '../text';

const springConfig = {
  damping: 14,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 121.6,
};

const Toast = styled(RowWithMargins).attrs({
  component: Centered,
  margin: 5,
  self: 'center',
})`
  ${padding(9, 10, 11, 10)};
  ${shadow.build(0, 6, 10, colors.dark, 0.14)};
  background-color: ${({ color }) => color};
  border-radius: 20;
  bottom: ${({ insets }) => (insets.bottom || 40) + 3};
  position: absolute;
  z-index: 100;
`;

export default function({
  children,
  color = colors.dark,
  distance = 60,
  icon,
  isVisible,
  text,
  textColor = colors.white,
}) {
  const insets = useSafeArea();

  const animation = useSpringTransition(bin(isVisible), springConfig);

  const opacity = interpolate(animation, {
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const translateY = interpolate(animation, {
    inputRange: [0, 1],
    outputRange: [distance, 0],
  });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Toast color={color} insets={insets}>
        {children || (
          <Fragment>
            {icon && <Icon color={textColor} marginTop={3} name={icon} />}
            <Text color={textColor} size="smedium" weight="semibold">
              {text}
            </Text>
          </Fragment>
        )}
      </Toast>
    </Animated.View>
  );
}
