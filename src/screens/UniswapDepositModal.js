import { useRoute } from '@react-navigation/native';
import React from 'react';
import ExchangeModal from './ExchangeModal';
import { ExchangeModalTypes } from '@rainbow-me/entities';
import { ExchangeNavigatorFactory } from '@rainbow-me/navigation/ExchangeModalNavigator';
import useStatusBarManaging from '@rainbow-me/navigation/useStatusBarManaging';

const UniswapDepositModal = props => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  android && useStatusBarManaging();
  const { params } = useRoute();
  const type = ExchangeModalTypes.depositUniswap;

  const typeSpecificParams = {
    [type]: {
      uniswapPair: params?.uniswapPair,
    },
  };

  return (
    <ExchangeModal
      type={type}
      typeSpecificParams={typeSpecificParams}
      {...props}
    />
  );
};

export default ExchangeNavigatorFactory(UniswapDepositModal);
