import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createWithdrawFromCompoundRap, {
  estimateWithdrawFromCompound,
} from '../raps/withdrawFromCompound';
import ExchangeModal from './ExchangeModal';

const WithdrawModal = ({ route, navigation, ...props }) => {
  const cTokenBalance = route.params?.cTokenBalance;
  const defaultInputAsset = route.params?.defaultInputAsset;
  const underlyingPrice = route.params?.underlyingPrice;
  const supplyBalanceUnderlying = route.params?.supplyBalanceUnderlying;

  return (
    <ExchangeModal
      createRap={createWithdrawFromCompoundRap}
      cTokenBalance={cTokenBalance}
      defaultInputAsset={defaultInputAsset}
      estimateRap={estimateWithdrawFromCompound}
      inputHeaderTitle={`Withdraw ${defaultInputAsset.symbol}`}
      navigation={navigation}
      showOutputField={false}
      type={ExchangeModalTypes.withdrawal}
      underlyingPrice={underlyingPrice}
      supplyBalanceUnderlying={supplyBalanceUnderlying}
      {...props}
    />
  );
};

export default WithdrawModal;
