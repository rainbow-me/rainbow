import BigNumber from 'bignumber.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
import LinearGradient from 'react-native-linear-gradient';
import {
  SavingsSheetEmptyHeight,
  SavingsSheetHeight,
} from '../../screens/SavingsSheet';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Centered, Row } from '../layout';
import APYPill from './APYPill';
import SavingsListRowAnimatedNumber from './SavingsListRowAnimatedNumber';
import SavingsListRowEmptyState from './SavingsListRowEmptyState';
import { analytics } from '@/analytics';
import {
  calculateAPY,
  calculateCompoundInterestInDays,
  formatSavingsAmount,
} from '@/helpers/savings';
import { useDimensions } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { padding, position } from '@/styles';
import { magicMemo } from '@/utils';
import ShadowStack from '@/react-native-shadow-stack';

const MS_IN_1_DAY = 1000 * 60 * 60 * 24;
const ANIMATE_NUMBER_INTERVAL = 60;

const NOOP = () => undefined;

const SavingsListRowGradient = magicMemo(
  ({ colors }) => (
    <LinearGradient
      borderRadius={49}
      colors={colors.gradients.savings}
      end={{ x: 0.5, y: 1 }}
      pointerEvents="none"
      start={{ x: 0.5, y: 0 }}
      style={position.coverAsObject}
    />
  ),
  'colors'
);

const SavingsListRowShadowStack = styled(ShadowStack).attrs(
  ({ deviceWidth, theme: { colors } }) => ({
    backgroundColor: colors.surfacePrimary,
    borderRadius: 49,
    height: 49,
    shadows: [
      [0, 10, 30, colors.shadow, 0.1],
      [0, 5, 15, colors.shadow, 0.04],
    ],
    width: deviceWidth - 38,
  })
)({});

const rowStyle = padding.object(9, 10, 10, 11);

const SavingsListRow = ({
  cTokenBalance,
  lifetimeSupplyInterestAccrued,
  lifetimeSupplyInterestAccruedNative,
  underlyingBalanceNativeValue,
  supplyBalanceUnderlying,
  supplyRate,
  underlying,
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
    navigate(Routes.SAVINGS_SHEET, {
      cTokenBalance,
      isEmpty: !supplyBalanceUnderlying,
      lifetimeSupplyInterestAccrued,
      lifetimeSupplyInterestAccruedNative,
      longFormHeight: supplyBalanceUnderlying
        ? SavingsSheetHeight
        : SavingsSheetEmptyHeight,
      supplyBalanceUnderlying,
      supplyRate,
      underlying,
      underlyingBalanceNativeValue,
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

  const { colors } = useTheme();

  return !underlying || !underlying.address ? null : (
    <ButtonPressAnimation
      onPress={onButtonPress}
      overflowMargin={10}
      scaleTo={0.96}
      testID={`savings-list-row-${underlying?.symbol}`}
    >
      <Centered direction="column" marginBottom={15}>
        <SavingsListRowShadowStack deviceWidth={deviceWidth}>
          <SavingsListRowGradient colors={colors} />
          <Row
            align="center"
            justify="space-between"
            onPress={onButtonPress}
            scaleTo={0.96}
            style={rowStyle}
          >
            {underlying.symbol && supplyBalanceUnderlying ? (
              <Centered>
                <CoinIcon
                  address={underlying.address}
                  size={26}
                  symbol={underlying.symbol}
                />
              </Centered>
            ) : null}
            {supplyBalanceUnderlying &&
            !isNaN(displayValue) &&
            IS_TESTING !== 'true' ? (
              <SavingsListRowAnimatedNumber
                initialValue={initialValue}
                interval={ANIMATE_NUMBER_INTERVAL}
                key={initialValue + 'savings'}
                steps={steps}
                symbol={underlying.symbol}
                value={displayValue}
              />
            ) : (
              <SavingsListRowEmptyState onPress={NOOP} />
            )}
            <APYPill value={apyTruncated} />
          </Row>
        </SavingsListRowShadowStack>
      </Centered>
    </ButtonPressAnimation>
  );
};

export default React.memo(SavingsListRow);
