import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import useStatusBarManaging from '../navigation/useStatusBarManaging';
import createWithdrawFromCompoundRap, {
  estimateWithdrawFromCompound,
} from '../raps/withdrawFromCompound';
import ExchangeModal from './ExchangeModal';

const WithdrawModal = ({ route, navigation, ...props }) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  android && useStatusBarManaging();
  const cTokenBalance = route.params?.cTokenBalance;
  const defaultInputAsset = route.params?.defaultInputAsset;
  const underlyingPrice = route.params?.underlyingPrice;
  const supplyBalanceUnderlying = route.params?.supplyBalanceUnderlying;

  return (
    <ExchangeModal
      cTokenBalance={cTokenBalance}
      createRap={createWithdrawFromCompoundRap}
      defaultInputAsset={defaultInputAsset}
      estimateRap={estimateWithdrawFromCompound}
      inputHeaderTitle={`Withdraw ${defaultInputAsset.symbol}`}
      navigation={navigation}
      showOutputField={false}
      supplyBalanceUnderlying={supplyBalanceUnderlying}
      type={ExchangeModalTypes.withdrawal}
      underlyingPrice={underlyingPrice}
      {...props}
    />
  );
};

export default WithdrawModal;
