import React from 'react';
import createSwapAndDepositCompoundRap from '../raps/swapAndDepositCompound';
import { DAI_ADDRESS } from '../references';
import ExchangeModalWithData from './ExchangeModalWithData';

const DepositModal = ({ ...props }) => (
  <ExchangeModalWithData
    createRap={createSwapAndDepositCompoundRap}
    defaultInputAddress={DAI_ADDRESS}
    inputHeaderTitle="Deposit"
    isDeposit
    showOutputField={false}
    {...props}
  />
);

export default DepositModal;
