import { isNil } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { LayoutAnimation, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { compose } from 'recompact';
import EditOptions from '../../helpers/editOptionTypes';
import {
  withCoinCurrentAction,
  withCoinListEdited,
  withEditOptions,
  withOpenBalances,
} from '../../hoc';
import { colors } from '../../styles';
import { deviceUtils } from '../../utils';
import { interpolate } from '../animations';
import Highlight from '../Highlight';
import { Row } from '../layout';
import CoinDividerEditButton from './CoinDividerEditButton';
import CoinDividerOpenButton from './CoinDividerOpenButton';
import CoinDividerAssetsValue from './CoinDividerAssetsValue';

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
    isCoinListEdited: PropTypes.bool,
    isSticky: PropTypes.bool,
    nativeCurrency: PropTypes.string,
    onEndEdit: PropTypes.func,
    openSmallBalances: PropTypes.bool,
    setHiddenCoins: PropTypes.func,
    setIsCoinListEdited: PropTypes.func,
    setOpenSmallBalances: PropTypes.func,
    setPinnedCoins: PropTypes.func,
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
      currentAction,
      isCoinDivider,
      isCoinListEdited,
      isSticky,
      nativeCurrency,
      onEndEdit,
      openSmallBalances,
      setHiddenCoins,
      setIsCoinListEdited,
      setOpenSmallBalances,
      setPinnedCoins,
    } = this.props;

    return (
      <Row
        align="center"
        height={CoinDividerHeight + 11}
        justify="space-between"
        paddingBottom={6}
        paddingTop={5}
        paddingHorizontal={19}
        width={deviceUtils.dimensions.width}
        backgroundColor={isSticky ? colors.white : colors.transparent}
      >
        <Highlight highlight={isCoinDivider} />
        <Row>
          <View
            pointerEvents={
              isCoinListEdited || assetsAmount === 0 ? 'none' : 'auto'
            }
          >
            <CoinDividerOpenButton
              assetsAmount={assetsAmount}
              coinDividerHeight={CoinDividerHeight}
              initialState={this._initialState}
              isCoinListEdited={isCoinListEdited}
              node={this._node}
              openSmallBalances={openSmallBalances}
              setOpenSmallBalances={setOpenSmallBalances}
            />
          </View>
          <Row
            pointerEvents={isCoinListEdited ? 'auto' : 'none'}
            style={{ position: 'absolute' }}
          >
            <CoinDividerEditButton
              onPress={setPinnedCoins}
              isVisible={isCoinListEdited}
              isActive={currentAction !== EditOptions.none}
              text={currentAction === EditOptions.unpin ? 'Unpin' : 'Pin'}
              shouldReloadList
              style={{ marginRight: 10 }}
            />
            <CoinDividerEditButton
              onPress={setHiddenCoins}
              isVisible={isCoinListEdited}
              isActive={currentAction !== EditOptions.none}
              text={currentAction === EditOptions.unhide ? 'Unhide' : 'Hide'}
              shouldReloadList
            />
          </Row>
        </Row>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            width: 100,
          }}
        >
          <CoinDividerAssetsValue
            assetsAmount={assetsAmount}
            balancesSum={balancesSum}
            nativeCurrency={nativeCurrency}
            node={this._node}
            openSmallBalances={openSmallBalances}
          />
          <View
            style={{ alignItems: 'flex-end', position: 'absolute', width: 64 }}
            pointerEvents={
              openSmallBalances || assetsAmount === 0 ? 'auto' : 'none'
            }
          >
            <CoinDividerEditButton
              animationNode={this._node}
              onPress={() => {
                if (isCoinListEdited && onEndEdit) {
                  onEndEdit();
                }
                setIsCoinListEdited(!isCoinListEdited);
                LayoutAnimation.configureNext(
                  LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
                );
              }}
              isVisible={openSmallBalances || assetsAmount === 0}
              isActive={isCoinListEdited}
              text={isCoinListEdited ? 'Done' : 'Edit'}
              textOpacityAlwaysOn
            />
          </View>
        </View>
      </Row>
    );
  }
}

export default compose(
  withEditOptions,
  withOpenBalances,
  withCoinCurrentAction,
  withCoinListEdited
)(CoinDivider);
