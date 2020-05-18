import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createUnlockAndSwapRap, {
  estimateUnlockAndSwap,
} from '../raps/unlockAndSwap';
import ExchangeModal from './ExchangeModal';

const SwapModal = ({ ...props }) => (
  <ExchangeModal
    createRap={createUnlockAndSwapRap}
    estimateRap={estimateUnlockAndSwap}
    inputHeaderTitle="Swap"
    showOutputField
    type={ExchangeModalTypes.swap}
    {...props}
  />
);

export default SwapModal;
