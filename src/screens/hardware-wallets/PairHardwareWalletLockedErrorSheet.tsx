import React from 'react';
import { LEDGER_ERROR_CODES } from '@/utils/ledger';
import { ErrorSheet, ErrorSheetRouteParams } from './components/ErrorSheet';
import { RouteProp, useRoute } from '@react-navigation/core';

export const PairHardwareWalletLockedErrorSheet = () => {
  const route = useRoute<RouteProp<ErrorSheetRouteParams, 'ErrorSheetProps'>>();
  return (
    <ErrorSheet
      deviceId={route?.params?.deviceId}
      type={LEDGER_ERROR_CODES.OFF_OR_LOCKED}
    />
  );
};
