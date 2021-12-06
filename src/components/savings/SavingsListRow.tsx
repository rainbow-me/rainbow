import analytics from '@segment/analytics-react-native';
import BigNumber from 'bignumber.js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager } from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import {
  SavingsSheetEmptyHeight,
  SavingsSheetHeight,
  // @ts-expect-error ts-migrate(6142) FIXME: Module '../../screens/SavingsSheet' was resolved t... Remove this comment to see the full error message
} from '../../screens/SavingsSheet';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import { Centered, Row } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './APYPill' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import APYPill from './APYPill';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SavingsListRowAnimatedNumber' was resolv... Remove this comment to see the full error message
import SavingsListRowAnimatedNumber from './SavingsListRowAnimatedNumber';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SavingsListRowEmptyState' was resolved t... Remove this comment to see the full error message
import SavingsListRowEmptyState from './SavingsListRowEmptyState';
import {
  calculateAPY,
  calculateCompoundInterestInDays,
  formatSavingsAmount,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/savings' o... Remove this comment to see the full error message
} from '@rainbow-me/helpers/savings';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { magicMemo } from '@rainbow-me/utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

const MS_IN_1_DAY = 1000 * 60 * 60 * 24;
const ANIMATE_NUMBER_INTERVAL = 60;

const NOOP = () => undefined;

const SavingsListRowGradient = magicMemo(
  ({ colors }: any) => (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <LinearGradient
      // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
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
    backgroundColor: colors.white,
    borderRadius: 49,
    height: 49,
    shadows: [
      [0, 10, 30, colors.shadow, 0.1],
      [0, 5, 15, colors.shadow, 0.04],
    ],
    width: deviceWidth - 38,
  })
)``;

const SavingsListRow = ({
  cTokenBalance,
  lifetimeSupplyInterestAccrued,
  lifetimeSupplyInterestAccruedNative,
  underlyingBalanceNativeValue,
  supplyBalanceUnderlying,
  supplyRate,
  underlying,
}: any) => {
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

    // @ts-expect-error ts-migrate(2348) FIXME: Value of type 'typeof BigNumber' is not callable. ... Remove this comment to see the full error message
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

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return !underlying || !underlying.address ? null : (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      onPress={onButtonPress}
      overflowMargin={10}
      scaleTo={0.96}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered direction="column" marginBottom={15}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SavingsListRowShadowStack deviceWidth={deviceWidth}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SavingsListRowGradient colors={colors} />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Row
            align="center"
            css={padding(9, 10, 10, 11)}
            justify="space-between"
            onPress={onButtonPress}
            scaleTo={0.96}
          >
            {underlying.symbol && supplyBalanceUnderlying ? (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Centered>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
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
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <SavingsListRowAnimatedNumber
                initialValue={initialValue}
                interval={ANIMATE_NUMBER_INTERVAL}
                steps={steps}
                symbol={underlying.symbol}
                value={displayValue}
              />
            ) : (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <SavingsListRowEmptyState onPress={NOOP} />
            )}
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <APYPill value={apyTruncated} />
          </Row>
        </SavingsListRowShadowStack>
      </Centered>
    </ButtonPressAnimation>
  );
};

export default React.memo(SavingsListRow);
