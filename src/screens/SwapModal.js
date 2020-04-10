import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createUnlockAndSwapRap, {
  estimateUnlockAndSwap,
} from '../raps/unlockAndSwap';
import ExchangeModalWithData from './ExchangeModalWithData';

const SwapModal = ({ ...props }) => (
  <ExchangeModalWithData
    createRap={createUnlockAndSwapRap}
    estimateRap={estimateUnlockAndSwap}
    inputHeaderTitle="Swap"
    showOutputField
    type={ExchangeModalTypes.swap}
    {...props}
  />
);

export default SwapModal;
