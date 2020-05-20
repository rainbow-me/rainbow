import PropTypes from 'prop-types';
import React from 'react';
import Animated from 'react-native-reanimated';
import { bin, useSpringTransition } from 'react-native-redash';
import styled from 'styled-components';
import { colors, padding, shadow } from '../../styles';
import { interpolate } from '../animations';
import { Icon } from '../icons';
import { Centered, RowWithMargins } from '../layout';
import { Text } from '../text';

const Content = styled(RowWithMargins).attrs({
  component: Centered,
  margin: 5,
  self: 'center',
})`
  ${padding(10)};
  ${shadow.build(0, 6, 10, colors.dark, 0.14)}
  border-radius: 50;
  bottom: 40;
  position: absolute;
  z-index: 100;
`;

const springConfig = {
  damping: 14,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.001,
  restSpeedThreshold: 0.001,
  stiffness: 121.6,
};

const Toast = ({ color, distance, icon, isVisible, text, textColor }) => {
  const animation = useSpringTransition(bin(isVisible), springConfig);

  const opacity = interpolate(animation, {
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const translateY = interpolate(animation, {
    inputRange: [0, 1],
    outputRange: [0, distance],
  });

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Content backgroundColor={color} shouldRasterizeIOS>
        {icon && <Icon color={textColor} marginTop={3} name={icon} />}
        <Text color={textColor} size="smedium" weight="semibold">
          {text}
        </Text>
      </Content>
    </Animated.View>
  );
};

Toast.propTypes = {
  color: PropTypes.string,
  distance: PropTypes.number,
  icon: PropTypes.string,
  isVisible: PropTypes.bool,
  text: PropTypes.string.isRequired,
  textColor: PropTypes.string,
};

Toast.defaultProps = {
  color: colors.dark,
  distance: 60,
  textColor: colors.white,
};

export default React.memo(Toast);
