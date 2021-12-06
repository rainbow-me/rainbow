import React, { useCallback, useMemo, useState } from 'react';
import { StatusBar } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { AddCashForm, AddCashStatus } from '../components/add-cash';
import { Column, ColumnWithMargins, FlexItem } from '../components/layout';
import {
  SheetHandle,
  SheetSubtitleCycler,
  SheetTitle,
} from '../components/sheet';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../context/ThemeContext' was resolved to '... Remove this comment to see the full error message
import { useTheme } from '../context/ThemeContext';
import isNativeStackAvailable from '../helpers/isNativeStackAvailable';
import { deviceUtils } from '../utils';
import {
  useAddCashLimits,
  useDimensions,
  useShakeAnimation,
  useTimeout,
  useWyreApplePay,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders } from '@rainbow-me/styles';

// @ts-expect-error ts-migrate(2339) FIXME: Property 'dimensions' does not exist on type '{}'.
const deviceHeight = deviceUtils.dimensions.height;
const statusBarHeight = getStatusBarHeight(true);
const sheetHeight =
  deviceHeight -
  statusBarHeight -
  (isNativeStackAvailable ? (deviceHeight >= 812 ? 10 : 20) : 0);

const SheetContainer = styled(Column)`
  ${borders.buildRadius('top', isNativeStackAvailable ? 0 : 16)};
  background-color: ${({ colors }) => colors.white};
  height: ${isNativeStackAvailable ? deviceHeight : sheetHeight};
  top: ${isNativeStackAvailable ? 0 : statusBarHeight};
  width: 100%;
`;

const SubtitleInterval = 3000;

export default function AddCashSheet() {
  const { colors } = useTheme();
  const { isNarrowPhone } = useDimensions();
  const insets = useSafeArea();

  const [errorAnimation, onShake] = useShakeAnimation();
  const [startErrorTimeout, stopErrorTimeout] = useTimeout();

  const [errorIndex, setErrorIndex] = useState(null);
  const onClearError = useCallback(() => setErrorIndex(null), []);

  const { weeklyRemainingLimit, yearlyRemainingLimit } = useAddCashLimits();

  const cashLimits = useMemo(
    () => ({
      weekly:
        weeklyRemainingLimit > 0
          ? `$${weeklyRemainingLimit} left this week`
          : 'Weekly limit reached',
      yearly:
        yearlyRemainingLimit > 0
          ? `$${yearlyRemainingLimit} left this year`
          : 'Yearly limit reached',
    }),
    [weeklyRemainingLimit, yearlyRemainingLimit]
  );

  const {
    error,
    isPaymentComplete,
    onPurchase,
    orderCurrency,
    orderId,
    orderStatus,
    resetAddCashForm,
    transferStatus,
  } = useWyreApplePay();

  const onLimitExceeded = useCallback(
    limit => {
      stopErrorTimeout();
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'number' is not assignable to par... Remove this comment to see the full error message
      setErrorIndex(Object.keys(cashLimits).indexOf(limit));
      startErrorTimeout(() => onClearError(), SubtitleInterval);
    },
    [stopErrorTimeout, cashLimits, startErrorTimeout, onClearError]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <SheetContainer colors={colors}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <StatusBar barStyle="light-content" />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Column
        align="center"
        height={isNativeStackAvailable ? sheetHeight : '100%'}
        justify="end"
        paddingBottom={isNarrowPhone ? 15 : insets.bottom + 11}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column align="center" paddingVertical={6}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SheetHandle />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ColumnWithMargins
            margin={4}
            paddingTop={isNativeStackAvailable ? 7 : 5}
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SheetTitle>Add Cash</SheetTitle>
            {!isPaymentComplete && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <SheetSubtitleCycler
                animatedValue={errorAnimation}
                errorIndex={errorIndex}
                interval={SubtitleInterval}
                items={Object.values(cashLimits)}
                paddingVertical={14}
              />
            )}
          </ColumnWithMargins>
        </Column>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <FlexItem width="100%">
          {isPaymentComplete ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <AddCashStatus
              error={error}
              orderCurrency={orderCurrency}
              orderId={orderId}
              orderStatus={orderStatus}
              resetAddCashForm={resetAddCashForm}
              transferStatus={transferStatus}
            />
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <AddCashForm
              limitWeekly={weeklyRemainingLimit}
              onClearError={onClearError}
              onLimitExceeded={onLimitExceeded}
              onPurchase={onPurchase}
              onShake={onShake}
              shakeAnim={errorAnimation}
            />
          )}
        </FlexItem>
      </Column>
    </SheetContainer>
  );
}
