import { useRoute } from '@react-navigation/native';
import React, { useEffect } from 'react';
import ExchangeModal from './ExchangeModal';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import { useNavigation } from '@rainbow-me/navigation';

const SwapModal = (props, ref) => {
  const { params = {} } = useRoute();
  const {
    ignoreInitialTypeCheck,
    inputAsset,
    outputAsset,
    fromDiscover,
  } = params;
  const { setParams } = useNavigation();
  useEffect(() => {
    setParams({ focused: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ExchangeModal
      defaultInputAsset={inputAsset}
      defaultOutputAsset={outputAsset}
      fromDiscover={fromDiscover}
      ignoreInitialTypeCheck={ignoreInitialTypeCheck}
      ref={ref}
      testID="exchange-modal"
      type={ExchangeModalTypes.swap}
      {...props}
    />
  );
};

export default React.forwardRef(SwapModal);
