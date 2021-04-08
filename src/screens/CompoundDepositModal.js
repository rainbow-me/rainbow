import { useRoute } from '@react-navigation/native';
import React from 'react';
import ExchangeModal from './ExchangeModal';
import { ExchangeModalTypes } from '@rainbow-me/entities';
import {
  ExchangeNavigatorFactory,
  useStatusBarManaging,
} from '@rainbow-me/navigation';

const CompoundDepositModal = props => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  android && useStatusBarManaging();
  const { params } = useRoute();

  const type = ExchangeModalTypes.depositCompound;

  const typeSpecificParams = {
    [type]: {
      depositCurrency: params?.underlying,
    },
  };

  return (
    <ExchangeModal
      defaultInputAsset={params?.underlying}
      type={type}
      typeSpecificParams={typeSpecificParams}
      {...props}
    />
  );
};

export default ExchangeNavigatorFactory(CompoundDepositModal);
