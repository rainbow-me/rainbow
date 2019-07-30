import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import Animated, { Easing } from 'react-native-reanimated';
import { colors, padding, position } from '../../styles';
import { Icon } from '../icons';
import {
  Centered,
  Column,
  Row,
  RowWithMargins,
} from '../layout';
import { Emoji, Monospace, Text } from '../text';

const HeaderHeight = 48;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(0, 15)};
  height: ${HeaderHeight};
`;

const {
  block,
  Clock,
  clockRunning,
  concat,
  cond,
  interpolate,
  set,
  startClock,
  timing,
  Value,
} = Animated;

function runTiming(clock, value, dest, isOpen) {
  const state = {
    finished: new Value(1),
    frameTime: new Value(0),
    position: new Value(value),
    time: new Value(0),
  };

  const config = {
    duration: 200,
    easing: Easing.inOut(Easing.ease),
    toValue: new Value(0),
  };

  const reset = [
    set(state.finished, 0),
    set(state.time, 0),
    set(state.frameTime, 0),
  ];

  return block([
    cond(state.finished, [
      ...reset,
      set(config.toValue, dest),
    ]),
    cond(clockRunning(clock), 0, startClock(clock)),
    timing(clock, state, config),
    state.position,
  ]);
}

class InvestmentCardHeader extends React.Component {
  componentWillUpdate(prev) {
    if (prev.collapsed !== undefined
      && prev.collapsed !== this.props.collapsed) {
      const clock = new Clock();
      const base = this.props.collapsed ? runTiming(clock, -1, 1, this.props.collapsed) : runTiming(clock, 1, -1, this.props.collapsed);
      this._rotation = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [0, 90],
      });
    }
  }

  render() {
    const {
      collapsed,
      color,
      emoji,
      isCollapsible,
      title,
      titleColor,
      value,
    } = this.props;

    return (
      <Container>
        <Row align="center">
          <Column
            align="start"
            justify="center"
            width={24}
          >
            <Emoji
              name={emoji}
              lineHeight="none"
              size="smedium"
            />
          </Column>
          <Text
            color={titleColor || color}
            letterSpacing="tight"
            size="lmedium"
            weight="medium"
          >
            {title}
          </Text>
        </Row>
        <RowWithMargins align="center" margin={1}>
          <Monospace
            color={color}
            size="lmedium"
            weight="medium"
          >
            {value}
          </Monospace>
          {isCollapsible && (
            <Centered justify="end" style={position.sizeAsObject(19)}>
              <Centered
                flex={0}
                justify="end"
                style={{
                  ...position.sizeAsObject(13),
                  paddingBottom: collapsed ? 1 : 0,
                  paddingTop: collapsed ? 0 : 2,
                  position: 'absolute',
                  right: 0,
                }}
              >
                <Animated.View
                  style={{ transform: [{ rotate: this._rotation ? concat(this._rotation, 'deg') : '90deg' }] }}
                >
                  <Icon
                    color={color}
                    name="caretThin"
                    width={13}
                  />
                </Animated.View>
              </Centered>
            </Centered>
          )}
        </RowWithMargins>
      </Container>
    );
  }
}

InvestmentCardHeader.propTypes = {
  collapsed: PropTypes.bool,
  color: PropTypes.string,
  emoji: PropTypes.string,
  isCollapsible: PropTypes.bool,
  title: PropTypes.string,
  titleColor: PropTypes.string,
  value: PropTypes.string,
};

InvestmentCardHeader.defaultProps = {
  color: colors.dark,
  isCollapsible: false,
};

InvestmentCardHeader.height = HeaderHeight;

export default InvestmentCardHeader;
