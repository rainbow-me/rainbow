import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createWithdrawFromCompoundRap from '../raps/withdrawFromCompound';
import ExchangeModalWithData from './ExchangeModalWithData';

const WithdrawModal = ({ navigation, ...props }) => {
  const cTokenBalance = navigation.getParam('cTokenBalance');
  const defaultInputAsset = navigation.getParam('defaultInputAsset');
  const underlyingPrice = navigation.getParam('underlyingPrice');
  const supplyBalanceUnderlying = navigation.getParam(
    'supplyBalanceUnderlying'
  );

  return (
    <ExchangeModalWithData
      createRap={createWithdrawFromCompoundRap}
      cTokenBalance={cTokenBalance}
      defaultInputAsset={defaultInputAsset}
      inputHeaderTitle={`Withdraw ${defaultInputAsset.name}`}
      showOutputField={false}
      type={ExchangeModalTypes.withdrawal}
      underlyingPrice={underlyingPrice}
      supplyBalanceUnderlying={supplyBalanceUnderlying}
      {...props}
    />
  );
};

export default WithdrawModal;
