import { useRoute } from '@react-navigation/native';
import React from 'react';
import ExchangeModal from './ExchangeModal';
import ExchangeModalTypes from '@rainbow-me/helpers/exchangeModalTypes';
import {
  ExchangeNavigatorFactory,
  useStatusBarManaging,
} from '@rainbow-me/navigation';
import createSwapAndDepositCompoundRap, {
  estimateSwapAndDepositCompound,
} from '@rainbow-me/raps/swapAndDepositCompound';

const DepositModal = props => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  android && useStatusBarManaging();
  const { params } = useRoute();

  return (
    <ExchangeModal
      createRap={createSwapAndDepositCompoundRap}
      defaultInputAsset={params?.defaultInputAsset}
      estimateRap={estimateSwapAndDepositCompound}
      inputHeaderTitle="Deposit"
      showOutputField={false}
      type={ExchangeModalTypes.deposit}
      underlyingPrice={params?.underlyingPrice}
      {...props}
    />
  );
};

export default ExchangeNavigatorFactory(DepositModal);
