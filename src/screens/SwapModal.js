import { useRoute } from '@react-navigation/native';
import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createUnlockAndSwapRap, {
  estimateUnlockAndSwap,
} from '../raps/unlockAndSwap';
import ExchangeModal from './ExchangeModal';

const SwapModal = (props, ref) => {
  const { params = {} } = useRoute();
  const { inputAsset, outputAsset } = params;

  return (
    <ExchangeModal
      createRap={createUnlockAndSwapRap}
      defaultInputAsset={inputAsset}
      defaultOutputAsset={outputAsset}
      estimateRap={estimateUnlockAndSwap}
      inputHeaderTitle="Swap"
      ref={ref}
      showOutputField
      testID="exchange-modal"
      type={ExchangeModalTypes.swap}
      {...props}
    />
  );
};

export default React.forwardRef(SwapModal);
