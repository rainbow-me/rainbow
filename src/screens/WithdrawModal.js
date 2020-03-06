import React from 'react';
import createSwapAndDepositCompoundRap from '../raps/swapAndDepositCompound';
import ExchangeModalWithData from './ExchangeModalWithData';

const WithdrawModal = ({ navigation, ...props }) => {
  const defaultInputAddress = navigation.getParam('defaultInputAddress', 'eth');
  return (
    <ExchangeModalWithData
      createRap={createSwapAndDepositCompoundRap}
      defaultInputAddress={defaultInputAddress}
      inputHeaderTitle="Withdraw"
      isDeposit
      showOutputField={false}
      {...props}
    />
  );
};

export default WithdrawModal;
