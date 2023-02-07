import React from 'react';
import { LEDGER_ERROR_CODES } from '@/utils/ledger';
import { ErrorSheet, ErrorSheetRouteParams } from './components/ErrorSheet';
import { RouteProp, useRoute } from '@react-navigation/core';

export const PairHardwareWalletEthAppErrorSheet = () => {
  const route = useRoute<RouteProp<ErrorSheetRouteParams, 'ErrorSheetProps'>>();
  return (
    <ErrorSheet
      deviceId={route?.params?.deviceId}
      type={LEDGER_ERROR_CODES.NO_ETH_APP}
    />
  );
};
