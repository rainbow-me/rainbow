import { isNil } from 'lodash';
import React from 'react';
import { StatusBar } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import styled from 'styled-components/primitives';
import { useSafeArea } from 'react-native-safe-area-context';
import {
  AddCashForm,
  AddCashHeader,
  AddCashStatus,
} from '../components/add-cash';
import { Column, FlexItem } from '../components/layout';
import { useDimensions, useWyreApplePay } from '../hooks';
import { borders, colors } from '../styles';
import { deviceUtils } from '../utils';
import isNativeStackAvailable from '../helpers/isNativeStackAvailable';

const cashLimitYearly = 1500;
const cashLimitDaily = 250;

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

const headerSubtitles = [
  `Up to $${cashLimitDaily} daily`,
  `Up to $${cashLimitYearly} yearly`,
];

const AddCashSheet = () => {
  const { isNarrowPhone } = useDimensions();
  const insets = useSafeArea();

  const {
    onPurchase,
    orderStatus,
    transferHash,
    transferStatus,
  } = useWyreApplePay();

  const showOrderStatus = true || !isNil(orderStatus);

  console.log('insets', insets);

  return (
    <SheetContainer>
      <StatusBar barStyle="light-content" />
      <Column
        align="center"
        height={isNativeStackAvailable ? sheetHeight : '100%'}
        justify="end"
        paddingBottom={isNarrowPhone ? 15 : insets.bottom + 21}
      >
        <AddCashHeader subtitles={showOrderStatus ? null : headerSubtitles} />
        <FlexItem>
          {showOrderStatus ? (
            <AddCashStatus
              orderStatus={orderStatus}
              transferHash={transferHash}
              transferStatus={transferStatus}
            />
          ) : (
            <AddCashForm
              limitDaily={cashLimitDaily}
              limitYearly={cashLimitYearly}
              onPurchase={onPurchase}
            />
          )}
        </FlexItem>
      </Column>
    </SheetContainer>
  );
};

export default AddCashSheet;
