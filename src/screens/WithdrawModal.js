import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createSwapAndDepositCompoundRap from '../raps/swapAndDepositCompound';
import ExchangeModalWithData from './ExchangeModalWithData';

const WithdrawModal = ({ navigation, ...props }) => {
  const defaultInputAsset = navigation.getParam('defaultInputAsset');
  const underlyingPrice = navigation.getParam('underlyingPrice');

  return (
    <ExchangeModalWithData
      createRap={createSwapAndDepositCompoundRap}
      defaultInputAsset={defaultInputAsset}
      inputHeaderTitle={`Withdraw ${defaultInputAsset.name}`}
      showOutputField={false}
      type={ExchangeModalTypes.withdrawal}
      underlyingPrice={underlyingPrice}
      {...props}
    />
  );
};

export default WithdrawModal;
