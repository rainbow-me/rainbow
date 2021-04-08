import { useRoute } from '@react-navigation/native';
import React from 'react';
import ExchangeModal from './ExchangeModal';
import { ExchangeModalTypes } from '@rainbow-me/entities';
import { useStatusBarManaging } from '@rainbow-me/navigation';

export default function CompoundWithdrawModal(props) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  android && useStatusBarManaging();
  const { params } = useRoute();

  const type = ExchangeModalTypes.withdrawCompound;

  const typeSpecificParams = {
    [type]: {
      cTokenBalance: params?.cTokenBalance,
      supplyBalanceUnderlying: params?.supplyBalanceUnderlying,
      underlying: params?.underlying,
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
}
