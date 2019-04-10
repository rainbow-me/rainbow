import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Animated from 'react-native-reanimated';
import { compose, onlyUpdateForKeys } from 'recompact';
import styled from 'styled-components';
import { withNetInfo } from '../hoc';
import { colors, padding } from '../styles';
import { Icon } from './icons';
import { RowWithMargins } from './layout';
import { Text } from './text';

const {
  interpolate,
  spring,
  Value,
  View,
} = Animated;

const Badge = styled(RowWithMargins).attrs({
  align: 'center',
  component: View,
  justify: 'center',
  margin: 5,
  self: 'center',
})`
  ${padding(10)};
  background: ${colors.dark};
  border-radius: 50;
  bottom: 40;
  position: absolute;
  shadow-color: ${colors.dark};
  shadow-offset: 0px 6px;
  shadow-opacity: 0.14;
  shadow-radius: 10;
  z-index: 100;
`;

const DefaultAnimationValue = 60;

class OfflineBadge extends PureComponent {
  static propTypes = {
    isConnected: PropTypes.bool,
  }

  static defaultProps = {
    isConnected: true,
  }

  animation = new Value(DefaultAnimationValue)

  componentDidMount = () => this.runAnimation()

  componentDidUpdate = () => this.runAnimation()

  buildAnimation = toValue => {
    spring(this.animation, {
      damping: 14,
      mass: 1,
      overshootClamping: false,
      restDisplacementThreshold: 0.001,
      restSpeedThreshold: 0.001,
      stiffness: 121.6,
      toValue,
    }).start();
  }

  runAnimation = () => this.buildAnimation(this.props.isConnected ? DefaultAnimationValue : 0)

  render = () => (
    <Badge
      shouldRasterizeIOS
      style={{
        opacity: interpolate(this.animation, {
          inputRange: [0, DefaultAnimationValue],
          outputRange: [1, 0],
        }),
        transform: [{ translateY: this.animation }],
      }}
    >
      <Icon
        color={colors.white}
        name="offline"
        style={{ marginBottom: -3 }}
      />
      <Text color={colors.white} size="smedium" weight="semibold">
        Offline
      </Text>
    </Badge>
  )
}

export default compose(
  withNetInfo,
  onlyUpdateForKeys(['isConnected']),
)(OfflineBadge);
