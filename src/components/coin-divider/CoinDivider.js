import { isNil } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { LayoutAnimation, View } from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated from 'react-native-reanimated';
import Caret from '../../assets/family-dropdown-arrow.png';
import { colors } from '../../styles';
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
import { Text } from '../text';
import CoinDividerButtonLabel from './CoinDividerButtonLabel';
import { compose } from 'recompact';
import { withCoinCurrentAction } from '../../hoc';
import withCoinListEdited from '../../hoc/withCoinListEdited';

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

class CoinDivider extends PureComponent {
  static propTypes = {
    assetsAmount: PropTypes.number,
    balancesSum: PropTypes.string,
    currentAction: PropTypes.string,
    isCoinDivider: PropTypes.bool,
    onEdit: PropTypes.func,
    onPress: PropTypes.func,
    openSmallBalances: PropTypes.bool,
    reloadData: PropTypes.func,
  };

  state = {
    isCurrentlyCoinListEdited: this.props.isCoinListEdited,
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
      assetsAmount,
      balancesSum,
      isCoinDivider,
      onHide,
      onEdit,
      reloadData,
      onPin,
      isCoinListEdited,
      onPress,
      openSmallBalances,
      currentAction,
    } = this.props;

    return (
      <Row
        align="center"
        height={CoinDividerHeight}
        justify="space-between"
        marginBottom={6}
        marginTop={5}
        paddingHorizontal={19}
        width={deviceUtils.dimensions.width}
      >
        <Highlight highlight={isCoinDivider} />
        <Row>
          <Row style={{ position: 'absolute' }}>
            <OpacityToggler
              endingOpacity={1}
              startingOpacity={0}
              isVisible={this.state.isCurrentlyCoinListEdited}
            >
              <ButtonPressAnimation
                onPress={async () => {
                  await onPin();
                  reloadData();
                  LayoutAnimation.configureNext(
                    LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
                  );
                }}
              >
                <View
                  style={{
                    backgroundColor:
                      currentAction !== 'none'
                        ? colors.appleBlue
                        : colors.lightBlueGrey,
                    borderRadius: 15,
                    height: 30,
                    justifyContent: 'center',
                    paddingHorizontal: 10,
                    shadowColor:
                      currentAction !== 'none'
                        ? colors.appleBlue
                        : colors.white,
                    shadowOffset: { height: 4, width: 0 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                  }}
                >
                  <Text
                    color={currentAction !== 'none' ? 'white' : 'blueGreyDark'}
                    style={{
                      opacity: currentAction !== 'none' ? 1 : 0.2,
                    }}
                    letterSpacing="tighter"
                    size="lmedium"
                    weight="semibold"
                  >
                    {currentAction === 'unpin' ? 'Unpin' : 'Pin'}
                  </Text>
                </View>
              </ButtonPressAnimation>
            </OpacityToggler>
            <OpacityToggler
              endingOpacity={1}
              startingOpacity={0}
              isVisible={this.state.isCurrentlyCoinListEdited}
            >
              <ButtonPressAnimation
                onPress={async () => {
                  await onHide();
                  reloadData();
                  LayoutAnimation.configureNext(
                    LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
                  );
                }}
              >
                <View
                  style={{
                    backgroundColor:
                      currentAction !== 'none'
                        ? colors.appleBlue
                        : colors.lightBlueGrey,
                    borderRadius: 15,
                    height: 30,
                    justifyContent: 'center',
                    marginLeft: 10,
                    paddingHorizontal: 10,
                    shadowColor:
                      currentAction !== 'none'
                        ? colors.appleBlue
                        : colors.white,
                    shadowOffset: { height: 4, width: 0 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                  }}
                >
                  <Text
                    color={currentAction !== 'none' ? 'white' : 'blueGreyDark'}
                    style={{
                      opacity: currentAction !== 'none' ? 1 : 0.2,
                    }}
                    letterSpacing="tighter"
                    size="lmedium"
                    weight="semibold"
                  >
                    {currentAction === 'unhide' ? 'Unhide' : 'Hide'}
                  </Text>
                </View>
              </ButtonPressAnimation>
            </OpacityToggler>
          </Row>
          <View
            pointerEvents={
              this.state.isCurrentlyCoinListEdited || assetsAmount === 0
                ? 'none'
                : 'auto'
            }
          >
            <ButtonPressAnimation
              onPress={onPress}
              scaleTo={0.9}
              style={{ width: openSmallBalances ? 80 : 52.5 }}
            >
              <OpacityToggler
                endingOpacity={0}
                startingOpacity={1}
                isVisible={this.props.isCoinListEdited || assetsAmount === 0}
              >
                <Row
                  align="center"
                  borderRadius={RoundButtonSizeToggler.capSize / 2}
                  height={CoinDividerHeight}
                  justify="space-between"
                  width={52.5}
                  paddingHorizontal={10}
                >
                  <RoundButtonSizeToggler
                    animationNode={this._node}
                    endingWidth={28}
                    isAbsolute
                    reversed={!this._initialState}
                    startingWidth={3}
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
                      <FastImage
                        source={Caret}
                        style={{ height: 17, width: 9 }}
                        tintColor={colors.blueGreyDark}
                      />
                    </RotationArrow>
                  </View>
                </Row>
              </OpacityToggler>
            </ButtonPressAnimation>
          </View>
        </Row>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            width: 100,
          }}
        >
          <View
            style={{
              height: 30,
              justifyContent: 'center',
            }}
          >
            <OpacityToggler
              isVisible={openSmallBalances || assetsAmount === 0}
              animationNode={this._node}
            >
              <Text
                align="right"
                color="dark"
                size="lmedium"
                style={{ paddingBottom: 1 }}
              >
                {balancesSum}
              </Text>
            </OpacityToggler>
          </View>
          <View
            style={{ alignItems: 'flex-end', position: 'absolute', width: 64 }}
            pointerEvents={
              openSmallBalances || assetsAmount === 0 ? 'auto' : 'none'
            }
          >
            <OpacityToggler
              endingOpacity={1}
              startingOpacity={0}
              isVisible={openSmallBalances || assetsAmount === 0}
              animationNode={this._node}
            >
              <ButtonPressAnimation
                onPress={() => {
                  this.setState(prevState => {
                    onEdit(!prevState.isCurrentlyCoinListEdited);
                    return {
                      isCurrentlyCoinListEdited: !prevState.isCurrentlyCoinListEdited,
                    };
                  });
                }}
              >
                <View
                  style={{
                    backgroundColor: isCoinListEdited
                      ? colors.appleBlue
                      : colors.lightBlueGrey,
                    borderRadius: 15,
                    height: 30,
                    justifyContent: 'center',
                    paddingHorizontal: 10,
                    shadowColor: isCoinListEdited
                      ? colors.appleBlue
                      : colors.white,
                    shadowOffset: { height: 4, width: 0 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                  }}
                >
                  <Text
                    color={
                      isCoinListEdited ? 'white' : 'blueGreyDarkTransparent'
                    }
                    letterSpacing="tighter"
                    size="lmedium"
                    weight="semibold"
                  >
                    {isCoinListEdited ? 'Done' : 'Edit'}
                  </Text>
                </View>
              </ButtonPressAnimation>
            </OpacityToggler>
          </View>
        </View>
      </Row>
    );
  }
}

export default compose(withCoinCurrentAction, withCoinListEdited)(CoinDivider);
