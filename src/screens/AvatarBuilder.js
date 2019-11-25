import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import Animated, { Easing } from 'react-native-reanimated';
import { withNavigation } from 'react-navigation';
import { compose, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../components/animations';
import EmojiSelector from '../components/EmojiSelector';
import { Column, Row } from '../components/layout';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { colors } from '../styles';
import { deviceUtils } from '../utils';

const {
  block,
  Clock,
  clockRunning,
  cond,
  proc,
  set,
  spring,
  startClock,
  stopClock,
  Value,
} = Animated;

const betterSpring = proc(
  (
    finished,
    velocity,
    position,
    time,
    prevPosition,
    toValue,
    damping,
    mass,
    stiffness,
    overshootClamping,
    restSpeedThreshold,
    restDisplacementThreshold,
    clock
  ) =>
    spring(
      clock,
      {
        finished,
        position,
        prevPosition,
        time,
        velocity,
      },
      {
        damping,
        mass,
        overshootClamping,
        restDisplacementThreshold,
        restSpeedThreshold,
        stiffness,
        toValue,
      }
    )
);

function springFill(clock, state, config) {
  return betterSpring(
    state.finished,
    state.velocity,
    state.position,
    state.time,
    new Value(0),
    config.toValue,
    config.damping,
    config.mass,
    config.stiffness,
    config.overshootClamping,
    config.restSpeedThreshold,
    config.restDisplacementThreshold,
    clock
  );
}

function runSpring(clock, value, dest) {
  const state = {
    finished: new Value(0),
    position: new Value(0),
    time: new Value(0),
    velocity: new Value(0),
  };

  const config = {
    damping: 46,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.001,
    restSpeedThreshold: 0.001,
    stiffness: 800,
    toValue: new Value(0),
  };

  return block([
    cond(clockRunning(clock), 0, [
      set(state.finished, 0),
      set(state.time, 0),
      set(state.position, value),
      set(state.velocity, 0),
      set(config.toValue, dest),
      startClock(clock),
    ]),
    springFill(clock, state, config),
    cond(state.finished, stopClock(clock)),
    set(value, state.position),
  ]);
}

const statusBarHeight = getStatusBarHeight(true);

const Container = styled(Column)`
  background-color: ${colors.transparent};
`;

const SheetContainer = styled(Column)`
  border-radius: 20px;
  background-color: ${colors.white};
  height: 420px;
  overflow: hidden;
  width: 100%;
`;

class AvatarBuilder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      avatarColor: '#FFD963',
      emoji: '🙃',
      position: new Value(),
      springAnim: runSpring(new Clock(), 0, 0),
    };
  }

  render() {
    const ColorCircle = ({ backgroundColor, colorIndex, isSelected }) => (
      <View align="center" height={42} justify="center" width={39}>
        <ButtonPressAnimation
          alignSelf="center"
          duration={100}
          easing={Easing.bezier(0.19, 1, 0.22, 1)}
          enableHapticFeedback
          height={42}
          justifyContent="center"
          onPress={() => {
            let destination = colorIndex * 39;
            this.setState({
              avatarColor: backgroundColor,
              springAnim: runSpring(
                new Clock(),
                this.state.position,
                destination
              ),
            });
          }}
          scaleTo={0.7}
          width={39}
        >
          <View
            backgroundColor={backgroundColor}
            borderRadius={15}
            height={24}
            alignSelf="center"
            isSelected={isSelected}
            shadowColor={colors.black}
            shadowOffset={{ height: 4, width: 0 }}
            shadowOpacity={0.2}
            shadowRadius={5}
            width={24}
          />
        </ButtonPressAnimation>
      </View>
    );

    ColorCircle.propTypes = {
      backgroundColor: PropTypes.string,
      colorIndex: PropTypes.number,
      isSelected: PropTypes.bool,
    };

    ColorCircle.defaultProps = {
      backgroundColor: 'blue',
      isSelected: false,
    };

    const colorCircleTopPadding = 8;

    return (
      <Container {...deviceUtils.dimensions}>
        <TouchableBackdrop onPress={this.props.onPressBackground} />

        <Column
          align="center"
          pointerEvents="box-none"
          top={statusBarHeight + 46}
        >
          <View
            backgroundColor={this.state.avatarColor}
            borderRadius={32.5}
            height={65}
            marginBottom={5}
            shadowColor={colors.black}
            shadowOffset={{ height: 4, width: 0 }}
            shadowOpacity={0.2}
            shadowRadius={5}
            width={65}
          >
            <Text
              style={{
                fontSize: 38,
                height: 65,
                lineHeight: 65,
                textAlign: 'center',
                width: 65,
              }}
            >
              {this.state.emoji}
            </Text>
          </View>

          <Row
            justify="center"
            maxWidth={375}
            paddingBottom={17}
            paddingTop={colorCircleTopPadding}
            width="100%"
          >
            <Animated.View
              alignSelf="center"
              marginTop={2}
              borderColor={this.state.avatarColor}
              borderRadius={19}
              borderWidth={3}
              height={38}
              position="absolute"
              style={{
                transform: [{ translateX: this.state.springAnim }],
              }}
              top={colorCircleTopPadding}
              width={38}
            />
            <ColorCircle backgroundColor="#FF494A" colorIndex={-4} />
            <ColorCircle backgroundColor="#01D3FF" colorIndex={-3} />
            <ColorCircle backgroundColor="#FB60C4" colorIndex={-2} />
            <ColorCircle backgroundColor="#3F6AFF" colorIndex={-1} />
            <ColorCircle backgroundColor="#FFD963" colorIndex={0} isSelected />
            <ColorCircle backgroundColor="#B140FF" colorIndex={1} />
            <ColorCircle backgroundColor="#41EBC1" colorIndex={2} />
            <ColorCircle backgroundColor="#F46E38" colorIndex={3} />
            <ColorCircle backgroundColor="#6D7E8F" colorIndex={4} />
          </Row>

          <SheetContainer>
            <EmojiSelector
              columns={7}
              onEmojiSelected={emoji => this.setState({ emoji: emoji })}
              showHistory={false}
              showSearchBar={false}
            />
          </SheetContainer>
        </Column>
      </Container>
    );
  }
}

export default compose(
  withHandlers({
    onPressBackground: ({ navigation }) => () => navigation.goBack(),
  }),
  withNavigation
)(AvatarBuilder);
