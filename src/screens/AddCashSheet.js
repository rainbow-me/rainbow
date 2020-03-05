import { isNil } from 'lodash';
import React, { useCallback, useState } from 'react';
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
  useDimensions,
  useShakeAnimation,
  useTimeout,
  useWyreApplePay,
} from '../hooks';
import { borders, colors } from '../styles';
import { deviceUtils } from '../utils';

const deviceHeight = deviceUtils.dimensions.height;
const statusBarHeight = getStatusBarHeight(true);
const sheetHeight =
  deviceHeight - statusBarHeight - (isNativeStackAvailable ? 10 : 0);

const SheetContainer = styled(Column)`
  ${borders.buildRadius('top', isNativeStackAvailable ? 0 : 30)};
  background-color: ${colors.white};
  height: ${isNativeStackAvailable ? deviceHeight : sheetHeight};
  top: ${isNativeStackAvailable ? 0 : statusBarHeight};
  width: 100%;
`;

const cashLimitYearly = 1500;
const cashLimitDaily = 250;

const cashLimits = {
  daily: `Up to $${cashLimitDaily} daily`,
  yearly: `Up to $${cashLimitYearly} yearly`,
};

const SubtitleInterval = 3000;

const AddCashSheet = () => {
  const { isNarrowPhone } = useDimensions();
  const insets = useSafeArea();

  const [errorAnimation, onShake] = useShakeAnimation();
  const [errorIndex, setErrorIndex] = useState(null);
  const [cancelTimeout, createTimeout] = useTimeout();

  const {
    onPurchase,
    orderCurrency,
    orderStatus,
    transferStatus,
  } = useWyreApplePay();

  const onClearError = useCallback(() => setErrorIndex(null), []);

  const onLimitExceeded = useCallback(
    limit => {
      cancelTimeout();
      setErrorIndex(Object.keys(cashLimits).indexOf(limit));
      createTimeout(() => onClearError(), SubtitleInterval);
    },
    [cancelTimeout, createTimeout, onClearError]
  );

  const showOrderStatus = !isNil(orderStatus);

  return (
    <SheetContainer>
      <StatusBar barStyle="light-content" />
      <Column
        align="center"
        height={isNativeStackAvailable ? sheetHeight : '100%'}
        justify="end"
        paddingBottom={isNarrowPhone ? 15 : insets.bottom + 21}
      >
        <Column align="center" paddingVertical={isNativeStackAvailable ? 6 : 8}>
          <SheetHandle />
          <ColumnWithMargins margin={4} paddingTop={7}>
            <SheetTitle>Add Cash</SheetTitle>
            {!showOrderStatus && (
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
          {showOrderStatus ? (
            <AddCashStatus
              orderCurrency={orderCurrency}
              orderStatus={orderStatus}
              transferStatus={transferStatus}
            />
          ) : (
            <AddCashForm
              limitDaily={cashLimitDaily}
              limitYearly={cashLimitYearly}
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
};

export default React.memo(AddCashSheet);
