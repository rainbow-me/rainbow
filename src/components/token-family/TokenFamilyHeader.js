import PropTypes from 'prop-types';
import React from 'react';
import FastImage from 'react-native-fast-image';
import Animated, { Easing } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import Caret from '../../assets/family-dropdown-arrow.png';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import Highlight from '../Highlight';
import { ShadowStack } from '../shadow-stack';
import { TruncatedText, Monospace } from '../text';

const Wrapper = styled.View`
  height: 56px;
  width: 100%; padding: 11px 19px;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
`;

const Image = styled.View`
  height: 34px;
  width: 34px;
  background-color: #ffd9fe;
  justify-content: center;
  border-radius: 10.3px;
`;

const FamilyImage = styled(FastImage)`
  height: 34px;
  width: 34px;
  border-radius: 10.3px;
`;

const LeftView = styled.View`
  align-items: center;
  flex-direction: row;
`;

const ArrowWrap = styled.View`
  padding-left: 9px;
  transform: scale(0.8);
`;

const SettingIcon = styled(FastImage)`
height: 20px;
width: 9px;
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

class TokenListHeader extends React.Component {
  componentWillUpdate(prev) {
    if (prev.isOpen !== undefined
        && prev.isOpen !== this.props.isOpen) {
      console.log(this.props.isOpen);
      const clock = new Clock();
      let base = undefined;
      this.props.isOpen ? base = runTiming(clock, -1, 1, this.props.isOpen) : base = runTiming(clock, 1, -1, this.props.isOpen);
      this._transX = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [90, 0],
      });
    }
  }

  render() {
    return (
      <ButtonPressAnimation
        scaleTo={0.96}
        onPress={() => {
          this.props.onHeaderPress();
        }}
      >
        <Wrapper>
          <Highlight highlight={this.props.highlight} />
          <LeftView>
            <ShadowStack
              borderRadius={17}
              height={34}
              width={34}
              shadows={[
                [0, 4, 6, colors.dark, 0.04],
                [0, 1, 3, colors.dark, 0.08],
              ]}
              shouldRasterizeIOS
            >
              {(this.props.familyImage) ? (
                <FamilyImage
                  id={this.props.familyImage}
                  source={{ uri: this.props.familyImage }}
                />
              ) : (
                <Image>
                </Image>
              )}
            </ShadowStack>
            <TruncatedText
              style={{ paddingLeft: 9 }}
              lineHeight="normal"
              size="medium"
              weight="semibold"
            >
              {this.props.familyName}
            </TruncatedText>
            <ArrowWrap>
              <Animated.View
                style={{ transform: [{ rotate: this._transX ? concat(this._transX, 'deg') : '0deg' }] }}
              >
                <SettingIcon source={Caret} />
              </Animated.View>
            </ArrowWrap>
          </LeftView>
          {!this.props.isOpen &&
            <Monospace
              color="blueGreyDark"
              size="lmedium"
            >
              {this.props.childrenAmount}
            </Monospace>
          }
        </Wrapper>
      </ButtonPressAnimation>
    );
  }
}

TokenListHeader.propTypes = {
  childrenAmount: PropTypes.number,
  familyImage: PropTypes.string,
  familyName: PropTypes.string,
  highlight: PropTypes.string,
  isOpen: PropTypes.bool,
  onHeaderPress: PropTypes.func,
};

export default TokenListHeader;
