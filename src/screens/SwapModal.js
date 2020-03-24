import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createUnlockAndSwapRap from '../raps/unlockAndSwap';
import ExchangeModalWithData from './ExchangeModalWithData';

const SwapModal = ({ ...props }) => (
  <ExchangeModalWithData
    createRap={createUnlockAndSwapRap}
    inputHeaderTitle="Swap"
    showOutputField
    type={ExchangeModalTypes.swap}
    {...props}
  />
);

export default SwapModal;
