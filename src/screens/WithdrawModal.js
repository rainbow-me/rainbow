import { useRoute } from '@react-navigation/native';
import React from 'react';
import ExchangeModal from './ExchangeModal';
import { ExchangeModalTypes } from '@/helpers';
import { ExchangeNavigatorFactory, useStatusBarManaging } from '@/navigation';

const WithdrawModal = props => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  android && useStatusBarManaging();
  const { params } = useRoute();

  const typeSpecificParams = {
    cTokenBalance: params?.cTokenBalance,
    supplyBalanceUnderlying: params?.supplyBalanceUnderlying,
  };

  return (
    <ExchangeModal
      testID="withdraw-modal"
      type={ExchangeModalTypes.withdrawal}
      typeSpecificParams={typeSpecificParams}
      {...props}
    />
  );
};

export default ExchangeNavigatorFactory(WithdrawModal);
