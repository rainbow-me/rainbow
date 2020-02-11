import { isNil } from 'lodash';
import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import { withNavigation } from 'react-navigation';
import { compose, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import {
  AddCashForm,
  AddCashHeader,
  AddCashStatus,
} from '../components/add-cash';
import { Column } from '../components/layout';
import { withTransitionProps } from '../hoc';
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
`;

const AddCashSheet = () => {
  const [orderStatus, setOrderStatus] = useState(null);
  const [transferHash, setTransferHash] = useState(null);
  const [transferStatus, setTransferStatus] = useState(null);

  return (
    <SheetContainer>
      <StatusBar barStyle="light-content" />
      <Column
        align="center"
        height={isNativeStackAvailable ? sheetHeight : '100%'}
        justify="space-between"
      >
        <AddCashHeader
          limitDaily={cashLimitDaily}
          limitYearly={cashLimitYearly}
        />
        {!isNil(orderStatus) ? (
          <AddCashStatus
            orderStatus={orderStatus}
            transferHash={transferHash}
            transferStatus={transferStatus}
          />
        ) : (
          <AddCashForm
            limitDaily={cashLimitDaily}
            limitYearly={cashLimitYearly}
            transferHash={transferHash}
            setOrderStatus={setOrderStatus}
            setTransferHash={setTransferHash}
            setTransferStatus={setTransferStatus}
          />
        )}
      </Column>
    </SheetContainer>
  );
};

export default compose(
  withNavigation,
  withTransitionProps,
  withProps(({ transitionProps: { isTransitioning } }) => ({
    isTransitioning,
  }))
)(AddCashSheet);
