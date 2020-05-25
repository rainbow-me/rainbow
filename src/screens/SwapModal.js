import React, { useMemo } from 'react';
import { useNavigation } from 'react-navigation-hooks';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createUnlockAndSwapRap, {
  estimateUnlockAndSwap,
} from '../raps/unlockAndSwap';
import ExchangeModal from './ExchangeModal';

const SwapModal = (props, ref) => {
  const { dangerouslyGetParent } = useNavigation();

  const { inputAsset, outputAsset } = useMemo(
    () => dangerouslyGetParent()?.state?.params || {},
    [dangerouslyGetParent]
  );

  return (
    <ExchangeModal
      createRap={createUnlockAndSwapRap}
      defaultInputAsset={inputAsset}
      defaultOutputAsset={outputAsset}
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
