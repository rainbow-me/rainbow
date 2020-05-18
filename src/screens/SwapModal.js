import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createUnlockAndSwapRap, {
  estimateUnlockAndSwap,
} from '../raps/unlockAndSwap';
import ExchangeModal from './ExchangeModal';

const SwapModal = (props, ref) => (
  <ExchangeModal
    createRap={createUnlockAndSwapRap}
    estimateRap={estimateUnlockAndSwap}
    inputHeaderTitle="Swap"
    showOutputField
    ref={ref}
    type={ExchangeModalTypes.swap}
    {...props}
  />
);
export default React.forwardRef(SwapModal);
