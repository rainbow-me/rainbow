import React from 'react';
import { LEDGER_ERROR_CODES } from '@/utils/ledger';
import { ErrorSheet } from './components/ErrorSheet';

export const PairHardwareWalletEthAppErrorSheet = () => (
  <ErrorSheet type={LEDGER_ERROR_CODES.NO_ETH_APP} />
);
