import { useRoute } from '@react-navigation/native';
import React from 'react';
import ExchangeModal from './ExchangeModal';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import {
  ExchangeNavigatorFactory,
  useStatusBarManaging,
} from '@rainbow-me/navigation';
import {
  createSwapAndDepositCompoundRap,
  estimateSwapAndDepositCompound,
} from '@rainbow-me/raps';

const DepositModal = props => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  android && useStatusBarManaging();
  const { params } = useRoute();

  return (
    <ExchangeModal
      createRap={createSwapAndDepositCompoundRap}
      defaultInputAsset={params?.defaultInputAsset}
      estimateRap={estimateSwapAndDepositCompound}
      showOutputField={false}
      title="Deposit"
      type={ExchangeModalTypes.deposit}
      {...props}
    />
  );
};

export default ExchangeNavigatorFactory(DepositModal);
