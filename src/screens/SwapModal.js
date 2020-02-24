import React from 'react';
import createUnlockAndSwapRap from '../raps/unlockAndSwap';
import ExchangeModalWithData from './ExchangeModalWithData';

const SwapModal = ({ ...props }) => (
  <ExchangeModalWithData
    createRap={createUnlockAndSwapRap}
    inputHeaderTitle="Swap"
    showOutputField
    {...props}
  />
);

export default SwapModal;
