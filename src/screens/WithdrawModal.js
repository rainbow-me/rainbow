import { useRoute } from '@react-navigation/native';
import React from 'react';
import ExchangeModal from './ExchangeModal';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import { useStatusBarManaging } from '@rainbow-me/navigation';

export default function WithdrawModal(props) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  android && useStatusBarManaging();
  const { params } = useRoute();

  const typeSpecificParams = {
    cTokenBalance: params?.cTokenBalance,
    supplyBalanceUnderlying: params?.supplyBalanceUnderlying,
  };

  return (
    <ExchangeModal
      defaultInputAsset={params?.defaultInputAsset}
      type={ExchangeModalTypes.withdrawal}
      typeSpecificParams={typeSpecificParams}
      {...props}
    />
  );
}
