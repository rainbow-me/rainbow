import { isNil } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated';
import Caret from '../../assets/show-all-arrow.png';
import { deviceUtils } from '../../utils';
import {
  ButtonPressAnimation,
  interpolate,
  OpacityToggler,
  RotationArrow,
  RoundButtonSizeToggler,
} from '../animations';
import Highlight from '../Highlight';
import { Row } from '../layout';
import { Monospace } from '../text';
import CoinDividerButtonLabel from './CoinDividerButtonLabel';

const {
  block,
  Clock,
  clockRunning,
  cond,
  set,
  spring,
  SpringUtils,
  startClock,
  Value,
} = Animated;

const CoinDividerHeight = 30;

function runTiming(clock, value, dest) {
  const state = {
    finished: new Value(1),
    position: new Value(value),
    time: new Value(0),
    velocity: new Value(0),
  };

  const config = SpringUtils.makeConfigFromOrigamiTensionAndFriction({
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
    cond(state.finished, [...reset, set(config.toValue, dest)]),
    cond(clockRunning(clock), 0, startClock(clock)),
    spring(clock, state, config),
    state.position,
  ]);
}

export default class CoinDivider extends PureComponent {
  static propTypes = {
    balancesSum: PropTypes.string,
    isCoinDivider: PropTypes.bool,
    onPress: PropTypes.func,
    openSmallBalances: PropTypes.bool,
  };

  componentWillMount() {
    this._initialState = this.props.openSmallBalances;
  }

  componentWillUpdate(prevProps) {
    const { openSmallBalances } = this.props;

    if (
      !isNil(prevProps.openSmallBalances) &&
      prevProps.openSmallBalances !== openSmallBalances
    ) {
      const clock = new Clock();
      const base = openSmallBalances
        ? runTiming(clock, -1, 1, openSmallBalances)
        : runTiming(clock, 1, -1, openSmallBalances);

      this._node = interpolate(base, {
        inputRange: [-1, 1],
        outputRange: [1, 0],
      });
    }
  }

  static height = CoinDividerHeight;

  render() {
    const {
      balancesSum,
      isCoinDivider,
      onPress,
      openSmallBalances,
    } = this.props;

    return (
      <Row
        align="center"
        height={CoinDividerHeight}
        justify="space-between"
        marginTop={8}
        paddingHorizontal={19}
        width={deviceUtils.dimensions.width}
      >
        <Highlight highlight={isCoinDivider} />
        <ButtonPressAnimation
          onPress={onPress}
          scaleTo={0.96}
          style={{ width: openSmallBalances ? 80 : 54 }}
        >
          <Row
            align="center"
            borderRadius={RoundButtonSizeToggler.capSize / 2}
            height={CoinDividerHeight}
            justify="space-between"
            width={54}
            paddingHorizontal={10}
          >
            <RoundButtonSizeToggler
              animationNode={this._node}
              endingWidth={CoinDividerHeight}
              isAbsolute
              reversed={!this._initialState}
              startingWidth={5}
              toggle={openSmallBalances}
            />
            <View>
              <CoinDividerButtonLabel
                isVisible={openSmallBalances}
                label="All"
                node={this._node}
                steps={[1, 0]}
              />
              <CoinDividerButtonLabel
                isVisible={openSmallBalances}
                label="Less"
                node={this._node}
                steps={[0, 1]}
              />
            </View>
            <View style={{ opacity: 0.6, paddingBottom: 1 }}>
              <RotationArrow
                endingOffset={20}
                endingPosition={-90}
                isOpen={openSmallBalances}
              >
                <FastImage source={Caret} style={{ height: 17, width: 9 }} />
              </RotationArrow>
            </View>
          </Row>
        </ButtonPressAnimation>
        <OpacityToggler
          isVisible={openSmallBalances}
          animationNode={this._node}
        >
          <Monospace color="dark" size="lmedium" style={{ paddingBottom: 1 }}>
            {balancesSum}
          </Monospace>
        </OpacityToggler>
      </Row>
    );
  }
}
