import React, { PureComponent } from 'react';
import { Animated, NetInfo } from 'react-native';
import styled from 'styled-components';

import Icon from './icons/Icon';
import { Text } from './text';
import { colors, padding } from '../styles';

const Badge = styled(Animated.View)`
  position: absolute;
  align-self: center;
  bottom: 40;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  ${padding(10)};
  background: ${colors.dark};
  border-radius: 50;
  shadow-color: ${colors.dark};
  shadow-opacity: 0.14;
  shadow-offset: 0px 6px;
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
    isConnected: true,
    badgeYPosition: new Animated.Value(100),
    badgeOpacity: new Animated.Value(0),
  };

  componentDidMount() {
    NetInfo.isConnected.addEventListener(
      'connectionChange',
      this.handleConnectivityChange
    );
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener(
      'connectionChange',
      this.handleConnectivityChange
    );
  }

  handleConnectivityChange = isConnected => {
    if (isConnected) {
      this.animateBadgeOut();
    } else {
      this.animateBadgeIn();
    }
    this.setState({ isConnected });
  };

  animateBadgeIn = () => {
    Animated.parallel([
      Animated.spring(this.state.badgeYPosition, {
        toValue: 0,
        tension: 90,
        friction: 11,
        useNativeDriver: true,
      }).start(),
      Animated.spring(this.state.badgeOpacity, {
        toValue: 1,
        tension: 90,
        friction: 11,
        useNativeDriver: true,
      }).start(),
    ]);
  };

  animateBadgeOut = () => {
    Animated.parallel([
      Animated.spring(this.state.badgeYPosition, {
        toValue: 100,
        tension: 90,
        friction: 11,
        useNativeDriver: true,
      }).start(),
      Animated.spring(this.state.badgeOpacity, {
        toValue: 0,
        tension: 90,
        friction: 11,
        useNativeDriver: true,
      }).start(),
    ]);
  };

  render() {
    return (
      <Badge
        style={{
          opacity: this.state.badgeOpacity,
          transform: [{ translateY: this.state.badgeYPosition }],
        }}
      >
        <BadgeIcon name="offline" />
        <BadgeLabel>Offline</BadgeLabel>
      </Badge>
    );
  }
}

export default OfflineBadge;
