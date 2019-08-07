import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { View, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated';
import { colors, fonts } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { deviceUtils } from '../../utils';
import { Monospace } from '../text';
import Highlight from '../Highlight';
import RotationArrow from '../animations/RotationArrow';
import Caret from '../../assets/show-all-arrow.png';
import OpacityToggler from '../animations/OpacityToggler';
import RoundButtonSizeToggler from '../animations/RoundButtonSizeToggler';

const {
  block,
  Clock,
  clockRunning,
  cond,
  interpolate,
  set,
  startClock,
  spring,
  Value,
  SpringUtils,
} = Animated;

function runTiming(clock, value, dest, isOpen) {
  const state = {
    finished: new Value(1),
    position: new Value(value),
    time: new Value(0),
    velocity: new Value(0),
  };

  const config = Animated.SpringUtils.makeConfigFromOrigamiTensionAndFriction({
    ...SpringUtils.makeDefaultConfig(),
    friction: 20,
    tension: 200,
  });

  const reset = [
    set(state.finished, 0),
    set(state.time, 0),
    set(state.velocity, 0),
  ];

  return block([
    cond(state.finished, [
      ...reset,
      set(config.toValue, dest),
    ]),
    cond(clockRunning(clock), 0, startClock(clock)),
    spring(clock, state, config),
    state.position,
  ]);
}

const marginLeft = 19;
const marginRight = 19;
const Wrapper = styled(View)`
  margin: 8px 0 0 0;
  padding-right: ${marginRight}px;
  padding-left: ${marginLeft}px;
  width: ${deviceUtils.dimensions.width};
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  height: 30px;
`;

const Container = styled(View)`
  height: 30px;
  border-radius: 15px;
  align-items: center;
  padding: 0 10px;
  flex-direction: row;
  justify-content: space-between;
  min-width: 41.5px;
`;

const BackgroundColor = styled(View)`
  height: 30px;
`;

const Header = styled(Text)`
  color: ${colors.blueGreyDark};
  font-family: ${fonts.family.SFProText};
  font-size: ${fonts.size.lmedium};
  font-weight: ${fonts.weight.semibold};
  letter-spacing: ${fonts.letterSpacing.tighter};
  top: -10.25px;
  opacity: 0.6;
  position: absolute;
`;

const SettingIconWrap = styled(View)`
  opacity: 0.6;
  padding-bottom: 1px;
`;

const SettingIcon = styled(FastImage)`
  height: 17px;
  width: 9px;
`;

class CoinDivider extends React.Component {
  componentWillMount() {
    this._initialState = this.props.openSmallBalances;
  }

  componentWillUpdate(prev) {
    if (prev.openSmallBalances !== undefined
        && prev.openSmallBalances !== this.props.openSmallBalances) {
      const clock = new Clock();
      const base = this.props.openSmallBalances ? runTiming(clock, -1, 1, this.props.openSmallBalances) : runTiming(clock, 1, -1, this.props.openSmallBalances);
      this._node = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [1, 0],
      });
    }
  }

  render() {
    const {
      openSmallBalances,
      onChangeOpenBalances,
      balancesSum,
      isCoinDivider,
    } = this.props;

    return (
      <Wrapper>
        <Highlight highlight={isCoinDivider} />
        <ButtonPressAnimation scaleTo={0.8} onPress={onChangeOpenBalances}>
          <RoundButtonSizeToggler isAbsolute reversed={!this._initialState} toggle={openSmallBalances} startingWidth={5} endingWidth={30} animationNode={this._node}>
            <BackgroundColor />
          </RoundButtonSizeToggler>
          <Container>
            <View>
              <OpacityToggler isVisible={openSmallBalances} startingOpacity={1} endingOpacity={0} animationNode={this._node}>
                <Header >
                  All
                </Header>
              </OpacityToggler>
              <OpacityToggler isVisible={openSmallBalances} startingOpacity={0} endingOpacity={1} animationNode={this._node}>
                <Header >
                  Less
                </Header>
              </OpacityToggler>
            </View>
            <SettingIconWrap>
              <RotationArrow isOpen={openSmallBalances} endingPosition={-90} endingOffset={20}>
                <SettingIcon source={Caret} />
              </RotationArrow>
            </SettingIconWrap>
          </Container>
        </ButtonPressAnimation>
        <OpacityToggler isVisible={openSmallBalances} animationNode={this._node}>
          <Monospace
            color="dark"
            size="lmedium"
            style={{ paddingBottom: 1 }}
          >
            {balancesSum}
          </Monospace>
        </OpacityToggler>
      </Wrapper>
    );
  }
}

CoinDivider.propTypes = {
  balancesSum: PropTypes.string,
  isCoinDivider: PropTypes.bool,
  onChangeOpenBalances: PropTypes.func,
  openSmallBalances: PropTypes.bool,
};

CoinDivider.height = 30;


export default CoinDivider;
