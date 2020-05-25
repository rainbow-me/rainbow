import React from 'react';
import { useNavigationParam } from 'react-navigation-hooks';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createUnlockAndSwapRap, {
  estimateUnlockAndSwap,
} from '../raps/unlockAndSwap';
import ExchangeModal from './ExchangeModal';

const SwapModal = (props, ref) => {
  const defaultInputAsset = useNavigationParam('inputAsset');
  const defaultOutputAsset = useNavigationParam('outputAsset');

  return (
    <ExchangeModal
      createRap={createUnlockAndSwapRap}
      defaultInputAsset={defaultInputAsset}
      defaultOutputAsset={defaultOutputAsset}
      estimateRap={estimateUnlockAndSwap}
      inputHeaderTitle="Swap"
      ref={ref}
      showOutputField
      type={ExchangeModalTypes.swap}
      {...props}
    />
  );
};

export default React.forwardRef(SwapModal);
