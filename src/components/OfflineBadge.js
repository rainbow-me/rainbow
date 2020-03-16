import React from 'react';
import Animated from 'react-native-reanimated';
import { bin, useSpringTransition } from 'react-native-redash';
import styled from 'styled-components';
import { useInternetStatus } from '../hooks';
import { colors, padding, shadow } from '../styles';
import { interpolate } from './animations';
import { Icon } from './icons';
import { Centered, RowWithMargins } from './layout';
import { Text } from './text';

const StyledBadge = styled(RowWithMargins).attrs({
  component: Centered,
  margin: 5,
  self: 'center',
})`
  ${padding(10)};
  ${shadow.build(0, 6, 10, colors.dark, 0.14)}
  background: ${colors.dark};
  border-radius: 50;
  bottom: 42;
  position: absolute;
  z-index: 100;
`;

const DefaultAnimationValue = 60;

const OfflineBadge = () => {
  const isConnected = useInternetStatus();

  const animation = useSpringTransition(bin(isConnected), {
    damping: 14,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
    stiffness: 121.6,
  });

  return (
    <Animated.View
      style={{
        opacity: interpolate(animation, {
          inputRange: [0, 1],
          outputRange: [1, 0],
        }),
        transform: [
          {
            translateY: interpolate(animation, {
              inputRange: [0, 1],
              outputRange: [0, DefaultAnimationValue],
            }),
          },
        ],
      }}
    >
      <StyledBadge shouldRasterizeIOS>
        <Icon color={colors.white} marginTop={3} name="offline" />
        <Text color={colors.white} size="smedium" weight="semibold">
          Offline
        </Text>
      </StyledBadge>
    </Animated.View>
  );
};

const neverRerender = () => true;
export default React.memo(OfflineBadge, neverRerender);
