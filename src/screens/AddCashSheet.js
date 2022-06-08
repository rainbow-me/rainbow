import lang from 'i18n-js';
import React, { useCallback, useMemo, useState } from 'react';
import { StatusBar } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { useSafeArea } from 'react-native-safe-area-context';
import { AddCashForm, AddCashStatus } from '../components/add-cash';
import { Column, ColumnWithMargins, FlexItem } from '../components/layout';
import {
  SheetHandle,
  SheetSubtitleCycler,
  SheetTitle,
} from '../components/sheet';
import isNativeStackAvailable from '../helpers/isNativeStackAvailable';
import { deviceUtils } from '../utils';
import {
  useAddCashLimits,
  useDimensions,
  useShakeAnimation,
  useTimeout,
  useWyreApplePay,
} from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { borders } from '@rainbow-me/styles';
import { useTheme } from '@rainbow-me/theme';

const deviceHeight = deviceUtils.dimensions.height;
const statusBarHeight = getStatusBarHeight(true);
const sheetHeight =
  deviceHeight -
  statusBarHeight -
  (isNativeStackAvailable ? (deviceHeight >= 812 ? 10 : 20) : 0);

const subtitleInterval = 3000;

const SheetContainer = styled(Column)({
  ...borders.buildRadiusAsObject('top', isNativeStackAvailable ? 0 : 16),
  backgroundColor: ({ colors }) => colors.white,
  height: isNativeStackAvailable ? deviceHeight : sheetHeight,
  top: isNativeStackAvailable ? 0 : statusBarHeight,
  width: '100%',
});

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
          ? lang.t('add_funds.limit_left_this_week', {
              remainingLimit: weeklyRemainingLimit,
            })
          : lang.t('add_funds.weekly_limit_reached'),
      yearly:
        yearlyRemainingLimit > 0
          ? lang.t('add_funds.limit_left_this_year', {
              remainingLimit: yearlyRemainingLimit,
            })
          : lang.t('add_funds.yearly_limit_reached'),
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
      setErrorIndex(Object.keys(cashLimits).indexOf(limit));
      startErrorTimeout(() => onClearError(), subtitleInterval);
    },
    [stopErrorTimeout, cashLimits, startErrorTimeout, onClearError]
  );

  return (
    <SheetContainer colors={colors}>
      <StatusBar barStyle="light-content" />
      <Column
        align="center"
        height={isNativeStackAvailable ? sheetHeight : '100%'}
        paddingBottom={isNarrowPhone ? 15 : insets.bottom + 11}
      >
        <Column align="center" paddingVertical={6}>
          <SheetHandle />
          <ColumnWithMargins
            align="center"
            margin={4}
            paddingTop={isNativeStackAvailable ? 7 : 5}
          >
            <SheetTitle>{lang.t('button.add_cash')}</SheetTitle>
            <SheetSubtitleCycler
              errorIndex={errorIndex}
              interval={subtitleInterval}
              isPaymentComplete={isPaymentComplete}
              items={Object.values(cashLimits)}
              sharedValue={errorAnimation}
            />
          </ColumnWithMargins>
        </Column>
        <FlexItem width="100%">
          {isPaymentComplete ? (
            <AddCashStatus
              error={error}
              orderCurrency={orderCurrency}
              orderId={orderId}
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
