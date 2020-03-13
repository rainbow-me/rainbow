import React from 'react';
import ExchangeModalTypes from '../helpers/exchangeModalTypes';
import createSwapAndDepositCompoundRap from '../raps/swapAndDepositCompound';
import ExchangeModalWithData from './ExchangeModalWithData';

const WithdrawModal = ({ navigation, ...props }) => {
  const defaultInputAddress = navigation.getParam('defaultInputAddress', 'eth');
  return (
    <ExchangeModalWithData
      createRap={createSwapAndDepositCompoundRap}
      defaultInputAddress={defaultInputAddress}
      inputHeaderTitle="Withdraw"
      showOutputField={false}
      type={ExchangeModalTypes.withdrawal}
      {...props}
    />
  );
};

export default WithdrawModal;
