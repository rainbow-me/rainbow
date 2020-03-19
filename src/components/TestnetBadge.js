import React from 'react';
import Animated from 'react-native-reanimated';
import { bin, useSpringTransition } from 'react-native-redash';
import styled from 'styled-components';
import networkInfo from '../helpers/networkInfo';
import networkTypes from '../helpers/networkTypes';
import { colors, padding, shadow } from '../styles';
import { interpolate } from './animations';
import { Icon } from './icons';
import { Centered, RowWithMargins } from './layout';
import { Text } from './text';
import { isNewValueForObjectPaths } from '../utils';
import { Nbsp } from './html-entities';

const StyledBadge = styled(RowWithMargins).attrs({
  component: Centered,
  margin: 5,
  self: 'center',
})`
  ${padding(9, 10, 11, 10)};
  ${shadow.build(0, 6, 10, colors.dark, 0.14)}
  background: ${colors.dark};
  border-radius: 50;
  bottom: 42;
  position: absolute;
  z-index: 100;
`;

const DefaultAnimationValue = 60;

const TestnetBadge = ({ network }) => {
  const isMainnet = network === networkTypes.mainnet;

  const animation = useSpringTransition(bin(isMainnet), {
    damping: 14,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
    stiffness: 121.6,
  });

  const { name, color } = networkInfo[network];

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
        <Icon
          color={color}
          marginTop={5}
          marginLeft={5}
          marginRight={5}
          name="dot"
        />
        <Text color={colors.white} size="smedium" weight="semibold">
          <Nbsp /> {name} <Nbsp />
        </Text>
      </StyledBadge>
    </Animated.View>
  );
};

const propsAreEqual = (...props) =>
  !isNewValueForObjectPaths(...props, ['network']);

export default React.memo(TestnetBadge, propsAreEqual);
