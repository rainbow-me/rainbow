import analytics from '@segment/analytics-react-native';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import ShadowStack from 'react-native-shadow-stack';
import { useNavigation } from 'react-navigation-hooks';
import {
  calculateAPY,
  calculateCompoundInterestInDays,
  formatSavingsAmount,
} from '../../helpers/savings';
import { useDimensions } from '../../hooks';
import { colors, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Centered, Row } from '../layout';
import APYPill from './APYPill';
import SavingsListRowAnimatedNumber from './SavingsListRowAnimatedNumber';
import SavingsListRowEmptyState from './SavingsListRowEmptyState';

const MS_IN_1_DAY = 1000 * 60 * 60 * 24;
const ANIMATE_NUMBER_INTERVAL = 30;

const SavingsListRow = ({
  cTokenBalance,
  lifetimeSupplyInterestAccrued,
  lifetimeSupplyInterestAccruedNative,
  underlyingBalanceNativeValue,
  supplyBalanceUnderlying,
  supplyRate,
  underlying,
  underlyingPrice,
}) => {
  const { width: deviceWidth } = useDimensions();
  const { navigate } = useNavigation();

  const initialValue = supplyBalanceUnderlying;
  const [value, setValue] = useState(initialValue);
  const [steps, setSteps] = useState(0);
  const apy = useMemo(() => calculateAPY(supplyRate), [supplyRate]);
  const apyTruncated = supplyBalanceUnderlying
    ? parseFloat(apy).toFixed(2)
    : Math.floor(apy * 10) / 10;

  const onButtonPress = useCallback(() => {
    navigate('SavingsSheet', {
      cTokenBalance,
      isEmpty: !supplyBalanceUnderlying,
      lifetimeSupplyInterestAccrued,
      lifetimeSupplyInterestAccruedNative,
      supplyBalanceUnderlying,
      supplyRate,
      underlying,
      underlyingBalanceNativeValue,
      underlyingPrice,
    });

    analytics.track('Opened Savings Sheet', {
      category: 'savings',
      empty: !supplyBalanceUnderlying,
      label: underlying.symbol,
    });
  }, [
    cTokenBalance,
    lifetimeSupplyInterestAccrued,
    lifetimeSupplyInterestAccruedNative,
    underlyingBalanceNativeValue,
    navigate,
    supplyBalanceUnderlying,
    supplyRate,
    underlying,
    underlyingPrice,
  ]);

  useEffect(() => {
    if (!supplyBalanceUnderlying) return;

    const futureValue = calculateCompoundInterestInDays(
      initialValue,
      supplyRate,
      1
    );

    if (!BigNumber(futureValue).eq(value)) {
      setValue(futureValue);
      setSteps(MS_IN_1_DAY / ANIMATE_NUMBER_INTERVAL);
    }
  }, [
    apy,
    initialValue,
    supplyBalanceUnderlying,
    supplyRate,
    underlying,
    value,
  ]);

  useEffect(() => {
    if (underlying && underlying.symbol && supplyBalanceUnderlying)
      InteractionManager.runAfterInteractions(() => {
        analytics.track('User has savings', {
          category: 'savings',
          label: underlying.symbol,
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayValue = formatSavingsAmount(value);

  return !underlying || !underlying.address ? null : (
    <ButtonPressAnimation onPress={onButtonPress} scaleTo={0.96}>
      <Centered direction="column" marginBottom={15}>
        <ShadowStack
          height={49}
          width={deviceWidth - 38}
          borderRadius={49}
          shadows={[
            [0, 10, 30, colors.dark, 0.1],
            [0, 5, 15, colors.dark, 0.04],
          ]}
          style={{ elevation: 15 }}
        >
          <LinearGradient
            borderRadius={49}
            colors={['#FFFFFF', '#F7F9FA']}
            end={{ x: 0.5, y: 1 }}
            opacity={0.1}
            pointerEvents="none"
            start={{ x: 0.5, y: 0 }}
            style={position.coverAsObject}
          />
          <Row
            align="center"
            css={padding(9, 10, 10, 11)}
            justify="space-between"
          >
            <Row align="center" justify="space-between">
              {underlying.symbol && supplyBalanceUnderlying ? (
                <Centered marginRight={6}>
                  <CoinIcon size={26} symbol={underlying.symbol} />
                </Centered>
              ) : null}
              {supplyBalanceUnderlying && !isNaN(displayValue) ? (
                <SavingsListRowAnimatedNumber
                  initialValue={initialValue}
                  interval={ANIMATE_NUMBER_INTERVAL}
                  steps={steps}
                  symbol={underlying.symbol}
                  value={displayValue}
                />
              ) : (
                <SavingsListRowEmptyState onPress={onButtonPress} />
              )}
            </Row>
            <APYPill value={apyTruncated} />
          </Row>
        </ShadowStack>
      </Centered>
    </ButtonPressAnimation>
  );
};

SavingsListRow.propTypes = {
  cTokenBalance: PropTypes.string,
  lifetimeSupplyInterestAccrued: PropTypes.string,
  supplyBalanceUnderlying: PropTypes.string,
  supplyRate: PropTypes.string,
  underlying: PropTypes.object,
  underlyingBalanceNativeValue: PropTypes.string,
  underlyingPrice: PropTypes.string,
};

export default React.memo(SavingsListRow);
