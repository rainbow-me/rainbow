import React from 'react';
import { LEDGER_ERROR_CODES } from '@/utils/ledger';
import { ErrorSheet } from './components/ErrorSheet';

export const PairHardwareWalletLockedErrorSheet = () => (
  <ErrorSheet type={LEDGER_ERROR_CODES.OFF_OR_LOCKED} />
);
