import { useRoute } from '@react-navigation/native';
import React from 'react';
import ExchangeModal from './ExchangeModal';
import ExchangeModalTypes from '@rainbow-me/helpers/exchangeModalTypes';
import { useStatusBarManaging } from '@rainbow-me/navigation';
import createWithdrawFromCompoundRap, {
  estimateWithdrawFromCompound,
} from '@rainbow-me/raps/withdrawFromCompound';

export default function WithdrawModal(props) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  android && useStatusBarManaging();
  const { params } = useRoute();

  return (
    <ExchangeModal
      cTokenBalance={params?.cTokenBalance}
      createRap={createWithdrawFromCompoundRap}
      defaultInputAsset={params?.defaultInputAsset}
      estimateRap={estimateWithdrawFromCompound}
      inputHeaderTitle={`Withdraw ${params?.defaultInputAsset?.symbol}`}
      showOutputField={false}
      supplyBalanceUnderlying={params?.supplyBalanceUnderlying}
      type={ExchangeModalTypes.withdrawal}
      underlyingPrice={params?.underlyingPrice}
      {...props}
    />
  );
}
