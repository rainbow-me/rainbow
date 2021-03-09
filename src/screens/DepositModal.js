import { useRoute } from '@react-navigation/native';
import React from 'react';
import ExchangeModal from './ExchangeModal';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import {
  ExchangeNavigatorFactory,
  useStatusBarManaging,
} from '@rainbow-me/navigation';

const DepositModal = props => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  android && useStatusBarManaging();
  const { params } = useRoute();

  return (
    <ExchangeModal
      defaultInputAsset={params?.defaultInputAsset}
      type={ExchangeModalTypes.deposit}
      {...props}
    />
  );
};

export default ExchangeNavigatorFactory(DepositModal);
