import React, { useCallback, useMemo, useState } from 'react';
import { StatusBar } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import { AddCashForm, AddCashStatus } from '../components/add-cash';
import { Column, ColumnWithMargins, FlexItem } from '../components/layout';
import {
  SheetHandle,
  SheetSubtitleCycler,
  SheetTitle,
} from '../components/sheet';
import isNativeStackAvailable from '../helpers/isNativeStackAvailable';
import {
  useAddCashLimits,
  useDimensions,
  useShakeAnimation,
  useTimeout,
  useWyreApplePay,
} from '../hooks';
import { deviceUtils } from '../utils';
import { borders, colors } from '@rainbow-me/styles';

const deviceHeight = deviceUtils.dimensions.height;
const statusBarHeight = getStatusBarHeight(true);
const sheetHeight =
  deviceHeight -
  statusBarHeight -
  (isNativeStackAvailable ? (deviceHeight >= 812 ? 10 : 20) : 0);

const SheetContainer = styled(Column)`
  ${borders.buildRadius('top', isNativeStackAvailable ? 0 : 16)};
  background-color: ${colors.white};
  height: ${isNativeStackAvailable ? deviceHeight : sheetHeight};
  top: ${isNativeStackAvailable ? 0 : statusBarHeight};
  width: 100%;
`;

const SubtitleInterval = 3000;

export default function AddCashSheet() {
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
    orderStatus,
    resetAddCashForm,
    transferStatus,
  } = useWyreApplePay();

  const onLimitExceeded = useCallback(
    limit => {
      stopErrorTimeout();
      setErrorIndex(Object.keys(cashLimits).indexOf(limit));
      startErrorTimeout(() => onClearError(), SubtitleInterval);
    },
    [stopErrorTimeout, cashLimits, startErrorTimeout, onClearError]
  );

  return (
    <SheetContainer>
      <StatusBar barStyle="light-content" />
      <Column
        align="center"
        height={isNativeStackAvailable ? sheetHeight : '100%'}
        justify="end"
        paddingBottom={isNarrowPhone ? 15 : insets.bottom + 11}
      >
        <Column align="center" paddingVertical={6}>
          <SheetHandle />
          <ColumnWithMargins
            margin={4}
            paddingTop={isNativeStackAvailable ? 7 : 5}
          >
            <SheetTitle>Add Cash</SheetTitle>
            {!isPaymentComplete && (
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
        <FlexItem width="100%">
          {isPaymentComplete ? (
            <AddCashStatus
              error={error}
              orderCurrency={orderCurrency}
              orderStatus={orderStatus}
              resetAddCashForm={resetAddCashForm}
              transferStatus={transferStatus}
            />
          ) : (
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
