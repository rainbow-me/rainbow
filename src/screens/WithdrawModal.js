import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createSwapAndDepositCompoundRap from '../raps/swapAndDepositCompound';
import ExchangeModalWithData from './ExchangeModalWithData';

const WithdrawModal = ({ navigation, ...props }) => {
  const defaultInputAsset = navigation.getParam('defaultInputAsset');
  return (
    <ExchangeModalWithData
      createRap={createSwapAndDepositCompoundRap}
      defaultInputAsset={defaultInputAsset}
      inputHeaderTitle={`Withdraw ${defaultInputAsset.symbol}`}
      showOutputField={false}
      type={ExchangeModalTypes.withdrawal}
      {...props}
    />
  );
};

export default WithdrawModal;
