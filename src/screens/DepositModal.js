import React from 'react';
import createSwapAndDepositCompoundRap from '../raps/swapAndDepositCompound';
import ExchangeModalWithData from './ExchangeModalWithData';

const DepositModal = ({ navigation, ...props }) => {
  const defaultInputAddress = navigation.getParam('defaultInputAddress', 'eth');
  return (
    <ExchangeModalWithData
      createRap={createSwapAndDepositCompoundRap}
      defaultInputAddress={defaultInputAddress}
      inputHeaderTitle="Deposit"
      isDeposit
      showOutputField={false}
      {...props}
    />
  );
};

export default DepositModal;
