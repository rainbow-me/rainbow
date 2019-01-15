import React, { PureComponent } from 'react';
import { Animated, NetInfo } from 'react-native';
import styled from 'styled-components';
import { Icon } from './icons';
import { Centered } from './layout';
import { Text } from './text';
import { colors, padding } from '../styles';

const Badge = styled(Centered)`
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

const BadgeIcon = styled(Icon).attrs({
  color: colors.white,
})`
  margin-bottom: -3px;
`;

const BadgeLabel = styled(Text).attrs({
  size: 'smedium',
  weight: 'semibold',
  color: colors.white,
})`
  margin-left: 5px;
`;

class OfflineBadge extends PureComponent {
  state = {
    badgeOpacity: new Animated.Value(0),
    badgeYPosition: new Animated.Value(100),
    isConnected: true,
  };

  componentDidMount() {
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
  }

  componentWillUnmount() {
    this.state.badgeOpacity.stopAnimation();
    this.state.badgeYPosition.stopAnimation();
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  handleConnectivityChange = (isConnected) => {
    if (isConnected) this.animateBadgeOut();
    else this.animateBadgeIn();
    this.setState({ isConnected });
  };

  animateBadgeIn = () => {
    Animated.parallel([
      Animated.spring(this.state.badgeYPosition, {
        friction: 11,
        tension: 90,
        toValue: 0,
        useNativeDriver: true,
      }).start(),
      Animated.spring(this.state.badgeOpacity, {
        friction: 11,
        tension: 90,
        toValue: 1,
        useNativeDriver: true,
      }).start(),
    ]);
  };

  animateBadgeOut = () => {
    Animated.parallel([
      Animated.spring(this.state.badgeYPosition, {
        friction: 11,
        tension: 90,
        toValue: 100,
        useNativeDriver: true,
      }).start(),
      Animated.spring(this.state.badgeOpacity, {
        friction: 11,
        tension: 90,
        toValue: 0,
        useNativeDriver: true,
      }).start(),
    ]);
  };

  render = () => (
    <Badge
      component={Animated.View}
      self="center"
      style={{
        opacity: this.state.badgeOpacity,
        transform: [{ translateY: this.state.badgeYPosition }],
      }}
    >
      <BadgeIcon name="offline" />
      <BadgeLabel>Offline</BadgeLabel>
    </Badge>
  )
}

export default OfflineBadge;
