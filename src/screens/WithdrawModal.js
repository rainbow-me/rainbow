import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createWithdrawFromCompoundRap, {
  estimateWithdrawFromCompound,
} from '../raps/withdrawFromCompound';
import ExchangeModal from './ExchangeModal';

const WithdrawModal = ({ navigation, ...props }) => {
  const cTokenBalance = navigation.getParam('cTokenBalance');
  const defaultInputAsset = navigation.getParam('defaultInputAsset');
  const underlyingPrice = navigation.getParam('underlyingPrice');
  const supplyBalanceUnderlying = navigation.getParam(
    'supplyBalanceUnderlying'
  );

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
