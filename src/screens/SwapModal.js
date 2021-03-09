import { useRoute } from '@react-navigation/native';
import React from 'react';
import ExchangeModal from './ExchangeModal';
import { ExchangeModalTypes } from '@rainbow-me/helpers';

const SwapModal = (props, ref) => {
  const { params = {} } = useRoute();
  const { inputAsset, outputAsset } = params;

  return (
    <ExchangeModal
      defaultInputAsset={inputAsset}
      defaultOutputAsset={outputAsset}
      ref={ref}
      testID="exchange-modal"
      type={ExchangeModalTypes.swap}
      {...props}
    />
  );
};

export default React.forwardRef(SwapModal);
