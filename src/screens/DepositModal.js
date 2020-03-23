import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createSwapAndDepositCompoundRap from '../raps/swapAndDepositCompound';
import ExchangeModalWithData from './ExchangeModalWithData';

const DepositModal = ({ navigation, ...props }) => {
  const defaultInputAsset = navigation.getParam('defaultInputAsset');
  return (
    <ExchangeModalWithData
      createRap={createSwapAndDepositCompoundRap}
      defaultInputAsset={defaultInputAsset}
      inputHeaderTitle="Deposit"
      showOutputField={false}
      type={ExchangeModalTypes.deposit}
      {...props}
    />
  );
};

export default DepositModal;
